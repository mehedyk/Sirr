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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          username: string
          public_key?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          username?: string
          public_key?: string | null
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
      messages: {
        Row: {
          id: string
          conversation_id: string
          sender_id: string
          encrypted_content: string
          iv: string
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
          message_type?: 'text' | 'file' | 'call'
          created_at?: string
          expires_at?: string
        }
      }
      conversation_members: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          role: 'admin' | 'member'
          joined_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          role?: 'admin' | 'member'
          joined_at?: string
        }
      }
      conversation_keys: {
        Row: {
          id: string
          conversation_id: string
          user_id: string
          encrypted_key: string
          created_at: string
        }
        Insert: {
          id?: string
          conversation_id: string
          user_id: string
          encrypted_key: string
          created_at?: string
        }
        Update: {
          id?: string
          conversation_id?: string
          user_id?: string
          encrypted_key?: string
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
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}