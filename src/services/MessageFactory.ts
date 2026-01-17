// Factory Pattern: MessageFactory creates different message types
import { Message } from '@/domain/models/Message';
import { MessageType } from '@/types';

export class MessageFactory {
  public static createTextMessage(
    conversationId: string,
    senderId: string,
    content: string
  ): Message {
    return new Message({
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      content,
      messageType: 'text',
      createdAt: new Date(),
    });
  }

  public static createFileMessage(
    conversationId: string,
    senderId: string,
    content: string,
    fileName: string
  ): Message {
    return new Message({
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      content: `${fileName}:${content}`, // Format: filename:fileData
      messageType: 'file',
      createdAt: new Date(),
    });
  }

  public static createCallMessage(
    conversationId: string,
    senderId: string,
    callDuration?: number
  ): Message {
    const content = callDuration 
      ? `Call ended. Duration: ${callDuration} seconds`
      : 'Call started';
    
    return new Message({
      id: crypto.randomUUID(),
      conversationId,
      senderId,
      content,
      messageType: 'call',
      createdAt: new Date(),
    });
  }

  public static createFromData(data: {
    id: string;
    conversationId: string;
    senderId: string;
    content: string;
    messageType: MessageType;
    createdAt: Date;
    expiresAt?: Date;
  }): Message {
    return new Message(data);
  }
}
