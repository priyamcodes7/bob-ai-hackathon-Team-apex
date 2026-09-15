from pathlib import Path

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import (
    accuracy_score,
    classification_report,
    confusion_matrix,
    f1_score,
    precision_score,
    recall_score,
)
from sklearn.model_selection import StratifiedKFold, cross_validate, train_test_split


RANDOM_STATE = 42
N_SAMPLES = 5000

FEATURES = [
    "vessel_count",
    "container_count",
    "avg_waiting_time",
    "berth_utilization",
]

TARGET = "congestion_level"


def generate_synthetic_dataset(
    n_samples: int = N_SAMPLES,
    random_state: int = RANDOM_STATE,
) -> pd.DataFrame:
    """Generate reproducible synthetic port-operation scenarios."""

    rng = np.random.default_rng(random_state)

    vessel_count = rng.integers(10, 121, size=n_samples)

    container_count = np.clip(
        vessel_count * rng.uniform(3.5, 6.5, size=n_samples)
        + rng.normal(0, 55, size=n_samples),
        30,
        750,
    ).round()

    avg_waiting_time = np.clip(
        1.5
        + vessel_count * 0.11
        + rng.normal(0, 4.0, size=n_samples),
        0.5,
        30.0,
    )

    berth_utilization = np.clip(
        18
        + vessel_count * 0.58
        + rng.normal(0, 13.0, size=n_samples),
        10,
        100,
    )

    pressure_score = (
        0.30 * (vessel_count / 120.0)
        + 0.20 * (container_count / 750.0)
        + 0.22 * (avg_waiting_time / 30.0)
        + 0.28 * (berth_utilization / 100.0)
    )

    pressure_score += rng.normal(
        0,
        0.055,
        size=n_samples,
    )

    congestion_level = np.select(
        [
            pressure_score < 0.34,
            pressure_score < 0.60,
        ],
        [
            "Low",
            "Medium",
        ],
        default="High",
    )

    return pd.DataFrame(
        {
            "vessel_count": vessel_count.astype(int),
            "container_count": container_count.astype(int),
            "avg_waiting_time": avg_waiting_time.round(2),
            "berth_utilization": berth_utilization.round(2),
            "congestion_level": congestion_level,
        }
    )


def main() -> None:
    df = generate_synthetic_dataset()

    print("=" * 65)
    print("SMARTPORT AI - MODEL TRAINING")
    print("=" * 65)

    print("Dataset type : Synthetic / simulation")
    print(f"Samples      : {len(df)}")
    print(f"Random seed  : {RANDOM_STATE}")

    print("\nClass distribution:")
    print(df[TARGET].value_counts().sort_index())

    print("\nClass distribution (%):")
    print(
        (
            df[TARGET]
            .value_counts(normalize=True)
            .sort_index()
            * 100
        ).round(2).to_string()
    )

    X = df[FEATURES]
    y = df[TARGET]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.20,
        random_state=RANDOM_STATE,
        stratify=y,
    )

    print("\nData split:")
    print(f"Training samples: {len(X_train)}")
    print(f"Test samples    : {len(X_test)}")

    # n_jobs=1 is intentional for reliable Windows execution.
    # It avoids spawning many parallel workers during local inference.
    model = RandomForestClassifier(
        n_estimators=300,
        max_depth=12,
        min_samples_leaf=3,
        random_state=RANDOM_STATE,
        class_weight="balanced",
        n_jobs=1,
    )

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    accuracy = accuracy_score(y_test, predictions)
    precision = precision_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0,
    )
    recall = recall_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0,
    )
    f1 = f1_score(
        y_test,
        predictions,
        average="weighted",
        zero_division=0,
    )

    print("\n" + "=" * 65)
    print("TEST SET METRICS")
    print("=" * 65)
    print(f"Accuracy : {accuracy:.4f}")
    print(f"Precision: {precision:.4f}")
    print(f"Recall   : {recall:.4f}")
    print(f"F1 Score : {f1:.4f}")

    print("\nClassification report:")
    print(
        classification_report(
            y_test,
            predictions,
            labels=["Low", "Medium", "High"],
            zero_division=0,
        )
    )

    print("Confusion matrix:")
    cm = confusion_matrix(
        y_test,
        predictions,
        labels=["Low", "Medium", "High"],
    )

    print(
        pd.DataFrame(
            cm,
            index=["Actual Low", "Actual Medium", "Actual High"],
            columns=["Pred Low", "Pred Medium", "Pred High"],
        )
    )

    # Keep cross-validation sequential too for reliable local testing.
    cv = StratifiedKFold(
        n_splits=5,
        shuffle=True,
        random_state=RANDOM_STATE,
    )

    scoring = {
        "accuracy": "accuracy",
        "precision": "precision_weighted",
        "recall": "recall_weighted",
        "f1": "f1_weighted",
    }

    cv_results = cross_validate(
        model,
        X,
        y,
        cv=cv,
        scoring=scoring,
        n_jobs=1,
    )

    print("\n" + "=" * 65)
    print("5-FOLD STRATIFIED CROSS-VALIDATION")
    print("=" * 65)

    for metric_name in scoring:
        values = cv_results[f"test_{metric_name}"]
        print(
            f"{metric_name.title():9}: "
            f"mean={values.mean():.4f}, "
            f"std={values.std():.4f}"
        )

    print("\n" + "=" * 65)
    print("MODEL FEATURE VERIFICATION")
    print("=" * 65)
    print("Expected features:", FEATURES)
    print(
        "Model features   :",
        list(getattr(model, "feature_names_in_", [])),
    )
    print(
        "Model classes     :",
        list(model.classes_),
    )

    backend_dir = Path(__file__).resolve().parents[1]
    model_path = backend_dir / "congestion_model.pkl"

    joblib.dump(model, model_path)

    print("\n" + "=" * 65)
    print("MODEL SAVED")
    print("=" * 65)
    print(f"Path: {model_path}")
    print(f"File exists: {model_path.exists()}")

    print("\nTraining completed successfully.")


if __name__ == "__main__":
    main()