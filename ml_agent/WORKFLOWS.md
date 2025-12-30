# ML Workflows (SayQ-Newa)

This document summarizes end-to-end workflows, data sources, storage, and execution steps for the three main ML pipelines.

---

## 1) Expertise Level Classifier (updateModel.ipynb)

### Purpose

Classify user expertise level (0-5) from placement test performance metrics using CatBoost.

### Data Sources (MongoDB)

- `exams`: exam records with features (total_questions, correct_answers, accuracy, easy/medium/hard accuracy, avg_time_per_question)
- `users`: user profiles with target `expertise_lvl` (0-5)

### Workflow Diagram

```
[Load .env → MONGO_URI]
        |
        v
[Connect to MongoDB]
        |
        v
[Load exams + users collections]
        |
        v
[Merge on userID]
  - 7 exam features
  - target = expertise_lvl (0-5)
        |
        v
[Train/Test Split]
  - stratified 80/20
  - MultiClass problem (6 classes: 0-5)
        |
        v
[Train CatBoost Classifier]
  - iterations: 600
  - depth: 6
  - lr: 0.05, l2_leaf_reg: 5
  - loss: MultiClass
  - metric: TotalF1
        |
        v
[Evaluate]
  - Macro F1 Score
  - Classification Report (precision, recall, f1 per class)
  - Confusion Matrix
        |
        v
[Persist to MongoDB]
  - ml_models collection
  - model_name: "expertise_level_classifier"
  - stores: pickled model, features, classes, F1, timestamp, hyperparameters
```

### Evaluation & Metrics

- **Split Strategy**: Stratified 80/20 train-test (preserves class distribution)
- **Primary Metric**: Macro F1 Score (unweighted average per class)
- **Diagnostics**:
  - Per-class precision/recall/f1
  - Confusion matrix heatmap
  - Class distribution validation

### Cell-by-Cell Breakdown

| Cell | Activity                                                                                       |
| ---- | ---------------------------------------------------------------------------------------------- |
| 1    | Import libraries (pandas, numpy, CatBoost, sklearn, pickle, datetime)                          |
| 2    | Load `.env`, connect to MongoDB, verify connection, get database                               |
| 3    | Load `exams` collection, convert to DataFrame, rename `average_time` → `avg_time_per_question` |
| 4    | Load `users`, merge with exams on userID, validate merged dataset, feature selection           |
| 5    | Train CatBoost with stratified 80/20 split, evaluate on test set, save to MongoDB `ml_models`  |
| 6    | Define `predict_expertise_level(user_features)` function for inference                         |
| 7    | Define `load_model_from_mongo()` function with metadata logging                                |
| 8    | Test loading from MongoDB and predict on real exam data                                        |

### Key Functions

- `predict_expertise_level(user_features: dict)` → returns `{expertise_level, confidence, probabilities}`
- `load_model_from_mongo()` → loads model, features, classes from MongoDB with error handling

### Inputs to predict_expertise_level()

```python
{
  "total_questions": int,
  "correct_answers": int,
  "accuracy": float (0-1),
  "easy_accuracy": float (0-1),
  "medium_accuracy": float (0-1),
  "hard_accuracy": float (0-1),
  "avg_time_per_question": float (seconds)
}
```

### Outputs

- **MongoDB**: `ml_models` collection document
  - `model_name`: "expertise_level_classifier"
  - `model_binary`: pickled CatBoost model
  - `features`: list of 7 feature names
  - `target_classes`: [0, 1, 2, 3, 4, 5]
  - `macro_f1_score`: float
  - `timestamp`: datetime
  - `hyperparameters`: dict with model settings

---

## 2) RL Vocabulary Recommender (agent.ipynb)

### Purpose

Q-Learning agent to recommend optimal word/category combinations for user learning based on accuracy and difficulty.

### Data Sources

- Local JSON: `data.json` (word list with `category`, `expertise_lvl`)
- Runtime: `accuracy` (user's current performance state)

### State & Reward

- **State**: `int(accuracy * 10)` → discretized into 10 levels (0-9)
- **Actions**: All combinations of (category, expertise_lvl) pairs
- **Reward**: Multi-component function
  - Correctness: +1 if correct, -1 if incorrect
  - Response time: bonus up to +1 (faster = better)
  - Attempts penalty: -0.5 per extra attempt
  - Difficulty bonus: 0 (A1) → 1.0 (C2) for harder questions

### Workflow Diagram

```
[Load data.json]
        |
        v
[Generate actions]
  - all (category, difficulty) pairs
        |
        v
[Q-Learning Setup]
  - Q-table: [num_states × num_actions]
  - alpha=0.1, gamma=0.9, epsilon=1.0
        |
        v
[Training Loop (5000 episodes)]
  - current state from accuracy
  - ε-greedy action selection
  - simulate response (correctness, time, attempts)
  - compute reward
  - Q[s,a] ← Q[s,a] + α(r + γ max Q[s',a'] - Q[s,a])
  - epsilon decay (0.995)
        |
        v
[Policy Evaluation]
  - Extract optimal actions per state
  - Visualize Q-table convergence
```

### Evaluation & Metrics

- **Training dynamics**: Q-value updates per episode
- **Policy extraction**: best action (category, difficulty) for each state
- **Convergence**: epsilon → 0.05 (exploration → exploitation)

### Cell-by-Cell Breakdown

| Cell | Activity                                                                            |
| ---- | ----------------------------------------------------------------------------------- |
| 1    | Imports (numpy, pandas, random)                                                     |
| 2    | Load `data.json`, generate action set from all (category, difficulty) combos        |
| 3    | `simulate_response()`: model user correctness, response time, attempts              |
| 4    | `get_reward()`: multi-component reward (correctness + time + attempts + difficulty) |
| 5    | Q-Learning initialization: Q-table, hyperparameters (alpha, gamma, epsilon)         |
| 6    | Training loop: ε-greedy selection, response simulation, Q-update, decay epsilon     |
| 7+   | (Not yet implemented) Policy visualization, convergence analysis                    |

### Key Functions

- `simulate_response(action)` – returns (is_correct, response_time, attempts)
- `get_reward(is_correct, response_time, attempts, expertise_lvl)` – returns reward score
- Q-update: `Q[s,a] += alpha * (reward + gamma * max(Q[s']) - Q[s,a])`

### Outputs

- In-memory: Q-table (numpy array)
- **Suggested**: serialize Q-table for model persistence

### Notes

- Current implementation is simulation-based (no real user data)
- **TODO**: Integrate with MongoDB for real user data collection
- **TODO**: Add MongoDB persistence for trained Q-table
- **TODO**: Implement policy evaluation and visualization

---

## 3) Vocab Scorer (train_from_mongo_full.ipynb) [ARCHIVED]

**Status**: This notebook is no longer in the project. The RL approach in `agent.ipynb` has replaced this scorer with Q-Learning-based recommendations.

### Previous Purpose (Historical)

Supervised scorer (MLP regression) that estimated suitability/reward of (user, word) pairs using real MongoDB data.

### Data Sources (Was MongoDB)

- `users`: `expertise_lvl`
- `results`: recent accuracy per user
- `words`: word difficulty/category
- `userwordprogresses`: mastery/attempts

### Previous Workflow

```
[Load .env → MONGO_URI]
        |
        v
[Load users, results, words]
        |
        v
[Build user profiles]
  - expertise_lvl, recent_acc (last 20 results)
        |
        v
[Generate samples]
  - all users × all words
  - state vector + reward target
        |
        v
[Train MLP Scorer]
  - 3→64→64→1, epochs=50, MSE loss
        |
        v
[Persist to MongoDB]
  - ml_models (model_name=vocab_scorer)
  - Local checkpoints/scorer.pt
```

### Migration Path

Users should use the Q-Learning recommender in `agent.ipynb` instead, which has a simpler and more interpretable reward structure.

---

## Storage Summary

- **Primary**: MongoDB `ml_models` collection (persistence)
- **Backup**: Local `ml_agent/checkpoints/` for Torch models (if applicable)
- Load priority: Attempt MongoDB first, fallback to local file (if implemented)

---

## Quick Run Order

### updateModel.ipynb

Run cells in order 1→8 for full workflow:

1. Imports + constants
2. MongoDB connection setup
3. Load exams + users
4. Feature selection + validation
5. Train CatBoost, evaluate, save to MongoDB
6. Define prediction function
7. Define load function
8. Test with real data

### agent.ipynb

Run cells in order 1→6 for full workflow:

1. Imports (numpy, pandas, random)
2. Load `data.json`, generate action space
3. Define `simulate_response()` function
4. Define `get_reward()` function
5. Q-Learning initialization
6. Training loop (episodes=5000)
   7+ (Optional) Policy visualization and analysis

### Notebooks Currently Missing

- `train_from_mongo_full.ipynb` - archived, use `agent.ipynb` instead
- `rl_vocab_agent.ipynb` - merged into `agent.ipynb`, simplified to JSON-based Q-Learning

---

## Notes

- **MongoDB Connection**: Both notebooks require `.env` with `MONGO_URI` set (updateModel.ipynb only)
- **Local Data**: agent.ipynb uses local JSON file (`data.json`). No MongoDB required for this one.
- **Model Persistence**:
  - updateModel.ipynb: pickled CatBoost saved to MongoDB `ml_models`
  - agent.ipynb: Q-table stored in memory (save-to-file not yet implemented)
- **Recommendation**: Integrate agent.ipynb with MongoDB in future for persistent policy storage
- **Data Format**: Ensure MongoDB has proper collections (`exams`, `users` for updateModel; `words` for agent if adding MongoDB)
