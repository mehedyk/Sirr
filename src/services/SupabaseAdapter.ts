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
        Insert: {
          id: string;
          username: string;
          public_key?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          username?: string;
          public_key?: string | null;
          created_at?: string;
          updated_at?: string;
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
        Insert: {
          id?: string;
          type: 'direct' | 'group';
          name?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          type?: 'direct' | 'group';
          name?: string | null;
          created_at?: string;
          updated_at?: string;
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
        Insert: {
          id: string;
          conversation_id: string;
          sender_id: string;
          encrypted_content: string;
          iv: string;
          message_type: 'text' | 'file' | 'call';
          created_at: string;
          expires_at: string;
        };
        Update: {
          id?: string;
          conversation_id?: string;
          sender_id?: string;
          encrypted_content?: string;
          iv?: string;
          message_type?: 'text' | 'file' | 'call';
          created_at?: string;
          expires_at?: string;
        };
      };
      conversation_members: {
        Row: {
          conversation_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at: string;
        };
        Insert: {
          conversation_id: string;
          user_id: string;
          role: 'admin' | 'member';
          joined_at?: string;
        };
        Update: {
          conversation_id?: string;
          user_id?: string;
          role?: 'admin' | 'member';
          joined_at?: string;
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

    const userData = data as Database['public']['Tables']['users']['Row'];
    return new User({
      id: userData.id,
      username: userData.username,
      publicKey: userData.public_key || undefined,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
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
      } as Database['public']['Tables']['users']['Insert'])
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create user');

    const userData = data as Database['public']['Tables']['users']['Row'];
    return new User({
      id: userData.id,
      username: userData.username,
      publicKey: userData.public_key || undefined,
      createdAt: new Date(userData.created_at),
      updatedAt: new Date(userData.updated_at),
    });
  }

  public async updateUsername(userId: string, username: string): Promise<void> {
    const { error } = await this.client
      .from('users')
      .update({ username, updated_at: new Date().toISOString() } as Database['public']['Tables']['users']['Update'])
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

    const convData = data as Database['public']['Tables']['conversations']['Row'];
    return new Conversation({
      id: convData.id,
      type: convData.type,
      name: convData.name || undefined,
      createdAt: new Date(convData.created_at),
      updatedAt: new Date(convData.updated_at),
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
      } as Database['public']['Tables']['conversations']['Insert'])
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to create conversation');

    const convData = data as Database['public']['Tables']['conversations']['Row'];
    return new Conversation({
      id: convData.id,
      type: convData.type,
      name: convData.name || undefined,
      createdAt: new Date(convData.created_at),
      updatedAt: new Date(convData.updated_at),
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
      } as Database['public']['Tables']['messages']['Insert'])
      .select()
      .single();

    if (error || !data) throw error || new Error('Failed to send message');

    const msgData = data as Database['public']['Tables']['messages']['Row'];
    return MessageFactory.createFromData({
      id: msgData.id,
      conversationId: msgData.conversation_id,
      senderId: msgData.sender_id,
      content: '', // Will be decrypted on client
      messageType: msgData.message_type,
      createdAt: new Date(msgData.created_at),
      expiresAt: new Date(msgData.expires_at),
    });
  }

  public async getMessages(conversationId: string): Promise<Message[]> {
    const { data, error } = await this.client
      .from('messages')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return (data || []).map((msg: any) => {
      const msgData = msg as Database['public']['Tables']['messages']['Row'];
      return MessageFactory.createFromData({
        id: msgData.id,
        conversationId: msgData.conversation_id,
        senderId: msgData.sender_id,
        content: msgData.encrypted_content, // Will be decrypted
        messageType: msgData.message_type,
        createdAt: new Date(msgData.created_at),
        expiresAt: new Date(msgData.expires_at),
      });
    });
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
