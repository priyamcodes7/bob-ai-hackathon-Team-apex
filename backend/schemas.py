from typing import Optional

from pydantic import BaseModel


class PortData(BaseModel):
    # Existing fields — keep these for backward compatibility
    vessel_count: int
    container_count: int
    avg_waiting_time: float
    berth_utilization: float

    # New optional fields
    berth: Optional[str] = None
    crane_availability: Optional[int] = None
    vessel_arrival_density: Optional[float] = None