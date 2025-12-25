# RL Vocabulary Recommender Service

This service scores candidate words for a user and returns top-k recommendations based on user level and recent accuracy.

## Components

- `rl_vocab_agent.ipynb`: Notebook with DQN-style training on a mock environment.
- `service.py`: FastAPI app exposing `/health` and `/recommend`.
- `train_from_mongo.py`: Script to train the scorer from MongoDB collections (Words + UserWordProgress).
- `checkpoints/scorer.pt`: Saved weights loaded by the service.

## Install & Run

```bash
cd ml_agent
python -m venv .venv
. .venv/Scripts/activate  # Windows
pip install -r requirements.txt

# Train from MongoDB (requires MONGODB_URI in env)
set MONGODB_URI=mongodb+srv://<user>:<pass>@<cluster>/<db>
python train_from_mongo.py

# Start service
uvicorn service:app --host 0.0.0.0 --port 8000
```

## API

- `POST /recommend`
  - Body:
    ```json
    {
      "userLevel": 2,
      "k": 5,
      "recentAccuracy": 0.6,
      "words": [{ "id": "<ObjectId>", "difficulty": 3, "category": "daily" }]
    }
    ```
  - Response:
    ```json
    {
      "recommendations": [
        { "wordId": "<ObjectId>", "score": 0.42, "category": "daily" }
      ]
    }
    ```

## Backend Integration

- Configure backend with `RL_SERVICE_URL=http://localhost:8000`.
- Call `GET /rl/recommend?userId=<objectId>&k=5&category=<opt>`.
- Controller computes `userLevel` and `recentAccuracy` from `userWordProgress` and passes candidate words.
