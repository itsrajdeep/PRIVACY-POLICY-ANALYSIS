"""
Human Evaluation Pipeline for Privacy Policy Obfuscation
=========================================================
Steps:
  1. Select ~50 policies (15 easy, 20 medium, 15 hard)
  2. Identify 9 for manual human rating (3 per category)
  3. Auto-rate the remaining ~41 using NLP heuristics
  4. Merge all ratings
  5. Compute human_obfuscation scores & class labels
  6. Compare with formula-based obfuscation_score (Spearman correlation)
"""

import csv
import os
import math
import re
import statistics

# ---------------------------------------------------------------------------
# Optional imports
# ---------------------------------------------------------------------------
try:
    import matplotlib
    matplotlib.use("Agg")
    import matplotlib.pyplot as plt
    HAS_MPL = True
except ImportError:
    HAS_MPL = False

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
RAW_TEXT_DIR = os.path.join(BASE_DIR, "dataset", "raw_text")
OUT_DIR = os.path.join(BASE_DIR, "dataset")

# ---------------------------------------------------------------------------
# Helper Functions
# ---------------------------------------------------------------------------

def load_scores():
    """Load obfuscation scores CSV."""
    data = []
    with open(SCORES_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["company"].strip():
                row["obfuscation_score"] = float(row["obfuscation_score"])
                data.append(row)
    return data

def load_features():
    """Load policy features CSV."""
    data = {}
    with open(FEATURES_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["company"].strip():
                data[row["company"].strip()] = row
    return data

def read_policy_text(company):
    """Read raw policy text for a company."""
    filepath = os.path.join(RAW_TEXT_DIR, f"{company}.txt")
    if os.path.exists(filepath):
        with open(filepath, "r", encoding="utf-8", errors="replace") as f:
            return f.read()
    return ""


# ---------------------------------------------------------------------------
# NLP Heuristic Rating Functions (for auto-rating)
# ---------------------------------------------------------------------------

# Legal/jargon terms to detect
LEGAL_TERMS = [
    "hereinafter", "aforementioned", "notwithstanding", "pursuant",
    "indemnify", "indemnification", "waiver", "covenant", "arbitration",
    "jurisdiction", "statutory", "liability", "negligence", "warranty",
    "termination", "severability", "governing law", "binding",
    "third-party", "third party", "legitimate interest", "legitimate interests",
    "data processor", "data controller", "sub-processor", "sub-processors",
    "personally identifiable", "personal data", "personal information",
    "processing activities", "lawful basis", "consent",
    "opt-out", "opt out", "right to erasure", "right to deletion",
    "data subject", "data protection officer", "supervisory authority",
    "cross-border", "transfer mechanism", "standard contractual clauses",
    "binding corporate rules", "adequacy decision",
    "aggregate", "aggregated", "anonymize", "anonymized", "de-identify",
    "de-identified", "pseudonymize", "pseudonymized",
]

# Indirect/vague phrases
INDIRECT_PHRASES = [
    "may be", "might be", "could be", "may include", "may use",
    "from time to time", "under certain circumstances",
    "in some cases", "in certain situations", "as appropriate",
    "as necessary", "as required", "as applicable",
    "selected partners", "business purposes", "commercial purposes",
    "operational purposes", "legitimate business",
    "we reserve the right", "at our discretion", "at our sole discretion",
    "without limitation", "including but not limited to",
    "among other things", "such as", "for example",
    "relevant third parties", "certain third parties",
    "service providers", "business partners", "affiliated companies",
    "information may be shared", "data may be disclosed",
    "we may disclose", "we may share", "we may provide",
    "we may transfer", "we may collect",
    "various purposes", "different purposes",
    "enhance your experience", "improve our services",
    "better serve you", "personalize your experience",
]


def count_sentences(text):
    """Rough sentence count."""
    sentences = re.split(r'[.!?]+', text)
    return max(len([s for s in sentences if s.strip()]), 1)


def rate_q1_data_sharing_findability(text):
    """Q1: How hard to find data-sharing information? (1=very easy, 5=very hard)"""
    text_lower = text.lower()
    
    # Look for clear data sharing sections
    sharing_keywords = [
        "share your", "sharing your", "we share", "we disclose",
        "sell your", "we sell", "do not sell", "don't sell",
        "third party", "third-party", "third parties",
        "who we share", "sharing information", "disclosure of",
        "data sharing", "information sharing",
    ]
    
    # Check for section headers about sharing
    header_patterns = [
        r"(?:^|\n)\s*#{1,4}\s*.*(?:shar|disclos|third.part|who\s+(?:we|do))",
        r"(?:^|\n)\s*\d+\.\s*.*(?:shar|disclos|third.part)",
        r"(?:^|\n)\s*(?:how|when|who|what).*(?:shar|disclos)",
    ]
    
    keyword_hits = sum(1 for kw in sharing_keywords if kw in text_lower)
    header_hits = sum(1 for pat in header_patterns if re.search(pat, text_lower))
    
    word_count = len(text.split())
    
    # Normalize keyword density (per 1000 words)
    density = (keyword_hits / max(word_count, 1)) * 1000
    
    if header_hits >= 2 and density > 5:
        return 1  # Very easy - clear headers and frequent mentions
    elif header_hits >= 1 and density > 3:
        return 2  # Easy - some headers
    elif density > 2:
        return 3  # Moderate
    elif density > 1:
        return 4  # Difficult - sparse mentions
    else:
        return 5  # Very difficult - almost no clear sharing info


def rate_q2_legal_jargon(text):
    """Q2: How much legal jargon? (1=almost none, 5=very high)"""
    text_lower = text.lower()
    word_count = len(text.split())
    
    jargon_count = 0
    for term in LEGAL_TERMS:
        jargon_count += text_lower.count(term)
    
    # Density per 1000 words
    density = (jargon_count / max(word_count, 1)) * 1000
    
    if density < 3:
        return 1
    elif density < 8:
        return 2
    elif density < 15:
        return 3
    elif density < 25:
        return 4
    else:
        return 5


def rate_q3_indirectness(text):
    """Q3: How indirect is the language? (1=very direct, 5=very indirect)"""
    text_lower = text.lower()
    word_count = len(text.split())
    
    indirect_count = 0
    for phrase in INDIRECT_PHRASES:
        indirect_count += text_lower.count(phrase)
    
    # Density per 1000 words
    density = (indirect_count / max(word_count, 1)) * 1000
    
    # Also check for passive voice indicators
    passive_indicators = [
        "is collected", "are collected", "is shared", "are shared",
        "is used", "are used", "is provided", "are provided",
        "is processed", "are processed", "is disclosed", "are disclosed",
        "may be collected", "may be shared", "may be used",
        "may be provided", "may be processed", "may be disclosed",
        "will be collected", "will be shared", "will be used",
        "can be collected", "can be shared", "can be used",
        "being collected", "being shared", "being processed",
    ]
    
    passive_count = sum(1 for p in passive_indicators if p in text_lower)
    passive_density = (passive_count / max(word_count, 1)) * 1000
    
    combined = density + passive_density * 0.5
    
    if combined < 3:
        return 1
    elif combined < 7:
        return 2
    elif combined < 12:
        return 3
    elif combined < 20:
        return 4
    else:
        return 5


def rate_q4_understandability(text, features=None):
    """Q4: Would average college student understand? (1=easily, 5=very hard)"""
    word_count = len(text.split())
    
    # Use Flesch Reading Ease if available
    fre = None
    if features:
        try:
            fre = float(features.get("flesch_reading_ease", 0))
        except (ValueError, TypeError):
            pass
    
    # Compute average sentence length
    n_sentences = count_sentences(text)
    avg_sent_len = word_count / n_sentences
    
    # Count complex words (>3 syllables approximation: words > 8 chars)
    words = text.split()
    complex_words = sum(1 for w in words if len(w) > 8)
    complex_ratio = complex_words / max(word_count, 1)
    
    # Composite score
    score = 0
    
    if fre is not None:
        if fre >= 60:
            score += 1
        elif fre >= 45:
            score += 2
        elif fre >= 30:
            score += 3
        elif fre >= 15:
            score += 4
        else:
            score += 5
    else:
        score += 3  # default middle
    
    # Adjust based on sentence length
    if avg_sent_len > 30:
        score += 1
    elif avg_sent_len < 15:
        score -= 1
    
    # Adjust based on complex word ratio
    if complex_ratio > 0.25:
        score += 1
    elif complex_ratio < 0.1:
        score -= 1
    
    # Clamp
    return max(1, min(5, round(score)))


def auto_rate_policy(company, text, features=None):
    """Auto-rate a policy on all 4 questions."""
    q1 = rate_q1_data_sharing_findability(text)
    q2 = rate_q2_legal_jargon(text)
    q3 = rate_q3_indirectness(text)
    q4 = rate_q4_understandability(text, features)
    return q1, q2, q3, q4


# ---------------------------------------------------------------------------
# STEP 1: Select ~50 Policies (15 easy, 20 medium, 15 hard)
# ---------------------------------------------------------------------------
print("=" * 72)
print("STEP 1 -- Select Sample Policies")
print("=" * 72)

scores_data = load_scores()
features_data = load_features()

# Sort by obfuscation score
sorted_data = sorted(scores_data, key=lambda x: x["obfuscation_score"])

# Remove duplicates (Atlassian products share same policy)
seen_scores = set()
deduped = []
for entry in sorted_data:
    # Keep one representative for duplicate-score companies
    s = entry["obfuscation_score"]
    if s not in seen_scores:
        deduped.append(entry)
        seen_scores.add(s)
    else:
        # Allow if not an Atlassian product
        if entry["company"] not in ["Bitbucket", "Confluence", "Jira", "Trello"]:
            deduped.append(entry)

sorted_data = deduped
N = len(sorted_data)

print(f"\n  Total unique policies: {N}")

# Select: 15 easiest, 20 middle, 15 hardest
easy = sorted_data[:15]
hard = sorted_data[-15:]
mid_start = N // 2 - 10
mid_end = N // 2 + 10
medium = sorted_data[mid_start:mid_end]

# Combine and deduplicate
sample_companies = set()
sample = []
for entry in easy + medium + hard:
    if entry["company"] not in sample_companies:
        sample.append(entry)
        sample_companies.add(entry["company"])

# Sort by score for display
sample.sort(key=lambda x: x["obfuscation_score"])

print(f"  Selected sample: {len(sample)} policies")
print(f"    Easy (bottom 15):  scores {easy[0]['obfuscation_score']:.2f} - {easy[-1]['obfuscation_score']:.2f}")
print(f"    Medium (middle 20): scores {medium[0]['obfuscation_score']:.2f} - {medium[-1]['obfuscation_score']:.2f}")
print(f"    Hard (top 15):     scores {hard[0]['obfuscation_score']:.2f} - {hard[-1]['obfuscation_score']:.2f}")

# Save manual_label_sample.csv
sample_csv = os.path.join(OUT_DIR, "manual_label_sample.csv")
with open(sample_csv, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["company", "obfuscation_score", "difficulty_tier"])
    for entry in sample:
        tier = "Easy" if entry in easy else ("Hard" if entry in hard else "Medium")
        writer.writerow([entry["company"], entry["obfuscation_score"], tier])
print(f"\n  [SAVED] {sample_csv}")


# ---------------------------------------------------------------------------
# STEP 2: Identify 9 Companies for Manual Rating
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 2 -- Select 9 Companies for Manual Human Rating")
print("=" * 72)

# Pick 3 from each tier that are well-known & representative
# Easy tier: pick from low end
manual_easy = [easy[0], easy[7], easy[14]]  # spread across easy range
# Medium tier: pick from middle 
manual_medium = [medium[0], medium[10], medium[19]]  # spread across medium range
# Hard tier: pick from high end
manual_hard = [hard[0], hard[7], hard[14]]  # spread across hard range

manual_9 = manual_easy + manual_medium + manual_hard

print("\n  === 9 COMPANIES FOR YOUR MANUAL RATING ===\n")
print(f"  {'#':<4} {'Category':<10} {'Company':<25} {'Formula Score':<15}")
print(f"  {'─'*4} {'─'*10} {'─'*25} {'─'*15}")

for i, entry in enumerate(manual_9, 1):
    if entry in manual_easy:
        cat = "EASY"
    elif entry in manual_medium:
        cat = "MEDIUM"
    else:
        cat = "HARD"
    print(f"  {i:<4} {cat:<10} {entry['company']:<25} {entry['obfuscation_score']:<15.2f}")

print("\n  ─" * 30)
print("  For each company, please rate Q1-Q4 on a 1-5 scale:")
print("    Q1: How hard to find data-sharing info? (1=very easy, 5=very hard)")
print("    Q2: How much legal jargon? (1=almost none, 5=very high)")
print("    Q3: How indirect is the language? (1=very direct, 5=very indirect)")
print("    Q4: Would avg college student understand? (1=easily, 5=very hard)")


# ---------------------------------------------------------------------------
# STEP 3: Auto-Rate Remaining Policies
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 3 -- Auto-Rating Remaining Policies")
print("=" * 72)

manual_companies = {e["company"] for e in manual_9}
auto_ratings = {}

for entry in sample:
    company = entry["company"]
    if company in manual_companies:
        continue  # Skip manual ones
    
    text = read_policy_text(company)
    if not text:
        print(f"  [SKIP] {company} -- no policy text found")
        continue
    
    feats = features_data.get(company, None)
    q1, q2, q3, q4 = auto_rate_policy(company, text, feats)
    auto_ratings[company] = {"Q1": q1, "Q2": q2, "Q3": q3, "Q4": q4}

print(f"\n  Auto-rated {len(auto_ratings)} policies")
print(f"  Awaiting manual ratings for {len(manual_companies)} policies")


# ---------------------------------------------------------------------------
# STEP 4: Collect Manual Ratings (Hardcoded placeholder - user fills in)
# ---------------------------------------------------------------------------
# >>> USER: Replace these with your actual ratings <<<
MANUAL_RATINGS = {
    "Goodreads":    {"Q1": 3, "Q2": 2, "Q3": 3, "Q4": 2},
    "Barclays":     {"Q1": 2, "Q2": 2, "Q3": 2, "Q4": 2},
    "Splunk":       {"Q1": 3, "Q2": 3, "Q3": 2, "Q4": 3},
    "Fitbit":       {"Q1": 3, "Q2": 3, "Q3": 2, "Q4": 2},
    "Equifax":      {"Q1": 3, "Q2": 4, "Q3": 3, "Q4": 3},
    "Cloudflare":   {"Q1": 2, "Q2": 3, "Q3": 3, "Q4": 3},
    "Citigroup":    {"Q1": 3, "Q2": 3, "Q3": 3, "Q4": 3},
    "Adobe":        {"Q1": 3, "Q2": 3, "Q3": 4, "Q4": 2},
    "Salesforce":   {"Q1": 3, "Q2": 3, "Q3": 3, "Q4": 3},
}

print("\n  Manual ratings loaded for 9 companies:")
for company, r in MANUAL_RATINGS.items():
    print(f"    {company:<20} Q1={r['Q1']} Q2={r['Q2']} Q3={r['Q3']} Q4={r['Q4']}")


# ---------------------------------------------------------------------------
# STEP 5: Merge All Ratings & Compute Human Obfuscation Score
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 5 -- Compute Human Obfuscation Scores")
print("=" * 72)

all_ratings = {}
all_ratings.update(auto_ratings)
all_ratings.update(MANUAL_RATINGS)  # Manual overrides auto

results = []
for entry in sample:
    company = entry["company"]
    if company in all_ratings:
        r = all_ratings[company]
        human_score = (r["Q1"] + r["Q2"] + r["Q3"] + r["Q4"]) / 4
        
        # Classify
        if human_score <= 2:
            human_class = "Easy"
        elif human_score <= 3.5:
            human_class = "Moderate"
        else:
            human_class = "Obfuscated"
        
        results.append({
            "company": company,
            "Q1": r["Q1"],
            "Q2": r["Q2"],
            "Q3": r["Q3"],
            "Q4": r["Q4"],
            "human_obfuscation": round(human_score, 2),
            "human_class": human_class,
            "obfuscation_score": entry["obfuscation_score"],
            "is_manual": company in manual_companies,
        })

# Sort by human obfuscation score
results.sort(key=lambda x: x["human_obfuscation"])

print(f"\n  Total rated: {len(results)}")
print(f"\n  {'Company':<25} {'Q1':>4} {'Q2':>4} {'Q3':>4} {'Q4':>4} {'Human':>7} {'Class':<12} {'Formula':>8} {'Manual':>7}")
print(f"  {'─'*25} {'─'*4} {'─'*4} {'─'*4} {'─'*4} {'─'*7} {'─'*12} {'─'*8} {'─'*7}")

for r in results:
    m = "  ★" if r["is_manual"] else ""
    print(f"  {r['company']:<25} {r['Q1']:>4} {r['Q2']:>4} {r['Q3']:>4} {r['Q4']:>4} "
          f"{r['human_obfuscation']:>7.2f} {r['human_class']:<12} {r['obfuscation_score']:>8.2f}{m}")


# ---------------------------------------------------------------------------
# STEP 6: Save manual_labels.csv
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 6 -- Save Results")
print("=" * 72)

labels_csv = os.path.join(OUT_DIR, "manual_labels.csv")
with open(labels_csv, "w", encoding="utf-8", newline="") as f:
    writer = csv.writer(f)
    writer.writerow(["Company", "Q1", "Q2", "Q3", "Q4", "human_obfuscation", 
                      "human_class", "obfuscation_score", "is_manual"])
    for r in results:
        writer.writerow([
            r["company"], r["Q1"], r["Q2"], r["Q3"], r["Q4"],
            r["human_obfuscation"], r["human_class"], r["obfuscation_score"],
            r["is_manual"]
        ])
print(f"\n  [SAVED] {labels_csv}")


# ---------------------------------------------------------------------------
# STEP 7: Compare Formula Score vs Human Score (Spearman Correlation)
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("STEP 7 -- Correlation Analysis: Formula vs Human")
print("=" * 72)

formula_scores = [r["obfuscation_score"] for r in results]
human_scores = [r["human_obfuscation"] for r in results]

def spearman_corr(x, y):
    """Compute Spearman rank correlation coefficient."""
    n = len(x)
    
    # Rank the data
    def rank_data(data):
        indexed = sorted(enumerate(data), key=lambda t: t[1])
        ranks = [0.0] * n
        i = 0
        while i < n:
            j = i
            while j < n - 1 and indexed[j + 1][1] == indexed[j][1]:
                j += 1
            avg_rank = (i + j) / 2.0 + 1  # 1-based
            for k in range(i, j + 1):
                ranks[indexed[k][0]] = avg_rank
            i = j + 1
        return ranks
    
    rank_x = rank_data(x)
    rank_y = rank_data(y)
    
    # Pearson on ranks
    mean_rx = sum(rank_x) / n
    mean_ry = sum(rank_y) / n
    
    num = sum((rx - mean_rx) * (ry - mean_ry) for rx, ry in zip(rank_x, rank_y))
    den_x = math.sqrt(sum((rx - mean_rx) ** 2 for rx in rank_x))
    den_y = math.sqrt(sum((ry - mean_ry) ** 2 for ry in rank_y))
    
    if den_x == 0 or den_y == 0:
        return 0.0
    
    return num / (den_x * den_y)


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


spearman = spearman_corr(formula_scores, human_scores)
pearson = pearson_corr(formula_scores, human_scores)

print(f"\n  Spearman Rank Correlation:  {spearman:.4f}")
print(f"  Pearson Correlation:       {pearson:.4f}")
print(f"\n  Number of policies compared: {len(results)}")

# Interpret
if abs(spearman) > 0.8:
    verdict = "EXCELLENT - Very strong alignment"
elif abs(spearman) > 0.6:
    verdict = "GOOD - Reasonably strong alignment"
elif abs(spearman) > 0.4:
    verdict = "MODERATE - Some alignment, room for improvement"
elif abs(spearman) > 0.2:
    verdict = "WEAK - Limited alignment"
else:
    verdict = "POOR - No meaningful alignment"

print(f"\n  Verdict: {verdict}")
print(f"  {'✓ PASS' if abs(spearman) > 0.6 else '✗ NEEDS REVIEW'}: Threshold is corr > 0.6")

# Class distribution
print(f"\n  Human Class Distribution:")
class_counts = {"Easy": 0, "Moderate": 0, "Obfuscated": 0}
for r in results:
    class_counts[r["human_class"]] += 1
for cls in ["Easy", "Moderate", "Obfuscated"]:
    pct = class_counts[cls] / len(results) * 100
    bar = "█" * class_counts[cls]
    print(f"    {cls:<12} {class_counts[cls]:>3}  ({pct:5.1f}%)  {bar}")

# Class agreement analysis
print(f"\n  Class Agreement (Formula label vs Human label):")

# Get formula labels from the existing dataset
dataset_csv = os.path.join(OUT_DIR, "obfuscation_dataset.csv")
formula_labels = {}
if os.path.exists(dataset_csv):
    with open(dataset_csv, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            if row["company"].strip():
                formula_labels[row["company"].strip()] = row.get("label", "")

agree = 0
disagree = 0
disagreements = []
for r in results:
    fl = formula_labels.get(r["company"], "")
    hl = r["human_class"]
    if fl == hl:
        agree += 1
    elif fl:
        disagree += 1
        disagreements.append((r["company"], fl, hl, r["obfuscation_score"], r["human_obfuscation"]))

if agree + disagree > 0:
    agreement_rate = agree / (agree + disagree) * 100
    print(f"    Agreement rate: {agree}/{agree + disagree} ({agreement_rate:.1f}%)")
    
    if disagreements:
        print(f"\n    Disagreements:")
        print(f"    {'Company':<25} {'Formula':<12} {'Human':<12} {'F-Score':>8} {'H-Score':>8}")
        print(f"    {'─'*25} {'─'*12} {'─'*12} {'─'*8} {'─'*8}")
        for comp, fl, hl, fs, hs in disagreements:
            print(f"    {comp:<25} {fl:<12} {hl:<12} {fs:>8.2f} {hs:>8.2f}")


# ---------------------------------------------------------------------------
# Generate Scatter Plot (Formula vs Human)
# ---------------------------------------------------------------------------
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
    
    # Color by human class
    colors_map = {"Easy": "#00e676", "Moderate": "#ffab40", "Obfuscated": "#ff5252"}
    
    for r in results:
        color = colors_map.get(r["human_class"], "#888")
        marker = "★" if r["is_manual"] else "o"
        size = 120 if r["is_manual"] else 60
        edgecolor = "#ffffff" if r["is_manual"] else color
        ax.scatter(r["obfuscation_score"], r["human_obfuscation"], 
                  c=color, s=size, edgecolors=edgecolor, linewidths=1.5, 
                  alpha=0.85, zorder=5)
    
    # Labels for manual ones
    for r in results:
        if r["is_manual"]:
            ax.annotate(r["company"], (r["obfuscation_score"], r["human_obfuscation"]),
                       textcoords="offset points", xytext=(8, 5),
                       fontsize=8, color="#ffffff", alpha=0.9)
    
    # Trend line
    if len(formula_scores) > 2:
        # Simple linear regression
        n = len(formula_scores)
        mx = sum(formula_scores) / n
        my = sum(human_scores) / n
        ss_xy = sum((x - mx) * (y - my) for x, y in zip(formula_scores, human_scores))
        ss_xx = sum((x - mx) ** 2 for x in formula_scores)
        if ss_xx > 0:
            slope = ss_xy / ss_xx
            intercept = my - slope * mx
            x_range = [min(formula_scores), max(formula_scores)]
            y_range = [slope * x + intercept for x in x_range]
            ax.plot(x_range, y_range, '--', color='#00d2ff', alpha=0.7, linewidth=2,
                   label=f'Trend (r={pearson:.3f})')
    
    ax.set_xlabel("Formula-Based Obfuscation Score", fontsize=13, fontweight="bold")
    ax.set_ylabel("Human Obfuscation Score (1-5)", fontsize=13, fontweight="bold")
    ax.set_title(f"Formula vs Human Obfuscation Scores\nSpearman ρ = {spearman:.4f}  |  Pearson r = {pearson:.4f}",
                fontsize=14, fontweight="bold", color="#00d2ff", pad=15)
    
    # Legend
    from matplotlib.lines import Line2D
    legend_elements = [
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#00e676', markersize=10, label='Easy'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#ffab40', markersize=10, label='Moderate'),
        Line2D([0], [0], marker='o', color='w', markerfacecolor='#ff5252', markersize=10, label='Obfuscated'),
        Line2D([0], [0], marker='*', color='w', markerfacecolor='#ffffff', markersize=12, label='Manual ★'),
    ]
    ax.legend(handles=legend_elements, loc='upper left', fontsize=10,
             facecolor='#16213e', edgecolor='#444', labelcolor='#e0e0e0')
    
    ax.grid(True, alpha=0.15, color='#888')
    
    fig.tight_layout()
    scatter_path = os.path.join(OUT_DIR, "formula_vs_human_scatter.png")
    fig.savefig(scatter_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(f"\n  [SAVED] {scatter_path}")


print("\n" + "=" * 72)
print("PIPELINE COMPLETE")
print("=" * 72)
print(f"\nOutput files:")
print(f"  1. {sample_csv}")
print(f"  2. {labels_csv}")
if HAS_MPL:
    print(f"  3. {os.path.join(OUT_DIR, 'formula_vs_human_scatter.png')}")
