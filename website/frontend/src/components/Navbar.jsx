import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const [mobileOpen, setMobileOpen] = useState(false)
  const isActive = (path) => location.pathname === path

  const links = [
    { to: '/', label: 'Home' },
    { to: '/research', label: 'Research' },
    { to: '/directory', label: 'Directory' },
    { to: '/analyzer', label: 'Analyzer' },
  ]

  return (
    <>
      <nav
        style={{
          position: 'fixed', top: 0, width: '100%', zIndex: 50,
          background: 'rgba(255,255,255,0.82)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          borderBottom: '1px solid var(--border-subtle)',
          boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        }}
      >
        <div style={{
          display: 'flex', justifyContent: 'space-between', alignItems: 'center',
          height: 64, padding: '0 64px', maxWidth: 'var(--max-width)', margin: '0 auto',
        }}>
          {/* Logo */}
          <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 8,
              background: 'linear-gradient(135deg, var(--primary), #6366f1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>policy</span>
            </div>
            <span className="font-display text-headline-md" style={{ fontWeight: 700, color: 'var(--primary)', letterSpacing: '-0.01em' }}>
              Cognitive Legal
            </span>
          </Link>

          {/* Desktop nav */}
          <div className="nav-desktop" style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                className="font-mono text-label-md"
                style={{
                  textTransform: 'uppercase', letterSpacing: '0.05em',
                  color: isActive(to) ? 'var(--primary)' : 'var(--on-surface-variant)',
                  fontWeight: isActive(to) ? 700 : 500,
                  borderBottom: isActive(to) ? '2px solid var(--primary)' : '2px solid transparent',
                  paddingBottom: 2, transition: 'color 0.2s, border-color 0.2s',
                }}
              >
                {label}
              </Link>
            ))}
          </div>

          {/* CTA + hamburger */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <Link to="/analyzer" className="btn-primary nav-desktop" style={{ padding: '8px 20px', fontSize: 13 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>analytics</span>
              Analyze Now
            </Link>

            {/* Hamburger (mobile only) */}
            <button
              className="nav-hamburger"
              onClick={() => setMobileOpen(o => !o)}
              style={{
                display: 'none', background: 'none', border: '1px solid var(--border-subtle)',
                borderRadius: 8, padding: '6px 10px', cursor: 'pointer', color: 'var(--text-primary)',
              }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                {mobileOpen ? 'close' : 'menu'}
              </span>
            </button>
          </div>
        </div>

        {/* Mobile dropdown */}
        {mobileOpen && (
          <div style={{
            borderTop: '1px solid var(--border-subtle)',
            background: 'rgba(255,255,255,0.96)',
            padding: '16px 24px 24px',
          }}>
            {links.map(({ to, label }) => (
              <Link
                key={to}
                to={to}
                onClick={() => setMobileOpen(false)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '12px 0', borderBottom: '1px solid var(--border-subtle)',
                  color: isActive(to) ? 'var(--primary)' : 'var(--text-primary)',
                  fontWeight: isActive(to) ? 600 : 400,
                  fontFamily: 'Inter,sans-serif', fontSize: 15,
                }}
              >
                {isActive(to) && <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>chevron_right</span>}
                {label}
              </Link>
            ))}
            <Link to="/analyzer" onClick={() => setMobileOpen(false)} className="btn-primary" style={{ marginTop: 16, width: '100%', justifyContent: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>analytics</span>
              Analyze Policy Now
            </Link>
          </div>
        )}
      </nav>

      {/* Responsive styles */}
      <style>{`
        @media (max-width: 768px) {
          .nav-desktop { display: none !important; }
          .nav-hamburger { display: flex !important; }
          nav > div { padding: 0 20px !important; }
        }
      `}</style>
    </>
  )
}
