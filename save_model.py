"""
Save Trained Model for Website Deployment
==========================================
Trains the best model on full labeled data and exports:
  - model.pkl          (trained classifier)
  - scaler.pkl         (fitted StandardScaler)
  - label_encoder.pkl  (fitted LabelEncoder)

These are loaded by the Flask website to serve predictions.
"""

import csv
import os
import sys
import warnings
warnings.filterwarnings("ignore")

import numpy as np
import joblib
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.preprocessing import LabelEncoder, StandardScaler
from sklearn.model_selection import StratifiedKFold, cross_val_predict
from sklearn.metrics import f1_score, accuracy_score

try:
    from xgboost import XGBClassifier
    HAS_XGB = True
except ImportError:
    HAS_XGB = False
    print("[WARN] xgboost not found. XGBoost model will be skipped.")

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
LABELS_CSV = os.path.join(BASE_DIR, "dataset", "manual_labels.csv")
FEATURES_CSV = os.path.join(BASE_DIR, "dataset", "policy_features.csv")
DATASET_CSV = os.path.join(BASE_DIR, "dataset", "obfuscation_dataset.csv")

# Output directory
OUT_DIR = os.path.join(BASE_DIR, "website", "model")
os.makedirs(OUT_DIR, exist_ok=True)

# Feature columns (must match training pipeline exactly)
RAW_FEATURES = [
    "word_count", "sentence_count", "avg_sentence_length", "char_count",
    "unique_words", "flesch_reading_ease", "flesch_kincaid_grade",
    "legal_term_count",
]

NORM_FEATURES = [
    "norm_word_count", "norm_avg_sentence_length", "norm_unique_words",
    "norm_flesch_reading_ease", "norm_legal_term_count",
]

ALL_FEATURES = RAW_FEATURES + NORM_FEATURES
CLASS_ORDER = ["Easy", "Moderate", "Obfuscated"]
SEED = 42

# ---------------------------------------------------------------------------
# 1. Load & Merge Data (same as ml_classification.py)
# ---------------------------------------------------------------------------
print("=" * 60)
print("PHASE 1: EXPORT TRAINED MODEL")
print("=" * 60)

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

X = np.array(X_data)
y = np.array(y_data)

print(f"\n  Dataset: {len(companies)} companies, {len(ALL_FEATURES)} features")
for cls in CLASS_ORDER:
    count = sum(1 for yi in y if yi == cls)
    print(f"    {cls:<12} {count:>3} samples")

# ---------------------------------------------------------------------------
# 2. Encode & Scale
# ---------------------------------------------------------------------------
le = LabelEncoder()
le.fit(CLASS_ORDER)
y_encoded = le.transform(y)

scaler = StandardScaler()
X_scaled = scaler.fit_transform(X)

print(f"\n  Label encoding: {dict(zip(CLASS_ORDER, le.transform(CLASS_ORDER)))}")
print(f"  Features standardized: X shape = {X_scaled.shape}")

# ---------------------------------------------------------------------------
# 3. Evaluate All Models (CV) to Pick the Best
# ---------------------------------------------------------------------------
print(f"\n{'-' * 60}")
print("Evaluating models via cross-validation...")
print(f"{'-' * 60}")

n_splits = min(5, min(sum(1 for yi in y if yi == cls) for cls in CLASS_ORDER))
if n_splits < 2:
    n_splits = 3
if len(y) < 20:
    n_splits = min(len(y), 5)

cv = StratifiedKFold(n_splits=n_splits, shuffle=True, random_state=SEED)

models = {
    "Random Forest": RandomForestClassifier(
        n_estimators=200, max_depth=10, min_samples_split=3,
        min_samples_leaf=2, class_weight="balanced",
        random_state=SEED, n_jobs=-1,
    ),
    "Logistic Regression": LogisticRegression(
        max_iter=2000, solver="lbfgs", class_weight="balanced",
        random_state=SEED, C=1.0,
    ),
}

if HAS_XGB:
    models["XGBoost"] = XGBClassifier(
        n_estimators=200, max_depth=6, learning_rate=0.1,
        subsample=0.8, colsample_bytree=0.8,
        random_state=SEED, eval_metric="mlogloss",
    )

best_model_name = None
best_f1 = -1
cv_results = {}

for name, model in models.items():
    try:
        if name == "XGBoost":
            # Manual CV for XGBoost to handle missing classes in folds
            y_pred = np.zeros(len(y_encoded), dtype=int)
            for train_idx, test_idx in cv.split(X_scaled, y_encoded):
                X_train, X_test = X_scaled[train_idx], X_scaled[test_idx]
                y_train = y_encoded[train_idx]
                
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
                y_pred[test_idx] = np.array([inv_map[p] for p in preds_mapped])
        else:
            y_pred = cross_val_predict(model, X_scaled, y_encoded, cv=cv)
        
        y_pred_labels = le.inverse_transform(y_pred)
        acc = accuracy_score(y, y_pred_labels)
        f1_w = f1_score(y, y_pred_labels, average="weighted", labels=CLASS_ORDER)
        f1_m = f1_score(y, y_pred_labels, average="macro", labels=CLASS_ORDER)
        
        cv_results[name] = {"accuracy": acc, "f1_weighted": f1_w, "f1_macro": f1_m}
        
        print(f"\n  {name}:")
        print(f"    Accuracy:     {acc:.4f} ({acc*100:.1f}%)")
        print(f"    F1 weighted:  {f1_w:.4f}")
        print(f"    F1 macro:     {f1_m:.4f}")
        
        if f1_w > best_f1:
            best_f1 = f1_w
            best_model_name = name
    
    except Exception as e:
        print(f"\n  {name}: [ERROR] {e}")

print(f"\n{'-' * 60}")
print(f"  >>> BEST MODEL: {best_model_name} (F1 weighted = {best_f1:.4f})")
print(f"{'-' * 60}")

# ---------------------------------------------------------------------------
# 4. Train Best Model on Full Data & Save
# ---------------------------------------------------------------------------
print(f"\n  Training {best_model_name} on ALL {len(y)} samples...")

best_model = models[best_model_name]
best_model.fit(X_scaled, y_encoded)

# Save artifacts
model_path = os.path.join(OUT_DIR, "model.pkl")
scaler_path = os.path.join(OUT_DIR, "scaler.pkl")
encoder_path = os.path.join(OUT_DIR, "label_encoder.pkl")

# Also save feature names and metadata for the website
metadata = {
    "model_name": best_model_name,
    "features": ALL_FEATURES,
    "raw_features": RAW_FEATURES,
    "norm_features": NORM_FEATURES,
    "classes": CLASS_ORDER,
    "n_training_samples": len(y),
    "cv_f1_weighted": best_f1,
    "cv_accuracy": cv_results[best_model_name]["accuracy"],
    "scaler_mean": scaler.mean_.tolist(),
    "scaler_scale": scaler.scale_.tolist(),
}
metadata_path = os.path.join(OUT_DIR, "metadata.pkl")

joblib.dump(best_model, model_path)
joblib.dump(scaler, scaler_path)
joblib.dump(le, encoder_path)
joblib.dump(metadata, metadata_path)

print(f"\n  [SAVED] {model_path}")
print(f"  [SAVED] {scaler_path}")
print(f"  [SAVED] {encoder_path}")
print(f"  [SAVED] {metadata_path}")

# Verify saved model loads correctly
print(f"\n{'-' * 60}")
print("Verification: Loading saved model...")
print(f"{'-' * 60}")

loaded_model = joblib.load(model_path)
loaded_scaler = joblib.load(scaler_path)
loaded_le = joblib.load(encoder_path)
loaded_meta = joblib.load(metadata_path)

# Test prediction on first sample
test_X = loaded_scaler.transform(X[:1])
test_pred = loaded_model.predict(test_X)
test_proba = loaded_model.predict_proba(test_X)
test_label = loaded_le.inverse_transform(test_pred)[0]

print(f"\n  Test prediction for '{companies[0]}':")
print(f"    Actual:    {y[0]}")
print(f"    Predicted: {test_label}")
print(f"    Probabilities: {dict(zip(CLASS_ORDER, [f'{p:.4f}' for p in test_proba[0]]))}")
print(f"    Model:     {loaded_meta['model_name']}")
print(f"    Features:  {len(loaded_meta['features'])}")

# Verify full dataset predictions match
full_pred = loaded_le.inverse_transform(loaded_model.predict(X_scaled))
full_acc = accuracy_score(y, full_pred)
print(f"\n  Full dataset accuracy (train): {full_acc:.4f} ({full_acc*100:.1f}%)")

if full_acc > 0.5:
    print(f"\n  [OK] Model exported successfully!")
else:
    print(f"\n  [!!] WARNING: Low accuracy, model may not have saved correctly")

print(f"\n{'=' * 60}")
print("PHASE 1 COMPLETE")
print(f"{'=' * 60}")
print(f"\n  Exported files in: {OUT_DIR}")
print(f"    model.pkl          ({os.path.getsize(model_path):,} bytes)")
print(f"    scaler.pkl         ({os.path.getsize(scaler_path):,} bytes)")
print(f"    label_encoder.pkl  ({os.path.getsize(encoder_path):,} bytes)")
print(f"    metadata.pkl       ({os.path.getsize(metadata_path):,} bytes)")
print(f"\n  Ready for Phase 2: Flask backend")
