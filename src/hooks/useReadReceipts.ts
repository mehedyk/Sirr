import { useEffect } from 'react';
import { supabaseAdapter } from '@/services/SupabaseAdapter';
import { useReadReceiptStore } from '@/store/readReceiptStore';

/**
 * useReadReceipts — subscribes to receipt updates for a conversation.
 * Automatically marks the conversation as read when mounted (user is viewing it).
 */
export function useReadReceipts(conversationId: string, currentUserId: string) {
  const { markRead, setReceipt } = useReadReceiptStore();

  // Mark as read on mount and when conversation changes
  useEffect(() => {
    if (!conversationId || conversationId === 'placeholder') return;
    markRead(conversationId, currentUserId);
  }, [conversationId, currentUserId, markRead]);

  // Subscribe to other users' receipts
  useEffect(() => {
    if (!conversationId) return;
    const sub = supabaseAdapter.subscribeToReadReceipts(
      conversationId,
      (userId, readAt) => {
        if (userId !== currentUserId) {
          setReceipt(conversationId, userId, readAt);
        }
      }
    );
    return () => { sub.unsubscribe(); };
  }, [conversationId, currentUserId]);
}
