import { useEffect, useState } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSupabase } from '@/hooks/useSupabase';
import { useTheme } from '@/hooks/useTheme';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { ChatWindow } from './components/chat/ChatWindow';
import { ThemeSwitcher } from './components/theme/ThemeSwitcher';
import './styles/index.css';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const user = useAuthStore((state) => state.user);
  const loading = useAuthStore((state) => state.loading);

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center">Loading...</div>;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

function Dashboard() {
  const user = useAuthStore((state) => state.user);
  const signOut = useAuthStore((state) => state.signOut);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const handleSignOut = async () => {
    await signOut();
  };

  // For demo purposes, create a default conversation
  useEffect(() => {
    // In a real app, you'd fetch or create conversations here
    // For now, we'll use a placeholder
    setConversationId('demo-conversation-id');
  }, []);

  if (!conversationId || !user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--color-background)]">
      <header className="p-4 border-b border-[var(--color-border)] flex justify-between items-center">
        <h1 className="text-xl font-bold" style={{ fontFamily: 'var(--font-heading)' }}>
          Sirr (سرّ)
        </h1>
        <div className="flex items-center gap-4">
          <span className="text-sm" style={{ fontFamily: 'var(--font-body)' }}>
            {user.username}
          </span>
          <ThemeSwitcher />
          <button
            onClick={handleSignOut}
            className="px-4 py-2 bg-[var(--color-secondary)] rounded hover:opacity-90"
            style={{ fontFamily: 'var(--font-body)' }}
          >
            Sign Out
          </button>
        </div>
      </header>
      <main className="flex-1 overflow-hidden">
        <ChatWindow conversationId={conversationId} userId={user.id} />
      </main>
    </div>
  );
}

function App() {
  useSupabase();
  const { currentTheme } = useTheme();

  useEffect(() => {
    if (currentTheme) {
      currentTheme.apply();
    }
  }, [currentTheme]);

  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<SignUp />} />
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
