/* =========================================
   earmarking.js — BFAR E-Budget
   Mirrors obligations.js architecture.
   PR number is manually entered (YY-MM-XXXX format).
   ========================================= */

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  const dateEl = document.getElementById('em-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

  // Load static dropdowns
  emLoadStatic('em-rc',       '/api/dropdown/responsibility-centers', '— Select RC —');
  emLoadStatic('em-program',  '/api/dropdown/programs',               '— Select Program —');
  emLoadStatic('em-expclass', '/api/dropdown/expense-classes',        '— Select Expense Class —');
  emLoadStatic('em-fund-cat', '/api/dropdown/fund-categories',        '— Select Fund Category —');

  // Disable all cascade children
  emDisable('em-signatory',  '— Select RC first —');
  emDisable('em-projcat',    '— Select Program first —');
  emDisable('em-projsubcat', '— Select Category first —');
  emDisable('em-activity',   '— Select Sub-Category first —');
  emDisable('em-exptype',    '— Select Expense Class first —');
  emDisable('em-acct',       '— Select Expense Type first —');
  emDisable('em-subacct',    '— Select Account Code first —');

  // Show PR format hint and load table + summary
  loadPrFormat();
  loadEarmarksTable();
  loadEarmarkSummary();
});

/* ════════════════════════════════════════════
   TOGGLE FORM
   ════════════════════════════════════════════ */
function toggleEl(id) {
  const el = document.getElementById(id);
  if (!el) return;
  el.classList.toggle('hidden');
}

/* ════════════════════════════════════════════
   PR NUMBER FORMAT HINT
   Shows "Format: 26-06-XXXX" in the label badge
   ════════════════════════════════════════════ */
function loadPrFormat() {
  fetch('/api/earmarks/pr-format')
    .then(r => r.json())
    .then(data => {
      const hint = document.getElementById('em-pr-hint');
      if (hint) hint.textContent = `Format: ${data.prefix}XXXX`;

      // Pre-fill the prefix so user just types the sequence
      const input = document.getElementById('em-no');
      if (input && !input.value) input.value = data.prefix;
    })
    .catch(() => {});
}

/* ════════════════════════════════════════════
   STATIC DROPDOWN LOADER
   ════════════════════════════════════════════ */
function emLoadStatic(selectId, url, placeholder) {
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
function emCascade(parentId, apiUrl, childId, placeholder) {
  const parent = document.getElementById(parentId);
  const child  = document.getElementById(childId);
  if (!parent || !child) return;

  const parentVal = parent.value;
  emResetDownstream(childId);

  if (!parentVal) { emDisable(childId, '— Select parent first —'); return; }

  child.innerHTML = '<option value="">Loading…</option>';
  child.disabled  = true;

  fetch(`${apiUrl}?parentId=${encodeURIComponent(parentVal)}`)
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

const emDownstreamMap = {
  'em-rc':        ['em-signatory'],
  'em-program':   ['em-projcat', 'em-projsubcat', 'em-activity'],
  'em-projcat':   ['em-projsubcat', 'em-activity'],
  'em-projsubcat':['em-activity'],
  'em-expclass':  ['em-exptype', 'em-acct', 'em-subacct'],
  'em-exptype':   ['em-acct', 'em-subacct'],
  'em-acct':      ['em-subacct']
};

function emResetDownstream(changedId) {
  (emDownstreamMap[changedId] || []).forEach(id => emDisable(id, '—'));
}

function emDisable(id, placeholder) {
  const el = document.getElementById(id);
  if (!el) return;
  el.innerHTML = `<option value="">${placeholder}</option>`;
  el.disabled  = true;
}

/* ════════════════════════════════════════════
   FUND DETAIL PREVIEW
   ════════════════════════════════════════════ */
function emLoadFundDetail(fundId) {
  const preview = document.getElementById('em-fund-preview');
  if (!preview) return;

  if (!fundId) { preview.classList.add('hidden'); return; }

  fetch(`/api/dropdown/fund-detail/${encodeURIComponent(fundId)}`)
    .then(r => r.json())
    .then(data => {
      document.getElementById('em-fd-cluster').textContent   = data.fundCluster       || '—';
      document.getElementById('em-fd-financing').textContent = data.financingSource   || '—';
      document.getElementById('em-fd-auth').textContent      = data.authorizationCode || '—';
      document.getElementById('em-fd-full').textContent      = data.fullFundingSource || '—';
      preview.classList.remove('hidden');
    })
    .catch(() => preview.classList.add('hidden'));
}

/* ════════════════════════════════════════════
   CHAR COUNTER
   ════════════════════════════════════════════ */
function emCharCount() {
  const val  = document.getElementById('em-purpose').value.length;
  const hint = document.getElementById('em-char-counter');
  if (!hint) return;
  hint.textContent = `${val} character${val !== 1 ? 's' : ''}`;
  hint.className   = val > 0 ? 'char-counter char-ok' : 'char-counter';
}

/* ════════════════════════════════════════════
   SAVE EARMARK
   ════════════════════════════════════════════ */
function saveEarmark() {
  const get = id => document.getElementById(id);
  const creditorEl = document.querySelector('input[name="em-creditor"]:checked');

  const model = {
    prNo:             get('em-no')?.value.trim(),
    earmarkedDate:    get('em-date')?.value,
    payee:            get('em-payee')?.value.trim(),
    creditorType:     creditorEl?.value || 'Internal',
    quarter:          get('em-quarter')?.value,
    rcId:             parseInt(get('em-rc')?.value)          || 0,
    signatoryId:      parseInt(get('em-signatory')?.value)   || 0,
    purpose:          get('em-purpose')?.value.trim(),
    activityLevelId:  parseInt(get('em-activity')?.value)    || 0,
    accountCodeId:    parseInt(get('em-acct')?.value)        || 0,
    subAccountCodeId: parseInt(get('em-subacct')?.value)     || null,
    fundId:           parseInt(get('em-fund-cat')?.value)    || null,
    amount:           parseFloat(get('em-amount')?.value)    || 0,
    remarks:          get('em-remarks')?.value.trim() || null
  };

  // Validation
  if (!model.prNo)             return emShowToast('PR No. is required.', 'error');
  if (!model.payee)            return emShowToast('Payee is required.', 'error');
  if (!model.quarter)          return emShowToast('Quarter is required.', 'error');
  if (!model.rcId)             return emShowToast('Responsibility Center is required.', 'error');
  if (!model.signatoryId)      return emShowToast('Signatory is required.', 'error');
  if (!model.purpose)          return emShowToast('Purpose / Description is required.', 'error');
  if (!model.activityLevelId)  return emShowToast('Activity Level is required.', 'error');
  if (!model.accountCodeId)    return emShowToast('Account Code is required.', 'error');
  if (!model.fundId)           return emShowToast('Fund Category is required.', 'error');
  if (model.amount <= 0)       return emShowToast('Please enter a valid amount.', 'error');

  const btn = document.getElementById('btn-earmark');
  if (btn) { btn.disabled = true; btn.textContent = 'Saving…'; }

  fetch('/api/earmarks', {
    method:  'POST',
    headers: { 'Content-Type': 'application/json' },
    body:    JSON.stringify(model)
  })
  .then(async res => {
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || 'Save failed.');
    emShowSuccessPopup(model.prNo);
    clearEarmark();
    loadEarmarksTable();
    loadEarmarkSummary();
  })
  .catch(err => emShowToast('Error: ' + err.message, 'error'))
  .finally(() => {
    if (btn) { btn.disabled = false; btn.textContent = '🔖 Save Earmark'; }
  });
}

/* ════════════════════════════════════════════
   LOAD TABLE
   ════════════════════════════════════════════ */
function loadEarmarksTable() {
  fetch('/api/earmarks')
    .then(r => r.json())
    .then(records => {
      const tbody   = document.getElementById('em-tbody');
      const countEl = document.getElementById('em-count');
      if (!tbody) return;

      tbody.innerHTML = '';

      if (records.length === 0) {
        tbody.innerHTML = '<tr><td colspan="8" style="text-align:center;color:var(--text-muted);padding:2rem">No earmark records found.</td></tr>';
      } else {
        records.forEach(r => {
          const isPending   = r.status === 'Pending';
          const isReleased  = r.status === 'Released';
          const isCancelled = r.status === 'Cancelled';

          const actionCell = isPending
            ? `<div style="display:flex;gap:6px;justify-content:center;">
                 <button class="btn btn-sm btn-accent" onclick="releaseEarmark(${r.id}, this)">Release</button>
                 <button class="btn btn-sm btn-danger" onclick="cancelEarmark(${r.id}, this)">Cancel</button>
               </div>`
            : isReleased
            ? `<span style="font-size:12px;color:var(--success);font-weight:600;">✓ Obligated</span>`
            : `<span style="font-size:12px;color:var(--text-muted);">Cancelled</span>`;

          tbody.insertAdjacentHTML('beforeend', `
            <tr>
              <td style="font-weight:600">${emEsc(r.prNo)}</td>
              <td>${emEsc(r.earmarkedDate)}</td>
              <td>${emEsc(r.rcName)}</td>
              <td title="${emEsc(r.purposeShort)}">${emEsc(r.purposeShort)}${r.purposeShort?.length >= 60 ? '…' : ''}</td>
              <td style="text-align:right">${parseFloat(r.amount).toLocaleString('en-PH',{minimumFractionDigits:2})}</td>
              <td style="text-align:center"><span class="badge ${emStatusBadge(r.status)}">${emEsc(r.status)}</span></td>
              <td style="text-align:center">${actionCell}</td>
            </tr>`);
        });
      }

      if (countEl) {
        const t = records.length;
        countEl.textContent = `${t} record${t !== 1 ? 's' : ''}`;
      }
    })
    .catch(() => {
      const tbody = document.getElementById('em-tbody');
      if (tbody) tbody.innerHTML = '<tr><td colspan="8" style="color:var(--danger);padding:1rem">Failed to load records.</td></tr>';
    });
}

/* ════════════════════════════════════════════
   LOAD SUMMARY STATS
   ════════════════════════════════════════════ */
function loadEarmarkSummary() {
  fetch('/api/earmarks/summary')
    .then(r => r.json())
    .then(s => {
      const fmt = v => '₱' + parseFloat(v).toLocaleString('en-PH', { minimumFractionDigits: 2 });
      const t = document.getElementById('em-stat-total');
      const r = document.getElementById('em-stat-released');
      const p = document.getElementById('em-stat-pending');
      if (t) t.textContent = fmt(s.total);
      if (r) r.textContent = fmt(s.released);
      if (p) p.textContent = fmt(s.pending);
    })
    .catch(() => {});
}

/* ════════════════════════════════════════════
   RELEASE EARMARK
   ════════════════════════════════════════════ */
function releaseEarmark(id, btn) {
  if (!confirm('Mark this earmark as Released (Obligated)?')) return;
  btn.disabled = true;

  fetch(`/api/earmarks/${id}/release`, { method: 'PATCH' })
    .then(async res => {
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Release failed.'); }
      emShowToast('Earmark released successfully.', 'success');
      loadEarmarksTable();
      loadEarmarkSummary();
    })
    .catch(err => { emShowToast('Error: ' + err.message, 'error'); btn.disabled = false; });
}

/* ════════════════════════════════════════════
   CANCEL EARMARK
   ════════════════════════════════════════════ */
function cancelEarmark(id, btn) {
  if (!confirm('Cancel this earmark? This cannot be undone.')) return;
  btn.disabled = true;

  fetch(`/api/earmarks/${id}/cancel`, { method: 'PATCH' })
    .then(async res => {
      if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Cancel failed.'); }
      emShowToast('Earmark cancelled.', 'warn');
      loadEarmarksTable();
      loadEarmarkSummary();
    })
    .catch(err => { emShowToast('Error: ' + err.message, 'error'); btn.disabled = false; });
}

/* ════════════════════════════════════════════
   CLEAR FORM
   ════════════════════════════════════════════ */
function clearEarmark() {
  ['em-no','em-payee','em-purpose','em-remarks','em-amount'].forEach(id => {
    const el = document.getElementById(id); if (el) el.value = '';
  });
  ['em-quarter','em-rc','em-program','em-expclass'].forEach(id => {
    const el = document.getElementById(id); if (el) el.selectedIndex = 0;
  });

  const fundSel = document.getElementById('em-fund-cat');
  if (fundSel) fundSel.selectedIndex = 0;
  const preview = document.getElementById('em-fund-preview');
  if (preview) preview.classList.add('hidden');

  emDisable('em-signatory',  '— Select RC first —');
  emDisable('em-projcat',    '— Select Program first —');
  emDisable('em-projsubcat', '— Select Category first —');
  emDisable('em-activity',   '— Select Sub-Category first —');
  emDisable('em-exptype',    '— Select Expense Class first —');
  emDisable('em-acct',       '— Select Expense Type first —');
  emDisable('em-subacct',    '— Select Account Code first —');

  const dateEl = document.getElementById('em-date');
  if (dateEl) dateEl.value = new Date().toISOString().split('T')[0];

  const internal = document.getElementById('em-cr-internal');
  if (internal) internal.checked = true;

  const hint = document.getElementById('em-char-counter');
  if (hint) { hint.textContent = '0 characters'; hint.className = 'char-counter'; }

  loadPrFormat();
}

/* ════════════════════════════════════════════
   SUCCESS POPUP
   ════════════════════════════════════════════ */
function emShowSuccessPopup(prNo) {
  const existing = document.getElementById('em-success-overlay');
  if (existing) existing.remove();

  const overlay = document.createElement('div');
  overlay.id = 'em-success-overlay';
  overlay.style.cssText = `
    position:fixed; inset:0;
    background:rgba(10,61,74,0.45);
    display:flex; align-items:center; justify-content:center;
    z-index:9999; animation:fadeIn 0.2s ease;
  `;

  overlay.innerHTML = `
    <div style="
      background:#fff; border-radius:16px; padding:2.5rem 2rem;
      max-width:380px; width:90%; text-align:center;
      box-shadow:0 20px 60px rgba(10,61,74,0.25);
      animation:popUp 0.3s cubic-bezier(0.34,1.56,0.64,1);
    ">
      <div style="
        width:72px;height:72px;
        background:linear-gradient(135deg,#f59e0b,#d97706);
        border-radius:50%;
        display:flex;align-items:center;justify-content:center;
        margin:0 auto 1.25rem;
        box-shadow:0 8px 24px rgba(245,158,11,0.35);
        font-size:32px;
      ">🔖</div>
      <div style="font-size:20px;font-weight:700;color:#0d2d35;margin-bottom:0.4rem;">
        Earmark Saved Successfully
      </div>
      <div style="font-size:13px;color:#4a7a85;margin-bottom:0.25rem;">PR No.</div>
      <div style="
        display:inline-block; font-size:18px; font-weight:700;
        color:#d97706; background:#fef3c7;
        padding:4px 18px; border-radius:999px;
        letter-spacing:0.08em; margin-bottom:1.75rem;
      ">${emEsc(prNo)}</div>
      <div>
        <button onclick="document.getElementById('em-success-overlay').remove()" style="
          background:#d97706;color:#fff;border:none;border-radius:10px;
          padding:10px 32px;font-size:14px;font-weight:600;
          cursor:pointer;width:100%;
          transition:background 0.15s;
        " onmouseover="this.style.background='#b45309'"
           onmouseout="this.style.background='#d97706'">
          ✓ Got it
        </button>
      </div>
    </div>
    <style>
      @keyframes fadeIn { from{opacity:0} to{opacity:1} }
      @keyframes popUp  { from{opacity:0;transform:scale(0.85)} to{opacity:1;transform:scale(1)} }
    </style>
  `;

  overlay.addEventListener('click', e => { if (e.target === overlay) overlay.remove(); });
  document.body.appendChild(overlay);
  setTimeout(() => { if (overlay.parentNode) overlay.remove(); }, 6000);
}

/* ════════════════════════════════════════════
   TOAST NOTIFICATION
   ════════════════════════════════════════════ */
function emShowToast(msg, type = 'success') {
  const old = document.getElementById('em-toast');
  if (old) old.remove();

  const colors = {
    success: { bg:'#d1fae5', color:'#065f46', border:'#6ee7b7', icon:'✓' },
    error:   { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5', icon:'✕' },
    warn:    { bg:'#fef3c7', color:'#92400e', border:'#fcd34d', icon:'⚠' }
  };
  const c = colors[type] || colors.success;

  const toast = document.createElement('div');
  toast.id = 'em-toast';
  toast.style.cssText = `
    display:flex; align-items:center; gap:10px;
    background:${c.bg}; color:${c.color};
    border:1px solid ${c.border};
    border-radius:var(--radius-md);
    padding:12px 18px; font-size:13px; font-weight:600;
    margin-bottom:1.25rem;
    box-shadow:0 2px 8px rgba(0,0,0,0.08);
  `;
  toast.innerHTML = `<span style="font-size:16px">${c.icon}</span> ${emEsc(msg)}`;

  const header = document.querySelector('.page-header');
  if (header) header.insertAdjacentElement('afterend', toast);
  else document.querySelector('.page-content')?.prepend(toast);

  setTimeout(() => toast.remove(), 4000);
}

/* ════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════ */
function emStatusBadge(status) {
  const map = { Pending:'badge-amber', Released:'badge-green', Cancelled:'badge-gray' };
  return map[status] || 'badge-teal';
}

function emEsc(str) {
  return String(str || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
