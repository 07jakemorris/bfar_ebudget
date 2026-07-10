/* ── Color Palette ── */
const COLORS = ['#0070c0','#e07000','#000000'];
const COLOR_LABELS = { '#0070c0':'Blue','#e07000':'Orange','#000000':'Black' };

let fundItems = [];

/* ════════════════════════════════════════════
   FETCH OBLIGATION DATA
   Reads ?id=X from the URL (set by printORS() in
   obligations.js) and fills every field from
   GET /api/obligations/{id}.
   ════════════════════════════════════════════ */
function getIdFromQuery() {
  return new URLSearchParams(window.location.search).get('id');
}

function formatPeso(n) {
  const num = Number(n);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

function setVal(id, val) {
  const el = document.getElementById(id);
  if (el) el.value = val || '';
}

async function loadObligationData(id) {
  showStatusBanner('Loading obligation data…', 'info');
  try {
    const res = await fetch(`/api/obligations/${encodeURIComponent(id)}`);
    if (res.status === 404) {
      showStatusBanner('Obligation record not found.', 'error');
      return;
    }
    if (!res.ok) {
      const d = await res.json().catch(() => ({}));
      throw new Error(d.error || `Request failed (${res.status})`);
    }
    const d = await res.json();
    populateFromDetail(d);
    hideStatusBanner();
  } catch (err) {
    showStatusBanner('Could not load obligation data: ' + err.message, 'error');
  }
}

/* Maps the flat ObligationDetail fields returned by the API onto the
   form. NOTE: GetObligationDetail() currently only joins the Fund and
   Expense-classification chain (fund category → expense class →
   account code → sub-account code) — it does not join the
   Program/Project/Activity tables, so that part of the hierarchy can't
   be shown here yet. Extend the SQL in ObligationsData.cs if you want
   those rows included too. */
function populateFromDetail(d) {
  setVal('ors-no', d.orsNo);
  setVal('ors-date', d.orsDate);
  setVal('payee', d.payee);
  document.getElementById('resp-center').value  = d.rcCode || d.rcName || '';
  document.getElementById('particulars').value  = d.particulars || '';
  setVal('grand-total', formatPeso(d.amount));

  /* Box A signatory comes from the record's assigned Signatory.
     Box B (right side) has no per-record data from the API, so it's
     left as whatever is currently in the field (defaults to the
     Budget Section OIC set in the HTML) — edit sig2n/sig2p directly
     if that officer changes. */
  setVal('sig1n', (d.signatoryName || '').toUpperCase());
  setVal('sig1p', d.signatoryPosition || '');

  fundItems = buildFundItemsFromDetail(d);
  renderFund();
  syncRespWidth();
  syncRowHeights();
}

function buildFundItemsFromDetail(d) {
  const amtStr = formatPeso(d.amount);
  const items = [];
  const BLANK = '<-blank->';

  /* Row 1: Fund Category — unchanged, already correct */
  const line1 = [d.fullFundingSource, d.fundCategory].filter(Boolean).join(' - ');
  items.push({ desc: line1 || BLANK, color: '#474747', indent: 0, amt: '', gap: 0 });

  /* Row 2: Program — name already contains the full "code - name" string
     (e.g. "310100000000 - Fisheries Development Program"), no separate code column */
  items.push({ desc: d.programName || BLANK, color: '#474747', indent: 1, amt: '', gap: 160 });

  /* Row 3: Project Category — show <-blank-> when the record has none
     (a sub-category can attach directly to a Program with no category) */
  items.push({ desc: d.projectCategoryName || BLANK, color: '#474747', indent: 2, amt: '', gap: 0 });

  /* Row 4: Project Sub-Category */
  items.push({ desc: d.projectSubCategoryName || BLANK, color: '#474747', indent: 3, amt: '', gap: 0 });

  /* Row 5: Expense Class — id - code - name, e.g. "2 - MOOE - Maintenance and Other Operating Expenses" */
  const line5 = [d.expenseClassId, d.expenseClassCode, d.expenseClassName]
    .filter(v => v !== null && v !== undefined && v !== '')
    .join(' - ');
  items.push({ desc: line5 || BLANK, color: '#474747', indent: 4, amt: '', gap: 0 });

  /* Row 6: Account Code + description. If a sub-account exists, its code
     is inserted right after the account code, and its description is
     appended at the end:
       no sub-account:   "5-02-05-020 - Telephone Expenses"
       with sub-account: "5-02-05-020 - 01 - Telephone Expenses - Mobile"
     The peso amount always lands on this row. */
  const acctParts = [d.accountCode];
  if (d.subAccountCode) acctParts.push(d.subAccountCode);
  acctParts.push(d.accountDesc);
  let line6 = acctParts.filter(Boolean).join(' - ');
  if (d.subAccountDesc) line6 += ' - ' + d.subAccountDesc;
  items.push({ desc: line6 || BLANK, color: '#353535', indent: 4, amt: amtStr, gap: 0 });

  return items;
}

/* ── Status banner (loading / error) ── */
function showStatusBanner(msg, type) {
  hideStatusBanner();
  const b = document.createElement('div');
  b.id = 'ors-status-banner';
  const styles = {
    info:  { bg:'#eef6ff', border:'#b6d4fe', color:'#0a3d6b' },
    error: { bg:'#fdecea', border:'#f5c2c0', color:'#7a1712' }
  };
  const s = styles[type] || styles.info;
  b.style.cssText = `max-width:8.5in;margin:0 auto 10px;padding:10px 16px;background:${s.bg};border:1px solid ${s.border};border-radius:6px;font:13px Arial,sans-serif;color:${s.color};text-align:center;`;
  b.textContent = msg;
  document.body.insertBefore(b, document.body.firstChild);
}
function hideStatusBanner() {
  const old = document.getElementById('ors-status-banner');
  if (old) old.remove();
}

/* ── Toolbar actions ── */

/* Print button just triggers the browser's native print dialog — the
   @page CSS rule already forces 8.5in x 13in output, and #toolbar is
   hidden in print, so this doubles as "Save as PDF" via the dialog's
   destination picker. */
// (Print button calls window.print() directly — no wrapper needed.)

/* Back button: this page is normally opened in a new tab via
   window.open() from Obligation Records (see printORS() in
   obligations.js). Closing that tab returns focus to the original tab,
   which still has the table exactly as the user left it. If there's no
   opener (e.g. the page was opened directly via URL/bookmark), fall
   back to navigating to the records page instead. */
function goBackToRecords() {
  if (window.opener && !window.opener.closed) {
    window.close();
  } else {
    window.location.href = 'obligations.html';
  }
}

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

/* ── Sync Responsibility Center column width to ORS No./Payee table width,
      and lock Certified Box A/B and the signature boxes to follow the
      actual Responsibility Center + Particulars / Fund Category + Amount
      widths, so the vertical divider stays one continuous line all the
      way down the form ── */
function syncRespWidth() {
  const infoTbl  = document.getElementById('info-tbl');
  const mainTbl  = document.querySelector('.main-tbl');
  const certWrap = document.querySelector('.cert-wrap');
  const certA    = document.querySelector('.cert-a');
  const certB    = document.querySelector('.cert-b');
  const sigL     = document.querySelector('.sig-l');
  const sigR     = document.querySelector('.sig-r');
  const col1 = document.getElementById('col-resp');
  const col2 = document.getElementById('col-part');
  const col3 = document.getElementById('col-fund');
  const col4 = document.getElementById('col-amt');
  if (!infoTbl || !mainTbl || !col1) return;

  /* reset so mainTbl.offsetWidth reflects full container width */
  col1.style.width = '11%';
  col2.style.width = '31%';
  col3.style.width = '42.5%';
  col4.style.width = '15.5%';
  if (certA) certA.style.flex = '0 0 45%';
  if (certB) certB.style.flex = '0 0 55%';
  if (sigL)  sigL.style.flex  = '0 0 45%';
  if (sigR)  sigR.style.flex  = '0 0 55%';

  const lblCell = document.querySelector('#info-tbl .lbl');
  lblCell.style.minWidth = '';
  const totalWidth = mainTbl.offsetWidth;

  /* Responsibility Center: stays at its natural width (sized to fit the
     ORS NO./PAYEE label) — unchanged */
  const respWidth = lblCell.offsetWidth;

  /* Amount: stays fixed at 15.5% of the table — unchanged */
  const col4Width = Math.round(totalWidth * 0.155);

  /* Midline target (Box A ≈ 45%, Box B ≈ 55%), used to size Particulars */
  const midline = certWrap ? certWrap.offsetWidth * 0.45 : totalWidth * 0.45;

  /* Particulars is the "filler" that completes Box A:
     Responsibility Center + Particulars ≈ midline */
  const col2Width = Math.round(midline - respWidth);

  /* Fund Category is the "filler" that completes Box B:
     Fund Category + Amount = everything right of the midline */
  const col3Width = Math.round((totalWidth - midline) - col4Width);

  col1.style.width = respWidth + 'px';
  col2.style.width = col2Width + 'px';
  col3.style.width = col3Width + 'px';
  col4.style.width = col4Width + 'px';

  /* Certified Box A / signature left box now FOLLOW Responsibility Center
     + Particulars (not the other way around) — their width is locked to
     exactly match them, so it stays correct even if the label text later
     changes length. The right-hand boxes simply take whatever remains. */
  const boxAWidth = respWidth + col2Width;
  if (certA && certB) {
    certA.style.flex = `0 0 ${boxAWidth}px`;
    certB.style.flex = `0 0 ${totalWidth - boxAWidth}px`;
  }
  if (sigL && sigR) {
    sigL.style.flex = `0 0 ${boxAWidth}px`;
    sigR.style.flex = `0 0 ${totalWidth - boxAWidth}px`;
  }
}

/* ── Init ── */
renderFund();
syncRespWidth();
syncRowHeights();
window.addEventListener('load', () => { syncRespWidth(); syncRowHeights(); });
window.addEventListener('resize', () => { syncRespWidth(); syncRowHeights(); });

const _obligationId = getIdFromQuery();
if (_obligationId) {
  loadObligationData(_obligationId);
} else {
  showStatusBanner('No obligation specified — open this page via the Print button in Obligation Records.', 'error');
}

/* Sync textarea heights to fund-list on resize */
const ro = new ResizeObserver(() => {
  const fh = document.getElementById('fund-cell').offsetHeight;
  document.getElementById('resp-center').style.minHeight  = (fh - 8) + 'px';
  document.getElementById('particulars').style.minHeight  = (fh - 8) + 'px';
  syncRowHeights();
});
ro.observe(document.getElementById('fund-list'));