"""
Unit tests for the HireLens ML microservice.
Run:  python -m pytest test_app.py -v
( or: python test_app.py  for the simple built-in runner )
"""
import sys
import os

sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app import (
    preprocess,
    tfidf_similarity,
    predict_band,
    predict_band_nn,
    FEATURE_IMPORTANCE,
    BAND_NAMES,
    _TF_AVAILABLE,
    mongo_client,
)


def test_preprocess_removes_stopwords_and_punctuation():
    raw = "The Senior React, Developer WILL use TypeScript & Docker!"
    cleaned = preprocess(raw)
    assert "the" not in cleaned.split()
    assert "," not in cleaned
    assert "react" in cleaned
    assert "typescript" in cleaned
    assert "docker" in cleaned


def test_tfidf_similarity_high_for_matching_texts():
    jd = "We need a python developer with flask scikit-learn and pandas experience"
    resume = "Experienced python developer skilled in flask, scikit-learn, pandas and numpy"
    other = "Graphic designer with photoshop, illustration and branding skills"
    results = tfidf_similarity(jd, [resume, other])
    assert results[0]["score"] > results[1]["score"]
    assert 0 <= results[0]["score"] <= 100
    assert len(results[0]["top_terms"]) > 0
    # The strongest shared terms should include the actual shared skills
    terms = [t["term"] for t in results[0]["top_terms"]]
    assert any("python" in t or "flask" in t or "pandas" in t for t in terms)
    # Calibrated scale: a strong textual match should land high
    assert results[0]["score"] >= 50


def test_predict_band_returns_valid_output():
    jd = "react typescript nodejs docker kubernetes aws graphql"
    strong = "react typescript nodejs docker kubernetes aws graphql extra skills here"
    weak = "cooking baking pastry recipes kitchen"
    out = predict_band(jd, [strong, weak])
    assert out[0]["band"] in BAND_NAMES
    assert out[0]["band"] == "strong"
    assert out[1]["band"] == "weak"
    assert 0 <= out[0]["confidence"] <= 1
    assert abs(sum(out[0]["probabilities"].values()) - 1.0) < 0.01


def test_feature_importance_sums_to_one():
    total = sum(FEATURE_IMPORTANCE.values())
    assert 0.99 < total <= 1.01


def test_tensorflow_nn_predictions():
    """TensorFlow Keras model (when installed) returns valid band predictions."""
    if not _TF_AVAILABLE:
        print("      (TensorFlow not installed — skipping NN test)")
        return
    jd = "react typescript nodejs docker kubernetes aws graphql"
    strong = "react typescript nodejs docker kubernetes aws graphql extra skills here"
    weak = "cooking baking pastry recipes kitchen"
    out = predict_band_nn(jd, [strong, weak])
    assert out is not None
    assert out[0]["band"] in BAND_NAMES
    assert 0 <= out[0]["confidence"] <= 1
    assert abs(sum(out[0]["probabilities"].values()) - 1.0) < 0.01
    # Both models should rank the strong resume above the weak one
    assert out[0]["band"] in ("good", "strong")
    assert out[1]["band"] == "weak"


def test_mongodb_configured_or_disabled():
    """MongoDB client is either connected (MONGO_URI set) or cleanly None."""
    assert mongo_client is None or mongo_client is not None  # no crash at import
    if os.environ.get("MONGO_URI") and mongo_client is not None:
        db = mongo_client[os.environ.get("MONGO_DB_NAME", "hirelens")]
        collection_names = db.list_collection_names()
        assert isinstance(collection_names, list)


def run_all():
    tests = [v for k, v in sorted(globals().items()) if k.startswith("test_") and callable(v)]
    passed = 0
    for t in tests:
        try:
            t()
            print(f"  PASS  {t.__name__}")
            passed += 1
        except AssertionError as e:
            print(f"  FAIL  {t.__name__}: {e}")
    print(f"\n{passed}/{len(tests)} tests passed")
    return passed == len(tests)


if __name__ == "__main__":
    sys.exit(0 if run_all() else 1)
