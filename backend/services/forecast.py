import math
from typing import List

import pandas as pd

from .prediction import (
    model,
    EXPECTED_FEATURES,
    _validate_inputs,
    _build_operational_factors,
)
from .risk import normalize_risk_level


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

    Uses one batched Random Forest prediction for all forecast hours
    instead of calling the ML model separately for every hour.
    """

    if hours <= 0:
        return []

    # Validate the starting conditions once.
    _validate_inputs(
        vessel_count,
        container_count,
        avg_waiting_time,
        berth_utilization,
    )

    scenarios = []

    # ---------------------------------------------------------------
    # Generate all future operational scenarios first.
    # ---------------------------------------------------------------
    for hour in range(hours):

        if hour == 0:
            future_vessel_count = vessel_count
            future_container_count = container_count
            future_waiting_time = float(avg_waiting_time)
            future_berth_utilization = float(berth_utilization)

        else:
            daily_wave = math.sin(
                (2 * math.pi * hour) / 24
            )

            slower_wave = math.sin(
                (2 * math.pi * hour) / 48
            )

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

        scenarios.append(
            {
                "hour": hour,
                "berth": berth,
                "vessel_count": int(future_vessel_count),
                "container_count": int(future_container_count),
                "avg_waiting_time": float(future_waiting_time),
                "berth_utilization": float(
                    future_berth_utilization
                ),
            }
        )

    # ---------------------------------------------------------------
    # ONE batched ML prediction for all forecast hours.
    # ---------------------------------------------------------------
    input_data = pd.DataFrame(
        [
            {
                "vessel_count": item["vessel_count"],
                "container_count": item["container_count"],
                "avg_waiting_time": item["avg_waiting_time"],
                "berth_utilization": item["berth_utilization"],
            }
            for item in scenarios
        ],
        columns=EXPECTED_FEATURES,
    )

    # Safety check for model/schema compatibility.
    model_features = list(
        getattr(model, "feature_names_in_", [])
    )

    if model_features and model_features != EXPECTED_FEATURES:
        raise RuntimeError(
            "Model feature mismatch. "
            f"Expected {EXPECTED_FEATURES}, "
            f"but model uses {model_features}."
        )

    predictions = model.predict(input_data)

    # One probability calculation for all 72 rows.
    if hasattr(model, "predict_proba"):
        probability_matrix = model.predict_proba(
            input_data
        )

        classes = [
            normalize_risk_level(str(value))
            for value in model.classes_
        ]
    else:
        probability_matrix = None
        classes = []

    # ---------------------------------------------------------------
    # Build the final 72-hour response.
    # ---------------------------------------------------------------
    forecast = []

    for index, scenario in enumerate(scenarios):

        raw_level = str(predictions[index])

        congestion_level = normalize_risk_level(
            raw_level
        )

        if probability_matrix is not None:

            if congestion_level not in classes:
                raise RuntimeError(
                    "Predicted class is not present "
                    "in model.classes_."
                )

            predicted_index = classes.index(
                congestion_level
            )

            probability = float(
                probability_matrix[index][predicted_index]
            )

        else:
            probability = 1.0

        probability = round(
            max(0.0, min(1.0, probability)),
            3,
        )

        factors = _build_operational_factors(
            scenario["vessel_count"],
            scenario["container_count"],
            scenario["avg_waiting_time"],
            scenario["berth_utilization"],
        )

        forecast.append(
            {
                "hour": scenario["hour"],
                "berth": scenario["berth"],
                "risk": congestion_level,
                "probability": probability,
                "conditions": {
                    "vessel_count": scenario["vessel_count"],
                    "container_count": scenario["container_count"],
                    "avg_waiting_time": scenario[
                        "avg_waiting_time"
                    ],
                    "berth_utilization": scenario[
                        "berth_utilization"
                    ],
                },
                "factors": factors,
            }
        )

    return forecast