"""
ML Classification Pipeline for Privacy Policy Obfuscation
==========================================================
Train Random Forest, XGBoost, and Logistic Regression to predict
human obfuscation class (Easy / Moderate / Obfuscated) from policy features.

Features used:
  - word_count, sentence_count, avg_sentence_length, char_count
  - unique_words, flesch_reading_ease, flesch_kincaid_grade
  - legal_term_count
  - Normalized features: norm_word_count, norm_avg_sentence_length,
    norm_unique_words, norm_flesch_reading_ease, norm_legal_term_count
"""

import csv
import os
import math
import warnings
warnings.filterwarnings("ignore")

# ---------------------------------------------------------------------------
# Optional imports with graceful fallback
# ---------------------------------------------------------------------------
try:
    import numpy as np
    HAS_NP = True
except ImportError:
    HAS_NP = False
    print("[ERROR] numpy is required. Install via: pip install numpy")
    exit(1)

try:
    from sklearn.ensemble import RandomForestClassifier
    from sklearn.linear_model import LogisticRegression
    from sklearn.model_selection import (
        StratifiedKFold, cross_val_predict, cross_val_score
    )
    from sklearn.preprocessing import LabelEncoder, StandardScaler
    from sklearn.metrics import (
        classification_report, confusion_matrix, accuracy_score,
        f1_score, precision_score, recall_score
    )
    HAS_SK = True
except ImportError:
    HAS_SK = False
    print("[ERROR] scikit-learn is required. Install via: pip install scikit-learn")
    exit(1)

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("[WARN] xgboost not found. XGBoost model will be skipped.")
    print("       Install via: pip install xgboost")

try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    from matplotlib.gridspec import GridSpec
    HAS_MPL = True
except ImportError:
    HAS_MPL = False
    print("[WARN] matplotlib not found -- only text output will be produced.")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LABELS_CSV = os.path.join(BASE_DIR, "dataset", "manual_labels.csv")
FEATURES_CSV = os.path.join(BASE_DIR, "dataset", "policy_features.csv")
DATASET_CSV = os.path.join(BASE_DIR, "dataset", "obfuscation_dataset.csv")
OUT_DIR = os.path.join(BASE_DIR, "dataset")

# Feature columns from policy_features.csv
RAW_FEATURES = [
    "word_count", "sentence_count", "avg_sentence_length", "char_count",
    "unique_words", "flesch_reading_ease", "flesch_kincaid_grade",
    "legal_term_count",
]

# Normalized features from obfuscation_dataset.csv
NORM_FEATURES = [
    "norm_word_count", "norm_avg_sentence_length", "norm_unique_words",
    "norm_flesch_reading_ease", "norm_legal_term_count",
]

ALL_FEATURES = RAW_FEATURES + NORM_FEATURES

# Class label order
CLASS_ORDER = ["Easy", "Moderate", "Obfuscated"]

# Random seed for reproducibility
SEED = 42

# ---------------------------------------------------------------------------
# 1. Load & Merge Data
# ---------------------------------------------------------------------------
print("=" * 72)
print("ML CLASSIFICATION PIPELINE")
print("Privacy Policy Obfuscation Prediction")
print("=" * 72)

# Load human labels
labels = {}
with open(LABELS_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        company = row["Company"].strip()
        if company:
            labels[company] = {
                "human_class": row["human_class"],
                "human_obfuscation": float(row["human_obfuscation"]),
                "Q1": int(row["Q1"]),
                "Q2": int(row["Q2"]),
                "Q3": int(row["Q3"]),
                "Q4": int(row["Q4"]),
                "is_manual": row["is_manual"] == "True",
            }

# Load raw features
raw_features = {}
with open(FEATURES_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        company = row["company"].strip()
        if company:
            raw_features[company] = row

# Load normalized features from dataset
norm_features = {}
with open(DATASET_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        company = row["company"].strip()
        if company:
            norm_features[company] = row

# Merge into training data
companies = []
X_data = []
y_data = []
manual_flags = []

for company, label_info in labels.items():
    if company not in raw_features:
        print(f"  [SKIP] {company} -- no features found")
        continue
    
    feat_row = raw_features[company]
    norm_row = norm_features.get(company, {})
    
    feature_vector = []
    for f in RAW_FEATURES:
        try:
            feature_vector.append(float(feat_row[f]))
        except (KeyError, ValueError):
            feature_vector.append(0.0)
    
    for f in NORM_FEATURES:
        try:
            feature_vector.append(float(norm_row[f]))
        except (KeyError, ValueError):
            feature_vector.append(0.0)
    
    companies.append(company)
    X_data.append(feature_vector)
    y_data.append(label_info["human_class"])
    manual_flags.append(label_info["is_manual"])

X = np.array(X_data)
y = np.array(y_data)

print(f"\n  Dataset size: {len(companies)} companies")
print(f"  Features: {len(ALL_FEATURES)}")
print(f"  Feature names: {ALL_FEATURES}")

# Class distribution
print(f"\n  Class distribution:")
for cls in CLASS_ORDER:
    count = sum(1 for yi in y if yi == cls)
    pct = count / len(y) * 100
    bar = "█" * count
    print(f"    {cls:<12} {count:>3}  ({pct:5.1f}%)  {bar}")


# ---------------------------------------------------------------------------
# 2. Encode Labels & Scale Features
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 1 -- Data Preprocessing")
print("=" * 72)

le = LabelEncoder()
le.fit(CLASS_ORDER)
y_encoded = le.transform(y)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print(f"\n  Label encoding: {dict(zip(CLASS_ORDER, le.transform(CLASS_ORDER)))}")
print(f"  Features standardized (mean=0, std=1)")
print(f"  X shape: {X_scaled.shape}")
print(f"  y shape: {y_encoded.shape}")


# ---------------------------------------------------------------------------
# 3. Define Models
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 2 -- Model Training & Evaluation")
print("=" * 72)

models = {
    "Random Forest": RandomForestClassifier(
        n_estimators=200,
        max_depth=10,
        min_samples_split=3,
        min_samples_leaf=2,
        class_weight="balanced",
        random_state=SEED,
        n_jobs=-1,
    ),
    "Logistic Regression": LogisticRegression(
        max_iter=2000,
        solver="lbfgs",
        class_weight="balanced",
        random_state=SEED,
        C=1.0,
    ),
}

if HAS_XGB:
    # Compute class weights for XGBoost
    class_counts = np.bincount(y_encoded)
    total = len(y_encoded)
    n_classes = len(class_counts)
    xgb_weights = np.array([total / (n_classes * c) if c > 0 else 1.0 
                            for c in class_counts])
    sample_weights = np.array([xgb_weights[yi] for yi in y_encoded])
    
    models["XGBoost"] = XGBClassifier(
        n_estimators=200,
        max_depth=6,
        learning_rate=0.1,
        subsample=0.8,
        colsample_bytree=0.8,
        random_state=SEED,
        eval_metric="mlogloss",
        num_class=len(CLASS_ORDER),
        objective="multi:softprob",
    )


# ---------------------------------------------------------------------------
# 4. Cross-Validation & Evaluation
# ---------------------------------------------------------------------------

# Use Stratified K-Fold (k=5 since dataset is small)
n_splits = min(5, min(sum(1 for yi in y if yi == cls) for cls in CLASS_ORDER))
if n_splits < 2:
    n_splits = 3  # fallback for very small classes
    print(f"\n  [NOTE] Very small class detected. Using {n_splits}-fold CV with adjusted splits.")

# For very small datasets, use Leave-One-Out-like approach
if len(y) < 20:
    n_splits = min(len(y), 5)

cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=SEED)

results = {}
predictions = {}
all_reports = {}

for name, model in models.items():
    print(f"\n  {'─' * 60}")
    print(f"  Model: {name}")
    print(f"  {'─' * 60}")
    
    try:
        # Cross-validated predictions
        if name == "XGBoost":
            # Manual CV for XGBoost to handle missing classes in folds
            y_pred = np.zeros(len(y_encoded), dtype=int)
            for train_idx, test_idx in cv.split(X_scaled, y_encoded):
                X_train, X_test = X_scaled[train_idx], X_scaled[test_idx]
                y_train = y_encoded[train_idx]
                
                # Remap labels to consecutive 0..k for this fold
                unique_labels = np.sort(np.unique(y_train))
                label_map = {orig: new for new, orig in enumerate(unique_labels)}
                inv_map = {new: orig for orig, new in label_map.items()}
                y_train_mapped = np.array([label_map[yi] for yi in y_train])
                
                xgb_fold = XGBClassifier(
                    n_estimators=200, max_depth=6, learning_rate=0.1,
                    subsample=0.8, colsample_bytree=0.8,
                    random_state=SEED, eval_metric="mlogloss",
                )
                xgb_fold.fit(X_train, y_train_mapped)
                preds_mapped = xgb_fold.predict(X_test)
                # Map back to original labels
                y_pred[test_idx] = np.array([inv_map[p] for p in preds_mapped])
        else:
            y_pred = cross_val_predict(model, X_scaled, y_encoded, cv=cv)
        
        y_pred_labels = le.inverse_transform(y_pred)
        predictions[name] = y_pred_labels
        
        # Metrics
        acc = accuracy_score(y, y_pred_labels)
        f1_macro = f1_score(y, y_pred_labels, average="macro", labels=CLASS_ORDER)
        f1_weighted = f1_score(y, y_pred_labels, average="weighted", labels=CLASS_ORDER)
        precision = precision_score(y, y_pred_labels, average="macro", labels=CLASS_ORDER, zero_division=0)
        recall = recall_score(y, y_pred_labels, average="macro", labels=CLASS_ORDER, zero_division=0)
        
        results[name] = {
            "accuracy": acc,
            "f1_macro": f1_macro,
            "f1_weighted": f1_weighted,
            "precision": precision,
            "recall": recall,
        }
        
        print(f"\n    Accuracy:           {acc:.4f}  ({acc*100:.1f}%)")
        print(f"    F1 (macro):         {f1_macro:.4f}")
        print(f"    F1 (weighted):      {f1_weighted:.4f}")
        print(f"    Precision (macro):  {precision:.4f}")
        print(f"    Recall (macro):     {recall:.4f}")
        
        # Classification report
        report = classification_report(y, y_pred_labels, labels=CLASS_ORDER, 
                                       zero_division=0, output_dict=True)
        all_reports[name] = report
        
        print(f"\n    Per-class metrics:")
        print(f"    {'Class':<12} {'Precision':>10} {'Recall':>10} {'F1':>10} {'Support':>10}")
        print(f"    {'─'*12} {'─'*10} {'─'*10} {'─'*10} {'─'*10}")
        for cls in CLASS_ORDER:
            if cls in report:
                r = report[cls]
                print(f"    {cls:<12} {r['precision']:>10.4f} {r['recall']:>10.4f} "
                      f"{r['f1-score']:>10.4f} {r['support']:>10.0f}")
        
        # Confusion matrix
        cm = confusion_matrix(y, y_pred_labels, labels=CLASS_ORDER)
        print(f"\n    Confusion Matrix:")
        print(f"    {'':>15} {'Pred Easy':>12} {'Pred Moderate':>14} {'Pred Obfusc.':>14}")
        for i, cls in enumerate(CLASS_ORDER):
            print(f"    {('True '+cls):<15} {cm[i][0]:>12} {cm[i][1]:>14} {cm[i][2]:>14}")
        
        # Train final model on all data for feature importance
        model.fit(X_scaled, y_encoded)
        
    except Exception as e:
        print(f"\n    [ERROR] {name} failed: {e}")
        import traceback
        traceback.print_exc()


# ---------------------------------------------------------------------------
# 5. Feature Importance Analysis
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 3 -- Feature Importance Analysis")
print("=" * 72)

feature_importances = {}

for name, model in models.items():
    print(f"\n  {name}:")
    
    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
        feature_importances[name] = importances
        
        # Sort by importance
        indices = np.argsort(importances)[::-1]
        
        print(f"    {'Rank':<6} {'Feature':<30} {'Importance':>12}")
        print(f"    {'─'*6} {'─'*30} {'─'*12}")
        for rank, idx in enumerate(indices, 1):
            bar = "█" * int(importances[idx] * 50)
            print(f"    {rank:<6} {ALL_FEATURES[idx]:<30} {importances[idx]:>12.4f}  {bar}")
    
    elif hasattr(model, "coef_"):
        # Logistic Regression coefficients
        coefs = np.abs(model.coef_).mean(axis=0)  # average across classes
        feature_importances[name] = coefs
        
        indices = np.argsort(coefs)[::-1]
        
        print(f"    {'Rank':<6} {'Feature':<30} {'|Coefficient|':>14}")
        print(f"    {'─'*6} {'─'*30} {'─'*14}")
        for rank, idx in enumerate(indices, 1):
            bar = "█" * int(coefs[idx] / coefs.max() * 30)
            print(f"    {rank:<6} {ALL_FEATURES[idx]:<30} {coefs[idx]:>14.4f}  {bar}")


# ---------------------------------------------------------------------------
# 6. Model Comparison Summary
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 4 -- Model Comparison")
print("=" * 72)

print(f"\n  {'Model':<25} {'Accuracy':>10} {'F1 Macro':>10} {'F1 Weighted':>12} {'Precision':>10} {'Recall':>10}")
print(f"  {'─'*25} {'─'*10} {'─'*10} {'─'*12} {'─'*10} {'─'*10}")

best_model = None
best_f1 = -1

for name, res in results.items():
    marker = ""
    if res["f1_weighted"] > best_f1:
        best_f1 = res["f1_weighted"]
        best_model = name
    print(f"  {name:<25} {res['accuracy']:>10.4f} {res['f1_macro']:>10.4f} "
          f"{res['f1_weighted']:>12.4f} {res['precision']:>10.4f} {res['recall']:>10.4f}")

print(f"\n  >>> BEST MODEL: {best_model} (F1 weighted = {best_f1:.4f}) <<<")


# ---------------------------------------------------------------------------
# 7. Prediction on All Companies (including those not in training set)
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 5 -- Predictions on All Companies")
print("=" * 72)

# Get the best model
best_clf = models[best_model]

# Load all companies with features
all_companies = []
X_all = []

for company, feats in raw_features.items():
    norm_row = norm_features.get(company, {})
    
    feature_vector = []
    for f in RAW_FEATURES:
        try:
            feature_vector.append(float(feats[f]))
        except (KeyError, ValueError):
            feature_vector.append(0.0)
    
    for f in NORM_FEATURES:
        try:
            feature_vector.append(float(norm_row[f]))
        except (KeyError, ValueError):
            feature_vector.append(0.0)
    
    all_companies.append(company)
    X_all.append(feature_vector)

X_all_np = np.array(X_all)
X_all_scaled = scaler.transform(X_all_np)

# Predict
y_all_pred = best_clf.predict(X_all_scaled)
y_all_labels = le.inverse_transform(y_all_pred)

# Get probabilities if available
if hasattr(best_clf, "predict_proba"):
    y_all_proba = best_clf.predict_proba(X_all_scaled)
else:
    y_all_proba = None

# Sort by predicted class then company name
pred_results = list(zip(all_companies, y_all_labels))
pred_results.sort(key=lambda x: (CLASS_ORDER.index(x[1]), x[0]))

print(f"\n  Predictions using: {best_model}")
print(f"\n  {'Company':<25} {'Predicted Class':<15} ", end="")
if y_all_proba is not None:
    print(f"{'P(Easy)':>8} {'P(Mod)':>8} {'P(Obf)':>8}", end="")
print()
print(f"  {'─'*25} {'─'*15} ", end="")
if y_all_proba is not None:
    print(f"{'─'*8} {'─'*8} {'─'*8}", end="")
print()

for i, (comp, pred) in enumerate(pred_results):
    idx = all_companies.index(comp)
    in_train = "★" if comp in labels else ""
    print(f"  {comp:<25} {pred:<15} ", end="")
    if y_all_proba is not None:
        print(f"{y_all_proba[idx][0]:>8.3f} {y_all_proba[idx][1]:>8.3f} {y_all_proba[idx][2]:>8.3f}", end="")
    print(f"  {in_train}")

# Prediction distribution
print(f"\n  Prediction distribution (all {len(all_companies)} companies):")
for cls in CLASS_ORDER:
    count = sum(1 for _, c in pred_results if c == cls)
    pct = count / len(pred_results) * 100
    bar = "█" * count
    print(f"    {cls:<12} {count:>3}  ({pct:5.1f}%)  {bar}")


# ---------------------------------------------------------------------------
# 8. Save Predictions CSV
# ---------------------------------------------------------------------------
predictions_csv = os.path.join(OUT_DIR, "ml_predictions.csv")
with open(predictions_csv, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    header = ["company", "predicted_class"]
    if y_all_proba is not None:
        header += ["prob_easy", "prob_moderate", "prob_obfuscated"]
    header += ["in_training_set"]
    writer.writerow(header)
    
    for i, comp in enumerate(all_companies):
        row = [comp, y_all_labels[i]]
        if y_all_proba is not None:
            row += [f"{y_all_proba[i][0]:.4f}", f"{y_all_proba[i][1]:.4f}", f"{y_all_proba[i][2]:.4f}"]
        row.append("Yes" if comp in labels else "No")
        writer.writerow(row)

print(f"\n  [SAVED] {predictions_csv}")


# ---------------------------------------------------------------------------
# 9. Generate Visualizations
# ---------------------------------------------------------------------------
if HAS_MPL:
    print("\n" + "=" * 72)
    print("STEP 6 -- Generating Visualizations")
    print("=" * 72)
    
    # Dark theme
    plt.rcParams.update({
        "figure.facecolor": "#1a1a2e",
        "axes.facecolor": "#16213e",
        "axes.edgecolor": "#e0e0e0",
        "axes.labelcolor": "#e0e0e0",
        "text.color": "#e0e0e0",
        "xtick.color": "#e0e0e0",
        "ytick.color": "#e0e0e0",
        "font.family": "sans-serif",
        "font.size": 11,
    })
    
    class_colors = {"Easy": "#00e676", "Moderate": "#ffab40", "Obfuscated": "#ff5252"}
    model_colors = ["#00d2ff", "#ff6bcb", "#ffd700"]
    
    # ── Figure 1: Model Comparison Bar Chart ──
    fig, ax = plt.subplots(figsize=(12, 6))
    
    metric_names = ["Accuracy", "F1 Macro", "F1 Weighted", "Precision", "Recall"]
    metric_keys = ["accuracy", "f1_macro", "f1_weighted", "precision", "recall"]
    
    x = np.arange(len(metric_names))
    width = 0.25
    
    for i, (name, res) in enumerate(results.items()):
        values = [res[k] for k in metric_keys]
        bars = ax.bar(x + i * width, values, width, label=name,
                     color=model_colors[i], alpha=0.85, edgecolor="white", linewidth=0.5)
        
        # Value labels on bars
        for bar, val in zip(bars, values):
            ax.text(bar.get_x() + bar.get_width() / 2, bar.get_height() + 0.01,
                   f"{val:.3f}", ha="center", va="bottom", fontsize=8, fontweight="bold")
    
    ax.set_xlabel("Metric", fontsize=13, fontweight="bold")
    ax.set_ylabel("Score", fontsize=13, fontweight="bold")
    ax.set_title("Model Performance Comparison", fontsize=16, fontweight="bold", 
                color="#00d2ff", pad=15)
    ax.set_xticks(x + width)
    ax.set_xticklabels(metric_names, fontsize=11)
    ax.set_ylim(0, 1.15)
    ax.legend(fontsize=11, facecolor="#16213e", edgecolor="#444", labelcolor="#e0e0e0")
    ax.grid(axis="y", alpha=0.15, color="#888")
    
    fig.tight_layout()
    comparison_path = os.path.join(OUT_DIR, "ml_model_comparison.png")
    fig.savefig(comparison_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(f"  [SAVED] {comparison_path}")
    
    
    # ── Figure 2: Confusion Matrices ──
    n_models = len(results)
    fig, axes = plt.subplots(1, n_models, figsize=(6 * n_models, 5))
    if n_models == 1:
        axes = [axes]
    
    for ax, (name, _) in zip(axes, results.items()):
        if name in predictions:
            cm = confusion_matrix(y, predictions[name], labels=CLASS_ORDER)
            
            # Normalize for coloring
            cm_norm = cm.astype(float) / cm.sum(axis=1, keepdims=True)
            cm_norm = np.nan_to_num(cm_norm)
            
            im = ax.imshow(cm_norm, cmap="YlOrRd", vmin=0, vmax=1, aspect="auto")
            
            # Annotate
            for i in range(len(CLASS_ORDER)):
                for j in range(len(CLASS_ORDER)):
                    text_color = "white" if cm_norm[i][j] > 0.5 else "#e0e0e0"
                    ax.text(j, i, f"{cm[i][j]}", ha="center", va="center",
                           fontsize=14, fontweight="bold", color=text_color)
            
            ax.set_xticks(range(len(CLASS_ORDER)))
            ax.set_yticks(range(len(CLASS_ORDER)))
            short_labels = ["Easy", "Mod.", "Obfusc."]
            ax.set_xticklabels(short_labels, fontsize=10)
            ax.set_yticklabels(short_labels, fontsize=10)
            ax.set_xlabel("Predicted", fontsize=11, fontweight="bold")
            ax.set_ylabel("Actual", fontsize=11, fontweight="bold")
            ax.set_title(name, fontsize=13, fontweight="bold", color="#00d2ff")
            
            # Grid
            for i in range(len(CLASS_ORDER) + 1):
                ax.axhline(i - 0.5, color="#0f3460", linewidth=1.5)
                ax.axvline(i - 0.5, color="#0f3460", linewidth=1.5)
    
    fig.suptitle("Confusion Matrices (Cross-Validated)", fontsize=16, 
                fontweight="bold", color="#00d2ff", y=1.02)
    fig.tight_layout()
    cm_path = os.path.join(OUT_DIR, "ml_confusion_matrices.png")
    fig.savefig(cm_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(f"  [SAVED] {cm_path}")
    
    
    # ── Figure 3: Feature Importance ──
    if feature_importances:
        n_plots = len(feature_importances)
        fig, axes = plt.subplots(1, n_plots, figsize=(7 * n_plots, 8))
        if n_plots == 1:
            axes = [axes]
        
        for ax, (name, importances) in zip(axes, feature_importances.items()):
            indices = np.argsort(importances)
            
            y_pos = np.arange(len(ALL_FEATURES))
            colors = [model_colors[list(feature_importances.keys()).index(name)]] * len(ALL_FEATURES)
            
            ax.barh(y_pos, importances[indices], color=colors, alpha=0.85,
                   edgecolor="white", linewidth=0.5)
            ax.set_yticks(y_pos)
            ax.set_yticklabels([ALL_FEATURES[i] for i in indices], fontsize=9)
            ax.set_xlabel("Importance", fontsize=11, fontweight="bold")
            ax.set_title(name, fontsize=13, fontweight="bold", color="#00d2ff")
            ax.grid(axis="x", alpha=0.15, color="#888")
        
        fig.suptitle("Feature Importance by Model", fontsize=16,
                    fontweight="bold", color="#00d2ff", y=1.02)
        fig.tight_layout()
        fi_path = os.path.join(OUT_DIR, "ml_feature_importance.png")
        fig.savefig(fi_path, dpi=200, bbox_inches="tight")
        plt.close(fig)
        print(f"  [SAVED] {fi_path}")


# ---------------------------------------------------------------------------
# Summary
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("PIPELINE COMPLETE")
print("=" * 72)

print(f"\n  Best Model: {best_model}")
print(f"  Accuracy:   {results[best_model]['accuracy']:.4f}")
print(f"  F1 Macro:   {results[best_model]['f1_macro']:.4f}")
print(f"  F1 Weighted: {results[best_model]['f1_weighted']:.4f}")

print(f"\n  Output files:")
print(f"    1. {predictions_csv}")
if HAS_MPL:
    print(f"    2. {os.path.join(OUT_DIR, 'ml_model_comparison.png')}")
    print(f"    3. {os.path.join(OUT_DIR, 'ml_confusion_matrices.png')}")
    if feature_importances:
        print(f"    4. {os.path.join(OUT_DIR, 'ml_feature_importance.png')}")

print(f"\n  Note: With only {len(companies)} training samples, results should be")
print(f"  interpreted cautiously. The model learns from the human-labeled subset")
print(f"  and generalizes to all {len(all_companies)} companies.")
print("=" * 72)
