/* DriveNear — ImageKit upload-signing endpoint (Vercel serverless function, Node 18+)
   - Checks the caller's Firebase ID token (only signed-in users can upload)
   - Returns { token, expire, signature } for ImageKit client-side upload
   Environment variables (Vercel -> Project -> Settings -> Environment Variables):
     IMAGEKIT_PRIVATE_KEY   your ImageKit PRIVATE key (never put it in website code)
     FIREBASE_PROJECT_ID    drivenear-a7fd6
     ALLOWED_ORIGIN         e.g. https://your-site.vercel.app  (use * only while testing)
*/
const crypto = require('crypto');

const JWKS_URL = 'https://www.googleapis.com/robot/v1/metadata/jwk/securetoken@system.gserviceaccount.com';
let jwksCache = { keys: null, at: 0 };

const b64urlToBuf = (s) => Buffer.from(s.replace(/-/g, '+').replace(/_/g, '/'), 'base64');
const b64urlToJson = (s) => JSON.parse(b64urlToBuf(s).toString('utf8'));

async function getJwks() {
  if (jwksCache.keys && Date.now() - jwksCache.at < 3600 * 1000) return jwksCache.keys;
  const res = await fetch(JWKS_URL);
  const body = await res.json();
  jwksCache = { keys: body.keys || [], at: Date.now() };
  return jwksCache.keys;
}

async function verifyFirebaseToken(idToken, projectId) {
  const parts = String(idToken || '').split('.');
  if (parts.length !== 3) throw new Error('Malformed token');
  const header = b64urlToJson(parts[0]);
  const payload = b64urlToJson(parts[1]);
  if (header.alg !== 'RS256' || !header.kid) throw new Error('Bad token header');

  const jwk = (await getJwks()).find((k) => k.kid === header.kid);
  if (!jwk) throw new Error('Unknown signing key');
  const publicKey = crypto.createPublicKey({ key: jwk, format: 'jwk' });
  const ok = crypto.verify('RSA-SHA256', Buffer.from(parts[0] + '.' + parts[1]), publicKey, b64urlToBuf(parts[2]));
  if (!ok) throw new Error('Bad signature');

  const now = Math.floor(Date.now() / 1000);
  if (payload.aud !== projectId) throw new Error('Wrong audience');
  if (payload.iss !== 'https://securetoken.google.com/' + projectId) throw new Error('Wrong issuer');
  if (!payload.sub) throw new Error('No subject');
  if (payload.exp <= now) throw new Error('Token expired');
  if (payload.iat > now + 300) throw new Error('Token issued in the future');
  return payload;
}

module.exports = async (req, res) => {
  res.setHeader('Access-Control-Allow-Origin', process.env.ALLOWED_ORIGIN || '*');
  res.setHeader('Access-Control-Allow-Headers', 'Authorization, Content-Type');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Vary', 'Origin');
  res.setHeader('Cache-Control', 'no-store');

  if (req.method === 'OPTIONS') return res.status(204).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'Method not allowed' });

  const privateKey = process.env.IMAGEKIT_PRIVATE_KEY;
  const projectId = process.env.FIREBASE_PROJECT_ID;
  if (!privateKey || !projectId) return res.status(500).json({ error: 'Server not configured' });

  try {
    const auth = req.headers.authorization || '';
    if (!auth.startsWith('Bearer ')) return res.status(401).json({ error: 'Missing token' });
    await verifyFirebaseToken(auth.slice(7), projectId);
  } catch (e) {
    return res.status(401).json({ error: 'Unauthorized: ' + e.message });
  }

  const token = crypto.randomUUID();
  const expire = Math.floor(Date.now() / 1000) + 30 * 60; // must be < 1 hour
  const signature = crypto.createHmac('sha1', privateKey).update(token + expire).digest('hex');
  return res.status(200).json({ token, expire, signature });
};
