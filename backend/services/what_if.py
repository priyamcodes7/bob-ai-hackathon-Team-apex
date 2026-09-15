from .prediction import predict_congestion
from .optimization import optimize_port
from .crane_optimization import optimize_crane
from .alternative_routing import recommend_alternative_route


def simulate_arrival_change(
    vessel: str,
    arrival_time_change_hours: float,
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    berth: str = "B03",
):
    """
    Scenario-based operational What-If simulation.

    This is NOT a causal model and NOT a physically accurate
    port simulator. Arrival-time effects use prototype
    heuristic assumptions.
    """

    # ---------------------------------------------------------------
    # 1. ORIGINAL SCENARIO
    # ---------------------------------------------------------------
    original_prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization,
    )

    # ---------------------------------------------------------------
    # 2. SIMULATE ARRIVAL-TIME CHANGE
    # ---------------------------------------------------------------
    simulated_vessel_count = max(
        1,
        round(
            vessel_count
            + arrival_time_change_hours * 2.0
        ),
    )

    simulated_waiting_time = max(
        0.5,
        round(
            avg_waiting_time
            + arrival_time_change_hours * 0.8,
            1,
        ),
    )

    simulated_berth_utilization = round(
        max(
            0.0,
            min(
                100.0,
                berth_utilization
                + arrival_time_change_hours * 1.5,
            ),
        ),
        1,
    )

    # ---------------------------------------------------------------
    # 3. SIMULATED ML PREDICTION
    # ---------------------------------------------------------------
    simulated_prediction = predict_congestion(
        vessel_count=simulated_vessel_count,
        container_count=container_count,
        avg_waiting_time=simulated_waiting_time,
        berth_utilization=simulated_berth_utilization,
    )

    original_risk = original_prediction["congestion_level"]
    simulated_risk = simulated_prediction["congestion_level"]

    original_probability = original_prediction["probability"]
    simulated_probability = simulated_prediction["probability"]

    probability_change = round(
        simulated_probability
        - original_probability,
        3,
    )

    risk_changed = original_risk != simulated_risk

    # ---------------------------------------------------------------
    # 4. OPTIMIZE BERTH FOR SIMULATED SCENARIO
    # ---------------------------------------------------------------
    optimization = optimize_port(
        vessel_count=simulated_vessel_count,
        container_count=container_count,
        avg_waiting_time=simulated_waiting_time,
        berth_utilization=simulated_berth_utilization,
        congestion_level=simulated_risk,
        vessel=vessel,
        current_berth=berth,
    )

    recommended_berth = optimization["recommended_berth"]

    # ---------------------------------------------------------------
    # 5. OPTIMIZE CRANE
    # ---------------------------------------------------------------
    crane = optimize_crane(
        vessel=vessel,
        current_berth=berth,
        recommended_berth=recommended_berth,
        container_count=container_count,
        congestion_level=simulated_risk,
    )

    # ---------------------------------------------------------------
    # 6. OPERATIONAL BERTH ROUTING
    # ---------------------------------------------------------------
    current_projected_utilization = next(
        (
            item["projected_utilization"]
            for item in optimization["berth_analysis"]
            if item["berth"] == berth
        ),
        simulated_berth_utilization,
    )

    recommended_projected_utilization = next(
        (
            item["projected_utilization"]
            for item in optimization["berth_analysis"]
            if item["berth"] == recommended_berth
        ),
        simulated_berth_utilization,
    )

    routing = recommend_alternative_route(
        vessel=vessel,
        current_berth=berth,
        recommended_berth=recommended_berth,
        congestion_level=simulated_risk,
        current_utilization=current_projected_utilization,
        recommended_utilization=recommended_projected_utilization,
        avg_waiting_time=simulated_waiting_time,
    )

    # ---------------------------------------------------------------
    # 7. FINAL RECOMMENDED ACTION
    # ---------------------------------------------------------------
    crane_name = crane.get("recommended_assignment")

    if risk_changed:
        recommended_action = (
            f"Arrival-time change moves congestion from "
            f"{original_risk} to {simulated_risk}. "
            f"Use berth {recommended_berth}"
        )

        if crane_name:
            recommended_action += (
                f" and assign crane {crane_name}."
            )
        else:
            recommended_action += "."

    elif routing.get("reroute_recommended"):
        recommended_action = (
            f"Congestion remains {simulated_risk}. "
            f"Move {vessel} from {berth} to "
            f"{recommended_berth}"
        )

        if crane_name:
            recommended_action += (
                f" and assign crane {crane_name}."
            )
        else:
            recommended_action += "."

    elif crane_name:
        recommended_action = (
            f"Keep {vessel} at {berth} and use "
            f"crane {crane_name}."
        )

    else:
        recommended_action = (
            "Keep the current berth and monitor "
            "operational conditions."
        )

    # ---------------------------------------------------------------
    # 8. IMPACT SUMMARY
    # ---------------------------------------------------------------
    impact = (
        f"Changing arrival time by "
        f"{arrival_time_change_hours:.1f} hours changes "
        f"the simulated vessel pressure, waiting time, "
        f"and berth utilization."
    )

    # ---------------------------------------------------------------
    # 9. FINAL RESPONSE
    # ---------------------------------------------------------------
    return {
        "vessel": vessel,
        "berth": berth,
        "arrival_time_change_hours": arrival_time_change_hours,
        "original": {
            "congestion": original_risk,
            "probability": original_probability,
            "factors": original_prediction["factors"],
            "vessel_count": vessel_count,
            "container_count": container_count,
            "avg_waiting_time": avg_waiting_time,
            "berth_utilization": berth_utilization,
        },
        "simulated": {
            "congestion": simulated_risk,
            "probability": simulated_probability,
            "probability_change": probability_change,
            "factors": simulated_prediction["factors"],
            "vessel_count": simulated_vessel_count,
            "container_count": container_count,
            "avg_waiting_time": simulated_waiting_time,
            "berth_utilization": simulated_berth_utilization,
        },
        "risk_changed": risk_changed,
        "impact": impact,
        "optimization": optimization,
        "crane_optimization": crane,
        "routing": routing,
        "recommended_action": recommended_action,
        "assumptions": [
            "Arrival-time effects use prototype heuristic coefficients.",
            "The simulation is scenario-based and not causal.",
            "Berth and crane data are simulated/demo operational data.",
            "Waiting-time reductions are estimates, not measured outcomes.",
        ],
    }