const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000";

export async function getCongestion() {
  const response = await fetch(`${API_URL}/api/congestion`);

  if (!response.ok) {
    throw new Error("Failed to fetch congestion data");
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