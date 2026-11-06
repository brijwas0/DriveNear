/* DriveNear — js/components/navbar.js */

/* ---------------- LAYOUT: NAVBAR ---------------- */
const NAV_LINKS = [
  {label:'Find Cars', path:'#/cars'},
  {label:'How It Works', path:'#/how-it-works'},
  {label:'List Your Car', path:'#/list-your-car'},
  {label:'Safety', path:'#/safety'}
];
let mobileMenuOpen = false;

function navbar(){
  const logged = !!state.user;
  const adminAllowed = !!state.user?.isAdmin;
  const navLinks = [...NAV_LINKS, ...(logged ? [{label:'My Bookings / Tracker', path:'#/my-bookings'}, {label:'My Listed Cars', path:'#/my-cars'}] : []), ...(adminAllowed ? [{label:'Admin Dashboard', path:'#/admin'}] : [])];
  return `
  <header id="navbar" class="sticky top-0 z-40 border-b border-line bg-sand/90 backdrop-blur transition-shadow">
    <div class="max-w-7xl mx-auto px-5 lg:px-8 h-16 flex items-center justify-between">
      <a href="#/" class="flex items-center gap-2 shrink-0" aria-label="DriveNear home">
        <span class="w-9 h-9 rounded-xl bg-brand text-white flex items-center justify-center display font-bold">D</span>
        <span class="display text-lg font-bold tracking-tight">DriveNear</span>
      </a>
      <nav class="hidden lg:flex items-center gap-7" aria-label="Primary">
        ${navLinks.map(l=>`<a href="${l.path}" class="text-sm font-medium ${l.path==='#/admin'?'text-brand font-semibold flex items-center gap-1':'text-ink/70 hover:text-ink'} transition-colors">${l.path==='#/admin'?'🛡️ ':''}${l.label}</a>`).join('')}
      </nav>
      <div class="hidden lg:flex items-center gap-3">
        ${logged ? `
          <button onclick="toggleNotifications(event)" class="relative w-10 h-10 rounded-full border border-line flex items-center justify-center hover:bg-white transition-colors" aria-label="Notifications">
            ${ICO.bell}<span class="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-danger"></span>
          </button>
          <a href="#/profile" class="flex items-center gap-2 pl-2 pr-3 py-1.5 rounded-full border border-line hover:bg-white transition-colors" title="${state.user.name||'User'}">
            ${getUserAvatar(state.user, 'w-7 h-7')}
            <span class="text-sm font-semibold max-w-[100px] truncate">${(state.user.name||'User').split(' ')[0]}</span>
          </a>
        ` : `
          <button onclick="openModal('login')" class="text-sm font-semibold px-4 py-2 rounded-full hover:bg-white transition-colors">Log In</button>
          <button onclick="openModal('login')" class="btn btn-primary text-sm font-semibold px-4 py-2 rounded-full">Sign Up</button>
        `}
        <a href="#/list-your-car" class="btn btn-primary text-sm font-semibold px-4 py-2.5 rounded-full">+ List Car</a>
      </div>
      <button class="lg:hidden w-10 h-10 flex items-center justify-center" onclick="toggleMobileMenu()" aria-label="Menu">${ICO.menu}</button>
    </div>
    <div id="mobile-menu" class="lg:hidden ${mobileMenuOpen?'':'hidden'} border-t border-line bg-white">
      <div class="px-5 py-4 flex flex-col gap-1">
        ${navLinks.map(l=>`<a href="${l.path}" onclick="toggleMobileMenu()" class="py-2.5 text-sm font-medium border-b border-line/70 flex items-center gap-2">${l.path==='#/admin'?'🛡️ ':''}${l.label}</a>`).join('')}
        <div class="flex gap-3 mt-3">
          ${logged ? `<a href="#/profile" class="flex-1 text-center btn btn-primary text-sm font-semibold px-4 py-2.5 rounded-full">Profile</a>`
          : `<button onclick="openModal('login')" class="flex-1 text-sm font-semibold px-4 py-2.5 rounded-full border border-line">Log In</button>`}
          <a href="#/list-your-car" class="flex-1 text-center btn btn-primary text-sm font-semibold px-4 py-2.5 rounded-full">+ List Car</a>
        </div>
      </div>
    </div>
  </header>`;
}
function toggleMobileMenu(){ mobileMenuOpen = !mobileMenuOpen; document.getElementById('mobile-menu').classList.toggle('hidden'); }

let notifOpen = false;
function toggleNotifications(e){ e.stopPropagation(); notifOpen = !notifOpen; renderNotifDropdown(); }
function renderNotifDropdown(){
  let el = document.getElementById('notif-dropdown-root');
  if(!el) return;
  el.innerHTML = !notifOpen ? '' : `
    <div class="dropdown-anim absolute right-5 lg:right-24 top-16 w-[340px] bg-white rounded-2xl border border-line shadow-lift z-50 overflow-hidden">
      <div class="px-4 py-3 border-b border-line font-semibold text-sm display">Notifications</div>
      <div class="max-h-80 overflow-y-auto">
        ${NOTIFICATIONS.map(n=>`
          <div class="px-4 py-3 flex gap-3 border-b border-line/60 hover:bg-sand transition-colors">
            <span class="text-lg">${n.icon}</span>
            <div class="flex-1"><p class="text-sm">${n.text}</p><p class="text-xs text-muted mt-0.5">${n.time}</p></div>
          </div>`).join('')}
      </div>
    </div>`;
}
document.addEventListener('click', ()=>{ if(notifOpen){ notifOpen=false; renderNotifDropdown(); } });
