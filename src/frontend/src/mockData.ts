export const metrics = {
  totalVessels: 37,
  waitingVessels: 11,
  berthUtil: 87,
  yardUtil: 76,
};

export const getBerthsData = (isOptimized: boolean) => [
  {
    id: "B01",
    util: 42,
    risk: "LOW",
    horizon: "72h",
  },
  {
    id: "B02",
    util: 61,
    risk: "MEDIUM",
    horizon: "48h",
  },
  {
    id: "B03",
    util: isOptimized ? 64 : 87,
    risk: isOptimized ? "MEDIUM" : "HIGH",
    horizon: "24h",
    isHotspot: !isOptimized,
  },
  {
    id: "B04",
    util: isOptimized ? 73 : 61,
    risk: isOptimized ? "MEDIUM" : "LOW",
    horizon: "72h",
  },
];

export const forecastData = [
  { time: "NOW", val: 87, risk: "HIGH" },
  { time: "6h", val: 65, risk: "MEDIUM" },
  { time: "12h", val: 78, risk: "HIGH" },
  { time: "24h", val: 95, risk: "CRITICAL" },
  { time: "48h", val: 82, risk: "HIGH" },
  { time: "72h", val: 58, risk: "MEDIUM" },
];

export const optimizationData = {
  vessel: "V204",
  currentBerth: "B03",
  recommendedBerth: "B04",
  currentCongestion: 91,
  optimizedCongestion: 64,
  waitReductionMinutes: 34,
  currentCrane: "Standard",
  optimizedCrane: "C06 → B04",
  reason:
    "B04 has available capacity during V204's expected operation window.",
};

export const planData = [
  {
    day: "TODAY",
    items: [
      {
        time: "08:00",
        vessel: "V201",
        berth: "B02",
        resource: "Crane C04",
        action: "Berthing",
        priority: "NORMAL",
      },
      {
        time: "10:00",
        vessel: "V204",
        berth: "B03",
        resource: "Crane C03",
        action: "Berthing",
        priority: "HIGH",
        highlight: false,
      },
      {
        time: "12:30",
        vessel: "N/A",
        berth: "B03",
        resource: "Crane C07",
        action: "Maintenance window",
        priority: "MEDIUM",
      },
      {
        time: "15:00",
        vessel: "V206",
        berth: "B01",
        resource: "Crane C02",
        action: "Departure",
        priority: "NORMAL",
      },
    ],
  },
  {
    day: "TOMORROW",
    items: [
      {
        time: "09:00",
        vessel: "V209",
        berth: "B01",
        resource: "Crane C01",
        action: "Berthing",
        priority: "NORMAL",
      },
      {
        time: "11:30",
        vessel: "V211",
        berth: "B04",
        resource: "Crane C06",
        action: "Berthing",
        priority: "MEDIUM",
      },
      {
        time: "14:00",
        vessel: "V213",
        berth: "B03",
        resource: "Crane C07",
        action: "Departure",
        priority: "HIGH",
      },
    ],
  },
  {
    day: "DAY 3",
    items: [
      {
        time: "09:30",
        vessel: "V215",
        berth: "B02",
        resource: "Crane C04",
        action: "Berthing",
        priority: "NORMAL",
      },
      {
        time: "13:00",
        vessel: "V219",
        berth: "B04",
        resource: "Crane C06",
        action: "Berthing",
        priority: "HIGH",
      },
      {
        time: "16:30",
        vessel: "V221",
        berth: "B03",
        resource: "Crane C03",
        action: "Departure",
        priority: "CRITICAL",
      },
    ],
  },
];