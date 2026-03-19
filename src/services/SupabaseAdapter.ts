/**
 * SupabaseAdapter — wraps the singleton Supabase client.
 * All operations go through the single client from lib/supabase.
 */
import type { SupabaseClient } from '@supabase/supabase-js';
import { Message } from '@/domain/models/Message';
import { Conversation } from '@/domain/models/Conversation';
import { User } from '@/domain/models/User';
import { MessageFactory } from './MessageFactory';
import type { Database } from '@/types/supabase';
import { supabase } from '@/lib/supabase';

export class SupabaseAdapter {
  private client: SupabaseClient<Database>;

  constructor() {
    this.client = supabase;
  }

  getClient(): SupabaseClient<Database> {
    return this.client;
  }

  async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users').select('*').eq('id', userId).single();
    if (error || !data) return null;
    return new User({
      id: data.id, username: data.username,
      publicKey: data.public_key ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  async createConversation(type: 'direct' | 'group', name?: string): Promise<Conversation> {
    const { data, error } = await this.client
      .from('conversations').insert({ type, name: name ?? null }).select().single();
    if (error || !data) throw error ?? new Error('Failed to create conversation');
    return new Conversation({
      id: data.id, type: data.type,
      name: data.name ?? undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  async sendMessage(
    message: Message,
    encryptedContent: string,
    iv: string,
    hmac?: string
  ): Promise<Message> {
    const payload: Record<string, unknown> = {
      id: message.id,
      conversation_id: message.conversationId,
      sender_id: message.senderId,
      encrypted_content: encryptedContent,
      iv,
      message_type: message.messageType,
      created_at: message.createdAt.toISOString(),
      expires_at: message.expiresAt.toISOString(),
    };
    if (hmac) payload['hmac'] = hmac;

    const { data, error } = await this.client
      .from('messages').insert(payload).select().single();
    if (error || !data) throw error ?? new Error('Failed to send message');

    return MessageFactory.createFromData({
      id: data.id, conversationId: data.conversation_id,
      senderId: data.sender_id, content: message.content,
      messageType: data.message_type,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
    });
  }

  subscribeToMessages(
    conversationId: string,
    callback: (message: Message) => void
  ) {
    return this.client
      .channel(`messages:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'messages',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Database['public']['Tables']['messages']['Row'];
          callback(MessageFactory.createFromData({
            id: msg.id, conversationId: msg.conversation_id,
            senderId: msg.sender_id, content: msg.encrypted_content,
            messageType: msg.message_type,
            createdAt: new Date(msg.created_at),
            expiresAt: new Date(msg.expires_at),
          }));
        }
      )
      .subscribe();
  }

  // ── Read receipts ────────────────────────────────────────────────
  async markRead(conversationId: string, userId: string): Promise<void> {
    await this.client.from('read_receipts').upsert(
      { conversation_id: conversationId, user_id: userId, read_at: new Date().toISOString() },
      { onConflict: 'conversation_id,user_id' }
    );
  }

  subscribeToReadReceipts(
    conversationId: string,
    callback: (userId: string, readAt: string) => void
  ) {
    return this.client
      .channel(`receipts:${conversationId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'read_receipts',
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const row = payload.new as { user_id: string; read_at: string };
          if (row?.user_id && row?.read_at) callback(row.user_id, row.read_at);
        }
      )
      .subscribe();
  }
}

export const supabaseAdapter = new SupabaseAdapter();
