export function RiskBadge({ label }) {
  const config = {
    Easy: { cls: 'badge-easy', icon: 'check_circle' },
    Moderate: { cls: 'badge-moderate', icon: 'warning' },
    Obfuscated: { cls: 'badge-obfuscated', icon: 'error' },
  }
  const c = config[label] || config.Moderate
  return (
    <span
      className={c.cls}
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 12px',
        borderRadius: 'var(--radius-full)',
        fontSize: 12,
        fontWeight: 500,
        fontFamily: "'Geist', sans-serif",
      }}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{c.icon}</span>
      {label}
    </span>
  )
}

export function ScoreGauge({ score, size = 128, color, label }) {
  const radius = 45
  const circumference = 2 * Math.PI * radius
  const offset = circumference - (score / 100) * circumference
  const gaugeColor = color || (score >= 60 ? '#ef4444' : score >= 30 ? '#eab308' : '#22c55e')

  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg
        viewBox="0 0 100 100"
        style={{ width: '100%', height: '100%', transform: 'rotate(-90deg)' }}
      >
        <circle cx="50" cy="50" r={radius} fill="none" stroke="var(--surface-container-high)" strokeWidth="8" strokeLinecap="round" />
        <circle
          cx="50" cy="50" r={radius} fill="none"
          stroke={gaugeColor} strokeWidth="8" strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          style={{ transition: 'stroke-dashoffset 1s ease-out' }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <span className="text-headline-lg" style={{ color: gaugeColor, fontWeight: 700 }}>
          {Math.round(score)}
        </span>
        {label && (
          <span className="text-mono" style={{ fontSize: 10, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
            {label}
          </span>
        )}
      </div>
    </div>
  )
}

export function FeatureBar({ label, value, maxValue, color = 'var(--primary)' }) {
  const pct = maxValue ? (value / maxValue) * 100 : value
  return (
    <div style={{ marginBottom: 12 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
        <span className="text-label-md" style={{ color: 'var(--text-secondary)', fontSize: 13 }}>{label}</span>
        <span className="text-mono" style={{ color: 'var(--text-primary)', fontSize: 13 }}>
          {typeof value === 'number' ? value.toFixed?.(2) ?? value : value}
        </span>
      </div>
      <div style={{
        width: '100%', height: 6, background: 'var(--surface-container-high)',
        borderRadius: 'var(--radius-full)', overflow: 'hidden',
      }}>
        <div style={{
          width: `${Math.min(pct, 100)}%`, height: '100%',
          background: color, borderRadius: 'var(--radius-full)',
          transition: 'width 1s ease-out',
        }} />
      </div>
    </div>
  )
}
