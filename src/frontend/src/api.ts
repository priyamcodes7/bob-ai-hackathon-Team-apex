const API_BASE_URL = "http://127.0.0.1:8000";

export interface PortData {
  vessel_count: number;
  container_count: number;
  avg_waiting_time: number;
  berth_utilization: number;
}

export interface PredictionResult {
  prediction: {
    congestion_level: string;
  };

  explanation: {
    congestion_level: string;
    reasons: string[];
  };

  optimization: {
    congestion_level: string;
    recommended_actions: string[];
  };
}

export async function predictPort(
  data: PortData
): Promise<PredictionResult> {
  const response = await fetch(`${API_BASE_URL}/predict`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(`API Error: ${response.status}`);
  }

  return response.json();
}