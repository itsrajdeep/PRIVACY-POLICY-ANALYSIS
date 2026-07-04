export default function Research() {
  return (
    <main className="container-app" style={{ paddingTop: 96, paddingBottom: 96, maxWidth: 800, margin: '0 auto' }}>
      <header style={{ marginBottom: 48, textAlign: 'center' }}>
        <h1 className="text-display">Model Documentation & Methodology</h1>
        <p className="text-body-lg" style={{ color: 'var(--text-secondary)', marginTop: 16 }}>
          Understanding the machine learning architecture behind PrivaGuard AI's obfuscation detection.
        </p>
      </header>

      <section className="card" style={{ padding: 40, display: 'flex', flexDirection: 'column', gap: 32 }}>
        <div>
          <h2 className="text-headline-md" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 24 }}>1. Dataset Overview</h2>
          <p className="text-body-md" style={{ marginBottom: 16 }}>
            Our model is trained on a curated dataset of 81 corporate privacy policies spanning multiple industries (Technology, Finance, Healthcare, Retail, and Telecommunications). Each policy underwent rigorous manual annotation by privacy professionals to establish ground-truth labels for "Obfuscation Level" (Easy, Moderate, Obfuscated).
          </p>
        </div>

        <div>
          <h2 className="text-headline-md" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 24 }}>2. Feature Engineering</h2>
          <p className="text-body-md" style={{ marginBottom: 16 }}>
            Before classification, raw text is processed through our NLP pipeline to extract 13 key linguistic and structural features.
          </p>
          <ul style={{ paddingLeft: 24, display: 'flex', flexDirection: 'column', gap: 12 }} className="text-body-md">
            <li><strong>Flesch Reading Ease:</strong> Evaluates sentence length and syllable count to determine general readability.</li>
            <li><strong>Legal Term Density:</strong> Counts the frequency of domain-specific legal jargon (e.g., "indemnify", "notwithstanding").</li>
            <li><strong>Average Sentence Length:</strong> Identifies structurally complex, run-on sentences typical of obfuscated text.</li>
            <li><strong>Unique Word Ratio:</strong> Measures vocabulary breadth to detect overly dense terminology.</li>
          </ul>
        </div>

        <div>
          <h2 className="text-headline-md" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 24 }}>3. Model Architecture (XGBoost)</h2>
          <p className="text-body-md" style={{ marginBottom: 16 }}>
            The core classification engine uses <strong>XGBoost</strong> (eXtreme Gradient Boosting). XGBoost was selected for its superior performance on tabular feature data and its robustness against overfitting via L1/L2 regularization.
          </p>
          <div style={{ background: 'var(--surface)', padding: 24, borderRadius: 8, border: '1px solid var(--border-subtle)' }}>
            <h4 className="font-mono" style={{ fontSize: 13, textTransform: 'uppercase', color: 'var(--text-secondary)', marginBottom: 16 }}>Hyperparameters</h4>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }} className="font-mono text-sm">
              <div><span style={{ color: 'var(--outline)' }}>n_estimators:</span> 100</div>
              <div><span style={{ color: 'var(--outline)' }}>max_depth:</span> 4</div>
              <div><span style={{ color: 'var(--outline)' }}>learning_rate:</span> 0.1</div>
              <div><span style={{ color: 'var(--outline)' }}>subsample:</span> 0.8</div>
            </div>
          </div>
        </div>

        <div>
          <h2 className="text-headline-md" style={{ color: 'var(--primary)', borderBottom: '1px solid var(--border-subtle)', paddingBottom: 16, marginBottom: 24 }}>4. Performance Metrics</h2>
          <p className="text-body-md" style={{ marginBottom: 16 }}>
            The model was evaluated using Stratified K-Fold cross-validation to ensure balanced class representation across all folds.
          </p>
          <div style={{ display: 'flex', gap: 24 }}>
            <div style={{ flex: 1, padding: 24, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div className="text-display" style={{ color: 'var(--primary)' }}>98%</div>
              <div className="font-mono" style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Accuracy</div>
            </div>
            <div style={{ flex: 1, padding: 24, background: 'var(--surface)', borderRadius: 8, border: '1px solid var(--border-subtle)', textAlign: 'center' }}>
              <div className="text-display" style={{ color: 'var(--primary)' }}>0.98</div>
              <div className="font-mono" style={{ fontSize: 12, textTransform: 'uppercase', color: 'var(--text-secondary)' }}>Weighted F1</div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
