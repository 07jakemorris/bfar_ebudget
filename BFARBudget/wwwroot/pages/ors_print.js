/* ════════════════════════════════════════════
   ORS PRINT — multi-page renderer

   One ORS number can cover several `obligations` rows: a consolidated
   obligation across multiple Responsibility Centers, and/or one RC
   carrying several account codes. This page fetches every row sharing
   the ORS number, lays them out as one continuous Fund Category /
   Amount table, and splits that table across as many physical 8.5x13in
   "papers" as it takes — measured against the real rendered DOM, not
   estimated, so it adapts to whatever actually fits.
   ════════════════════════════════════════════ */

const PAGE_HEIGHT_PX = 13 * 96;   // CSS "in" is a fixed 96px/in, spec-guaranteed
const PAGE_SAFETY_MARGIN_PX = 14; // small buffer so we never sail exactly to the edge

/* ── Query param handling ── */
function getQueryParam(name) {
  return new URLSearchParams(window.location.search).get(name);
}

function formatPeso(n) {
  const num = Number(n);
  if (isNaN(num)) return '';
  return num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
}

/* ── Fetch ── */
async function fetchJson(url) {
  const res = await fetch(url);
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.error || `Request failed (${res.status})`);
    err.status = res.status;
    throw err;
  }
  return res.json();
}

async function loadAndRender() {
  showStatusBanner('Loading obligation data…', 'info');
  try {
    const orsNo = getQueryParam('ors');
    const id    = getQueryParam('id'); // legacy fallback

    let rows;
    if (orsNo) {
      rows = await fetchJson(`/api/obligations/by-ors-no/${encodeURIComponent(orsNo)}`);
    } else if (id) {
      const single = await fetchJson(`/api/obligations/${encodeURIComponent(id)}`);
      rows = [single];
    } else {
      showStatusBanner('No obligation specified — open this page via the Print button in Obligation Records.', 'error');
      return;
    }

    if (!Array.isArray(rows) || rows.length === 0) {
      showStatusBanner('Obligation record not found.', 'error');
      return;
    }

    renderDocument(rows);
    hideStatusBanner();
  } catch (err) {
    if (err.status === 404) {
      showStatusBanner('Obligation record not found.', 'error');
    } else {
      showStatusBanner('Could not load obligation data: ' + err.message, 'error');
    }
  }
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
function goBackToRecords() {
  if (window.opener && !window.opener.closed) {
    window.close();
  } else {
    window.location.href = 'obligations.html';
  }
}

/* ════════════════════════════════════════════
   BUILD WORK ITEMS
   Each obligation row becomes one "work item": its 6-line Fund Category
   hierarchy, plus an RC label and a Particulars label that are only
   shown when they differ from the immediately preceding row. That one
   rule naturally handles both real-world cases:
     - Consolidated (3 RCs, 1 account code each): RC label shows on
       every row since the RC changes each time.
     - One RC, several account codes: RC label shows once (first row),
       then blank for the rest since the RC repeats.
   ════════════════════════════════════════════ */
const COLORS = { fund: '#353535', program: '#353535', rest: '#353535' };

function buildFundLinesForRow(d) {
  const amtStr = formatPeso(d.amount);
  const BLANK = '<-blank->';
  const lines = [];

  lines.push({ desc: ([d.fundCategory].filter(Boolean).join(' - ')) || BLANK, color: COLORS.fund, indent: 0, amt: '' });
  lines.push({ desc: d.programName || BLANK, color: COLORS.program, indent: 1, amt: '' });
  lines.push({ desc: d.projectCategoryName || BLANK, color: COLORS.rest, indent: 2, amt: '' });
  lines.push({ desc: d.projectSubCategoryName || BLANK, color: COLORS.rest, indent: 3, amt: '' });

  const expClassLabel = [d.expenseClassId, d.expenseClassCode, d.expenseClassName]
    .filter(v => v !== null && v !== undefined && v !== '')
    .join(' - ');
  lines.push({ desc: expClassLabel || BLANK, color: COLORS.rest, indent: 4, amt: '' });

  const acctParts = [d.accountCode];
  if (d.subAccountCode) acctParts.push(d.subAccountCode);
  acctParts.push(d.accountDesc);
  let acctLabel = acctParts.filter(Boolean).join(' - ');
  if (d.subAccountDesc) acctLabel += ' - ' + d.subAccountDesc;
  lines.push({ desc: acctLabel || BLANK, color: COLORS.rest, indent: 4, amt: amtStr });

  return lines;
}

function buildWorkItems(rows) {
  return rows.map(d => ({
    rcRaw: (d.rcCode || d.rcName || ''),
    particularsRaw: d.particulars || '',
    fundLines: buildFundLinesForRow(d),
    amount: Number(d.amount) || 0,
  }));
}

/* ════════════════════════════════════════════
   PAPER SKELETON
   Builds one empty "paper" (header + title + date + ORS/Payee box +
   main table shell with empty row-lists). Header fields are shared
   across every page of the same document, so they're rendered as
   plain read-only text here rather than editable inputs.
   ════════════════════════════════════════════ */
function createPaperSkeleton(doc) {
  const paper = document.createElement('div');
  paper.className = 'ors-paper';

  paper.innerHTML = `
    <div class="agency-header">
      <div class="logo-wrap"><img src="bfar_logo.png" alt="BFAR Logo"></div>
      <div class="agency-text">
        <div class="agency-da">Department of Agriculture</div>
        <div class="agency-bfar">BUREAU OF FISHERIES AND AQUATIC RESOURCES</div>
        <div class="agency-addr">
          SMED Center, Senator Enage St. Brgy 1&amp; 4 Tacloban City<br>
          Tel. No. (053) 321-3152/ 321-7439 &nbsp;&nbsp; Telefax No. (053) 321-1732
        </div>
      </div>
    </div>

    <div class="title-bar">
      <span class="title">OBLIGATION REQUEST AND STATUS</span>
      <span class="tm">™</span>
    </div>

    <div class="date-row">
      Date <span class="date-value"></span>
    </div>

    <table class="info-tbl">
      <tr>
        <td class="lbl">ORS&nbsp;&nbsp;NO.&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;</td>
        <td class="val"><span class="val-text ors-no-text"></span></td>
      </tr>
      <tr>
        <td class="lbl">PAYEE</td>
        <td class="val"><span class="val-text payee-text"></span></td>
      </tr>
    </table>

    <table class="main-tbl">
      <colgroup>
        <col class="col-resp"><col class="col-part"><col class="col-fund"><col class="col-amt">
      </colgroup>
      <thead>
        <tr>
          <th>Responsibility<br>Center</th>
          <th>Particulars</th>
          <th>Fund Category</th>
          <th>Amount</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td class="cell-rc"><div class="rc-list"></div></td>
          <td class="cell-parts"><div class="parts-list"></div></td>
          <td class="fund-cell"><div class="fund-list"></div></td>
          <td class="cell-amount"><div class="amount-list"></div></td>
        </tr>
      </tbody>
    </table>
  `;

  paper.querySelector('.date-value').textContent   = doc.orsDate || '';
  paper.querySelector('.ors-no-text').textContent  = doc.orsNo || '';
  paper.querySelector('.payee-text').textContent   = doc.payee || '';

  return paper;
}

/* Appends one work item's rows into a paper's four parallel lists.
   showRc/showParticulars are decided by the caller (renderDocument),
   which tracks a fresh "previous row" state per page — so a page that
   starts mid-RC-group (because the group spilled across a page break)
   still shows its RC label at the top, instead of leaving it blank. */
function appendWorkItem(paper, item, showRc, showParticulars) {
  const rcList   = paper.querySelector('.rc-list');
  const partList = paper.querySelector('.parts-list');
  const fundList = paper.querySelector('.fund-list');
  const amtList  = paper.querySelector('.amount-list');

  const tagId = 'wi-' + Math.random().toString(36).slice(2);

  item.fundLines.forEach((line, i) => {
    // RC row
    const rcRow = document.createElement('div');
    rcRow.className = 'rc-row';
    rcRow.dataset.wi = tagId;
    rcRow.textContent = (i === 0 && showRc) ? item.rcRaw : '';
    rcList.appendChild(rcRow);

    // Particulars row
    const partRow = document.createElement('div');
    partRow.className = 'parts-row';
    partRow.dataset.wi = tagId;
    partRow.textContent = (i === 0 && showParticulars) ? item.particularsRaw : '';
    partList.appendChild(partRow);

    // Fund Category row
    const fi = document.createElement('div');
    fi.className = 'fi';
    fi.dataset.wi = tagId;
    const inner = document.createElement('div');
    inner.className = 'fi-inner';
    inner.style.paddingLeft = (line.indent * 13) + 'px';
    const desc = document.createElement('span');
    desc.className = 'fi-desc';
    desc.style.color = line.color;
    desc.textContent = line.desc;
    inner.appendChild(desc);
    fi.appendChild(inner);
    fundList.appendChild(fi);

    // Amount row
    const ar = document.createElement('div');
    ar.className = 'amt-row';
    ar.dataset.wi = tagId;
    const phpLabel = document.createElement('span');
    phpLabel.className = 'amt-php-label';
    phpLabel.textContent = 'Php';
    phpLabel.style.visibility = line.amt ? 'visible' : 'hidden';
    const amtSpan = document.createElement('span');
    amtSpan.className = 'fi-amt';
    amtSpan.textContent = line.amt;
    ar.appendChild(phpLabel);
    ar.appendChild(amtSpan);
    amtList.appendChild(ar);
  });

  return tagId;
}

function removeWorkItemByTag(paper, tagId) {
  paper.querySelectorAll(`[data-wi="${tagId}"]`).forEach(el => el.remove());
}

/* ════════════════════════════════════════════
   ROW HEIGHT SYNC
   Responsibility Center, Particulars, Fund Category, and Amount are
   four independently-flowing lists, but line i in each one must line
   up with line i in the others (this is what keeps the peso amount
   sitting on the same line as its Account Code, not drifting when a
   Program name or Particulars text wraps to two lines). Reset first,
   measure natural height per line, then force all four to the tallest
   of the four at that line.
   ════════════════════════════════════════════ */
function syncRowHeights(paper) {
  const rcRows   = paper.querySelectorAll('.rc-row');
  const partRows = paper.querySelectorAll('.parts-row');
  const fiRows   = paper.querySelectorAll('.fi');
  const amtRows  = paper.querySelectorAll('.amt-row');
  const n = fiRows.length;

  for (let i = 0; i < n; i++) {
    [rcRows[i], partRows[i], fiRows[i], amtRows[i]].forEach(el => {
      if (el) el.style.minHeight = '';
    });
  }
  for (let i = 0; i < n; i++) {
    const group = [rcRows[i], partRows[i], fiRows[i], amtRows[i]].filter(Boolean);
    const maxH = Math.max(...group.map(el => el.getBoundingClientRect().height));
    group.forEach(el => { el.style.minHeight = maxH + 'px'; });
  }
}

/* ════════════════════════════════════════════
   COLUMN WIDTH SYNC
   Responsibility Center + Particulars together make up "Box A" (they
   sit above the Certified A checkbox block); Fund Category + Amount
   make up "Box B". The vertical divider between Particulars and Fund
   Category should land exactly on the same line as the divider between
   Certified Box A and Box B below it. Only the page carrying the
   Certification block has anything to line up with — other pages fall
   back to the static percentages already in the CSS.
   ════════════════════════════════════════════ */
function syncPaperWidths(paper) {
  const mainTbl  = paper.querySelector('.main-tbl');
  const certWrap = paper.querySelector('.cert-wrap');
  const certA    = paper.querySelector('.cert-a');
  const certB    = paper.querySelector('.cert-b');
  const sigL     = paper.querySelector('.sig-l');
  const sigR     = paper.querySelector('.sig-r');
  const col1 = paper.querySelector('.col-resp');
  const col2 = paper.querySelector('.col-part');
  const col3 = paper.querySelector('.col-fund');
  const col4 = paper.querySelector('.col-amt');
  if (!mainTbl || !col1) return;

  // Reset to the static fallback (matches the CSS defaults) so measurements
  // below reflect natural sizing, not a stale forced width from before.
  col1.style.width = '13%';
  col2.style.width = '29%';
  col3.style.width = '42.5%';
  col4.style.width = '15.5%';
  if (certA) certA.style.flex = '0 0 45%';
  if (certB) certB.style.flex = '0 0 55%';
  if (sigL)  sigL.style.flex  = '0 0 45%';
  if (sigR)  sigR.style.flex  = '0 0 55%';

  if (!certWrap) return; // nothing to align to on this page — keep the static split

  const totalWidth = mainTbl.offsetWidth;
  const midline    = certWrap.offsetWidth * 0.45;
  const col4Width  = Math.round(totalWidth * 0.155);
  const col1Width  = Math.round(totalWidth * 0.13);
  const col2Width  = Math.round(midline - col1Width);
  const col3Width  = Math.round((totalWidth - midline) - col4Width);

  col1.style.width = col1Width + 'px';
  col2.style.width = col2Width + 'px';
  col3.style.width = col3Width + 'px';
  col4.style.width = col4Width + 'px';

  const boxAWidth = col1Width + col2Width;
  if (certA) certA.style.flex = `0 0 ${boxAWidth}px`;
  if (certB) certB.style.flex = `0 0 ${totalWidth - boxAWidth}px`;
  // Signature box always ships together with the Certification block
  // (both added by appendClosingBlock), so it follows the exact same line.
  if (sigL) sigL.style.flex = `0 0 ${boxAWidth}px`;
  if (sigR) sigR.style.flex = `0 0 ${totalWidth - boxAWidth}px`;
}

/* ════════════════════════════════════════════
   TOTAL ROW + CERTIFICATION + SIGNATURE
   Appears exactly once, on the true final page — added to the main
   table as a total row, plus the cert and signature blocks after it.
   ════════════════════════════════════════════ */
function appendClosingBlock(paper, grandTotal) {
  const tbody = paper.querySelector('.main-tbl tbody');

  const totalRow = document.createElement('tr');
  totalRow.className = 'total-row';
  totalRow.innerHTML = `
    <td colspan="3"></td>
    <td class="td-grand">
      <span class="td-grand-php">Php</span>
      <span class="td-grand-value"></span>
    </td>
  `;
  totalRow.querySelector('.td-grand-value').textContent = formatPeso(grandTotal);
  tbody.appendChild(totalRow);

  const certWrap = document.createElement('div');
  certWrap.className = 'cert-wrap';
  certWrap.innerHTML = `
    <div class="cert-a">
      <div class="cert-hdr">A. Certified:</div>
      <div class="cert-item">
        <input type="checkbox" id="ca1">
        <label for="ca1">Charges to appropriation/allotment necessary, lawful and under my direct supervision</label>
      </div>
      <div class="cert-item">
        <input type="checkbox" id="ca2">
        <label for="ca2">Supporting Documents valid, proper and legal</label>
      </div>
    </div>
    <div class="cert-b">
      <div class="cert-hdr">B. Certified:</div>
      <div class="cert-item">
        <input type="checkbox" id="cb1">
        <label for="cb1">Allotment available and obligated for the purpose as indicated above</label>
      </div>
    </div>
  `;
  paper.appendChild(certWrap);

  const sigWrap = document.createElement('div');
  sigWrap.className = 'sig-wrap';
  sigWrap.innerHTML = `
    <div class="sig-l">
      <div class="sig-name"><input type="text" id="sig1n" value=""></div>
      <div class="sig-pos"><input type="text" id="sig1p" value=""></div>
    </div>
    <div class="sig-r">
      <div class="sig-name"><input type="text" id="sig2n" value="KARLEEN R. DESTURA"></div>
      <div class="sig-pos"><input type="text" id="sig2p" value="OIC, Budget Section"></div>
    </div>
  `;
  paper.appendChild(sigWrap);

  return { totalRow, certWrap, sigWrap };
}

function removeClosingBlock(paper, refs) {
  refs.totalRow.remove();
  refs.certWrap.remove();
  refs.sigWrap.remove();
}

function fitsOnPage(paper) {
  return paper.getBoundingClientRect().height <= (PAGE_HEIGHT_PX - PAGE_SAFETY_MARGIN_PX);
}

/* ════════════════════════════════════════════
   MAIN PAGINATION
   Greedily fills each paper with whole work-items (a work item's 6
   fund-lines are never split across pages) until the next one would
   overflow, then starts a new paper. Once every item is placed, the
   total/cert/signature block is attached to the last paper — but if
   that would overflow the page, it's moved onto a fresh final page
   instead, so it's never silently clipped.
   ════════════════════════════════════════════ */
function renderDocument(rows) {
  const doc = rows[0]; // shared header fields: same ORS No / Date / Payee for every row
  const items = buildWorkItems(rows);
  const grandTotal = rows.reduce((sum, r) => sum + (Number(r.amount) || 0), 0);

  const root = document.getElementById('papers-root');
  root.innerHTML = '';

  const papers = [];
  let remaining = [...items];

  while (remaining.length > 0) {
    const paper = createPaperSkeleton(doc);
    paper.classList.add('measuring');
    root.appendChild(paper);
    syncPaperWidths(paper);

    // Fresh per-page label state: the first item placed on any page
    // always shows its RC/Particulars label, even if it's a straight
    // continuation of the same group from the previous page.
    let pagePrevRc = null, pagePrevParticulars = null;
    let placedCount = 0;

    for (let i = 0; i < remaining.length; i++) {
      const item = remaining[i];
      const showRc = item.rcRaw !== pagePrevRc;
      const showParticulars = !(item.rcRaw === pagePrevRc && item.particularsRaw === pagePrevParticulars);

      const tagId = appendWorkItem(paper, item, showRc, showParticulars);
      syncRowHeights(paper);

      if (!fitsOnPage(paper) && placedCount > 0) {
        // Doesn't fit, and we've already placed at least one item on
        // this page — undo, leave the rest for the next page.
        removeWorkItemByTag(paper, tagId);
        syncRowHeights(paper);
        break;
      }
      // Doesn't fit even as the very first item on an empty page
      // (unusually long single record) — keep it anyway rather than
      // lose data; the page will just print slightly oversized.

      pagePrevRc = item.rcRaw;
      pagePrevParticulars = item.particularsRaw;
      placedCount++;
    }

    if (placedCount === 0) {
      // Should be unreachable (guarded above), but never loop forever.
      placedCount = 1;
    }

    paper.classList.remove('measuring');
    remaining = remaining.slice(placedCount);
    papers.push(paper);
  }

  // Attach the closing block to the last paper; bump to a fresh page
  // if it doesn't fit alongside that page's data.
  const lastPaper = papers[papers.length - 1];
  lastPaper.classList.add('measuring');
  let refs = appendClosingBlock(lastPaper, grandTotal);
  syncPaperWidths(lastPaper);   // now cert-aware — divider locks to Certified A/B
  syncRowHeights(lastPaper);    // column widths changed, so re-check line wrapping
  if (!fitsOnPage(lastPaper)) {
    removeClosingBlock(lastPaper, refs);
    lastPaper.classList.remove('measuring');
    syncPaperWidths(lastPaper); // back to static fallback, no cert on this page
    syncRowHeights(lastPaper);

    const finalPaper = createPaperSkeleton(doc);
    finalPaper.classList.add('measuring');
    root.appendChild(finalPaper);
    appendClosingBlock(finalPaper, grandTotal);
    syncPaperWidths(finalPaper);
    finalPaper.classList.remove('measuring');
    papers.push(finalPaper);
  } else {
    lastPaper.classList.remove('measuring');
  }

  // Page tags (screen only — hidden in print via CSS)
  papers.forEach((p, i) => {
    const tag = document.createElement('div');
    tag.className = 'page-tag';
    tag.textContent = `Page ${i + 1} of ${papers.length}`;
    p.appendChild(tag);
  });
}

/* ── Init ── */
loadAndRender();



