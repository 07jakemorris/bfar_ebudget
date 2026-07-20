/* =========================================
   nav.js — Shared navigation logic
   Inject sidebar, set topbar date,
   and highlight the active menu item.
   ========================================= */

(function () {

  /* ── SVG icon helper — single fill color, BFAR ocean theme ── */
  function icon(path, viewBox) {
    viewBox = viewBox || '0 0 24 24';
    return '<svg width="17" height="17" viewBox="' + viewBox + '" fill="currentColor" xmlns="http://www.w3.org/2000/svg" style="flex-shrink:0">' + path + '</svg>';
  }

  /* ── Icons — all solid fill, single color ── */
  var ICONS = {
    dashboard: icon('<path d="M3 13h8V3H3v10zm0 8h8v-6H3v6zm10 0h8V11h-8v10zm0-18v6h8V3h-8z"/>'),
    obligations: icon('<path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6zm-1 1.5L18.5 9H13V3.5zM9 17v-2h6v2H9zm0-4v-2h6v2H9zm0-4V7h3v2H9z"/>'),
    earmarking: icon('<path d="M21.41 11.58L12.41 2.58A2 2 0 0 0 11 2H4a2 2 0 0 0-2 2v7a2 2 0 0 0 .59 1.42l9 9a2 2 0 0 0 2.82 0l7-7a2 2 0 0 0 0-2.84zM6.5 8A1.5 1.5 0 1 1 8 6.5 1.5 1.5 0 0 1 6.5 8z"/>'),
    reports: icon('<path d="M5 3a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V5a2 2 0 0 0-2-2H5zm1 14v-4h2v4H6zm4 0V8h2v9h-2zm4 0v-6h2v6h-2z"/>'),
    manage: icon('<path d="M12 2a10 10 0 1 0 10 10A10 10 0 0 0 12 2zm0 18a8 8 0 1 1 8-8 8 8 0 0 1-8 8zm0-14a4 4 0 1 0 4 4 4 4 0 0 0-4-4zm0 6a2 2 0 1 1 2-2 2 2 0 0 1-2 2z"/><path d="M19.07 4.93l-1.41 1.41A7.93 7.93 0 0 1 20 12a8 8 0 0 1-8 8 7.93 7.93 0 0 1-5.66-2.34l-1.41 1.41A9.9 9.9 0 0 0 12 22a10 10 0 0 0 10-10 9.9 9.9 0 0 0-2.93-7.07z"/>'),
  };

  /* ── Sidebar HTML with clean SVG icons ── */
  var SIDEBAR_HTML = '' +
    '<aside class="sidebar">' +
      '<div class="sidebar-brand">' +
        '<div class="brand-icon">' +
          '<svg width="22" height="22" viewBox="0 0 24 24" fill="#fff" xmlns="http://www.w3.org/2000/svg">' +
            '<path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 14H9V8h2v8zm4 0h-2V8h2v8z"/>' +
            '<path d="M19.07 4.93l-1.41 1.41C19.1 7.79 20 9.79 20 12s-.9 4.21-2.34 5.66l1.41 1.41C20.88 17.46 22 14.86 22 12s-1.12-5.46-2.93-7.07zM4.93 4.93C3.12 6.54 2 9.14 2 12s1.12 5.46 2.93 7.07l1.41-1.41C4.9 16.21 4 14.21 4 12s.9-4.21 2.34-5.66L4.93 4.93z"/>' +
          '</svg>' +
        '</div>' +
        '<div class="brand-text">' +
          '<span class="brand-name">BFAR</span>' +
          '<span class="brand-sub">E-Budget System</span>' +
        '</div>' +
      '</div>' +

      '<div class="sidebar-section-label">Main Menu</div>' +

      '<a class="nav-item" data-page="dashboard" href="index.html">' +
        '<span class="nav-icon">' + ICONS.dashboard + '</span> Dashboard' +
      '</a>' +

      '<a class="nav-item" data-page="obligations" href="obligations.html">' +
        '<span class="nav-icon">' + ICONS.obligations + '</span> Obligations' +
        '<span class="nav-badge" id="badge-obligations">0</span>' +
      '</a>' +

      '<a class="nav-item" data-page="earmarking" href="earmarking.html">' +
        '<span class="nav-icon">' + ICONS.earmarking + '</span> Earmarking' +
      '</a>' +

      '<a class="nav-item" data-page="reports" href="reports.html">' +
        '<span class="nav-icon">' + ICONS.reports + '</span> Budget Reports' +
      '</a>' +

      '<div class="sidebar-section-label">Administration</div>' +

      '<a class="nav-item" data-page="manage" href="manage.html">' +
        '<span class="nav-icon">' + ICONS.manage + '</span> Manage Data' +
      '</a>' +

      '<div class="sidebar-footer">BFAR &copy; 2026 &mdash; RO VIII</div>' +
    '</aside>';

  /* ── Page metadata ── */
  var PAGE_META = {
    'index.html':       { page: 'dashboard',   title: 'Dashboard',      sub: 'Bureau of Fisheries and Aquatic Resources' },
    'obligations.html': { page: 'obligations', title: 'Obligations',    sub: 'Obligation Request Status (ORS) / Budget Utilization Request Status (BURS)' },
    'earmarking.html':  { page: 'earmarking',  title: 'Earmarking',     sub: 'Reserve allotment for specific purposes before obligation' },
    'reports.html':     { page: 'reports',     title: 'Budget Reports', sub: 'Statement of Allotment, Obligations, Disbursements and Balances' },
    'manage.html':      { page: 'manage',      title: 'Manage Data',    sub: 'Administrator — Responsibility Centers, Fund Categories, Account Codes, Programs' },
  };

  document.addEventListener('DOMContentLoaded', function () {

    /* Inject sidebar */
    var root = document.getElementById('sidebar-root');
    if (root) root.innerHTML = SIDEBAR_HTML;

    /* Set topbar date */
    var dateEl = document.getElementById('topbar-date');
    if (dateEl) {
      dateEl.textContent = new Date().toLocaleDateString('en-PH', {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric'
      });
    }

    /* Determine current page, set topbar, highlight active nav */
    var file = window.location.pathname.split('/').pop() || 'index.html';
    var meta = PAGE_META[file] || PAGE_META['index.html'];

    var titleEl = document.getElementById('topbar-title');
    var subEl   = document.getElementById('topbar-sub');
    if (titleEl) titleEl.textContent = meta.title;
    if (subEl)   subEl.textContent   = meta.sub;

    document.querySelectorAll('.nav-item[data-page]').forEach(function (el) {
      el.classList.toggle('active', el.dataset.page === meta.page);
    });
  });

})();
