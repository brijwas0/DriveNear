/* DriveNear — js/pages/saved.js */

/* ---------------- SAVED CARS ---------------- */
function pageSavedInner(){
  const saved = CARS.filter(c=>state.favorites.has(c.id));
  if(!saved.length) return emptyState('🤍','Your dream cars will appear here','Save cars you like while browsing so you can compare and book them later.','Explore Cars','#/cars');
  return `<div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">${saved.map(c=>carCardGrid(c)).join('')}</div>`;
}
function pageSaved(){
  return `<section class="max-w-6xl mx-auto px-5 lg:px-8 py-8 pb-24 lg:pb-8">
    <h1 class="display text-2xl sm:text-3xl font-bold mb-6">Saved Cars</h1>
    ${pageSavedInner()}
  </section>`;
}
