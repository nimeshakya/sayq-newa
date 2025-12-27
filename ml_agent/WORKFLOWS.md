# ML Workflows (SayQ-Newa)

This document summarizes end-to-end workflows, data sources, storage, and execution steps for the three main ML pipelines.

---

## 1) Expertise Level Classifier (updateModel.ipynb)

### Purpose

Predict user expertise level (0-5) from placement/exam features.

### Data Sources (MongoDB)

- `exams`: per-user test stats (total_questions, correct_answers, accuracy, easy/medium/hard accuracy, avg_time_per_question)
- `users`: `expertise_lvl` (target)

### Workflow Diagram

```
[Load .env → MONGO_URI]
        |
        v
[Connect to MongoDB]
        |
        v
[Load exams + users]
        |
        v
[Feature build & merge]
  - 7 numeric features
  - target = expertise_lvl (0-5)
        |
        v
[Train/Test Split]
  - stratified 80/20
        |
        v
[Train CatBoost MultiClass]
  - iterations=600, depth=6, lr=0.05, l2=5
        |
        v
[Evaluate]
  - macro F1, confusion matrix
        |
        v
[Persist]
  - MongoDB ml_models (model_name=expertise_classifier)
  - metadata: features, classes, F1, timestamp
```

### Evaluation & Metrics

- **Split**: stratified 80/20 train-test
- **Primary**: Macro F1 (multi-class)
- **Diagnostics**: Confusion matrix, per-class precision/recall
- **Test cells**: real-data test + comprehensive test suite (load, multi-predict, edge cases)

### Cell-by-Cell Breakdown

| Cell | Activity                                                                                                         |
| ---- | ---------------------------------------------------------------------------------------------------------------- |
| 1    | Import libraries (pandas, numpy, CatBoost, sklearn)                                                              |
| 2    | Load .env, connect to MongoDB, verify connection                                                                 |
| 3    | Load `exams` + `users`, merge on userID, drop missing, select 7 features + target                                |
| 4    | Label encode target, train-test split (80/20 stratified), train CatBoost (600 iter, depth 6), evaluate macro F1  |
| 5    | Save model to MongoDB `ml_models` collection with metadata                                                       |
| 6    | Define `predict_expertise_level()` and `load_model_from_mongo()` utility functions                               |
| 7    | Real data test: predict on first exam record                                                                     |
| 8    | Comprehensive test suite: model load, multiple predictions, performance metrics, test set validation, edge cases |

### Key Functions

- `predict_expertise_level(user_features)` – load from MongoDB, run prediction, return class + probs
- `load_model_from_mongo()` – fetch latest model binary + metadata

### Outputs

- Mongo: `ml_models` doc with pickled CatBoost + metadata
- Local (optional backup): pickled model

---

## 2) RL Vocabulary Recommender (rl_vocab_agent.ipynb)

### Purpose

DQN agent to recommend words based on user level and recent accuracy.

### Data Sources (MongoDB)

- `users`: `expertise_lvl`
- `results`: quiz history (`isCorrect`, `createdDate`)
- `words`: `newari_word`, `expertise_lvl`, `category`

### State & Reward

- State: `[user_level_norm, difficulty_gap_norm, recent_accuracy]`
- Reward: `r = 1.0 * correct - 0.5 * |gap|`

### Workflow Diagram

```
[Load .env → MONGO_URI]
        |
        v
[Load words from MongoDB]
        |
        v
[Sample real users per episode]
  - fetch expertise_lvl from users
  - recent accuracy from results
        |
        v
[Env step]
  - state → action (word index)
  - simulated correctness prob vs gap
  - reward computed
        |
        v
[DQN Training]
  - replay buffer, target net
  - epsilon decay 0.9→0.05, gamma=0.95
        |
        v
[Evaluation]
  - multiple real users, summary by level
        |
        v
[Persist]
  - MongoDB ml_models (model_name=dqn_vocab_agent)
  - Local checkpoints/dqn_vocab.pt
```

### Evaluation & Metrics

- **Offline eval**: average reward and accuracy over multiple real users
- **Per-level summary**: aggregates reward/accuracy by user expertise level
- **Training curves**: `reward_log`, `loss_log` (loss vs updates)
- **Recommendation checks**: top-5 recommendations with word-level metadata

### Cell-by-Cell Breakdown

| Cell | Activity                                                                                                           |
| ---- | ------------------------------------------------------------------------------------------------------------------ |
| 1    | Markdown: notebook intro                                                                                           |
| 2    | Markdown: "1. Setup and Imports"                                                                                   |
| 3    | Imports (PyTorch, pandas, numpy, MongoDB), load .env, verify GPU/CPU                                               |
| 4    | Markdown: "2. Environment Definition"                                                                              |
| 5    | Load words from MongoDB, define `VocabEnv` (fetches real user level + accuracy), helper functions for MongoDB data |
| 6    | Markdown: Reward & state definition                                                                                |
| 7    | DQN network definition, action selection ε-greedy                                                                  |
| 8    | Experience replay buffer implementation                                                                            |
| 9    | Training loop: sample real users, optimize model, update target net every 5 episodes                               |
| 10   | Evaluation: test on multiple real users, summary by expertise level                                                |
| 11   | Model persistence: save to MongoDB + local checkpoint, load from Mongo (fallback to local)                         |
| 12   | Unit tests (reset, step, buffer, forward)                                                                          |
| 13   | Recommendation function with real user testing, top-5 recommendations                                              |

### Key Functions

- `VocabEnv` – environment using real user data
- `select_action(q_net, state, epsilon, action_dim)` – ε-greedy
- `recommend_word_for_user(user_id, q_net, words_df, epsilon)` – returns word + metadata
- `save_checkpoint()` / `load_checkpoint()` – dual storage (Mongo, local)

### Outputs

- Mongo: `ml_models` doc with Torch state dict + metadata (action_dim, state_dim, num_episodes, etc.)
- Local: `ml_agent/checkpoints/dqn_vocab.pt`

---

## 3) Vocab Scorer (train_from_mongo_full.ipynb)

### Purpose

Supervised scorer (MLP regression) that estimates suitability/reward of (user, word) pairs.

### Data Sources (MongoDB)

- `users`: `expertise_lvl`
- `results`: recent accuracy per user
- `words`: word difficulty/category
- `userwordprogresses`: mastery/attempts (for fallback stats)

### State/Target

- State: `[user_level_norm, gap_norm, recent_acc]`
- Target: heuristic reward `(1 - |gap|/5) * recent_acc`

### Workflow Diagram

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
[Persist]
  - MongoDB ml_models (model_name=vocab_scorer)
  - Local checkpoints/scorer.pt
        |
        v
[Load Test]
  - verify deserialization from Mongo
```

### Evaluation & Metrics

- **Primary**: Final training loss (MSE) after 50 epochs
- **Dataset stats**: number of training samples (users × words), state/target shapes
- **Suggested** (add-on): MAE and R² for interpretability

### Cell-by-Cell Breakdown

| Cell | Activity                                                                                                                 |
| ---- | ------------------------------------------------------------------------------------------------------------------------ |
| 1    | Markdown: notebook intro, describes scorer purpose                                                                       |
| 2    | Imports (PyTorch, pandas, numpy, MongoDB); setup DEVICE, checkpoint paths                                                |
| 3    | Load .env, get MONGO_URI, verify env setup                                                                               |
| 4    | Fetch collections: `words`, `users`, `results`, `userwordprogresses`                                                     |
| 5    | Build user profiles: per-user expertise_lvl and recent accuracy (last 20 results)                                        |
| 6    | Generate training samples (users × words), define `build_state()`, train MLP scorer (50 epochs), save to MongoDB + local |
| 7    | Load and test model from MongoDB                                                                                         |

### Key Functions

- `build_state(user_level, difficulty, recent_acc)` – construct feature vector
- `save_scorer_to_mongo()` / `load_scorer_from_mongo()` – dual storage

### Outputs

- Mongo: `ml_models` doc with Torch state dict + metadata (epochs, final_loss, samples)
- Local: `ml_agent/checkpoints/scorer.pt`

---

## Storage Summary

- **Primary**: MongoDB `ml_models` collection (all models)
- **Backup**: Local `ml_agent/checkpoints/` for Torch models
- Load priority: MongoDB first, fallback to local file

---

## Quick Run Order (per notebook)

- `updateModel.ipynb`: run cells 1→6 (and test cells if desired)
- `rl_vocab_agent.ipynb`: run cells 1→8 for training/persistence; cell 10 for recommendations
- `train_from_mongo_full.ipynb`: run cells 1→6

---

## Notes

- Ensure `MONGO_URI` is set in `.env` or environment.
- MongoDB saves include metadata for traceability (training_date, sample counts, metrics).
- Local checkpoints are kept for offline use; production should load from MongoDB.
