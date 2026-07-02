"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";

const STAGES = ["Discovery", "Agreement Signed", "Site Selected", "Permits & Construction", "Pre-Sales"] as const;
type Stage = (typeof STAGES)[number];

const STAGE_SHORT: Record<Stage, string> = {
  "Discovery": "Discovery",
  "Agreement Signed": "Agreement",
  "Site Selected": "Site Selected",
  "Permits & Construction": "Permits",
  "Pre-Sales": "Pre-Sales",
};

const TERRITORY_TYPES = ["suburban", "urban", "rural", "resort"] as const;

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

function StageDots({ stageIdx }: { stageIdx: number }) {
  return (
    <div className="flex items-center gap-1">
      {STAGES.map((_, i) => (
        <span
          key={i}
          style={{
            display: "block",
            width: i === stageIdx ? 7 : 5,
            height: i === stageIdx ? 7 : 5,
            borderRadius: "50%",
            background: i <= stageIdx ? "#4A638D" : "#D1DBE8",
            opacity: i < stageIdx ? 0.45 : 1,
            flexShrink: 0,
            transition: "all 0.2s ease",
          }}
        />
      ))}
      <span className="text-[10px] ml-0.5" style={{ color: "#9CA3AF" }}>{stageIdx + 1}/5</span>
    </div>
  );
}

function Chevron({ expanded }: { expanded: boolean }) {
  return (
    <svg width="10" height="10" viewBox="0 0 10 6" fill="none" aria-hidden
      style={{
        color: "#9CA3AF",
        flexShrink: 0,
        transform: expanded ? "rotate(180deg)" : "rotate(0deg)",
        transition: "transform 0.25s cubic-bezier(0.16, 1, 0.3, 1)",
      }}
    >
      <path d="M1 1l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

/* ── New Lead Modal ────────────────────────────────────────── */

interface ModalProps {
  defaultStage: Stage;
  onClose: () => void;
  onCreated: (lead: Lead) => void;
}

function NewLeadModal({ defaultStage, onClose, onCreated }: ModalProps) {
  const [form, setForm] = useState({
    franchiseeName: "",
    market: "",
    state: "",
    assignedTo: "",
    stage: defaultStage as string,
    territoryType: "suburban",
    expectedOpenDate: "",
    notes: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  function upd(key: string, val: string) {
    setForm((f) => ({ ...f, [key]: val }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    try {
      const res = await fetch("/api/pipeline", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          franchiseeName: form.franchiseeName.trim(),
          market: form.market.trim(),
          state: form.state.trim() || undefined,
          assignedTo: form.assignedTo.trim(),
          stage: form.stage,
          territoryType: form.territoryType,
          expectedOpenDate: form.expectedOpenDate ? `${form.expectedOpenDate}-01` : undefined,
          notes: form.notes.trim() || undefined,
        }),
      });
      if (!res.ok) throw new Error();
      const { lead } = await res.json() as { lead: Lead };
      onCreated(lead);
      onClose();
    } catch {
      setError("Something went wrong — please try again.");
      setSaving(false);
    }
  }

  const field = "w-full text-sm border rounded-lg px-3 py-2 outline-none transition-all duration-150 hover:border-[#7B97BE] hover:shadow-sm focus:border-[#4A638D] focus:shadow-sm";
  const fieldStyle = { borderColor: "#C8D8EE" };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: "rgba(15,23,42,0.45)" }}
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
    >
      <div className="w-full max-w-md rounded-2xl border shadow-2xl" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center justify-between px-6 py-4 border-b" style={{ borderColor: "#E4EDF8" }}>
          <div>
            <h2 className="text-sm font-bold" style={{ color: "#1F2937" }}>Add New Lead</h2>
            <p className="text-xs mt-0.5" style={{ color: "#9CA3AF" }}>
              Starting in: <span className="font-medium" style={{ color: "#4A638D" }}>{form.stage}</span>
            </p>
          </div>
          <button onClick={onClose} className="w-6 h-6 flex items-center justify-center rounded-full transition-colors hover:bg-gray-100 cursor-pointer" style={{ color: "#9CA3AF" }}>
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="px-6 py-5 space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>Franchisee Name *</label>
              <input required value={form.franchiseeName} onChange={(e) => upd("franchiseeName", e.target.value)}
                className={field} style={fieldStyle} placeholder="Full name" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>Assigned To *</label>
              <input required value={form.assignedTo} onChange={(e) => upd("assignedTo", e.target.value)}
                className={field} style={fieldStyle} placeholder="HQ contact" />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2">
              <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>Market / City *</label>
              <input required value={form.market} onChange={(e) => upd("market", e.target.value)}
                className={field} style={fieldStyle} placeholder="e.g. Miami" />
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>State</label>
              <input value={form.state} onChange={(e) => upd("state", e.target.value)}
                className={field} style={fieldStyle} placeholder="FL" maxLength={2} />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>Pipeline Stage</label>
              <select value={form.stage} onChange={(e) => upd("stage", e.target.value)}
                className={`${field} cursor-pointer`} style={fieldStyle}>
                {STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>Territory</label>
              <select value={form.territoryType} onChange={(e) => upd("territoryType", e.target.value)}
                className={`${field} cursor-pointer`} style={fieldStyle}>
                {TERRITORY_TYPES.map((t) => (
                  <option key={t} value={t}>{t.charAt(0).toUpperCase() + t.slice(1)}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>Expected Open Date (optional)</label>
            <input type="month" value={form.expectedOpenDate} onChange={(e) => upd("expectedOpenDate", e.target.value)}
              className={`${field} cursor-pointer`} style={fieldStyle} />
          </div>

          <div>
            <label className="text-xs font-medium block mb-1" style={{ color: "#6B7280" }}>Notes / Flags (optional)</label>
            <textarea value={form.notes} onChange={(e) => upd("notes", e.target.value)}
              className={`${field} resize-none`} style={fieldStyle} rows={2}
              placeholder="Blockers, context, anything HQ should know…" />
          </div>

          {error && <p className="text-xs" style={{ color: "#DC2626" }}>{error}</p>}

          <div className="flex gap-3 pt-1">
            <button type="button" onClick={onClose}
              className="flex-1 text-sm py-2 rounded-lg border cursor-pointer transition-colors hover:bg-gray-50"
              style={{ borderColor: "#C8D8EE", color: "#6B7280" }}>
              Cancel
            </button>
            <button type="submit" disabled={saving}
              className="flex-1 text-sm py-2 rounded-lg text-white font-semibold cursor-pointer transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ background: "#4A638D" }}>
              {saving ? "Adding…" : "Add Lead"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ── Lead Card ─────────────────────────────────────────────── */

function LeadCard({ lead, onAdvance, onBack, isPending, onToggleCheck }: {
  lead: Lead;
  onAdvance: () => void;
  onBack: () => void;
  isPending: boolean;
  onToggleCheck: (field: "docsComplete" | "leaseComplete" | "trainingBooked", value: boolean) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [hovered, setHovered] = useState(false);
  const days = daysInStage(lead.stageEnteredAt);
  const stalled = days > 14;
  const stageIdx = STAGES.indexOf(lead.stage as Stage);
  const allDone = lead.docsComplete && lead.leaseComplete && lead.trainingBooked;
  const hasNotes = !!lead.notes;

  const checks: { label: string; field: "docsComplete" | "leaseComplete" | "trainingBooked"; done: boolean }[] = [
    { label: "Docs",     field: "docsComplete",    done: lead.docsComplete },
    { label: "Lease",    field: "leaseComplete",   done: lead.leaseComplete },
    { label: "Training", field: "trainingBooked",  done: lead.trainingBooked },
  ];

  const donePct = checks.filter((c) => c.done).length;

  return (
    <div
      className="rounded-xl border"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: "#FFFFFF",
        borderColor: stalled
          ? hovered ? "#F87171" : "#FCA5A5"
          : hovered ? "#7B97BE" : "#C8D8EE",
        borderLeftWidth: stalled ? "3px" : "1px",
        borderLeftColor: stalled
          ? hovered ? "#DC2626" : "#EA580C"
          : hovered ? "#7B97BE" : "#C8D8EE",
        opacity: isPending ? 0.6 : 1,
        boxShadow: expanded
          ? "0 4px 18px rgba(74,99,141,0.11)"
          : hovered
          ? "0 4px 14px rgba(74,99,141,0.12)"
          : "none",
        transform: !expanded && hovered ? "translateY(-1px)" : "none",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
      }}
    >
      {/* ── Clickable header ── */}
      <div
        className="p-3 select-none"
        style={{ cursor: "pointer" }}
        onClick={() => setExpanded((v) => !v)}
      >
        {/* Stage dots + days */}
        <div className="flex items-center justify-between mb-2">
          <StageDots stageIdx={stageIdx} />
          <div className="flex items-center gap-1.5">
            {hasNotes && !expanded && (
              <span className="text-[10px]" style={{ color: "#D97706" }} title="Has notes">●</span>
            )}
            {stalled ? (
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded whitespace-nowrap"
                style={{ background: "#FEE2E2", color: "#DC2626" }}>
                ⚠ {days}d stalled
              </span>
            ) : (
              <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{days}d</span>
            )}
            <Chevron expanded={expanded} />
          </div>
        </div>

        {/* Name + location */}
        <p className="text-sm font-semibold leading-snug" style={{ color: "#1F2937" }}>{lead.market}{lead.state ? `, ${lead.state}` : ""}</p>
        <p className="text-xs mt-0.5 mb-2.5" style={{ color: "#6B7280" }}>
          {lead.assignedTo}
          <span style={{ color: "#D1DBE8" }}> · </span>
          <span className="capitalize">{lead.territoryType}</span>
        </p>

        {/* Progress pills */}
        <div className="flex items-center gap-1">
          {checks.map(({ label, done }) => (
            <span
              key={label}
              className="text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
              style={{
                background: done ? "#DCFCE7" : "#F3F4F6",
                color: done ? "#16A34A" : "#9CA3AF",
              }}
            >
              {done ? "✓" : "·"} {label}
            </span>
          ))}
          {donePct === 3 && (
            <span className="text-[10px] px-1.5 py-0.5 rounded-full ml-auto whitespace-nowrap"
              style={{ background: "#EEF3FB", color: "#4A638D" }}>
              Ready
            </span>
          )}
        </div>
      </div>

      {/* ── Smooth expand detail ── */}
      <div style={{
        display: "grid",
        gridTemplateRows: expanded ? "1fr" : "0fr",
        transition: "grid-template-rows 0.38s cubic-bezier(0.4, 0, 0.2, 1)",
      }}>
        <div style={{ overflow: "hidden", minHeight: 0 }}>
          <div className="px-3 pb-2">
            <div style={{ height: 1, background: "#E4EDF8", marginBottom: 10 }} />

            {/* Key-value detail */}
            <div className="space-y-1.5 text-xs mb-3">
              <div className="flex items-start gap-2">
                <span className="w-16 flex-shrink-0 font-medium" style={{ color: "#9CA3AF" }}>Assigned</span>
                <span style={{ color: "#1F2937" }}>{lead.assignedTo}</span>
              </div>
              {lead.expectedOpenDate && (
                <div className="flex items-start gap-2">
                  <span className="w-16 flex-shrink-0 font-medium" style={{ color: "#9CA3AF" }}>Target open</span>
                  <span style={{ color: "#1F2937" }}>
                    {new Date(lead.expectedOpenDate).toLocaleDateString("en-US", { month: "short", year: "numeric" })}
                  </span>
                </div>
              )}
              <div className="flex items-start gap-2">
                <span className="w-16 flex-shrink-0 font-medium" style={{ color: "#9CA3AF" }}>Stage</span>
                <span style={{ color: "#1F2937" }}>{lead.stage} ({stageIdx + 1} of 5)</span>
              </div>
            </div>

            {/* Clickable checklist */}
            <p className="text-[10px] font-semibold uppercase tracking-wide mb-1.5" style={{ color: "#9CA3AF" }}>
              Checklist
            </p>
            <div className="flex gap-1.5 mb-3">
              {checks.map(({ label, field, done }) => (
                <button
                  key={label}
                  onClick={(e) => { e.stopPropagation(); onToggleCheck(field, !done); }}
                  className="flex-1 text-[10px] py-1 rounded-lg border cursor-pointer transition-all"
                  style={{
                    background: done ? "#DCFCE7" : "#F9FAFB",
                    borderColor: done ? "#86EFAC" : "#E5E7EB",
                    color: done ? "#16A34A" : "#9CA3AF",
                  }}
                >
                  {done ? "✓" : "○"} {label}
                </button>
              ))}
            </div>

            {/* Notes */}
            {lead.notes && (
              <div className="rounded-lg px-2.5 py-2 mb-2"
                style={{ background: "#FFFBEB", borderLeft: "3px solid #F59E0B" }}>
                <p className="text-[10px] font-semibold uppercase tracking-wide mb-0.5" style={{ color: "#D97706" }}>Notes</p>
                <p className="text-xs leading-relaxed" style={{ color: "#92400E" }}>{lead.notes}</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Stage controls ── */}
      <div className="px-3 pb-3 flex items-center gap-2">
        {stageIdx > 0 && (
          <button
            onClick={(e) => { e.stopPropagation(); onBack(); }}
            disabled={isPending}
            className="flex-1 text-xs py-1.5 rounded-md border cursor-pointer transition-colors disabled:opacity-40 hover:bg-gray-50"
            style={{ borderColor: "#C8D8EE", color: "#6B7280" }}
          >
            ← Back
          </button>
        )}
        {stageIdx < STAGES.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(); }}
            disabled={isPending}
            className="flex-1 text-xs py-1.5 rounded-md text-white font-medium cursor-pointer transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{ background: "#4A638D" }}
          >
            Advance →
          </button>
        )}
        {stageIdx === STAGES.length - 1 && (
          <button
            onClick={(e) => { e.stopPropagation(); onAdvance(); }}
            disabled={isPending}
            className="flex-1 text-xs py-1.5 rounded-md text-white font-medium cursor-pointer transition-opacity disabled:opacity-40 hover:opacity-90"
            style={{ background: "#16A34A" }}
          >
            Mark Launched ✓
          </button>
        )}
      </div>
    </div>
  );
}

/* ── Board ─────────────────────────────────────────────────── */

export function PipelineBoard({ leads: initial }: { leads: Lead[] }) {
  const [leads, setLeads] = useState(initial);
  const [pending, setPending] = useState<string | null>(null);
  const [modalStage, setModalStage] = useState<Stage | null>(null);
  const router = useRouter();
  const [, startTransition] = useTransition();

  const openLeads = leads.filter((l) => l.stage !== "Launched");
  const stalledTotal = openLeads.filter((l) => daysInStage(l.stageEnteredAt) > 14).length;
  const byStage = Object.fromEntries(
    STAGES.map((s) => [s, leads.filter((l) => l.stage === s)])
  ) as Record<Stage, Lead[]>;
  const launched = leads.filter((l) => l.stage === "Launched");

  async function moveStage(id: string, direction: "forward" | "back") {
    const lead = leads.find((l) => l.id === id)!;
    const idx = STAGES.indexOf(lead.stage as Stage);
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

  async function toggleCheck(id: string, field: "docsComplete" | "leaseComplete" | "trainingBooked", value: boolean) {
    setLeads((prev) => prev.map((l) => l.id === id ? { ...l, [field]: value } : l));
    await fetch("/api/pipeline", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, [field]: value }),
    });
  }

  function handleCreated(lead: Lead) {
    setLeads((prev) => [...prev, lead]);
    startTransition(() => router.refresh());
  }

  const summaryItems = [
    { label: "In Pipeline", value: openLeads.length, color: "#4A638D" },
    ...STAGES.map((s) => ({ label: STAGE_SHORT[s], full: s, value: byStage[s].length, color: "#4A638D" })),
    { label: stalledTotal > 0 ? "Stalled" : "No Stalls", full: "Stalled >14 days", value: stalledTotal, color: stalledTotal > 0 ? "#EA580C" : "#16A34A" },
  ];

  return (
    <div className="space-y-6">
      {/* Summary chips */}
      <div className="flex items-stretch gap-3">
        {summaryItems.map(({ label, value, color, full }) => (
          <SummaryChip key={label} label={label} title={full ?? label} value={value} color={color} />
        ))}
      </div>

      {/* Kanban columns */}
      <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(5, 1fr)" }}>
        {STAGES.map((stage) => {
          const col = byStage[stage];
          const stalledCount = col.filter((l) => daysInStage(l.stageEnteredAt) > 14).length;
          return (
            <div key={stage}>
              <div className="flex items-center justify-between mb-3 gap-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <p className="text-xs font-bold tracking-widest uppercase truncate" style={{ color: "#4A638D" }}
                    title={stage}>
                    {STAGE_SHORT[stage]}
                  </p>
                  {stalledCount > 0 && (
                    <span className="flex-shrink-0 text-[10px] px-1.5 py-0.5 rounded-full whitespace-nowrap"
                      style={{ background: "#FEE2E2", color: "#DC2626" }}>
                      {stalledCount} stalled
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-1 flex-shrink-0">
                  <span className="text-[10px] px-1.5 py-0.5 rounded-full" style={{ background: "#EEF3FB", color: "#4A638D" }}>
                    {col.length}
                  </span>
                  <button
                    onClick={() => setModalStage(stage)}
                    title={`Add lead to ${stage}`}
                    className="flex items-center justify-center w-5 h-5 rounded-full text-white cursor-pointer transition-opacity hover:opacity-75 flex-shrink-0 font-bold"
                    style={{ background: "#4A638D", fontSize: 15, lineHeight: 1 }}
                  >
                    <span style={{ position: "relative", top: -1 }}>+</span>
                  </button>
                </div>
              </div>

              <div className="flex flex-col gap-2 min-h-[200px]">
                {col.map((lead) => (
                  <LeadCard
                    key={lead.id}
                    lead={lead}
                    isPending={pending === lead.id}
                    onAdvance={() => moveStage(lead.id, "forward")}
                    onBack={() => moveStage(lead.id, "back")}
                    onToggleCheck={(field, value) => toggleCheck(lead.id, field, value)}
                  />
                ))}
                {col.length === 0 && (
                  <button
                    onClick={() => setModalStage(stage)}
                    className="rounded-xl border-2 border-dashed h-20 flex items-center justify-center cursor-pointer transition-all hover:border-[#7B97BE] hover:bg-[#F4F8FE]"
                    style={{ borderColor: "#C8D8EE" }}
                  >
                    <p className="text-xs" style={{ color: "#9CA3AF" }}>+ Add lead</p>
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Launched */}
      {launched.length > 0 && (
        <div>
          <p className="text-xs font-bold tracking-widest uppercase mb-3" style={{ color: "#16A34A" }}>
            Launched this cycle ({launched.length})
          </p>
          <div className="grid grid-cols-5 gap-2">
            {launched.map((lead) => (
              <div key={lead.id}
                className="rounded-xl border px-3 py-2.5 flex items-center gap-2 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md"
                style={{ background: "#F0FDF4", borderColor: "#BBF7D0" }}>
                <span style={{ color: "#16A34A" }}>✓</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium truncate" style={{ color: "#1F2937" }}>{lead.market}{lead.state ? `, ${lead.state}` : ""}</p>
                  <p className="text-xs truncate" style={{ color: "#6B7280" }}>{lead.assignedTo}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal */}
      {modalStage && (
        <NewLeadModal
          defaultStage={modalStage}
          onClose={() => setModalStage(null)}
          onCreated={handleCreated}
        />
      )}
    </div>
  );
}

/* ── Summary chip (with hover state) ─────────────────────── */
function SummaryChip({ label, title, value, color }: { label: string; title: string; value: number; color: string }) {
  const [hovered, setHovered] = useState(false);
  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      className="rounded-xl border px-4 py-3 text-center flex-1 min-w-0"
      style={{
        background: "#FFFFFF",
        borderColor: hovered ? "#7B97BE" : "#C8D8EE",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        boxShadow: hovered ? "0 4px 14px rgba(74,99,141,0.12)" : "none",
        transition: "border-color 0.18s ease, box-shadow 0.18s ease, transform 0.18s ease",
      }}
      title={title}
    >
      <p className="text-2xl font-bold" style={{ color }}>{value}</p>
      <p className="text-xs mt-0.5 truncate" style={{ color: "#6B7280" }}>{label}</p>
    </div>
  );
}
