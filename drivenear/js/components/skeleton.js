/* DriveNear — js/components/skeleton.js */

/* ---------------- SKELETON ---------------- */
function skeletonCard(){
  return `<div class="bg-white rounded-2xl border border-line overflow-hidden">
    <div class="skeleton h-44 w-full"></div>
    <div class="p-4 space-y-2">
      <div class="skeleton h-4 w-3/4 rounded"></div>
      <div class="skeleton h-3 w-1/2 rounded"></div>
      <div class="skeleton h-8 w-full rounded-xl mt-2"></div>
    </div>
  </div>`;
}
