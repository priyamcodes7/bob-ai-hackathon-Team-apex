from typing import Optional

from pydantic import BaseModel, Field


class PortData(BaseModel):
    # Existing ML features
    vessel_count: int = Field(..., ge=1)
    container_count: int = Field(..., ge=1)
    avg_waiting_time: float = Field(..., ge=0)
    berth_utilization: float = Field(..., ge=0, le=100)

    # Additional operational context
    berth: Optional[str] = Field(default="B03")
    crane_availability: Optional[int] = Field(default=None, ge=0)
    vessel_arrival_density: Optional[float] = Field(default=None, ge=0)