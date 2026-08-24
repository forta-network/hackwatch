"use client";

import { useState, useMemo, useCallback } from "react";
import { Skull } from "lucide-react";
import { StatsBar } from "./stats-bar";
import { AnalyticsCharts } from "./analytics-charts";
import { FiltersBar } from "./filters-bar";
import { ExploitsTable } from "./exploits-table";
import type { Exploit } from "../types";

const SEV_ORDER: Record<string, number> = {
  critical: 4,
  high: 3,
  medium: 2,
  low: 1,
};

export function Dashboard({ data }: { data: Exploit[] }) {
  // Only true exploits for table/stats/filters; full data for analytics KPI split
  const exploits = useMemo(() => data.filter((d) => d.isExploit !== false), [data]);

  const [search, setSearch] = useState("");
  const [filters, setFilters] = useState<Record<string, string[] | number>>({
    chain: [] as string[],
    severity: [] as string[],
    category: [] as string[],
    account: [] as string[],
    forta: [] as string[],
    fundsMin: 0,
    riskMin: 0,
  });
  const [sourceExclude, setSourceExclude] = useState(false);
  const [sortCol, setSortCol] = useState("date");
  const [sortAsc, setSortAsc] = useState(false);

  const handleFilterChange = useCallback((key: string, value: string[] | number) => {
    setFilters((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    let result = exploits.filter((d) => {
      if (
        q &&
        !d.protocol.toLowerCase().includes(q) &&
        !d.summary.toLowerCase().includes(q) &&
        !d.chain.toLowerCase().includes(q)
      )
        return false;
      const chainFilter = filters.chain as string[];
      const sevFilter = filters.severity as string[];
      const catFilter = filters.category as string[];
      const accountFilter = filters.account as string[];
      const fortaFilter = filters.forta as string[];
      const fundsMin = filters.fundsMin as number;
      const riskMin = filters.riskMin as number;

      if (chainFilter.length > 0 && !chainFilter.includes(d.chain)) return false;
      if (sevFilter.length > 0 && !sevFilter.includes(d.severity)) return false;
      if (catFilter.length > 0 && !catFilter.includes(d.category)) return false;
      if (accountFilter.length > 0) {
        if (sourceExclude) {
          if (accountFilter.includes(d.account)) return false;
        } else {
          if (!accountFilter.includes(d.account)) return false;
        }
      }
      // Forta checkbox filter — OR logic across selected options
      if (fortaFilter.length > 0) {
        let matches = false;
        for (const f of fortaFilter) {
          if (f === "detected" && d.fortaRisk !== null && d.fortaRisk > 0) matches = true;
          if (f === "high" && d.fortaRisk !== null && d.fortaRisk >= 0.5) matches = true;
          if (f === "notdetected" && (d.fortaRisk === null || d.fortaRisk <= 0)) matches = true;
          if (f === "notx" && !d.txHash) matches = true;
        }
        if (!matches) return false;
      }
      if (fundsMin > 0 && d.fundsNum < fundsMin) return false;
      if (riskMin > 0 && (d.fortaRisk === null || d.fortaRisk < riskMin)) return false;
      return true;
    });

    // Sort
    result.sort((a, b) => {
      let va: string | number = (a as unknown as Record<string, unknown>)[sortCol] as string | number;
      let vb: string | number = (b as unknown as Record<string, unknown>)[sortCol] as string | number;

      if (sortCol === "severity") {
        va = SEV_ORDER[va as string] || 0;
        vb = SEV_ORDER[vb as string] || 0;
      }
      if (sortCol === "fortaRisk" || sortCol === "fortaProfit") {
        va = va === null || va === undefined ? -1 : (va as number);
        vb = vb === null || vb === undefined ? -1 : (vb as number);
      }

      if (va < vb) return sortAsc ? -1 : 1;
      if (va > vb) return sortAsc ? 1 : -1;
      return 0;
    });

    return result;
  }, [exploits, search, filters, sourceExclude, sortCol, sortAsc]);

  const handleSort = useCallback(
    (col: string) => {
      if (sortCol === col) {
        setSortAsc((prev) => !prev);
      } else {
        setSortCol(col);
        setSortAsc(col === "date" ? false : true);
      }
    },
    [sortCol]
  );

  return (
    <div className="max-w-[1280px] mx-auto px-6 md:px-12 lg:px-20 py-6 space-y-5">
      {/* Header */}
      <div className="flex items-center gap-3">
        <div className="p-2 rounded-lg bg-red-500/10 border border-red-500/20">
          <Skull className="h-5 w-5 text-red-500" />
        </div>
        <div>
          <h1 className="text-lg font-bold tracking-tight">Exploit Monitor</h1>
          <p className="text-xs text-muted-foreground">
            Real-time EVM exploit tracking
          </p>
        </div>
      </div>

      <AnalyticsCharts data={data} />
      <StatsBar data={exploits} filtered={filtered} />
      <FiltersBar
        data={exploits}
        filteredCount={filtered.length}
        search={search}
        onSearchChange={setSearch}
        filters={filters}
        onFilterChange={handleFilterChange}
        sourceExclude={sourceExclude}
        onSourceExcludeChange={setSourceExclude}
      />
      <ExploitsTable
        data={filtered}
        sortCol={sortCol}
        sortAsc={sortAsc}
        onSort={handleSort}
      />
    </div>
  );
}
