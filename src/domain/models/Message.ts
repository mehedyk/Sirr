import { IMessage, IEncryptable, MessageType } from '@/types';

export class Message implements IMessage, IEncryptable {
  public id: string;
  public conversationId: string;
  public senderId: string;
  public content: string;
  public messageType: MessageType;
  public createdAt: Date;
  public expiresAt: Date;
  private encryptedContent?: string;
  private iv?: string;

  constructor(data: Omit<IMessage, 'expiresAt'> & { expiresAt?: Date }) {
    this.id = data.id;
    this.conversationId = data.conversationId;
    this.senderId = data.senderId;
    this.content = data.content;
    this.messageType = data.messageType;
    this.createdAt = data.createdAt;
    this.expiresAt = data.expiresAt || new Date(Date.now() + 72 * 60 * 60 * 1000); // 72 hours
  }

  public async encrypt(key: CryptoKey): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(this.content);
    
    const iv = crypto.getRandomValues(new Uint8Array(12));
    this.iv = Array.from(iv).map(b => b.toString(16).padStart(2, '0')).join('');
    
    const encrypted = await crypto.subtle.encrypt(
      { name: 'AES-GCM', iv },
      key,
      data
    );
    
    this.encryptedContent = Array.from(new Uint8Array(encrypted))
      .map(b => b.toString(16).padStart(2, '0'))
      .join('');
    
    return this.encryptedContent;
  }

  public async decrypt(key: CryptoKey): Promise<string> {
    if (!this.encryptedContent || !this.iv) {
      throw new Error('Message is not encrypted');
    }

    const iv = new Uint8Array(
      this.iv.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );
    
    const encrypted = new Uint8Array(
      this.encryptedContent.match(/.{1,2}/g)!.map(byte => parseInt(byte, 16))
    );

    const decrypted = await crypto.subtle.decrypt(
      { name: 'AES-GCM', iv },
      key,
      encrypted
    );

    const decoder = new TextDecoder();
    this.content = decoder.decode(decrypted);
    return this.content;
  }

  public isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  public getIV(): string | undefined {
    return this.iv;
  }

  public getEncryptedContent(): string | undefined {
    return this.encryptedContent;
  }

  public toJSON(): IMessage {
    return {
      id: this.id,
      conversationId: this.conversationId,
      senderId: this.senderId,
      content: this.content,
      messageType: this.messageType,
      createdAt: this.createdAt,
      expiresAt: this.expiresAt,
    };
  }
}
