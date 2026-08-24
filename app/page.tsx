import Link from "next/link";
import { Skull, ArrowRight, Shield, Activity, Zap } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative overflow-hidden">
      {/* Radial glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-red-500/[0.04] blur-[120px] pointer-events-none" />
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] rounded-full bg-cyan-500/[0.03] blur-[80px] pointer-events-none" />

      {/* Content */}
      <div className="relative z-10 flex flex-col items-center gap-8 max-w-lg text-center">
        {/* Icon */}
        <div className="p-4 rounded-2xl bg-red-500/10 border border-red-500/20 animate-[fade-in_0.5s_ease-out_both]">
          <Skull className="h-10 w-10 text-red-500" />
        </div>

        {/* Title */}
        <div className="space-y-3 animate-[fade-in_0.5s_ease-out_0.1s_both]">
          <h1 className="text-5xl md:text-6xl font-extrabold tracking-tight">
            Hack<span className="text-red-500">Watch</span>
          </h1>
          <p className="text-muted-foreground text-base md:text-lg leading-relaxed">
            Real-time EVM exploit monitoring.<br />
            AI-classified. Forta-enriched.
          </p>
        </div>

        {/* Features */}
        <div className="grid grid-cols-3 gap-4 w-full animate-[fade-in_0.5s_ease-out_0.2s_both]">
          {[
            { icon: Shield, label: "AI Classification", color: "text-cyan-400" },
            { icon: Activity, label: "Forta Risk Scores", color: "text-amber-400" },
            { icon: Zap, label: "Multi-chain", color: "text-emerald-400" },
          ].map((f) => (
            <div
              key={f.label}
              className="flex flex-col items-center gap-2 p-3 rounded-lg border border-border bg-card/30"
            >
              <f.icon className={`h-4 w-4 ${f.color}`} />
              <span className="text-[11px] text-muted-foreground font-medium">
                {f.label}
              </span>
            </div>
          ))}
        </div>

        {/* CTA */}
        <Link
          href="/hacks"
          className="group inline-flex items-center gap-2.5 px-6 py-3 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400 font-semibold text-sm hover:bg-red-500/20 hover:border-red-500/40 transition-all duration-300 animate-[fade-in_0.5s_ease-out_0.3s_both]"
        >
          View Exploits
          <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform duration-300" />
        </Link>

        {/* Subtitle */}
        <p className="text-[11px] text-muted-foreground/50 font-mono animate-[fade-in_0.5s_ease-out_0.4s_both]">
          Powered by Forta Network
        </p>
      </div>
    </div>
  );
}
