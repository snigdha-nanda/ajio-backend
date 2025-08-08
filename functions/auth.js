// functions/auth.js
const { createRemoteJWKSet, jwtVerify } = require('jose');

const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;
const DEV_API_KEY = process.env.DEV_API_KEY;
const ALLOW_DEV = process.env.ALLOW_DEV_AUTH === 'true';

// Google's JWKS for Firebase ID tokens
const JWKS = createRemoteJWKSet(
  new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
);

async function verifyFirebase(idToken) {
  if (!PROJECT_ID) throw new Error('Missing FIREBASE_PROJECT_ID');
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });
  return { uid: payload.sub, email: payload.email || null, claims: payload };
}

async function getUserFromRequest(event) {
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );

  // 1) Dev-key path (for now)
  if (ALLOW_DEV && headers['x-dev-key'] && DEV_API_KEY && headers['x-dev-key'] === DEV_API_KEY) {
    const uid = headers['x-user-id'] || 'dev-user';
    return { uid, dev: true };
  }

  // 2) Firebase path (for later UI)
  const auth = headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  try {
    return await verifyFirebase(token);
  } catch {
    return null;
  }
}

async function requireUser(event) {
  const user = await getUserFromRequest(event);
  if (!user) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Dev-Key, X-User-Id',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({ error: 'Unauthorized' }),
    };
  }
  return user;
}

module.exports = { getUserFromRequest, requireUser };
