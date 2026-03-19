/**
 * CryptoService — all cryptographic operations for Sirr.
 *
 * Key exchange model:
 *   - On signup: X25519 keypair (TweetNaCl box). Public key stored; private key stays local.
 *   - DM shared secret: ECDH(myPrivate, theirPublic) → SHA-256 → AES-GCM key
 *   - Group key: random AES-256-GCM key encrypted per member with their ECDH shared secret
 *
 * Message encryption: AES-256-GCM (AEAD)
 * Sender auth:        HMAC-SHA-256 over (conversationId:messageId:ciphertext)
 */

import nacl from 'tweetnacl';
import { encodeBase64, decodeBase64 } from 'tweetnacl-util';

// ─── Encoding ─────────────────────────────────────────────────────────────────

export const toBase64 = (b: Uint8Array) => encodeBase64(b);
export const fromBase64 = (s: string) => decodeBase64(s);

export function toHex(bytes: Uint8Array): string {
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

export function fromHex(hex: string): Uint8Array {
  const pairs = hex.match(/.{1,2}/g);
  if (!pairs) throw new Error('Invalid hex');
  return new Uint8Array(pairs.map(b => parseInt(b, 16)));
}

// ─── PBKDF2 ───────────────────────────────────────────────────────────────────

export async function deriveKeyFromPassword(password: string, salt: Uint8Array): Promise<CryptoKey> {
  const km = await crypto.subtle.importKey('raw', new TextEncoder().encode(password), 'PBKDF2', false, ['deriveKey']);
  return crypto.subtle.deriveKey(
    { name: 'PBKDF2', salt: salt.buffer as ArrayBuffer, iterations: 600_000, hash: 'SHA-256' },
    km,
    { name: 'AES-GCM', length: 256 },
    false, ['encrypt', 'decrypt']
  );
}

// ─── AES-256-GCM ──────────────────────────────────────────────────────────────

export async function aesEncrypt(plaintext: string, key: CryptoKey): Promise<{ ciphertext: string; iv: string }> {
  const iv = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plaintext));
  return { ciphertext: toHex(new Uint8Array(encrypted)), iv: toHex(iv) };
}

export async function aesDecrypt(ciphertext: string, iv: string, key: CryptoKey): Promise<string> {
  const buf = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: fromHex(iv) }, key, fromHex(ciphertext));
  return new TextDecoder().decode(buf);
}

export async function generateAesKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
}

export async function exportAesKey(key: CryptoKey): Promise<string> {
  return toHex(new Uint8Array(await crypto.subtle.exportKey('raw', key)));
}

export async function importAesKey(hex: string): Promise<CryptoKey> {
  return crypto.subtle.importKey('raw', fromHex(hex), { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

// ─── HMAC-SHA-256 sender authentication ──────────────────────────────────────
//
// Signs: conversationId:messageId:ciphertext
// Verifies the sender holds our shared ECDH secret — catches impersonation even in groups.

export async function deriveHmacKey(aesKey: CryptoKey): Promise<CryptoKey> {
  const raw = await crypto.subtle.exportKey('raw', aesKey);
  return crypto.subtle.importKey('raw', raw, { name: 'HMAC', hash: 'SHA-256' }, false, ['sign', 'verify']);
}

export async function hmacSign(
  hmacKey: CryptoKey,
  conversationId: string,
  messageId: string,
  ciphertext: string
): Promise<string> {
  const data = new TextEncoder().encode(`${conversationId}:${messageId}:${ciphertext}`);
  return toHex(new Uint8Array(await crypto.subtle.sign('HMAC', hmacKey, data)));
}

export async function hmacVerify(
  hmacKey: CryptoKey,
  conversationId: string,
  messageId: string,
  ciphertext: string,
  signature: string
): Promise<boolean> {
  try {
    const data = new TextEncoder().encode(`${conversationId}:${messageId}:${ciphertext}`);
    return crypto.subtle.verify('HMAC', hmacKey, fromHex(signature), data);
  } catch { return false; }
}

// ─── X25519 ECDH ──────────────────────────────────────────────────────────────

export function generateKeyPair(): { publicKey: Uint8Array; privateKey: Uint8Array } {
  return nacl.box.keyPair();
}

export async function deriveSharedKey(myPrivateKey: Uint8Array, theirPublicKey: Uint8Array): Promise<CryptoKey> {
  const secret = nacl.box.before(theirPublicKey, myPrivateKey);
  const hashed = await crypto.subtle.digest('SHA-256', secret);
  return crypto.subtle.importKey('raw', hashed, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt']);
}

// ─── Private key storage ──────────────────────────────────────────────────────

const PK  = 'sirr-pk-';
const PKS = 'sirr-pks-';

export async function storePrivateKey(userId: string, privateKey: Uint8Array, password: string): Promise<void> {
  const salt = crypto.getRandomValues(new Uint8Array(32));
  const wk   = await deriveKeyFromPassword(password, salt);
  const { ciphertext, iv } = await aesEncrypt(toBase64(privateKey), wk);
  localStorage.setItem(PKS + userId, toHex(salt));
  localStorage.setItem(PK  + userId, JSON.stringify({ ciphertext, iv }));
}

export async function loadPrivateKey(userId: string, password: string): Promise<Uint8Array | null> {
  try {
    const saltHex = localStorage.getItem(PKS + userId);
    const stored  = localStorage.getItem(PK  + userId);
    if (!saltHex || !stored) return null;
    const { ciphertext, iv } = JSON.parse(stored) as { ciphertext: string; iv: string };
    const wk  = await deriveKeyFromPassword(password, fromHex(saltHex));
    const b64 = await aesDecrypt(ciphertext, iv, wk);
    return fromBase64(b64);
  } catch { return null; }
}

export function hasStoredPrivateKey(userId: string): boolean {
  return !!localStorage.getItem(PK + userId);
}

export function clearStoredPrivateKey(userId: string): void {
  localStorage.removeItem(PK  + userId);
  localStorage.removeItem(PKS + userId);
}

// ─── Conversation key cache ────────────────────────────────────────────────────

const CK = 'sirr-ck-';

export async function cacheConversationKey(
  conversationId: string, userId: string, aesKey: CryptoKey, wrappingKey: CryptoKey
): Promise<void> {
  const { ciphertext, iv } = await aesEncrypt(await exportAesKey(aesKey), wrappingKey);
  localStorage.setItem(`${CK}${userId}-${conversationId}`, JSON.stringify({ ciphertext, iv }));
}

export async function getCachedConversationKey(
  conversationId: string, userId: string, wrappingKey: CryptoKey
): Promise<CryptoKey | null> {
  try {
    const stored = localStorage.getItem(`${CK}${userId}-${conversationId}`);
    if (!stored) return null;
    const { ciphertext, iv } = JSON.parse(stored) as { ciphertext: string; iv: string };
    return importAesKey(await aesDecrypt(ciphertext, iv, wrappingKey));
  } catch { return null; }
}

// ─── Password strength ────────────────────────────────────────────────────────

export interface PasswordStrength {
  score: number;
  label: 'Too weak' | 'Weak' | 'Fair' | 'Strong' | 'Very strong';
  feedback: string[];
  isValid: boolean;
}

export function checkPasswordStrength(password: string): PasswordStrength {
  const feedback: string[] = [];
  let score = 0;
  if (password.length >= 12) score++; else feedback.push('Use at least 12 characters');
  if (password.length >= 16) score++;
  if (/[A-Z]/.test(password) && /[a-z]/.test(password)) score++; else feedback.push('Mix uppercase and lowercase');
  if (/[0-9]/.test(password)) score++; else feedback.push('Add a number');
  if (/[^A-Za-z0-9]/.test(password)) score++; else feedback.push('Add a special character');
  const labels = ['Too weak', 'Weak', 'Fair', 'Strong', 'Very strong'] as const;
  return { score: Math.min(score, 4), label: labels[Math.min(score, 4)], feedback, isValid: score >= 3 && password.length >= 12 };
}
