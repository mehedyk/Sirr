import { useEffect, useRef, useState, useCallback } from 'react';
import { Message } from '@/domain/models/Message';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MessageService } from '@/services/MessageService';
import { supabaseAdapter } from '@/services/SupabaseAdapter';
import { useConversationStore } from '@/store/conversationStore';
import { useTypingStore } from '@/store/typingStore';
import { useTyping } from '@/hooks/useTyping';
import { useReadReceipts } from '@/hooks/useReadReceipts';
import { useMessageSearch } from '@/hooks/useMessageSearch';
import { useAuthStore } from '@/store/authStore';
import { toast } from '@/store/toastStore';
import { CallWindow } from '@/components/calls/CallWindow';

interface ChatWindowProps {
  conversationId: string;
  userId: string;
}

export function ChatWindow({ conversationId, userId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [inCall, setInCall] = useState(false);

  const user = useAuthStore((s) => s.user);
  const { getParticipants, conversations, updateLastMessage } = useConversationStore();
  const typingUsers = useTypingStore((s) => s.getTyping(conversationId));
  const { sendTyping, sendStoppedTyping } = useTyping(conversationId, user?.username ?? '');

  // Read receipts
  useReadReceipts(conversationId, userId);

  // Client-side search
  const { query, setQuery, results, isSearching } = useMessageSearch(messages);

  const serviceRef = useRef<MessageService | null>(null);
  if (!serviceRef.current) serviceRef.current = new MessageService(supabaseAdapter);

  const activeConv = conversations.find((c) => c.id === conversationId);
  const convTitle =
    activeConv?.type === 'direct' ? (activeConv.otherUser?.username ?? 'Chat') : (activeConv?.name ?? 'Group');
  const isGroup = activeConv?.type === 'group';

  useEffect(() => {
    if (!conversationId) return;
    const service = serviceRef.current!;
    let mounted = true;

    setLoading(true);
    setMessages([]);
    setQuery('');

    service.getMessages(conversationId)
      .then((msgs) => { if (mounted) { setMessages(msgs); setLoading(false); } })
      .catch(() => { if (mounted) setLoading(false); });

    const sub = service.subscribeToMessages(conversationId, (newMsg) => {
      if (!mounted) return;
      setMessages((prev) => {
        if (prev.some((m) => m.id === newMsg.id)) return prev;
        return [...prev.filter((m) => !m.id.startsWith('opt-')), newMsg];
      });
      const preview = newMsg.content.startsWith('[') ? '🔒' : newMsg.content.slice(0, 60);
      updateLastMessage(conversationId, preview, newMsg.createdAt.toISOString());
    });

    return () => { mounted = false; sub?.unsubscribe(); };
  }, [conversationId]);

  const handleSend = useCallback(async (content: string) => {
    sendStoppedTyping();
    setSending(true);

    // Optimistic
    const optId = `opt-${Date.now()}`;
    const optMsg = {
      id: optId, conversationId, senderId: userId, content,
      messageType: 'text' as const,
      createdAt: new Date(),
      expiresAt: new Date(Date.now() + 72 * 3600 * 1000),
      isExpired: () => false,
    } as Message;

    setMessages((prev) => [...prev, optMsg]);
    updateLastMessage(conversationId, content.slice(0, 60), new Date().toISOString());

    try {
      const participantIds = await getParticipants(conversationId);
      const real = await serviceRef.current!.sendMessage(conversationId, userId, content, participantIds);
      setMessages((prev) => prev.map((m) => (m.id === optId ? real : m)));
    } catch (err: unknown) {
      setMessages((prev) => prev.filter((m) => m.id !== optId));
      toast.error(err instanceof Error ? err.message : 'Failed to send message');
    } finally {
      setSending(false);
    }
  }, [conversationId, userId, sendStoppedTyping, getParticipants, updateLastMessage]);

  if (inCall) {
    return (
      <CallWindow
        conversationId={conversationId}
        userId={userId}
        initiator={true}
        onEndCall={() => setInCall(false)}
      />
    );
  }

  if (loading) {
    return (
      <div className="chat-loading">
        <span className="chat-loading-spinner" />
        <span>Loading messages…</span>
      </div>
    );
  }

  const displayMessages = isSearching ? (results ?? []) : messages;

  return (
    <div className="chat-window">
      {/* Header */}
      <div className="chat-header">
        <div className="chat-header-info">
          <div className="chat-header-avatar">
            {isGroup ? (
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <circle cx="5.5" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
                <circle cx="11" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M1 13c0-2.21 2.01-4 4.5-4s4.5 1.79 4.5 4" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M11 9.5c1.657 0 3 1.12 3 2.5" stroke="currentColor" strokeWidth="1.25"/>
              </svg>
            ) : (
              (convTitle[0] ?? '?').toUpperCase()
            )}
          </div>
          <div>
            <div className="chat-header-name">{convTitle}</div>
            <div className="chat-header-meta">
              {isGroup ? 'Group' : 'Direct message'}
              {' · '}
              <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ display:'inline', verticalAlign:'middle' }}>
                <rect x="1.5" y="4" width="7" height="4.5" rx="1" stroke="currentColor" strokeWidth="1"/>
                <path d="M3 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1"/>
              </svg>
              {' E2E encrypted'}
            </div>
          </div>
        </div>

        {/* Header actions */}
        <div className="chat-header-actions">
          {/* Search toggle */}
          <div className={`chat-search-wrap ${isSearching ? 'chat-search-wrap--open' : ''}`}>
            {isSearching && (
              <input
                className="chat-search-input"
                type="text"
                placeholder="Search messages…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoFocus
              />
            )}
            <button
              className={`chat-icon-btn ${isSearching ? 'chat-icon-btn--active' : ''}`}
              onClick={() => setQuery(isSearching ? '' : ' ')}
              title="Search messages"
              aria-label="Search messages"
            >
              {isSearching ? (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round"/>
                </svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
              )}
            </button>
          </div>

          {/* Call button */}
          <button
            className="chat-icon-btn"
            onClick={() => setInCall(true)}
            title="Start video call"
            aria-label="Start video call"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <rect x="1" y="4" width="10" height="8" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
              <path d="M11 7l4-2.5v7L11 9" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Search result label */}
      {isSearching && (
        <div className="chat-search-label">
          {results === null ? 'Type to search…' :
           results.length === 0 ? 'No messages match' :
           `${results.length} result${results.length !== 1 ? 's' : ''}`}
        </div>
      )}

      <MessageList messages={displayMessages} currentUserId={userId} />

      {typingUsers.length > 0 && (
        <div className="chat-typing">
          <span className="chat-typing-dots"><span /><span /><span /></span>
          <span>
            {typingUsers.length === 1
              ? `${typingUsers[0]} is typing`
              : `${typingUsers.slice(0, 2).join(', ')} are typing`}
          </span>
        </div>
      )}

      <MessageInput
        onSend={handleSend}
        onTyping={sendTyping}
        onStoppedTyping={sendStoppedTyping}
        disabled={sending}
      />
    </div>
  );
}
