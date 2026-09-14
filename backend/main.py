from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware

try:
    # Works when imported from project root:
    # python -m uvicorn backend.main:app
    from backend.schemas import PortData
    from backend.services.prediction import predict_congestion
    from backend.services.explanation import explain_congestion
    from backend.services.optimization import optimize_port
    from backend.services.forecast import generate_forecast
    from backend.services.crane_optimization import optimize_crane
    from backend.services.what_if import simulate_arrival_change
    from backend.services.alternative_routing import recommend_alternative_route
    from backend.services.operational_plan import generate_operational_plan

except ModuleNotFoundError:
    # Works when started from backend directory:
    # python -m uvicorn main:app
    from schemas import PortData
    from services.prediction import predict_congestion
    from services.explanation import explain_congestion
    from services.optimization import optimize_port
    from services.forecast import generate_forecast
    from services.crane_optimization import optimize_crane
    from services.what_if import simulate_arrival_change
    from services.alternative_routing import recommend_alternative_route
    from services.operational_plan import generate_operational_plan


app = FastAPI(
    title="SmartPort AI API",
    description="Predict. Explain. Optimise. Act.",
    version="1.0.0"
)


# ---------------------------------------------------------
# CORS
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# BASIC ENDPOINTS
# ---------------------------------------------------------

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


# ---------------------------------------------------------
# EXISTING PREDICTION ENDPOINT
# ---------------------------------------------------------

@app.post("/predict")
def predict(data: PortData):

    prediction = predict_congestion(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization
    )

    congestion_level = prediction["congestion_level"]

    explanation = explain_congestion(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization,
        congestion_level
    )

    optimization = optimize_port(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization,
        congestion_level,
        vessel="V204",
        current_berth=data.berth or "B03"
    )

    return {
        "prediction": prediction,
        "explanation": explanation,
        "optimization": optimization
    }


# ---------------------------------------------------------
# STRUCTURED PREDICTION API
# ---------------------------------------------------------

@app.post("/api/predict")
def api_predict(data: PortData):

    prediction = predict_congestion(
        data.vessel_count,
        data.container_count,
        data.avg_waiting_time,
        data.berth_utilization
    )

    return {
        "berth": data.berth or "B03",
        "risk": prediction["congestion_level"].upper(),
        "probability": prediction["probability"],
        "confidence": prediction["confidence"],
        "factors": prediction["factors"],
        "ml_features_used": [
            "vessel_count",
            "container_count",
            "avg_waiting_time",
            "berth_utilization"
        ],
        "additional_operational_context": {
            "crane_availability": data.crane_availability,
            "vessel_arrival_density": data.vessel_arrival_density
        }
    }


# ---------------------------------------------------------
# 72-HOUR CONGESTION FORECAST
# ---------------------------------------------------------

@app.get("/api/congestion")
def get_congestion_forecast(
    vessel_count: int = Query(80, ge=1),
    container_count: int = Query(400, ge=1),
    avg_waiting_time: float = Query(18, ge=0),
    berth_utilization: float = Query(87, ge=0, le=100),
    berth: str = Query("B03")
):

    prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization
    )

    forecast = generate_forecast(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        berth=berth,
        hours=72
    )

    return {
        "berth": berth,
        "risk": prediction["congestion_level"].upper(),
        "probability": prediction["probability"],
        "confidence": prediction["confidence"],
        "reasons": prediction["factors"],
        "forecast_hours": 72,
        "forecast": forecast
    }


# ---------------------------------------------------------
# BERTH OPTIMISATION
# ---------------------------------------------------------

@app.get("/api/optimization")
def get_optimization(
    vessel_count: int = Query(80, ge=1),
    container_count: int = Query(400, ge=1),
    avg_waiting_time: float = Query(18, ge=0),
    berth_utilization: float = Query(87, ge=0, le=100),
    congestion_level: str = Query("High"),
    vessel: str = Query("V204"),
    current_berth: str = Query("B03")
):

    return optimize_port(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        congestion_level=congestion_level,
        vessel=vessel,
        current_berth=current_berth
    )


# ---------------------------------------------------------
# CRANE OPTIMISATION
# ---------------------------------------------------------

@app.get("/api/crane")
def get_crane_optimization(
    vessel: str = Query("V204"),
    current_berth: str = Query("B03"),
    recommended_berth: str = Query("B04"),
    container_count: int = Query(400, ge=1),
    congestion_level: str = Query("High")
):

    return optimize_crane(
        vessel=vessel,
        current_berth=current_berth,
        recommended_berth=recommended_berth,
        container_count=container_count,
        congestion_level=congestion_level
    )


# ---------------------------------------------------------
# WHAT-IF SIMULATION
# ---------------------------------------------------------

@app.post("/api/what-if")
def what_if_simulation(
    vessel: str = Query("V204"),
    arrival_time_change_hours: float = Query(-3),
    vessel_count: int = Query(80, ge=1),
    container_count: int = Query(400, ge=1),
    avg_waiting_time: float = Query(18, ge=0),
    berth_utilization: float = Query(87, ge=0, le=100),
    berth: str = Query("B03")
):

    return simulate_arrival_change(
        vessel=vessel,
        arrival_time_change_hours=arrival_time_change_hours,
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        berth=berth
    )


# ---------------------------------------------------------
# 72-HOUR OPERATIONAL PLAN
# ---------------------------------------------------------

@app.get("/api/plan")
def get_operational_plan(
    vessel_count: int = Query(80, ge=1),
    container_count: int = Query(400, ge=1),
    avg_waiting_time: float = Query(18, ge=0),
    berth_utilization: float = Query(87, ge=0, le=100),
    berth: str = Query("B03"),
    vessel: str = Query("V204")
):

    forecast = generate_forecast(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        berth=berth,
        hours=72
    )

    prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization
    )

    congestion_level = prediction["congestion_level"]

    optimization = optimize_port(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        congestion_level=congestion_level,
        vessel=vessel,
        current_berth=berth
    )

    recommended_berth = optimization["recommended_berth"]

    crane_optimization = optimize_crane(
        vessel=vessel,
        current_berth=berth,
        recommended_berth=recommended_berth,
        container_count=container_count,
        congestion_level=congestion_level
    )

    recommended_projected_utilization = next(
        (
            item["projected_utilization"]
            for item in optimization["berth_analysis"]
            if item["berth"] == recommended_berth
        ),
        berth_utilization
    )

    routing = recommend_alternative_route(
        vessel=vessel,
        current_berth=berth,
        recommended_berth=recommended_berth,
        congestion_level=congestion_level,
        current_utilization=berth_utilization,
        recommended_utilization=recommended_projected_utilization,
        avg_waiting_time=avg_waiting_time
    )

    plan = generate_operational_plan(
        forecast=forecast,
        optimization=optimization,
        crane_optimization=crane_optimization,
        routing=routing
    )

    return {
        "horizon_hours": 72,
        "prediction": prediction,
        "optimization": optimization,
        "crane_optimization": crane_optimization,
        "routing": routing,
        "plan": plan["actions"]
    }