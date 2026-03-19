import { create } from 'zustand';

interface TypingState {
  // conversationId → Set of usernames currently typing
  typing: Record<string, Set<string>>;
  setTyping: (conversationId: string, username: string, isTyping: boolean) => void;
  getTyping: (conversationId: string) => string[];
}

export const useTypingStore = create<TypingState>((set, get) => ({
  typing: {},

  setTyping: (conversationId, username, isTyping) => {
    set((s) => {
      const current = new Set(s.typing[conversationId] ?? []);
      if (isTyping) current.add(username);
      else current.delete(username);
      return { typing: { ...s.typing, [conversationId]: current } };
    });
  },

  getTyping: (conversationId) => {
    return Array.from(get().typing[conversationId] ?? []);
  },
}));
