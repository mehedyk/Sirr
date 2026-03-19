import { useToastStore, Toast as ToastItem } from '@/store/toastStore';

const ICONS: Record<string, string> = {
  success: `<circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M6.5 10l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>`,
  error:   `<circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M7 7l6 6M13 7l-6 6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>`,
  warning: `<path d="M10 2L18.66 17H1.34L10 2z" stroke="currentColor" strokeWidth="1.5" strokeLinejoin="round"/><path d="M10 8v4M10 13.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>`,
  info:    `<circle cx="10" cy="10" r="9" stroke="currentColor" strokeWidth="1.5"/><path d="M10 7v4M10 12.5h.01" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>`,
};

const COLORS = {
  success: { bg: 'rgba(34,197,94,0.12)',  border: 'rgba(34,197,94,0.3)',  color: '#4ade80' },
  error:   { bg: 'rgba(239,68,68,0.12)',  border: 'rgba(239,68,68,0.3)',  color: '#f87171' },
  warning: { bg: 'rgba(234,179,8,0.12)',  border: 'rgba(234,179,8,0.3)',  color: '#fbbf24' },
  info:    { bg: 'rgba(99,102,241,0.12)', border: 'rgba(99,102,241,0.3)', color: '#818cf8' },
} as const;

function ToastCard({ toast }: { toast: ToastItem }) {
  const dismiss = useToastStore((s) => s.dismiss);
  const c = COLORS[toast.type];

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: '0.625rem',
        padding: '0.75rem 1rem',
        background: c.bg,
        border: `1px solid ${c.border}`,
        borderRadius: '10px',
        backdropFilter: 'blur(12px)',
        boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
        minWidth: '280px',
        maxWidth: '380px',
        animation: 'toast-in 0.25s cubic-bezier(0.34,1.56,0.64,1)',
      }}
    >
      <svg width="20" height="20" viewBox="0 0 20 20" fill="none"
        style={{ flexShrink: 0, color: c.color, marginTop: '1px' }}
        dangerouslySetInnerHTML={{ __html: ICONS[toast.type] }}
      />
      <span style={{
        flex: 1,
        fontFamily: 'var(--font-body)',
        fontSize: '0.82rem',
        color: 'var(--color-text)',
        lineHeight: 1.5,
      }}>
        {toast.message}
      </span>
      <button
        onClick={() => dismiss(toast.id)}
        aria-label="Dismiss"
        style={{
          background: 'none', border: 'none', cursor: 'pointer',
          color: 'var(--color-text-secondary)', padding: '2px',
          flexShrink: 0, display: 'flex', alignItems: 'center',
          transition: 'color 0.15s',
        }}
        onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--color-text)')}
        onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--color-text-secondary)')}
      >
        <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
          <path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round"/>
        </svg>
      </button>
    </div>
  );
}

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  if (toasts.length === 0) return null;
  return (
    <div style={{
      position: 'fixed',
      bottom: '1.5rem',
      right: '1.5rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.5rem',
      zIndex: 9999,
    }}>
      {toasts.map((t) => <ToastCard key={t.id} toast={t} />)}
    </div>
  );
}
