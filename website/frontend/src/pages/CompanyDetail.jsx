import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { getCompany } from '../api/client'
import { ScoreGauge, FeatureBar } from '../components/UI'

export default function CompanyDetail() {
  const { name } = useParams()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    getCompany(name)
      .then(res => setData(res.data))
      .catch(err => console.error(err))
      .finally(() => setLoading(false))
  }, [name])

  if (loading) return <div style={{ paddingTop: 120, textAlign: 'center' }}>Loading report...</div>
  if (!data) return <div style={{ paddingTop: 120, textAlign: 'center' }}>Company not found.</div>

  const { company, model_prediction } = data

  return (
    <main className="container-app" style={{ paddingTop: 96, paddingBottom: 96, display: 'flex', flexDirection: 'column', gap: 40 }}>
      {/* Top Header */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
        <nav style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 14, color: 'var(--text-secondary)' }}>
          <Link to="/directory" style={{ color: 'var(--text-secondary)' }}>Directory</Link>
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>chevron_right</span>
          <span style={{ color: 'var(--text-primary)', fontWeight: 500 }}>{company.company}</span>
        </nav>
        <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'space-between', gap: 24, alignItems: 'flex-end' }}>
          <div>
            <h1 className="text-display">{company.company}</h1>
            <p className="text-body-lg" style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Obfuscation Analysis Report</p>
          </div>
          <div style={{ display: 'flex', gap: 12 }}>
            <button className="btn-secondary"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>download</span> Download PDF</button>
            <button className="btn-primary"><span className="material-symbols-outlined" style={{ fontSize: 16 }}>bar_chart</span> Compare</button>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 24 }}>
        {/* Risk Badge */}
        <div className="card" style={{ padding: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: 4, background: model_prediction.predicted_class === 'Obfuscated' ? 'var(--error)' : model_prediction.predicted_class === 'Moderate' ? '#eab308' : '#22c55e', opacity: 0.5 }} />
          <h3 className="font-mono" style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 16 }}>Overall Assessment</h3>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
            <span className="material-symbols-outlined" style={{ fontSize: 32, color: model_prediction.predicted_class === 'Obfuscated' ? 'var(--error)' : model_prediction.predicted_class === 'Moderate' ? '#eab308' : '#22c55e' }}>
              {model_prediction.predicted_class === 'Obfuscated' ? 'error' : model_prediction.predicted_class === 'Moderate' ? 'warning' : 'check_circle'}
            </span>
            <span className="text-headline-md">{model_prediction.predicted_class} Complexity</span>
          </div>
          <div style={{ background: 'var(--surface)', padding: 16, borderRadius: 8, fontSize: 14 }}>
            <strong>AI Summary:</strong> Based on linguistic features, this privacy policy exhibits characteristics of a {model_prediction.predicted_class.toLowerCase()} policy.
          </div>
        </div>

        {/* Gauge */}
        <div className="card" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
          <h3 className="font-mono" style={{ fontSize: 14, color: 'var(--text-secondary)', textTransform: 'uppercase', marginBottom: 16, alignSelf: 'flex-start' }}>Engine Confidence</h3>
          <ScoreGauge score={model_prediction.confidence} size={160} label="Confidence" />
        </div>
      </div>

      {/* Details Table */}
      <div className="card" style={{ overflow: 'hidden' }}>
        <div style={{ padding: '16px 24px', borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-bright)' }}>
          <h3 className="font-mono text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Linguistic Feature Extraction</h3>
        </div>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', textAlign: 'left', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border-subtle)', background: 'var(--surface-container-lowest)' }}>
                <th className="font-mono" style={{ padding: '12px 24px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 500 }}>Feature Indicator</th>
                <th className="font-mono" style={{ padding: '12px 24px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', fontWeight: 500 }}>Detected Value</th>
              </tr>
            </thead>
            <tbody className="text-body-md" style={{ fontSize: 14 }}>
              {[
                { k: 'Word Count', v: company.word_count },
                { k: 'Unique Words', v: company.unique_words },
                { k: 'Average Sentence Length', v: `${company.avg_sentence_length.toFixed(1)} words` },
                { k: 'Legal Term Count', v: company.legal_term_count },
                { k: 'Flesch Reading Ease', v: `${company.flesch_reading_ease.toFixed(1)}` },
                { k: 'Flesch Kincaid Grade', v: company.flesch_kincaid_grade.toFixed(1) },
                { k: 'Obfuscation Score', v: `${company.obfuscation_score.toFixed(1)}/100` },
              ].map((f) => (
                <tr key={f.k} style={{ borderBottom: '1px solid rgba(229,231,235,0.5)' }}>
                  <td style={{ padding: '16px 24px', fontWeight: 500 }}>{f.k}</td>
                  <td className="font-mono" style={{ padding: '16px 24px', color: 'var(--text-secondary)' }}>{f.v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </main>
  )
}
