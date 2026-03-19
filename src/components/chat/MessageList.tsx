import { useEffect, useRef } from 'react';
import { Message } from '@/domain/models/Message';

interface Props { messages: Message[]; currentUserId: string; }

const formatTime = (d: Date) => d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

function formatDateSep(d: Date): string {
  const today = new Date(), yest = new Date(today);
  yest.setDate(yest.getDate() - 1);
  if (d.toDateString() === today.toDateString()) return 'Today';
  if (d.toDateString() === yest.toDateString()) return 'Yesterday';
  return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
}

export function MessageList({ messages, currentUserId }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages.length]);

  if (messages.length === 0) {
    return (
      <div className="message-list-empty">
        <svg width="36" height="36" viewBox="0 0 36 36" fill="none">
          <path d="M5 8h26v16a2 2 0 01-2 2H7a2 2 0 01-2-2V8z" stroke="currentColor" strokeWidth="1.25"/>
          <path d="M5 8l13 10L31 8" stroke="currentColor" strokeWidth="1.25"/>
          <rect x="11" y="21" width="8" height="2" rx="1" fill="currentColor" opacity="0.3"/>
        </svg>
        <p>No messages yet.</p>
        <p style={{ opacity: 0.5, fontSize: '0.72rem' }}>
          Messages are end-to-end encrypted.
        </p>
      </div>
    );
  }

  // Build items with date separators
  type Item = { type: 'date'; label: string } | { type: 'msg'; msg: Message };
  const items: Item[] = [];
  let lastDate = '';
  for (const msg of messages) {
    const d = new Date(msg.createdAt).toDateString();
    if (d !== lastDate) { items.push({ type: 'date', label: formatDateSep(new Date(msg.createdAt)) }); lastDate = d; }
    items.push({ type: 'msg', msg });
  }

  return (
    <div className="message-list">
      {items.map((item, idx) => {
        if (item.type === 'date') {
          return (
            <div key={`d-${idx}`} className="message-date-separator">
              <span>{item.label}</span>
            </div>
          );
        }

        const { msg } = item;
        const isOwn = msg.senderId === currentUserId;
        const isOptimistic = msg.id.startsWith('opt-');
        const isError = !isOptimistic && msg.content.startsWith('[') && msg.content.endsWith(']');
        const isExpiringSoon = !isError && !isOptimistic &&
          (new Date(msg.expiresAt).getTime() - Date.now()) < 3_600_000;

        // Consecutive grouping
        const prevItem = items[idx - 1];
        const prevMsg = prevItem?.type === 'msg' ? prevItem.msg : null;
        const isGrouped = prevMsg && prevMsg.senderId === msg.senderId;

        return (
          <div
            key={msg.id}
            className={`message-row ${isOwn ? 'message-row--own' : 'message-row--other'}`}
            style={{ marginTop: isGrouped ? '2px' : '10px' }}
          >
            <div className={[
              'message-bubble',
              isOwn ? 'message-bubble--own' : 'message-bubble--other',
              isError ? 'message-bubble--error' : '',
              isOptimistic ? 'message-bubble--pending' : '',
            ].join(' ').trim()}>
              <p className="message-text">{msg.content}</p>
              <div className="message-meta">
                <span className="message-time">{formatTime(new Date(msg.createdAt))}</span>
                {isExpiringSoon && (
                  <span className="message-expiring" title="Expires soon">
                    <svg width="9" height="9" viewBox="0 0 10 10" fill="none">
                      <circle cx="5" cy="5" r="4" stroke="currentColor" strokeWidth="1"/>
                      <path d="M5 2.5V5l1.5 1" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  </span>
                )}
                {isOwn && !isError && (
                  isOptimistic ? (
                    <svg width="11" height="11" viewBox="0 0 11 11" fill="none" style={{ opacity: 0.35 }}>
                      <circle cx="5.5" cy="5.5" r="4.5" stroke="currentColor" strokeWidth="1"/>
                      <path d="M5.5 3v2.5L7 7" stroke="currentColor" strokeWidth="1" strokeLinecap="round"/>
                    </svg>
                  ) : (
                    <svg width="13" height="13" viewBox="0 0 13 13" fill="none" style={{ opacity: 0.55 }}>
                      <path d="M2 6.5l3 3 6-6" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  )
                )}
              </div>
            </div>
          </div>
        );
      })}
      <div ref={bottomRef} style={{ height: 1 }} />
    </div>
  );
}
