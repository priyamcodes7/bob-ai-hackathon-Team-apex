export type RiskLevel = "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";

export interface CongestionData {
  berth: string;
  risk: RiskLevel;
  probability: number;
  forecast_hours: number;
  reasons: string[];
}

export interface OptimizationData {
  vessel: string;
  current_berth: string;
  recommended_berth: string;
  reason: string;
  estimated_wait_reduction_minutes: number;
}

export interface PlanAction {
  time: string;
  action: string;
  reason: string;
}

export interface OperationalPlan {
  horizon_hours: number;
  actions: PlanAction[];
}