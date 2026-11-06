/* DriveNear Firebase Web App configuration.
   Project details prefilled from your Firebase Console screenshot.
   Paste the full apiKey copied from Firebase Console below before running.
*/
window.DRIVENEAR_FIREBASE_CONFIG = {
  apiKey: "AIzaSyA6gWCOb64S8oBY1SD0QLOsFQXuGi4qaXs",
  authDomain: "drivenear-a7fd6.firebaseapp.com",
  projectId: "drivenear-a7fd6",
  storageBucket: "drivenear-a7fd6.firebasestorage.app",
  messagingSenderId: "386029555867",
  appId: "1:386029555867:web:b622ec605ec35e45d8b63e",
  measurementId: "G-NB7071EGG0"
};

/* ImageKit (car photos). Images are stored in ImageKit; Firestore keeps only the image URLs.
   publicKey:    ImageKit Dashboard -> Developer options -> API keys -> Public key
   authEndpoint: your signing endpoint (the /api/imagekit-auth function in this project).
                 If the site is hosted on Vercel, "/api/imagekit-auth" works as-is.
                 If the site is hosted elsewhere, use the full URL, e.g.
                 "https://your-project.vercel.app/api/imagekit-auth"
   urlEndpoint:  your ImageKit URL endpoint (informational)
   NEVER put the ImageKit private key in this file. */
window.DRIVENEAR_IMAGEKIT_CONFIG = {
  publicKey: "public_+DPicRdXeBmMxLtuCLe0+y62tsM=",
  authEndpoint: "/api/imagekit-auth",
  urlEndpoint: "https://ik.imagekit.io/jairam1"
};
