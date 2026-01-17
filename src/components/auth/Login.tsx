import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';
import { validateEmail } from '@/utils/validators';

export function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const signIn = useAuthStore((state) => state.signIn);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!validateEmail(email)) {
      setError('Invalid email address');
      setLoading(false);
      return;
    }

    try {
      await signIn(email, password);
      // Redirect to dashboard after successful sign in
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Failed to sign in');
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--color-background)] p-4">
      <div className="w-full max-w-md">
        <h1 className="text-3xl font-bold mb-8 text-center" style={{ fontFamily: 'var(--font-heading)' }}>
          Sirr (سرّ)
        </h1>
        <form onSubmit={handleSubmit} className="space-y-4">
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
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-[var(--color-text-secondary)]">
            Don't have an account?{' '}
            <Link
              to="/signup"
              className="text-[var(--color-primary)] hover:underline font-medium"
            >
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
