import type { Instructor } from "@/types";
import { cn } from "@/lib/utils";

const certConfig = {
  certified: { label: "Certified", className: "text-green-400 bg-green-500/10" },
  pending:   { label: "Pending",   className: "text-blue-400  bg-blue-500/10"  },
};

interface Props {
  instructors: Instructor[];
}

export function InstructorTable({ instructors }: Props) {
  if (instructors.length === 0) {
    return <p className="text-xs py-6 text-center" style={{ color: "#737373" }}>No instructors assigned yet.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b" style={{ borderColor: "#262626" }}>
            {["Instructor", "Status", "Last Eval", "Score"].map((h) => (
              <th key={h} className="text-left pb-3 pr-6 text-xs font-medium" style={{ color: "#737373" }}>{h}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {instructors.map((inst) => {
            const cert = certConfig[inst.certificationStatus as keyof typeof certConfig];
            const evalDate = inst.lastEvalDate
              ? new Date(inst.lastEvalDate).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })
              : "—";
            return (
              <tr key={inst.id} className="border-b" style={{ borderColor: "#1c1c1c" }}>
                <td className="py-3 pr-6 font-medium">{inst.name}</td>
                <td className="py-3 pr-6">
                  <span className={cn("px-2 py-0.5 rounded-full text-xs font-medium", cert.className)}>
                    {cert.label}
                  </span>
                </td>
                <td className="py-3 pr-6 text-xs" style={{ color: "#737373" }}>{evalDate}</td>
                <td className="py-3 text-xs">
                  {inst.performanceScore != null ? (
                    <span className={cn(
                      "font-semibold",
                      inst.performanceScore >= 90 ? "text-green-400" :
                      inst.performanceScore >= 80 ? "text-yellow-400" : "text-orange-400"
                    )}>{inst.performanceScore}</span>
                  ) : "—"}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
