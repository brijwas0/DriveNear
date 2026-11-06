/* DriveNear — js/components/bottomNav.js */

/* ---------------- BOTTOM NAV (mobile) ---------------- */
function bottomNav(){
  const isOwner = state.user && state.user.mode==='owner';
  const items = isOwner ? [
    {icon:ICO.wallet, label:'Dashboard', path:'#/owner/dashboard'},
    {icon:ICO.car, label:'Cars', path:'#/owner/cars'},
    {icon:ICO.trip, label:'Calendar', path:'#/owner/calendar'},
    {icon:ICO.user, label:'Profile', path:'#/profile'},
  ] : [
    {icon:ICO.home, label:'Home', path:'#/'},
    {icon:ICO.search, label:'Search', path:'#/cars'},
    {icon:ICO.heart, label:'Saved', path:'#/saved'},
    {icon:ICO.trip, label:'Trips', path:'#/dashboard'},
    {icon:ICO.user, label:'Profile', path:'#/profile'},
  ];
  return `
  <nav class="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white border-t border-line grid" style="grid-template-columns:repeat(${items.length},1fr)">
    ${items.map(it=>`
      <a href="${it.path}" class="flex flex-col items-center justify-center gap-0.5 py-2.5 text-ink/60 ${state.route===it.path?'text-brand':''}">
        ${it.icon}<span class="text-[10px] font-medium">${it.label}</span>
      </a>`).join('')}
  </nav>`;
}
