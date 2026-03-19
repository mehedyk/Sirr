import { Message } from '@/domain/models/Message';
import { SupabaseAdapter } from './SupabaseAdapter';
import { KeyManager } from './KeyManager';
import {
  aesEncrypt, aesDecrypt,
  deriveHmacKey, hmacSign, hmacVerify,
} from './CryptoService';
import { MessageFactory } from './MessageFactory';
import { supabase } from '@/lib/supabase';

export class MessageService {
  private supabaseAdapter: SupabaseAdapter;
  private keyManager: KeyManager;

  constructor(supabaseAdapter: SupabaseAdapter) {
    this.supabaseAdapter = supabaseAdapter;
    this.keyManager = KeyManager.getInstance();
  }

  public async sendMessage(
    conversationId: string,
    senderId: string,
    content: string,
    participantIds: string[],
    messageType: 'text' | 'file' | 'call' = 'text'
  ): Promise<Message> {
    const key = await this.keyManager.ensureConversationKey(conversationId, participantIds);
    if (!key) throw new Error(
      'Cannot encrypt: key exchange failed. Ensure all participants have registered public keys.'
    );

    const message = MessageFactory.createTextMessage(conversationId, senderId, content);
    const { ciphertext, iv } = await aesEncrypt(content, key);

    // HMAC sign: proves sender identity (holds the shared ECDH key)
    let hmacSig: string | undefined;
    try {
      const hmacKey = await deriveHmacKey(key);
      hmacSig = await hmacSign(hmacKey, conversationId, message.id, ciphertext);
    } catch {
      // Non-fatal — send without HMAC if derivation fails (graceful degradation)
    }

    return this.supabaseAdapter.sendMessage(message, ciphertext, iv, hmacSig);
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    const key = await this.keyManager.getConversationKey(conversationId);
    if (!key) {
      return (data ?? []).map((msg) =>
        MessageFactory.createFromData({
          id: msg.id,
          conversationId: msg.conversation_id,
          senderId: msg.sender_id,
          content: '[Decryption key unavailable — sign out and back in to restore keys]',
          messageType: msg.message_type,
          createdAt: new Date(msg.created_at),
          expiresAt: new Date(msg.expires_at),
        })
      );
    }

    const now = new Date();
    const hmacKey = await deriveHmacKey(key).catch(() => null);

    return Promise.all(
      (data ?? [])
        .filter((msg) => new Date(msg.expires_at) > now)
        .map(async (msg) => {
          try {
            // Optional HMAC verification
            if (hmacKey && msg.hmac) {
              const valid = await hmacVerify(
                hmacKey, msg.conversation_id, msg.id, msg.encrypted_content, msg.hmac
              );
              if (!valid) {
                return MessageFactory.createFromData({
                  id: msg.id, conversationId: msg.conversation_id,
                  senderId: msg.sender_id,
                  content: '[⚠ Message authentication failed — possible tampering]',
                  messageType: msg.message_type,
                  createdAt: new Date(msg.created_at),
                  expiresAt: new Date(msg.expires_at),
                });
              }
            }

            const content = await aesDecrypt(msg.encrypted_content, msg.iv, key);
            return MessageFactory.createFromData({
              id: msg.id, conversationId: msg.conversation_id,
              senderId: msg.sender_id, content,
              messageType: msg.message_type,
              createdAt: new Date(msg.created_at),
              expiresAt: new Date(msg.expires_at),
            });
          } catch {
            return MessageFactory.createFromData({
              id: msg.id, conversationId: msg.conversation_id,
              senderId: msg.sender_id, content: '[Could not decrypt message]',
              messageType: msg.message_type,
              createdAt: new Date(msg.created_at),
              expiresAt: new Date(msg.expires_at),
            });
          }
        })
    );
  }

  public subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return this.supabaseAdapter.subscribeToMessages(conversationId, async (encryptedMessage) => {
      if (encryptedMessage.isExpired()) return;

      const key = await this.keyManager.getConversationKey(conversationId);
      if (!key) return;

      const { data } = await supabase
        .from('messages')
        .select('encrypted_content, iv, hmac')
        .eq('id', encryptedMessage.id)
        .single();

      if (!data) return;

      try {
        // HMAC check on realtime too
        if (data.hmac) {
          const hmacKey = await deriveHmacKey(key);
          const valid = await hmacVerify(
            hmacKey, conversationId, encryptedMessage.id,
            data.encrypted_content, data.hmac
          );
          if (!valid) {
            callback(MessageFactory.createFromData({
              id: encryptedMessage.id,
              conversationId: encryptedMessage.conversationId,
              senderId: encryptedMessage.senderId,
              content: '[⚠ Message authentication failed]',
              messageType: encryptedMessage.messageType,
              createdAt: encryptedMessage.createdAt,
              expiresAt: encryptedMessage.expiresAt,
            }));
            return;
          }
        }

        const content = await aesDecrypt(data.encrypted_content, data.iv, key);
        callback(MessageFactory.createFromData({
          id: encryptedMessage.id,
          conversationId: encryptedMessage.conversationId,
          senderId: encryptedMessage.senderId,
          content,
          messageType: encryptedMessage.messageType,
          createdAt: encryptedMessage.createdAt,
          expiresAt: encryptedMessage.expiresAt,
        }));
      } catch {
        // Decryption failed — silently skip
      }
    });
  }
}
