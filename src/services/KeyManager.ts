// Singleton Pattern: KeyManager ensures single instance globally
import { EncryptionService } from './EncryptionService';

export class KeyManager {
  private static instance: KeyManager | null = null;
  private encryptionService: EncryptionService;
  private masterKey: CryptoKey | null = null;
  private conversationKeys: Map<string, CryptoKey> = new Map();

  private constructor() {
    this.encryptionService = new EncryptionService();
  }

  public static getInstance(): KeyManager {
    if (!KeyManager.instance) {
      KeyManager.instance = new KeyManager();
    }
    return KeyManager.instance;
  }

  public async initializeMasterKey(): Promise<CryptoKey> {
    if (!this.masterKey) {
      this.masterKey = await this.encryptionService.generateKey();
    }
    return this.masterKey;
  }

  public getMasterKey(): CryptoKey | null {
    return this.masterKey;
  }

  public async generateConversationKey(conversationId: string): Promise<CryptoKey> {
    if (this.conversationKeys.has(conversationId)) {
      return this.conversationKeys.get(conversationId)!;
    }

    const key = await this.encryptionService.generateKey();
    this.conversationKeys.set(conversationId, key);
    return key;
  }

  public getConversationKey(conversationId: string): CryptoKey | null {
    return this.conversationKeys.get(conversationId) || null;
  }

  public async setConversationKey(conversationId: string, key: CryptoKey): Promise<void> {
    this.conversationKeys.set(conversationId, key);
  }

  public async exportKey(key: CryptoKey): Promise<string> {
    const exported = await crypto.subtle.exportKey('raw', key);
    return Array.from(new Uint8Array(exported))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public async importKey(keyData: string): Promise<CryptoKey> {
    const keyArray = new Uint8Array(
      keyData.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    return crypto.subtle.importKey(
      'raw',
      keyArray,
      { name: 'AES-GCM' },
      true,
      ['encrypt', 'decrypt']
    );
  }

  public clearConversationKey(conversationId: string): void {
    this.conversationKeys.delete(conversationId);
  }

  public clearAllKeys(): void {
    this.conversationKeys.clear();
    this.masterKey = null;
  }
}
