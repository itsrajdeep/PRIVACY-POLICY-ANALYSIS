import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { getCompanies, getDatasetStats } from '../api/client'
import { RiskBadge } from '../components/UI'

const fadeUp = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } },
}

export default function Directory() {
  const [companies, setCompanies] = useState([])
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [filter, setFilter] = useState('All')
  const [sort, setSort] = useState('score')
  const [order, setOrder] = useState('desc')

  useEffect(() => {
    Promise.all([
      getCompanies({ sort, order }),
      getDatasetStats(),
    ])
      .then(([comp, s]) => {
        setCompanies(comp.data.companies)
        setStats(s.data)
      })
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [sort, order])

  const filteredCompanies = companies.filter(c => {
    if (filter !== 'All' && c.label !== filter) return false
    const name = c.company || c.name || ''
    if (search && !name.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const riskColors = { Easy: '#22c55e', Moderate: '#eab308', Obfuscated: '#ef4444' }

  return (
    <main className="container-app" style={{ paddingTop: 96, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Header */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible" style={{ textAlign: 'center', maxWidth: 720, margin: '0 auto' }}>
        <div style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px', background: 'var(--primary-fixed)', borderRadius: 99, marginBottom: 20 }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary)' }}>grid_view</span>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>Policy Directory</span>
        </div>
        <h1 className="text-display" style={{ marginBottom: 16 }}>Company Privacy Policies</h1>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>
          Explore our database of AI-analyzed corporate privacy policies. We break down complex legal jargon into actionable risk metrics for full transparency.
        </p>
      </motion.section>

      {/* Stats Bar */}
      {stats && (
        <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
          style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 16 }}
        >
          {[
            { label: 'Total Companies', value: stats.total_companies, icon: 'domain', color: 'var(--primary)' },
            { label: 'Easy Policies', value: stats.label_distribution?.Easy, icon: 'check_circle', color: '#22c55e' },
            { label: 'Moderate Policies', value: stats.label_distribution?.Moderate, icon: 'warning', color: '#eab308' },
            { label: 'Obfuscated Policies', value: stats.label_distribution?.Obfuscated, icon: 'error', color: '#ef4444' },
            { label: 'Avg Obfuscation Score', value: `${stats.obfuscation_score?.mean}/100`, icon: 'monitoring', color: 'var(--tertiary)' },
          ].map(({ label, value, icon, color }) => (
            <div key={label} className="glass-panel" style={{ padding: '16px 20px', borderRadius: 12, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color, display: 'block', marginBottom: 6 }}>{icon}</span>
              <div className="text-headline-md" style={{ color, fontWeight: 700 }}>{value}</div>
              <div className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginTop: 2 }}>{label}</div>
            </div>
          ))}
        </motion.div>
      )}

      {/* Controls */}
      <motion.section variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}
        className="glass-panel" style={{ padding: 24, borderRadius: 12 }}
      >
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 16, alignItems: 'center', justifyContent: 'space-between' }}>
          {/* Search */}
          <div style={{ position: 'relative', flex: '1 1 280px', maxWidth: 420 }}>
            <span className="material-symbols-outlined" style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)', fontSize: 20 }}>search</span>
            <input
              type="text"
              placeholder="Search companies..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              style={{
                width: '100%', padding: '11px 16px 11px 44px', borderRadius: 8,
                border: '1px solid var(--border-subtle)',
                background: 'var(--surface-container-lowest)', outline: 'none',
                fontFamily: "'Inter', sans-serif", fontSize: 14,
                transition: 'border-color 0.2s',
              }}
              onFocus={e => e.target.style.borderColor = 'var(--primary)'}
              onBlur={e => e.target.style.borderColor = 'var(--border-subtle)'}
            />
            {search && (
              <button onClick={() => setSearch('')} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--outline)' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>close</span>
              </button>
            )}
          </div>

          {/* Filter chips */}
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            {['All', 'Easy', 'Moderate', 'Obfuscated'].map(f => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                style={{
                  padding: '8px 16px', borderRadius: 99,
                  fontFamily: "'Geist', sans-serif", fontSize: 13, fontWeight: 500, cursor: 'pointer',
                  border: filter === f ? `1.5px solid ${riskColors[f] || 'var(--primary)'}` : '1px solid var(--border-subtle)',
                  background: filter === f ? (f === 'All' ? 'var(--primary-fixed)' : `${riskColors[f]}15`) : 'var(--surface-card)',
                  color: filter === f ? (riskColors[f] || 'var(--primary)') : 'var(--text-secondary)',
                  transition: 'all 0.2s',
                }}
              >
                {f}
                {f !== 'All' && stats && (
                  <span style={{ marginLeft: 6, fontSize: 11, opacity: 0.7 }}>
                    ({stats.label_distribution?.[f] ?? '—'})
                  </span>
                )}
              </button>
            ))}
          </div>

          {/* Sort controls */}
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <select
              value={sort}
              onChange={e => setSort(e.target.value)}
              style={{
                padding: '8px 12px', borderRadius: 8, border: '1px solid var(--border-subtle)',
                background: 'var(--surface-card)', fontFamily: "'Geist', sans-serif", fontSize: 13,
                cursor: 'pointer', outline: 'none', color: 'var(--text-primary)',
              }}
            >
              <option value="score">Sort: Score</option>
              <option value="name">Sort: Name</option>
              <option value="label">Sort: Label</option>
            </select>
            <button
              onClick={() => setOrder(o => o === 'asc' ? 'desc' : 'asc')}
              title="Toggle order"
              style={{ padding: '8px 10px', borderRadius: 8, border: '1px solid var(--border-subtle)', background: 'var(--surface-card)', cursor: 'pointer', display: 'flex' }}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: 'var(--text-secondary)' }}>
                {order === 'desc' ? 'arrow_downward' : 'arrow_upward'}
              </span>
            </button>
          </div>
        </div>

        {/* Active filter status */}
        {(search || filter !== 'All') && (
          <div style={{ marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border-subtle)', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: 'var(--text-secondary)' }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>filter_list</span>
            Showing <strong style={{ color: 'var(--text-primary)' }}>{filteredCompanies.length}</strong> of {companies.length} companies
            {filter !== 'All' && <span>· Label: <strong style={{ color: riskColors[filter] }}>{filter}</strong></span>}
            {search && <span>· Search: "<strong style={{ color: 'var(--text-primary)' }}>{search}</strong>"</span>}
          </div>
        )}
      </motion.section>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', padding: 64, gap: 12, color: 'var(--text-secondary)' }}>
          <div style={{ width: 20, height: 20, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
          Loading database...
          <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          <section style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: 20 }}>
            {filteredCompanies.map((c, i) => {
              const companyName = c.company || c.name || '—'
              const color = riskColors[c.label] || 'var(--primary)'
              return (
                <motion.div
                  key={companyName}
                  variants={fadeUp} initial="hidden" animate="visible"
                  transition={{ delay: Math.min(i * 0.04, 0.5) }}
                  className="card"
                  style={{ padding: 0, display: 'flex', flexDirection: 'column', overflow: 'hidden', position: 'relative' }}
                >
                  {/* Top accent bar */}
                  <div style={{ height: 3, background: `linear-gradient(to right, ${color}, ${color}50)` }} />

                  <div style={{ padding: 24, flex: 1, display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {/* Header */}
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                        <div style={{
                          width: 44, height: 44, borderRadius: 10,
                          background: `${color}15`, border: `1px solid ${color}30`,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 20, fontWeight: 700, color, fontFamily: 'Geist,sans-serif',
                        }}>
                          {companyName.charAt(0)}
                        </div>
                        <div>
                          <h3 className="text-headline-md" style={{ marginBottom: 2 }}>{companyName}</h3>
                          <p className="font-mono" style={{ fontSize: 11, color: 'var(--outline)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                            {c.sector || 'Corporate'}
                          </p>
                        </div>
                      </div>
                      <RiskBadge label={c.label} />
                    </div>

                    {/* Score row */}
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 6 }}>
                        <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>Obfuscation Score</span>
                        <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color }}>{(c.obfuscation_score ?? 0).toFixed(1)}/100</span>
                      </div>
                      <div style={{ width: '100%', height: 4, background: 'var(--surface-container-high)', borderRadius: 99, overflow: 'hidden' }}>
                        <div style={{ width: `${c.obfuscation_score ?? 0}%`, height: '100%', background: color, borderRadius: 99 }} />
                      </div>
                    </div>

                    {/* Mini stats */}
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {[
                        { label: 'Readability', value: (c.flesch_reading_ease ?? 0).toFixed(1) },
                        { label: 'Avg Sentence', value: `${(c.avg_sentence_length ?? 0).toFixed(1)}w` },
                        { label: 'Word Count', value: (c.word_count ?? 0).toLocaleString() },
                        { label: 'Legal Terms', value: c.legal_term_count ?? '—' },
                      ].map(({ label, value }) => (
                        <div key={label} style={{ background: 'var(--surface-container-low)', padding: '8px 12px', borderRadius: 6 }}>
                          <div style={{ fontSize: 10, color: 'var(--text-secondary)', marginBottom: 1, textTransform: 'uppercase', letterSpacing: '0.04em', fontFamily: 'Geist,sans-serif' }}>{label}</div>
                          <div className="font-mono" style={{ fontSize: 13, fontWeight: 600 }}>{value}</div>
                        </div>
                      ))}
                    </div>

                    {c.human_class && (
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12, color: 'var(--text-secondary)', borderTop: '1px solid var(--border-subtle)', paddingTop: 10 }}>
                        <span className="material-symbols-outlined" style={{ fontSize: 14 }}>person</span>
                        Human label: <strong style={{ color: riskColors[c.human_class] || 'var(--text-primary)' }}>{c.human_class}</strong>
                      </div>
                    )}

                    {/* CTA */}
                    <Link
                      to={`/directory/${encodeURIComponent(companyName)}`}
                      className="btn-secondary"
                      style={{ justifyContent: 'center', width: '100%', marginTop: 'auto' }}
                    >
                      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>open_in_new</span>
                      View Full Report
                    </Link>
                  </div>
                </motion.div>
              )
            })}
            {filteredCompanies.length === 0 && (
              <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: 64 }}>
                <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-secondary)', display: 'block', marginBottom: 16 }}>search_off</span>
                <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>No companies found matching your criteria.</p>
                <button onClick={() => { setSearch(''); setFilter('All') }} className="btn-secondary" style={{ marginTop: 16 }}>Clear filters</button>
              </div>
            )}
          </section>
        </AnimatePresence>
      )}
    </main>
  )
}
