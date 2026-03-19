import { useTheme } from '@/hooks/useTheme';
import { ThemeName } from '@/types';
import { useState, useRef, useEffect } from 'react';

const THEME_DOTS: Record<ThemeName, string> = {
  'neo-noir':       '#00ff88',
  'digital-matrix': '#00ff41',
  'midnight-tech':  '#6e40c9',
  'tech-rust':      '#ff6b35',
  'solar-shift':    '#ffd700',
};

interface ThemeSwitcherProps {
  compact?: boolean;
}

export function ThemeSwitcher({ compact = false }: ThemeSwitcherProps) {
  const { currentTheme, setTheme, getAllThemes } = useTheme();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const themes = getAllThemes();

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        className="theme-toggle-btn"
        onClick={() => setOpen((o) => !o)}
        title="Change theme"
        aria-label="Change theme"
        aria-expanded={open}
      >
        <span
          className="theme-dot"
          style={{ background: THEME_DOTS[currentTheme?.name ?? 'neo-noir'] }}
        />
        {!compact && (
          <span className="theme-toggle-label">{currentTheme?.displayName ?? 'Theme'}</span>
        )}
        <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ opacity: 0.5, marginLeft: compact ? 0 : 2 }}>
          <path d="M2 4l3 3 3-3" stroke="currentColor" strokeWidth="1.25" strokeLinecap="round" strokeLinejoin="round"/>
        </svg>
      </button>

      {open && (
        <div className="theme-dropdown" role="menu">
          {themes.map((theme) => (
            <button
              key={theme.name}
              role="menuitem"
              className={`theme-option ${currentTheme?.name === theme.name ? 'theme-option--active' : ''}`}
              onClick={() => { setTheme(theme.name); setOpen(false); }}
            >
              <span className="theme-dot" style={{ background: THEME_DOTS[theme.name] }} />
              <span>{theme.displayName}</span>
              {currentTheme?.name === theme.name && (
                <svg width="12" height="12" viewBox="0 0 12 12" fill="none" style={{ marginLeft: 'auto' }}>
                  <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
