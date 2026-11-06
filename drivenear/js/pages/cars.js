/* DriveNear — js/pages/cars.js */

/* =========================================================
   PAGE: CARS (discovery)
   ========================================================= */
let leafletMap = null;
let cityZoomTimer = null;
let lastGeocodedCity = '';
let citySearchMarker = null;
function filteredSortedCars(){
  let list = CARS.filter(c=>{
    const f = state.filters;
    if(f.search && f.search.trim()){
      const q = f.search.toLowerCase().trim();
      const matchBrand = (c.brand||'').toLowerCase().includes(q);
      const matchModel = (c.model||'').toLowerCase().includes(q);
      const matchArea = (c.area||c.location||'').toLowerCase().includes(q);
      const matchReg = (c.regNumber||'').toLowerCase().includes(q);
      if(!matchBrand && !matchModel && !matchArea && !matchReg) return false;
    }
    if(f.type!=='All' && c.type!==f.type) return false;
    if(f.fuel!=='All' && c.fuel!==f.fuel) return false;
    if(f.transmission!=='All' && c.transmission!==f.transmission) return false;
    if(f.seats!=='All' && String(c.seats)!==f.seats) return false;
    if(c.price>f.maxPrice) return false;
    if(Number(c.rating)<f.minRating) return false;
    return true;
  });
  if(state.sort==='price-low') list.sort((a,b)=>a.price-b.price);
  else if(state.sort==='price-high') list.sort((a,b)=>b.price-a.price);
  else if(state.sort==='rating') list.sort((a,b)=>b.rating-a.rating);
  else if(state.sort==='distance') list.sort((a,b)=>a.distance-b.distance);
  return list;
}

function pageCars(){
  const firebaseMode = !!window.DN?.enabled?.();
  const loadingCars = firebaseMode && !state.publicCarsLoaded;
  const loadError = firebaseMode && !!state.publicCarsError;
  const list = loadingCars || loadError ? [] : filteredSortedCars();
  const f = state.filters;
  const filterChip = (label, key, options)=>`
    <select onchange="setFilter('${key}', this.value)" class="text-xs font-semibold border border-line rounded-full px-3 py-2 bg-white hover:border-ink/30 cursor-pointer">
      ${options.map(o=>`<option value="${o}" ${f[key]===o?'selected':''}>${label}: ${o}</option>`).join('')}
    </select>`;
  return `
  <section class="max-w-7xl mx-auto px-5 lg:px-8 py-6">
    <div class="flex flex-col gap-4">
      ${cityDatalistMarkup()}
      <div class="flex flex-wrap items-center gap-3">
        <div class="flex-1 min-w-[220px] flex items-center gap-2 bg-white border border-line rounded-full px-4 py-2.5">
          ${ICO.search}<input id="carSearchInput" value="${state.filters.search||''}" oninput="setSearchFilter(this.value); scheduleCityMapZoom(this.value)" onfocus="attachCityAutocomplete(this)" onkeydown="if(event.key==='Enter'){event.preventDefault();submitCarSearch()}" list="drivenearCitySuggestions" placeholder="Search by brand, model, city or RC plate..." class="flex-1 text-sm bg-transparent outline-none" />
          ${state.filters.search?`<button id="carSearchClearBtn" onclick="setSearchFilter('')" class="text-xs text-muted hover:text-ink">✕</button>`:''}
        </div>
        <button onclick="submitCarSearch()" class="btn btn-primary text-sm font-semibold px-5 py-2.5 rounded-full">Search Cars</button>
      </div>
      <div class="flex flex-wrap items-center gap-2">
        ${filterChip('Type','type',['All','SUV','Sedan','Hatchback','MPV'])}
        ${filterChip('Fuel','fuel',['All','Petrol','Diesel','Electric'])}
        ${filterChip('Transmission','transmission',['All','Automatic','Manual'])}
        ${filterChip('Seats','seats',['All','4','5','7'])}
        <select onchange="setFilter('maxPrice', this.value)" class="text-xs font-semibold border border-line rounded-full px-3 py-2 bg-white">
          <option value="5000" ${f.maxPrice==5000?'selected':''}>Price: Any</option>
          <option value="1200" ${f.maxPrice==1200?'selected':''}>Price: Under ₹1,200</option>
          <option value="1800" ${f.maxPrice==1800?'selected':''}>Price: Under ₹1,800</option>
          <option value="2500" ${f.maxPrice==2500?'selected':''}>Price: Under ₹2,500</option>
        </select>
        <select onchange="setFilter('minRating', this.value)" class="text-xs font-semibold border border-line rounded-full px-3 py-2 bg-white">
          <option value="0" ${f.minRating==0?'selected':''}>Rating: Any</option>
          <option value="4.5" ${f.minRating==4.5?'selected':''}>Rating: 4.5+</option>
          <option value="4.8" ${f.minRating==4.8?'selected':''}>Rating: 4.8+</option>
        </select>
        <span class="text-xs font-semibold text-brand border border-brand/30 bg-brand-light px-3 py-2 rounded-full">Availability: This week</span>
        <div class="ml-auto flex items-center gap-2">
          <span class="text-xs text-muted hidden sm:inline">Sort</span>
          <select onchange="setSort(this.value)" class="text-xs font-semibold border border-line rounded-full px-3 py-2 bg-white">
            <option value="recommended" ${state.sort==='recommended'?'selected':''}>Recommended</option>
            <option value="price-low" ${state.sort==='price-low'?'selected':''}>Price: Low → High</option>
            <option value="price-high" ${state.sort==='price-high'?'selected':''}>Price: High → Low</option>
            <option value="rating" ${state.sort==='rating'?'selected':''}>Rating</option>
            <option value="distance" ${state.sort==='distance'?'selected':''}>Distance</option>
          </select>
        </div>
      </div>
      <p id="carResultCount" class="text-sm text-muted">${loadingCars ? 'Loading active car listings from DriveNear…' : loadError ? 'Could not load live car listings.' : `${list.length} active car${list.length===1?'':'s'} available`}</p>
    </div>

    <div class="lg:hidden flex mt-4 border border-line rounded-full p-1 w-fit bg-white">
      <button onclick="setMapListMobile('list')" class="px-4 py-1.5 rounded-full text-xs font-semibold ${state.mapListMobile==='list'?'bg-ink text-white':''}">List</button>
      <button onclick="setMapListMobile('map')" class="px-4 py-1.5 rounded-full text-xs font-semibold ${state.mapListMobile==='map'?'bg-ink text-white':''}">Map</button>
    </div>

    <div class="grid lg:grid-cols-2 gap-6 mt-5">
      <div class="${state.mapListMobile==='map'?'block':'hidden'} lg:block h-[420px] lg:h-[calc(100vh-220px)] lg:sticky lg:top-24 rounded-3xl overflow-hidden border border-line">
        <div id="leaflet-map" class="w-full h-full"></div>
      </div>
      <div class="${state.mapListMobile==='list'?'block':'hidden'} lg:block">
        <div id="carSearchResults" class="grid sm:grid-cols-2 gap-5">
          ${loadingCars ? `<div class="sm:col-span-2 grid sm:grid-cols-2 gap-5">${skeletonCard()}${skeletonCard()}</div>` : loadError ? `<div class="sm:col-span-2 bg-white border border-line rounded-2xl p-8 text-center"><div class="text-3xl mb-3">⚠️</div><h3 class="font-bold text-lg">Live cars could not be loaded</h3><p class="text-sm text-muted mt-2">Check your internet connection and Firestore rules, then try again. Demo cars are hidden so they are not mistaken for real listings.</p><button onclick="retryLoadPublicCars()" class="btn btn-primary text-sm font-semibold px-5 py-2.5 rounded-full mt-5">Retry loading cars</button></div>` : list.length ? list.map(c=>carCardGrid(c, c.id===state.selectedCarId)).join('') : emptyState('🚘',state.filters.search?'No active cars match your search':'No active car listings yet',state.filters.search?'Try a different brand, model, city or registration number.':'Only approved, active cars appear here. Owners can check listing status in My Listed Cars.','','')}
        </div>
      </div>
    </div>
  </section>`;
}
function submitCarSearch(){
  const input=document.getElementById('carSearchInput');
  const value=(input?.value||state.filters.search||'').trim();
  state.filters.search=value;
  renderApp();
  scheduleCityMapZoom(value, true);
}
function scheduleCityMapZoom(value, immediate=false){
  clearTimeout(cityZoomTimer);
  const q=String(value||'').trim();
  if(q.length<2) return;
  // The live India-wide autocomplete handles geocoding and zooming while typing.
  // This fallback handles an exact city from the bundled list when API suggestions are unavailable.
  cityZoomTimer=setTimeout(()=>zoomMapToCity(q), immediate?0:1100);
}
function zoomMapToCoordinates(lat,lng,label='Selected city'){
  lat=Number(lat); lng=Number(lng);
  if(!Number.isFinite(lat)||!Number.isFinite(lng))return;
  const el=document.getElementById('leaflet-map');
  if(!el)return;
  lastGeocodedCity=String(label||'');
  if(typeof L!=='undefined'){
    if(!leafletMap) initLeaflet();
    if(leafletMap){
      leafletMap.setView([lat,lng],13,{animate:true});
      if(citySearchMarker) citySearchMarker.remove();
      citySearchMarker=L.marker([lat,lng]).addTo(leafletMap).bindPopup(`<strong>${String(label).replace(/</g,'&lt;')}</strong>`).openPopup();
      setTimeout(()=>leafletMap&&leafletMap.invalidateSize(),100);
    }
  }else{
    const delta=0.12; const bbox=[lng-delta,lat-delta,lng+delta,lat+delta].join('%2C');
    el.innerHTML=`<iframe title="Map of ${String(label).replace(/&/g,'&amp;').replace(/</g,'&lt;')}" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik&marker=${lat}%2C${lng}" style="width:100%;height:100%;min-height:320px;border:0;display:block" loading="eager"></iframe>`;
  }
}
async function zoomMapToCity(raw){
  const query=String(raw||'').trim();
  if(query.length<2 || query===lastGeocodedCity) return;
  // Resolve any Indian city/town entered by the user, not only a bundled shortlist.
  try{
    const response=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&countrycodes=in&q='+encodeURIComponent(query),{headers:{'Accept-Language':'en'}});
    if(!response.ok) return;
    const rows=await response.json();
    if(!rows.length) return;
    zoomMapToCoordinates(Number(rows[0].lat),Number(rows[0].lon),query);
  }catch(err){console.warn('Could not zoom map to city:',err);}
}

function setFilter(key,val){
  if(key==='maxPrice'||key==='minRating') val = Number(val);
  state.filters[key]=val; renderApp();
}
function setSearchFilter(v){
  state.filters.search = String(v ?? '');
  const clear = document.getElementById('carSearchClearBtn');
  if(clear) clear.classList.toggle('hidden', !state.filters.search);
  const count = document.getElementById('carResultCount');
  const results = document.getElementById('carSearchResults');
  const firebaseMode = !!window.DN?.enabled?.();
  const loading = firebaseMode && !state.publicCarsLoaded;
  const error = firebaseMode && !!state.publicCarsError;
  const list = loading || error ? [] : filteredSortedCars();
  if(count) count.textContent = loading ? 'Loading active car listings from DriveNear…' : error ? 'Could not load live car listings.' : `${list.length} active car${list.length===1?'':'s'} available`;
  if(results){
    results.innerHTML = loading ? `<div class="sm:col-span-2 grid sm:grid-cols-2 gap-5">${skeletonCard()}${skeletonCard()}</div>` : error ? `<div class="sm:col-span-2 bg-white border border-line rounded-2xl p-8 text-center"><div class="text-3xl mb-3">⚠️</div><h3 class="font-bold text-lg">Live cars could not be loaded</h3><p class="text-sm text-muted mt-2">Check your internet connection and Firestore rules, then try again. Demo cars are hidden so they are not mistaken for real listings.</p><button onclick="retryLoadPublicCars()" class="btn btn-primary text-sm font-semibold px-5 py-2.5 rounded-full mt-5">Retry loading cars</button></div>` : list.length ? list.map(c=>carCardGrid(c,c.id===state.selectedCarId)).join('') : emptyState('🚘',state.filters.search?'No active cars match your search':'No active car listings yet',state.filters.search?'Try a different brand, model, city or registration number.':'Only approved, active cars appear here. Owners can check listing status in My Listed Cars.','','');
  }
  // Keep the current map instance while typing; autocomplete will move it when a live geocode result arrives.
}
function setSort(v){ state.sort=v; renderApp(); }
function setMapListMobile(v){ state.mapListMobile=v; renderApp(); }

function initLeaflet(){
  const el = document.getElementById('leaflet-map');
  if(!el) return;
  if(typeof L==='undefined'){
    // CDN/network fallback: keep the map area useful instead of leaving a blank panel.
    const car = filteredSortedCars().find(c => Number.isFinite(Number(c.lat)) && Number.isFinite(Number(c.lng)) && c.lat !== null && c.lng !== null);
    const lat = car ? Number(car.lat) : 20;
    const lng = car ? Number(car.lng) : 0;
    const delta = car ? 0.12 : 35;
    const bbox = [lng-delta,lat-delta,lng+delta,lat+delta].join('%2C');
    const marker = car ? `&marker=${lat}%2C${lng}` : '';
    el.innerHTML = `<iframe title="OpenStreetMap car locations" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}" style="width:100%;height:100%;min-height:320px;border:0;display:block" loading="eager" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
    return;
  }
  if(leafletMap){ leafletMap.remove(); leafletMap=null; }
  const list = filteredSortedCars();
  leafletMap = L.map('leaflet-map', {zoomControl:true}).setView([22.9734,78.6569], 5);
  L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', { attribution:'© OpenStreetMap', maxZoom:19 }).addTo(leafletMap);
  const bounds = [];
  const addCarMarker = (car, lat, lng) => {
    if(!Number.isFinite(Number(lat)) || !Number.isFinite(Number(lng))) return;
    const point=[Number(lat),Number(lng)]; bounds.push(point);
    const icon = L.divIcon({ className:'', html:`<div style="background:${car.id===state.selectedCarId?'#0A5C43':'#0E7C5A'};color:#fff;font-weight:700;font-size:11px;padding:5px 10px;border-radius:999px;box-shadow:0 4px 10px rgba(0,0,0,.25);white-space:nowrap;border:2px solid white;">₹${Number(car.price||car.pricePerDay||0).toLocaleString('en-IN')}</div>`, iconSize:[0,0] });
    const marker = L.marker(point, {icon}).addTo(leafletMap);
    marker.bindPopup(`<strong>${String(car.brand||'Car')} ${String(car.model||'')}</strong><br>${String(car.area||car.location||'Location not specified')}<br><a href="#/cars/${encodeURIComponent(car.id)}">View car details</a>`);
    marker.on('click', ()=>{ state.selectedCarId = car.id; });
    marker.bindTooltip(`${car.brand||'Car'} ${car.model||''}`);
  };
  list.forEach(car=>{
    if(Number.isFinite(Number(car.lat)) && Number.isFinite(Number(car.lng)) && car.lat !== null && car.lng !== null) {
      addCarMarker(car,car.lat,car.lng);
    } else if(car.area || car.location) {
      // Resolve older listings that predate saved coordinates; don't place them at a fake default pin.
      const query=String(car.area||car.location);
      fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q='+encodeURIComponent(query))
        .then(r=>r.ok?r.json():[]).then(rows=>{
          if(!rows.length || !leafletMap || !document.getElementById('leaflet-map')) return;
          addCarMarker(car,Number(rows[0].lat),Number(rows[0].lon));
          if(bounds.length===1) leafletMap.setView(bounds[0],12);
          else if(bounds.length>1) leafletMap.fitBounds(bounds,{padding:[28,28],maxZoom:13});
        }).catch(()=>{});
    }
  });
  if(bounds.length===1) leafletMap.setView(bounds[0],12);
  else if(bounds.length>1) leafletMap.fitBounds(bounds,{padding:[28,28],maxZoom:13});
  else leafletMap.setView([22.9734,78.6569],5);
  setTimeout(()=>{ if(leafletMap) leafletMap.invalidateSize(); },150);
  if(state.filters.search && !/^[a-z0-9 -]+$/i.test(state.filters.search)) { /* keep normal brand/model searches untouched */ }
  if(state.filters.search) setTimeout(()=>zoomMapToCity(state.filters.search),180);
}
