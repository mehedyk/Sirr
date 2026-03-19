import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConversationStore, UserSearchResult } from '@/store/conversationStore';
import { toast } from '@/store/toastStore';
import { ThemeSwitcher } from '@/components/theme/ThemeSwitcher';

interface SidebarProps {
  onConversationSelect?: (id: string) => void;
}

type Panel = 'conversations' | 'search' | 'new-group';

export function Sidebar({ onConversationSelect }: SidebarProps) {
  const user = useAuthStore((s) => s.user);
  const signOut = useAuthStore((s) => s.signOut);

  const {
    conversations,
    activeConversationId,
    loadingConversations,
    fetchConversations,
    setActiveConversation,
    searchUsers,
    startDirectMessage,
    createGroup,
  } = useConversationStore();

  const [panel, setPanel] = useState<Panel>('conversations');
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<UserSearchResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [groupMembers, setGroupMembers] = useState<UserSearchResult[]>([]);
  const [groupSearch, setGroupSearch] = useState('');
  const [groupSearchResults, setGroupSearchResults] = useState<UserSearchResult[]>([]);
  const [creatingGroup, setCreatingGroup] = useState(false);
  const searchTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    if (user) fetchConversations(user.id);
  }, [user?.id]);

  // DM user search with debounce
  useEffect(() => {
    if (panel !== 'search') return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (searchQuery.trim().length < 2) { setSearchResults([]); return; }

    setSearching(true);
    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(searchQuery, user!.id);
      setSearchResults(results);
      setSearching(false);
    }, 300);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [searchQuery, panel]);

  // Group member search with debounce
  useEffect(() => {
    if (panel !== 'new-group') return;
    if (searchTimeout.current) clearTimeout(searchTimeout.current);
    if (groupSearch.trim().length < 2) { setGroupSearchResults([]); return; }

    searchTimeout.current = setTimeout(async () => {
      const results = await searchUsers(groupSearch, user!.id);
      setGroupSearchResults(results.filter((r) => !groupMembers.some((m) => m.id === r.id)));
    }, 300);

    return () => { if (searchTimeout.current) clearTimeout(searchTimeout.current); };
  }, [groupSearch, panel, groupMembers]);

  const handleSelectConversation = (id: string) => {
    setActiveConversation(id);
    onConversationSelect?.(id);
  };

  const handleStartDM = async (otherUser: UserSearchResult) => {
    if (!user) return;
    try {
      const id = await startDirectMessage(user.id, otherUser);
      onConversationSelect?.(id);
      setPanel('conversations');
      setSearchQuery('');
      setSearchResults([]);
    } catch {
      toast.error('Could not start conversation');
    }
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || groupMembers.length === 0) return;
    setCreatingGroup(true);
    try {
      const memberIds = groupMembers.map((m) => m.id);
      const id = await createGroup(user.id, groupName.trim(), memberIds);
      onConversationSelect?.(id);
      setPanel('conversations');
      setGroupName('');
      setGroupMembers([]);
      toast.success(`Group "${groupName.trim()}" created`);
    } catch {
      toast.error('Failed to create group');
    } finally {
      setCreatingGroup(false);
    }
  };

  const displayName = (conv: typeof conversations[0]) => {
    if (conv.type === 'direct') return conv.otherUser?.username ?? 'Unknown';
    return conv.name ?? 'Unnamed group';
  };

  const initials = (name: string) =>
    name.split(/[\s_]/).map((p) => p[0]?.toUpperCase() ?? '').slice(0, 2).join('');

  const formatTime = (iso?: string) => {
    if (!iso) return '';
    const d = new Date(iso);
    const now = new Date();
    const diff = (now.getTime() - d.getTime()) / 1000;
    if (diff < 60) return 'now';
    if (diff < 3600) return `${Math.floor(diff / 60)}m`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h`;
    return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
  };

  return (
    <aside className="sidebar">
      {/* ── Header ── */}
      <div className="sidebar-header">
        <div className="sidebar-logo">
          <span className="sidebar-logo__arabic">سرّ</span>
          <span className="sidebar-logo__latin">SIRR</span>
        </div>
        <div className="sidebar-header-actions">
          <ThemeSwitcher compact />
          <button
            className="sidebar-icon-btn"
            onClick={() => setPanel(panel === 'search' ? 'conversations' : 'search')}
            title="New message"
            aria-label="New message"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <path d="M13 2H3a1 1 0 00-1 1v8a1 1 0 001 1h2v2l3-2h5a1 1 0 001-1V3a1 1 0 00-1-1z" stroke="currentColor" strokeWidth="1.25"/>
              <path d="M8 6v4M6 8h4" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
            </svg>
          </button>
          <button
            className="sidebar-icon-btn"
            onClick={() => setPanel(panel === 'new-group' ? 'conversations' : 'new-group')}
            title="New group"
            aria-label="New group"
          >
            <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
              <circle cx="6" cy="5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
              <circle cx="11.5" cy="5.5" r="2" stroke="currentColor" strokeWidth="1.25"/>
              <path d="M1 13c0-2.21 2.239-4 5-4s5 1.79 5 4" stroke="currentColor" strokeWidth="1.25"/>
              <path d="M11.5 9c1.657 0 3 1.12 3 2.5" stroke="currentColor" strokeWidth="1.25"/>
            </svg>
          </button>
        </div>
      </div>

      {/* ── User chip ── */}
      <div className="sidebar-user">
        <div className="sidebar-avatar sidebar-avatar--sm" style={{ background: 'var(--color-primary)' }}>
          {initials(user?.username ?? 'U')}
        </div>
        <span className="sidebar-username">{user?.username}</span>
        <button className="sidebar-signout" onClick={signOut} title="Sign out">
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
            <path d="M5 2H2a1 1 0 00-1 1v8a1 1 0 001 1h3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
            <path d="M9 4l3 3-3 3M12 7H5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </button>
      </div>

      {/* ── Panels ── */}
      <div className="sidebar-body">

        {/* Conversation list */}
        {panel === 'conversations' && (
          <div className="sidebar-panel">
            <div className="sidebar-section-label">Messages</div>
            {loadingConversations ? (
              <div className="sidebar-loading">
                {[1,2,3].map((i) => (
                  <div key={i} className="sidebar-skeleton">
                    <div className="sidebar-skeleton__avatar" />
                    <div className="sidebar-skeleton__lines">
                      <div className="sidebar-skeleton__line sidebar-skeleton__line--wide" />
                      <div className="sidebar-skeleton__line" />
                    </div>
                  </div>
                ))}
              </div>
            ) : conversations.length === 0 ? (
              <div className="sidebar-empty">
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none">
                  <path d="M4 6h24v16a2 2 0 01-2 2H6a2 2 0 01-2-2V6z" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M4 6l12 9 12-9" stroke="currentColor" strokeWidth="1.25"/>
                </svg>
                <p>No conversations yet.</p>
                <p>Hit <strong>+</strong> to start one.</p>
              </div>
            ) : (
              <div className="sidebar-list">
                {conversations.map((conv) => {
                  const isActive = conv.id === activeConversationId;
                  const name = displayName(conv);
                  return (
                    <button
                      key={conv.id}
                      className={`sidebar-conv-item ${isActive ? 'sidebar-conv-item--active' : ''}`}
                      onClick={() => handleSelectConversation(conv.id)}
                    >
                      <div
                        className="sidebar-avatar"
                        style={{
                          background: isActive ? 'var(--color-primary)' : 'var(--color-background)',
                          color: isActive ? 'var(--color-background)' : 'var(--color-text)',
                        }}
                      >
                        {conv.type === 'group' ? (
                          <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                            <circle cx="5" cy="4" r="2" stroke="currentColor" strokeWidth="1.1"/>
                            <circle cx="10" cy="4.5" r="1.5" stroke="currentColor" strokeWidth="1.1"/>
                            <path d="M1 11c0-1.657 1.79-3 4-3s4 1.343 4 3" stroke="currentColor" strokeWidth="1.1"/>
                            <path d="M10 7.5c1.3 0 2.5.9 2.5 2" stroke="currentColor" strokeWidth="1.1"/>
                          </svg>
                        ) : initials(name)}
                      </div>
                      <div className="sidebar-conv-info">
                        <div className="sidebar-conv-top">
                          <span className="sidebar-conv-name">{name}</span>
                          <span className="sidebar-conv-time">{formatTime(conv.lastMessageAt ?? conv.updatedAt)}</span>
                        </div>
                        <div className="sidebar-conv-preview">
                          {conv.lastMessagePreview ?? (
                            <span style={{ opacity: 0.35 }}>No messages yet</span>
                          )}
                          {conv.unreadCount > 0 && (
                            <span className="sidebar-unread-badge">{conv.unreadCount}</span>
                          )}
                        </div>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* New DM search */}
        {panel === 'search' && (
          <div className="sidebar-panel">
            <div className="sidebar-panel-header">
              <span>New Message</span>
              <button className="sidebar-icon-btn" onClick={() => { setPanel('conversations'); setSearchQuery(''); setSearchResults([]); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
              </button>
            </div>
            <div className="sidebar-search-wrap">
              <svg className="sidebar-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
                <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
              </svg>
              <input
                className="sidebar-search-input"
                type="text"
                placeholder="Search by username…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                autoFocus
              />
              {searching && <span className="sidebar-spinner" />}
            </div>
            <div className="sidebar-list">
              {searchResults.length === 0 && searchQuery.length >= 2 && !searching && (
                <div className="sidebar-empty" style={{ padding: '1rem' }}>
                  <p>No users found for <strong>"{searchQuery}"</strong></p>
                </div>
              )}
              {searchQuery.length < 2 && (
                <div className="sidebar-empty" style={{ padding: '1rem', opacity: 0.4 }}>
                  <p>Type at least 2 characters</p>
                </div>
              )}
              {searchResults.map((u) => (
                <button key={u.id} className="sidebar-user-result" onClick={() => handleStartDM(u)}>
                  <div className="sidebar-avatar" style={{ background: 'var(--color-background)', fontSize: '0.7rem' }}>
                    {initials(u.username)}
                  </div>
                  <div>
                    <div style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                      {u.username}
                    </div>
                    {!u.publicKey && (
                      <div style={{ fontSize: '0.68rem', color: '#fbbf24', marginTop: '2px' }}>
                        No encryption key — messages may not be E2E encrypted
                      </div>
                    )}
                  </div>
                  <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 'auto', color: 'var(--color-text-secondary)' }}>
                    <path d="M3 7h8M8 4l3 3-3 3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* New group */}
        {panel === 'new-group' && (
          <div className="sidebar-panel">
            <div className="sidebar-panel-header">
              <span>New Group</span>
              <button className="sidebar-icon-btn" onClick={() => { setPanel('conversations'); setGroupName(''); setGroupMembers([]); }}>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
              </button>
            </div>

            <div style={{ padding: '0 0.75rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              <input
                className="sidebar-search-input"
                style={{ padding: '0.6rem 0.875rem' }}
                type="text"
                placeholder="Group name…"
                value={groupName}
                onChange={(e) => setGroupName(e.target.value)}
                maxLength={40}
              />

              {/* Selected members */}
              {groupMembers.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                  {groupMembers.map((m) => (
                    <span key={m.id} className="group-member-chip">
                      {m.username}
                      <button
                        onClick={() => setGroupMembers((prev) => prev.filter((x) => x.id !== m.id))}
                        aria-label={`Remove ${m.username}`}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', padding: 0 }}
                      >
                        <svg width="10" height="10" viewBox="0 0 10 10" fill="none">
                          <path d="M2 2l6 6M8 2L2 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                        </svg>
                      </button>
                    </span>
                  ))}
                </div>
              )}

              <div className="sidebar-search-wrap">
                <svg className="sidebar-search-icon" width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="6" cy="6" r="4.5" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M10 10l2.5 2.5" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
                <input
                  className="sidebar-search-input"
                  type="text"
                  placeholder="Add members…"
                  value={groupSearch}
                  onChange={(e) => setGroupSearch(e.target.value)}
                />
              </div>
            </div>

            <div className="sidebar-list" style={{ marginTop: '0.5rem' }}>
              {groupSearchResults.map((u) => (
                <button
                  key={u.id}
                  className="sidebar-user-result"
                  onClick={() => { setGroupMembers((p) => [...p, u]); setGroupSearch(''); setGroupSearchResults([]); }}
                >
                  <div className="sidebar-avatar" style={{ background: 'var(--color-background)', fontSize: '0.7rem' }}>
                    {initials(u.username)}
                  </div>
                  <span style={{ fontFamily: 'var(--font-body)', fontSize: '0.85rem', color: 'var(--color-text)' }}>
                    {u.username}
                  </span>
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto', color: 'var(--color-primary)' }}>
                    <path d="M6 1v10M1 6h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  </svg>
                </button>
              ))}
            </div>

            <div style={{ padding: '0.75rem', marginTop: 'auto' }}>
              <button
                className="sidebar-create-btn"
                onClick={handleCreateGroup}
                disabled={creatingGroup || !groupName.trim() || groupMembers.length === 0}
              >
                {creatingGroup ? (
                  <span className="sidebar-spinner" style={{ width: 16, height: 16 }} />
                ) : (
                  `Create Group (${groupMembers.length} member${groupMembers.length !== 1 ? 's' : ''})`
                )}
              </button>
            </div>
          </div>
        )}
      </div>
    </aside>
  );
}
