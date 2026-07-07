import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { getDatasetStats } from '../api/client'

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.7, ease: [0.16, 1, 0.3, 1] } },
}

function HeroDocument() {
  const linesRef = useRef([])

  useEffect(() => {
    const interval = setInterval(() => {
      linesRef.current.forEach((el) => el?.classList.remove('active'))
      const i = Math.floor(Math.random() * linesRef.current.length)
      const j = (i + 1) % linesRef.current.length
      linesRef.current[i]?.classList.add('active')
      if (Math.random() > 0.5) linesRef.current[j]?.classList.add('active')
    }, 800)
    return () => clearInterval(interval)
  }, [])

  const lines = [
    'We collect personal data...', 'including but not limited to...',
    'IP address, browser type...', 'and location information.',
    'This data may be shared...', 'with our third-party partners...',
    'for marketing purposes...', 'and analytics tracking.',
    'By using our service...', 'you consent to these terms...',
    'and binding arbitration...', 'in case of disputes.',
  ]
  const widths = ['100%','92%','100%','80%','100%','100%','83%','85%','100%','92%','100%','75%']

  return (
    <div style={{
      position: 'absolute', width: 280, height: 380, background: '#fff',
      borderRadius: 12, boxShadow: '0 20px 40px rgba(0,0,0,0.1)',
      border: '1px solid var(--border-subtle)', overflow: 'hidden', zIndex: 10,
      display: 'flex', flexDirection: 'column', left: '50%', top: '50%',
      transform: 'translate(-50%, -50%)',
    }}>
      <div style={{
        background: 'var(--surface-container-low)', padding: '8px 16px',
        borderBottom: '1px solid var(--border-subtle)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Privacy_Policy.pdf
        </span>
        <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--text-secondary)' }}>picture_as_pdf</span>
      </div>
      <div style={{ padding: 24, flex: 1, position: 'relative', background: '#fff' }}>
        <div className="scan-line" />
        {[0, 4, 8].map((start) => (
          <div key={start} style={{ marginBottom: 12 }}>
            {lines.slice(start, start + 4).map((text, idx) => (
              <div
                key={idx}
                ref={(el) => (linesRef.current[start + idx] = el)}
                className="text-line"
                style={{ width: widths[start + idx] }}
              >
                {text}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function OrbitCard({ top, right, bottom, left, width, animClass, children }) {
  return (
    <div
      className={`glass-card ${animClass}`}
      style={{
        position: 'absolute', top, right, bottom, left,
        width, borderRadius: 12, padding: 16, zIndex: 20,
      }}
    >
      {children}
    </div>
  )
}

function AnimatedFeatureBar({ pct, color, delay = 0 }) {
  const [w, setW] = useState(0)
  useEffect(() => { const t = setTimeout(() => setW(pct), delay); return () => clearTimeout(t) }, [pct, delay])
  return (
    <div style={{ width: '100%', height: 6, background: 'var(--surface-container-high)', borderRadius: 99, overflow: 'hidden' }}>
      <div style={{ width: `${w}%`, height: '100%', background: color, borderRadius: 99, transition: 'width 1.2s cubic-bezier(0.16,1,0.3,1)' }} />
    </div>
  )
}

export default function Home() {
  const sceneRef = useRef(null)
  const [liveStats, setLiveStats] = useState(null)

  useEffect(() => {
    getDatasetStats()
      .then(r => setLiveStats(r.data))
      .catch(() => {})
  }, [])

  useEffect(() => {
    const scene = sceneRef.current
    if (!scene) return
    const cards = scene.querySelectorAll('[data-depth]')
    const handleMove = (e) => {
      const x = e.clientX / window.innerWidth - 0.5
      const y = e.clientY / window.innerHeight - 0.5
      cards.forEach((card) => {
        const depth = parseFloat(card.dataset.depth) || 0.1
        card.style.transform = `translate(${x * depth * -100}px, ${y * depth * -100}px)`
      })
    }
    const handleLeave = () => cards.forEach((c) => (c.style.transform = 'translate(0,0)'))
    const container = scene.closest('section')
    container?.addEventListener('mousemove', handleMove)
    container?.addEventListener('mouseleave', handleLeave)
    return () => {
      container?.removeEventListener('mousemove', handleMove)
      container?.removeEventListener('mouseleave', handleLeave)
    }
  }, [])

  return (
    <>
      {/* Gradient Mesh Background */}
      <div style={{ position: 'fixed', inset: 0, pointerEvents: 'none', zIndex: 0, overflow: 'hidden' }}>
        <div style={{ position: 'absolute', top: '-10%', left: '-10%', width: '40%', height: '40%', borderRadius: '50%', background: 'rgba(0,80,203,0.1)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', top: '20%', right: '-10%', width: '40%', height: '50%', borderRadius: '50%', background: 'rgba(179,197,255,0.3)', filter: 'blur(140px)' }} />
        <div style={{ position: 'absolute', bottom: '-10%', left: '20%', width: '50%', height: '40%', borderRadius: '50%', background: 'rgba(255,219,208,0.4)', filter: 'blur(120px)' }} />
        <div style={{ position: 'absolute', bottom: '10%', right: '10%', width: '30%', height: '30%', borderRadius: '50%', background: 'rgba(218,225,255,0.5)', filter: 'blur(100px)' }} />
      </div>

      <main className="container-app" style={{ paddingTop: 96, position: 'relative', zIndex: 10 }}>
        {/* Hero */}
        <section style={{ minHeight: '80vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 48, padding: '48px 0 80px' }}>
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: 48, width: '100%' }}>
            <motion.div variants={fadeUp} initial="visible" animate="visible" style={{ flex: 1, minWidth: 320, zIndex: 20 }}>
              <h1 className="text-display" style={{ color: 'var(--text-primary)', lineHeight: 1.15, marginBottom: 24 }}>
                Detect Hidden Complexity in <br />
                <span style={{ color: 'var(--primary)' }}>Privacy Policies</span> Using Machine Learning
              </h1>
              <p className="text-body-lg" style={{ color: 'var(--text-secondary)', maxWidth: 640, marginBottom: 24 }}>
                Our AI engine dissects dense legal text, extracting key clauses, analyzing risk, and providing structural insights with surgical precision. Built for DPOs and legal tech teams.
              </p>
              <div style={{ display: 'flex', gap: 16, marginBottom: 32 }}>
                <Link to="/analyzer" className="btn-primary">
                  Analyze Privacy Policy
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
                </Link>
                <Link to="/research" className="btn-secondary">View Research</Link>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 24, paddingTop: 32, borderTop: '1px solid var(--border-subtle)' }}>
                {[
                  { value: '200+', label: 'Privacy Policies Collected' },
                  { value: '13', label: 'Extracted Features' },
                  { value: '98%', label: 'Model Accuracy' },
                ].map(({ value, label }) => (
                  <div key={label} style={{ display: 'flex', flexDirection: 'column' }}>
                    <span className="text-headline-lg" style={{ color: 'var(--primary)' }}>{value}</span>
                    <span className="font-mono" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>{label}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* Parallax Hero Scene */}
            <motion.div
              ref={sceneRef}
              variants={fadeUp} initial="visible" animate="visible"
              transition={{ delay: 0.2 }}
              className="bg-pattern"
              style={{ flex: 1, minWidth: 320, height: 600, position: 'relative', borderRadius: 16, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              <HeroDocument />
              {/* Obfuscation Score Card */}
              <OrbitCard top="10%" right="5%" width={192} animClass="animate-float-slow">
                <div data-depth="0.3" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Obfuscation</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--tertiary)' }}>warning</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <div style={{ width: 48, height: 48, position: 'relative' }}>
                    <svg viewBox="0 0 36 36" style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}>
                      <path d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831" fill="none" stroke="var(--tertiary)" strokeDasharray="72, 100" strokeWidth="4" />
                    </svg>
                    <span className="text-headline-md" style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13 }}>72</span>
                  </div>
                  <span style={{ fontSize: 11, color: 'var(--text-secondary)', lineHeight: 1.3 }}>High<br />Complexity</span>
                </div>
              </OrbitCard>
              {/* Features Progress Card */}
              <OrbitCard bottom="15%" left="5%" width={224} animClass="animate-float-delay">
                <div data-depth="0.2" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Extraction Progress</span>
                  <span className="material-symbols-outlined" style={{ fontSize: 16, color: 'var(--primary)' }}>analytics</span>
                </div>
                {[
                  { label: 'Readability (Flesch)', pct: 85, color: 'var(--primary)' },
                  { label: 'Legal Jargon', pct: 92, color: 'var(--tertiary)' },
                  { label: 'Passive Voice', pct: 78, color: 'var(--primary)' },
                ].map(({ label, pct, color }) => (
                  <div key={label} style={{ marginBottom: 8 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 10, marginBottom: 2 }}>
                      <span style={{ color: 'var(--text-primary)' }}>{label}</span>
                      <span style={{ color }}>{pct}%</span>
                    </div>
                    <div style={{ width: '100%', height: 4, background: 'var(--surface-variant)', borderRadius: 99 }}>
                      <div style={{ width: `${pct}%`, height: '100%', background: color, borderRadius: 99 }} />
                    </div>
                  </div>
                ))}
              </OrbitCard>
              {/* Prediction Card */}
              <OrbitCard bottom="25%" right="0%" width={192} animClass="animate-float-fast">
                <div data-depth="0.4" style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
                  <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#22c55e', animation: 'float-slow 2s infinite' }} />
                  <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Prediction Result</span>
                </div>
                <div className="text-label-md" style={{ color: 'var(--text-primary)', marginBottom: 4 }}>Moderately Obfuscated</div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <span style={{ fontSize: 12, color: 'var(--text-secondary)' }}>Confidence:</span>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--primary)' }}>91%</span>
                </div>
              </OrbitCard>
            </motion.div>
          </div>

          {/* Built With */}
          <div style={{ width: '100%', paddingTop: 32, borderTop: '1px solid var(--border-subtle)', opacity: 0.6, textAlign: 'center' }}>
            <span className="font-mono" style={{ fontSize: 11, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: 16, display: 'block' }}>Built With</span>
            <div style={{ display: 'flex', justifyContent: 'center', gap: 64 }}>
              {['Python', 'scikit-learn', 'React', 'Flask'].map((t) => (
                <span key={t} style={{ fontWeight: 700, fontSize: 18, color: 'var(--on-surface-variant)' }}>{t}</span>
              ))}
            </div>
          </div>
        </section>

        {/* Precision Analysis Workflow */}
        <section style={{ padding: '96px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="text-headline-lg" style={{ marginBottom: 16 }}>Precision Analysis Workflow</h2>
            <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>A streamlined approach to dissecting complex legal documents.</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 32 }}>
            {[
              { icon: 'upload_file', title: '1. Input', desc: 'Upload a PDF or paste a URL. Our parser handles complex formatting and noisy HTML.', color: 'var(--primary)', bg: 'var(--primary-fixed)' },
              { icon: 'memory', title: '2. Extraction', desc: 'NLP models identify core clauses, entities, and structural hierarchy within the text.', color: 'var(--tertiary)', bg: 'var(--tertiary-fixed)' },
              { icon: 'troubleshoot', title: '3. Prediction', desc: 'Machine learning models flag ambiguities, non-compliant sections, and overall risk scores.', color: 'var(--secondary)', bg: 'var(--secondary-fixed)' },
            ].map(({ icon, title, desc, color, bg }, i) => (
              <motion.div
                key={title}
                variants={fadeUp} initial="hidden" whileInView="visible"
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="glass-card"
                style={{
                  padding: 32, borderRadius: 16,
                  border: '1px solid var(--border-subtle)',
                  position: 'relative', overflow: 'hidden',
                  cursor: 'default',
                }}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
                  <span className="material-symbols-outlined" style={{ color }}>{icon}</span>
                </div>
                <h3 className="text-headline-md" style={{ marginBottom: 8 }}>{title}</h3>
                <p className="text-body-md" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Under the Hood — real live data */}
        <section style={{ padding: '96px 0' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="text-headline-lg" style={{ marginBottom: 16 }}>Under the Hood</h2>
            <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
              Real data from our trained XGBoost model and the 81-company dataset.
            </p>
          </motion.div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 24, marginBottom: 24 }}>

            {/* LEFT — Actual XGBoost pipeline */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
              className="glass-card" style={{ padding: 32, borderRadius: 16, border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden' }}
            >
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(0,80,203,0.05) 1px, transparent 0)', backgroundSize: '20px 20px' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>XGBoost Classification Pipeline</span>
                  <span style={{ background: 'rgba(34,197,94,0.1)', color: '#16a34a', border: '1px solid rgba(34,197,94,0.3)', padding: '3px 10px', borderRadius: 99, fontSize: 11, fontWeight: 600, fontFamily: 'Geist,sans-serif' }}>● Live</span>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                  {[
                    { icon: 'description',   label: 'Raw Policy Text',      sub: 'PDF / URL / paste',         color: '#6366f1',          step: '1' },
                    { icon: 'cleaning_services', label: 'Text Preprocessing', sub: 'Sentence split, lowercase', color: 'var(--secondary)', step: '2' },
                    { icon: 'analytics',     label: '13 NLP Features',       sub: 'Flesch RE, legal terms, sentence length…', color: 'var(--tertiary)', step: '3' },
                    { icon: 'tune',          label: 'Min-Max Normalization', sub: 'Scaled to dataset min/max', color: '#8b5cf6',          step: '4' },
                    { icon: 'model_training', label: 'XGBoost Classifier',   sub: 'n=100 trees, max_depth=4',  color: 'var(--primary)',   step: '5', highlight: true },
                    { icon: 'verified',      label: 'Risk Score + Label',    sub: 'Easy / Moderate / Obfuscated + confidence', color: '#059669', step: '6' },
                  ].map(({ icon, label, sub, color, step, highlight }, i, arr) => (
                    <div key={label}>
                      <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', padding: '14px 0' }}>
                        {/* Step indicator + connector */}
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 0, minWidth: 32 }}>
                          <div style={{
                            width: 32, height: 32, borderRadius: 8,
                            background: highlight ? color : `${color}18`,
                            border: `1px solid ${color}40`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          }}>
                            <span className="material-symbols-outlined" style={{ fontSize: 16, color: highlight ? '#fff' : color }}>{icon}</span>
                          </div>
                          {i < arr.length - 1 && (
                            <div style={{ width: 1, height: 14, background: 'var(--border-subtle)', marginTop: 2 }} />
                          )}
                        </div>
                        {/* Text */}
                        <div style={{ paddingTop: 4 }}>
                          <div style={{ fontSize: 13, fontWeight: highlight ? 700 : 500, color: highlight ? color : 'var(--text-primary)', fontFamily: 'Geist,sans-serif', marginBottom: 2 }}>
                            {label}
                          </div>
                          <div style={{ fontSize: 12, color: 'var(--text-secondary)' }}>{sub}</div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* RIGHT — Live feature weights + dataset stats */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

              {/* Feature weight bars */}
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.1 }}
                className="glass-card" style={{ padding: 28, borderRadius: 16, border: '1px solid var(--border-subtle)', flex: 1 }}
              >
                <div style={{ marginBottom: 20 }}>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Obfuscation Score Weights</span>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 4 }}>How each feature contributes to the final risk score</p>
                </div>
                {[
                  { label: 'Flesch Reading Ease', pct: 35, color: 'var(--primary)' },
                  { label: 'Avg Sentence Length', pct: 25, color: 'var(--tertiary)' },
                  { label: 'Legal Term Density',  pct: 20, color: '#8b5cf6' },
                  { label: 'Word Count',          pct: 10, color: 'var(--secondary)' },
                  { label: 'Unique Word Ratio',   pct: 10, color: '#059669' },
                ].map(({ label, pct, color }, i) => (
                  <div key={label} style={{ marginBottom: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5 }}>
                      <span style={{ fontSize: 13, color: 'var(--text-secondary)' }}>{label}</span>
                      <span className="font-mono" style={{ fontSize: 12, fontWeight: 700, color }}>{pct}%</span>
                    </div>
                    <AnimatedFeatureBar pct={pct} color={color} delay={i * 120 + 600} />
                  </div>
                ))}
              </motion.div>

              {/* Live dataset stats from API */}
              <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.2 }}
                className="glass-card" style={{ padding: 28, borderRadius: 16, border: '1px solid var(--border-subtle)' }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                  <span className="font-mono" style={{ fontSize: 12, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>Live Dataset Snapshot</span>
                  {liveStats
                    ? <span style={{ fontSize: 10, color: '#16a34a', fontFamily: 'Geist,sans-serif', fontWeight: 600 }}>● Connected</span>
                    : <span style={{ fontSize: 10, color: 'var(--outline)', fontFamily: 'Geist,sans-serif' }}>○ Loading…</span>
                  }
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                  {[
                    { label: 'Total Companies', value: liveStats?.total_companies ?? '—', color: 'var(--primary)' },
                    { label: 'Features Used', value: `${liveStats?.model_info?.features_used ?? 13}`, color: 'var(--tertiary)' },
                    { label: 'Mean Obfus. Score', value: liveStats ? `${liveStats.obfuscation_score.mean}/100` : '—', color: '#8b5cf6' },
                    { label: 'CV F1 (weighted)', value: liveStats ? `${(liveStats.model_info.cv_f1_weighted * 100).toFixed(1)}%` : '—', color: '#059669' },
                    { label: 'Easy Policies', value: liveStats?.label_distribution?.Easy ?? '—', color: '#22c55e' },
                    { label: 'Obfuscated', value: liveStats?.label_distribution?.Obfuscated ?? '—', color: '#ef4444' },
                  ].map(({ label, value, color }) => (
                    <div key={label} style={{ background: 'var(--surface-container-low)', padding: '10px 14px', borderRadius: 8 }}>
                      <div style={{ fontSize: 10, color: 'var(--text-secondary)', fontFamily: 'Geist,sans-serif', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 3 }}>{label}</div>
                      <div className="font-mono" style={{ fontSize: 16, fontWeight: 700, color }}>{value}</div>
                    </div>
                  ))}
                </div>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Core Capabilities */}
        <section style={{ padding: '96px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="text-headline-lg" style={{ marginBottom: 16 }}>Core Capabilities</h2>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 32 }}>
            {[
              { icon: 'picture_as_pdf', title: 'Smart PDF Parsing', desc: 'Automatically handles multi-column layouts, tables, and headers in complex legal PDFs without losing structural integrity.' },
              { icon: 'link', title: 'URL Extraction', desc: "Point to any privacy policy URL. Our system cleans the HTML, removes boilerplate, and extracts the core text for analysis." },
            ].map(({ icon, title, desc }, i) => (
              <motion.div key={title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: i * 0.1 }} className="glass-card" style={{ padding: 32, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
                <div style={{ width: 64, height: 64, minWidth: 64, borderRadius: 16, background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 24 }}>{icon}</span>
                </div>
                <div>
                  <h3 className="text-headline-md" style={{ marginBottom: 8 }}>{title}</h3>
                  <p className="text-body-md" style={{ color: 'var(--text-secondary)' }}>{desc}</p>
                </div>
              </motion.div>
            ))}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.2 }} className="glass-card" style={{ gridColumn: '1 / 3', padding: 32, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', gap: 24, alignItems: 'flex-start' }}>
              <div style={{ width: 64, height: 64, minWidth: 64, borderRadius: 16, background: 'var(--surface-container-high)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>summarize</span>
              </div>
              <div>
                <h3 className="text-headline-md" style={{ marginBottom: 8 }}>Comprehensive Report Generation</h3>
                <p className="text-body-md" style={{ color: 'var(--text-secondary)', marginBottom: 16 }}>Export findings in JSON or formatted PDF. Includes risk flags, extracted clauses, and confidence scores for compliance auditing.</p>
                <div style={{ display: 'flex', gap: 8 }}>
                  {['JSON', 'PDF', 'CSV'].map((f) => (
                    <span key={f} className="font-mono" style={{ padding: '4px 12px', background: 'var(--surface-dim)', borderRadius: 4, fontSize: 12 }}>{f}</span>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Testimonials / Social Proof */}
        <section style={{ padding: '96px 0', borderTop: '1px solid var(--border-subtle)' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="text-headline-lg" style={{ marginBottom: 16 }}>Companies We've Analyzed</h2>
            <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>
              Our dataset spans 81 global companies across Technology, Finance, Healthcare, Retail, and Telecoms.
            </p>
          </motion.div>
          <div style={{ display: 'flex', flexWrap: 'wrap', justifyContent: 'center', gap: 12 }}>
            {[
              { name: 'Google', label: 'Moderate' },
              { name: 'Apple', label: 'Easy' },
              { name: 'Meta', label: 'Obfuscated' },
              { name: 'Microsoft', label: 'Easy' },
              { name: 'Amazon', label: 'Moderate' },
              { name: 'Adobe', label: 'Obfuscated' },
              { name: 'Netflix', label: 'Easy' },
              { name: 'Spotify', label: 'Moderate' },
              { name: 'Twitter', label: 'Moderate' },
              { name: 'LinkedIn', label: 'Obfuscated' },
              { name: 'Uber', label: 'Moderate' },
              { name: 'Airbnb', label: 'Easy' },
            ].map(({ name, label }, i) => {
              const color = label === 'Obfuscated' ? '#ef4444' : label === 'Moderate' ? '#eab308' : '#22c55e'
              return (
                <motion.div
                  key={name}
                  variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
                  transition={{ delay: i * 0.04 }}
                  className="glass-card"
                  style={{
                    padding: '12px 20px', borderRadius: 10,
                    display: 'flex', alignItems: 'center', gap: 10,
                    cursor: 'default',
                  }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: 6, background: `${color}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 13, fontWeight: 700, color, fontFamily: 'Geist,sans-serif' }}>
                    {name[0]}
                  </div>
                  <span className="text-label-md">{name}</span>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: color, opacity: 0.8 }} />
                </motion.div>
              )
            })}
          </div>
        </section>

        {/* CTA Section */}
        <section style={{ padding: '80px 0 96px' }}>
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            style={{
              background: 'linear-gradient(135deg, var(--primary) 0%, #3b5bdb 50%, #6366f1 100%)',
              borderRadius: 24, padding: '64px 48px',
              textAlign: 'center', position: 'relative', overflow: 'hidden',
            }}
          >
            {/* Background decoration */}
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(circle at 2px 2px, rgba(255,255,255,0.06) 1px, transparent 0)', backgroundSize: '28px 28px' }} />
            <div style={{ position: 'absolute', top: '-30%', right: '-10%', width: '40%', height: '120%', borderRadius: '50%', background: 'rgba(255,255,255,0.04)', filter: 'blur(60px)' }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <span className="font-mono" style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', textTransform: 'uppercase', letterSpacing: '0.12em', display: 'block', marginBottom: 20 }}>
                Start Analyzing Today — It's Free
              </span>
              <h2 style={{ fontFamily: 'Geist,sans-serif', fontSize: 42, fontWeight: 700, color: '#fff', lineHeight: 1.2, marginBottom: 20, letterSpacing: '-0.02em' }}>
                Ready to decode your privacy policy?
              </h2>
              <p style={{ fontSize: 18, color: 'rgba(255,255,255,0.75)', maxWidth: 520, margin: '0 auto 40px', lineHeight: 1.6 }}>
                Paste any policy text or enter a URL to instantly get an AI-powered risk score, linguistic breakdown, and compliance insights.
              </p>
              <div style={{ display: 'flex', gap: 16, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/analyzer" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: '#fff', color: 'var(--primary)', fontFamily: 'Geist,sans-serif',
                  fontWeight: 600, fontSize: 15, padding: '14px 28px', borderRadius: 10,
                  border: 'none', cursor: 'pointer', transition: 'all 0.2s',
                  boxShadow: '0 4px 12px rgba(0,0,0,0.15)',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>analytics</span>
                  Analyze a Policy
                </Link>
                <Link to="/directory" style={{
                  display: 'inline-flex', alignItems: 'center', gap: 8,
                  background: 'rgba(255,255,255,0.12)', color: '#fff',
                  fontFamily: 'Geist,sans-serif', fontWeight: 500, fontSize: 15,
                  padding: '14px 28px', borderRadius: 10, border: '1px solid rgba(255,255,255,0.25)',
                  cursor: 'pointer', transition: 'all 0.2s',
                }}>
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>grid_view</span>
                  Browse Directory
                </Link>
              </div>
              <p style={{ marginTop: 24, fontSize: 13, color: 'rgba(255,255,255,0.5)' }}>
                No account required · Open source dataset · Research-grade model
              </p>
            </div>
          </motion.div>
        </section>
      </main>
    </>
  )
}
