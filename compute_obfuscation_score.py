import csv
import os
import statistics

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_CSV = os.path.join(BASE_DIR, "dataset", "policy_features.csv")
OUTPUT_CSV = os.path.join(BASE_DIR, "dataset", "obfuscation_scores.csv")

# Features selected for obfuscation (from feature analysis)
SELECTED_FEATURES = [
    "word_count",
    "avg_sentence_length",
    "unique_words",
    "flesch_reading_ease",   # needs inversion
    "legal_term_count",
]

# Weights for obfuscation score components
WEIGHTS = {
    "flesch_reading_ease":   0.35,   # readability component
    "avg_sentence_length":   0.25,   # sentence length component
    "legal_term_count":      0.20,   # jargon component
    "word_count":            0.20,   # length component  (unique_words folded in below)
}

# Features where HIGHER raw value means EASIER / less obfuscating
# These will be inverted after normalization so that higher = more obfuscation
INVERT_FEATURES = {"flesch_reading_ease"}

# ---------------------------------------------------------------------------
# 1. Load data
# ---------------------------------------------------------------------------
with open(INPUT_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    rows = [r for r in reader if r["company"].strip()]

print(f"Loaded {len(rows)} companies from {INPUT_CSV}\n")

# ---------------------------------------------------------------------------
# 2. Extract raw feature values
# ---------------------------------------------------------------------------
raw_values = {feat: [] for feat in SELECTED_FEATURES}

for row in rows:
    for feat in SELECTED_FEATURES:
        raw_values[feat].append(float(row[feat]))

# ---------------------------------------------------------------------------
# 3. Min-Max normalization
# ---------------------------------------------------------------------------
feat_min = {}
feat_max = {}
for feat in SELECTED_FEATURES:
    feat_min[feat] = min(raw_values[feat])
    feat_max[feat] = max(raw_values[feat])


def min_max_normalize(value, f_min, f_max):
    """Scale value to [0, 1]. Returns 0 if range is zero."""
    if f_max == f_min:
        return 0.0
    return (value - f_min) / (f_max - f_min)


# Build normalised (and inverted where needed) values per company
normalized = []  # list of dicts, one per company

for i, row in enumerate(rows):
    entry = {"company": row["company"]}
    for feat in SELECTED_FEATURES:
        raw = raw_values[feat][i]
        normed = min_max_normalize(raw, feat_min[feat], feat_max[feat])

        # Invert so that higher always means MORE obfuscation
        if feat in INVERT_FEATURES:
            normed = 1.0 - normed

        entry[f"norm_{feat}"] = round(normed, 6)
    normalized.append(entry)

# ---------------------------------------------------------------------------
# 4. Show transformed feature ranges
# ---------------------------------------------------------------------------
print("=" * 72)
print("STEP 3 — Normalized Feature Ranges (0 = least, 1 = most obfuscating)")
print("=" * 72)
print(f"{'Feature':<28} {'Raw Min':>10} {'Raw Max':>10}  {'Norm Min':>8} {'Norm Max':>8}  Note")
print("-" * 72)

for feat in SELECTED_FEATURES:
    all_normed = [entry[f"norm_{feat}"] for entry in normalized]
    inv_tag = " (inverted)" if feat in INVERT_FEATURES else ""
    print(
        f"{feat:<28} {feat_min[feat]:>10.2f} {feat_max[feat]:>10.2f}"
        f"  {min(all_normed):>8.4f} {max(all_normed):>8.4f}  {inv_tag}"
    )

print()

# ---------------------------------------------------------------------------
# 5. Compute obfuscation score
# ---------------------------------------------------------------------------
# Note: unique_words is not given its own weight in the user's formula, but
# was selected as an obfuscation feature. We fold it into the length component
# by splitting the 0.20 length weight equally between word_count and
# unique_words (0.10 each). This keeps the total weight at 1.0 and captures
# both volume and vocabulary breadth.
#
# Final weights:
#   readability (flesch_reading_ease):  0.35
#   sentence_length (avg_sentence_length): 0.25
#   jargon (legal_term_count): 0.20
#   length (word_count): 0.10
#   vocabulary (unique_words): 0.10
#   TOTAL: 1.00
#
# Justification for splitting the length component:
#   word_count and unique_words are correlated but measure different things.
#   word_count captures sheer volume (information overload), while
#   unique_words captures vocabulary breadth (lexical complexity).
#   Splitting the 0.20 weight equally acknowledges both dimensions without
#   inflating the overall length contribution.

FINAL_WEIGHTS = {
    "flesch_reading_ease":   0.35,
    "avg_sentence_length":   0.25,
    "legal_term_count":      0.20,
    "word_count":            0.10,
    "unique_words":          0.10,
}

scores_raw = []
for entry in normalized:
    score = 0.0
    for feat, weight in FINAL_WEIGHTS.items():
        score += weight * entry[f"norm_{feat}"]
    entry["score_raw"] = round(score, 6)
    entry["obfuscation_score"] = round(score * 100, 2)
    scores_raw.append(entry["obfuscation_score"])

# ---------------------------------------------------------------------------
# 6. Summary statistics
# ---------------------------------------------------------------------------
print("=" * 72)
print("STEP 4 — Obfuscation Score Summary (0–100 scale)")
print("=" * 72)
print(f"  Minimum score:  {min(scores_raw):.2f}")
print(f"  Maximum score:  {max(scores_raw):.2f}")
print(f"  Mean score:     {statistics.mean(scores_raw):.2f}")
print(f"  Median score:   {statistics.median(scores_raw):.2f}")
print()

# ---------------------------------------------------------------------------
# 7. Show weight breakdown
# ---------------------------------------------------------------------------
print("=" * 72)
print("Weight Breakdown")
print("=" * 72)
print(f"  readability_component  (flesch_reading_ease):  {FINAL_WEIGHTS['flesch_reading_ease']:.2f}")
print(f"  sentence_length_component (avg_sentence_length): {FINAL_WEIGHTS['avg_sentence_length']:.2f}")
print(f"  jargon_component       (legal_term_count):     {FINAL_WEIGHTS['legal_term_count']:.2f}")
print(f"  length_component       (word_count):           {FINAL_WEIGHTS['word_count']:.2f}")
print(f"  vocabulary_component   (unique_words):         {FINAL_WEIGHTS['unique_words']:.2f}")
print(f"  TOTAL:                                         {sum(FINAL_WEIGHTS.values()):.2f}")
print()

# ---------------------------------------------------------------------------
# 8. Top 10 & Bottom 10
# ---------------------------------------------------------------------------
ranked = sorted(normalized, key=lambda x: x["obfuscation_score"], reverse=True)

print("=" * 72)
print("Top 10 Most Obfuscating Policies")
print("=" * 72)
print(f"{'Rank':<6} {'Company':<25} {'Score':>8}")
print("-" * 42)
for i, entry in enumerate(ranked[:10], 1):
    print(f"{i:<6} {entry['company']:<25} {entry['obfuscation_score']:>8.2f}")

print()
print("=" * 72)
print("Top 10 Least Obfuscating Policies")
print("=" * 72)
print(f"{'Rank':<6} {'Company':<25} {'Score':>8}")
print("-" * 42)
for i, entry in enumerate(ranked[-10:], len(ranked) - 9):
    print(f"{i:<6} {entry['company']:<25} {entry['obfuscation_score']:>8.2f}")

# ---------------------------------------------------------------------------
# 9. Write output CSV
# ---------------------------------------------------------------------------
out_fieldnames = (
    ["company"]
    + [f"norm_{f}" for f in SELECTED_FEATURES]
    + ["score_raw", "obfuscation_score"]
)

with open(OUTPUT_CSV, "w", encoding="utf-8", newline="") as f:
    writer = csv.DictWriter(f, fieldnames=out_fieldnames)
    writer.writeheader()
    for entry in ranked:
        writer.writerow({k: entry[k] for k in out_fieldnames})

print(f"\nFull results written to {OUTPUT_CSV}")
