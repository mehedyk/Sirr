import { useState } from 'react';

interface MessageInputProps {
  onSend: (message: string) => void;
  disabled?: boolean;
}

export function MessageInput({ onSend, disabled }: MessageInputProps) {
  const [message, setMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (message.trim() && !disabled) {
      onSend(message.trim());
      setMessage('');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-t border-[var(--color-border)]">
      <div className="flex gap-2">
        <input
          type="text"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          disabled={disabled}
          className="flex-1 px-4 py-2 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)] disabled:opacity-50"
          style={{ fontFamily: 'var(--font-body)' }}
        />
        <button
          type="submit"
          disabled={disabled || !message.trim()}
          className="px-6 py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-semibold rounded hover:opacity-90 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          Send
        </button>
      </div>
    </form>
  );
}
