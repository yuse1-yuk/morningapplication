'use client';
/* eslint-disable react-hooks/set-state-in-effect */

import { useEffect, useState } from "react";

const dateFormatter = new Intl.DateTimeFormat("ja-JP", {
  weekday: "short",
  month: "short",
  day: "numeric",
});

const timeFormatter = new Intl.DateTimeFormat("ja-JP", {
  hour: "2-digit",
  minute: "2-digit",
});

export function LiveClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    // Avoid hydration mismatch by setting time only on client after mount
    setNow(new Date());
    const id = setInterval(() => setNow(new Date()), 30_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div className="flex items-baseline gap-3 text-white/80">
      <span className="text-4xl font-semibold text-white">
        {now ? timeFormatter.format(now) : "--:--"}
      </span>
      <span className="text-sm uppercase tracking-wide">
        {now ? dateFormatter.format(now) : ""}
      </span>
    </div>
  );
}
