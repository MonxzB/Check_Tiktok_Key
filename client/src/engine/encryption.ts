// ============================================================
// engine/encryption.ts — AES-256-GCM + PBKDF2 via Web Crypto API
// Phase 18: TikTok Channel Manager vault encryption
//
// Design:
//   - Key derivation: PBKDF2(masterPassword, salt, 100k iter, SHA-256) → AES-256-GCM key
//   - Encryption: AES-256-GCM with random 12-byte IV per operation
//   - Verification: encrypt known canary on setup; try decrypt on unlock
//   - Persistence: CryptoKey exported to JWK → sessionStorage (tab-scoped)
//   - The master password NEVER leaves the client
// ============================================================

export function isCryptoSupported(): boolean {
  return (
    typeof globalThis.crypto !== 'undefined' &&
    typeof globalThis.crypto.subtle !== 'undefined'
  );
}

// ── Buffer helpers ─────────────────────────────────────────────
function bufferToBase64(buffer: ArrayBuffer): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) binary += String.fromCharCode(bytes[i]);
  return btoa(binary);
}

function base64ToBuffer(base64: string): ArrayBuffer {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return bytes.buffer;
}

// ── Salt ──────────────────────────────────────────────────────
/** Generate a random 32-byte salt for PBKDF2 (stored in Supabase, non-secret). */
export function generateSalt(): string {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  return bufferToBase64(salt.buffer);
}

// ── Key derivation ────────────────────────────────────────────
/**
 * Derives an AES-256-GCM CryptoKey from the master password + salt.
 * 100,000 PBKDF2 iterations with SHA-256.
 * Key is marked extractable=true so it can be exported to JWK for sessionStorage.
 */
export async function deriveKey(masterPassword: string, saltBase64: string): Promise<CryptoKey> {
  const enc = new TextEncoder();
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    enc.encode(masterPassword),
    'PBKDF2',
    false,
    ['deriveKey'],
  );
  return crypto.subtle.deriveKey(
    {
      name: 'PBKDF2',
      salt: base64ToBuffer(saltBase64),
      iterations: 100_000,
      hash: 'SHA-256',
    },
    keyMaterial,
    { name: 'AES-GCM', length: 256 },
    true,              // extractable for JWK sessionStorage
    ['encrypt', 'decrypt'],
  );
}

// ── Encrypt / Decrypt ─────────────────────────────────────────
export interface EncryptResult {
  ciphertext: string;  // base64
  iv: string;          // base64
}

/** Encrypt a plaintext string. Returns base64 ciphertext + IV. */
export async function encrypt(plaintext: string, key: CryptoKey): Promise<EncryptResult> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const enc = new TextEncoder();
  const cipherBuffer = await crypto.subtle.encrypt(
    { name: 'AES-GCM', iv },
    key,
    enc.encode(plaintext),
  );
  return {
    ciphertext: bufferToBase64(cipherBuffer),
    iv: bufferToBase64(iv.buffer),
  };
}

/** Decrypt a ciphertext (base64) + iv (base64). Throws on wrong key or corrupted data. */
export async function decrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const decrypted = await crypto.subtle.decrypt(
    { name: 'AES-GCM', iv: base64ToBuffer(iv) },
    key,
    base64ToBuffer(ciphertext),
  );
  return new TextDecoder().decode(decrypted);
}

// ── Canary verifier ───────────────────────────────────────────
export const VAULT_CANARY = 'YTLF_VAULT_CANARY_V1';

/** On first setup: encrypt the canary with the derived key. Store result in DB. */
export async function createCanary(key: CryptoKey): Promise<EncryptResult> {
  return encrypt(VAULT_CANARY, key);
}

/**
 * On unlock attempt: try to decrypt the stored canary.
 * Returns true if decryption succeeds and value matches VAULT_CANARY.
 * Returns false on wrong password (decryption error or mismatch).
 */
export async function verifyCanary(
  key: CryptoKey,
  canaryCiphertext: string,
  canaryIv: string,
): Promise<boolean> {
  try {
    const result = await decrypt(canaryCiphertext, canaryIv, key);
    return result === VAULT_CANARY;
  } catch {
    return false;
  }
}

// ── JWK sessionStorage helpers ────────────────────────────────
const SESSION_KEY = 'ytlf_vault_key_jwk';

/** Serialize CryptoKey to JWK → sessionStorage (cleared on tab close). */
export async function persistKeyToSession(key: CryptoKey): Promise<void> {
  const jwk = await crypto.subtle.exportKey('jwk', key);
  sessionStorage.setItem(SESSION_KEY, JSON.stringify(jwk));
}

/** Restore CryptoKey from sessionStorage JWK. Returns null if not found. */
export async function restoreKeyFromSession(): Promise<CryptoKey | null> {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    const jwk = JSON.parse(raw) as JsonWebKey;
    return crypto.subtle.importKey(
      'jwk',
      jwk,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt'],
    );
  } catch {
    return null;
  }
}

/** Remove the key from sessionStorage (manual lock or on timeout). */
export function clearKeyFromSession(): void {
  sessionStorage.removeItem(SESSION_KEY);
}
