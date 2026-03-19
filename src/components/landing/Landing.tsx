import { useEffect, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from '@/hooks/useTheme';
import { ThemeName } from '@/types';

// Animated cipher text scramble on mount
function CipherText({ text, className }: { text: string; className?: string }) {
  const [displayed, setDisplayed] = useState(text);
  const CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@#$%&*';
  const iterRef = useRef(0);
  const frameRef = useRef(0);

  useEffect(() => {
    iterRef.current = 0;
    const animate = () => {
      setDisplayed(
        text.split('').map((c, i) => {
          if (c === ' ') return ' ';
          if (i < iterRef.current) return c;
          return CHARS[Math.floor(Math.random() * CHARS.length)];
        }).join('')
      );
      iterRef.current += 0.5;
      if (iterRef.current < text.length) {
        frameRef.current = requestAnimationFrame(animate);
      } else {
        setDisplayed(text);
      }
    };
    const timeout = setTimeout(() => {
      frameRef.current = requestAnimationFrame(animate);
    }, 300);
    return () => { clearTimeout(timeout); cancelAnimationFrame(frameRef.current); };
  }, [text]);

  return <span className={className}>{displayed}</span>;
}

// Animated particle / constellation canvas
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animId: number;
    type Particle = { x: number; y: number; vx: number; vy: number; size: number; opacity: number };
    const particles: Particle[] = [];

    const resize = () => {
      canvas.width  = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resize();
    window.addEventListener('resize', resize);

    const getPrimary = () =>
      getComputedStyle(document.documentElement).getPropertyValue('--color-primary').trim() || '#00ff88';

    for (let i = 0; i < 55; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.25,
        vy: (Math.random() - 0.5) * 0.25,
        size: Math.random() * 1.4 + 0.3,
        opacity: Math.random() * 0.35 + 0.05,
      });
    }

    let frame = 0;
    const draw = () => {
      frame++;
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      const primary = getPrimary();

      particles.forEach((p, i) => {
        p.x += p.vx;
        p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;

        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fillStyle = primary + Math.floor(p.opacity * 255).toString(16).padStart(2, '0');
        ctx.fill();

        for (let j = i + 1; j < particles.length; j++) {
          const q = particles[j];
          const dx = p.x - q.x, dy = p.y - q.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 110) {
            const alpha = Math.floor((1 - dist / 110) * 0.10 * 255).toString(16).padStart(2, '0');
            ctx.beginPath();
            ctx.strokeStyle = primary + alpha;
            ctx.lineWidth = 0.5;
            ctx.moveTo(p.x, p.y);
            ctx.lineTo(q.x, q.y);
            ctx.stroke();
          }
        }
      });
      animId = requestAnimationFrame(draw);
    };
    draw();

    return () => { cancelAnimationFrame(animId); window.removeEventListener('resize', resize); };
  }, []);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none', opacity: 0.55 }}
    />
  );
}

// Floating mock message bubble
function MockBubble({ text, own, delay }: { text: string; own?: boolean; delay: number }) {
  return (
    <div className={`lp-bubble ${own ? 'lp-bubble--own' : ''}`} style={{ animationDelay: `${delay}s` }}>
      <svg width="10" height="10" viewBox="0 0 10 10" fill="none" style={{ flexShrink: 0, opacity: 0.6 }}>
        <rect x="1.5" y="4" width="7" height="5.5" rx="1" stroke="currentColor" strokeWidth="1"/>
        <path d="M3 4V3a2 2 0 014 0v1" stroke="currentColor" strokeWidth="1"/>
      </svg>
      <span>{text}</span>
    </div>
  );
}

const THEME_COLORS: Record<ThemeName, string> = {
  'neo-noir':       '#00ff88',
  'digital-matrix': '#00ff41',
  'midnight-tech':  '#6e40c9',
  'tech-rust':      '#ff6b35',
  'solar-shift':    '#ffd700',
};
const THEME_LABELS: Record<ThemeName, string> = {
  'neo-noir':       'Neo Noir',
  'digital-matrix': 'Digital Matrix',
  'midnight-tech':  'Midnight Tech',
  'tech-rust':      'Tech Rust',
  'solar-shift':    'Solar Shift',
};

export function Landing() {
  const navigate = useNavigate();
  const { currentTheme, setTheme, getAllThemes } = useTheme();
  const [mounted, setMounted] = useState(false);
  const themes = getAllThemes();

  useEffect(() => { const t = setTimeout(() => setMounted(true), 60); return () => clearTimeout(t); }, []);

  return (
    <div className="lp">
      <ParticleCanvas />
      <div className="lp-grid" aria-hidden="true" />

      {/* ── Nav ── */}
      <nav className="lp-nav">
        <div className="lp-nav-brand">
          <span className="lp-nav-arabic">سرّ</span>
          <span className="lp-nav-latin">SIRR</span>
        </div>
        <div className="lp-nav-right">
          <div className="lp-swatches" role="group" aria-label="Choose theme">
            {themes.map(t => (
              <button
                key={t.name}
                className={`lp-swatch ${currentTheme?.name === t.name ? 'lp-swatch--active' : ''}`}
                style={{ '--swatch-color': THEME_COLORS[t.name] } as React.CSSProperties}
                onClick={() => setTheme(t.name)}
                title={THEME_LABELS[t.name]}
                aria-label={`${THEME_LABELS[t.name]} theme`}
              />
            ))}
          </div>
          <button className="lp-btn-ghost" onClick={() => navigate('/login')}>Sign in</button>
          <button className="lp-btn-primary" onClick={() => navigate('/signup')}>Get started</button>
        </div>
      </nav>

      {/* ── Hero ── */}
      <main className={`lp-hero ${mounted ? 'lp-hero--in' : ''}`}>
        <div className="lp-hero-inner">

          {/* Copy side */}
          <div className="lp-copy">
            <div className="lp-eyebrow">
              <span className="lp-eyebrow-pulse" />
              End-to-end encrypted
            </div>

            <h1 className="lp-h1">
              <span className="lp-h1-arabic">سرّ</span>
              <br />
              <CipherText text="Private by design." className="lp-h1-en" />
            </h1>

            <p className="lp-sub">
              Encrypted on your device before anything touches the wire.
              X25519 key exchange · AES-256-GCM · Zero server knowledge.
              Built for the people who take privacy seriously.
            </p>

            <div className="lp-cta-row">
              <button className="lp-cta-main" onClick={() => navigate('/signup')}>
                <svg width="17" height="17" viewBox="0 0 17 17" fill="none">
                  <rect x="2" y="7.5" width="13" height="8.5" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                  <path d="M5 7.5V5.5a3.5 3.5 0 017 0v2" stroke="currentColor" strokeWidth="1.4"/>
                  <circle cx="8.5" cy="12" r="1.2" fill="currentColor"/>
                </svg>
                Start encrypting
              </button>
              <button className="lp-cta-ghost" onClick={() => navigate('/login')}>
                Sign in
                <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
                  <path d="M3 7.5h9M9 4.5l3 3-3 3" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </button>
            </div>

            <div className="lp-trust">
              {[
                { icon: 'M12 2L3 7v5c0 4.5 3.5 7.5 9 7.5s9-3 9-7.5V7L12 2z M8 12l3 3 5-5', label: 'Open source' },
                { icon: 'M12 2a10 10 0 100 20A10 10 0 0012 2z M12 7v5l3.5 2', label: '72h auto-expiry' },
                { icon: 'M19 11H5m14 0a2 2 0 012 2v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10', label: 'Keys on device only' },
              ].map((item, i) => (
                <span key={i} className="lp-trust-item">
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                    <path d={item.icon} stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                  {item.label}
                </span>
              ))}
            </div>
          </div>

          {/* Visual side — mock chat phone */}
          <div className="lp-visual" aria-hidden="true">
            <div className="lp-phone">
              <div className="lp-phone-notch" />
              <div className="lp-phone-header">
                <div className="lp-phone-avatar">S</div>
                <div>
                  <div className="lp-phone-name">Sirr Chat</div>
                  <div className="lp-phone-status">
                    <span className="lp-phone-status-dot" />
                    E2E encrypted
                  </div>
                </div>
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none" style={{ marginLeft: 'auto', opacity: 0.4 }}>
                  <rect x="1.5" y="5.5" width="11" height="7" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
                  <path d="M4 5.5V4a3 3 0 016 0v1.5" stroke="currentColor" strokeWidth="1.1"/>
                </svg>
              </div>
              <div className="lp-phone-messages">
                <MockBubble text="Key exchange complete ✓" delay={0.3} />
                <MockBubble text="AES-256-GCM active" delay={0.6} />
                <MockBubble text="Can you talk?" own delay={0.9} />
                <MockBubble text="Always. Fully encrypted 🔐" delay={1.2} />
                <MockBubble text="Nobody reads this but us." own delay={1.5} />
                <div className="lp-phone-typing">
                  <span /><span /><span />
                </div>
              </div>
              <div className="lp-phone-input-bar">
                <span>Message…</span>
                <div className="lp-phone-send-btn">
                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                    <path d="M1 6h10M7 3l4 3-4 3" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                </div>
              </div>
            </div>

            {/* Floating badges */}
            <div className="lp-badge lp-badge--tl">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path d="M6 1L1 3.5v3C1 9.5 3.5 11 6 11s5-1.5 5-4.5v-3L6 1z" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3.5 6l2 2 3-3" stroke="currentColor" strokeWidth="1.1" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
              <span>X25519 ECDH</span>
            </div>
            <div className="lp-badge lp-badge--br">
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <rect x="1.5" y="5" width="9" height="6.5" rx="1.2" stroke="currentColor" strokeWidth="1.1"/>
                <path d="M3.5 5V3.5a2.5 2.5 0 015 0V5" stroke="currentColor" strokeWidth="1.1"/>
              </svg>
              <span>AES-256-GCM</span>
            </div>
          </div>
        </div>
      </main>

      {/* ── Feature cards ── */}
      <section className="lp-features" aria-label="Features">
        {[
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 2L2 6.5v5C2 16 5.5 19.5 11 19.5S20 16 20 11.5v-5L11 2z" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7.5 11l2.5 2.5 4.5-4.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            ),
            title: 'X25519 Key Exchange',
            body: 'Elliptic-curve Diffie-Hellman on Curve25519 via TweetNaCl. Public key on server. Private key encrypted in your browser only.',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <rect x="3" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M7 10V7a4 4 0 018 0v3" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="11" cy="15" r="1.5" fill="currentColor"/>
              </svg>
            ),
            title: 'AES-256-GCM',
            body: 'Every message gets a unique 12-byte IV. Authenticated encryption — integrity and confidentiality in one primitive.',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="11" cy="11" r="8.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M11 6v5l3.5 2.5" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
              </svg>
            ),
            title: '72h Auto-expiry',
            body: 'Messages self-destruct server-side. The server holds ciphertext it cannot read, then deletes it — nothing lingers.',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <circle cx="8" cy="7" r="3.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M1.5 19c0-3.3 2.9-6 6.5-6s6.5 2.7 6.5 6" stroke="currentColor" strokeWidth="1.4"/>
                <circle cx="16" cy="8" r="2.5" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M15 14c2.2.3 3.5 1.8 3.5 3" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            ),
            title: 'Encrypted Groups',
            body: 'Group keys distributed per-member, each encrypted with that member\'s ECDH shared secret. New member? New key.',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M3 7h16v10a2 2 0 01-2 2H5a2 2 0 01-2-2V7z" stroke="currentColor" strokeWidth="1.4"/>
                <path d="M3 7l8 6 8-6" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            ),
            title: 'Zero Knowledge Server',
            body: 'The server stores only ciphertext and public keys. It cannot read your messages, derive your keys, or impersonate you.',
          },
          {
            icon: (
              <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
                <path d="M11 3v4M11 15v4M3 11h4M15 11h4" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round"/>
                <circle cx="11" cy="11" r="4" stroke="currentColor" strokeWidth="1.4"/>
              </svg>
            ),
            title: 'PBKDF2 Key Wrapping',
            body: '600,000 iterations (OWASP 2023) protect your private key at rest. Even if localStorage is read, keys stay safe.',
          },
        ].map((f, i) => (
          <div key={i} className="lp-feat-card" style={{ '--card-delay': `${0.05 + i * 0.06}s` } as React.CSSProperties}>
            <div className="lp-feat-icon">{f.icon}</div>
            <h3 className="lp-feat-title">{f.title}</h3>
            <p className="lp-feat-body">{f.body}</p>
          </div>
        ))}
      </section>

      {/* ── Footer ── */}
      <footer className="lp-footer">
        <span className="lp-footer-brand">سرّ SIRR</span>
        <span className="lp-footer-dot">·</span>
        <span>End-to-end encrypted messenger</span>
        <span className="lp-footer-dot">·</span>
        <span style={{ opacity: 0.3 }}>TweetNaCl + WebCrypto API</span>
      </footer>
    </div>
  );
}
