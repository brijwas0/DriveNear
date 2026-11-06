/* DriveNear — js/pages/carDetails.js */

/* =========================================================
   PAGE: CAR DETAILS & RECOMMENDED CARS
   ========================================================= */
let activeGalleryIdx = 0;

function currentCarId(){
  const hash = location.hash || '';
  const id = hash.replace(/^#\/cars\//, '').split('?')[0];
  return id || (CARS[0]?.id || '');
}

function getRecommendedCars(currentCar, limit=4){
  if(!currentCar || !Array.isArray(CARS)) return [];
  const others = CARS.filter(c => c.id !== currentCar.id);
  
  // Sort by same type first, then price similarity, then rating
  return others.sort((a,b) => {
    const aTypeMatch = a.type === currentCar.type ? 2 : 0;
    const bTypeMatch = b.type === currentCar.type ? 2 : 0;
    const aPriceDiff = Math.abs((a.price || 1500) - (currentCar.price || 1500));
    const bPriceDiff = Math.abs((b.price || 1500) - (currentCar.price || 1500));
    return (bTypeMatch - aTypeMatch) || (aPriceDiff - bPriceDiff) || (Number(b.rating||0) - Number(a.rating||0));
  }).slice(0, limit);
}

function findDriveNearCarById(id){
  const targetId = String(id ?? '');
  if(!targetId) return null;
  // Owner-created cars may be pending review and therefore absent from the
  // public CARS array (which intentionally contains active listings only).
  const sources = [
    ...(Array.isArray(state.ownerCars) ? state.ownerCars : []),
    ...(Array.isArray(state.adminData?.cars) ? state.adminData.cars : []),
    ...(Array.isArray(CARS) ? CARS : [])
  ];
  const found = sources.find(c => c && String(c.id) === targetId);
  if(!found) return null;
  return {
    ...found,
    id: String(found.id),
    price: Number(found.price ?? found.pricePerDay ?? 0),
    priceHour: Number(found.priceHour ?? found.pricePerHour ?? 0),
    area: found.area || found.location || '',
    reviews: found.reviews ?? found.reviewsCount ?? 0,
    gallery: Array.isArray(found.gallery) && found.gallery.length ? found.gallery : (found.image ? [found.image] : []),
    owner: found.owner || { name: found.ownerName || 'DriveNear Host' }
  };
}

function pageCarDetails(id){
  const requestedId = String(id ?? currentCarId());
  const car = findDriveNearCarById(requestedId);
  if(!car){
    const loading = !!(window.DN?.enabled?.() && state.user && (state.ownerCarsLoaded !== true || state.publicCarsLoaded !== true));
    return `
      <section class="max-w-3xl mx-auto px-5 py-20 text-center">
        <div class="bg-white border border-line rounded-3xl p-8 sm:p-12 shadow-card">
          <div class="text-4xl mb-3">${loading ? '🚗' : '🔎'}</div>
          <h1 class="display text-2xl font-bold">${loading ? 'Loading your car listing…' : 'Car listing not found'}</h1>
          <p class="text-sm text-muted mt-2">${loading ? 'Please wait while DriveNear loads this exact listing.' : 'This listing may have been removed or you may not have access to it. We will not show a different car as a fallback.'}</p>
          <div class="flex flex-wrap justify-center gap-3 mt-6">
            <a href="#/my-cars" class="btn btn-primary rounded-full px-5 py-2.5 text-sm font-semibold">My Listed Cars</a>
            <a href="#/cars" class="border border-line rounded-full px-5 py-2.5 text-sm font-semibold">Find Cars</a>
          </div>
        </div>
      </section>`;
  }
  const isOwnerPreview = !!(state.user?.id && car.ownerId && String(car.ownerId) === String(state.user.id));
  const carStatus = String(car.status || 'active').toLowerCase();
  const canRentThisCar = carStatus === 'active' && !isOwnerPreview;
  const gallery = (car.gallery && car.gallery.length) ? car.gallery.filter(Boolean) : (car.image ? [car.image] : []);
  activeGalleryIdx = gallery.length ? activeGalleryIdx % gallery.length : 0;
  if(isNaN(activeGalleryIdx) || activeGalleryIdx < 0) activeGalleryIdx = 0;
  
  const fav = state.favorites.has(car.id);
  const owner = car.owner || {
    name: 'Verified Host',
    avatar: AVA[0],
    rating: '4.9',
    trips: 18,
    response: 96
  };
  const reviewsList = Array.isArray(car.reviewsList) ? car.reviewsList : [];
  const recommended = getRecommendedCars(car, 3);
  const areaName = car.area || car.location || 'Location not provided';

  return `
  <section class="max-w-7xl mx-auto px-5 lg:px-8 py-8">
    <div class="flex items-center justify-between mb-5">
      <button onclick="history.back()" class="text-sm font-semibold text-muted hover:text-ink flex items-center gap-1">
        ← Back to all cars
      </button>
      <div class="flex items-center gap-2">
        <span class="text-xs font-semibold px-3 py-1 rounded-full bg-sand border border-line">
          ${car.type || 'Car'}
        </span>
        ${isOwnerPreview ? `<span class="text-xs font-semibold px-3 py-1 rounded-full ${carStatus==='active'?'bg-emerald-50 text-emerald-800 border border-emerald-200':carStatus==='rejected'?'bg-red-50 text-red-700 border border-red-200':'bg-amber-50 text-amber-800 border border-amber-200'}">${carStatus==='active'?'Active listing':carStatus==='rejected'?'Rejected':'Pending review'}</span>` : ''}
        ${car.regNumber ? `<span class="text-xs font-mono font-bold px-3 py-1 rounded-full bg-brand-light text-brand border border-brand/30">RC: ${car.regNumber}</span>` : ''}
      </div>
    </div>

    <div class="grid lg:grid-cols-3 gap-10">
      <!-- LEFT 2 COLUMNS: GALLERY & DETAILS -->
      <div class="lg:col-span-2">
        <div class="relative rounded-3xl overflow-hidden h-[280px] sm:h-[420px] bg-line shadow-card">
          ${gallery.length ? `<img id="gallery-main" src="${gallery[activeGalleryIdx]}" class="w-full h-full object-cover transition-all duration-500" alt="${car.brand} ${car.model}">` : `<div class="w-full h-full flex items-center justify-center text-muted bg-sand">No car photo uploaded</div>`}
          <button onclick="event.stopPropagation(); toggleFavorite('${car.id}')" class="heart-btn ${fav?'active':''} absolute top-4 right-4 w-10 h-10 rounded-full bg-white/95 flex items-center justify-center shadow-card" aria-label="Save car">
            ${fav ? ICO.heartFill : ICO.heart}
          </button>
          <div class="absolute top-4 left-4 flex flex-col gap-1.5">
            ${car.verified ? `<span class="bg-white/95 text-brand text-xs font-semibold px-3 py-1.5 rounded-full shadow-card flex items-center gap-1.5">🟢 Verified Inspection Passed</span>` : ''}
            ${car.regNumber ? `<span class="bg-ink/85 text-white text-xs font-mono font-bold px-3 py-1 rounded-full backdrop-blur">Plate: ${car.regNumber}</span>` : ''}
          </div>
        </div>

        <div class="flex gap-3 mt-3 overflow-x-auto pb-1">
          ${gallery.map((g,i)=>`
            <button onclick="setGallery(${i})" class="w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${i===activeGalleryIdx?'border-brand scale-105':'border-transparent opacity-80 hover:opacity-100'}">
              <img src="${g}" class="w-full h-full object-cover">
            </button>`).join('')}
        </div>

        <div class="mt-8">
          <div class="flex flex-wrap items-center justify-between gap-3">
            <h1 class="display text-2xl sm:text-3xl font-bold">${car.brand} ${car.model} <span class="text-muted font-normal text-lg">${car.year || ''}</span></h1>
            <span class="text-xs font-semibold px-3 py-1.5 rounded-full bg-emerald-50 text-emerald-800 border border-emerald-200">Instant Booking Available</span>
          </div>
          <div class="flex flex-wrap items-center gap-4 mt-2 text-sm">
            <span class="flex items-center gap-1 font-semibold">${ICO.star.replace('currentColor','#F5A623')} ${car.rating ?? '—'} <span class="text-muted font-normal">(${car.reviews||reviewsList.length||0} reviews)</span></span>
            <span class="flex items-center gap-1 text-muted">${ICO.pin} ${car.distance!=null?`${car.distance} km away · `:''}${areaName}</span>
          </div>

          <h2 class="font-semibold text-lg mt-8 mb-3 display">Vehicle Specifications</h2>
          <div class="grid grid-cols-2 sm:grid-cols-4 gap-3">
            ${[
              [ICO.gear, car.transmission || 'Automatic', 'Transmission'],
              [ICO.fuel, car.fuel || 'Petrol', 'Fuel Type'],
              [ICO.seats, (car.seats || 5) + ' Seats', 'Capacity'],
              ['❄️', 'Air Conditioning', 'Climate'],
              ['📶', 'Bluetooth Audio', 'Audio'],
              ['🗺️', 'GPS Navigation', 'Navigation'],
              ['🔌', 'USB Fast Charger', 'Power'],
              ['📷', 'Reverse Camera', 'Parking']
            ].map(([icon, label, subtitle])=>`
              <div class="bg-white border border-line rounded-2xl p-3.5 flex items-center gap-3">
                <span class="text-2xl">${icon}</span>
                <div>
                  <p class="text-xs text-muted leading-none">${subtitle}</p>
                  <p class="font-semibold text-sm mt-1 leading-tight">${label}</p>
                </div>
              </div>`).join('')}
          </div>

          <h2 class="font-semibold text-lg mt-8 mb-3 display">Host Information</h2>
          <div class="bg-white border border-line rounded-2xl p-5 flex flex-wrap sm:flex-nowrap items-center gap-4 shadow-sm">
            <div class="w-14 h-14 rounded-full overflow-hidden shrink-0 border border-line">
              <img src="${owner.avatar || AVA[0]}" class="w-full h-full object-cover" alt="${owner.name}">
            </div>
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <p class="font-bold text-base">${owner.name || 'DriveNear Host'}</p>
                <span class="text-[10px] font-bold text-brand bg-brand-light px-2 py-0.5 rounded-full uppercase">Verified Host</span>
              </div>
              <p class="text-xs text-muted mt-0.5">⭐ ${owner.rating || '4.9'} · ${owner.trips || 12} successful trips hosted</p>
              <div class="flex flex-wrap gap-2 mt-2">
                <span class="text-[11px] font-semibold text-brand-ink bg-brand-light px-2.5 py-1 rounded-full">✓ Identity Verified</span>
                <span class="text-[11px] font-semibold text-brand-ink bg-brand-light px-2.5 py-1 rounded-full">✓ Phone Verified</span>
                <span class="text-[11px] font-semibold text-muted bg-sand px-2.5 py-1 rounded-full">Response Rate: ${owner.response || 95}%</span>
              </div>
            </div>
            ${CONVERSATIONS.length ? `<button onclick="nav('#/messages')" class="text-xs font-semibold border border-line rounded-full px-4 py-2 hover:bg-sand transition-colors">Chat with Host</button>` : ''}
          </div>

          <h2 class="font-semibold text-lg mt-8 mb-3 display">Renter Reviews</h2>
          <div class="space-y-3">
            ${reviewsList.length ? reviewsList.map(r=>`
              <div class="bg-white border border-line rounded-2xl p-4">
                <div class="flex items-center justify-between">
                  <span class="flex">${starRow(r.rating || 5)}</span>
                  <span class="text-xs text-muted">${r.time || 'Recent trip'}</span>
                </div>
                <p class="text-sm mt-2 text-ink">${r.text || 'Great car, clean and well-maintained.'}</p>
                <p class="text-xs font-semibold text-muted mt-2">— ${r.name || 'Verified Driver'}</p>
              </div>`).join('') : `
              <div class="bg-white border border-line rounded-2xl p-6 text-center text-sm text-muted">
                <p class="text-2xl mb-1">⭐</p>
                <p class="font-semibold text-ink">No reviews yet for this vehicle.</p>
                <p class="text-xs mt-1">Book your trip today and be the first to share your experience!</p>
              </div>`}
          </div>
        </div>
      </div>

      <!-- RIGHT COLUMN: OWNER PREVIEW OR RENTER BOOKING -->
      <div class="lg:sticky lg:top-24 h-fit">
        ${!canRentThisCar ? `
          <div class="bg-white border border-line rounded-3xl p-6 shadow-card">
            <div class="flex items-center justify-between gap-3">
              <p class="display text-3xl font-bold text-brand-ink">${fmt(car.price)}<span class="text-sm font-normal text-muted"> /day</span></p>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full ${carStatus==='active'?'bg-brand-light text-brand':carStatus==='rejected'?'bg-red-50 text-red-700':'bg-amber-50 text-amber-800'}">${carStatus==='active'?'Active':carStatus==='rejected'?'Rejected':'Pending review'}</span>
            </div>
            <div class="mt-5 rounded-2xl border ${carStatus==='rejected'?'border-red-200 bg-red-50':'border-amber-200 bg-amber-50'} p-4">
              <p class="font-semibold text-sm">${isOwnerPreview ? 'Your listing preview' : 'This car is not available for booking'}</p>
              <p class="text-xs text-muted mt-1">${isOwnerPreview ? (carStatus==='active' ? 'This is your own car listing. Renters can book it, but owners cannot book their own vehicles.' : carStatus==='rejected' ? 'This listing was rejected. Update the listing or contact the site admin before publishing it again.' : 'Your car is saved and waiting for admin approval. It will become available to renters after it is approved.') : 'Only active, approved listings can be booked.'}</p>
            </div>
            ${isOwnerPreview ? `<a href="#/my-cars" class="inline-flex justify-center w-full border border-line rounded-full px-4 py-3 mt-5 text-sm font-semibold hover:bg-sand">Back to My Listed Cars</a>` : `<a href="#/cars" class="inline-flex justify-center w-full btn btn-primary rounded-full px-4 py-3 mt-5 text-sm font-semibold">Find available cars</a>`}
          </div>
        ` : `
          <div class="bg-white border border-line rounded-3xl p-6 shadow-lift">
            <div class="flex items-baseline justify-between">
              <p class="display text-3xl font-bold text-brand-ink">${fmt(car.price)}<span class="text-sm font-normal text-muted"> /day</span></p>
              <span class="text-xs font-bold px-2.5 py-1 rounded-full bg-brand-light text-brand">Best Price</span>
            </div>
            <p class="text-xs text-muted mt-1">${fmt(car.priceHour || Math.round(car.price/9))}/hour also available</p>

            <div class="grid grid-cols-2 gap-3 mt-5">
              <div><label class="text-[11px] font-semibold text-muted">Pick-up date</label><input type="date" id="detailsPickupDate" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs font-medium"></div>
              <div><label class="text-[11px] font-semibold text-muted">Pick-up time</label><input type="time" id="detailsPickupTime" value="10:00" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs font-medium"></div>
              <div><label class="text-[11px] font-semibold text-muted">Return date</label><input type="date" id="detailsReturnDate" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs font-medium"></div>
              <div><label class="text-[11px] font-semibold text-muted">Return time</label><input type="time" id="detailsReturnTime" value="10:00" class="w-full mt-1 border border-line rounded-xl px-3 py-2 text-xs font-medium"></div>
            </div>

            <div class="border-t border-line mt-5 pt-4 space-y-2.5 text-xs">
              <div class="flex justify-between"><span class="text-muted">Car rental (2 days)</span><span class="font-medium">${fmt(car.price*2)}</span></div>
              <div class="flex justify-between"><span class="text-muted">Platform service fee</span><span class="font-medium">${fmt(199)}</span></div>
              <div class="flex justify-between"><span class="text-muted">GST & State Taxes (5%)</span><span class="font-medium">${fmt(Math.round(car.price*2*0.05))}</span></div>
              <div class="flex justify-between text-amber-900 bg-amber-50 px-2 py-1.5 rounded-lg"><span>Refundable Security Deposit</span><span class="font-bold">${fmt(car.deposit || 3000)}</span></div>
              <div class="flex justify-between font-bold text-base border-t border-line pt-3 text-ink"><span>Total Payable</span><span class="text-brand-ink">${fmt(car.price*2 + 199 + Math.round(car.price*2*0.05) + (car.deposit||3000))}</span></div>
            </div>

            <button onclick="openBooking('${car.id}')" class="btn btn-primary w-full font-bold py-3.5 rounded-2xl mt-5 shadow-card text-sm flex items-center justify-center gap-2"><span>Proceed to Booking</span><span>${ICO.arrowR}</span></button>
            <div class="mt-3 flex items-center justify-center gap-2 text-[11px] text-muted"><span>🛡️ 256-Bit Encrypted</span><span>•</span><span>Free cancellation up to 6h before</span></div>
          </div>
        `}
      </div>
    </div>

    <!-- RECOMMENDED CAR LIST TO BOOKING PAGE -->
    <div class="mt-16 pt-10 border-t border-line">
      <div class="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div>
          <span class="text-xs font-bold uppercase tracking-wider text-brand">Similar Recommendations</span>
          <h2 class="display text-2xl font-bold mt-1">Recommended Cars You Might Like</h2>
          <p class="text-xs text-muted mt-0.5">Explore popular alternative ${car.type || 'cars'} in ${areaName.split(',')[0]} with verified ratings.</p>
        </div>
        <a href="#/cars" class="text-xs font-bold text-brand hover:underline flex items-center gap-1">
          Explore all cars ${ICO.arrowR}
        </a>
      </div>

      <div class="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        ${recommended.map(c => carCardGrid(c)).join('')}
      </div>
    </div>
  </section>`;
}

function setGallery(i){
  activeGalleryIdx = i;
  const currentId = currentCarId();
  const car = findDriveNearCarById(currentId);
  if(!car) return;
  const gallery = (car.gallery && car.gallery.length) ? car.gallery.filter(Boolean) : (car.image ? [car.image] : []);
  const mainImg = document.getElementById('gallery-main');
  if(mainImg && gallery[i]){
    mainImg.src = gallery[i];
  }
  document.querySelectorAll('[onclick^="setGallery"]').forEach((b,idx)=>{
    b.className = `w-20 h-16 rounded-xl overflow-hidden shrink-0 border-2 transition-all ${idx===i?'border-brand scale-105':'border-transparent opacity-80 hover:opacity-100'}`;
  });
}
