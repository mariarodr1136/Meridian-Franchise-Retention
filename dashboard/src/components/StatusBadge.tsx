import { cn } from "@/lib/utils";
import type { StudioStatus } from "@/types";

const config: Record<StudioStatus, { label: string; border: string; text: string }> = {
  healthy:      { label: "Healthy",    border: "border-green-500",  text: "text-green-600"  },
  "at-risk":    { label: "At Risk",    border: "border-red-500",    text: "text-red-600"    },
  new:          { label: "New",        border: "border-[#4A638D]",  text: "text-[#4A638D]"  },
  "pre-launch": { label: "Pre-Launch", border: "border-gray-400",   text: "text-gray-500"   },
};

interface Props {
  status: StudioStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const c = config[status];
  return (
    <span className={cn(
      "inline-flex items-center rounded-full font-medium border-2 bg-white",
      c.border, c.text,
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
    )}>
      {c.label}
    </span>
  );
}
