"""
HireLens AI — ML Screening Microservice
=======================================
Flask + Scikit-learn service that provides ML-based resume screening.

Two ML models are used:
1. TF-IDF + Cosine Similarity  — measures textual alignment between a resume
   and a job description (information retrieval classic).
2. RandomForest Classifier     — trained on synthetic labeled resume↔JD pairs
   to predict a match band (strong / good / possible / weak). Feature-based,
   interpretable via feature_importances_.

The service exposes a single endpoint:
    POST /api/score   { jd_text, resume_texts: [ ... ] }

It returns, per resume: cosine similarity score (0–100), predicted match band,
top overlapping TF-IDF terms (explainability), and Random Forest class
probabilities.

Run:
    pip install -r requirements.txt
    python app.py            # http://localhost:5001
"""
from __future__ import annotations

import os
import re
import string
from datetime import datetime, timezone

from flask import Flask, jsonify, request
from sklearn.ensemble import RandomForestClassifier
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity

app = Flask(__name__)

# ─────────────────────────────── Text utilities ──────────────────────────────

STOPWORDS = {
    "a", "an", "and", "are", "as", "at", "be", "but", "by", "for", "if", "in",
    "into", "is", "it", "no", "not", "of", "on", "or", "such", "that", "the",
    "their", "then", "there", "these", "they", "this", "to", "was", "will",
    "with", "you", "your", "we", "our", "have", "has", "had", "do", "does",
    "did", "from", "he", "she", "his", "her", "its", "who", "whom", "which",
    "what", "when", "where", "why", "how", "all", "each", "more", "other",
    "some", "any", "than", "too", "very", "can", "will", "just", "should",
    "about", "over", "under", "between", "through", "during", "before",
    "after", "above", "below", "up", "down", "out", "off", "again", "once",
}

def preprocess(text: str) -> str:
    """Lowercase, strip punctuation, remove stopwords. Returns a clean string."""
    text = text.lower()
    text = text.translate(str.maketrans("", "", string.punctuation))
    tokens = [t for t in text.split() if t not in STOPWORDS and len(t) > 1 and not t.isdigit()]
    return " ".join(tokens)


# ─────────────────────────── Model 1: TF-IDF similarity ─────────────────────

vectorizer = TfidfVectorizer(
    max_features=5000,
    ngram_range=(1, 2),
    sublinear_tf=True,
    preprocessor=preprocess,
)


def tfidf_similarity(jd_text: str, resume_texts: list[str]) -> list[dict]:
    """Compute TF-IDF cosine similarity between one JD and many resumes."""
    corpus = [jd_text] + resume_texts
    matrix = vectorizer.fit_transform(corpus)
    jd_vec = matrix[0]
    resume_vecs = matrix[1:]

    sims = cosine_similarity(jd_vec, resume_vecs)[0]

    # Explainability: top shared TF-IDF terms between JD and each resume
    feature_names = vectorizer.get_feature_names_out()
    jd_weights = jd_vec.toarray().ravel()

    results = []
    for i, sim in enumerate(sims):
        rv = resume_vecs[i].toarray().ravel()
        # Terms that carry weight in BOTH documents
        overlap = (jd_weights * rv)
        top_idx = overlap.argsort()[::-1][:8]
        top_terms = [
            {
                "term": feature_names[j],
                "jd_weight": round(float(jd_weights[j]), 4),
                "resume_weight": round(float(rv[j]), 4),
            }
            for j in top_idx if overlap[j] > 0
        ]
        # Cosine similarity between short JDs and long resumes is naturally
        # low (0.1–0.4 for good matches). Normalize to an intuitive 0–100
        # scale using a calibrated anchor: sim=0.35 → score 85.
        calibrated = min(sim / 0.35, 1.0)
        results.append({
            "similarity": round(float(sim), 4),          # raw 0–1
            "score": round(calibrated * 100, 1),          # calibrated 0–100
            "top_terms": top_terms,
        })
    return results


# ────────────────────────── Model 2: RandomForest ────────────────────────────

# Synthetic training corpus: (jd_skills_text, resume_skills_text, label)
# Labels: 3=strong, 2=good, 1=possible, 0=weak
SKILL_POOL = [
    "react", "typescript", "javascript", "nodejs", "python", "django", "flask",
    "sql", "mongodb", "postgresql", "docker", "kubernetes", "aws", "azure",
    "machine learning", "pandas", "numpy", "scikit-learn", "tensorflow",
    "pytorch", "data analysis", "tableau", "power bi", "git", "ci cd",
    "rest api", "graphql", "html", "css", "bootstrap", "tailwind", "java",
    "spring boot", "php", "laravel", "mysql", "agile", "scrum", "jira",
    "communication", "leadership", "teamwork", "testing", "jest", "cypress",
]

import random

random.seed(42)  # reproducible training data


def make_training_data(n: int = 6000) -> tuple[list[str], list[str], list[int]]:
    """Generate synthetic JD/resume skill pairs with a known overlap ratio."""
    jd_texts, resume_texts, labels = [], [], []
    for _ in range(n):
        k = random.randint(6, 14)
        jd_skills = random.sample(SKILL_POOL, k)
        # Resume overlaps with the JD to a controlled degree
        overlap_ratio = random.random()
        n_shared = max(0, int(k * overlap_ratio * 0.9))
        shared = random.sample(jd_skills, min(n_shared, k))
        extras = random.sample(
            [s for s in SKILL_POOL if s not in jd_skills],
            random.randint(2, 8),
        )
        jd_texts.append(" ".join(jd_skills))
        resume_texts.append(" ".join(shared + extras))

        # Label from overlap: strong ≥75%, good ≥50%, possible ≥25%, else weak
        ratio = len(set(shared)) / k if k else 0
        label = 3 if ratio >= 0.75 else 2 if ratio >= 0.5 else 1 if ratio >= 0.25 else 0
        labels.append(label)
    return jd_texts, resume_texts, labels


def overlap_features(jd_text: str, resume_texts: list[str]) -> list[list[float]]:
    """Feature extraction: skill-overlap + length features per pair."""
    jd_tokens = set(preprocess(jd_text).split())
    features = []
    for r in resume_texts:
        r_tokens = set(preprocess(r).split())
        shared = jd_tokens & r_tokens
        union = jd_tokens | r_tokens or {""}
        jaccard = len(shared) / len(union) if union else 0.0
        overlap_jd = len(shared) / len(jd_tokens) if jd_tokens else 0.0
        overlap_r = len(shared) / len(r_tokens) if r_tokens else 0.0
        length_ratio = min(len(r_tokens) / max(len(jd_tokens), 1), 3.0) / 3.0
        features.append([
            jaccard,
            overlap_jd,
            overlap_r,
            len(shared),
            length_ratio,
        ])
    return features


# Train the Random Forest once at startup
JD_TEXTS, RESUME_TEXTS, LABELS = make_training_data()
_X = []
for jd, r in zip(JD_TEXTS, RESUME_TEXTS):
    f = overlap_features(jd, [r])[0]
    _X.append(f)

rf_model = RandomForestClassifier(
    n_estimators=200,
    max_depth=8,
    random_state=42,
)
rf_model.fit(_X, LABELS)

BAND_NAMES = ["weak", "possible", "good", "strong"]


def predict_band(jd_text: str, resume_texts: list[str]) -> list[dict]:
    feats = overlap_features(jd_text, resume_texts)
    probs = rf_model.predict_proba(feats)
    preds = rf_model.predict(feats)
    out = []
    for i, p in enumerate(preds):
        prob_map = {BAND_NAMES[int(c)]: round(float(pr), 3) for c, pr in zip(rf_model.classes_, probs[i])}
        out.append({
            "band": BAND_NAMES[int(p)],
            "confidence": round(float(max(probs[i])), 3),
            "probabilities": prob_map,
        })
    return out


# ────────────────────────── Model 3: TensorFlow Keras ────────────────────────
# A small neural network trained on the same synthetic pairs. Serves as a
# third model whose predictions are compared against the Random Forest.

_TF_AVAILABLE = False
try:
    import numpy as np

    # Silence TensorFlow's startup log spam BEFORE importing it
    os.environ.setdefault("TF_CPP_MIN_LOG_LEVEL", "3")
    os.environ.setdefault("TF_ENABLE_ONEDNN_OPTS", "0")
    import tensorflow as tf

    tf.get_logger().setLevel("ERROR")

    def build_keras_model() -> "tf.keras.Model":
        model = tf.keras.Sequential([
            tf.keras.layers.Input(shape=(5,)),
            tf.keras.layers.Dense(16, activation="relu", name="hidden_1"),
            tf.keras.layers.Dense(8, activation="relu", name="hidden_2"),
            tf.keras.layers.Dense(4, activation="softmax", name="band_output"),
        ])
        model.compile(
            optimizer=tf.keras.optimizers.Adam(learning_rate=0.01),
            loss="sparse_categorical_crossentropy",
            metrics=["accuracy"],
        )
        return model

    keras_model = build_keras_model()
    X_arr = np.array(_X, dtype="float32")
    y_arr = np.array(LABELS, dtype="int32")
    keras_model.fit(X_arr, y_arr, epochs=40, batch_size=64, verbose=0)
    _TF_AVAILABLE = True
except Exception:  # TensorFlow optional — service still runs without it
    _TF_AVAILABLE = False


def predict_band_nn(jd_text: str, resume_texts: list[str]) -> list[dict] | None:
    """Neural-network match-band prediction. None if TensorFlow unavailable."""
    if not _TF_AVAILABLE:
        return None
    feats = np.array(overlap_features(jd_text, resume_texts), dtype="float32")
    probs = keras_model.predict(feats, verbose=0)
    preds = probs.argmax(axis=1)
    out = []
    for i, p in enumerate(preds):
        out.append({
            "band": BAND_NAMES[int(p)],
            "confidence": round(float(probs[i][p]), 3),
            "probabilities": {
                BAND_NAMES[j]: round(float(probs[i][j]), 3) for j in range(4)
            },
        })
    return out


# Feature importances for explainability reports
FEATURE_IMPORTANCE = {
    name: round(float(w), 4)
    for name, w in zip(
        ["jaccard", "jd_overlap", "resume_overlap", "shared_count", "length_ratio"],
        rf_model.feature_importances_,
    )
}


# ─────────────────────────── MongoDB logging (optional) ──────────────────────
# Every screening request is logged to MongoDB Atlas when MONGO_URI is set.
# The app works identically without it.

MONGO_URI = os.environ.get("MONGO_URI", "")
MONGO_DB_NAME = os.environ.get("MONGO_DB_NAME", "hirelens")

mongo_client = None
try:
    if MONGO_URI:
        import pymongo

        mongo_client = pymongo.MongoClient(MONGO_URI, serverSelectionTimeoutMS=3000)
        mongo_client.admin.command("ping")  # fail fast if unreachable
        print(f"[ml-service] MongoDB connected to database '{MONGO_DB_NAME}'")
except Exception as e:
    print(f"[ml-service] MongoDB unavailable ({e.__class__.__name__}); logging disabled")
    mongo_client = None


def log_screening_to_mongo(jd_text: str, results: list[dict]) -> None:
    """Best-effort audit log of each screening run. Never raises."""
    if mongo_client is None:
        return
    try:
        db = mongo_client[MONGO_DB_NAME]
        collection = db["screenings"]
        doc = {
            "timestamp": datetime.now(timezone.utc),
            "jd_length": len(jd_text),
            "jd_preview": jd_text[:200],
            "candidates": [
                {
                    "index": r["index"],
                    "tfidf_similarity": r["tfidf_similarity"],
                    "score": r["score"],
                    "predicted_band": r["predicted_band"],
                    "nn_band": r.get("nn_band"),
                    "top_terms": [t["term"] for t in r["top_terms"][:5]],
                }
                for r in results
            ],
        }
        collection.insert_one(doc)
    except Exception:
        pass  # logging must never break scoring


# ───────────────────────────────── Endpoints ────────────────────────────────

@app.get("/api/health")
def health():
    return jsonify({
        "ok": True,
        "service": "hirelens-ml",
        "models": ["tfidf-cosine", "random-forest"] + (["tensorflow-keras"] if _TF_AVAILABLE else []),
        "database": "mongodb" if mongo_client else "none",
        "feature_importance": FEATURE_IMPORTANCE,
    })


@app.post("/api/score")
def score():
    data = request.get_json(silent=True) or {}
    jd_text = str(data.get("jd_text", "")).strip()
    resume_texts = data.get("resume_texts") or []

    if not jd_text:
        return jsonify({"error": "jd_text is required"}), 400
    if not isinstance(resume_texts, list) or not resume_texts:
        return jsonify({"error": "resume_texts must be a non-empty list"}), 400
    if len(resume_texts) > 10:
        return jsonify({"error": "Maximum 10 resumes per request"}), 400
    if any(len(t) > 200_000 for t in resume_texts):
        return jsonify({"error": "Resume text exceeds 200k character limit"}), 413

    sims = tfidf_similarity(jd_text, resume_texts)
    bands = predict_band(jd_text, resume_texts)
    nn_bands = predict_band_nn(jd_text, resume_texts)

    results = []
    for i in range(len(resume_texts)):
        entry = {
            "index": i,
            "tfidf_similarity": sims[i]["similarity"],
            "score": sims[i]["score"],
            "top_terms": sims[i]["top_terms"],
            "predicted_band": bands[i]["band"],
            "confidence": bands[i]["confidence"],
            "probabilities": bands[i]["probabilities"],
        }
        if nn_bands is not None:
            entry["nn_band"] = nn_bands[i]["band"]
            entry["nn_confidence"] = nn_bands[i]["confidence"]
            entry["nn_probabilities"] = nn_bands[i]["probabilities"]
            entry["models_agree"] = nn_bands[i]["band"] == bands[i]["band"]
        results.append(entry)
    # Rank by score descending
    results.sort(key=lambda r: r["score"], reverse=True)

    log_screening_to_mongo(jd_text, results)

    return jsonify({
        "ok": True,
        "engine": "scikit-learn + tensorflow",
        "results": results,
        "feature_importance": FEATURE_IMPORTANCE,
    })


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5001, debug=False)
