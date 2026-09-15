import { useState } from 'react';
import { predictCongestion, getCongestion } from './api';
import type { PortData, PredictionResponse } from './api';
import {
  metrics,
  getBerthsData,
  optimizationData,
  planData as basePlanData,
} from "./mockData";
import type { ReactNode, ComponentType } from 'react';
import {
  Activity, LayoutDashboard, Shuffle, Calendar,
  Ship, Anchor, Clock, ArrowRight, CheckCircle2, Info,
  ChevronRight, Navigation, GitMerge, BarChart2, ShieldAlert,
  Settings2, Maximize2
} from 'lucide-react';

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

// Color Palette Definitions (Used via arbitrary Tailwind classes)
const colors = {
  bgBase: '#081419',
  bgPanel: '#122229',
  bgElevated: '#1A3037',
  border: '#284149',
  brand: '#63C7B7', // Seafoam
  accent: '#D79A52', // Copper
  textMain: '#E9E5DC',
  textMuted: '#8299A0',
  riskLow: '#63C7B7',
  riskMed: '#F59E0B',
  riskHigh: '#F97316',
  riskCrit: '#EF4444'
};

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
  switch (risk) {
    case 'LOW': bg = 'bg-[#63C7B7]/10'; text = 'text-[#63C7B7]'; break;
    case 'MEDIUM': bg = 'bg-amber-500/10'; text = 'text-amber-500'; break;
    case 'HIGH': bg = 'bg-orange-500/10'; text = 'text-orange-500'; break;
    case 'CRITICAL': bg = 'bg-red-500/10'; text = 'text-red-500'; break;
    default: bg = 'bg-gray-500/10'; text = 'text-gray-500';
  }
  const sizeClasses = size === 'sm' ? 'px-2 py-0.5 text-xs' : 'px-3 py-1 text-sm font-medium';
  return (
    <span className={`inline-flex items-center ${bg} ${text} ${sizeClasses} rounded font-mono border border-current/20 uppercase`}>
      {risk}
    </span>
  );
};

const PortMap = ({ isOptimized, onBerthClick }: PortMapProps) => {
  return (
    <Card className="h-full flex flex-col relative overflow-hidden" noPadding>
      <div className="p-4 border-b border-[#284149] flex justify-between items-center z-10 bg-[#122229]/80 backdrop-blur-sm absolute top-0 left-0 right-0">
        <div className="flex items-center gap-2">
          <Anchor size={16} className="text-[#8299A0]" />
          <span className="text-[#E9E5DC] font-medium">Live Terminal Map</span>
        </div>
        <div className="text-xs text-[#8299A0] font-mono flex items-center gap-3">
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-[#63C7B7]"></div> Low</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-orange-500"></div> High</span>
          <span className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-red-500"></div> Critical</span>
        </div>
      </div>

      <div className="flex-1 mt-14 bg-[#0A161C] relative p-4 flex flex-col">
        {/* Harbor / Water Area */}
        <div className="h-2/5 border-b-2 border-[#1A3037] relative bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9IiMxQTMwMzciLz48L3N2Zz4=')]">

          {/* Incoming Vessel V204 */}
          <div
            className={`absolute transition-all duration-1000 ease-in-out border ${isOptimized ? 'border-amber-500/50 bg-amber-500/10 text-amber-500' : 'border-orange-500/50 bg-orange-500/10 text-orange-500'} p-1.5 flex flex-col items-center justify-center`}
            style={{
              width: '80px', height: '36px',
              top: '40%',
              left: isOptimized ? '75%' : '50%',
              transform: 'translate(-50%, -50%)'
            }}
          >
            <span className="text-[10px] font-mono">V204</span>
            {!isOptimized && <div className="absolute -top-1 -right-1 w-2 h-2 bg-orange-500 rounded-full animate-ping"></div>}
          </div>

          {/* Navigation Paths */}
          {!isOptimized && (
             <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
               <line
                x1="50%"
                y1="50%"
                x2="50%"
                y2="100%"
                stroke="#F97316"
                strokeWidth="2"
                strokeDasharray="4 4"
                className="opacity-50"
              />

              <line
                x1="50%"
                y1="50%"
                x2="75%"
                y2="100%"
                stroke="#63C7B7"
                strokeWidth="1"
                strokeDasharray="2 4"
                className="opacity-30"
              />
             </svg>
          )}
          {isOptimized && (
             <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ zIndex: 0 }}>
               <path d="M 75% 50% L 75% 100%" stroke="#F59E0B" strokeWidth="2" strokeDasharray="4 4" fill="none" className="opacity-50" />
             </svg>
          )}
        </div>

        {/* Berths Line */}
        <div className="h-12 w-full flex relative z-10 -mt-6">
          <div className="flex-1 flex justify-center items-center group cursor-pointer border-t-4 border-[#63C7B7]">
            <div className="bg-[#122229] border border-[#284149] text-xs font-mono px-2 py-1 text-[#E9E5DC]">B01</div>
          </div>
          <div className="flex-1 flex justify-center items-center border-t-4 border-amber-500">
            <div className="bg-[#122229] border border-[#284149] text-xs font-mono px-2 py-1 text-[#E9E5DC]">B02</div>
          </div>
          <div
            className={`flex-1 flex justify-center items-center cursor-pointer transition-colors border-t-4 ${isOptimized ? 'border-amber-500' : 'border-orange-500 hover:bg-orange-500/10'}`}
            onClick={() => !isOptimized && onBerthClick('analysis')}
          >
            <div className={`bg-[#122229] border ${isOptimized ? 'border-[#284149]' : 'border-orange-500'} text-xs font-mono px-2 py-1 text-[#E9E5DC] flex items-center gap-1`}>
              B03 {!isOptimized && <ShieldAlert size={12} className="text-orange-500" />}
            </div>
          </div>
          <div className={`flex-1 flex justify-center items-center border-t-4 ${isOptimized ? 'border-amber-500' : 'border-[#63C7B7]'}`}>
            <div className={`bg-[#122229] border ${isOptimized ? 'border-amber-500' : 'border-[#284149]'} text-xs font-mono px-2 py-1 text-[#E9E5DC]`}>B04</div>
          </div>
        </div>

        {/* Yard Area */}
        <div className="flex-1 bg-[#122229]/50 border border-[#1A3037] mt-2 flex flex-col p-2">
           <div className="text-[10px] text-[#8299A0] font-mono mb-2 uppercase">Container Yard (76% Util)</div>
           <div className="flex-1 grid grid-cols-8 gap-2 opacity-40">
             {Array.from({length: 32}).map((_, i) => (
               <div key={i} className={`bg-[#284149] rounded-sm ${i % 7 === 0 || i % 5 === 0 ? 'bg-[#D79A52]/40' : ''}`}></div>
             ))}
           </div>
        </div>
      </div>
    </Card>
  );
};


const DashboardView = ({ navigate, isOptimized }: DashboardViewProps) => {
  const berths = getBerthsData(isOptimized).map((berth) => ({
  ...berth,
  color:
    berth.risk === "LOW"
      ? colors.riskLow
      : berth.risk === "MEDIUM"
        ? colors.riskMed
        : colors.riskHigh,
}));
  const hotspot = berths.find(b => b.isHotspot);

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-300">
      {/* Top Metrics */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label: 'Total Vessels', val: metrics.totalVessels, icon: Ship },
          { label: 'Waiting Vessels', val: metrics.waitingVessels, icon: Clock, alert: true },
          { label: 'Berth Utilisation', val: `${metrics.berthUtil}%`, icon: Anchor },
          { label: 'Yard Utilisation', val: `${metrics.yardUtil}%`, icon: LayoutDashboard }
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
        {/* Main Map Area */}
        <div className="col-span-2 flex flex-col gap-4">
          {hotspot && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className="bg-orange-500/20 p-2 rounded-full">
                  <ShieldAlert size={24} className="text-orange-500" />
                </div>
                <div>
                  <h3 className="text-orange-500 font-medium tracking-wide uppercase text-sm mb-1">Priority Alert</h3>
                  <p className="text-[#E9E5DC] text-sm">
                    {hotspot.id} is predicted to experience <span className="font-bold text-orange-400">HIGH</span> congestion within {hotspot.horizon}.
                  </p>
                </div>
              </div>
              <button
                onClick={() => navigate('analysis')}
                className="bg-orange-500 hover:bg-orange-600 text-[#081419] px-4 py-2 rounded text-sm font-medium transition-colors flex items-center gap-2"
              >
                View Analysis
                <ArrowRight size={16} />
              </button>
            </div>
          )}

          <div className="flex-1 min-h-[400px]">
            <PortMap isOptimized={isOptimized} onBerthClick={navigate} />
          </div>
        </div>

        {/* Berth Status Side Panel */}
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
                  ></div>
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


const CongestionAnalysisView = ({ navigate }: CongestionAnalysisViewProps) => {
  const [portData, setPortData] = useState<PortData>({
    vessel_count: 80,
    container_count: 400,
    avg_waiting_time: 18,
    berth_utilization: 87,
    berth: "B03",
    crane_availability: 2,
    vessel_arrival_density: 75,
  });

  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [forecast, setForecast] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAnalyze = async () => {
    setLoading(true);
    setError("");

    try {
     const result = await predictCongestion(portData);
setPrediction(result);

const forecastResult = await getCongestion(portData);
setForecast(forecastResult.forecast || []);
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Unable to analyze port conditions"
      );
    } finally {
      setLoading(false);
    }
  };

  const risk = prediction?.risk?.toUpperCase() || "HIGH";
  const probability = prediction
    ? Math.round(prediction.probability * 100)
    : 91;

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-300 overflow-y-auto">

      {/* UPDATE PORT CONDITIONS */}
      <Card>
        <SectionHeader title="Update Port Conditions" icon={Settings2} />

        <div className="grid grid-cols-3 gap-4">

          <div>
  <label
    htmlFor="vessel-count"
    className="text-xs text-[#8299A0] uppercase tracking-wide"
  >
    Vessel Count
  </label>

  <input
    id="vessel-count"
    name="vessel_count"
    type="number"
    value={portData.vessel_count}
    onChange={(e) =>
      setPortData({
        ...portData,
        vessel_count: Number(e.target.value),
      })
    }
    className="mt-2 w-full bg-[#081419] border border-[#284149] rounded px-3 py-2 text-[#E9E5DC] font-mono outline-none focus:border-[#63C7B7]"
  />
</div>

          <div>
            <label className="text-xs text-[#8299A0] uppercase tracking-wide">
              Container Count
            </label>
            <input
              type="number"
              value={portData.container_count}
              onChange={(e) =>
                setPortData({
                  ...portData,
                  container_count: Number(e.target.value),
                })
              }
              className="mt-2 w-full bg-[#081419] border border-[#284149] rounded px-3 py-2 text-[#E9E5DC] font-mono outline-none focus:border-[#63C7B7]"
            />
          </div>

          <div>
            <label className="text-xs text-[#8299A0] uppercase tracking-wide">
              Avg Waiting Time (min)
            </label>
            <input
              type="number"
              value={portData.avg_waiting_time}
              onChange={(e) =>
                setPortData({
                  ...portData,
                  avg_waiting_time: Number(e.target.value),
                })
              }
              className="mt-2 w-full bg-[#081419] border border-[#284149] rounded px-3 py-2 text-[#E9E5DC] font-mono outline-none focus:border-[#63C7B7]"
            />
          </div>

          <div>
            <label className="text-xs text-[#8299A0] uppercase tracking-wide">
              Berth Utilisation (%)
            </label>
            <input
              type="number"
              min="0"
              max="100"
              value={portData.berth_utilization}
              onChange={(e) =>
                setPortData({
                  ...portData,
                  berth_utilization: Number(e.target.value),
                })
              }
              className="mt-2 w-full bg-[#081419] border border-[#284149] rounded px-3 py-2 text-[#E9E5DC] font-mono outline-none focus:border-[#63C7B7]"
            />
          </div>

          <div>
            <label className="text-xs text-[#8299A0] uppercase tracking-wide">
              Crane Availability
            </label>
            <input
              type="number"
              min="0"
              value={portData.crane_availability}
              onChange={(e) =>
                setPortData({
                  ...portData,
                  crane_availability: Number(e.target.value),
                })
              }
              className="mt-2 w-full bg-[#081419] border border-[#284149] rounded px-3 py-2 text-[#E9E5DC] font-mono outline-none focus:border-[#63C7B7]"
            />
          </div>

          <div>
            <label className="text-xs text-[#8299A0] uppercase tracking-wide">
              Vessel Arrival Density
            </label>
            <input
              type="number"
              min="0"
              value={portData.vessel_arrival_density}
              onChange={(e) =>
                setPortData({
                  ...portData,
                  vessel_arrival_density: Number(e.target.value),
                })
              }
              className="mt-2 w-full bg-[#081419] border border-[#284149] rounded px-3 py-2 text-[#E9E5DC] font-mono outline-none focus:border-[#63C7B7]"
            />
          </div>

        </div>

        <button
          onClick={handleAnalyze}
          disabled={loading}
          className="mt-5 w-full bg-[#63C7B7] hover:bg-[#4EAC9C] disabled:opacity-50 text-[#081419] p-3 rounded-lg font-medium transition-colors"
        >
          {loading ? "Analyzing Port Conditions..." : "Analyze New Conditions"}
        </button>

        {error && (
          <div className="mt-3 p-3 rounded border border-red-500/30 bg-red-500/10 text-red-400 text-sm">
            {error}
          </div>
        )}
      </Card>

      <div className="grid grid-cols-3 gap-5">

        {/* LEFT: PREDICTION */}
        <div className="col-span-1 flex flex-col gap-5">

          <Card>
            <SectionHeader title="Congestion Prediction" icon={ShieldAlert} />

            <div className="mb-6 flex justify-between items-end border-b border-[#284149] pb-6">
              <div>
                <div className="text-sm text-[#8299A0] font-mono mb-1">
                  BERTH
                </div>
                <div className="text-4xl text-[#E9E5DC] font-mono">
                  {portData.berth}
                </div>
              </div>

              <div className="text-right">
                <RiskBadge risk={risk} size="lg" />
                <div className="text-sm text-[#8299A0] font-mono mt-2">
                  24h FORECAST
                </div>
              </div>
            </div>

            <div className="mb-6">
              <div className="flex justify-between text-sm mb-2">
                <span className="text-[#8299A0]">
                  Congestion Probability
                </span>
                <span className="text-orange-500 font-mono text-lg">
                  {probability}%
                </span>
              </div>

              <div className="w-full bg-[#081419] h-2 rounded-full overflow-hidden">
                <div
                  className="h-full bg-orange-500 rounded-full transition-all duration-500"
                  style={{ width: `${probability}%` }}
                />
              </div>
            </div>

            <div>
              <h3 className="text-sm uppercase tracking-wide text-[#8299A0] mb-3">
                Contributing Factors
              </h3>

              {prediction?.factors?.length ? (
                <ul className="flex flex-col gap-2 font-mono text-xs">
                  {prediction.factors.map((factor, index) => (
                  <li
                    key={index}
                    className="p-2 bg-[#1A3037]/50 rounded text-[#E9E5DC]"
                  >
                    {factor}
                  </li>
              ))}
                </ul>
              ) : (
                <div className="text-sm text-[#8299A0]">
                  Enter operational conditions and analyze to generate AI factors.
                </div>
              )}
            </div>
          </Card>

          <Card className="bg-[#1A3037]/30 border-l-4 border-l-[#63C7B7]">
            <div className="flex items-start gap-3">
              <Info
                className="text-[#63C7B7] shrink-0 mt-0.5"
                size={18}
              />

              <p className="text-sm text-[#E9E5DC] leading-relaxed">
                <strong className="font-medium text-white">
                  AI Analysis:
                </strong>{" "}
                {prediction
                  ? `The Random Forest model predicts ${risk} congestion for ${portData.berth} with ${probability}% probability based on the submitted operational conditions.`
                  : "Submit new port conditions to generate an AI congestion prediction."}
              </p>
            </div>
          </Card>

          <button
            onClick={() => navigate("optimisation")}
            className="w-full bg-[#63C7B7] hover:bg-[#4EAC9C] text-[#081419] p-4 rounded-lg font-medium transition-colors flex justify-center items-center gap-2"
          >
            <Shuffle size={18} />
            View Berth Optimisation
          </button>

        </div>

        {/* RIGHT SIDE */}
        <div className="col-span-2 flex flex-col gap-5">

          <Card className="flex-1 flex flex-col">
            <SectionHeader
              title={`72-Hour Congestion Forecast (${portData.berth})`}
              icon={BarChart2}
            />

            <div className="flex-1 flex items-end gap-1 pt-10 pb-8 px-4 min-h-[300px]">
  {forecast.length > 0 ? (
    forecast.map((d, i) => {
      const value =
        Number(d.probability ?? d.value ?? d.val ?? 0) * 100;

      const risk = String(
        d.risk ?? d.congestion_level ?? "LOW"
      ).toUpperCase();

      return (
        <div
          key={i}
          className="flex-1 flex flex-col justify-end items-center gap-2 h-full group"
        >
          <div
            className="w-full max-w-[18px] rounded-t-sm"
            style={{
              height: `${Math.max(4, value)}%`,
              backgroundColor:
                risk === "LOW"
                  ? colors.riskLow
                  : risk === "MEDIUM"
                  ? colors.riskMed
                  : risk === "HIGH"
                  ? colors.riskHigh
                  : colors.riskCrit,
            }}
            title={`Hour ${i}: ${value.toFixed(0)}% ${risk}`}
          />

          {i % 12 === 0 && (
            <span className="text-[9px] text-[#8299A0] font-mono">
              {i}h
            </span>
          )}
        </div>
      );
    })
  ) : (
    <div className="w-full h-full flex items-center justify-center text-[#8299A0]">
      Analyze the new port conditions to generate the 72-hour forecast.
    </div>
  )}
</div>

            <div className="mt-4 p-4 bg-[#081419] rounded border border-[#284149] flex justify-between items-center">
              <span className="text-sm text-[#8299A0]">
                {prediction
                  ? `Current prediction: ${risk} congestion risk`
                  : "Awaiting new operational data"}
              </span>

              <RiskBadge risk={risk} />
            </div>
          </Card>

          <Card>
            <SectionHeader title="What-If Simulation" icon={GitMerge} />

            <div className="grid grid-cols-2 gap-4">

              <div className="p-4 bg-[#081419] rounded border border-[#284149]">
                <div className="text-xs text-[#8299A0] uppercase mb-2 tracking-wide">
                  Scenario A: Stay at {portData.berth}
                </div>

                <div className="text-sm text-[#8299A0]">
                  Run an analysis to compare operational scenarios.
                </div>
              </div>

              <div className="p-4 bg-[#1A3037]/50 rounded border border-[#63C7B7]/50">
                <div className="text-xs text-[#63C7B7] uppercase mb-2 tracking-wide">
                  Scenario B: Optimised Berth
                </div>

                <div className="text-sm text-[#8299A0]">
                  Optimisation results will be shown after analysis.
                </div>
              </div>

            </div>
          </Card>

        </div>
      </div>
    </div>
  );
};


const OptimisationView = ({ navigate, isOptimized, setIsOptimized }: OptimisationViewProps) => {
  const [isApplying, setIsApplying] = useState(false);

  const handleApply = () => {
    setIsApplying(true);
    setTimeout(() => {
      setIsApplying(false);
      setIsOptimized(true);
    }, 800);
  };

  return (
    <div className="flex flex-col gap-6 h-full max-w-5xl mx-auto animate-in fade-in duration-300">

      <div className="text-center mb-4">
        <h2 className="text-2xl font-light text-[#E9E5DC] mb-2">Berth & Resource Recommendation</h2>
        <p className="text-[#8299A0]">System recommendation to mitigate 24h critical congestion at B03.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">

        {/* Current State Card */}
        <div className="md:col-span-3 bg-[#122229] border border-[#284149] rounded-xl p-6 relative opacity-70">
          <div className="absolute top-4 right-4"><RiskBadge risk="HIGH" /></div>
          <div className="text-xs text-[#8299A0] font-mono mb-4 uppercase">Current Assignment</div>

          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#1A3037] p-3 rounded-lg"><Ship className="text-[#E9E5DC]" size={24} /></div>
            <div>
              <div className="text-2xl text-[#E9E5DC] font-mono">{optimizationData.vessel}</div>
              <div className="text-sm text-[#8299A0]">Container Vessel</div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between border-b border-[#284149] pb-2">
              <span className="text-[#8299A0]">Target Berth</span>
              <span className={`font-medium text-lg ${isOptimized ? 'text-[#63C7B7]' : 'text-orange-500'}`}>
                  {isOptimized ? optimizationData.recommendedBerth : optimizationData.currentBerth}
              </span>
            </div>
            <div className="flex justify-between border-b border-[#284149] pb-2">
              <span className="text-[#8299A0]">Est. Congestion</span>
              <span className={isOptimized ? 'text-[#63C7B7]' : 'text-orange-500'}>
                  {isOptimized ? `${optimizationData.optimizedCongestion}%` : `${optimizationData.currentCongestion}%`}
              </span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-[#8299A0]">Crane Alloc.</span>
              <span className={isOptimized ? 'text-[#D79A52]' : 'text-[#E9E5DC]'}>
                  {isOptimized ? optimizationData.optimizedCrane : optimizationData.currentCrane}
              </span>
            </div>
          </div>
        </div>

        {/* Arrow Divider */}
        <div className="md:col-span-1 flex justify-center py-4">
          <div className="bg-[#1A3037] p-3 rounded-full border border-[#284149]">
            <ArrowRight className="text-[#63C7B7]" size={24} />
          </div>
        </div>

        {/* Recommended State Card */}
        <div className="md:col-span-3 bg-[#122229] border-2 border-[#63C7B7] rounded-xl p-6 relative shadow-[0_0_30px_rgba(99,199,183,0.1)]">
          <div className="absolute top-4 right-4 bg-[#63C7B7] text-[#081419] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">Recommended</div>
          <div className="text-xs text-[#63C7B7] font-mono mb-4 uppercase">Optimised Route</div>

          <div className="flex items-center gap-4 mb-6">
            <div className="bg-[#63C7B7]/20 p-3 rounded-lg"><Ship className="text-[#63C7B7]" size={24} /></div>
            <div>
              <div className="text-2xl text-[#E9E5DC] font-mono">{optimizationData.vessel}</div>
              <div className="text-sm text-[#63C7B7]">Re-routed</div>
            </div>
          </div>

          <div className="space-y-4 font-mono text-sm">
            <div className="flex justify-between border-b border-[#284149] pb-2">
              <span className="text-[#8299A0]">Target Berth</span>
              <span className="text-[#63C7B7] font-medium text-lg">{optimizationData.recommendedBerth}<span className="text-xs text-[#8299A0] font-sans font-normal ml-2">(Available Capacity)</span></span>
            </div>
            <div className="flex justify-between border-b border-[#284149] pb-2">
              <span className="text-[#8299A0]">Est. B03 Impact</span>
              <span className="text-[#63C7B7]">↓ {optimizationData.optimizedCongestion}%</span>
            </div>
            <div className="flex justify-between pb-2">
              <span className="text-[#8299A0]">Crane Alloc.</span>
              <span className="text-[#D79A52]">
                  Reassign {optimizationData.optimizedCrane}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Rationale block */}
      <Card className="bg-[#1A3037]/30">
        <h3 className="text-sm font-medium text-[#E9E5DC] mb-2 flex items-center gap-2">
          <Navigation size={16} className="text-[#8299A0]"/> Recommendation Rationale
        </h3>
        <p className="text-sm text-[#8299A0] leading-relaxed">
          B04 has available capacity during V204's expected operation window. Shifting V204 reduces projected peak pressure on B03 from <span className="text-orange-400">91%</span> to <span className="text-[#63C7B7]">64%</span>. Overall estimated waiting time for incoming fleet decreases by <span className="text-[#63C7B7]">34 minutes</span>. Requires concurrent reassignment of Crane C06 to B04.
        </p>
      </Card>

      {/* Action Footer */}
      <div className="mt-auto pt-6 flex justify-center gap-4">
        {isOptimized ? (
          <div className="flex flex-col items-center gap-4 w-full">
            <div className="bg-[#63C7B7]/10 text-[#63C7B7] border border-[#63C7B7]/30 rounded-lg p-4 flex items-center justify-center gap-3 w-full max-w-md">
              <CheckCircle2 size={24} />
              <div>
                <div className="font-medium">Recommendation Applied</div>
                <div className="text-sm opacity-80">V204 reassigned to B04. Plan updated.</div>
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
            {isApplying ? 'Applying...' : 'Apply Recommendation'}
          </button>
        )}
      </div>

    </div>
  );
};


const OperationalPlanView = ({ isOptimized }: OperationalPlanViewProps) => {

  // Dynamic mock data based on optimization state
  const planData = basePlanData.map((dayGroup) => ({
  ...dayGroup,
  items: dayGroup.items.map((item) => {
    if (item.vessel === optimizationData.vessel && item.time === "10:00") {
      return {
        ...item,
        berth: isOptimized
          ? optimizationData.recommendedBerth
          : optimizationData.currentBerth,
        resource: isOptimized ? "Crane C06" : "Crane C03",
        action: isOptimized ? "Berthing (reassigned)" : "Berthing",
        priority: isOptimized ? "MEDIUM" : "HIGH",
        highlight: isOptimized,
      };
    }

    if (item.vessel === "V221" && item.time === "16:30") {
      return {
        ...item,
        priority: isOptimized ? "HIGH" : "CRITICAL",
      };
    }

    return item;
  }),
}));

  return (
    <Card className="h-full flex flex-col overflow-hidden" noPadding>
      <div className="p-5 border-b border-[#284149] flex justify-between items-center bg-[#122229] z-10 sticky top-0">
        <div className="flex items-center gap-3">
          <Calendar size={20} className="text-[#8299A0]" />
          <h2 className="text-xl text-[#E9E5DC] font-medium tracking-wide">72-Hour Operational Plan</h2>
        </div>
        {isOptimized && (
          <div className="bg-[#63C7B7]/10 text-[#63C7B7] text-xs px-3 py-1 rounded font-medium flex items-center gap-1 border border-[#63C7B7]/20">
            <CheckCircle2 size={12} /> Plan updated based on optimisation
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-5">
        {planData.map((dayGroup, i) => (
          <div key={i} className="mb-8 last:mb-0">
            <h3 className="text-sm font-mono text-[#D79A52] mb-3 uppercase tracking-wider border-b border-[#284149] pb-2">
              {dayGroup.day}
            </h3>

            <div className="bg-[#081419] rounded-lg border border-[#1A3037] overflow-hidden">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="bg-[#122229] text-xs uppercase font-mono text-[#8299A0]">
                    <th className="p-3 font-medium">Time</th>
                    <th className="p-3 font-medium">Vessel</th>
                    <th className="p-3 font-medium">Berth</th>
                    <th className="p-3 font-medium">Resource</th>
                    <th className="p-3 font-medium">Action</th>
                    <th className="p-3 font-medium">Priority</th>
                  </tr>
                </thead>
                <tbody className="text-sm">
                  {dayGroup.items.map((item, j) => (
                    <tr
                      key={j}
                      className={`border-t border-[#1A3037] transition-colors
                        ${item.highlight ? 'bg-[#63C7B7]/5 hover:bg-[#63C7B7]/10' : 'hover:bg-[#122229]'}
                      `}
                    >
                      <td className="p-3 font-mono text-[#8299A0]">{item.time}</td>
                      <td className="p-3 font-mono text-[#E9E5DC]">{item.vessel}</td>
                      <td className={`p-3 font-mono font-medium ${item.highlight ? 'text-[#63C7B7]' : 'text-[#E9E5DC]'}`}>{item.berth}</td>
                      <td className="p-3 text-[#8299A0]">{item.resource}</td>
                      <td className="p-3 text-[#E9E5DC]">{item.action}</td>
                      <td className="p-3">
                        <RiskBadge risk={item.priority} />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
};


export default function SmartPortApp() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isOptimized, setIsOptimized] = useState(false);

  const tabs = [
    { id: 'dashboard', label: 'Port Dashboard', icon: LayoutDashboard },
    { id: 'analysis', label: 'Congestion Analysis', icon: Activity },
    { id: 'optimisation', label: 'Berth Optimisation', icon: Shuffle },
    { id: 'plan', label: '72-Hour Plan', icon: Calendar }
  ];

  return (
    <div className="flex h-screen bg-[#081419] text-[#E9E5DC] font-sans overflow-hidden">

      {/* Sidebar Navigation */}
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
                <div className="ml-auto w-2 h-2 rounded-full bg-orange-500 animate-pulse"></div>
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
              <div className="text-xs font-mono">Shift: 08:00 - 20:00</div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content Area */}
      <main className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="h-16 bg-[#081419] border-b border-[#284149] flex items-center justify-between px-6 shrink-0">
          <div className="flex items-center gap-3 text-sm font-medium">
             <span className="text-[#8299A0]">{tabs.find(t => t.id === activeTab)?.label}</span>
             <ChevronRight size={14} className="text-[#284149]" />
             <span className="text-[#E9E5DC]">Live View</span>
          </div>

          <div className="flex items-center gap-4">
             {/* Simulated Data Badge - subtle but clear */}
             <div className="bg-[#1A3037] border border-[#284149] text-[#8299A0] text-[10px] font-mono px-2 py-1 rounded uppercase tracking-widest flex items-center gap-2">
               <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
               Simulated Data
             </div>

             <button className="text-[#8299A0] hover:text-[#E9E5DC] transition-colors"><Settings2 size={18} /></button>
             <button className="text-[#8299A0] hover:text-[#E9E5DC] transition-colors"><Maximize2 size={18} /></button>
          </div>
        </header>

        {/* View Routing */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#081419]">
          {activeTab === 'dashboard' && <DashboardView navigate={setActiveTab} isOptimized={isOptimized} />}
          {activeTab === 'analysis' && <CongestionAnalysisView navigate={setActiveTab} isOptimized={isOptimized} />}
          {activeTab === 'optimisation' && <OptimisationView navigate={setActiveTab} isOptimized={isOptimized} setIsOptimized={setIsOptimized} />}
          {activeTab === 'plan' && <OperationalPlanView isOptimized={isOptimized} />}
        </div>

      </main>
    </div>
  );
}
