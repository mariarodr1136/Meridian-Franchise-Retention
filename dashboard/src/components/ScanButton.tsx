"use client";

import { useState, useEffect } from "react";

function CountUp({ target }: { target: number }) {
  const [n, setN] = useState(0);
  useEffect(() => {
    if (target === 0) { setN(0); return; }
    const t0 = performance.now();
    const dur = 550;
    function tick(now: number) {
      const p = Math.min((now - t0) / dur, 1);
      setN(Math.round((1 - (1 - p) ** 3) * target));
      if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
  }, [target]);
  return <>{n}</>;
}

export function ScanButton() {
  const [scanning, setScanning] = useState(false);
  const [count, setCount] = useState<number | null>(null);

  async function scan() {
    if (scanning) return;
    setScanning(true);
    setCount(null);

    const res = await fetch("/api/anomalies/generate", { method: "POST" });
    const data = await res.json() as { created: number };
    setCount(data.created);
    setScanning(false);
  }

  return (
    <div className="flex items-center gap-3">
      {/* Result pill — fades in once scan finishes */}
      {count !== null && !scanning && (
        <div
          className="flex items-center gap-2 pl-2 pr-3.5 py-1.5 rounded-full"
          style={{
            animation: "fadeSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards",
            background: "#FFFFFF",
            border: "1px solid #C8D8EE",
            boxShadow: "0 1px 6px rgba(74,99,141,0.10)",
          }}
        >
          <div
            className="w-5 h-5 rounded-full flex items-center justify-center flex-shrink-0"
            style={{ background: "#16A34A" }}
          >
            <svg width="9" height="9" viewBox="0 0 9 9" fill="none">
              <path d="M1.5 4.5l2 2L7.5 2" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
          <p className="text-xs" style={{ color: "#6B7280" }}>
            <span className="font-bold tabular-nums" style={{ color: "#1F2937" }}>
              <CountUp target={count} />
            </span>
            {" "}alert{count !== 1 ? "s" : ""} found
          </p>
        </div>
      )}

      <button
        onClick={scan}
        className="text-xs font-semibold px-4 py-2 rounded-lg text-white cursor-pointer"
        style={{ background: "#4A638D" }}
      >
        {scanning ? "Scanning…" : "Scan Network"}
      </button>
    </div>
  );
}
