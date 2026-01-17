import { useState } from 'react';
import { useAuthStore } from '@/store/authStore';
import { validateEmail, validateUsername, validatePassword } from '@/utils/validators';

export function SignUp() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [username, setUsername] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const signUp = useAuthStore((state) => state.signUp);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateEmail(email)) {
      setError('Invalid email address');
      setLoading(false);
      return;
    }

    if (!validateUsername(username)) {
      setError('Username must be 3-20 characters, alphanumeric and underscores only');
      setLoading(false);
      return;
    }

    if (!validatePassword(password)) {
      setError('Password must be at least 8 characters');
      setLoading(false);
      return;
    }

    try {
      await signUp(email, password, username);
    } catch (err: any) {
      setError(err.message || 'Failed to sign up');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: 'var(--font-heading)' }}>
          Create Account
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="username" className="block mb-2 text-sm">
              Username
            </label>
            <input
              id="username"
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div>
            <label htmlFor="email" className="block mb-2 text-sm">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          <div>
            <label htmlFor="password" className="block mb-2 text-sm">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-[var(--color-background-secondary)] border border-[var(--color-border)] rounded focus:outline-none focus:border-[var(--color-primary)]"
              style={{ fontFamily: 'var(--font-body)' }}
            />
          </div>
          {error && (
            <div className="text-red-500 text-sm">{error}</div>
          )}
          <button
            type="submit"
            disabled={loading}
            className="w-full py-2 bg-[var(--color-primary)] text-[var(--color-background)] font-semibold rounded hover:opacity-90 disabled:opacity-50"
            style={{ fontFamily: 'var(--font-heading)' }}
          >
            {loading ? 'Creating account...' : 'Sign Up'}
          </button>
        </form>
      </div>
    </div>
  );
}
