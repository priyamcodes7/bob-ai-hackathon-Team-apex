import joblib
import pandas as pd
from pathlib import Path

model_path = Path(__file__).resolve().parents[1] / "congestion_model.pkl"
model = joblib.load(model_path)


def predict_congestion(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float
):
    input_data = pd.DataFrame([
        {
            "vessel_count": vessel_count,
            "container_count": container_count,
            "avg_waiting_time": avg_waiting_time,
            "berth_utilization": berth_utilization
        }
    ])

    prediction = model.predict(input_data)

    return {
        "congestion_level": prediction[0]
    }