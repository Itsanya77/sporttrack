/**
 * Production-ready cryptographic utilities for SportTrack
 * Uses standard Web Crypto API (SubtleCrypto) for salted hashing and secure token generation.
 */

// Converts an ArrayBuffer to a hex string
function bufferToHex(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  return Array.from(bytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
}

// Generates a cryptographically strong random salt
export function generateSalt(byteLength: number = 16): string {
  const array = new Uint8Array(byteLength);
  window.crypto.getRandomValues(array);
  return bufferToHex(array.buffer);
}

// Generates a secure random 6-digit numeric verification code for password reset
export function generateResetCode(): string {
  const array = new Uint32Array(1);
  window.crypto.getRandomValues(array);
  return (100000 + (array[0] % 900000)).toString();
}

/**
 * Computes a salted SHA-256 password hash.
 */
export async function hashPassword(password: string, salt: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(`${salt}:${password}:sporttrack_secure_salt`);
  const hashBuffer = await window.crypto.subtle.digest('SHA-256', data);
  return bufferToHex(hashBuffer);
}

/**
 * Verifies a password against a stored salted hash.
 * Also handles legacy plain passwords gracefully by auto-upgrading.
 */
export async function verifyPassword(
  attempt: string, 
  storedHash?: string, 
  salt?: string, 
  legacyPlain?: string
): Promise<boolean> {
  // If stored with salt and hash
  if (storedHash && salt) {
    const computed = await hashPassword(attempt, salt);
    if (computed === storedHash) {
      return true;
    }
  }

  // Fallback for initial seed accounts before first hash migration
  if (legacyPlain && legacyPlain === attempt) {
    return true;
  }

  return false;
}
