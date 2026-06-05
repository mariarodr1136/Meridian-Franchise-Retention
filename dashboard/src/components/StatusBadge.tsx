import { cn } from "@/lib/utils";
import type { StudioStatus } from "@/types";

const config: Record<StudioStatus, { label: string; dot: string; text: string; bg: string }> = {
  healthy:      { label: "Healthy",    dot: "bg-green-500",  text: "text-green-700",  bg: "bg-green-50  border border-green-200" },
  "at-risk":    { label: "At Risk",    dot: "bg-orange-500", text: "text-orange-700", bg: "bg-orange-50 border border-orange-200" },
  new:          { label: "New",        dot: "bg-blue-500",   text: "text-blue-700",   bg: "bg-blue-50   border border-blue-200" },
  "pre-launch": { label: "Pre-Launch", dot: "bg-gray-400",   text: "text-gray-500",   bg: "bg-gray-50   border border-gray-200" },
};

interface Props {
  status: StudioStatus;
  size?: "sm" | "md";
}

export function StatusBadge({ status, size = "md" }: Props) {
  const c = config[status];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      c.bg, c.text,
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
    )}>
      <span className={cn("rounded-full flex-shrink-0", c.dot, size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {c.label}
    </span>
  );
}
