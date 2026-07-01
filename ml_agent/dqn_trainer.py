# trainer.py
import os
import io
import random
from pathlib import Path
from datetime import datetime
from dataclasses import dataclass
from typing import List, Tuple, Dict, Optional

import numpy as np
import pandas as pd
import torch
import torch.nn as nn
import torch.optim as optim
from pymongo import MongoClient

DEVICE = torch.device("cuda" if torch.cuda.is_available() else "cpu")
SEED = 42

# Ensure deterministic behaviour
random.seed(SEED)
np.random.seed(SEED)
torch.manual_seed(SEED)

@dataclass
class VocabEnvConfig:
    max_steps: int = 20
    alpha_reward: float = 1.0
    beta_gap: float = 0.5


class VocabEnv:
    """Environment initialized exclusively from real MongoDB user data."""
    def __init__(self, words: pd.DataFrame, mongo_uri: str, user_id: str, config: Optional[VocabEnvConfig] = None):
        self.words = words.reset_index(drop=True)
        self.config = config or VocabEnvConfig()
        self.mongo_uri = mongo_uri
        self.user_id = user_id
        
        # Retrieve user attributes from MongoDB
        self.user_level = self._get_user_expertise(user_id)
        self.initial_accuracy = self._get_user_recent_accuracy(user_id)
        
        self.step_count = 0
        self.history: List[Dict] = []
        self.state_dim = 2  # [user_level_norm, recent_accuracy]

    def _get_user_expertise(self, user_id: str) -> int:
        client = MongoClient(self.mongo_uri)
        db = client.get_default_database() if "test" not in self.mongo_uri else client["test"]
        from bson import ObjectId
        user = db["users"].find_one({"_id": ObjectId(user_id)})
        if not user:
            raise ValueError(f"User {user_id} not found in database.")
        return int(user.get("expertise_lvl", 2))

    def _get_user_recent_accuracy(self, user_id: str, limit: int = 10) -> float:
        client = MongoClient(self.mongo_uri)
        db = client.get_default_database() if "test" not in self.mongo_uri else client["test"]
        from bson import ObjectId
        results = list(db["results"].find(
            {"userID": ObjectId(user_id)},
            {"isCorrect": 1, "createdDate": 1}
        ).sort("createdDate", -1).limit(limit))
        
        if not results:
            return 0.5  # Neutral default if the user has no history
        correct_count = sum(1 for r in results if r.get("isCorrect", False))
        return correct_count / len(results)

    def reset(self) -> np.ndarray:
        self.step_count = 0
        self.history.clear()
        return self._state()

    def _state(self) -> np.ndarray:
        recent_acc = np.mean([h["correct"] for h in self.history[-10:]]) if self.history else self.initial_accuracy
        user_level_norm = self.user_level / 5.0
        return np.array([user_level_norm, recent_acc], dtype=np.float32)

    def step(self, action_idx: int) -> Tuple[np.ndarray, float, bool, Dict]:
        self.step_count += 1
        difficulty = self.words.loc[action_idx, "difficulty"]
        gap = difficulty - self.user_level
        
        # Performance simulator based on user properties
        correct_prob = max(0.05, 0.9 - 0.15 * abs(gap))
        correct = np.random.rand() < correct_prob
        
        reward = self.config.alpha_reward * (1.0 if correct else 0.0) - self.config.beta_gap * abs(gap)
        self.history.append({"action": action_idx, "correct": float(correct), "gap": gap})
        
        done = self.step_count >= self.config.max_steps
        next_state = self._state()
        info = {"correct": correct, "difficulty": difficulty, "gap": gap}
        
        return next_state, reward, done, info


class DQN(nn.Module):
    def __init__(self, state_dim: int, action_dim: int, hidden: int = 64):
        super().__init__()
        self.net = nn.Sequential(
            nn.Linear(state_dim, hidden),
            nn.ReLU(),
            nn.Linear(hidden, hidden),
            nn.ReLU(),
            nn.Linear(hidden, action_dim),
        )

    def forward(self, x: torch.Tensor) -> torch.Tensor:
        return self.net(x)


@dataclass
class Transition:
    state: np.ndarray
    action: int
    reward: float
    next_state: np.ndarray
    done: bool


class ReplayBuffer:
    def __init__(self, capacity: int = 5000):
        self.capacity = capacity
        self.buffer: List[Transition] = []
        self.pos = 0

    def push(self, transition: Transition):
        if len(self.buffer) < self.capacity:
            self.buffer.append(transition)
        else:
            self.buffer[self.pos] = transition
        self.pos = (self.pos + 1) % self.capacity

    def sample(self, batch_size: int) -> Tuple[torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor, torch.Tensor]:
        batch = random.sample(self.buffer, batch_size)
        states = torch.tensor(np.stack([b.state for b in batch]), dtype=torch.float32, device=DEVICE)
        actions = torch.tensor([b.action for b in batch], dtype=torch.int64, device=DEVICE)
        rewards = torch.tensor([b.reward for b in batch], dtype=torch.float32, device=DEVICE)
        next_states = torch.tensor(np.stack([b.next_state for b in batch]), dtype=torch.float32, device=DEVICE)
        dones = torch.tensor([b.done for b in batch], dtype=torch.float32, device=DEVICE)
        return states, actions, rewards, next_states, dones

    def __len__(self):
        return len(self.buffer)


def load_words_from_db(mongo_uri: str) -> pd.DataFrame:
    client = MongoClient(mongo_uri)
    try:
        db = client.get_default_database()
    except Exception:
        db = client["test"]  # Fallback to "test" database if none is specified in URI
        
    words = list(db["words"].find({}))
    if not words:
        raise ValueError("No words found in database. Cannot construct environment.")
    
    return pd.DataFrame([
        {
            "word": w.get("newari_word", ""),
            "difficulty": w.get("expertise_lvl", 3),
            "category": w.get("category", "general"),
            "_id": str(w.get("_id"))
        }
        for w in words
    ])


def select_action(q_net: DQN, state: np.ndarray, epsilon: float, action_dim: int) -> int:
    if random.random() < epsilon:
        return random.randrange(action_dim)
    with torch.no_grad():
        s = torch.tensor(state, dtype=torch.float32, device=DEVICE).unsqueeze(0)
        q_values = q_net(s)
        return int(torch.argmax(q_values, dim=1).item())


def train_dqn_model(mongo_uri: str, num_episodes: int = 40) -> Dict:
    """Executes the offline DQN training process using exclusively real MongoDB user contexts."""
    
    words_df = load_words_from_db(mongo_uri)
    action_dim = len(words_df)
    state_dim = 2  # [user_level_norm, recent_accuracy]
    
    # Initialize networks
    q_net = DQN(state_dim=state_dim, action_dim=action_dim).to(DEVICE)
    target_net = DQN(state_dim=state_dim, action_dim=action_dim).to(DEVICE)
    target_net.load_state_dict(q_net.state_dict())
    
    optimizer = optim.Adam(q_net.parameters(), lr=1e-3)
    loss_fn = nn.MSELoss()
    buffer = ReplayBuffer(capacity=2000)
    
    # Fetch real users from MongoDB
    client = MongoClient(mongo_uri)
    db = client.get_default_database() if "test" not in mongo_uri else client["test"]
    users_list = list(db["users"].find({"expertise_lvl": {"$exists": True, "$ne": None}}, {"_id": 1}))
    
    if not users_list:
        raise RuntimeError("No real users with a valid 'expertise_lvl' found in MongoDB. Training aborted.")
        
    user_ids = [str(u["_id"]) for u in users_list]
    
    # Hyperparameters
    gamma = 0.95
    batch_size = 32
    epsilon_start, epsilon_end, epsilon_decay = 0.9, 0.05, 0.95
    tau = 0.005  # Soft target update step
    
    loss_log = []
    reward_log = []
    
    print(f"Beginning offline DQN training on {len(user_ids)} real users...")
    
    for episode in range(num_episodes):
        user_id = np.random.choice(user_ids)
        env = VocabEnv(words_df, mongo_uri, user_id=user_id)
        state = env.reset()
        epsilon = max(epsilon_end, epsilon_start * (epsilon_decay ** episode))
        ep_reward = 0.0
        
        for t in range(env.config.max_steps):
            action = select_action(q_net, state, epsilon, action_dim)
            next_state, reward, done, info = env.step(action)
            buffer.push(Transition(state, action, reward, next_state, done))
            
            # Optimization step
            if len(buffer) >= batch_size:
                states, actions, rewards, next_states, dones = buffer.sample(batch_size)
                q_values = q_net(states).gather(1, actions.unsqueeze(1)).squeeze(1)
                
                with torch.no_grad():
                    next_q = target_net(next_states).max(1)[0]
                    target = rewards + gamma * next_q * (1 - dones)
                    
                loss = loss_fn(q_values, target)
                optimizer.zero_grad()
                loss.backward()
                optimizer.step()
                
                loss_log.append(loss.item())
                
                # Soft target network update
                for target_param, local_param in zip(target_net.parameters(), q_net.parameters()):
                    target_param.data.copy_(tau * local_param.data + (1.0 - tau) * target_param.data)
            
            ep_reward += reward
            state = next_state
            if done:
                break
                
        reward_log.append(ep_reward)

    # Save to Local System
    ckpt_dir = Path(__file__).parent / "checkpoints"
    ckpt_dir.mkdir(parents=True, exist_ok=True)
    local_path = ckpt_dir / "dqn_vocab.pt"
    
    torch.save({
        "q_net": q_net.state_dict(),
        "target_net": target_net.state_dict(),
        "optimizer": optimizer.state_dict(),
        "action_dim": action_dim,
        "state_dim": state_dim
    }, local_path)
    
    # Save to MongoDB
    model_buffer = io.BytesIO()
    torch.save({
        "q_net": q_net.state_dict(),
        "target_net": target_net.state_dict(),
        "optimizer": optimizer.state_dict(),
        "action_dim": action_dim,
        "state_dim": state_dim,
    }, model_buffer)
    model_buffer.seek(0)
    
    db["ml_models"].update_one(
        {"model_name": "dqn_vocab_agent"},
        {"$set": {
            "model_name": "dqn_vocab_agent",
            "model_type": "pytorch_dqn",
            "model_data": model_buffer.read(),
            "metadata": {
                "action_dim": action_dim,
                "state_dim": state_dim,
                "num_episodes": num_episodes,
                "gamma": gamma,
                "training_date": datetime.utcnow(),
                "num_words": len(words_df),
            },
            "updated_at": datetime.utcnow()
        }},
        upsert=True
    )
    
    print("Training process finished and saved successfully.")
    return {
        "status": "success",
        "episodes": num_episodes,
        "avg_loss": float(np.mean(loss_log)) if loss_log else 0.0,
        "avg_reward": float(np.mean(reward_log)),
        "local_path": str(local_path)
    }