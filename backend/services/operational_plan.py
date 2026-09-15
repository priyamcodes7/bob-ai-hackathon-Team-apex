from typing import Dict, List

from .risk import normalize_risk_level


def _group_consecutive_hours(hours: List[int]) -> List[tuple]:
    """
    Convert individual forecast hours into consecutive risk windows.

    Example:
    [5, 6, 7, 40, 41] -> [(5, 7), (40, 41)]
    """

    if not hours:
        return []

    sorted_hours = sorted(set(hours))

    windows = []
    start = sorted_hours[0]
    previous = sorted_hours[0]

    for hour in sorted_hours[1:]:
        if hour == previous + 1:
            previous = hour
        else:
            windows.append((start, previous))
            start = hour
            previous = hour

    windows.append((start, previous))

    return windows


def _format_window(start: int, end: int) -> str:
    if start == end:
        return f"{start}h"

    return f"{start}-{end}h"


def generate_operational_plan(
    forecast: List[Dict],
    optimization: Dict,
    crane_optimization: Dict,
    routing: Dict,
):
    """
    Generate a 72-hour operational action plan from the actual forecast.

    The plan:
    - derives risk windows from forecast hours
    - keeps separated risk periods separate
    - uses actual forecast timing
    - avoids unconditional actions
    - marks action priority
    """

    actions = []

    recommended_berth = optimization.get(
        "recommended_berth",
        optimization.get("current_berth"),
    )

    current_berth = optimization.get(
        "current_berth",
        "Unknown",
    )

    vessel = optimization.get(
        "vessel",
        "Unknown",
    )

    wait_reduction = optimization.get(
        "estimated_wait_reduction_minutes",
        0,
    )

    recommended_crane = crane_optimization.get(
        "recommended_assignment"
    )

    recommended_route = routing.get(
        "recommended_route",
        recommended_berth,
    )

    # ---------------------------------------------------------------
    # Normalize risk values from the forecast.
    # ---------------------------------------------------------------
    high_risk_hours = []
    medium_risk_hours = []
    critical_risk_hours = []

    for item in forecast:
        try:
            risk = normalize_risk_level(
                item.get("risk", "MEDIUM")
            )
        except ValueError:
            continue

        hour = int(item.get("hour", 0))

        if risk == "CRITICAL":
            critical_risk_hours.append(hour)
        elif risk == "HIGH":
            high_risk_hours.append(hour)
        elif risk == "MEDIUM":
            medium_risk_hours.append(hour)

    # ---------------------------------------------------------------
    # Determine current forecast risk for prioritization.
    # ---------------------------------------------------------------
    current_forecast = next(
        (
            item
            for item in forecast
            if int(item.get("hour", -1)) == 0
        ),
        None,
    )

    current_risk = "MEDIUM"

    if current_forecast:
        try:
            current_risk = normalize_risk_level(
                current_forecast.get("risk", "MEDIUM")
            )
        except ValueError:
            current_risk = "MEDIUM"

    # ---------------------------------------------------------------
    # 1. Berth reassignment.
    #
    # This is an immediate action because it comes directly from
    # the optimization decision.
    # ---------------------------------------------------------------
    if (
        recommended_berth
        and current_berth
        and recommended_berth != current_berth
    ):
        priority = (
            "CRITICAL"
            if current_risk == "CRITICAL"
            else "HIGH"
        )

        actions.append(
            {
                "time": "0h",
                "priority": priority,
                "action": (
                    f"Reassign {vessel} from "
                    f"{current_berth} to {recommended_berth}."
                ),
                "reason": optimization.get(
                    "reason",
                    "Reduce projected berth congestion.",
                ),
                "expected_impact": (
                    f"Estimated waiting-time reduction: "
                    f"{wait_reduction} minutes."
                ),
            }
        )

    # ---------------------------------------------------------------
    # 2. Crane assignment.
    # ---------------------------------------------------------------
    if recommended_crane:
        priority = (
            "CRITICAL"
            if current_risk == "CRITICAL"
            else "HIGH"
        )

        actions.append(
            {
                "time": "0h",
                "priority": priority,
                "action": (
                    f"Assign crane {recommended_crane} "
                    f"to {vessel} at {recommended_berth}."
                ),
                "reason": crane_optimization.get(
                    "reason",
                    "Improve container handling capacity.",
                ),
                "expected_impact": crane_optimization.get(
                    "expected_impact",
                    "Support container handling.",
                ),
            }
        )

    # ---------------------------------------------------------------
    # 3. Alternative operational berth routing.
    # ---------------------------------------------------------------
    reroute_recommended = routing.get(
        "reroute_recommended",
        recommended_route != current_berth,
    )

    if (
        reroute_recommended
        and recommended_route
        and recommended_route != current_berth
    ):
        actions.append(
            {
                "time": "0h",
                "priority": "HIGH",
                "action": (
                    f"Route {vessel} operationally toward "
                    f"{recommended_route}."
                ),
                "reason": routing.get(
                    "reason",
                    "Reduce operational berth pressure.",
                ),
                "expected_impact": routing.get(
                    "expected_impact",
                    "Lower berth pressure and waiting time.",
                ),
            }
        )

    # ---------------------------------------------------------------
    # 4. CRITICAL forecast windows.
    # ---------------------------------------------------------------
    for start, end in _group_consecutive_hours(
        critical_risk_hours
    ):
        actions.append(
            {
                "time": _format_window(start, end),
                "priority": "CRITICAL",
                "action": (
                    "Activate critical congestion response "
                    "and prioritize delayed vessels."
                ),
                "reason": (
                    f"The forecast indicates CRITICAL congestion "
                    f"during {_format_window(start, end)}."
                ),
                "expected_impact": (
                    "Reduce queue growth and protect berth throughput."
                ),
            }
        )

    # ---------------------------------------------------------------
    # 5. HIGH forecast windows.
    #
    # Separated periods remain separate.
    # ---------------------------------------------------------------
    for start, end in _group_consecutive_hours(
        high_risk_hours
    ):
        actions.append(
            {
                "time": _format_window(start, end),
                "priority": "HIGH",
                "action": (
                    "Activate high-congestion monitoring "
                    "and prioritize delayed vessels."
                ),
                "reason": (
                    f"The forecast indicates HIGH congestion "
                    f"during {_format_window(start, end)}."
                ),
                "expected_impact": (
                    "Reduce vessel waiting and prevent "
                    "additional berth buildup."
                ),
            }
        )

    # ---------------------------------------------------------------
    # 6. MEDIUM forecast windows.
    # ---------------------------------------------------------------
    for start, end in _group_consecutive_hours(
        medium_risk_hours
    ):
        actions.append(
            {
                "time": _format_window(start, end),
                "priority": "MEDIUM",
                "action": (
                    "Monitor berth utilization and prepare "
                    "additional handling capacity."
                ),
                "reason": (
                    f"The forecast indicates MEDIUM congestion "
                    f"during {_format_window(start, end)}."
                ),
                "expected_impact": (
                    "Improve readiness before congestion increases."
                ),
            }
        )

    # ---------------------------------------------------------------
    # 7. Container movement is conditional.
    #
    # Only add it when forecast/optimization indicates meaningful
    # pressure instead of always adding the same action.
    # ---------------------------------------------------------------
    high_or_critical = bool(
        high_risk_hours or critical_risk_hours
    )

    high_container_load = False

    for item in forecast:
        conditions = item.get("conditions", {})

        if int(conditions.get("container_count", 0)) >= 350:
            high_container_load = True
            break

    if high_or_critical and high_container_load:
        risk_priority = (
            "CRITICAL"
            if critical_risk_hours
            else "HIGH"
        )

        actions.append(
            {
                "time": "48-72h",
                "priority": risk_priority,
                "action": (
                    "Optimize container movement and yard flow."
                ),
                "reason": (
                    "High forecast congestion is combined with "
                    "elevated container workload."
                ),
                "expected_impact": (
                    "Reduce container accumulation and maintain "
                    "smoother throughput."
                ),
            }
        )

    # ---------------------------------------------------------------
    # 8. If no operational action is required.
    # ---------------------------------------------------------------
    if not actions:
        actions.append(
            {
                "time": "0-72h",
                "priority": "LOW",
                "action": "Continue normal port operations.",
                "reason": (
                    "The forecast does not indicate a significant "
                    "operational intervention."
                ),
                "expected_impact": (
                    "Maintain normal vessel and container flow."
                ),
            }
        )

    return {
        "horizon_hours": 72,
        "actions": actions,
    }