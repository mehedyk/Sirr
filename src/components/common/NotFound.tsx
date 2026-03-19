import { useNavigate } from 'react-router-dom';
import { useEffect, useState } from 'react';

export function NotFound() {
  const navigate = useNavigate();
  const [count, setCount] = useState(8);

  useEffect(() => {
    if (count <= 0) { navigate('/'); return; }
    const t = setTimeout(() => setCount(c => c - 1), 1000);
    return () => clearTimeout(t);
  }, [count, navigate]);

  return (
    <div className="notfound">
      <div className="notfound-inner">
        <div className="notfound-code">
          <span className="notfound-4">4</span>
          <div className="notfound-lock">
            <svg viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
              <rect x="8" y="28" width="48" height="32" rx="6" stroke="currentColor" strokeWidth="3.5"/>
              <path d="M20 28V20a12 12 0 0124 0v8" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round"/>
              <circle cx="32" cy="44" r="4" fill="currentColor"/>
            </svg>
          </div>
          <span className="notfound-4">4</span>
        </div>

        <h1 className="notfound-title">Page not found</h1>
        <p className="notfound-sub">
          This route doesn't exist — or it's encrypted beyond recognition.
        </p>

        <div className="notfound-actions">
          <button className="notfound-btn-primary" onClick={() => navigate('/')}>
            <svg width="15" height="15" viewBox="0 0 15 15" fill="none">
              <path d="M7.5 1L1 7.5M1 7.5L7.5 14M1 7.5H14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
            Go home
          </button>
          <button className="notfound-btn-ghost" onClick={() => navigate('/login')}>
            Sign in
          </button>
        </div>

        <p className="notfound-countdown">
          Redirecting in <strong>{count}s</strong>
        </p>
      </div>
    </div>
  );
}
