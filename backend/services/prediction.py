import joblib
import pandas as pd
from pathlib import Path

from .risk import normalize_risk_level


# -------------------------------------------------------------------
# Load trained model from a portable path.
# -------------------------------------------------------------------
MODEL_PATH = (
    Path(__file__).resolve().parents[1]
    / "congestion_model.pkl"
)

model = joblib.load(MODEL_PATH)


EXPECTED_FEATURES = [
    "vessel_count",
    "container_count",
    "avg_waiting_time",
    "berth_utilization",
]


def _validate_inputs(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
) -> None:
    """Validate prediction inputs before calling the ML model."""

    if vessel_count < 1:
        raise ValueError("vessel_count must be at least 1.")

    if container_count < 1:
        raise ValueError("container_count must be at least 1.")

    if avg_waiting_time < 0:
        raise ValueError(
            "avg_waiting_time cannot be negative."
        )

    if not 0 <= berth_utilization <= 100:
        raise ValueError(
            "berth_utilization must be between 0 and 100."
        )


def _build_operational_factors(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
) -> list[str]:
    """
    Generate transparent rule-based operational factors.

    These are NOT SHAP values or learned feature contributions.
    They are key operational indicators shown alongside the ML result.
    """

    factors: list[str] = []

    if berth_utilization >= 80:
        factors.append(
            f"High berth utilization ({berth_utilization:.0f}%)"
        )
    elif berth_utilization >= 60:
        factors.append(
            f"Moderate berth utilization ({berth_utilization:.0f}%)"
        )

    if avg_waiting_time >= 15:
        factors.append(
            f"High average waiting time "
            f"({avg_waiting_time:.1f} hours)"
        )
    elif avg_waiting_time >= 8:
        factors.append(
            f"Moderate average waiting time "
            f"({avg_waiting_time:.1f} hours)"
        )

    if container_count >= 350:
        factors.append(
            f"High container volume ({container_count})"
        )
    elif container_count >= 200:
        factors.append(
            f"Moderate container volume ({container_count})"
        )

    if vessel_count >= 70:
        factors.append(
            f"High vessel count ({vessel_count})"
        )
    elif vessel_count >= 40:
        factors.append(
            f"Moderate vessel count ({vessel_count})"
        )

    if not factors:
        factors.append(
            "Port conditions are currently within normal limits."
        )

    return factors


def predict_congestion(
    vessel_count: int,
    container_count: int,
    avg_waiting_time: float,
    berth_utilization: float,
):
    """
    Predict congestion using the trained Random Forest model.

    Returns:
        congestion_level:
            Canonical LOW / MEDIUM / HIGH / CRITICAL label.

        probability:
            Probability assigned by the model to the predicted class.

        factors:
            Transparent rule-based operational indicators.

    Note:
        "probability" is the model's predicted-class probability.
        We do not expose the same value again as "confidence" because
        that would misleadingly imply a separate confidence model.
    """

    _validate_inputs(
        vessel_count,
        container_count,
        avg_waiting_time,
        berth_utilization,
    )

    # ---------------------------------------------------------------
    # Build exactly the features used during training.
    # ---------------------------------------------------------------
    input_data = pd.DataFrame(
        [
            {
                "vessel_count": vessel_count,
                "container_count": container_count,
                "avg_waiting_time": avg_waiting_time,
                "berth_utilization": berth_utilization,
            }
        ],
        columns=EXPECTED_FEATURES,
    )

    # ---------------------------------------------------------------
    # Safety check for model/schema compatibility.
    # ---------------------------------------------------------------
    model_features = list(
        getattr(model, "feature_names_in_", [])
    )

    if model_features and model_features != EXPECTED_FEATURES:
        raise RuntimeError(
            "Model feature mismatch. "
            f"Expected {EXPECTED_FEATURES}, "
            f"but model uses {model_features}."
        )

    # ---------------------------------------------------------------
    # Actual ML prediction.
    # ---------------------------------------------------------------
    prediction = model.predict(input_data)

    raw_level = str(prediction[0])

    # Normalize model output to:
    # LOW / MEDIUM / HIGH / CRITICAL
    congestion_level = normalize_risk_level(
        raw_level
    )

    # ---------------------------------------------------------------
    # Predicted-class probability.
    # ---------------------------------------------------------------
    if hasattr(model, "predict_proba"):
        probabilities = model.predict_proba(
            input_data
        )[0]

        classes = [
            normalize_risk_level(str(value))
            for value in model.classes_
        ]

        if congestion_level not in classes:
            raise RuntimeError(
                "Predicted class is not present in model.classes_."
            )

        predicted_index = classes.index(
            congestion_level
        )

        probability = float(
            probabilities[predicted_index]
        )
    else:
        probability = 1.0

    probability = round(
        max(0.0, min(1.0, probability)),
        3,
    )

    factors = _build_operational_factors(
        vessel_count,
        container_count,
        avg_waiting_time,
        berth_utilization,
    )

    return {
        "congestion_level": congestion_level,
        "probability": probability,
        "factors": factors,
    }