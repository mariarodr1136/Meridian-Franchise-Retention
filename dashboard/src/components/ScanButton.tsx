"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export function ScanButton() {
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const [result, setResult] = useState<{ created: number } | null>(null);

  async function scan() {
    setScanning(true);
    setResult(null);
    const res  = await fetch("/api/anomalies/generate", { method: "POST" });
    const data = await res.json() as { created: number };
    setResult(data);
    setScanning(false);
    router.refresh();
  }

  return (
    <div className="flex items-center gap-3">
      {result && (
        <p className="text-xs" style={{ color: "#6B7280" }}>
          {result.created} alert{result.created !== 1 ? "s" : ""} generated
        </p>
      )}
      <button
        onClick={scan}
        disabled={scanning}
        className="text-xs font-semibold px-4 py-2 rounded-lg text-white cursor-pointer disabled:opacity-60"
        style={{ background: "#4A638D" }}
      >
        {scanning ? "Scanning…" : "Scan Network"}
      </button>
    </div>
  );
}
