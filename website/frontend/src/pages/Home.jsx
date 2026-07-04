import { useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'

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

export default function Home() {
  const sceneRef = useRef(null)

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
            <motion.div variants={fadeUp} initial="hidden" animate="visible" style={{ flex: 1, minWidth: 320, zIndex: 20 }}>
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
              variants={fadeUp} initial="hidden" animate="visible"
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

        {/* Under the Hood */}
        <section style={{ padding: '96px 0' }}>
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} style={{ textAlign: 'center', marginBottom: 64 }}>
            <h2 className="text-headline-lg" style={{ marginBottom: 16 }}>Under the Hood</h2>
            <p className="text-body-md" style={{ color: 'var(--text-secondary)', maxWidth: 560, margin: '0 auto' }}>Visualizing the data flow and model architecture.</p>
          </motion.div>
          <div style={{ display: 'grid', gridTemplateColumns: '3fr 1fr', gridTemplateRows: '1fr 1fr', gap: 24, height: 600 }}>
            {/* Pipeline Card */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="glass-card" style={{ gridRow: '1 / 3', padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', position: 'relative', overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <div style={{
                position: 'absolute', inset: 0, opacity: 0.1,
                backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCqzC_xfb1OIhTC2EaWXAt1mMiWNOZaBdv7tE8PxyDbu2TEPz-hBkVMovdrWnwYbkv-Q9RWEreEJeG3b-1MybFTAUXYUOqeIWpiP7-OsK1VXMo5WHUqB3CUPCkksotpP9M9Um2UoEhlfeaiXMHbc4KWQg0tEcO4MgonxxFZQnIMKEte0NS5BeRIuh6Mr4pBefGzCvI4lfL8ygmjq3jLAjdxlr3quZGAJWoT5u4pvhve1k19sQxCHiTce_hLqeKBE5gvyneCXx8B58om')",
                backgroundSize: 'cover', backgroundPosition: 'center',
              }} />
              <div style={{ position: 'relative', zIndex: 10, flex: 1, display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 32 }}>
                  <span className="font-mono" style={{ fontSize: 13, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Model Pipeline</span>
                  <span style={{ background: 'var(--primary-fixed)', color: 'var(--primary)', padding: '4px 12px', borderRadius: 'var(--radius-full)', fontSize: 12, fontWeight: 500 }}>Active</span>
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 24 }}>
                  {[
                    { label: 'Raw Policy', ml: 0, color: 'var(--primary)', bg: '#fff' },
                    { label: 'Tokenization', ml: 48, color: 'var(--tertiary)', bg: '#fff' },
                    { label: 'Transformer Model', ml: 96, color: '#fff', bg: 'var(--primary)' },
                    { label: 'Risk Scoring', ml: 48, color: 'var(--secondary)', bg: '#fff', noLine: true },
                  ].map(({ label, ml, color, bg, noLine }) => (
                    <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 16, marginLeft: ml }}>
                      <div style={{
                        minWidth: label === 'Transformer Model' ? 192 : label === 'Tokenization' || label === 'Risk Scoring' ? 160 : 128,
                        height: 48, background: bg, border: bg === '#fff' ? '1px solid var(--border-subtle)' : 'none',
                        borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center',
                        fontFamily: "'Geist', monospace", fontSize: 13, color,
                        boxShadow: bg !== '#fff' ? '0 4px 12px rgba(0,80,203,0.2)' : '0 1px 3px rgba(0,0,0,0.05)',
                      }}>
                        {label}
                      </div>
                      {!noLine && <div style={{ flex: 1, height: 1, background: 'var(--border-subtle)' }} />}
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
            {/* Stats */}
            {[
              { icon: 'speed', value: '1.2s', desc: 'Average processing time per document.', color: 'var(--primary)' },
              { icon: 'schema', value: '24', desc: 'Pre-trained clause detection models.', color: 'var(--tertiary)' },
            ].map(({ icon, value, desc, color }, i) => (
              <motion.div key={icon} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} transition={{ delay: 0.2 + i * 0.1 }} className="glass-card" style={{ padding: 24, borderRadius: 16, border: '1px solid var(--border-subtle)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <span className="material-symbols-outlined" style={{ fontSize: 32, color, marginBottom: 16 }}>{icon}</span>
                <span className="text-headline-lg">{value}</span>
                <span className="text-body-md" style={{ color: 'var(--text-secondary)' }}>{desc}</span>
              </motion.div>
            ))}
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
      </main>
    </>
  )
}
