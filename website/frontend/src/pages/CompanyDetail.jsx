import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getCompany } from '../api/client'
import { ScoreGauge, RiskBadge } from '../components/UI'

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] } },
}

function AnimatedBar({ pct, color }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), 300); return () => clearTimeout(t) }, [pct])
  return (
    <div style={{ width: '100%', height: 6, background: 'var(--surface-container-high)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  )
}

function MetaRow({ label, value }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0', borderBottom: '1px solid var(--border-subtle)' }}>
      <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
      <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
    </div>
  )
}

export default function CompanyDetail() {
  const { name } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  useEffect(() => {
    getCompany(name)
      .then(res => setData(res.data))
      .catch(() => setError(true))
      .finally(() => setLoading(false))
  }, [name])

  if (loading) return (
    <main style={{ paddingTop: 120, textAlign: 'center' }}>
      <div style={{ display: 'inline-flex', alignItems: 'center', gap: 12, color: 'var(--text-secondary)' }}>
        <div style={{ width: 20, height: 20, border: '2px solid var(--primary)', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 0.8s linear infinite' }} />
        Loading company report...
      </div>
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </main>
  )

  if (error || !data) return (
    <main className="container-app" style={{ paddingTop: 120, textAlign: 'center' }}>
      <span className="material-symbols-outlined" style={{ fontSize: 48, color: 'var(--text-secondary)', display: 'block', marginBottom: 16 }}>search_off</span>
      <p className="text-body-lg" style={{ color: 'var(--text-secondary)' }}>Company "<strong>{name}</strong>" not found in the dataset.</p>
      <Link to="/directory" className="btn-primary" style={{ display: 'inline-flex', marginTop: 24 }}>
        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
        Back to Directory
      </Link>
    </main>
  )

  const { model_prediction } = data
  const company = data.company || {}
  const companyName = typeof company === 'string' ? company : (company.company || name)
  const features = data.features || {}
  const normFeatures = data.normalized_features || {}
  const humanEval = data.human_evaluation || null

  const classColor = model_prediction?.predicted_class === 'Obfuscated' ? '#ef4444'
    : model_prediction?.predicted_class === 'Moderate' ? '#eab308'
    : '#22c55e'

  const probColors = { Obfuscated: '#ef4444', Moderate: '#eab308', Easy: '#22c55e' }

  return (
    <main className="container-app" style={{ paddingTop: 96, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 32 }}>
      {/* Breadcrumb & Header */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible">
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)', marginBottom: 20 }}>
          <Link to="/directory" style={{ color: 'var(--text-secondary)', display: 'flex', alignItems: 'center', gap: 4 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>grid_view</span>
            Directory
          </Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{companyName}</span>
        </nav>

        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
            <div style={{
              width: 64, height: 64, borderRadius: 16,
              background: `${classColor}15`, border: `1px solid ${classColor}30`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 28, fontWeight: 700, color: classColor,
              fontFamily: 'Geist,sans-serif',
            }}>
              {companyName.charAt(0)}
            </div>
            <div>
              <h1 className="text-display">{companyName}</h1>
              <p className="text-body-md" style={{ color: 'var(--text-secondary)', marginTop: 4 }}>
                Privacy Policy — Obfuscation Analysis Report
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <RiskBadge label={model_prediction?.predicted_class} />
          </div>
        </div>

        {/* Accent bar */}
        <div style={{ height: 3, width: '100%', background: `linear-gradient(to right, ${classColor}, transparent)`, borderRadius: 99, marginTop: 24, opacity: 0.6 }} />
      </motion.div>

      {/* Top KPI Row */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.1 }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16 }}
      >
        {[
          { label: 'Obfuscation Score', value: `${data.obfuscation_score?.toFixed(1) ?? features.word_count ?? '—'}/100`, icon: 'monitoring', color: classColor },
          { label: 'Word Count', value: `${(features.word_count ?? 0).toLocaleString()} words`, icon: 'text_fields', color: 'var(--primary)' },
          { label: 'Readability Level', value: data.readability_level || '—', icon: 'menu_book', color: 'var(--tertiary)' },
          { label: 'Legal Term Count', value: features.legal_term_count ?? '—', icon: 'gavel', color: '#8b5cf6' },
        ].map(({ label, value, icon, color }) => (
          <div key={label} className="card" style={{ padding: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color }}>{icon}</span>
              <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{label}</span>
            </div>
            <div className="text-headline-md" style={{ color, fontWeight: 700 }}>{value}</div>
          </div>
        ))}
      </motion.div>

      {/* ML Prediction Section */}
      <motion.div variants={fadeUp} initial="hidden" animate="visible" transition={{ delay: 0.15 }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}
      >
        {/* Score Gauge */}
        <div className="card" style={{ padding: 32, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16 }}>
          <h3 className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', alignSelf: 'flex-start' }}>
            ML Confidence
          </h3>
          <ScoreGauge score={model_prediction?.confidence ?? 0} size={160} label="Confidence" />
          <div style={{ textAlign: 'center' }}>
            <div className="text-headline-md" style={{ marginBottom: 4 }}>{model_prediction?.predicted_class} Complexity</div>
            <p style={{ fontSize: 13, color: 'var(--text-secondary)' }}>XGBoost classification result</p>
          </div>
        </div>

        {/* Probabilities */}
        <div className="card" style={{ padding: 32 }}>
          <h3 className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 28 }}>
            Probability Distribution
          </h3>
          {['Obfuscated', 'Moderate', 'Easy'].map((cls) => {
            const prob = model_prediction?.probabilities?.[cls] ?? 0
            return (
              <div key={cls} style={{ marginBottom: 24 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 10, height: 10, borderRadius: 3, background: probColors[cls] }} />
                    <span className="text-body-md" style={{ fontWeight: 500 }}>{cls}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: probColors[cls] }}>
                    {(prob * 100).toFixed(1)}%
                  </span>
                </div>
                <AnimatedBar pct={prob * 100} color={probColors[cls]} />
              </div>
            )
          })}

          {/* AI Summary */}
          <div style={{ marginTop: 24, background: 'var(--surface-container-low)', padding: 16, borderRadius: 10, borderLeft: `3px solid ${classColor}` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 18, color: classColor, marginTop: 1 }}>auto_awesome</span>
              <div>
                <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 4 }}>AI Summary</div>
                <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  Based on linguistic features, this policy exhibits characteristics of a{' '}
                  <strong style={{ color: classColor }}>{model_prediction?.predicted_class?.toLowerCase()} obfuscation</strong> policy,
                  with a Flesch Reading Ease of <strong>{features.flesch_reading_ease?.toFixed(1) ?? '—'}</strong> and
                  an average sentence length of <strong>{features.avg_sentence_length?.toFixed(1) ?? '—'} words</strong>.
                </p>
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Feature Details */}
      <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}
      >
        {/* Raw Features */}
        <div className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-container-low)' }}>
            <h3 className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Raw Linguistic Features
            </h3>
          </div>
          <div style={{ padding: '8px 24px' }}>
            <MetaRow label="Word Count" value={(features.word_count ?? 0).toLocaleString()} />
            <MetaRow label="Sentence Count" value={(features.sentence_count ?? 0).toLocaleString()} />
            <MetaRow label="Avg Sentence Length" value={`${features.avg_sentence_length?.toFixed(1) ?? '—'} words`} />
            <MetaRow label="Unique Words" value={(features.unique_words ?? 0).toLocaleString()} />
            <MetaRow label="Character Count" value={(features.char_count ?? 0).toLocaleString()} />
            <MetaRow label="Legal Term Count" value={features.legal_term_count ?? '—'} />
            <MetaRow label="Flesch Reading Ease" value={features.flesch_reading_ease?.toFixed(2) ?? '—'} />
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '12px 0' }}>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>Flesch-Kincaid Grade</span>
              <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{features.flesch_kincaid_grade?.toFixed(2) ?? '—'}</span>
            </div>
          </div>
        </div>

        {/* Normalized Features */}
        <div className="card" style={{ padding: 24 }}>
          <h3 className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 24 }}>
            Normalized Features (0–1 scale)
          </h3>
          {[
            { key: 'norm_word_count', label: 'Word Count', color: 'var(--primary)' },
            { key: 'norm_avg_sentence_length', label: 'Avg Sentence Length', color: 'var(--tertiary)' },
            { key: 'norm_unique_words', label: 'Unique Words', color: '#8b5cf6' },
            { key: 'norm_flesch_reading_ease', label: 'Flesch RE (inverted)', color: '#ef4444' },
            { key: 'norm_legal_term_count', label: 'Legal Term Count', color: '#059669' },
          ].map(({ key, label, color }) => {
            const val = normFeatures[key] ?? 0
            return (
              <div key={key} style={{ marginBottom: 18 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>{label}</span>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color }}>{(val * 100).toFixed(1)}%</span>
                </div>
                <AnimatedBar pct={val * 100} color={color} />
              </div>
            )
          })}
        </div>
      </motion.div>

      {/* Human Evaluation (if available) */}
      {humanEval && (
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ overflow: 'hidden' }}>
          <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-container-low)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h3 className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              Human Evaluation Results
            </h3>
            {humanEval.is_manual && (
              <span style={{ background: 'var(--primary-fixed)', color: 'var(--primary)', padding: '4px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600 }}>
                Manually Verified
              </span>
            )}
          </div>
          <div style={{ padding: 24 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, marginBottom: 24 }}>
              {[
                { label: 'Human Class', value: humanEval.human_class, isText: true },
                { label: 'Human Score', value: `${(humanEval.human_obfuscation * 100).toFixed(1)}/100` },
                { label: 'Q1 — Readability', value: `${humanEval.Q1_readability}/5` },
                { label: 'Q2 — Jargon', value: `${humanEval.Q2_jargon}/5` },
                { label: 'Q3 — Data Clarity', value: `${humanEval.Q3_data_clarity}/5` },
                { label: 'Q4 — Opt-Out', value: `${humanEval.Q4_opt_out}/5` },
              ].map(({ label, value, isText }) => (
                <div key={label} style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 10 }}>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 6, textTransform: 'uppercase' }}>{label}</div>
                  <div className="text-headline-md" style={{ color: isText ? classColor : 'var(--text-primary)', fontWeight: 700 }}>{value}</div>
                </div>
              ))}
            </div>
            {/* Agreement indicator */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: 16, background: humanEval.human_class === model_prediction?.predicted_class ? 'rgba(34,197,94,0.06)' : 'rgba(234,179,8,0.06)', borderRadius: 10, border: `1px solid ${humanEval.human_class === model_prediction?.predicted_class ? '#22c55e40' : '#eab30840'}` }}>
              <span className="material-symbols-outlined" style={{ fontSize: 20, color: humanEval.human_class === model_prediction?.predicted_class ? '#22c55e' : '#eab308' }}>
                {humanEval.human_class === model_prediction?.predicted_class ? 'check_circle' : 'info'}
              </span>
              <span style={{ fontSize: 14, color: 'var(--text-secondary)' }}>
                {humanEval.human_class === model_prediction?.predicted_class
                  ? `Model and human evaluators are in agreement: both classify this as "${model_prediction?.predicted_class}".`
                  : `Model prediction (${model_prediction?.predicted_class}) differs from human evaluation (${humanEval.human_class}).`}
              </span>
            </div>
          </div>
        </motion.div>
      )}

      {/* Back + Action Buttons */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingTop: 8 }}>
        <Link to="/directory" className="btn-secondary" style={{ display: 'inline-flex' }}>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_back</span>
          Back to Directory
        </Link>
        <Link to="/analyzer" className="btn-primary">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>analytics</span>
          Analyze Your Own Policy
        </Link>
      </div>
    </main>
  )
}
