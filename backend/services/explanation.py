def explain_congestion(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    congestion_level: str
):
    reasons = []

    if berth_utilization >= 80:
        reasons.append("High berth utilization")
    elif berth_utilization >= 60:
        reasons.append("Moderate berth utilization")

    if avg_waiting_time >= 15:
        reasons.append("High average vessel waiting time")
    elif avg_waiting_time >= 8:
        reasons.append("Moderate average vessel waiting time")

    if container_count >= 350:
        reasons.append("High container volume")
    elif container_count >= 200:
        reasons.append("Moderate container volume")

    if vessel_count >= 70:
        reasons.append("High number of vessels")
    elif vessel_count >= 40:
        reasons.append("Moderate number of vessels")

    if not reasons:
        reasons.append("Port operations are currently within normal limits")

    return {
        "congestion_level": congestion_level,
        "reasons": reasons
    }