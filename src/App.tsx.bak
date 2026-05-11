import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { useSupabase } from '@/hooks/useSupabase';
import { useTheme } from '@/hooks/useTheme';
import { useSessionGuard } from '@/hooks/useSessionGuard';
import { Login } from './components/auth/Login';
import { SignUp } from './components/auth/SignUp';
import { Dashboard } from './components/layout/Dashboard';
import { Landing } from './components/landing/Landing';
import { NotFound } from './components/common/NotFound';
import { ToastContainer } from './components/ui/Toast';
import { ErrorBoundary } from './components/ui/ErrorBoundary';
import './styles/index.css';

function Spinner() {
  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center',
      justifyContent: 'center', background: 'var(--color-background)', gap: '0.75rem',
    }}>
      <span style={{
        width: 20, height: 20,
        border: '2px solid var(--color-border)',
        borderTopColor: 'var(--color-primary)',
        borderRadius: '50%',
        animation: 'spin 0.7s linear infinite',
        display: 'inline-block',
      }} />
      <span style={{
        fontFamily: 'var(--font-body)', fontSize: '0.78rem',
        color: 'var(--color-text-secondary)', letterSpacing: '0.12em', opacity: 0.5,
      }}>
        LOADING
      </span>
    </div>
  );
}

function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <Spinner />;
  if (status === 'unauthenticated' || status === 'email-unconfirmed')
    return <Navigate to="/login" replace />;
  return <>{children}</>;
}

function AuthRoute({ children }: { children: React.ReactNode }) {
  const status = useAuthStore((s) => s.status);
  if (status === 'loading') return <Spinner />;
  if (status === 'authenticated') return <Navigate to="/dashboard" replace />;
  return <>{children}</>;
}

function AuthenticatedShell({ children }: { children: React.ReactNode }) {
  useSessionGuard();
  return <>{children}</>;
}

function AppRoutes() {
  useSupabase();
  const { currentTheme } = useTheme();
  useEffect(() => { if (currentTheme) currentTheme.apply(); }, [currentTheme]);

  return (
    <Routes>
      <Route path="/"         element={<Landing />} />
      <Route path="/login"    element={<AuthRoute><Login /></AuthRoute>} />
      <Route path="/signup"   element={<AuthRoute><SignUp /></AuthRoute>} />
      <Route path="/dashboard" element={
        <ProtectedRoute>
          <AuthenticatedShell><Dashboard /></AuthenticatedShell>
        </ProtectedRoute>
      } />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <AppRoutes />
        <ToastContainer />
      </BrowserRouter>
    </ErrorBoundary>
  );
}
