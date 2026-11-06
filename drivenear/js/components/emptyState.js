/* DriveNear — js/components/emptyState.js */

/* ---------------- EMPTY STATE ---------------- */
function emptyState(icon, title, sub, ctaLabel, ctaPath){
  return `
  <div class="flex flex-col items-center text-center py-20 px-6">
    <div class="w-20 h-20 rounded-3xl bg-brand-light text-brand flex items-center justify-center text-4xl mb-5">${icon}</div>
    <h3 class="display text-xl font-bold mb-2">${title}</h3>
    <p class="text-muted text-sm max-w-sm mb-6">${sub}</p>
    ${ctaLabel?`<a href="${ctaPath}" class="btn btn-primary text-sm font-semibold px-6 py-3 rounded-full">${ctaLabel}</a>`:''}
  </div>`;
}
