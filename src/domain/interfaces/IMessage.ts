import { MessageType } from '@/types';

export interface IMessage {
  id: string;
  conversationId: string;
  senderId: string;
  content: string;
  messageType: MessageType;
  createdAt: Date;
  expiresAt: Date;
}
