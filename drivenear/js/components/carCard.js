/* DriveNear — js/components/carCard.js */

/* ---------------- CAR CARD ---------------- */
function carCardHoriz(car){
  if(!car) return '';
  const fav = state.favorites.has(car.id);
  const brand = car.brand || 'Car';
  const model = car.model || '';
  const img = car.image || (car.gallery && car.gallery.find(Boolean)) || '';
  const areaName = (car.area || car.location || 'Location not provided').split(',')[0];
  const distance = car.distance != null ? `${car.distance}` : '';
  const price = Number(car.price ?? car.pricePerDay ?? 0);
  return `
  <div class="car-card shrink-0 w-[280px] bg-white rounded-2xl border border-line overflow-hidden shadow-card cursor-pointer" onclick="nav('#/cars/${car.id}')">
    <div class="relative h-40 overflow-hidden">
      ${img ? `<img src="${img}" alt="${brand} ${model}" class="car-img w-full h-full object-cover" loading="lazy">` : `<div class="w-full h-full bg-sand flex items-center justify-center text-muted text-xs">No car photo uploaded</div>`}
      ${car.verified?`<span class="absolute top-2.5 left-2.5 bg-white/95 text-brand text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">🟢 Verified</span>`:''}
      <button onclick="event.stopPropagation(); toggleFavorite('${car.id}')" class="heart-btn ${fav?'active':''} absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center" aria-label="Save car">
        ${fav?ICO.heartFill:ICO.heart}
      </button>
    </div>
    <div class="p-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-[15px]">${brand} ${model}</h3>
        <span class="flex items-center gap-1 text-xs font-semibold text-ink">${ICO.star.replace('currentColor','#F5A623')} ${car.rating ?? '—'} <span class="text-muted font-normal">(${car.reviews ?? car.reviewsCount ?? 0})</span></span>
      </div>
      <p class="text-xs text-muted mt-1 flex items-center gap-1">${ICO.pin} ${distance ? `${distance} km away · ` : ''}${areaName}</p>
      <p class="text-xs text-muted mt-1.5">${car.transmission||'Automatic'} · ${car.fuel||'Petrol'} · ${car.seats||5} Seats</p>
      <div class="flex items-center justify-between mt-3">
        <span class="font-bold display text-brand-ink">${fmt(price)}<span class="text-xs font-normal text-muted">/day</span></span>
        <span class="text-xs font-semibold text-brand flex items-center gap-1">View Car ${ICO.arrowR}</span>
      </div>
    </div>
  </div>`;
}

function carCardGrid(car, highlight=false){
  if(!car) return '';
  const fav = state.favorites.has(car.id);
  const brand = car.brand || 'Car';
  const model = car.model || '';
  const img = car.image || (car.gallery && car.gallery.find(Boolean)) || '';
  const areaName = (car.area || car.location || 'Location not provided').split(',')[0];
  const distance = car.distance != null ? `${car.distance}` : '';
  const price = Number(car.price ?? car.pricePerDay ?? 0);
  const yearSuffix = car.year ? `'${String(car.year).slice(-2)}` : '';
  return `
  <div id="cardfor-${car.id}" class="car-card bg-white rounded-2xl border ${highlight?'border-brand ring-2 ring-brand/30':'border-line'} overflow-hidden shadow-card cursor-pointer" onclick="nav('#/cars/${car.id}')">
    <div class="relative h-44 overflow-hidden">
      ${img ? `<img src="${img}" alt="${brand} ${model}" class="car-img w-full h-full object-cover" loading="lazy">` : `<div class="w-full h-full bg-sand flex items-center justify-center text-muted text-xs">No car photo uploaded</div>`}
      ${car.verified?`<span class="absolute top-2.5 left-2.5 bg-white/95 text-brand text-[11px] font-semibold px-2 py-1 rounded-full flex items-center gap-1">🟢 Verified</span>`:''}
      <button onclick="event.stopPropagation(); toggleFavorite('${car.id}')" class="heart-btn ${fav?'active':''} absolute top-2.5 right-2.5 w-8 h-8 rounded-full bg-white/95 flex items-center justify-center" aria-label="Save car">
        ${fav?ICO.heartFill:ICO.heart}
      </button>
      <span class="absolute bottom-2.5 left-2.5 bg-ink/85 text-white text-xs font-bold px-2.5 py-1 rounded-full">${fmt(price)}</span>
    </div>
    <div class="p-4">
      <div class="flex items-center justify-between">
        <h3 class="font-semibold text-[15px]">${brand} ${model} <span class="text-muted font-normal text-xs">${yearSuffix}</span></h3>
        <span class="flex items-center gap-1 text-xs font-semibold">${ICO.star.replace('currentColor','#F5A623')} ${car.rating ?? '—'}</span>
      </div>
      <p class="text-xs text-muted mt-1 flex items-center gap-1">${ICO.pin} ${distance ? `${distance} km · ` : ''}${areaName}</p>
      <p class="text-xs text-muted mt-1.5">${car.transmission||'Automatic'} · ${car.fuel||'Petrol'} · ${car.seats||5} Seats</p>
      <button class="mt-3 w-full btn btn-primary text-sm font-semibold py-2.5 rounded-xl">View Details & Book</button>
    </div>
  </div>`;
}

async function toggleFavorite(id){
  const btns = document.querySelectorAll(`[onclick*="toggleFavorite('${id}')"]`);
  const adding = !state.favorites.has(id);
  if(adding){ state.favorites.add(id); pushToast('Saved to your wishlist','heart'); }
  else { state.favorites.delete(id); pushToast('Removed from saved cars','heart'); }
  saveFavs();
  btns.forEach(b=>{ b.classList.add('heart-pop'); setTimeout(()=>b.classList.remove('heart-pop'),400); });
  if(window.DN?.enabled() && state.user){ try { await DN.toggleFavorite(id); } catch(e){ console.warn(e); } }
  renderApp();
}
