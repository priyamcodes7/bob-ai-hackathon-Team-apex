from typing import Dict, List, Optional


# -------------------------------------------------------------------
# Simulated crane data for the SmartPort prototype.
#
# IMPORTANT:
# These are DEMO/SIMULATION values, not live terminal-system data.
#
# capacity:
#   1 = lower handling capacity
#   2 = medium handling capacity
#   3 = higher handling capacity
# -------------------------------------------------------------------
DEFAULT_CRANES = [
    {
        "crane": "C01",
        "berth": "B01",
        "available": True,
        "capacity": 3,
    },
    {
        "crane": "C02",
        "berth": "B02",
        "available": True,
        "capacity": 2,
    },
    {
        "crane": "C03",
        "berth": "B03",
        "available": False,
        "capacity": 3,
    },
    {
        "crane": "C04",
        "berth": "B03",
        "available": True,
        "capacity": 1,
    },
    {
        "crane": "C05",
        "berth": "B04",
        "available": True,
        "capacity": 2,
    },
    {
        "crane": "C06",
        "berth": "B04",
        "available": True,
        "capacity": 3,
    },
]


# -------------------------------------------------------------------
# Explicit simulated vessel-to-crane assignments.
#
# This is intentionally separate from crane availability.
# An available crane is NOT automatically considered "currently
# assigned" to a vessel.
#
# These are demo assignments, not live crane-system data.
# -------------------------------------------------------------------
SIMULATED_CRANE_ASSIGNMENTS = {
    "V204": "C04",
}


def _normalize_congestion_level(congestion_level: str) -> str:
    """Normalize congestion labels to one consistent representation."""

    value = str(congestion_level or "").strip().upper()

    if value in {"LOW", "MEDIUM", "HIGH", "CRITICAL"}:
        return value

    if value == "MID":
        return "MEDIUM"

    return "MEDIUM"


def _required_crane_capacity(
    container_count: int,
    congestion_level: str,
) -> int:
    """
    Estimate the minimum crane capacity required.

    This is a transparent prototype heuristic, not a measured
    real-world crane scheduling model.
    """

    normalized = _normalize_congestion_level(congestion_level)

    if container_count >= 400 or normalized == "CRITICAL":
        return 3

    if container_count >= 250 or normalized == "HIGH":
        return 2

    return 1


def optimize_crane(
    vessel: str,
    current_berth: str,
    recommended_berth: str,
    container_count: int,
    congestion_level: str,
    cranes: Optional[List[Dict]] = None,
):
    """
    Recommend the most suitable available crane for the recommended
    berth.

    This is a capacity/availability recommendation heuristic for the
    prototype. It is NOT a real-time crane scheduling system.
    """

    if cranes is None:
        cranes = DEFAULT_CRANES

    normalized_congestion = _normalize_congestion_level(
        congestion_level
    )

    # ---------------------------------------------------------------
    # Explicit current assignment.
    # ---------------------------------------------------------------
    current_assignment = SIMULATED_CRANE_ASSIGNMENTS.get(vessel)

    # ---------------------------------------------------------------
    # Find cranes available at the recommended berth.
    # ---------------------------------------------------------------
    available_cranes = [
        crane
        for crane in cranes
        if crane["berth"] == recommended_berth
        and crane["available"] is True
    ]

    # ---------------------------------------------------------------
    # No available crane at target berth.
    # ---------------------------------------------------------------
    if not available_cranes:
        return {
            "vessel": vessel,
            "current_berth": current_berth,
            "recommended_berth": recommended_berth,
            "current_assignment": current_assignment,
            "recommended_assignment": None,
            "required_capacity": _required_crane_capacity(
                container_count,
                normalized_congestion,
            ),
            "crane_availability": [],
            "reason": (
                f"No available crane found at {recommended_berth}. "
                "Keep the simulated current assignment or wait "
                "for crane availability."
            ),
            "expected_impact": (
                "Crane reassignment is not currently possible."
            ),
        }

    # ---------------------------------------------------------------
    # Estimate minimum required crane capacity.
    # ---------------------------------------------------------------
    required_capacity = _required_crane_capacity(
        container_count,
        normalized_congestion,
    )

    # ---------------------------------------------------------------
    # Prefer cranes meeting the required capacity.
    # ---------------------------------------------------------------
    suitable_cranes = [
        crane
        for crane in available_cranes
        if crane["capacity"] >= required_capacity
    ]

    if suitable_cranes:
        recommended = max(
            suitable_cranes,
            key=lambda crane: (
                crane["capacity"],
                crane["crane"],
            ),
        )
    else:
        # If no crane meets the target capacity, choose the strongest
        # available crane and report the capacity shortfall honestly.
        recommended = max(
            available_cranes,
            key=lambda crane: (
                crane["capacity"],
                crane["crane"],
            ),
        )

    recommended_crane = recommended["crane"]
    capacity_sufficient = (
        recommended["capacity"] >= required_capacity
    )

    # ---------------------------------------------------------------
    # Build reason.
    # ---------------------------------------------------------------
    if recommended_crane == current_assignment:
        reason = (
            f"Keep {recommended_crane} for {vessel} at "
            f"{recommended_berth}; it is the simulated current "
            "assignment and is available with suitable capacity."
        )
    elif capacity_sufficient:
        reason = (
            f"Recommend {recommended_crane} for {vessel} at "
            f"{recommended_berth}; it is available and provides "
            f"capacity level {recommended['capacity']}, meeting "
            f"the required capacity level {required_capacity}."
        )
    else:
        reason = (
            f"Recommend {recommended_crane} for {vessel} at "
            f"{recommended_berth}; it has the highest available "
            f"capacity level ({recommended['capacity']}), although "
            f"the estimated requirement is level {required_capacity}."
        )

    # ---------------------------------------------------------------
    # Expected operational impact.
    # ---------------------------------------------------------------
    if normalized_congestion in {"HIGH", "CRITICAL"}:
        expected_impact = (
            "Using the strongest suitable available crane should "
            "support higher container throughput and reduce "
            "operational pressure."
        )
    elif normalized_congestion == "MEDIUM":
        expected_impact = (
            "Balanced crane allocation should support stable "
            "vessel and container handling."
        )
    else:
        expected_impact = (
            "Available crane capacity is sufficient for normal "
            "operational handling."
        )

    return {
        "vessel": vessel,
        "current_berth": current_berth,
        "recommended_berth": recommended_berth,
        "current_assignment": current_assignment,
        "recommended_assignment": recommended_crane,
        "required_capacity": required_capacity,
        "recommended_capacity": recommended["capacity"],
        "capacity_sufficient": capacity_sufficient,
        "crane_availability": [
            {
                "crane": crane["crane"],
                "available": crane["available"],
                "capacity": crane["capacity"],
            }
            for crane in available_cranes
        ],
        "reason": reason,
        "expected_impact": expected_impact,
    }