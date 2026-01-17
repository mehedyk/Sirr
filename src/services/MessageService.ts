import { Message } from '@/domain/models/Message';
import { SupabaseAdapter } from './SupabaseAdapter';
import { KeyManager } from './KeyManager';
import { EncryptionService } from './EncryptionService';
import { MessageFactory } from './MessageFactory';

export class MessageService {
  private supabaseAdapter: SupabaseAdapter;
  private keyManager: KeyManager;
  private encryptionService: EncryptionService;

  constructor(supabaseAdapter: SupabaseAdapter) {
    this.supabaseAdapter = supabaseAdapter;
    this.keyManager = KeyManager.getInstance();
    this.encryptionService = new EncryptionService();
  }

  public async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    messageType: 'text' | 'file' | 'call' = 'text'
  ): Promise<Message> {
    // Get or generate conversation key
    let conversationKey = this.keyManager.getConversationKey(conversationId);
    if (!conversationKey) {
      conversationKey = await this.keyManager.generateConversationKey(conversationId);
    }

    // Create message
    const message = MessageFactory.createTextMessage(conversationId, senderId, content);
    if (messageType === 'file') {
      // Handle file message creation differently if needed
    }

    // Encrypt message
    const { encrypted, iv } = await this.encryptionService.encrypt(content, conversationKey);

    // Send to Supabase
    return this.supabaseAdapter.sendMessage(message, encrypted, iv);
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    // Get encrypted messages with full data
    const { data, error } = await this.supabaseAdapter.getClient()
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    // Decrypt messages
    const conversationKey = this.keyManager.getConversationKey(conversationId);
    if (!conversationKey) {
      // Generate key if it doesn't exist (for new conversations)
      await this.keyManager.generateConversationKey(conversationId);
      return []; // Return empty if no key yet
    }

    const decryptedMessages = await Promise.all(
      (data || []).map(async (msg: any) => {
        try {
          const decrypted = await this.encryptionService.decrypt(
            msg.encrypted_content,
            msg.iv,
            conversationKey
          );
          return MessageFactory.createFromData({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            content: decrypted,
            messageType: msg.message_type,
            createdAt: new Date(msg.created_at),
            expiresAt: new Date(msg.expires_at),
          });
        } catch (error) {
          console.error('Failed to decrypt message:', error);
          // Return message with encrypted content if decryption fails
          return MessageFactory.createFromData({
            id: msg.id,
            conversationId: msg.conversation_id,
            senderId: msg.sender_id,
            content: '[Encrypted message - decryption failed]',
            messageType: msg.message_type,
            createdAt: new Date(msg.created_at),
            expiresAt: new Date(msg.expires_at),
          });
        }
      })
    );

    return decryptedMessages;
  }

  public subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return this.supabaseAdapter.subscribeToMessages(conversationId, async (encryptedMessage) => {
      const conversationKey = this.keyManager.getConversationKey(conversationId);
      if (!conversationKey) {
        // Generate key if it doesn't exist
        await this.keyManager.generateConversationKey(conversationId);
        return;
      }

      // Get full message data with encrypted content and IV
      const { data } = await this.supabaseAdapter.getClient()
        .from('messages')
        .select('encrypted_content, iv')
        .eq('id', encryptedMessage.id)
        .single();

      if (data) {
        try {
          const decrypted = await this.encryptionService.decrypt(
            data.encrypted_content,
            data.iv,
            conversationKey
          );
          const decryptedMessage = MessageFactory.createFromData({
            id: encryptedMessage.id,
            conversationId: encryptedMessage.conversationId,
            senderId: encryptedMessage.senderId,
            content: decrypted,
            messageType: encryptedMessage.messageType,
            createdAt: encryptedMessage.createdAt,
            expiresAt: encryptedMessage.expiresAt,
          });
          callback(decryptedMessage);
        } catch (error) {
          console.error('Failed to decrypt message:', error);
        }
      }
    });
  }
}
