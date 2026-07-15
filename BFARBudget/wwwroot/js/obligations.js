/* =========================================
   obligations.js — BFAR E-Budget
   Features:
   - Auto-generated ORS number (YY-MM-XXXX)
   - Edit ORS toggle (lock/unlock)
   - Fund category dropdown + auto-fill detail preview
   - Success/error toast notifications
   - Cascade dropdowns via /api/dropdown/*
   - Save, load, delete obligations
   ========================================= */

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  const dateEl = document.getElementById('ors-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

  loadStatic('ors-rc',       '/api/dropdown/responsibility-centers', '— Select RC —');
  loadStatic('ors-program',  '/api/dropdown/programs',               '— Select Program —');
  loadStatic('ors-expclass', '/api/dropdown/expense-classes',        '— Select Expense Class —');
  loadStatic('ors-fund-cat', '/api/dropdown/fund-categories',        '— Select Fund Category —');

  disableDropdown('ors-signatory',  '— Select RC first —');
  disableDropdown('ors-projcat',    '— Select Program first —');
  disableDropdown('ors-projsubcat', '— Select Category first —');
  disableDropdown('ors-activity',   '— Select Sub-Category first —');
  disableDropdown('ors-exptype',    '— Select Expense Class first —');
  disableDropdown('ors-acct',       '— Select Expense Type first —');
  disableDropdown('ors-subacct',    '— Select Account Code first —');

  loadObligationsTable();
});

/* ════════════════════════════════════════════
   TOGGLE FORM — auto-fetch ORS on open
   ════════════════════════════════════════════ */
function toggleEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  const opening = el.classList.contains('hidden');
  el.classList.toggle('hidden');
  if (opening) fetchNextOrsNumber();
}

/* ════════════════════════════════════════════
   ORS NUMBER — auto-fill + edit toggle
   ════════════════════════════════════════════ */
function fetchNextOrsNumber() {
  const input = document.getElementById('ors-no');
  if (!input) return;

  // If user has manually unlocked the field, don't overwrite their input
  if (!input.readOnly) return;

  input.value = 'Generating…';
  input.style.color = 'var(--text-muted)';

  fetch('/api/obligations/next-ors-number')
    .then(r => r.json())
    .then(data => {
      input.value       = data.orsNo;
      input.style.color = 'var(--accent-dark)';
    })
    .catch(() => {
      input.value       = '';
      input.style.color = 'var(--text-primary)';
      showToast('Could not generate ORS number. You can type it manually.', 'warn');
    });
}

function toggleOrsEdit() {
  const input  = document.getElementById('ors-no');
  const btn    = document.getElementById('ors-no-edit-btn');
  const badge  = document.getElementById('ors-no-badge');
  if (!input || !btn) return;

  const isLocked = input.readOnly;

  if (isLocked) {
    // Unlock for manual editing
    input.readOnly        = false;
    input.style.background = '#ffffff';
    input.style.cursor     = 'text';
    input.style.color      = 'var(--text-primary)';
    input.style.fontWeight = '500';
    input.focus();
    btn.innerHTML  = '🔒 Lock';
    btn.style.color = 'var(--danger)';
    btn.style.borderColor = '#fca5a5';
    if (badge) { badge.textContent = 'Manual'; badge.style.background = '#fef3c7'; badge.style.color = '#92400e'; }
  } else {
    // Re-lock and re-fetch auto number
    input.readOnly        = true;
    input.style.background = '#f0f8fa';
    input.style.cursor     = 'not-allowed';
    input.style.color      = 'var(--accent-dark)';
    input.style.fontWeight = '600';
    btn.innerHTML  = '✏️ Edit';
    btn.style.color = 'var(--text-secondary)';
    btn.style.borderColor = 'var(--border-strong)';
    if (badge) { badge.textContent = 'Auto'; badge.style.background = 'var(--accent-light)'; badge.style.color = 'var(--accent-dark)'; }
    fetchNextOrsNumber();
  }
}

/* ════════════════════════════════════════════
   FUND CATEGORY — load detail preview
   ════════════════════════════════════════════ */
function loadFundDetail(fundId) {
  const preview = document.getElementById('fund-detail-preview');
  if (!preview) return;

  if (!fundId) {
    preview.classList.add('hidden');
    return;
  }

  fetch(`/api/dropdown/fund-detail/${encodeURIComponent(fundId)}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('fd-cluster').textContent   = data.fundCluster       || '—';
      document.getElementById('fd-financing').textContent = data.financingSource   || '—';
      document.getElementById('fd-auth').textContent      = data.authorizationCode || '—';
      document.getElementById('fd-full').textContent      = data.fullFundingSource || '—';
      preview.classList.remove('hidden');
    })
    .catch(() => {
      preview.classList.add('hidden');
      showToast('Could not load fund details.', 'error');
    });
}

/* ════════════════════════════════════════════
   STATIC DROPDOWN LOADER
   ════════════════════════════════════════════ */
function loadStatic(selectId, url, placeholder) {
  const sel = document.getElementById(selectId);
  if (!sel) return;
  sel.innerHTML = '<option value="">Loading…</option>';
  fetch(url)
    .then(r => r.json())
    .then(items => {
      sel.innerHTML = `<option value="">${placeholder}</option>`;
      items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.value; opt.textContent = item.text;
        sel.appendChild(opt);
      });
      sel.disabled = false;
    })
    .catch(() => { sel.innerHTML = `<option value="">Error loading</option>`; });
}

/* ════════════════════════════════════════════
   CASCADE DROPDOWN
   ════════════════════════════════════════════ */
function cascadeLoad(parentSelectId, apiUrl, childSelectId, placeholder) {
  const parent = document.getElementById(parentSelectId);
  const child  = document.getElementById(childSelectId);
  if (!parent || !child) return;

  const parentId = parent.value;
  resetDownstream(childSelectId);

  if (!parentId) { disableDropdown(childSelectId, '— Select parent first —'); return; }

  child.innerHTML = '<option value="">Loading…</option>';
  child.disabled  = true;

  fetch(`${apiUrl}?parentId=${encodeURIComponent(parentId)}`)
    .then(r => r.json())
    .then(items => {
      child.innerHTML = `<option value="">${placeholder}</option>`;
      items.forEach(item => {
        const opt = document.createElement('option');
        opt.value = item.value; opt.textContent = item.text;
        child.appendChild(opt);
      });
      child.disabled = items.length === 0;
    })
    .catch(() => { child.innerHTML = '<option value="">Error loading</option>'; });
}

function fillDropdown(id, items, placeholder) {
  const sel = document.getElementById(id);
  if (!sel) return;
  sel.innerHTML = `<option value="">${placeholder}</option>`;
  items.forEach(item => {
    const opt = document.createElement('option');
    opt.value = item.value; opt.textContent = item.text;
    sel.appendChild(opt);
  });
  sel.disabled = items.length === 0;
}

/* ════════════════════════════════════════════
   SMART PROGRAM CASCADE
   Some programs (e.g. GAS, STO) have NO project categories at all —
   their sub-categories attach directly to the program instead. When
   that's the case, skip straight to loading Sub-Categories by program
   instead of leaving the chain stuck on an empty, disabled Category
   dropdown.
   ════════════════════════════════════════════ */
function onProgramChange() {
  const programId = document.getElementById('ors-program')?.value;

  resetDownstream('ors-program'); // disables projcat, projsubcat, activity

  if (!programId) { disableDropdown('ors-projcat', '— Select Program first —'); return; }

  const catSel = document.getElementById('ors-projcat');
  catSel.innerHTML = '<option value="">Loading…</option>';
  catSel.disabled  = true;

  fetch(`/api/dropdown/project-categories?parentId=${encodeURIComponent(programId)}`)
    .then(r => r.json())
    .then(items => {
      if (items.length > 0) {
        // Program HAS categories → show them normally; sub-category and
        // activity stay disabled until a category is picked.
        fillDropdown('ors-projcat', items, '— Select Category —');
      } else {
        // Program has NO categories → skip directly to sub-categories.
        disableDropdown('ors-projcat', '— No categories for this program —');
        loadSubCatByProgram(programId);
      }
    })
    .catch(() => disableDropdown('ors-projcat', '— Error loading categories —'));
}

function onProjCatChange() {
  const catId     = document.getElementById('ors-projcat')?.value;
  const programId = document.getElementById('ors-program')?.value;

  resetDownstream('ors-projcat'); // disables projsubcat, activity

  if (!catId) { disableDropdown('ors-projsubcat', '— Select Category first —'); return; }

  fetch(`/api/dropdown/project-sub-categories?parentId=${encodeURIComponent(catId)}`)
    .then(r => r.json())
    .then(items => {
      if (items.length > 0) {
        fillDropdown('ors-projsubcat', items, '— Select Sub-Category —');
      } else if (programId) {
        loadSubCatByProgram(programId);
      } else {
        disableDropdown('ors-projsubcat', '— No sub-categories found —');
      }
    })
    .catch(() => disableDropdown('ors-projsubcat', '— Error loading —'));
}

function loadSubCatByProgram(programId) {
  // IMPORTANT: this must hit an endpoint that filters by program_id,
  // NOT /api/dropdown/project-sub-categories (that one filters by
  // project_category_id — passing a program id into it can coincidentally
  // match an unrelated category and silently load the wrong sub-categories).
  fetch(`/api/dropdown/project-sub-categories-by-program?parentId=${encodeURIComponent(programId)}`)
    .then(r => r.json())
    .then(items => {
      if (items.length > 0) {
        fillDropdown('ors-projsubcat', items, '— Select Sub-Category —');
      } else {
        disableDropdown('ors-projsubcat', '— No sub-categories found —');
      }
    })
    .catch(() => disableDropdown('ors-projsubcat', '— Error loading —'));
}

const downstreamMap = {
  'ors-rc':        ['ors-signatory'],
  'ors-program':   ['ors-projcat', 'ors-projsubcat', 'ors-activity'],
  'ors-projcat':   ['ors-projsubcat', 'ors-activity'],
  'ors-projsubcat':['ors-activity'],
  'ors-expclass':  ['ors-exptype', 'ors-acct', 'ors-subacct'],
  'ors-exptype':   ['ors-acct', 'ors-subacct'],
  'ors-acct':      ['ors-subacct']
};

function resetDownstream(changedId) {
  (downstreamMap[changedId] || []).forEach(id => disableDropdown(id, '—'));
}

function disableDropdown(id, placeholder) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  el.disabled  = true;
}

/* ════════════════════════════════════════════
   CHAR COUNTER
   ════════════════════════════════════════════ */
function updateCharCount() {
  const val  = document.getElementById('ors-particulars').value.length;
  const hint = document.getElementById('char-counter');
  if (!hint) return;
  hint.textContent = `${val} character${val !== 1 ? 's' : ''}`;
  hint.className   = val > 0 ? 'char-counter char-ok' : 'char-counter';
}

/* ════════════════════════════════════════════
   SAVE OBLIGATION
   ════════════════════════════════════════════ */
function saveORS() {
  const get = id => document.getElementById(id);
  const creditorEl = document.querySelector('input[name="creditor"]:checked');

  const fundId = parseInt(get('ors-fund-cat')?.value) || null;

  const model = {
    orsNo:            get('ors-no')?.value.trim(),
    orsDate:          get('ors-date')?.value,
    payee:            get('ors-payee')?.value.trim(),
    creditorType:     creditorEl?.value || 'Internal',
    quarter:          get('ors-quarter')?.value,
    rcId:             parseInt(get('ors-rc')?.value)        || 0,
    signatoryId:      parseInt(get('ors-signatory')?.value) || 0,
    particulars:      get('ors-particulars')?.value.trim(),
    activityLevelId:  parseInt(get('ors-activity')?.value)  || 0,
    accountCodeId:    parseInt(get('ors-acct')?.value)      || 0,
    subAccountCodeId: parseInt(get('ors-subacct')?.value)   || null,
    fundId:           fundId,
    amount:           parseFloat(get('ors-amount')?.value)  || 0
  };

  // Validation
  if (!model.orsNo)           return showToast('ORS number is required.', 'error');
  if (!model.payee)           return showToast('Payee is required.', 'error');
  if (!model.quarter)         return showToast('Quarter is required.', 'error');
  if (!model.rcId)            return showToast('Responsibility Center is required.', 'error');
  if (!model.signatoryId)     return showToast('Signatory is required.', 'error');
  if (!model.particulars)     return showToast('Particulars is required.', 'error');
  if (!model.activityLevelId) return showToast('Activity Level is required.', 'error');
  if (!model.accountCodeId)   return showToast('Account Code is required.', 'error');
  if (!model.fundId)          return showToast('Fund Category is required.', 'error');
  if (model.amount <= 0)      return showToast('Please enter a valid amount.', 'error');

  const btn = document.getElementById('btn-obligate');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  fetch('/api/obligations', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(model)
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed.');

    // ── Success ───────────────────────────────────────────────────────────
    showSuccessPopup(model.orsNo);

    clearORS();

    // Re-lock ORS field and get next number
    const input = document.getElementById('ors-no');
    if (input && !input.readOnly) toggleOrsEdit(); // re-lock if was manual
    fetchNextOrsNumber();

    loadObligationsTable();
  })
  .catch(err => showToast('Error: ' + err.message, 'error'))
  .finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = '✔ Obligate'; }
  });
}

/* ════════════════════════════════════════════
   LOAD TABLE
   ════════════════════════════════════════════ */
function loadObligationsTable() {
  fetch('/api/obligations')
    .then(r => r.json())
    .then(records => {
      const tbody   = document.getElementById('ors-tbody');
      const countEl = document.getElementById('ors-count');
      if (!tbody) return;

      tbody.innerHTML = '';

      if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="7" style="text-align:center;color:var(--text-muted);padding:2rem">No obligation records found.</td></tr>';
      } else {
        records.forEach(r => {
          tbody.insertAdjacentHTML('beforeend', `
            <tr>
              <td>${esc(r.orsNo)}</td>
              <td>${esc(r.orsDate)}</td>
              <td>${esc(r.rcName)}</td>
              <td title="${esc(r.particularsShort)}">${esc(r.particularsShort)}${r.particularsShort?.length >= 60 ? '…' : ''}</td>
              <td style="text-align:right">${parseFloat(r.amount).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
              <td style="text-align:center"><span class="badge ${statusBadge(r.status)}">${esc(r.status)}</span></td>
              <td style="text-align:center;white-space:nowrap;display:flex;gap:5px;justify-content:center;">
                <button class="btn btn-sm" style="background:#007b8a;color:#fff;border-color:#007b8a;"
                  onclick="printORS('${esc(r.orsNo)}')"
                  title="Print ORS Form">
                  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-1px"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Print
                </button>
                <button class="btn btn-sm btn-danger" onclick="deleteObligation(${r.id},this)">Delete</button>
              </td>
            </tr>`);
        });
      }

      if (countEl) {
        const t = records.length;
        countEl.textContent = `${t} record${t !== 1 ? 's' : ''}`;
      }
    })
    .catch(() => {
      const tbody = document.getElementById('ors-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="7" style="color:var(--danger);padding:1rem">Failed to load records.</td></tr>';
    });
}

/* ════════════════════════════════════════════
   DELETE
   ════════════════════════════════════════════ */
/* ════════════════════════════════════════════
   PRINT ORS FORM
   Opens ors_print.html?ors=X in a new tab. X is the ORS/BURS number,
   not a row id — a single ORS number can cover multiple obligation
   rows (consolidated obligations across RCs, or one RC obligated
   against several account codes), so the print page fetches and
   groups everything sharing that number, not just one row.
   ════════════════════════════════════════════ */
function printORS(orsNo) {
  window.open('/pages/ors_print.html?ors=' + encodeURIComponent(orsNo), '_blank');
}

function deleteObligation(id, btn) {
  if (!confirm('Remove this obligation record?')) return;
  btn.disabled = true;
  fetch(`/api/obligations/${id}`, { method: 'DELETE' })
    .then(async res => {
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Delete failed.'); }
      loadObligationsTable();
      showToast('Obligation record deleted.', 'success');
    })
    .catch(err => { showToast('Error: ' + err.message, 'error'); btn.disabled = false; });
}

/* ════════════════════════════════════════════
   CLEAR FORM
   ════════════════════════════════════════════ */
function clearORS() {
  ['ors-payee','ors-particulars','ors-amount'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['ors-quarter','ors-rc','ors-program','ors-expclass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.selectedIndex = 0;
  });

  const fundSel = document.getElementById('ors-fund-cat');
  if (fundSel) fundSel.selectedIndex = 0;
  const preview = document.getElementById('fund-detail-preview');
  if (preview) preview.classList.add('hidden');

  disableDropdown('ors-signatory',  '— Select RC first —');
  disableDropdown('ors-projcat',    '— Select Program first —');
  disableDropdown('ors-projsubcat', '— Select Category first —');
  disableDropdown('ors-activity',   '— Select Sub-Category first —');
  disableDropdown('ors-exptype',    '— Select Expense Class first —');
  disableDropdown('ors-acct',       '— Select Expense Type first —');
  disableDropdown('ors-subacct',    '— Select Account Code first —');

  const dateEl = document.getElementById('ors-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

  const internal = document.getElementById('cr-internal');
  if (internal) internal.checked = true;

  const hint = document.getElementById('char-counter');
  if (hint) { hint.textContent = '0 characters'; hint.className = 'char-counter'; }
}

/* ════════════════════════════════════════════
   TOAST NOTIFICATION
   Types: 'success' | 'error' | 'warn'
   ════════════════════════════════════════════ */
function showToast(msg, type = 'success') {
  // Remove any existing toast
  const old = document.getElementById('ors-toast');
  if (old) old.remove();

  const colors = {
    success: { bg: '#d1fae5', color: '#065f46', border: '#6ee7b7', icon: '✓' },
    error:   { bg: '#fee2e2', color: '#991b1b', border: '#fca5a5', icon: '✕' },
    warn:    { bg: '#fef3c7', color: '#92400e', border: '#fcd34d', icon: '⚠' }
  };
  const c = colors[type] || colors.success;

  const toast = document.createElement('div');
  toast.id = 'ors-toast';
  toast.style.cssText = `
    display:flex; align-items:center; gap:10px;
    background:${c.bg}; color:${c.color};
    border:1px solid ${c.border};
    border-radius:var(--radius-md);
    padding:12px 18px;
    font-size:13px; font-weight:600;
    margin-bottom:1.25rem;
    box-shadow: 0 2px 8px rgba(0,0,0,0.08);
    animation: fadeInDown 0.25s ease;
  `;
  toast.innerHTML = `<span style="font-size:16px">${c.icon}</span> ${esc(msg)}`;

  // Insert before the form or at top of page-content
  const form    = document.getElementById('ors-form');
  const content = document.querySelector('.page-content');
  const header  = document.querySelector('.page-header');
  if (form && header) {
    header.insertAdjacentElement('afterend', toast);
  } else if (content) {
    content.prepend(toast);
  }

  // Auto-dismiss after 4 seconds
  setTimeout(() => toast.remove(), 4000);
}

/* ════════════════════════════════════════════
   SUCCESS POPUP — centered modal card
   Called only on successful obligate.
   ════════════════════════════════════════════ */
function showSuccessPopup(orsNo) {
  // Remove any existing popup
  const existing = document.getElementById('success-popup-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'success-popup-overlay';
  overlay.style.cssText = `
    position: fixed;
    inset: 0;
    background: rgba(10, 61, 74, 0.45);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 9999;
    animation: fadeIn 0.2s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background: #ffffff;
      border-radius: 16px;
      padding: 2.5rem 2rem;
      max-width: 380px;
      width: 90%;
      text-align: center;
      box-shadow: 0 20px 60px rgba(10,61,74,0.25);
      animation: popUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
      position: relative;
    ">
      <!-- Checkmark circle -->
      <div style="
        width: 72px; height: 72px;
        background: linear-gradient(135deg, #10b981, #059669);
        border-radius: 50%;
        display: flex; align-items: center; justify-content: center;
        margin: 0 auto 1.25rem;
        box-shadow: 0 8px 24px rgba(16,185,129,0.35);
      ">
        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round" stroke-linejoin="round">
          <polyline points="20 6 9 17 4 12"/>
        </svg>
      </div>

      <!-- Title -->
      <div style="font-size:20px;font-weight:700;color:#0d2d35;margin-bottom:0.4rem;">
        Obligation Inserted Successfully
      </div>

      <!-- ORS number -->
      <div style="font-size:13px;color:#4a7a85;margin-bottom:0.25rem;">ORS/BURS No.</div>
      <div style="
        display:inline-block;
        font-size:18px; font-weight:700;
        color: #007b8a;
        background: #e0f7fa;
        padding: 4px 18px;
        border-radius: 999px;
        letter-spacing: 0.08em;
        margin-bottom: 1.75rem;
      ">${esc(orsNo)}</div>

      <!-- Dismiss button -->
      <div>
        <button onclick="document.getElementById('success-popup-overlay').remove()" style="
          background: #007b8a; color: #fff;
          border: none; border-radius: 10px;
          padding: 10px 32px;
          font-size: 14px; font-weight: 600;
          cursor: pointer;
          transition: background 0.15s;
          width: 100%;
        " onmouseover="this.style.background='#005f6e'"
           onmouseout="this.style.background='#007b8a'">
          ✓ Got it
        </button>
      </div>
    </div>

    <style>
      @keyframes fadeIn  { from { opacity:0 } to { opacity:1 } }
      @keyframes popUp   { from { opacity:0; transform:scale(0.85) } to { opacity:1; transform:scale(1) } }
    </style>
  `;

  // Click backdrop to dismiss
  overlay.addEventListener('click', function (e) {
    if (e.target === overlay) overlay.remove();
  });

  document.body.appendChild(overlay);

  // Auto-dismiss after 6 seconds
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 6000);
}


function statusBadge(status) {
  const map = { Posted:'badge-green', Pending:'badge-amber', Overdue:'badge-red', Cancelled:'badge-gray' };
  return map[status] || 'badge-teal';
}

function esc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
