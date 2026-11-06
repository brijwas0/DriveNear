/* DriveNear — js/app.js */

/* =========================================================
   RENDER ROOT
   ========================================================= */
let lastRenderedRoute = null;
function currentPage(){
  const h = state.route;
  if(h==='#/' || h==='') return pageHome();
  if(h==='#/cars') return pageCars();
  if(h.startsWith('#/cars/')) return pageCarDetails(h.split('/')[2]);
  if(h==='#/how-it-works') return pageHowItWorks();
  if(h==='#/safety') return pageSafety();
  if(h==='#/list-your-car') return pageListYourCar();
  if(h==='#/dashboard' || h==='#/my-bookings' || h==='#/track-booking') return pageDashboard();
  if(h==='#/owner/dashboard' || h==='#/owner/cars') return pageOwnerDashboard();
  if(h==='#/my-cars') return pageOwnerCars();
  if(h==='#/admin' || h==='#/admin/dashboard' || h==='#/admin/cars' || h==='#/admin/bookings') return pageAdminDashboard();
  if(h==='#/owner/calendar') return pageOwnerCalendar();
  if(h==='#/saved') return pageSaved();
  if(h==='#/messages') return pageMessages();
  if(h==='#/profile') return pageProfile();
  if(h==='#/booking') return pageDashboard();
  return page404();
}
function page404(){ return emptyState('🚧','Oops! Something went wrong','We could not find that page. Try searching again.','Try Again','#/'); }

function renderApp(){
  const app = document.getElementById('app');
  const activeBeforeRender = document.activeElement;
  const focusSnapshot = activeBeforeRender && app.contains(activeBeforeRender) && activeBeforeRender.id &&
    /^(INPUT|TEXTAREA|SELECT)$/.test(activeBeforeRender.tagName)
    ? { id: activeBeforeRender.id, route: state.route, start: typeof activeBeforeRender.selectionStart === 'number' ? activeBeforeRender.selectionStart : null, end: typeof activeBeforeRender.selectionEnd === 'number' ? activeBeforeRender.selectionEnd : null, direction: activeBeforeRender.selectionDirection || 'none' }
    : null;
  const preserveInputFocus = !!focusSnapshot && lastRenderedRoute === state.route;
  app.innerHTML = `
    ${navbar()}
    <div id="notif-dropdown-root"></div>
    <main id="page">${currentPage()}</main>
    ${footer()}
    ${bottomNav()}
    ${state.modal==='login' ? loginModalHtml() : ''}
    ${state.modal==='booking' ? bookingModalHtml() : ''}
    <div id="toast-root" class="fixed top-5 right-5 z-[60] flex flex-col items-end"></div>
  `;
  lastRenderedRoute = state.route;
  // Replacing the app markup on every keystroke used to destroy the focused input.
  // Restore focus and caret when rerendering the same route.
  if(preserveInputFocus){
    const nextInput = document.getElementById(focusSnapshot.id);
    if(nextInput){
      nextInput.focus({preventScroll:true});
      if(focusSnapshot.start !== null && typeof nextInput.setSelectionRange === 'function'){
        try { nextInput.setSelectionRange(focusSnapshot.start, focusSnapshot.end, focusSnapshot.direction); } catch(_) {}
      }
    }
  }
  renderToasts();
  if(state.route==='#/cars') setTimeout(initLeaflet, 30);
  // Step 1 creates the city-map container. Initialize only after it is in the DOM.
  if(state.route==='#/list-your-car' && Number(state.listCarStep || 1)===1 && typeof initHostCityMap==='function') {
    setTimeout(() => {
      if(state.route==='#/list-your-car' && Number(state.listCarStep || 1)===1) initHostCityMap();
    }, 60);
  }
  animateCounters();
  setupScrollReveal();
}

function setupScrollReveal(){
  const els = document.querySelectorAll('.reveal');
  const io = new IntersectionObserver((entries)=>{
    entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('reveal-visible'); io.unobserve(e.target); } });
  }, {threshold:0.15});
  els.forEach(el=>io.observe(el));
}

/* ---------------- INIT ---------------- */
state.publicCarsLoaded = !window.DN?.enabled?.();
state.publicCarsError = '';
state.route = location.hash || '#/';
renderApp();

// Fetch the public catalogue from Firestore. In Firebase mode there is deliberately
// no demo fallback: only active database listings are shown to renters.
function normalizePublicCar(c){
  return {
    ...c,
    id: String(c.id),
    price: Number(c.pricePerDay ?? c.price ?? 0),
    priceHour: Number(c.pricePerHour ?? c.priceHour ?? 0),
    area: c.area || c.location || '',
    reviews: Number(c.reviewsCount ?? c.reviews ?? 0),
    gallery: Array.isArray(c.gallery) && c.gallery.length ? c.gallery : (c.image ? [c.image] : []),
    features: Array.isArray(c.features) ? c.features : [],
    owner: c.owner || { name: c.ownerName || 'Owner' }
  };
}
function loadPublicCarCatalog(showLoading=false){
  if(!window.DN?.enabled?.()){
    // When Firebase is not configured, retain mock cars if defined
    if(typeof CARS !== 'undefined' && CARS.length) {
      state.publicCarsLoaded = true;
      return Promise.resolve(CARS);
    }
    state.publicCarsLoaded = true;
    return Promise.resolve([]);
  }
  state.publicCarsLoaded = false;
  state.publicCarsError = '';
  if(showLoading) renderApp();
  return DN.loadPublicCarCatalog().then(cars=>{
    CARS = (Array.isArray(cars) ? cars : []).map(normalizePublicCar);
    state.publicCarsLoaded = true;
    state.publicCarsError = '';
    renderApp();
    return CARS;
  }).catch(error=>{
    CARS = [];
    state.publicCarsLoaded = true;
    state.publicCarsError = error?.message || 'Unable to load car listings from Firebase.';
    console.warn('[DriveNear] Firestore car load failed:', error);
    renderApp();
    return [];
  });
}
function retryLoadPublicCars(){ loadPublicCarCatalog(true); }

// Central Firebase session listener: safe, unified state management
if (window.DN) {
  DN.watchAuth((u) => {
    if (u) {
      state.user = u;
      saveUserSession(u);
    } else {
      state.user = null;
      saveUserSession(null);
      state.ownerCars = [];
      state.ownerCarsLoaded = true;
      state.ownerBookings = [];
      state.myBookings = [];
    }
    renderApp();

    if (u && DN.enabled()) {
      if (state.user?.isAdmin && typeof loadAdminData === 'function') loadAdminData(false);
      if (state.user?.mode === 'owner' && typeof loadOwnerBookings === 'function') loadOwnerBookings(false);
      state.ownerCarsLoaded = false;
      DN.getMyCars().then(rows => {
        state.ownerCars = rows.map(c => ({
          ...c,
          price: c.pricePerDay ?? c.price ?? 0,
          priceHour: c.pricePerHour ?? c.priceHour ?? 0,
          area: c.area || c.location || '',
          reviews: c.reviewsCount ?? c.reviews ?? 0,
          gallery: c.gallery || (c.image ? [c.image] : []),
          features: c.features || [],
          owner: c.owner || { name: c.ownerName || 'Owner' }
        }));
        state.ownerCarsLoaded = true;
        renderApp();
      }).catch(e => { state.ownerCarsLoaded = true; console.warn('Owner car load failed:', e); renderApp(); });
      DN.getMyBookings().then(rows => { state.myBookings = rows; renderApp(); }).catch(e => console.warn('My bookings load failed:', e));
    }
  });

  if (DN.enabled()) {
    DN.db().collection('siteSettings').doc('general').get().then(snap => {
      if (snap.exists) { state.siteSettings = {...state.siteSettings, ...snap.data()}; renderApp(); }
    }).catch(() => {});
    loadPublicCarCatalog();
  }
}
