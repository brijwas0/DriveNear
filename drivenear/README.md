# DriveNear — Car Rental Marketplace (Firebase Connected)

DriveNear is a peer-to-peer car rental marketplace frontend built with vanilla HTML, modern JavaScript, Tailwind CSS, Leaflet/OpenStreetMap, and full Firebase integration (Firebase Authentication with Google and Email/Password, Cloud Firestore, and Firebase Storage).

---

## 1. Quick Start (Run Locally on Windows)

Firebase Google Login requires running from an HTTP server (`http://localhost` or `http://127.0.0.1`), because browsers block OAuth popup redirects when run directly from a `file://` URL.

### Option A: Double-Click Local Server Launcher
Double-click `START_LOCAL_TEST.bat` in the project root. This starts a lightweight web server on port 8000 and automatically opens your browser at:
```text
http://localhost:8000
```

### Option B: Windows CMD / PowerShell Command
Open CMD or PowerShell in the `drivenear` folder and run:
```cmd
python -m http.server 8000
```
Then visit [http://localhost:8000](http://localhost:8000) in your web browser.

---

## 2. Firebase Configuration (One Step)

Open `js/firebase-config.js`. The project parameters for your project (`drivenear-a7fd6`) are already prefilled:

```javascript
window.DRIVENEAR_FIREBASE_CONFIG = {
  apiKey: "PASTE_FULL_FIREBASE_API_KEY_HERE", // <-- Paste your Firebase Web API key here
  authDomain: "drivenear-a7fd6.firebaseapp.com",
  projectId: "drivenear-a7fd6",
  storageBucket: "drivenear-a7fd6.firebasestorage.app",
  messagingSenderId: "386029558687",
  appId: "1:386029558687:web:b6226c605ec35e45d8b63e",
  measurementId: "G-NB7071EGG0"
};
```

### Where to get your API Key in Firebase Console:
1. Open the [Firebase Console](https://console.firebase.google.com/) and click your project **`drivenear-a7fd6`**.
2. Click the gear icon ⚙️ next to **Project Overview** → **Project settings**.
3. Under the **General** tab, scroll down to **Your apps** and select your Web App.
4. Copy the `apiKey` string and paste it into `js/firebase-config.js` replacing `PASTE_FULL_FIREBASE_API_KEY_HERE`.

---

## 3. Firebase Console Checklist

Before signing in with Google or Email:

### 1. Enable Authentication Providers
- In Firebase Console, go to **Build → Authentication → Sign-in method**.
- Enable **Google**:
  - Click Google → Toggle **Enable**.
  - Set the project support email and click **Save**.
- Enable **Email/Password**:
  - Click Email/Password → Toggle **Enable** and click **Save**.

### 2. Verify Authorized Domains
- In Firebase Console, go to **Build → Authentication → Settings → Authorized domains**.
- Ensure the following are listed:
  - `localhost`
  - `127.0.0.1`
  - `drivenear-a7fd6.firebaseapp.com`
  - Your custom domain (when deploying to production)

### 3. Deploy Firestore & Storage Security Rules
- Go to **Build → Firestore Database → Rules** and publish the contents of `firebase/firestore.rules`.
- Go to **Build → Storage → Rules** and publish the contents of `firebase/storage.rules`.

---

## 4. Key Architectural Fixes Delivered

1. **Fixed Google Login & Popup Flow**:
   - Resolved the race condition between Google Authentication and Firestore profile creation.
   - Profile creation is now decoupled and non-fatal: if Firestore rules or initial database provisioning are pending, Google Auth still succeeds smoothly without throwing a false "Authentication failed" toast.
   - Added visual loading indicators (`Connecting to Google…`) and button disabled states to prevent double popup requests.
   - Automatically closes the auth modal, displays a success toast, and refreshes the navbar with the user's name and avatar.

2. **Full Login Persistence (`browserLocalPersistence`)**:
   - Enabled `firebase.auth.Auth.Persistence.LOCAL` on initialization and before sign-in.
   - Synchronized session state with durable storage (`dn_user_session`), preventing the navbar and user profile from flickering or logging the user out on page refresh.

3. **Central Authentication State Management**:
   - Single central listener registered on `auth.onAuthStateChanged`, eliminating duplicate listeners and duplicate database queries.
   - Clean state lifecycle: `initializing` → `authenticated` / `unauthenticated` / `error`.
   - `DN.whenReady()` Promise ensures wizard flows like "List Your Car" can safely wait for session restoration before verifying credentials.

4. **List Your Car Autofill Integration**:
   - When a logged-in user visits **List Your Car** (`#/list-your-car`), Step 1 automatically autofills:
     - Full Name (from Google account or user profile)
     - Email Address (from Firebase Authentication)
     - Mobile Number (from saved profile)
     - Profile Avatar (loaded from account photo or Google profile)
     - City (from saved profile)
   - Preserves any field the user has already typed manually.
   - Preserves login-required checks before publishing.

5. **Harmonized Backend and Frontend-Only Adapters**:
   - Added guard in `frontend-only.js` preventing it from overriding `window.DN`.
   - Script execution order in `index.html` re-ordered so Firebase SDK and `firebase-backend.js` initialize before all UI components and page modules.

---

## 5. Security & Verification

- **Identity Verification**:
  Users can upload their Aadhaar and Driving Licence on `verification.html`. Files are stored under `verification/{uid}/` restricted by Firebase Storage rules, and submitted to `verificationRequests/{uid}` for manual administrator review.
- **Role Security**:
  Firestore rules permit users to choose `'renter'` or `'owner'` role, but prevent regular users from elevating themselves to `'admin'` or modifying `verificationStatus` directly.
- **Admin Access**:
  Create the initial admin user by setting `users/{uid}.role = "admin"` directly in the Firebase Console. Never store admin credentials in client-side code.

---

## 4. Before going live
- Deploy `firebase/firestore.rules` and `firebase/storage.rules` (Firebase Console → Rules, or `firebase deploy --only firestore:rules,storage`).
- Add your hosting domain under Authentication → Settings → Authorized domains (Google sign-in fails otherwise).
- Car photos are stored in ImageKit only (see section 5). Firebase Storage is used only for private Aadhaar / Driving Licence documents.
- Identity verification status (`users/{uid}.verificationStatus`) is changed only by an admin; users submit documents via `verification.html`.
- Tailwind is loaded from the CDN for development; build a static CSS file for production.

## 5. ImageKit for car photos (text in Firebase, images in ImageKit)
Car photos go browser -> ImageKit. Only the image URLs are saved in Firestore (`cars/{id}.image` and `.gallery`).
ImageKit needs a signature made with your **private key**, so a tiny server function signs uploads (`api/imagekit-auth.js`). It first verifies the user is logged in with Firebase. No Cloudflare is used.

1. ImageKit Dashboard -> Developer options: copy the **Public key** and **Private key**.
2. Put the Public key in `js/firebase-config.js` (`publicKey`).
3. Deploy this folder to Vercel (free): `npx vercel` (or import the GitHub repo at vercel.com).
4. In Vercel -> Project -> Settings -> Environment Variables add:
   - `IMAGEKIT_PRIVATE_KEY` = your ImageKit private key
   - `FIREBASE_PROJECT_ID` = `drivenear-a7fd6`
   - `ALLOWED_ORIGIN` = your site URL (e.g. `https://drivenear.vercel.app`)
   Then redeploy.
5. If the website is hosted on Vercel, keep `authEndpoint: "/api/imagekit-auth"`. If it is hosted elsewhere, set the full URL of the function.
6. Add your site domain in ImageKit only if you restrict allowed origins there.

Local testing: run `npx vercel dev` (instead of `python -m http.server`) so `/api/imagekit-auth` works on localhost.
