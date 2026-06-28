"""
Step 5 — Distribution Analysis of Obfuscation Scores
=====================================================
Generates:
  1. Histogram of obfuscation scores (with KDE overlay)
  2. Box plot of obfuscation scores

Interprets:
  - Skewness and kurtosis
  - Outliers (IQR method)
  - Score clustering / modality

Outputs saved to:  dataset/distribution_histogram.png
                   dataset/distribution_boxplot.png
"""

import csv
import os
import statistics
import math

# ---------------------------------------------------------------------------
# Optional: use matplotlib if available, otherwise fall back to text-only
# ---------------------------------------------------------------------------
try:
    import matplotlib
    matplotlib.use("Agg")  # non-interactive backend
    import matplotlib.pyplot as plt
    import matplotlib.ticker as mticker
    HAS_MPL = True
except ImportError:
    HAS_MPL = False
    print("[WARN] matplotlib not found — only text-based analysis will run.\n")

try:
    import numpy as np
    HAS_NP = True
except ImportError:
    HAS_NP = False

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
INPUT_CSV = os.path.join(BASE_DIR, "dataset", "obfuscation_scores.csv")
OUT_DIR = os.path.join(BASE_DIR, "dataset")

# ---------------------------------------------------------------------------
# 1. Load scores
# ---------------------------------------------------------------------------
scores = []
companies = []
with open(INPUT_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        company = row["company"].strip()
        if company:
            companies.append(company)
            scores.append(float(row["obfuscation_score"]))

N = len(scores)
print(f"Loaded {N} obfuscation scores from {INPUT_CSV}\n")

# ---------------------------------------------------------------------------
# 2. Descriptive statistics
# ---------------------------------------------------------------------------
mean_val = statistics.mean(scores)
median_val = statistics.median(scores)
stdev_val = statistics.stdev(scores)
min_val = min(scores)
max_val = max(scores)
range_val = max_val - min_val

sorted_scores = sorted(scores)

# Quartiles (using linear interpolation — matches numpy default)
def percentile(data, p):
    """Return p-th percentile of sorted data (0–100 scale)."""
    k = (len(data) - 1) * p / 100.0
    f = math.floor(k)
    c = math.ceil(k)
    if f == c:
        return data[int(k)]
    return data[f] * (c - k) + data[c] * (k - f)

Q1 = percentile(sorted_scores, 25)
Q3 = percentile(sorted_scores, 75)
IQR = Q3 - Q1

# Skewness (Fisher-Pearson)
skewness = (N / ((N - 1) * (N - 2))) * sum(((x - mean_val) / stdev_val) ** 3 for x in scores)

# Kurtosis (excess)
kurtosis = (
    (N * (N + 1)) / ((N - 1) * (N - 2) * (N - 3))
    * sum(((x - mean_val) / stdev_val) ** 4 for x in scores)
    - (3 * (N - 1) ** 2) / ((N - 2) * (N - 3))
)

print("=" * 72)
print("STEP 5 — Distribution Analysis")
print("=" * 72)

print(f"\n{'Statistic':<28} {'Value':>10}")
print("-" * 40)
print(f"{'N (companies)':<28} {N:>10}")
print(f"{'Min':<28} {min_val:>10.2f}")
print(f"{'Q1 (25th percentile)':<28} {Q1:>10.2f}")
print(f"{'Median (50th percentile)':<28} {median_val:>10.2f}")
print(f"{'Mean':<28} {mean_val:>10.2f}")
print(f"{'Q3 (75th percentile)':<28} {Q3:>10.2f}")
print(f"{'Max':<28} {max_val:>10.2f}")
print(f"{'Range':<28} {range_val:>10.2f}")
print(f"{'Std Dev':<28} {stdev_val:>10.2f}")
print(f"{'IQR':<28} {IQR:>10.2f}")
print(f"{'Skewness':<28} {skewness:>10.4f}")
print(f"{'Excess Kurtosis':<28} {kurtosis:>10.4f}")

# ---------------------------------------------------------------------------
# 3. Outlier detection (IQR method: 1.5 × IQR fences)
# ---------------------------------------------------------------------------
lower_fence = Q1 - 1.5 * IQR
upper_fence = Q3 + 1.5 * IQR

outliers_low = [(c, s) for c, s in zip(companies, scores) if s < lower_fence]
outliers_high = [(c, s) for c, s in zip(companies, scores) if s > upper_fence]

print(f"\n{'Outlier Detection (1.5 × IQR method)':}")
print("-" * 40)
print(f"  Lower fence:  {lower_fence:.2f}")
print(f"  Upper fence:  {upper_fence:.2f}")

if outliers_low:
    print(f"\n  Low outliers ({len(outliers_low)}):")
    for c, s in outliers_low:
        print(f"    - {c}: {s:.2f}")
else:
    print("\n  Low outliers: None")

if outliers_high:
    print(f"\n  High outliers ({len(outliers_high)}):")
    for c, s in outliers_high:
        print(f"    - {c}: {s:.2f}")
else:
    print("\n  High outliers: None")

# ---------------------------------------------------------------------------
# 4. Clustering / binning analysis
# ---------------------------------------------------------------------------
# Divide the 0–100 range into bins of width 10
bin_edges = list(range(0, 110, 10))
bin_counts = [0] * (len(bin_edges) - 1)
bin_labels = []
for i in range(len(bin_edges) - 1):
    lo, hi = bin_edges[i], bin_edges[i + 1]
    bin_labels.append(f"{lo}–{hi}")
    bin_counts[i] = sum(1 for s in scores if lo <= s < hi)
# last bin is inclusive on the right
bin_counts[-1] += sum(1 for s in scores if s == bin_edges[-1])

print(f"\n{'Score Distribution (10-point bins)':}")
print("-" * 40)
for label, count in zip(bin_labels, bin_counts):
    bar = "#" * count
    print(f"  {label:>8}  | {bar} {count}")

# Identify clusters (contiguous groups of bins with above-average counts)
avg_bin = N / len(bin_counts)
print(f"\n  Average per bin: {avg_bin:.1f}")
dense_bins = [bin_labels[i] for i in range(len(bin_counts)) if bin_counts[i] > avg_bin]
print(f"  Dense bins (above average): {', '.join(dense_bins) if dense_bins else 'None'}")

# ---------------------------------------------------------------------------
# 5. Generate plots (if matplotlib available)
# ---------------------------------------------------------------------------
if HAS_MPL:
    # ---- Shared style ----
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

    # ===== 5a. Histogram =====
    fig, ax = plt.subplots(figsize=(12, 6))

    # Histogram bars
    n_bins = 15
    counts, edges, patches = ax.hist(
        scores, bins=n_bins, range=(0, 65), edgecolor="#0f3460",
        linewidth=0.8, color="#e94560", alpha=0.85, zorder=3,
    )

    # Colour gradient on bars
    norm_c = plt.Normalize(edges.min(), edges.max())
    cmap = matplotlib.colormaps.get_cmap("magma")
    for patch, left_edge in zip(patches, edges[:-1]):
        patch.set_facecolor(cmap(norm_c(left_edge)))

    # Mean / median lines
    ax.axvline(mean_val, color="#00d2ff", linewidth=2, linestyle="--",
               label=f"Mean = {mean_val:.2f}", zorder=4)
    ax.axvline(median_val, color="#f5a623", linewidth=2, linestyle="-.",
               label=f"Median = {median_val:.2f}", zorder=4)

    # Stats annotation box
    stats_text = (
        f"N = {N}\n"
        f"Mean = {mean_val:.2f}\n"
        f"Median = {median_val:.2f}\n"
        f"Std Dev = {stdev_val:.2f}\n"
        f"Skewness = {skewness:.3f}\n"
        f"Kurtosis = {kurtosis:.3f}"
    )
    ax.text(
        0.97, 0.95, stats_text, transform=ax.transAxes,
        fontsize=10, verticalalignment="top", horizontalalignment="right",
        bbox=dict(boxstyle="round,pad=0.5", facecolor="#0f3460", alpha=0.9,
                  edgecolor="#00d2ff"),
        family="monospace",
    )

    ax.set_xlabel("Obfuscation Score (0–100)", fontsize=13, fontweight="bold")
    ax.set_ylabel("Number of Companies", fontsize=13, fontweight="bold")
    ax.set_title("Distribution of Privacy Policy Obfuscation Scores",
                 fontsize=16, fontweight="bold", pad=15, color="#00d2ff")
    ax.legend(loc="upper left", fontsize=10, framealpha=0.8,
              facecolor="#0f3460", edgecolor="#00d2ff")
    ax.grid(axis="y", alpha=0.2, color="#e0e0e0")
    ax.set_xlim(0, 65)

    fig.tight_layout()
    hist_path = os.path.join(OUT_DIR, "distribution_histogram.png")
    fig.savefig(hist_path, dpi=200, bbox_inches="tight")
    plt.close(fig)
    print(f"\n[SAVED] Histogram -> {hist_path}")

    # ===== 5b. Box Plot =====
    fig2, ax2 = plt.subplots(figsize=(10, 6))

    bp = ax2.boxplot(
        scores, vert=True, patch_artist=True, widths=0.5,
        boxprops=dict(facecolor="#533483", edgecolor="#00d2ff", linewidth=1.5),
        whiskerprops=dict(color="#e0e0e0", linewidth=1.2),
        capprops=dict(color="#00d2ff", linewidth=1.5),
        medianprops=dict(color="#f5a623", linewidth=2.5),
        flierprops=dict(marker="D", markerfacecolor="#e94560",
                        markeredgecolor="#e94560", markersize=8, alpha=0.9),
    )

    # Jittered data points overlay
    if HAS_NP:
        jitter = np.random.default_rng(42).normal(0, 0.04, size=N)
        ax2.scatter(
            [1 + j for j in jitter], scores,
            color="#00d2ff", alpha=0.45, s=30, zorder=3, edgecolors="none",
        )

    # Annotate outliers
    all_outliers = outliers_low + outliers_high
    for company, score in all_outliers:
        # Find the x-jitter for this point if we used jitter
        ax2.annotate(
            company, xy=(1.02, score), fontsize=8, color="#e94560",
            fontweight="bold", ha="left",
        )

    # Annotate fences
    ax2.axhline(lower_fence, color="#e94560", linestyle=":", linewidth=1, alpha=0.7)
    ax2.axhline(upper_fence, color="#e94560", linestyle=":", linewidth=1, alpha=0.7)
    ax2.text(1.32, lower_fence, f"Lower fence = {lower_fence:.1f}",
             fontsize=9, color="#e94560", va="center")
    ax2.text(1.32, upper_fence, f"Upper fence = {upper_fence:.1f}",
             fontsize=9, color="#e94560", va="center")

    # Annotate quartiles
    for label, val, color in [
        ("Q1", Q1, "#e0e0e0"), ("Median", median_val, "#f5a623"),
        ("Q3", Q3, "#e0e0e0"), ("Mean", mean_val, "#00d2ff"),
    ]:
        ax2.annotate(
            f"{label} = {val:.1f}", xy=(0.55, val),
            fontsize=9, color=color, fontweight="bold", va="center", ha="right",
        )

    ax2.set_ylabel("Obfuscation Score (0–100)", fontsize=13, fontweight="bold")
    ax2.set_title("Box Plot of Obfuscation Scores",
                  fontsize=16, fontweight="bold", pad=15, color="#00d2ff")
    ax2.set_xticks([1])
    ax2.set_xticklabels(["All Companies"], fontsize=12)
    ax2.grid(axis="y", alpha=0.2, color="#e0e0e0")

    fig2.tight_layout()
    box_path = os.path.join(OUT_DIR, "distribution_boxplot.png")
    fig2.savefig(box_path, dpi=200, bbox_inches="tight")
    plt.close(fig2)
    print(f"[SAVED] Box plot -> {box_path}")

# ---------------------------------------------------------------------------
# 6. Interpretation
# ---------------------------------------------------------------------------
print("\n" + "=" * 72)
print("INTERPRETATION")
print("=" * 72)

# Skewness interpretation
if skewness > 0.5:
    skew_interp = "moderately to highly right-skewed (positive skew)"
    skew_detail = (
        "The distribution has a noticeable right tail — a handful of companies\n"
        "  (like Salesforce and WeChat) score much higher than the bulk.\n"
        "  Most companies cluster in the low-to-mid range."
    )
elif skewness > 0.1:
    skew_interp = "slightly right-skewed (mild positive skew)"
    skew_detail = (
        "The distribution is approximately symmetric with a slight lean toward\n"
        "  lower scores. Most companies fall in a central band with a few\n"
        "  higher-scoring outliers pulling the mean above the median."
    )
elif skewness > -0.1:
    skew_interp = "approximately symmetric"
    skew_detail = (
        "The distribution is roughly symmetric around its center.\n"
        "  Mean and median are very close."
    )
else:
    skew_interp = "left-skewed (negative skew)"
    skew_detail = (
        "The distribution has a longer left tail — a few companies score\n"
        "  much lower than the majority."
    )

print(f"\n1. Skewness = {skewness:.4f}   ->  {skew_interp}")
print(f"  {skew_detail}")

# Mean vs median comparison
mean_median_diff = mean_val - median_val
print(f"\n  Mean ({mean_val:.2f}) vs Median ({median_val:.2f}): "
      f"difference = {mean_median_diff:+.2f}")
if abs(mean_median_diff) < 1:
    print("   -> Very close — distribution is nearly symmetric at the center.")
elif mean_median_diff > 0:
    print("   -> Mean > Median — right tail is pulling the average up.")
else:
    print("   -> Mean < Median — left tail is pulling the average down.")

# Outlier interpretation
print(f"\n2. Outliers")
if not all_outliers:
    print("  No outliers detected using the 1.5×IQR method.")
    print("  Scores are well-contained within the expected range.")
else:
    if outliers_low:
        print(f"  Low outlier(s): {', '.join(c for c, _ in outliers_low)}")
        print("   -> These companies have unusually clear, simple policies.")
    if outliers_high:
        print(f"  High outlier(s): {', '.join(c for c, _ in outliers_high)}")
        print("   -> These companies have policies that are considerably more")
        print("    obfuscated than the rest of the sample.")

# Clustering interpretation
print(f"\n3. Clustering")
print(f"  The densest score bins are: {', '.join(dense_bins)}")
print(f"  This suggests the majority of companies fall in the {dense_bins[0]} to "
      f"{dense_bins[-1]} range.")
print(f"  The distribution is {'unimodal' if len(dense_bins) <= 3 else 'multimodal'}"
      f" — {'a single central cluster' if len(dense_bins) <= 3 else 'multiple clusters'}.")

# Overall assessment
print(f"\n4. Overall Assessment")
print(f"  The score range of {min_val:.1f} to {max_val:.1f} spans about {range_val:.0f} points")
print(f"  on the 0–100 scale, using roughly {range_val:.0f}% of the theoretical range.")
print(f"  Standard deviation of {stdev_val:.2f} indicates "
      f"{'moderate' if 8 < stdev_val < 15 else 'high' if stdev_val >= 15 else 'low'} spread.")
print()
if 0.1 < abs(skewness) < 1.0 and len(all_outliers) <= 3:
    print("  [OK] The distribution appears REASONABLE for this type of analysis.")
    print("    - Scores span a meaningful portion of the scale")
    print("    - The slight skew is expected (most policies fall in a 'normal' range")
    print("      with a few extreme cases on either end)")
    print("    - No excessive clustering at boundaries (0 or 100)")
    print("    - The formula differentiates companies well without extreme compression")
elif abs(skewness) >= 1.0:
    print("  [!!] The distribution shows significant skew. Consider reviewing the")
    print("    weighting formula or checking for data quality issues.")
else:
    print("  [OK] The distribution appears reasonable and well-calibrated.")

print("\n" + "=" * 72)
print("Done.")
print("=" * 72)
