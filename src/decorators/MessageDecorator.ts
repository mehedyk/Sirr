// Decorator Pattern: MessageDecorator adds metadata, timestamps, encryption status
import { Message } from '@/domain/models/Message';

export class MessageDecorator {
  private message: Message;
  private metadata: Map<string, any> = new Map();

  constructor(message: Message) {
    this.message = message;
  }

  public addMetadata(key: string, value: any): MessageDecorator {
    this.metadata.set(key, value);
    return this;
  }

  public getMetadata(key: string): any {
    return this.metadata.get(key);
  }

  public getAllMetadata(): Record<string, any> {
    return Object.fromEntries(this.metadata);
  }

  public addEncryptionStatus(isEncrypted: boolean): MessageDecorator {
    this.metadata.set('encrypted', isEncrypted);
    return this;
  }

  public addTimestamp(timestamp: Date): MessageDecorator {
    this.metadata.set('timestamp', timestamp);
    return this;
  }

  public addDeliveryStatus(status: 'sent' | 'delivered' | 'read'): MessageDecorator {
    this.metadata.set('deliveryStatus', status);
    return this;
  }

  public getMessage(): Message {
    return this.message;
  }

  public toJSON(): {
    message: ReturnType<Message['toJSON']>;
    metadata: Record<string, any>;
  } {
    return {
      message: this.message.toJSON(),
      metadata: this.getAllMetadata(),
    };
  }
}
