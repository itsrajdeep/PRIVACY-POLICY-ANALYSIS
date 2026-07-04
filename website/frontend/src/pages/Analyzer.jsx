import { useState } from 'react'
import { motion } from 'framer-motion'
import { analyzeText, analyzeUrl } from '../api/client'
import { ScoreGauge, RiskBadge, FeatureBar } from '../components/UI'

export default function Analyzer() {
  const [tab, setTab] = useState('paste')
  const [text, setText] = useState('')
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)
  const [loadingStep, setLoadingStep] = useState(0)
  const [result, setResult] = useState(null)
  const [error, setError] = useState(null)

  const steps = ['Reading policy text...', 'Computing readability metrics...', 'Running ML classifier...', 'Generating insights...']

  const handleAnalyze = async () => {
    setError(null)
    setResult(null)
    setLoading(true)
    setLoadingStep(0)

    const stepInterval = setInterval(() => {
      setLoadingStep((s) => Math.min(s + 1, steps.length - 1))
    }, 800)

    try {
      const res = tab === 'paste'
        ? await analyzeText(text)
        : await analyzeUrl(url)
      clearInterval(stepInterval)
      setLoadingStep(steps.length)
      setTimeout(() => {
        setResult(res.data)
        setLoading(false)
      }, 400)
    } catch (err) {
      clearInterval(stepInterval)
      setError(err.response?.data?.error || 'Analysis failed. Make sure the Flask backend is running on port 5000.')
      setLoading(false)
    }
  }

  const wordCount = text.trim() === '' ? 0 : text.trim().split(/\s+/).length

  return (
    <main className="container-app" style={{ paddingTop: 96, maxWidth: 896, margin: '0 auto' }}>
      <header style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1 className="text-headline-lg" style={{ marginBottom: 16 }}>Analyze Privacy Policy</h1>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto' }}>
          Upload or paste your document to detect potential obfuscation and compliance risks using our advanced ML classifier.
        </p>
      </header>

      {/* Input Section */}
      {!loading && !result && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="card" style={{ overflow: 'hidden' }}>
          {/* Tabs */}
          <div style={{ display: 'flex', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-container-lowest)' }}>
            {[
              { key: 'paste', icon: 'content_paste', label: 'Paste Text' },
              { key: 'url', icon: 'link', label: 'Website URL' },
            ].map(({ key, icon, label }) => (
              <button
                key={key}
                onClick={() => setTab(key)}
                className="text-label-md"
                style={{
                  flex: 1, padding: 16, border: 'none', cursor: 'pointer',
                  background: 'transparent',
                  color: tab === key ? 'var(--primary)' : 'var(--on-surface-variant)',
                  borderBottom: tab === key ? '2px solid var(--primary)' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all 0.2s',
                }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 18 }}>{icon}</span>
                {label}
              </button>
            ))}
          </div>

          <div style={{ padding: 24 }}>
            {tab === 'paste' && (
              <div style={{ position: 'relative' }}>
                <textarea
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  placeholder="Paste privacy policy text here..."
                  style={{
                    width: '100%', height: 256, padding: 16, border: '1px solid var(--border-subtle)',
                    borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 16, lineHeight: '24px',
                    resize: 'none', outline: 'none', background: 'var(--surface-bright)',
                    color: 'var(--on-surface)', transition: 'border-color 0.2s',
                  }}
                  onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                  onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
                />
                <div className="font-mono" style={{ position: 'absolute', bottom: 16, right: 16, display: 'flex', gap: 16, fontSize: 12, color: 'var(--on-surface-variant)' }}>
                  <span>{text.length} chars</span>
                  <span>{wordCount} words</span>
                </div>
              </div>
            )}
            {tab === 'url' && (
              <div style={{ display: 'flex', gap: 16 }}>
                <div style={{ position: 'relative', flex: 1 }}>
                  <span className="material-symbols-outlined" style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--outline)' }}>language</span>
                  <input
                    type="url"
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    placeholder="https://example.com/privacy"
                    style={{
                      width: '100%', padding: '12px 16px 12px 40px', border: '1px solid var(--border-subtle)',
                      borderRadius: 8, fontFamily: "'Inter', sans-serif", fontSize: 16,
                      outline: 'none', background: 'var(--surface-bright)',
                      color: 'var(--on-surface)', transition: 'border-color 0.2s',
                    }}
                    onFocus={(e) => (e.target.style.borderColor = 'var(--primary)')}
                    onBlur={(e) => (e.target.style.borderColor = 'var(--border-subtle)')}
                  />
                </div>
              </div>
            )}

            {error && (
              <div style={{ marginTop: 16, padding: 16, background: 'var(--error-container)', borderRadius: 8, color: 'var(--on-error-container)', fontSize: 14 }}>
                {error}
              </div>
            )}

            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'flex-end' }}>
              <button
                onClick={handleAnalyze}
                className="btn-primary"
                disabled={tab === 'paste' ? wordCount < 50 : !url}
                style={{ opacity: (tab === 'paste' ? wordCount < 50 : !url) ? 0.5 : 1 }}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>analytics</span>
                Run Analysis
              </button>
            </div>
          </div>
        </motion.section>
      )}

      {/* Loading */}
      {loading && (
        <motion.section initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-panel" style={{ borderRadius: 12, padding: 32, maxWidth: 480, margin: '0 auto', textAlign: 'center' }}>
          <div style={{ height: 4, width: '100%', background: 'var(--surface-container-highest)', borderRadius: 99, overflow: 'hidden', marginBottom: 32 }}>
            <div className="progress-bar-animated" style={{ height: '100%', width: '100%' }} />
          </div>
          <div style={{ paddingLeft: 48, borderLeft: '2px solid var(--surface-container-highest)', textAlign: 'left' }}>
            {steps.map((step, i) => (
              <div key={step} className="font-mono" style={{
                position: 'relative', padding: '8px 0', fontSize: 13,
                color: i === loadingStep ? 'var(--primary)' : 'var(--on-surface-variant)',
                fontWeight: i === loadingStep ? 600 : 400,
                opacity: i > loadingStep ? 0.4 : 1,
              }}>
                <span style={{
                  position: 'absolute', left: -29, top: '50%', transform: 'translateY(-50%)',
                  width: 12, height: 12, borderRadius: '50%',
                  background: i < loadingStep ? 'var(--primary)' : i === loadingStep ? 'var(--primary)' : 'var(--surface-container-highest)',
                  boxShadow: i === loadingStep ? '0 0 0 4px var(--primary-fixed)' : 'none',
                }} />
                {step}
              </div>
            ))}
          </div>
        </motion.section>
      )}

      {/* Results */}
      {result && result.success && (
        <motion.section initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
          {/* Top Row */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 24 }}>
            {/* Classification Badge */}
            <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', inset: 0, background: result.prediction.predicted_class === 'Obfuscated' ? 'rgba(186,26,26,0.05)' : result.prediction.predicted_class === 'Moderate' ? 'rgba(234,179,8,0.05)' : 'rgba(34,197,94,0.05)' }} />
              <h3 className="text-label-md" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24, zIndex: 1 }}>Classification</h3>
              <ScoreGauge score={result.prediction.confidence} label="Confidence" />
              <div style={{ marginTop: 16, zIndex: 1 }}>
                <RiskBadge label={result.prediction.predicted_class} />
              </div>
            </div>
            {/* Probabilities */}
            <div className="card" style={{ padding: 24 }}>
              <h3 className="text-label-md" style={{ color: 'var(--on-surface-variant)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>Probability Distribution</h3>
              {['Obfuscated', 'Moderate', 'Easy'].map((cls) => {
                const prob = result.prediction.probabilities[cls] || 0
                const colors = { Obfuscated: '#ef4444', Moderate: '#eab308', Easy: '#22c55e' }
                return (
                  <div key={cls} style={{ marginBottom: 20 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                      <span className="text-body-md" style={{ fontWeight: 500 }}>{cls}</span>
                      <span className="font-mono" style={{ fontSize: 13, color: 'var(--on-surface-variant)' }}>{prob.toFixed(3)}</span>
                    </div>
                    <div style={{ height: 8, width: '100%', background: 'var(--surface-container-highest)', borderRadius: 99, overflow: 'hidden' }}>
                      <div style={{ width: `${prob * 100}%`, height: '100%', background: colors[cls], borderRadius: 99, transition: 'width 1s ease-out' }} />
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Obfuscation Score */}
          <div className="card" style={{ padding: 24, display: 'flex', alignItems: 'center', gap: 32 }}>
            <ScoreGauge score={result.obfuscation_score} size={96} label="Score" />
            <div>
              <h3 className="text-headline-md" style={{ marginBottom: 4 }}>Obfuscation Score: {result.obfuscation_score.toFixed(1)}/100</h3>
              <p className="text-body-md" style={{ color: 'var(--text-secondary)' }}>Readability Level: <strong>{result.readability_level}</strong></p>
              <p className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 8 }}>
                Model: {result.model_info.model_name} · F1: {result.model_info.cv_f1_weighted} · {result.model_info.training_samples} training samples
              </p>
            </div>
          </div>

          {/* Feature Breakdown */}
          <div className="card" style={{ overflow: 'hidden' }}>
            <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-bright)' }}>
              <h3 className="font-mono text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linguistic Feature Extraction</h3>
            </div>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-container-lowest)' }}>
                    <th className="font-mono" style={{ padding: '12px 24px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Feature</th>
                    <th className="font-mono" style={{ padding: '12px 24px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 500 }}>Value</th>
                  </tr>
                </thead>
                <tbody className="text-body-md" style={{ fontSize: 14 }}>
                  {Object.entries(result.features).map(([key, val]) => (
                    <tr key={key} style={{ borderBottom: '1px solid rgba(229,231,235,0.5)' }}>
                      <td style={{ padding: '16px 24px', fontWeight: 500 }}>{key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())}</td>
                      <td className="font-mono" style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{typeof val === 'number' ? val.toFixed(2) : val}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* New Analysis Button */}
          <div style={{ display: 'flex', justifyContent: 'center', paddingBottom: 48 }}>
            <button onClick={() => { setResult(null); setError(null) }} className="btn-secondary">
              <span className="material-symbols-outlined" style={{ fontSize: 18 }}>refresh</span>
              New Analysis
            </button>
          </div>
        </motion.section>
      )}
    </main>
  )
}
