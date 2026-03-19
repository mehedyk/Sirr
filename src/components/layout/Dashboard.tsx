import { useEffect, useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { useConversationStore } from '@/store/conversationStore';
import { Sidebar } from '@/components/sidebar/Sidebar';
import { ChatWindow } from '@/components/chat/ChatWindow';

export function Dashboard() {
  const user = useAuthStore((s) => s.user);
  const { activeConversationId, setActiveConversation } = useConversationStore();
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  if (!user) return null;

  const handleConversationSelect = (id: string) => {
    setActiveConversation(id);
    setMobileSidebarOpen(false);
  };

  return (
    <div className="dashboard">
      {/* Mobile sidebar backdrop */}
      {mobileSidebarOpen && (
        <div
          className="dashboard-backdrop"
          onClick={() => setMobileSidebarOpen(false)}
          aria-hidden="true"
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`dashboard-sidebar-wrap ${mobileSidebarOpen ? 'dashboard-sidebar-wrap--open' : ''}`}>
        <Sidebar onConversationSelect={handleConversationSelect} />
      </div>

      {/* Main area */}
      <main className="dashboard-main">
        {activeConversationId ? (
          <>
            {/* Mobile back button */}
            <button
              className="dashboard-mobile-back"
              onClick={() => { setActiveConversation(null); setMobileSidebarOpen(true); }}
              aria-label="Back to conversations"
            >
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M10 3L5 8l5 5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </button>
            <ChatWindow
              conversationId={activeConversationId}
              userId={user.id}
            />
          </>
        ) : (
          <div className="dashboard-empty">
            <div className="dashboard-empty-content">
              <div className="dashboard-empty-logo">
                <span className="dashboard-empty-logo__arabic">سرّ</span>
              </div>
              <h2 className="dashboard-empty-title">Sirr</h2>
              <p className="dashboard-empty-subtitle">
                Private conversations. Zero knowledge.<br />
                Select a chat or start a new one.
              </p>
              <div className="dashboard-empty-features">
                <div className="dashboard-empty-feature">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <rect x="2.5" y="7" width="11" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                    <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.25"/>
                    <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
                  </svg>
                  X25519 + AES-256-GCM encryption
                </div>
                <div className="dashboard-empty-feature">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <circle cx="8" cy="8" r="6.5" stroke="currentColor" strokeWidth="1.25"/>
                    <path d="M8 4v4l2.5 2" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                  </svg>
                  Messages auto-expire after 72 hours
                </div>
                <div className="dashboard-empty-feature">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                    <path d="M8 1.5L1 5v4c0 3.314 3 6 7 6s7-2.686 7-6V5L8 1.5z" stroke="currentColor" strokeWidth="1.25"/>
                    <path d="M5.5 8l2 2 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  Keys never leave your device
                </div>
              </div>
            </div>

            {/* Mobile: show conversations button */}
            <button
              className="dashboard-mobile-open-sidebar"
              onClick={() => setMobileSidebarOpen(true)}
            >
              <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                <path d="M3 4h12M3 9h12M3 14h7" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
              </svg>
              View Conversations
            </button>
          </div>
        )}
      </main>
    </div>
  );
}
