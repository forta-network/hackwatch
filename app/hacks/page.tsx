"use client";

import { useEffect, useState } from "react";
import { Dashboard } from "../components/dashboard";
import type { Exploit } from "../types";

export default function HacksPage() {
  const [data, setData] = useState<Exploit[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/data.json")
      .then((r) => r.json())
      .then((d) => {
        setData(d);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-muted-foreground font-mono text-sm animate-pulse">
          Loading exploit data...
        </div>
      </div>
    );
  }

  return <Dashboard data={data} />;
}
