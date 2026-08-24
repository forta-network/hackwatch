import { cn } from "@/lib/utils";

const severityConfig: Record<string, { bg: string; text: string; dot: string }> = {
  critical: { bg: "bg-red-500/10", text: "text-red-400", dot: "bg-red-500" },
  high: { bg: "bg-amber-500/10", text: "text-amber-400", dot: "bg-amber-500" },
  medium: { bg: "bg-orange-500/10", text: "text-orange-400", dot: "bg-orange-500" },
  low: { bg: "bg-emerald-500/10", text: "text-emerald-400", dot: "bg-emerald-500" },
};

export function SeverityBadge({ severity }: { severity: string }) {
  const config = severityConfig[severity] || severityConfig.low;
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 px-2 py-0.5 rounded-md text-xs font-medium uppercase tracking-wide",
        config.bg,
        config.text
      )}
    >
      <span className={cn("w-1.5 h-1.5 rounded-full", config.dot)} />
      {severity}
    </span>
  );
}
