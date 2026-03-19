import { useCallback, useEffect, useRef } from 'react';
import { supabase } from '@/lib/supabase';
import { useTypingStore } from '@/store/typingStore';

const TYPING_THROTTLE_MS = 2000;
const TYPING_EXPIRE_MS  = 4000;

export function useTyping(conversationId: string, currentUsername: string) {
  const setTyping = useTypingStore((s) => s.setTyping);
  const lastSentRef = useRef(0);
  const expireTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  // Subscribe to typing broadcasts
  useEffect(() => {
    if (!conversationId) return;

    const channel = supabase.channel(`typing:${conversationId}`);

    channel
      .on('broadcast', { event: 'typing' }, ({ payload }) => {
        const { username } = payload as { username: string };
        if (username === currentUsername) return;

        setTyping(conversationId, username, true);

        // Auto-expire after TYPING_EXPIRE_MS of silence
        clearTimeout(expireTimers.current[username]);
        expireTimers.current[username] = setTimeout(() => {
          setTyping(conversationId, username, false);
        }, TYPING_EXPIRE_MS);
      })
      .on('broadcast', { event: 'stopped_typing' }, ({ payload }) => {
        const { username } = payload as { username: string };
        clearTimeout(expireTimers.current[username]);
        setTyping(conversationId, username, false);
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
      Object.values(expireTimers.current).forEach(clearTimeout);
    };
  }, [conversationId, currentUsername, setTyping]);

  // Send typing event (throttled)
  const sendTyping = useCallback(() => {
    const now = Date.now();
    if (now - lastSentRef.current < TYPING_THROTTLE_MS) return;
    lastSentRef.current = now;

    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'typing',
      payload: { username: currentUsername },
    });
  }, [conversationId, currentUsername]);

  const sendStoppedTyping = useCallback(() => {
    supabase.channel(`typing:${conversationId}`).send({
      type: 'broadcast',
      event: 'stopped_typing',
      payload: { username: currentUsername },
    });
  }, [conversationId, currentUsername]);

  return { sendTyping, sendStoppedTyping };
}
