from .risk import normalize_risk_level


MIN_UTILIZATION_IMPROVEMENT = 5.0
WAIT_REDUCTION_MULTIPLIER = 1.5


def recommend_alternative_route(
    vessel: str,
    current_berth: str,
    recommended_berth: str,
    congestion_level: str,
    current_utilization: float,
    recommended_utilization: float,
    avg_waiting_time: float,
):
    """
    Recommend an alternative operational berth.

    This is berth-to-berth operational routing/reassignment.
    It is NOT maritime navigation.

    Waiting-time reduction is a heuristic estimate only.
    """

    risk = normalize_risk_level(congestion_level)

    utilization_difference = max(
        0.0,
        float(current_utilization) - float(recommended_utilization),
    )

    wait_reduction = round(
        utilization_difference * WAIT_REDUCTION_MULTIPLIER
    )

    # Low congestion: no unnecessary rerouting.
    if risk == "LOW":
        return {
            "vessel": vessel,
            "current_route": current_berth,
            "recommended_route": current_berth,
            "reroute_recommended": False,
            "utilization_difference": round(utilization_difference, 1),
            "estimated_wait_reduction_minutes": 0,
            "reason": (
                "Current berth congestion is low; "
                "no operational rerouting is required."
            ),
            "expected_impact": (
                "Maintain the current berth assignment."
            ),
        }

    # Same berth: no rerouting needed.
    if recommended_berth == current_berth:
        return {
            "vessel": vessel,
            "current_route": current_berth,
            "recommended_route": current_berth,
            "reroute_recommended": False,
            "utilization_difference": round(utilization_difference, 1),
            "estimated_wait_reduction_minutes": 0,
            "reason": (
                "The recommended berth is already the current berth."
            ),
            "expected_impact": (
                f"Continue current operation with average waiting "
                f"time of {avg_waiting_time:.1f} hours."
            ),
        }

    # Meaningful improvement: recommend alternate berth.
    if utilization_difference >= MIN_UTILIZATION_IMPROVEMENT:
        return {
            "vessel": vessel,
            "current_route": current_berth,
            "recommended_route": recommended_berth,
            "reroute_recommended": True,
            "utilization_difference": round(utilization_difference, 1),
            "estimated_wait_reduction_minutes": wait_reduction,
            "reason": (
                f"{current_berth} has higher projected utilization "
                f"than {recommended_berth}. Redirecting {vessel} "
                f"to {recommended_berth} can reduce operational "
                f"berth pressure."
            ),
            "expected_impact": (
                f"Projected utilization improves by "
                f"{utilization_difference:.1f} percentage points "
                f"with an estimated waiting-time reduction of "
                f"{wait_reduction} minutes."
            ),
        }

    # Improvement is too small.
    return {
        "vessel": vessel,
        "current_route": current_berth,
        "recommended_route": current_berth,
        "reroute_recommended": False,
        "utilization_difference": round(utilization_difference, 1),
        "estimated_wait_reduction_minutes": wait_reduction,
        "reason": (
            "The alternative berth does not provide enough "
            "operational improvement to justify rerouting."
        ),
        "expected_impact": (
            f"Continue current operation with average waiting "
            f"time of {avg_waiting_time:.1f} hours."
        ),
    }