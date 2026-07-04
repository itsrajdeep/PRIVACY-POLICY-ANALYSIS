import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCompanies } from '../api/client'
import { RiskBadge } from '../components/UI'

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0 },
}

export default function Directory() {
  const [companies, setCompanies] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')

  useEffect(() => {
    getCompanies()
      .then(res => setCompanies(res.data.companies))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [])

  const filteredCompanies = companies.filter(c => {
    if (filter !== 'All' && c.label !== filter) return false
    if (search && !c.name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  return (
    <main className="container-app" style={{ paddingTop: 96, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 48 }}>
      {/* Header */}
      <section style={{ display: 'flex', flexDirection: 'column', gap: 24, textAlign: 'center', alignItems: 'center' }}>
        <h1 className="text-display">Policy Directory</h1>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)', maxWidth: 640 }}>
          Explore our database of AI-analyzed corporate privacy policies. We break down complex legal jargon into actionable risk metrics, ensuring transparency and compliance.
        </p>
      </section>

      {/* Controls */}
      <section className="glass-panel" style={{ padding: 24, borderRadius: 12, display: 'flex', flexWrap: 'wrap', gap: 24, alignItems: 'center', justifyContent: 'space-between' }}>
        <div style={{ position: 'relative', flex: '1 1 320px' }}>
          <span className="material-symbols-outlined" style={{ position: 'absolute', left: 16, top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }}>search</span>
          <input
            type="text"
            placeholder="Search companies..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%', padding: '12px 16px 12px 48px', borderRadius: 8,
              border: 'none', borderBottom: '1px solid var(--border-subtle)',
              background: 'var(--surface)', outline: 'none', fontFamily: "'Inter', sans-serif",
            }}
          />
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {['All', 'Easy', 'Moderate', 'Obfuscated'].map(f => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              style={{
                padding: '8px 16px', borderRadius: 99, fontFamily: "'Geist', sans-serif", fontSize: 14, fontWeight: 500, cursor: 'pointer',
                border: filter === f ? '1px solid var(--primary)' : '1px solid var(--border-subtle)',
                background: filter === f ? 'var(--primary-container)' : 'var(--surface-card)',
                color: filter === f ? 'var(--on-primary-container)' : 'var(--text-secondary)',
                transition: 'all 0.2s',
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </section>

      {/* Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>Loading database...</div>
      ) : (
        <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 24 }}>
          {filteredCompanies.map((c, i) => (
            <motion.div key={c.name} variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: i * 0.05 }} className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 24, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: c.label === 'Obfuscated' ? 'var(--error)' : c.label === 'Moderate' ? '#eab308' : '#22c55e', opacity: 0.5 }} />
              
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 8, background: 'var(--surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 700, color: 'var(--primary)', border: '1px solid var(--border-subtle)' }}>
                    {c.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="text-headline-md">{c.name}</h3>
                    <p className="font-mono" style={{ fontSize: 12, color: 'var(--outline)' }}>{c.sector || 'Technology'}</p>
                  </div>
                </div>
                <RiskBadge label={c.label} />
              </div>

              <div style={{ borderTop: '1px solid var(--border-subtle)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 8 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Score:</span>
                  <span style={{ fontWeight: 500 }}>{c.obfuscation_score.toFixed(1)}/100</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 14 }}>
                  <span style={{ color: 'var(--text-secondary)' }}>Readability:</span>
                  <span style={{ fontWeight: 500 }}>{c.flesch_reading_ease.toFixed(1)}</span>
                </div>
              </div>

              <Link to={`/directory/${encodeURIComponent(c.name)}`} className="btn-secondary" style={{ marginTop: 'auto', justifyContent: 'center', width: '100%' }}>
                View Report
              </Link>
            </motion.div>
          ))}
          {filteredCompanies.length === 0 && (
            <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 48, color: 'var(--text-secondary)' }}>No companies found matching your criteria.</div>
          )}
        </section>
      )}
    </main>
  )
}
