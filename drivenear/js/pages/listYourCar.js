/* DriveNear — js/pages/listYourCar.js */

/* =========================================================
   LIST YOUR CAR (owner onboarding wizard)
   ========================================================= */
const LIST_STEPS = ['Personal','Vehicle','Photos','Pricing','Availability','Preview'];

function prefillListCarPersonalDetails(){
  // Fill only blank fields so login details appear automatically without
  // overwriting anything the user has already entered in this listing flow.
  if (!state?.user) return;
  if (!state.listCarData) return;
  if (!state.listCarData.personal) state.listCarData.personal = {name:'',email:'',phone:'',city:'',photoURL:''};
  const p = state.listCarData.personal;
  const u = state.user;
  if (!String(p.name || '').trim() && String(u.name || '').trim()) p.name = u.name.trim();
  if (!String(p.email || '').trim() && String(u.email || '').trim()) p.email = u.email.trim();
  if (!String(p.phone || '').trim() && String(u.phone || '').trim()) p.phone = u.phone.trim();
  if (!String(p.photoURL || '').trim() && String(u.photoURL || '').trim()) p.photoURL = u.photoURL.trim();
  if (!String(p.city || '').trim() && String(u.city || '').trim()) p.city = u.city.trim();
}

function getListPersonalData(){
  prefillListCarPersonalDetails();
  const p = state.listCarData.personal;
  return {
    name: p.name || state.user?.name || '',
    email: p.email || state.user?.email || '',
    phone: p.phone || state.user?.phone || '',
    city: p.city || state.user?.city || '',
    photoURL: p.photoURL || state.user?.photoURL || ''
  };
}

function escapeListHtml(value){
  return String(value || '').replace(/[&<>"']/g, ch => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
}

const HOST_CITY_SUGGESTIONS = [
  'Agra, Uttar Pradesh','Mathura, Uttar Pradesh','Vrindavan, Uttar Pradesh','Delhi, Delhi',
  'Noida, Uttar Pradesh','Ghaziabad, Uttar Pradesh','Lucknow, Uttar Pradesh','Kanpur, Uttar Pradesh',
  'Varanasi, Uttar Pradesh','Prayagraj, Uttar Pradesh','Bareilly, Uttar Pradesh','Moradabad, Uttar Pradesh',
  'Chandausi, Uttar Pradesh','Jaipur, Rajasthan','Gurugram, Haryana','Faridabad, Haryana',
  'Chandigarh, Chandigarh','Dehradun, Uttarakhand','Haridwar, Uttarakhand','Mumbai, Maharashtra',
  'Pune, Maharashtra','Bengaluru, Karnataka','Hyderabad, Telangana','Chennai, Tamil Nadu',
  'Kolkata, West Bengal','Ahmedabad, Gujarat','Surat, Gujarat','Bhopal, Madhya Pradesh',
  'Indore, Madhya Pradesh','Patna, Bihar','Amritsar, Punjab','Jodhpur, Rajasthan'
];
// Coordinates for common supported options. These avoid relying on live geocoding
// just to put the selected city on the map; Nominatim is used for other locations.
const HOST_CITY_COORDINATES = {
  'agra, uttar pradesh':[27.1767,78.0081], 'mathura, uttar pradesh':[27.4924,77.6737],
  'vrindavan, uttar pradesh':[27.5706,77.6800], 'delhi, delhi':[28.6139,77.2090],
  'noida, uttar pradesh':[28.5355,77.3910], 'ghaziabad, uttar pradesh':[28.6692,77.4538],
  'lucknow, uttar pradesh':[26.8467,80.9462], 'kanpur, uttar pradesh':[26.4499,80.3319],
  'varanasi, uttar pradesh':[25.3176,82.9739], 'prayagraj, uttar pradesh':[25.4358,81.8463],
  'bareilly, uttar pradesh':[28.3670,79.4304], 'moradabad, uttar pradesh':[28.8386,78.7733],
  'chandausi, uttar pradesh':[28.4500,78.7800], 'jaipur, rajasthan':[26.9124,75.7873],
  'gurugram, haryana':[28.4595,77.0266], 'faridabad, haryana':[28.4089,77.3178],
  'chandigarh, chandigarh':[30.7333,76.7794], 'dehradun, uttarakhand':[30.3165,78.0322],
  'haridwar, uttarakhand':[29.9457,78.1642], 'mumbai, maharashtra':[19.0760,72.8777],
  'pune, maharashtra':[18.5204,73.8567], 'bengaluru, karnataka':[12.9716,77.5946],
  'hyderabad, telangana':[17.3850,78.4867], 'chennai, tamil nadu':[13.0827,80.2707],
  'kolkata, west bengal':[22.5726,88.3639], 'ahmedabad, gujarat':[23.0225,72.5714],
  'surat, gujarat':[21.1702,72.8311], 'bhopal, madhya pradesh':[23.2599,77.4126],
  'indore, madhya pradesh':[22.7196,75.8577], 'patna, bihar':[25.5941,85.1376],
  'amritsar, punjab':[31.6340,74.8723], 'jodhpur, rajasthan':[26.2389,73.0243]
};
const HOST_STATE_CENTERS = {
  'andhra pradesh':[15.9129,79.7400], 'arunachal pradesh':[28.2180,94.7278], 'assam':[26.2006,92.9376],
  'bihar':[25.0961,85.3131], 'chhattisgarh':[21.2787,81.8661], 'goa':[15.2993,74.1240],
  'gujarat':[22.2587,71.1924], 'haryana':[29.0588,76.0856], 'himachal pradesh':[31.1048,77.1734],
  'jharkhand':[23.6102,85.2799], 'karnataka':[15.3173,75.7139], 'kerala':[10.8505,76.2711],
  'madhya pradesh':[22.9734,78.6569], 'maharashtra':[19.7515,75.7139], 'manipur':[24.6637,93.9063],
  'meghalaya':[25.4670,91.3662], 'mizoram':[23.1645,92.9376], 'nagaland':[26.1584,94.5624],
  'odisha':[20.9517,85.0985], 'punjab':[31.1471,75.3412], 'rajasthan':[27.0238,74.2179],
  'sikkim':[27.5330,88.5122], 'tamil nadu':[11.1271,78.6569], 'telangana':[18.1124,79.0193],
  'tripura':[23.9408,91.9882], 'uttar pradesh':[26.8467,80.9462], 'uttarakhand':[30.0668,79.0193],
  'west bengal':[22.9868,87.8550], 'delhi':[28.6139,77.2090], 'jammu and kashmir':[33.7782,76.5762],
  'ladakh':[34.1526,77.5771], 'chandigarh':[30.7333,76.7794], 'puducherry':[11.9416,79.8083]
};
function getKnownHostCoordinates(place){
  const normalized=String(place||'').trim().toLowerCase().replace(/\s+/g,' ');
  if(HOST_CITY_COORDINATES[normalized]) return HOST_CITY_COORDINATES[normalized];
  if(HOST_STATE_CENTERS[normalized]) return HOST_STATE_CENTERS[normalized];
  const first=normalized.split(',')[0].trim();
  if(HOST_STATE_CENTERS[first]) return HOST_STATE_CENTERS[first];
  return null;
}
let hostCityMap = null;
let hostCityMarker = null;
let hostCitySearchTimer = null;
let hostCityGeocodeRequest = 0;

function renderHostCityMapEmbed(city, lat, lon, showMarker = true){
  const mapEl = document.getElementById('listHostCityMap');
  if(!mapEl) return;
  const hasPoint = lat !== null && lat !== undefined && lon !== null && lon !== undefined && Number.isFinite(Number(lat)) && Number.isFinite(Number(lon));
  const safeLat = hasPoint ? Number(lat) : 22.5;
  const safeLon = hasPoint ? Number(lon) : 82.0;
  const halfLon = hasPoint ? 0.12 : 14.5;
  const halfLat = hasPoint ? 0.08 : 16.5;
  const bbox = [safeLon-halfLon, safeLat-halfLat, safeLon+halfLon, safeLat+halfLat].join(',');
  const marker = showMarker && hasPoint ? `&marker=${safeLat},${safeLon}` : '';
  const label = escapeListHtml(city || 'India');
  mapEl.innerHTML = `<iframe title="OpenStreetMap preview for ${label}" src="https://www.openstreetmap.org/export/embed.html?bbox=${bbox}&layer=mapnik${marker}" style="display:block;width:100%;height:220px;border:0" loading="lazy" referrerpolicy="strict-origin-when-cross-origin"></iframe>`;
}
let hostCitySearchRequest = 0;

function initHostCityMap(){
  const mapEl = document.getElementById('listHostCityMap');
  if(!mapEl) return;
  const current = document.getElementById('listHostCity')?.value.trim();
  if(hostCityMap){ hostCityMap.remove(); hostCityMap = null; hostCityMarker = null; }

  // Leaflet is the enhanced map. If its CDN is unavailable, use the official
  // OpenStreetMap embed so the preview never remains an empty white rectangle.
  if(!window.L){
    renderHostCityMapEmbed(current || '', null, null, false);
    const status = document.getElementById('listHostCityMapStatus');
    if(status) status.textContent = current ? 'Looking up your selected city…' : 'Map preview · Search and select a city to zoom to its location.';
    if(current){ const known=getKnownHostCoordinates(current); if(known) renderHostCityMapEmbed(current,known[0],known[1],true); else geocodeHostCity(current, false); }
    return;
  }

  mapEl.innerHTML = '';
  hostCityMap = L.map(mapEl, {scrollWheelZoom:false}).setView([22.5,82.0], 5);
  const tiles = L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19, attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>'
  }).addTo(hostCityMap);
  let tileErrors = 0;
  tiles.on('tileerror', () => {
    tileErrors++;
    if(tileErrors >= 3 && hostCityMap){
      const center = hostCityMarker?.getLatLng?.() || hostCityMap.getCenter?.();
      const hadMarker = Boolean(hostCityMarker);
      hostCityMap.remove();
      hostCityMap = null;
      hostCityMarker = null;
      renderHostCityMapEmbed(current || 'India', center?.lat, center?.lng, hadMarker);
      const status = document.getElementById('listHostCityMapStatus');
      if(status) status.textContent = 'Using OpenStreetMap fallback preview because map tiles are unavailable.';
    }
  });
  if(current){ const known=getKnownHostCoordinates(current); if(known) showHostCityOnMap(current,known[0],known[1]); else geocodeHostCity(current, false); }
  setTimeout(()=>hostCityMap && hostCityMap.invalidateSize(), 150);
}

function handleHostCitySearch(value){
  const box = document.getElementById('listHostCitySuggestions');
  if(!box) return;
  state.listCarData.personal.city = value;
  state.listCarData.personal.cityLat = null; state.listCarData.personal.cityLng = null;
  const q = String(value || '').trim().toLowerCase();
  const matches = q ? HOST_CITY_SUGGESTIONS.filter(c=>c.toLowerCase().includes(q)).slice(0,7) : HOST_CITY_SUGGESTIONS.slice(0,6);
  box.innerHTML = matches.map(city=>`<button type="button" class="block w-full text-left px-3 py-2.5 text-sm hover:bg-brand-light border-b border-line last:border-0" onclick="selectHostCity('${city.replace(/\\/g,'\\\\').replace(/'/g,"\\'")}')">📍 ${escapeListHtml(city)}</button>`).join('');
  if(q.length >= 3){
    clearTimeout(hostCitySearchTimer);
    hostCitySearchTimer = setTimeout(async ()=>{
      const requestId = ++hostCitySearchRequest;
      try {
        const url = 'https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=7&q=' + encodeURIComponent(value);
        const response = await fetch(url, {headers:{'Accept':'application/json'}});
        if(!response.ok) throw new Error('Location search is temporarily unavailable');
        const results = await response.json();
        if(requestId !== hostCitySearchRequest || !document.getElementById('listHostCitySuggestions')) return;
        const remote = results.map(item=>{
          const a=item.address||{}; const city=a.city||a.town||a.village||a.municipality||a.county||'';
          const stateName=a.state||''; const country=a.country||''; return {label:[city,stateName,country].filter(Boolean).join(', ') || item.display_name.split(',').slice(0,3).join(','), lat:Number(item.lat), lon:Number(item.lon)};
        }).filter(x=>x.label);
        const unique = [...new Map([...matches.map(label=>({label})),...remote].map(x=>[x.label.toLowerCase(),x])).values()].slice(0,8);
        box.innerHTML = unique.map(item=>`<button type="button" class="block w-full text-left px-3 py-2.5 text-sm hover:bg-brand-light border-b border-line last:border-0" onclick="selectHostCity('${String(item.label).replace(/\\/g,'\\\\').replace(/'/g,"\\'")}',${Number.isFinite(item.lat)?item.lat:'null'},${Number.isFinite(item.lon)?item.lon:'null'})">📍 ${escapeListHtml(item.label)}</button>`).join('');
        box.classList.toggle('hidden', unique.length===0);
        if(!unique.length){ box.innerHTML='<div class="px-3 py-2 text-sm text-muted">No locations found. Check spelling or try “Dubai, United Arab Emirates”.</div>'; box.classList.remove('hidden'); }
      } catch(e) {
        if(requestId === hostCitySearchRequest && document.getElementById('listHostCitySuggestions')) {
          const currentMatches = HOST_CITY_SUGGESTIONS.filter(c=>c.toLowerCase().includes(q)).slice(0,7);
          if(!currentMatches.length){ box.innerHTML='<div class="px-3 py-2 text-sm text-muted">Online worldwide search unavailable. Check your internet connection and try again.</div>'; box.classList.remove('hidden'); }
        }
      }
    }, 450);
  }
  box.classList.toggle('hidden', matches.length===0 && q.length===0);
  if(q && matches.length===0) box.classList.remove('hidden');
  // If the user types a state name itself, show its approximate state-centre
  // pin immediately while city suggestions remain available below.
  if(HOST_STATE_CENTERS[q]) showHostCityOnMap(value.trim(), HOST_STATE_CENTERS[q][0], HOST_STATE_CENTERS[q][1]);
}

function selectHostCity(city, lat=null, lon=null){
  const input=document.getElementById('listHostCity');
  const box=document.getElementById('listHostCitySuggestions');
  if(input) input.value=city;
  if(box){box.classList.add('hidden');box.innerHTML='';}
  state.listCarData.personal.city=city;
  if(Number.isFinite(lat) && Number.isFinite(lon)){ state.listCarData.personal.cityLat=lat; state.listCarData.personal.cityLng=lon; }
  // Use known coordinates immediately for built-in city/state suggestions.
  // This means the map pins correctly even if OpenStreetMap search is slow/offline.
  if(Number.isFinite(lat) && Number.isFinite(lon)) showHostCityOnMap(city,lat,lon);
  else {
    const known=getKnownHostCoordinates(city);
    if(known){ state.listCarData.personal.cityLat=known[0]; state.listCarData.personal.cityLng=known[1]; showHostCityOnMap(city,known[0],known[1]); }
    else geocodeHostCity(city, true);
  }
}

function previewHostCityLocation(value){
  const place=String(value||'').trim();
  if(!place) return;
  const known=getKnownHostCoordinates(place);
  if(known) showHostCityOnMap(place,known[0],known[1]);
  else geocodeHostCity(place, true);
}

async function geocodeHostCity(city, showError){
  if(!city) return;
  const requestId=++hostCityGeocodeRequest;
  const status=document.getElementById('listHostCityMapStatus');
  if(status) status.textContent='Finding city on map…';
  try{
    const response=await fetch('https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=1&q='+encodeURIComponent(city),{headers:{'Accept':'application/json'}});
    if(!response.ok) throw new Error('Map lookup unavailable');
    const results=await response.json();
    if(requestId!==hostCityGeocodeRequest) return; // Ignore stale lookups for an older input.
    if(!results.length) throw new Error('City not found');
    state.listCarData.personal.cityLat=Number(results[0].lat); state.listCarData.personal.cityLng=Number(results[0].lon); showHostCityOnMap(city,Number(results[0].lat),Number(results[0].lon));
  }catch(e){ if(requestId===hostCityGeocodeRequest && status) status.textContent=showError?'Could not locate this city. Check the spelling or try another suggestion.':'Select a suggested city to preview its map location.'; }
}

function showHostCityOnMap(city,lat,lon){
  if(!Number.isFinite(lat) || !Number.isFinite(lon)) return;
  hostCityGeocodeRequest++; // A manual/known selection takes priority over previous API lookups.
  if(!hostCityMap){
    renderHostCityMapEmbed(city, lat, lon, true);
    const fallbackStatus = document.getElementById('listHostCityMapStatus');
    if(fallbackStatus) fallbackStatus.textContent = 'Selected location: '+city;
    return;
  }
  hostCityMap.setView([lat,lon],12);
  if(hostCityMarker) hostCityMarker.setLatLng([lat,lon]);
  else hostCityMarker=L.marker([lat,lon]).addTo(hostCityMap);
  hostCityMarker.bindPopup(escapeListHtml(city)).openPopup();
  const status=document.getElementById('listHostCityMapStatus');
  if(status) status.textContent='Selected location: '+city;
}

document.addEventListener('click', function(event){
  const box=document.getElementById('listHostCitySuggestions');
  const input=document.getElementById('listHostCity');
  if(box && input && !box.contains(event.target) && event.target!==input) box.classList.add('hidden');
});

function pageListYourCar(){
  prefillListCarPersonalDetails();
  const step = state.listCarStep;
  return `
  <section class="max-w-3xl mx-auto px-5 lg:px-8 py-10">
    <div class="text-center max-w-xl mx-auto">
      <span class="text-xs font-bold uppercase tracking-wider text-brand bg-brand-light px-3 py-1 rounded-full">Host Onboarding</span>
      <h1 class="display text-3xl font-bold mt-2">List your car on DriveNear</h1>
      <p class="text-muted text-sm mt-1.5">Earn up to ₹45,000/month by renting your car to verified drivers in your city.</p>
    </div>

    <div class="flex items-center justify-between mt-8 mb-2">
      ${LIST_STEPS.map((s,i)=>`
        <div class="flex-1 flex flex-col items-center">
          <span class="w-8 h-8 rounded-full text-xs font-bold flex items-center justify-center transition-all ${i+1<=step?'bg-brand text-white shadow-card':'bg-line text-muted'}">${i+1<step?'✓':i+1}</span>
          <span class="text-[11px] mt-1 font-semibold text-center ${i+1===step?'text-ink font-bold':'text-muted'} hidden sm:block">${s}</span>
        </div>`).join('')}
    </div>

    <div class="bg-white border border-line rounded-3xl p-6 sm:p-8 mt-5 shadow-card">
      ${listStepContent(step)}
    </div>
  </section>`;
}

function listStepContent(step){
  const p = getListPersonalData();
  const v = state.listCarData.vehicle;
  const pricing = state.listCarData.pricing;

  // STEP 1: PERSONAL DETAILS (NO HARDCODED DEMO DATA)
  if(step===1) {
    return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-bold text-xl display">Personal Details</h2>
        <p class="text-xs text-muted mt-0.5">Please provide your real contact details so renters can connect with you.</p>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand text-muted">Step 1 of 6</span>
    </div>

    <div class="grid sm:grid-cols-2 gap-4 mt-5">
      <div>
        <label class="text-xs font-semibold text-muted">Full Name *</label>
        <input id="listHostName" value="${escapeListHtml(p.name)}" placeholder="e.g. Rahul Sharma" oninput="state.listCarData.personal.name=this.value" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
      </div>
      <div>
        <label class="text-xs font-semibold text-muted">Email Address *</label>
        <input id="listHostEmail" type="email" value="${escapeListHtml(p.email)}" placeholder="e.g. rahul@example.com" oninput="state.listCarData.personal.email=this.value" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
      </div>
      <div>
        <label class="text-xs font-semibold text-muted">Mobile Number *</label>
        <input id="listHostPhone" type="tel" value="${escapeListHtml(p.phone)}" placeholder="e.g. 9876543210" oninput="state.listCarData.personal.phone=this.value" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
      </div>
      <div>
        <label class="text-xs font-semibold text-muted">City & State *</label>
        <div class="relative mt-1">
          <input id="listHostCity" value="${escapeListHtml(p.city)}" placeholder="Search any city worldwide (e.g. Dubai, United Arab Emirates)" autocomplete="off" oninput="handleHostCitySearch(this.value)" onfocus="handleHostCitySearch(this.value)" onchange="previewHostCityLocation(this.value)" onkeydown="if(event.key==='Enter'){event.preventDefault();const first=document.querySelector('#listHostCitySuggestions button:not(.hidden)');if(first)first.click();else previewHostCityLocation(this.value)}" class="w-full border border-line rounded-xl px-3.5 py-2.5 pr-10 text-sm outline-none focus:border-brand">
          <span class="absolute right-3 top-2.5 text-muted">⌖</span>
          <div id="listHostCitySuggestions" class="hidden absolute z-30 top-full left-0 right-0 mt-1 max-h-56 overflow-auto rounded-xl border border-line bg-white shadow-lg"></div>
        </div>
        <p class="text-[11px] text-muted mt-1">Select a suggested city or state to pin it on the map. The pin updates automatically after selection.</p>
      </div>
    </div>
    <div class="mt-4 rounded-2xl overflow-hidden border border-line bg-sand">
      <div class="px-3 py-2 text-xs text-muted">Map preview · OpenStreetMap</div>
      <div id="listHostCityMap" style="height:220px;width:100%;z-index:1"></div>
      <p id="listHostCityMapStatus" class="px-3 py-2 text-xs text-muted">Search and select your city to show its map location.</p>
    </div>

    <!-- PROFILE PHOTO UPLOAD SECTION (FIXED & FULLY FUNCTIONAL) -->
    <div class="mt-6 pt-5 border-t border-line">
      <label class="text-xs font-semibold text-muted block mb-2">Host Profile Photo</label>
      <div class="flex items-center gap-4 bg-sand/60 p-4 rounded-2xl border border-line/60">
        <div id="hostPhotoPreviewWrap" class="w-16 h-16 rounded-full bg-white border border-line flex items-center justify-center overflow-hidden shrink-0 shadow-sm">
          ${p.photoURL ? `<img src="${p.photoURL}" class="w-full h-full object-cover">` : `<span class="text-2xl text-muted">👤</span>`}
        </div>
        <div class="flex-1">
          <p class="text-sm font-semibold">${p.photoURL ? 'Photo uploaded ✓' : 'Upload your photo'}</p>
          <p class="text-xs text-muted mt-0.5">Renters prefer booking cars from hosts with a clear profile photo.</p>
          <div class="flex items-center gap-2 mt-2">
            <label class="text-xs font-semibold bg-white border border-line rounded-full px-4 py-2 cursor-pointer hover:bg-sand transition-colors shadow-sm inline-flex items-center gap-1.5">
              <span>📷</span> <span>${p.photoURL ? 'Change Photo' : 'Choose Photo'}</span>
              <input type="file" id="hostPhotoInput" class="hidden" accept="image/*" onchange="handleHostPhotoUpload(event)">
            </label>
            ${p.photoURL ? `<button type="button" onclick="removeHostPhoto()" class="text-xs font-semibold text-danger px-2 py-1">Remove</button>` : ''}
          </div>
        </div>
      </div>
    </div>
    ${listNav(step)}`;
  }

  // STEP 2: VEHICLE DETAILS & REGISTRATION NUMBER VALIDATION
  if(step===2) {
    const brands = Object.keys(POPULAR_CAR_BRANDS);
    const selectedBrand = v.brand || 'Hyundai';
    const models = POPULAR_CAR_BRANDS[selectedBrand] || ['Creta', 'Venue', 'Custom Model'];
    const regCheck = validateVehicleRegNumber(v.regNumber);

    return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-bold text-xl display">Vehicle Details</h2>
        <p class="text-xs text-muted mt-0.5">Enter accurate brand, model, and official registration details.</p>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand text-muted">Step 2 of 6</span>
    </div>

    <div class="grid sm:grid-cols-2 gap-4 mt-5">
      <div>
        <label class="text-xs font-semibold text-muted">Car Brand *</label>
        <select id="listCarBrand" onchange="onListBrandChange(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-white">
          ${brands.map(b=>`<option value="${b}" ${selectedBrand===b?'selected':''}>${b}</option>`).join('')}
          <option value="Other" ${selectedBrand==='Other'?'selected':''}>Other Brand</option>
        </select>
      </div>

      <div>
        <label class="text-xs font-semibold text-muted">Car Model *</label>
        <div class="flex gap-2 mt-1">
          <select id="listCarModelSelect" onchange="onListModelChange(this.value)" class="w-full border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-white">
            ${models.map(m=>`<option value="${m}" ${v.model===m?'selected':''}>${m}</option>`).join('')}
            <option value="custom" ${!models.includes(v.model)?'selected':''}>Type custom model...</option>
          </select>
        </div>
        <input id="listCarModelCustom" value="${!models.includes(v.model)?v.model:''}" placeholder="Type exact model name" oninput="state.listCarData.vehicle.model=this.value" class="${!models.includes(v.model)?'block':'hidden'} w-full mt-2 border border-line rounded-xl px-3.5 py-2 text-sm outline-none focus:border-brand">
      </div>

      <div>
        <label class="text-xs font-semibold text-muted">Manufacturing Year *</label>
        <select id="listCarYear" onchange="state.listCarData.vehicle.year=Number(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-white">
          ${[2026,2025,2024,2023,2022,2021,2020,2019,2018,2017,2016].map(y=>`<option value="${y}" ${v.year===y?'selected':''}>${y}</option>`).join('')}
        </select>
      </div>

      <div>
        <label class="text-xs font-semibold text-muted">Vehicle Category *</label>
        <select id="listCarType" onchange="state.listCarData.vehicle.type=this.value" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-white">
          ${['SUV','Sedan','Hatchback','MPV','Luxury'].map(t=>`<option value="${t}" ${v.type===t?'selected':''}>${t}</option>`).join('')}
        </select>
      </div>

      <!-- REGISTRATION NUMBER WITH LIVE VALIDATION FEEDBACK -->
      <div class="sm:col-span-2">
        <label class="text-xs font-semibold text-muted flex items-center justify-between">
          <span>Official Registration Number (RC) *</span>
          <span class="text-[11px] text-brand">Valid format: UP 80 AB 1234 or 22 BH 1234 AA</span>
        </label>
        <div class="relative mt-1">
          <input id="listCarRegNumber" value="${v.regNumber || ''}" placeholder="e.g. UP 80 AB 1234 or DL 01 CZ 4321" oninput="onListRegNumberChange(this.value)" class="w-full border ${regCheck.isValid?'border-emerald-500 ring-1 ring-emerald-500':'border-line'} rounded-xl px-3.5 py-2.5 text-sm font-mono uppercase tracking-wider outline-none focus:border-brand">
          <div class="absolute right-3 top-2.5 text-sm">
            ${v.regNumber ? (regCheck.isValid ? '🟢' : '🔴') : '🚘'}
          </div>
        </div>
        <div id="regValidationFeedback">
          ${renderRegValidationFeedback(v.regNumber)}
        </div>
        <p class="text-xs text-muted mt-2">Enter the number exactly as printed on the RC. The owner name you provide must match the RC; DriveNear checks the number format, while document ownership is verified by an admin.</p>
      </div>

      <div>
        <label class="text-xs font-semibold text-muted">Fuel Type *</label>
        <select id="listCarFuel" onchange="state.listCarData.vehicle.fuel=this.value" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-white">
          ${['Petrol','Diesel','Electric','CNG','Hybrid'].map(f=>`<option value="${f}" ${v.fuel===f?'selected':''}>${f}</option>`).join('')}
        </select>
      </div>

      <div>
        <label class="text-xs font-semibold text-muted">Transmission *</label>
        <select id="listCarTrans" onchange="state.listCarData.vehicle.transmission=this.value" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-white">
          <option value="Automatic" ${v.transmission==='Automatic'?'selected':''}>Automatic</option>
          <option value="Manual" ${v.transmission==='Manual'?'selected':''}>Manual</option>
        </select>
      </div>

      <div>
        <label class="text-xs font-semibold text-muted">Seating Capacity *</label>
        <select id="listCarSeats" onchange="state.listCarData.vehicle.seats=Number(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand bg-white">
          <option value="4" ${v.seats===4?'selected':''}>4 Seater</option>
          <option value="5" ${v.seats===5?'selected':''}>5 Seater</option>
          <option value="7" ${v.seats===7?'selected':''}>7 Seater</option>
          <option value="8" ${v.seats===8?'selected':''}>8 Seater</option>
        </select>
      </div>

      <div>
        <label class="text-xs font-semibold text-muted">Pickup Location / Area *</label>
        <input id="listCarArea" value="${escapeListHtml(v.area || '')}" placeholder="Street, city, region or address" oninput="state.listCarData.vehicle.area=this.value" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
      </div>
    </div>
    ${listNav(step)}`;
  }

  // STEP 3: CAR PHOTOS
  if(step===3) {
    const photos = state.listCarData.photos;
    return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-bold text-xl display">Car Photos</h2>
        <p class="text-xs text-muted mt-0.5">High quality photos increase booking requests by over 40%.</p>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand text-muted">Step 3 of 6</span>
    </div>

    <label id="dropzone" ondragover="event.preventDefault(); this.classList.add('border-brand')" ondragleave="this.classList.remove('border-brand')" ondrop="handleDrop(event)"
      class="flex flex-col items-center justify-center gap-2 border-2 border-dashed border-line rounded-2xl py-10 cursor-pointer hover:border-brand/60 transition-colors bg-sand/30">
      <span class="text-4xl text-brand">${ICO.camera}</span>
      <p class="text-sm font-semibold">Drag & drop car photos, or click to browse</p>
      <p class="text-xs text-muted">Upload exterior front, rear, interior cabin & dashboard (JPG, PNG)</p>
      <input type="file" multiple accept="image/*" class="hidden" onchange="handleFiles(this.files)">
    </label>

    ${photos.length ? `
      <div class="flex items-center justify-between mt-5 mb-2">
        <h3 class="text-xs font-bold uppercase tracking-wider text-muted">Uploaded Photos (${photos.length})</h3>
        <button type="button" onclick="state.listCarData.photos=[]; renderApp();" class="text-xs font-semibold text-danger">Clear all</button>
      </div>
      <div id="photo-grid" class="grid grid-cols-2 sm:grid-cols-4 gap-3">
        ${photos.map((p,i)=>`
          <div class="relative h-28 rounded-xl overflow-hidden group border border-line shadow-sm">
            <img src="${p}" class="w-full h-full object-cover">
            <span class="absolute bottom-1 left-1 bg-ink/70 text-white text-[10px] px-2 py-0.5 rounded-full font-semibold">${i===0?'Cover Photo':`Photo ${i+1}`}</span>
            <button onclick="removePhoto(${i})" class="absolute top-1.5 right-1.5 w-6 h-6 rounded-full bg-rose-600 text-white flex items-center justify-center text-xs shadow-card">✕</button>
          </div>`).join('')}
      </div>` : `
      <div class="mt-4 p-4 rounded-xl bg-amber-50 text-amber-800 text-xs border border-amber-200">
        💡 Tip: If you don't upload custom photos right now, high-resolution catalog photos will be automatically assigned based on your selected brand & model.
      </div>`}
    ${listNav(step)}`;
  }

  // STEP 4: PRICING
  if(step===4) {
    return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-bold text-xl display">Rental Pricing</h2>
        <p class="text-xs text-muted mt-0.5">Set competitive hourly and daily rental rates for your car.</p>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand text-muted">Step 4 of 6</span>
    </div>

    <div class="grid sm:grid-cols-3 gap-4 mt-5">
      <div>
        <label class="text-xs font-semibold text-muted">Hourly Rate (₹/hr) *</label>
        <input type="number" value="${pricing.priceHour}" oninput="state.listCarData.pricing.priceHour=Number(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand font-semibold">
      </div>
      <div>
        <label class="text-xs font-semibold text-muted">Daily Rate (₹/day) *</label>
        <input type="number" value="${pricing.priceDay}" oninput="state.listCarData.pricing.priceDay=Number(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand font-semibold">
      </div>
      <div>
        <label class="text-xs font-semibold text-muted">Refundable Deposit (₹) *</label>
        <input type="number" value="${pricing.deposit}" oninput="state.listCarData.pricing.deposit=Number(this.value)" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand font-semibold">
      </div>
    </div>

    <div class="bg-brand-light text-brand-ink text-sm rounded-2xl p-4 mt-6 flex items-start gap-3 border border-brand/20">
      <span class="text-xl">💡</span>
      <div>
        <p class="font-semibold">Recommended Market Price</p>
        <p class="text-xs text-brand-ink/80 mt-0.5">Similar ${v.brand} ${v.model} cars in ${v.area || 'your city'} earn between ₹1,300 and ₹2,200 per day.</p>
      </div>
    </div>
    ${listNav(step)}`;
  }

  // STEP 5: AVAILABILITY & RULES
  if(step===5) {
    return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-bold text-xl display">Availability & Guidelines</h2>
        <p class="text-xs text-muted mt-0.5">Define your rental preferences and calendar availability.</p>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-sand text-muted">Step 5 of 6</span>
    </div>

    ${calendarWidget('list')}

    <h3 class="font-semibold text-sm mt-7 mb-3 display">Rental House Rules</h3>
    <div class="grid sm:grid-cols-2 gap-3 text-sm">
      ${['No smoking inside vehicle','No pets allowed','Maximum 250 km included per day','Return vehicle with same fuel level','Original Driving Licence check at pickup','Fastag toll charges billed at actuals'].map((r,i)=>`
        <label class="flex items-center gap-2.5 border border-line rounded-xl px-4 py-3 bg-white cursor-pointer hover:bg-sand/40">
          <input type="checkbox" ${i<4?'checked':''} class="accent-[#0E7C5A] w-4 h-4 rounded">
          <span class="text-xs font-medium text-ink">${r}</span>
        </label>`).join('')}
    </div>
    ${listNav(step)}`;
  }

  // STEP 6: PREVIEW & PUBLISH
  if(step===6) {
    const regCheck = validateVehicleRegNumber(v.regNumber);
    const previewCar = {
      id: 'preview-' + Date.now(),
      brand: v.brand,
      model: v.model,
      year: v.year,
      type: v.type,
      transmission: v.transmission,
      fuel: v.fuel,
      seats: v.seats,
      price: pricing.priceDay,
      priceHour: pricing.priceHour,
      deposit: pricing.deposit,
      distance: null,
      area: v.area || p.city || 'Location not provided',
      regNumber: regCheck.formatted || v.regNumber,
      rating: null,
      reviews: 0,
      verified: false,
      image: state.listCarData.photos[0] || '',
      gallery: state.listCarData.photos.filter(Boolean),
      owner: {
        name: p.name || 'Verified Host',
        avatar: p.photoURL || AVA[0],
        rating: '5.0',
        trips: 1,
        response: 98
      }
    };

    return `
    <div class="flex items-center justify-between mb-4">
      <div>
        <h2 class="font-bold text-xl display">Listing Preview</h2>
        <p class="text-xs text-muted mt-0.5">Review your car details before making your listing live.</p>
      </div>
      <span class="text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800">Ready to Publish</span>
    </div>

    <div class="grid md:grid-cols-2 gap-6 mt-5 items-start">
      <div>
        <div class="max-w-sm mx-auto md:mx-0">
          ${carCardGrid(previewCar)}
        </div>
      </div>
      <div class="bg-sand rounded-2xl p-5 border border-line space-y-3 text-xs">
        <h3 class="font-bold text-sm text-ink display">Listing Summary</h3>
        <div class="flex justify-between py-1 border-b border-line/60"><span class="text-muted">Vehicle</span><span class="font-bold">${v.brand} ${v.model} (${v.year})</span></div>
        <div class="flex justify-between py-1 border-b border-line/60"><span class="text-muted">Registration No.</span><span class="font-mono font-bold text-brand">${regCheck.formatted || v.regNumber}</span></div>
        <div class="flex justify-between py-1 border-b border-line/60"><span class="text-muted">Specifications</span><span class="font-medium">${v.transmission} · ${v.fuel} · ${v.seats} Seats</span></div>
        <div class="flex justify-between py-1 border-b border-line/60"><span class="text-muted">Rates</span><span class="font-bold">₹${pricing.priceDay}/day (₹${pricing.priceHour}/hr)</span></div>
        <div class="flex justify-between py-1 border-b border-line/60"><span class="text-muted">Security Deposit</span><span class="font-medium">₹${pricing.deposit}</span></div>
        <div class="flex justify-between py-1 border-b border-line/60"><span class="text-muted">Host Name</span><span class="font-medium">${p.name || 'Owner'}</span></div>
        <div class="flex justify-between py-1"><span class="text-muted">Location</span><span class="font-medium">${v.area || 'Agra, UP'}</span></div>

        <div class="pt-4">
          <button onclick="publishListing()" id="publishListingBtn" class="btn btn-primary w-full font-semibold py-3.5 rounded-2xl text-sm shadow-card">
            🚀 Publish Car Listing Now
          </button>
          <button onclick="listBack()" class="w-full font-semibold py-2.5 rounded-2xl border border-line mt-2 text-xs">
            ← Back to Edit Details
          </button>
        </div>
      </div>
    </div>`;
  }

  return '';
}

function listNav(step){
  return `
  <div class="flex gap-3 mt-8 pt-5 border-t border-line">
    ${step>1 ? `<button onclick="listBack()" class="flex-1 font-semibold py-3 rounded-2xl border border-line text-sm hover:bg-sand">Back</button>` : ''}
    <button onclick="listNext()" class="flex-1 btn btn-primary font-semibold py-3 rounded-2xl text-sm shadow-card">
      ${step===5 ? 'Preview Listing' : 'Continue'}
    </button>
  </div>`;
}

function listNext(){
  const step = state.listCarStep;

  // Validation for Step 1 (Personal details)
  if(step===1){
    const name = document.getElementById('listHostName')?.value.trim();
    const email = document.getElementById('listHostEmail')?.value.trim();
    const phone = document.getElementById('listHostPhone')?.value.trim();
    if(!name){
      pushToast('Please enter your full name.','error');
      markListFieldError('listHostName','Enter your full name.');
      document.getElementById('listHostName')?.focus();
      return;
    }
    if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
      pushToast('Please enter a valid email address.','error');
      markListFieldError('listHostEmail','Enter a valid email address.');
      document.getElementById('listHostEmail')?.focus();
      return;
    }
    if(!phone || phone.length < 10){
      pushToast('Please enter a valid 10-digit mobile number.','error');
      markListFieldError('listHostPhone','Enter a valid mobile number.');
      document.getElementById('listHostPhone')?.focus();
      return;
    }
    state.listCarData.personal.name = name;
    state.listCarData.personal.email = email;
    state.listCarData.personal.phone = phone;
    const selectedCity = document.getElementById('listHostCity')?.value.trim();
    if(!selectedCity){
      pushToast('Please choose or enter your city and state.','error');
      markListFieldError('listHostCity','Enter or select a city/state.');
      document.getElementById('listHostCity')?.focus();
      return;
    }
    state.listCarData.personal.city = selectedCity;
  }

  // Validation for Step 2 (Vehicle & Registration Number)
  if(step===2){
    const pickupArea = document.getElementById('listCarArea')?.value.trim();
    if(!pickupArea){
      pushToast('Enter the pickup location for this car.','error');
      markListFieldError('listCarArea','Pickup location is required.');
      document.getElementById('listCarArea')?.focus();
      return;
    }
    state.listCarData.vehicle.area = pickupArea;
    const regNo = document.getElementById('listCarRegNumber')?.value.trim();
    if(!regNo){
      pushToast('Please enter the vehicle registration number.','error');
      markListFieldError('listCarRegNumber','Vehicle registration number is required.');
      document.getElementById('listCarRegNumber')?.focus();
      return;
    }
    const check = validateVehicleRegNumber(regNo);
    if(!check.isValid){
      pushToast(check.message, 'error');
      markListFieldError('listCarRegNumber',check.message);
      document.getElementById('listCarRegNumber')?.focus();
      return;
    }
    state.listCarData.vehicle.regNumber = check.formatted;
  }

  state.listCarStep++;
  renderApp();
  window.scrollTo({top: 100, behavior: 'smooth'});
}

function listBack(){
  state.listCarStep--;
  renderApp();
  window.scrollTo({top: 100, behavior: 'smooth'});
}

/* ---------------- VEHICLE FORM EVENT HANDLERS ---------------- */
function onListBrandChange(brand){
  state.listCarData.vehicle.brand = brand;
  const models = POPULAR_CAR_BRANDS[brand] || ['Custom Model'];
  state.listCarData.vehicle.model = models[0] || '';
  renderApp();
}

function onListModelChange(model){
  if(model==='custom'){
    const customInp = document.getElementById('listCarModelCustom');
    if(customInp){
      customInp.classList.remove('hidden');
      customInp.focus();
    }
  } else {
    state.listCarData.vehicle.model = model;
    const customInp = document.getElementById('listCarModelCustom');
    if(customInp) customInp.classList.add('hidden');
  }
}

function onListRegNumberChange(val){
  state.listCarData.vehicle.regNumber = val.toUpperCase();
  const feedbackEl = document.getElementById('regValidationFeedback');
  if(feedbackEl){
    feedbackEl.innerHTML = renderRegValidationFeedback(val);
  }
}

/* ---------------- HOST PHOTO UPLOAD HANDLER ---------------- */
function handleHostPhotoUpload(e){
  const file = e?.target?.files?.[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){
    pushToast('Please select a valid image file.','error');
    return;
  }
  const reader = new FileReader();
  reader.onload = (ev) => {
    state.listCarData.personal.photoURL = ev.target.result;
    if(state.user){
      state.user.photoURL = ev.target.result;
      saveUserSession(state.user);
    }
    pushToast('Host photo uploaded successfully!');
    renderApp();
  };
  reader.onerror = () => {
    pushToast('Error reading image file','error');
  };
  reader.readAsDataURL(file);
}

function removeHostPhoto(){
  state.listCarData.personal.photoURL = '';
  renderApp();
}

/* ---------------- CAR PHOTOS HANDLER ---------------- */
function handleFiles(files){
  [...files].slice(0,8).forEach(f=>{
    if(!f.type || !f.type.startsWith('image/')){ pushToast('Only image files can be added.','error'); return; }
    const reader = new FileReader();
    reader.onload = e=>{
      // Downscale to max 1600px JPEG so uploads are fast and small.
      const img = new Image();
      img.onload = ()=>{
        const scale = Math.min(1, 1600/Math.max(img.width, img.height));
        const c = document.createElement('canvas');
        c.width = Math.round(img.width*scale); c.height = Math.round(img.height*scale);
        c.getContext('2d').drawImage(img,0,0,c.width,c.height);
        state.listCarData.photos.push(c.toDataURL('image/jpeg',0.82));
        renderApp();
      };
      img.onerror = ()=>{ state.listCarData.photos.push(e.target.result); renderApp(); };
      img.src = e.target.result;
    };
    reader.readAsDataURL(f);
  });
}
function handleDrop(e){
  e.preventDefault();
  e.currentTarget.classList.remove('border-brand');
  handleFiles(e.dataTransfer.files);
}
function removePhoto(i){
  state.listCarData.photos.splice(i,1);
  renderApp();
}

/* ---------------- PUBLISH LISTING (REAL PERSISTENCE) ---------------- */
async function publishListing(){
  const btn = document.getElementById('publishListingBtn');
  if (window.DN?.whenReady) {
    try { await DN.whenReady(); } catch (_) {}
  }
  if (!state.user || (!window.DN?.authUser?.() && window.DN?.isConfigured?.())) {
    pushToast('Please log in first. Your car listing must be linked to your account.','error');
    openModal('login');
    return;
  }
  if (!state.listCarData.personal.name || !state.listCarData.personal.email || !state.listCarData.personal.phone) {
    pushToast('Complete your owner details before publishing.','error');
    state.listCarStep = 1; renderApp(); return;
  }
  if (!validateVehicleRegNumber(state.listCarData.vehicle.regNumber).isValid) {
    pushToast('Enter a valid vehicle registration number before publishing.','error');
    state.listCarStep = 2; renderApp(); return;
  }
  if(btn){
    btn.textContent = 'Publishing listing...';
    btn.disabled = true;
  }

  const p = getListPersonalData();
  const v = state.listCarData.vehicle;
  const pricing = state.listCarData.pricing;
  const regCheck = validateVehicleRegNumber(v.regNumber);
  const regFormatted = regCheck.formatted || v.regNumber;

  // Never invent demo car photos. A listing may have no photo; only uploaded
  // image files are saved and rendered.
  const gallery = Array.isArray(state.listCarData.photos) ? state.listCarData.photos.filter(x => typeof x === 'string' && x.startsWith('data:image/')) : [];
  const coverImage = gallery[0] || '';

  const newCarId = 'car-' + Date.now();
  const newCarObj = {
    id: newCarId,
    brand: v.brand,
    model: v.model,
    year: v.year,
    type: v.type,
    transmission: v.transmission,
    fuel: v.fuel,
    seats: v.seats,
    price: pricing.priceDay,
    priceHour: pricing.priceHour,
    deposit: pricing.deposit,
    distance: null,
    area: v.area || p.city || 'Location not provided',
    regNumber: regFormatted,
    rating: null,
    reviews: 0,
    verified: false,
    image: coverImage,
    gallery: gallery,
    lat: Number(state.listCarData.personal.cityLat) || null,
    lng: Number(state.listCarData.personal.cityLng) || null,
    features: ['Air Conditioning','Bluetooth Audio','Fastag Enabled','USB Charging','Reverse Camera','GPS Navigation'],
    ownerId: state.user?.id || 'owner-' + Date.now(),
    owner: {
      name: p.name || state.user?.name || 'Verified Host',
      avatar: p.photoURL || state.user?.photoURL || '',
      rating: null,
      trips: 0,
      response: null
    },
    reviewsList: []
  };

  // Persist first. Never show a false success if Firestore/Storage rejects the listing.
  try {
    if (!window.DN?.enabled?.()) throw new Error('Firebase is not connected. Check js/firebase-config.js and reload.');
    let uploadedGallery = [];
    if (state.listCarData.photos.length) {
      if(btn) btn.textContent = 'Uploading photos...';
      try {
        uploadedGallery = await Promise.all(state.listCarData.photos.map(async (dataUrl, i) => {
          if (!String(dataUrl).startsWith('data:image/')) return dataUrl;
          return await DN.uploadImage(`car-listings/${state.user.id}/${newCarId}/${Date.now()}-${i}.jpg`, dataUrl);
        }));
      } catch(upErr) {
        throw new Error('Photo upload failed: ' + (upErr?.code ? upErr.code + ' - ' : '') + (upErr?.message || 'check ImageKit setup'));
      }
    }
    // Never save base64 images into Firestore (1 MB document limit).
    const finalGallery = uploadedGallery.filter(u => typeof u === 'string' && !u.startsWith('data:'));
    if (state.listCarData.photos.length && !finalGallery.length) throw new Error('Photos could not be uploaded.');
    const safeAvatar = (u) => (typeof u === 'string' && !u.startsWith('data:')) ? u : '';
    const finalCover = finalGallery[0] || coverImage;
    const savedId = await DN.createCar({
      brand: v.brand, model: v.model, year: Number(v.year), type: v.type,
      transmission: v.transmission, fuel: v.fuel, seats: Number(v.seats),
      pricePerHour: Number(pricing.priceHour), pricePerDay: Number(pricing.priceDay),
      location: v.area || p.city || '', area: v.area || p.city || '', lat: Number(state.listCarData.personal.cityLat) || null, lng: Number(state.listCarData.personal.cityLng) || null,
      deposit: Number(pricing.deposit), regNumber: regFormatted,
      image: finalCover, gallery: finalGallery, features: newCarObj.features,
      owner: { name: p.name, email: p.email, phone: p.phone, avatar: safeAvatar(p.photoURL) },
      ownerName: p.name, ownerEmail: p.email, ownerPhone: p.phone,
      status: 'pending', verificationStatus: 'pending'
    });
    newCarObj.id = savedId;
    newCarObj.image = finalCover; newCarObj.gallery = finalGallery; newCarObj.verified = false;
    // Make the just-saved listing appear immediately in this owner's dashboard.
    const savedOwnerCar = {
      ...newCarObj,
      id: savedId,
      ownerId: state.user.id,
      pricePerDay: Number(pricing.priceDay),
      pricePerHour: Number(pricing.priceHour),
      location: v.area || p.city || '', lat: Number(state.listCarData.personal.cityLat) || null, lng: Number(state.listCarData.personal.cityLng) || null,
      status: 'pending',
      verificationStatus: 'pending'
    };
    state.ownerCars = [savedOwnerCar, ...(state.ownerCars || []).filter(c => String(c.id) !== String(savedId))];
    // Pending listings are intentionally not added to the public fleet until admin approval.
  } catch(err){
    console.error('Could not publish car listing:', err);
    if (btn) { btn.disabled = false; btn.textContent = '🚀 Publish Car Listing Now'; }
    pushToast(`Listing failed: ${err?.message || 'Please check Firebase permissions and Storage setup.'}`,'error');
    return;
  }

  // Also switch user mode to owner if needed
  if(state.user){
    state.user.mode = 'owner';
    saveUserSession(state.user);
  }

  // Reset list car wizard state
  state.listCarStep = 1;
  state.listCarData.photos = [];
  pushToast(`Car submitted for admin verification: ${v.brand} ${v.model}.`);
  nav('#/owner/dashboard');
}

// Keyboard accessibility: Enter advances the listing wizard from text fields,
// matching the visible Continue button. Do not intercept Enter in textareas/buttons.
if (!window.__driveNearListEnterBound) {
  window.__driveNearListEnterBound = true;
  document.addEventListener('keydown', function(event) {
    if (event.key !== 'Enter' || state.route !== '#/list-your-car') return;
    const el = event.target;
    if (!el || !['INPUT'].includes(el.tagName) || el.type === 'file' || el.type === 'checkbox' || el.type === 'radio') return;
    event.preventDefault();
    listNext();
  });
}
