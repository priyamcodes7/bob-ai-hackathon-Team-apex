import { useState } from 'react';
import type { ReactNode, ComponentType } from 'react';
import {
  Activity, LayoutDashboard, Shuffle, Calendar,
  Ship, Anchor, Clock, ArrowRight, CheckCircle2, Info,
  ChevronRight, Navigation, GitMerge, BarChart2, ShieldAlert,
  Settings2, Maximize2
} from 'lucide-react';

import { predictPort } from './api';
import type { PredictionResult } from './api';

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

const metrics = {
  totalVessels: 37,
  waitingVessels: 11,
  berthUtil: 87,
  yardUtil: 76
};

const getBerthsData = (isOptimized: boolean) => [
  { id: 'B01', util: 42, risk: 'LOW', horizon: '72h', color: colors.riskLow },
  { id: 'B02', util: 61, risk: 'MEDIUM', horizon: '48h', color: colors.riskMed },
  {
    id: 'B03',
    util: isOptimized ? 64 : 87,
    risk: isOptimized ? 'MEDIUM' : 'HIGH',
    horizon: '24h',
    color: isOptimized ? colors.riskMed : colors.riskHigh,
    isHotspot: !isOptimized
  },
  {
    id: 'B04',
    util: isOptimized ? 73 : 61,
    risk: isOptimized ? 'MEDIUM' : 'LOW',
    horizon: '72h',
    color: isOptimized ? colors.riskMed : colors.riskLow
  }
];

const forecastData = [
  { time: 'NOW', val: 87, risk: 'HIGH', color: colors.riskHigh },
  { time: '6h', val: 65, risk: 'MEDIUM', color: colors.riskMed },
  { time: '12h', val: 78, risk: 'HIGH', color: colors.riskHigh },
  { time: '24h', val: 95, risk: 'CRITICAL', color: colors.riskCrit },
  { time: '48h', val: 82, risk: 'HIGH', color: colors.riskHigh },
  { time: '72h', val: 58, risk: 'MEDIUM', color: colors.riskMed }
];

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
      bg = 'bg-[#63C7B7]/10';
      text = 'text-[#63C7B7]';
      break;

    case 'MEDIUM':
      bg = 'bg-amber-500/10';
      text = 'text-amber-500';
      break;

    case 'HIGH':
      bg = 'bg-orange-500/10';
      text = 'text-orange-500';
      break;

    case 'CRITICAL':
      bg = 'bg-red-500/10';
      text = 'text-red-500';
      break;

    default:
      bg = 'bg-gray-500/10';
      text = 'text-gray-500';
  }

  const sizeClasses =
    size === 'sm'
      ? 'px-2 py-0.5 text-xs'
      : 'px-3 py-1 text-sm font-medium';

  return (
    <span
      className={`inline-flex items-center ${bg} ${text} ${sizeClasses} rounded font-mono border border-current/20 uppercase`}
    >
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
          <span className="text-[#E9E5DC] font-medium">
            Live Terminal Map
          </span>
        </div>

        <div className="text-xs text-[#8299A0] font-mono flex items-center gap-3">
          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-[#63C7B7]"></div>
            Low
          </span>

          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-orange-500"></div>
            High
          </span>

          <span className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-red-500"></div>
            Critical
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
              width: '80px',
              height: '36px',
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
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <path
                d="M 50% 50% L 50% 100%"
                stroke="#F97316"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
                className="opacity-50"
              />

              <path
                d="M 50% 50% L 75% 100%"
                stroke="#63C7B7"
                strokeWidth="1"
                strokeDasharray="2 4"
                fill="none"
                className="opacity-30"
              />
            </svg>
          )}

          {isOptimized && (
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none"
              style={{ zIndex: 0 }}
            >
              <path
                d="M 75% 50% L 75% 100%"
                stroke="#F59E0B"
                strokeWidth="2"
                strokeDasharray="4 4"
                fill="none"
                className="opacity-50"
              />
            </svg>
          )}
        </div>

        <div className="h-12 w-full flex relative z-10 -mt-6">

          <div className="flex-1 flex justify-center items-center group cursor-pointer border-t-4 border-[#63C7B7]">
            <div className="bg-[#122229] border border-[#284149] text-xs font-mono px-2 py-1 text-[#E9E5DC]">
              B01
            </div>
          </div>

          <div className="flex-1 flex justify-center items-center border-t-4 border-amber-500">
            <div className="bg-[#122229] border border-[#284149] text-xs font-mono px-2 py-1 text-[#E9E5DC]">
              B02
            </div>
          </div>

          <div
            className={`flex-1 flex justify-center items-center cursor-pointer transition-colors border-t-4 ${
              isOptimized
                ? 'border-amber-500'
                : 'border-orange-500 hover:bg-orange-500/10'
            }`}
            onClick={() => !isOptimized && onBerthClick('analysis')}
          >
            <div
              className={`bg-[#122229] border ${
                isOptimized ? 'border-[#284149]' : 'border-orange-500'
              } text-xs font-mono px-2 py-1 text-[#E9E5DC] flex items-center gap-1`}
            >
              B03

              {!isOptimized && (
                <ShieldAlert size={12} className="text-orange-500" />
              )}
            </div>
          </div>

          <div
            className={`flex-1 flex justify-center items-center border-t-4 ${
              isOptimized ? 'border-amber-500' : 'border-[#63C7B7]'
            }`}
          >
            <div
              className={`bg-[#122229] border ${
                isOptimized ? 'border-amber-500' : 'border-[#284149]'
              } text-xs font-mono px-2 py-1 text-[#E9E5DC]`}
            >
              B04
            </div>
          </div>
        </div>

        <div className="flex-1 bg-[#122229]/50 border border-[#1A3037] mt-2 flex flex-col p-2">

          <div className="text-[10px] text-[#8299A0] font-mono mb-2 uppercase">
            Container Yard (76% Util)
          </div>

          <div className="flex-1 grid grid-cols-8 gap-2 opacity-40">
            {Array.from({ length: 32 }).map((_, i) => (
              <div
                key={i}
                className={`bg-[#284149] rounded-sm ${
                  i % 7 === 0 || i % 5 === 0
                    ? 'bg-[#D79A52]/40'
                    : ''
                }`}
              ></div>
            ))}
          </div>
        </div>
      </div>
    </Card>
  );
};

const DashboardView = ({
  navigate,
  isOptimized
}: DashboardViewProps) => {

  const berths = getBerthsData(isOptimized);
  const hotspot = berths.find(b => b.isHotspot);

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-300">

      <div className="grid grid-cols-4 gap-4">

        {[
          { label: 'Total Vessels', val: metrics.totalVessels, icon: Ship },
          { label: 'Waiting Vessels', val: metrics.waitingVessels, icon: Clock, alert: true },
          { label: 'Berth Utilisation', val: `${metrics.berthUtil}%`, icon: Anchor },
          { label: 'Yard Utilisation', val: `${metrics.yardUtil}%`, icon: LayoutDashboard }
        ].map((m, i) => (
          <Card key={i} className="flex flex-col justify-center py-4">

            <div className="flex justify-between items-start mb-2">

              <span className="text-sm text-[#8299A0] uppercase tracking-wider">
                {m.label}
              </span>

              <m.icon
                size={16}
                className={
                  m.alert
                    ? 'text-orange-500'
                    : 'text-[#63C7B7]'
                }
              />
            </div>

            <div className="text-3xl text-[#E9E5DC] font-light">
              {m.val}
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-3 gap-5 flex-1 min-h-0">

        <div className="col-span-2 flex flex-col gap-4">

          {hotspot && (
            <div className="bg-orange-500/10 border border-orange-500/30 rounded-lg p-4 flex items-center justify-between">

              <div className="flex items-center gap-4">

                <div className="bg-orange-500/20 p-2 rounded-full">
                  <ShieldAlert size={24} className="text-orange-500" />
                </div>

                <div>
                  <h3 className="text-orange-500 font-medium tracking-wide uppercase text-sm mb-1">
                    Priority Alert
                  </h3>

                  <p className="text-[#E9E5DC] text-sm">
                    {hotspot.id} is predicted to experience{' '}
                    <span className="font-bold text-orange-400">
                      HIGH
                    </span>{' '}
                    congestion within {hotspot.horizon}.
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
            <PortMap
              isOptimized={isOptimized}
              onBerthClick={navigate}
            />
          </div>
        </div>

        <Card
          className="flex flex-col h-full overflow-hidden"
          noPadding
        >

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
                onClick={() =>
                  b.isHotspot
                    ? navigate('analysis')
                    : null
                }
              >

                <div className="flex justify-between items-center">

                  <div className="flex items-center gap-3">

                    <span className="text-xl font-mono text-[#E9E5DC]">
                      {b.id}
                    </span>

                    <RiskBadge risk={b.risk} />
                  </div>

                  <span className="text-xl font-light text-[#E9E5DC]">
                    {b.util}%
                  </span>
                </div>

                <div className="w-full bg-[#081419] h-1.5 rounded-full overflow-hidden">

                  <div
                    className="h-full rounded-full transition-all duration-1000"
                    style={{
                      width: `${b.util}%`,
                      backgroundColor: b.color
                    }}
                  ></div>
                </div>

                <div className="flex justify-between text-xs font-mono text-[#8299A0]">

                  <span>
                    Forecast Window: {b.horizon}
                  </span>

                  {b.isHotspot && (
                    <span className="text-orange-500 flex items-center gap-1">
                      Analyze
                      <ChevronRight size={12} />
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


/* =========================================================
   REAL BACKEND CONNECTED CONGESTION ANALYSIS
   ========================================================= */

const CongestionAnalysisView = ({
  navigate
}: CongestionAnalysisViewProps) => {

  const [result, setResult] =
    useState<PredictionResult | null>(null);

  const [loading, setLoading] = useState(false);

  const [error, setError] = useState<string | null>(null);

  const handlePrediction = async () => {

    setLoading(true);
    setError(null);

    try {

      const data = await predictPort({
        vessel_count: 80,
        container_count: 350,
        avg_waiting_time: 18,
        berth_utilization: 80
      });

      setResult(data);

    } catch (err) {

      console.error(err);

      setError(
        'Unable to connect to SmartPort AI backend. Make sure FastAPI is running on port 8000.'
      );

    } finally {

      setLoading(false);
    }
  };

  const congestionLevel =
    result?.prediction.congestion_level?.toUpperCase() || 'HIGH';

  return (
    <div className="flex flex-col gap-5 h-full animate-in fade-in duration-300">

      {/* LIVE PREDICTION BUTTON */}

      <div className="flex justify-between items-center">

        <div>
          <h2 className="text-xl text-[#E9E5DC] font-medium">
            AI Congestion Analysis
          </h2>

          <p className="text-sm text-[#8299A0] mt-1">
            Live prediction powered by SmartPort AI ML model
          </p>
        </div>

        <button
          onClick={handlePrediction}
          disabled={loading}
          className="bg-[#63C7B7] hover:bg-[#4EAC9C] disabled:opacity-60 text-[#081419] px-5 py-3 rounded-lg font-medium transition-colors flex items-center gap-2"
        >
          <Activity size={18} />

          {loading
            ? 'Running AI Model...'
            : 'Run Live Prediction'}
        </button>
      </div>

      {/* ERROR */}

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 text-red-400 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-3 gap-5">

        {/* LEFT PANEL */}

        <div className="col-span-1 flex flex-col gap-5">

          <Card>

            <SectionHeader
              title="Congestion Prediction"
              icon={ShieldAlert}
            />

            <div className="mb-6 flex justify-between items-end border-b border-[#284149] pb-6">

              <div>

                <div className="text-sm text-[#8299A0] font-mono mb-1">
                  BERTH
                </div>

                <div className="text-4xl text-[#E9E5DC] font-mono">
                  B03
                </div>
              </div>

              <div className="text-right">

                <RiskBadge
                  risk={congestionLevel}
                  size="lg"
                />

                <div className="text-sm text-[#8299A0] font-mono mt-2">
                  LIVE MODEL RESULT
                </div>
              </div>
            </div>

            <div className="mb-6">

              <div className="flex justify-between text-sm mb-2">

                <span className="text-[#8299A0]">
                  Model Status
                </span>

                <span className="text-[#63C7B7] font-mono text-sm">
                  {result ? 'PREDICTION COMPLETE' : 'READY'}
                </span>
              </div>

              <div className="w-full bg-[#081419] h-2 rounded-full overflow-hidden">

                <div
                  className={`h-full rounded-full ${
                    congestionLevel === 'CRITICAL'
                      ? 'bg-red-500 w-[95%]'
                      : congestionLevel === 'HIGH'
                        ? 'bg-orange-500 w-[85%]'
                        : congestionLevel === 'MEDIUM'
                          ? 'bg-amber-500 w-[60%]'
                          : 'bg-[#63C7B7] w-[30%]'
                  }`}
                ></div>

              </div>
            </div>

            <div>

              <h3 className="text-sm uppercase tracking-wide text-[#8299A0] mb-3">
                AI Contributing Factors
              </h3>

              {!result && (
                <div className="p-3 bg-[#1A3037]/50 rounded text-sm text-[#8299A0]">
                  Click <strong className="text-[#63C7B7]">Run Live Prediction</strong> to get factors from the backend.
                </div>
              )}

              {result && (
                <ul className="flex flex-col gap-2 font-mono text-xs">

                  {result.explanation.reasons.map(
                    (reason, index) => (
                      <li
                        key={index}
                        className="flex items-center gap-2 p-2 bg-[#1A3037]/50 rounded"
                      >
                        <CheckCircle2
                          size={14}
                          className="text-[#63C7B7]"
                        />

                        <span className="text-[#E9E5DC]">
                          {reason}
                        </span>
                      </li>
                    )
                  )}

                </ul>
              )}
            </div>

          </Card>

          {/* EXPLANATION */}

          <Card className="bg-[#1A3037]/30 border-l-4 border-l-[#63C7B7]">

            <div className="flex items-start gap-3">

              <Info
                className="text-[#63C7B7] shrink-0 mt-0.5"
                size={18}
              />

              <div className="text-sm text-[#E9E5DC] leading-relaxed">

                <strong className="font-medium text-white">
                  AI Explanation:
                </strong>

                {!result && (
                  <p className="mt-1 text-[#8299A0]">
                    Run the live prediction to receive an explanation from the SmartPort AI backend.
                  </p>
                )}

                {result && (
                  <ul className="mt-2 list-disc list-inside text-[#E9E5DC]">
                    {result.explanation.reasons.map(
                      (reason, index) => (
                        <li key={index}>
                          {reason}
                        </li>
                      )
                    )}
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
              title="72-Hour Congestion Forecast (B03)"
              icon={BarChart2}
            />

            <div className="flex-1 flex items-end gap-2 pt-10 pb-8 px-4 relative min-h-[300px]">

              <div className="absolute inset-0 pt-10 pb-8 px-4 flex flex-col justify-between pointer-events-none z-0">

                {[100, 75, 50, 25, 0].map(val => (
                  <div
                    key={val}
                    className="border-b border-[#284149]/50 w-full flex items-center"
                  >
                    <span className="absolute -left-6 text-[10px] text-[#8299A0] font-mono">
                      {val}%
                    </span>
                  </div>
                ))}

              </div>

              {forecastData.map((d, i) => (

                <div
                  key={i}
                  className="flex-1 flex flex-col justify-end items-center gap-3 relative z-10 h-full group"
                >

                  <div className="opacity-0 group-hover:opacity-100 absolute -top-8 bg-[#081419] border border-[#284149] text-xs px-2 py-1 rounded text-[#E9E5DC] transition-opacity">
                    {d.val}%
                  </div>

                  <div
                    className="w-16 rounded-t-sm transition-all duration-500 relative"
                    style={{
                      height: `${d.val}%`,
                      backgroundColor: d.color
                    }}
                  >
                    {d.risk === 'CRITICAL' && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-0 h-0 border-l-[6px] border-l-transparent border-r-[6px] border-r-transparent border-t-[6px] border-t-red-500"></div>
                    )}
                  </div>

                  <div className="text-xs font-mono text-[#8299A0]">
                    {d.time}
                  </div>

                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-[#081419] rounded border border-[#284149] flex justify-between items-center">

              <span className="text-sm text-[#8299A0]">
                Forecast visualization is currently using simulated 72-hour planning data.
              </span>

              <RiskBadge risk="CRITICAL" />

            </div>

          </Card>

          {/* BACKEND OPTIMIZATION RESULT */}

          <Card>

            <SectionHeader
              title="AI Recommended Actions"
              icon={GitMerge}
            />

            {!result && (
              <div className="text-sm text-[#8299A0]">
                Run the live prediction to receive recommended operational actions.
              </div>
            )}

            {result && (
              <div className="flex flex-col gap-3">

                {result.optimization.recommended_actions.map(
                  (action, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-3 bg-[#1A3037]/50 rounded border border-[#284149]"
                    >
                      <div className="w-6 h-6 rounded-full bg-[#63C7B7]/10 text-[#63C7B7] flex items-center justify-center text-xs font-mono shrink-0">
                        {index + 1}
                      </div>

                      <span className="text-sm text-[#E9E5DC]">
                        {action}
                      </span>
                    </div>
                  )
                )}

              </div>
            )}

          </Card>

        </div>
      </div>
    </div>
  );
};


/* =========================================================
   OPTIMISATION VIEW
   ========================================================= */

const OptimisationView = ({
  navigate,
  isOptimized,
  setIsOptimized
}: OptimisationViewProps) => {

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

        <h2 className="text-2xl font-light text-[#E9E5DC] mb-2">
          Berth & Resource Recommendation
        </h2>

        <p className="text-[#8299A0]">
          System recommendation to mitigate 24h critical congestion at B03.
        </p>

      </div>

      <div className="grid grid-cols-1 md:grid-cols-7 gap-4 items-center">

        <div className="md:col-span-3 bg-[#122229] border border-[#284149] rounded-xl p-6 relative opacity-70">

          <div className="absolute top-4 right-4">
            <RiskBadge risk="HIGH" />
          </div>

          <div className="text-xs text-[#8299A0] font-mono mb-4 uppercase">
            Current Assignment
          </div>

          <div className="flex items-center gap-4 mb-6">

            <div className="bg-[#1A3037] p-3 rounded-lg">
              <Ship className="text-[#E9E5DC]" size={24} />
            </div>

            <div>
              <div className="text-2xl text-[#E9E5DC] font-mono">
                V204
              </div>

              <div className="text-sm text-[#8299A0]">
                Container Vessel
              </div>
            </div>

          </div>

          <div className="space-y-4 font-mono text-sm">

            <div className="flex justify-between border-b border-[#284149] pb-2">

              <span className="text-[#8299A0]">
                Target Berth
              </span>

              <span
                className={`font-medium text-lg ${
                  isOptimized
                    ? 'text-[#63C7B7]'
                    : 'text-orange-500'
                }`}
              >
                {isOptimized ? 'B04' : 'B03'}
              </span>

            </div>

            <div className="flex justify-between border-b border-[#284149] pb-2">

              <span className="text-[#8299A0]">
                Est. Congestion
              </span>

              <span
                className={
                  isOptimized
                    ? 'text-[#63C7B7]'
                    : 'text-orange-500'
                }
              >
                {isOptimized ? '64%' : '91%'}
              </span>

            </div>

            <div className="flex justify-between pb-2">

              <span className="text-[#8299A0]">
                Crane Alloc.
              </span>

              <span
                className={
                  isOptimized
                    ? 'text-[#D79A52]'
                    : 'text-[#E9E5DC]'
                }
              >
                {isOptimized
                  ? 'C06 → B04'
                  : 'Standard'}
              </span>

            </div>

          </div>
        </div>

        <div className="md:col-span-1 flex justify-center py-4">

          <div className="bg-[#1A3037] p-3 rounded-full border border-[#284149]">
            <ArrowRight
              className="text-[#63C7B7]"
              size={24}
            />
          </div>

        </div>

        <div className="md:col-span-3 bg-[#122229] border-2 border-[#63C7B7] rounded-xl p-6 relative shadow-[0_0_30px_rgba(99,199,183,0.1)]">

          <div className="absolute top-4 right-4 bg-[#63C7B7] text-[#081419] text-xs font-bold px-2 py-1 rounded uppercase tracking-wider">
            Recommended
          </div>

          <div className="text-xs text-[#63C7B7] font-mono mb-4 uppercase">
            Optimised Route
          </div>

          <div className="flex items-center gap-4 mb-6">

            <div className="bg-[#63C7B7]/20 p-3 rounded-lg">
              <Ship
                className="text-[#63C7B7]"
                size={24}
              />
            </div>

            <div>

              <div className="text-2xl text-[#E9E5DC] font-mono">
                V204
              </div>

              <div className="text-sm text-[#63C7B7]">
                Re-routed
              </div>

            </div>
          </div>

          <div className="space-y-4 font-mono text-sm">

            <div className="flex justify-between border-b border-[#284149] pb-2">

              <span className="text-[#8299A0]">
                Target Berth
              </span>

              <span className="text-[#63C7B7] font-medium text-lg">
                B04
                <span className="text-xs text-[#8299A0] font-sans font-normal ml-2">
                  (Available Capacity)
                </span>
              </span>

            </div>

            <div className="flex justify-between border-b border-[#284149] pb-2">

              <span className="text-[#8299A0]">
                Est. B03 Impact
              </span>

              <span className="text-[#63C7B7]">
                ↓ 64%
              </span>

            </div>

            <div className="flex justify-between pb-2">

              <span className="text-[#8299A0]">
                Crane Alloc.
              </span>

              <span className="text-[#D79A52]">
                Reassign C06 to B04
              </span>

            </div>

          </div>
        </div>
      </div>

      <Card className="bg-[#1A3037]/30">

        <h3 className="text-sm font-medium text-[#E9E5DC] mb-2 flex items-center gap-2">
          <Navigation
            size={16}
            className="text-[#8299A0]"
          />
          Recommendation Rationale
        </h3>

        <p className="text-sm text-[#8299A0] leading-relaxed">

          B04 has available capacity during V204's expected operation window.
          Shifting V204 reduces projected peak pressure on B03 from{' '}
          <span className="text-orange-400">
            91%
          </span>{' '}
          to{' '}
          <span className="text-[#63C7B7]">
            64%
          </span>.
          Overall estimated waiting time for incoming fleet decreases by{' '}
          <span className="text-[#63C7B7]">
            34 minutes
          </span>.
          Requires concurrent reassignment of Crane C06 to B04.

        </p>

      </Card>

      <div className="mt-auto pt-6 flex justify-center gap-4">

        {isOptimized ? (

          <div className="flex flex-col items-center gap-4 w-full">

            <div className="bg-[#63C7B7]/10 text-[#63C7B7] border border-[#63C7B7]/30 rounded-lg p-4 flex items-center justify-center gap-3 w-full max-w-md">

              <CheckCircle2 size={24} />

              <div>

                <div className="font-medium">
                  Recommendation Applied
                </div>

                <div className="text-sm opacity-80">
                  V204 reassigned to B04. Plan updated.
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
            {isApplying
              ? 'Applying...'
              : 'Apply Recommendation'}
          </button>

        )}

      </div>
    </div>
  );
};


/* =========================================================
   OPERATIONAL PLAN
   ========================================================= */

const OperationalPlanView = ({
  isOptimized
}: OperationalPlanViewProps) => {

  const planData = [
    {
      day: 'TODAY',
      items: [
        {
          time: '08:00',
          vessel: 'V201',
          berth: 'B02',
          resource: 'Crane C04',
          action: 'Berthing',
          priority: 'NORMAL'
        },
        {
          time: '10:00',
          vessel: 'V204',
          berth: isOptimized ? 'B04' : 'B03',
          resource: isOptimized ? 'Crane C06' : 'Crane C03',
          action: isOptimized
            ? 'Berthing (reassigned)'
            : 'Berthing',
          priority: isOptimized
            ? 'MEDIUM'
            : 'HIGH',
          highlight: isOptimized
        },
        {
          time: '12:30',
          vessel: 'N/A',
          berth: 'B03',
          resource: 'Crane C07',
          action: 'Maintenance window',
          priority: 'MEDIUM'
        },
        {
          time: '15:00',
          vessel: 'V206',
          berth: 'B01',
          resource: 'Crane C02',
          action: 'Departure',
          priority: 'NORMAL'
        }
      ]
    },

    {
      day: 'TOMORROW',
      items: [
        {
          time: '09:00',
          vessel: 'V209',
          berth: 'B01',
          resource: 'Crane C01',
          action: 'Berthing',
          priority: 'NORMAL'
        },
        {
          time: '11:30',
          vessel: 'V211',
          berth: 'B04',
          resource: 'Crane C06',
          action: 'Berthing',
          priority: 'MEDIUM'
        },
        {
          time: '14:00',
          vessel: 'V213',
          berth: 'B03',
          resource: 'Crane C07',
          action: 'Departure',
          priority: 'HIGH'
        }
      ]
    },

    {
      day: 'DAY 3',
      items: [
        {
          time: '09:30',
          vessel: 'V215',
          berth: 'B02',
          resource: 'Crane C04',
          action: 'Berthing',
          priority: 'NORMAL'
        },
        {
          time: '13:00',
          vessel: 'V219',
          berth: 'B04',
          resource: 'Crane C06',
          action: 'Berthing',
          priority: 'HIGH'
        },
        {
          time: '16:30',
          vessel: 'V221',
          berth: 'B03',
          resource: 'Crane C03',
          action: 'Departure',
          priority: isOptimized
            ? 'HIGH'
            : 'CRITICAL'
        }
      ]
    }
  ];

  return (
    <Card
      className="h-full flex flex-col overflow-hidden"
      noPadding
    >

      <div className="p-5 border-b border-[#284149] flex justify-between items-center bg-[#122229] z-10 sticky top-0">

        <div className="flex items-center gap-3">

          <Calendar
            size={20}
            className="text-[#8299A0]"
          />

          <h2 className="text-xl text-[#E9E5DC] font-medium tracking-wide">
            72-Hour Operational Plan
          </h2>

        </div>

        {isOptimized && (
          <div className="bg-[#63C7B7]/10 text-[#63C7B7] text-xs px-3 py-1 rounded font-medium flex items-center gap-1 border border-[#63C7B7]/20">
            <CheckCircle2 size={12} />
            Plan updated based on optimisation
          </div>
        )}

      </div>

      <div className="flex-1 overflow-y-auto p-5">

        {planData.map((dayGroup, i) => (

          <div
            key={i}
            className="mb-8 last:mb-0"
          >

            <h3 className="text-sm font-mono text-[#D79A52] mb-3 uppercase tracking-wider border-b border-[#284149] pb-2">
              {dayGroup.day}
            </h3>

            <div className="bg-[#081419] rounded-lg border border-[#1A3037] overflow-hidden">

              <table className="w-full text-left border-collapse">

                <thead>

                  <tr className="bg-[#122229] text-xs uppercase font-mono text-[#8299A0]">

                    <th className="p-3 font-medium">
                      Time
                    </th>

                    <th className="p-3 font-medium">
                      Vessel
                    </th>

                    <th className="p-3 font-medium">
                      Berth
                    </th>

                    <th className="p-3 font-medium">
                      Resource
                    </th>

                    <th className="p-3 font-medium">
                      Action
                    </th>

                    <th className="p-3 font-medium">
                      Priority
                    </th>

                  </tr>

                </thead>

                <tbody className="text-sm">

                  {dayGroup.items.map((item, j) => (

                    <tr
                      key={j}
                      className={`border-t border-[#1A3037] transition-colors ${
                        item.highlight
                          ? 'bg-[#63C7B7]/5 hover:bg-[#63C7B7]/10'
                          : 'hover:bg-[#122229]'
                      }`}
                    >

                      <td className="p-3 font-mono text-[#8299A0]">
                        {item.time}
                      </td>

                      <td className="p-3 font-mono text-[#E9E5DC]">
                        {item.vessel}
                      </td>

                      <td
                        className={`p-3 font-mono font-medium ${
                          item.highlight
                            ? 'text-[#63C7B7]'
                            : 'text-[#E9E5DC]'
                        }`}
                      >
                        {item.berth}
                      </td>

                      <td className="p-3 text-[#8299A0]">
                        {item.resource}
                      </td>

                      <td className="p-3 text-[#E9E5DC]">
                        {item.action}
                      </td>

                      <td className="p-3">
                        <RiskBadge
                          risk={item.priority}
                        />
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


/* =========================================================
   MAIN APP
   ========================================================= */

export default function SmartPortApp() {

  const [activeTab, setActiveTab] =
    useState('dashboard');

  const [isOptimized, setIsOptimized] =
    useState(false);

  const tabs = [
    {
      id: 'dashboard',
      label: 'Port Dashboard',
      icon: LayoutDashboard
    },
    {
      id: 'analysis',
      label: 'Congestion Analysis',
      icon: Activity
    },
    {
      id: 'optimisation',
      label: 'Berth Optimisation',
      icon: Shuffle
    },
    {
      id: 'plan',
      label: '72-Hour Plan',
      icon: Calendar
    }
  ];

  return (
    <div className="flex h-screen bg-[#081419] text-[#E9E5DC] font-sans overflow-hidden">

      <aside className="w-64 bg-[#122229] border-r border-[#284149] flex flex-col z-20">

        <div className="h-16 flex items-center px-6 border-b border-[#284149]">

          <div className="flex items-center gap-2">

            <Anchor
              className="text-[#63C7B7]"
              size={24}
            />

            <h1 className="text-lg font-medium tracking-wide text-white">
              SmartPort AI
            </h1>

          </div>
        </div>

        <nav className="flex-1 py-6 flex flex-col gap-1 px-3">

          <div className="text-xs font-mono text-[#8299A0] uppercase tracking-wider px-3 mb-2">
            Operations
          </div>

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

              {tab.id === 'analysis' &&
                !isOptimized && (
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

              <div className="text-[#E9E5DC]">
                Operations Manager
              </div>

              <div className="text-xs font-mono">
                Shift: 08:00 - 20:00
              </div>

            </div>

          </div>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0">

        <header className="h-16 bg-[#081419] border-b border-[#284149] flex items-center justify-between px-6 shrink-0">

          <div className="flex items-center gap-3 text-sm font-medium">

            <span className="text-[#8299A0]">
              {tabs.find(
                t => t.id === activeTab
              )?.label}
            </span>

            <ChevronRight
              size={14}
              className="text-[#284149]"
            />

            <span className="text-[#E9E5DC]">
              Live View
            </span>

          </div>

          <div className="flex items-center gap-4">

            <div className="bg-[#1A3037] border border-[#284149] text-[#8299A0] text-[10px] font-mono px-2 py-1 rounded uppercase tracking-widest flex items-center gap-2">

              <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>

              Simulated Data
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
            <DashboardView
              navigate={setActiveTab}
              isOptimized={isOptimized}
            />
          )}

          {activeTab === 'analysis' && (
            <CongestionAnalysisView
              navigate={setActiveTab}
              isOptimized={isOptimized}
            />
          )}

          {activeTab === 'optimisation' && (
            <OptimisationView
              navigate={setActiveTab}
              isOptimized={isOptimized}
              setIsOptimized={setIsOptimized}
            />
          )}

          {activeTab === 'plan' && (
            <OperationalPlanView
              isOptimized={isOptimized}
            />
          )}

        </div>
      </main>
    </div>
  );
}