from typing import Dict, List, Optional
from .risk import normalize_risk_level


DEFAULT_BERTHS = [
    {
        "berth": "B01",
        "capacity": 90,
        "current_utilization": 72,
        "crane_availability": 3,
    },
    {
        "berth": "B02",
        "capacity": 85,
        "current_utilization": 68,
        "crane_availability": 2,
    },
    {
        "berth": "B03",
        "capacity": 95,
        "current_utilization": 87,
        "crane_availability": 1,
    },
    {
        "berth": "B04",
        "capacity": 90,
        "current_utilization": 61,
        "crane_availability": 3,
    },
]

MAX_LOAD_FACTOR = 15.0
CRANE_WEIGHT = 5.0
HEADROOM_WEIGHT = 0.20
WAIT_REDUCTION_MULTIPLIER = 1.8


def _build_berth_state(
    berths: List[Dict],
    current_berth: str,
    berth_utilization: float,
) -> List[Dict]:
    result = []

    for item in berths:
        berth = dict(item)

        if berth["berth"] == current_berth:
            berth["current_utilization"] = float(berth_utilization)

        result.append(berth)

    return result


def optimize_port(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    congestion_level: str,
    vessel: Optional[str] = None,
    current_berth: Optional[str] = None,
    berths: Optional[List[Dict]] = None,
):
    """
    Multi-factor operational berth recommendation heuristic.

    This is simulated/demo logic, not a live port optimizer.
    """

    vessel = vessel or "Vessel-001"
    current_berth = current_berth or "B03"
    risk = normalize_risk_level(congestion_level)

    source_berths = berths if berths is not None else DEFAULT_BERTHS

    working_berths = _build_berth_state(
        source_berths,
        current_berth,
        berth_utilization,
    )

    load_factor = min(
        MAX_LOAD_FACTOR,
        (vessel_count * 0.05) + (container_count * 0.01),
    )

    analysis = []

    for berth in working_berths:
        name = berth["berth"]
        utilization = float(berth["current_utilization"])
        capacity = float(berth["capacity"])
        cranes = int(berth["crane_availability"])

        projected = min(100.0, utilization + load_factor)
        headroom = max(0.0, capacity - projected)

        utilization_score = 100.0 - projected
        crane_score = cranes * CRANE_WEIGHT
        headroom_score = headroom * HEADROOM_WEIGHT

        score = (
            utilization_score
            + crane_score
            + headroom_score
        )

        analysis.append(
            {
                "berth": name,
                "projected_utilization": round(projected, 1),
                "crane_availability": cranes,
                "capacity_limit": round(capacity, 1),
                "capacity_headroom": round(headroom, 1),
                "score": round(score, 2),
            }
        )

    recommended = max(
        analysis,
        key=lambda item: item["score"],
    )

    current_data = next(
        (
            item
            for item in analysis
            if item["berth"] == current_berth
        ),
        None,
    )

    current_projected = (
        current_data["projected_utilization"]
        if current_data
        else min(100.0, berth_utilization + load_factor)
    )

    utilization_difference = max(
        0.0,
        current_projected
        - recommended["projected_utilization"],
    )

    estimated_wait_reduction = round(
        utilization_difference * WAIT_REDUCTION_MULTIPLIER
    )

    recommended_berth = recommended["berth"]

    if recommended_berth != current_berth:
        reason = (
            f"{recommended_berth} has lower projected utilization "
            f"and better available crane capacity than "
            f"{current_berth}."
        )
    else:
        reason = (
            f"{current_berth} remains the best available berth "
            f"based on utilization, crane availability, "
            f"and capacity headroom."
        )

    if risk in {"HIGH", "CRITICAL"}:
        actions = [
            "Prioritize vessels with the longest waiting time."
        ]

        if recommended_berth != current_berth:
            actions.append(
                f"Reassign {vessel} from {current_berth} "
                f"to {recommended_berth}."
            )

        if container_count >= 350:
            actions.append(
                "Increase container handling resources."
            )

    elif risk == "MEDIUM":
        actions = [
            "Monitor berth utilization closely.",
            "Optimize vessel scheduling.",
        ]

        if recommended_berth != current_berth:
            actions.append(
                f"Consider moving {vessel} to "
                f"{recommended_berth}."
            )

    else:
        actions = [
            "Continue normal port operations.",
            "Monitor vessel and container flow.",
        ]

    return {
        "congestion_level": risk,
        "vessel": vessel,
        "current_berth": current_berth,
        "recommended_berth": recommended_berth,
        "reason": reason,
        "estimated_wait_reduction_minutes": estimated_wait_reduction,
        "berth_analysis": analysis,
        "recommended_actions": actions,
    }