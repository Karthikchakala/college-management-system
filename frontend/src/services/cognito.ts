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

// SHA-256 hash for PKCE challenge
async function sha256(plain: string): Promise<ArrayBuffer> {
  const encoder = new TextEncoder();
  const data = encoder.encode(plain);
  return window.crypto.subtle.digest('SHA-256', data);
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
