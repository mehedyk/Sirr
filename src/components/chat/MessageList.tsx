import { Message } from '@/domain/models/Message';
import { useAuthStore } from '@/store/authStore';

interface MessageListProps {
  messages: Message[];
}

export function MessageList({ messages }: MessageListProps) {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-4">
      {messages.map((message) => {
        const isOwn = message.senderId === user?.id;
        return (
          <div
            key={message.id}
            className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                isOwn
                  ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                  : 'bg-[var(--color-background-secondary)] text-[var(--color-text)]'
              }`}
              style={{ fontFamily: 'var(--font-body)' }}
            >
              <p className="text-sm">{message.content}</p>
              <p className="text-xs mt-1 opacity-70">
                {new Date(message.createdAt).toLocaleTimeString()}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
}
