/**
 * conversationStore — manages conversations, members, and active selection.
 * Single source of truth for the sidebar and chat.
 */
import { create } from 'zustand';
import { supabase } from '@/lib/supabase';

export interface ConversationMeta {
  id: string;
  type: 'direct' | 'group';
  name: string | null;
  // For DMs: the other participant's info
  otherUser?: { id: string; username: string };
  // Last message preview (decrypted by MessageService before storing here)
  lastMessagePreview?: string;
  lastMessageAt?: string;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserSearchResult {
  id: string;
  username: string;
  publicKey: string | null;
}

interface ConversationState {
  conversations: ConversationMeta[];
  activeConversationId: string | null;
  loadingConversations: boolean;
  participantMap: Record<string, string[]>; // conversationId → userIds

  fetchConversations: (currentUserId: string) => Promise<void>;
  setActiveConversation: (id: string | null) => void;
  searchUsers: (query: string, currentUserId: string) => Promise<UserSearchResult[]>;
  startDirectMessage: (currentUserId: string, otherUser: UserSearchResult) => Promise<string>;
  createGroup: (currentUserId: string, name: string, memberIds: string[]) => Promise<string>;
  getParticipants: (conversationId: string) => Promise<string[]>;
  updateLastMessage: (conversationId: string, preview: string, at: string) => void;
  markRead: (conversationId: string) => void;
}

export const useConversationStore = create<ConversationState>((set, get) => ({
  conversations: [],
  activeConversationId: null,
  loadingConversations: false,
  participantMap: {},

  fetchConversations: async (currentUserId) => {
    set({ loadingConversations: true });
    try {
      // Get all conversation IDs the user belongs to
      const { data: memberRows, error: memberErr } = await supabase
        .from('conversation_members')
        .select('conversation_id, role')
        .eq('user_id', currentUserId);

      if (memberErr || !memberRows) {
        set({ loadingConversations: false });
        return;
      }

      const conversationIds = memberRows.map((r) => r.conversation_id);
      if (conversationIds.length === 0) {
        set({ conversations: [], loadingConversations: false });
        return;
      }

      // Fetch conversations
      const { data: convRows, error: convErr } = await supabase
        .from('conversations')
        .select('*')
        .in('id', conversationIds)
        .order('updated_at', { ascending: false });

      if (convErr || !convRows) {
        set({ loadingConversations: false });
        return;
      }

      // Fetch all members of all conversations (for DM name resolution)
      const { data: allMembers } = await supabase
        .from('conversation_members')
        .select('conversation_id, user_id, users(id, username)')
        .in('conversation_id', conversationIds);

      // Build participant map
      const participantMap: Record<string, string[]> = {};
      const membersByConv: Record<string, Array<{ id: string; username: string }>> = {};

      for (const row of allMembers ?? []) {
        const u = (row as any).users as { id: string; username: string } | null;
        if (!participantMap[row.conversation_id]) participantMap[row.conversation_id] = [];
        participantMap[row.conversation_id].push(row.user_id);
        if (!membersByConv[row.conversation_id]) membersByConv[row.conversation_id] = [];
        if (u) membersByConv[row.conversation_id].push(u);
      }

      const conversations: ConversationMeta[] = convRows.map((conv) => {
        const members = membersByConv[conv.id] ?? [];
        const otherMembers = members.filter((m) => m.id !== currentUserId);
        const otherUser = conv.type === 'direct' ? otherMembers[0] : undefined;

        return {
          id: conv.id,
          type: conv.type,
          name: conv.name,
          otherUser: otherUser ? { id: otherUser.id, username: otherUser.username } : undefined,
          unreadCount: 0,
          createdAt: conv.created_at,
          updatedAt: conv.updated_at,
        };
      });

      set({ conversations, participantMap, loadingConversations: false });
    } catch {
      set({ loadingConversations: false });
    }
  },

  setActiveConversation: (id) => {
    set({ activeConversationId: id });
    if (id) get().markRead(id);
  },

  searchUsers: async (query, currentUserId) => {
    if (query.trim().length < 2) return [];
    const { data, error } = await supabase
      .from('users')
      .select('id, username, public_key')
      .ilike('username', `%${query}%`)
      .neq('id', currentUserId)
      .limit(10);

    if (error || !data) return [];
    return data.map((u) => ({ id: u.id, username: u.username, publicKey: u.public_key }));
  },

  startDirectMessage: async (currentUserId, otherUser) => {
    // Check if DM already exists
    const { conversations, participantMap } = get();
    const existing = conversations.find(
      (c) =>
        c.type === 'direct' &&
        c.otherUser?.id === otherUser.id
    );
    if (existing) {
      set({ activeConversationId: existing.id });
      return existing.id;
    }

    // Create conversation
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ type: 'direct' })
      .select()
      .single();

    if (convErr || !conv) throw new Error('Failed to create conversation');

    // Add both members
    const { error: membErr } = await supabase.from('conversation_members').insert([
      { conversation_id: conv.id, user_id: currentUserId, role: 'admin' },
      { conversation_id: conv.id, user_id: otherUser.id, role: 'member' },
    ]);

    if (membErr) throw new Error('Failed to add members');

    const newConv: ConversationMeta = {
      id: conv.id,
      type: 'direct',
      name: null,
      otherUser: { id: otherUser.id, username: otherUser.username },
      unreadCount: 0,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    };

    set((s) => ({
      conversations: [newConv, ...s.conversations],
      activeConversationId: conv.id,
      participantMap: {
        ...s.participantMap,
        [conv.id]: [currentUserId, otherUser.id],
      },
    }));

    return conv.id;
  },

  createGroup: async (currentUserId, name, memberIds) => {
    const { data: conv, error: convErr } = await supabase
      .from('conversations')
      .insert({ type: 'group', name })
      .select()
      .single();

    if (convErr || !conv) throw new Error('Failed to create group');

    const allMembers = [currentUserId, ...memberIds.filter((id) => id !== currentUserId)];
    const { error: membErr } = await supabase.from('conversation_members').insert(
      allMembers.map((uid, i) => ({
        conversation_id: conv.id,
        user_id: uid,
        role: i === 0 ? 'admin' : 'member',
      }))
    );

    if (membErr) throw new Error('Failed to add group members');

    const newConv: ConversationMeta = {
      id: conv.id,
      type: 'group',
      name,
      unreadCount: 0,
      createdAt: conv.created_at,
      updatedAt: conv.updated_at,
    };

    set((s) => ({
      conversations: [newConv, ...s.conversations],
      activeConversationId: conv.id,
      participantMap: { ...s.participantMap, [conv.id]: allMembers },
    }));

    return conv.id;
  },

  getParticipants: async (conversationId) => {
    const { participantMap } = get();
    if (participantMap[conversationId]) return participantMap[conversationId];

    const { data } = await supabase
      .from('conversation_members')
      .select('user_id')
      .eq('conversation_id', conversationId);

    const ids = (data ?? []).map((r) => r.user_id);
    set((s) => ({ participantMap: { ...s.participantMap, [conversationId]: ids } }));
    return ids;
  },

  updateLastMessage: (conversationId, preview, at) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId
          ? { ...c, lastMessagePreview: preview, lastMessageAt: at, updatedAt: at }
          : c
      ),
    }));
  },

  markRead: (conversationId) => {
    set((s) => ({
      conversations: s.conversations.map((c) =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },
}));
