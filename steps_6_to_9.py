"""
Steps 6-9: Label Generation, Manual Validation, Correlation Analysis,
           and Final Dataset Creation
=====================================================================
"""

import csv
import os
import math
import statistics

# ---------------------------------------------------------------------------
# Optional imports
# ---------------------------------------------------------------------------
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    import matplotlib.ticker as mticker
    HAS_MPL = True
except ImportError:
    HAS_MPL = False
    print("[WARN] matplotlib not found -- only text output will be produced.\n")

try:
    import numpy as np
    HAS_NP = True
except ImportError:
    HAS_NP = False

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
SCORES_CSV = os.path.join(BASE_DIR, "dataset", "obfuscation_scores.csv")
FEATURES_CSV = os.path.join(BASE_DIR, "dataset", "policy_features.csv")
OUT_DIR = os.path.join(BASE_DIR, "dataset")

SELECTED_FEATURES = [
    "word_count", "avg_sentence_length", "unique_words",
    "flesch_reading_ease", "legal_term_count",
]

ORIGINAL_FEATURES = [
    "word_count", "sentence_count", "avg_sentence_length", "char_count",
    "unique_words", "flesch_reading_ease", "flesch_kincaid_grade",
    "legal_term_count",
]

NORM_FEATURES = [f"norm_{f}" for f in SELECTED_FEATURES]

# ---------------------------------------------------------------------------
# 1. Load data
# ---------------------------------------------------------------------------
# Load obfuscation scores
scores_data = []
with open(SCORES_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row["company"].strip():
            scores_data.append(row)

# Load original features
features_data = {}
with open(FEATURES_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row["company"].strip():
            features_data[row["company"].strip()] = row

N = len(scores_data)
print(f"Loaded {N} companies.\n")

# Extract scores as floats
for entry in scores_data:
    entry["obfuscation_score"] = float(entry["obfuscation_score"])

scores_list = [e["obfuscation_score"] for e in scores_data]
sorted_scores = sorted(scores_list)


# ===================================================================
#  STEP 6: LABEL GENERATION
# ===================================================================
print("=" * 72)
print("STEP 6 -- Label Generation")
print("=" * 72)

# --- Method A: Fixed Thresholds ---
def label_fixed(score):
    """Fixed threshold labeling: Easy 0-30, Moderate 31-60, Obfuscated 61-100."""
    if score <= 30:
        return "Easy"
    elif score <= 60:
        return "Moderate"
    else:
        return "Obfuscated"

for entry in scores_data:
    entry["label_fixed"] = label_fixed(entry["obfuscation_score"])

count_a = {"Easy": 0, "Moderate": 0, "Obfuscated": 0}
for entry in scores_data:
    count_a[entry["label_fixed"]] += 1

print("\nMethod A: Fixed Thresholds (Easy: 0-30 | Moderate: 31-60 | Obfuscated: 61-100)")
print("-" * 55)
for label in ["Easy", "Moderate", "Obfuscated"]:
    pct = count_a[label] / N * 100
    bar = "#" * count_a[label]
    print(f"  {label:<12} {count_a[label]:>3}  ({pct:5.1f}%)  {bar}")

# --- Method B: Percentile-Based (Terciles) ---
def percentile(data, p):
    """Return p-th percentile (0-100 scale) of sorted data."""
    k = (len(data) - 1) * p / 100.0
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return data[int(k)]
    return data[f] * (c - k) + data[c] * (k - f)

p33 = percentile(sorted_scores, 33.33)
p67 = percentile(sorted_scores, 66.67)

def label_percentile(score):
    """Percentile-based labeling using tercile thresholds."""
    if score <= p33:
        return "Easy"
    elif score <= p67:
        return "Moderate"
    else:
        return "Obfuscated"

for entry in scores_data:
    entry["label_percentile"] = label_percentile(entry["obfuscation_score"])

count_b = {"Easy": 0, "Moderate": 0, "Obfuscated": 0}
for entry in scores_data:
    count_b[entry["label_percentile"]] += 1

print(f"\nMethod B: Percentile-Based Terciles (P33 = {p33:.2f} | P67 = {p67:.2f})")
print("-" * 55)
for label in ["Easy", "Moderate", "Obfuscated"]:
    pct = count_b[label] / N * 100
    bar = "#" * count_b[label]
    print(f"  {label:<12} {count_b[label]:>3}  ({pct:5.1f}%)  {bar}")

# --- Comparison ---
print(f"\n{'Comparison':}")
print("-" * 55)
print(f"  {'Label':<12} {'Method A':>10} {'Method B':>10} {'Diff':>8}")
print(f"  {'-----':<12} {'--------':>10} {'--------':>10} {'----':>8}")
for label in ["Easy", "Moderate", "Obfuscated"]:
    diff = count_b[label] - count_a[label]
    print(f"  {label:<12} {count_a[label]:>10} {count_b[label]:>10} {diff:>+8}")

# Class imbalance metrics
def imbalance_ratio(counts):
    """Ratio of largest to smallest class."""
    vals = list(counts.values())
    return max(vals) / max(min(vals), 1)

ir_a = imbalance_ratio(count_a)
ir_b = imbalance_ratio(count_b)
print(f"\n  Imbalance ratio (max/min class):")
print(f"    Method A: {ir_a:.2f}")
print(f"    Method B: {ir_b:.2f}  (closer to 1.0 = more balanced)")

# --- Recommendation ---
print(f"\n{'RECOMMENDATION':}")
print("-" * 55)
if ir_b < ir_a:
    recommended = "B"
    rec_label_key = "label_percentile"
    print("  --> Method B (Percentile-Based) is RECOMMENDED.")
    print()
    print("  Reasons:")
    print(f"  1. Better class balance: imbalance ratio {ir_b:.2f} vs {ir_a:.2f}")
    print(f"  2. Method A produces {count_a['Obfuscated']} 'Obfuscated' sample(s),")
    print(f"     which is too few for meaningful ML training / analysis.")
    print(f"  3. Percentile-based splits adapt to the actual data distribution,")
    print(f"     avoiding the pitfall of arbitrary fixed boundaries.")
    print(f"  4. Roughly equal class sizes (~{N//3} each) enable balanced")
    print(f"     classification and unbiased evaluation metrics.")
else:
    recommended = "A"
    rec_label_key = "label_fixed"
    print("  --> Method A (Fixed Thresholds) is RECOMMENDED.")
    print("  Reason: It produces better class balance for this dataset.")

# Assign the recommended label
for entry in scores_data:
    entry["label"] = entry[rec_label_key]

print()


# ===================================================================
#  STEP 7: MANUAL VALIDATION
# ===================================================================
print("=" * 72)
print("STEP 7 -- Manual Validation")
print("=" * 72)

ranked = sorted(scores_data, key=lambda x: x["obfuscation_score"], reverse=True)

print("\nTop 10 Most Obfuscated Policies")
print("-" * 55)
print(f"  {'Rank':<6} {'Company':<25} {'Score':>8} {'Label':<12}")
print(f"  {'----':<6} {'-------':<25} {'-----':>8} {'-----':<12}")
for i, entry in enumerate(ranked[:10], 1):
    print(f"  {i:<6} {entry['company']:<25} {entry['obfuscation_score']:>8.2f} {entry['label']:<12}")

print(f"\nTop 10 Least Obfuscated Policies")
print("-" * 55)
print(f"  {'Rank':<6} {'Company':<25} {'Score':>8} {'Label':<12}")
print(f"  {'----':<6} {'-------':<25} {'-----':>8} {'-----':<12}")
for i, entry in enumerate(ranked[-10:][::-1], 1):
    print(f"  {i:<6} {entry['company']:<25} {entry['obfuscation_score']:>8.2f} {entry['label']:<12}")

# Logical consistency check
print(f"\n{'Logical Consistency Analysis':}")
print("-" * 55)

# Check if most-obfuscated have expected characteristics
print("\n  Checking top 5 most obfuscated against raw features:")
for entry in ranked[:5]:
    company = entry["company"]
    if company in features_data:
        feat = features_data[company]
        wc = int(feat["word_count"])
        fre = float(feat["flesch_reading_ease"])
        asl = float(feat["avg_sentence_length"])
        ltc = int(feat["legal_term_count"])
        print(f"    {company:<20} WC={wc:>6}  FRE={fre:>6.1f}  ASL={asl:>5.1f}  LTC={ltc:>4}")

print("\n  Checking bottom 5 least obfuscated against raw features:")
for entry in ranked[-5:][::-1]:
    company = entry["company"]
    if company in features_data:
        feat = features_data[company]
        wc = int(feat["word_count"])
        fre = float(feat["flesch_reading_ease"])
        asl = float(feat["avg_sentence_length"])
        ltc = int(feat["legal_term_count"])
        print(f"    {company:<20} WC={wc:>6}  FRE={fre:>6.1f}  ASL={asl:>5.1f}  LTC={ltc:>4}")

# Identify any suspicious patterns
print(f"\n{'Suspicious Score Analysis':}")
print("-" * 55)

# Check for duplicates (same-company policies)
seen_scores = {}
duplicates = []
for entry in scores_data:
    s = entry["obfuscation_score"]
    if s in seen_scores:
        duplicates.append((entry["company"], seen_scores[s], s))
    else:
        seen_scores[s] = entry["company"]

if duplicates:
    print("\n  Companies with identical scores:")
    for comp, other, score in duplicates:
        print(f"    - {comp} and {other}: {score:.2f}")
    print("    Cause: These companies likely share the same parent privacy policy")
    print("    (e.g., Atlassian products: Jira, Trello, Confluence, Bitbucket).")

# Check for extreme Flesch scores that might skew results
print("\n  Potential concerns:")
bumble_entry = next((e for e in scores_data if e["company"] == "Bumble"), None)
if bumble_entry:
    bf = features_data.get("Bumble", {})
    if bf:
        print(f"    - Bumble: Score={bumble_entry['obfuscation_score']:.2f}, but has extreme")
        print(f"      avg_sentence_length ({float(bf['avg_sentence_length']):.1f}) which is")
        print(f"      an outlier. This may be due to unconventional formatting (run-on")
        print(f"      paragraphs, bullet lists parsed as single sentences).")

equifax_entry = next((e for e in scores_data if e["company"] == "Equifax"), None)
if equifax_entry:
    ef = features_data.get("Equifax", {})
    if ef:
        print(f"    - Equifax: Score={equifax_entry['obfuscation_score']:.2f} (high), despite")
        print(f"      having only {ef['word_count']} words. Driven almost entirely by its")
        print(f"      very low Flesch reading ease ({float(ef['flesch_reading_ease']):.1f}),")
        print(f"      meaning short but extremely dense/complex language.")

goodreads_entry = next((e for e in scores_data if e["company"] == "Goodreads"), None)
if goodreads_entry:
    gf = features_data.get("Goodreads", {})
    if gf:
        print(f"    - Goodreads: Score={goodreads_entry['obfuscation_score']:.2f} (very low).")
        print(f"      Flesch reading ease of {float(gf['flesch_reading_ease']):.1f} is the")
        print(f"      highest in the dataset, plus minimal word count ({gf['word_count']})")
        print(f"      and almost no legal terms ({gf['legal_term_count']}). This is")
        print(f"      consistent -- Goodreads is known for a short, readable policy.")

print()


# ===================================================================
#  STEP 8: CORRELATION ANALYSIS
# ===================================================================
print("=" * 72)
print("STEP 8 -- Correlation Analysis")
print("=" * 72)

# Build feature vectors for correlation
corr_features = [
    "obfuscation_score",
    "flesch_reading_ease",      # readability
    "avg_sentence_length",      # sentence length
    "legal_term_count",         # jargon density
    "word_count",               # policy length
]

corr_labels = [
    "Obfusc. Score",
    "Readability (FRE)",
    "Sent. Length",
    "Jargon (Legal Terms)",
    "Policy Length (WC)",
]

# Build vectors
vectors = {feat: [] for feat in corr_features}
for entry in scores_data:
    company = entry["company"]
    vectors["obfuscation_score"].append(entry["obfuscation_score"])
    if company in features_data:
        for feat in corr_features[1:]:
            vectors[feat].append(float(features_data[company][feat]))
    else:
        for feat in corr_features[1:]:
            vectors[feat].append(0.0)


def pearson_corr(x, y):
    """Compute Pearson correlation coefficient."""
    n = len(x)
    mean_x = sum(x) / n
    mean_y = sum(y) / n
    num = sum((xi - mean_x) * (yi - mean_y) for xi, yi in zip(x, y))
    den_x = math.sqrt(sum((xi - mean_x) ** 2 for xi in x))
    den_y = math.sqrt(sum((yi - mean_y) ** 2 for yi in y))
    if den_x == 0 or den_y == 0:
        return 0.0
    return num / (den_x * den_y)


# Compute correlation matrix
n_feat = len(corr_features)
corr_matrix = [[0.0] * n_feat for _ in range(n_feat)]

for i in range(n_feat):
    for j in range(n_feat):
        corr_matrix[i][j] = pearson_corr(vectors[corr_features[i]],
                                          vectors[corr_features[j]])

# Print correlation matrix
print("\nPearson Correlation Matrix:")
print("-" * 72)

# Header
header = f"{'':>22}"
for label in corr_labels:
    header += f" {label:>15}"
print(header)

for i, label in enumerate(corr_labels):
    row_str = f"  {label:>20}"
    for j in range(n_feat):
        row_str += f" {corr_matrix[i][j]:>15.4f}"
    print(row_str)

# Print the key correlations with obfuscation_score
print(f"\n{'Feature Influence on Obfuscation Score':}")
print("-" * 55)
print(f"  {'Feature':<25} {'Correlation':>12} {'|r|':>8} {'Strength':<15}")
print(f"  {'-------':<25} {'-----------':>12} {'---':>8} {'--------':<15}")

feature_corrs = []
for i in range(1, n_feat):
    r = corr_matrix[0][i]
    abs_r = abs(r)
    if abs_r >= 0.7:
        strength = "Strong"
    elif abs_r >= 0.4:
        strength = "Moderate"
    elif abs_r >= 0.2:
        strength = "Weak"
    else:
        strength = "Negligible"
    direction = "+" if r > 0 else "-"
    feature_corrs.append((corr_labels[i], r, abs_r, strength, direction))

# Sort by absolute correlation descending
feature_corrs.sort(key=lambda x: x[2], reverse=True)

for label, r, abs_r, strength, direction in feature_corrs:
    print(f"  {label:<25} {r:>+12.4f} {abs_r:>8.4f} {strength:<15}")

# Interpretation
print(f"\n{'Interpretation':}")
print("-" * 55)
for label, r, abs_r, strength, direction in feature_corrs:
    if direction == "-":
        print(f"  - {label} (r = {r:+.4f}): {strength} NEGATIVE correlation.")
        if "Readability" in label:
            print(f"    Higher readability (easier text) -> LOWER obfuscation. Expected.")
    else:
        print(f"  - {label} (r = {r:+.4f}): {strength} POSITIVE correlation.")
        if "Jargon" in label:
            print(f"    More legal terms -> HIGHER obfuscation. Expected.")
        elif "Length" in label and "Sent" not in label:
            print(f"    Longer policies -> HIGHER obfuscation. Expected.")
        elif "Sent" in label:
            print(f"    Longer sentences -> HIGHER obfuscation. Expected.")

print()

# --- Generate Heatmap ---
if HAS_MPL:
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

    fig, ax = plt.subplots(figsize=(10, 8))

    if HAS_NP:
        matrix = np.array(corr_matrix)
    else:
        matrix = corr_matrix

    # Create heatmap
    if HAS_NP:
        im = ax.imshow(matrix, cmap="RdYlBu_r", vmin=-1, vmax=1, aspect="auto")
    else:
        # Fallback: manual cell drawing
        for i in range(n_feat):
            for j in range(n_feat):
                val = corr_matrix[i][j]
                color_val = (val + 1) / 2  # map [-1,1] to [0,1]
                ax.add_patch(plt.Rectangle((j - 0.5, i - 0.5), 1, 1,
                                           facecolor=plt.cm.RdYlBu_r(color_val)))
        ax.set_xlim(-0.5, n_feat - 0.5)
        ax.set_ylim(n_feat - 0.5, -0.5)
        im = plt.cm.ScalarMappable(cmap="RdYlBu_r",
                                    norm=plt.Normalize(-1, 1))

    # Annotate cells
    for i in range(n_feat):
        for j in range(n_feat):
            val = corr_matrix[i][j]
            text_color = "white" if abs(val) > 0.6 else "#e0e0e0"
            ax.text(j, i, f"{val:.3f}", ha="center", va="center",
                    fontsize=11, fontweight="bold", color=text_color)

    ax.set_xticks(range(n_feat))
    ax.set_yticks(range(n_feat))

    # Shortened labels for display
    display_labels = [
        "Obfuscation\nScore",
        "Readability\n(FRE)",
        "Sentence\nLength",
        "Jargon\n(Legal Terms)",
        "Policy\nLength (WC)",
    ]
    ax.set_xticklabels(display_labels, fontsize=10, ha="center")
    ax.set_yticklabels(display_labels, fontsize=10)

    ax.set_title("Feature Correlation Heatmap",
                 fontsize=16, fontweight="bold", pad=20, color="#00d2ff")

    # Add colorbar
    cbar = fig.colorbar(im if HAS_NP else im, ax=ax, fraction=0.046, pad=0.04)
    cbar.set_label("Pearson Correlation (r)", fontsize=12, color="#e0e0e0")
    cbar.ax.tick_params(colors="#e0e0e0")

    # Grid lines between cells
    for i in range(n_feat + 1):
        ax.axhline(i - 0.5, color="#0f3460", linewidth=1.5)
        ax.axvline(i - 0.5, color="#0f3460", linewidth=1.5)

    fig.tight_layout()
    heatmap_path = os.path.join(OUT_DIR, "correlation_heatmap.png")
    fig.savefig(heatmap_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(f"[SAVED] Heatmap -> {heatmap_path}")


# ===================================================================
#  STEP 9: FINAL DATASET CREATION
# ===================================================================
print("\n" + "=" * 72)
print("STEP 9 -- Final Dataset Creation")
print("=" * 72)

# Build final rows by merging original features + normalized features + score + label
final_fieldnames = (
    ["company"]
    + ORIGINAL_FEATURES
    + NORM_FEATURES
    + ["score_raw", "obfuscation_score", "label"]
)

final_rows = []
for entry in ranked:  # Use ranked order (highest score first)
    company = entry["company"]
    row = {"company": company}

    # Original features
    if company in features_data:
        for feat in ORIGINAL_FEATURES:
            row[feat] = features_data[company][feat]
    else:
        for feat in ORIGINAL_FEATURES:
            row[feat] = ""

    # Normalized features
    for nf in NORM_FEATURES:
        row[nf] = entry.get(nf, "")

    # Score fields
    row["score_raw"] = entry.get("score_raw", "")
    row["obfuscation_score"] = entry["obfuscation_score"]
    row["label"] = entry["label"]

    final_rows.append(row)

# Write final CSV
final_csv_path = os.path.join(OUT_DIR, "obfuscation_dataset.csv")
with open(final_csv_path, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=final_fieldnames)
    writer.writeheader()
    for row in final_rows:
        writer.writerow(row)

print(f"\n  Output: {final_csv_path}")
print(f"  Rows:   {len(final_rows)}")
print(f"  Columns: {len(final_fieldnames)}")
print(f"\n  Column list:")
for i, col in enumerate(final_fieldnames, 1):
    print(f"    {i:>2}. {col}")

# Label distribution in final dataset
print(f"\n  Label distribution:")
label_counts = {"Easy": 0, "Moderate": 0, "Obfuscated": 0}
for row in final_rows:
    label_counts[row["label"]] += 1
for label in ["Easy", "Moderate", "Obfuscated"]:
    pct = label_counts[label] / len(final_rows) * 100
    print(f"    {label:<12} {label_counts[label]:>3}  ({pct:5.1f}%)")

print(f"\n  Labeling method used: {'Percentile-Based (Method B)' if recommended == 'B' else 'Fixed Thresholds (Method A)'}")

# Preview first 5 and last 5 rows
print(f"\n  Preview (top 5):")
print(f"    {'Company':<20} {'Score':>8} {'Label':<12}")
print(f"    {'-------':<20} {'-----':>8} {'-----':<12}")
for row in final_rows[:5]:
    print(f"    {row['company']:<20} {row['obfuscation_score']:>8} {row['label']:<12}")

print(f"\n  Preview (bottom 5):")
print(f"    {'Company':<20} {'Score':>8} {'Label':<12}")
print(f"    {'-------':<20} {'-----':>8} {'-----':<12}")
for row in final_rows[-5:]:
    print(f"    {row['company']:<20} {row['obfuscation_score']:>8} {row['label']:<12}")

print("\n" + "=" * 72)
print("All steps complete.")
print("=" * 72)
