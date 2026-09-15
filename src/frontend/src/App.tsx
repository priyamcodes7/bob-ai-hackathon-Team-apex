import { useState, useEffect, useCallback } from 'react';
import type { ReactNode, ComponentType } from 'react';
import {
  Activity, LayoutDashboard, Shuffle, Calendar,
  Ship, Anchor, Clock, ArrowRight, CheckCircle2, Info,
  ChevronRight, Navigation, GitMerge, BarChart2, ShieldAlert,
  Settings2, Maximize2, FlaskConical, RefreshCw, Loader2
} from 'lucide-react';

import {
  apiPredict,
  getCongestionForecast,
  getOptimization,
  getCraneOptimization,
  runWhatIf,
  getOperationalPlan,
  checkHealth,
} from './api';
import type {
  ApiPredictResult,
  CongestionForecastResult,
  ForecastHour,
  OptimizationResult,
  CraneResult,
  WhatIfResult,
  OperationalPlanResult,
  PlanAction,
} from './api';

// ---------------------------------------------------------------------------
// Shared scenario constants — the main SmartPort scenario
// ---------------------------------------------------------------------------
const SCENARIO = {
  vessel: 'V204',
  berth: 'B03',
  vessel_count: 80,
  container_count: 400,
  avg_waiting_time: 18,
  berth_utilization: 87,
} as const;

// ---------------------------------------------------------------------------
// Design tokens
// ---------------------------------------------------------------------------
const colors = {
  bgBase: '#081419',
  bgPanel: '#122229',
  bgElevated: '#1A3037',
  border: '#284149',
  brand: '#63C7B7',
  accent: '#D79A52',
  textMain: '#E9E5DC',
  textMuted: '#8299A0',
  riskLow: '#63C7B7',
  riskMed: '#F59E0B',
  riskHigh: '#F97316',
  riskCrit: '#EF4444'
};

// ---------------------------------------------------------------------------
// Prop types
// ---------------------------------------------------------------------------
type CardProps = {
  children: ReactNode;
  className?: string;
  noPadding?: boolean;
};

type SectionHeaderProps = {
  title: string;
  icon?: ComponentType<{ size?: number; className?: string }>;
  rightNode?: ReactNode;
};

type RiskBadgeProps = {
  risk: string;
  size?: 'sm' | 'lg';
};

type PortMapProps = {
  isOptimized: boolean;
  recommendedBerth?: string;
  onBerthClick: (tab: string) => void;
};

type DashboardViewProps = {
  navigate: (tab: string) => void;
  isOptimized: boolean;
};

type CongestionAnalysisViewProps = {
  navigate: (tab: string) => void;
  isOptimized: boolean;
};

type OptimisationViewProps = {
  navigate: (tab: string) => void;
  isOptimized: boolean;
  setIsOptimized: (value: boolean) => void;
};

type OperationalPlanViewProps = {
  isOptimized: boolean;
};

// ---------------------------------------------------------------------------
// Utility: map risk string to bar colour
// ---------------------------------------------------------------------------
function riskColor(risk: string): string {
  switch (risk.toUpperCase()) {
    case 'CRITICAL': return colors.riskCrit;
    case 'HIGH':     return colors.riskHigh;
    case 'MEDIUM':   return colors.riskMed;
    default:         return colors.riskLow;
  }
}

// ---------------------------------------------------------------------------
// Shared UI components
// ---------------------------------------------------------------------------
const Card = ({ children, className = '', noPadding = false }: CardProps) => (
  <div className={`bg-[#122229] border border-[#284149] rounded-lg ${noPadding ? '' : 'p-5'} ${className}`}>
    {children}
  </div>
);

const SectionHeader = ({ title, icon: Icon, rightNode }: SectionHeaderProps) => (
  <div className="flex items-center justify-between mb-4 border-b border-[#284149] pb-3">
    <div className="flex items-center gap-2">
      {Icon && <Icon size={18} className="text-[#8299A0]" />}
      <h2 className="text-[#E9E5DC] font-medium tracking-wide">{title}</h2>
    </div>
    {rightNode}
  </div>
);

const RiskBadge = ({ risk, size = 'sm' }: RiskBadgeProps) => {
  let bg, text;
  switch (risk.toUpperCase()) {
    case 'LOW':
      bg = 'bg-[#63C7B7]/10'; text = 'text-[#63C7B7]'; break;
    case 'MEDIUM':
      bg = 'bg-amber-500/10'; text = 'text-amber-500'; break;
    case 'HIGH':
      bg = 'bg-orange-500/10'; text = 'text-orange-500'; break;
    case 'CRITICAL':
      bg = 'bg-red-500/10'; text = 'text-red-500'; break;
    default:
      bg = 'bg-gray-500/10'; text = 'text-gray-500';
  }
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';
  return (
    <span className={`inline-flex items-center ${bg} ${text} ${sizeClasses} rounded font-mono border border-current/20 uppercase`}>
      {risk}
    </span>
  );
};

/** Small spinner shown during loading states */
const Spinner = ({ text = 'Loading…' }: { text?: string }) => (
  <div className="flex items-center gap-2 text-[#8299A0] text-sm py-4">
    <Loader2 size={16} className="animate-spin text-[#63C7B7]" />
    <span>{text}</span>
  </div>
);

/** Error banner — non-crashing, dismissable */
const ErrorBanner = ({ message, onRetry }: { message: string; onRetry?: () => void }) => (
  <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 text-red-400 text-sm flex items-center justify-between gap-4">
    <span>{message}</span>
    {onRetry && (
      <button
        onClick={onRetry}
        className="flex items-center gap-1 text-red-400 hover:text-red-300 text-xs underline underline-offset-2 shrink-0"
      >
        <RefreshCw size={12} /> Retry
      </button>
    )}
  </div>
);

// ---------------------------------------------------------------------------
// PortMap
// ---------------------------------------------------------------------------
const PortMap = ({ isOptimized, recommendedBerth = 'B04', onBerthClick }: PortMapProps) => {
  const rBerth = recommendedBerth;

  const berthColor = (id: string) => {
    if (id === 'B03' && !isOptimized) return 'border-orange-500';
    if (id === rBerth && isOptimized) return 'border-amber-500';
    if (id === 'B01') return 'border-[#63C7B7]';
    if (id === 'B02') return 'border-amber-500';
    return 'border-[#63C7B7]';
  };

  return (
    <Card className="h-full flex flex-col relative overflow-hidden" noPadding>
      <div className="p-4 border-b border-[#284149] flex justify-between items-center z-10 bg-[#122229]/80 backdrop-blur-sm absolute top-0 left-0 right-0">
        <div className="flex items-center gap-2">
          <Anchor size={16} className="text-[#8299A0]" />
          <span className="text-[#E9E5DC] font-medium">Live Terminal Map</span>
        </div>
        <div className="text-xs text-[#8299A0] font-mono flex items-center gap-3">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#63C7B7]"></div>Low
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>High
          </span>
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>Critical
          </span>
        </div>
      </div>

      <div className="flex-1 mt-14 bg-[#0A161C] relative p-4 flex flex-col">
        <div className="h-2/5 border-b-2 border-[#1A3037] relative bg-[#0A161C]">
          <div
            className={`absolute transition-all duration-1000 ease-in-out border ${
              isOptimized
                ? 'border-amber-500/50 bg-amber-500/10 text-amber-500'
                : 'border-orange-500/50 bg-orange-500/10 text-orange-500'
            } p-1.5 flex flex-col items-center justify-center`}
            style={{
              width: '80px', height: '36px',
              top: '40%',
              left: isOptimized ? '75%' : '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-[10px] font-mono">V204</span>
            {!isOptimized && (
              <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>
            )}
          </div>

          {!isOptimized && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <path d="M 50% 50% L 50% 100%" stroke="#F97316" strokeWidth="2" strokeDasharray="4 4" fill="none" className="opacity-50" />
              <path d="M 50% 50% L 75% 100%" stroke="#63C7B7" strokeWidth="1" strokeDasharray="2 4" fill="none" className="opacity-30" />
            </svg>
          )}
          {isOptimized && (
            <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
              <path d="M 75% 50% L 75% 100%" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 4" fill="none" className="opacity-50" />
            </svg>
          )}
        </div>

        <div className="h-12 w-full flex relative z-10 -mt-6">
          {['B01', 'B02', 'B03', 'B04'].map((id) => (
            <div
              key={id}
              className={`flex-1 flex justify-center items-center border-t-4 ${berthColor(id)} ${
                id === 'B03' && !isOptimized ? 'cursor-pointer hover:bg-orange-500/10' : ''
              }`}
              onClick={() => id === 'B03' && !isOptimized && onBerthClick('analysis')}
            >
              <div className={`bg-[#122229] border ${
                id === 'B03' && !isOptimized ? 'border-orange-500' : 'border-[#284149]'
              } text-xs font-mono px-2 py-1 text-[#E9E5DC] flex items-center gap-1`}>
                {id}
                {id === 'B03' && !isOptimized && <ShieldAlert size={12} className="text-orange-500" />}
              </div>
            </div>
          ))}
        </div>

        <div className="flex-1 bg-[#122229]/50 border border-[#1A3037] mt-2 flex flex-col p-2">
          <div className="text-[10px] text-[#8299A0] font-mono mb-2 uppercase">Container Yard</div>
          <div className="flex-1 grid grid-cols-8 gap-2 opacity-40">
            {Array.from({ length: 32 }).map((_, i) => (
              <div key={i} className={`bg-[#284149] rounded-sm ${i % 7 === 0 || i % 5 === 0 ? 'bg-[#D79A52]/40' : ''}`} />
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// DashboardView — live berth status from GET /api/congestion
// ---------------------------------------------------------------------------
const DashboardView = ({ navigate, isOptimized }: DashboardViewProps) => {
  const [forecast, setForecast] = useState<CongestionForecastResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getCongestionForecast({
        vessel_count: SCENARIO.vessel_count,
        container_count: SCENARIO.container_count,
        avg_waiting_time: SCENARIO.avg_waiting_time,
        berth_utilization: SCENARIO.berth_utilization,
        berth: SCENARIO.berth,
      });
      setForecast(data);
    } catch (err) {
      console.error(err);
      setError('Could not load berth status. Backend may be offline.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Build berth cards — B03 always represents the main scenario berth
  const getBerthsFromForecast = () => {
    const current = forecast?.forecast[0];
    const util0 = current?.conditions.berth_utilization ?? SCENARIO.berth_utilization;
    const risk0 = (forecast?.risk ?? 'HIGH').toUpperCase();

    return [
      { id: 'B01', util: 42, risk: 'LOW',    horizon: '72h', color: colors.riskLow },
      { id: 'B02', util: 61, risk: 'MEDIUM', horizon: '48h', color: colors.riskMed },
      {
        id: 'B03',
        util: isOptimized ? 64 : Math.round(util0),
        risk: isOptimized ? 'MEDIUM' : risk0,
        horizon: '24h',
        color: isOptimized ? colors.riskMed : riskColor(risk0),
        isHotspot: !isOptimized && (risk0 === 'HIGH' || risk0 === 'CRITICAL'),
      },
      {
        id: 'B04',
        util: isOptimized ? 73 : 61,
        risk: isOptimized ? 'MEDIUM' : 'LOW',
        horizon: '72h',
        color: isOptimized ? colors.riskMed : colors.riskLow,
      },
    ];
  };

  const berths = getBerthsFromForecast();
  const hotspot = berths.find(b => b.isHotspot);

  const metrics = {
    totalVessels: SCENARIO.vessel_count,
    waitingVessels: Math.round(SCENARIO.vessel_count * 0.14),
    berthUtil: isOptimized ? 64 : SCENARIO.berth_utilization,
    yardUtil: 76,
  };

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-300">
      {error && <ErrorBanner message={error} onRetry={load} />}

      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Vessels',     val: metrics.totalVessels,     icon: Ship          },
          { label: 'Waiting Vessels',   val: metrics.waitingVessels,   icon: Clock, alert: true },
          { label: 'Berth Utilisation', val: `${metrics.berthUtil}%`,  icon: Anchor        },
          { label: 'Yard Utilisation',  val: `${metrics.yardUtil}%`,   icon: LayoutDashboard },
        ].map((m, i) => (
          <Card key={i} className="flex flex-col justify-center py-4">
            <div className="flex justify-between items-start mb-2">
              <span className="text-sm text-[#8299A0] uppercase tracking-wider">{m.label}</span>
              <m.icon size={16} className={m.alert ? 'text-orange-500' : 'text-[#63C7B7]'} />
            </div>
            <div className="text-3xl text-[#E9E5DC] font-light">{m.val}</div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">
        <div className="col-span-2 flex flex-col gap-4">
          {loading && <Spinner text="Loading berth status…" />}

          {hotspot && !loading && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-orange-500/20 p-2 rounded-full">
                  <ShieldAlert size={24} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-orange-500 font-medium tracking-wide uppercase text-sm mb-1">Priority Alert</h3>
                  <p className="text-[#E9E5DC] text-sm">
                    {hotspot.id} is predicted to experience{' '}
                    <span className="font-bold text-orange-400">{hotspot.risk}</span>{' '}
                    congestion within {hotspot.horizon}.
                    {forecast?.probability !== undefined && (
                      <span className="text-[#8299A0] ml-1 font-mono">
                        ({(forecast.probability * 100).toFixed(0)}% probability)
                      </span>
                    )}
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('analysis')}
                className="bg-orange-500 hover:bg-orange-600 text-[#081419] px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                View Analysis <ArrowRight size={16} />
              </button>
            </div>
          )}

          <div className="flex-1 min-h-[400px]">
            <PortMap isOptimized={isOptimized} onBerthClick={navigate} />
          </div>
        </div>

        <Card className="flex flex-col h-full overflow-hidden" noPadding>
          <div className="p-5 border-b border-[#284149]">
            <h2 className="text-[#E9E5DC] font-medium tracking-wide flex items-center gap-2">
              <Activity size={18} className="text-[#8299A0]" />
              Current Berth Status
            </h2>
          </div>
          <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-2">
            {berths.map((b) => (
              <div
                key={b.id}
                className={`p-4 rounded border flex flex-col gap-3 transition-colors ${
                  b.isHotspot
                    ? 'border-orange-500/50 bg-orange-500/5 cursor-pointer hover:bg-orange-500/10'
                    : 'border-[#1A3037] bg-[#1A3037]/30'
                }`}
                onClick={() => b.isHotspot ? navigate('analysis') : null}
              >
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <span className="text-xl font-mono text-[#E9E5DC]">{b.id}</span>
                    <RiskBadge risk={b.risk} />
                  </div>
                  <span className="text-xl font-light text-[#E9E5DC]">{b.util}%</span>
                </div>
                <div className="w-full bg-[#081419] h-1.5 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{ width: `${b.util}%`, backgroundColor: b.color }}
                  />
                </div>
                <div className="flex justify-between text-xs font-mono text-[#8299A0]">
                  <span>Forecast Window: {b.horizon}</span>
                  {b.isHotspot && (
                    <span className="text-orange-500 flex items-center gap-1">
                      Analyze <ChevronRight size={12} />
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// CongestionAnalysisView — POST /api/predict + GET /api/congestion
// ---------------------------------------------------------------------------
const CongestionAnalysisView = ({ navigate }: CongestionAnalysisViewProps) => {
  // --- editable input state (seeded from the default scenario) ---
  const [vessel, setVessel]               = useState<string>(SCENARIO.vessel);
  const [vesselCount, setVesselCount]     = useState<number>(SCENARIO.vessel_count);
  const [containerCount, setContainerCount] = useState<number>(SCENARIO.container_count);
  const [avgWaitingTime, setAvgWaitingTime] = useState<number>(SCENARIO.avg_waiting_time);
  const [berthUtil, setBerthUtil]         = useState<number>(SCENARIO.berth_utilization);
  const [berth, setBerth]                 = useState<string>(SCENARIO.berth);

  const [prediction, setPrediction] = useState<ApiPredictResult | null>(null);
  const [congestionData, setCongestionData] = useState<CongestionForecastResult | null>(null);
  // separate loading/error states so the button re-enables as soon as /api/predict responds
  const [loading, setLoading] = useState(false);
  const [forecastLoading, setForecastLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [forecastError, setForecastError] = useState<string | null>(null);

  const handlePrediction = async () => {
    setLoading(true);
    setError(null);
    setForecastError(null);

    // --- Step 1: POST /api/predict — unblock the button as soon as this resolves ---
    let pred: ApiPredictResult | null = null;
    try {
      pred = await apiPredict({
        vessel_count: vesselCount,
        container_count: containerCount,
        avg_waiting_time: avgWaitingTime,
        berth_utilization: berthUtil,
        berth,
      });
      setPrediction(pred);
    } catch (err) {
      console.error('[handlePrediction] apiPredict failed:', err);
      setError(
        (err instanceof Error ? err.message : String(err)) +
        ' — Is the backend running on port 8000?'
      );
    } finally {
      // Always re-enable the button, whether predict succeeded or failed.
      setLoading(false);
    }

    // Don't fetch forecast if prediction itself failed.
    if (!pred) return;

    // --- Step 2: GET /api/congestion — background, non-blocking ---
    setForecastLoading(true);
    try {
      const cong = await getCongestionForecast({
        vessel_count: vesselCount,
        container_count: containerCount,
        avg_waiting_time: avgWaitingTime,
        berth_utilization: berthUtil,
        berth,
      });
      setCongestionData(cong);
    } catch (err) {
      console.error('[handlePrediction] getCongestionForecast failed:', err);
      setForecastError('72-hour forecast unavailable — prediction result is still shown above.');
    } finally {
      setForecastLoading(false);
    }
  };

  const congestionLevel = prediction?.risk?.toUpperCase() ?? 'HIGH';

  // Build forecast bars: use real API data when available, fall back to inline defaults
  const forecastBars: { time: string; val: number; risk: string; color: string }[] =
    congestionData
      ? [0, 6, 12, 24, 48, 72].map((h) => {
          const point: ForecastHour | undefined = congestionData.forecast.find(f => f.hour === h);
          const risk = (point?.risk ?? congestionData.risk).toUpperCase();
          const val = Math.round((point?.probability ?? congestionData.probability) * 100);
          return {
            time: h === 0 ? 'NOW' : `${h}h`,
            val: Math.min(100, Math.max(5, val)),
            risk,
            color: riskColor(risk),
          };
        })
      : [
          { time: 'NOW', val: 87, risk: 'HIGH',     color: colors.riskHigh },
          { time: '6h',  val: 65, risk: 'MEDIUM',   color: colors.riskMed  },
          { time: '12h', val: 78, risk: 'HIGH',     color: colors.riskHigh },
          { time: '24h', val: 95, risk: 'CRITICAL', color: colors.riskCrit },
          { time: '48h', val: 82, risk: 'HIGH',     color: colors.riskHigh },
          { time: '72h', val: 58, risk: 'MEDIUM',   color: colors.riskMed  },
        ];

  // shared input class
  const inputCls = "w-full bg-[#081419] border border-[#284149] rounded px-3 py-1.5 text-[#E9E5DC] font-mono text-sm focus:outline-none focus:border-[#63C7B7] transition-colors";
  const labelCls = "block text-[10px] text-[#8299A0] font-mono uppercase mb-1 tracking-wider";

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl text-[#E9E5DC] font-medium">AI Congestion Analysis</h2>
          <p className="text-sm text-[#8299A0] mt-1">Live prediction powered by SmartPort AI ML model</p>
        </div>
        <button
          onClick={handlePrediction}
          disabled={loading}
          className="bg-[#63C7B7] hover:bg-[#4EAC9C] disabled:opacity-60 text-[#081419] px-5 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Activity size={18} />
          {loading ? 'Running AI Model…' : 'Run Live Prediction'}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* ── Input parameters ── */}
      <Card>
        <SectionHeader title="Prediction Parameters" icon={Settings2} />
        <div className="grid grid-cols-3 gap-x-6 gap-y-4">
          <div>
            <label className={labelCls}>Vessel</label>
            <input
              type="text"
              value={vessel}
              onChange={e => setVessel(e.target.value)}
              className={inputCls}
              placeholder="e.g. V204"
            />
          </div>
          <div>
            <label className={labelCls}>Vessel Count</label>
            <input
              type="number"
              min={1}
              value={vesselCount}
              onChange={e => setVesselCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Container Count</label>
            <input
              type="number"
              min={1}
              value={containerCount}
              onChange={e => setContainerCount(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Avg Waiting Time (hours)</label>
            <input
              type="number"
              min={0}
              step={0.5}
              value={avgWaitingTime}
              onChange={e => setAvgWaitingTime(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Berth Utilization (%)</label>
            <input
              type="number"
              min={0}
              max={100}
              step={1}
              value={berthUtil}
              onChange={e => setBerthUtil(Number(e.target.value))}
              className={inputCls}
            />
          </div>
          <div>
            <label className={labelCls}>Berth</label>
            <input
              type="text"
              value={berth}
              onChange={e => setBerth(e.target.value)}
              className={inputCls}
              placeholder="e.g. B03"
            />
          </div>
        </div>
      </Card>

      <div className="grid grid-cols-3 gap-5">
        {/* LEFT PANEL */}
        <div className="col-span-1 flex flex-col gap-5">
          <Card>
            <SectionHeader title="Congestion Prediction" icon={ShieldAlert} />

            <div className="mb-6 flex justify-between items-end border-b border-[#284149] pb-6">
              <div>
                <div className="text-sm text-[#8299A0] font-mono mb-1">BERTH</div>
                <div className="text-4xl text-[#E9E5DC] font-mono">{berth || SCENARIO.berth}</div>
              </div>
              <div className="text-right">
                <RiskBadge risk={congestionLevel} size="lg" />
                <div className="text-sm text-[#8299A0] font-mono mt-2">
                  {prediction ? 'LIVE MODEL RESULT' : 'DEFAULT'}
                </div>
                {prediction && (
                  <div className="text-xs text-[#8299A0] font-mono mt-1">
                    {(prediction.probability * 100).toFixed(1)}% probability
                  </div>
                )}
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#8299A0]">Model Status</span>
                <span className="text-[#63C7B7] font-mono text-sm">
                  {loading ? 'RUNNING…' : prediction ? 'PREDICTION COMPLETE' : 'READY'}
                </span>
              </div>
              <div className="w-full bg-[#081419] h-2 rounded-full overflow-hidden">
                <div className={`h-full rounded-full ${
                  congestionLevel === 'CRITICAL' ? 'bg-red-500 w-[95%]'
                    : congestionLevel === 'HIGH' ? 'bg-orange-500 w-[85%]'
                    : congestionLevel === 'MEDIUM' ? 'bg-amber-500 w-[60%]'
                    : 'bg-[#63C7B7] w-[30%]'
                }`} />
              </div>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-wide text-[#8299A0] mb-3">AI Contributing Factors</h3>
              {loading && <Spinner text="Running model…" />}
              {!loading && !prediction && (
                <div className="p-3 bg-[#1A3037]/50 rounded text-sm text-[#8299A0]">
                  Click <strong className="text-[#63C7B7]">Run Live Prediction</strong> to get factors from the backend.
                </div>
              )}
              {prediction && (
                <ul className="flex flex-col gap-2 font-mono text-xs">
                  {prediction.factors.map((factor, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-[#1A3037]/50 rounded">
                      <CheckCircle2 size={14} className="text-[#63C7B7]" />
                      <span className="text-[#E9E5DC]">{factor}</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </Card>

          {/* AI explanation */}
          <Card className="bg-[#1A3037]/30 border-l-4 border-l-[#63C7B7]">
            <div className="flex items-start gap-3">
              <Info className="text-[#63C7B7] shrink-0 mt-0.5" size={18} />
              <div className="text-sm text-[#E9E5DC] leading-relaxed">
                <strong className="font-medium text-white">AI Explanation:</strong>
                {!prediction && (
                  <p className="mt-1 text-[#8299A0]">
                    Run the live prediction to receive an explanation from the SmartPort AI backend.
                  </p>
                )}
                {prediction && (
                  <ul className="mt-2 list-disc list-inside text-[#E9E5DC]">
                    {prediction.factors.map((f, i) => <li key={i}>{f}</li>)}
                  </ul>
                )}
              </div>
            </div>
          </Card>

          <button
            onClick={() => navigate('optimisation')}
            className="w-full bg-[#63C7B7] hover:bg-[#4EAC9C] text-[#081419] p-4 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
          >
            <Shuffle size={18} />
            View Berth Optimisation
          </button>
        </div>

        {/* RIGHT PANEL */}
        <div className="col-span-2 flex flex-col gap-5">
          <Card className="flex-1 flex flex-col">
            <SectionHeader
              title={`72-Hour Congestion Forecast (${berth || SCENARIO.berth})`}
              icon={BarChart2}
              rightNode={
                forecastLoading
                  ? <span className="text-xs font-mono text-[#8299A0] flex items-center gap-1"><Loader2 size={12} className="animate-spin" /> Loading…</span>
                  : congestionData
                    ? <span className="text-xs font-mono text-[#63C7B7]">LIVE DATA</span>
                    : <span className="text-xs font-mono text-amber-500">SIMULATED</span>
              }
            />

            {forecastError && (
              <div className="mx-0 mb-3">
                <ErrorBanner message={forecastError} />
              </div>
            )}

            <div className="flex-1 flex items-end gap-2 pt-10 pb-8 px-4 relative min-h-[300px]">
              <div className="absolute inset-0 pt-10 pb-8 px-4 flex flex-col justify-between pointer-events-none z-0">
                {[100, 75, 50, 25, 0].map(val => (
                  <div key={val} className="border-b border-[#284149]/50 w-full flex items-center">
                    <span className="absolute -left-6 text-[10px] text-[#8299A0] font-mono">{val}%</span>
                  </div>
                ))}
              </div>

              {forecastBars.map((d, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-3 relative z-10 h-full group">
                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#081419] border border-[#284149] text-xs px-2 py-1 rounded text-[#E9E5DC] transition-opacity">
                    {d.val}%
                  </div>
                  <div
                    className="w-16 rounded-t-sm transition-all duration-500 relative"
                    style={{ height: `${d.val}%`, backgroundColor: d.color }}
                  >
                    {d.risk === 'CRITICAL' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500" />
                    )}
                  </div>
                  <div className="text-xs font-mono text-[#8299A0]">{d.time}</div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-[#081419] rounded border border-[#284149] flex justify-between items-center">
              <span className="text-sm text-[#8299A0]">
                {forecastLoading
                  ? 'Loading 72-hour forecast from backend…'
                  : congestionData
                    ? 'Forecast powered by SmartPort AI ML model (GET /api/congestion).'
                    : 'Click "Run Live Prediction" to load real 72-hour forecast data.'}
              </span>
              <RiskBadge risk={congestionData ? congestionData.risk.toUpperCase() : 'HIGH'} />
            </div>
          </Card>

          {/* Recommended actions from optimization */}
          <Card>
            <SectionHeader title="AI Recommended Actions" icon={GitMerge} />
            {!prediction && (
              <div className="text-sm text-[#8299A0]">
                Run the live prediction to receive recommended operational actions.
              </div>
            )}
            {prediction && congestionData && (
              <div className="flex flex-col gap-3">
                {congestionData.reasons.map((reason, i) => (
                  <div key={i} className="flex items-start gap-3 p-3 bg-[#1A3037]/50 rounded border border-[#284149]">
                    <div className="w-6 h-6 rounded-full bg-[#63C7B7]/10 text-[#63C7B7] flex items-center justify-center text-xs font-mono shrink-0">
                      {i + 1}
                    </div>
                    <span className="text-sm text-[#E9E5DC]">{reason}</span>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};

// ---------------------------------------------------------------------------
// OptimisationView — GET /api/optimization + GET /api/crane
// ---------------------------------------------------------------------------
const OptimisationView = ({ navigate, isOptimized, setIsOptimized }: OptimisationViewProps) => {
  const [optimization, setOptimization] = useState<OptimizationResult | null>(null);
  const [crane, setCrane] = useState<CraneResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [isApplying, setIsApplying] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const opt = await getOptimization({
        vessel_count: SCENARIO.vessel_count,
        container_count: SCENARIO.container_count,
        avg_waiting_time: SCENARIO.avg_waiting_time,
        berth_utilization: SCENARIO.berth_utilization,
        vessel: SCENARIO.vessel,
        current_berth: SCENARIO.berth,
      });
      setOptimization(opt);

      const cr = await getCraneOptimization({
        vessel: SCENARIO.vessel,
        current_berth: SCENARIO.berth,
        recommended_berth: opt.recommended_berth,
        container_count: SCENARIO.container_count,
        congestion_level: opt.congestion_level,
      });
      setCrane(cr);
    } catch (err) {
      console.error(err);
      setError('Unable to load optimisation data. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsOptimized(true);
    }, 800);
  };

  const recBerth = optimization?.recommended_berth ?? 'B04';
  const craneAssign = crane?.recommended_assignment ?? 'C06';
  const craneText = craneAssign
    ? (isOptimized ? `${craneAssign} → ${recBerth}` : 'Standard')
    : 'Standard';

  // Berth analysis for the current berth
  const currentBerthData = optimization?.berth_analysis.find(b => b.berth === SCENARIO.berth);
  const recBerthData = optimization?.berth_analysis.find(b => b.berth === recBerth);

  const currentUtil = currentBerthData?.projected_utilization ?? SCENARIO.berth_utilization;
  const recUtil = recBerthData?.projected_utilization ?? 64;

  return (
    <div className="flex flex-col gap-6 h-full max-w-5xl mx-auto animate-in fade-in duration-300">
      <div className="text-center mb-4">
        <h2 className="text-2xl font-light text-[#E9E5DC] mb-2">Berth & Resource Recommendation</h2>
        <p className="text-[#8299A0]">
          System recommendation to mitigate 24h critical congestion at {SCENARIO.berth}.
        </p>
      </div>

      {loading && <Spinner text="Loading optimisation data…" />}
      {error && <ErrorBanner message={error} onRetry={load} />}

      {!loading && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">
            {/* Current assignment */}
            <div className="md:col-span-3 bg-[#122229] border border-[#284149] rounded-xl p-6 relative opacity-70">
              <div className="absolute top-4 right-4">
                <RiskBadge risk={optimization?.congestion_level ?? 'HIGH'} />
              </div>
              <div className="text-xs text-[#8299A0] font-mono mb-4 uppercase">Current Assignment</div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-[#1A3037] p-3 rounded-lg">
                  <Ship className="text-[#E9E5DC]" size={24} />
                </div>
                <div>
                  <div className="text-2xl text-[#E9E5DC] font-mono">{SCENARIO.vessel}</div>
                  <div className="text-sm text-[#8299A0]">Container Vessel</div>
                </div>
              </div>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between border-b border-[#284149] pb-2">
                  <span className="text-[#8299A0]">Target Berth</span>
                  <span className={`font-medium text-lg ${isOptimized ? 'text-[#63C7B7]' : 'text-orange-500'}`}>
                    {isOptimized ? recBerth : SCENARIO.berth}
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#284149] pb-2">
                  <span className="text-[#8299A0]">Est. Congestion</span>
                  <span className={isOptimized ? 'text-[#63C7B7]' : 'text-orange-500'}>
                    {isOptimized ? `${recUtil}%` : `${currentUtil}%`}
                  </span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-[#8299A0]">Crane Alloc.</span>
                  <span className={isOptimized ? 'text-[#D79A52]' : 'text-[#E9E5DC]'}>
                    {isOptimized ? craneText : 'Standard'}
                  </span>
                </div>
              </div>
            </div>

            <div className="md:col-span-1 flex justify-center py-4">
              <div className="bg-[#1A3037] p-3 rounded-full border border-[#284149]">
                <ArrowRight className="text-[#63C7B7]" size={24} />
              </div>
            </div>

            {/* Recommended route */}
            <div className="md:col-span-3 bg-[#122229] border-2 border-[#63C7B7] rounded-xl p-6 relative shadow-[0_0_30px_rgba(99,199,183,0.1)]">
              <div className="absolute top-4 right-4 bg-[#63C7B7] text-[#081419] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
                Recommended
              </div>
              <div className="text-xs text-[#63C7B7] font-mono mb-4 uppercase">Optimised Route</div>
              <div className="flex items-center gap-4 mb-6">
                <div className="bg-[#63C7B7]/20 p-3 rounded-lg">
                  <Ship className="text-[#63C7B7]" size={24} />
                </div>
                <div>
                  <div className="text-2xl text-[#E9E5DC] font-mono">{SCENARIO.vessel}</div>
                  <div className="text-sm text-[#63C7B7]">Re-routed</div>
                </div>
              </div>
              <div className="space-y-4 font-mono text-sm">
                <div className="flex justify-between border-b border-[#284149] pb-2">
                  <span className="text-[#8299A0]">Target Berth</span>
                  <span className="text-[#63C7B7] font-medium text-lg">
                    {recBerth}
                    <span className="text-xs text-[#8299A0] font-sans font-normal ml-2">(Available Capacity)</span>
                  </span>
                </div>
                <div className="flex justify-between border-b border-[#284149] pb-2">
                  <span className="text-[#8299A0]">Est. {SCENARIO.berth} Impact</span>
                  <span className="text-[#63C7B7]">↓ {recUtil}%</span>
                </div>
                <div className="flex justify-between pb-2">
                  <span className="text-[#8299A0]">Crane Alloc.</span>
                  <span className="text-[#D79A52]">
                    {craneAssign ? `Reassign ${craneAssign} to ${recBerth}` : 'Standard'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Rationale */}
          <Card className="bg-[#1A3037]/30">
            <h3 className="text-sm font-medium text-[#E9E5DC] mb-2 flex items-center gap-2">
              <Navigation size={16} className="text-[#8299A0]" />
              Recommendation Rationale
            </h3>
            <p className="text-sm text-[#8299A0] leading-relaxed">
              {optimization?.reason ?? (
                <>
                  {recBerth} has available capacity during {SCENARIO.vessel}'s expected operation window.
                  Shifting {SCENARIO.vessel} reduces projected peak pressure on {SCENARIO.berth} from{' '}
                  <span className="text-orange-400">{currentUtil}%</span> to{' '}
                  <span className="text-[#63C7B7]">{recUtil}%</span>.
                </>
              )}
              {optimization && (
                <>
                  {' '}Overall estimated waiting time reduction:{' '}
                  <span className="text-[#63C7B7]">
                    {optimization.estimated_wait_reduction_minutes} minutes.
                  </span>
                </>
              )}
              {crane && (
                <>{' '}Requires concurrent reassignment of Crane {craneAssign} to {recBerth}.</>
              )}
            </p>
          </Card>

          {/* Crane details */}
          {crane && (
            <Card className="bg-[#1A3037]/30">
              <SectionHeader title="Crane Recommendation" icon={Settings2} />
              <div className="text-sm text-[#8299A0] leading-relaxed">{crane.reason}</div>
              {crane.crane_availability.length > 0 && (
                <div className="mt-3 flex gap-2 flex-wrap">
                  {crane.crane_availability.map(c => (
                    <div key={c.crane} className="bg-[#081419] border border-[#284149] rounded px-3 py-1.5 text-xs font-mono text-[#E9E5DC]">
                      {c.crane} — cap {c.capacity}
                    </div>
                  ))}
                </div>
              )}
            </Card>
          )}

          <div className="mt-auto pt-6 flex justify-center gap-4">
            {isOptimized ? (
              <div className="flex flex-col items-center gap-4 w-full">
                <div className="bg-[#63C7B7]/10 text-[#63C7B7] border border-[#63C7B7]/30 rounded-lg p-4 flex items-center justify-center gap-3 w-full max-w-md">
                  <CheckCircle2 size={24} />
                  <div>
                    <div className="font-medium">Recommendation Applied</div>
                    <div className="text-sm opacity-80">
                      {SCENARIO.vessel} reassigned to {recBerth}. Plan updated.
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => navigate('plan')}
                  className="border border-[#284149] hover:bg-[#1A3037] text-[#E9E5DC] px-6 py-3 rounded-lg font-medium transition-colors"
                >
                  View 72-Hour Plan
                </button>
              </div>
            ) : (
              <button
                onClick={handleApply}
                disabled={isApplying}
                className="bg-[#63C7B7] hover:bg-[#4EAC9C] text-[#081419] px-10 py-4 rounded-lg font-medium text-lg transition-all flex items-center gap-3 disabled:opacity-70"
              >
                {isApplying ? 'Applying…' : 'Apply Recommendation'}
              </button>
            )}
          </div>
        </>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// OperationalPlanView — GET /api/plan
// ---------------------------------------------------------------------------
const OperationalPlanView = ({ isOptimized }: OperationalPlanViewProps) => {
  const [planData, setPlanData] = useState<OperationalPlanResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getOperationalPlan({
        vessel_count: SCENARIO.vessel_count,
        container_count: SCENARIO.container_count,
        avg_waiting_time: SCENARIO.avg_waiting_time,
        berth_utilization: SCENARIO.berth_utilization,
        berth: SCENARIO.berth,
        vessel: SCENARIO.vessel,
      });
      setPlanData(data);
    } catch (err) {
      console.error(err);
      setError('Unable to load operational plan. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { void load(); }, [load]);

  // Build display rows from the backend actions list
  const actionRows: PlanAction[] = planData?.actions ?? [];

  return (
    <Card className="h-full flex flex-col overflow-hidden" noPadding>
      <div className="p-5 border-b border-[#284149] flex justify-between items-center bg-[#122229] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-[#8299A0]" />
          <h2 className="text-xl text-[#E9E5DC] font-medium tracking-wide">72-Hour Operational Plan</h2>
        </div>
        <div className="flex items-center gap-3">
          {planData && (
            <span className="text-xs font-mono text-[#63C7B7]">LIVE DATA</span>
          )}
          {isOptimized && (
            <div className="bg-[#63C7B7]/10 text-[#63C7B7] text-xs px-3 py-1 rounded font-medium flex items-center gap-1 border border-[#63C7B7]/20">
              <CheckCircle2 size={12} />
              Plan updated based on optimisation
            </div>
          )}
          <button
            onClick={load}
            disabled={loading}
            className="text-[#8299A0] hover:text-[#E9E5DC] transition-colors"
            title="Refresh plan"
          >
            <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {loading && <Spinner text="Loading operational plan…" />}
        {error && <ErrorBanner message={error} onRetry={load} />}

        {!loading && planData && (
          <>
            {/* Summary row */}
            <div className="grid grid-cols-3 gap-4 mb-6">
              <Card className="text-center py-3">
                <div className="text-xs text-[#8299A0] uppercase mb-1">Current Berth</div>
                <div className="text-lg font-mono text-[#E9E5DC]">
                  {planData.optimization.current_berth}
                </div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-xs text-[#8299A0] uppercase mb-1">Recommended Berth</div>
                <div className="text-lg font-mono text-[#63C7B7]">
                  {planData.optimization.recommended_berth}
                </div>
              </Card>
              <Card className="text-center py-3">
                <div className="text-xs text-[#8299A0] uppercase mb-1">Crane Assignment</div>
                <div className="text-lg font-mono text-[#D79A52]">
                  {planData.crane_optimization.recommended_assignment ?? 'N/A'}
                </div>
              </Card>
            </div>

            {/* Actions table */}
            <div className="bg-[#081419] rounded-lg border border-[#1A3037] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#122229] text-xs uppercase font-mono text-[#8299A0]">
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Priority</th>
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">Expected Impact</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {actionRows.map((item, j) => (
                    <tr key={j} className="border-t border-[#1A3037] hover:bg-[#122229] transition-colors">
                      <td className="p-3 font-mono text-[#8299A0] whitespace-nowrap">{item.time}</td>
                      <td className="p-3">
                        <RiskBadge risk={item.priority} />
                      </td>
                      <td className="p-3 text-[#E9E5DC]">{item.action}</td>
                      <td className="p-3 text-[#8299A0] text-xs">{item.expected_impact}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Routing note */}
            {planData.routing.reroute_recommended && (
              <div className="mt-4 p-4 bg-[#63C7B7]/5 border border-[#63C7B7]/20 rounded-lg text-sm text-[#E9E5DC]">
                <Navigation size={14} className="inline mr-2 text-[#63C7B7]" />
                {planData.routing.reason}
                {planData.routing.estimated_wait_reduction_minutes > 0 && (
                  <span className="text-[#63C7B7] ml-2">
                    (Est. {planData.routing.estimated_wait_reduction_minutes} min reduction)
                  </span>
                )}
              </div>
            )}
          </>
        )}

        {/* Fallback when API hasn't loaded yet and not loading */}
        {!loading && !planData && !error && (
          <div className="text-sm text-[#8299A0] p-4">Loading plan data…</div>
        )}
      </div>
    </Card>
  );
};

// ---------------------------------------------------------------------------
// WhatIfView — POST /api/what-if
// ---------------------------------------------------------------------------
type WhatIfViewProps = Record<string, never>;

const WhatIfView = (_: WhatIfViewProps) => {
  const [arrivalChange, setArrivalChange] = useState<number>(-3);
  const [result, setResult] = useState<WhatIfResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await runWhatIf({
        vessel: SCENARIO.vessel,
        arrival_time_change_hours: arrivalChange,
        vessel_count: SCENARIO.vessel_count,
        container_count: SCENARIO.container_count,
        avg_waiting_time: SCENARIO.avg_waiting_time,
        berth_utilization: SCENARIO.berth_utilization,
        berth: SCENARIO.berth,
      });
      setResult(data);
    } catch (err) {
      console.error(err);
      setError('What-If simulation failed. Make sure the backend is running.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-300">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-xl text-[#E9E5DC] font-medium">What-If Scenario Analysis</h2>
          <p className="text-sm text-[#8299A0] mt-1">
            Simulate arrival-time changes for {SCENARIO.vessel} at {SCENARIO.berth}
          </p>
        </div>
        <button
          onClick={run}
          disabled={loading}
          className="bg-[#D79A52] hover:bg-[#C08840] disabled:opacity-60 text-[#081419] px-5 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <FlaskConical size={18} />
          {loading ? 'Simulating…' : 'Run Simulation'}
        </button>
      </div>

      {error && <ErrorBanner message={error} />}

      {/* Controls */}
      <Card>
        <SectionHeader title="Simulation Parameters" icon={Settings2} />
        <div className="grid grid-cols-2 gap-6">
          <div>
            <label className="block text-sm text-[#8299A0] mb-2 font-mono uppercase">
              Arrival Time Change (hours)
            </label>
            <input
              type="number"
              value={arrivalChange}
              min={-72}
              max={72}
              step={1}
              onChange={e => setArrivalChange(Number(e.target.value))}
              className="w-full bg-[#081419] border border-[#284149] rounded px-3 py-2 text-[#E9E5DC] font-mono text-sm focus:outline-none focus:border-[#63C7B7]"
            />
            <p className="text-xs text-[#8299A0] mt-1">
              Negative = arrives earlier, Positive = arrives later
            </p>
          </div>
          <div className="flex flex-col gap-2 text-sm font-mono">
            <div className="flex justify-between p-2 bg-[#1A3037]/50 rounded">
              <span className="text-[#8299A0]">Vessel</span>
              <span className="text-[#E9E5DC]">{SCENARIO.vessel}</span>
            </div>
            <div className="flex justify-between p-2 bg-[#1A3037]/50 rounded">
              <span className="text-[#8299A0]">Berth</span>
              <span className="text-[#E9E5DC]">{SCENARIO.berth}</span>
            </div>
            <div className="flex justify-between p-2 bg-[#1A3037]/50 rounded">
              <span className="text-[#8299A0]">Vessel Count</span>
              <span className="text-[#E9E5DC]">{SCENARIO.vessel_count}</span>
            </div>
            <div className="flex justify-between p-2 bg-[#1A3037]/50 rounded">
              <span className="text-[#8299A0]">Container Count</span>
              <span className="text-[#E9E5DC]">{SCENARIO.container_count}</span>
            </div>
          </div>
        </div>
      </Card>

      {loading && <Spinner text="Running What-If simulation…" />}

      {result && (
        <div className="grid grid-cols-2 gap-5">
          {/* Original vs Simulated */}
          <Card>
            <SectionHeader title="Original Scenario" icon={Activity} />
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Risk Level</span>
                <RiskBadge risk={result.original.congestion} />
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Probability</span>
                <span className="text-[#E9E5DC]">{(result.original.probability * 100).toFixed(1)}%</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Vessel Count</span>
                <span className="text-[#E9E5DC]">{result.original.vessel_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Avg Wait (h)</span>
                <span className="text-[#E9E5DC]">{result.original.avg_waiting_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Berth Util.</span>
                <span className="text-[#E9E5DC]">{result.original.berth_utilization}%</span>
              </div>
            </div>
          </Card>

          <Card>
            <SectionHeader title="Simulated Scenario" icon={FlaskConical}
              rightNode={
                result.risk_changed
                  ? <span className="text-xs font-mono text-amber-500">RISK CHANGED</span>
                  : <span className="text-xs font-mono text-[#63C7B7]">STABLE</span>
              }
            />
            <div className="space-y-3 font-mono text-sm">
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Risk Level</span>
                <RiskBadge risk={result.simulated.congestion} />
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Probability</span>
                <span className="text-[#E9E5DC]">
                  {(result.simulated.probability * 100).toFixed(1)}%
                  <span className={`ml-2 text-xs ${result.simulated.probability_change < 0 ? 'text-[#63C7B7]' : 'text-orange-400'}`}>
                    ({result.simulated.probability_change > 0 ? '+' : ''}{(result.simulated.probability_change * 100).toFixed(1)}%)
                  </span>
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Vessel Count</span>
                <span className="text-[#E9E5DC]">{result.simulated.vessel_count}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Avg Wait (h)</span>
                <span className="text-[#E9E5DC]">{result.simulated.avg_waiting_time}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-[#8299A0]">Berth Util.</span>
                <span className="text-[#E9E5DC]">{result.simulated.berth_utilization}%</span>
              </div>
            </div>
          </Card>

          {/* Recommended action */}
          <div className="col-span-2">
            <Card className="bg-[#1A3037]/30 border-l-4 border-l-[#D79A52]">
              <div className="flex items-start gap-3">
                <Navigation className="text-[#D79A52] shrink-0 mt-0.5" size={18} />
                <div>
                  <div className="text-sm font-medium text-white mb-1">Recommended Action</div>
                  <p className="text-sm text-[#E9E5DC]">{result.recommended_action}</p>
                  <p className="text-xs text-[#8299A0] mt-2">{result.impact}</p>
                </div>
              </div>
            </Card>
          </div>

          {/* Simulated factors */}
          {result.simulated.factors.length > 0 && (
            <div className="col-span-2">
              <Card>
                <SectionHeader title="Simulated Contributing Factors" icon={ShieldAlert} />
                <ul className="flex flex-col gap-2 font-mono text-xs">
                  {result.simulated.factors.map((f, i) => (
                    <li key={i} className="flex items-center gap-2 p-2 bg-[#1A3037]/50 rounded">
                      <CheckCircle2 size={14} className="text-[#D79A52]" />
                      <span className="text-[#E9E5DC]">{f}</span>
                    </li>
                  ))}
                </ul>
              </Card>
            </div>
          )}

          {/* Assumptions */}
          <div className="col-span-2">
            <details className="text-xs text-[#8299A0]">
              <summary className="cursor-pointer hover:text-[#E9E5DC] transition-colors py-2">
                Simulation Assumptions
              </summary>
              <ul className="mt-2 list-disc list-inside space-y-1 p-3 bg-[#1A3037]/30 rounded">
                {result.assumptions.map((a, i) => <li key={i}>{a}</li>)}
              </ul>
            </details>
          </div>
        </div>
      )}
    </div>
  );
};

// ---------------------------------------------------------------------------
// Main App
// ---------------------------------------------------------------------------
export default function SmartPortApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOptimized, setIsOptimized] = useState(false);
  const [backendOnline, setBackendOnline] = useState<boolean | null>(null);

  // Health check on mount
  useEffect(() => {
    checkHealth()
      .then(() => setBackendOnline(true))
      .catch(() => setBackendOnline(false));
  }, []);

  const tabs = [
    { id: 'dashboard',    label: 'Port Dashboard',       icon: LayoutDashboard },
    { id: 'analysis',     label: 'Congestion Analysis',  icon: Activity        },
    { id: 'optimisation', label: 'Berth Optimisation',   icon: Shuffle         },
    { id: 'plan',         label: '72-Hour Plan',         icon: Calendar        },
    { id: 'whatif',       label: 'What-If Analysis',     icon: FlaskConical    },
  ];

  return (
    <div className="flex h-screen bg-[#081419] text-[#E9E5DC] font-sans overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-[#122229] border-r border-[#284149] flex flex-col z-20">
        <div className="h-16 flex items-center px-6 border-b border-[#284149]">
          <div className="flex items-center gap-2">
            <Anchor className="text-[#63C7B7]" size={24} />
            <h1 className="text-lg font-medium tracking-wide text-white">SmartPort AI</h1>
          </div>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">
          <div className="text-xs font-mono text-[#8299A0] uppercase tracking-wider px-3 mb-2">Operations</div>
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? 'bg-[#1A3037] text-[#63C7B7]'
                  : 'text-[#8299A0] hover:bg-[#1A3037]/50 hover:text-[#E9E5DC]'
              }`}
            >
              <tab.icon size={18} />
              {tab.label}
              {tab.id === 'analysis' && !isOptimized && (
                <div className="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-pulse" />
              )}
            </button>
          ))}
        </nav>

        <div className="p-4 border-t border-[#284149] mt-auto">
          <div className="flex items-center gap-3 mb-3 text-sm text-[#8299A0]">
            <div className="w-8 h-8 rounded-full bg-[#1A3037] border border-[#284149] flex items-center justify-center">
              Op
            </div>
            <div>
              <div className="text-[#E9E5DC]">Operations Manager</div>
              <div className="text-xs font-mono">Shift: 08:00 – 20:00</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main */}
      <main className="flex-1 flex flex-col min-w-0">
        <header className="h-16 bg-[#081419] border-b border-[#284149] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 text-sm font-medium">
            <span className="text-[#8299A0]">{tabs.find(t => t.id === activeTab)?.label}</span>
            <ChevronRight size={14} className="text-[#284149]" />
            <span className="text-[#E9E5DC]">Live View</span>
          </div>

          <div className="flex items-center gap-4">
            {/* Backend status indicator */}
            <div className={`border text-[10px] font-mono px-2 py-1 rounded uppercase tracking-widest flex items-center gap-2 ${
              backendOnline === true
                ? 'bg-[#63C7B7]/10 border-[#63C7B7]/30 text-[#63C7B7]'
                : backendOnline === false
                  ? 'bg-red-500/10 border-red-500/30 text-red-400'
                  : 'bg-[#1A3037] border-[#284149] text-[#8299A0]'
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                backendOnline === true ? 'bg-[#63C7B7]' : backendOnline === false ? 'bg-red-500' : 'bg-amber-500'
              }`} />
              {backendOnline === true ? 'Backend Online' : backendOnline === false ? 'Backend Offline' : 'Checking…'}
            </div>

            <button className="text-[#8299A0] hover:text-[#E9E5DC] transition-colors">
              <Settings2 size={18} />
            </button>
            <button className="text-[#8299A0] hover:text-[#E9E5DC] transition-colors">
              <Maximize2 size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-[#081419]">
          {activeTab === 'dashboard' && (
            <DashboardView navigate={setActiveTab} isOptimized={isOptimized} />
          )}
          {activeTab === 'analysis' && (
            <CongestionAnalysisView navigate={setActiveTab} isOptimized={isOptimized} />
          )}
          {activeTab === 'optimisation' && (
            <OptimisationView navigate={setActiveTab} isOptimized={isOptimized} setIsOptimized={setIsOptimized} />
          )}
          {activeTab === 'plan' && (
            <OperationalPlanView isOptimized={isOptimized} />
          )}
          {activeTab === 'whatif' && (
            <WhatIfView />
          )}
        </div>
      </main>
    </div>
  );
}
