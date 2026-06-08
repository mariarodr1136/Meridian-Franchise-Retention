"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const ALL_PAGES = [
  { id: "overview",   label: "Overview"   },
  { id: "classes",    label: "Classes"    },
  { id: "sales",      label: "Sales"      },
  { id: "operations", label: "Operations" },
  { id: "inventory",  label: "Inventory"  },
  { id: "reviews",    label: "Reviews"    },
  { id: "settings",   label: "Settings"   },
] as const;

const PRE_LAUNCH_PAGE_IDS = new Set(["overview", "sales", "operations", "settings"]);

interface Props {
  studioId: string;
  studioStatus?: string;
}

export function StudioSidebar({ studioId, studioStatus }: Props) {
  const pathname = usePathname();
  const isPreLaunch = studioStatus === "pre-launch";
  const PAGES = ALL_PAGES.filter((p) => !isPreLaunch || PRE_LAUNCH_PAGE_IDS.has(p.id));

  function activePage(): string {
    if (pathname.endsWith("/classes"))    return "classes";
    if (pathname.endsWith("/sales"))      return "sales";
    if (pathname.endsWith("/operations")) return "operations";
    if (pathname.endsWith("/inventory"))  return "inventory";
    if (pathname.endsWith("/reviews"))    return "reviews";
    if (pathname.endsWith("/settings"))   return "settings";
    return "overview";
  }

  const current = activePage();

  function href(pageId: string): string {
    return pageId === "overview"
      ? `/studios/${studioId}`
      : `/studios/${studioId}/${pageId}`;
  }

  return (
    <div className="w-52 flex-shrink-0">
      <div
        className="sticky top-24 rounded-2xl overflow-hidden"
        style={{ border: "1px solid #C8D8EE", background: "#fff", boxShadow: "0 1px 4px rgba(74,99,141,0.07)" }}
      >
        <div className="px-5 py-4" style={{ borderBottom: "1px solid #EEF3FB" }}>
          <p className="text-[10px] font-bold tracking-widest uppercase" style={{ color: "#9CA3AF" }}>
            Studio
          </p>
        </div>

        <div className="px-3 py-3 flex flex-col gap-0.5">
          {PAGES.map(({ id, label }) => {
            const isActive = current === id;
            return (
              <Link
                key={id}
                href={href(id)}
                className="flex items-center gap-2.5 w-full px-3 py-2.5 rounded-xl text-sm transition-all"
                style={
                  isActive
                    ? { background: "#EEF3FB", color: "#4A638D", fontWeight: 600 }
                    : { color: "#6B7280", fontWeight: 400 }
                }
              >
                <span
                  className="rounded-full flex-shrink-0"
                  style={{
                    width: 6,
                    height: 6,
                    background: isActive ? "#4A638D" : "#D1D5DB",
                  }}
                />
                {label}
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
