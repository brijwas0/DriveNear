/* DriveNear — js/pages/ownerDashboard.js */

/* =========================================================
   OWNER DASHBOARD — LIVE FIREBASE BOOKINGS
   ========================================================= */
function pageOwnerDashboard(){
  const myCars = Array.isArray(state.ownerCars) ? state.ownerCars : [];
  const bookings = Array.isArray(state.ownerBookings) ? state.ownerBookings : [];
  const pending = bookings.filter(b=>b.status==='pending').length;
  const upcoming = bookings.filter(b=>['pending','confirmed','active'].includes(b.status)).length;
  const completed = bookings.filter(b=>b.status==='completed').length;
  const earnings = bookings.filter(b=>b.status==='completed').reduce((sum,b)=>sum+Number(b.amount||0),0);
  const stats = [
    [fmt(earnings),'Completed Booking Value'],
    [String(completed),'Completed Trips'],
    [String(pending),'Pending Requests'],
    [String(upcoming),'Active / Upcoming']
  ];
  return `
  <section class="max-w-7xl mx-auto px-5 lg:px-8 py-8 pb-24 lg:pb-8">
    <div class="flex flex-wrap gap-3 items-center justify-between">
      <div>
        <h1 class="display text-2xl sm:text-3xl font-bold">Booking Management</h1>
        <p class="text-muted text-sm mt-1">Manage your real Firebase bookings from one dashboard.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="#/" class="text-sm font-semibold border border-line rounded-full px-4 py-2">← Website</a>
        <a href="#/profile" class="text-sm font-semibold border border-line rounded-full px-4 py-2">Profile</a>
        <button onclick="loadOwnerData(true)" class="text-sm font-semibold border border-line rounded-full px-4 py-2">↻ Refresh</button>
        <a href="#/list-your-car" class="btn btn-primary text-sm font-semibold px-5 py-2.5 rounded-full">+ Add a car</a>
      </div>
    </div>

    <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-7">
      ${stats.map(s=>`
        <div class="bg-white border border-line rounded-2xl p-5">
          <p class="display text-2xl sm:text-3xl font-bold">${s[0]}</p>
          <p class="text-xs text-muted mt-1">${s[1]}</p>
        </div>`).join('')}
    </div>

    <div class="flex gap-2 mt-8 border-b border-line overflow-x-auto">
      ${['cars','requests','calendar','earnings','reviews'].map(t=>`
        <button onclick="setOwnerTab('${t}')" class="px-4 py-3 text-sm font-semibold capitalize whitespace-nowrap ${state.ownerTab===t?'text-brand border-b-2 border-brand':'text-muted'}">${t==='cars'?'My Cars':t==='requests'?'Manage Bookings':t}</button>`).join('')}
    </div>

    <div class="mt-6">
      ${state.ownerTab==='cars' ? `
        <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
          ${myCars.map(c=>`
            <div class="bg-white border border-line rounded-2xl overflow-hidden">
              ${(c.image||c.gallery?.find(Boolean)) ? `<img src="${c.image||c.gallery.find(Boolean)}" alt="${c.brand||''} ${c.model||''}" class="h-36 w-full object-cover">` : `<div class="h-36 w-full bg-sand flex items-center justify-center text-xs text-muted">No car photo uploaded</div>`}
              <div class="p-4">
                <div class="flex items-start justify-between gap-2"><h3 class="font-semibold">${c.brand||''} ${c.model||''}</h3><span class="text-[11px] font-semibold ${c.status==='active'?'text-green-700 bg-green-50':'text-amber-700 bg-amber-50'} px-2 py-1 rounded-full whitespace-nowrap">${c.status==='active'?'Active':c.status==='rejected'?'Rejected':'Pending review'}</span></div>
                <p class="text-brand-ink font-bold mt-1">${fmt(c.pricePerDay ?? c.price ?? 0)}<span class="text-xs font-normal text-muted">/day</span></p>
                <p class="text-xs text-muted mt-1">${c.area||c.location||'Location not set'}${c.year?' · '+c.year:''}</p>
                <div class="flex flex-wrap gap-2 mt-3">
                  <button onclick="setOwnerTab('requests')" class="flex-1 text-xs font-semibold border border-line rounded-full py-2">Bookings</button>
                  <button onclick="openOwnerCar('${c.id}')" class="flex-1 text-xs font-semibold border border-line rounded-full py-2">View</button>
                  <button onclick="deleteMyCar('${c.id}')" class="w-full text-xs font-semibold border border-red-200 text-red-600 hover:bg-red-50 rounded-full py-2" aria-label="Delete ${c.brand||''} ${c.model||''} listing">Delete listing</button>
                </div>
              </div>
            </div>`).join('')}
          ${myCars.length===0 ? `<div class="col-span-full bg-white border border-line rounded-2xl p-10 text-center"><div class="text-4xl">🚗</div><h3 class="font-semibold mt-3">You haven't listed a car yet</h3><p class="text-sm text-muted mt-1">Cars you submit will appear here, including listings waiting for admin review.</p><a href="#/list-your-car" class="inline-block btn btn-primary text-sm font-semibold rounded-full px-5 py-2.5 mt-4">List your first car</a></div>` : ''}
          <a href="#/list-your-car" class="border-2 border-dashed border-line rounded-2xl flex flex-col items-center justify-center gap-2 py-14 text-muted hover:border-brand/50 hover:text-brand transition-colors">
            <span class="text-3xl">＋</span><span class="text-sm font-semibold">Add another car</span>
          </a>
        </div>` : ''}

      ${state.ownerTab==='requests' ? ownerBookingsHtml(bookings) : ''}

      ${state.ownerTab==='calendar' ? `<div class="max-w-md">${calendarWidget('owner')}</div>` : ''}

      ${state.ownerTab==='earnings' ? `
        <div class="bg-white border border-line rounded-2xl p-6">
          <p class="text-sm text-muted">Completed booking value</p>
          <p class="display text-3xl font-bold mt-1">${fmt(earnings)}</p>
          <p class="text-xs text-muted mt-2">${completed} completed booking${completed===1?'':'s'}</p>
        </div>` : ''}

      ${state.ownerTab==='reviews' ? `
        <div class="space-y-4 max-w-2xl">
          ${(CARS[0]?.reviewsList||[]).map(r=>`
            <div class="bg-white border border-line rounded-2xl p-5">
              <div class="flex items-center justify-between"><span class="flex">${starRow(r.rating)}</span><span class="text-xs text-muted">${r.time}</span></div>
              <p class="text-sm mt-2">${r.text}</p><p class="text-xs font-semibold text-muted mt-2">— ${r.name}</p>
            </div>`).join('') || '<p class="text-sm text-muted">No reviews yet.</p>'}
        </div>` : ''}
    </div>
  </section>`;
}

function ownerBookingsHtml(bookings){
  if(!bookings.length) return `
    <div class="bg-white border border-line rounded-2xl p-10 text-center">
      <div class="text-4xl">📋</div>
      <h3 class="font-semibold mt-3">No bookings yet</h3>
      <p class="text-sm text-muted mt-1">New customer bookings will appear here automatically.</p>
    </div>`;

  return `<div class="space-y-3">
    ${bookings.map(b=>{
      const status=b.status||'pending';
      const statusClass = status==='confirmed'||status==='completed' ? 'bg-brand-light text-brand' : status==='cancelled' ? 'bg-red-50 text-red-600' : 'bg-sand text-muted';
      return `<div class="bg-white border border-line rounded-2xl p-5">
        <div class="flex flex-wrap gap-4 items-start justify-between">
          <div>
            <p class="font-semibold">${b.bookingNumber||b.id}</p>
            <p class="text-sm text-muted mt-1">Car: ${b.carId||'—'}</p>
            <p class="text-xs text-muted mt-1">${b.pickupDate||'—'} ${b.pickupTime||''} → ${b.returnDate||'—'} ${b.returnTime||''}</p>
            <p class="text-xs text-muted mt-1">Customer: ${b.userId||'—'}</p>
          </div>
          <div class="text-right">
            <p class="font-bold">${fmt(b.amount||0)}</p>
            <span class="inline-block mt-1 text-[11px] font-semibold px-2 py-1 rounded-full ${statusClass}">${status}</span>
          </div>
        </div>
        ${status!=='cancelled' && status!=='completed' ? `
        <div class="flex flex-wrap gap-2 mt-4 pt-4 border-t border-line">
          ${status==='pending'?`<button onclick="changeBookingStatus('${b.id}','confirmed')" class="btn btn-primary text-xs font-semibold rounded-full px-4 py-2">Accept</button>`:''}
          ${status==='pending'?`<button onclick="changeBookingStatus('${b.id}','cancelled')" class="text-xs font-semibold border border-line rounded-full px-4 py-2">Decline</button>`:''}
          ${status==='confirmed'?`<button onclick="changeBookingStatus('${b.id}','active')" class="btn btn-primary text-xs font-semibold rounded-full px-4 py-2">Mark Active</button>`:''}
          ${status==='active'?`<button onclick="changeBookingStatus('${b.id}','completed')" class="btn btn-primary text-xs font-semibold rounded-full px-4 py-2">Complete Trip</button>`:''}
          ${status!=='pending'?`<button onclick="changeBookingStatus('${b.id}','cancelled')" class="text-xs font-semibold border border-line rounded-full px-4 py-2">Cancel</button>`:''}
        </div>`:''}
      </div>`;
    }).join('')}
  </div>`;
}

async function loadOwnerBookings(showToast=false){
  if(!window.DN || !DN.enabled() || !state.user?.id) return;
  try {
    state.ownerBookings = await DN.getOwnerBookings();
    if(showToast) pushToast(`${state.ownerBookings.length} booking(s) loaded`);
    renderApp();
  } catch(e) {
    console.error('Owner booking load failed:',e);
    if(showToast) pushToast(e.message||'Could not load bookings','error');
  }
}

async function changeBookingStatus(bookingId,status){
  try {
    await DN.updateBookingStatus(bookingId,status);
    pushToast(`Booking ${status}`);
    await loadOwnerBookings(false);
  } catch(e) {
    console.error(e);
    pushToast(e.message||'Could not update booking','error');
  }
}

async function loadOwnerCars(showToast=false){
  if(!window.DN || !DN.enabled() || !state.user?.id) {
    if(showToast) pushToast('Please sign in with the account that listed the car.','error');
    return;
  }
  try {
    const rows = await DN.getMyCars();
    state.ownerCars = rows.map(c=>({
      ...c,
      price: c.pricePerDay ?? c.price ?? 0,
      priceHour: c.pricePerHour ?? c.priceHour ?? 0,
      area: c.area || c.location || '',
      reviews: c.reviewsCount ?? c.reviews ?? 0,
      gallery: c.gallery || (c.image ? [c.image] : []),
      features: c.features || [],
      owner: c.owner || {name:c.ownerName || 'Owner'}
    }));
    if(showToast) pushToast(`${state.ownerCars.length} car listing(s) loaded`);
    renderApp();
  } catch(e) {
    console.error('Owner car load failed:', e);
    if(showToast) pushToast(e.message || 'Could not load your car listings','error');
  }
}

async function loadOwnerData(showToast=false){
  await Promise.all([loadOwnerCars(showToast), loadOwnerBookings(false)]);
}

async function deleteMyCar(carId){
  const car = (state.ownerCars || []).find(c=>String(c.id)===String(carId));
  if(!car){ pushToast('This car listing was not found in your account. Refresh and try again.','error'); return; }
  if(!state.user?.id || car.ownerId !== state.user.id){
    pushToast('You can delete only cars listed by your signed-in account.','error');
    return;
  }
  const label = `${car.brand || ''} ${car.model || ''}`.trim() || 'this car';
  if(!window.confirm(`Delete ${label} from your listings? This cannot be undone. Existing booking records will remain.`)) return;
  try {
    await DN.deleteCar(carId);
    state.ownerCars = (state.ownerCars || []).filter(c=>String(c.id)!==String(carId));
    if(Array.isArray(CARS)) CARS = CARS.filter(c=>String(c.id)!==String(carId));
    if(Array.isArray(state.adminData?.cars)) state.adminData.cars = state.adminData.cars.filter(c=>String(c.id)!==String(carId));
    pushToast(`${label} listing deleted.`);
    renderApp();
  } catch(e) {
    console.error('Car listing deletion failed:', e);
    pushToast(e?.code==='permission-denied' ? 'Firebase denied deletion. Check Firestore rules and sign in as the listing owner.' : (e.message || 'Could not delete this listing.'), 'error');
  }
}

function openOwnerCar(carId){
  const target = '#/cars/' + String(carId || '').replace(/^#?\//, '');
  state.modal = null;
  state.route = target;
  location.hash = target;
  renderApp();
  window.scrollTo({top:0, behavior:'auto'});
}

function setOwnerTab(t){ state.ownerTab=t; renderApp(); }

function animateCounters(){
  document.querySelectorAll('.counter').forEach(el=>{
    const target = el.dataset.target;
    const numMatch = target.replace(/[^0-9.]/g,'');
    const num = parseFloat(numMatch);
    if(isNaN(num)) return;
    const prefix = target.match(/^[^\d]*/)[0];
    const suffix = target.replace(/^[^\d.]*[\d.,]+/,'');
    let cur = 0; const steps=30; const inc = num/steps;
    let i=0;
    const t = setInterval(()=>{
      i++; cur += inc;
      el.textContent = prefix + (num%1!==0? cur.toFixed(1) : Math.round(cur).toLocaleString('en-IN')) + suffix;
      if(i>=steps){ clearInterval(t); el.textContent=target; }
    }, 25);
  });
}

function pageOwnerCars(){ state.ownerTab='cars'; return pageOwnerDashboard(); }
function pageOwnerCalendar(){ state.ownerTab='calendar'; return pageOwnerDashboard(); }
