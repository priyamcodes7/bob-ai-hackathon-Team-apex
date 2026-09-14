from typing import List, Dict, Optional


# Sample berth data.
# Later this can come from a database or real port system.
DEFAULT_BERTHS = [
    {
        "berth": "B01",
        "capacity": 90,
        "current_utilization": 72,
        "crane_availability": 3
    },
    {
        "berth": "B02",
        "capacity": 85,
        "current_utilization": 68,
        "crane_availability": 2
    },
    {
        "berth": "B03",
        "capacity": 95,
        "current_utilization": 87,
        "crane_availability": 1
    },
    {
        "berth": "B04",
        "capacity": 90,
        "current_utilization": 61,
        "crane_availability": 3
    }
]


def optimize_port(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    congestion_level: str,
    vessel: Optional[str] = None,
    current_berth: Optional[str] = None,
    berths: Optional[List[Dict]] = None
):
    """
    Recommend the best berth based on utilization,
    crane availability and congestion.
    """

    # Keep existing behavior when no detailed berth information is given.
    if berths is None:
        berths = DEFAULT_BERTHS

    current_berth = current_berth or "B03"
    vessel = vessel or "Vessel-001"

    # Calculate projected utilization.
    # Higher vessel/container load increases pressure on the berth.
    load_factor = min(
        15,
        (vessel_count * 0.05) + (container_count * 0.01)
    )

    berth_scores = []

    for berth_data in berths:
        berth_name = berth_data["berth"]
        current_util = float(berth_data["current_utilization"])
        capacity = float(berth_data["capacity"])
        crane_count = int(berth_data["crane_availability"])

        projected_util = min(
            100,
            current_util + load_factor
        )

        # Lower utilization is better.
        utilization_score = 100 - projected_util

        # More available cranes are better.
        crane_score = crane_count * 5

        # Capacity safety.
        capacity_score = max(0, capacity - projected_util)

        total_score = (
            utilization_score
            + crane_score
            + (capacity_score * 0.2)
        )

        berth_scores.append(
            {
                "berth": berth_name,
                "projected_utilization": round(projected_util, 1),
                "crane_availability": crane_count,
                "score": round(total_score, 2)
            }
        )

    # Find best available berth.
    recommended = max(
        berth_scores,
        key=lambda item: item["score"]
    )

    recommended_berth = recommended["berth"]
    current_data = next(
        (
            item for item in berths
            if item["berth"] == current_berth
        ),
        None
    )

    if current_data:
        current_projected_util = min(
            100,
            float(current_data["current_utilization"]) + load_factor
        )
    else:
        current_projected_util = berth_utilization

    # Estimate wait reduction.
    utilization_difference = max(
        0,
        current_projected_util -
        recommended["projected_utilization"]
    )

    estimated_wait_reduction = round(
        utilization_difference * 1.8
    )

    # Build reason.
    if recommended_berth != current_berth:
        reason = (
            f"{recommended_berth} has lower projected utilization "
            f"and better available crane capacity than {current_berth}."
        )
    else:
        reason = (
            f"{current_berth} remains the best available berth "
            f"based on projected utilization and crane capacity."
        )

    actions = []

    if congestion_level == "High":
        actions.append(
            "Prioritize vessels with the longest waiting time"
        )

        actions.append(
            "Optimize container movement to reduce yard congestion"
        )

        if recommended_berth != current_berth:
            actions.append(
                f"Reassign {vessel} from {current_berth} to "
                f"{recommended_berth}"
            )

        if container_count >= 350:
            actions.append(
                "Increase container handling resources"
            )

    elif congestion_level == "Medium":
        actions.append(
            "Monitor berth utilization closely"
        )
        actions.append(
            "Optimize vessel scheduling"
        )

        if recommended_berth != current_berth:
            actions.append(
                f"Consider moving {vessel} to {recommended_berth}"
            )

    else:
        actions.append(
            "Continue normal port operations"
        )
        actions.append(
            "Monitor vessel and container flow"
        )

    return {
        "congestion_level": congestion_level,
        "vessel": vessel,
        "current_berth": current_berth,
        "recommended_berth": recommended_berth,
        "reason": reason,
        "estimated_wait_reduction_minutes": estimated_wait_reduction,
        "berth_analysis": berth_scores,
        "recommended_actions": actions
    }