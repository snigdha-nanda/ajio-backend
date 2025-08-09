// Authentication Module - Firebase token verification
const PROJECT_ID = process.env.FIREBASE_PROJECT_ID;

// Polyfill crypto for Node.js environment (required for Netlify Functions)
if (typeof globalThis.crypto === 'undefined') {
  const { webcrypto } = require('node:crypto');
  globalThis.crypto = webcrypto;
}

let joseModule = null;
let JWKS = null;

// Initialize JOSE library for JWT verification
async function initJose() {
  if (!joseModule) {
    joseModule = await import('jose');
    JWKS = joseModule.createRemoteJWKSet(
      new URL('https://www.googleapis.com/service_accounts/v1/jwk/securetoken@system.gserviceaccount.com')
    );
  }
  return joseModule;
}

// Verify Firebase ID token
async function verifyFirebase(idToken) {
  if (!PROJECT_ID) throw new Error('Missing FIREBASE_PROJECT_ID');
  
  const jose = await initJose();
  const { payload } = await jose.jwtVerify(idToken, JWKS, {
    issuer: `https://securetoken.google.com/${PROJECT_ID}`,
    audience: PROJECT_ID,
  });
  
  return { 
    uid: payload.sub, 
    email: payload.email || null, 
    claims: payload 
  };
}

// Get user from request headers
async function getUserFromRequest(event) {
  const headers = Object.fromEntries(
    Object.entries(event.headers || {}).map(([k, v]) => [k.toLowerCase(), v])
  );

  // Extract Bearer token from Authorization header
  const auth = headers['authorization'] || '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!token) return null;

  try {
    return await verifyFirebase(token);
  } catch (error) {
    console.error('Firebase token verification failed:', error);
    return null;
  }
}

// Require authenticated user for protected endpoints
async function requireUser(event) {
  const user = await getUserFromRequest(event);
  if (!user) {
    return {
      statusCode: 401,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
        'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
      },
      body: JSON.stringify({ error: 'Unauthorized - Please login with Firebase' }),
    };
  }
  return user;
}

module.exports = { getUserFromRequest, requireUser };
