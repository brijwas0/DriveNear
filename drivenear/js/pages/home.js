/* DriveNear — js/pages/home.js */

/* =========================================================
   PAGE: HOME
   ========================================================= */
function pageHome(){
  const nearby = CARS.slice(0,8);
  return `
  ${state.siteSettings?.announcement ? `<div class="bg-brand text-white text-center px-5 py-3 text-sm font-semibold">📢 ${esc(state.siteSettings.announcement)}</div>` : ''}
  ${state.siteSettings?.maintenance ? `<div class="bg-amber-50 text-amber-900 border-b border-amber-200 text-center px-5 py-3 text-sm font-semibold">⚠️ Website is in maintenance mode. Booking availability may be limited.</div>` : ''}
  <section class="relative overflow-hidden bg-hero-grid">
    <div class="max-w-7xl mx-auto px-5 lg:px-8 pt-14 pb-28 lg:pt-20 lg:pb-40 grid lg:grid-cols-2 gap-10 items-center">
      <div>
        <span class="inline-flex items-center gap-2 bg-brand-light text-brand-ink text-xs font-semibold px-3 py-1.5 rounded-full mb-6">${ICO.pin} Now live across 40+ Indian cities</span>
        <h1 class="display text-4xl sm:text-5xl lg:text-[3.4rem] font-bold leading-[1.08] tracking-tight">Your next car is closer than you think.</h1>
        <p class="text-muted text-lg mt-5 max-w-lg">Rent trusted cars from people near you — or earn from your own car when you're not using it.</p>
        <div class="flex flex-wrap gap-3 mt-8">
          <a href="#/cars" class="btn btn-primary font-semibold px-6 py-3.5 rounded-full">Find a Car</a>
          <a href="#/list-your-car" class="btn font-semibold px-6 py-3.5 rounded-full border border-line bg-white hover:border-ink/30">List Your Car</a>
        </div>
        <div class="flex items-center gap-3 mt-10 text-sm text-muted">
          <span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-brand"></span> Real owner listings</span>
          <span class="inline-flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-brand"></span> City-based discovery</span>
        </div>
      </div>
      <div class="relative h-[380px] lg:h-[460px]">
        <svg class="absolute inset-0 w-full h-full pointer-events-none" viewBox="0 0 400 400" fill="none">
          <path id="routepath" d="M60,320 C140,340 160,120 320,90" stroke="#0E7C5A" stroke-width="2.5" class="route-dash" opacity="0.5"/>
          <circle r="5" fill="#0E7C5A" class="route-dot" style="offset-path:path('M60,320 C140,340 160,120 320,90')"></circle>
        </svg>
        <div class="absolute inset-6 lg:inset-10 rounded-3xl overflow-hidden shadow-lift bg-sand">
          ${window.DN?.enabled?.() ? ((CARS.find(c=>c.image || c.gallery?.some(Boolean))?.image || CARS.find(c=>c.gallery?.some(Boolean))?.gallery?.find(Boolean)) ? `<img src="${CARS.find(c=>c.image || c.gallery?.some(Boolean))?.image || CARS.find(c=>c.gallery?.some(Boolean))?.gallery?.find(Boolean)}" alt="Car listed on DriveNear" class="w-full h-full object-cover">` : `<div class="w-full h-full flex items-center justify-center text-muted text-sm">Real car photos appear here when owners upload them.</div>`) : `<div class="w-full h-full flex items-center justify-center text-muted text-sm">DriveNear car listings</div>`}
        </div>
      </div>
    </div>
  </section>

  <section class="max-w-5xl mx-auto px-5 -mt-16 lg:-mt-24 relative z-10">
    <div class="bg-white rounded-3xl shadow-lift border border-line p-4 lg:p-3 grid grid-cols-2 lg:grid-cols-5 gap-3 items-end">
      <div class="col-span-2 lg:col-span-1 px-2">
        <label class="text-[11px] font-semibold text-muted flex items-center gap-1 mb-1">${ICO.pin} Location</label>
        <input id="homeCityInput" value="Agra, Uttar Pradesh" placeholder="Enter city name..." onfocus="attachCityAutocomplete(this)" class="w-full text-sm font-medium bg-transparent outline-none" />${cityDatalistMarkup()}
      </div>
      <div class="px-2 lg:border-l border-line">
        <label class="text-[11px] font-semibold text-muted mb-1 block">📅 Pick-up</label>
        <input type="date" value="2026-08-30" class="w-full text-sm font-medium bg-transparent outline-none" />
      </div>
      <div class="px-2">
        <label class="text-[11px] font-semibold text-muted mb-1 block">⏰ Time</label>
        <input type="time" value="10:00" class="w-full text-sm font-medium bg-transparent outline-none" />
      </div>
      <div class="px-2 lg:border-l border-line">
        <label class="text-[11px] font-semibold text-muted mb-1 block">📅 Return</label>
        <input type="date" value="2026-09-01" class="w-full text-sm font-medium bg-transparent outline-none" />
      </div>
      <button onclick="searchCarsFromHome()" class="btn btn-primary font-semibold rounded-2xl py-3.5 flex items-center justify-center gap-2 col-span-2 lg:col-span-1">${ICO.search} Search Cars</button>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-5 lg:px-8 mt-24 reveal">
    <div class="flex items-end justify-between mb-6">
      <div>
        <h2 class="display text-2xl lg:text-3xl font-bold">Cars Near You</h2>
        <p class="text-muted text-sm mt-1">Find your perfect ride just minutes away.</p>
      </div>
      <a href="#/cars" class="hidden sm:flex text-sm font-semibold text-brand items-center gap-1">See all ${ICO.arrowR}</a>
    </div>
    <div class="flex gap-5 overflow-x-auto pb-4 -mx-5 px-5 lg:mx-0 lg:px-0 snap-x">
      ${nearby.length ? nearby.map(c=>`<div class="snap-start">${carCardHoriz(c)}</div>`).join('') : `<div class="w-full bg-white border border-line rounded-2xl p-8 text-center"><p class="text-base font-semibold text-ink">No car listings yet</p><p class="text-xs text-muted mt-1">Real car listings will appear here once added and approved.</p><a href="#/list-your-car" class="inline-block mt-4 btn btn-primary text-xs font-semibold px-5 py-2.5 rounded-full">+ List Your Car</a></div>`}
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-5 lg:px-8 mt-28 reveal">
    <div class="grid md:grid-cols-2 gap-6">
      <div class="bg-brand rounded-3xl p-9 text-white flex flex-col justify-between min-h-[260px]">
        <div>
          <span class="text-3xl">${ICO.car}</span>
          <h3 class="display text-2xl font-bold mt-4">Rent a car in minutes</h3>
          <p class="text-white/80 text-sm mt-2 max-w-sm">Search, book, and unlock a nearby car — no dealership, no queues, no hassle.</p>
        </div>
        <a href="#/cars" class="mt-6 inline-flex w-fit items-center gap-2 bg-white text-brand font-semibold text-sm px-5 py-3 rounded-full">Find a Car ${ICO.arrowR}</a>
      </div>
      <div class="bg-ink rounded-3xl p-9 text-white flex flex-col justify-between min-h-[260px]">
        <div>
          <span class="text-3xl">${ICO.wallet}</span>
          <h3 class="display text-2xl font-bold mt-4">Earn from your own car</h3>
          <p class="text-white/70 text-sm mt-2 max-w-sm">List your car, set your price and availability, and earn up to ₹28,000/month.</p>
        </div>
        <a href="#/list-your-car" class="mt-6 inline-flex w-fit items-center gap-2 bg-white text-ink font-semibold text-sm px-5 py-3 rounded-full">List Your Car ${ICO.arrowR}</a>
      </div>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-5 lg:px-8 mt-28 reveal">
    <div class="rounded-3xl bg-white border border-line shadow-card p-7 lg:p-9 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
      <div>
        <span class="inline-flex items-center gap-2 bg-brand-light text-brand-ink text-xs font-bold px-3 py-1.5 rounded-full">🛠️ HOST CONTROL CENTER</span>
        <h2 class="display text-2xl lg:text-3xl font-bold mt-4">Manage bookings from your dashboard</h2>
        <p class="text-muted text-sm mt-2 max-w-2xl">Review customer bookings, confirm or cancel trips, manage cars and set the owner's WhatsApp number for new booking alerts.</p>
      </div>
      <button onclick="openHostDashboard()" class="btn btn-primary font-semibold px-6 py-3.5 rounded-full shrink-0">Open Host Dashboard ${ICO.arrowR}</button>
    </div>
  </section>

  <section class="max-w-7xl mx-auto px-5 lg:px-8 mt-28 reveal">
    <h2 class="display text-2xl lg:text-3xl font-bold text-center">Safety, built in.</h2>
    <p class="text-muted text-sm text-center mt-2 max-w-md mx-auto">Every trip on DriveNear is backed by verification and 24/7 support.</p>
    <div class="grid sm:grid-cols-3 gap-5 mt-10">
      ${[['🛡️','Identity Verification','Every renter and owner is ID verified before their first trip.'],
        ['🚗','Vehicle Verification','Cars are inspected and documented before they go live.'],
        ['💳','Secure Booking','Payments are protected until your trip is confirmed.']]
      .map(([i,t,d])=>`
        <div class="bg-white rounded-2xl border border-line p-6 text-center hover:shadow-card transition-shadow">
          <div class="w-12 h-12 mx-auto rounded-xl bg-brand-light flex items-center justify-center text-2xl">${i}</div>
          <h4 class="font-semibold mt-4">${t}</h4>
          <p class="text-xs text-muted mt-2">${d}</p>
        </div>`).join('')}
    </div>
    <div class="text-center mt-8"><a href="#/safety" class="text-sm font-semibold text-brand inline-flex items-center gap-1">Learn more about safety ${ICO.arrowR}</a></div>
  </section>
  <div class="h-24"></div>
  `;
}


function openHostDashboard(){
  if(state.user?.isAdmin){ nav('#/admin/dashboard'); return; }
  if(state.user){ pushToast('Your account is not a host/admin account. Ask the website owner to set your role to admin.','error'); return; }
  pushToast('Log in with the host/admin account to open the dashboard.','info');
  openModal('login');
}
