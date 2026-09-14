from pydantic import BaseModel


class PortData(BaseModel):
    vessel_count: int
    container_count: int
    avg_waiting_time: float
    berth_utilization: float