from typing import List

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
    Generate a 72-hour congestion forecast.

    The forecast gradually changes operational conditions over time
    instead of returning the exact same prediction for every hour.
    """

    forecast = []

    for hour in range(hours):
        # Simulate changing port conditions over time.
        # These are simple scenario assumptions built on top of
        # the existing ML model, not new training data.

        hour_vessel_count = max(
            1,
            round(vessel_count + ((hour % 12) - 6) * 0.8)
        )

        hour_container_count = max(
            1,
            round(container_count + ((hour % 8) - 4) * 8)
        )

        hour_waiting_time = max(
            0.5,
            round(avg_waiting_time + ((hour % 10) - 5) * 0.4, 1)
        )

        hour_berth_utilization = max(
            0,
            min(
                100,
                round(berth_utilization + ((hour % 16) - 8) * 0.8, 1)
            )
        )

        prediction = predict_congestion(
            int(hour_vessel_count),
            int(hour_container_count),
            float(hour_waiting_time),
            float(hour_berth_utilization)
        )

        forecast.append(
            {
                "hour": hour,
                "berth": berth,
                "risk": prediction["congestion_level"].upper(),
                "probability": prediction["probability"],
                "confidence": prediction["confidence"],
                "factors": prediction["factors"]
            }
        )

    return forecast