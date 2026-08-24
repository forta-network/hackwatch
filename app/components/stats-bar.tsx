import { Shield, DollarSign, Link2, AlertTriangle } from "lucide-react";
import type { Exploit } from "../types";

function formatFunds(n: number): string {
  if (n >= 1_000_000_000) return `$${(n / 1_000_000_000).toFixed(1)}B`;
  if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(1)}M`;
  if (n >= 1_000) return `$${(n / 1_000).toFixed(0)}K`;
  return `$${n.toFixed(0)}`;
}

interface StatsBarProps {
  data: Exploit[];
  filtered: Exploit[];
}

export function StatsBar({ data, filtered }: StatsBarProps) {
  const totalFunds = filtered.reduce((sum, d) => sum + (d.fundsNum || 0), 0);
  const criticalCount = filtered.filter((d) => d.severity === "critical").length;
  const chains = new Set(filtered.map((d) => d.chain));

  const topChain = filtered.reduce<Record<string, number>>((acc, d) => {
    acc[d.chain] = (acc[d.chain] || 0) + 1;
    return acc;
  }, {});
  const topChainName = Object.entries(topChain).sort((a, b) => b[1] - a[1])[0]?.[0] || "—";

  const stats = [
    {
      icon: Shield,
      iconColor: "text-red-500",
      value: filtered.length.toString(),
      label: "Exploits",
      sublabel: data.length !== filtered.length ? `of ${data.length} total` : "total",
    },
    {
      icon: DollarSign,
      iconColor: "text-amber-500",
      value: formatFunds(totalFunds),
      label: "Funds Lost",
      sublabel: "across all incidents",
    },
    {
      icon: Link2,
      iconColor: "text-blue-400",
      value: chains.size.toString(),
      label: "Chains",
      sublabel: `top: ${topChainName}`,
    },
    {
      icon: AlertTriangle,
      iconColor: "text-red-400",
      value: criticalCount.toString(),
      label: "Critical",
      sublabel: "severity incidents",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {stats.map((stat, i) => (
        <div
          key={stat.label}
          className="group flex flex-col gap-2 p-5 rounded-lg border border-border bg-card/50 hover:border-zinc-600 transition-colors cursor-default"
          style={{ animationDelay: `${i * 80}ms` }}
        >
          <stat.icon className={`h-4 w-4 ${stat.iconColor}`} />
          <div className="font-bold text-2xl tracking-tight group-hover:translate-x-1 transition duration-500">
            {stat.value}
          </div>
          <div>
            <div className="text-sm font-medium text-foreground/80 group-hover:translate-x-1 transition duration-500">
              {stat.label}
            </div>
            <div className="text-xs text-muted-foreground group-hover:translate-x-1 transition duration-700">
              {stat.sublabel}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
