"use client";

import { useState, useMemo } from "react";
import Link from "next/link";

const NAVY  = "#4A638D";
const BORDER = "#C8D8EE";

type CertStatus = "certified" | "pending" | "expired";
type Role = "instructor" | "studio_lead" | "general_manager" | "director_of_operations";

interface InstructorItem {
  id:                  string;
  name:                string;
  role:                Role;
  certificationStatus: CertStatus;
  lastEvalDate:        string | null;
  performanceScore:    number | null;
  studio: {
    id:     string;
    name:   string;
    city:   string;
    state:  string | null;
    status: string;
  };
}

function scoreColor(score: number | null): string {
  if (score == null) return "#9CA3AF";
  if (score >= 92) return "#16a34a";
  if (score >= 85) return "#4A638D";
  if (score >= 75) return "#C9A84C";
  return "#EA580C";
}

function scoreLabel(score: number | null): string {
  if (score == null) return "—";
  if (score >= 92) return "Elite";
  if (score >= 85) return "Strong";
  if (score >= 75) return "Developing";
  return "Needs Attn";
}

function certBadge(status: CertStatus) {
  const config: Record<CertStatus, { label: string; bg: string; text: string }> = {
    certified: { label: "Certified",  bg: "#DCFCE7", text: "#16a34a" },
    pending:   { label: "Pending",    bg: "#FEF9C3", text: "#A16207" },
    expired:   { label: "Expired",    bg: "#FEE2E2", text: "#DC2626" },
  };
  const c = config[status];
  return (
    <span
      className="text-[10px] font-bold px-2 py-0.5 rounded-full"
      style={{ background: c.bg, color: c.text }}
    >
      {c.label}
    </span>
  );
}

const ROLE_LABELS: Record<Role, string> = {
  instructor:              "Instructor",
  studio_lead:             "Studio Lead",
  general_manager:         "General Manager",
  director_of_operations:  "Director of Ops",
};

type FilterRole = "all" | Role;
type SortKey = "score" | "name" | "studio" | "eval";

interface Props {
  instructors: InstructorItem[];
}

export function InstructorRoster({ instructors }: Props) {
  const [roleFilter, setRoleFilter]     = useState<FilterRole>("instructor");
  const [certFilter, setCertFilter]     = useState<"all" | "certified" | "pending" | "expired">("all");
  const [studioFilter, setStudioFilter] = useState<string>("all");
  const [sort, setSort]                 = useState<SortKey>("score");
  const [query, setQuery]               = useState("");

  const studios = useMemo(() => {
    const set = new Map<string, string>();
    for (const i of instructors) set.set(i.studio.id, `${i.studio.name} · ${i.studio.city}`);
    return [...set.entries()].sort((a, b) => a[1].localeCompare(b[1]));
  }, [instructors]);

  const filtered = useMemo(() => {
    let list = instructors;
    if (roleFilter !== "all")   list = list.filter((i) => i.role === roleFilter);
    if (certFilter !== "all")   list = list.filter((i) => i.certificationStatus === certFilter);
    if (studioFilter !== "all") list = list.filter((i) => i.studio.id === studioFilter);
    if (query.trim()) {
      const q = query.toLowerCase();
      list = list.filter((i) =>
        i.name.toLowerCase().includes(q) ||
        i.studio.name.toLowerCase().includes(q) ||
        i.studio.city.toLowerCase().includes(q)
      );
    }
    return [...list].sort((a, b) => {
      if (sort === "score") return (b.performanceScore ?? -1) - (a.performanceScore ?? -1);
      if (sort === "name")  return a.name.localeCompare(b.name);
      if (sort === "studio") return a.studio.name.localeCompare(b.studio.name);
      if (sort === "eval") {
        const da = a.lastEvalDate ? new Date(a.lastEvalDate).getTime() : 0;
        const db = b.lastEvalDate ? new Date(b.lastEvalDate).getTime() : 0;
        return da - db;
      }
      return 0;
    });
  }, [instructors, roleFilter, certFilter, studioFilter, sort, query]);

  const btnStyle = (active: boolean): React.CSSProperties => active
    ? { background: NAVY, color: "#fff", boxShadow: "0 1px 4px rgba(74,99,141,0.25)", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600 }
    : { color: "#9CA3AF", borderRadius: 6, padding: "4px 12px", fontSize: 12, fontWeight: 600, cursor: "pointer" };

  return (
    <div>
      {/* Filter bar */}
      <div className="rounded-xl border mb-4 px-5 py-4" style={{ background: "#fff", borderColor: BORDER }}>
        <div className="flex flex-wrap gap-4 items-center">
          {/* Role filter */}
          <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB", border: "1px solid #E2EBF5" }}>
            {(["instructor", "studio_lead", "general_manager", "all"] as FilterRole[]).map((r) => (
              <button key={r} onClick={() => setRoleFilter(r)} style={btnStyle(roleFilter === r)}>
                {r === "all" ? "All Roles" : ROLE_LABELS[r as Role]}
              </button>
            ))}
          </div>

          {/* Cert filter */}
          <div className="flex gap-1 rounded-lg p-1" style={{ background: "#F0F5FB", border: "1px solid #E2EBF5" }}>
            {(["all", "certified", "pending", "expired"] as const).map((c) => (
              <button key={c} onClick={() => setCertFilter(c)} style={btnStyle(certFilter === c)}>
                {c === "all" ? "All Certs" : c.charAt(0).toUpperCase() + c.slice(1)}
              </button>
            ))}
          </div>

          {/* Studio filter */}
          <select
            value={studioFilter}
            onChange={(e) => setStudioFilter(e.target.value)}
            className="text-xs font-medium rounded-lg px-3 py-2 outline-none cursor-pointer"
            style={{ background: "#F0F5FB", border: "1px solid #E2EBF5", color: studioFilter === "all" ? "#9CA3AF" : NAVY }}
          >
            <option value="all">All Studios</option>
            {studios.map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>

          {/* Search */}
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg flex-1 min-w-[160px]"
            style={{ background: "#F0F5FB", border: "1px solid #E2EBF5" }}>
            <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
              <circle cx="6.5" cy="6.5" r="5" stroke="#9CA3AF" strokeWidth="1.5" />
              <path d="M10.5 10.5l3.5 3.5" stroke="#9CA3AF" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search name or studio…"
              className="text-xs outline-none bg-transparent flex-1"
              style={{ color: "#1F2937" }}
            />
          </div>

          <span className="text-xs ml-auto" style={{ color: "#9CA3AF" }}>
            {filtered.length} instructor{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>
      </div>

      {/* Table */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: BORDER }}>
        {/* Header */}
        <div className="grid grid-cols-12 gap-3 px-5 py-3 border-b" style={{ borderColor: "#EEF3FB", background: "#FAFBFD" }}>
          {[
            { key: "score" as SortKey, label: "Score",        cols: "col-span-2" },
            { key: "name" as SortKey,  label: "Name",         cols: "col-span-3" },
            { key: "studio" as SortKey,label: "Studio",        cols: "col-span-3" },
            { key: null,               label: "Cert",          cols: "col-span-2" },
            { key: "eval" as SortKey,  label: "Last Eval",     cols: "col-span-2" },
          ].map(({ key, label, cols }) => (
            <button
              key={label}
              onClick={() => key && setSort(key)}
              className={`${cols} text-left text-[10px] font-bold tracking-widest uppercase transition-colors ${key ? "cursor-pointer" : "cursor-default"}`}
              style={{ color: sort === key ? NAVY : "#9CA3AF" }}
            >
              {label}{sort === key ? " ↓" : ""}
            </button>
          ))}
        </div>

        {/* Rows */}
        {filtered.length === 0 ? (
          <div className="px-5 py-12 text-center">
            <p className="text-sm" style={{ color: "#9CA3AF" }}>No instructors match the current filters.</p>
          </div>
        ) : (
          filtered.map((inst, idx) => {
            const evalDate = inst.lastEvalDate
              ? new Date(inst.lastEvalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : null;
            const daysSinceEval = inst.lastEvalDate
              ? Math.floor((Date.now() - new Date(inst.lastEvalDate).getTime()) / 86400000)
              : null;
            const evalOverdue = daysSinceEval != null && daysSinceEval > 180;

            return (
              <div
                key={inst.id}
                className="grid grid-cols-12 gap-3 px-5 py-3.5 border-b items-center transition-colors hover:bg-[#F8FAFD]"
                style={{ borderColor: "#EEF3FB" }}
              >
                {/* Rank + Score */}
                <div className="col-span-2 flex items-center gap-2">
                  <span className="text-[10px] w-5 text-center" style={{ color: "#D1D5DB" }}>
                    {idx + 1}
                  </span>
                  {inst.performanceScore != null ? (
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-bold" style={{ color: scoreColor(inst.performanceScore) }}>
                        {inst.performanceScore}
                      </span>
                      <span
                        className="text-[9px] font-semibold px-1.5 py-0.5 rounded-full hidden sm:inline"
                        style={{ background: scoreColor(inst.performanceScore) + "1A", color: scoreColor(inst.performanceScore) }}
                      >
                        {scoreLabel(inst.performanceScore)}
                      </span>
                    </div>
                  ) : (
                    <span className="text-sm" style={{ color: "#9CA3AF" }}>—</span>
                  )}
                </div>

                {/* Name + role */}
                <div className="col-span-3">
                  <p className="text-sm font-semibold" style={{ color: "#1F2937" }}>{inst.name}</p>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>{ROLE_LABELS[inst.role]}</p>
                </div>

                {/* Studio */}
                <div className="col-span-3">
                  <Link
                    href={`/studios/${inst.studio.id}`}
                    className="text-xs font-medium transition-opacity hover:opacity-70"
                    style={{ color: NAVY }}
                  >
                    {inst.studio.name}
                  </Link>
                  <p className="text-[10px] mt-0.5" style={{ color: "#9CA3AF" }}>
                    {inst.studio.city}{inst.studio.state ? `, ${inst.studio.state}` : ""}
                  </p>
                </div>

                {/* Cert */}
                <div className="col-span-2">
                  {certBadge(inst.certificationStatus)}
                </div>

                {/* Last eval */}
                <div className="col-span-2">
                  {evalDate ? (
                    <div>
                      <p className="text-[11px]" style={{ color: evalOverdue ? "#EA580C" : "#6B7280" }}>
                        {evalDate}
                      </p>
                      {evalOverdue && (
                        <p className="text-[9px] font-semibold mt-0.5" style={{ color: "#EA580C" }}>
                          {daysSinceEval}d overdue
                        </p>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px]" style={{ color: "#EA580C" }}>Never evaluated</span>
                  )}
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 mt-4 flex-wrap">
        {[
          { label: "Elite (92+)",      color: "#16a34a" },
          { label: "Strong (85–91)",   color: "#4A638D" },
          { label: "Developing (75–84)", color: "#C9A84C" },
          { label: "Needs Attn (<75)", color: "#EA580C" },
        ].map(({ label, color }) => (
          <div key={label} className="flex items-center gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: color }} />
            <span className="text-[10px]" style={{ color: "#9CA3AF" }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
