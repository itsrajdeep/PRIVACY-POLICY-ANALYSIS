import { Link } from 'react-router-dom'

export default function Footer() {
  return (
    <footer style={{ background: 'var(--surface-container-lowest)', borderTop: '1px solid var(--border-subtle)', marginTop: 'auto' }}>
      <div style={{ maxWidth: 'var(--max-width)', margin: '0 auto', padding: '64px 64px 40px' }}>
        {/* Top row */}
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr', gap: 48, marginBottom: 56 }}>
          {/* Brand */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
              <div style={{ width: 32, height: 32, borderRadius: 8, background: 'linear-gradient(135deg, var(--primary), #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 16, color: '#fff' }}>policy</span>
              </div>
              <span className="font-display" style={{ fontWeight: 700, fontSize: 18, color: 'var(--primary)' }}>Cognitive Legal</span>
            </div>
            <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, maxWidth: 280 }}>
              AI-powered privacy policy analysis using machine learning. Built to detect hidden complexity and protect users from opaque legal language.
            </p>
            <div style={{ display: 'flex', gap: 10, marginTop: 20 }}>
              {[
                { icon: 'code', label: 'GitHub' },
                { icon: 'article', label: 'Paper' },
              ].map(({ icon, label }) => (
                <a key={label} href="#" style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '6px 12px',
                  borderRadius: 8, border: '1px solid var(--border-subtle)',
                  fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'Geist,sans-serif',
                  transition: 'all 0.2s',
                }}
                  onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--primary)'; e.currentTarget.style.color = 'var(--primary)' }}
                  onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border-subtle)'; e.currentTarget.style.color = 'var(--text-secondary)' }}
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{icon}</span>
                  {label}
                </a>
              ))}
            </div>
          </div>

          {/* Product */}
          <div>
            <h4 className="font-mono" style={{ fontSize: 11, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, fontWeight: 600 }}>
              Product
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                { to: '/analyzer', label: 'Policy Analyzer' },
                { to: '/directory', label: 'Company Directory' },
                { to: '/research', label: 'Research & Docs' },
                { to: '/#how-it-works', label: 'How It Works' },
              ].map(({ to, label }) => (
                <Link key={label} to={to} style={{ fontSize: 14, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Research */}
          <div>
            <h4 className="font-mono" style={{ fontSize: 11, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, fontWeight: 600 }}>
              Research
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {[
                'Dataset Overview',
                'Feature Engineering',
                'Model Architecture',
                'Performance Metrics',
                'Human Evaluation',
              ].map((label) => (
                <Link key={label} to="/research" style={{ fontSize: 14, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                  onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                  onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
                >
                  {label}
                </Link>
              ))}
            </div>
          </div>

          {/* Tech */}
          <div>
            <h4 className="font-mono" style={{ fontSize: 11, color: 'var(--text-primary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, fontWeight: 600 }}>
              Tech Stack
            </h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {['Python', 'scikit-learn', 'XGBoost', 'Flask', 'React', 'Vite'].map((tech) => (
                <span key={tech} className="font-mono" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 6, fontSize: 12,
                  color: 'var(--text-secondary)',
                }}>
                  <span style={{ width: 5, height: 5, borderRadius: '50%', background: 'var(--primary)', display: 'inline-block', opacity: 0.5 }} />
                  {tech}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Model info badge */}
        <div style={{ padding: '16px 20px', background: 'var(--primary-fixed)', borderRadius: 10, marginBottom: 32, display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--primary)' }}>model_training</span>
            <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 600 }}>XGBoost Classifier</span>
            <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>· 81 companies · 13 features · 98% CV accuracy · Stratified K-Fold validation</span>
          </div>
          <Link to="/research" style={{ fontSize: 12, color: 'var(--primary)', fontWeight: 500, fontFamily: 'Geist,sans-serif', display: 'flex', alignItems: 'center', gap: 4 }}>
            Read methodology <span className="material-symbols-outlined" style={{ fontSize: 14 }}>arrow_forward</span>
          </Link>
        </div>

        {/* Bottom row */}
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', gap: 16, paddingTop: 24, borderTop: '1px solid var(--border-subtle)' }}>
          <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
            © 2024 Cognitive Legal. A public privacy analysis platform. Built for research purposes.
          </span>
          <div style={{ display: 'flex', gap: 24 }}>
            {['Privacy Policy', 'Terms of Service', 'Contact'].map((label) => (
              <a key={label} href="#" style={{ fontSize: 13, color: 'var(--text-secondary)', transition: 'color 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                {label}
              </a>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        @media (max-width: 1024px) {
          footer > div > div:first-child {
            grid-template-columns: 1fr 1fr !important;
          }
        }
        @media (max-width: 640px) {
          footer > div {
            padding: 40px 20px 24px !important;
          }
          footer > div > div:first-child {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>
    </footer>
  )
}
