"use client";

import { useState } from "react";
import Image from "next/image";
import type { Studio, Instructor, StaffRole } from "@/types";
import { assignStaffPhotos } from "@/lib/staffPhotos";

interface Props {
  studio: Studio & { email: string | null };
  instructors: Instructor[];
}

const STATUSES = ["healthy", "at-risk", "new", "pre-launch"] as const;

const ROLE_LABELS: Record<StaffRole, string> = {
  director_of_operations: "Director of Operations",
  general_manager:        "General Manager",
  studio_lead:            "Studio Lead",
  instructor:             "Instructor",
};

function EditButton({ onClick }: { onClick: () => void }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 12,
        padding: "5px 12px",
        borderRadius: 8,
        fontWeight: 500,
        border: `1px solid ${hovered ? "#4A638D" : "#C8D8EE"}`,
        color: hovered ? "#fff" : "#4A638D",
        background: hovered ? "#4A638D" : "#EEF3FB",
        transform: hovered ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.15s ease",
        cursor: "pointer",
        boxShadow: hovered ? "0 2px 8px rgba(74,99,141,0.18)" : "none",
      }}
    >
      Edit
    </button>
  );
}

function SaveChangesButton({ onClick, disabled, saving }: { onClick: () => void; disabled: boolean; saving: boolean }) {
  const [hovered, setHovered] = useState(false);
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        fontSize: 12,
        padding: "5px 14px",
        borderRadius: 8,
        fontWeight: 500,
        border: `1px solid ${hovered && !disabled ? "#4A638D" : "#C8D8EE"}`,
        color: hovered && !disabled ? "#fff" : "#4A638D",
        background: hovered && !disabled ? "#4A638D" : "#EEF3FB",
        transform: hovered && !disabled ? "translateY(-2px)" : "translateY(0)",
        transition: "all 0.15s ease",
        cursor: disabled ? "not-allowed" : "pointer",
        boxShadow: hovered && !disabled ? "0 2px 8px rgba(74,99,141,0.18)" : "none",
        opacity: disabled ? 0.6 : 1,
      }}
    >
      {saving ? "Saving…" : "Save Changes"}
    </button>
  );
}

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
        className="text-sm rounded-lg px-3 py-2.5 outline-none border border-[#C8D8EE] hover:border-[#4A638D] focus:border-[#4A638D] transition-colors"
        style={{ color: "#1F2937", background: "#F8FAFD" }}
      />
      {hint && <p className="text-[11px]" style={{ color: "#9CA3AF" }}>{hint}</p>}
    </div>
  );
}

type DraftMember = Omit<Instructor, "studioId" | "certificationStatus" | "performanceScore"> & {
  _new?: boolean;
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

  const [staffList, setStaffList]   = useState<Instructor[]>(instructors);
  const [editMode, setEditMode]     = useState(false);
  const [draft, setDraft]           = useState<DraftMember[]>([]);
  const [removed, setRemoved]       = useState<Set<string>>(new Set());

  const [infoSaving, setInfoSaving] = useState(false);
  const [infoSaved,  setInfoSaved]  = useState(false);
  const [staffSaving, setStaffSaving] = useState(false);
  const [staffSaved,  setStaffSaved]  = useState(false);

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

  function openEdit() {
    setDraft(staffList.map((s) => ({
      id:           s.id,
      name:         s.name,
      role:         s.role,
      email:        s.email,
      phone:        s.phone,
      lastEvalDate: s.lastEvalDate,
    })));
    setRemoved(new Set());
    setEditMode(true);
  }

  function cancelEdit() {
    setEditMode(false);
    setDraft([]);
    setRemoved(new Set());
  }

  function updateDraft(id: string, key: keyof DraftMember, value: string) {
    setDraft((prev) => prev.map((m) => m.id === id ? { ...m, [key]: value } : m));
  }

  function removeDraft(id: string, isNew: boolean) {
    if (isNew) {
      setDraft((prev) => prev.filter((m) => m.id !== id));
    } else {
      setRemoved((prev) => new Set([...prev, id]));
      setDraft((prev) => prev.filter((m) => m.id !== id));
    }
  }

  function addMember() {
    const tempId = `new-${Date.now()}`;
    setDraft((prev) => [...prev, { id: tempId, name: "", role: "instructor", email: null, phone: null, lastEvalDate: null, _new: true }]);
  }

  async function saveStaff() {
    setStaffSaving(true);

    const ops: Promise<unknown>[] = [];

    // Deletes
    removed.forEach((id) => {
      ops.push(fetch(`/api/studios/${studio.id}/instructors/${id}`, { method: "DELETE" }));
    });

    // Updates & creates
    for (const m of draft) {
      if (!m.name.trim()) continue;
      if (m._new) {
        ops.push(
          fetch(`/api/studios/${studio.id}/instructors`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name: m.name, role: m.role, email: m.email, phone: m.phone, lastEvalDate: m.lastEvalDate }),
          }).then((r) => r.json())
        );
      } else {
        const original = staffList.find((s) => s.id === m.id);
        if (!original) continue;
        const changed =
          m.name !== original.name ||
          m.role !== original.role ||
          m.email !== original.email ||
          m.phone !== original.phone ||
          m.lastEvalDate !== original.lastEvalDate;
        if (changed) {
          ops.push(
            fetch(`/api/studios/${studio.id}/instructors/${m.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ name: m.name, role: m.role, email: m.email, phone: m.phone, lastEvalDate: m.lastEvalDate }),
            })
          );
        }
      }
    }

    await Promise.all(ops);

    // Refetch fresh list
    const res  = await fetch(`/api/studios/${studio.id}`);
    const data = await res.json() as { instructors: Instructor[] };
    setStaffList(data.instructors ?? []);

    setStaffSaving(false);
    setStaffSaved(true);
    setEditMode(false);
    setTimeout(() => setStaffSaved(false), 3000);
  }

  return (
    <div className="flex flex-col gap-6">
      {/* Studio Info */}
      <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Studio Information</p>
          <div className="flex items-center gap-3">
            {infoSaved && <p className="text-xs" style={{ color: "#16A34A" }}>Saved.</p>}
            <SaveChangesButton onClick={saveInfo} disabled={infoSaving} saving={infoSaving} />
          </div>
        </div>

        <div className="p-5 grid grid-cols-2 gap-4">
          <Field label="Studio Name"     value={info.name}           onChange={(v) => setInfo((p) => ({ ...p, name: v }))} />
          <Field label="Franchisee Name" value={info.franchiseeName}  onChange={(v) => setInfo((p) => ({ ...p, franchiseeName: v }))} />
          <Field label="Address"         value={info.address}         onChange={(v) => setInfo((p) => ({ ...p, address: v }))} />
          <Field label="Phone"           value={info.phone}           onChange={(v) => setInfo((p) => ({ ...p, phone: v }))} type="tel" />
          <Field label="Email"           value={info.email}           onChange={(v) => setInfo((p) => ({ ...p, email: v }))} type="email" />
          <div className="flex flex-col gap-1.5">
            <label className="text-xs font-semibold" style={{ color: "#6B7280" }}>Status</label>
            <select
              value={info.status}
              onChange={(e) => setInfo((p) => ({ ...p, status: e.target.value as typeof STATUSES[number] }))}
              className="text-sm rounded-lg px-3 py-2.5 outline-none cursor-pointer border border-[#C8D8EE] hover:border-[#4A638D] focus:border-[#4A638D] transition-colors"
              style={{ color: "#1F2937", background: "#F8FAFD" }}
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
        <div className="flex items-center justify-between px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Staff Roster</p>
          <div className="flex items-center gap-3">
            {staffSaved && !editMode && <p className="text-xs" style={{ color: "#16A34A" }}>Saved.</p>}
            {editMode ? (
              <>
                <button
                  onClick={cancelEdit}
                  className="text-xs px-3 py-1.5 rounded-lg font-medium"
                  style={{ border: "1px solid #C8D8EE", color: "#6B7280", background: "#fff" }}
                >
                  Cancel
                </button>
                <button
                  onClick={saveStaff}
                  disabled={staffSaving}
                  className="text-xs px-4 py-1.5 rounded-lg font-semibold text-white"
                  style={{ background: "#4A638D" }}
                >
                  {staffSaving ? "Saving…" : "Save"}
                </button>
              </>
            ) : (
              <EditButton onClick={openEdit} />
            )}
          </div>
        </div>

        {editMode ? (
          /* ── Edit mode ── */
          <div className="p-4 flex flex-col gap-1">
            {draft.map((m) => {
              const isInstructor = m.role === "instructor";
              return (
                <div key={m.id} className="py-3 border-b" style={{ borderColor: "#EEF3FB" }}>
                  {/* Row 1: Name · Role · Remove */}
                  <div className="grid gap-2 items-center mb-2" style={{ gridTemplateColumns: "1fr 170px 28px" }}>
                    <input
                      type="text"
                      value={m.name}
                      placeholder="Full name"
                      onChange={(e) => updateDraft(m.id, "name", e.target.value)}
                      className="text-sm rounded-lg px-3 py-1.5 outline-none"
                      style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
                    />
                    <select
                      value={m.role}
                      onChange={(e) => updateDraft(m.id, "role", e.target.value)}
                      className="text-xs rounded-lg px-2 py-1.5 outline-none cursor-pointer"
                      style={{ border: "1px solid #C8D8EE", color: "#4A638D", background: "#EEF3FB" }}
                    >
                      {(Object.entries(ROLE_LABELS) as [StaffRole, string][]).map(([val, lbl]) => (
                        <option key={val} value={val}>{lbl}</option>
                      ))}
                    </select>
                    <button
                      onClick={() => removeDraft(m.id, !!m._new)}
                      className="flex items-center justify-center rounded-full text-xs font-bold leading-none"
                      style={{ width: 22, height: 22, background: "#FEF2F2", color: "#DC2626" }}
                      title="Remove"
                    >
                      ×
                    </button>
                  </div>
                  {/* Row 2: Email · Phone · Last Eval */}
                  <div className="grid gap-2 items-center" style={{ gridTemplateColumns: "1fr 1fr 140px" }}>
                    <input
                      type="email"
                      value={m.email ?? ""}
                      placeholder="Email"
                      onChange={(e) => updateDraft(m.id, "email", e.target.value || null as unknown as string)}
                      className="text-xs rounded-lg px-3 py-1.5 outline-none"
                      style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
                    />
                    <input
                      type="tel"
                      value={m.phone ?? ""}
                      placeholder="Phone"
                      onChange={(e) => updateDraft(m.id, "phone", e.target.value || null as unknown as string)}
                      className="text-xs rounded-lg px-3 py-1.5 outline-none"
                      style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
                    />
                    {isInstructor ? (
                      <input
                        type="date"
                        value={m.lastEvalDate ? m.lastEvalDate.slice(0, 10) : ""}
                        onChange={(e) => updateDraft(m.id, "lastEvalDate", e.target.value || null as unknown as string)}
                        className="text-xs rounded-lg px-2 py-1.5 outline-none"
                        style={{ border: "1px solid #C8D8EE", color: "#6B7280", background: "#F8FAFD" }}
                      />
                    ) : (
                      <span />
                    )}
                  </div>
                </div>
              );
            })}

            <button
              onClick={addMember}
              className="mt-3 text-xs font-medium self-start px-3 py-1.5 rounded-lg"
              style={{ border: "1px dashed #C8D8EE", color: "#4A638D", background: "#F8FAFD" }}
            >
              + Add member
            </button>
          </div>
        ) : (
          /* ── Read-only view ── */
          (() => {
            const photoMap = assignStaffPhotos(staffList.map((s) => s.name));
            return (
              <table className="w-full text-sm">
                <thead>
                  <tr style={{ background: "#F8FAFD" }}>
                    {["Name", "Role", "Email", "Phone", "Last Eval"].map((h) => (
                      <th key={h} className="px-5 py-3 text-left text-xs font-semibold" style={{ color: "#9CA3AF" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {staffList.map((s, i) => {
                    const isInstructor = s.role === "instructor";
                    const evalDate = s.lastEvalDate
                      ? new Date(s.lastEvalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                      : "—";
                    const photo = photoMap.get(s.name);
                    return (
                      <tr key={s.id} className="hover:bg-[#EEF3FB] transition-colors" style={{ borderTop: i > 0 ? "1px solid #F0F5FB" : undefined }}>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2.5">
                            <div className="w-8 h-8 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: "#C8D8EE" }}>
                              {photo ? (
                                <Image src={photo} alt={s.name} width={32} height={32} className="w-full h-full object-cover object-top" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ background: "linear-gradient(135deg, #4A638D 0%, #6B8AB4 100%)", color: "#fff" }}>
                                  {s.name.charAt(0).toUpperCase()}
                                </div>
                              )}
                            </div>
                            <span style={{ color: "#1F2937" }}>{s.name}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>{ROLE_LABELS[s.role]}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: s.email ? "#6B7280" : "#D1D5DB" }}>{s.email ?? "—"}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: s.phone ? "#6B7280" : "#D1D5DB" }}>{s.phone ?? "—"}</td>
                        <td className="px-5 py-3 text-xs" style={{ color: "#6B7280" }}>
                          {isInstructor ? evalDate : ""}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            );
          })()
        )}
      </div>
    </div>
  );
}
