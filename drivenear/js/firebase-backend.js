/* DriveNear — Complete Firebase Backend Integration
   Handles Firebase Authentication (Google, Email/Password), Persistent Sessions,
   Firestore Database, and Firebase Storage.
*/

(function () {
  'use strict';

  // Read Firebase configuration
  const config = window.DRIVENEAR_FIREBASE_CONFIG || {};
  const isConfigured = !!(
    config.apiKey &&
    config.authDomain &&
    config.projectId &&
    config.appId &&
    !String(config.apiKey).startsWith('PASTE_') &&
    !String(config.projectId).startsWith('PASTE_') &&
    !String(config.appId).startsWith('PASTE_')
  );

  let auth = null;
  let db = null;
  let storage = null;

  // Track initialization state
  let authStatus = 'initializing'; // 'initializing' | 'authenticated' | 'unauthenticated' | 'error'
  let isAuthOperationInProgress = false;
  const authListeners = new Set();

  let readyResolve = null;
  const readyPromise = new Promise((resolve) => {
    readyResolve = resolve;
  });

  // Helper: clean undefined values from Firestore objects
  const cleanObject = (obj) =>
    Object.fromEntries(
      Object.entries(obj || {}).filter(([, v]) => v !== undefined)
    );

  // Helper: server timestamp
  const serverTimestamp = () => {
    if (window.firebase?.firestore?.FieldValue?.serverTimestamp) {
      return firebase.firestore.FieldValue.serverTimestamp();
    }
    return new Date();
  };

  // Helper: Current authenticated UID
  const getUid = () => {
    if (!auth?.currentUser) {
      throw new Error('Please sign in to DriveNear first.');
    }
    return auth.currentUser.uid;
  };

  // Helper: read local cached profile
  function getLocalProfile(uid) {
    if (!uid) return {};
    try {
      const raw = localStorage.getItem('dn_auth_profile_' + uid);
      return raw ? JSON.parse(raw) : {};
    } catch (_) {
      return {};
    }
  }

  // Helper: save local cached profile
  function saveLocalProfile(uid, profile) {
    if (!uid || !profile) return;
    try {
      localStorage.setItem('dn_auth_profile_' + uid, JSON.stringify(profile));
    } catch (_) {}
  }

  // Build a complete normalized user object
  function buildUserObject(firebaseUser, firestoreData = {}) {
    if (!firebaseUser) return null;
    const uid = firebaseUser.uid;
    const local = getLocalProfile(uid);

    const mergedName =
      firestoreData.name ||
      local.name ||
      firebaseUser.displayName ||
      (firebaseUser.email ? firebaseUser.email.split('@')[0] : 'User');
    const mergedEmail = firebaseUser.email || firestoreData.email || local.email || '';
    const mergedPhone =
      firestoreData.phone ||
      local.phone ||
      firebaseUser.phoneNumber ||
      '';
    const mergedPhoto =
      firestoreData.photoURL ||
      local.photoURL ||
      firebaseUser.photoURL ||
      '';
    const mergedCity = firestoreData.city || local.city || '';
    const mergedRole = firestoreData.role || local.role || 'renter';
    const mergedVerificationStatus =
      firestoreData.verificationStatus || local.verificationStatus || 'not_submitted';
    const isAdmin =
      firestoreData.role === 'admin' ||
      local.role === 'admin' ||
      firestoreData.isAdmin === true;

    return {
      id: uid,
      uid: uid,
      name: mergedName,
      email: mergedEmail,
      phone: mergedPhone,
      photoURL: mergedPhoto,
      city: mergedCity,
      role: mergedRole,
      mode: mergedRole,
      isAdmin: isAdmin,
      drivingLicence: firestoreData.drivingLicence || local.drivingLicence || '',
      verificationStatus: mergedVerificationStatus
    };
  }

  // Synchronize user profile between Firebase Auth, Firestore, and LocalStorage
  // Safe & isolated: Firestore errors never fail the authentication process.
  async function syncUserProfile(firebaseUser, extra = {}) {
    if (!firebaseUser) return null;
    const uid = firebaseUser.uid;

    let existingDoc = null;
    if (db) {
      try {
        const snap = await db.collection('users').doc(uid).get();
        if (snap.exists) existingDoc = snap.data();
      } catch (err) {
        console.warn('[DriveNear] Firestore profile read warning (safe fallback):', err.message);
      }
    }

    const userObj = buildUserObject(firebaseUser, { ...existingDoc, ...extra });
    saveLocalProfile(uid, userObj);

    // Sync to Firestore asynchronously without blocking or failing auth
    if (db) {
      try {
        const userRef = db.collection('users').doc(uid);
        const ts = serverTimestamp();
        if (!existingDoc) {
          // Document Create
          await userRef.set(
            cleanObject({
              uid: uid,
              name: userObj.name,
              email: userObj.email,
              phone: userObj.phone,
              photoURL: userObj.photoURL,
              city: userObj.city,
              role: userObj.role,
              verificationStatus: userObj.verificationStatus || 'not_submitted',
              createdAt: ts,
              updatedAt: ts
            })
          );
        } else {
          // Document Update: preserve protected fields (verificationStatus, isAdmin)
          await userRef.set(
            cleanObject({
              uid: uid,
              name: userObj.name,
              email: userObj.email,
              phone: userObj.phone,
              photoURL: userObj.photoURL,
              city: userObj.city,
              role: userObj.role,
              updatedAt: ts
            }),
            { merge: true }
          );
        }
      } catch (writeErr) {
        console.warn('[DriveNear] Firestore profile write warning (safe fallback):', writeErr.message);
      }
    }

    return userObj;
  }

  // Initialize Firebase if configured
  if (isConfigured && window.firebase?.initializeApp) {
    try {
      if (!firebase.apps.length) {
        firebase.initializeApp(config);
      }
      auth = firebase.auth();
      db = firebase.firestore();
      storage = firebase.storage();

      // Configure persistent authentication
      auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL).catch((err) => {
        console.warn('[DriveNear] Warning setting browserLocalPersistence:', err);
      });
    } catch (e) {
      console.error('[DriveNear] Firebase initialization error:', e);
      authStatus = 'error';
    }
  } else {
    console.info('[DriveNear] Running in template/unconfigured mode. Add your Firebase apiKey in js/firebase-config.js.');
  }

  // Central Auth Listener: Exactly ONE listener registered with Firebase Auth
  if (auth) {
    auth.onAuthStateChanged(
      async (firebaseUser) => {
        if (firebaseUser) {
          try {
            const userObj = await syncUserProfile(firebaseUser);
            authStatus = 'authenticated';
            if (window.state) {
              window.state.user = userObj;
              if (typeof saveUserSession === 'function') {
                saveUserSession(userObj);
              }
            }
            authListeners.forEach((cb) => {
              try { cb(userObj); } catch (e) { console.error(e); }
            });
          } catch (err) {
            console.error('[DriveNear] User sync error in onAuthStateChanged:', err);
            const fallback = buildUserObject(firebaseUser);
            authStatus = 'authenticated';
            if (window.state) {
              window.state.user = fallback;
              if (typeof saveUserSession === 'function') {
                saveUserSession(fallback);
              }
            }
            authListeners.forEach((cb) => {
              try { cb(fallback); } catch (e) { console.error(e); }
            });
          }
        } else {
          authStatus = 'unauthenticated';
          if (window.state) {
            window.state.user = null;
            if (typeof saveUserSession === 'function') {
              saveUserSession(null);
            }
          }
          authListeners.forEach((cb) => {
            try { cb(null); } catch (e) { console.error(e); }
          });
        }
        if (readyResolve) readyResolve(authStatus);
      },
      (error) => {
        console.error('[DriveNear] Firebase onAuthStateChanged error:', error);
        authStatus = 'error';
        if (readyResolve) readyResolve(authStatus);
        authListeners.forEach((cb) => {
          try { cb(null); } catch (e) { console.error(e); }
        });
      }
    );
  } else {
    // Firebase Auth not initialized (unconfigured)
    authStatus = 'unauthenticated';
    if (readyResolve) readyResolve(authStatus);
  }

  // Failure helper
  const requireBackend = (feature = 'This feature') => {
    throw new Error(
      `${feature} requires Firebase to be configured. Please add your Firebase Web App configuration in js/firebase-config.js.`
    );
  };

  // Safe row query
  async function queryRows(col, field, val) {
    if (!db) return [];
    try {
      const snap = await db.collection(col).where(field, '==', val).get();
      return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    } catch (e) {
      console.warn(`[DriveNear] Query on ${col} where ${field}==${val} failed:`, e.message);
      return [];
    }
  }

  // Upload a car photo to ImageKit (images live in ImageKit; Firestore keeps only the URLs).
  // Flow: browser -> /api/imagekit-auth (verifies Firebase login, signs) -> upload.imagekit.io
  async function uploadImage(path, data) {
    if (!auth || !auth.currentUser) throw new Error('Please sign in before uploading a car photo.');
    const ik = window.DRIVENEAR_IMAGEKIT_CONFIG || {};
    const missing = (v) => !v || String(v).startsWith('PASTE_');
    if (missing(ik.publicKey) || missing(ik.authEndpoint)) {
      throw new Error('ImageKit is not configured. Set publicKey and authEndpoint in js/firebase-config.js.');
    }

    let blob = data;
    if (typeof data === 'string' && data.startsWith('data:')) {
      const res = await fetch(data);
      blob = await res.blob();
    }
    if (!(blob instanceof Blob) || !blob.type.startsWith('image/')) {
      throw new Error('Please select a valid image file.');
    }
    if (blob.size > 10 * 1024 * 1024) {
      throw new Error('Each car photo must be 10 MB or smaller.');
    }

    // 1) Get a short-lived upload signature (server checks the Firebase ID token first).
    const idToken = await auth.currentUser.getIdToken();
    const authRes = await fetch(ik.authEndpoint, {
      method: 'GET',
      headers: { Authorization: 'Bearer ' + idToken }
    });
    if (!authRes.ok) {
      const detail = await authRes.text().catch(() => '');
      throw new Error('Image upload authorization failed (' + authRes.status + '). ' + detail.slice(0, 180));
    }
    const authParams = await authRes.json();

    // 2) Upload straight to ImageKit.
    const fileName = (String(path).split('/').pop() || 'car-photo.jpg');
    const uid = auth.currentUser.uid;
    const carFolder = String(path).split('/').slice(2, -1).join('/'); // car-listings/{uid}/{carId}/file
    const form = new FormData();
    form.append('file', blob, fileName);
    form.append('fileName', fileName);
    form.append('folder', '/drivenear/car-listings/' + uid + (carFolder ? '/' + carFolder : ''));
    form.append('publicKey', ik.publicKey);
    form.append('signature', authParams.signature);
    form.append('expire', String(authParams.expire));
    form.append('token', authParams.token);
    form.append('useUniqueFileName', 'true');

    const uploadRes = await fetch('https://upload.imagekit.io/api/v1/files/upload', {
      method: 'POST',
      body: form
    });
    const result = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok || !result.url) {
      throw new Error(result.message || 'ImageKit upload failed (' + uploadRes.status + ').');
    }
    return result.url;
  }

  // Create a car listing
  async function createCar(input) {
    if (!db) requireBackend('Car listing creation');
    const ownerId = getUid();
    const docRef = db.collection('cars').doc();
    const ts = serverTimestamp();
    await docRef.set(
      cleanObject({
        ...input,
        ownerId: ownerId,
        status: 'pending',
        verified: false,
        verificationStatus: 'pending',
        createdAt: ts,
        updatedAt: ts
      })
    );
    return docRef.id;
  }

  // Create a booking
  async function createBooking(input) {
    if (!db) requireBackend('Booking submission');
    const userId = getUid();

    // Check verification status
    let userProfile = getLocalProfile(userId);
    try {
      const snap = await db.collection('users').doc(userId).get();
      if (snap.exists) userProfile = { ...userProfile, ...snap.data() };
    } catch (_) {}

    if (userProfile.verificationStatus !== 'approved') {
      throw new Error(
        'Identity verification must be approved by DriveNear admin before booking. Please complete verification in your profile.'
      );
    }
    if (!input.carId || !input.pickupDate || !input.returnDate) {
      throw new Error('Car and booking dates are required.');
    }
    if (
      new Date(input.returnDate + 'T' + (input.returnTime || '23:59')) <=
      new Date(input.pickupDate + 'T' + (input.pickupTime || '00:00'))
    ) {
      throw new Error('Return time must be after pickup time.');
    }

    const carRef = db.collection('cars').doc(String(input.carId));
    const bookingRef = db.collection('bookings').doc();
    const ts = serverTimestamp();

    await db.runTransaction(async (tx) => {
      const carSnap = await tx.get(carRef);
      if (!carSnap.exists) throw new Error('Car listing no longer exists.');
      const car = carSnap.data();
      if (
        car.status &&
        !['approved', 'active', 'published'].includes(String(car.status).toLowerCase())
      ) {
        throw new Error('This car is not approved for booking yet.');
      }
      if (car.ownerId === userId) {
        throw new Error('You cannot book your own car listing.');
      }
      tx.set(
        bookingRef,
        cleanObject({
          ...input,
          userId: userId,
          customerId: userId,
          customerName: userProfile.name || auth.currentUser.displayName || '',
          customerEmail: auth.currentUser.email || '',
          status: 'pending',
          verificationStatus: 'approved',
          createdAt: ts,
          updatedAt: ts
        })
      );
    });

    return { id: bookingRef.id, ...input, userId: userId };
  }

  // Submit identity verification documents
  async function submitDocs({ aadhaarFile, dlFile, aadhaarLast4, dlNumber }) {
    if (!db) requireBackend('Verification document upload');
    if (!storage) throw new Error('Private verification document storage is not configured. Do not upload identity documents until private storage is enabled.');
    const userId = getUid();
    if (!aadhaarFile || !dlFile) {
      throw new Error('Upload both Aadhaar and Driving Licence files.');
    }
    if (!/^\d{4}$/.test(String(aadhaarLast4 || ''))) {
      throw new Error('Enter only the last 4 Aadhaar digits.');
    }
    if (!String(dlNumber || '').trim()) {
      throw new Error('Driving Licence number is required.');
    }

    async function putFile(file, type) {
      if (!file.type?.startsWith('image/') && file.type !== 'application/pdf') {
        throw new Error(type + ' must be an image or PDF.');
      }
      if (file.size > 8 * 1024 * 1024) {
        throw new Error(type + ' must be 8 MB or less.');
      }
      const ext =
        file.type === 'application/pdf'
          ? 'pdf'
          : (file.type.split('/')[1] || 'jpg').replace('jpeg', 'jpg');
      const path = `verification/${userId}/${type}.${ext}`;
      await storage.ref().child(path).put(file, { contentType: file.type });
      return path;
    }

    const [aPath, dPath] = await Promise.all([
      putFile(aadhaarFile, 'aadhaar'),
      putFile(dlFile, 'driving-licence')
    ]);
    const ts = serverTimestamp();

    await db.collection('verificationRequests').doc(userId).set(
      {
        userId: userId,
        aadhaarPath: aPath,
        drivingLicencePath: dPath,
        aadhaarLast4: String(aadhaarLast4),
        drivingLicenceNumber: String(dlNumber).trim(),
        status: 'pending',
        submittedAt: ts,
        updatedAt: ts,
        reviewerNote: ''
      },
      { merge: true }
    );

    // Note: users/{uid}.verificationStatus is admin-controlled (see firestore.rules).
    // The pending state lives in verificationRequests/{uid}.

    return { status: 'pending' };
  }

  /* =========================================================
     GLOBAL DN API
     ========================================================= */
  window.DN = {
    __isBackendAdapter: true,

    // Status & Readiness
    isConfigured: () => isConfigured,
    enabled: () => !!(auth && db),
    authEnabled: () => !!auth,
    authUser: () => auth?.currentUser || null,
    db: () => db,
    rtdb: () => null,
    storage: () => storage,
    get status() {
      return authStatus;
    },
    isReady: () => authStatus !== 'initializing',
    whenReady: () => readyPromise,

    // Watch Authentication state
    watchAuth: (cb) => {
      if (typeof cb !== 'function') return () => {};
      authListeners.add(cb);
      // If auth already resolved, immediately notify listener with current user
      if (authStatus !== 'initializing') {
        const currentUser = auth?.currentUser
          ? buildUserObject(auth.currentUser, getLocalProfile(auth.currentUser.uid))
          : (window.state?.user || null);
        try {
          cb(currentUser);
        } catch (e) {
          console.error(e);
        }
      }
      return () => authListeners.delete(cb);
    },

    // Sign in with Email / Password
    signIn: async ({ email, password }) => {
      if (!auth) requireBackend('Email/Password login');
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      } catch (_) {}
      const res = await auth.signInWithEmailAndPassword(email, password);
      const profile = await syncUserProfile(res.user);
      if (window.state) {
        window.state.user = profile;
        if (typeof saveUserSession === 'function') saveUserSession(profile);
      }
      return profile;
    },

    // Sign up with Email / Password
    signUp: async ({ name, email, phone, password, role }) => {
      if (!auth) requireBackend('Account creation');
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      } catch (_) {}
      const res = await auth.createUserWithEmailAndPassword(email, password);
      if (name && res.user.updateProfile) {
        try {
          await res.user.updateProfile({ displayName: name });
        } catch (_) {}
      }
      const profile = await syncUserProfile(res.user, {
        name,
        phone: phone || '',
        role: role === 'owner' ? 'owner' : 'renter'
      });
      if (window.state) {
        window.state.user = profile;
        if (typeof saveUserSession === 'function') saveUserSession(profile);
      }
      return profile;
    },

    // Google Sign-In with popup
    googleSignIn: async () => {
      if (!auth) requireBackend('Google sign-in');
      if (isAuthOperationInProgress) {
        throw new Error('A sign-in request is already in progress. Please wait.');
      }
      isAuthOperationInProgress = true;
      try {
        await auth.setPersistence(firebase.auth.Auth.Persistence.LOCAL);
      } catch (_) {}

      try {
        const provider = new firebase.auth.GoogleAuthProvider();
        provider.setCustomParameters({ prompt: 'select_account' });
        const res = await auth.signInWithPopup(provider);

        // Firestore profile synchronization is isolated:
        // Even if Firestore rules or offline network fails, auth succeeded!
        const profile = await syncUserProfile(res.user);
        if (window.state) {
          window.state.user = profile;
          if (typeof saveUserSession === 'function') saveUserSession(profile);
        }
        return profile;
      } finally {
        isAuthOperationInProgress = false;
      }
    },

    // Sign Out
    signOut: async () => {
      if (auth) {
        try {
          await auth.signOut();
        } catch (e) {
          console.warn('[DriveNear] Firebase signOut warning:', e);
        }
      }
      authStatus = 'unauthenticated';
      if (window.state) {
        window.state.user = null;
        if (typeof saveUserSession === 'function') saveUserSession(null);
      }
      localStorage.removeItem('dn_user_session');
    },

    // Data Queries
    getMyBookings: () => (db ? queryRows('bookings', 'userId', getUid()) : []),
    getMyCars: () => (db ? queryRows('cars', 'ownerId', getUid()) : []),
    getOwnerBookings: () => (db ? queryRows('bookings', 'ownerId', getUid()) : []),

    deleteCar: async (id) => {
      if (!db) requireBackend('Car listing deletion');
      const ref = db.collection('cars').doc(String(id));
      const snap = await ref.get();
      if (!snap.exists || snap.data().ownerId !== getUid()) {
        throw new Error('You can only delete your own car listings.');
      }
      return await ref.delete();
    },

    updateBookingStatus: async (id, status) => {
      if (!db) requireBackend('Booking status update');
      const ref = db.collection('bookings').doc(String(id));
      const snap = await ref.get();
      if (!snap.exists || snap.data().ownerId !== getUid()) {
        throw new Error('Only the car host can update this booking status.');
      }
      return await ref.update({ status: status, updatedAt: serverTimestamp() });
    },

    createBooking,
    createCar,
    uploadImage,

    loadPublicCarCatalog: async () => {
      if (!db) return [];
      try {
        const snap = await db
          .collection('cars')
          .where('status', 'in', ['approved', 'active', 'published'])
          .get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('[DriveNear] Public car catalog query failed:', err.message);
        throw err;
      }
    },

    loadCars: async () => {
      if (!db) return [];
      try {
        const snap = await db.collection('cars').get();
        return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      } catch (err) {
        console.warn('[DriveNear] loadCars query failed:', err.message);
        return [];
      }
    },

    uploadVerificationDocs: submitDocs,

    getVerificationStatus: async () => {
      if (!db) return { status: 'not_submitted' };
      try {
        const snap = await db.collection('verificationRequests').doc(getUid()).get();
        return snap.exists ? snap.data() : { status: 'not_submitted' };
      } catch (_) {
        return { status: 'not_submitted' };
      }
    },

    toggleFavorite: async (carId) => {
      if (!db) return [];
      const userRef = db.collection('users').doc(getUid());
      return await db.runTransaction(async (tx) => {
        const snap = await tx.get(userRef);
        const current = snap.exists ? snap.data().favorites || [] : [];
        const cid = String(carId);
        const updated = current.includes(cid)
          ? current.filter((x) => x !== cid)
          : [...current, cid];
        tx.set(userRef, { favorites: updated, updatedAt: serverTimestamp() }, { merge: true });
        return updated;
      });
    }
  };

  window.DN_FIREBASE_ENABLED = !!(auth && db);
})();
