"use client";

import { useState } from "react";
import type { StudioOperations } from "@/types";

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

function LeaseStatus({ expiresAt }: { expiresAt: string | null }) {
  const days = daysUntil(expiresAt);
  if (days === null) return <span style={{ color: "#9CA3AF" }}>—</span>;

  let color = "#16A34A";
  let label = `${days} days`;
  if (days < 90) { color = "#DC2626"; label = `${days} days — urgent`; }
  else if (days < 180) { color = "#D97706"; label = `${days} days — renew soon`; }

  return <span className="font-semibold text-sm" style={{ color }}>{label}</span>;
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

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-xl border overflow-hidden" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
      <div className="px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
        <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>{title}</p>
      </div>
      <div className="px-5">{children}</div>
    </div>
  );
}

export function OperationsPanel({ studioId, ops }: Props) {
  const [editing, setEditing] = useState(false);
  const [form, setForm] = useState<Partial<StudioOperations>>(ops ?? {});
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  async function save() {
    setSaving(true);
    await fetch(`/api/studios/${studioId}/operations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    setSaving(false);
    setSaved(true);
    setEditing(false);
    setTimeout(() => setSaved(false), 3000);
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

      {/* Edit / Save bar */}
      <div className="flex justify-end gap-2">
        {saved && <p className="text-xs self-center" style={{ color: "#16A34A" }}>Saved.</p>}
        {editing ? (
          <>
            <button onClick={() => setEditing(false)} className="text-xs px-4 py-2 rounded-lg" style={{ border: "1px solid #C8D8EE", color: "#6B7280" }}>Cancel</button>
            <button onClick={save} disabled={saving} className="text-xs px-4 py-2 rounded-lg font-semibold text-white" style={{ background: "#4A638D" }}>
              {saving ? "Saving…" : "Save Changes"}
            </button>
          </>
        ) : (
          <button onClick={() => setEditing(true)} className="text-xs px-4 py-2 rounded-lg font-medium" style={{ border: "1px solid #C8D8EE", color: "#4A638D", background: "#EEF3FB" }}>
            Edit
          </button>
        )}
      </div>

      {editing ? (
        <div className="rounded-xl border p-5 flex flex-col gap-4" style={{ background: "#fff", borderColor: "#C8D8EE" }}>
          <p className="text-xs font-bold tracking-widest uppercase" style={{ color: "#4A638D" }}>Lease</p>
          <div className="grid grid-cols-2 gap-4">
            {field("leaseExpiresAt", "Lease Expiration", "date")}
            {field("landlordName",   "Landlord / Property Mgmt")}
            {field("landlordPhone",  "Landlord Phone")}
            {field("landlordEmail",  "Landlord Email", "email")}
          </div>

          <p className="text-xs font-bold tracking-widest uppercase pt-2" style={{ color: "#4A638D", borderTop: "1px solid #EEF3FB" }}>Alarm System</p>
          <div className="grid grid-cols-2 gap-4">
            {field("alarmCompany", "Alarm Company")}
            {field("alarmCode",    "Alarm Code")}
            {field("alarmPhone",   "24/7 Support Line")}
          </div>

          <p className="text-xs font-bold tracking-widest uppercase pt-2" style={{ color: "#4A638D", borderTop: "1px solid #EEF3FB" }}>HVAC / Maintenance</p>
          <div className="grid grid-cols-2 gap-4">
            {field("hvacCompany",           "HVAC Company")}
            {field("hvacPhone",             "HVAC Phone")}
            {field("hvacContractExpiresAt", "Service Contract Expires", "date")}
          </div>

          <p className="text-xs font-bold tracking-widest uppercase pt-2" style={{ color: "#4A638D", borderTop: "1px solid #EEF3FB" }}>Electrician</p>
          <div className="grid grid-cols-2 gap-4">
            {field("electricianName",  "Electrician / Company")}
            {field("electricianPhone", "Electrician Phone")}
          </div>

          <p className="text-xs font-bold tracking-widest uppercase pt-2" style={{ color: "#4A638D", borderTop: "1px solid #EEF3FB" }}>Internet</p>
          <div className="grid grid-cols-2 gap-4">
            {field("internetProvider", "ISP")}
            {field("wifiPassword",     "Wi-Fi Password")}
          </div>

          <p className="text-xs font-bold tracking-widest uppercase pt-2" style={{ color: "#4A638D", borderTop: "1px solid #EEF3FB" }}>Notes</p>
          <textarea
            value={(form.notes as string) ?? ""}
            onChange={(e) => setForm((prev) => ({ ...prev, notes: e.target.value || null }))}
            rows={3}
            placeholder="After-hours access, special instructions, etc."
            className="text-sm rounded-lg px-3 py-2 outline-none resize-none"
            style={{ border: "1px solid #C8D8EE", color: "#1F2937", background: "#F8FAFD" }}
          />
        </div>
      ) : (
        <>
          <Card title="Lease">
            <InfoRow label="Expiration"   value={formatDate(ops?.leaseExpiresAt ?? null)} />
            <InfoRow label="Time Left"    value={leaseDays !== null ? `${leaseDays} days` : null} />
            <InfoRow label="Landlord"     value={ops?.landlordName ?? null} />
            <InfoRow label="Phone"        value={ops?.landlordPhone ?? null} />
            <InfoRow label="Email"        value={ops?.landlordEmail ?? null} />
            <div className="py-1" />
          </Card>

          <Card title="Alarm System">
            <InfoRow label="Company"      value={ops?.alarmCompany ?? null} />
            <InfoRow label="Code"         value={ops?.alarmCode ?? null} />
            <InfoRow label="Support Line" value={ops?.alarmPhone ?? null} />
            <div className="py-1" />
          </Card>

          <Card title="HVAC / Maintenance">
            <InfoRow label="Company"          value={ops?.hvacCompany ?? null} />
            <InfoRow label="Phone"            value={ops?.hvacPhone ?? null} />
            <InfoRow label="Contract Expires" value={formatDate(ops?.hvacContractExpiresAt ?? null)} />
            <div className="py-1" />
          </Card>

          <div className="grid grid-cols-2 gap-5">
            <Card title="Electrician">
              <InfoRow label="Name / Company" value={ops?.electricianName ?? null} />
              <InfoRow label="Phone"          value={ops?.electricianPhone ?? null} />
              <div className="py-1" />
            </Card>
            <Card title="Internet">
              <InfoRow label="Provider"     value={ops?.internetProvider ?? null} />
              <InfoRow label="Wi-Fi Pass"   value={ops?.wifiPassword ?? null} />
              <div className="py-1" />
            </Card>
          </div>

          {ops?.notes && (
            <div className="rounded-xl border px-5 py-4" style={{ background: "#FFFBEB", borderColor: "#FDE68A" }}>
              <p className="text-xs font-bold tracking-widest uppercase mb-2" style={{ color: "#92400E" }}>Notes</p>
              <p className="text-sm" style={{ color: "#78350F" }}>{ops.notes}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
