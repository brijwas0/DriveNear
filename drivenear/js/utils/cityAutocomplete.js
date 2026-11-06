/* DriveNear India-wide city autocomplete and live map preview.
   Photon (OpenStreetMap-based) searches cities/towns/villages; Nominatim is a fallback.
   No Enter/Search click is needed to preview the first matching location on the map.
*/
const DRIVENEAR_CITIES = [
  'Agra, Uttar Pradesh','Ahmedabad, Gujarat','Ajmer, Rajasthan','Amritsar, Punjab','Bengaluru, Karnataka',
  'Bhopal, Madhya Pradesh','Bhubaneswar, Odisha','Chandigarh','Chennai, Tamil Nadu','Coimbatore, Tamil Nadu',
  'Dehradun, Uttarakhand','Delhi, Delhi','Faridabad, Haryana','Ghaziabad, Uttar Pradesh','Gurugram, Haryana',
  'Guwahati, Assam','Gwalior, Madhya Pradesh','Hyderabad, Telangana','Indore, Madhya Pradesh','Jaipur, Rajasthan',
  'Jalandhar, Punjab','Jammu, Jammu and Kashmir','Jodhpur, Rajasthan','Kanpur, Uttar Pradesh','Kochi, Kerala',
  'Kolkata, West Bengal','Kota, Rajasthan','Lucknow, Uttar Pradesh','Ludhiana, Punjab','Meerut, Uttar Pradesh',
  'Mumbai, Maharashtra','Mysuru, Karnataka','Nagpur, Maharashtra','Nashik, Maharashtra','Noida, Uttar Pradesh',
  'Patna, Bihar','Prayagraj, Uttar Pradesh','Pune, Maharashtra','Raipur, Chhattisgarh','Rajkot, Gujarat',
  'Ranchi, Jharkhand','Shimla, Himachal Pradesh','Srinagar, Jammu and Kashmir','Surat, Gujarat','Thane, Maharashtra',
  'Thiruvananthapuram, Kerala','Udaipur, Rajasthan','Vadodara, Gujarat','Varanasi, Uttar Pradesh','Vijayawada, Andhra Pradesh',
  'Visakhapatnam, Andhra Pradesh'
];

let dnCityLookupTimer=null, dnCityLookupController=null, dnCityLastQuery='', dnCityLastResults=[], dnCityRequestId=0, dnCitySelectionInProgress=false;
function cityDatalistMarkup(){return '<datalist id="drivenearCitySuggestions"></datalist>';}
function escCity(v){return String(v??'').replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
function cityLabel(row){
  const a=row.address||{}, p=row.properties||{};
  const name=p.name||p.city||p.town||p.village||a.city||a.town||a.municipality||a.village||row.name||String(row.display_name||'').split(',')[0];
  const state=p.state||a.state||'';
  return state && !String(name).toLowerCase().includes(String(state).toLowerCase()) ? `${name}, ${state}` : String(name||'');
}
function normalizeCityRows(rows,source){
  const seen=new Set(),out=[];
  for(const row of rows||[]){
    const props=source==='photon'?(row.properties||{}):row;
    const coords=source==='photon'?(row.geometry?.coordinates||[]):[row.lon,row.lat];
    const country=String(props.country_code||props.countrycode||props.country||row.address?.country_code||'').toLowerCase();
    if(country && country!=='in' && country!=='india')continue;
    const label=cityLabel(source==='photon'?row:{...row,name:row.name||row.display_name});
    const lat=Number(source==='photon'?coords[1]:coords[1]),lon=Number(source==='photon'?coords[0]:coords[0]);
    if(!label||!Number.isFinite(lat)||!Number.isFinite(lon))continue;
    const key=label.toLowerCase();if(seen.has(key))continue;seen.add(key);
    out.push({label,lat,lon,display:source==='photon'?[props.name,props.district,props.state,props.country].filter(Boolean).join(', '):(row.display_name||label)});
  }
  return out;
}
function ensureCityDropdown(input){
  let box=document.getElementById('dn-city-suggestions');
  if(!box){box=document.createElement('div');box.id='dn-city-suggestions';Object.assign(box.style,{position:'absolute',zIndex:'99999',background:'#fff',border:'1px solid #ddd',borderRadius:'12px',boxShadow:'0 12px 30px rgba(0,0,0,.14)',maxHeight:'280px',overflowY:'auto',display:'none',padding:'5px',color:'#17211d'});document.body.appendChild(box);}
  const rect=input.getBoundingClientRect();box.style.left=(rect.left+window.scrollX)+'px';box.style.top=(rect.bottom+window.scrollY+5)+'px';box.style.width=Math.max(rect.width,260)+'px';return box;
}
function hideCityDropdown(){const b=document.getElementById('dn-city-suggestions');if(b)b.style.display='none';}
function showCityDropdown(input,items,query,loading=false){
  const box=ensureCityDropdown(input);let suggestions=items||[];
  if(query.length<2){const q=query.toLowerCase();suggestions=DRIVENEAR_CITIES.filter(c=>c.toLowerCase().includes(q)).slice(0,8).map(label=>({label,lat:null,lon:null,display:label}));}
  box.innerHTML=suggestions.slice(0,8).map((it,i)=>`<button type="button" data-index="${i}" style="display:block;width:100%;text-align:left;padding:10px;border:0;background:white;border-radius:8px;cursor:pointer"><span style="font-weight:650">📍 ${escCity(it.label)}</span><small style="display:block;color:#66736d;padding-left:23px;white-space:normal">${escCity(it.display||it.label)}</small></button>`).join('');
  if(!box.innerHTML)box.innerHTML=`<div style="padding:10px;color:#66736d">${loading?'Searching Indian cities…':'No matching places found. Try another spelling.'}</div>`;
  box.querySelectorAll('button').forEach((btn)=>{btn.addEventListener('mouseenter',()=>btn.style.background='#eef7f3');btn.addEventListener('mouseleave',()=>btn.style.background='white');btn.addEventListener('click',()=>{const it=suggestions[Number(btn.dataset.index)];if(!it)return;input.value=it.label;dnCityLastQuery=it.label;dnCityLastResults=[it];clearTimeout(dnCityLookupTimer);if(dnCityLookupController){dnCityLookupController.abort();dnCityLookupController=null;}dnCityRequestId++;if(Number.isFinite(it.lat)&&Number.isFinite(it.lon)&&typeof zoomMapToCoordinates==='function')zoomMapToCoordinates(it.lat,it.lon,it.label);else if(typeof scheduleCityMapZoom==='function')scheduleCityMapZoom(it.label,true);dnCitySelectionInProgress=true;input.dispatchEvent(new Event('input',{bubbles:true}));hideCityDropdown();setTimeout(()=>{dnCitySelectionInProgress=false;hideCityDropdown();},0);});});
  box.style.display='block';
}
async function photonLookup(q,signal){
  const url='https://photon.komoot.io/api/?q='+encodeURIComponent(q)+'&limit=15&lang=en';
  const r=await fetch(url,{signal,headers:{'Accept':'application/json'}});if(!r.ok)throw new Error('Photon lookup failed');const data=await r.json();return normalizeCityRows(data.features||[],'photon');
}
async function nominatimLookup(q,signal){
  const url='https://nominatim.openstreetmap.org/search?format=jsonv2&addressdetails=1&limit=10&countrycodes=in&q='+encodeURIComponent(q);
  const r=await fetch(url,{signal,headers:{'Accept-Language':'en'}});if(!r.ok)throw new Error('Nominatim lookup failed');return normalizeCityRows(await r.json(),'nominatim');
}
async function lookupIndianCities(query,input){
  const q=String(query||'').trim();if(q.length<2){showCityDropdown(input,[],q);return;}
  const id=++dnCityRequestId;
  if(dnCityLookupController)dnCityLookupController.abort();
  dnCityLookupController=new AbortController();
  const signal=dnCityLookupController.signal;
  showCityDropdown(input,[],q,true);
  try{
    let rows=[];
    // Photon is the primary autocomplete service. Do not constrain it to a short city list
    // or a fixed bbox; India has thousands of towns and municipalities.
    try { rows=await photonLookup(q,signal); } catch(e) { if(e.name==='AbortError')return; }
    if(id!==dnCityRequestId||!input.isConnected||input.value.trim()!==q)return;
    // If Photon returns no useful result, query Nominatim as a fallback.
    if(!rows.length){
      try { rows=await nominatimLookup(q,signal); } catch(e) { if(e.name==='AbortError')return; }
    }
    if(id!==dnCityRequestId||!input.isConnected||input.value.trim()!==q)return;
    // Prioritize actual populated places (city/town/village) when Photon provides place type.
    rows=rows.filter(row=>Number.isFinite(row.lat)&&Number.isFinite(row.lon));
    dnCityLastQuery=q;dnCityLastResults=rows;
    showCityDropdown(input,rows,q);
    // Move the map before Enter is pressed, as soon as a geocoded result is available.
    if(rows.length&&typeof zoomMapToCoordinates==='function'){
      const best=rows[0];
      zoomMapToCoordinates(best.lat,best.lon,best.label);
    }
  }catch(e){
    if(e.name!=='AbortError'){
      console.warn('India city autocomplete failed:',e);
      if(id===dnCityRequestId&&input.isConnected&&input.value.trim()===q)
        showCityDropdown(input,[],q,false);
    }
  }
}
function attachCityAutocomplete(input){
  if(!input||input.dataset.dnCityAutocomplete==='1')return;input.dataset.dnCityAutocomplete='1';input.setAttribute('autocomplete','off');input.removeAttribute('list');
  input.addEventListener('input',()=>{if(dnCitySelectionInProgress){hideCityDropdown();return;}clearTimeout(dnCityLookupTimer);const q=input.value.trim();if(typeof scheduleCityMapZoom==='function')scheduleCityMapZoom(q,false);if(q.length<2){showCityDropdown(input,[],q);return;}dnCityLookupTimer=setTimeout(()=>lookupIndianCities(q,input),250);});
  input.addEventListener('focus',()=>{const q=input.value.trim();if(q.length>=2)lookupIndianCities(q,input);else showCityDropdown(input,[],q);});
  input.addEventListener('blur',()=>setTimeout(hideCityDropdown,220));
  window.addEventListener('resize',()=>{if(document.activeElement===input)ensureCityDropdown(input);});window.addEventListener('scroll',()=>{if(document.activeElement===input)ensureCityDropdown(input);},true);
}
function searchCarsFromHome(){const input=document.getElementById('homeCityInput');const city=(input?.value||'').trim();if(typeof state!=='undefined'&&state.filters)state.filters.search=city;if(typeof nav==='function')nav('#/cars');}
