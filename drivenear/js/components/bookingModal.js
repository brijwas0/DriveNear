/* DriveNear — js/components/bookingModal.js
   Professional Car Booking & Payment Gateway System
*/

let selectedPayTab = 'upi'; // 'upi' | 'cash' | gateway methods require a configured provider
let selectedUpiApp = 'gpay';
let selectedBank = 'HDFC';
let bookingInvoiceOpen = false;

function openBooking(carId){
  if(!state.user){
    openModal('login');
    pushToast('Please log in or sign up to book this car','info');
    return;
  }
  const requestedCar = findDriveNearCarById(carId);
  if(!requestedCar || String(requestedCar.status || 'active').toLowerCase() !== 'active' || (requestedCar.ownerId && state.user?.id && String(requestedCar.ownerId) === String(state.user.id))){
    pushToast('This car is not available for booking yet. Please choose an active listing.','error');
    return;
  }
  state.bookingCar = requestedCar;
  state.bookingSchedule = { pickupDate:'', pickupTime:'', returnDate:'', returnTime:'' };
  state.bookingUtr = '';
  state.bookingStep = 1;
  state.modal = 'booking';
  renderApp();
}

const BOOK_STEPS = ['Dates','Summary','Verification','Payment','Confirmed'];

function bookingModalHtml(){
  const car = state.bookingCar;
  if(!car) return '';
  const step = state.bookingStep;
  return `
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
    <div class="modal-backdrop absolute inset-0 bg-ink/50" onclick="closeModal()"></div>
    <div class="modal-panel relative bg-white w-full sm:max-w-xl sm:rounded-3xl rounded-t-3xl max-h-[92vh] overflow-y-auto shadow-lift">
      <!-- HEADER -->
      <div class="sticky top-0 bg-white border-b border-line px-6 py-4 flex items-center justify-between z-10">
        <div class="flex items-center gap-2">
          <span class="w-7 h-7 rounded-lg bg-brand text-white flex items-center justify-center font-bold text-xs display">D</span>
          <h3 class="display font-bold text-base sm:text-lg">${step<5 ? 'Book ' + car.brand + ' ' + car.model : 'Booking Request Submitted'}</h3>
        </div>
        <button onclick="closeModal()" aria-label="Close" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sand text-muted hover:text-ink">${ICO.close}</button>
      </div>

      <!-- PROGRESS STEPPER -->
      ${step<5 ? `
      <div class="px-6 pt-4 pb-2 flex items-center gap-2 border-b border-line/60 bg-sand/30">
        ${BOOK_STEPS.slice(0,4).map((s,i)=>`
          <div class="flex-1 flex items-center gap-2">
            <span class="w-6 h-6 rounded-full text-[11px] font-bold flex items-center justify-center transition-all ${i+1<=step?'bg-brand text-white shadow-sm':'bg-line text-muted'}">${i+1<step?'✓':i+1}</span>
            <span class="text-[11px] font-semibold text-muted hidden sm:inline ${i+1===step?'text-ink font-bold':''}">${s}</span>
            ${i<3?`<span class="flex-1 h-0.5 ${i+1<step?'bg-brand':'bg-line'}"></span>`:''}
          </div>`).join('')}
      </div>`:''}

      <!-- CONTENT -->
      <div class="p-6">${bookingStepContent(car, step)}</div>
    </div>
  </div>
  ${bookingInvoiceHtml()}`;
}

function bookingStepContent(car, step){
  const u = state.user || { name: 'Customer', phone: '', email: '', drivingLicence: '' };
  const total = (car.price*2) + 199 + Math.round(car.price*2*0.05) + (car.deposit||3000);

  // STEP 1: DATES
  if(step===1) return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h4 class="font-bold text-base display">Select Rental Dates</h4>
        <p class="text-xs text-muted mt-0.5">Choose your pickup and return schedule for ${car.brand} ${car.model}.</p>
      </div>
      <span class="text-xs font-semibold px-2 py-1 rounded bg-sand text-muted">2 Days Trip</span>
    </div>

    <div class="grid grid-cols-2 gap-3 mt-4">
      <div>
        <label class="text-[11px] font-semibold text-muted">Pick-up date *</label>
        <input type="date" id="pickupDate" value="${state.bookingSchedule?.pickupDate || ''}" required aria-required="true" oninput="clearBookingFieldError('pickupDate')" class="w-full mt-1 border border-line rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:border-brand">
      </div>
      <div>
        <label class="text-[11px] font-semibold text-muted">Pick-up time *</label>
        <input type="time" id="pickupTime" value="${state.bookingSchedule?.pickupTime || ''}" required aria-required="true" oninput="clearBookingFieldError('pickupTime')" class="w-full mt-1 border border-line rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:border-brand">
      </div>
      <div>
        <label class="text-[11px] font-semibold text-muted">Return date *</label>
        <input type="date" id="returnDate" value="${state.bookingSchedule?.returnDate || ''}" required aria-required="true" oninput="clearBookingFieldError('returnDate')" class="w-full mt-1 border border-line rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:border-brand">
      </div>
      <div>
        <label class="text-[11px] font-semibold text-muted">Return time *</label>
        <input type="time" id="returnTime" value="${state.bookingSchedule?.returnTime || ''}" required aria-required="true" oninput="clearBookingFieldError('returnTime')" class="w-full mt-1 border border-line rounded-xl px-3 py-2.5 text-xs font-medium outline-none focus:border-brand">
      </div>
    </div>

    <div class="mt-4 p-3.5 bg-sand/80 rounded-2xl border border-line text-xs space-y-1">
      <div class="flex justify-between"><span class="text-muted">Pickup Location</span><span class="font-medium">${car.area || car.location || 'Location on request'}</span></div>
      <div class="flex justify-between"><span class="text-muted">Includes</span><span class="font-medium">500 km total (250 km/day)</span></div>
    </div>

    <button onclick="bookingNext()" class="btn btn-primary w-full font-bold py-3.5 rounded-2xl mt-6 text-sm shadow-card flex items-center justify-center gap-2">
      <span>Continue to Summary</span>
      <span>${ICO.arrowR}</span>
    </button>`;

  // STEP 2: SUMMARY & FARE BREAKDOWN
  if(step===2) return `
    <div class="flex gap-3.5 bg-sand/70 rounded-2xl p-3.5 border border-line">
      ${(car.image || (car.gallery && car.gallery.find(Boolean))) ? `<img src="${car.image || car.gallery.find(Boolean)}" class="w-24 h-20 rounded-xl object-cover shrink-0" alt="Car photo">` : `<div class="w-24 h-20 rounded-xl bg-sand shrink-0 flex items-center justify-center text-xs text-muted">No photo</div>`}
      <div class="flex-1">
        <p class="font-bold text-sm text-ink">${car.brand} ${car.model} <span class="text-muted text-xs font-normal">(${car.year||2023})</span></p>
        <p class="text-xs text-muted mt-1">${car.transmission} · ${car.fuel} · ${car.seats} Seats</p>
        <p class="text-xs text-brand font-medium mt-1 flex items-center gap-1">${ICO.pin} ${car.area || 'Location on request'}</p>
      </div>
    </div>

    <div class="mt-5 space-y-2.5 text-xs">
      <div class="flex justify-between"><span class="text-muted">Base Rental (2 days @ ₹${car.price}/day)</span><span class="font-medium">${fmt(car.price*2)}</span></div>
      <div class="flex justify-between"><span class="text-muted">DriveNear Platform Protection Fee</span><span class="font-medium">${fmt(199)}</span></div>
      <div class="flex justify-between"><span class="text-muted">GST & State Road Taxes (5%)</span><span class="font-medium">${fmt(Math.round(car.price*2*0.05))}</span></div>
      <div class="flex justify-between text-amber-900 bg-amber-50 px-2.5 py-1.5 rounded-xl border border-amber-200">
        <span>Refundable Security Deposit</span>
        <span class="font-bold">${fmt(car.deposit||3000)}</span>
      </div>
      <div class="flex justify-between font-bold text-sm border-t border-line pt-3 text-ink">
        <span>Total Payable Today</span>
        <span class="text-brand-ink text-base">${fmt(total)}</span>
      </div>
    </div>

    <div class="flex gap-3 mt-6">
      <button onclick="bookingBack()" class="flex-1 font-semibold py-3 rounded-2xl border border-line text-xs hover:bg-sand">Back</button>
      <button onclick="bookingNext()" class="flex-1 btn btn-primary font-bold py-3 rounded-2xl text-xs shadow-card">Confirm & Verify</button>
    </div>`;

  // STEP 3: REAL USER VERIFICATION (NO HARDCODED DEMO DATA)
  if(step===3) {
    const userName = u.name || 'Verified User';
    const userPhone = u.phone ? (u.phone.startsWith('+') ? u.phone : `+91 ${u.phone}`) : '+91 (Add in profile)';
    const userDL = u.drivingLicence || '';

    return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h4 class="font-bold text-base display">Driver Verification</h4>
        <p class="text-xs text-muted mt-0.5">Verified driver profile required for vehicle insurance coverage.</p>
      </div>
      <span class="text-xs font-semibold px-2 py-0.5 rounded-full bg-brand-light text-brand">Secure</span>
    </div>

    <div class="space-y-3">
      <!-- Required user details -->
      <div class="space-y-3">
        <div>
          <label for="bookingDriverName" class="text-xs font-semibold text-muted block mb-1">Full name *</label>
          <input id="bookingDriverName" value="${String(u.name||'').replace(/[&<>"]/g,'')}" autocomplete="name" placeholder="Enter your full name" oninput="clearBookingFieldError('bookingDriverName')" class="w-full border border-line rounded-xl px-3 py-2.5 text-xs outline-none focus:border-brand">
        </div>
        <div>
          <label for="bookingDriverPhone" class="text-xs font-semibold text-muted block mb-1">Contact mobile *</label>
          <input id="bookingDriverPhone" value="${String(u.phone||'').replace(/[&<>"]/g,'')}" autocomplete="tel" inputmode="tel" placeholder="Enter contact number" oninput="clearBookingFieldError('bookingDriverPhone')" class="w-full border border-line rounded-xl px-3 py-2.5 text-xs outline-none focus:border-brand">
        </div>
      </div>

      <!-- Driving Licence (Editable input if not added) -->
      <div class="border border-line rounded-2xl p-4 bg-white">
        <label class="text-xs font-semibold text-muted block mb-1">Indian Driving Licence Number *</label>
        <div class="flex gap-2">
          <input id="bookingDriverDL" value="${userDL}" oninput="clearBookingFieldError('bookingDriverDL')" placeholder="e.g. DL1420210012345 or UP8020190001234" class="flex-1 border border-line rounded-xl px-3 py-2 text-xs font-mono uppercase tracking-wider outline-none focus:border-brand">
          <button type="button" onclick="saveBookingDL()" class="text-xs font-semibold px-3 py-2 rounded-xl bg-sand border border-line hover:bg-line">Save</button>
        </div>
        <p class="text-[11px] text-muted mt-1.5 flex items-center gap-1">
          <span>ℹ️</span> Original licence will be inspected physically by the host at handover.
        </p>
      </div>
    </div>

    <div class="flex gap-3 mt-6">
      <button onclick="bookingBack()" class="flex-1 font-semibold py-3 rounded-2xl border border-line text-xs hover:bg-sand">Back</button>
      <button onclick="bookingVerifyNext()" class="flex-1 btn btn-primary font-bold py-3 rounded-2xl text-xs shadow-card">Proceed to Payment</button>
    </div>`;
  }

  // STEP 4: PROFESSIONAL PAYMENT GATEWAY SYSTEM
  if(step===4) {
    return `
    <div class="bg-gradient-to-r from-emerald-900 to-teal-900 text-white p-4 rounded-2xl mb-4 shadow-sm">
      <div class="flex items-center justify-between">
        <div>
          <p class="text-[11px] uppercase tracking-wider text-emerald-300 font-bold">DriveNear Checkout</p>
          <p class="text-xl font-bold mt-0.5">${fmt(total)}</p>
        </div>
        <div class="text-right text-[11px] text-emerald-200">
          <p class="flex items-center gap-1">🔒 Secure booking request</p>
          <p>UTR required · admin verification pending</p>
        </div>
      </div>
    </div>

    <!-- PAYMENT METHOD TABS -->
    <div class="flex gap-1.5 p-1 bg-sand rounded-2xl border border-line mb-4 text-xs font-semibold">
      <button type="button" onclick="setPayTab('upi')" class="flex-1 py-2 rounded-xl transition-all ${selectedPayTab==='upi'?'bg-white shadow-sm text-brand font-bold':''}">📱 UPI / QR</button>
      <button type="button" onclick="setPayTab('cash')" class="flex-1 py-2 rounded-xl transition-all ${selectedPayTab==='cash'?'bg-white shadow-sm text-brand font-bold':''}">💵 Pay on pickup</button>
    </div>

    <!-- TAB 1: UPI & QR -->
    ${selectedPayTab==='upi' ? `
      <div class="space-y-3">
        <p class="text-xs font-semibold text-muted">Select UPI App or Scan QR</p>
        <div class="grid grid-cols-4 gap-2">
          ${[['gpay','Google Pay','https://cdn.iconscout.com/icon/free/png-256/free-google-pay-2038779-1721670.png'],
             ['phonepe','PhonePe','https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/phonepe-icon.png'],
             ['paytm','Paytm','https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/paytm-icon.png'],
             ['bhim','BHIM','https://uxwing.com/wp-content/themes/uxwing/download/brands-and-social-media/bhim-upi-icon.png']
          ].map(([id,name])=>`
            <button type="button" onclick="selectUpiApp('${id}')" class="p-2.5 rounded-xl border ${selectedUpiApp===id?'border-brand bg-brand-light font-bold':'border-line bg-white'} text-center transition-all">
              <span class="text-xl block">⚡</span>
              <span class="text-[11px] leading-tight block mt-1">${name}</span>
            </button>`).join('')}
        </div>

        <div>
          <label class="text-[11px] font-semibold text-muted">Or enter UPI ID / VPA</label>
          <div class="relative mt-1">
            <input id="upiIdInput" placeholder="e.g. username@okhdfcbank or 9876543210@paytm" class="w-full border border-line rounded-xl px-3 py-2.5 text-xs outline-none focus:border-brand">
            <span class="absolute right-3 top-2.5 text-xs text-brand font-semibold">Verify</span>
          </div>
        </div>

        <div class="p-4 bg-white rounded-2xl border border-line space-y-3 text-xs">
          <div class="flex items-start justify-between gap-3"><div><p class="font-bold text-sm">Pay ${fmt(total)} using UPI</p><p class="text-muted mt-1">Payee: ${String(state.siteSettings?.upiName||'DriveNear').replace(/[&<>"]/g,'')}</p><p class="font-semibold mt-1">UPI ID: ${String(state.siteSettings?.upiId||'Not configured by admin').replace(/[&<>"]/g,'')}</p></div>
          ${state.siteSettings?.upiQrUrl ? `<img src="${String(state.siteSettings.upiQrUrl).replace(/["<>]/g,'')}" alt="UPI payment QR" class="w-28 h-28 object-contain border border-line rounded-xl p-1">` : '<div class="w-28 h-28 rounded-xl bg-sand flex items-center justify-center text-center text-muted p-2">Admin QR not configured</div>'}</div>
          ${state.siteSettings?.upiId ? `<a class="inline-flex px-3 py-2 rounded-xl bg-brand text-white font-bold" href="upi://pay?pa=${encodeURIComponent(state.siteSettings.upiId)}&pn=${encodeURIComponent(state.siteSettings.upiName||'DriveNear')}&am=${encodeURIComponent(String(total))}&cu=INR&tn=${encodeURIComponent('DriveNear booking')}">Open UPI App</a>` : ''}
          <p class="text-[11px] text-amber-800 bg-amber-50 rounded-xl p-3">After paying, enter the UTR / transaction reference shown in your UPI app. The request cannot be submitted without it and stays pending until the admin verifies the payment against their bank/UPI statement. Never rely on a screenshot alone.</p>
          <div class="mt-3">
            <label for="bookingUtr" class="text-[11px] font-semibold text-ink">UPI UTR / Transaction ID <span class="text-red-600">*</span></label>
            <input id="bookingUtr" name="bookingUtr" type="text" required minlength="6" maxlength="50" autocomplete="off" placeholder="Enter UTR / transaction reference" value="${String(state.bookingUtr || '').replace(/[&<>"]/g,'')}" oninput="clearBookingFieldError('bookingUtr')" class="w-full mt-1 border border-line rounded-xl px-3 py-2.5 text-xs outline-none focus:border-brand" aria-describedby="bookingUtrHelp">
            <p id="bookingUtrHelp" class="text-[10px] text-muted mt-1">Required for UPI/QR payment. This does not mean payment is verified.</p>
          </div>
        </div>
      </div>` : ''}

    ${selectedPayTab==='cash' ? `
      <div class="rounded-2xl border border-line bg-white p-4 space-y-2">
        <h4 class="font-bold text-sm">Pay at pickup</h4>
        <p class="text-xs text-muted">Send a booking request now. The car owner must accept it, and payment must be collected and marked by the owner/admin before the booking is confirmed.</p>
        <p class="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">No payment is charged on this page. Card, netbanking and wallet payments require a real payment-gateway account and server-side verification before they can be enabled.</p>
      </div>` : `
      <div class="rounded-2xl border border-line bg-white p-4 space-y-2">
        <h4 class="font-bold text-sm">UPI / QR payment</h4>
        <p class="text-xs text-muted">Choose your UPI app to make payment using the owner's configured UPI details/QR. The booking remains pending until payment is verified.</p>
        <p class="text-xs text-amber-800 bg-amber-50 rounded-xl p-3">A static QR or UPI ID does not provide automatic payment verification. Do not mark a payment paid until you verify it in your payment account.</p>
      </div>`}

    <div class="mt-5 p-3 rounded-xl bg-sand text-[11px] text-muted flex items-center justify-between">
      <span>Total due: <strong>${fmt(total)}</strong></span>
      <span class="text-amber-700 font-semibold">Pending until verified</span>
    </div>

    <!-- ACTION BUTTONS -->
    <div class="flex gap-3 mt-5">
      <button onclick="bookingBack()" class="flex-1 font-semibold py-3 rounded-2xl border border-line text-xs hover:bg-sand">Back</button>
      <button id="pay-btn" onclick="bookingPay()" class="flex-1 btn btn-primary font-bold py-3 rounded-2xl text-xs shadow-card flex items-center justify-center gap-2">
        <span>Submit Booking Request · ${fmt(total)}</span>
      </button>
    </div>`;
  }

  // STEP 5: CONFIRMED WITH INVOICE & WHATSAPP ACTIONS
  if(step===5) {
    const lastB = state.lastBookingData || {};
    return `
    <div class="relative flex flex-col items-center text-center py-4 overflow-hidden" id="confetti-wrap">
      <div class="success-ring w-20 h-20 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center text-4xl shadow-card">
        ✓
      </div>
      <h3 class="display text-2xl font-bold mt-4">Booking Request Submitted</h3>
      <p class="text-muted text-xs mt-1 max-w-sm">Your request for <strong>${fmt(lastB.amount || total)}</strong> has been saved. The booking is not confirmed until the owner accepts and payment is verified.</p>

      <!-- RECEIPT / SUMMARY CARD -->
      <div class="bg-sand rounded-2xl p-4 mt-5 w-full text-left text-xs border border-line space-y-2">
        <div class="flex justify-between items-center pb-2 border-b border-line/60">
          <div>
            <p class="text-muted text-[10px] uppercase font-bold">Booking Reference</p>
            <p class="font-bold text-sm font-mono text-brand">${lastB.bookingNumber || state.lastBookingNumber || 'DN-CONFIRMED'}</p>
          </div>
          <span class="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]">PENDING REVIEW</span>
        </div>
        <div class="flex justify-between"><span class="text-muted">Vehicle</span><span class="font-bold">${car.brand} ${car.model} (${car.year||2023})</span></div>
        <div class="flex justify-between"><span class="text-muted">Payment status</span><span class="font-mono">${lastB.paymentStatus || 'pending'}</span></div>
        <div class="flex justify-between"><span class="text-muted">Payment Mode</span><span class="capitalize">${lastB.paymentMethod || 'UPI / Gateway'}</span></div>
        <div class="flex justify-between"><span class="text-muted">Rental Schedule</span><span>Aug 30, 10:00 AM → Sep 01, 10:00 AM</span></div>
        <div class="flex justify-between"><span class="text-muted">Handover Location</span><span>${car.area || 'Location on request'}</span></div>
      </div>

      <!-- PRIMARY ACTION BUTTONS -->
      <div class="w-full space-y-2.5 mt-6">
        <button onclick="openBookingInvoiceModal()" class="w-full font-semibold py-3 rounded-2xl border border-line bg-white hover:bg-sand text-xs flex items-center justify-center gap-2 shadow-sm">
          <span>🧾 View / Print Official Tax Invoice & Receipt</span>
        </button>
        <button onclick="notifyOwnerWhatsAppFromLastBooking()" class="w-full font-semibold py-3 rounded-2xl border border-green-300 text-green-800 bg-green-50 hover:bg-green-100 text-xs flex items-center justify-center gap-2">
          <span>📱 Notify Car Owner on WhatsApp</span>
        </button>
        <button onclick="closeModal(); nav('#/dashboard')" class="btn btn-primary w-full font-semibold py-3 rounded-2xl text-xs">
          View in My Bookings
        </button>
      </div>

      ${CARS.filter(c=>c.id!==car.id).length ? `
      <!-- RECOMMENDED CARS IN CONFIRMATION -->
      <div class="mt-8 pt-5 border-t border-line w-full text-left">
        <p class="font-bold text-xs uppercase tracking-wider text-muted">You might also like for future trips:</p>
        <div class="flex gap-3 overflow-x-auto mt-3 pb-2">
          ${CARS.filter(c=>c.id!==car.id).slice(0,3).map(c=>`
            <div onclick="closeModal(); nav('#/cars/${c.id}')" class="shrink-0 w-44 bg-white border border-line rounded-xl p-2 cursor-pointer hover:shadow-card transition-shadow">
              <img src="${c.image}" class="w-full h-20 rounded-lg object-cover">
              <p class="font-bold text-xs mt-2 truncate">${c.brand} ${c.model}</p>
              <p class="text-[11px] text-brand font-semibold">${fmt(c.price)}/day</p>
            </div>`).join('')}
        </div>
      </div>` : ''}
    </div>`;
  }

  return '';
}

function setPayTab(t){
  selectedPayTab = t;
  if(t === 'cash') state.bookingUtr = '';
  renderApp();
}

function selectUpiApp(id){
  selectedUpiApp = id;
  renderApp();
}

function formatCardNumber(input){
  let val = input.value.replace(/\D/g, '').substring(0,16);
  let sections = val.match(/.{1,4}/g);
  input.value = sections ? sections.join('  ') : val;
}

function saveBookingDL(){
  const dl = document.getElementById('bookingDriverDL')?.value.trim().toUpperCase();
  if(!dl){
    pushToast('Please enter your Driving Licence number','error');
    return;
  }
  if(!state.user) state.user = {};
  state.user.drivingLicence = dl;
  saveUserSession(state.user);
  pushToast('Driving licence saved ✓');
  renderApp();
}

function bookingVerifyNext(){
  const nameInput = document.getElementById('bookingDriverName');
  const phoneInput = document.getElementById('bookingDriverPhone');
  const dlInputEl = document.getElementById('bookingDriverDL');
  const name = (nameInput?.value || '').trim();
  const phone = (phoneInput?.value || '').trim();
  const dl = (dlInputEl?.value || '').trim().toUpperCase();
  let valid = true;
  if(!name){ setBookingFieldError('bookingDriverName','Enter your full name.'); valid=false; }
  if(!phone || phone.replace(/\D/g,'').length < 7){ setBookingFieldError('bookingDriverPhone','Enter a valid contact number.'); valid=false; }
  if(!dl){ setBookingFieldError('bookingDriverDL','Enter your driving licence number.'); valid=false; }
  if(!valid){ pushToast('Please complete the highlighted details before continuing.','error'); return false; }
  if(!state.user) state.user = {};
  state.user.name = name;
  state.user.phone = phone;
  state.user.drivingLicence = dl;
  saveUserSession(state.user);
  return bookingNext();
}

function setBookingFieldError(id, message){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.add('!border-red-500','border-red-500','ring-1','ring-red-200');
  el.setAttribute('aria-invalid','true');
  let error = el.parentElement?.querySelector(`[data-field-error="${id}"]`);
  if(!error){ error = document.createElement('p'); error.dataset.fieldError = id; error.className = 'text-[11px] text-red-600 mt-1 font-medium'; el.insertAdjacentElement('afterend', error); }
  error.textContent = message;
  el.focus({preventScroll:true});
}
function clearBookingFieldError(id){
  const el = document.getElementById(id);
  if(!el) return;
  el.classList.remove('!border-red-500','border-red-500','ring-1','ring-red-200');
  el.removeAttribute('aria-invalid');
  el.parentElement?.querySelector(`[data-field-error="${id}"]`)?.remove();
}
function bookingNext(){
  // Validate the current step before moving forward. Keep the user on this step if anything is missing.
  if(Number(state.bookingStep) === 1){
    const fields = [
      {id:'pickupDate', label:'Pick-up date'},
      {id:'pickupTime', label:'Pick-up time'},
      {id:'returnDate', label:'Return date'},
      {id:'returnTime', label:'Return time'}
    ];
    const values = {};
    let valid = true;
    for(const field of fields){
      const el = document.getElementById(field.id);
      const value = (el?.value || '').trim();
      if(!el || !value){ setBookingFieldError(field.id, `${field.label} is required.`); valid=false; }
      else { values[field.id] = value; clearBookingFieldError(field.id); }
    }
    if(!valid){ pushToast('Complete the highlighted pickup and return fields before continuing.','error'); return false; }
    const pickup = new Date(`${values.pickupDate}T${values.pickupTime}`);
    const returned = new Date(`${values.returnDate}T${values.returnTime}`);
    if(Number.isNaN(pickup.getTime())){ setBookingFieldError('pickupDate','Enter a valid pickup date and time.'); pushToast('Please enter a valid pickup schedule.','error'); return false; }
    const today = new Date(); today.setHours(0,0,0,0);
    if(pickup < today){ setBookingFieldError('pickupDate','Pick-up date cannot be in the past.'); pushToast('Pick-up date cannot be in the past.','error'); return false; }
    if(Number.isNaN(returned.getTime()) || returned <= pickup){ setBookingFieldError('returnDate','Return must be after pickup.'); setBookingFieldError('returnTime','Choose a return time after pickup.'); pushToast('Return date and time must be after pickup.','error'); return false; }
    state.bookingSchedule = values;
  }
  state.bookingStep = Number(state.bookingStep || 1) + 1;
  renderApp();
  return true;
}
function bookingBack(){
  state.bookingStep--;
  renderApp();
}

/* ---------------- PROFESSIONAL PAYMENT PROCESSING ---------------- */
async function bookingPay(){
  const car = state.bookingCar;
  if(!car){ pushToast('Please select a car before booking.','error'); return; }

  // Enforce UTR before changing button state or attempting to save anything.
  let transactionId = '';
  if(selectedPayTab === 'upi'){
    const utrEl = document.getElementById('bookingUtr');
    transactionId = (utrEl?.value || '').trim();
    if(!utrEl || transactionId.length < 6 || transactionId.length > 50 || !/^[A-Za-z0-9\/-]+$/.test(transactionId)){
      setBookingFieldError('bookingUtr','Enter a valid UTR / transaction ID (6–50 letters or numbers).');
      pushToast('UPI UTR / Transaction ID is required before submitting the booking.','error');
      utrEl?.focus();
      return;
    }
    clearBookingFieldError('bookingUtr');
    state.bookingUtr = transactionId;
  }

  const btn = document.getElementById('pay-btn');
  if(btn){
    btn.innerHTML = `
      <span class="inline-block animate-spin mr-1">↻</span>
      <span>Submitting booking request...</span>
    `;
    btn.disabled = true;
  }

  try {
    const total = car.price*2 + 199 + Math.round(car.price*2*0.05) + (car.deposit||3000);
    const schedule = state.bookingSchedule || {};
    const pickupDate = schedule.pickupDate || '';
    const pickupTime = schedule.pickupTime || '';
    const returnDate = schedule.returnDate || '';
    const returnTime = schedule.returnTime || '';
    if (!pickupDate || !pickupTime || !returnDate || !returnTime) throw new Error('Complete all pickup and return date/time fields before continuing.');
    if (new Date(`${returnDate}T${returnTime}`) <= new Date(`${pickupDate}T${pickupTime}`)) throw new Error('Return date and time must be after pickup date and time.');
    
    // Store only the UTR entered by the customer; admin must still verify it.
    const bookingNumber = `DN-${Date.now().toString(36).toUpperCase()}-${Math.floor(1000+Math.random()*9000)}`;

    const newBooking = {
      id: 'book-' + Date.now(),
      bookingNumber,
      transactionId,
      carId: car.id,
      carName: `${car.brand} ${car.model}`,
      carBrand: car.brand,
      carModel: car.model,
      carRegNumber: car.regNumber || 'UP 80 AB 1234',
      ownerId: car.ownerId || car.owner?.id || '',
      userId: state.user?.id || 'user-' + Date.now(),
      customerName: state.user?.name || 'Customer',
      customerEmail: state.user?.email || '',
      customerPhone: state.user?.phone || '',
      pickupDate,
      pickupTime,
      returnDate,
      returnTime,
      pickupLocation: car.area || 'Location on request',
      dropLocation: car.area || 'Location on request',
      amount: total,
      deposit: car.deposit || 3000,
      paymentMethod: selectedPayTab.toUpperCase(),
      paymentStatus: selectedPayTab === 'cash' ? 'pay_on_pickup' : 'pending_verification',
      status: 'pending',
      createdAt: { seconds: Math.floor(Date.now()/1000) },
      car
    };

    // Save to Firestore if Firebase is active
    if(window.DN?.enabled()){
      try {
        const savedBooking = await DN.createBooking({
          bookingNumber,
          carId: car.id,
          ownerId: newBooking.ownerId,
          pickupDate,
          pickupTime,
          returnDate,
          returnTime,
          pickupLocation: newBooking.pickupLocation,
          dropLocation: newBooking.dropLocation,
          amount: total,
          deposit: newBooking.deposit,
          paymentMethod: selectedPayTab.toUpperCase(),
          paymentStatus: selectedPayTab === 'cash' ? 'pay_on_pickup' : 'pending_verification',
          status: 'pending',
          transactionId,
          carName: newBooking.carName, carBrand: newBooking.carBrand, carModel: newBooking.carModel, carRegNumber: newBooking.carRegNumber, customerName: newBooking.customerName, customerEmail: newBooking.customerEmail, customerPhone: newBooking.customerPhone
        });
        newBooking.id = savedBooking.id;
        newBooking.bookingNumber = savedBooking.bookingNumber || bookingNumber;
      } catch(firebaseErr){
        throw new Error('Booking could not be saved to Firebase: ' + (firebaseErr.message || 'Please check your connection and Firestore rules.'));
      }
    }

    // Persist to local bookings array & localStorage
    state.myBookings.unshift(newBooking);
    saveBookings(state.myBookings);

    // Also push to owner bookings and admin bookings
    state.ownerBookings.unshift(newBooking);
    if(state.adminData?.bookings){
      state.adminData.bookings.unshift(newBooking);
    }

    state.lastBookingNumber = bookingNumber;
    state.lastBookingData = newBooking;
    state.bookingStep = 5;

    renderApp();
    spawnConfetti();
    pushToast('Booking request saved. Awaiting owner approval and payment verification.','info');

    // Dispatch WhatsApp notify in background
    // Do not send a paid/confirmed WhatsApp notification before verification.

  } catch(e) {
    if(btn){
      btn.textContent = '🔒 Retry Payment';
      btn.disabled = false;
    }
    pushToast(e.message || 'Payment gateway connection failed. Please try again.','error');
  }
}

function spawnConfetti(){
  const wrap = document.getElementById('confetti-wrap');
  if(!wrap) return;
  const colors=['#0E7C5A','#F5A623','#E5484D','#1B3B6F'];
  for(let i=0;i<26;i++){
    const p = document.createElement('span');
    p.className='confetti-piece';
    p.style.left = (Math.random()*100)+'%';
    p.style.width = p.style.height = (5+Math.random()*5)+'px';
    p.style.background = colors[i%colors.length];
    p.style.borderRadius = Math.random()>0.5?'50%':'2px';
    p.style.animationDuration = (1.4+Math.random()*1.2)+'s';
    wrap.appendChild(p);
  }
}

function openModal(type){ state.modal=type; renderApp(); }
function closeModal(){ state.modal=null; renderApp(); }

/* ---------------- TAX INVOICE MODAL ---------------- */
function openBookingInvoiceModal(){
  bookingInvoiceOpen = true;
  renderApp();
}

function closeBookingInvoiceModal(){
  bookingInvoiceOpen = false;
  renderApp();
}

function bookingInvoiceHtml(){
  if(!bookingInvoiceOpen) return '';
  const b = state.lastBookingData || (state.myBookings && state.myBookings[0]) || {};
  const car = b.car || state.bookingCar || CARS[0] || {};
  const u = state.user || { name: b.customerName || 'Customer', phone: b.customerPhone || '', email: b.customerEmail || '' };
  const rentalAmount = (car.price || 1499) * 2;
  const serviceFee = 199;
  const taxes = Math.round(rentalAmount * 0.05);
  const deposit = car.deposit || 3000;
  const total = Number(b.amount || (rentalAmount + serviceFee + taxes + deposit));

  return `
  <div class="fixed inset-0 z-[70] flex items-center justify-center p-4">
    <div class="modal-backdrop absolute inset-0 bg-ink/60" onclick="closeBookingInvoiceModal()"></div>
    <div class="modal-panel relative bg-white w-full max-w-xl rounded-3xl p-6 sm:p-8 shadow-lift max-h-[90vh] overflow-y-auto">
      <!-- INVOICE HEADER -->
      <div class="flex items-center justify-between pb-5 border-b border-line">
        <div class="flex items-center gap-2">
          <span class="w-8 h-8 rounded-xl bg-brand text-white flex items-center justify-center font-bold display">D</span>
          <div>
            <h3 class="display font-bold text-lg">DriveNear Technologies</h3>
            <p class="text-[10px] text-muted">GSTIN: 09AAACD1234F1Z5 · P2P Car Rental Marketplace</p>
          </div>
        </div>
        <button onclick="closeBookingInvoiceModal()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sand text-muted">${ICO.close}</button>
      </div>

      <div class="flex justify-between items-start mt-5 text-xs">
        <div>
          <span class="text-[10px] font-bold text-brand uppercase tracking-wider">Official Tax Invoice</span>
          <p class="font-bold text-base mt-0.5">${b.bookingNumber || 'DN-INVOICE'}</p>
          <p class="text-muted mt-0.5">Date: ${new Date().toLocaleDateString('en-IN', {day:'2-digit',month:'short',year:'numeric'})}</p>
          <p class="text-muted">Transaction ID: <strong class="font-mono">${b.transactionId || 'Not submitted'}</strong></p>
        </div>
        <div class="text-right">
          <span class="inline-block bg-emerald-100 text-emerald-800 font-bold px-3 py-1 rounded-full text-[11px]">PAID IN FULL ✓</span>
          <p class="text-muted text-[11px] mt-1">Payment: ${b.paymentMethod || 'UPI / Gateway'}</p>
        </div>
      </div>

      <!-- BILLED TO & VEHICLE -->
      <div class="grid grid-cols-2 gap-4 mt-5 p-4 rounded-2xl bg-sand/80 text-xs border border-line">
        <div>
          <p class="font-bold text-ink">Billed To (Renter):</p>
          <p class="font-medium mt-1">${u.name || b.customerName || 'Verified Customer'}</p>
          <p class="text-muted">${u.phone || b.customerPhone || '—'}</p>
          <p class="text-muted">${u.email || b.customerEmail || '—'}</p>
          ${u.drivingLicence ? `<p class="text-muted font-mono">DL: ${u.drivingLicence}</p>` : ''}
        </div>
        <div>
          <p class="font-bold text-ink">Vehicle Reserved:</p>
          <p class="font-medium mt-1">${car.brand} ${car.model} (${car.year||2023})</p>
          <p class="text-muted font-mono font-bold text-brand">Reg: ${car.regNumber || b.carRegNumber || 'UP 80 AB 1234'}</p>
          <p class="text-muted">Location: ${car.area || 'Location on request'}</p>
        </div>
      </div>

      <!-- LINE ITEMS TABLE -->
      <table class="w-full text-xs mt-5 border-collapse">
        <thead>
          <tr class="border-b border-line text-muted text-left">
            <th class="py-2">Description</th>
            <th class="py-2 text-center">Qty / Period</th>
            <th class="py-2 text-right">Amount (₹)</th>
          </tr>
        </thead>
        <tbody class="divide-y divide-line/60">
          <tr>
            <td class="py-2.5 font-medium">${car.brand} ${car.model} Rental Charges</td>
            <td class="py-2.5 text-center text-muted">2 Days</td>
            <td class="py-2.5 text-right font-medium">${fmt(rentalAmount)}</td>
          </tr>
          <tr>
            <td class="py-2.5 font-medium">Platform Service Fee</td>
            <td class="py-2.5 text-center text-muted">Fixed</td>
            <td class="py-2.5 text-right font-medium">${fmt(serviceFee)}</td>
          </tr>
          <tr>
            <td class="py-2.5 font-medium">GST & State Taxes (5%)</td>
            <td class="py-2.5 text-center text-muted">5%</td>
            <td class="py-2.5 text-right font-medium">${fmt(taxes)}</td>
          </tr>
          <tr>
            <td class="py-2.5 font-medium">Refundable Security Deposit <span class="text-muted text-[10px]">(returned after trip)</span></td>
            <td class="py-2.5 text-center text-muted">Deposit</td>
            <td class="py-2.5 text-right font-medium">${fmt(deposit)}</td>
          </tr>
        </tbody>
        <tfoot>
          <tr class="border-t-2 border-ink font-bold text-sm">
            <td class="py-3" colspan="2">Total Paid</td>
            <td class="py-3 text-right text-brand-ink">${fmt(total)}</td>
          </tr>
        </tfoot>
      </table>

      <!-- PRINT / CLOSE -->
      <div class="flex gap-3 mt-6 pt-4 border-t border-line">
        <button onclick="window.print()" class="flex-1 font-semibold py-2.5 rounded-full border border-line text-xs hover:bg-sand">
          🖨️ Print / Save as PDF
        </button>
        <button onclick="closeBookingInvoiceModal()" class="flex-1 btn btn-primary font-semibold py-2.5 rounded-full text-xs">
          Close Invoice
        </button>
      </div>
    </div>
  </div>`;
}

/* ---------------- WHATSAPP NOTIFICATIONS ---------------- */
async function ownerWhatsAppNumber(){
  let raw = String(state.siteSettings?.whatsappNumber || state.adminData?.settings?.whatsappNumber || '').replace(/\D/g,'');
  if(!raw && window.DN?.enabled()){
    try {
      const snap = await DN.db().collection('siteSettings').doc('general').get();
      if(snap.exists){
        state.siteSettings = {...state.siteSettings, ...snap.data()};
        raw = String(state.siteSettings?.whatsappNumber||'').replace(/\D/g,'');
      }
    } catch(_) {}
  }
  if(!raw) return '';
  return raw.length === 10 ? '91' + raw : raw;
}

async function notifyOwnerWhatsAppFromLastBooking(auto=false){
  const b = state.lastBookingData;
  const number = await ownerWhatsAppNumber();
  if(!b || !number){
    if(!auto) pushToast('Owner WhatsApp number is not configured in Admin Settings yet.','error');
    return;
  }
  const u = state.user || {};
  const lines = [
    '🚗 *DriveNear - Booking Request*',
    '',
    `Booking No: ${b.bookingNumber || '—'}`,
    `Transaction ID: ${b.transactionId || 'Not submitted'}`,
    `Customer: ${u.name || b.customerName || 'Customer'}`,
    `Phone: ${u.phone || b.customerPhone || '—'}`,
    `Car: ${b.carName || (b.car?.brand + ' ' + b.car?.model)}`,
    `Registration: ${b.carRegNumber || b.car?.regNumber || 'Verified'}`,
    `Schedule: ${b.pickupDate || '—'} ${b.pickupTime || ''} → ${b.returnDate || '—'} ${b.returnTime || ''}`,
    `Location: ${b.pickupLocation || '—'}`,
    `Total Paid: ₹${Number(b.amount||0).toLocaleString('en-IN')}`,
    `Payment Status: ${b.paymentStatus || 'PENDING VERIFICATION'}`,
    `Booking Status: ${b.status || 'PENDING'}`
  ];
  const url = `https://wa.me/${number}?text=${encodeURIComponent(lines.join('\n'))}`;
  const w = window.open(url, '_blank', 'noopener,noreferrer');
  if(!w && !auto) window.location.href = url;
  if(!auto) pushToast('WhatsApp opened with booking details.','info');
}
