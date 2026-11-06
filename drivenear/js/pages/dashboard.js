/* DriveNear — js/pages/dashboard.js */

/* =========================================================
   RENTER DASHBOARD
   ========================================================= */
function pageDashboard(){
  const tabs = ['trips','saved','messages','reviews','profile'];
  const bookings = Array.isArray(state.myBookings) ? state.myBookings : [];
  return `
  <section class="max-w-6xl mx-auto px-5 lg:px-8 py-8 pb-24 lg:pb-8">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h1 class="display text-2xl sm:text-3xl font-bold">My Trips</h1>
        <p class="text-sm text-muted mt-1">Your bookings are loaded directly from Firebase.</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <a href="#/" class="btn btn-primary text-sm font-semibold rounded-full px-4 py-2">← Back to Website</a>
        <a href="#/profile" class="text-sm font-semibold border border-line rounded-full px-4 py-2">Profile</a>
        <button onclick="refreshMyBookings()" class="text-sm font-semibold border border-line rounded-full px-4 py-2">↻ Refresh</button>
      </div>
    </div>
    <div class="flex gap-2 mt-6 border-b border-line overflow-x-auto">
      ${tabs.map(t=>`<button onclick="setDashTab('${t}')" class="px-4 py-3 text-sm font-semibold capitalize whitespace-nowrap ${state.dashboardTab===t?'text-brand border-b-2 border-brand':'text-muted'}">${t}</button>`).join('')}
    </div>
    <div class="mt-6">
      ${state.dashboardTab==='trips' ? renterBookingsHtml(bookings) : ''}
      ${state.dashboardTab==='saved' ? pageSavedInner() : ''}
      ${state.dashboardTab==='messages' && CONVERSATIONS.length ? `<a href="#/messages" class="text-sm font-semibold text-brand">Open full inbox ${ICO.arrowR}</a>` : ''}
      ${state.dashboardTab==='reviews' ? `
        <div class="space-y-4 max-w-2xl">
          ${(CARS[1]?.reviewsList?.length) ? CARS[1].reviewsList.map(r=>`
            <div class="bg-white border border-line rounded-2xl p-5">
              <div class="flex items-center justify-between"><span class="flex">${starRow(r.rating)}</span><span class="text-xs text-muted">${r.time}</span></div>
              <p class="text-sm mt-2">${r.text}</p><p class="text-xs font-semibold text-muted mt-2">— ${r.name}</p>
            </div>`).join('') : `<div class="bg-white border border-line rounded-2xl p-8 text-center text-muted"><p class="font-semibold text-ink text-sm">No reviews yet</p><p class="text-xs text-muted mt-1">Reviews from completed trips will appear here.</p></div>`}
        </div>` : ''}
      ${state.dashboardTab==='profile' ? profileInner() : ''}
    </div>
  </section>`;
}

function renterBookingsHtml(bookings){
  if(!bookings.length) return `
    <div class="bg-white border border-line rounded-2xl p-10 text-center">
      <div class="text-4xl">🚗</div>
      <h3 class="font-semibold mt-3">No bookings yet</h3>
      <p class="text-sm text-muted mt-1">Your confirmed and previous bookings will appear here.</p>
      <a href="#/cars" class="btn btn-primary inline-flex mt-5 px-5 py-2.5 rounded-full text-sm font-semibold">Browse Cars</a>
    </div>`;

  return `<div class="space-y-3">
    ${bookings.map(b=>{
      const status=b.status||'pending';
      const cls=status==='confirmed'||status==='completed'?'bg-brand-light text-brand':status==='cancelled'?'bg-red-50 text-red-600':'bg-sand text-muted';
      const carTitle = b.carName || (b.car ? `${b.car.brand} ${b.car.model}` : b.carId) || 'Vehicle';
      const carPlate = b.carRegNumber || b.car?.regNumber || '';
      return `<div class="bg-white border border-line rounded-2xl p-5 shadow-sm">
        <div class="flex flex-wrap items-start justify-between gap-4">
          <div>
            <div class="flex items-center gap-2">
              <span class="font-mono font-bold text-sm text-brand">${b.bookingNumber||b.id}</span>
              ${b.transactionId ? `<span class="text-[10px] text-muted font-mono bg-sand px-2 py-0.5 rounded">${b.transactionId}</span>` : ''}
            </div>
            <p class="text-sm font-bold text-ink mt-1">${carTitle} ${carPlate?`<span class="text-xs font-mono font-normal text-muted">(${carPlate})</span>`:''}</p>
            <p class="text-xs text-muted mt-1">Schedule: ${b.pickupDate||'—'} ${b.pickupTime||''} → ${b.returnDate||'—'} ${b.returnTime||''}</p>
            <p class="text-xs text-muted mt-0.5">Location: ${b.pickupLocation || 'Agra, UP'}</p>
          </div>
          <div class="text-right">
            <p class="font-bold text-base text-brand-ink">${fmt(b.amount||0)}</p>
            <span class="inline-block mt-1 text-[11px] font-semibold px-2.5 py-0.5 rounded-full ${cls} capitalize">${status}</span>
          </div>
        </div>
        <div class="flex flex-wrap items-center gap-2 mt-4 pt-3 border-t border-line">
          <button onclick="state.lastBookingData=state.myBookings.find(x=>x.id==='${b.id}'); openBookingInvoiceModal()" class="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-line bg-white hover:bg-sand flex items-center gap-1.5">
            <span>🧾 Tax Invoice</span>
          </button>
          <button onclick="state.lastBookingData=state.myBookings.find(x=>x.id==='${b.id}'); notifyOwnerWhatsAppFromLastBooking()" class="text-xs font-semibold px-3.5 py-1.5 rounded-xl border border-green-300 text-green-800 bg-green-50 hover:bg-green-100 flex items-center gap-1.5">
            <span>📱 WhatsApp Host</span>
          </button>
        </div>
      </div>`;
    }).join('')}
  </div>`;
}

async function refreshMyBookings(){
  try {
    state.myBookings = await DN.getMyBookings();
    renderApp();
    pushToast(`${state.myBookings.length} booking(s) loaded`);
  } catch(e) {
    pushToast(e.message||'Could not load bookings','error');
  }
}

function setDashTab(t){ state.dashboardTab=t; renderApp(); }
