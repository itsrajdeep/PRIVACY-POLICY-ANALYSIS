import { Link, useLocation } from 'react-router-dom'

export default function Navbar() {
  const location = useLocation()
  const isActive = (path) => location.pathname === path

  return (
    <nav
      style={{
        position: 'fixed',
        top: 0,
        width: '100%',
        zIndex: 50,
        background: 'rgba(255,255,255,0.7)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid var(--border-subtle)',
        boxShadow: '0 1px 3px rgba(0,0,0,0.04)',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        height: 64,
        padding: '0 64px',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        left: 0,
        right: 0,
      }}
    >
      <Link to="/" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span className="font-display text-headline-md" style={{ fontWeight: 700, color: 'var(--primary)' }}>
          Cognitive Legal
        </span>
      </Link>

      <div style={{ display: 'flex', alignItems: 'center', gap: 32 }}>
        {[
          { to: '/', label: 'Features' },
          { to: '/research', label: 'Research' },
          { to: '/directory', label: 'Directory' },
          { to: '/analyzer', label: 'Analyzer' },
        ].map(({ to, label }) => (
          <Link
            key={to}
            to={to}
            className="font-mono text-label-md"
            style={{
              textTransform: 'uppercase',
              letterSpacing: '0.05em',
              color: isActive(to) ? 'var(--primary)' : 'var(--on-surface-variant)',
              fontWeight: isActive(to) ? 700 : 500,
              borderBottom: isActive(to) ? '2px solid var(--primary)' : '2px solid transparent',
              paddingBottom: 2,
              transition: 'color 0.2s, border-color 0.2s',
            }}
          >
            {label}
          </Link>
        ))}
      </div>

      <Link to="/analyzer" className="btn-primary" style={{ padding: '8px 16px', fontSize: 13 }}>
        Analyze Now
      </Link>
    </nav>
  )
}
