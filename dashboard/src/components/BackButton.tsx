"use client";

import { useRouter } from "next/navigation";

export function BackButton({ fallbackHref, label }: { fallbackHref: string; label: string }) {
  const router = useRouter();

  return (
    <button
      onClick={() => {
        if (window.history.length > 1) router.back();
        else router.push(fallbackHref);
      }}
      className="inline-flex items-center gap-1 text-sm font-medium mb-4 transition-opacity hover:opacity-70 cursor-pointer"
      style={{ color: "#4A638D" }}
    >
      {label}
    </button>
  );
}
