"use client";

import * as React from "react";
import { ResponsiveContainer } from "recharts";

// ── Chart config type ──────────────────────────────────────────────
export type ChartConfig = Record<
  string,
  { label: string; color: string }
>;

// ── ChartContainer ─────────────────────────────────────────────────
interface ChartContainerProps extends React.HTMLAttributes<HTMLDivElement> {
  config: ChartConfig;
  children: React.ReactElement;
}

export function ChartContainer({
  config,
  children,
  className,
  ...props
}: ChartContainerProps) {
  const cssVars = Object.entries(config).reduce<Record<string, string>>(
    (acc, [key, { color }]) => {
      acc[`--color-${key}`] = color;
      return acc;
    },
    {}
  );

  return (
    <div
      className={className}
      style={cssVars as React.CSSProperties}
      {...props}
    >
      <ResponsiveContainer width="100%" height="100%">
        {children}
      </ResponsiveContainer>
    </div>
  );
}

// ── ChartTooltipContent ────────────────────────────────────────────
interface TooltipPayloadItem {
  name?: string;
  value?: number | string;
  color?: string;
  payload?: Record<string, unknown>;
  dataKey?: string;
}

interface ChartTooltipContentProps {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
  labelKey?: string;
  formatter?: (value: number | string, name: string, item: TooltipPayloadItem) => React.ReactNode;
  hideLabel?: boolean;
}

export function ChartTooltipContent({
  active,
  payload,
  label,
  labelKey,
  formatter,
  hideLabel = false,
}: ChartTooltipContentProps) {
  if (!active || !payload?.length) return null;

  const displayLabel = labelKey
    ? (payload[0]?.payload?.[labelKey] as string) ?? label
    : label;

  return (
    <div className="rounded-lg border border-slate-800 bg-slate-900 px-3 py-2 text-xs shadow-2xl">
      {!hideLabel && displayLabel && (
        <div className="mb-1.5 font-medium text-slate-100">{displayLabel}</div>
      )}
      <div className="flex flex-col gap-1">
        {payload.map((item, i) => (
          <div key={i} className="flex items-center gap-2">
            <span
              className="h-2.5 w-2.5 rounded-full shrink-0"
              style={{ backgroundColor: item.color }}
            />
            <span className="text-slate-400">{item.name}:</span>
            <span className="font-mono font-medium text-slate-100 ml-auto">
              {formatter
                ? formatter(item.value ?? 0, item.name ?? "", item)
                : item.value}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
