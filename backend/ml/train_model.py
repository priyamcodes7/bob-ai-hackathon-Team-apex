import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import accuracy_score
import joblib


# Training data
data = {
    "vessel_count": [10, 20, 30, 40, 50, 60, 70, 80, 90, 100],
    "container_count": [50, 80, 120, 150, 200, 250, 300, 350, 400, 500],
    "avg_waiting_time": [2, 3, 5, 6, 10, 12, 15, 18, 20, 25],
    "berth_utilization": [20, 30, 35, 45, 60, 65, 70, 80, 90, 95],
    "congestion_level": [
        "Low",
        "Low",
        "Low",
        "Medium",
        "Medium",
        "Medium",
        "High",
        "High",
        "High",
        "High"
    ]
}

df = pd.DataFrame(data)

# Features and target
X = df[
    [
        "vessel_count",
        "container_count",
        "avg_waiting_time",
        "berth_utilization"
    ]
]

y = df["congestion_level"]

# Split data
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42
)

# Create ML model
model = RandomForestClassifier(
    n_estimators=100,
    random_state=42
)

# Train model
model.fit(X_train, y_train)

# Test model
predictions = model.predict(X_test)

accuracy = accuracy_score(y_test, predictions)

print("Model trained successfully!")
print("Accuracy:", accuracy)

# Save model
joblib.dump(model, "congestion_model.pkl")

print("Model saved as congestion_model.pkl")