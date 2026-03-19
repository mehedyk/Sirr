import { useState, useRef, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { validateEmail } from '@/utils/validators';

const MAX_ATTEMPTS = 5;
const BASE_LOCKOUT_MS = 30_000; // 30s, doubles each lockout

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [attempts, setAttempts] = useState(0);
  const [lockedUntil, setLockedUntil] = useState<number | null>(null);
  const [lockCountdown, setLockCountdown] = useState(0);
  const [showPassword, setShowPassword] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ email: false, password: false });

  const signIn = useAuthStore((s) => s.signIn);
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Countdown ticker
  useEffect(() => {
    if (lockedUntil) {
      timerRef.current = setInterval(() => {
        const remaining = Math.ceil((lockedUntil - Date.now()) / 1000);
        if (remaining <= 0) {
          setLockedUntil(null);
          setLockCountdown(0);
          clearInterval(timerRef.current!);
        } else {
          setLockCountdown(remaining);
        }
      }, 500);
    }
    return () => clearInterval(timerRef.current!);
  }, [lockedUntil]);

  // If already authenticated, redirect
  useEffect(() => {
    if (status === 'authenticated') navigate('/dashboard', { replace: true });
  }, [status, navigate]);

  const isLocked = lockedUntil !== null && Date.now() < lockedUntil;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setFieldErrors({ email: false, password: false });

    if (isLocked) return;

    // Client-side validation
    const fe = { email: !validateEmail(email), password: password.length < 1 };
    if (fe.email || fe.password) {
      setFieldErrors(fe);
      setError(fe.email ? 'Enter a valid email address.' : 'Password is required.');
      return;
    }

    setLoading(true);
    try {
      await signIn(email, password);
      setAttempts(0);
      navigate('/dashboard', { replace: true });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Sign in failed';
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);

      if (newAttempts >= MAX_ATTEMPTS) {
        const lockMs = BASE_LOCKOUT_MS * Math.pow(2, Math.floor(newAttempts / MAX_ATTEMPTS) - 1);
        const until = Date.now() + lockMs;
        setLockedUntil(until);
        setError(`Too many failed attempts. Try again in ${Math.ceil(lockMs / 1000)}s.`);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(
          msg.includes('Invalid login credentials')
            ? `Invalid credentials. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`
            : msg
        );
        setFieldErrors({ email: false, password: true });
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Ambient background */}
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
        <div className="auth-bg__grid" />
      </div>

      <div className="auth-card">
        {/* Logo / wordmark */}
        <div className="auth-logo">
          <span className="auth-logo__arabic">سرّ</span>
          <span className="auth-logo__latin">SIRR</span>
        </div>
        <p className="auth-tagline">End-to-end encrypted. Zero knowledge.</p>

        {status === 'email-unconfirmed' ? (
          <div className="auth-notice auth-notice--info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4M10 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <strong>Check your email</strong>
              <p>A confirmation link was sent. Verify your email then sign in.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Email */}
            <div className={`auth-field ${fieldErrors.email ? 'auth-field--error' : ''}`}>
              <label htmlFor="email" className="auth-label">Email</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="1" y="3" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M1 6l7 4 7-4" stroke="currentColor" strokeWidth="1.25"/>
                </svg>
                <input
                  id="email"
                  type="email"
                  autoComplete="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setFieldErrors(p => ({ ...p, email: false })); }}
                  className="auth-input"
                  placeholder="you@example.com"
                  disabled={loading || isLocked}
                  aria-invalid={fieldErrors.email}
                />
              </div>
            </div>

            {/* Password */}
            <div className={`auth-field ${fieldErrors.password ? 'auth-field--error' : ''}`}>
              <label htmlFor="password" className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.25"/>
                  <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="current-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: false })); }}
                  className="auth-input"
                  placeholder="••••••••"
                  disabled={loading || isLocked}
                  aria-invalid={fieldErrors.password}
                />
                <button
                  type="button"
                  className="auth-input-toggle"
                  onClick={() => setShowPassword(p => !p)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  tabIndex={-1}
                >
                  {showPassword ? (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.25"/>
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
                      <line x1="3" y1="3" x2="13" y2="13" stroke="currentColor" strokeWidth="1.25"/>
                    </svg>
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                      <path d="M2 8s2.5-4 6-4 6 4 6 4-2.5 4-6 4-6-4-6-4z" stroke="currentColor" strokeWidth="1.25"/>
                      <circle cx="8" cy="8" r="1.5" stroke="currentColor" strokeWidth="1.25"/>
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className={`auth-error ${isLocked ? 'auth-error--locked' : ''}`} role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M7 4v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
                {isLocked ? `Account locked. Retry in ${lockCountdown}s.` : error}
              </div>
            )}

            {/* Attempt bar */}
            {attempts > 0 && attempts < MAX_ATTEMPTS && (
              <div className="auth-attempts" aria-label="Failed login attempts">
                {Array.from({ length: MAX_ATTEMPTS }).map((_, i) => (
                  <span
                    key={i}
                    className={`auth-attempts__dot ${i < attempts ? 'auth-attempts__dot--used' : ''}`}
                  />
                ))}
              </div>
            )}

            <button
              type="submit"
              className="auth-btn"
              disabled={loading || isLocked}
            >
              {loading ? (
                <span className="auth-btn__spinner" />
              ) : isLocked ? (
                `Locked — ${lockCountdown}s`
              ) : (
                'Sign In'
              )}
            </button>
          </form>
        )}

        <div className="auth-footer">
          <span>No account?</span>
          <Link to="/signup" className="auth-link">Create one →</Link>
        </div>

        <div className="auth-e2e-badge">
          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
            <rect x="2" y="5.5" width="8" height="5" rx="1" stroke="currentColor" strokeWidth="1"/>
            <path d="M4 5.5V4a2 2 0 014 0v1.5" stroke="currentColor" strokeWidth="1"/>
          </svg>
          E2E encrypted
        </div>
      </div>
    </div>
  );
}
