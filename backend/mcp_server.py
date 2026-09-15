from mcp.server.mcpserver import MCPServer

from backend.services.prediction import predict_congestion
from backend.services.forecast import generate_forecast
from backend.services.optimization import optimize_port
from backend.services.crane_optimization import optimize_crane
from backend.services.what_if import simulate_arrival_change
from backend.services.alternative_routing import recommend_alternative_route
from backend.services.operational_plan import generate_operational_plan


mcp = MCPServer(
    "SmartPort AI",
    instructions=(
        "SmartPort AI provides congestion prediction, 72-hour forecasting, "
        "berth optimisation, crane optimisation, alternative berth routing, "
        "what-if simulation, and 72-hour operational planning."
    ),
)


@mcp.tool()
def smartport_congestion(
    vessel_count: int = 80,
    container_count: int = 400,
    avg_waiting_time: float = 18,
    berth_utilization: float = 87,
    berth: str = "B03",
) -> dict:
    """Predict berth congestion and generate a 72-hour forecast."""

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
        "risk": prediction["congestion_level"].upper(),
        "probability": prediction["probability"],
        "reasons": prediction["factors"],
        "forecast_hours": 72,
        "forecast": forecast,
    }


@mcp.tool()
def smartport_optimization(
    vessel_count: int = 80,
    container_count: int = 400,
    avg_waiting_time: float = 18,
    berth_utilization: float = 87,
    congestion_level: str = "High",
    vessel: str = "V204",
    current_berth: str = "B03",
) -> dict:
    """Find the best operational berth for a vessel."""

    return optimize_port(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        congestion_level=congestion_level,
        vessel=vessel,
        current_berth=current_berth,
    )


@mcp.tool()
def smartport_crane(
    vessel: str = "V204",
    current_berth: str = "B03",
    recommended_berth: str = "B04",
    container_count: int = 400,
    congestion_level: str = "High",
) -> dict:
    """Recommend an available crane for the selected berth."""

    return optimize_crane(
        vessel=vessel,
        current_berth=current_berth,
        recommended_berth=recommended_berth,
        container_count=container_count,
        congestion_level=congestion_level,
    )


@mcp.tool()
def smartport_what_if(
    vessel: str = "V204",
    arrival_time_change_hours: float = -3,
    vessel_count: int = 80,
    container_count: int = 400,
    avg_waiting_time: float = 18,
    berth_utilization: float = 87,
    berth: str = "B03",
) -> dict:
    """Simulate an arrival-time change and compare congestion."""

    return simulate_arrival_change(
        vessel=vessel,
        arrival_time_change_hours=arrival_time_change_hours,
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        berth=berth,
    )


@mcp.tool()
def smartport_operational_plan(
    vessel_count: int = 80,
    container_count: int = 400,
    avg_waiting_time: float = 18,
    berth_utilization: float = 87,
    berth: str = "B03",
    vessel: str = "V204",
) -> dict:
    """Generate a coordinated 72-hour operational plan."""

    forecast = generate_forecast(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        berth=berth,
        hours=72,
    )

    prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
    )

    optimization = optimize_port(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
        congestion_level=prediction["congestion_level"],
        vessel=vessel,
        current_berth=berth,
    )

    recommended_berth = optimization["recommended_berth"]

    crane_optimization = optimize_crane(
        vessel=vessel,
        current_berth=berth,
        recommended_berth=recommended_berth,
        container_count=container_count,
        congestion_level=prediction["congestion_level"],
    )

    recommended_utilization = next(
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
        congestion_level=prediction["congestion_level"],
        current_utilization=berth_utilization,
        recommended_utilization=recommended_utilization,
        avg_waiting_time=avg_waiting_time,
    )

    plan = generate_operational_plan(
        forecast=forecast,
        optimization=optimization,
        crane_optimization=crane_optimization,
        routing=routing,
    )

    return {
        "horizon_hours": 72,
        "prediction": prediction,
        "optimization": optimization,
        "crane_optimization": crane_optimization,
        "routing": routing,
        "plan": plan["actions"],
    }


if __name__ == "__main__":
    mcp.run()
