# service.py (Partial replacement for the initialization section)
import os
from pathlib import Path
import traceback
from typing import List, Optional
from contextlib import asynccontextmanager

import numpy as np
import torch
from fastapi import FastAPI, BackgroundTasks, HTTPException, APIRouter
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from dotenv import load_dotenv

load_dotenv()

# Ensure this matches your actual filename (trainer.py or dqn_trainer.py)
from dqn_trainer import train_dqn_model, DQN, load_words_from_db, DEVICE

CHECKPOINTS_DIR = Path(__file__).parent / "checkpoints"
SCORER_CKPT_PATH = CHECKPOINTS_DIR / "scorer.pt"
DQN_CKPT_PATH = CHECKPOINTS_DIR / "dqn_vocab.pt"
MONGO_URI = os.getenv("MONGO_URI")

scorer_model: Optional[torch.nn.Module] = None
dqn_model: Optional[DQN] = None
words_df_cache = None

def load_local_models():
    global scorer_model, dqn_model, words_df_cache
    
    # Importing DQN from trainer
    from dqn_trainer import DQN as RawScorer
    scorer_model = RawScorer(state_dim=3, action_dim=1).to(DEVICE)
    if SCORER_CKPT_PATH.exists():
        try:
            state = torch.load(SCORER_CKPT_PATH, map_location=DEVICE)
            weights = state.get("q_net", state) if isinstance(state, dict) else state
            scorer_model.load_state_dict(weights, strict=False)
            scorer_model.eval()
            print(f"Loaded /recommend scorer model from {SCORER_CKPT_PATH}")
        except Exception as e:
            print(f"Could not load Scorer weights: {e}")
            
    if MONGO_URI:
        try:
            print("Connecting to MongoDB to initialize vocabulary cache...")
            words_df_cache = load_words_from_db(MONGO_URI)
            action_dim = len(words_df_cache)
            dqn_model = DQN(state_dim=2, action_dim=action_dim).to(DEVICE)
            
            if DQN_CKPT_PATH.exists():
                state = torch.load(DQN_CKPT_PATH, map_location=DEVICE)
                weights = state.get("q_net", state) if isinstance(state, dict) else state
                dqn_model.load_state_dict(weights)
                dqn_model.eval()
                print(f"Loaded /dqn model from {DQN_CKPT_PATH}")
            else:
                print(f"Checkpoint {DQN_CKPT_PATH} not found. Running dqn_model with uninitialized weights.")
        except Exception as e:
            print("❌ DQN initialization failed. Detailed traceback:")
            traceback.print_exc()
    else:
        print("❌ DQN initialization skipped: MONGO_URI environment variable not found.")

@asynccontextmanager
async def lifespan(app: FastAPI):
    load_local_models()
    yield

# Single initialization of FastAPI
app = FastAPI(title="RL Vocab Recommender", version="0.3.0", lifespan=lifespan)

# CORS middleware added to the correct, single app instance
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust this in production to match ALLOWED_ORIGINS
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Use an APIRouter with the "/api" prefix to match the React frontend
api_router = APIRouter(prefix="/api")

def run_background_train():
    if not MONGO_URI:
        print("Cannot train: MONGO_URI environment variable is missing.")
        return
    try:
        train_dqn_model(mongo_uri=MONGO_URI, num_episodes=40)
        load_local_models()
    except Exception as e:
        print(f"Background training failed: {e}")

class WordItem(BaseModel):
    id: str
    difficulty: float
    category: Optional[str] = None

class RecommendRequest(BaseModel):
    userLevel: int = 2
    k: int = 5
    recentAccuracy: float = 0.6
    words: List[WordItem]

@api_router.post("/train/rlmodel", status_code=202)
async def trigger_training(background_tasks: BackgroundTasks):
    if not MONGO_URI:
        raise HTTPException(status_code=500, detail="MONGO_URI not configured on server.")
    background_tasks.add_task(run_background_train)
    return {"status": "training initiated", "detail": "DQN is training in background."}

# @api_router.post("/recommend")
# async def recommend(req: RecommendRequest):
#     # ... (rest of your /recommend logic remains unchanged)
#     pass

@app.post("/recommend")
async def recommend(req: RecommendRequest):
    """Traditional scorer: State requires 3 features (User Level, Word-User Gap, Accuracy)"""
    if scorer_model is None:
        raise HTTPException(status_code=503, detail="Scorer model not loaded.")
    if not req.words:
        return {"recommendations": []}

    k = max(1, min(req.k, len(req.words)))
    
    # 3-feature context formulation [user_level, gap, accuracy]
    states = []
    for w in req.words:
        gap = w.difficulty - req.userLevel
        states.append([req.userLevel / 5.0, np.tanh(gap / 3.0), req.recentAccuracy])
        
    with torch.no_grad():
        x = torch.tensor(states, dtype=torch.float32, device=DEVICE)
        scores = scorer_model(x).squeeze(-1).cpu().numpy().tolist()

    # Tie-breaking noise
    scores = [float(s + np.random.uniform(-1e-6, 1e-6)) for s in scores]
    ranked = sorted(zip(req.words, scores), key=lambda p: p[1], reverse=True)
    
    return {
        "recommendations": [
            {"wordId": w.id, "score": float(score), "category": w.category}
            for w, score in ranked[:k]
        ]
    }
    pass


@api_router.post("/dqn")
async def dqn_recommend(req: RecommendRequest):
    """Standard action-selection DQN: State requires 2 features [User Level, Accuracy]"""
    if dqn_model is None or words_df_cache is None:
        raise HTTPException(status_code=503, detail="DQN model or database words not initialized.")
    if not req.words:
        return {"recommendations": []}

    k = max(1, min(req.k, len(req.words)))
    
    # State containing ONLY action-independent user details [User Level, Recent Accuracy]
    user_state = np.array([req.userLevel / 5.0, req.recentAccuracy], dtype=np.float32)
    
    with torch.no_grad():
        s = torch.tensor(user_state, dtype=torch.float32, device=DEVICE).unsqueeze(0)
        # Predict Q-values across all actions (word indices)
        q_values = dqn_model(s).squeeze(0).cpu().numpy().tolist()

    # Create a fast lookup for candidate words in words_df_cache indices
    word_id_to_score = {}
    for idx, row in words_df_cache.iterrows():
        # Read the Q-value mapped directly to the word's database ID
        word_id_to_score[str(row["_id"])] = q_values[idx]

    # Map candidate words to their estimated Q-value scores
    scored_candidates = []
    for w in req.words:
        score = word_id_to_score.get(w.id, -999.0)  # Use low penalty score if word index mismatch occurs
        scored_candidates.append((w, score))

    # Tie-breaking noise and sorting
    scored_candidates = [(w, float(s + np.random.uniform(-1e-6, 1e-6))) for w, s in scored_candidates]
    ranked = sorted(scored_candidates, key=lambda p: p[1], reverse=True)

    return {
        "recommendations": [
            {"wordId": w.id, "score": float(score), "category": w.category}
            for w, score in ranked[:k]
        ]
    }

@api_router.get("/health")
async def health():
    return {
        "status": "ok",
        "device": str(DEVICE),
        "scorer_loaded": scorer_model is not None,
        "dqn_loaded": dqn_model is not None,
        "vocabulary_size": len(words_df_cache) if words_df_cache is not None else 0
    }

# Include the router in the app
app.include_router(api_router)


if __name__ == "__main__":
    import uvicorn

    uvicorn.run("service:app", host="0.0.0.0", port=8000, reload=False)