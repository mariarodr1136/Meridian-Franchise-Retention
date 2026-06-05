import { cn } from "@/lib/utils";
import type { RiskLevel } from "@/types/churn";

const config: Record<RiskLevel, { label: string; dot: string; text: string; bg: string }> = {
  high:   { label: "High Risk",   dot: "bg-red-500",    text: "text-red-400",    bg: "bg-red-500/10" },
  medium: { label: "Medium Risk", dot: "bg-yellow-500", text: "text-yellow-400", bg: "bg-yellow-500/10" },
  low:    { label: "Low Risk",    dot: "bg-green-500",  text: "text-green-400",  bg: "bg-green-500/10" },
};

interface Props {
  level: RiskLevel;
  score?: number;
  size?: "sm" | "md";
}

export function RiskBadge({ level, score, size = "md" }: Props) {
  const c = config[level];
  return (
    <span className={cn(
      "inline-flex items-center gap-1.5 rounded-full font-medium",
      c.bg, c.text,
      size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs"
    )}>
      <span className={cn("rounded-full flex-shrink-0", c.dot, size === "sm" ? "w-1.5 h-1.5" : "w-2 h-2")} />
      {score != null ? `${score}` : c.label}
    </span>
  );
}
