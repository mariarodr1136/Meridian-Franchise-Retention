import Image from "next/image";
import type { Instructor } from "@/types";
import { assignStaffPhotos } from "@/lib/staffPhotos";

const SECTIONS: { role: string; label: string }[] = [
  { role: "director_of_operations", label: "Director of Operations" },
  { role: "general_manager",        label: "General Manager" },
  { role: "studio_lead",            label: "Studio Leads" },
  { role: "instructor",             label: "Instructors" },
];

interface Props { staff: Instructor[] }

export function StaffRoster({ staff }: Props) {
  if (staff.length === 0) {
    return <p className="text-xs py-6 text-center" style={{ color: "#6B7280" }}>No staff assigned yet.</p>;
  }

  const photoMap = assignStaffPhotos(staff.map((s) => s.name));

  const activeSections = SECTIONS
    .map(({ role, label }) => ({ label, role, members: staff.filter((s) => s.role === role) }))
    .filter((s) => s.members.length > 0);

  return (
    <div className="flex flex-col">
      {activeSections.map(({ label, role, members }, i) => {
        const isInstructor = role === "instructor";
        return (
          <div key={label} className={i > 0 ? "pt-2 mt-2" : "pt-0"}>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-bold tracking-widest uppercase px-2.5 py-1 rounded-full" style={{ background: "#4A638D", color: "#FFFFFF" }}>
                {label}
              </span>
              {isInstructor && (
                <span className="text-xs font-medium" style={{ color: "#9CA3AF" }}>Last Eval</span>
              )}
            </div>

            {isInstructor ? (
              <div>
                {members.map((m) => {
                  const evalDate = m.lastEvalDate
                    ? new Date(m.lastEvalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
                    : "—";
                  const photo = photoMap.get(m.name);
                  return (
                    <div key={m.id} className="flex items-center justify-between py-2 border-b" style={{ borderColor: "#EEF3FB" }}>
                      <div className="flex items-center gap-2.5">
                        <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: "#C8D8EE" }}>
                          {photo ? (
                            <Image src={photo} alt={m.name} width={28} height={28} className="w-full h-full object-cover object-top" />
                          ) : (
                            <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ background: "linear-gradient(135deg, #4A638D 0%, #6B8AB4 100%)", color: "#fff" }}>
                              {m.name.charAt(0).toUpperCase()}
                            </div>
                          )}
                        </div>
                        <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{m.name}</span>
                      </div>
                      <span className="text-xs" style={{ color: "#6B7280" }}>{evalDate}</span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div>
                {members.map((m) => {
                  const photo = photoMap.get(m.name);
                  return (
                    <div key={m.id} className="flex items-center gap-2.5 py-2 border-b" style={{ borderColor: "#EEF3FB" }}>
                      <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: "#C8D8EE" }}>
                        {photo ? (
                          <Image src={photo} alt={m.name} width={28} height={28} className="w-full h-full object-cover object-top" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[10px] font-bold" style={{ background: "linear-gradient(135deg, #4A638D 0%, #6B8AB4 100%)", color: "#fff" }}>
                            {m.name.charAt(0).toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="text-sm font-medium" style={{ color: "#1F2937" }}>{m.name}</span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
