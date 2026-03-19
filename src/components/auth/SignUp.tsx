import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { validateEmail, validateUsername } from '@/utils/validators';
import { checkPasswordStrength } from '@/services/CryptoService';

// Read store state outside React render to avoid stale closure
const getAuthStatus = () => useAuthStore.getState().status;

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fieldErrors, setFieldErrors] = useState({ username: false, email: false, password: false });

  const signUp = useAuthStore((s) => s.signUp);
  const status = useAuthStore((s) => s.status);
  const navigate = useNavigate();

  const strength = checkPasswordStrength(password);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const fe = {
      username: !validateUsername(username),
      email: !validateEmail(email),
      password: !strength.isValid,
    };
    setFieldErrors(fe);

    if (fe.username) { setError('Username: 3-20 chars, letters, numbers, underscores only.'); return; }
    if (fe.email) { setError('Enter a valid email address.'); return; }
    if (fe.password) { setError(`Password: ${strength.feedback[0] ?? 'not strong enough'}`); return; }

    setLoading(true);
    try {
      await signUp(email, password, username);
      // Read fresh status from store — React state from hook is stale here
      if (getAuthStatus() !== 'email-unconfirmed') {
        navigate('/dashboard', { replace: true });
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Signup failed';
      if (msg.toLowerCase().includes('username')) setFieldErrors(p => ({ ...p, username: true }));
      if (msg.toLowerCase().includes('email')) setFieldErrors(p => ({ ...p, email: true }));
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  const strengthColors = ['#ef4444', '#f97316', '#eab308', '#22c55e', '#16a34a'];
  const strengthColor = password.length > 0 ? strengthColors[strength.score] : 'transparent';

  return (
    <div className="auth-page">
      <div className="auth-bg" aria-hidden="true">
        <div className="auth-bg__orb auth-bg__orb--1" />
        <div className="auth-bg__orb auth-bg__orb--2" />
        <div className="auth-bg__grid" />
      </div>

      <div className="auth-card">
        <div className="auth-logo">
          <span className="auth-logo__arabic">سرّ</span>
          <span className="auth-logo__latin">SIRR</span>
        </div>
        <p className="auth-tagline">Create your encrypted identity.</p>

        {status === 'email-unconfirmed' ? (
          <div className="auth-notice auth-notice--info">
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
              <circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/>
              <path d="M10 6v4M10 13h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
            </svg>
            <div>
              <strong>Almost there — check your email</strong>
              <p>Click the confirmation link we sent to <em>{email}</em>, then sign in.</p>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="auth-form" noValidate>
            {/* Username */}
            <div className={`auth-field ${fieldErrors.username ? 'auth-field--error' : ''}`}>
              <label htmlFor="username" className="auth-label">Username</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <circle cx="8" cy="5.5" r="2.5" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M2 13c0-2.761 2.686-5 6-5s6 2.239 6 5" stroke="currentColor" strokeWidth="1.25"/>
                </svg>
                <input
                  id="username"
                  type="text"
                  autoComplete="username"
                  value={username}
                  onChange={(e) => { setUsername(e.target.value); setFieldErrors(p => ({ ...p, username: false })); }}
                  className="auth-input"
                  placeholder="your_handle"
                  disabled={loading}
                  aria-invalid={fieldErrors.username}
                  maxLength={20}
                />
              </div>
            </div>

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
                  disabled={loading}
                  aria-invalid={fieldErrors.email}
                />
              </div>
            </div>

            {/* Password */}
            <div className={`auth-field ${fieldErrors.password ? 'auth-field--error' : ''}`}>
              <label htmlFor="password" className="auth-label">
                Password
                {password.length > 0 && (
                  <span className="auth-strength-label" style={{ color: strengthColor }}>
                    {strength.label}
                  </span>
                )}
              </label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" width="16" height="16" viewBox="0 0 16 16" fill="none">
                  <rect x="3" y="7" width="10" height="7" rx="1.5" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M5 7V5a3 3 0 016 0v2" stroke="currentColor" strokeWidth="1.25"/>
                  <circle cx="8" cy="10.5" r="1" fill="currentColor"/>
                </svg>
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setFieldErrors(p => ({ ...p, password: false })); }}
                  className="auth-input"
                  placeholder="Min. 12 chars"
                  disabled={loading}
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

              {/* Strength bar */}
              {password.length > 0 && (
                <div className="auth-strength-bar" aria-hidden="true">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      className="auth-strength-bar__segment"
                      style={{
                        backgroundColor: i < strength.score ? strengthColor : undefined,
                        opacity: i < strength.score ? 1 : 0.15,
                      }}
                    />
                  ))}
                </div>
              )}

              {/* Feedback hints */}
              {password.length > 0 && strength.feedback.length > 0 && (
                <ul className="auth-strength-hints">
                  {strength.feedback.map((hint, i) => (
                    <li key={i}>{hint}</li>
                  ))}
                </ul>
              )}
            </div>

            {error && (
              <div className="auth-error" role="alert">
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <circle cx="7" cy="7" r="6" stroke="currentColor" strokeWidth="1.25"/>
                  <path d="M7 4v3M7 9.5h.01" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
                </svg>
                {error}
              </div>
            )}

            <button type="submit" className="auth-btn" disabled={loading}>
              {loading ? <span className="auth-btn__spinner" /> : 'Create Account'}
            </button>

            <p className="auth-disclaimer">
              Your encryption keys are generated locally and your private key never leaves your device.
            </p>
          </form>
        )}

        <div className="auth-footer">
          <span>Have an account?</span>
          <Link to="/login" className="auth-link">Sign in →</Link>
        </div>
      </div>
    </div>
  );
}
