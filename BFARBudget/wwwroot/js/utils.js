/* =========================================
   utils.js — Shared utility functions
   Used by obligations, earmarking, manage.
   Include after nav.js on every page.
   ========================================= */

/** Toggle visibility of an element by ID */
function toggleEl(id) {
  document.getElementById(id).classList.toggle('hidden');
}

/** Delete the table row containing the clicked button */
function delRow(btn) {
  if (!confirm('Delete this record?')) return;
  btn.closest('tr').remove();
}
