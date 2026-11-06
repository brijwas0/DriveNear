/* DriveNear — js/pages/adminDashboard.js
   Separate Professional Admin Operations Center & Fleet Management
*/

function esc(v){
  return String(v ?? '').replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

let adminBrandChoice = 'Hyundai';
let adminModelChoice = 'Creta';
let adminNewCarPhotos = [];
let adminCarSearch = '';
let adminBookingFilter = 'all';

async function safeAdminRead(collection, id, fallback, label){
  if(!window.DN?.enabled()) return fallback;
  const ref = id ? DN.db().collection(collection).doc(id) : DN.db().collection(collection);
  try {
    const snap = await ref.get();
    if (id) return snap.exists ? {id:snap.id, ...snap.data()} : fallback;
    return snap.docs.map(d => ({id:d.id,...d.data()}));
  } catch(e) {
    console.error(`Admin ${label} read failed:`, e);
    throw new Error(`${label}: ${e?.message || 'permission or network error'}`);
  }
}

function isAdminCarPending(car){
  const status = String(car?.status || 'pending').toLowerCase();
  const verification = String(car?.verificationStatus || '').toLowerCase();
  return ['pending','submitted','under_review','review'].includes(status) ||
    (verification === 'pending' && status !== 'rejected');
}

function normalizeAdminCar(car){
  return {
    ...car,
    price: car.pricePerDay ?? car.price ?? 0,
    priceHour: car.pricePerHour ?? car.priceHour ?? 0,
    area: car.area || car.location || '',
    reviews: car.reviewsCount ?? car.reviews ?? 0,
    gallery: Array.isArray(car.gallery) ? car.gallery : (car.image ? [car.image] : [])
  };
}

async function loadAdminData(showToast=false){
  state.adminDataLoading = true;
  state.adminDataError = '';
  let users = [];
  let cars = window.DN?.enabled() ? [] : [...CARS];
  let bookings = window.DN?.enabled() ? [] : [...(state.myBookings || [])];
  let settings = state.siteSettings || {announcement:'',maintenance:false,whatsappNumber:''};

  if(window.DN?.enabled()){
    try {
      const [fUsers, fCars, fBookings, fSettings] = await Promise.all([
        safeAdminRead('users', null, [], 'Users'),
        safeAdminRead('cars', null, [], 'Car listings'),
        safeAdminRead('bookings', null, [], 'Bookings'),
        safeAdminRead('siteSettings', 'general', null, 'Settings')
      ]);
      users = fUsers;
      // In Firebase mode, use exactly the database documents. Never merge demo cards
      // into the approval queue or leave stale samples when a collection is empty.
      cars = fCars.map(normalizeAdminCar);
      bookings = fBookings;
      if(fSettings) settings = {...settings, ...fSettings};
    } catch(err){
      state.adminDataError = err?.message || 'Could not load the Firebase admin data.';
      state.adminDataLoading = false;
      state.adminData = {users:[], cars:[], bookings:[], settings, error:state.adminDataError};
      if(showToast) pushToast(`Admin data could not be loaded: ${state.adminDataError}`, 'error');
      console.error('Admin data load failed:', err);
      renderApp();
      return;
    }
  }

  const userMap = Object.fromEntries(users.map(u => [u.id, u]));
  const carMap = Object.fromEntries(cars.map(c => [c.id, c]));
  const enrichedBookings = bookings.map(b => {
    const u = userMap[b.userId] || {};
    const c = carMap[b.carId] || b.car || {};
    return {
      ...b,
      customerName: b.customerName || u.name || '—',
      customerPhone: b.customerPhone || u.phone || '—',
      customerEmail: b.customerEmail || u.email || '—',
      carName: b.carName || [c.brand, c.model].filter(Boolean).join(' ') || 'Vehicle details unavailable',
      carRegNumber: b.carRegNumber || c.regNumber || '—',
      status: b.status || 'pending',
      paymentStatus: b.paymentStatus || 'pending',
      amount: Number(b.amount ?? b.totalAmount ?? 0)
    };
  });

  state.adminData = {users, cars, bookings:enrichedBookings, settings};
  state.adminDataError = '';
  state.adminDataLoading = false;
  state.siteSettings = {...state.siteSettings, ...settings};
  if(showToast) pushToast('Fleet Operations data refreshed');
  renderApp();
}

/* ---------------- MAIN ADMIN VIEW CONTROLLER ---------------- */
function pageAdminDashboard(){
  // If user is not admin, show professional security login gateway (No 404!)
  if(!state.user?.isAdmin){
    return adminAuthGatewayHtml();
  }

  const d = state.adminData || {
    users: [],
    cars: CARS,
    bookings: [],
    settings: state.siteSettings
  };

  const currentTab = state.adminTab || 'overview';
  const totalFleet = d.cars.length;
  const activeFleet = d.cars.filter(c => String(c.status || '').toLowerCase() === 'active' && !isAdminCarPending(c)).length;
  const pendingCarRequests = d.cars.filter(isAdminCarPending);
  const totalBookings = d.bookings.length;
  const confirmedBookings = d.bookings.filter(b=>['confirmed','active','completed'].includes(String(b.status||'').toLowerCase())).length;
  const pendingBookings = d.bookings.filter(b=>String(b.status||'').toLowerCase()==='pending').length;
  const totalRevenue = d.bookings.filter(b=>['confirmed','active','completed'].includes(String(b.status||'').toLowerCase())).reduce((s,b)=>s+Number(b.amount||0),0);
  const wa = adminWhatsAppNumber();

  return `
  <section class="max-w-7xl mx-auto px-5 lg:px-8 py-8 pb-28">
    <!-- TOP OPERATIONS HEADER -->
    <div class="bg-gradient-to-r from-emerald-950 via-teal-900 to-slate-900 text-white rounded-3xl p-6 sm:p-8 shadow-lift border border-emerald-800/40">
      <div class="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div class="flex items-center gap-2.5">
            <span class="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold text-sm shadow-card">🛡️</span>
            <span class="text-xs font-bold uppercase tracking-widest text-emerald-300">Fleet Operations & Admin Control</span>
          </div>
          <h1 class="display text-2xl sm:text-3xl font-bold mt-2">DriveNear Fleet Management Console</h1>
          <p class="text-xs sm:text-sm text-emerald-200/80 mt-1">Manage vehicles, customer bookings, vehicle RC verifications, and platform payment systems.</p>
        </div>
        <div class="flex flex-wrap items-center gap-2">
          <button onclick="setAdminTab('approvals')" class="text-xs font-bold px-4 py-2.5 rounded-full border border-amber-300 bg-amber-400 text-amber-950 hover:bg-amber-300 shadow-card flex items-center gap-1.5">
            <span>✓ Review Car Requests (${pendingCarRequests.length})</span>
          </button>
          <button onclick="setAdminTab('add-car')" class="btn btn-primary text-xs font-bold px-4 py-2.5 rounded-full shadow-card flex items-center gap-1.5">
            <span>＋ Add New Vehicle</span>
          </button>
          <a href="#/" class="text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2.5 transition-colors">
            🌐 Visit Website
          </a>
          <button onclick="loadAdminData(true)" class="text-xs font-semibold bg-white/10 hover:bg-white/20 border border-white/20 rounded-full px-4 py-2.5 transition-colors">
            ↻ Refresh Data
          </button>
          <button onclick="adminLogout()" class="text-xs font-semibold bg-rose-500/20 hover:bg-rose-500/40 text-rose-200 border border-rose-500/30 rounded-full px-4 py-2.5 transition-colors">
            Log Out
          </button>
        </div>
      </div>

      <!-- STATUS BAR -->
      <div class="mt-6 pt-5 border-t border-white/15 flex flex-wrap items-center justify-between gap-4 text-xs">
        <div class="flex items-center gap-2">
          <span class="w-2.5 h-2.5 rounded-full bg-emerald-400 animate-pulse"></span>
          <span class="font-medium text-emerald-100">Fleet Network Online: <strong>${activeFleet}</strong> active vehicles available</span>
        </div>
        <div class="text-emerald-200">
          ${wa ? `📱 WhatsApp Dispatch: <strong>+${esc(wa)}</strong>` : `⚠️ WhatsApp dispatch not set — configure in Settings`}
        </div>
      </div>
    </div>

    <!-- KPI CARDS -->
    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6">
      <div class="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-muted font-medium">Total Booking Value</p>
        <p class="display text-2xl sm:text-3xl font-bold text-brand-ink mt-1">${fmt(totalRevenue)}</p>
        <p class="text-[11px] text-emerald-700 font-semibold mt-1">From ${confirmedBookings} confirmed trips</p>
      </div>
      <div class="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-muted font-medium">Active Fleet Size</p>
        <p class="display text-2xl sm:text-3xl font-bold text-ink mt-1">${activeFleet} Cars</p>
        <p class="text-[11px] text-muted mt-1">${totalFleet} total listings</p>
      </div>
      <div class="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-muted font-medium">Pending Approvals</p>
        <p class="display text-2xl sm:text-3xl font-bold text-amber mt-1">${pendingCarRequests.length}</p>
        <p class="text-[11px] text-muted mt-1">Car listings awaiting your review</p>
        <button onclick="setAdminTab('approvals')" class="text-[11px] font-bold text-brand mt-2 underline">Review requests →</button>
      </div>
      <div class="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <p class="text-xs text-muted font-medium">Payment Gateway</p>
        <p class="display text-2xl font-bold text-brand mt-1">DriveNear Pay</p>
        <p class="text-[11px] text-emerald-700 font-semibold mt-1">UPI, Cards, NetBanking Active</p>
      </div>
    </div>

    <!-- NAVIGATION TABS -->
    <div class="flex gap-2 mt-8 border-b border-line overflow-x-auto pb-px">
      ${[
        ['overview','📊 Overview & Analytics'],
        ['approvals','✅ Car Requests ('+pendingCarRequests.length+')'],
        ['cars','🚘 Fleet Inventory ('+totalFleet+')'],
        ['add-car','＋ Add Vehicle (List Car)'],
        ['bookings','📋 Bookings Dispatch ('+totalBookings+')'],
        ['users','👥 Users & Hosts'],
        ['settings','⚙️ System & Payment Settings']
      ].map(([id, label])=>`
        <button onclick="setAdminTab('${id}')" class="px-4 py-3 text-xs sm:text-sm font-semibold whitespace-nowrap transition-all ${currentTab===id?'text-brand border-b-2 border-brand font-bold bg-white/50 rounded-t-xl':'text-muted hover:text-ink'}">
          ${label}
        </button>`).join('')}
    </div>

    <!-- TAB CONTENTS -->
    ${state.adminDataError ? `<div class="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm text-red-800"><strong>Firebase admin data could not be loaded.</strong><p class="mt-1">${esc(state.adminDataError)}</p><p class="text-xs mt-2">Check that this signed-in UID has users/{uid}.role = "admin" in the same Firebase project and that Firestore rules are deployed.</p><button onclick="loadAdminData(true)" class="mt-3 underline font-bold">Retry loading data</button></div>` : ''}
    <div class="mt-6">
      ${currentTab==='overview' ? adminOverviewHtml(d) : ''}
      ${currentTab==='approvals' ? adminApprovalsHtml(d.cars) : ''}
      ${currentTab==='cars' ? adminCarsHtml(d.cars) : ''}
      ${currentTab==='add-car' ? adminAddCarHtml() : ''}
      ${currentTab==='bookings' ? adminBookingsHtml(d.bookings) : ''}
      ${currentTab==='users' ? adminUsersHtml(d.users) : ''}
      ${currentTab==='settings' ? adminSettingsHtml(d.settings) : ''}
    </div>
  </section>`;
}

/* ---------------- ADMIN AUTHENTICATION GATEWAY ---------------- */
function adminAuthGatewayHtml(){
  return `
  <section class="max-w-md mx-auto px-5 py-16">
    <div class="bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-lift text-center">
      <div class="w-16 h-16 rounded-2xl bg-brand-light text-brand mx-auto flex items-center justify-center text-3xl shadow-sm">
        🛡️
      </div>
      <h2 class="display text-2xl font-bold mt-4">Fleet Admin Portal</h2>
      <p class="text-xs text-muted mt-1.5 max-w-xs mx-auto">Admin access is granted by your Firestore user document: users/{your UID} must have role = "admin". A local account label alone cannot grant access.</p>

      <div class="space-y-3 mt-6 text-left">
        <div>
          <div class="rounded-xl bg-sand p-3 text-xs text-muted">Signed-in account: <strong>${esc(state.user?.email || 'Not signed in')}</strong><br>Required Firestore role: <strong>admin</strong><br>Firebase project: <strong>${esc(window.FIREBASE_CONFIG?.projectId || 'not configured')}</strong></div>
      </div>

      <button onclick="openModal('login')" class="btn btn-primary w-full font-bold py-3.5 rounded-2xl mt-6 text-xs shadow-card flex items-center justify-center gap-2">
        <span>🔑 Sign in with authorized admin account</span>
      </button>

      <div class="mt-5 pt-4 border-t border-line">
        <a href="#/" class="text-xs font-semibold text-muted hover:text-ink">← Back to DriveNear Website</a>
      </div>
    </div>
  </section>`;
}

function quickAdminLogin(){
  // Deliberately never grants privileges locally. Admin access must come from Firebase Auth + the user profile role.
  pushToast('Please sign in with Firebase using the configured admin email.','error');
  openModal('login');
}

function adminLogout(){
  if(state.user) state.user.isAdmin = false;
  saveUserSession(state.user);
  pushToast('Exited Admin Console');
  nav('#/');
}

function setAdminTab(t){
  state.adminTab = t;
  renderApp();
  window.scrollTo({top: 150, behavior: 'smooth'});
}

/* ---------------- TAB 1: OVERVIEW & ANALYTICS ---------------- */
function adminOverviewHtml(d){
  const recentBookings = d.bookings.slice(0, 5);
  return `
  <div class="space-y-6">
    <!-- QUICK ACTIONS BAR -->
    <div class="bg-sand rounded-2xl p-4 border border-line flex flex-wrap items-center justify-between gap-3">
      <div class="flex items-center gap-3">
        <span class="text-2xl">⚡</span>
        <div>
          <p class="font-bold text-xs text-ink">Administrative Quick Actions</p>
          <p class="text-[11px] text-muted">Create new vehicle listing, verify registration plates, or manage customer dispatch.</p>
        </div>
      </div>
      <div class="flex gap-2">
        <button onclick="setAdminTab('add-car')" class="btn btn-primary text-xs font-bold px-4 py-2 rounded-xl shadow-sm">
          ＋ Add Vehicle
        </button>
        <button onclick="setAdminTab('bookings')" class="border border-line bg-white hover:bg-sand text-xs font-semibold px-4 py-2 rounded-xl">
          Manage Bookings
        </button>
      </div>
    </div>

    <!-- RECENT BOOKINGS TABLE -->
    <div class="bg-white border border-line rounded-2xl p-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <h3 class="display font-bold text-base">Recent Customer Bookings</h3>
        <button onclick="setAdminTab('bookings')" class="text-xs font-bold text-brand hover:underline">View All Bookings →</button>
      </div>

      <div class="overflow-x-auto">
        <table class="w-full text-xs">
          <thead>
            <tr class="border-b border-line text-muted text-left">
              <th class="py-2.5">Booking No</th>
              <th class="py-2.5">Vehicle</th>
              <th class="py-2.5">Customer</th>
              <th class="py-2.5">Duration</th>
              <th class="py-2.5">Amount</th>
              <th class="py-2.5">Status</th>
              <th class="py-2.5 text-right">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-line/60">
            ${recentBookings.map(b=>`
              <tr>
                <td class="py-3 font-mono font-bold text-brand">${esc(b.bookingNumber||b.id)}</td>
                <td class="py-3 font-semibold">${esc(b.carName||'Vehicle')}</td>
                <td class="py-3">${esc(b.customerName||'Customer')}<br><span class="text-muted text-[10px]">${esc(b.customerPhone||'—')}</span></td>
                <td class="py-3 text-muted">${esc(b.pickupDate||'—')} → ${esc(b.returnDate||'—')}</td>
                <td class="py-3 font-bold">₹${Number(b.amount||0).toLocaleString('en-IN')}</td>
                <td class="py-3"><span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status==='confirmed'?'bg-emerald-100 text-emerald-800':b.status==='cancelled'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-800'} capitalize">${esc(b.status||'pending')}</span></td>
                <td class="py-3 text-right">
                  <button onclick="openBookingWhatsApp('${esc(b.id)}')" class="text-[11px] font-semibold text-green-700 bg-green-50 px-2.5 py-1 rounded-lg border border-green-200 hover:bg-green-100">
                    📱 WhatsApp
                  </button>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </div>
    </div>
  </div>`;
}

/* ---------------- CAR APPROVALS & FLEET INVENTORY ---------------- */
function adminCarStatusLabel(car){
  if(isAdminCarPending(car)) return 'Pending review';
  const status = String(car?.status || '').toLowerCase();
  if(status === 'rejected' || String(car?.verificationStatus||'').toLowerCase()==='rejected') return 'Rejected';
  if(status === 'inactive') return 'Inactive';
  if(status === 'active') return 'Active';
  return status || 'Unknown';
}

function adminFleetCardsHtml(cars, showOwnerDetails=false){
  if(!cars.length) return `<div class="col-span-full bg-white border border-line rounded-2xl p-8 text-center"><div class="text-3xl">🚘</div><h3 class="font-bold mt-2">No car listings here</h3><p class="text-sm text-muted mt-1">New listings will appear when clients submit them.</p></div>`;
  return cars.map(c=>{
    const pending = isAdminCarPending(c);
    const status = String(c.status || '').toLowerCase();
    const rejected = status === 'rejected' || String(c.verificationStatus||'').toLowerCase()==='rejected';
    const inactive = status === 'inactive';
    const statusLabel = adminCarStatusLabel(c);
    const statusClass = pending ? 'bg-amber-100 text-amber-800' : rejected ? 'bg-rose-100 text-rose-800' : inactive ? 'bg-slate-100 text-slate-700' : 'bg-emerald-100 text-emerald-800';
    const cover = c.image || c.gallery?.[0] || '';
    const ownerName = c.owner?.name || c.ownerName || c.name || 'Not provided';
    const ownerEmail = c.owner?.email || c.ownerEmail || '';
    const ownerPhone = c.owner?.phone || c.ownerPhone || '';
    return `
      <article class="bg-white border border-line rounded-2xl overflow-hidden shadow-sm flex flex-col justify-between">
        <div>
          <div class="relative h-44 bg-sand">
            ${cover ? `<img src="${esc(cover)}" alt="${esc((c.brand||'')+' '+(c.model||''))}" class="w-full h-full object-cover" onerror="this.style.display='none'">` : `<div class="w-full h-full flex items-center justify-center text-4xl text-muted">🚗</div>`}
            <span class="absolute top-2.5 left-2.5 bg-ink/85 text-white text-[11px] font-mono font-bold px-2.5 py-1 rounded-full">RC: ${esc(c.regNumber || 'Not provided')}</span>
            <span class="absolute top-2.5 right-2.5 px-2.5 py-1 rounded-full text-[10px] font-bold ${statusClass}">${esc(statusLabel)}</span>
          </div>
          <div class="p-4">
            <div class="flex justify-between items-start gap-2">
              <div><h3 class="font-bold text-sm">${esc(c.brand||'Unknown')} ${esc(c.model||'Vehicle')}</h3><p class="text-[11px] text-muted">${esc(c.transmission||'—')} · ${esc(c.fuel||'—')} · ${Number(c.seats||5)} Seats · ${esc(c.year||'Year not set')}</p></div>
              <p class="font-bold text-brand text-sm shrink-0">${fmt(c.price ?? c.pricePerDay ?? 0)}<span class="text-[10px] text-muted font-normal">/day</span></p>
            </div>
            <p class="text-[11px] text-muted mt-2">📍 ${esc(c.area || c.location || 'Location not set')}</p>
            ${showOwnerDetails ? `<div class="mt-3 rounded-xl bg-sand/60 border border-line p-3 text-xs"><p><strong>Listed by:</strong> ${esc(ownerName)}</p>${ownerEmail?`<p class="mt-1"><strong>Email:</strong> ${esc(ownerEmail)}</p>`:''}${ownerPhone?`<p class="mt-1"><strong>Phone:</strong> ${esc(ownerPhone)}</p>`:''}<p class="mt-1 text-muted break-all"><strong>Listing ID:</strong> ${esc(c.id)}</p></div>` : ''}
            ${c.rejectionReason && rejected ? `<p class="mt-2 text-xs text-rose-700"><strong>Rejection reason:</strong> ${esc(c.rejectionReason)}</p>` : ''}
          </div>
        </div>
        <div class="p-4 pt-0 border-t border-line/60 flex flex-wrap items-center gap-2 mt-2">
          ${pending ? `<button onclick="adminApproveCar('${esc(c.id)}')" class="flex-1 min-w-[130px] text-xs font-bold py-2 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700">✓ Approve & Publish</button><button onclick="adminRejectCar('${esc(c.id)}')" class="flex-1 min-w-[100px] text-xs font-semibold py-2 rounded-xl border border-rose-200 text-rose-700 hover:bg-rose-50">Reject</button>` : rejected ? `<button onclick="adminReopenCarReview('${esc(c.id)}')" class="flex-1 text-xs font-semibold py-2 rounded-xl border border-amber-300 text-amber-800 hover:bg-amber-50">Reopen review</button>` : `<button onclick="adminToggleCar('${esc(c.id)}','${inactive?'active':'inactive'}')" class="flex-1 text-xs font-semibold py-2 rounded-xl border border-line hover:bg-sand">${inactive?'Activate':'Deactivate'}</button>`}
          <button onclick="nav('#/cars/${encodeURIComponent(String(c.id))}')" class="flex-1 text-xs font-semibold py-2 rounded-xl border border-line hover:bg-sand">Preview</button>
          <button onclick="adminDeleteCar('${esc(c.id)}')" class="text-xs font-semibold py-2 px-3 rounded-xl border border-rose-200 text-rose-600 hover:bg-rose-50" title="Delete Car Listing" aria-label="Delete car listing">✕</button>
        </div>
      </article>`;
  }).join('');
}

function adminApprovalsHtml(cars){
  const pending = cars.filter(isAdminCarPending);
  return `<div class="space-y-4">
    <div class="rounded-2xl border border-amber-200 bg-amber-50 p-4 flex flex-wrap items-center justify-between gap-3"><div><h2 class="font-bold text-base text-amber-950">Car listing requests</h2><p class="text-xs text-amber-900 mt-1">Review the car details and owner contact information before approving. Approve makes the car publicly visible; reject keeps it off the public fleet.</p></div><button onclick="loadAdminData(true)" class="text-xs font-bold border border-amber-300 rounded-xl px-3 py-2 bg-white">↻ Refresh requests</button></div>
    <div class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">${pending.length ? adminFleetCardsHtml(pending, true) : `<div class="col-span-full bg-white border border-line rounded-2xl p-10 text-center"><div class="text-4xl">✅</div><h3 class="font-bold mt-3">No pending car requests</h3><p class="text-sm text-muted mt-1">New client submissions will appear here for your approval.</p></div>`}</div>
  </div>`;
}

function adminCarsHtml(cars){
  const filtered = cars.filter(c => {
    if(!adminCarSearch) return true;
    const q = adminCarSearch.toLowerCase();
    return [c.brand,c.model,c.regNumber,c.ownerName,c.owner?.name,c.ownerEmail,c.owner?.email].some(v=>String(v||'').toLowerCase().includes(q));
  });
  return `<div class="space-y-4">
    <div class="bg-white border border-line rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3 shadow-sm">
      <div class="flex-1 min-w-[240px] flex items-center gap-2 border border-line rounded-xl px-3 py-2 bg-sand/40"><span>🔍</span><input id="adminFleetSearchInput" value="${esc(adminCarSearch)}" oninput="setAdminCarSearch(this.value)" placeholder="Search by brand, model, RC, or owner..." class="w-full text-xs bg-transparent outline-none"></div>
      <button onclick="setAdminTab('approvals')" class="text-xs font-bold border border-amber-300 text-amber-900 bg-amber-50 px-4 py-2.5 rounded-xl">Review pending requests (${cars.filter(isAdminCarPending).length})</button>
      <button onclick="setAdminTab('add-car')" class="btn btn-primary text-xs font-bold px-4 py-2.5 rounded-xl shadow-sm">＋ Add New Vehicle</button>
    </div>
    <div id="adminFleetGrid" class="grid md:grid-cols-2 lg:grid-cols-3 gap-5">${adminFleetCardsHtml(filtered)}</div>
  </div>`;
}

function setAdminCarSearch(value){
  adminCarSearch = String(value || '');
  const grid = document.getElementById('adminFleetGrid');
  if(!grid) return;
  const cars = state.adminData?.cars || [];
  const q = adminCarSearch.toLowerCase();
  const filtered = cars.filter(c=>[c.brand,c.model,c.regNumber,c.ownerName,c.owner?.name,c.ownerEmail,c.owner?.email].some(v=>String(v||'').toLowerCase().includes(q)));
  grid.innerHTML = adminFleetCardsHtml(filtered);
}

/* ---------------- TAB 3: ADMIN PROFESSIONAL CAR CREATION STUDIO ---------------- */
function adminAddCarHtml(){
  const brands = Object.keys(POPULAR_CAR_BRANDS);
  const models = POPULAR_CAR_BRANDS[adminBrandChoice] || ['Creta', 'Venue'];

  return `
  <div class="max-w-3xl mx-auto bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-card">
    <div class="flex items-center justify-between pb-4 border-b border-line">
      <div>
        <span class="text-xs font-bold uppercase tracking-wider text-brand">Admin Listing Studio</span>
        <h2 class="display text-xl sm:text-2xl font-bold mt-1">Add New Vehicle to Fleet</h2>
        <p class="text-xs text-muted mt-0.5">Professionally register a new vehicle into the DriveNear catalog and booking engine.</p>
      </div>
      <button onclick="setAdminTab('cars')" class="text-xs font-semibold px-3 py-1.5 rounded-full border border-line hover:bg-sand">
        ← Back to Fleet
      </button>
    </div>

    <form onsubmit="handleAdminCreateCar(event)" class="mt-6 space-y-5">
      <!-- BRAND & MODEL SELECTION -->
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-semibold text-muted">Vehicle Brand *</label>
          <select id="adminCarBrand" onchange="onAdminBrandSelect(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-white outline-none focus:border-brand">
            ${brands.map(b=>`<option value="${b}" ${adminBrandChoice===b?'selected':''}>${b}</option>`).join('')}
            <option value="Other">Other Custom Brand</option>
          </select>
        </div>

        <div>
          <label class="text-xs font-semibold text-muted">Vehicle Model *</label>
          <select id="adminCarModel" onchange="onAdminModelSelect(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-xs font-semibold bg-white outline-none focus:border-brand">
            ${models.map(m=>`<option value="${m}" ${adminModelChoice===m?'selected':''}>${m}</option>`).join('')}
            <option value="custom">Type custom model...</option>
          </select>
          <input id="adminCarModelCustom" placeholder="Enter custom model name" class="hidden w-full mt-2 border border-line rounded-xl px-3 py-2 text-xs outline-none focus:border-brand">
        </div>
      </div>

      <!-- YEAR, CATEGORY, FUEL, TRANSMISSION -->
      <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div>
          <label class="text-xs font-semibold text-muted">Year *</label>
          <select id="adminCarYear" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-brand font-medium">
            ${[2026,2025,2024,2023,2022,2021,2020,2019,2018].map(y=>`<option value="${y}" ${y===2023?'selected':''}>${y}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Category *</label>
          <select id="adminCarType" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-brand font-medium">
            ${['SUV','Sedan','Hatchback','MPV','Luxury'].map(t=>`<option value="${t}">${t}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Fuel *</label>
          <select id="adminCarFuel" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-brand font-medium">
            ${['Petrol','Diesel','Electric','CNG','Hybrid'].map(f=>`<option value="${f}">${f}</option>`).join('')}
          </select>
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Transmission *</label>
          <select id="adminCarTrans" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-brand font-medium">
            <option value="Automatic">Automatic</option>
            <option value="Manual">Manual</option>
          </select>
        </div>
      </div>

      <!-- REGISTRATION NUMBER WITH LIVE VALIDATION -->
      <div class="border border-line rounded-2xl p-4 bg-sand/40">
        <label class="text-xs font-semibold text-muted flex items-center justify-between">
          <span>Official Vehicle Registration Number (RC) *</span>
          <span class="text-[11px] text-brand">MoRTH Standard: UP 80 AB 1234 or 22 BH 1234 AA</span>
        </label>
        <div class="relative mt-1">
          <input id="adminCarReg" oninput="onAdminRegInput(this.value)" placeholder="e.g. DL 01 CZ 4321 or UP 80 AB 1234" class="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs font-mono font-bold uppercase tracking-wider outline-none focus:border-brand bg-white">
        </div>
        <div id="adminRegValidationBadge" class="mt-2">
          ${renderRegValidationFeedback('')}
        </div>
      </div>

      <!-- PRICING & DEPOSIT -->
      <div class="grid grid-cols-3 gap-3">
        <div>
          <label class="text-xs font-semibold text-muted">Daily Rate (₹) *</label>
          <input id="adminCarPriceDay" type="number" value="1599" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-brand">
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Hourly Rate (₹) *</label>
          <input id="adminCarPriceHour" type="number" value="175" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-brand">
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Refundable Deposit (₹) *</label>
          <input id="adminCarDeposit" type="number" value="4000" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs font-bold outline-none focus:border-brand">
        </div>
      </div>

      <!-- LOCATION & SEATS -->
      <div class="grid sm:grid-cols-2 gap-4">
        <div>
          <label class="text-xs font-semibold text-muted">Pickup Hub / Area *</label>
          <input id="adminCarArea" value="Sadar Bazaar, Agra" placeholder="e.g. Sadar Bazaar, Agra" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2 text-xs outline-none focus:border-brand">
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Seating Capacity *</label>
          <select id="adminCarSeats" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs bg-white outline-none focus:border-brand font-medium">
            <option value="4">4 Seater</option>
            <option value="5" selected>5 Seater</option>
            <option value="7">7 Seater</option>
            <option value="8">8 Seater</option>
          </select>
        </div>
      </div>

      <!-- PHOTO UPLOAD -->
      <div>
        <label class="text-xs font-semibold text-muted block mb-1">Car Photos (Cover & Gallery)</label>
        <div class="border-2 border-dashed border-line rounded-2xl p-6 text-center bg-sand/30 hover:border-brand cursor-pointer" onclick="document.getElementById('adminPhotoFileInput').click()">
          <span class="text-3xl">📷</span>
          <p class="text-xs font-semibold mt-1">Click to select photos from your device</p>
          <p class="text-[11px] text-muted">Support JPG, PNG, WEBP (Multiple allowed)</p>
          <input type="file" id="adminPhotoFileInput" multiple accept="image/*" class="hidden" onchange="handleAdminPhotoFiles(this.files)">
        </div>

        <div id="adminPhotoGrid" class="grid grid-cols-4 gap-2 mt-3">
          ${adminNewCarPhotos.map((p,i)=>`
            <div class="relative h-20 rounded-xl overflow-hidden border border-line">
              <img src="${p}" class="w-full h-full object-cover">
              <button type="button" onclick="adminRemovePhoto(${i})" class="absolute top-1 right-1 w-5 h-5 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs">✕</button>
            </div>`).join('')}
        </div>
      </div>

      <div class="pt-4 border-t border-line flex gap-3">
        <button type="button" onclick="setAdminTab('cars')" class="flex-1 font-semibold py-3 rounded-2xl border border-line text-xs hover:bg-sand">
          Cancel
        </button>
        <button type="submit" id="adminSubmitCarBtn" class="flex-1 btn btn-primary font-bold py-3 rounded-2xl text-xs shadow-card">
          🚀 Publish Vehicle to Fleet
        </button>
      </div>
    </form>
  </div>`;
}

function onAdminBrandSelect(b){
  adminBrandChoice = b;
  const models = POPULAR_CAR_BRANDS[b] || ['Custom Model'];
  adminModelChoice = models[0] || '';
  renderApp();
}

function onAdminModelSelect(m){
  if(m==='custom'){
    const inp = document.getElementById('adminCarModelCustom');
    if(inp){ inp.classList.remove('hidden'); inp.focus(); }
  } else {
    adminModelChoice = m;
    const inp = document.getElementById('adminCarModelCustom');
    if(inp) inp.classList.add('hidden');
  }
}

function onAdminRegInput(v){
  const badge = document.getElementById('adminRegValidationBadge');
  if(badge) badge.innerHTML = renderRegValidationFeedback(v);
}

function handleAdminPhotoFiles(files){
  [...files].slice(0,6).forEach(f=>{
    const reader = new FileReader();
    reader.onload = e => {
      adminNewCarPhotos.push(e.target.result);
      renderApp();
    };
    reader.readAsDataURL(f);
  });
}

function adminRemovePhoto(i){
  adminNewCarPhotos.splice(i,1);
  renderApp();
}

async function handleAdminCreateCar(e){
  e.preventDefault();
  const btn = document.getElementById('adminSubmitCarBtn');
  if(btn){ btn.textContent='Saving vehicle...'; btn.disabled=true; }
  try {
    const brand = document.getElementById('adminCarBrand')?.value || adminBrandChoice;
    let model = document.getElementById('adminCarModel')?.value || adminModelChoice;
    if(model === 'custom') model = document.getElementById('adminCarModelCustom')?.value.trim() || '';
    const year = Number(document.getElementById('adminCarYear')?.value || 2023);
    const type = document.getElementById('adminCarType')?.value || 'SUV';
    const fuel = document.getElementById('adminCarFuel')?.value || 'Petrol';
    const transmission = document.getElementById('adminCarTrans')?.value || 'Automatic';
    const regNo = document.getElementById('adminCarReg')?.value.trim() || '';
    const priceDay = Number(document.getElementById('adminCarPriceDay')?.value || 1599);
    const priceHour = Number(document.getElementById('adminCarPriceHour')?.value || 175);
    const deposit = Number(document.getElementById('adminCarDeposit')?.value || 4000);
    const area = document.getElementById('adminCarArea')?.value.trim() || '';
    const seats = Number(document.getElementById('adminCarSeats')?.value || 5);
    const regCheck = validateVehicleRegNumber(regNo);
    if(!model || !area || !regCheck.isValid || !(priceDay > 0) || !(priceHour > 0) || !(seats > 0)){
      pushToast(!regCheck.isValid ? regCheck.message : 'Enter a model, pickup area, and valid positive prices.', 'error');
      if(btn){ btn.textContent='🚀 Publish Vehicle to Fleet'; btn.disabled=false; }
      if(!regCheck.isValid) document.getElementById('adminCarReg')?.focus();
      return;
    }

    const draftGallery = adminNewCarPhotos.filter(Boolean);
    const fallbackCover = draftGallery[0] || '';
    let finalGallery = draftGallery;
    let newId = 'car-' + Date.now();
    if(window.DN?.enabled()){
      const authUser = DN.authUser();
      if(!authUser) throw new Error('Your Firebase session expired. Sign in again.');
      if(adminNewCarPhotos.length){
        if(!DN.storage?.()) throw new Error('Firebase Storage is not initialized. Enable Storage before uploading car photos.');
        const uploadFolder = `car-listings/${authUser.uid}/admin-${Date.now()}`;
        finalGallery = await Promise.all(adminNewCarPhotos.map((dataUrl,i)=>DN.uploadImage(`${uploadFolder}/${i+1}.jpg`,dataUrl)));
      }
      newId = await DN.createCar({
        brand, model, year, type, fuel, transmission, seats,
        regNumber:regCheck.formatted, pricePerHour:priceHour, pricePerDay:priceDay,
        deposit, location:area, area, image:finalGallery[0], gallery:finalGallery,
        features:['Air Conditioning','Bluetooth Audio','Fastag Enabled','Reverse Camera','GPS Navigation'],
        owner:{name:'DriveNear Fleet',email:state.user?.email||'',phone:''}, ownerName:'DriveNear Fleet',
        status:'active', verified:true, verificationStatus:'approved'
      });
    } else {
      CARS.unshift({id:newId,brand,model,year,type,fuel,transmission,seats,regNumber:regCheck.formatted,price:priceDay,priceHour,deposit,area,rating:0,reviews:0,verified:true,status:'active',image:finalGallery[0],gallery:finalGallery,features:[]});
    }
    adminNewCarPhotos = [];
    pushToast(`Vehicle saved: ${brand} ${model}.`);
    await loadAdminData(false);
    if(window.DN?.enabled() && typeof loadPublicCarCatalog==='function') await loadPublicCarCatalog();
    setAdminTab('cars');
  } catch(err){
    console.error('Admin vehicle save failed:', err);
    pushToast(err?.message || 'Could not save vehicle. Check Firebase permissions and Storage setup.', 'error');
    if(btn){ btn.textContent='🚀 Publish Vehicle to Fleet'; btn.disabled=false; }
  }
}

/* ---------------- TAB 4: BOOKINGS MANAGEMENT ---------------- */
function adminBookingsHtml(rows){
  const filtered = rows.filter(b => {
    if(adminBookingFilter==='all') return true;
    return (b.status||'').toLowerCase() === adminBookingFilter;
  });

  return `
  <div class="space-y-4">
    <!-- FILTER PILLS -->
    <div class="flex gap-2 overflow-x-auto pb-1 text-xs">
      ${['all','pending','confirmed','active','completed','cancelled'].map(st=>`
        <button onclick="adminBookingFilter='${st}'; renderApp();" class="px-3.5 py-2 rounded-xl capitalize font-semibold transition-all ${adminBookingFilter===st?'bg-brand text-white shadow-sm':'bg-white border border-line text-muted hover:text-ink'}">
          ${st}
        </button>`).join('')}
    </div>

    ${!filtered.length ? `
      <div class="bg-white border border-line rounded-2xl p-10 text-center">
        <p class="text-3xl">📋</p>
        <h3 class="font-bold text-base mt-2">No bookings matching filter</h3>
        <p class="text-xs text-muted mt-1">Customer bookings will appear here automatically.</p>
      </div>` : `
      <div class="space-y-3">
        ${filtered.map(b=>`
          <div class="bg-white border border-line rounded-2xl p-5 shadow-sm">
            <div class="flex flex-wrap items-start justify-between gap-4">
              <div>
                <div class="flex items-center gap-2">
                  <span class="font-mono font-bold text-sm text-brand">${esc(b.bookingNumber||b.id)}</span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold ${b.status==='confirmed'?'bg-emerald-100 text-emerald-800':b.status==='cancelled'?'bg-rose-100 text-rose-700':'bg-amber-100 text-amber-800'} capitalize">
                    ${esc(b.status||'pending')}
                  </span>
                  <span class="px-2 py-0.5 rounded-full text-[10px] font-bold bg-sand border border-line text-muted uppercase">
                    ${esc(b.paymentStatus||'paid')}
                  </span>
                </div>
                <p class="text-xs text-ink font-semibold mt-1">Car: <span class="text-muted">${esc(b.carName||b.carId||'Vehicle')}</span> (Plate: <span class="font-mono">${esc(b.carRegNumber||'UP 80 AB 1234')}</span>)</p>
                <p class="text-xs text-ink mt-0.5">Customer: <span class="font-medium">${esc(b.customerName||'Customer')}</span> · Phone: <a href="tel:${esc(b.customerPhone)}" class="text-brand font-medium hover:underline">${esc(b.customerPhone||'—')}</a></p>
                <p class="text-[11px] text-muted mt-0.5">Dates: ${esc(b.pickupDate||'—')} ${esc(b.pickupTime||'')} → ${esc(b.returnDate||'—')} ${esc(b.returnTime||'')}</p>
              </div>
              <div class="text-right">
                <p class="font-bold text-base text-brand-ink">₹${Number(b.amount||0).toLocaleString('en-IN')}</p>
                <p class="text-[10px] text-muted font-mono mt-0.5">${esc(b.transactionId||'TXN_ONLINE')}</p>
              </div>
            </div>

            <!-- CONTROLS -->
            <div class="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-line">
              ${String(b.paymentStatus||'').toLowerCase().includes('pending') ? `<button onclick="adminVerifyBookingPayment('${esc(b.id)}')" class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-blue-300 text-blue-800 bg-blue-50 hover:bg-blue-100">✓ Verify UPI Payment</button>` : ''}
              <button onclick="adminSetBookingStatus('${esc(b.id)}','confirmed')" class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-emerald-300 text-emerald-800 bg-emerald-50 hover:bg-emerald-100">
                ✓ Confirm Booking
              </button>
              <button onclick="adminSetBookingStatus('${esc(b.id)}','completed')" class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-line bg-white hover:bg-sand">
                Complete Trip
              </button>
              <button onclick="adminSetBookingStatus('${esc(b.id)}','cancelled')" class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-rose-200 text-rose-700 bg-rose-50 hover:bg-rose-100">
                ✕ Cancel
              </button>
              <select onchange="adminSetBookingStatus('${esc(b.id)}',this.value)" class="border border-line rounded-xl px-2.5 py-1.5 text-xs font-semibold bg-white outline-none">
                <option value="pending" ${b.status==='pending'?'selected':''}>Pending</option>
                <option value="confirmed" ${b.status==='confirmed'?'selected':''}>Confirmed</option>
                <option value="active" ${b.status==='active'?'selected':''}>Active</option>
                <option value="completed" ${b.status==='completed'?'selected':''}>Completed</option>
                <option value="cancelled" ${b.status==='cancelled'?'selected':''}>Cancelled</option>
              </select>
              <div class="ml-auto flex items-center gap-2">
                <button onclick="openBookingWhatsApp('${esc(b.id)}')" class="text-xs font-semibold px-3 py-1.5 rounded-xl border border-green-300 text-green-800 bg-green-50 hover:bg-green-100 flex items-center gap-1">
                  <span>📱 Dispatch via WhatsApp</span>
                </button>
              </div>
            </div>
          </div>`).join('')}
      </div>`}
  </div>`;
}

/* ---------------- TAB 5: USERS & ROLES ---------------- */
function adminUsersHtml(users){
  return `
  <div class="bg-white border border-line rounded-2xl overflow-hidden shadow-sm">
    <div class="p-4 border-b border-line flex items-center justify-between">
      <h3 class="font-bold text-sm">Platform Registered Users & Hosts</h3>
      <span class="text-xs text-muted">${users.length} Total Users</span>
    </div>
    <div class="overflow-x-auto">
      <table class="w-full text-xs">
        <thead class="bg-sand text-muted text-left">
          <tr>
            <th class="p-3.5">Name</th>
            <th class="p-3.5">Email</th>
            <th class="p-3.5">Phone</th>
            <th class="p-3.5">Role</th>
            <th class="p-3.5 text-right">Role Action</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line">
          ${users.map(u=>`
            <tr>
              <td class="p-3.5 font-bold">${esc(u.name||'User')}</td>
              <td class="p-3.5 text-muted">${esc(u.email||'—')}</td>
              <td class="p-3.5 text-muted">${esc(u.phone||'—')}</td>
              <td class="p-3.5"><span class="px-2 py-0.5 rounded-full font-bold text-[10px] capitalize ${u.role==='admin'?'bg-emerald-100 text-emerald-800':u.role==='owner'?'bg-brand-light text-brand':'bg-sand text-muted'}">${esc(u.role||'renter')}</span></td>
              <td class="p-3.5 text-right">
                <select onchange="adminSetUserRole('${esc(u.id)}',this.value)" class="border border-line rounded-xl px-2.5 py-1 text-xs outline-none bg-white font-medium">
                  <option value="renter" ${u.role==='renter'?'selected':''}>Renter</option>
                  <option value="owner" ${u.role==='owner'?'selected':''}>Host / Owner</option>
                  <option value="admin" ${u.role==='admin'?'selected':''}>Admin</option>
                </select>
              </td>
            </tr>`).join('')}
        </tbody>
      </table>
    </div>
  </div>`;
}

/* ---------------- TAB 6: SETTINGS ---------------- */
function adminSettingsHtml(s){
  const current = String(s?.whatsappNumber || state.siteSettings?.whatsappNumber || '');
  const upiId = String(s?.upiId || state.siteSettings?.upiId || '');
  const upiName = String(s?.upiName || state.siteSettings?.upiName || 'DriveNear');
  const upiQrUrl = String(s?.upiQrUrl || state.siteSettings?.upiQrUrl || '');
  return `
  <div class="max-w-2xl bg-white border border-line rounded-3xl p-6 sm:p-8 shadow-sm space-y-6">
    <div>
      <h3 class="display font-bold text-xl">Platform & Gateway Settings</h3>
      <p class="text-xs text-muted mt-1">Configure automated WhatsApp alerts, payment gateway credentials, and broadcast announcements.</p>
    </div>

    <!-- WHATSAPP DISPATCH NUMBER -->
    <div class="p-4 rounded-2xl bg-sand border border-line space-y-2">
      <label class="text-xs font-bold text-ink flex items-center justify-between">
        <span>Owner / Host WhatsApp Alert Number *</span>
        <span class="text-brand font-normal text-[11px]">Format: 10 digits or 91XXXXXXXXXX</span>
      </label>
      <input id="adminWhatsapp" inputmode="tel" value="${esc(current)}" placeholder="e.g. 9876543210 or 919876543210" class="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-brand bg-white font-medium">
      <p class="text-[11px] text-muted">When a new customer books a car, clicking the WhatsApp button opens WhatsApp with this phone number pre-filled with the vehicle RC, trip timing, and customer details.</p>
    </div>

    <!-- ADMIN UPI DETAILS -->
    <div class="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 space-y-3">
      <h4 class="font-bold text-sm text-emerald-950">Customer UPI Payment Details</h4>
      <label class="block text-xs font-semibold">UPI ID / VPA</label>
      <input id="adminUpiId" value="${esc(upiId)}" placeholder="business@upi" class="w-full border border-line rounded-xl px-3 py-2.5 text-xs bg-white">
      <label class="block text-xs font-semibold">Payee / Business Name</label>
      <input id="adminUpiName" value="${esc(upiName)}" placeholder="DriveNear" class="w-full border border-line rounded-xl px-3 py-2.5 text-xs bg-white">
      <label class="block text-xs font-semibold">QR Image URL</label>
      <input id="adminUpiQrUrl" value="${esc(upiQrUrl)}" placeholder="Paste QR image URL or upload a QR below" class="w-full border border-line rounded-xl px-3 py-2.5 text-xs bg-white">
      <label class="block text-[11px] font-semibold text-ink mt-3">Upload UPI QR image
        <input id="adminUpiQrFile" type="file" accept="image/png,image/jpeg,image/webp" onchange="adminUploadUpiQr(this)" class="block w-full mt-2 text-xs file:mr-3 file:rounded-lg file:border-0 file:bg-sand file:px-3 file:py-2">
      </label>
      <div id="adminUpiQrPreview">${upiQrUrl ? `<img src="${esc(upiQrUrl)}" alt="Current UPI QR" class="w-36 h-36 object-contain rounded-xl bg-white border border-line p-2 mt-3">` : '<p class="text-[11px] text-muted mt-2">No QR uploaded yet.</p>'}</div>
      <p class="text-[11px] text-muted">Upload a clear QR image (PNG/JPG/WebP, up to 5 MB). It is compressed and saved with settings. Save settings to show it at checkout. UPI payment still requires admin verification.</p>
    </div>

    <!-- PAYMENT GATEWAY CONFIG -->
    <div class="p-4 rounded-2xl bg-sand border border-line space-y-3">
      <label class="text-xs font-bold text-ink block">Payment Gateway Mode</label>
      <div class="grid sm:grid-cols-2 gap-3 text-xs">
        <label class="flex items-center gap-2 border border-brand bg-brand-light rounded-xl p-3 cursor-pointer">
          <input type="radio" name="payGatewayMode" checked class="accent-[#0E7C5A]">
          <div><p class="font-bold">DriveNear Pay (Active)</p><p class="text-[10px] text-muted">UPI, Cards, NetBanking with 256-Bit SSL</p></div>
        </label>
        <label class="flex items-center gap-2 border border-line bg-white rounded-xl p-3 cursor-pointer">
          <input type="radio" name="payGatewayMode" class="accent-[#0E7C5A]">
          <div><p class="font-bold">Razorpay / Stripe Gateway</p><p class="text-[10px] text-muted">Live webhook sync & merchant keys</p></div>
        </label>
      </div>
    </div>

    <!-- ANNOUNCEMENT BANNER -->
    <div>
      <label class="text-xs font-bold text-muted block mb-1">Sitewide Announcement Banner</label>
      <textarea id="adminAnnouncement" placeholder="e.g. Special festive discount: 15% off on all SUV bookings this weekend!" class="w-full border border-line rounded-xl px-3.5 py-2.5 text-xs outline-none focus:border-brand min-h-20">${esc(s?.announcement||'')}</textarea>
    </div>

    <button onclick="saveAdminSettings()" class="btn btn-primary font-bold px-6 py-3 rounded-2xl text-xs shadow-card">
      Save All Settings
    </button>
  </div>`;
}

/* ---------------- ADMIN ACTION HANDLERS ---------------- */
async function adminVerifyBookingPayment(id){
  if(!confirm('Confirm you have checked the payment in your bank/UPI app and received the full amount?')) return;
  try {
    if(!window.DN?.enabled()) throw new Error('Firebase is not configured.');
    await DN.db().collection('bookings').doc(id).update({paymentStatus:'paid_verified', paymentVerifiedAt:firebase.firestore.FieldValue.serverTimestamp(), paymentVerifiedBy:state.user?.id||'', updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    pushToast('Payment marked verified. Confirm the booking separately after checking availability.');
    await loadAdminData(false);
  } catch(e){ pushToast(e.message||'Payment verification failed','error'); }
}

async function adminSetBookingStatus(id, status){
  try {
    if(window.DN?.enabled()){
      await DN.db().collection('bookings').doc(id).update({
        status,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    const b = (state.adminData?.bookings || []).find(x=>x.id===id);
    if(b) b.status = status;
    pushToast(`Booking marked as ${status}`);
    renderApp();
  } catch(e){
    pushToast(e.message || 'Could not update booking','error');
  }
}

async function adminToggleCar(id, status){
  try {
    if(window.DN?.enabled()){
      const updates = {status, updatedAt:firebase.firestore.FieldValue.serverTimestamp()};
      if(status === 'active') { updates.verified = true; updates.verificationStatus = 'approved'; }
      await DN.db().collection('cars').doc(id).update(updates);
    }
    const c = CARS.find(x=>String(x.id)===String(id));
    if(c) c.status = status;
    const ac = (state.adminData?.cars || []).find(x=>String(x.id)===String(id));
    if(ac) Object.assign(ac,{status,...(status==='active'?{verified:true,verificationStatus:'approved'}:{})});
    pushToast(`Vehicle status set to ${status}`);
    await loadAdminData(false);
    if(window.DN?.enabled() && typeof loadPublicCarCatalog==='function') await loadPublicCarCatalog();
  } catch(e){
    pushToast(e.message || 'Could not update car','error');
  }
}

async function adminApproveCar(id){
  const car = (state.adminData?.cars || []).find(c=>String(c.id)===String(id));
  if(!car){ pushToast('Car request not found. Refresh the admin data.','error'); return; }
  const label = `${car.brand||''} ${car.model||'car'}`.trim();
  if(!confirm(`Approve ${label} and publish it on Find Cars? Verify the documents and owner details first.`)) return;
  try {
    if(!window.DN?.enabled()) throw new Error('Firebase must be connected to approve a real listing.');
    const u = DN.authUser();
    if(!u) throw new Error('Please sign in again.');
    await DN.db().collection('cars').doc(String(id)).update({
      status:'active', verified:true, verificationStatus:'approved', rejectionReason:'',
      approvedAt:firebase.firestore.FieldValue.serverTimestamp(), approvedBy:u.uid,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    pushToast(`${label} approved and published.`);
    await loadAdminData(false);
    await loadPublicCarCatalog();
    state.adminTab='approvals';
    renderApp();
  } catch(e){
    console.error('Car approval failed:',e);
    pushToast(e?.code==='permission-denied' ? 'Firebase denied approval. Confirm your users/{UID}.role is admin and deploy Firestore rules.' : (e.message||'Could not approve this car.'), 'error');
  }
}

async function adminRejectCar(id){
  const car = (state.adminData?.cars || []).find(c=>String(c.id)===String(id));
  if(!car){ pushToast('Car request not found. Refresh the admin data.','error'); return; }
  const reason = prompt(`Why are you rejecting ${car.brand||''} ${car.model||'this car'}? (Optional)`, 'Please provide valid vehicle documents or correct listing details.');
  if(reason === null) return;
  try {
    if(!window.DN?.enabled()) throw new Error('Firebase must be connected to reject a real listing.');
    const u = DN.authUser();
    if(!u) throw new Error('Please sign in again.');
    await DN.db().collection('cars').doc(String(id)).update({
      status:'rejected', verified:false, verificationStatus:'rejected', rejectionReason:String(reason||'').trim(),
      rejectedAt:firebase.firestore.FieldValue.serverTimestamp(), rejectedBy:u.uid,
      updatedAt:firebase.firestore.FieldValue.serverTimestamp()
    });
    pushToast('Car listing rejected. It will not appear publicly.');
    await loadAdminData(false);
    await loadPublicCarCatalog();
    state.adminTab='approvals';
    renderApp();
  } catch(e){
    console.error('Car rejection failed:',e);
    pushToast(e?.code==='permission-denied' ? 'Firebase denied this action. Confirm your Firestore admin role/rules.' : (e.message||'Could not reject this car.'), 'error');
  }
}

async function adminReopenCarReview(id){
  if(!confirm('Move this rejected car back to pending review?')) return;
  try {
    if(!window.DN?.enabled()) throw new Error('Firebase must be connected to update this listing.');
    await DN.db().collection('cars').doc(String(id)).update({status:'pending',verified:false,verificationStatus:'pending',updatedAt:firebase.firestore.FieldValue.serverTimestamp()});
    await loadAdminData(false);
    state.adminTab='approvals';
    renderApp();
    pushToast('Car returned to pending review.');
  } catch(e){ pushToast(e.message||'Could not reopen review.','error'); }
}

async function adminDeleteCar(id){
  if(!confirm('Remove this vehicle listing? Existing bookings will be retained.')) return;
  try {
    if(window.DN?.enabled()) await DN.db().collection('cars').doc(String(id)).delete();
    CARS = CARS.filter(x=>String(x.id)!==String(id));
    if(Array.isArray(state.ownerCars)) state.ownerCars = state.ownerCars.filter(x=>String(x.id)!==String(id));
    pushToast('Vehicle listing deleted.');
    await loadAdminData(false);
    if(window.DN?.enabled() && typeof loadPublicCarCatalog==='function') await loadPublicCarCatalog();
  } catch(e){ pushToast(e.message || 'Could not delete car','error'); }
}

async function adminSetUserRole(id, role){
  try {
    if(window.DN?.enabled()){
      await DN.db().collection('users').doc(id).update({
        role,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      });
    }
    const u = (state.adminData?.users || []).find(x=>x.id===id);
    if(u) u.role = role;
    pushToast(`User role updated to ${role}`);
    renderApp();
  } catch(e){
    pushToast(e.message || 'Could not update user role','error');
  }
}

async function adminUploadUpiQr(input){
  const file = input?.files?.[0];
  if(!file) return;
  if(!file.type.startsWith('image/')) { pushToast('Please choose an image file.','error'); input.value=''; return; }
  if(file.size > 5 * 1024 * 1024) { pushToast('QR image must be 5 MB or smaller.','error'); input.value=''; return; }
  try {
    const dataUrl = await new Promise((resolve,reject)=>{
      const reader = new FileReader();
      reader.onload = ()=>resolve(reader.result);
      reader.onerror = ()=>reject(new Error('Could not read image.'));
      reader.readAsDataURL(file);
    });
    const img = await new Promise((resolve,reject)=>{
      const image = new Image();
      image.onload=()=>resolve(image); image.onerror=()=>reject(new Error('Invalid image file.'));
      image.src=dataUrl;
    });
    const canvas=document.createElement('canvas');
    const scale=Math.min(1,700/Math.max(img.width,img.height));
    canvas.width=Math.max(1,Math.round(img.width*scale));
    canvas.height=Math.max(1,Math.round(img.height*scale));
    canvas.getContext('2d').drawImage(img,0,0,canvas.width,canvas.height);
    let compressed=canvas.toDataURL('image/jpeg',0.82);
    if(compressed.length > 650000) compressed=canvas.toDataURL('image/jpeg',0.62);
    if(compressed.length > 850000) throw new Error('QR image is still too large. Please upload a smaller/cropped image.');
    const field=document.getElementById('adminUpiQrUrl');
    if(field) field.value=compressed;
    const preview=document.getElementById('adminUpiQrPreview');
    if(preview) preview.innerHTML=`<img src="${compressed}" alt="UPI QR preview" class="w-36 h-36 object-contain rounded-xl bg-white border border-line p-2 mt-3">`;
    pushToast('QR uploaded. Click Save Settings to apply it.');
  } catch(e) {
    console.error('UPI QR upload failed',e);
    pushToast(e.message || 'Could not upload QR image.','error');
  }
}

async function saveAdminSettings(){
  try {
    const raw = document.getElementById('adminWhatsapp')?.value.trim() || '';
    const digits = raw.replace(/\D/g, '');
    let normalized = digits;
    if(digits.length === 10) normalized = '91' + digits;

    const announcement = document.getElementById('adminAnnouncement')?.value.trim() || '';
    const upiId = document.getElementById('adminUpiId')?.value.trim() || '';
    const upiName = document.getElementById('adminUpiName')?.value.trim() || 'DriveNear';
    const upiQrUrl = document.getElementById('adminUpiQrUrl')?.value.trim() || '';
    if (upiId && !/^[\w.\-]{2,256}@[\w.\-]{2,64}$/.test(upiId)) throw new Error('Please enter a valid UPI ID / VPA.');

    state.siteSettings = {
      ...state.siteSettings,
      whatsappNumber: normalized,
      upiId, upiName, upiQrUrl,
      announcement
    };

    if(window.DN?.enabled()){
      await DN.db().collection('siteSettings').doc('general').set({
        whatsappNumber: normalized,
        upiId, upiName, upiQrUrl,
        announcement,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge: true});
    }

    pushToast('Admin settings saved successfully!');
    await loadAdminData(false);
  } catch(e){
    pushToast(e.message || 'Could not save settings','error');
  }
}

function adminWhatsAppNumber(){
  const raw = String(state.siteSettings?.whatsappNumber || state.adminData?.settings?.whatsappNumber || '').replace(/\D/g,'');
  if(!raw) return '';
  return raw.length === 10 ? '91' + raw : raw;
}

function openBookingWhatsApp(id){
  const b = (state.adminData?.bookings || []).find(x=>x.id===id) || (state.myBookings || []).find(x=>x.id===id);
  const number = adminWhatsAppNumber();
  if(!number){
    pushToast('Please set your WhatsApp number in Settings tab first','error');
    setAdminTab('settings');
    return;
  }
  if(!b){
    pushToast('Booking not found','error');
    return;
  }

  const lines = [
    '🚗 *DriveNear Dispatch Alert*',
    '',
    `Booking No: ${b.bookingNumber || b.id}`,
    `Vehicle: ${b.carName || 'Vehicle'}`,
    `Plate: ${b.carRegNumber || 'Verified Plate'}`,
    `Customer: ${b.customerName || 'Customer'} (${b.customerPhone || '—'})`,
    `Pickup: ${b.pickupDate || '—'} ${b.pickupTime || ''}`,
    `Return: ${b.returnDate || '—'} ${b.returnTime || ''}`,
    `Amount: ₹${Number(b.amount||0).toLocaleString('en-IN')}`,
    `Payment: ${b.paymentStatus || 'PAID'}`,
    `Status: ${b.status || 'CONFIRMED'}`
  ];

  const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}
