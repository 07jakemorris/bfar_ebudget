/* ── Color Palette ── */
const COLORS = ['#0070c0','#e07000','#000000'];
const COLOR_LABELS = { '#0070c0':'Blue','#e07000':'Orange','#000000':'Black' };

/* ── Default Fund Items ── */
const DEFAULT_ITEMS = [
  { desc:'01101101 - Specific Budget of the Agency (Current)',          color:'#353535', indent:0, amt:'', gap:0   },
  { desc:'310200000000 - Fisheries Regulatory and Law Enforcement Program', color:'#353535', indent:2, amt:'', gap:220 },
  { desc:'310200100000 - Coastal and Inland Fisheries Resource Management', color:'#353535', indent:4, amt:'', gap:0   },
  { desc:'310200100004 - Coastal and Inland Fisheries Resource Management', color:'#353535', indent:6, amt:'', gap:0   },
  { desc:'2 - Maintenance and Other Operating Expenses',                color:'#353535', indent:8, amt:'', gap:0   },
  { desc:'5-02-05-020 - 01 - Telephone Expenses - Mobile',             color:'#353535', indent:8, amt:'6,000.00', gap:0   },
];

let fundItems = DEFAULT_ITEMS.map(i => ({ ...i }));

/* ── Render Fund List (+ parallel Amount column) ── */
function renderFund() {
  const list    = document.getElementById('fund-list');
  const amtList = document.getElementById('amount-list');
  list.innerHTML    = '';
  amtList.innerHTML = '';

  fundItems.forEach((item, idx) => {
    const marginTop = item.gap ? item.gap + 'px' : '0';

    /* ── Fund Category row ── */
    const fi = document.createElement('div');
    fi.className = 'fi';
    fi.style.marginTop = marginTop;

    /* color dot */
    const dot = document.createElement('span');
    dot.className = 'fi-color-dot';
    dot.style.background = item.color;
    dot.title = 'Click to change color (' + COLOR_LABELS[item.color] + ')';
    dot.addEventListener('click', () => cycleColor(idx));

    /* inner (desc only) */
    const inner = document.createElement('div');
    inner.className = 'fi-inner';
    inner.style.paddingLeft = (item.indent * 13) + 'px';

    const desc = document.createElement('span');
    desc.className = 'fi-desc';
    desc.contentEditable = 'true';
    desc.spellcheck = false;
    desc.style.color = item.color;
    desc.textContent = item.desc;
    desc.addEventListener('input', () => { fundItems[idx].desc = desc.textContent; syncRowHeights(); });
    desc.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); } });

    inner.appendChild(desc);

    /* controls */
    const ctrl = document.createElement('div');
    ctrl.className = 'fi-ctrl';

    const indLess = document.createElement('button');
    indLess.textContent = '←';
    indLess.title = 'Decrease indent';
    indLess.addEventListener('click', () => { fundItems[idx].indent = Math.max(0, fundItems[idx].indent - 1); renderFund(); });

    const indMore = document.createElement('button');
    indMore.textContent = '→';
    indMore.title = 'Increase indent';
    indMore.addEventListener('click', () => { fundItems[idx].indent = Math.min(8, fundItems[idx].indent + 1); renderFund(); });

    const gapToggle = document.createElement('button');
    gapToggle.textContent = '⤒';
    gapToggle.title = item.gap ? 'Remove space above this row' : 'Add space above this row';
    gapToggle.addEventListener('click', () => { fundItems[idx].gap = fundItems[idx].gap ? 0 : 34; renderFund(); });

    const moveUp = document.createElement('button');
    moveUp.textContent = '↑';
    moveUp.title = 'Move up';
    moveUp.addEventListener('click', () => {
      if (idx > 0) { [fundItems[idx-1], fundItems[idx]] = [fundItems[idx], fundItems[idx-1]]; renderFund(); }
    });

    const moveDown = document.createElement('button');
    moveDown.textContent = '↓';
    moveDown.title = 'Move down';
    moveDown.addEventListener('click', () => {
      if (idx < fundItems.length-1) { [fundItems[idx], fundItems[idx+1]] = [fundItems[idx+1], fundItems[idx]]; renderFund(); }
    });

    const del = document.createElement('button');
    del.textContent = '✕';
    del.className = 'del-btn';
    del.title = 'Delete row';
    del.addEventListener('click', () => { fundItems.splice(idx, 1); renderFund(); });

    ctrl.appendChild(indLess);
    ctrl.appendChild(indMore);
    ctrl.appendChild(gapToggle);
    ctrl.appendChild(moveUp);
    ctrl.appendChild(moveDown);
    ctrl.appendChild(del);

    fi.appendChild(dot);
    fi.appendChild(inner);
    fi.appendChild(ctrl);
    list.appendChild(fi);

    /* ── Parallel Amount column row ── */
    const ar = document.createElement('div');
    ar.className = 'amt-row';
    ar.style.marginTop = marginTop;

    const phpLabel = document.createElement('span');
    phpLabel.className = 'amt-php-label';
    phpLabel.textContent = 'Php';
    phpLabel.style.visibility = item.amt.trim() ? 'visible' : 'hidden';

    const amt = document.createElement('span');
    amt.className = 'fi-amt';
    amt.contentEditable = 'true';
    amt.spellcheck = false;
    amt.textContent = item.amt;
    amt.addEventListener('input', () => {
      fundItems[idx].amt = amt.textContent;
      phpLabel.style.visibility = amt.textContent.trim() ? 'visible' : 'hidden';
    });
    amt.addEventListener('keydown', e => { if (e.key === 'Enter') { e.preventDefault(); } });

    ar.appendChild(phpLabel);
    ar.appendChild(amt);
    amtList.appendChild(ar);
  });

  syncRowHeights();
}

function cycleColor(idx) {
  const cur = COLORS.indexOf(fundItems[idx].color);
  fundItems[idx].color = COLORS[(cur + 1) % COLORS.length];
  renderFund();
}

/* ── Keep each Amount row locked to the same Y position as its
      matching Fund Category row (fund text can wrap to 2+ lines,
      the amount cell must match that height so it never drifts) ── */
function syncRowHeights() {
  const fiRows  = document.querySelectorAll('#fund-list .fi');
  const amtRows = document.querySelectorAll('#amount-list .amt-row');
  fiRows.forEach((fi, idx) => {
    const ar = amtRows[idx];
    if (!ar) return;
    ar.style.minHeight = fi.offsetHeight + 'px';
  });
}

/* ── Sync Responsibility Center column width to ORS No./Payee table width ── */
function syncRespWidth() {
  const infoTbl = document.getElementById('info-tbl');
  const mainTbl = document.querySelector('.main-tbl');
  const col1 = document.getElementById('col-resp');
  const col2 = document.getElementById('col-part');
  const col3 = document.getElementById('col-fund');
  const col4 = document.getElementById('col-amt');
  if (!infoTbl || !mainTbl || !col1) return;

  /* reset to original ratios first so mainTbl.offsetWidth reflects full container width */
  col1.style.width = '15.5%';
  col2.style.width = '26%';
  col3.style.width = '43%';
  col4.style.width = '15.5%';

  const totalWidth = mainTbl.offsetWidth;
  const respWidth  = document.querySelector('#info-tbl .lbl').offsetWidth;
  const remaining  = totalWidth - respWidth;

  const ratio2 = 21 / 89.5, ratio3 = 53 / 89.5, ratio4 = 15.5 / 89.5;

  col1.style.width = respWidth + 'px';
  col2.style.width = Math.round(remaining * ratio2) + 'px';
  col3.style.width = Math.round(remaining * ratio3) + 'px';
  col4.style.width = Math.round(remaining * ratio4) + 'px';
}

/* ── Init ── */
renderFund();
syncRespWidth();
syncRowHeights();
window.addEventListener('load', () => { syncRespWidth(); syncRowHeights(); });
window.addEventListener('resize', () => { syncRespWidth(); syncRowHeights(); });

/* Sync textarea heights to fund-list on resize */
const ro = new ResizeObserver(() => {
  const fh = document.getElementById('fund-cell').offsetHeight;
  document.getElementById('resp-center').style.minHeight  = (fh - 8) + 'px';
  document.getElementById('particulars').style.minHeight  = (fh - 8) + 'px';
  syncRowHeights();
});
ro.observe(document.getElementById('fund-list'));