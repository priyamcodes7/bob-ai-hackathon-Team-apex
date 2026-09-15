const API_URL =
  import.meta.env.VITE_API_URL || "http://localhost:8000";

export type PortData = {
  vessel_count: number;
  container_count: number;
  avg_waiting_time: number;
  berth_utilization: number;
  berth?: string;
  crane_availability?: number;
  vessel_arrival_density?: number;
};

export type PredictionResponse = {
  risk: string;
  probability: number;
  factors: string[];
};

export async function predictCongestion(
  data: PortData
): Promise<PredictionResponse> {
  const response = await fetch(`${API_URL}/api/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(
      `Prediction failed (${response.status}): ${errorText}`
    );
  }

  return response.json();
}

export async function getCongestion(data: PortData) {
  const params = new URLSearchParams({
    vessel_count: String(data.vessel_count),
    container_count: String(data.container_count),
    avg_waiting_time: String(data.avg_waiting_time),
    berth_utilization: String(data.berth_utilization),
    berth: data.berth || "B03",
  });

  const response = await fetch(
    `${API_URL}/api/congestion?${params.toString()}`
  );

  if (!response.ok) {
    throw new Error("Failed to fetch congestion forecast");
  }

  return response.json();
}

export async function getOptimization() {
  const response = await fetch(`${API_URL}/api/optimization`);

  if (!response.ok) {
    throw new Error("Failed to fetch optimization data");
  }

  return response.json();
}

export async function getOperationalPlan() {
  const response = await fetch(`${API_URL}/api/plan`);

  if (!response.ok) {
    throw new Error("Failed to fetch operational plan");
  }

  return response.json();
}