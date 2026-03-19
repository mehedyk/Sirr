export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          username: string
          public_key: string | null
          key_algorithm: string
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          public_key?: string | null
          key_algorithm?: string
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          public_key?: string | null
          key_algorithm?: string
          created_at?: string
          updated_at?: string
        }
      }
      conversations: {
        Row: {
          id: string
          type: 'direct' | 'group'
          name: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          type: 'direct' | 'group'
          name?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          type?: 'direct' | 'group'
          name?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          joined_at: string
          role: 'admin' | 'member'
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          joined_at?: string
          role?: 'admin' | 'member'
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          joined_at?: string
          role?: 'admin' | 'member'
        }
      }
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          encrypted_content: string
          iv: string
          hmac: string | null
          message_type: 'text' | 'file' | 'call'
          created_at: string
          expires_at: string
        }
        Insert: {
          id: string
          conversation_id: string
          sender_id: string
          encrypted_content: string
          iv: string
          hmac?: string | null
          message_type: 'text' | 'file' | 'call'
          created_at: string
          expires_at: string
        }
        Update: {
          id?: string
          conversation_id?: string
          sender_id?: string
          encrypted_content?: string
          iv?: string
          hmac?: string | null
          message_type?: 'text' | 'file' | 'call'
          created_at?: string
          expires_at?: string
        }
      }
      read_receipts: {
        Row: {
          conversation_id: string
          user_id: string
          read_at: string
        }
        Insert: {
          conversation_id: string
          user_id: string
          read_at?: string
        }
        Update: {
          conversation_id?: string
          user_id?: string
          read_at?: string
        }
      }
      conversation_keys: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          sender_id: string | null
          encrypted_key: string
          key_version: number
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          sender_id?: string | null
          encrypted_key: string
          key_version?: number
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          sender_id?: string | null
          encrypted_key?: string
          key_version?: number
          created_at?: string
        }
      }
      call_sessions: {
        Row: {
          id: string
          conversation_id: string
          initiator_id: string
          status: 'active' | 'ended'
          started_at: string
          ended_at: string | null
        }
        Insert: {
          id?: string
          conversation_id: string
          initiator_id: string
          status: 'active' | 'ended'
          started_at?: string
          ended_at?: string | null
        }
        Update: {
          id?: string
          conversation_id?: string
          initiator_id?: string
          status?: 'active' | 'ended'
          started_at?: string
          ended_at?: string | null
        }
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
  }
}
