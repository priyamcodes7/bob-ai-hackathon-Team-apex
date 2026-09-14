from typing import List, Dict, Optional


DEFAULT_CRANES = [
    {
        "crane": "C01",
        "berth": "B01",
        "available": True,
        "capacity": 3
    },
    {
        "crane": "C02",
        "berth": "B02",
        "available": True,
        "capacity": 2
    },
    {
        "crane": "C03",
        "berth": "B03",
        "available": False,
        "capacity": 3
    },
    {
        "crane": "C04",
        "berth": "B03",
        "available": True,
        "capacity": 1
    },
    {
        "crane": "C05",
        "berth": "B04",
        "available": True,
        "capacity": 2
    },
    {
        "crane": "C06",
        "berth": "B04",
        "available": True,
        "capacity": 3
    }
]


def optimize_crane(
    vessel: str,
    current_berth: str,
    recommended_berth: str,
    container_count: int,
    congestion_level: str,
    cranes: Optional[List[Dict]] = None
):
    """
    Recommend the most suitable available crane
    for the recommended berth.
    """

    if cranes is None:
        cranes = DEFAULT_CRANES

    # Cranes available at the recommended berth
    available_cranes = [
        crane
        for crane in cranes
        if crane["berth"] == recommended_berth
        and crane["available"] is True
    ]

    # If no crane is available at recommended berth
    if not available_cranes:
        return {
            "vessel": vessel,
            "berth": recommended_berth,
            "current_assignment": None,
            "recommended_assignment": None,
            "reason": (
                f"No available crane found at {recommended_berth}. "
                "Keep the current crane assignment or wait for availability."
            ),
            "expected_impact": "Crane reassignment not possible"
        }

    # Estimate operational demand
    if container_count >= 400:
        required_capacity = 3
    elif container_count >= 250:
        required_capacity = 2
    else:
        required_capacity = 1

    # Prefer crane with enough capacity
    suitable_cranes = [
        crane
        for crane in available_cranes
        if crane["capacity"] >= required_capacity
    ]

    if suitable_cranes:
        recommended = max(
            suitable_cranes,
            key=lambda crane: crane["capacity"]
        )
    else:
        recommended = max(
            available_cranes,
            key=lambda crane: crane["capacity"]
        )

    recommended_crane = recommended["crane"]

    current_assignment = None

    # Find currently assigned crane
    for crane in cranes:
        if crane["berth"] == current_berth and crane["available"] is True:
            current_assignment = crane["crane"]
            break

    # Build reason
    if recommended_berth != current_berth:
        reason = (
            f"Reassign {recommended_crane} to {vessel} at "
            f"{recommended_berth} because the crane is available "
            f"and has capacity level {recommended['capacity']}."
        )
    else:
        reason = (
            f"Keep {recommended_crane} at {recommended_berth}; "
            "it is the best available crane for the expected demand."
        )

    if congestion_level == "High":
        expected_impact = (
            "Higher crane availability should improve container "
            "handling and help reduce berth congestion."
        )
    elif congestion_level == "Medium":
        expected_impact = (
            "Balanced crane allocation should help maintain "
            "stable vessel handling."
        )
    else:
        expected_impact = (
            "Normal crane allocation is sufficient."
        )

    return {
        "vessel": vessel,
        "berth": recommended_berth,
        "current_assignment": current_assignment,
        "recommended_assignment": recommended_crane,
        "reason": reason,
        "expected_impact": expected_impact
    }