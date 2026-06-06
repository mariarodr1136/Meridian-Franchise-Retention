"use client";

import { useState } from "react";
import type { Studio, Instructor } from "@/types";

interface Props {
  studio: Studio & { email: string | null };
  instructors: Instructor[];
}

const STATUSES = ["healthy", "at-risk", "new", "pre-launch"] as const;

function Field({
  label, value, onChange, type = "text", hint,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  hint?: string;
}) {
  return (
    <div className="flex flex-col gap-1.5">
      <label className="text-xs font-semibold" style={{ color: "#6B7280" }}>{label}</label>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="text-sm rounded-lg px-3 py-2.5 outline-none"
        style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
      />
      {hint && <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{hint}</p>}
    </div>
  );
}

const CERT_LABELS: Record<string, string> = { certified: "Certified", pending: "Pending", expired: "Expired" };
const ROLE_LABELS: Record<string, string> = {
  director_of_operations: "Director of Operations",
  general_manager: "General Manager",
  studio_lead: "Studio Lead",
  instructor: "Instructor",
};

export function StudioSettingsForm({ studio, instructors }: Props) {
  const [info, setInfo] = useState({
    name:           studio.name,
    address:        studio.address ?? "",
    phone:          studio.phone ?? "",
    email:          studio.email ?? "",
    franchiseeName: studio.franchiseeName,
    status:         studio.status,
  });

  const [staffList, setStaffList] = useState<Instructor[]>(instructors);
  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSaved, setInfoSaved]   = useState(false);

  async function saveInfo() {
    setInfoSaving(true);
    await fetch(`/api/studios/${studio.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(info),
    });
    setInfoSaving(false);
    setInfoSaved(true);
    setTimeout(() => setInfoSaved(false), 3000);
  }

  function updateStaff(id: string, key: keyof Instructor, value: string) {
    setStaffList((prev) =>
      prev.map((s) => (s.id === id ? { ...s, [key]: value } : s))
    );
  }

  const CERT_COLORS: Record<string, { bg: string; color: string }> = {
    certified: { bg: "#F0FDF4", color: "#166534" },
    pending:   { bg: "#FFF7ED", color: "#9A3412" },
    expired:   { bg: "#FEF2F2", color: "#991B1B" },
  };

  return (
    <div className="flex flex-col gap-6">
      {/* Studio Info */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Studio Information</p>
          <div className="flex items-center gap-3">
            {infoSaved && <p className="text-xs" style={{ color: "#16A34A" }}>Saved.</p>}
            <button
              onClick={saveInfo}
              disabled={infoSaving}
              className="text-xs px-4 py-2 rounded-lg font-semibold text-white"
              style={{ background: "#4A638D" }}
            >
              {infoSaving ? "Saving…" : "Save Changes"}
            </button>
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <Field label="Studio Name" value={info.name} onChange={(v) => setInfo((p) => ({ ...p, name: v }))} />
          <Field label="Franchisee Name" value={info.franchiseeName} onChange={(v) => setInfo((p) => ({ ...p, franchiseeName: v }))} />
          <Field label="Address" value={info.address} onChange={(v) => setInfo((p) => ({ ...p, address: v }))} />
          <Field label="Phone" value={info.phone} onChange={(v) => setInfo((p) => ({ ...p, phone: v }))} type="tel" />
          <Field label="Email" value={info.email} onChange={(v) => setInfo((p) => ({ ...p, email: v }))} type="email" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "#6B7280" }}>Status</label>
            <select
              value={info.status}
              onChange={(e) => setInfo((p) => ({ ...p, status: e.target.value as typeof STATUSES[number] }))}
              className="text-sm rounded-lg px-3 py-2.5 outline-none cursor-pointer"
              style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
            >
              {STATUSES.map((s) => (
                <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1).replace("-", " ")}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Staff Roster */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Staff Roster</p>
          <p className="text-xs mt-1" style={{ color: "#9CA3AF" }}>Edit certification status and roles for each team member.</p>
        </div>

        <table className="w-full text-sm">
          <thead>
            <tr style={{ background: "#F8FAFD" }}>
              {["Name", "Role", "Certification", "Last Eval", "Performance"].map((h) => (
                <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {staffList.map((staff, i) => {
              const certStyle = CERT_COLORS[staff.certificationStatus] ?? CERT_COLORS.certified;
              return (
                <tr key={staff.id} style={{ borderTop: i > 0 ? "1px solid #F0F5FB" : undefined }}>
                  <td className="px-5 py-3 font-medium" style={{ color: "#1F2937" }}>{staff.name}</td>
                  <td className="px-5 py-3">
                    <select
                      value={staff.role}
                      onChange={(e) => updateStaff(staff.id, "role", e.target.value)}
                      className="text-xs rounded px-2 py-1 outline-none cursor-pointer"
                      style={{ border: "1px solid #C8D8EE", color: "#4A638D", background: "#EEF3FB" }}
                    >
                      {Object.entries(ROLE_LABELS).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <select
                      value={staff.certificationStatus}
                      onChange={(e) => updateStaff(staff.id, "certificationStatus", e.target.value)}
                      className="text-xs rounded px-2 py-1 outline-none cursor-pointer font-medium"
                      style={{ border: "none", background: certStyle.bg, color: certStyle.color }}
                    >
                      {Object.entries(CERT_LABELS).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>
                    {staff.lastEvalDate
                      ? new Date(staff.lastEvalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—"}
                  </td>
                  <td className="px-5 py-3">
                    {staff.performanceScore != null ? (
                      <div className="flex items-center gap-2">
                        <div className="h-1.5 w-20 rounded-full overflow-hidden" style={{ background: "#EEF3FB" }}>
                          <div className="h-full rounded-full" style={{ width: `${staff.performanceScore}%`, background: staff.performanceScore >= 85 ? "#16A34A" : staff.performanceScore >= 70 ? "#D97706" : "#DC2626" }} />
                        </div>
                        <span className="text-xs tabular-nums" style={{ color: "#6B7280" }}>{staff.performanceScore.toFixed(0)}</span>
                      </div>
                    ) : <span style={{ color: "#D1D5DB" }}>—</span>}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        <div className="px-5 py-4" style={{ borderTop: "1px solid #EEF3FB" }}>
          <p className="text-xs" style={{ color: "#9CA3AF" }}>
            Staff role and certification changes are reflected immediately in the roster view.
          </p>
        </div>
      </div>
    </div>
  );
}
