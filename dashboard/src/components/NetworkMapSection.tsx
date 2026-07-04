"use client";

import dynamic from "next/dynamic";
import { SubpageNav } from "./SubpageNav";
import type { StudioWithLatestMetric } from "@/types";

const NetworkMap = dynamic(() => import("./NetworkMap").then((m) => m.NetworkMap), { ssr: false });

export function NetworkMapSection({ studios }: { studios: StudioWithLatestMetric[] }) {
  return (
    <div className="mb-8">
      <SubpageNav />
      <div className="mt-1.5">
        <NetworkMap studios={studios} />
      </div>
    </div>
  );
}
