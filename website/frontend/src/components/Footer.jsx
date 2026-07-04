import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer
      style={{
        width: '100%',
        padding: '48px 64px',
        background: 'var(--surface-container-lowest)',
        borderTop: '1px solid var(--border-subtle)',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
        alignItems: 'center',
        maxWidth: 'var(--max-width)',
        margin: '0 auto',
        gap: 16,
      }}
    >
      <span className="font-display text-headline-md" style={{ color: 'var(--on-surface)' }}>
        Cognitive Legal
      </span>
      <div style={{ display: 'flex', gap: 24 }}>
        {['Privacy Policy', 'Terms of Service', 'Contact'].map((label) => (
          <a
            key={label}
            href="#"
            className="text-label-md"
            style={{ color: 'var(--on-surface-variant)' }}
          >
            {label}
          </a>
        ))}
      </div>
      <span className="text-label-md" style={{ color: 'var(--primary)' }}>
        © 2024 Cognitive Legal. Public Privacy Analysis Platform.
      </span>
    </footer>
  )
}
