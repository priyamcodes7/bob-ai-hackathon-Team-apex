from typing import List

try:
    from backend.services.prediction import predict_congestion
except ModuleNotFoundError:
    from services.prediction import predict_congestion


def generate_forecast(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    berth: str = "B03",
    hours: int = 72
) -> List[dict]:
    """
    Generate a 72-hour operational congestion forecast.

    The forecast uses:
    - the existing trained ML model
    - gradual operational trends
    - cyclical vessel/container variation

    Important:
    The current ML model was trained on static observations,
    not historical hourly time-series data. Therefore this is
    a scenario-based operational forecast, not a true time-series model.
    """

    if hours <= 0:
        return []

    forecast = []

    for hour in range(hours):

        # -----------------------------------------
        # 1. Operational cycle / trend
        # -----------------------------------------
        cycle_position = hour % 24

        if cycle_position < 12:
            trend = cycle_position / 12
        else:
            trend = (24 - cycle_position) / 12

        # -----------------------------------------
        # 2. Vessel count scenario
        # -----------------------------------------
        vessel_variation = round(
            (trend - 0.5) * 12
        )

        future_vessel_count = max(
            1,
            vessel_count + vessel_variation
        )

        # -----------------------------------------
        # 3. Container volume scenario
        # -----------------------------------------
        container_variation = round(
            (trend - 0.5) * 120
        )

        future_container_count = max(
            1,
            container_count + container_variation
        )

        # -----------------------------------------
        # 4. Waiting-time scenario
        # -----------------------------------------
        waiting_variation = round(
            (trend - 0.5) * 6,
            1
        )

        future_waiting_time = max(
            0.5,
            avg_waiting_time + waiting_variation
        )

        # -----------------------------------------
        # 5. Berth-utilization scenario
        # -----------------------------------------
        utilization_variation = round(
            (trend - 0.5) * 20,
            1
        )

        future_berth_utilization = max(
            0,
            min(
                100,
                berth_utilization + utilization_variation
            )
        )

        # -----------------------------------------
        # 6. Run actual ML prediction
        # -----------------------------------------
        prediction = predict_congestion(
            vessel_count=int(future_vessel_count),
            container_count=int(future_container_count),
            avg_waiting_time=float(future_waiting_time),
            berth_utilization=float(future_berth_utilization)
        )

        # -----------------------------------------
        # 7. Store hourly forecast
        # -----------------------------------------
        forecast.append(
            {
                "hour": hour,
                "berth": berth,
                "risk": prediction["congestion_level"].upper(),
                "probability": prediction["probability"],
                "confidence": prediction["confidence"],
                "conditions": {
                    "vessel_count": int(future_vessel_count),
                    "container_count": int(future_container_count),
                    "avg_waiting_time": float(future_waiting_time),
                    "berth_utilization": float(
                        future_berth_utilization
                    )
                },
                "factors": prediction["factors"]
            }
        )

    return forecast