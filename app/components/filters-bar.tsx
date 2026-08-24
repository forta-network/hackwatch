import { useState, useRef, useEffect, useMemo } from "react";
import { Search, X, ChevronDown, Check } from "lucide-react";
import type { Exploit } from "../types";

interface FiltersBarProps {
  data: Exploit[];
  filteredCount: number;
  search: string;
  onSearchChange: (v: string) => void;
  filters: Record<string, string[] | number>;
  onFilterChange: (key: string, value: string[] | number) => void;
  sourceExclude: boolean;
  onSourceExcludeChange: (v: boolean) => void;
}

// ── Checkbox dropdown ────────────────────────────────────────────────
function FilterCheckboxDropdown({
  label,
  selected,
  options,
  onChange,
  extra,
}: {
  label: string;
  selected: string[];
  options: { value: string; label: string }[];
  onChange: (v: string[]) => void;
  extra?: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    if (open) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [open]);

  const toggle = (val: string) => {
    if (selected.includes(val)) {
      onChange(selected.filter((s) => s !== val));
    } else {
      onChange([...selected, val]);
    }
  };

  const displayText =
    selected.length === 0
      ? "All"
      : selected.length === 1
        ? options.find((o) => o.value === selected[0])?.label ?? selected[0]
        : `${selected.length} selected`;

  return (
    <div className="flex flex-col gap-1 relative" ref={ref}>
      <div className="flex items-center gap-1.5">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </label>
        {extra}
      </div>
      <button
        onClick={() => setOpen(!open)}
        className="bg-card border border-border rounded-md px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-ring min-w-[100px] flex items-center justify-between gap-2 cursor-pointer"
      >
        <span className="truncate">{displayText}</span>
        <ChevronDown
          className={`h-3.5 w-3.5 text-muted-foreground shrink-0 transition-transform ${open ? "rotate-180" : ""}`}
        />
      </button>
      {open && (
        <div className="absolute top-full left-0 mt-1 z-50 bg-card border border-border rounded-md shadow-xl py-1 min-w-[160px] max-h-[240px] overflow-y-auto">
          {selected.length > 0 && (
            <button
              onClick={() => onChange([])}
              className="w-full text-left px-3 py-1.5 text-xs text-muted-foreground hover:bg-accent/50 transition-colors"
            >
              Clear all
            </button>
          )}
          {options.map((opt) => {
            const isSelected = selected.includes(opt.value);
            return (
              <button
                key={opt.value}
                onClick={() => toggle(opt.value)}
                className="w-full text-left px-3 py-1.5 text-sm flex items-center gap-2 hover:bg-accent/50 transition-colors"
              >
                <span
                  className={`h-3.5 w-3.5 rounded-sm border flex items-center justify-center shrink-0 transition-colors ${
                    isSelected
                      ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                      : "border-border text-transparent"
                  }`}
                >
                  <Check className="h-2.5 w-2.5" />
                </span>
                <span className={isSelected ? "text-foreground" : "text-muted-foreground"}>
                  {opt.label}
                </span>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Range slider ─────────────────────────────────────────────────────
function RangeSlider({
  label,
  value,
  min,
  max,
  step,
  onChange,
  formatValue,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  onChange: (v: number) => void;
  formatValue: (v: number) => string;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[140px]">
      <div className="flex items-center justify-between">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          {label}
        </label>
        <span className="text-[11px] font-mono text-cyan-400/80 tabular-nums">
          {value > min ? `≥ ${formatValue(value)}` : "Any"}
        </span>
      </div>
      <div className="flex items-center h-[30px]">
        <input
          type="range"
          min={min}
          max={max}
          step={step}
          value={value}
          onChange={(e) => onChange(Number(e.target.value))}
          className="w-full h-1 appearance-none bg-zinc-700 rounded-full cursor-pointer
            [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-3.5 [&::-webkit-slider-thumb]:h-3.5
            [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-cyan-500 [&::-webkit-slider-thumb]:border-2
            [&::-webkit-slider-thumb]:border-zinc-900 [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
            [&::-moz-range-thumb]:w-3.5 [&::-moz-range-thumb]:h-3.5 [&::-moz-range-thumb]:rounded-full
            [&::-moz-range-thumb]:bg-cyan-500 [&::-moz-range-thumb]:border-2 [&::-moz-range-thumb]:border-zinc-900
            [&::-moz-range-thumb]:cursor-pointer [&::-moz-range-track]:bg-zinc-700 [&::-moz-range-track]:rounded-full"
        />
      </div>
    </div>
  );
}

function formatFunds(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  if (n > 0) return `$${n.toFixed(0)}`;
  return "$0";
}

// ── Main ─────────────────────────────────────────────────────────────
export function FiltersBar({
  data,
  filteredCount,
  search,
  onSearchChange,
  filters,
  onFilterChange,
  sourceExclude,
  onSourceExcludeChange,
}: FiltersBarProps) {
  const chains = useMemo(
    () => [...new Set(data.map((d) => d.chain))].sort().map((c) => ({ value: c, label: c })),
    [data]
  );
  const categories = useMemo(
    () =>
      [...new Set(data.map((d) => d.category).filter(Boolean))]
        .sort()
        .map((c) => ({ value: c, label: c })),
    [data]
  );
  const accounts = useMemo(
    () => [...new Set(data.map((d) => d.account))].sort().map((a) => ({ value: a, label: `@${a}` })),
    [data]
  );
  const severities = [
    { value: "critical", label: "Critical" },
    { value: "high", label: "High" },
    { value: "medium", label: "Medium" },
    { value: "low", label: "Low" },
  ];
  const fortaOptions = [
    { value: "detected", label: "Detected" },
    { value: "high", label: "High risk (≥0.5)" },
    { value: "notdetected", label: "Not detected" },
    { value: "notx", label: "No tx hash" },
  ];

  const maxFunds = useMemo(() => {
    const vals = data.map((d) => d.fundsNum).filter((v) => v > 0);
    return vals.length > 0 ? Math.max(...vals) : 1_000_000;
  }, [data]);

  const hasActiveFilters =
    search ||
    (filters.chain as string[]).length > 0 ||
    (filters.severity as string[]).length > 0 ||
    (filters.category as string[]).length > 0 ||
    (filters.account as string[]).length > 0 ||
    (filters.forta as string[]).length > 0 ||
    (filters.fundsMin as number) > 0 ||
    (filters.riskMin as number) > 0;

  return (
    <div className="flex flex-wrap items-end gap-3 p-4 rounded-lg border border-border bg-card/30">
      {/* Search */}
      <div className="flex flex-col gap-1">
        <label className="text-[11px] uppercase tracking-wider text-muted-foreground font-medium">
          Search
        </label>
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <input
            type="text"
            placeholder="Protocol, summary..."
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            className="bg-card border border-border rounded-md pl-8 pr-3 py-1.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none focus:ring-1 focus:ring-ring w-[200px]"
          />
        </div>
      </div>

      {/* Checkbox filters */}
      <FilterCheckboxDropdown
        label="Chain"
        selected={filters.chain as string[]}
        options={chains}
        onChange={(v) => onFilterChange("chain", v)}
      />
      <FilterCheckboxDropdown
        label="Severity"
        selected={filters.severity as string[]}
        options={severities}
        onChange={(v) => onFilterChange("severity", v)}
      />
      <FilterCheckboxDropdown
        label="Category"
        selected={filters.category as string[]}
        options={categories}
        onChange={(v) => onFilterChange("category", v)}
      />
      <FilterCheckboxDropdown
        label="Source"
        selected={filters.account as string[]}
        options={accounts}
        onChange={(v) => onFilterChange("account", v)}
        extra={
          (filters.account as string[]).length > 0 ? (
            <button
              onClick={() => onSourceExcludeChange(!sourceExclude)}
              className={`text-[10px] px-1.5 py-0 rounded font-medium transition-colors ${
                sourceExclude
                  ? "bg-red-500/20 text-red-400 hover:bg-red-500/30"
                  : "bg-zinc-700/50 text-zinc-400 hover:bg-zinc-700"
              }`}
            >
              {sourceExclude ? "exclude" : "include"}
            </button>
          ) : undefined
        }
      />
      <FilterCheckboxDropdown
        label="Forta"
        selected={filters.forta as string[]}
        options={fortaOptions}
        onChange={(v) => onFilterChange("forta", v)}
      />

      {/* Range sliders */}
      <RangeSlider
        label="Min Value"
        value={filters.fundsMin as number}
        min={0}
        max={maxFunds}
        step={Math.max(1, Math.floor(maxFunds / 200))}
        onChange={(v) => onFilterChange("fundsMin", v)}
        formatValue={formatFunds}
      />
      <RangeSlider
        label="Min Risk"
        value={filters.riskMin as number}
        min={0}
        max={1}
        step={0.05}
        onChange={(v) => onFilterChange("riskMin", v)}
        formatValue={(v) => v.toFixed(2)}
      />

      {/* Results + Clear */}
      <div className="flex items-center gap-3 ml-auto self-end pb-0.5">
        {hasActiveFilters && (
          <button
            onClick={() => {
              onSearchChange("");
              onFilterChange("chain", []);
              onFilterChange("severity", []);
              onFilterChange("category", []);
              onFilterChange("account", []);
              onSourceExcludeChange(false);
              onFilterChange("forta", []);
              onFilterChange("fundsMin", 0);
              onFilterChange("riskMin", 0);
            }}
            className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 transition-colors"
          >
            <X className="h-3 w-3" /> Clear
          </button>
        )}
        <span className="text-xs text-muted-foreground font-mono tabular-nums">
          {filteredCount} results
        </span>
      </div>
    </div>
  );
}
