"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STAGES = ["Discovery", "Agreement Signed", "Site Selected", "Permits & Construction", "Pre-Sales"] as const;
type Stage = (typeof STAGES)[number];

interface Lead {
  id: string;
  franchiseeName: string;
  market: string;
  state: string;
  stage: string;
  stageEnteredAt: string;
  expectedOpenDate: string | null;
  territoryType: string;
  notes: string | null;
  docsComplete: boolean;
  leaseComplete: boolean;
  trainingBooked: boolean;
  assignedTo: string;
}

function daysInStage(iso: string): number {
  return Math.floor((Date.now() - new Date(iso).getTime()) / 86_400_000);
}

function LeadCard({ lead, onAdvance, onBack, isPending }: {
  lead: Lead;
  onAdvance: () => void;
  onBack: () => void;
  isPending: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const days = daysInStage(lead.stageEnteredAt);
  const stalled = days > 14;
  const stageIdx = STAGES.indexOf(lead.stage as Stage);

  const checks = [
    { label: "Docs",     done: lead.docsComplete },
    { label: "Lease",    done: lead.leaseComplete },
    { label: "Training", done: lead.trainingBooked },
  ];

  return (
    <div
      className="rounded-xl border p-3 transition-shadow"
      style={{
        background: "#FFFFFF",
        borderColor: stalled ? "#FCA5A5" : "#C8D8EE",
        borderLeftWidth: stalled ? "3px" : "1px",
        borderLeftColor: stalled ? "#EA580C" : "#C8D8EE",
        opacity: isPending ? 0.6 : 1,
      }}
    >
      <button className="w-full text-left" onClick={() => setExpanded((e) => !e)}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <p className="text-sm font-semibold truncate" style={{ color: "#1F2937" }}>{lead.franchiseeName}</p>
            <p className="text-xs" style={{ color: "#6B7280" }}>{lead.market}, {lead.state}</p>
          </div>
          {stalled && (
            <span className="flex-shrink-0 text-xs font-bold px-1.5 py-0.5 rounded"
              style={{ background: "#FEE2E2", color: "#DC2626" }}>
              {days}d
            </span>
          )}
          {!stalled && (
            <span className="flex-shrink-0 text-xs" style={{ color: "#9CA3AF" }}>{days}d</span>
          )}
        </div>

        {/* Progress checks */}
        <div className="flex items-center gap-2 mt-2">
          {checks.map(({ label, done }) => (
            <span key={label} className="flex items-center gap-0.5 text-xs"
              style={{ color: done ? "#16A34A" : "#9CA3AF" }}>
              <span>{done ? "✓" : "○"}</span>
              <span>{label}</span>
            </span>
          ))}
        </div>
      </button>

      {/* Expanded detail */}
      {expanded && (
        <div className="mt-3 pt-3 border-t text-xs space-y-1.5" style={{ borderColor: "#E4EDF8" }}>
          <p style={{ color: "#6B7280" }}>
            <span style={{ color: "#9CA3AF" }}>Assigned:</span> {lead.assignedTo}
          </p>
          {lead.expectedOpenDate && (
            <p style={{ color: "#6B7280" }}>
              <span style={{ color: "#9CA3AF" }}>Target open:</span>{" "}
              {new Date(lead.expectedOpenDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
            </p>
          )}
          <p className="capitalize" style={{ color: "#6B7280" }}>
            <span style={{ color: "#9CA3AF" }}>Territory:</span> {lead.territoryType}
          </p>
          {lead.notes && (
            <p className="italic mt-1" style={{ color: "#EA580C" }}>{lead.notes}</p>
          )}
        </div>
      )}

      {/* Stage controls */}
      <div className="flex items-center gap-2 mt-3">
        {stageIdx > 0 && (
          <button
            onClick={onBack}
            disabled={isPending}
            className="flex-1 text-xs py-1 rounded-md border transition-colors disabled:opacity-40"
            style={{ borderColor: "#C8D8EE", color: "#9CA3AF" }}
          >
            ← Back
          </button>
        )}
        {stageIdx < STAGES.length - 1 && (
          <button
            onClick={onAdvance}
            disabled={isPending}
            className="flex-1 text-xs py-1 rounded-md text-white font-medium transition-opacity disabled:opacity-40"
            style={{ background: "#4A638D" }}
          >
            Advance →
          </button>
        )}
        {stageIdx === STAGES.length - 1 && (
          <button
            onClick={onAdvance}
            disabled={isPending}
            className="flex-1 text-xs py-1 rounded-md text-white font-medium transition-opacity disabled:opacity-40"
            style={{ background: "#16A34A" }}
          >
            Mark Launched ✓
          </button>
        )}
      </div>
    </div>
  );
}

export function PipelineBoard({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  async function moveStage(id: string, direction: "forward" | "back") {
    const lead = leads.find((l) => l.id === id)!;
    const idx  = STAGES.indexOf(lead.stage as Stage);
    const nextStage = direction === "forward"
      ? (idx < STAGES.length - 1 ? STAGES[idx + 1] : "Launched")
      : STAGES[Math.max(0, idx - 1)];
    if (nextStage === lead.stage) return;

    setPending(id);
    setLeads((prev) => prev.map((l) =>
      l.id === id ? { ...l, stage: nextStage, stageEnteredAt: new Date().toISOString() } : l
    ));

    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, stage: nextStage }),
    });

    setPending(null);
    startTransition(() => router.refresh());
  }

  const launched = leads.filter((l) => l.stage === "Launched");

  return (
    <div className="space-y-4">
      {/* Kanban columns */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {STAGES.map((stage) => {
          const col = leads.filter((l) => l.stage === stage);
          const stalledCount = col.filter((l) => daysInStage(l.stageEnteredAt) > 14).length;

          return (
            <div key={stage}>
              {/* Column header */}
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>
                  {stage}
                </p>
                <div className="flex items-center gap-1.5">
                  {stalledCount > 0 && (
                    <span className="text-xs px-1.5 py-0.5 rounded-full" style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      {stalledCount} stalled
                    </span>
                  )}
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ background: "#EEF3FB", color: "#4A638D" }}>
                    {col.length}
                  </span>
                </div>
              </div>

              {/* Cards */}
              <div className="flex flex-col gap-2 min-h-[200px]">
                {col.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isPending={pending === lead.id}
                    onAdvance={() => moveStage(lead.id, "forward")}
                    onBack={()    => moveStage(lead.id, "back")}
                  />
                ))}
                {col.length === 0 && (
                  <div className="rounded-xl border-2 border-dashed h-20 flex items-center justify-center"
                    style={{ borderColor: "#C8D8EE" }}>
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>No leads</p>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Launched section */}
      {launched.length > 0 && (
        <div className="mt-6">
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#16A34A" }}>
            Launched this cycle ({launched.length})
          </p>
          <div className="grid grid-cols-5 gap-2">
            {launched.map((lead) => (
              <div key={lead.id} className="rounded-xl border px-3 py-2.5 flex items-center gap-2"
                style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                <span style={{ color: "#16A34A" }}>✓</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "#1F2937" }}>{lead.franchiseeName}</p>
                  <p className="text-xs truncate" style={{ color: "#6B7280" }}>{lead.market}, {lead.state}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
