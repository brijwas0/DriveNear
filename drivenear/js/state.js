function getSavedUser(){
  try { const raw = localStorage.getItem('dn_user_session'); return raw ? JSON.parse(raw) : null; } catch(e){ return null; }
}
function saveUserSession(u){
  try {
    if(u) localStorage.setItem('dn_user_session', JSON.stringify(u));
    else localStorage.removeItem('dn_user_session');
  } catch(e){}
}
function getSavedBookings(){
  try { const raw = localStorage.getItem('dn_my_bookings'); return raw ? JSON.parse(raw) : []; } catch(e){ return []; }
}
function saveBookings(b){
  try { localStorage.setItem('dn_my_bookings', JSON.stringify(b)); } catch(e){}
}

/* ---------------- STATE ---------------- */
const state = {
  route: '#/',
  user: getSavedUser(), // {id, name, email, phone, photoURL, drivingLicence, city, mode:'renter'|'owner', isAdmin:false}
  favorites: new Set(JSON.parse(localStorage.getItem('dn_favs')||'[]')),
  filters: { type:'All', fuel:'All', transmission:'All', seats:'All', maxPrice:5000, minRating:0, search:'' },
  sort: 'recommended',
  mapListMobile: 'list',
  selectedCarId: null,
  modal: null, // 'login' | 'booking' | 'notifications' | 'editProfile' | 'invoice'
  bookingStep: 1,
  bookingCar: null,
  listCarStep: 1,
  listCarData: {
    personal: { name: '', email: '', phone: '', city: '', photoURL: '' },
    vehicle: { brand: 'Hyundai', model: 'Creta', year: 2023, regNumber: '', type: 'SUV', fuel: 'Petrol', transmission: 'Automatic', seats: 5, area: '' },
    pricing: { priceHour: 165, priceDay: 1499, deposit: 4000 },
    photos: [],
    availability: {}
  },
  dashboardTab: 'trips',
  adminTab: 'overview',
  adminData: {users:[],cars:[],bookings:[],settings:{}},
  adminDataError: '',
  adminDataLoading: false,
  siteSettings: {announcement:'',maintenance:false,whatsappNumber:'',upiId:'',upiName:'DriveNear',upiQrUrl:''},
  ownerTab: 'cars',
  ownerCars: [],
  ownerBookings: [],
  ownerCarsLoaded: false,
  publicCarsLoaded: false,
  publicCarsError: '',
  myBookings: getSavedBookings(),
  chatOpenId: 'c1',
  toasts: [],
  calMonth: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
  filterSheetOpen: false,
  activeInvoice: null,
};

function saveFavs(){ localStorage.setItem('dn_favs', JSON.stringify([...state.favorites])); }
function esc(s){ return String(s==null?'':s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c])); }
function fmt(n){ return '₹' + Number(n||0).toLocaleString('en-IN'); }
function initials(name){ return String(name||'User').trim().split(/\s+/).map(s=>s[0]).slice(0,2).join('').toUpperCase() || 'U'; }
function getUserAvatar(u, sizeClass='w-9 h-9'){
  if(u?.photoURL){
    return `<img src="${esc(u.photoURL)}" class="${sizeClass} rounded-full object-cover border border-line" alt="${esc(u.name||'User')}" onerror="this.onerror=null;this.replaceWith(Object.assign(document.createElement('span'),{className:'${sizeClass} rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs',textContent:this.dataset.i}))" data-i="${esc(initials(u?.name))}">`;
  }
  return `<span class="${sizeClass} rounded-full bg-brand text-white flex items-center justify-center font-bold text-xs">${initials(u?.name)}</span>`;
}
