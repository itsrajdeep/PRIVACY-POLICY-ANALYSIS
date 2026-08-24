"""
Privacy Policy Obfuscation Analyzer — Flask Backend
=====================================================
Phase 2: REST API serving ML predictions.

Endpoints:
    GET  /api/health              Health check
    POST /api/analyze/text        Analyze pasted policy text
    POST /api/analyze/url         Analyze policy from a URL
    GET  /api/dataset/stats       Summary stats for the 81-company dataset
    GET  /api/dataset/companies   Full company list with scores & labels
    GET  /api/dataset/company/<n> Single company detail
"""

import csv
import math
import os
import re
import sys
import warnings

warnings.filterwarnings("ignore")

from flask import Flask, jsonify, request
from flask_cors import CORS

import joblib
import numpy as np

# ---------------------------------------------------------------------------
# Optional: trafilatura for URL extraction
# ---------------------------------------------------------------------------
try:
    import trafilatura
    from trafilatura.settings import use_config
    HAS_TRAFILATURA = True
except ImportError:
    HAS_TRAFILATURA = False

# ---------------------------------------------------------------------------
# requests + BeautifulSoup for fallback URL extraction
# ---------------------------------------------------------------------------
try:
    import requests
    from bs4 import BeautifulSoup
    HAS_REQUESTS = True
except ImportError:
    HAS_REQUESTS = False

import urllib.request
import urllib.error
from html.parser import HTMLParser

# ---------------------------------------------------------------------------
# Optional: textstat for readability scoring
# ---------------------------------------------------------------------------
try:
    import textstat
    HAS_TEXTSTAT = True
except ImportError:
    HAS_TEXTSTAT = False

# ===================================================================
# Configuration
# ===================================================================
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
PROJECT_DIR = os.path.dirname(BASE_DIR)

MODEL_DIR = os.path.join(BASE_DIR, "model")
MODEL_PATH = os.path.join(MODEL_DIR, "model.pkl")
SCALER_PATH = os.path.join(MODEL_DIR, "scaler.pkl")
ENCODER_PATH = os.path.join(MODEL_DIR, "label_encoder.pkl")
METADATA_PATH = os.path.join(MODEL_DIR, "metadata.pkl")

DATASET_CSV = os.path.join(PROJECT_DIR, "dataset", "obfuscation_dataset.csv")
FEATURES_CSV = os.path.join(PROJECT_DIR, "dataset", "policy_features.csv")
POLICIES_CSV = os.path.join(PROJECT_DIR, "dataset", "privacy_policies.csv")
LABELS_CSV = os.path.join(PROJECT_DIR, "dataset", "manual_labels.csv")

# Legal terms (must match generate_features.py exactly)
LEGAL_TERMS = [
    "affiliate", "third party", "arbitration", "indemnify", "consent",
    "retention", "processor", "controller", "jurisdiction", "liability",
]

# Normalization ranges from the training data
# These are the min/max values used in compute_obfuscation_score.py
# We'll compute them from the dataset at startup
NORM_RANGES = {}

# Obfuscation score weights (from compute_obfuscation_score.py)
OBFUSCATION_WEIGHTS = {
    "flesch_reading_ease": 0.35,
    "avg_sentence_length": 0.25,
    "legal_term_count": 0.20,
    "word_count": 0.10,
    "unique_words": 0.10,
}

INVERT_FEATURES = {"flesch_reading_ease"}

# Feature columns (must match save_model.py exactly)
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


# ===================================================================
# App Setup
# ===================================================================
app = Flask(__name__)
CORS(app, origins=[
    "https://itsrajdeep.github.io",   # GitHub Pages
    "http://localhost:5173",           # Local Vite dev server
    "http://localhost:5000",           # Local Flask dev
    "http://127.0.0.1:5173",
])

# ===================================================================
# Load Model & Data at Startup
# ===================================================================
print("=" * 60)
print("PHASE 2: FLASK BACKEND — Loading resources...")
print("=" * 60)

# 1. Load ML model artifacts
model = joblib.load(MODEL_PATH)
scaler = joblib.load(SCALER_PATH)
label_encoder = joblib.load(ENCODER_PATH)
metadata = joblib.load(METADATA_PATH)

print(f"  [OK] Model loaded: {metadata['model_name']}")
print(f"       Features: {len(metadata['features'])}")
print(f"       Classes: {metadata['classes']}")
print(f"       CV F1: {metadata['cv_f1_weighted']:.4f}")

# 2. Load dataset for stats & company lookup
dataset = []
with open(DATASET_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row["company"].strip():
            dataset.append(row)

print(f"  [OK] Dataset loaded: {len(dataset)} companies")

# 3. Load raw features to compute normalization ranges
features_data = {}
with open(FEATURES_CSV, "r", encoding="utf-8") as f:
    reader = csv.DictReader(f)
    for row in reader:
        if row["company"].strip():
            features_data[row["company"].strip()] = row

# Compute normalization ranges from the training data
SELECTED_FOR_NORM = [
    "word_count", "avg_sentence_length", "unique_words",
    "flesch_reading_ease", "legal_term_count",
]

for feat in SELECTED_FOR_NORM:
    values = [float(features_data[c][feat]) for c in features_data]
    NORM_RANGES[feat] = {"min": min(values), "max": max(values)}

print(f"  [OK] Normalization ranges computed for {len(NORM_RANGES)} features")

# 4. Load manual labels if available
manual_labels = {}
if os.path.exists(LABELS_CSV):
    with open(LABELS_CSV, "r", encoding="utf-8") as f:
        reader = csv.DictReader(f)
        for row in reader:
            company = row["Company"].strip()
            if company:
                manual_labels[company] = {
                    "human_class": row["human_class"],
                    "human_obfuscation": float(row["human_obfuscation"]),
                    "Q1": int(row["Q1"]),
                    "Q2": int(row["Q2"]),
                    "Q3": int(row["Q3"]),
                    "Q4": int(row["Q4"]),
                    "is_manual": row["is_manual"] == "True",
                }
    print(f"  [OK] Manual labels loaded: {len(manual_labels)} companies")

print("=" * 60)
print("Backend ready.\n")


# ===================================================================
# Helper Functions
# ===================================================================
def extract_features_from_text(text):
    """
    Extract the same features used in the training pipeline from raw text.

    Returns a dict with all RAW_FEATURES keys.
    """
    if not text or len(text.strip()) < 10:
        return None

    words = text.split()
    word_count = len(words)

    if word_count < 50:
        return None  # Too short to be meaningful

    # Sentence splitting (same simple heuristic as process_policies.py)
    sentences = re.split(r'[.!?]+', text)
    sentences = [s.strip() for s in sentences if s.strip()]
    sentence_count = max(len(sentences), 1)

    avg_sentence_length = word_count / sentence_count
    char_count = len(text)

    text_lower = text.lower()
    unique_words = len(set(text_lower.split()))

    # Readability scores
    if HAS_TEXTSTAT:
        flesch_reading_ease = textstat.flesch_reading_ease(text)
        flesch_kincaid_grade = textstat.flesch_kincaid_grade(text)
    else:
        # Rough Flesch approximation if textstat not available
        total_syllables = sum(_count_syllables(w) for w in words)
        flesch_reading_ease = (
            206.835
            - 1.015 * (word_count / sentence_count)
            - 84.6 * (total_syllables / word_count)
        )
        flesch_kincaid_grade = (
            0.39 * (word_count / sentence_count)
            + 11.8 * (total_syllables / word_count)
            - 15.59
        )

    # Legal term count
    legal_term_count = 0
    for term in LEGAL_TERMS:
        legal_term_count += len(
            re.findall(r'\b' + re.escape(term) + r'\b', text_lower)
        )

    return {
        "word_count": word_count,
        "sentence_count": sentence_count,
        "avg_sentence_length": round(avg_sentence_length, 6),
        "char_count": char_count,
        "unique_words": unique_words,
        "flesch_reading_ease": round(flesch_reading_ease, 6),
        "flesch_kincaid_grade": round(flesch_kincaid_grade, 6),
        "legal_term_count": legal_term_count,
    }


def _count_syllables(word):
    """Rough syllable count for Flesch fallback."""
    word = word.lower().strip(".,!?;:'\"")
    if not word:
        return 1
    count = 0
    vowels = "aeiouy"
    prev_vowel = False
    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_vowel:
            count += 1
        prev_vowel = is_vowel
    if word.endswith("e") and count > 1:
        count -= 1
    return max(count, 1)


def min_max_normalize(value, f_min, f_max):
    """Scale value to [0, 1]."""
    if f_max == f_min:
        return 0.0
    normed = (value - f_min) / (f_max - f_min)
    # Clamp to [0, 1] for out-of-range inputs
    return max(0.0, min(1.0, normed))


def compute_normalized_features(raw_feat):
    """
    Given raw feature dict, compute the 5 normalized features
    and the formula-based obfuscation score.
    """
    norm = {}
    for feat in SELECTED_FOR_NORM:
        f_min = NORM_RANGES[feat]["min"]
        f_max = NORM_RANGES[feat]["max"]
        normed = min_max_normalize(float(raw_feat[feat]), f_min, f_max)
        if feat in INVERT_FEATURES:
            normed = 1.0 - normed
        norm[f"norm_{feat}"] = round(normed, 6)

    # Compute obfuscation score (weighted sum × 100)
    score_raw = 0.0
    for feat, weight in OBFUSCATION_WEIGHTS.items():
        score_raw += weight * norm[f"norm_{feat}"]

    norm["score_raw"] = round(score_raw, 6)
    norm["obfuscation_score"] = round(score_raw * 100, 2)

    return norm


def predict_class(raw_feat, norm_feat):
    """
    Run the ML model to predict the obfuscation class.

    Returns dict with predicted class, probabilities, and confidence.
    """
    # Build feature vector in exact order expected by model
    feature_vector = []
    for f in RAW_FEATURES:
        feature_vector.append(float(raw_feat[f]))
    for f in NORM_FEATURES:
        feature_vector.append(float(norm_feat.get(f, 0.0)))

    X = np.array([feature_vector])
    X_scaled = scaler.transform(X)

    pred_encoded = model.predict(X_scaled)
    pred_label = label_encoder.inverse_transform(pred_encoded)[0]

    proba = model.predict_proba(X_scaled)[0]
    proba_dict = {
        cls: round(float(p), 4)
        for cls, p in zip(CLASS_ORDER, proba)
    }

    confidence = round(float(max(proba)) * 100, 1)

    return {
        "predicted_class": pred_label,
        "probabilities": proba_dict,
        "confidence": confidence,
    }


def build_analysis_response(text, source="text"):
    """
    Full analysis pipeline: extract features → normalize → predict.
    Returns the complete API response dict.
    """
    raw_feat = extract_features_from_text(text)
    if raw_feat is None:
        return {
            "error": "Text is too short for meaningful analysis. "
                     "Please provide at least 50 words of policy text.",
            "success": False,
        }

    norm_feat = compute_normalized_features(raw_feat)
    prediction = predict_class(raw_feat, norm_feat)

    # Determine label from formula score (same logic as steps_6_to_9.py)
    formula_score = norm_feat["obfuscation_score"]

    # Readability interpretation
    fre = raw_feat["flesch_reading_ease"]
    if fre >= 60:
        readability_level = "Standard / Easy"
    elif fre >= 30:
        readability_level = "Difficult"
    else:
        readability_level = "Very Confusing"

    return {
        "success": True,
        "source": source,
        "features": {
            "word_count": raw_feat["word_count"],
            "sentence_count": raw_feat["sentence_count"],
            "avg_sentence_length": raw_feat["avg_sentence_length"],
            "char_count": raw_feat["char_count"],
            "unique_words": raw_feat["unique_words"],
            "flesch_reading_ease": raw_feat["flesch_reading_ease"],
            "flesch_kincaid_grade": raw_feat["flesch_kincaid_grade"],
            "legal_term_count": raw_feat["legal_term_count"],
        },
        "normalized_features": {
            k: v for k, v in norm_feat.items()
            if k.startswith("norm_")
        },
        "obfuscation_score": formula_score,
        "readability_level": readability_level,
        "prediction": prediction,
        "model_info": {
            "model_name": metadata["model_name"],
            "training_samples": metadata["n_training_samples"],
            "cv_f1_weighted": round(metadata["cv_f1_weighted"], 4),
        },
    }


# ===================================================================
# API Routes
# ===================================================================

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint."""
    return jsonify({
        "status": "ok",
        "model": metadata["model_name"],
        "dataset_size": len(dataset),
        "features": len(ALL_FEATURES),
        "trafilatura_available": HAS_TRAFILATURA,
        "textstat_available": HAS_TEXTSTAT,
    })


@app.route("/api/analyze/text", methods=["POST"])
def analyze_text():
    """
    Analyze pasted privacy policy text.

    Request JSON:
        { "text": "Privacy policy full text here..." }

    Returns full analysis with features, scores, and ML prediction.
    """
    data = request.get_json(silent=True)
    if not data or "text" not in data:
        return jsonify({
            "error": "Missing 'text' field in request body.",
            "success": False,
        }), 400

    text = data["text"].strip()
    if not text:
        return jsonify({
            "error": "Empty text provided.",
            "success": False,
        }), 400

    result = build_analysis_response(text, source="pasted_text")
    status = 200 if result.get("success") else 400
    return jsonify(result), status


# ---------------------------------------------------------------------------
# JS-rendered domain detection
# ---------------------------------------------------------------------------
JS_HEAVY_DOMAINS = [
    "facebook.com", "fb.com",
    "instagram.com",
    "twitter.com", "x.com",
    "tiktok.com",
    "linkedin.com",
    "snapchat.com",
    "reddit.com",
    "pinterest.com",
    "youtube.com",
    "google.com",
    "apple.com",
]

# Browser-like headers to defeat basic bot detection
_HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/125.0.0.0 Safari/537.36"
    ),
    "Accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8",
    "Accept-Language": "en-US,en;q=0.9",
    "Accept-Encoding": "gzip, deflate, br",
    "DNT": "1",
    "Connection": "keep-alive",
    "Upgrade-Insecure-Requests": "1",
    "Cache-Control": "max-age=0",
    "Sec-Fetch-Dest": "document",
    "Sec-Fetch-Mode": "navigate",
    "Sec-Fetch-Site": "none",
    "Sec-Fetch-User": "?1",
}


class _TextExtractParser(HTMLParser):
    """Minimal HTML → plain text parser used as last-resort fallback."""
    def __init__(self):
        super().__init__()
        self._skip = False
        self._skip_tags = {"script", "style", "noscript", "head", "nav", "footer", "aside"}
        self._parts = []

    def handle_starttag(self, tag, attrs):
        if tag in self._skip_tags:
            self._skip = True

    def handle_endtag(self, tag):
        if tag in self._skip_tags:
            self._skip = False
        if tag in {"p", "div", "li", "h1", "h2", "h3", "br", "tr"}:
            self._parts.append(" ")

    def handle_data(self, data):
        if not self._skip:
            stripped = data.strip()
            if stripped:
                self._parts.append(stripped)

    def get_text(self):
        return " ".join(self._parts)


def _is_js_heavy(url):
    """Return True if the URL belongs to a known JS-rendered domain."""
    url_lower = url.lower()
    return any(domain in url_lower for domain in JS_HEAVY_DOMAINS)


def _clean_extracted_text(raw):
    """Normalise whitespace and remove boilerplate-length short texts."""
    if not raw:
        return None
    # Collapse runs of whitespace / newlines
    text = re.sub(r"[ \t]+", " ", raw)
    text = re.sub(r"\n{3,}", "\n\n", text).strip()
    return text if len(text.split()) >= 50 else None


def fetch_url_text(url):
    """
    Multi-strategy URL text extraction.

    Strategy 1 — trafilatura (best quality, handles many sites)
    Strategy 2 — requests + BeautifulSoup (bypasses some bot blocks)
    Strategy 3 — urllib fallback (no third-party deps)

    Returns: (text: str | None, error: str | None, strategy: str)
    """
    strategies_log = []

    # ------------------------------------------------------------------
    # Strategy 1: trafilatura with full config
    # ------------------------------------------------------------------
    if HAS_TRAFILATURA:
        try:
            newconfig = use_config()
            newconfig.set("DEFAULT", "EXTRACTION_TIMEOUT", "20")
            downloaded = trafilatura.fetch_url(
                url,
                no_ssl=False,
            )
            if downloaded:
                text = trafilatura.extract(
                    downloaded,
                    include_tables=True,
                    include_comments=False,
                    no_fallback=False,
                    config=newconfig,
                )
                cleaned = _clean_extracted_text(text)
                if cleaned:
                    return cleaned, None, "trafilatura"
                else:
                    strategies_log.append("trafilatura: downloaded but extracted <50 words")
            else:
                strategies_log.append("trafilatura: fetch returned empty response")
        except Exception as exc:
            strategies_log.append(f"trafilatura: {exc}")

    # ------------------------------------------------------------------
    # Strategy 2: requests + BeautifulSoup with browser headers
    # ------------------------------------------------------------------
    if HAS_REQUESTS:
        try:
            session = requests.Session()
            session.headers.update(_HEADERS)
            # Follow redirects, short timeout
            resp = session.get(url, timeout=20, allow_redirects=True)
            resp.raise_for_status()
            html = resp.text

            soup = BeautifulSoup(html, "lxml")

            # Remove noise tags
            for tag in soup(["script", "style", "noscript", "nav",
                             "header", "footer", "aside", "form",
                             "button", "svg", "img"]):
                tag.decompose()

            # Prefer <main>, <article>, or <section> blocks
            body = (
                soup.find("main")
                or soup.find("article")
                or soup.find(id=re.compile(r"(content|policy|privacy|main)", re.I))
                or soup.find(class_=re.compile(r"(content|policy|privacy|main)", re.I))
                or soup.body
            )

            raw = body.get_text(separator=" ", strip=True) if body else soup.get_text(separator=" ", strip=True)

            # If trafilatura is available, also try extracting from the raw HTML string
            if HAS_TRAFILATURA and raw:
                try:
                    t2 = trafilatura.extract(
                        html,
                        include_tables=True,
                        include_comments=False,
                        no_fallback=False,
                    )
                    if t2 and len(t2.split()) > len(raw.split()):
                        raw = t2
                except Exception:
                    pass

            cleaned = _clean_extracted_text(raw)
            if cleaned:
                return cleaned, None, "requests+beautifulsoup"
            else:
                strategies_log.append(f"requests+bs4: status {resp.status_code}, extracted <50 words")
        except requests.exceptions.SSLError:
            strategies_log.append("requests+bs4: SSL error")
        except requests.exceptions.Timeout:
            strategies_log.append("requests+bs4: timeout")
        except requests.exceptions.ConnectionError as exc:
            strategies_log.append(f"requests+bs4: connection error — {exc}")
        except Exception as exc:
            strategies_log.append(f"requests+bs4: {exc}")

    # ------------------------------------------------------------------
    # Strategy 3: urllib (stdlib only)
    # ------------------------------------------------------------------
    try:
        req = urllib.request.Request(url, headers=_HEADERS)
        with urllib.request.urlopen(req, timeout=15) as resp:
            html = resp.read().decode("utf-8", errors="replace")

        parser = _TextExtractParser()
        parser.feed(html)
        raw = parser.get_text()
        cleaned = _clean_extracted_text(raw)
        if cleaned:
            return cleaned, None, "urllib"
        else:
            strategies_log.append("urllib: extracted <50 words")
    except Exception as exc:
        strategies_log.append(f"urllib: {exc}")

    # ------------------------------------------------------------------
    # All strategies failed — build a helpful error
    # ------------------------------------------------------------------
    js_hint = ""
    if _is_js_heavy(url):
        js_hint = (
            " This page is from a site that renders content with JavaScript "
            "(e.g. Facebook, Google, LinkedIn). The privacy policy text is not "
            "present in the raw HTML — it can only be read by a real browser."
        )

    return (
        None,
        (
            f"Could not extract text from this URL after trying 3 strategies.{js_hint} "
            "Please open the privacy policy page in your browser, select all text "
            "(Ctrl+A → Ctrl+C), then paste it in the 'Paste Text' tab."
        ),
        "all_failed",
    )


@app.route("/api/analyze/url", methods=["POST"])
def analyze_url():
    """
    Analyze a privacy policy from a URL.

    Request JSON:
        { "url": "https://example.com/privacy" }

    Attempts extraction via 3 strategies:
      1. trafilatura
      2. requests + BeautifulSoup
      3. urllib
    Returns a structured error with paste-text suggestion on failure.
    """
    data = request.get_json(silent=True)
    if not data or "url" not in data:
        return jsonify({"error": "Missing 'url' field in request body.", "success": False}), 400

    url = data["url"].strip()
    if not url:
        return jsonify({"error": "Empty URL provided.", "success": False}), 400

    if not url.startswith(("http://", "https://")):
        url = "https://" + url

    text, error, strategy = fetch_url_text(url)

    if error or not text:
        return jsonify({
            "success": False,
            "error": error or "Unknown extraction error.",
            "suggestion": "paste_text",
            "js_rendered": _is_js_heavy(url),
        }), 422

    result = build_analysis_response(text, source="url")
    if result.get("success"):
        result["url"] = url
        result["extraction_strategy"] = strategy
        result["extracted_text_preview"] = text[:500] + ("..." if len(text) > 500 else "")

    status = 200 if result.get("success") else 400
    return jsonify(result), status


@app.route("/api/dataset/stats", methods=["GET"])
def dataset_stats():
    """
    Return summary statistics for the full 81-company dataset.
    """
    scores = [float(row["obfuscation_score"]) for row in dataset]
    word_counts = [int(row["word_count"]) for row in dataset]
    fre_scores = [float(row["flesch_reading_ease"]) for row in dataset]

    label_counts = {"Easy": 0, "Moderate": 0, "Obfuscated": 0}
    for row in dataset:
        label_counts[row["label"]] += 1

    # Industry breakdown (from source CSV)
    industry_counts = {}
    for row in dataset:
        # Get industry from features_data or dataset
        company = row["company"]
        # We don't have industry in obfuscation_dataset.csv,
        # so we count from the source
        industry_counts[company] = None  # placeholder

    return jsonify({
        "total_companies": len(dataset),
        "label_distribution": label_counts,
        "obfuscation_score": {
            "min": round(min(scores), 2),
            "max": round(max(scores), 2),
            "mean": round(sum(scores) / len(scores), 2),
            "median": round(sorted(scores)[len(scores) // 2], 2),
        },
        "word_count": {
            "min": min(word_counts),
            "max": max(word_counts),
            "mean": round(sum(word_counts) / len(word_counts), 0),
        },
        "readability": {
            "min_fre": round(min(fre_scores), 2),
            "max_fre": round(max(fre_scores), 2),
            "mean_fre": round(sum(fre_scores) / len(fre_scores), 2),
        },
        "model_info": {
            "model_name": metadata["model_name"],
            "features_used": len(ALL_FEATURES),
            "cv_f1_weighted": round(metadata["cv_f1_weighted"], 4),
            "cv_accuracy": round(metadata["cv_accuracy"], 4),
        },
    })


@app.route("/api/dataset/companies", methods=["GET"])
def dataset_companies():
    """
    Return list of all companies with their scores and labels.

    Query params:
        ?sort=score|name|label  (default: score)
        ?order=asc|desc         (default: desc)
        ?label=Easy|Moderate|Obfuscated  (filter by label)
    """
    sort_by = request.args.get("sort", "score")
    order = request.args.get("order", "desc")
    label_filter = request.args.get("label", None)

    companies = []
    for row in dataset:
        if label_filter and row["label"] != label_filter:
            continue

        entry = {
            "company": row["company"],
            "obfuscation_score": round(float(row["obfuscation_score"]), 2),
            "label": row["label"],
            "word_count": int(row["word_count"]),
            "flesch_reading_ease": round(float(row["flesch_reading_ease"]), 2),
            "legal_term_count": int(row["legal_term_count"]),
            "avg_sentence_length": round(float(row["avg_sentence_length"]), 2),
        }

        # Add human label if available
        if row["company"] in manual_labels:
            ml = manual_labels[row["company"]]
            entry["human_class"] = ml["human_class"]
            entry["human_obfuscation"] = ml["human_obfuscation"]

        companies.append(entry)

    # Sort
    if sort_by == "name":
        companies.sort(key=lambda x: x["company"], reverse=(order == "desc"))
    elif sort_by == "label":
        label_order = {"Easy": 0, "Moderate": 1, "Obfuscated": 2}
        companies.sort(
            key=lambda x: label_order.get(x["label"], 99),
            reverse=(order == "desc"),
        )
    else:  # score
        companies.sort(
            key=lambda x: x["obfuscation_score"],
            reverse=(order == "desc"),
        )

    return jsonify({
        "total": len(companies),
        "sort": sort_by,
        "order": order,
        "filter": label_filter,
        "companies": companies,
    })


@app.route("/api/dataset/company/<company_name>", methods=["GET"])
def dataset_company(company_name):
    """
    Return full detail for a single company.
    """
    # Case-insensitive lookup
    match = None
    for row in dataset:
        if row["company"].lower() == company_name.lower():
            match = row
            break

    if not match:
        return jsonify({
            "error": f"Company '{company_name}' not found in dataset.",
            "success": False,
        }), 404

    company = match["company"]

    result = {
        "success": True,
        "company": company,
        "obfuscation_score": round(float(match["obfuscation_score"]), 2),
        "label": match["label"],
        "features": {},
        "normalized_features": {},
    }

    # Raw features
    for feat in RAW_FEATURES:
        try:
            val = float(match[feat])
            result["features"][feat] = (
                int(val) if val == int(val) else round(val, 6)
            )
        except (KeyError, ValueError):
            result["features"][feat] = None

    # Normalized features
    for feat in NORM_FEATURES:
        try:
            result["normalized_features"][feat] = round(float(match[feat]), 6)
        except (KeyError, ValueError):
            result["normalized_features"][feat] = None

    # Human label
    if company in manual_labels:
        ml = manual_labels[company]
        result["human_evaluation"] = {
            "human_class": ml["human_class"],
            "human_obfuscation": ml["human_obfuscation"],
            "Q1_readability": ml["Q1"],
            "Q2_jargon": ml["Q2"],
            "Q3_data_clarity": ml["Q3"],
            "Q4_opt_out": ml["Q4"],
            "is_manual": ml["is_manual"],
        }

    # Readability interpretation
    fre = result["features"].get("flesch_reading_ease", 0)
    if fre and fre >= 60:
        result["readability_level"] = "Standard / Easy"
    elif fre and fre >= 30:
        result["readability_level"] = "Difficult"
    else:
        result["readability_level"] = "Very Confusing"

    return jsonify(result)


# ===================================================================
# Run Server
# ===================================================================
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug = os.environ.get("FLASK_DEBUG", "1") == "1"

    print(f"\n  Starting Flask server on http://localhost:{port}")
    print(f"  Debug mode: {debug}")
    print(f"  Endpoints:")
    print(f"    GET  /api/health")
    print(f"    POST /api/analyze/text")
    print(f"    POST /api/analyze/url")
    print(f"    GET  /api/dataset/stats")
    print(f"    GET  /api/dataset/companies")
    print(f"    GET  /api/dataset/company/<name>")
    print()

    app.run(host="0.0.0.0", port=port, debug=debug)
