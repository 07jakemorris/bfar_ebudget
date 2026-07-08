/* =========================================
   reports.js — Budget Reports
   Hierarchical tree: Fund Cluster > Financing
   Source > Authorization > Fund Category >
   Expense Class > Account Code
   ========================================= */

/* ════════════════════════════════════════════
   STATE
   ════════════════════════════════════════════ */
var _filters = {
  fund:  { id: 'all', label: 'All Fund Categories' },
  rc:    { id: 'all', label: 'All Responsibility Centers' },
  class: { id: 'all', label: 'All Expense Classes' },
  fy:    { id: 'all', label: 'All Fiscal Years' }
};

var _fundList  = [];
var _rcList    = [];
var _classList = [];
var _fyList    = [];
var _allExpanded = false;
var _rowIdCounter = 0;

/* ════════════════════════════════════════════
   INIT
   ════════════════════════════════════════════ */
document.addEventListener('DOMContentLoaded', function () {
  loadDropdownData();
  loadReport();
});

function loadDropdownData() {
  fetch('/api/reports/fund-categories')
    .then(function(r) { return r.json(); })
    .then(function(data) { _fundList = data; buildDropdownItems('fund', ''); })
    .catch(function() {});

  fetch('/api/manage/responsibility-centers')
    .then(function(r) { return r.json(); })
    .then(function(data) { _rcList = data; buildDropdownItems('rc', ''); })
    .catch(function() {});

  fetch('/api/dropdown/expense-classes')
    .then(function(r) { return r.json(); })
    .then(function(data) {
      _classList = data.map(function(ec) { return { id: ec.value, name: ec.text }; });
      buildDropdownItems('class', '');
    })
    .catch(function() {});

  fetch('/api/reports/fiscal-years')
    .then(function(r) { return r.json(); })
    .then(function(data) { _fyList = data; buildDropdownItems('fy', ''); })
    .catch(function() {});
}

/* ════════════════════════════════════════════
   SEARCH DROPDOWNS
   ════════════════════════════════════════════ */
var _closeTimers = {};

function openDropdown(key) {
  clearTimeout(_closeTimers[key]);
  var inputId = key + '-search';
  var query   = document.getElementById(inputId) ? document.getElementById(inputId).value : '';
  buildDropdownItems(key, query);
  var dd = document.getElementById(key + '-dropdown');
  if (dd) dd.classList.add('open');
}

function closeDropdown(key) {
  _closeTimers[key] = setTimeout(function() {
    var dd = document.getElementById(key + '-dropdown');
    if (dd) dd.classList.remove('open');
  }, 200);
}

function searchFilter(key, query) {
  buildDropdownItems(key, query);
  var dd = document.getElementById(key + '-dropdown');
  if (dd) dd.classList.add('open');
}

function buildDropdownItems(key, query) {
  var dd = document.getElementById(key + '-dropdown');
  if (!dd) return;

  query = (query || '').trim().toLowerCase();
  var items = [];

  if (key === 'fund') {
    items = _fundList.filter(function(f) {
      return !query || f.name.toLowerCase().includes(query);
    }).map(function(f) { return { id: String(f.id), label: f.name }; });
  } else if (key === 'rc') {
    items = _rcList.filter(function(rc) {
      return !query ||
        (rc.code && rc.code.toLowerCase().includes(query)) ||
        (rc.name && rc.name.toLowerCase().includes(query));
    }).map(function(rc) { return { id: String(rc.id), label: rc.code + ' – ' + rc.name }; });
  } else if (key === 'class') {
    items = _classList.filter(function(ec) {
      return !query || ec.name.toLowerCase().includes(query);
    }).map(function(ec) { return { id: String(ec.id), label: ec.name }; });
  } else if (key === 'fy') {
    items = _fyList.filter(function(fy) {
      return !query || String(fy).includes(query);
    }).map(function(fy) { return { id: String(fy), label: String(fy) }; });
  }

  var allLabel = key === 'fund'  ? 'All Fund Categories'
               : key === 'rc'    ? 'All Responsibility Centers'
               : key === 'class' ? 'All Expense Classes'
               : 'All Fiscal Years';

  var html = '<div class="dd-item all-option" onmousedown="selectFilter(\'' + key + '\',\'all\',\'' + allLabel + '\')">' +
    '— ' + allLabel + ' —</div>';

  if (items.length === 0 && !query) {
    html += '<div class="dd-item" style="color:var(--text-muted);cursor:default">No data available yet</div>';
  } else if (items.length === 0 && query) {
    html += '<div class="dd-item" style="color:var(--text-muted);cursor:default">No matches found for "' + esc(query) + '"</div>';
  } else {
    items.slice(0, 50).forEach(function(item) {
      var highlighted = esc(item.label);
      if (query) {
        var safe = query.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
        var re   = new RegExp('(' + safe + ')', 'gi');
        highlighted = esc(item.label).replace(re, '<mark>$1</mark>');
      }
      html += '<div class="dd-item" onmousedown="selectFilter(\'' + key + '\',\'' +
        item.id + '\',\'' + item.label.replace(/\\/g,'\\\\').replace(/'/g, "\\'") + '\')">' +
        highlighted + '</div>';
    });
    if (items.length > 50) {
      html += '<div class="dd-item" style="color:var(--text-muted);cursor:default;font-style:italic">…and ' + (items.length - 50) + ' more. Type to narrow.</div>';
    }
  }

  dd.innerHTML = html;
}

function selectFilter(key, id, label) {
  _filters[key] = { id: id, label: label };

  var input  = document.getElementById(key + '-search');
  var hidden = document.getElementById(key === 'fy' ? 'fy-val' : key + '-id');

  if (input)  input.value  = id === 'all' ? '' : label;
  if (hidden) hidden.value = id;

  var dd = document.getElementById(key + '-dropdown');
  if (dd) dd.classList.remove('open');

  updateActiveFilterTags();
  loadReport();
}

/* ════════════════════════════════════════════
   ACTIVE FILTER TAGS
   ════════════════════════════════════════════ */
function updateActiveFilterTags() {
  var wrap = document.getElementById('active-filters');
  if (!wrap) return;

  var html = '';
  Object.keys(_filters).forEach(function(key) {
    var f = _filters[key];
    if (f.id !== 'all') {
      html += '<span class="filter-active-tag">' + esc(f.label) +
        '<button onmousedown="selectFilter(\'' + key + '\',\'all\',\'\')" title="Remove filter">✕</button>' +
        '</span>';
    }
  });
  wrap.innerHTML = html || '<span style="font-size:12px;color:var(--text-muted)">No active filters — showing all data</span>';
}

function clearFilters() {
  selectFilter('fund',  'all', 'All Fund Categories');
  selectFilter('rc',    'all', 'All Responsibility Centers');
  selectFilter('class', 'all', 'All Expense Classes');
  selectFilter('fy',    'all', 'All Fiscal Years');
  document.getElementById('fund-search').value  = '';
  document.getElementById('rc-search').value    = '';
  document.getElementById('class-search').value = '';
  document.getElementById('fy-search').value    = '';
}

/* ════════════════════════════════════════════
   LOAD REPORT
   ════════════════════════════════════════════ */
function loadReport() {
  var tbody = document.getElementById('tree-tbody');
  if (tbody) tbody.innerHTML = '<tr class="no-data-row"><td colspan="7">Loading…</td></tr>';

  var params = new URLSearchParams({
    fundId: _filters.fund.id,
    rcId:   _filters.rc.id,
    classId: _filters.class.id,
    fiscalYear: _filters.fy.id
  });

  fetch('/api/reports/tree?' + params.toString())
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) {
        if (tbody) tbody.innerHTML = '<tr class="no-data-row"><td colspan="7" style="color:var(--danger)">Error: ' + esc(data.error) + '</td></tr>';
        return;
      }
      renderTree(data);
      renderTopStats(data);
    })
    .catch(function(err) {
      if (tbody) tbody.innerHTML = '<tr class="no-data-row"><td colspan="7" style="color:var(--danger)">Network error: ' + esc(err.message) + '</td></tr>';
    });

  // Also load the flat summary for stat cards (RC/expense class agnostic totals)
  loadSummaryStats();
}

function loadSummaryStats() {
  var params = new URLSearchParams({
    rcId: _filters.rc.id, classId: _filters.class.id, fiscalYear: _filters.fy.id
  });
  fetch('/api/reports/summary?' + params.toString())
    .then(function(r) { return r.json(); })
    .then(function(data) {
      if (data.error) return;
      setText('stat-allot', fmt(data.totalAllotment));
      setText('stat-obl',   fmt(data.totalObligations));
      setText('stat-disb',  fmt(data.disbursements));
      setText('stat-em',    fmt(data.totalEarmarks));
      setText('stat-unobl', fmt(data.unobligated));
      setText('stat-obl-pct', data.utilizationPct + '% utilized');
    })
    .catch(function() {});
}

function renderTopStats(clusters) {
  // If summary stats failed, fall back to tree totals
  if (!clusters || clusters.length === 0) return;
}

/* ════════════════════════════════════════════
   RENDER TREE TABLE
   ════════════════════════════════════════════ */
function renderTree(clusters) {
  var tbody = document.getElementById('tree-tbody');
  var rowCount = document.getElementById('row-count');
  if (!tbody) return;

  if (!clusters || clusters.length === 0) {
    tbody.innerHTML = '<tr class="no-data-row"><td colspan="7">No allotment data found for the selected filters.</td></tr>';
    if (rowCount) rowCount.textContent = '0 entries';
    return;
  }

  _rowIdCounter = 0;
  var html = '';
  var totalAccountRows = 0;

  clusters.forEach(function(cluster) {
    var clusterRowId = 'row-' + (_rowIdCounter++);
    html += treeRow(cluster.label, cluster, 'lvl-fund-cluster', 0, clusterRowId, null, cluster.financingSources && cluster.financingSources.length > 0);

    (cluster.financingSources || []).forEach(function(fin) {
      var finRowId = 'row-' + (_rowIdCounter++);
      html += treeRow(fin.label, fin, 'lvl-financing', 1, finRowId, clusterRowId, fin.authorizations && fin.authorizations.length > 0);

      (fin.authorizations || []).forEach(function(auth) {
        var authRowId = 'row-' + (_rowIdCounter++);
        html += treeRow(auth.label, auth, 'lvl-authorization', 2, authRowId, finRowId, auth.fundCategories && auth.fundCategories.length > 0);

        (auth.fundCategories || []).forEach(function(fc) {
          var fcRowId = 'row-' + (_rowIdCounter++);
          html += treeRow(fc.label, fc, 'lvl-fund-category', 3, fcRowId, authRowId, fc.expenseClasses && fc.expenseClasses.length > 0);

          (fc.expenseClasses || []).forEach(function(ec) {
            var ecRowId = 'row-' + (_rowIdCounter++);
            html += treeRow(ec.label, ec, 'lvl-expense-class', 4, ecRowId, fcRowId, ec.accountCodes && ec.accountCodes.length > 0);

            (ec.accountCodes || []).forEach(function(acct) {
              totalAccountRows++;
              html += treeRow(acct.label, acct, 'lvl-account-code', 5, null, ecRowId, false);
            });
          });
        });
      });
    });
  });

  tbody.innerHTML = html;
  if (rowCount) rowCount.textContent = totalAccountRows + ' account code entr' + (totalAccountRows === 1 ? 'y' : 'ies');

  // Default: ALL rows expanded — click toggle to collapse
  _allExpanded = true;
  setExpandButtonLabel();
}

function treeRow(label, node, levelClass, depth, rowId, parentId, hasChildren) {
  var indent = 'tree-indent-' + Math.min(depth, 4);
  var toggleHtml = hasChildren
    ? '<button class="toggle-btn" onclick="toggleRow(\'' + rowId + '\', this)" aria-label="Toggle">▾</button>'
    : '<span style="display:inline-block;width:22px"></span>';

  var attrs = 'class="tree-row ' + levelClass + '"';
  if (rowId)    attrs += ' id="' + rowId + '"';
  if (parentId) attrs += ' data-parent="' + parentId + '"';

  return '<tr ' + attrs + '>' +
    '<td class="' + indent + '">' + toggleHtml + esc(label) + '</td>' +
    '<td>' + fmt(node.allotment) + '</td>' +
    '<td>' + fmt(node.obligations) + '</td>' +
    '<td>' + fmt(node.disbursements) + '</td>' +
    '<td>' + fmt(node.unpaid) + '</td>' +
    '<td>' + fmt(node.unobligated) + '</td>' +
    '<td>' + fmt(node.earmarks) + '</td>' +
    '</tr>';
}

/* ════════════════════════════════════════════
   COLLAPSE / EXPAND
   ════════════════════════════════════════════ */
function toggleRow(rowId, btn) {
  var isCollapsed = btn.classList.contains('collapsed');

  if (isCollapsed) {
    // Currently collapsed → expand: show direct children only
    btn.classList.remove('collapsed');
    document.querySelectorAll('[data-parent="' + rowId + '"]').forEach(function(child) {
      child.classList.remove('hidden-row');
      // Also restore the child's toggle button state if it was open before
      var childToggle = child.querySelector('.toggle-btn');
      if (childToggle && !childToggle.classList.contains('collapsed')) {
        // Child was open — show its children too
        if (child.id) {
          document.querySelectorAll('[data-parent="' + child.id + '"]').forEach(function(grandchild) {
            grandchild.classList.remove('hidden-row');
          });
        }
      }
    });
  } else {
    // Currently expanded → collapse: hide all descendants
    btn.classList.add('collapsed');
    hideDescendants(rowId);
  }
}

function hideDescendants(rowId) {
  var children = document.querySelectorAll('[data-parent="' + rowId + '"]');
  children.forEach(function(child) {
    child.classList.add('hidden-row');
    var childToggle = child.querySelector('.toggle-btn');
    if (childToggle) childToggle.classList.add('collapsed');
    hideDescendants(child.id);
  });
}

function toggleAllRows() {
  _allExpanded = !_allExpanded;

  document.querySelectorAll('.tree-row').forEach(function(row) {
    if (_allExpanded) {
      row.classList.remove('hidden-row');
    } else {
      // Collapse all — hide everything that has a parent
      if (row.dataset.parent) row.classList.add('hidden-row');
    }
  });

  document.querySelectorAll('.toggle-btn').forEach(function(btn) {
    if (_allExpanded) btn.classList.remove('collapsed');
    else btn.classList.add('collapsed');
  });

  setExpandButtonLabel();
}

function setExpandButtonLabel() {
  var btn = document.getElementById('expand-toggle-btn');
  if (!btn) return;
  btn.innerHTML = _allExpanded
    ? '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg> Collapse All'
    : '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg> Expand All';
}

/* ════════════════════════════════════════════
   EXPORT CSV
   ════════════════════════════════════════════ */
function exportCSV() {
  var params = new URLSearchParams({
    fundId: _filters.fund.id, rcId: _filters.rc.id,
    classId: _filters.class.id, fiscalYear: _filters.fy.id
  });

  fetch('/api/reports/tree?' + params.toString())
    .then(function(r) { return r.json(); })
    .then(function(clusters) {
      var csv = 'BFAR E-Budget SAAODB Report\n';
      csv += 'Fund Category:,' + _filters.fund.label + '\n';
      csv += 'Responsibility Center:,' + _filters.rc.label + '\n';
      csv += 'Expense Class:,' + _filters.class.label + '\n';
      csv += 'Fiscal Year:,' + _filters.fy.label + '\n\n';
      csv += 'Particulars,Allotment,Obligations,Disbursements,Unpaid,Unobligated Balance,Earmark\n';

      function addRow(label, node, depth) {
        var indent = Array(depth + 1).join('  ');
        csv += '"' + indent + label.replace(/"/g, '""') + '",' +
          node.allotment + ',' + node.obligations + ',' + node.disbursements + ',' +
          node.unpaid + ',' + node.unobligated + ',' + node.earmarks + '\n';
      }

      (clusters || []).forEach(function(cluster) {
        addRow(cluster.label, cluster, 0);
        (cluster.financingSources || []).forEach(function(fin) {
          addRow(fin.label, fin, 1);
          (fin.authorizations || []).forEach(function(auth) {
            addRow(auth.label, auth, 2);
            (auth.fundCategories || []).forEach(function(fc) {
              addRow(fc.label, fc, 3);
              (fc.expenseClasses || []).forEach(function(ec) {
                addRow(ec.label, ec, 4);
                (ec.accountCodes || []).forEach(function(acct) {
                  addRow(acct.label, acct, 5);
                });
              });
            });
          });
        });
      });

      var fyLabel = _filters.fy.id !== 'all' ? _filters.fy.id : 'all';
      var a = document.createElement('a');
      a.href = URL.createObjectURL(new Blob([csv], { type: 'text/csv' }));
      a.download = 'SAAODB_' + fyLabel + '_' + new Date().toISOString().split('T')[0] + '.csv';
      a.click();
    })
    .catch(function(err) { alert('Export failed: ' + err.message); });
}

/* ════════════════════════════════════════════
   UTILITIES
   ════════════════════════════════════════════ */
function fmt(val) {
  var n = parseFloat(val) || 0;
  return n.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setText(id, val) {
  var el = document.getElementById(id);
  if (el) el.textContent = val;
}

function esc(s) {
  return String(s || '')
    .replace(/&/g,'&amp;').replace(/</g,'&lt;')
    .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}
