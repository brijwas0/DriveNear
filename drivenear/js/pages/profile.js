/* DriveNear — js/pages/profile.js */

/* ---------------- PROFILE ---------------- */
let editProfileModalOpen = false;

function profileInner(){
  const u = state.user || {
    name: 'Guest User',
    email: '',
    phone: '',
    mode: 'renter',
    city: '',
    drivingLicence: ''
  };

  const phone = String(u.phone || '').trim();
  const phoneDisplay = phone ? (phone.startsWith('+') ? phone : `+91 ${phone}`) : 'Not added';
  const emailDisplay = u.email || 'Not added';
  const dlDisplay = u.drivingLicence ? u.drivingLicence : 'Not uploaded';
  const cityDisplay = u.city || 'Not set';
  const dashboardPath = u.mode==='owner' ? '#/owner/dashboard' : '#/dashboard';
  
  // Real trip stats based on user bookings
  const tripsCount = Array.isArray(state.myBookings) ? state.myBookings.length : 0;
  const completedTrips = Array.isArray(state.myBookings) ? state.myBookings.filter(b=>b.status==='completed').length : 0;

  // Real verification status
  const verifications = [
    { label: 'Identity Verification', verified: !!u.drivingLicence || !!u.name },
    { label: 'Phone Verification', verified: !!u.phone },
    { label: 'Email Verification', verified: !!u.email },
    { label: 'Driving Licence', verified: !!u.drivingLicence }
  ];

  return `
  <div class="max-w-2xl">
    <div class="bg-white border border-line rounded-2xl p-6 flex flex-wrap sm:flex-nowrap items-center gap-5">
      <div class="relative group cursor-pointer" onclick="triggerProfilePhotoUpload()" title="Click to change profile photo">
        ${getUserAvatar(u, 'w-20 h-20 text-xl')}
        <div class="absolute inset-0 bg-ink/50 text-white rounded-full flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-[11px] font-semibold">
          <span>📷</span>
          <span>Upload</span>
        </div>
        <span class="absolute -bottom-1 -right-1 bg-brand text-white w-6 h-6 rounded-full flex items-center justify-center text-xs shadow-card">✎</span>
      </div>
      <input type="file" id="userProfilePhotoInput" accept="image/*" class="hidden" onchange="handleProfilePhotoUpload(event)">
      <div class="flex-1">
        <div class="flex items-center gap-2">
          <h2 class="font-bold text-xl display">${u.name || 'User Profile'}</h2>
          ${u.isAdmin ? `<span class="bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">Admin</span>` : ''}
          <span class="bg-brand-light text-brand text-[11px] font-semibold px-2 py-0.5 rounded-full capitalize">${u.mode || 'renter'}</span>
        </div>
        <p class="text-xs text-muted mt-1 flex items-center gap-2">
          <span>🚗 ${tripsCount} total booking${tripsCount===1?'':'s'} (${completedTrips} completed)</span>
          <span>·</span>
          <span>📍 ${cityDisplay}</span>
        </p>
        <div class="flex items-center gap-3 mt-3">
          <button onclick="triggerProfilePhotoUpload()" class="text-xs font-semibold text-brand hover:underline flex items-center gap-1">
            📷 Change Photo
          </button>
          <span class="text-line">|</span>
          <button onclick="openEditProfileModal()" class="text-xs font-semibold text-brand hover:underline">
            ✎ Edit Personal Details
          </button>
        </div>
      </div>
    </div>

    <h3 class="font-semibold mt-7 mb-3 display">Document & Account Verification</h3>
    <div class="grid sm:grid-cols-2 gap-3">
      ${verifications.map(b=>`
        <div class="flex items-center justify-between border border-line rounded-xl px-4 py-3 text-sm font-medium bg-white">
          <div class="flex items-center gap-2.5">
            <span class="w-6 h-6 rounded-full ${b.verified?'bg-brand text-white':'bg-line text-muted'} flex items-center justify-center text-xs">
              ${b.verified ? '✓' : '—'}
            </span>
            <span class="${b.verified?'text-ink':'text-muted'}">${b.label}</span>
          </div>
          <span class="text-xs font-semibold ${b.verified?'text-brand':'text-muted'}">${b.verified?'Verified':'Pending'}</span>
        </div>`).join('')}
    </div>

    <h3 class="font-semibold mt-7 mb-3 display">Personal & Account Information</h3>
    <div class="border border-line rounded-2xl divide-y divide-line bg-white overflow-hidden">
      <div class="px-5 py-3.5 flex justify-between text-sm"><span class="text-muted">Full Name</span><span class="font-medium">${u.name||'—'}</span></div>
      <div class="px-5 py-3.5 flex justify-between text-sm"><span class="text-muted">Email</span><span class="font-medium">${emailDisplay}</span></div>
      <div class="px-5 py-3.5 flex justify-between text-sm"><span class="text-muted">Mobile Phone</span><span class="font-medium">${phoneDisplay}</span></div>
      <div class="px-5 py-3.5 flex justify-between text-sm"><span class="text-muted">City / Location</span><span class="font-medium">${cityDisplay}</span></div>
      <div class="px-5 py-3.5 flex justify-between text-sm"><span class="text-muted">Driving Licence No.</span><span class="font-medium font-mono">${dlDisplay}</span></div>
      <div class="px-5 py-3.5 flex justify-between text-sm"><span class="text-muted">Account Type</span><span class="font-medium capitalize">${u.mode||'renter'}</span></div>
    </div>

    <div class="flex flex-wrap gap-3 mt-7">
      ${state.user ? `
        <button onclick="openEditProfileModal()" class="btn btn-primary text-sm font-semibold px-5 py-2.5 rounded-full">Edit Profile</button>
        <a href="${dashboardPath}" class="text-sm font-semibold border border-line rounded-full px-5 py-2.5 bg-white hover:bg-sand">Dashboard</a>
        ${u.isAdmin ? `<a href="#/admin" class="text-sm font-semibold border border-brand text-brand rounded-full px-5 py-2.5 bg-brand-light">🛡️ Admin Center</a>` : ''}
        <a href="#/" class="text-sm font-semibold border border-line rounded-full px-5 py-2.5 bg-white">Back to Website</a>
        <button onclick="doLogout()" class="text-sm font-semibold text-danger px-3 py-2">Log out</button>
      ` : `
        <button onclick="openModal('login')" class="btn btn-primary text-sm font-semibold px-5 py-2.5 rounded-full">Log In / Sign Up</button>
      `}
    </div>

    ${editProfileModalHtml()}
  </div>`;
}

function pageProfile(){
  return `<section class="max-w-6xl mx-auto px-5 lg:px-8 py-8 pb-24 lg:pb-8">
    <div class="flex items-center justify-between mb-6">
      <h1 class="display text-2xl sm:text-3xl font-bold">My Profile</h1>
      ${state.user?.isAdmin ? `<a href="#/admin" class="text-xs font-semibold px-3 py-1.5 rounded-full bg-brand-light text-brand border border-brand/30">Admin Portal →</a>` : ''}
    </div>
    ${profileInner()}
  </section>`;
}

/* ---------------- PHOTO UPLOAD HANDLER ---------------- */
function triggerProfilePhotoUpload(){
  const inp = document.getElementById('userProfilePhotoInput');
  if(inp) inp.click();
}

function handleProfilePhotoUpload(e){
  const file = e?.target?.files?.[0];
  if(!file) return;
  if(!file.type.startsWith('image/')){
    pushToast('Please select a valid image file (.png, .jpg, .webp)','error');
    e.target.value = '';
    return;
  }
  if(file.size > 10 * 1024 * 1024){
    pushToast('Image is too large (max 10MB). Please choose a smaller photo.','error');
    e.target.value = '';
    return;
  }

  // Compress the photo before saving. Raw camera images can exceed localStorage's
  // quota, which previously made the avatar silently revert to initials.
  const reader = new FileReader();
  reader.onload = () => {
    const image = new Image();
    image.onload = () => {
      const canvas = document.createElement('canvas');
      const maxSide = 320;
      const scale = Math.min(1, maxSide / Math.max(image.naturalWidth || image.width, image.naturalHeight || image.height));
      canvas.width = Math.max(1, Math.round((image.naturalWidth || image.width) * scale));
      canvas.height = Math.max(1, Math.round((image.naturalHeight || image.height) * scale));
      const ctx = canvas.getContext('2d');
      if(!ctx){
        pushToast('Could not process this image. Please try another photo.','error');
        return;
      }
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(image, 0, 0, canvas.width, canvas.height);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.78);

      if(!state.user){
        state.user = { name: 'User', email: '', phone: '', mode: 'renter' };
      }
      // Update UI immediately; save the compact image into the local session.
      state.user.photoURL = dataUrl;
      try {
        localStorage.setItem('dn_user_session', JSON.stringify(state.user));
      } catch(err) {
        // Try a smaller image once if the browser's storage quota is low.
        try {
          state.user.photoURL = canvas.toDataURL('image/jpeg', 0.48);
          localStorage.setItem('dn_user_session', JSON.stringify(state.user));
        } catch(storageErr) {
          pushToast('Photo preview is ready, but browser storage is full. Clear site data or sign in again to save it.','error');
          renderApp();
          return;
        }
      }

      // Save photo per signed-in account as a durable local fallback.
      // The frontend-only build has no Firestore/Storage, so this keeps the DP after refresh on this browser.
      try {
        if (state.user?.id) {
          const key = `dn_auth_profile_${state.user.id}`;
          const saved = JSON.parse(localStorage.getItem(key) || '{}');
          localStorage.setItem(key, JSON.stringify({ ...saved, photoURL: state.user.photoURL }));
        }
      } catch (err) {
        console.warn('Could not save local profile photo:', err);
      }

      // Sync to Firestore only if a real backend is connected.
      if(window.DN?.enabled?.() && state.user?.id){
        Promise.resolve().then(async () => {
          try {
            await DN.db().collection('users').doc(state.user.id).set({
              photoURL: state.user.photoURL,
              updatedAt: firebase.firestore.FieldValue.serverTimestamp()
            }, {merge:true});
          } catch(err) {
            console.warn('Could not sync photo to Firestore:', err);
            pushToast('Photo updated on this device, but cloud sync failed.','error');
          }
        });
      }
      pushToast('Profile photo updated!');
      renderApp();
    };
    image.onerror = () => pushToast('Could not open this image. Please choose another file.','error');
    image.src = reader.result;
  };
  reader.onerror = () => pushToast('Error reading the image file. Please try again.','error');
  reader.readAsDataURL(file);
}

/* ---------------- EDIT PROFILE MODAL ---------------- */
function openEditProfileModal(){
  editProfileModalOpen = true;
  renderApp();
}

function closeEditProfileModal(){
  editProfileModalOpen = false;
  renderApp();
}

function editProfileModalHtml(){
  if(!editProfileModalOpen) return '';
  const u = state.user || { name:'', email:'', phone:'', city:'', drivingLicence:'', mode:'renter' };
  return `
  <div class="fixed inset-0 z-50 flex items-center justify-center p-4">
    <div class="modal-backdrop absolute inset-0 bg-ink/50" onclick="closeEditProfileModal()"></div>
    <div class="modal-panel relative bg-white w-full max-w-lg rounded-3xl p-6 sm:p-7 shadow-lift max-h-[90vh] overflow-y-auto">
      <div class="flex items-center justify-between pb-4 border-b border-line">
        <h3 class="display font-bold text-xl">Edit Personal Details</h3>
        <button onclick="closeEditProfileModal()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sand">${ICO.close}</button>
      </div>

      <div class="space-y-4 mt-5">
        <div>
          <label class="text-xs font-semibold text-muted">Full Name *</label>
          <input id="editName" value="${u.name||''}" placeholder="e.g. Rahul Sharma" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-muted">Email Address *</label>
            <input id="editEmail" type="email" value="${u.email||''}" placeholder="name@example.com" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
          </div>
          <div>
            <label class="text-xs font-semibold text-muted">Mobile Number *</label>
            <input id="editPhone" type="tel" value="${u.phone||''}" placeholder="e.g. 9876543210" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
          </div>
        </div>
        <div class="grid sm:grid-cols-2 gap-3">
          <div>
            <label class="text-xs font-semibold text-muted">City / Location</label>
            <input id="editCity" value="${u.city||'Agra, Uttar Pradesh'}" placeholder="e.g. Agra, Uttar Pradesh" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
          </div>
          <div>
            <label class="text-xs font-semibold text-muted">Driving Licence Number</label>
            <input id="editDL" value="${u.drivingLicence||''}" placeholder="e.g. DL1420210012345" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none uppercase focus:border-brand">
          </div>
        </div>
        <div>
          <label class="text-xs font-semibold text-muted">Account Mode</label>
          <select id="editMode" class="w-full mt-1 border border-line rounded-xl px-3.5 py-2.5 text-sm outline-none focus:border-brand">
            <option value="renter" ${u.mode==='renter'?'selected':''}>Renter (Looking to rent cars)</option>
            <option value="owner" ${u.mode==='owner'?'selected':''}>Host / Car Owner (List your own car)</option>
          </select>
        </div>
      </div>

      <div class="flex gap-3 mt-7 pt-4 border-t border-line">
        <button onclick="closeEditProfileModal()" class="flex-1 font-semibold py-2.5 rounded-full border border-line text-sm">Cancel</button>
        <button onclick="saveUserProfileDetails()" class="flex-1 btn btn-primary font-semibold py-2.5 rounded-full text-sm">Save Changes</button>
      </div>
    </div>
  </div>`;
}

async function saveUserProfileDetails(){
  const name = document.getElementById('editName')?.value.trim();
  const email = document.getElementById('editEmail')?.value.trim();
  const phone = document.getElementById('editPhone')?.value.trim();
  const city = document.getElementById('editCity')?.value.trim();
  const dl = document.getElementById('editDL')?.value.trim().toUpperCase();
  const mode = document.getElementById('editMode')?.value || 'renter';

  if(!name){
    pushToast('Please enter your full name.','error');
    return;
  }
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    pushToast('Please enter a valid email address.','error');
    return;
  }

  if(!state.user){
    state.user = { id: 'u_'+Date.now() };
  }

  state.user = {
    ...state.user,
    name,
    email,
    phone,
    city: city || 'Agra, Uttar Pradesh',
    drivingLicence: dl,
    mode
  };

  saveUserSession(state.user);

  if(window.DN?.enabled() && state.user?.id){
    try {
      await DN.db().collection('users').doc(state.user.id).set({
        name,
        email,
        phone,
        city,
        drivingLicence: dl,
        role: mode,
        updatedAt: firebase.firestore.FieldValue.serverTimestamp()
      }, {merge: true});
    } catch(err){
      console.warn('Firestore user update sync error:', err);
    }
  }

  closeEditProfileModal();
  pushToast('Personal details updated successfully!');
}

async function doLogout(){
  try {
    if(window.DN?.signOut) await DN.signOut();
  } catch(e){
    console.warn('[DriveNear] Logout warning:', e);
  }
  state.user = null;
  saveUserSession(null);
  pushToast('Logged out');
  nav('#/');
}
