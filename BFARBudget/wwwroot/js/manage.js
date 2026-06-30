/* =========================================
   manage.js — Manage Data page
   With pagination for all tables.
   Page sizes:
     RC, Signatories, Expense Types,
     Account Codes, Funds, Users  → 8 per page
     Allotment RC input rows      → 10 per page
     Allotment records table      → 8 per page
   ========================================= */

/* ════════════════════════════════════════════════
   PAGINATION STATE
   Each table has its own current page tracker.
   ════════════════════════════════════════════════ */
var PAGE_SIZE    = 8;   // rows per page for all tables
var ALLOT_SIZE   = 10;  // RC rows in allotment input section

var _pages = {
  rc:       1,
  sig:      1,
  fund:     1,
  ec:       1,
  et:       1,
  ac:       1,
  sac:      1,
  prog:     1,
  pcat:     1,
  psub:     1,
  alv:      1,
  allotRc:  1,
  allotRec: 1,
  users:    1
};

// Full data cache per table
var _data = {
  rc: [], sig: [], fund: [], ec: [], et: [], ac: [], sac: [],
  prog: [], pcat: [], psub: [], alv: [],
  allotRec: [], users: []
};

/* ════════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  var fy = new Date().getFullYear().toString();
  var fyEl = document.getElementById('allot-fy');
  if (fyEl) fyEl.value = fy;
  var fyBadge = document.getElementById('allot-fy-badge');
  if (fyBadge) fyBadge.textContent = fy;

  loadRCs();
  loadSignatories();
  loadFunds();
  loadExpenseClasses();
  loadExpenseTypes();
  loadAccountCodes();
  loadSubAccountCodes();
  loadPrograms();
  loadProjectCategories();
  loadProjectSubCategories();
  loadActivityLevels();
  loadAllotments();
  loadUsers();
});

/* ════════════════════════════════════════════════
   TABS
   ════════════════════════════════════════════════ */
function switchTab(e, name) {
  document.querySelectorAll('.tab-panel').forEach(function(p) { p.classList.remove('active'); });
  document.querySelectorAll('.tab-btn').forEach(function(b) { b.classList.remove('active'); });
  document.getElementById('tab-' + name).classList.add('active');
  e.target.classList.add('active');
}

/* ════════════════════════════════════════════════
   TOAST
   ════════════════════════════════════════════════ */
function mToast(msg, type) {
  type = type || 'success';
  var old = document.getElementById('manage-toast');
  if (old) old.remove();

  var colors = {
    success: { bg:'#d1fae5', color:'#065f46', border:'#6ee7b7', icon:'✓' },
    error:   { bg:'#fee2e2', color:'#991b1b', border:'#fca5a5', icon:'✕' },
    warn:    { bg:'#fef3c7', color:'#92400e', border:'#fcd34d', icon:'⚠' }
  };
  var c = colors[type] || colors.success;

  var t = document.createElement('div');
  t.id = 'manage-toast';
  t.style.cssText = 'display:flex;align-items:center;gap:8px;background:' + c.bg +
    ';color:' + c.color + ';border:1px solid ' + c.border +
    ';border-radius:10px;padding:10px 16px;font-size:13px;font-weight:600;margin-bottom:1rem';
  t.innerHTML = '<span>' + c.icon + '</span> ' + esc(msg);

  var pc = document.querySelector('.page-content');
  var ph = document.querySelector('.page-header');
  if (ph && pc) pc.insertBefore(t, ph.nextSibling);
  else if (pc) pc.prepend(t);

  setTimeout(function() { if (t.parentNode) t.remove(); }, 4000);
}

/* ════════════════════════════════════════════════
   PAGINATION ENGINE
   ════════════════════════════════════════════════ */
/**
 * Renders a slice of data into a tbody, then builds
 * pagination controls into a container div.
 *
 * @param {string}   tbodyId    - id of the <tbody>
 * @param {string}   pgId       - id of the pagination container div
 * @param {string}   key        - key in _pages and _data
 * @param {Array}    data       - full data array
 * @param {number}   pageSize   - rows per page
 * @param {Function} rowFn      - function(item) returns HTML string
 * @param {number}   colSpan    - colspan for empty row
 * @param {Function} [afterFn]  - optional callback after render
 */
function renderPaged(tbodyId, pgId, key, data, pageSize, rowFn, colSpan, afterFn) {
  var tbody = document.getElementById(tbodyId);
  var pgDiv = document.getElementById(pgId);
  if (!tbody) return;

  var total     = data.length;
  var totalPages = Math.max(1, Math.ceil(total / pageSize));
  var page      = Math.min(_pages[key], totalPages);
  _pages[key]   = page;

  var start  = (page - 1) * pageSize;
  var slice  = data.slice(start, start + pageSize);

  tbody.innerHTML = slice.length === 0
    ? '<tr><td colspan="' + colSpan + '" style="text-align:center;color:#8aadb5;padding:1.5rem">No records found.</td></tr>'
    : slice.map(rowFn).join('');

  // Build pagination controls
  if (pgDiv) {
    if (totalPages <= 1) {
      pgDiv.innerHTML = '';
    } else {
      var showing = Math.min(start + pageSize, total);
      var html = '<div class="pg-wrap">' +
        '<span class="pg-info">Showing ' + (start + 1) + '–' + showing + ' of ' + total + '</span>' +
        '<div class="pg-btns">';

      // Prev
      html += '<button class="pg-btn" ' + (page <= 1 ? 'disabled' : '') +
        ' onclick="goPage(\'' + key + '\',' + (page - 1) + ')">&lsaquo; Prev</button>';

      // Page numbers (show at most 5 around current)
      var lo = Math.max(1, page - 2);
      var hi = Math.min(totalPages, page + 2);
      if (lo > 1) html += '<button class="pg-btn" onclick="goPage(\'' + key + '\',1)">1</button>';
      if (lo > 2) html += '<span class="pg-ellipsis">…</span>';
      for (var p = lo; p <= hi; p++) {
        html += '<button class="pg-btn' + (p === page ? ' pg-active' : '') +
          '" onclick="goPage(\'' + key + '\',' + p + ')">' + p + '</button>';
      }
      if (hi < totalPages - 1) html += '<span class="pg-ellipsis">…</span>';
      if (hi < totalPages) html += '<button class="pg-btn" onclick="goPage(\'' + key + '\',' + totalPages + ')">' + totalPages + '</button>';

      // Next
      html += '<button class="pg-btn" ' + (page >= totalPages ? 'disabled' : '') +
        ' onclick="goPage(\'' + key + '\',' + (page + 1) + ')"">Next &rsaquo;</button>';

      html += '</div></div>';
      pgDiv.innerHTML = html;
    }
  }

  if (afterFn) afterFn(slice);
}

function goPage(key, page) {
  _pages[key] = page;
  switch (key) {
    case 'rc':       renderRCTable();              break;
    case 'sig':      renderSigTable();             break;
    case 'fund':     renderFundTable();            break;
    case 'ec':       renderECTable();              break;
    case 'et':       renderETTable();              break;
    case 'ac':       renderACTable();              break;
    case 'sac':      renderSACTable();             break;
    case 'prog':     renderProgTable();            break;
    case 'pcat':     renderPCatTable();            break;
    case 'psub':     renderPSubTable();            break;
    case 'alv':      renderALVTable();             break;
    case 'allotRc':  renderAllotRCRows();          break;
    case 'allotRec': renderAllotRecTable();        break;
    case 'users':    renderUsersTable();           break;
  }
  var tbodyMap = {
    rc:'rc-tbody', sig:'sig-tbody', fund:'fund-tbody',
    ec:'ec-tbody', et:'et-tbody', ac:'ac-tbody', sac:'sac-tbody',
    prog:'prog-tbody', pcat:'pcat-tbody', psub:'psub-tbody', alv:'alv-tbody',
    allotRec:'allot-tbody', users:'user-tbody'
  };
  var tbodyId = tbodyMap[key];
  if (tbodyId) {
    var el = document.getElementById(tbodyId);
    if (el) el.closest('.card').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}

/* ════════════════════════════════════════════════
   API HELPERS
   ════════════════════════════════════════════════ */
function getValue(id) {
  var el = document.getElementById(id);
  return el ? el.value.trim() : '';
}
function setValue(id, val) {
  var el = document.getElementById(id);
  if (el) el.value = val;
}
function clearValues(ids) {
  ids.forEach(function(id) { setValue(id, ''); });
}
function setCount(id, n) {
  var el = document.getElementById(id);
  if (el) el.textContent = n + ' record' + (n !== 1 ? 's' : '');
}
function esc(s) {
  return String(s || '').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function apiGet(url, onOk, onErr) {
  fetch(url)
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (!res.ok) { if (onErr) onErr(res.data.error || 'Failed.'); else mToast(res.data.error || 'Load error', 'error'); }
      else onOk(res.data);
    })
    .catch(function(e) { if (onErr) onErr(e.message); else mToast('Network error: ' + e.message, 'error'); });
}

function apiPost(url, body, onOk) {
  fetch(url, { method:'POST', headers:{'Content-Type':'application/json'}, body:JSON.stringify(body) })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (!res.ok) mToast(res.data.error || 'Save failed.', 'error');
      else onOk(res.data);
    })
    .catch(function(e) { mToast('Network error: ' + e.message, 'error'); });
}

function apiDelete(url, onOk) {
  fetch(url, { method:'DELETE' })
    .then(function(r) { return r.json().then(function(d) { return { ok: r.ok, data: d }; }); })
    .then(function(res) {
      if (!res.ok) mToast(res.data.error || 'Delete failed.', 'error');
      else onOk(res.data);
    })
    .catch(function(e) { mToast('Network error: ' + e.message, 'error'); });
}

/* ════════════════════════════════════════════════
   RESPONSIBILITY CENTERS
   ════════════════════════════════════════════════ */
function loadRCs() {
  apiGet('/api/manage/responsibility-centers', function(data) {
    _data.rc = data;
    _pages.rc = 1;
    setCount('rc-count', data.length);
    renderRCTable();
    // Refresh RC select dropdowns
    var html = '<option value="">— Select RC —</option>' +
      data.map(function(rc) {
        return '<option value="' + rc.id + '">' + esc(rc.code) + ' – ' + esc(rc.name) + '</option>';
      }).join('');
    var sigSel = document.getElementById('sig-rc');
    if (sigSel) sigSel.innerHTML = html;
    renderAllotRCRows();
  }, function(err) {
    document.getElementById('rc-tbody').innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:1rem">Error: ' + esc(err) + '</td></tr>';
  });
}

function renderRCTable() {
  renderPaged('rc-tbody', 'rc-pg', 'rc', _data.rc, PAGE_SIZE, function(rc) {
    return '<tr>' +
      '<td>' + esc(rc.code) + '</td>' +
      '<td>' + esc(rc.name) + '</td>' +
      '<td style="text-align:center"><span class="badge badge-teal">' + (rc.signatoryCount || 0) + '</span></td>' +
      '<td style="text-align:center"><span class="badge ' + (rc.isActive ? 'badge-green' : 'badge-amber') + '">' + (rc.isActive ? 'Active' : 'Inactive') + '</span></td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteRC(' + rc.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 5);
}

function addRC() {
  var code = getValue('rc-code'), name = getValue('rc-name');
  if (!code || !name) { mToast('RC Code and Name are required.', 'error'); return; }
  apiPost('/api/manage/responsibility-centers', { code: code, name: name }, function() {
    mToast('RC "' + code + '" added.');
    clearValues(['rc-code','rc-name']);
    loadRCs();
  });
}

function deleteRC(id, btn) {
  if (!confirm('Delete this RC?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/responsibility-centers/' + id, function() {
    mToast('RC deleted.'); loadRCs(); loadSignatories();
  });
}

/* ════════════════════════════════════════════════
   SIGNATORIES
   ════════════════════════════════════════════════ */
function loadSignatories() {
  apiGet('/api/manage/signatories', function(data) {
    _data.sig = data;
    _pages.sig = 1;
    setCount('sig-count', data.length);
    renderSigTable();
  }, function(err) {
    document.getElementById('sig-tbody').innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:1rem">Error: ' + esc(err) + '</td></tr>';
  });
}

function renderSigTable() {
  renderPaged('sig-tbody', 'sig-pg', 'sig', _data.sig, PAGE_SIZE, function(s) {
    return '<tr>' +
      '<td>' + esc(s.name) + '</td>' +
      '<td>' + esc(s.position) + '</td>' +
      '<td>' + esc(s.rcName) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteSignatory(' + s.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 4);
}

function addSignatory() {
  var rcId = getValue('sig-rc'), name = getValue('sig-name'), pos = getValue('sig-position');
  if (!rcId)  { mToast('Please select a Responsibility Center.', 'error'); return; }
  if (!name)  { mToast('Full Name is required.', 'error'); return; }
  if (!pos)   { mToast('Position is required.', 'error'); return; }
  apiPost('/api/manage/signatories', { rcId: parseInt(rcId), name: name, position: pos }, function() {
    mToast('Signatory "' + name + '" added.');
    clearValues(['sig-name','sig-position']);
    loadSignatories(); loadRCs();
  });
}

function deleteSignatory(id, btn) {
  if (!confirm('Delete this signatory?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/signatories/' + id, function() {
    mToast('Signatory deleted.'); loadSignatories(); loadRCs();
  });
}

/* ════════════════════════════════════════════════
   FUND CATEGORIES
   ════════════════════════════════════════════════ */
function loadFunds() {
  apiGet('/api/manage/funds', function(data) {
    _data.fund = data;
    _pages.fund = 1;
    setCount('fund-count', data.length);
    renderFundTable();
    var sel = document.getElementById('allot-fund');
    if (sel) {
      sel.innerHTML = '<option value="">— Select Fund —</option>' +
        data.map(function(f) { return '<option value="' + f.id + '">' + esc(f.fundCategory) + '</option>'; }).join('');
    }
  }, function(err) {
    document.getElementById('fund-tbody').innerHTML =
      '<tr><td colspan="4" style="text-align:center;color:#ef4444;padding:1rem">Error: ' + esc(err) + '</td></tr>';
  });
}

function renderFundTable() {
  renderPaged('fund-tbody', 'fund-pg', 'fund', _data.fund, PAGE_SIZE, function(f) {
    return '<tr>' +
      '<td style="max-width:260px;white-space:normal;font-size:12px">' + esc(f.fundCategory) + '</td>' +
      '<td style="font-size:12px">' + esc(f.fundCluster) + '</td>' +
      '<td style="font-weight:700;color:#007b8a">' + esc(f.fullFundingSource) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteFund(' + f.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 4);
}

function addFund() {
  var cluster = getValue('fund-cluster'), fin = getValue('fund-financing'),
      auth = getValue('fund-auth'), cat = getValue('fund-category'), full = getValue('fund-full');
  if (!cluster || !fin || !auth || !cat || !full) { mToast('All 5 fund fields are required.', 'error'); return; }
  apiPost('/api/manage/funds', {
    fundCluster: cluster, financingSource: fin,
    authorizationCode: auth, fundCategory: cat, fullFundingSource: full
  }, function() {
    mToast('Fund Category added.');
    clearValues(['fund-cluster','fund-financing','fund-auth','fund-category','fund-full']);
    loadFunds();
  });
}

function deleteFund(id, btn) {
  if (!confirm('Delete this Fund Category?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/funds/' + id, function() { mToast('Fund deleted.'); loadFunds(); });
}

/* ════════════════════════════════════════════════
   EXPENSE CLASSES
   ════════════════════════════════════════════════ */
function loadExpenseClasses() {
  apiGet('/api/dropdown/expense-classes', function(data) {
    _data.ec = data;
    _pages.ec = 1;
    setCount('ec-count', data.length);
    renderECTable();
    var classHtml = '<option value="">— Select Class —</option>' +
      data.map(function(ec) { return '<option value="' + ec.value + '">' + esc(ec.text) + '</option>'; }).join('');
    var etSel = document.getElementById('et-class');
    if (etSel) etSel.innerHTML = classHtml;
    var acSel = document.getElementById('allot-class');
    if (acSel) acSel.innerHTML = classHtml;
  });
}

/* ════════════════════════════════════════════════
   ALLOTMENT CASCADE — Expense Class → Type → Account Code
   ════════════════════════════════════════════════ */
function filterAllotExpenseTypes() {
  var classId = getValue('allot-class');
  var sel     = document.getElementById('allot-exptype');
  var acSel   = document.getElementById('allot-acct');

  if (!sel) return;

  if (acSel) {
    acSel.innerHTML = '<option value="">— Select Type first —</option>';
    acSel.disabled  = true;
  }

  if (!classId) {
    sel.innerHTML = '<option value="">— Select Class first —</option>';
    sel.disabled  = true;
    return;
  }

  sel.innerHTML = '<option value="">Loading…</option>';
  sel.disabled  = true;

  fetch('/api/dropdown/expense-types?parentId=' + encodeURIComponent(classId))
    .then(function(r) { return r.json(); })
    .then(function(items) {
      sel.innerHTML = '<option value="">— Select Expense Type —</option>' +
        items.map(function(item) {
          return '<option value="' + item.value + '">' + esc(item.text) + '</option>';
        }).join('');
      sel.disabled = items.length === 0;
    })
    .catch(function() { sel.innerHTML = '<option value="">Error loading</option>'; });
}

function filterAllotAccountCodes() {
  var typeId = getValue('allot-exptype');
  var sel    = document.getElementById('allot-acct');

  if (!sel) return;

  if (!typeId) {
    sel.innerHTML = '<option value="">— Select Type first —</option>';
    sel.disabled  = true;
    return;
  }

  sel.innerHTML = '<option value="">Loading…</option>';
  sel.disabled  = true;

  fetch('/api/dropdown/account-codes?parentId=' + encodeURIComponent(typeId))
    .then(function(r) { return r.json(); })
    .then(function(items) {
      sel.innerHTML = '<option value="">— Select Account Code —</option>' +
        items.map(function(item) {
          return '<option value="' + item.value + '">' + esc(item.text) + '</option>';
        }).join('');
      sel.disabled = items.length === 0;
    })
    .catch(function() { sel.innerHTML = '<option value="">Error loading</option>'; });
}

function renderECTable() {
  renderPaged('ec-tbody', 'ec-pg', 'ec', _data.ec, PAGE_SIZE, function(ec) {
    return '<tr>' +
      '<td style="font-weight:700;color:#007b8a">' + esc(ec.value) + '</td>' +
      '<td>' + esc(ec.text) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteExpenseClass(' + ec.value + ',this)">Delete</button></td>' +
      '</tr>';
  }, 3);
}

function addExpenseClass() {
  var code = getValue('ec-code'), name = getValue('ec-name');
  if (!code || !name) { mToast('Code and Name are required.', 'error'); return; }
  apiPost('/api/manage/expense-classes', { code: code, name: name }, function() {
    mToast('Expense Class "' + code + '" added.');
    clearValues(['ec-code','ec-name']); loadExpenseClasses();
  });
}

function deleteExpenseClass(id, btn) {
  if (!confirm('Delete this Expense Class?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/expense-classes/' + id, function() {
    mToast('Expense Class deleted.'); loadExpenseClasses(); loadExpenseTypes();
  });
}

/* ════════════════════════════════════════════════
   EXPENSE TYPES
   ════════════════════════════════════════════════ */
function loadExpenseTypes() {
  apiGet('/api/manage/expense-types', function(data) {
    _data.et = data;
    _pages.et = 1;
    setCount('et-count', data.length);
    renderETTable();
    var sel = document.getElementById('ac-type');
    if (sel) {
      sel.innerHTML = '<option value="">— Select Type —</option>' +
        data.map(function(et) {
          return '<option value="' + et.id + '">' + esc(et.name) + ' (' + esc(et.className) + ')</option>';
        }).join('');
    }
  });
}

function renderETTable() {
  renderPaged('et-tbody', 'et-pg', 'et', _data.et, PAGE_SIZE, function(et) {
    return '<tr>' +
      '<td>' + esc(et.name) + '</td>' +
      '<td>' + esc(et.className) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteExpenseType(' + et.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 3);
}

function addExpenseType() {
  var classId = getValue('et-class'), name = getValue('et-name');
  if (!classId || !name) { mToast('Expense Class and Type Name are required.', 'error'); return; }
  apiPost('/api/manage/expense-types', { expenseClassId: parseInt(classId), name: name }, function() {
    mToast('Expense Type "' + name + '" added.');
    clearValues(['et-name']); loadExpenseTypes();
  });
}

function deleteExpenseType(id, btn) {
  if (!confirm('Delete this Expense Type?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/expense-types/' + id, function() {
    mToast('Expense Type deleted.'); loadExpenseTypes(); loadAccountCodes();
  });
}

/* ════════════════════════════════════════════════
   ACCOUNT CODES
   ════════════════════════════════════════════════ */
function loadAccountCodes() {
  apiGet('/api/manage/account-codes', function(data) {
    _data.ac = data;
    _pages.ac = 1;
    setCount('ac-count', data.length);
    renderACTable();
    // Also refresh the sub-account code account dropdown
    var sel = document.getElementById('sac-acct');
    if (sel) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">— Select Account Code —</option>' +
        data.map(function(ac) {
          return '<option value="' + ac.id + '">' + esc(ac.code) + ' – ' + esc(ac.description) + '</option>';
        }).join('');
      if (cur) sel.value = cur;
    }
    // Reload sub account codes too so they stay in sync
    loadSubAccountCodes();
  });
}

function renderACTable() {
  renderPaged('ac-tbody', 'ac-pg', 'ac', _data.ac, PAGE_SIZE, function(ac) {
    return '<tr>' +
      '<td style="font-weight:700;color:#007b8a">' + esc(ac.code) + '</td>' +
      '<td>' + esc(ac.description) + '</td>' +
      '<td>' + esc(ac.typeName) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteAccountCode(' + ac.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 4);
}

function addAccountCode() {
  var typeId = getValue('ac-type'), code = getValue('ac-code'), desc = getValue('ac-desc');
  if (!typeId || !code || !desc) { mToast('All account code fields are required.', 'error'); return; }
  apiPost('/api/manage/account-codes', { expenseTypeId: parseInt(typeId), code: code, description: desc }, function() {
    mToast('Account Code "' + code + '" added.');
    clearValues(['ac-code','ac-desc']); loadAccountCodes();
  });
}

function deleteAccountCode(id, btn) {
  if (!confirm('Delete this Account Code?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/account-codes/' + id, function() {
    mToast('Account Code deleted.');
    loadAccountCodes();
    loadSubAccountCodes();
  });
}

/* ════════════════════════════════════════════════
   SUB ACCOUNT CODES
   ════════════════════════════════════════════════ */
function loadSubAccountCodes() {
  apiGet('/api/manage/sub-account-codes', function(data) {
    _data.sac = data;
    _pages.sac = 1;
    setCount('sac-count', data.length);
    renderSACTable();
    // Refresh account code dropdown for sub-account
    var sel = document.getElementById('sac-acct');
    if (sel) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">— Select Account Code —</option>' +
        _data.ac.map(function(ac) {
          return '<option value="' + ac.id + '">' + esc(ac.code) + ' – ' + esc(ac.description) + '</option>';
        }).join('');
      if (cur) sel.value = cur;
    }
  });
}

function renderSACTable() {
  renderPaged('sac-tbody', 'sac-pg', 'sac', _data.sac, PAGE_SIZE, function(s) {
    return '<tr>' +
      '<td style="font-weight:700;color:#007b8a">' + esc(s.code) + '</td>' +
      '<td>' + esc(s.description) + '</td>' +
      '<td>' + esc(s.accountCode) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteSubAccountCode(' + s.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 4);
}

function addSubAccountCode() {
  var acctId = getValue('sac-acct');
  var code   = getValue('sac-code');
  var desc   = getValue('sac-desc');
  if (!acctId || !code || !desc) { mToast('All sub-account code fields are required.', 'error'); return; }
  apiPost('/api/manage/sub-account-codes', {
    accountCodeId: parseInt(acctId), code: code, description: desc
  }, function() {
    mToast('Sub-Account Code "' + code + '" added.');
    clearValues(['sac-code', 'sac-desc']);
    loadSubAccountCodes();
  });
}

function deleteSubAccountCode(id, btn) {
  if (!confirm('Delete this Sub-Account Code?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/sub-account-codes/' + id, function() {
    mToast('Sub-Account Code deleted.');
    loadSubAccountCodes();
  });
}

/* ════════════════════════════════════════════════
   PROGRAMS / PROJECTS
   ════════════════════════════════════════════════ */
function loadPrograms() {
  apiGet('/api/manage/programs', function(data) {
    _data.prog = data;
    _pages.prog = 1;
    setCount('prog-count', data.length);
    renderProgTable();

    var progHtml = '<option value="">— Select Program —</option>' +
      data.map(function(p) {
        return '<option value="' + p.id + '">' + esc(p.name) + '</option>';
      }).join('');

    // Refresh all program dropdowns
    ['pcat-prog', 'psub-prog'].forEach(function(id) {
      var sel = document.getElementById(id);
      if (sel) { var cur = sel.value; sel.innerHTML = progHtml; if (cur) sel.value = cur; }
    });
  });
}

// When Program changes in Sub-Category form, filter Category dropdown
function filterPsubCategories() {
  var progId = getValue('psub-prog');
  var catSel = document.getElementById('psub-cat');
  if (!catSel) return;

  catSel.innerHTML = '<option value="">— No Category / Direct to Program —</option>';

  if (!progId) return;

  // Filter from cached pcat data
  var filtered = _data.pcat.filter(function(c) {
    return String(c.programId) === String(progId);
  });

  filtered.forEach(function(c) {
    var opt = document.createElement('option');
    opt.value = c.id;
    opt.textContent = c.name;
    catSel.appendChild(opt);
  });
}

function renderProgTable() {
  renderPaged('prog-tbody', 'prog-pg', 'prog', _data.prog, PAGE_SIZE, function(p) {
    return '<tr>' +
      '<td>' + esc(p.name) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteProgram(' + p.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 2);
}

function addProgram() {
  var name = getValue('prog-name');
  if (!name) { mToast('Program name is required.', 'error'); return; }
  apiPost('/api/manage/programs', { name: name }, function() {
    mToast('Program "' + name + '" added.');
    clearValues(['prog-name']);
    loadPrograms();
  });
}

function deleteProgram(id, btn) {
  if (!confirm('Delete this Program? Related categories will also be affected.')) return;
  btn.disabled = true;
  apiDelete('/api/manage/programs/' + id, function() {
    mToast('Program deleted.');
    loadPrograms(); loadProjectCategories();
  });
}

/* ════════════════════════════════════════════════
   PROJECT CATEGORIES
   ════════════════════════════════════════════════ */
function loadProjectCategories() {
  apiGet('/api/manage/project-categories', function(data) {
    _data.pcat = data; // data includes programId for filtering
    _pages.pcat = 1;
    setCount('pcat-count', data.length);
    renderPCatTable();
    // Re-run filter if a program is already selected in psub form
    filterPsubCategories();
  });
}

function renderPCatTable() {
  renderPaged('pcat-tbody', 'pcat-pg', 'pcat', _data.pcat, PAGE_SIZE, function(c) {
    return '<tr>' +
      '<td>' + esc(c.name) + '</td>' +
      '<td>' + esc(c.programName) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteProjectCategory(' + c.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 3);
}

function addProjectCategory() {
  var progId = getValue('pcat-prog');
  var name   = getValue('pcat-name');
  if (!progId || !name) { mToast('Program and Category Name are required.', 'error'); return; }
  apiPost('/api/manage/project-categories', { programId: parseInt(progId), name: name }, function() {
    mToast('Project Category "' + name + '" added.');
    clearValues(['pcat-name']);
    loadProjectCategories();
  });
}

function deleteProjectCategory(id, btn) {
  if (!confirm('Delete this Project Category?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/project-categories/' + id, function() {
    mToast('Project Category deleted.');
    loadProjectCategories(); loadProjectSubCategories();
  });
}

/* ════════════════════════════════════════════════
   PROJECT SUB-CATEGORIES
   ════════════════════════════════════════════════ */
function loadProjectSubCategories() {
  apiGet('/api/manage/project-sub-categories', function(data) {
    _data.psub = data;
    _pages.psub = 1;
    setCount('psub-count', data.length);
    renderPSubTable();
    // Refresh sub-cat dropdown for activity level
    var sel = document.getElementById('alv-sub');
    if (sel) {
      var cur = sel.value;
      sel.innerHTML = '<option value="">— Select Sub-Category —</option>' +
        data.map(function(s) {
          var label = esc(s.name);
          if (s.categoryName) label += ' (' + esc(s.categoryName) + ')';
          else if (s.programName) label += ' — ' + esc(s.programName);
          return '<option value="' + s.id + '">' + label + '</option>';
        }).join('');
      if (cur) sel.value = cur;
    }
  });
}

function renderPSubTable() {
  renderPaged('psub-tbody', 'psub-pg', 'psub', _data.psub, PAGE_SIZE, function(s) {
    return '<tr>' +
      '<td>' + esc(s.name) + '</td>' +
      '<td>' + (s.categoryName ? esc(s.categoryName) : '<span style="color:var(--text-muted);font-style:italic">—</span>') + '</td>' +
      '<td>' + esc(s.programName || '') + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteProjectSubCategory(' + s.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 4);
}

function addProjectSubCategory() {
  var progId = getValue('psub-prog');
  var catId  = getValue('psub-cat');  // optional — empty = direct to program
  var name   = getValue('psub-name');

  if (!progId) { mToast('Please select a Program.', 'error'); return; }
  if (!name)   { mToast('Sub-Category Name is required.', 'error'); return; }

  var body = {
    name:      name,
    programId: parseInt(progId)
  };
  // Only send projectCategoryId if a category was selected
  if (catId) body.projectCategoryId = parseInt(catId);

  apiPost('/api/manage/project-sub-categories', body, function() {
    mToast('Sub-Category "' + name + '" added.');
    clearValues(['psub-name']);
    loadProjectSubCategories();
  });
}

function deleteProjectSubCategory(id, btn) {
  if (!confirm('Delete this Sub-Category?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/project-sub-categories/' + id, function() {
    mToast('Sub-Category deleted.');
    loadProjectSubCategories(); loadActivityLevels();
  });
}

/* ════════════════════════════════════════════════
   ACTIVITY LEVELS
   ════════════════════════════════════════════════ */
function loadActivityLevels() {
  apiGet('/api/manage/activity-levels', function(data) {
    _data.alv = data;
    _pages.alv = 1;
    setCount('alv-count', data.length);
    renderALVTable();
  });
}

function renderALVTable() {
  renderPaged('alv-tbody', 'alv-pg', 'alv', _data.alv, PAGE_SIZE, function(a) {
    return '<tr>' +
      '<td>' + esc(a.name) + '</td>' +
      '<td>' + esc(a.subCategoryName) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteActivityLevel(' + a.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 3);
}

function addActivityLevel() {
  var subId = getValue('alv-sub');
  var name  = getValue('alv-name');
  if (!subId || !name) { mToast('Sub-Category and Activity Level Name are required.', 'error'); return; }
  apiPost('/api/manage/activity-levels', { projectSubCategoryId: parseInt(subId), name: name }, function() {
    mToast('Activity Level "' + name + '" added.');
    clearValues(['alv-name']);
    loadActivityLevels();
  });
}

function deleteActivityLevel(id, btn) {
  if (!confirm('Delete this Activity Level?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/activity-levels/' + id, function() {
    mToast('Activity Level deleted.');
    loadActivityLevels();
  });
}

/* ════════════════════════════════════════════════
   ALLOTMENT — RC INPUT ROWS (10 per page)
   ════════════════════════════════════════════════ */
function renderAllotRCRows() {
  var container = document.getElementById('allot-rc-list');
  var pgDiv     = document.getElementById('allot-rc-pg');
  var data      = _data.rc;
  if (!container) return;

  if (data.length === 0) {
    container.innerHTML = '<div style="color:#8aadb5;font-size:13px;padding:1rem 0">No RCs available. Add one first.</div>';
    if (pgDiv) pgDiv.innerHTML = '';
    return;
  }

  var total      = data.length;
  var totalPages = Math.max(1, Math.ceil(total / ALLOT_SIZE));
  var page       = Math.min(_pages.allotRc, totalPages);
  _pages.allotRc = page;
  var start      = (page - 1) * ALLOT_SIZE;
  var slice      = data.slice(start, start + ALLOT_SIZE);

  container.innerHTML = slice.map(function(rc) {
    return '<div class="allot-rc-row">' +
      '<div class="allot-rc-name">' + esc(rc.code) + ' — ' + esc(rc.name) + '</div>' +
      '<div class="allot-input-wrap">' +
        '<span>₱</span>' +
        '<input type="number" class="allot-rc-input" data-rc-id="' + rc.id + '" ' +
          'placeholder="0.00" min="0" step="0.01" ' +
          'style="width:160px;padding:7px 11px 7px 22px;border:1px solid rgba(0,0,0,0.15);' +
          'border-radius:10px;font-size:13px;outline:none;background:#fff;text-align:right;" />' +
      '</div>' +
    '</div>';
  }).join('');

  // Pagination for RC input rows
  if (pgDiv) {
    if (totalPages <= 1) {
      pgDiv.innerHTML = '';
    } else {
      var showing = Math.min(start + ALLOT_SIZE, total);
      var html = '<div class="pg-wrap">' +
        '<span class="pg-info">Showing ' + (start + 1) + '–' + showing + ' of ' + total + ' RCs</span>' +
        '<div class="pg-btns">' +
        '<button class="pg-btn" ' + (page <= 1 ? 'disabled' : '') +
          ' onclick="goPage(\'allotRc\',' + (page - 1) + ')">&lsaquo; Prev</button>';

      for (var p = 1; p <= totalPages; p++) {
        html += '<button class="pg-btn' + (p === page ? ' pg-active' : '') +
          '" onclick="goPage(\'allotRc\',' + p + ')">' + p + '</button>';
      }
      html += '<button class="pg-btn" ' + (page >= totalPages ? 'disabled' : '') +
        ' onclick="goPage(\'allotRc\',' + (page + 1) + ')">Next &rsaquo;</button>' +
        '</div></div>';
      pgDiv.innerHTML = html;
    }
  }
}

/* ════════════════════════════════════════════════
   ALLOTMENT RECORDS TABLE
   ════════════════════════════════════════════════ */
function loadAllotments() {
  apiGet('/api/manage/allotments', function(data) {
    _data.allotRec = data;
    _pages.allotRec = 1;
    setCount('allot-count', data.length);
    renderAllotRecTable();
  }, function(err) {
    document.getElementById('allot-tbody').innerHTML =
      '<tr><td colspan="7" style="text-align:center;color:#ef4444;padding:1rem">Error: ' + esc(err) + '</td></tr>';
  });
}

function renderAllotRecTable() {
  renderPaged('allot-tbody', 'allot-rec-pg', 'allotRec', _data.allotRec, PAGE_SIZE, function(a) {
    return '<tr>' +
      '<td>' + esc(a.rcName) + '</td>' +
      '<td style="max-width:180px;white-space:normal;font-size:12px">' + esc(a.fundCategory) + '</td>' +
      '<td>' + esc(a.expenseClassName) + '</td>' +
      '<td style="font-size:12px">' + esc(a.accountCode || '—') + '</td>' +
      '<td style="text-align:center">' + esc(a.fiscalYear) + '</td>' +
      '<td style="text-align:right;font-weight:700">' +
        parseFloat(a.amount).toLocaleString('en-PH', { minimumFractionDigits: 2 }) + '</td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteAllotment(' + a.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 7);
}

function saveAllotment() {
  var fy      = getValue('allot-fy');
  var fundId  = getValue('allot-fund');
  var classId = getValue('allot-class');
  var typeId  = getValue('allot-exptype');
  var acctId  = getValue('allot-acct');

  if (!fy)      { mToast('Fiscal Year is required.', 'error'); return; }
  if (!fundId)  { mToast('Fund Category is required.', 'error'); return; }
  if (!classId) { mToast('Expense Class is required.', 'error'); return; }
  if (!typeId)  { mToast('Expense Type is required.', 'error'); return; }
  if (!acctId)  { mToast('Account Code is required.', 'error'); return; }

  var inputs = document.querySelectorAll('.allot-rc-input');
  var entries = [];
  inputs.forEach(function(input) {
    var amt = parseFloat(input.value);
    if (amt > 0) entries.push({ rcId: parseInt(input.dataset.rcId), amount: amt });
  });
  if (entries.length === 0) { mToast('Enter at least one RC amount.', 'error'); return; }

  apiPost('/api/manage/allotments', {
    fiscalYear: fy,
    fundId: parseInt(fundId),
    expenseClassId: parseInt(classId),
    accountCodeId: parseInt(acctId),
    entries: entries
  }, function(d) {
    mToast(d.message || entries.length + ' allotment(s) saved.');
    document.querySelectorAll('.allot-rc-input').forEach(function(i) { i.value = ''; });
    loadAllotments();
  });
}

function deleteAllotment(id, btn) {
  if (!confirm('Delete this allotment?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/allotments/' + id, function() { mToast('Allotment deleted.'); loadAllotments(); });
}

/* ════════════════════════════════════════════════
   USERS
   ════════════════════════════════════════════════ */
function loadUsers() {
  apiGet('/api/manage/users', function(data) {
    _data.users = data;
    _pages.users = 1;
    setCount('user-count', data.length);
    renderUsersTable();
  }, function(err) {
    document.getElementById('user-tbody').innerHTML =
      '<tr><td colspan="5" style="text-align:center;color:#ef4444;padding:1rem">Error: ' + esc(err) + '</td></tr>';
  });
}

function renderUsersTable() {
  renderPaged('user-tbody', 'user-pg', 'users', _data.users, PAGE_SIZE, function(u) {
    var roleClass = u.role === 'admin' ? 'badge-blue' : 'badge-teal';
    var roleLabel = u.role === 'admin' ? 'Budget Admin' : 'Budget Staff';
    return '<tr>' +
      '<td>' + esc(u.fullName) + '</td>' +
      '<td>' + esc(u.username) + '</td>' +
      '<td><span class="badge ' + roleClass + '">' + roleLabel + '</span></td>' +
      '<td style="text-align:center"><span class="badge ' + (u.isActive ? 'badge-green' : 'badge-amber') + '">' +
        (u.isActive ? 'Active' : 'Inactive') + '</span></td>' +
      '<td style="text-align:center"><button class="btn btn-sm btn-danger" onclick="deleteUser(' + u.id + ',this)">Delete</button></td>' +
      '</tr>';
  }, 5);
}

function addUser() {
  var name = getValue('u-name'), user = getValue('u-user'),
      pass = getValue('u-pass'), role = getValue('u-role');
  if (!name || !user || !pass) { mToast('Name, username and password are required.', 'error'); return; }
  apiPost('/api/manage/users', { fullName: name, username: user, password: pass, role: role }, function() {
    mToast('User "' + user + '" created.');
    clearValues(['u-name','u-user','u-pass']); loadUsers();
  });
}

function deleteUser(id, btn) {
  if (!confirm('Deactivate this user?')) return;
  btn.disabled = true;
  apiDelete('/api/manage/users/' + id, function() { mToast('User deactivated.'); loadUsers(); });
}
