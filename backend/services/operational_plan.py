from typing import List, Dict


def generate_operational_plan(
    forecast: List[Dict],
    optimization: Dict,
    crane_optimization: Dict,
    routing: Dict
):
    """
    Generate an actionable 72-hour operational plan
    from prediction and optimization results.
    """

    actions = []

    recommended_berth = optimization.get(
        "recommended_berth",
        optimization.get("current_berth")
    )

    current_berth = optimization.get(
        "current_berth",
        "Unknown"
    )

    vessel = optimization.get(
        "vessel",
        "Unknown"
    )

    wait_reduction = optimization.get(
        "estimated_wait_reduction_minutes",
        0
    )

    recommended_crane = crane_optimization.get(
        "recommended_assignment"
    )

    recommended_route = routing.get(
        "recommended_route",
        recommended_berth
    )

    # Find high-risk forecast periods
    high_risk_hours = [
        item["hour"]
        for item in forecast
        if item.get("risk", "").upper() == "HIGH"
    ]

    # Find medium-risk forecast periods
    medium_risk_hours = [
        item["hour"]
        for item in forecast
        if item.get("risk", "").upper() == "MEDIUM"
    ]

    # Action 1: berth reassignment
    if recommended_berth != current_berth:
        actions.append(
            {
                "time": "0-6h",
                "action": (
                    f"Reassign {vessel} from {current_berth} "
                    f"to {recommended_berth}"
                ),
                "reason": optimization.get(
                    "reason",
                    "Reduce projected berth congestion"
                ),
                "expected_impact": (
                    f"Estimated waiting-time reduction: "
                    f"{wait_reduction} minutes"
                )
            }
        )

    # Action 2: crane assignment
    if recommended_crane:
        actions.append(
            {
                "time": "0-6h",
                "action": (
                    f"Assign crane {recommended_crane} "
                    f"to {vessel} at {recommended_berth}"
                ),
                "reason": crane_optimization.get(
                    "reason",
                    "Improve handling capacity"
                ),
                "expected_impact": crane_optimization.get(
                    "expected_impact",
                    "Improve container handling"
                )
            }
        )

    # Action 3: alternative routing
    if recommended_route != current_berth:
        actions.append(
            {
                "time": "0-12h",
                "action": (
                    f"Route {vessel} operationally toward "
                    f"{recommended_route}"
                ),
                "reason": routing.get(
                    "reason",
                    "Reduce congestion pressure"
                ),
                "expected_impact": routing.get(
                    "expected_impact",
                    "Lower berth pressure"
                )
            }
        )

    # Action 4: high-risk monitoring
    if high_risk_hours:
        first_high = min(high_risk_hours)
        last_high = max(high_risk_hours)

        actions.append(
            {
                "time": f"{first_high}-{last_high}h",
                "action": (
                    "Activate high-congestion monitoring "
                    "and prioritize delayed vessels"
                ),
                "reason": (
                    "The 72-hour forecast contains high-risk "
                    "congestion periods."
                ),
                "expected_impact": (
                    "Reduce vessel waiting and prevent "
                    "additional berth buildup."
                )
            }
        )

    # Action 5: medium-risk preparation
    if medium_risk_hours:
        actions.append(
            {
                "time": "24-48h",
                "action": (
                    "Prepare additional handling resources "
                    "and monitor berth utilization"
                ),
                "reason": (
                    "Medium-risk periods may develop into "
                    "higher congestion."
                ),
                "expected_impact": (
                    "Improve readiness before congestion increases."
                )
            }
        )

    # Action 6: container movement
    actions.append(
        {
            "time": "48-72h",
            "action": (
                "Optimize container movement and yard flow"
            ),
            "reason": (
                "Reduce accumulation of containers near "
                "high-utilization berths."
            ),
            "expected_impact": (
                "Maintain smoother container throughput."
            )
        }
    )

    return {
        "horizon_hours": 72,
        "actions": actions
    }