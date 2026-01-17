// Adapter Pattern: SupabaseAdapter wraps Supabase client, provides clean interface
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import { Message } from '@/domain/models/Message';
import { Conversation } from '@/domain/models/Conversation';
import { User } from '@/domain/models/User';
import { MessageFactory } from './MessageFactory';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          username: string;
          public_key: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      conversations: {
        Row: {
          id: string;
          type: 'direct' | 'group';
          name: string | null;
          created_at: string;
          updated_at: string;
        };
      };
      messages: {
        Row: {
          id: string;
          conversation_id: string;
          sender_id: string;
          encrypted_content: string;
          iv: string;
          message_type: 'text' | 'file' | 'call';
          created_at: string;
          expires_at: string;
        };
      };
    };
  };
}

export class SupabaseAdapter {
  private client: SupabaseClient<Database>;

  constructor(url: string, anonKey: string) {
    this.client = createClient<Database>(url, anonKey);
  }

  public getClient(): SupabaseClient<Database> {
    return this.client;
  }

  // User operations
  public async getUser(userId: string): Promise<User | null> {
    const { data, error } = await this.client
      .from('users')
      .select('*')
      .eq('id', userId)
      .single();

    if (error || !data) return null;

    return new User({
      id: data.id,
      username: data.username,
      publicKey: data.public_key || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  public async createUser(userId: string, username: string): Promise<User> {
    const { data, error } = await this.client
      .from('users')
      .insert({
        id: userId,
        username,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new User({
      id: data.id,
      username: data.username,
      publicKey: data.public_key || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  public async updateUsername(userId: string, username: string): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ username, updated_at: new Date().toISOString() })
      .eq('id', userId);

    if (error) throw error;
  }

  // Conversation operations
  public async getConversation(conversationId: string): Promise<Conversation | null> {
    const { data, error } = await this.client
      .from('conversations')
      .select('*')
      .eq('id', conversationId)
      .single();

    if (error || !data) return null;

    return new Conversation({
      id: data.id,
      type: data.type,
      name: data.name || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  public async createConversation(
    type: 'direct' | 'group',
    name?: string
  ): Promise<Conversation> {
    const { data, error } = await this.client
      .from('conversations')
      .insert({
        type,
        name: name || null,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return new Conversation({
      id: data.id,
      type: data.type,
      name: data.name || undefined,
      createdAt: new Date(data.created_at),
      updatedAt: new Date(data.updated_at),
    });
  }

  // Message operations
  public async sendMessage(
    message: Message,
    encryptedContent: string,
    iv: string
  ): Promise<Message> {
    const { data, error } = await this.client
      .from('messages')
      .insert({
        id: message.id,
        conversation_id: message.conversationId,
        sender_id: message.senderId,
        encrypted_content: encryptedContent,
        iv,
        message_type: message.messageType,
        created_at: message.createdAt.toISOString(),
        expires_at: message.expiresAt.toISOString(),
      })
      .select()
      .single();

    if (error) throw error;

    return MessageFactory.createFromData({
      id: data.id,
      conversationId: data.conversation_id,
      senderId: data.sender_id,
      content: '', // Will be decrypted on client
      messageType: data.message_type,
      createdAt: new Date(data.created_at),
      expiresAt: new Date(data.expires_at),
    });
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map(msg =>
      MessageFactory.createFromData({
        id: msg.id,
        conversationId: msg.conversation_id,
        senderId: msg.sender_id,
        content: msg.encrypted_content, // Will be decrypted
        messageType: msg.message_type,
        createdAt: new Date(msg.created_at),
        expiresAt: new Date(msg.expires_at),
      })
    );
  }

  // Realtime subscriptions
  public subscribeToMessages(
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
          callback(
            MessageFactory.createFromData({
              id: msg.id,
              conversationId: msg.conversation_id,
              senderId: msg.sender_id,
              content: msg.encrypted_content,
              messageType: msg.message_type,
              createdAt: new Date(msg.created_at),
              expiresAt: new Date(msg.expires_at),
            })
          );
        }
      )
      .subscribe();
  }
}

// Import MessageFactory for use in adapter
import { MessageFactory } from './MessageFactory';
