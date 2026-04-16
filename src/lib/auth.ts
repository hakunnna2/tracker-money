/**
 * Authentication utilities for PIN and biometric authentication
 */

const AUTH_KEYS = {
  PIN_HASH: 'copilot_pin_hash',
  AUTH_TOKEN: 'copilot_auth_token',
  BIOMETRIC_ENABLED: 'copilot_biometric_enabled',
  BIOMETRIC_CREDENTIAL_ID: 'copilot_biometric_credential_id',
};

function bufferToBase64Url(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  bytes.forEach((byte) => {
    binary += String.fromCharCode(byte);
  });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64UrlToBuffer(value: string): Uint8Array {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  const binary = atob(padded);
  const bytes = new Uint8Array(binary.length);
  for (let index = 0; index < binary.length; index += 1) {
    bytes[index] = binary.charCodeAt(index);
  }
  return bytes;
}

/**
 * Simple SHA256 hash (for demo purposes)
 * In production, use a proper library like crypto-js
 */
async function hashPIN(pin: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(pin);
  const hashBuffer = await crypto.subtle.digest('SHA-256', data);
  const hashArray = Array.from(new Uint8Array(hashBuffer));
  return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Set up initial PIN
 */
export async function setupPIN(pin: string): Promise<boolean> {
  if (pin.length < 4) {
    throw new Error('PIN must be at least 4 digits');
  }
  const hash = await hashPIN(pin);
  localStorage.setItem(AUTH_KEYS.PIN_HASH, hash);
  return true;
}

/**
 * Verify PIN
 */
export async function verifyPIN(pin: string): Promise<boolean> {
  const storedHash = localStorage.getItem(AUTH_KEYS.PIN_HASH);
  if (!storedHash) {
    throw new Error('No PIN set up');
  }
  const hash = await hashPIN(pin);
  return hash === storedHash;
}

/**
 * Check if PIN is set up
 */
export function isPINSetup(): boolean {
  return !!localStorage.getItem(AUTH_KEYS.PIN_HASH);
}

/**
 * Check if biometric is available
 */
export async function isBiometricAvailable(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }
  try {
    const available = await PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
    return available;
  } catch {
    return false;
  }
}

/**
 * Enable biometric authentication
 */
export function enableBiometric(): void {
  localStorage.setItem(AUTH_KEYS.BIOMETRIC_ENABLED, 'true');
}

/**
 * Check if biometric is enabled
 */
export function isBiometricEnabled(): boolean {
  return localStorage.getItem(AUTH_KEYS.BIOMETRIC_ENABLED) === 'true';
}

/**
 * Disable biometric authentication
 */
export function disableBiometric(): void {
  localStorage.removeItem(AUTH_KEYS.BIOMETRIC_ENABLED);
  localStorage.removeItem(AUTH_KEYS.BIOMETRIC_CREDENTIAL_ID);
}

export async function registerBiometricCredential(): Promise<boolean> {
  if (!window.PublicKeyCredential) {
    return false;
  }

  try {
    const challenge = crypto.getRandomValues(new Uint8Array(32));
    const userId = crypto.getRandomValues(new Uint8Array(16));

    const credential = (await navigator.credentials.create({
      publicKey: {
        challenge,
        rp: {
          name: 'Smart Financial Copilot',
          id: window.location.hostname,
        },
        user: {
          id: userId,
          name: 'user@copilot.local',
          displayName: 'Copilot User',
        },
        pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
        authenticatorSelection: {
          authenticatorAttachment: 'platform',
          userVerification: 'required',
        },
        attestation: 'none',
        timeout: 60000,
      } as PublicKeyCredentialCreationOptions,
    })) as PublicKeyCredential | null;

    if (!credential) {
      return false;
    }

    localStorage.setItem(AUTH_KEYS.BIOMETRIC_CREDENTIAL_ID, bufferToBase64Url(credential.rawId));
    enableBiometric();
    return true;
  } catch (error) {
    console.error('Biometric registration failed:', error);
    return false;
  }
}

/**
 * Authenticate with biometric
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  if (!isBiometricEnabled()) {
    return false;
  }

  try {
    const credentialId = localStorage.getItem(AUTH_KEYS.BIOMETRIC_CREDENTIAL_ID);
    if (!credentialId) {
      return false;
    }

    const assertion = (await navigator.credentials.get({
      publicKey: {
        challenge: crypto.getRandomValues(new Uint8Array(32)),
        allowCredentials: [
          {
            id: base64UrlToBuffer(credentialId),
            type: 'public-key',
            transports: ['internal'],
          },
        ],
        userVerification: 'required',
        timeout: 60000,
      } as PublicKeyCredentialRequestOptions,
    })) as PublicKeyCredential | null;

    return !!assertion;
  } catch (error) {
    console.error('Biometric authentication failed:', error);
    return false;
  }
}

/**
 * Set authentication session
 */
export function setAuthToken(): void {
  const token = Math.random().toString(36).substring(7);
  localStorage.setItem(AUTH_KEYS.AUTH_TOKEN, token);
}

/**
 * Clear authentication session
 */
export function clearAuthToken(): void {
  localStorage.removeItem(AUTH_KEYS.AUTH_TOKEN);
}

/**
 * Check if user is authenticated
 */
export function isAuthenticated(): boolean {
  return !!localStorage.getItem(AUTH_KEYS.AUTH_TOKEN);
}

/**
 * Reset authentication (logout)
 */
export function logout(): void {
  clearAuthToken();
}

export function clearAllAuthData(): void {
  localStorage.removeItem(AUTH_KEYS.PIN_HASH);
  localStorage.removeItem(AUTH_KEYS.AUTH_TOKEN);
  localStorage.removeItem(AUTH_KEYS.BIOMETRIC_ENABLED);
  localStorage.removeItem(AUTH_KEYS.BIOMETRIC_CREDENTIAL_ID);
}
