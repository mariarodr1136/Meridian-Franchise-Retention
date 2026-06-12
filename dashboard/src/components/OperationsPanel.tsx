"use client";

import { useState } from "react";
import type { StudioOperations } from "@/types";

type Section = "lease" | "alarm" | "hvac" | "electrician" | "internet" | "notes";

interface Props {
  studioId: string;
  ops: StudioOperations | null;
}

function daysUntil(iso: string | null): number | null {
  if (!iso) return null;
  return Math.ceil((new Date(iso).getTime() - Date.now()) / 86400000);
}

function formatDate(iso: string | null): string {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <div className="flex justify-between items-start py-3" style={{ borderBottom: "1px solid #F0F5FB" }}>
      <p className="text-xs font-medium w-36 flex-shrink-0" style={{ color: "#9CA3AF" }}>{label}</p>
      <p className="text-sm text-right flex-1" style={{ color: value ? "#1F2937" : "#D1D5DB" }}>
        {value ?? "Not set"}
      </p>
    </div>
  );
}

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

function SectionCard({
  title,
  section,
  editingSection,
  onEdit,
  onSave,
  onCancel,
  saving,
  children,
}: {
  title: string;
  section: Section;
  editingSection: Section | null;
  onEdit: () => void;
  onSave: () => void;
  onCancel: () => void;
  saving: boolean;
  children: React.ReactNode;
}) {
  const isEditing = editingSection === section;
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <div className="px-5 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #EEF3FB" }}>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>{title}</p>
        {isEditing ? (
          <div className="flex items-center gap-2">
            <button
              onClick={onCancel}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, border: "1px solid #C8D8EE", color: "#6B7280", background: "#fff", cursor: "pointer" }}
            >
              Cancel
            </button>
            <button
              onClick={onSave}
              disabled={saving}
              style={{ fontSize: 12, padding: "5px 12px", borderRadius: 8, fontWeight: 600, color: "#fff", background: "#4A638D", border: "none", cursor: "pointer" }}
            >
              {saving ? "Saving…" : "Save"}
            </button>
          </div>
        ) : (
          <EditButton onClick={onEdit} />
        )}
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export function OperationsPanel({ studioId, ops }: Props) {
  const [editingSection, setEditingSection] = useState<Section | null>(null);
  const [form, setForm] = useState<Partial<StudioOperations>>(ops ?? {});
  const [saving, setSaving] = useState(false);
  const [savedSection, setSavedSection] = useState<Section | null>(null);

  async function save(section: Section) {
    setSaving(true);
    await fetch(`/api/studios/${studioId}/operations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSavedSection(section);
    setEditingSection(null);
    setTimeout(() => setSavedSection(null), 3000);
  }

  function field(key: keyof StudioOperations, label: string, type = "text", placeholder = "") {
    return (
      <div className="flex flex-col gap-1">
        <label className="text-xs font-medium" style={{ color: "#9CA3AF" }}>{label}</label>
        <input
          type={type}
          value={type === "date" && form[key]
            ? new Date(form[key] as string).toISOString().split("T")[0]
            : (form[key] as string) ?? ""}
          onChange={(e) => setForm((prev) => ({ ...prev, [key]: e.target.value || null }))}
          placeholder={placeholder}
          className="text-sm rounded-lg px-3 py-2 outline-none"
          style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
        />
      </div>
    );
  }

  const leaseDays = daysUntil(ops?.leaseExpiresAt ?? null);

  const sectionProps = (section: Section) => ({
    section,
    editingSection,
    onEdit: () => setEditingSection(section),
    onSave: () => save(section),
    onCancel: () => setEditingSection(null),
    saving,
  });

  return (
    <div className="flex flex-col gap-5">
      {/* Lease urgency banner */}
      {leaseDays !== null && leaseDays < 180 && (
        <div
          className="rounded-xl border px-5 py-4 flex items-start gap-3"
          style={{
            background: leaseDays < 90 ? "#FEF2F2" : "#FFFBEB",
            borderColor: leaseDays < 90 ? "#FECACA" : "#FDE68A",
          }}
        >
          <span className="text-lg mt-0.5">{leaseDays < 90 ? "⚠" : "○"}</span>
          <div>
            <p className="text-sm font-semibold" style={{ color: leaseDays < 90 ? "#991B1B" : "#92400E" }}>
              Lease expires {formatDate(ops?.leaseExpiresAt ?? null)}
            </p>
            <p className="text-xs mt-0.5" style={{ color: leaseDays < 90 ? "#B91C1C" : "#B45309" }}>
              {leaseDays < 90 ? "Renewal required urgently — escalate to legal." : "Begin renewal discussions with landlord soon."}
            </p>
          </div>
        </div>
      )}

      {/* Lease */}
      <SectionCard title="Lease" {...sectionProps("lease")}>
        {editingSection === "lease" ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {field("leaseExpiresAt", "Lease Expiration", "date")}
            {field("landlordName",   "Landlord / Property Mgmt")}
            {field("landlordPhone",  "Landlord Phone")}
            {field("landlordEmail",  "Landlord Email", "email")}
          </div>
        ) : (
          <>
            <InfoRow label="Expiration" value={formatDate(ops?.leaseExpiresAt ?? null)} />
            <InfoRow label="Time Left"  value={leaseDays !== null ? `${leaseDays} days` : null} />
            <InfoRow label="Landlord"   value={ops?.landlordName ?? null} />
            <InfoRow label="Phone"      value={ops?.landlordPhone ?? null} />
            <InfoRow label="Email"      value={ops?.landlordEmail ?? null} />
            <div className="py-1" />
          </>
        )}
      </SectionCard>

      {/* Alarm System */}
      <SectionCard title="Alarm System" {...sectionProps("alarm")}>
        {editingSection === "alarm" ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {field("alarmCompany", "Alarm Company")}
            {field("alarmCode",    "Alarm Code")}
            {field("alarmPhone",   "24/7 Support Line")}
          </div>
        ) : (
          <>
            <InfoRow label="Company"      value={ops?.alarmCompany ?? null} />
            <InfoRow label="Code"         value={ops?.alarmCode ?? null} />
            <InfoRow label="Support Line" value={ops?.alarmPhone ?? null} />
            <div className="py-1" />
          </>
        )}
      </SectionCard>

      {/* HVAC */}
      <SectionCard title="HVAC / Maintenance" {...sectionProps("hvac")}>
        {editingSection === "hvac" ? (
          <div className="grid grid-cols-2 gap-4 py-4">
            {field("hvacCompany",           "HVAC Company")}
            {field("hvacPhone",             "HVAC Phone")}
            {field("hvacContractExpiresAt", "Service Contract Expires", "date")}
          </div>
        ) : (
          <>
            <InfoRow label="Company"          value={ops?.hvacCompany ?? null} />
            <InfoRow label="Phone"            value={ops?.hvacPhone ?? null} />
            <InfoRow label="Contract Expires" value={formatDate(ops?.hvacContractExpiresAt ?? null)} />
            <div className="py-1" />
          </>
        )}
      </SectionCard>

      {/* Electrician + Internet */}
      <div className="grid grid-cols-2 gap-5">
        <SectionCard title="Electrician" {...sectionProps("electrician")}>
          {editingSection === "electrician" ? (
            <div className="flex flex-col gap-4 py-4">
              {field("electricianName",  "Electrician / Company")}
              {field("electricianPhone", "Electrician Phone")}
            </div>
          ) : (
            <>
              <InfoRow label="Name / Company" value={ops?.electricianName ?? null} />
              <InfoRow label="Phone"          value={ops?.electricianPhone ?? null} />
              <div className="py-1" />
            </>
          )}
        </SectionCard>

        <SectionCard title="Internet" {...sectionProps("internet")}>
          {editingSection === "internet" ? (
            <div className="flex flex-col gap-4 py-4">
              {field("internetProvider", "ISP")}
              {field("wifiPassword",     "Wi-Fi Password")}
            </div>
          ) : (
            <>
              <InfoRow label="Provider"   value={ops?.internetProvider ?? null} />
              <InfoRow label="Wi-Fi Pass" value={ops?.wifiPassword ?? null} />
              <div className="py-1" />
            </>
          )}
        </SectionCard>
      </div>

      {/* Notes */}
      <SectionCard title="Notes" {...sectionProps("notes")}>
        {editingSection === "notes" ? (
          <div className="py-4">
            <textarea
              value={(form.notes as string) ?? ""}
              onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value || null }))}
              rows={3}
              placeholder="After-hours access, special instructions, etc."
              className="text-sm rounded-lg px-3 py-2 outline-none resize-none w-full"
              style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
            />
          </div>
        ) : (
          <div className="py-3">
            {ops?.notes
              ? <p className="text-sm" style={{ color: "#78350F" }}>{ops.notes}</p>
              : <p className="text-sm" style={{ color: "#D1D5DB" }}>Not set</p>
            }
          </div>
        )}
      </SectionCard>

      {savedSection && (
        <p className="text-xs text-right" style={{ color: "#16A34A" }}>Saved.</p>
      )}
    </div>
  );
}
