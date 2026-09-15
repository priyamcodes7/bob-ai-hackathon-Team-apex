import os

from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field


try:
    # Repository-root startup:
    # python -m uvicorn backend.main:app --port 8000
    from backend.schemas import PortData
    from backend.services.prediction import predict_congestion
    from backend.services.explanation import explain_congestion
    from backend.services.optimization import optimize_port
    from backend.services.forecast import generate_forecast
    from backend.services.crane_optimization import optimize_crane
    from backend.services.what_if import simulate_arrival_change
    from backend.services.alternative_routing import (
        recommend_alternative_route,
    )
    from backend.services.operational_plan import (
        generate_operational_plan,
    )

except ModuleNotFoundError:
    # Backend-directory startup:
    # python -m uvicorn main:app --port 8000
    from schemas import PortData
    from services.prediction import predict_congestion
    from services.explanation import explain_congestion
    from services.optimization import optimize_port
    from services.forecast import generate_forecast
    from services.crane_optimization import optimize_crane
    from services.what_if import simulate_arrival_change
    from services.alternative_routing import (
        recommend_alternative_route,
    )
    from services.operational_plan import (
        generate_operational_plan,
    )


app = FastAPI(
    title="SmartPort AI API",
    description="Predict. Explain. Optimise. Act.",
    version="1.1.0",
)


# -------------------------------------------------------------------
# CORS
#
# Local frontend origins are always allowed.
# Production frontend origin can be overridden with FRONTEND_ORIGIN.
# -------------------------------------------------------------------
frontend_origin = os.getenv(
    "FRONTEND_ORIGIN",
    "https://bob-ai-hackathon-team-apex.vercel.app",
)

allowed_origins = [
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "http://localhost:5174",
    "http://127.0.0.1:5174",
    frontend_origin,
]

# Remove duplicates while preserving order.
allowed_origins = list(dict.fromkeys(allowed_origins))


app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# -------------------------------------------------------------------
# What-If request schema
# -------------------------------------------------------------------
class WhatIfRequest(BaseModel):
    vessel: str = Field(
        default="V204",
        min_length=1,
        max_length=50,
    )

    arrival_time_change_hours: float = Field(
        default=-3.0,
        ge=-72,
        le=72,
    )

    vessel_count: int = Field(
        default=80,
        ge=1,
    )

    container_count: int = Field(
        default=400,
        ge=1,
    )

    avg_waiting_time: float = Field(
        default=18.0,
        ge=0,
    )

    berth_utilization: float = Field(
        default=87.0,
        ge=0,
        le=100,
    )

    berth: str = Field(
        default="B03",
        min_length=1,
        max_length=20,
    )


# -------------------------------------------------------------------
# BASIC ENDPOINTS
# -------------------------------------------------------------------
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


# -------------------------------------------------------------------
# EXISTING PREDICTION ENDPOINT
# -------------------------------------------------------------------
@app.post("/predict")
def predict(data: PortData):

    prediction = predict_congestion(
        vessel_count=data.vessel_count,
        container_count=data.container_count,
        avg_waiting_time=data.avg_waiting_time,
        berth_utilization=data.berth_utilization,
    )

    congestion_level = prediction["congestion_level"]

    explanation = explain_congestion(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization,
        congestion_level,
    )

    optimization = optimize_port(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization,
        congestion_level,
        vessel="V204",
        current_berth=data.berth or "B03",
    )

    return {
        "prediction": prediction,
        "explanation": explanation,
        "optimization": optimization,
    }


# -------------------------------------------------------------------
# STRUCTURED PREDICTION API
# -------------------------------------------------------------------
@app.post("/api/predict")
def api_predict(data: PortData):

    prediction = predict_congestion(
        vessel_count=data.vessel_count,
        container_count=data.container_count,
        avg_waiting_time=data.avg_waiting_time,
        berth_utilization=data.berth_utilization,
    )

    return {
        "berth": data.berth or "B03",
        "risk": prediction["congestion_level"],
        "probability": prediction["probability"],
        "factors": prediction["factors"],
        "ml_features_used": [
            "vessel_count",
            "container_count",
            "avg_waiting_time",
            "berth_utilization",
        ],
        "additional_operational_context": {
            "crane_availability": data.crane_availability,
            "vessel_arrival_density": data.vessel_arrival_density,
        },
    }


# -------------------------------------------------------------------
# 72-HOUR CONGESTION FORECAST
# -------------------------------------------------------------------
@app.get("/api/congestion")
def get_congestion_forecast(
    vessel_count: int = Query(80, ge=1),
    container_count: int = Query(400, ge=1),
    avg_waiting_time: float = Query(18.0, ge=0),
    berth_utilization: float = Query(
        87.0,
        ge=0,
        le=100,
    ),
    berth: str = Query("B03"),
):

    prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
    )

    forecast = generate_forecast(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        berth=berth,
        hours=72,
    )

    return {
        "berth": berth,
        "risk": prediction["congestion_level"],
        "probability": prediction["probability"],
        "reasons": prediction["factors"],
        "forecast_hours": 72,
        "forecast": forecast,
    }


# -------------------------------------------------------------------
# BERTH OPTIMISATION
# -------------------------------------------------------------------
@app.get("/api/optimization")
def get_optimization(
    vessel_count: int = Query(80, ge=1),
    container_count: int = Query(400, ge=1),
    avg_waiting_time: float = Query(18.0, ge=0),
    berth_utilization: float = Query(
        87.0,
        ge=0,
        le=100,
    ),
    congestion_level: str = Query("HIGH"),
    vessel: str = Query("V204"),
    current_berth: str = Query("B03"),
):

    prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
    )

    # Use actual ML risk unless caller intentionally provides
    # a different operational classification.
    effective_risk = congestion_level or prediction["congestion_level"]

    return optimize_port(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        congestion_level=effective_risk,
        vessel=vessel,
        current_berth=current_berth,
    )


# -------------------------------------------------------------------
# CRANE OPTIMISATION
# -------------------------------------------------------------------
@app.get("/api/crane")
def get_crane_optimization(
    vessel: str = Query("V204"),
    current_berth: str = Query("B03"),
    recommended_berth: str = Query("B04"),
    container_count: int = Query(400, ge=1),
    congestion_level: str = Query("HIGH"),
):

    return optimize_crane(
        vessel=vessel,
        current_berth=current_berth,
        recommended_berth=recommended_berth,
        container_count=container_count,
        congestion_level=congestion_level,
    )


# -------------------------------------------------------------------
# WHAT-IF SIMULATION
#
# Final API contract uses a JSON request body.
# -------------------------------------------------------------------
@app.post("/api/what-if")
def what_if_simulation(data: WhatIfRequest):

    return simulate_arrival_change(
        vessel=data.vessel,
        arrival_time_change_hours=data.arrival_time_change_hours,
        vessel_count=data.vessel_count,
        container_count=data.container_count,
        avg_waiting_time=data.avg_waiting_time,
        berth_utilization=data.berth_utilization,
        berth=data.berth,
    )


# -------------------------------------------------------------------
# 72-HOUR OPERATIONAL PLAN
# -------------------------------------------------------------------
@app.get("/api/plan")
def get_operational_plan(
    vessel_count: int = Query(80, ge=1),
    container_count: int = Query(400, ge=1),
    avg_waiting_time: float = Query(18.0, ge=0),
    berth_utilization: float = Query(
        87.0,
        ge=0,
        le=100,
    ),
    berth: str = Query("B03"),
    vessel: str = Query("V204"),
):

    # ---------------------------------------------------------------
    # 1. 72-hour forecast
    # ---------------------------------------------------------------
    forecast = generate_forecast(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        berth=berth,
        hours=72,
    )

    # ---------------------------------------------------------------
    # 2. Current prediction
    # ---------------------------------------------------------------
    prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
    )

    congestion_level = prediction["congestion_level"]

    # ---------------------------------------------------------------
    # 3. Berth recommendation
    # ---------------------------------------------------------------
    optimization = optimize_port(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        congestion_level=congestion_level,
        vessel=vessel,
        current_berth=berth,
    )

    recommended_berth = optimization["recommended_berth"]

    # ---------------------------------------------------------------
    # 4. Crane recommendation based on SAME berth recommendation
    # ---------------------------------------------------------------
    crane_optimization = optimize_crane(
        vessel=vessel,
        current_berth=berth,
        recommended_berth=recommended_berth,
        container_count=container_count,
        congestion_level=congestion_level,
    )

    # ---------------------------------------------------------------
    # 5. Routing recommendation
    #
    # Current berth uses the same API input state.
    # Recommended berth uses the optimization result.
    # ---------------------------------------------------------------
    current_projected_utilization = next(
        (
            item["projected_utilization"]
            for item in optimization["berth_analysis"]
            if item["berth"] == berth
        ),
        berth_utilization,
    )

    recommended_projected_utilization = next(
        (
            item["projected_utilization"]
            for item in optimization["berth_analysis"]
            if item["berth"] == recommended_berth
        ),
        berth_utilization,
    )

    routing = recommend_alternative_route(
        vessel=vessel,
        current_berth=berth,
        recommended_berth=recommended_berth,
        congestion_level=congestion_level,
        current_utilization=current_projected_utilization,
        recommended_utilization=recommended_projected_utilization,
        avg_waiting_time=avg_waiting_time,
    )

    # ---------------------------------------------------------------
    # 6. Generate final coordinated operational actions
    # ---------------------------------------------------------------
    plan = generate_operational_plan(
        forecast=forecast,
        optimization=optimization,
        crane_optimization=crane_optimization,
        routing=routing,
    )

    # ---------------------------------------------------------------
    # Final response:
    # "actions" is intentionally TOP-LEVEL for frontend integration.
    # ---------------------------------------------------------------
    return {
        "horizon_hours": 72,
        "prediction": prediction,
        "optimization": optimization,
        "crane_optimization": crane_optimization,
        "routing": routing,
        "actions": plan["actions"],
    }