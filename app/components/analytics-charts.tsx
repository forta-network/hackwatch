"use client";

import { useMemo, useState } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ScatterChart,
  Scatter,
  Legend,
  ZAxis,
} from "recharts";
import { ChartContainer, ChartTooltipContent } from "./ui/chart";
import { SeverityBadge } from "./severity-badge";
import type { Exploit } from "../types";
import {
  Shield,
  ShieldOff,
  Flame,
  DollarSign,
  Activity,
  ExternalLink,
  Crosshair,
  Eye,
} from "lucide-react";

// ── Palette ────────────────────────────────────────────────────────
const C = {
  emerald: "#34d399",
  zinc500: "#71717a",
  zinc700: "#3f3f46",
  zinc800: "#27272a",
  amber: "#fbbf24",
  red: "#f87171",
  cyan: "#22d3ee",
  violet: "#a78bfa",
};

const BAR_CURSOR = { fill: "rgba(255,255,255,0.03)" };
const SCATTER_CURSOR = { strokeDasharray: "3 3", stroke: "#3f3f46" };
const TICK = { fill: "#a1a1aa", fontSize: 11 };
const GRID = { strokeDasharray: "3 3", stroke: "#27272a" };

// ── Helpers ────────────────────────────────────────────────────────
function formatFunds(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return "$0";
}

function riskColor(r: number | null): string {
  if (r === null) return "#3f3f46";
  if (r >= 0.8) return "#ef4444";
  if (r >= 0.5) return "#f59e0b";
  if (r >= 0.1) return "#eab308";
  return "#22c55e";
}

function ChartCard({
  title,
  subtitle,
  children,
  className = "",
}: {
  title: string;
  subtitle: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div
      className={`flex flex-col gap-3 p-5 rounded-lg border border-border bg-card/50 ${className}`}
    >
      <div>
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
      {children}
    </div>
  );
}

function SectionHeader({
  number,
  title,
  subtitle,
}: {
  number: string;
  title: string;
  subtitle: string;
}) {
  return (
    <div className="flex items-baseline gap-3 pt-2">
      <span className="text-[11px] font-mono font-bold text-cyan-500/60 tracking-widest uppercase">
        {number}
      </span>
      <div>
        <h2 className="text-sm font-bold text-foreground tracking-tight">{title}</h2>
        <p className="text-[11px] text-muted-foreground">{subtitle}</p>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function renderDonutLabel(props: any) {
  const { cx, cy, midAngle, innerRadius, outerRadius, value, name } = props;
  const RADIAN = Math.PI / 180;
  const radius = innerRadius + (outerRadius - innerRadius) * 1.6;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#a1a1aa"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={11}
      fontFamily="var(--font-mono)"
    >
      {name} ({value})
    </text>
  );
}

// ════════════════════════════════════════════════════════════════════
// Main Component
// ════════════════════════════════════════════════════════════════════
function FilterTag({
  label,
  active,
  onClick,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`px-2.5 py-1 rounded-full text-[11px] font-mono font-medium transition-all ${
        active
          ? "bg-cyan-500/20 text-cyan-400 border border-cyan-500/40"
          : "bg-zinc-800/60 text-zinc-400 border border-zinc-700/50 hover:border-zinc-600 hover:text-zinc-300"
      }`}
    >
      {label}
    </button>
  );
}

export function AnalyticsCharts({ data }: { data: Exploit[] }) {
  const oneWeekAgo = useMemo(() => new Date(Date.now() - 7 * 86_400_000), []);
  const [chainFilter, setChainFilter] = useState<string | null>(null);
  const [severityFilter, setSeverityFilter] = useState<string | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<string | null>(null);

  const {
    // Section 1
    weekExploits,
    weekTotalFunds,
    weekTopSeverity,
    // Section 1 — Forta recall
    weekWithForta,
    weekCaught,
    weekMissed,
    weekCaughtFunds,
    weekMissedFunds,
    // Section 2
    scatterThisWeek,
    scatterOlder,
    // Section 3
    trueExploitCount,
    flaggedCount,
    txHashData,
    sourceData,
    fortaData,
  } = useMemo(() => {
    const trueExploits = data.filter((d) => d.isExploit !== false);
    const flagged = data.filter((d) => d.isExploit === false);

    // ── Section 1: This week ──
    const weekItems = trueExploits
      .filter((d) => new Date(d.date) >= oneWeekAgo)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    const weekFunds = weekItems.reduce((s, d) => s + (d.fundsNum || 0), 0);
    const sevOrder: Record<string, number> = { critical: 4, high: 3, medium: 2, low: 1 };
    const topSev = weekItems.reduce(
      (best, d) => ((sevOrder[d.severity] || 0) > (sevOrder[best] || 0) ? d.severity : best),
      "low"
    );

    // Forta recall for this week
    const wForta = weekItems.filter((d) => d.fortaRisk !== null && d.fortaRisk !== undefined);
    const wCaught = wForta.filter((d) => (d.fortaRisk ?? 0) >= 0.80);
    const wMissed = wForta.filter((d) => (d.fortaRisk ?? 0) < 0.80);
    const caughtFunds = wCaught.reduce((s, d) => s + (d.fundsNum || 0), 0);
    const missedFunds = wMissed.reduce((s, d) => s + (d.fundsNum || 0), 0);

    // ── Section 2: Scatter ──
    const withTx = trueExploits.filter((d) => d.txHash);
    const nonBlocksec = withTx.filter(
      (d) => !d.account.toLowerCase().includes("blocksec")
    );
    const scatterPoints = nonBlocksec
      .filter((d) => d.fortaRisk !== null && d.fundsNum > 0)
      .map((d) => ({
        protocol: d.protocol,
        funds: d.fundsNum,
        risk: d.fortaRisk as number,
        date: d.date,
        severity: d.severity,
      }));

    // ── Section 3: Funnel ──
    const withoutTx = trueExploits.filter((d) => !d.txHash);
    const blocksec = withTx.filter((d) =>
      d.account.toLowerCase().includes("blocksec")
    );
    const highForta = nonBlocksec.filter(
      (d) => d.fortaRisk !== null && d.fortaRisk >= 0.8
    );
    const lowForta = nonBlocksec.filter(
      (d) => d.fortaRisk === null || d.fortaRisk < 0.8
    );

    return {
      weekExploits: weekItems,
      weekTotalFunds: weekFunds,
      weekTopSeverity: topSev,
      weekWithForta: wForta,
      weekCaught: wCaught,
      weekMissed: wMissed,
      weekCaughtFunds: caughtFunds,
      weekMissedFunds: missedFunds,
      scatterThisWeek: scatterPoints.filter((d) => new Date(d.date) >= oneWeekAgo),
      scatterOlder: scatterPoints.filter((d) => new Date(d.date) < oneWeekAgo),
      trueExploitCount: trueExploits.length,
      flaggedCount: flagged.length,
      txHashData: [
        { name: "Has Tx Hash", value: withTx.length },
        { name: "No Tx Hash", value: withoutTx.length },
      ],
      sourceData: [
        { name: "BlockSec", count: blocksec.length },
        { name: "Non-BlockSec", count: nonBlocksec.length },
      ],
      fortaData: [
        { name: "Risk ≥ 0.8", count: highForta.length },
        { name: "Risk < 0.8", count: lowForta.length },
      ],
    };
  }, [data, oneWeekAgo]);

  return (
    <div className="space-y-5">
      {/* ════════════════════════════════════════════════════════════════
          SECTION 1 — THIS WEEK
      ════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        number="01"
        title="This Week"
        subtitle="Immediate incident analysis — true exploits from the last 7 days"
      />

      {/* KPI Cards */}
      <div className="grid grid-cols-3 md:grid-cols-5 gap-3">
        <div className="group flex flex-col gap-2 p-5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 hover:border-cyan-500/40 transition-colors cursor-default">
          <Flame className="h-4 w-4 text-cyan-400" />
          <div className="font-bold text-2xl tracking-tight text-cyan-400 font-mono group-hover:translate-x-1 transition duration-500">
            {weekExploits.length}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground/80">Incidents</div>
            <div className="text-xs text-muted-foreground">this week</div>
          </div>
        </div>
        <div className="group flex flex-col gap-2 p-5 rounded-lg border border-amber-500/20 bg-amber-500/5 hover:border-amber-500/40 transition-colors cursor-default">
          <DollarSign className="h-4 w-4 text-amber-400" />
          <div className="font-bold text-2xl tracking-tight text-amber-400 font-mono group-hover:translate-x-1 transition duration-500">
            {formatFunds(weekTotalFunds)}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground/80">Value Lost</div>
            <div className="text-xs text-muted-foreground">total this week</div>
          </div>
        </div>
        <div className="group flex flex-col gap-2 p-5 rounded-lg border border-border bg-card/50 hover:border-zinc-600 transition-colors cursor-default">
          <Activity className="h-4 w-4 text-red-400" />
          <div className="font-bold text-2xl tracking-tight font-mono group-hover:translate-x-1 transition duration-500">
            <SeverityBadge severity={weekTopSeverity} />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground/80">Top Severity</div>
            <div className="text-xs text-muted-foreground">highest this week</div>
          </div>
        </div>
        {weekWithForta.length > 0 && (
          <>
            <div className={`group flex flex-col gap-2 p-5 rounded-lg border transition-colors cursor-default ${
              weekWithForta.length > 0 && weekCaught.length / weekWithForta.length >= 0.8
                ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                : "border-orange-500/20 bg-orange-500/5 hover:border-orange-500/40"
            }`}>
              <Crosshair className={`h-4 w-4 ${
                weekCaught.length / weekWithForta.length >= 0.8 ? "text-emerald-400" : "text-orange-400"
              }`} />
              <div className={`font-bold text-2xl tracking-tight font-mono group-hover:translate-x-1 transition duration-500 ${
                weekCaught.length / weekWithForta.length >= 0.8 ? "text-emerald-400" : "text-orange-400"
              }`}>
                {Math.round((weekCaught.length / weekWithForta.length) * 100)}%
              </div>
              <div>
                <div className="text-sm font-medium text-foreground/80">Forta Recall</div>
                <div className="text-xs text-muted-foreground">
                  {weekCaught.length}/{weekWithForta.length} caught · {formatFunds(weekCaughtFunds)}
                </div>
              </div>
            </div>
            <div className={`group flex flex-col gap-2 p-5 rounded-lg border transition-colors cursor-default ${
              weekMissed.length === 0
                ? "border-emerald-500/20 bg-emerald-500/5 hover:border-emerald-500/40"
                : "border-red-500/20 bg-red-500/5 hover:border-red-500/40"
            }`}>
              <Eye className={`h-4 w-4 ${weekMissed.length === 0 ? "text-emerald-400" : "text-red-400"}`} />
              <div className={`font-bold text-2xl tracking-tight font-mono group-hover:translate-x-1 transition duration-500 ${
                weekMissed.length === 0 ? "text-emerald-400" : "text-red-400"
              }`}>
                {weekMissed.length === 0 ? "0" : formatFunds(weekMissedFunds)}
              </div>
              <div>
                <div className="text-sm font-medium text-foreground/80">Missed Value</div>
                <div className="text-xs text-muted-foreground">
                  {weekMissed.length === 0
                    ? "all caught this week"
                    : `${weekMissed.length} exploit${weekMissed.length > 1 ? "s" : ""} < 0.80 risk`}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Filter Tags */}
      {weekExploits.length > 0 && (() => {
        const chains = [...new Set(weekExploits.map((d) => d.chain).filter(Boolean))].sort();
        const severities = [...new Set(weekExploits.map((d) => d.severity).filter(Boolean))].sort(
          (a, b) => ({ critical: 0, high: 1, medium: 2, low: 3 }[a] ?? 4) - ({ critical: 0, high: 1, medium: 2, low: 3 }[b] ?? 4)
        );
        const categories = [...new Set(weekExploits.map((d) => d.category).filter(Boolean))].sort();
        return (
          <div className="flex flex-wrap items-center gap-1.5">
            <span className="text-[10px] text-zinc-500 uppercase tracking-wider mr-1">Filter:</span>
            {chains.map((c) => (
              <FilterTag key={`c-${c}`} label={c} active={chainFilter === c} onClick={() => setChainFilter(chainFilter === c ? null : c)} />
            ))}
            {chains.length > 0 && severities.length > 0 && <span className="text-zinc-700 mx-0.5">·</span>}
            {severities.map((s) => (
              <FilterTag key={`s-${s}`} label={s} active={severityFilter === s} onClick={() => setSeverityFilter(severityFilter === s ? null : s)} />
            ))}
            {(chains.length > 0 || severities.length > 0) && categories.length > 0 && <span className="text-zinc-700 mx-0.5">·</span>}
            {categories.map((cat) => (
              <FilterTag key={`cat-${cat}`} label={cat} active={categoryFilter === cat} onClick={() => setCategoryFilter(categoryFilter === cat ? null : cat)} />
            ))}
            {(chainFilter || severityFilter || categoryFilter) && (
              <button
                onClick={() => { setChainFilter(null); setSeverityFilter(null); setCategoryFilter(null); }}
                className="px-2 py-1 rounded-full text-[11px] font-mono text-zinc-500 hover:text-zinc-300 transition-colors"
              >
                ✕ clear
              </button>
            )}
          </div>
        );
      })()}

      {/* This Week Incident Table */}
      {(() => {
        const filtered = weekExploits.filter((d) => {
          if (chainFilter && d.chain !== chainFilter) return false;
          if (severityFilter && d.severity !== severityFilter) return false;
          if (categoryFilter && d.category !== categoryFilter) return false;
          return true;
        });
        return filtered.length > 0 ? (
        <div className="overflow-x-auto rounded-lg border border-border">
          <table className="w-full text-sm">
            <thead className="bg-card/80">
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Date</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Protocol</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Summary</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Chain</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Severity</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Funds Lost</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Forta Risk</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Tx</th>
                <th className="text-left px-3 py-2 text-[11px] uppercase tracking-wider text-muted-foreground font-medium">Source</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-border/50 hover:bg-cyan-500/[0.03] transition-colors group"
                >
                  <td className="px-3 py-2.5 font-mono text-xs text-muted-foreground whitespace-nowrap">
                    {d.date}
                  </td>
                  <td className="px-3 py-2.5 font-medium">
                    {d.tweetUrl ? (
                      <a
                        href={d.tweetUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="hover:text-cyan-400 transition-colors inline-flex items-center gap-1"
                      >
                        {d.protocol}
                        <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-50 transition-opacity" />
                      </a>
                    ) : (
                      d.protocol
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground max-w-[260px]">
                    <span className="line-clamp-2">{d.summary}</span>
                  </td>
                  <td className="px-3 py-2.5">
                    <span className="font-mono text-xs px-1.5 py-0.5 rounded bg-zinc-800/80 text-zinc-300">
                      {d.chain}
                    </span>
                  </td>
                  <td className="px-3 py-2.5">
                    <SeverityBadge severity={d.severity} />
                  </td>
                  <td className="px-3 py-2.5 font-mono text-xs tabular-nums">
                    {d.funds}
                  </td>
                  <td className="px-3 py-2.5">
                    {d.fortaRisk !== null && d.fortaRisk !== undefined ? (
                      <div className="flex items-center gap-1.5">
                        <div
                          className="h-2.5 rounded-sm min-w-[3px]"
                          style={{
                            width: `${Math.max(3, d.fortaRisk * 48)}px`,
                            backgroundColor: riskColor(d.fortaRisk),
                          }}
                        />
                        <span className="font-mono text-[11px] text-muted-foreground tabular-nums">
                          {d.fortaRisk.toFixed(2)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-[11px] text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5">
                    {d.txLink ? (
                      <a
                        href={d.txLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-muted-foreground hover:text-cyan-400 transition-colors"
                      >
                        <ExternalLink className="h-3.5 w-3.5" />
                      </a>
                    ) : (
                      <span className="text-[11px] text-zinc-700">—</span>
                    )}
                  </td>
                  <td className="px-3 py-2.5 text-xs text-muted-foreground">
                    @{d.account}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="rounded-lg border border-border bg-card/30 p-8 text-center">
          <p className="text-sm text-muted-foreground">
            {weekExploits.length > 0 ? "No incidents match filters." : "No incidents this week."}
          </p>
        </div>
      );
      })()}

      {/* ════════════════════════════════════════════════════════════════
          SECTION 2 — PERSPECTIVE SCATTER
      ════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        number="02"
        title="Historical Perspective"
        subtitle="This week's incidents plotted against all historical data — non-BlockSec exploits with tx hash"
      />

      <ChartCard
        title="Exploit Value vs Forta Risk Score"
        subtitle="Logarithmic value axis — bright dots are this week, muted dots are historical"
      >
        <ChartContainer
          config={{
            thisWeek: { label: "This week", color: C.cyan },
            older: { label: "Older", color: C.zinc700 },
          }}
          className="h-[320px] w-full"
        >
          <ScatterChart margin={{ top: 10, right: 16, bottom: 20, left: 10 }}>
            <CartesianGrid {...GRID} />
            <XAxis
              dataKey="funds"
              type="number"
              name="Value"
              scale="log"
              domain={["auto", "auto"]}
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v: number) => formatFunds(v)}
              label={{
                value: "Exploit Value (log)",
                position: "insideBottom",
                offset: -8,
                fill: "#52525b",
                fontSize: 10,
              }}
            />
            <YAxis
              dataKey="risk"
              type="number"
              name="Risk Score"
              domain={[0, 1]}
              tick={{ fill: "#a1a1aa", fontSize: 10 }}
              axisLine={false}
              tickLine={false}
              width={38}
              label={{
                value: "Forta Risk",
                angle: -90,
                position: "insideLeft",
                offset: 14,
                fill: "#52525b",
                fontSize: 10,
              }}
            />
            <ZAxis range={[55, 55]} />
            <Tooltip
              cursor={SCATTER_CURSOR}
              content={
                <ChartTooltipContent
                  labelKey="protocol"
                  formatter={(v, name) =>
                    name === "Value"
                      ? formatFunds(v as number)
                      : (v as number).toFixed(2)
                  }
                />
              }
            />
            <Legend
              verticalAlign="top"
              height={28}
              content={() => (
                <div className="flex items-center justify-center gap-5 text-[11px] font-mono">
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ background: C.cyan }}
                    />
                    <span className="text-slate-300">This week</span>
                  </span>
                  <span className="flex items-center gap-1.5">
                    <span
                      className="inline-block w-3 h-3 rounded-sm"
                      style={{ background: "#71717a" }}
                    />
                    <span className="text-slate-400">Older</span>
                  </span>
                </div>
              )}
            />
            <Scatter
              name="Older"
              data={scatterOlder}
              fill="#71717a"
              fillOpacity={0.5}
              strokeWidth={0}
            />
            <Scatter
              name="This week"
              data={scatterThisWeek}
              fill={C.cyan}
              fillOpacity={0.9}
              stroke="#0e7490"
              strokeWidth={1.5}
            />
          </ScatterChart>
        </ChartContainer>
      </ChartCard>

      {/* ════════════════════════════════════════════════════════════════
          SECTION 3 — GLOBAL FUNNEL
      ════════════════════════════════════════════════════════════════ */}
      <SectionHeader
        number="03"
        title="Global Data Funnel"
        subtitle="System-wide overview — database split and classification pipeline"
      />

      {/* DB Split — minimal */}
      <div className="grid grid-cols-2 gap-3">
        <div className="flex items-center gap-3 p-4 rounded-lg border border-emerald-500/20 bg-emerald-500/5">
          <Shield className="h-5 w-5 text-emerald-400 shrink-0" />
          <div>
            <div className="text-2xl font-bold tracking-tight text-emerald-400 font-mono">
              {trueExploitCount}
            </div>
            <div className="text-[11px] text-emerald-400/70 uppercase tracking-wider font-medium">
              True Exploits
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card/30">
          <ShieldOff className="h-5 w-5 text-zinc-500 shrink-0" />
          <div>
            <div className="text-2xl font-bold tracking-tight text-zinc-400 font-mono">
              {flaggedCount}
            </div>
            <div className="text-[11px] text-zinc-500 uppercase tracking-wider font-medium">
              Flagged / Non-Exploits
            </div>
          </div>
        </div>
      </div>

      {/* Funnel — 3 columns */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {/* Tx Hash Presence — Donut */}
        <ChartCard title="Transaction Hash" subtitle="True exploits baseline">
          <ChartContainer
            config={{
              hasTx: { label: "Has Tx Hash", color: C.emerald },
              noTx: { label: "No Tx Hash", color: C.zinc500 },
            }}
            className="h-[200px] w-full"
          >
            <PieChart>
              <Pie
                data={txHashData}
                cx="50%"
                cy="50%"
                innerRadius={45}
                outerRadius={70}
                paddingAngle={3}
                dataKey="value"
                stroke="none"
                label={renderDonutLabel}
              >
                <Cell fill={C.emerald} />
                <Cell fill={C.zinc500} />
              </Pie>
              <Tooltip
                cursor={false}
                content={
                  <ChartTooltipContent
                    formatter={(v) => `${v} exploits`}
                  />
                }
              />
            </PieChart>
          </ChartContainer>
        </ChartCard>

        {/* BlockSec vs Non-BlockSec — Bar */}
        <ChartCard title="Source Breakdown" subtitle="Exploits with tx hash">
          <ChartContainer
            config={{
              blocksec: { label: "BlockSec", color: C.violet },
              nonBlocksec: { label: "Non-BlockSec", color: C.cyan },
            }}
            className="h-[200px] w-full"
          >
            <BarChart data={sourceData} barGap={8}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis
                dataKey="name"
                tick={TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={TICK}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                cursor={BAR_CURSOR}
                content={
                  <ChartTooltipContent
                    formatter={(v) => `${v} exploits`}
                  />
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                <Cell fill={C.violet} />
                <Cell fill={C.cyan} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>

        {/* Forta Risk — Bar */}
        <ChartCard title="Forta Risk Level" subtitle="Non-BlockSec with tx hash">
          <ChartContainer
            config={{
              high: { label: "Risk ≥ 0.8", color: C.red },
              low: { label: "Risk < 0.8", color: C.amber },
            }}
            className="h-[200px] w-full"
          >
            <BarChart data={fortaData} barGap={8}>
              <CartesianGrid {...GRID} vertical={false} />
              <XAxis
                dataKey="name"
                tick={TICK}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={TICK}
                axisLine={false}
                tickLine={false}
                width={30}
              />
              <Tooltip
                cursor={BAR_CURSOR}
                content={
                  <ChartTooltipContent
                    formatter={(v) => `${v} exploits`}
                  />
                }
              />
              <Bar dataKey="count" radius={[4, 4, 0, 0]} maxBarSize={48}>
                <Cell fill={C.red} />
                <Cell fill={C.amber} />
              </Bar>
            </BarChart>
          </ChartContainer>
        </ChartCard>
      </div>
    </div>
  );
}
