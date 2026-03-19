/**
 * useMessageSearch — client-side full-text search over decrypted messages.
 *
 * We NEVER send plaintext to the server to search — it's E2E encrypted.
 * Search runs entirely in the browser over the already-decrypted message list.
 */
import { useMemo, useState } from 'react';
import { Message } from '@/domain/models/Message';

export function useMessageSearch(messages: Message[]) {
  const [query, setQuery] = useState('');

  const results = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q || q.length < 2) return null; // null = no active search
    return messages.filter(
      (m) =>
        !m.content.startsWith('[') && // skip error/unavailable messages
        m.content.toLowerCase().includes(q)
    );
  }, [query, messages]);

  const isSearching = query.trim().length >= 2;

  return { query, setQuery, results, isSearching };
}
