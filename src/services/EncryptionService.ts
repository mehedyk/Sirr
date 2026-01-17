// Strategy Pattern: EncryptionService with swappable encryption strategies
export interface IEncryptionStrategy {
  encrypt(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }>;
  decrypt(encrypted: string, iv: string, key: CryptoKey): Promise<string>;
}

export class AES256Strategy implements IEncryptionStrategy {
  async encrypt(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const ivString = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      dataBuffer
    );
    
    const encryptedString = Array.from(new Uint8Array(encrypted))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return { encrypted: encryptedString, iv: ivString };
  }

  async decrypt(encrypted: string, iv: string, key: CryptoKey): Promise<string> {
    const ivArray = new Uint8Array(
      iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const encryptedArray = new Uint8Array(
      encrypted.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv: ivArray },
      key,
      encryptedArray
    );

    const decoder = new TextDecoder();
    return decoder.decode(decrypted);
  }
}

export class EncryptionService {
  private strategy: IEncryptionStrategy;

  constructor(strategy: IEncryptionStrategy = new AES256Strategy()) {
    this.strategy = strategy;
  }

  public setStrategy(strategy: IEncryptionStrategy): void {
    this.strategy = strategy;
  }

  public async encrypt(data: string, key: CryptoKey): Promise<{ encrypted: string; iv: string }> {
    return this.strategy.encrypt(data, key);
  }

  public async decrypt(encrypted: string, iv: string, key: CryptoKey): Promise<string> {
    return this.strategy.decrypt(encrypted, iv, key);
  }

  public async generateKey(): Promise<CryptoKey> {
    return crypto.subtle.generateKey(
      {
        name: 'AES-GCM',
        length: 256,
      },
      true,
      ['encrypt', 'decrypt']
    );
  }

  public async deriveKey(password: string, salt: Uint8Array): Promise<CryptoKey> {
    const encoder = new TextEncoder();
    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits', 'deriveKey']
    );

    // Ensure salt is a proper ArrayBuffer for Web Crypto API
    // Create a new ArrayBuffer to avoid SharedArrayBuffer issues
    const saltBuffer = new Uint8Array(salt).buffer;

    return crypto.subtle.deriveKey(
      {
        name: 'PBKDF2',
        salt: saltBuffer,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  }

  public async generateHMAC(data: string, key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const signature = await crypto.subtle.sign(
      'HMAC',
      key,
      dataBuffer
    );

    return Array.from(new Uint8Array(signature))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
  }

  public async verifyHMAC(data: string, signature: string, key: CryptoKey): Promise<boolean> {
    const encoder = new TextEncoder();
    const dataBuffer = encoder.encode(data);
    
    const signatureArray = new Uint8Array(
      signature.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    return crypto.subtle.verify(
      'HMAC',
      key,
      signatureArray,
      dataBuffer
    );
  }
}
