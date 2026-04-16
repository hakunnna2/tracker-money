/**
 * Authentication utilities for PIN and biometric authentication
 */

const AUTH_KEYS = {
  PIN_HASH: 'copilot_pin_hash',
  AUTH_TOKEN: 'copilot_auth_token',
  BIOMETRIC_ENABLED: 'copilot_biometric_enabled',
};

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
}

/**
 * Authenticate with biometric
 */
export async function authenticateWithBiometric(): Promise<boolean> {
  if (!isBiometricEnabled()) {
    return false;
  }

  try {
    // Get stored credential ID (this is a simplified version)
    const credentialId = localStorage.getItem('copilot_credential_id');
    if (!credentialId) {
      // First time setup - generate credential
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      
      const credential = await navigator.credentials.create({
        publicKey: {
          challenge: challenge,
          rp: {
            name: 'Smart Financial Copilot',
            id: window.location.hostname,
          },
          user: {
            id: new Uint8Array(16),
            name: 'user@copilot.local',
            displayName: 'Copilot User',
          },
          pubKeyCredParams: [{ alg: -7, type: 'public-key' }],
          attestation: 'none',
          authenticatorSelection: {
            authenticatorAttachment: 'platform',
            userVerification: 'required',
          },
        } as PublicKeyCredentialCreationOptions,
      }) as PublicKeyCredential | null;

      if (credential) {
        localStorage.setItem('copilot_credential_id', credential.id);
        return true;
      }
    } else {
      // Authenticate with existing credential
      const challenge = crypto.getRandomValues(new Uint8Array(32));
      const assertion = await navigator.credentials.get({
        publicKey: {
          challenge: challenge,
          allowCredentials: [
            {
              id: Uint8Array.from(atob(credentialId), c => c.charCodeAt(0)),
              type: 'public-key',
              transports: ['internal'],
            },
          ],
          userVerification: 'required',
        } as PublicKeyCredentialRequestOptions,
      }) as PublicKeyCredential | null;

      return !!assertion;
    }
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
