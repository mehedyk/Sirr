import { useEffect, useState } from 'react';
import { Message } from '@/domain/models/Message';
import { MessageList } from './MessageList';
import { MessageInput } from './MessageInput';
import { MessageService } from '@/services/MessageService';
import { supabaseAdapter } from '@/lib/supabase';

interface ChatWindowProps {
  conversationId: string;
  userId: string;
}

export function ChatWindow({ conversationId, userId }: ChatWindowProps) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const messageService = new MessageService(supabaseAdapter);

  useEffect(() => {
    // Load messages
    messageService.getMessages(conversationId).then((msgs) => {
      setMessages(msgs);
      setLoading(false);
    });

    // Subscribe to new messages
    const subscription = messageService.subscribeToMessages(conversationId, (newMessage) => {
      setMessages((prev) => [...prev, newMessage]);
    });

    return () => {
      // Cleanup subscription
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, [conversationId]);

  const handleSend = async (content: string) => {
    try {
      const message = await messageService.sendMessage(conversationId, userId, content);
      setMessages((prev) => [...prev, message]);
    } catch (error) {
      console.error('Failed to send message:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <p>Loading messages...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      <MessageList messages={messages} />
      <MessageInput onSend={handleSend} />
    </div>
  );
}
