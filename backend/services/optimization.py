def optimize_port(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    congestion_level: str
):
    actions = []

    if congestion_level == "High":
        actions.append("Increase berth allocation for incoming vessels")
        actions.append("Prioritize vessels with the longest waiting time")
        actions.append("Optimize container movement to reduce yard congestion")

        if berth_utilization >= 80:
            actions.append("Shift some vessel operations to available berths")

        if avg_waiting_time >= 15:
            actions.append("Create a priority queue for delayed vessels")

        if container_count >= 350:
            actions.append("Increase container handling resources")

    elif congestion_level == "Medium":
        actions.append("Monitor berth utilization closely")
        actions.append("Optimize vessel scheduling")
        actions.append("Prepare additional resources if congestion increases")

    else:
        actions.append("Continue normal port operations")
        actions.append("Monitor vessel and container flow")

    return {
        "congestion_level": congestion_level,
        "recommended_actions": actions
    }