import math
from typing import List

from .prediction import predict_congestion


def _clamp(value: float, minimum: float, maximum: float) -> float:
    return max(minimum, min(maximum, value))


def generate_forecast(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
    berth: str = "B03",
    hours: int = 72,
) -> List[dict]:
    """
    Generate a scenario-based operational congestion forecast.

    IMPORTANT:
    This is NOT a historical time-series forecasting model.

    Hour 0 always represents the exact current input state.
    Future hours use bounded, deterministic operational scenarios
    with gradual trends and daily variation.
    """

    if hours <= 0:
        return []

    forecast = []

    for hour in range(hours):
        # -----------------------------------------------------------
        # HOUR 0 = EXACT CURRENT STATE
        # -----------------------------------------------------------
        if hour == 0:
            future_vessel_count = vessel_count
            future_container_count = container_count
            future_waiting_time = float(avg_waiting_time)
            future_berth_utilization = float(berth_utilization)

        else:
            # -------------------------------------------------------
            # Future scenario:
            # - gradual operational drift
            # - bounded daily variation
            # - deterministic/reproducible
            # -------------------------------------------------------
            daily_wave = math.sin(
                (2 * math.pi * hour) / 24
            )

            slower_wave = math.sin(
                (2 * math.pi * hour) / 48
            )

            # Small gradual pressure trend over time.
            pressure_trend = min(
                1.0,
                hour / max(1, hours - 1),
            )

            vessel_delta = round(
                daily_wave * 5
                + slower_wave * 2
                + pressure_trend * 2
            )

            container_delta = round(
                daily_wave * 45
                + slower_wave * 20
                + pressure_trend * 30
            )

            waiting_delta = round(
                daily_wave * 2.0
                + slower_wave * 1.0
                + pressure_trend * 1.5,
                1,
            )

            utilization_delta = round(
                daily_wave * 7.0
                + slower_wave * 3.0
                + pressure_trend * 4.0,
                1,
            )

            future_vessel_count = max(
                1,
                vessel_count + vessel_delta,
            )

            future_container_count = max(
                1,
                container_count + container_delta,
            )

            future_waiting_time = round(
                max(
                    0.5,
                    avg_waiting_time + waiting_delta,
                ),
                1,
            )

            future_berth_utilization = round(
                _clamp(
                    berth_utilization + utilization_delta,
                    0.0,
                    100.0,
                ),
                1,
            )

        # -----------------------------------------------------------
        # Actual ML prediction for each scenario.
        # -----------------------------------------------------------
        prediction = predict_congestion(
            vessel_count=int(future_vessel_count),
            container_count=int(future_container_count),
            avg_waiting_time=float(future_waiting_time),
            berth_utilization=float(future_berth_utilization),
        )

        forecast.append(
            {
                "hour": hour,
                "berth": berth,
                "risk": prediction["congestion_level"],
                "probability": prediction["probability"],
                "conditions": {
                    "vessel_count": int(future_vessel_count),
                    "container_count": int(future_container_count),
                    "avg_waiting_time": float(future_waiting_time),
                    "berth_utilization": float(
                        future_berth_utilization
                    ),
                },
                "factors": prediction["factors"],
            }
        )

    return forecast