from typing import Final


LOW: Final = "LOW"
MEDIUM: Final = "MEDIUM"
HIGH: Final = "HIGH"
CRITICAL: Final = "CRITICAL"

VALID_RISK_LEVELS: Final = {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL,
}


def normalize_risk_level(value: str) -> str:
    """
    Normalize congestion/risk labels to one canonical representation.

    Canonical values:
    LOW, MEDIUM, HIGH, CRITICAL
    """

    normalized = str(value or "").strip().upper()

    if normalized == "MID":
        normalized = MEDIUM

    if normalized in VALID_RISK_LEVELS:
        return normalized

    raise ValueError(
        f"Invalid risk level: {value!r}. "
        f"Expected one of: {sorted(VALID_RISK_LEVELS)}"
    )