/**
 * KeyManager — Singleton. Manages all cryptographic keys for the session.
 *
 * Lifecycle:
 *   1. User logs in → KeyManager.initialize(userId, password) called
 *   2. Loads private key from localStorage (decrypts with PBKDF2(password))
 *   3. Conversation keys fetched from Supabase conversation_keys table,
 *      decrypted with ECDH-derived shared key, cached in memory + localStorage
 *   4. On sign-out → KeyManager.clear()
 */

import {
  loadPrivateKey,
  deriveSharedKey,
  generateAesKey,
  exportAesKey,
  importAesKey,
  cacheConversationKey,
  getCachedConversationKey,
  clearStoredPrivateKey,
  fromBase64,
  toBase64,
  aesEncrypt,
  aesDecrypt,
} from './CryptoService';
import { supabase } from '@/lib/supabase';

export class KeyManager {
  private static instance: KeyManager | null = null;

  private userId: string | null = null;
  private privateKey: Uint8Array | null = null;
  // conversationId → AES-256-GCM key
  private conversationKeys: Map<string, CryptoKey> = new Map();
  // userId → shared ECDH-derived AES key (used to wrap/unwrap conversation keys)
  private sharedKeys: Map<string, CryptoKey> = new Map();
  // wrapping key for local cache (derived from first shared key or master)
  private cacheWrappingKey: CryptoKey | null = null;

  private constructor() {}

  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  /**
   * Initialize the KeyManager after login.
   * Loads the private key from localStorage and sets the cache wrapping key.
   */
  public async initialize(userId: string, password: string): Promise<boolean> {
    this.userId = userId;
    const privateKey = await loadPrivateKey(userId, password);
    if (!privateKey) {
      console.warn('[KeyManager] No private key found for user. Key exchange unavailable.');
      return false;
    }
    this.privateKey = privateKey;
    return true;
  }

  public isInitialized(): boolean {
    return this.privateKey !== null;
  }

  public getPrivateKey(): Uint8Array | null {
    return this.privateKey;
  }

  /**
   * Get or derive a shared key with another user.
   * Fetches their public key from the DB, performs ECDH.
   */
  public async getSharedKeyWith(otherUserId: string): Promise<CryptoKey | null> {
    if (this.sharedKeys.has(otherUserId)) {
      return this.sharedKeys.get(otherUserId)!;
    }

    if (!this.privateKey) return null;

    const { data, error } = await supabase
      .from('users')
      .select('public_key')
      .eq('id', otherUserId)
      .single();

    if (error || !data?.public_key) return null;

    try {
      const theirPublicKey = fromBase64(data.public_key);
      const sharedKey = await deriveSharedKey(this.privateKey, theirPublicKey);
      this.sharedKeys.set(otherUserId, sharedKey);
      return sharedKey;
    } catch {
      return null;
    }
  }

  /**
   * Get conversation key (in-memory first, then localStorage cache, then Supabase).
   */
  public async getConversationKey(conversationId: string): Promise<CryptoKey | null> {
    // 1. In-memory
    if (this.conversationKeys.has(conversationId)) {
      return this.conversationKeys.get(conversationId)!;
    }

    if (!this.userId || !this.privateKey) return null;

    // 2. Supabase conversation_keys table
    return this.fetchConversationKeyFromServer(conversationId);
  }

  private async fetchConversationKeyFromServer(
    conversationId: string
  ): Promise<CryptoKey | null> {
    if (!this.userId) return null;

    const { data, error } = await supabase
      .from('conversation_keys')
      .select('encrypted_key, sender_id')
      .eq('conversation_id', conversationId)
      .eq('user_id', this.userId)
      .single();

    if (error || !data) return null;

    try {
      // encrypted_key is the AES conv key encrypted with our ECDH shared key with sender
      const sharedKey = await this.getSharedKeyWith(data.sender_id);
      if (!sharedKey) return null;

      const parsed = JSON.parse(data.encrypted_key) as { ciphertext: string; iv: string };
      const rawKeyHex = await aesDecrypt(parsed.ciphertext, parsed.iv, sharedKey);
      const convKey = await importAesKey(rawKeyHex);

      this.conversationKeys.set(conversationId, convKey);
      return convKey;
    } catch {
      return null;
    }
  }

  /**
   * Create a new conversation key, encrypt it for all participants,
   * and store in conversation_keys.
   */
  public async createConversationKey(
    conversationId: string,
    participantIds: string[]
  ): Promise<CryptoKey> {
    const key = await generateAesKey();
    this.conversationKeys.set(conversationId, key);

    const rawKeyHex = await exportAesKey(key);

    // Encrypt for each participant (including self)
    const insertRows = [];
    for (const participantId of participantIds) {
      try {
        const sharedKey = await this.getSharedKeyWith(participantId);
        if (!sharedKey) continue;
        const { ciphertext, iv } = await aesEncrypt(rawKeyHex, sharedKey);
        insertRows.push({
          conversation_id: conversationId,
          user_id: participantId,
          sender_id: this.userId!,
          encrypted_key: JSON.stringify({ ciphertext, iv }),
          key_version: 1,
        });
      } catch {
        // skip participant if key exchange fails
      }
    }

    if (insertRows.length > 0) {
      await supabase.from('conversation_keys').upsert(insertRows, {
        onConflict: 'conversation_id,user_id',
      });
    }

    return key;
  }

  /**
   * Ensure a conversation key exists. Fetches from server or creates new.
   */
  public async ensureConversationKey(
    conversationId: string,
    participantIds: string[]
  ): Promise<CryptoKey | null> {
    const existing = await this.getConversationKey(conversationId);
    if (existing) return existing;

    if (!this.userId) return null;
    // Create new key only if we're the initiator (first participant)
    return this.createConversationKey(conversationId, participantIds);
  }

  public setConversationKeyInMemory(conversationId: string, key: CryptoKey): void {
    this.conversationKeys.set(conversationId, key);
  }

  public clear(): void {
    this.userId = null;
    this.privateKey = null;
    this.conversationKeys.clear();
    this.sharedKeys.clear();
    this.cacheWrappingKey = null;
  }
}
