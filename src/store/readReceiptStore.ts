/**
 * readReceiptStore — tracks when each conversation was last read by each user.
 * Used to show "Seen" indicators on own messages and mark sidebar items read.
 */
import { create } from 'zustand';
import { supabaseAdapter } from '@/services/SupabaseAdapter';

interface ReceiptEntry {
  userId: string;
  readAt: string; // ISO
}

interface ReadReceiptState {
  // conversationId → latest receipt per userId
  receipts: Record<string, Record<string, string>>;

  markRead: (conversationId: string, userId: string) => Promise<void>;
  setReceipt: (conversationId: string, userId: string, readAt: string) => void;
  getLastRead: (conversationId: string, userId: string) => string | null;
}

export const useReadReceiptStore = create<ReadReceiptState>((set, get) => ({
  receipts: {},

  markRead: async (conversationId, userId) => {
    // Optimistic
    get().setReceipt(conversationId, userId, new Date().toISOString());
    // Persist
    await supabaseAdapter.markRead(conversationId, userId).catch(() => {});
  },

  setReceipt: (conversationId, userId, readAt) => {
    set((s) => ({
      receipts: {
        ...s.receipts,
        [conversationId]: {
          ...(s.receipts[conversationId] ?? {}),
          [userId]: readAt,
        },
      },
    }));
  },

  getLastRead: (conversationId, userId) => {
    return get().receipts[conversationId]?.[userId] ?? null;
  },
}));
