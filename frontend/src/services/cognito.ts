/**
 * AWS Cognito OAuth 2.0 PKCE & Token Exchange Utility
 */

const COGNITO_DOMAIN = import.meta.env.VITE_COGNITO_DOMAIN || 'https://us-east-1ic9huqjjl.auth.us-east-1.amazoncognito.com';
const COGNITO_CLIENT_ID = import.meta.env.VITE_COGNITO_CLIENT_ID || '3kv2vgpkklqtlpfom2t72dn29n';

export function getCognitoRedirectUri(): string {
  if (import.meta.env.VITE_COGNITO_REDIRECT_URI) {
    return import.meta.env.VITE_COGNITO_REDIRECT_URI;
  }
  return typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000';
}

// Generate random string for PKCE verifier
function generateRandomString(length: number = 64): string {
  const possible = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789-._~';
  let text = '';
  const randomValues = new Uint8Array(length);
  window.crypto.getRandomValues(randomValues);
  for (let i = 0; i < length; i++) {
    text += possible[randomValues[i] % possible.length];
  }
  return text;
}

// Base64URL encode buffer
function base64UrlEncode(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary)
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

/**
 * Safely decodes and parses the payload of a JWT without external libraries
 */
export function decodeJwtPayload(token: string): any {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const base64Url = parts[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      window
        .atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (err) {
    console.warn('[Cognito Auth] Failed to decode JWT payload:', err);
    return null;
  }
}

function rightRotate(value: number, amount: number): number {
  return (value >>> amount) | (value << (32 - amount));
}

function sha256Sync(ascii: string): ArrayBuffer {
  const k = [
    0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
    0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
    0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
    0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
    0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
    0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
    0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
    0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2,
  ];

  const hash = [
    0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a,
    0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19,
  ];

  const words: number[] = [];
  const asciiBitLength = ascii.length * 8;

  for (let i = 0; i < ascii.length; i++) {
    words[i >> 2] |= ascii.charCodeAt(i) << (24 - (i % 4) * 8);
  }

  words[asciiBitLength >> 5] |= 0x80 << (24 - (asciiBitLength % 32));
  words[(((asciiBitLength + 64) >> 9) << 4) + 15] = asciiBitLength;

  for (let j = 0; j < words.length; j += 16) {
    const w = words.slice(j, j + 16);
    while (w.length < 16) w.push(0);
    const oldHash = hash.slice(0);

    for (let i = 0; i < 64; i++) {
      if (i >= 16) {
        const w15 = w[i - 15];
        const w2 = w[i - 2];
        const s0 = rightRotate(w15, 7) ^ rightRotate(w15, 18) ^ (w15 >>> 3);
        const s1 = rightRotate(w2, 17) ^ rightRotate(w2, 19) ^ (w2 >>> 10);
        w[i] = ((w[i - 16] || 0) + s0 + (w[i - 7] || 0) + s1) | 0;
      }

      const s1_hash = rightRotate(hash[4], 6) ^ rightRotate(hash[4], 11) ^ rightRotate(hash[4], 25);
      const ch = (hash[4] & hash[5]) ^ (~hash[4] & hash[6]);
      const temp1 = (hash[7] + s1_hash + ch + k[i] + (w[i] || 0)) | 0;
      const s0_hash = rightRotate(hash[0], 2) ^ rightRotate(hash[0], 13) ^ rightRotate(hash[0], 22);
      const maj = (hash[0] & hash[1]) ^ (hash[0] & hash[2]) ^ (hash[1] & hash[2]);
      const temp2 = (s0_hash + maj) | 0;

      hash[7] = hash[6];
      hash[6] = hash[5];
      hash[5] = hash[4];
      hash[4] = (hash[3] + temp1) | 0;
      hash[3] = hash[2];
      hash[2] = hash[1];
      hash[1] = hash[0];
      hash[0] = (temp1 + temp2) | 0;
    }

    for (let i = 0; i < 8; i++) {
      hash[i] = (hash[i] + oldHash[i]) | 0;
    }
  }

  const buffer = new ArrayBuffer(32);
  const dataView = new DataView(buffer);
  for (let i = 0; i < 8; i++) {
    dataView.setUint32(i * 4, hash[i] >>> 0);
  }
  return buffer;
}

// SHA-256 hash for PKCE challenge (uses Web Crypto if available, with sync fallback for non-secure HTTP contexts)
async function sha256(plain: string): Promise<ArrayBuffer> {
  if (typeof window !== 'undefined' && window.crypto && window.crypto.subtle && typeof window.crypto.subtle.digest === 'function') {
    try {
      const encoder = new TextEncoder();
      const data = encoder.encode(plain);
      return await window.crypto.subtle.digest('SHA-256', data);
    } catch (_) {
      return sha256Sync(plain);
    }
  }
  return sha256Sync(plain);
}

export interface CognitoTokens {
  access_token: string;
  id_token: string;
  refresh_token?: string;
  expires_in: number;
  token_type: string;
}

/**
 * Builds the Authorization URL with PKCE (response_type=code, scope=email openid)
 */
export async function buildCognitoLoginUrl(): Promise<string> {
  const redirectUri = getCognitoRedirectUri();

  // PKCE Generation
  const codeVerifier = generateRandomString(64);
  sessionStorage.setItem('cognito_code_verifier', codeVerifier);
  localStorage.setItem('cognito_code_verifier_fallback', codeVerifier);

  const hashed = await sha256(codeVerifier);
  const codeChallenge = base64UrlEncode(hashed);

  console.info('[Cognito Auth] Generating PKCE login URL with redirect URI:', redirectUri);

  const params = new URLSearchParams({
    client_id: COGNITO_CLIENT_ID,
    response_type: 'code',
    scope: 'email openid',
    redirect_uri: redirectUri,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
  });

  return `${COGNITO_DOMAIN}/login?${params.toString()}`;
}

/**
 * Exchanges authorization code for Cognito tokens at /oauth2/token
 */
export async function exchangeCodeForTokens(code: string): Promise<CognitoTokens> {
  const redirectUri = getCognitoRedirectUri();
  const codeVerifier = sessionStorage.getItem('cognito_code_verifier') || localStorage.getItem('cognito_code_verifier_fallback') || '';

  console.info('[Cognito Auth] Exchanging authorization code at token endpoint with redirect URI:', redirectUri);

  const bodyParams = new URLSearchParams({
    grant_type: 'authorization_code',
    client_id: COGNITO_CLIENT_ID,
    code,
    redirect_uri: redirectUri,
  });

  if (codeVerifier) {
    bodyParams.append('code_verifier', codeVerifier);
  }

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let parsedError = errorText;
    try {
      const json = JSON.parse(errorText);
      parsedError = json.error_description || json.error || errorText;
    } catch (_) {}
    console.error('[Cognito Auth] Token exchange failed HTTP status:', response.status, 'Error:', parsedError);
    throw new Error(`Cognito token exchange failed (${response.status}): ${parsedError}`);
  }

  // Clear verifier after successful exchange
  sessionStorage.removeItem('cognito_code_verifier');
  localStorage.removeItem('cognito_code_verifier_fallback');

  const tokens: CognitoTokens = await response.json();
  console.info('[Cognito Auth] Token exchange succeeded successfully. Received tokens.');
  return tokens;
}

/**
 * Refreshes an expired access token using the refresh_token
 */
export async function refreshCognitoSession(refreshToken: string): Promise<CognitoTokens> {
  const bodyParams = new URLSearchParams({
    grant_type: 'refresh_token',
    client_id: COGNITO_CLIENT_ID,
    refresh_token: refreshToken,
  });

  const response = await fetch(`${COGNITO_DOMAIN}/oauth2/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: bodyParams.toString(),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh Cognito token');
  }

  const tokens: CognitoTokens = await response.json();
  return tokens;
}
