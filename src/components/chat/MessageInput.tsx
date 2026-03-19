import { useState, useRef, useCallback } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  onTyping?: () => void;
  onStoppedTyping?: () => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, onTyping, onStoppedTyping, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');
  const stopTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    onTyping?.();
    if (stopTimer.current) clearTimeout(stopTimer.current);
    stopTimer.current = setTimeout(() => onStoppedTyping?.(), 2500);
  };

  const handleSubmit = useCallback(() => {
    const trimmed = message.trim();
    if (!trimmed || disabled) return;
    onSend(trimmed);
    setMessage('');
    onStoppedTyping?.();
    if (stopTimer.current) clearTimeout(stopTimer.current);
  }, [message, disabled, onSend, onStoppedTyping]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  const handleInput = (e: React.FormEvent<HTMLTextAreaElement>) => {
    const el = e.currentTarget;
    el.style.height = 'auto';
    el.style.height = Math.min(el.scrollHeight, 120) + 'px';
  };

  return (
    <div className="message-input-wrap">
      <div className="message-input-inner">
        <textarea
          value={message}
          onChange={handleChange}
          onKeyDown={handleKeyDown}
          onInput={handleInput}
          placeholder="Message… (Enter to send, Shift+Enter for newline)"
          disabled={disabled}
          rows={1}
          className="message-input-textarea"
          aria-label="Message input"
        />
        <button
          onClick={handleSubmit}
          disabled={disabled || !message.trim()}
          className="message-send-btn"
          aria-label="Send message"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M2 8l12-6-6 12V9L2 8z" stroke="currentColor" strokeWidth="1.25" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>
      <div className="message-input-hint">
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
          <rect x="1.5" y="4" width="7" height="4.5" rx="1" stroke="currentColor" strokeWidth="1"/>
          <path d="M3 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1"/>
        </svg>
        End-to-end encrypted
      </div>
    </div>
  );
}
