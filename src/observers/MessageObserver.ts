// Observer Pattern: MessageObserver listens to real-time message updates
import { Message } from '@/domain/models/Message';

export interface IMessageObserver {
  onMessageReceived(message: Message): void;
  onMessageSent(message: Message): void;
  onMessageError(error: Error): void;
}

export class MessageObserver implements IMessageObserver {
  private callbacks: {
    onMessageReceived?: (message: Message) => void;
    onMessageSent?: (message: Message) => void;
    onMessageError?: (error: Error) => void;
  };

  constructor(callbacks?: {
    onMessageReceived?: (message: Message) => void;
    onMessageSent?: (message: Message) => void;
    onMessageError?: (error: Error) => void;
  }) {
    this.callbacks = callbacks || {};
  }

  public onMessageReceived(message: Message): void {
    if (this.callbacks.onMessageReceived) {
      this.callbacks.onMessageReceived(message);
    }
  }

  public onMessageSent(message: Message): void {
    if (this.callbacks.onMessageSent) {
      this.callbacks.onMessageSent(message);
    }
  }

  public onMessageError(error: Error): void {
    if (this.callbacks.onMessageError) {
      this.callbacks.onMessageError(error);
    }
  }
}
