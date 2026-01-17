import { useState } from 'react';
import { supabaseAdapter } from '@/lib/supabase';

interface CreateGroupProps {
  onGroupCreated: () => void;
}

export function CreateGroup({ onGroupCreated }: CreateGroupProps) {
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await supabaseAdapter.createConversation('group', name);
      setName('');
      onGroupCreated();
    } catch (err: any) {
      setError(err.message || 'Failed to create group');
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="p-4 border-b border-[var(--color-border)]">
      <div className="flex gap-2">
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Group name..."
          required
          className="flex-1 px-4 py-2 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
          style={{ fontFamily: 'var(--font-body)' }}
        />
        <button
          type="submit"
          disabled={loading}
          className="px-4 py-2 bg-[var(--color-primary)] text-[var(--color-background)] rounded hover:opacity-90 disabled:opacity-50"
          style={{ fontFamily: 'var(--font-heading)' }}
        >
          {loading ? 'Creating...' : 'Create'}
        </button>
      </div>
      {error && <div className="text-red-500 text-sm mt-2">{error}</div>}
    </form>
  );
}
