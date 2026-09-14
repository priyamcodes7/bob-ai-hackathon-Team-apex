from typing import Optional

from services.prediction import predict_congestion


def simulate_arrival_change(
    vessel: str,
    arrival_time_change_hours: float,
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    berth: str = "B03"
):
    """
    Simulate the effect of changing a vessel's arrival time.
    """

    # Original scenario
    original_prediction = predict_congestion(
        vessel_count=vessel_count,
        container_count=container_count,
        avg_waiting_time=avg_waiting_time,
        berth_utilization=berth_utilization
    )

    # Simple operational scenario model:
    # Earlier arrival increases temporary pressure.
    # Later arrival slightly reduces temporary pressure.
    arrival_pressure = arrival_time_change_hours * 2

    simulated_vessel_count = max(
        1,
        round(vessel_count + arrival_pressure)
    )

    simulated_waiting_time = max(
        0.5,
        round(avg_waiting_time + arrival_time_change_hours * 0.8, 1)
    )

    simulated_berth_utilization = max(
        0,
        min(
            100,
            round(berth_utilization + arrival_time_change_hours * 1.5, 1)
        )
    )

    simulated_prediction = predict_congestion(
        vessel_count=simulated_vessel_count,
        container_count=container_count,
        avg_waiting_time=simulated_waiting_time,
        berth_utilization=simulated_berth_utilization
    )

    original_risk = original_prediction["congestion_level"]
    simulated_risk = simulated_prediction["congestion_level"]

    risk_changed = original_risk != simulated_risk

    impact = (
        f"Changing arrival time by {arrival_time_change_hours} hours "
        f"changes berth pressure and waiting-time conditions."
    )

    if arrival_time_change_hours < 0:
        recommended_action = (
            "Consider earlier arrival only if an alternative berth "
            "or additional handling capacity is available."
        )
    elif arrival_time_change_hours > 0:
        recommended_action = (
            "Consider delaying arrival if the current berth remains "
            "highly congested."
        )
    else:
        recommended_action = (
            "Keep the current arrival schedule."
        )

    return {
        "vessel": vessel,
        "berth": berth,
        "arrival_time_change_hours": arrival_time_change_hours,
        "original": {
            "congestion": original_risk,
            "probability": original_prediction["probability"]
        },
        "simulated": {
            "congestion": simulated_risk,
            "probability": simulated_prediction["probability"],
            "vessel_count": simulated_vessel_count,
            "avg_waiting_time": simulated_waiting_time,
            "berth_utilization": simulated_berth_utilization
        },
        "risk_changed": risk_changed,
        "impact": impact,
        "recommended_action": recommended_action
    }