"use client";

import Link from "next/link";
import Image from "next/image";

interface InstructorEntry {
  id: string;
  name: string;
  avg: number;
  count: number;
}

interface Props {
  studioId: string;
  instructors: InstructorEntry[];
  photoMap?: Map<string, string>;
}

export function InstructorSidebar({ studioId, instructors, photoMap }: Props) {
  if (!instructors.length) return null;

  return (
    <div className="w-52 flex-shrink-0">
      <div
        className="sticky top-24 rounded-2xl overflow-hidden"
        style={{ border: "1px solid #C8D8EE", background: "#fff", boxShadow: "0 1px 4px rgba(74,99,141,0.07)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
            Instructors
          </p>
        </div>
        <div className="px-3 py-3 flex flex-col gap-0.5">
          {instructors.map((inst) => {
            const full = Math.floor(inst.avg);
            const initials = inst.name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
            const photo = photoMap?.get(inst.name);
            return (
              <Link
                key={inst.id}
                href={`/studios/${studioId}/reviews/instructors/${inst.id}`}
                className="flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors group"
                style={{ color: "#6B7280" }}
                onMouseEnter={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "#EEF3FB"; }}
                onMouseLeave={(e) => { (e.currentTarget as HTMLAnchorElement).style.background = "transparent"; }}
              >
                <div className="w-7 h-7 rounded-full overflow-hidden flex-shrink-0 border" style={{ borderColor: "#C8D8EE" }}>
                  {photo ? (
                    <Image src={photo} alt={inst.name} width={28} height={28} className="w-full h-full object-cover object-top" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-[10px] font-bold text-white" style={{ background: "#4A638D" }}>
                      {initials}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold truncate" style={{ color: "#1F2937" }}>
                    {inst.name.split(" ")[0]}
                  </p>
                  <div className="flex items-center gap-1 mt-0.5">
                    <span style={{ color: "#C9A84C", fontSize: "10px" }}>
                      {"★".repeat(full)}{"☆".repeat(5 - full)}
                    </span>
                    <span className="text-[10px] font-semibold" style={{ color: "#374151" }}>
                      {inst.avg.toFixed(1)}
                    </span>
                  </div>
                  <p className="text-[10px]" style={{ color: "#9CA3AF" }}>
                    {inst.count} mention{inst.count !== 1 ? "s" : ""}
                  </p>
                </div>
                <svg
                  width="10" height="10" viewBox="0 0 10 10" fill="none"
                  className="flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ color: "#4A638D" }}
                >
                  <path d="M2 5h6M5 2l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
