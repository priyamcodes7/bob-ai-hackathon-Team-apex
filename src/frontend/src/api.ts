// ---------------------------------------------------------------------------
// SmartPort AI — Centralized API client
// ---------------------------------------------------------------------------
// Base URL is configured via the VITE_API_BASE_URL environment variable.
// Fallback: http://127.0.0.1:8000
// ---------------------------------------------------------------------------

// VITE_API_BASE_URL controls the backend target:
//   - In dev (npm run dev) the Vite proxy rewrites /api/* → http://127.0.0.1:8000
//     so the browser never makes a cross-origin request.
//   - In preview (npm run preview) or production builds, requests go directly
//     to the URL set here.
// Default: http://127.0.0.1:8000 (same local backend, works for preview too).
const API_BASE_URL: string =
  (import.meta.env.VITE_API_BASE_URL as string | undefined) || "http://127.0.0.1:8000";

// ---------------------------------------------------------------------------
// Shared request helper
// ---------------------------------------------------------------------------

// Requests that exceed this limit are aborted so the UI never hangs
// waiting for an unreachable backend.
// 8 s is generous for a local dev server that should reply in <500 ms.
const REQUEST_TIMEOUT_MS = 8_000;

async function request<T>(
  path: string,
  options?: RequestInit
): Promise<T> {
  const controller = new AbortController();
  const timerId = setTimeout(
    () => controller.abort(),
    REQUEST_TIMEOUT_MS
  );

  let response: Response;
  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      headers: { "Content-Type": "application/json" },
      ...options,
      signal: controller.signal,
    });
  } catch (err) {
    // AbortError or network-refused — surface a clear message
    if (err instanceof DOMException && err.name === "AbortError") {
      throw new Error(
        `Request timed out after ${REQUEST_TIMEOUT_MS / 1000}s — is the backend running on http://127.0.0.1:8000?`
      );
    }
    // Connection refused / DNS failure etc.
    throw new Error(
      `Network error reaching backend at http://127.0.0.1:8000 (${(err as Error).message})`
    );
  } finally {
    clearTimeout(timerId);
  }

  if (!response.ok) {
    let detail = "";
    try {
      const body = await response.json();
      detail = body?.detail ?? "";
    } catch {
      // ignore
    }
    throw new Error(
      `API ${response.status}${detail ? ": " + detail : ""} — ${path}`
    );
  }

  return response.json() as Promise<T>;
}

function buildQuery(params: Record<string, string | number>): string {
  const qs = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    qs.set(k, String(v));
  }
  return "?" + qs.toString();
}

// ---------------------------------------------------------------------------
// Request / Input types
// ---------------------------------------------------------------------------

/** Standard port metrics used as input to most endpoints */
export interface PortData {
  vessel_count: number;
  container_count: number;
  avg_waiting_time: number;
  berth_utilization: number;
  berth?: string;
}

/** What-If scenario request body */
export interface WhatIfRequest {
  vessel: string;
  arrival_time_change_hours: number;
  vessel_count: number;
  container_count: number;
  avg_waiting_time: number;
  berth_utilization: number;
  berth: string;
}

// ---------------------------------------------------------------------------
// Response types
// ---------------------------------------------------------------------------

/** POST /predict (legacy) */
export interface PredictionResult {
  prediction: {
    congestion_level: string;
    probability?: number;
    factors?: string[];
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

/** POST /api/predict */
export interface ApiPredictResult {
  berth: string;
  risk: string;
  probability: number;
  factors: string[];
  ml_features_used: string[];
  additional_operational_context: {
    crane_availability: number | null;
    vessel_arrival_density: number | null;
  };
}

/** Single forecast hour from GET /api/congestion */
export interface ForecastHour {
  hour: number;
  berth: string;
  risk: string;
  probability: number;
  conditions: {
    vessel_count: number;
    container_count: number;
    avg_waiting_time: number;
    berth_utilization: number;
  };
  factors: string[];
}

/** GET /api/congestion */
export interface CongestionForecastResult {
  berth: string;
  risk: string;
  probability: number;
  reasons: string[];
  forecast_hours: number;
  forecast: ForecastHour[];
}

/** Berth analysis item from optimization */
export interface BerthAnalysis {
  berth: string;
  projected_utilization: number;
  crane_availability: number;
  capacity_limit: number;
  capacity_headroom: number;
  score: number;
}

/** GET /api/optimization */
export interface OptimizationResult {
  congestion_level: string;
  vessel: string;
  current_berth: string;
  recommended_berth: string;
  reason: string;
  estimated_wait_reduction_minutes: number;
  berth_analysis: BerthAnalysis[];
  recommended_actions: string[];
}

/** Crane availability entry */
export interface CraneEntry {
  crane: string;
  available: boolean;
  capacity: number;
}

/** GET /api/crane (or POST /api/crane) */
export interface CraneResult {
  vessel: string;
  current_berth: string;
  recommended_berth: string;
  current_assignment: string | null;
  recommended_assignment: string | null;
  required_capacity: number;
  recommended_capacity?: number;
  capacity_sufficient?: boolean;
  crane_availability: CraneEntry[];
  reason: string;
  expected_impact: string;
}

/** Single operational action */
export interface PlanAction {
  time: string;
  priority: string;
  action: string;
  reason: string;
  expected_impact: string;
}

/** GET /api/plan */
export interface OperationalPlanResult {
  horizon_hours: number;
  prediction: {
    congestion_level: string;
    probability: number;
    factors: string[];
  };
  optimization: OptimizationResult;
  crane_optimization: CraneResult;
  routing: {
    vessel: string;
    current_route: string;
    recommended_route: string;
    reroute_recommended: boolean;
    utilization_difference: number;
    estimated_wait_reduction_minutes: number;
    reason: string;
    expected_impact: string;
  };
  actions: PlanAction[];
}

/** What-If response */
export interface WhatIfResult {
  vessel: string;
  berth: string;
  arrival_time_change_hours: number;
  original: {
    congestion: string;
    probability: number;
    factors: string[];
    vessel_count: number;
    container_count: number;
    avg_waiting_time: number;
    berth_utilization: number;
  };
  simulated: {
    congestion: string;
    probability: number;
    probability_change: number;
    factors: string[];
    vessel_count: number;
    container_count: number;
    avg_waiting_time: number;
    berth_utilization: number;
  };
  risk_changed: boolean;
  impact: string;
  optimization: OptimizationResult;
  crane_optimization: CraneResult;
  routing: {
    vessel: string;
    current_route: string;
    recommended_route: string;
    reroute_recommended: boolean;
    utilization_difference: number;
    estimated_wait_reduction_minutes: number;
    reason: string;
    expected_impact: string;
  };
  recommended_action: string;
  assumptions: string[];
}

/** GET /health */
export interface HealthResult {
  status: string;
}

// ---------------------------------------------------------------------------
// API functions
// ---------------------------------------------------------------------------

/** GET /health — connectivity check */
export function checkHealth(): Promise<HealthResult> {
  return request<HealthResult>("/health");
}

/**
 * POST /api/predict — Live congestion prediction.
 * Returns structured risk/probability/factors.
 */
export function apiPredict(data: PortData): Promise<ApiPredictResult> {
  return request<ApiPredictResult>("/api/predict", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * GET /api/congestion — 72-hour congestion forecast.
 * Uses the standard SmartPort scenario defaults.
 */
export function getCongestionForecast(
  params: PortData & { berth?: string }
): Promise<CongestionForecastResult> {
  const query = buildQuery({
    vessel_count: params.vessel_count,
    container_count: params.container_count,
    avg_waiting_time: params.avg_waiting_time,
    berth_utilization: params.berth_utilization,
    berth: params.berth ?? "B03",
  });
  return request<CongestionForecastResult>(`/api/congestion${query}`);
}

/**
 * GET /api/optimization — Berth optimisation recommendation.
 */
export function getOptimization(
  params: PortData & {
    congestion_level?: string;
    vessel?: string;
    current_berth?: string;
  }
): Promise<OptimizationResult> {
  const query = buildQuery({
    vessel_count: params.vessel_count,
    container_count: params.container_count,
    avg_waiting_time: params.avg_waiting_time,
    berth_utilization: params.berth_utilization,
    congestion_level: params.congestion_level ?? "HIGH",
    vessel: params.vessel ?? "V204",
    current_berth: params.current_berth ?? "B03",
  });
  return request<OptimizationResult>(`/api/optimization${query}`);
}

/**
 * GET /api/crane — Crane recommendation.
 */
export function getCraneOptimization(params: {
  vessel?: string;
  current_berth?: string;
  recommended_berth?: string;
  container_count?: number;
  congestion_level?: string;
}): Promise<CraneResult> {
  const query = buildQuery({
    vessel: params.vessel ?? "V204",
    current_berth: params.current_berth ?? "B03",
    recommended_berth: params.recommended_berth ?? "B04",
    container_count: params.container_count ?? 400,
    congestion_level: params.congestion_level ?? "HIGH",
  });
  return request<CraneResult>(`/api/crane${query}`);
}

/**
 * POST /api/what-if — What-If scenario simulation.
 */
export function runWhatIf(data: WhatIfRequest): Promise<WhatIfResult> {
  return request<WhatIfResult>("/api/what-if", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

/**
 * GET /api/plan — Full 72-hour operational plan.
 */
export function getOperationalPlan(
  params: PortData & { vessel?: string }
): Promise<OperationalPlanResult> {
  const query = buildQuery({
    vessel_count: params.vessel_count,
    container_count: params.container_count,
    avg_waiting_time: params.avg_waiting_time,
    berth_utilization: params.berth_utilization,
    berth: params.berth ?? "B03",
    vessel: params.vessel ?? "V204",
  });
  return request<OperationalPlanResult>(`/api/plan${query}`);
}

// ---------------------------------------------------------------------------
// Legacy export — kept for backward compatibility with old import in App.tsx
// (POST /predict — not /api/predict)
// ---------------------------------------------------------------------------
export async function predictPort(data: PortData): Promise<PredictionResult> {
  return request<PredictionResult>("/predict", {
    method: "POST",
    body: JSON.stringify(data),
  });
}
