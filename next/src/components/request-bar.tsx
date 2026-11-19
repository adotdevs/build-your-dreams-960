"use client";

import { useEffect, useState } from "react";
import { installRequestTracker, subscribeRequests } from "@/lib/request-activity";

export default function RequestBar() {
  const [active, setActive] = useState(false);
  const [width, setWidth] = useState(0);

  useEffect(() => {
    installRequestTracker();
    return subscribeRequests((pending) => setActive(pending > 0));
  }, []);

  useEffect(() => {
    if (!active) {
      if (width === 0) return;
      setWidth(100);
      const done = window.setTimeout(() => setWidth(0), 220);
      return () => window.clearTimeout(done);
    }
    setWidth(18);
    const creep = window.setInterval(() => {
      setWidth((current) => (current >= 90 ? current : current + Math.max(1, (90 - current) * 0.12)));
    }, 200);
    return () => window.clearInterval(creep);
  }, [active]);

  if (width === 0) return null;

  return (
    <div className="pointer-events-none fixed inset-x-0 top-0 z-[100] h-0.5">
      <div
        className="h-full bg-[#0c64f3] shadow-[0_0_10px_#0c64f3] transition-[width] duration-200 ease-out"
        style={{ width: `${width}%` }}
      />
    </div>
  );
}
