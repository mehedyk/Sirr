import { Component, ReactNode } from 'react';

interface Props { children: ReactNode; }
interface State { hasError: boolean; error: Error | null; }

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error) {
    console.error('[ErrorBoundary]', error);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          gap: '1rem',
          background: 'var(--color-background)',
          color: 'var(--color-text)',
          fontFamily: 'var(--font-body)',
          padding: '2rem',
          textAlign: 'center',
        }}>
          <svg width="48" height="48" viewBox="0 0 48 48" fill="none" style={{ color: '#ef4444', opacity: 0.7 }}>
            <circle cx="24" cy="24" r="22" stroke="currentColor" strokeWidth="2"/>
            <path d="M24 14v12M24 30h.01" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"/>
          </svg>
          <div>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', marginBottom: '0.5rem' }}>
              Something went wrong
            </h2>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-text-secondary)', maxWidth: '360px', marginBottom: '1.5rem' }}>
              {this.state.error?.message ?? 'An unexpected error occurred.'}
            </p>
            <button
              onClick={() => window.location.reload()}
              style={{
                padding: '0.6rem 1.5rem',
                background: 'var(--color-primary)',
                color: 'var(--color-background)',
                border: 'none',
                borderRadius: '8px',
                fontFamily: 'var(--font-heading)',
                fontSize: '0.8rem',
                fontWeight: 700,
                letterSpacing: '0.08em',
                cursor: 'pointer',
              }}
            >
              RELOAD
            </button>
          </div>
        </div>
      );
    }
    return this.props.children;
  }
}
