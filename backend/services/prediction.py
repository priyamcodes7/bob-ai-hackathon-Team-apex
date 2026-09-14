import joblib
import pandas as pd
from pathlib import Path

# Load the trained ML model
model_path = Path(__file__).resolve().parents[1] / "congestion_model.pkl"
model = joblib.load(model_path)


def predict_congestion(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float
):
    # Create input DataFrame
    input_data = pd.DataFrame([
        {
            "vessel_count": vessel_count,
            "container_count": container_count,
            "avg_waiting_time": avg_waiting_time,
            "berth_utilization": berth_utilization
        }
    ])

    # Predict congestion class
    prediction = model.predict(input_data)
    congestion_level = str(prediction[0])

    # Get actual ML probabilities
    probability = model.predict_proba(input_data)[0]

    # Find the probability of the predicted class
    classes = model.classes_.tolist()
    predicted_index = classes.index(congestion_level)
    confidence = float(probability[predicted_index])

    # Important input factors
    factors = []

    if berth_utilization >= 80:
        factors.append(f"High berth utilization ({berth_utilization:.0f}%)")
    elif berth_utilization >= 60:
        factors.append(f"Moderate berth utilization ({berth_utilization:.0f}%)")

    if avg_waiting_time >= 15:
        factors.append(f"High average waiting time ({avg_waiting_time:.1f} hours)")
    elif avg_waiting_time >= 8:
        factors.append(f"Moderate average waiting time ({avg_waiting_time:.1f} hours)")

    if container_count >= 350:
        factors.append(f"High container volume ({container_count})")
    elif container_count >= 200:
        factors.append(f"Moderate container volume ({container_count})")

    if vessel_count >= 70:
        factors.append(f"High vessel count ({vessel_count})")
    elif vessel_count >= 40:
        factors.append(f"Moderate vessel count ({vessel_count})")

    if not factors:
        factors.append("Port conditions are currently within normal limits")

    return {
        "congestion_level": congestion_level,
        "probability": round(confidence, 3),
        "confidence": round(confidence, 3),
        "factors": factors
    }