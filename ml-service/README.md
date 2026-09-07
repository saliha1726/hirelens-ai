# ML Microservice — Flask + Scikit-learn + TensorFlow + MongoDB

The Python component of HireLens AI. Provides an ML "second opinion" on every
screening run, alongside the app's deterministic scoring engine.

## Models

| # | Model | Library | Purpose |
|---|---|---|---|
| 1 | TF-IDF + cosine similarity | scikit-learn | Textual match score 0–100 between JD and resume |
| 2 | RandomForest (200 trees) | scikit-learn | Match-band classification: strong/good/possible/weak |
| 3 | Keras neural network (16→8→4 softmax) | TensorFlow | Third opinion with agreement indicator vs RandomForest |

All models train at startup on **6,000 synthetic resume↔JD pairs** (seeded, reproducible).

## Database

Every screening request is logged to **MongoDB** (collection `screenings`) when
`MONGO_URI` is set. Without it, the service runs normally with logging disabled.

## Run it

```bash
cd ml-service
pip install -r requirements.txt

# Optional: local MongoDB via Docker
docker run -d --name hirelens-mongo -p 27017:27017 mongo:7

# Start the service
python app.py            # http://127.0.0.1:5001
```

Then in the Next.js app, either:
- Set `ML_SERVICE_URL=http://127.0.0.1:5001` in `.env.local`, or
- Start the app with the env var: `$env:ML_SERVICE_URL="http://127.0.0.1:5001"; npm run dev`

Every screening result card now shows the **ML analysis** panel.

## API

### `GET /api/health`
```json
{ "ok": true, "models": ["tfidf-cosine","random-forest","tensorflow-keras"],
  "database": "mongodb" }
```

### `POST /api/score`
```json
{
  "jd_text": "python flask pandas ...",
  "resume_texts": ["resume one text ...", "resume two text ..."]
}
```
Response (per resume): TF-IDF score (0–100), top shared terms, RandomForest
band + probabilities, TensorFlow NN band + probabilities, `models_agree` flag.

## Tests

```bash
python test_app.py        # 6 tests
```

## Verify MongoDB logging

```bash
docker exec hirelens-mongo mongosh hirelens --eval "db.screenings.find().pretty()"
```
