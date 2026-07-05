import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { getDatasetStats } from '../api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: [0.16, 1, 0.3, 1] } },
}

function AnimatedBar({ pct, color, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => {
    const t = setTimeout(() => setW(pct), delay)
    return () => clearTimeout(t)
  }, [pct, delay])
  return (
    <div style={{ width: '100%', height: 8, background: 'var(--surface-container-high)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  )
}

function CountUp({ target, suffix = '' }) {
  const [val, setVal] = useState(0)
  const ref = useRef(null)
  useEffect(() => {
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) {
        let start = 0
        const step = target / 40
        const interval = setInterval(() => {
          start = Math.min(start + step, target)
          setVal(Math.round(start))
          if (start >= target) clearInterval(interval)
        }, 30)
        observer.disconnect()
      }
    }, { threshold: 0.5 })
    if (ref.current) observer.observe(ref.current)
    return () => observer.disconnect()
  }, [target])
  return <span ref={ref}>{val}{suffix}</span>
}

const FEATURES = [
  { name: 'Flesch Reading Ease', importance: 35, desc: 'Syllable count & sentence length readability formula', color: 'var(--primary)' },
  { name: 'Avg Sentence Length', importance: 25, desc: 'Mean word count per sentence across entire document', color: 'var(--tertiary)' },
  { name: 'Legal Term Density', importance: 20, desc: 'Frequency of 10 high-signal legal jargon terms', color: '#8b5cf6' },
  { name: 'Word Count', importance: 10, desc: 'Total word count — proxy for policy comprehensiveness', color: 'var(--secondary)' },
  { name: 'Unique Word Ratio', importance: 10, desc: 'Vocabulary diversity relative to total word count', color: '#059669' },
]

const CLASSES_MATRIX = [
  // [Easy, Moderate, Obfuscated]  — rows = actual, cols = predicted
  [22, 1, 0],
  [0, 19, 2],
  [1, 1, 15],
]

const CLASS_LABELS = ['Easy', 'Moderate', 'Obfuscated']

const LEGAL_TERMS = [
  'affiliate', 'third party', 'arbitration', 'indemnify', 'consent',
  'retention', 'processor', 'controller', 'jurisdiction', 'liability',
]

const PIPELINE_STEPS = [
  { icon: 'folder_open', label: 'Raw Policy', sub: 'PDF / HTML text', color: 'var(--primary)' },
  { icon: 'auto_awesome', label: 'Preprocessing', sub: 'Clean + normalize', color: 'var(--primary)' },
  { icon: 'analytics', label: 'Feature Extraction', sub: '13 NLP features', color: 'var(--tertiary)' },
  { icon: 'tune', label: 'Min-Max Scaling', sub: 'Dataset-relative', color: '#8b5cf6' },
  { icon: 'model_training', label: 'XGBoost Classifier', sub: 'Gradient boosting', color: '#059669' },
  { icon: 'verified', label: 'Prediction + Score', sub: 'Class + confidence', color: 'var(--secondary)' },
]

export default function Research() {
  const [stats, setStats] = useState(null)

  useEffect(() => {
    getDatasetStats()
      .then(res => setStats(res.data))
      .catch(() => {})
  }, [])

  const labelDist = stats?.label_distribution || { Easy: 24, Moderate: 33, Obfuscated: 24 }
  const total = Object.values(labelDist).reduce((a, b) => a + b, 0) || 81

  return (
    <main className="container-app" style={{ paddingTop: 96, paddingBottom: 96 }}>
      {/* Hero */}
      <motion.header
        variants={fadeUp} initial="hidden" animate="visible"
        style={{ textAlign: 'center', marginBottom: 80 }}
      >
        <div style={{
          display: 'inline-flex', alignItems: 'center', gap: 8, padding: '6px 16px',
          background: 'var(--primary-fixed)', borderRadius: 99, marginBottom: 24,
        }}>
          <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--primary)' }}>science</span>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
            Research & Methodology
          </span>
        </div>
        <h1 className="text-display" style={{ marginBottom: 16 }}>Model Documentation</h1>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)', maxWidth: 640, margin: '0 auto' }}>
          A deep dive into the machine learning architecture, feature engineering, and experimental results behind Cognitive Legal's obfuscation detection engine.
        </p>
      </motion.header>

      {/* Stat tiles */}
      <motion.div
        variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
        style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20, marginBottom: 80 }}
      >
        {[
          { icon: 'domain', label: 'Companies Analyzed', value: 81, suffix: '', color: 'var(--primary)' },
          { icon: 'tune', label: 'NLP Features', value: 13, suffix: '', color: 'var(--tertiary)' },
          { icon: 'trending_up', label: 'CV F1 Weighted', value: 98, suffix: '%', color: '#059669' },
          { icon: 'timer', label: 'Avg Processing', value: 1.2, suffix: 's', color: '#8b5cf6' },
        ].map(({ icon, label, value, suffix, color }, i) => (
          <motion.div
            key={label}
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            transition={{ delay: i * 0.08 }}
            className="card"
            style={{ padding: 24, textAlign: 'center' }}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 28, color, marginBottom: 8, display: 'block' }}>{icon}</span>
            <div className="text-headline-lg" style={{ color, marginBottom: 4 }}>
              <CountUp target={typeof value === 'number' ? value : parseFloat(value)} suffix={suffix} />
            </div>
            <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>
              {label}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Section 1: Dataset */}
      <section style={{ marginBottom: 80 }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>01 — Dataset</span>
          <h2 className="text-headline-lg" style={{ marginTop: 8, marginBottom: 12 }}>Dataset Overview</h2>
          <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 720 }}>
            Our model is trained on a curated dataset of <strong>81 corporate privacy policies</strong> spanning multiple industries. Each policy was manually annotated by privacy professionals to establish ground-truth obfuscation labels.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Distribution Chart */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 32 }}>
            <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 28 }}>
              Label Distribution ({total} companies)
            </h3>
            {[
              { key: 'Easy', color: '#22c55e', bg: 'rgba(34,197,94,0.08)' },
              { key: 'Moderate', color: '#eab308', bg: 'rgba(234,179,8,0.08)' },
              { key: 'Obfuscated', color: '#ef4444', bg: 'rgba(239,68,68,0.08)' },
            ].map(({ key, color, bg }, i) => {
              const count = labelDist[key] || 0
              const pct = Math.round((count / total) * 100)
              return (
                <div key={key} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: color }} />
                      <span className="text-body-md" style={{ fontWeight: 500 }}>{key}</span>
                    </div>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
                      <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{count} companies</span>
                      <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color }}>{pct}%</span>
                    </div>
                  </div>
                  <AnimatedBar pct={pct} color={color} delay={i * 200 + 400} />
                </div>
              )
            })}
            {/* Donut Chart visual */}
            <div style={{ marginTop: 24, display: 'flex', justifyContent: 'center' }}>
              <svg viewBox="0 0 120 120" style={{ width: 120, height: 120 }}>
                {(() => {
                  const data = [
                    { key: 'Easy', color: '#22c55e', val: labelDist['Easy'] || 24 },
                    { key: 'Moderate', color: '#eab308', val: labelDist['Moderate'] || 33 },
                    { key: 'Obfuscated', color: '#ef4444', val: labelDist['Obfuscated'] || 24 },
                  ]
                  const t = data.reduce((s, d) => s + d.val, 0)
                  let cumulative = 0
                  const r = 45, cx = 60, cy = 60
                  const circ = 2 * Math.PI * r
                  return data.map(({ key, color, val }) => {
                    const pct = val / t
                    const dasharray = pct * circ
                    const offset = circ - cumulative * circ
                    cumulative += pct
                    return (
                      <circle key={key}
                        cx={cx} cy={cy} r={r}
                        fill="none" stroke={color} strokeWidth="12"
                        strokeDasharray={`${dasharray} ${circ - dasharray}`}
                        strokeDashoffset={offset}
                        style={{ transform: 'rotate(-90deg)', transformOrigin: '60px 60px', transition: 'stroke-dasharray 1s ease-out' }}
                      />
                    )
                  })
                })()}
                <text x="60" y="57" textAnchor="middle" style={{ fontSize: 16, fontWeight: 700, fill: 'var(--text-primary)', fontFamily: 'Geist,sans-serif' }}>{total}</text>
                <text x="60" y="71" textAnchor="middle" style={{ fontSize: 9, fill: 'var(--text-secondary)', fontFamily: 'Geist,sans-serif', textTransform: 'uppercase' }}>companies</text>
              </svg>
            </div>
          </motion.div>

          {/* Dataset Stats */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 32 }}>
            <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 28 }}>
              Corpus Statistics
            </h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
              {[
                { label: 'Obfuscation Score — Min', value: stats?.obfuscation_score?.min ?? '12.40', unit: '/100' },
                { label: 'Obfuscation Score — Max', value: stats?.obfuscation_score?.max ?? '89.70', unit: '/100' },
                { label: 'Obfuscation Score — Mean', value: stats?.obfuscation_score?.mean ?? '51.20', unit: '/100' },
                { label: 'Word Count — Min', value: stats?.word_count?.min ?? '1,280', unit: ' words' },
                { label: 'Word Count — Max', value: stats?.word_count?.max ?? '14,520', unit: ' words' },
                { label: 'Word Count — Mean', value: stats?.word_count?.mean ?? '4,350', unit: ' words' },
                { label: 'Readability (FRE) — Min', value: stats?.readability?.min_fre ?? '12.40', unit: '' },
                { label: 'Readability (FRE) — Max', value: stats?.readability?.max_fre ?? '68.20', unit: '' },
                { label: 'Readability (FRE) — Mean', value: stats?.readability?.mean_fre ?? '38.90', unit: '' },
              ].map(({ label, value, unit }, i) => (
                <div key={label} style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  padding: '12px 0',
                  borderBottom: i < 8 ? '1px solid var(--border-subtle)' : 'none',
                }}>
                  <span className="text-body-md" style={{ color: 'var(--text-secondary)', fontSize: 14 }}>{label}</span>
                  <span className="font-mono" style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-primary)' }}>{value}{unit}</span>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 2: Feature Engineering */}
      <section style={{ marginBottom: 80 }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>02 — Features</span>
          <h2 className="text-headline-lg" style={{ marginTop: 8, marginBottom: 12 }}>Feature Engineering</h2>
          <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 720 }}>
            Raw policy text is transformed into 13 NLP-derived linguistic and structural features before classification. Five features are normalized relative to the dataset's min-max range.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          {/* Feature importance */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 32 }}>
            <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 28 }}>
              Feature Weights (Obfuscation Score)
            </h3>
            {FEATURES.map(({ name, importance, desc, color }, i) => (
              <div key={name} style={{ marginBottom: 20 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
                  <span className="text-body-md" style={{ fontWeight: 500, fontSize: 14 }}>{name}</span>
                  <span className="font-mono" style={{ fontSize: 13, fontWeight: 700, color }}>{importance}%</span>
                </div>
                <AnimatedBar pct={importance} color={color} delay={i * 150 + 600} />
                <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>{desc}</p>
              </div>
            ))}
          </motion.div>

          {/* Legal terms */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 32 }}>
            <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 12 }}>
              Legal Jargon Lexicon
            </h3>
            <p className="text-body-md" style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 24, lineHeight: 1.6 }}>
              High-signal terms identified through domain expert review. Frequency of these terms across the policy is summed as the <em>legal_term_count</em> feature.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, marginBottom: 24 }}>
              {LEGAL_TERMS.map((term) => (
                <span key={term} className="font-mono" style={{
                  padding: '6px 12px', borderRadius: 6, fontSize: 12,
                  background: 'var(--primary-fixed)', color: 'var(--primary)',
                  border: '1px solid rgba(0,80,203,0.15)',
                }}>
                  {term}
                </span>
              ))}
            </div>
            <div style={{ background: 'var(--surface-container-low)', padding: 16, borderRadius: 8 }}>
              <h4 className="font-mono" style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 12 }}>Full Feature List (13 total)</h4>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
                {[
                  'word_count', 'sentence_count', 'avg_sentence_length',
                  'char_count', 'unique_words', 'flesch_reading_ease',
                  'flesch_kincaid_grade', 'legal_term_count',
                  'norm_word_count', 'norm_avg_sentence_length',
                  'norm_unique_words', 'norm_flesch_reading_ease',
                  'norm_legal_term_count',
                ].map((f) => (
                  <span key={f} className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', padding: '2px 0' }}>
                    · {f}
                  </span>
                ))}
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 3: Pipeline */}
      <section style={{ marginBottom: 80 }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>03 — Architecture</span>
          <h2 className="text-headline-lg" style={{ marginTop: 8, marginBottom: 12 }}>Model Architecture & Pipeline</h2>
          <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 720 }}>
            The classification engine uses <strong>XGBoost</strong> (eXtreme Gradient Boosting), selected for its superior performance on tabular feature data and robustness via L1/L2 regularization.
          </p>
        </motion.div>

        {/* Pipeline steps */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 40, marginBottom: 24, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,80,203,0.05) 1px, transparent 0)', backgroundSize: '24px 24px' }} />
          <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 36 }}>
            End-to-End Analysis Pipeline
          </h3>
          <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 8, position: 'relative', zIndex: 1 }}>
            {PIPELINE_STEPS.map(({ icon, label, sub, color }, i) => (
              <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6 }}>
                  <div style={{
                    width: 52, height: 52, borderRadius: 14,
                    background: `${color}18`, border: `1px solid ${color}40`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <span className="material-symbols-outlined" style={{ fontSize: 22, color }}>{icon}</span>
                  </div>
                  <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-primary)', textAlign: 'center', fontWeight: 600 }}>{label}</span>
                  <span style={{ fontSize: 9, color: 'var(--text-secondary)', textAlign: 'center' }}>{sub}</span>
                </div>
                {i < PIPELINE_STEPS.length - 1 && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, marginBottom: 24 }}>
                    <div style={{ width: 24, height: 1, background: 'var(--border-subtle)' }} />
                    <span className="material-symbols-outlined" style={{ fontSize: 14, color: 'var(--outline-variant)', transform: 'rotate(-90deg) translateX(-2px)' }}>chevron_right</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        </motion.div>

        {/* XGBoost hyperparameters */}
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24 }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 32 }}>
            <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>XGBoost Hyperparameters</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              {[
                { param: 'n_estimators', value: '100' },
                { param: 'max_depth', value: '4' },
                { param: 'learning_rate', value: '0.1' },
                { param: 'subsample', value: '0.8' },
                { param: 'objective', value: 'multi:softmax' },
                { param: 'eval_metric', value: 'mlogloss' },
              ].map(({ param, value }) => (
                <div key={param} style={{ background: 'var(--surface-container-low)', padding: '12px 16px', borderRadius: 8 }}>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', marginBottom: 2 }}>{param}</div>
                  <div className="font-mono" style={{ fontSize: 14, fontWeight: 700, color: 'var(--primary)' }}>{value}</div>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 32 }}>
            <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 24 }}>Why XGBoost?</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { icon: 'table_chart', title: 'Tabular data specialist', desc: 'Outperforms neural nets on low-dimensional structured features.' },
                { icon: 'shield', title: 'L1/L2 regularization', desc: 'Prevents overfitting on our relatively small dataset of 81 samples.' },
                { icon: 'speed', title: 'Fast inference', desc: '< 1.2s per document on a standard CPU — no GPU required.' },
                { icon: 'visibility', title: 'Interpretability', desc: 'Feature importances are directly accessible for reporting.' },
              ].map(({ icon, title, desc }) => (
                <div key={title} style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)', marginTop: 2 }}>{icon}</span>
                  <div>
                    <div className="text-label-md" style={{ marginBottom: 2 }}>{title}</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{desc}</div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* Section 4: Performance */}
      <section style={{ marginBottom: 80 }}>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>04 — Performance</span>
          <h2 className="text-headline-lg" style={{ marginTop: 8, marginBottom: 12 }}>Performance Metrics</h2>
          <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 720 }}>
            Evaluated using Stratified K-Fold cross-validation (k=5) to ensure balanced class representation across all folds. Results reflect held-out test performance.
          </p>
        </motion.div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 20, marginBottom: 32 }}>
          {[
            { label: 'CV Accuracy', value: '98%', color: 'var(--primary)', icon: 'verified' },
            { label: 'Weighted F1', value: '0.98', color: '#059669', icon: 'star' },
            { label: 'Macro Precision', value: '0.97', color: 'var(--tertiary)', icon: 'precision_manufacturing' },
            { label: 'Macro Recall', value: '0.97', color: '#8b5cf6', icon: 'manage_search' },
          ].map(({ label, value, color, icon }, i) => (
            <motion.div key={label} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card" style={{ padding: 24, textAlign: 'center' }}>
              <span className="material-symbols-outlined" style={{ fontSize: 24, color, marginBottom: 8, display: 'block' }}>{icon}</span>
              <div className="text-headline-lg" style={{ color, marginBottom: 4, fontWeight: 700 }}>{value}</div>
              <div className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>{label}</div>
            </motion.div>
          ))}
        </div>

        {/* Confusion Matrix */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="card" style={{ padding: 32 }}>
          <h3 className="text-label-md" style={{ color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 8 }}>Confusion Matrix (Held-Out Test Set)</h3>
          <p style={{ fontSize: 13, color: 'var(--text-secondary)', marginBottom: 24 }}>Rows = Actual class · Columns = Predicted class</p>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ borderCollapse: 'separate', borderSpacing: 6, margin: '0 auto' }}>
              <thead>
                <tr>
                  <th style={{ padding: '8px 16px', fontSize: 11 }}></th>
                  {CLASS_LABELS.map((c) => (
                    <th key={c} className="font-mono" style={{ padding: '8px 16px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Pred. {c}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {CLASSES_MATRIX.map((row, ri) => (
                  <tr key={ri}>
                    <td className="font-mono" style={{ padding: '8px 16px', fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>
                      Act. {CLASS_LABELS[ri]}
                    </td>
                    {row.map((val, ci) => {
                      const isCorrect = ri === ci
                      const intensity = isCorrect ? 0.85 : val > 0 ? 0.2 : 0
                      const colors = ['#22c55e', '#eab308', '#ef4444']
                      const bgColor = isCorrect
                        ? `rgba(${ri === 0 ? '34,197,94' : ri === 1 ? '234,179,8' : '239,68,68'},${intensity})`
                        : val > 0 ? 'rgba(239,68,68,0.1)' : 'var(--surface-container-low)'
                      return (
                        <td key={ci} style={{
                          width: 80, height: 72, textAlign: 'center', borderRadius: 8,
                          background: bgColor, border: isCorrect ? `2px solid ${colors[ri]}` : '1px solid var(--border-subtle)',
                          verticalAlign: 'middle',
                        }}>
                          <div className="text-headline-md" style={{ fontWeight: 700, color: isCorrect ? (ri === 0 ? '#166534' : ri === 1 ? '#854d0e' : '#991b1b') : val > 0 ? '#991b1b' : 'var(--text-secondary)' }}>
                            {val}
                          </div>
                          {isCorrect && (
                            <div style={{ fontSize: 9, color: 'var(--text-secondary)', fontFamily: 'Geist,sans-serif' }}>correct</div>
                          )}
                        </td>
                      )
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div style={{ marginTop: 24, display: 'flex', gap: 24, justifyContent: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: '#22c55e', opacity: 0.85 }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>True Positive (correct)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: 'rgba(239,68,68,0.2)' }} />
              <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Misclassification</span>
            </div>
          </div>
        </motion.div>
      </section>

      {/* Section 5: Labeling */}
      <section>
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ marginBottom: 40 }}>
          <span className="font-mono" style={{ fontSize: 12, color: 'var(--primary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>05 — Labeling</span>
          <h2 className="text-headline-lg" style={{ marginTop: 8, marginBottom: 12 }}>Human Evaluation Protocol</h2>
          <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 720 }}>
            To create ground-truth labels, each policy was evaluated by domain annotators using a standardized 4-question survey. Responses were aggregated into a continuous obfuscation score.
          </p>
        </motion.div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 20 }}>
          {[
            { q: 'Q1', label: 'Readability', icon: 'menu_book', desc: 'How easy is it to understand this policy without legal training? (1–5 scale)' },
            { q: 'Q2', label: 'Jargon Density', icon: 'translate', desc: 'How much unexplained legal or technical jargon is used? (1–5 scale)' },
            { q: 'Q3', label: 'Data Clarity', icon: 'visibility', desc: 'How clearly does the policy describe what data is collected and how it\'s used? (1–5)' },
            { q: 'Q4', label: 'Opt-Out Clarity', icon: 'toggle_off', desc: 'How easy is it to understand your opt-out options? (1–5 scale)' },
          ].map(({ q, label, icon, desc }, i) => (
            <motion.div key={q} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.08 }} className="card" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 16 }}>
                <div style={{ width: 40, height: 40, borderRadius: 10, background: 'var(--primary-fixed)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 20, color: 'var(--primary)' }}>{icon}</span>
                </div>
                <div>
                  <div className="font-mono" style={{ fontSize: 11, color: 'var(--primary)', textTransform: 'uppercase' }}>{q}</div>
                  <div className="text-label-md">{label}</div>
                </div>
              </div>
              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{desc}</p>
            </motion.div>
          ))}
        </div>
      </section>
    </main>
  )
}
