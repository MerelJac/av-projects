import { OneRMPoint } from "@/types/exercise";

function normalizeByDay(data: OneRMPoint[]): OneRMPoint[] {
  const byDay = new Map<string, number>();
  for (const point of data) {
    if (!point.value || point.value <= 0) continue;
    const existing = byDay.get(point.date);
    if (existing == null || point.value > existing) {
      byDay.set(point.date, point.value);
    }
  }
  return Array.from(byDay.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export function OneRMLineChart({ data }: { data: OneRMPoint[] }) {
  const normalized = normalizeByDay(data);

  if (normalized.length < 2) {
    return <p className="text-sm text-muted italic">Not enough data to show progress</p>;
  }

  const W = 300;
  const H = 120;
  const pad = { top: 12, right: 12, bottom: 28, left: 36 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const values = normalized.map((d) => d.value);
  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;

  const toX = (i: number) => pad.left + (i / (normalized.length - 1)) * chartW;
  const toY = (v: number) => pad.top + (1 - (v - min) / range) * chartH;

  const pointCoords = normalized.map((d, i) => ({ x: toX(i), y: toY(d.value), d }));
  const linePath = pointCoords.map((p, i) => `${i === 0 ? "M" : "L"}${p.x},${p.y}`).join(" ");

  // Filled area under line
  const areaPath = `${linePath} L${toX(normalized.length - 1)},${pad.top + chartH} L${pad.left},${pad.top + chartH} Z`;

  const yTicks = [min, min + range / 2, max].map(Math.round);

  // Format date: "Jan 5"
  const fmtDate = (str: string) => {
    const d = new Date(str);
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Latest value delta
  const delta = normalized.length >= 2
    ? normalized[normalized.length - 1].value - normalized[0].value
    : 0;
  const deltaPos = delta >= 0;

  return (
    <div className="space-y-2">
      {/* Mini stat row */}
      <div className="flex items-center justify-between">
        <span className="text-xs text-muted">
          Latest: <span className="font-syne font-bold text-foreground">
            {normalized[normalized.length - 1].value} lb
          </span>
        </span>
        <span className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
          deltaPos ? "text-[#3dffa0] bg-[#3dffa0]/10" : "text-[#ff5c5c] bg-[#ff5c5c]/10"
        }`}>
          {deltaPos ? "+" : ""}{delta} lb all time
        </span>
      </div>

      {/* SVG Chart */}
      <svg
        viewBox={`0 0 ${W} ${H}`}
        className="w-full"
        style={{ height: 120 }}
      >
        <defs>
          {/* Lime green gradient fill */}
          <linearGradient id="areaGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#c8f135" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#c8f135" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Grid lines */}
        {yTicks.map((tick, i) => {
          const y = toY(tick);
          return (
            <g key={i}>
              <line
                x1={pad.left} x2={W - pad.right}
                y1={y} y2={y}
                stroke="rgba(255,255,255,0.06)"
                strokeDasharray="3 3"
              />
              <text
                x={pad.left - 6} y={y + 3.5}
                textAnchor="end"
                fontSize="8"
                fill="#9a9aa8"
                fontFamily="sans-serif"
              >
                {tick}
              </text>
            </g>
          );
        })}

        {/* Area fill */}
        <path d={areaPath} fill="url(#areaGrad)" />

        {/* Line */}
        <path
          d={linePath}
          fill="none"
          stroke="#c8f135"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
        />

        {/* Dots */}
        {pointCoords.map((p, i) => (
          <circle
            key={i}
            cx={p.x} cy={p.y} r="2.5"
            fill="#0d0d0f"
            stroke="#c8f135"
            strokeWidth="1.5"
          />
        ))}

        {/* X labels: first and last only */}
        <text x={pad.left} y={H - 8} fontSize="8" fill="#9a9aa8"
          textAnchor="start" fontFamily="sans-serif">
          {fmtDate(normalized[0].date)}
        </text>
        <text x={W - pad.right} y={H - 8} fontSize="8" fill="#9a9aa8"
          textAnchor="end" fontFamily="sans-serif">
          {fmtDate(normalized[normalized.length - 1].date)}
        </text>
      </svg>
    </div>
  );
}