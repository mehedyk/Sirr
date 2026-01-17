import { Conversation } from '@/domain/models/Conversation';
import { useAuthStore } from '@/store/authStore';

interface GroupListProps {
  groups: Conversation[];
  onSelectGroup: (groupId: string) => void;
  selectedGroupId?: string;
}

export function GroupList({ groups, onSelectGroup, selectedGroupId }: GroupListProps) {
  return (
    <div className="w-64 border-r border-[var(--color-border)] bg-[var(--color-background-secondary)] p-4">
      <h2 className="text-lg font-semibold mb-4" style={{ fontFamily: 'var(--font-heading)' }}>
        Groups
      </h2>
      <div className="space-y-2">
        {groups.map((group) => (
          <button
            key={group.id}
            onClick={() => onSelectGroup(group.id)}
            className={`w-full text-left px-4 py-2 rounded ${
              selectedGroupId === group.id
                ? 'bg-[var(--color-primary)] text-[var(--color-background)]'
                : 'bg-[var(--color-background)] hover:bg-[var(--color-background-secondary)]'
            }`}
            style={{ fontFamily: 'var(--font-body)' }}
          >
            {group.name || `Group ${group.id.slice(0, 8)}`}
          </button>
        ))}
      </div>
    </div>
  );
}
