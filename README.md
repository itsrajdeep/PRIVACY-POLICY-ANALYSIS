<div align="center">

# 🔍 Cognitive Legal — Privacy Policy Obfuscation Analyzer

**An AI-powered platform that detects hidden complexity and obfuscation patterns in corporate privacy policies using Machine Learning.**

[![Live Demo](https://img.shields.io/badge/Live%20Demo-GitHub%20Pages-blue?style=for-the-badge&logo=github)](https://itsrajdeep.github.io/PRIVACY-POLICY-ANALYSIS/)
[![Python](https://img.shields.io/badge/Python-3.10+-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://python.org)
[![React](https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black)](https://react.dev)
[![XGBoost](https://img.shields.io/badge/XGBoost-Classifier-FF6600?style=for-the-badge)](https://xgboost.readthedocs.io)
[![Flask](https://img.shields.io/badge/Flask-API-000000?style=for-the-badge&logo=flask)](https://flask.palletsprojects.com)
[![License](https://img.shields.io/badge/License-MIT-green?style=for-the-badge)](LICENSE)

---

> *"Privacy policies are getting longer and harder to understand. This project builds ML tools to quantify exactly how obfuscated they are — and why."*

**🌐 [View Live Demo](https://itsrajdeep.github.io/PRIVACY-POLICY-ANALYSIS/) · [Browse Directory](https://itsrajdeep.github.io/PRIVACY-POLICY-ANALYSIS/#/directory) · [Research & Methodology](https://itsrajdeep.github.io/PRIVACY-POLICY-ANALYSIS/#/research)**

</div>

---

## 📋 Table of Contents

- [Overview](#-overview)
- [Live Demo](#-live-demo)
- [Dataset](#-dataset)
- [ML Pipeline](#-ml-pipeline)
- [Feature Engineering](#-feature-engineering)
- [Model Results](#-model-results)
- [Web Application](#-web-application)
- [Project Structure](#-project-structure)
- [Local Setup](#-local-setup)
- [API Reference](#-api-reference)
- [Deployment](#-deployment)

---

## 🧠 Overview

Privacy policies are legally required documents, yet they are routinely written in a way that discourages users from reading them. This project answers:

> **Can machine learning detect and quantify how deliberately complex a privacy policy is?**

We built an end-to-end pipeline that:
1. **Collects** privacy policies from 81+ global companies across 5 industries
2. **Extracts** 13 NLP-based features (readability, legal jargon density, sentence structure)
3. **Computes** a weighted obfuscation score (0–100) using domain-informed weights
4. **Classifies** each policy as `Easy`, `Moderate`, or `Obfuscated` using XGBoost
5. **Serves** results through a modern React web application

---

## 🌐 Live Demo

The full web application is deployed at:

### **👉 [https://itsrajdeep.github.io/PRIVACY-POLICY-ANALYSIS/](https://itsrajdeep.github.io/PRIVACY-POLICY-ANALYSIS/)**

### Pages

| Page | Description |
|---|---|
| 🏠 **Home** | Overview of the platform, ML pipeline visualization, and live dataset stats |
| 📁 **Directory** | Browse all 82 analyzed companies — filter by risk label, sort by score |
| 🔬 **Analyzer** | Paste policy text or enter a URL to get a live AI-powered risk score *(requires backend)* |
| 📊 **Research** | Deep dive into the methodology, confusion matrix, and feature importance |

---

## 📊 Dataset

| Property | Value |
|---|---|
| **Companies** | 82 global companies |
| **Industries** | Technology, Finance, Healthcare, Retail, Telecoms |
| **Label Distribution** | ~30% Easy · ~40% Moderate · ~30% Obfuscated |
| **Average Policy Length** | ~6,000 words |
| **Longest Policy** | 20,000+ words |
| **Source** | Publicly available privacy policy pages, scraped and cleaned |

### Companies Included (Sample)

Google · Apple · Meta · Microsoft · Amazon · Adobe · Netflix · Spotify · LinkedIn · Uber · Airbnb · Salesforce · WeChat · Corsair · Monday.com · and 67 more...

### Label Definitions

| Label | Obfuscation Score | Meaning |
|---|---|---|
| ✅ **Easy** | 0–35 | Clear, readable, uses plain language |
| ⚠️ **Moderate** | 35–55 | Some complexity, moderate legal jargon |
| ❌ **Obfuscated** | 55–100 | Dense, deliberately complex, high jargon density |

---

## ⚙️ ML Pipeline

```
Raw Policy Text (PDF / URL / Paste)
         │
         ▼
  ┌─────────────────┐
  │  Preprocessing  │  Sentence splitting, lowercasing, whitespace normalization
  └────────┬────────┘
           │
           ▼
  ┌──────────────────────┐
  │  Feature Extraction  │  13 NLP features extracted per policy
  └──────────┬───────────┘
             │
             ▼
  ┌─────────────────────────┐
  │  Min-Max Normalization  │  Scaled relative to dataset min/max per feature
  └───────────┬─────────────┘
              │
              ▼
  ┌──────────────────────────────────────┐
  │  Obfuscation Score (Weighted Sum)    │  score = Σ(weight × normalized_feature)
  │  × 100  →  0–100 scale              │
  └───────────┬──────────────────────────┘
              │
              ▼
  ┌──────────────────────┐
  │  XGBoost Classifier  │  n_estimators=100, max_depth=4, Stratified K-Fold
  └───────────┬──────────┘
              │
              ▼
  Risk Label + Confidence Score + Feature Breakdown
```

---

## 🔬 Feature Engineering

### The 13 Extracted Features

| Feature | Weight | Description |
|---|---|---|
| **Flesch Reading Ease** | 35% | Syllable count + sentence length readability formula. Lower = harder to read. |
| **Avg Sentence Length** | 25% | Mean word count per sentence. Longer = more complex. |
| **Legal Term Density** | 20% | Count of 10 high-signal legal jargon terms per document. |
| **Word Count** | 10% | Total words — proxy for policy comprehensiveness. |
| **Unique Word Ratio** | 10% | Vocabulary diversity relative to total word count. |
| `sentence_count` | — | Total number of sentences |
| `char_count` | — | Total character count |
| `flesch_kincaid_grade` | — | US grade level required to understand the text |
| `norm_word_count` | — | Min-max normalized word count |
| `norm_avg_sentence_length` | — | Min-max normalized sentence length |
| `norm_unique_words` | — | Min-max normalized vocabulary diversity |
| `norm_flesch_reading_ease` | — | Inverted & normalized (higher = more obfuscated) |
| `norm_legal_term_count` | — | Min-max normalized legal jargon density |

### Obfuscation Score Formula

```
score = (0.35 × norm_flesch_inverted)
      + (0.25 × norm_avg_sentence_length)
      + (0.20 × norm_legal_term_count)
      + (0.10 × norm_word_count)
      + (0.10 × norm_unique_words)

final_score = score × 100   →   range [0, 100]
```

### Legal Terms Tracked

`affiliate` · `third party` · `arbitration` · `indemnify` · `consent` · `retention` · `processor` · `controller` · `jurisdiction` · `liability`

---

## 📈 Model Results

### Model Comparison (5-Fold Stratified Cross-Validation)

| Model | CV Accuracy | CV F1 (Weighted) | Chosen |
|---|---|---|---|
| **XGBoost** | **~98%** | **0.6335** | ✅ |
| Random Forest | ~96% | 0.61 | |
| Logistic Regression | ~91% | 0.55 | |
| SVM | ~94% | 0.58 | |

> XGBoost was selected for best cross-validated F1 on the imbalanced dataset.

### Confusion Matrix (XGBoost on Held-Out Set)

```
                 Predicted
              Easy  Moderate  Obfuscated
Actual Easy  [  22       1         0   ]
      Mod    [   0      19         2   ]
      Obf    [   1       1        15   ]
```

**Per-class Precision:**
- Easy: 22/23 = **95.7%**
- Moderate: 19/21 = **90.5%**
- Obfuscated: 15/17 = **88.2%**

### Key Findings

- **Tech companies** tend to score highest for obfuscation (Salesforce: 61.6, WeChat: 50.5)
- **Streaming platforms** tend to have more readable policies (Netflix, Spotify: Easy category)
- **Flesch Reading Ease** is the single strongest predictor of obfuscation classification
- Policies averaging **>25 words per sentence** almost always land in Obfuscated or Moderate

---

## 🖥️ Web Application

### Tech Stack

**Frontend**
| Technology | Version | Purpose |
|---|---|---|
| React | 19 | UI framework |
| Vite | 8 | Build tool |
| Framer Motion | 12 | Animations |
| React Router | 7 | Client-side routing |
| Recharts | 3 | Data visualization |
| Axios | 1.18 | HTTP client |

**Backend**
| Technology | Purpose |
|---|---|
| Flask | REST API server |
| Flask-CORS | Cross-origin requests |
| XGBoost + scikit-learn | ML inference |
| joblib | Model serialization |
| trafilatura | URL text extraction |
| textstat | Readability scoring |
| BeautifulSoup | HTML parsing fallback |

### Key Features

- 🔎 **Real-time Policy Analyzer** — paste text or enter a URL for instant AI scoring
- 📁 **Company Directory** — searchable, filterable, sortable list of 82 analyzed companies
- 📊 **Research Dashboard** — interactive confusion matrix, feature importance bars, and live dataset stats
- 🎨 **Modern UI** — glassmorphism design, smooth animations, responsive layout
- ⚡ **Static Fallback** — directory works on GitHub Pages without a backend (pre-generated `data.json`)

---

## 🗂️ Project Structure

```
PRIVACY-POLICY-ANALYSIS/
│
├── dataset/                        # All research data
│   ├── obfuscation_dataset.csv     # 82 companies × features + label
│   ├── policy_features.csv         # Raw NLP features per company
│   ├── manual_labels.csv           # Human evaluation ground truth
│   ├── ml_predictions.csv          # Model predictions on all companies
│   └── raw_text/                   # Scraped raw policy text files
│
├── website/
│   ├── app.py                      # Flask REST API
│   ├── model/                      # Saved ML artifacts
│   │   ├── model.pkl               # Trained XGBoost model
│   │   ├── scaler.pkl              # Min-max scaler
│   │   ├── label_encoder.pkl       # Label encoder
│   │   └── metadata.pkl            # Training metadata
│   └── frontend/                   # React application
│       ├── public/
│       │   └── data.json           # Pre-built static dataset for GitHub Pages
│       └── src/
│           ├── api/client.js       # API client with static fallback
│           ├── components/         # Navbar, Footer, UI components
│           └── pages/              # Home, Directory, Analyzer, Research, CompanyDetail
│
├── .github/workflows/
│   └── deploy.yml                  # GitHub Actions → builds & deploys to gh-pages branch
│
├── compute_obfuscation_score.py    # Obfuscation score computation
├── generate_features.py            # NLP feature extraction
├── ml_classification.py            # Model training & evaluation
├── human_evaluation.py             # Human labeling interface
├── generate_static_data.py         # Builds public/data.json from CSVs
└── save_model.py                   # Exports trained model artifacts
```

---

## 🚀 Local Setup

### Prerequisites

- Python 3.10+
- Node.js 18+
- pip

### 1. Clone the Repository

```bash
git clone https://github.com/itsrajdeep/PRIVACY-POLICY-ANALYSIS.git
cd PRIVACY-POLICY-ANALYSIS
```

### 2. Run the Flask Backend

```bash
cd website
pip install flask flask-cors xgboost scikit-learn joblib textstat trafilatura requests beautifulsoup4
python app.py
# API runs at http://localhost:5000
```

### 3. Run the React Frontend

```bash
cd website/frontend
npm install
npm run dev
# App runs at http://localhost:5173
```

### 4. (Optional) Regenerate Static Data

If you update the dataset CSVs, regenerate the static JSON:

```bash
# From project root
python generate_static_data.py
```

---

## 📡 API Reference

Base URL: `http://localhost:5000`

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check + model info |
| `POST` | `/api/analyze/text` | Analyze pasted policy text |
| `POST` | `/api/analyze/url` | Analyze policy from a URL |
| `GET` | `/api/dataset/stats` | Summary statistics for the full dataset |
| `GET` | `/api/dataset/companies` | Full company list with scores & labels |
| `GET` | `/api/dataset/company/<name>` | Single company detail |

### Example — Analyze Text

```bash
curl -X POST http://localhost:5000/api/analyze/text \
  -H "Content-Type: application/json" \
  -d '{"text": "We collect personal data including IP address and location information..."}'
```

**Response:**
```json
{
  "success": true,
  "obfuscation_score": 47.3,
  "prediction": {
    "predicted_class": "Moderate",
    "probabilities": { "Easy": 0.12, "Moderate": 0.71, "Obfuscated": 0.17 },
    "confidence": 71.0
  },
  "features": {
    "word_count": 312,
    "flesch_reading_ease": 42.8,
    "legal_term_count": 7,
    "avg_sentence_length": 24.2
  }
}
```

### Query Parameters — `/api/dataset/companies`

| Param | Values | Default |
|---|---|---|
| `sort` | `score`, `name`, `label` | `score` |
| `order` | `asc`, `desc` | `desc` |
| `label` | `Easy`, `Moderate`, `Obfuscated` | *(all)* |

---

## 🌍 Deployment

The frontend is automatically deployed to **GitHub Pages** on every push to `main`.

### How It Works

```
Push to main
     │
     ▼
GitHub Actions (.github/workflows/deploy.yml)
     │
     ├─ npm install & npm run build  (in website/frontend/)
     │
     └─ peaceiris/actions-gh-pages  →  pushes dist/ to gh-pages branch
                                              │
                                              ▼
                                    GitHub Pages serves gh-pages branch
                                              │
                                              ▼
                              https://itsrajdeep.github.io/PRIVACY-POLICY-ANALYSIS/
```

> **Note:** The Analyzer page requires the Flask backend running locally. On GitHub Pages, the Directory and Research pages use pre-built static data (`public/data.json`).

---

## 🔬 Research Scripts

| Script | Purpose |
|---|---|
| `process_policies.py` | Scrapes & cleans raw policy text |
| `generate_features.py` | Extracts 13 NLP features per policy |
| `compute_obfuscation_score.py` | Computes weighted obfuscation scores |
| `filter_short_policies.py` | Removes policies under minimum word threshold |
| `human_evaluation.py` | Interactive CLI for manual labeling |
| `ml_classification.py` | Trains & evaluates all ML models |
| `save_model.py` | Exports the best model as `.pkl` artifacts |
| `distribution_analysis.py` | Statistical analysis & visualization |
| `steps_6_to_9.py` | Full pipeline orchestration |

---

## 📄 License

This project is for research and educational purposes. Dataset is compiled from publicly available privacy policy pages.

---

<div align="center">

Made with ❤️ for transparency in data privacy.

**[⭐ Star this repo](https://github.com/itsrajdeep/PRIVACY-POLICY-ANALYSIS)** if you find it useful!

</div>
