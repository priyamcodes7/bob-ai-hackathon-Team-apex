from typing import Optional


def recommend_alternative_route(
    vessel: str,
    current_berth: str,
    recommended_berth: str,
    congestion_level: str,
    current_utilization: float,
    recommended_utilization: float,
    avg_waiting_time: float
):
    """
    Recommend an alternative berth/operational route
    when the current berth is congested.
    """

    # No rerouting needed when congestion is low
    if congestion_level.lower() == "low":
        return {
            "vessel": vessel,
            "current_route": current_berth,
            "recommended_route": current_berth,
            "reason": "Current berth congestion is low; no rerouting is required.",
            "expected_impact": "Maintain current vessel route.",
        }

    utilization_difference = (
        current_utilization - recommended_utilization
    )

    wait_reduction = max(
        0,
        round(utilization_difference * 1.5)
    )

    # Recommend alternate berth when it has a meaningful advantage
    if (
        recommended_berth != current_berth
        and utilization_difference >= 5
    ):
        reason = (
            f"{current_berth} is more congested than "
            f"{recommended_berth}. Redirecting {vessel} to "
            f"{recommended_berth} can reduce operational pressure."
        )

        expected_impact = (
            f"Projected utilization improves by "
            f"{utilization_difference:.1f} percentage points "
            f"with an estimated waiting-time reduction of "
            f"{wait_reduction} minutes."
        )

        return {
            "vessel": vessel,
            "current_route": current_berth,
            "recommended_route": recommended_berth,
            "reason": reason,
            "expected_impact": expected_impact,
        }

    return {
        "vessel": vessel,
        "current_route": current_berth,
        "recommended_route": current_berth,
        "reason": (
            "The alternative berth does not provide enough "
            "operational improvement to justify rerouting."
        ),
        "expected_impact": (
            f"Continue current operation with average waiting "
            f"time of {avg_waiting_time:.1f} hours."
        ),
    }