"""
FastAPI service to score/recommend vocabulary words using a lightweight DQN-style scorer.
The service expects the backend to send word metadata and user-level context.
"""
import os
from pathlib import Path
from typing import List, Optional

import numpy as np
import torch
import torch.nn as nn
from fastapi import FastAPI
from pydantic import BaseModel

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
CKPT_PATH = Path(__file__).parent / "checkpoints" / "scorer.pt"


class WordItem(BaseModel):
  id: str
  difficulty: float
  category: Optional[str] = None


class RecommendRequest(BaseModel):
  userLevel: int = 2
  k: int = 5
  recentAccuracy: float = 0.6
  words: List[WordItem]


class Scorer(nn.Module):
  def __init__(self, state_dim: int = 3, hidden: int = 64):
    super().__init__()
    self.net = nn.Sequential(
      nn.Linear(state_dim, hidden),
      nn.ReLU(),
      nn.Linear(hidden, hidden),
      nn.ReLU(),
      nn.Linear(hidden, 1),
    )

  def forward(self, x: torch.Tensor) -> torch.Tensor:
    # Returns shape [batch, 1]
    return self.net(x)


def load_model() -> Scorer:
  model = Scorer().to(DEVICE)
  if CKPT_PATH.exists():
    try:
      state = torch.load(CKPT_PATH, map_location=DEVICE)
      model.load_state_dict(state)
      print(f"Loaded scorer checkpoint: {CKPT_PATH}")
    except Exception as exc:  # pragma: no cover
      print(f"Failed to load checkpoint {CKPT_PATH}: {exc}")
  model.eval()
  return model


app = FastAPI(title="RL Vocab Recommender", version="0.1.0")
scorer = load_model()


def build_state(word: WordItem, user_level: int, recent_acc: float) -> np.ndarray:
  gap = word.difficulty - user_level
  user_level_norm = user_level / 5.0
  gap_norm = np.tanh(gap / 3.0)
  return np.array([user_level_norm, gap_norm, recent_acc], dtype=np.float32)


@app.get("/health")
async def health():
  return {"status": "ok", "device": str(DEVICE)}


@app.post("/recommend")
async def recommend(req: RecommendRequest):
  if not req.words:
    return {"recommendations": []}

  k = max(1, min(req.k, len(req.words)))
  states = np.stack([build_state(w, req.userLevel, req.recentAccuracy) for w in req.words])
  with torch.no_grad():
    x = torch.tensor(states, dtype=torch.float32, device=DEVICE)
    scores = scorer(x).squeeze(-1).cpu().numpy().tolist()

  # Add tiny noise to break ties so the same top-k is not always returned when scores are equal
  scores = [float(s + np.random.uniform(-1e-6, 1e-6)) for s in scores]

  ranked = sorted(zip(req.words, scores), key=lambda p: p[1], reverse=True)
  topk = ranked[:k]
  return {
    "recommendations": [
      {"wordId": w.id, "score": float(score), "category": w.category}
      for w, score in topk
    ]
  }


if __name__ == "__main__":
  import uvicorn

  uvicorn.run(
    "service:app",
    host="0.0.0.0",
    port=int(os.getenv("PORT", "8000")),
    reload=False,
  )
