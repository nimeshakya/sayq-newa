import os
import numpy as np
import joblib
from PIL import Image
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split

# Configuration
DATASET_DIR = "dataset"
IMAGE_SIZE = (64, 64)

def load_data():
    X = []
    y = []
    class_names = sorted(os.listdir(DATASET_DIR))
    class_map = {name: i for i, name in enumerate(class_names)}
    
    for class_name in class_names:
        class_dir = os.path.join(DATASET_DIR, class_name)
        if not os.path.isdir(class_dir):
            continue
        for img_name in os.listdir(class_dir):
            if not img_name.endswith(".png"):
                continue
            img_path = os.path.join(class_dir, img_name)
            img = Image.open(img_path).convert('L')
            img = img.resize(IMAGE_SIZE)
            img_array = np.array(img).flatten() / 255.0  # Flatten for RF
            X.append(img_array)
            y.append(class_map[class_name])
            
    return np.array(X), np.array(y), class_names

def train():
    print("Loading data...")
    X, y, class_names = load_data()
    print(f"Loaded {len(X)} samples across {len(class_names)} classes.")
    
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)
    
    print("Training Random Forest model...")
    model = RandomForestClassifier(
        n_estimators=200, 
        max_depth=25, 
        min_samples_split=4, 
        n_jobs=-1, 
        random_state=42
    )
    model.fit(X_train, y_train)
    
    accuracy = model.score(X_test, y_test)
    print(f"Model accuracy on test set: {accuracy:.2f}")
    
    # Save model and classes
    joblib.dump(model, "ranjana_rf_model.pkl")
    with open("classes.txt", "w", encoding="utf-8") as f:
        f.write("\n".join(class_names))
    print("Model trained and saved as ranjana_rf_model.pkl")
    return accuracy

if __name__ == "__main__":
    if not os.path.exists(DATASET_DIR):
        print("Run data_gen.py first!")
    else:
        train()
