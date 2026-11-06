/* DriveNear — js/components/authModal.js
   Firebase Authentication Modal (Google & Email/Password)
*/

let authMode = 'login';
let signupRole = 'renter';
let isAuthSubmitting = false;

function loginModalHtml(){
  return `
  <div class="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-6">
    <div class="modal-backdrop absolute inset-0 bg-ink/50" onclick="closeModal()"></div>
    <div class="modal-panel relative bg-white w-full sm:max-w-md sm:rounded-3xl rounded-t-3xl p-6 shadow-lift">
      <div class="flex items-center justify-between mb-5">
        <h3 class="display font-bold text-xl">${authMode==='login'?'Log in':'Create your account'}</h3>
        <button onclick="closeModal()" class="w-8 h-8 rounded-full flex items-center justify-center hover:bg-sand text-muted hover:text-ink">${ICO.close}</button>
      </div>

      <div class="flex bg-sand rounded-full p-1 mb-5">
        <button onclick="setAuthMode('login')" class="flex-1 text-sm font-semibold py-2 rounded-full transition-colors ${authMode==='login'?'bg-white shadow-card':''}">Log In</button>
        <button onclick="setAuthMode('signup')" class="flex-1 text-sm font-semibold py-2 rounded-full transition-colors ${authMode==='signup'?'bg-white shadow-card':''}">Sign Up</button>
      </div>

      <button id="googleLoginBtn" type="button" onclick="doGoogleLogin()" class="w-full flex items-center justify-center gap-3 bg-white border border-[#DADCE0] hover:bg-[#F8F9FA] text-[#3C4043] font-semibold py-3 rounded-xl transition-all shadow-sm">
        <svg aria-hidden="true" width="20" height="20" viewBox="0 0 48 48" class="shrink-0"><path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 3.01 13.22l7.98 6.19C12.88 13.72 17.94 9.5 24 9.5z"/><path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.72 7.18l7.62 5.91c4.45-4.11 7.14-10.16 7.14-17.56z"/><path fill="#FBBC05" d="M10.99 28.59A14.4 14.4 0 0 1 10.22 24c0-1.59.28-3.13.77-4.59l-7.98-6.19A23.9 23.9 0 0 0 0 24c0 3.87.93 7.52 3.01 10.78l7.98-6.19z"/><path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.9-5.89l-7.62-5.91c-2.11 1.41-4.8 2.25-8.28 2.25-6.06 0-11.12-4.22-13.01-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z"/></svg>
        <span id="googleLoginText">Continue with Google</span>
      </button>

      <div class="flex items-center gap-3 my-4">
        <div class="h-px bg-line flex-1"></div>
        <span class="text-xs text-muted">or continue with email</span>
        <div class="h-px bg-line flex-1"></div>
      </div>

      ${authMode==='login'?`
        <form onsubmit="event.preventDefault(); doLogin();" class="space-y-3">
          <div>
            <label class="text-xs font-semibold text-muted block mb-1">Email</label>
            <input id="authEmail" type="email" placeholder="you@example.com" autocomplete="email" required class="w-full border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand">
          </div>
          <div>
            <label class="text-xs font-semibold text-muted block mb-1">Password</label>
            <input id="authPassword" type="password" placeholder="Minimum 6 characters" autocomplete="current-password" required class="w-full border border-line rounded-xl px-3 py-2.5 text-sm outline-none focus:border-brand">
          </div>
          <button id="emailLoginBtn" type="submit" class="btn btn-primary w-full font-semibold py-3 rounded-2xl mt-4 transition-all">Log In</button>
        </form>
      `:`
        <form onsubmit="event.preventDefault(); doSignup();">
          <div class="grid grid-cols-2 gap-3">
            <input id="signupName" placeholder="Full name" autocomplete="name" required class="border border-line rounded-xl px-3 py-2.5 text-sm col-span-2 outline-none focus:border-brand">
            <input id="signupEmail" type="email" placeholder="Email" autocomplete="email" required class="border border-line rounded-xl px-3 py-2.5 text-sm col-span-2 outline-none focus:border-brand">
            <input id="signupPhone" type="tel" placeholder="Mobile number (optional)" autocomplete="tel" class="border border-line rounded-xl px-3 py-2.5 text-sm col-span-2 outline-none focus:border-brand">
            <input id="signupPassword" type="password" placeholder="Password (6+ chars)" autocomplete="new-password" required class="border border-line rounded-xl px-3 py-2.5 text-sm col-span-2 outline-none focus:border-brand">
          </div>
          <p class="text-xs font-semibold text-muted mt-4 mb-2">I want to</p>
          <div class="grid grid-cols-2 gap-3">
            <button type="button" onclick="setSignupRole('renter')" class="border ${signupRole==='renter'?'border-brand bg-brand-light font-bold':'border-line'} rounded-xl px-3 py-3 text-sm font-semibold text-left transition-colors">🚘 Rent a Car</button>
            <button type="button" onclick="setSignupRole('owner')" class="border ${signupRole==='owner'?'border-brand bg-brand-light font-bold':'border-line'} rounded-xl px-3 py-3 text-sm font-semibold text-left transition-colors">🔑 List My Car</button>
          </div>
          <button id="emailSignupBtn" type="submit" class="btn btn-primary w-full font-semibold py-3 rounded-2xl mt-5 transition-all">Create Account</button>
        </form>
      `}
      <p class="text-[11px] text-muted text-center mt-4">Protected by Firebase Authentication • Secure Session</p>
    </div>
  </div>`;
}

function setAuthMode(m){ authMode=m; renderApp(); }
function setSignupRole(r){ signupRole=r; renderApp(); }

function authError(e){
  const code = e?.code || '';
  const messages = {
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'This email is already registered. Please log in instead.',
    'auth/weak-password': 'Password must be at least 6 characters.',
    'auth/user-not-found': 'No account was found with this email.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/user-disabled': 'This account has been disabled. Please contact support.',
    'auth/configuration-not-found': 'Firebase Authentication is not enabled. Check Firebase Console → Authentication.',
    'auth/operation-not-allowed': 'This sign-in provider is disabled in Firebase Console → Authentication → Sign-in method.',
    'auth/popup-blocked': 'Your browser blocked the sign-in popup. Allow popups for this site and try again.',
    'auth/popup-closed-by-user': 'Sign in cancelled: Google popup was closed.',
    'auth/cancelled-popup-request': 'A sign-in window is already open.',
    'auth/unauthorized-domain': 'This domain is not authorized. Add it in Firebase Console → Authentication → Settings → Authorized domains.',
    'auth/invalid-api-key': 'Invalid Firebase API Key. Please verify js/firebase-config.js.',
    'auth/network-request-failed': 'Network connection issue. Check your internet connection.'
  };

  const message = messages[code] || e?.message?.replace(/^Firebase:\s*/, '') || 'Authentication failed. Please try again.';
  pushToast(message, 'error');
}

async function doLogin(){
  if(isAuthSubmitting) return;
  if(!DN.authEnabled?.()){
    pushToast('Firebase setup required: add your apiKey in js/firebase-config.js.', 'error');
    return;
  }
  const email = document.getElementById('authEmail')?.value.trim().toLowerCase();
  const password = document.getElementById('authPassword')?.value || '';
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    pushToast('Please enter a valid email address.', 'error');
    return;
  }
  if(!password){
    pushToast('Please enter your password.', 'error');
    return;
  }

  const btn = document.getElementById('emailLoginBtn');
  const originalText = btn ? btn.innerHTML : 'Log In';
  isAuthSubmitting = true;
  if(btn){
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>Logging in…`;
  }

  try {
    await DN.signIn({ email, password });
    closeModal();
    pushToast('Logged in successfully');
    nav('#/');
  } catch(e){
    authError(e);
  } finally {
    isAuthSubmitting = false;
    if(btn){
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
}

async function doSignup(){
  if(isAuthSubmitting) return;
  if(!DN.authEnabled?.()){
    pushToast('Firebase setup required: add your apiKey in js/firebase-config.js.', 'error');
    return;
  }
  const name = document.getElementById('signupName')?.value.trim();
  const email = document.getElementById('signupEmail')?.value.trim().toLowerCase();
  const phone = document.getElementById('signupPhone')?.value.trim();
  const password = document.getElementById('signupPassword')?.value || '';

  if(!name){
    pushToast('Please enter your full name.', 'error');
    return;
  }
  if(!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)){
    pushToast('Please enter a valid email address.', 'error');
    return;
  }
  if(password.length < 6){
    pushToast('Password must be at least 6 characters.', 'error');
    return;
  }

  const btn = document.getElementById('emailSignupBtn');
  const originalText = btn ? btn.innerHTML : 'Create Account';
  isAuthSubmitting = true;
  if(btn){
    btn.disabled = true;
    btn.innerHTML = `<span class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2"></span>Creating account…`;
  }

  try {
    await DN.signUp({ name, email, phone, password, role: signupRole });
    closeModal();
    pushToast('Account created successfully');
    nav('#/');
  } catch(e){
    authError(e);
  } finally {
    isAuthSubmitting = false;
    if(btn){
      btn.disabled = false;
      btn.innerHTML = originalText;
    }
  }
}

async function doGoogleLogin(){
  if(isAuthSubmitting) return;
  if(!DN.authEnabled?.()){
    pushToast('Firebase setup required: add your apiKey in js/firebase-config.js.', 'error');
    return;
  }

  const btn = document.getElementById('googleLoginBtn');
  const textEl = document.getElementById('googleLoginText');
  const originalText = textEl ? textEl.textContent : 'Continue with Google';

  isAuthSubmitting = true;
  if(btn) btn.disabled = true;
  if(textEl) textEl.textContent = 'Connecting to Google…';

  try {
    await DN.googleSignIn();
    closeModal();
    pushToast('Logged in with Google');
    nav('#/');
  } catch(e){
    console.warn('[DriveNear] Google login error:', e);
    authError(e);
  } finally {
    isAuthSubmitting = false;
    if(btn) btn.disabled = false;
    if(textEl) textEl.textContent = originalText;
  }
}
