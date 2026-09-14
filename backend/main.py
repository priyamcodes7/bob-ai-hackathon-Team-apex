from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from schemas import PortData
from services.prediction import predict_congestion
from services.explanation import explain_congestion
from services.optimization import optimize_port


app = FastAPI(title="SmartPort AI API")


# Allow frontend to communicate with backend
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {
        "message": "SmartPort AI Backend is running!"
    }


@app.get("/health")
def health_check():
    return {
        "status": "healthy"
    }


@app.post("/predict")
def predict(data: PortData):

    # 1. Predict congestion
    prediction = predict_congestion(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization
    )

    congestion_level = prediction["congestion_level"]

    # 2. Explain prediction
    explanation = explain_congestion(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization,
        congestion_level
    )

    # 3. Optimize port operations
    optimization = optimize_port(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization,
        congestion_level
    )

    # 4. Return complete result
    return {
        "prediction": prediction,
        "explanation": explanation,
        "optimization": optimization
    }