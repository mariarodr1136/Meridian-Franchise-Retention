"use client";

import { useState, useRef, useCallback } from "react";
import { ComposableMap, Geographies, Geography, Marker, ZoomableGroup } from "react-simple-maps";
import type { StudioWithLatestMetric, StudioStatus } from "@/types";

const GEO_URL = "https://cdn.jsdelivr.net/npm/us-atlas@3/states-10m.json";

// Coordinates for every city in the seed data
const CITY_COORDS: Record<string, [number, number]> = {
  "Aventura":            [-80.139, 25.957],
  "Miami":               [-80.192, 25.774],
  "Tampa":               [-82.458, 27.947],
  "Coconut Grove":       [-80.248, 25.730],
  "Coral Springs":       [-80.270, 26.271],
  "Delray Beach":        [-80.073, 26.461],
  "Orlando":             [-81.379, 28.538],
  "Estero":              [-81.807, 26.436],
  "Fort Lauderdale":     [-80.137, 26.122],
  "Jacksonville":        [-81.655, 30.332],
  "Jacksonville Beach":  [-81.423, 30.289],
  "Miami Beach":         [-80.130, 25.791],
  "Coral Gables":        [-80.268, 25.721],
  "Doral":               [-80.355, 25.820],
  "Oviedo":              [-81.208, 28.670],
  "Palm Beach Gardens":  [-80.098, 26.823],
  "Wellington":          [-80.268, 26.656],
  "Boca Raton":          [-80.085, 26.368],
  "West Palm Beach":     [-80.054, 26.715],
  "Weston":              [-80.400, 26.100],
  "Winter Park":         [-81.339, 28.600],
  "Winter Garden":       [-81.589, 28.565],
  "Lakewood Ranch":      [-82.399, 27.427],
  "Naples":              [-81.795, 26.142],
  "Port St. Lucie":      [-80.350, 27.293],
  "Tallahassee":         [-84.280, 30.438],
  "Boynton Beach":       [-80.063, 26.535],
  "Pembroke Pines":      [-80.296, 26.007],
  "St. Augustine":       [-81.315, 29.893],
  "Alpharetta":          [-84.294, 34.075],
  "Atlanta":             [-84.388, 33.749],
  "Marietta":            [-84.550, 33.953],
  "Buford":              [-83.991, 34.120],
  "Dunwoody":            [-84.334, 33.946],
  "Charlotte":           [-80.843, 35.227],
  "Raleigh":             [-78.638, 35.779],
  "Holly Springs":       [-78.834, 35.652],
  "Huntersville":        [-80.843, 35.410],
  "Durham":              [-78.899, 35.994],
  "Greenville":          [-82.394, 34.852],
  "Columbia":            [-81.035, 34.000],
  "Nashville":           [-86.781, 36.162],
  "Brentwood":           [-86.782, 36.033],
  "Brooklyn":            [-73.950, 40.678],
  "New York":            [-74.006, 40.713],
  "Somerville":          [-74.609, 40.573],
  "Westport":            [-73.358, 41.141],
  "Darien":              [-73.469, 41.073],
  "Philadelphia":        [-75.165, 39.952],
  "Haverford":           [-75.306, 40.007],
  "Marlton":             [-74.922, 39.891],
  "Wayne":               [-74.474, 40.953],
  "Parsippany":          [-74.427, 40.857],
  "Florham Park":        [-74.394, 40.778],
  "Woodcliff Lake":      [-74.055, 41.020],
  "Verona":              [-74.238, 40.829],
  "Latham":              [-73.750, 42.744],
  "Washington":          [-77.036, 38.907],
  "Tysons":              [-77.231, 38.920],
  "Richmond":            [-77.463, 37.541],
  "Chicago":             [-87.629, 41.878],
  "Northbrook":          [-87.829, 42.126],
  "Naperville":          [-88.147, 41.786],
  "Creve Coeur":         [-90.435, 38.660],
  "Des Peres":           [-90.432, 38.599],
  "Edwardsville":        [-89.953, 38.812],
  "West Des Moines":     [-93.714, 41.577],
  "Overland Park":       [-94.672, 38.982],
  "Carmel":              [-86.118, 39.978],
  "Fishers":             [-85.966, 39.956],
  "Austin":              [-97.743, 30.267],
  "Dallas":              [-96.797, 32.777],
  "Houston":             [-95.370, 29.760],
  "Flower Mound":        [-97.097, 33.014],
  "McKinney":            [-96.640, 33.197],
  "Cypress":             [-95.697, 29.970],
  "Sugar Land":          [-95.635, 29.620],
  "League City":         [-95.095, 29.508],
  "Friendswood":         [-95.201, 29.529],
  "Missouri City":       [-95.537, 29.619],
  "San Marcos":          [-97.941, 29.883],
  "Georgetown":          [-97.677, 30.633],
  "Heath":               [-96.476, 32.835],
  "Denver":              [-104.990, 39.739],
  "Boulder":             [-105.270, 40.015],
  "Holladay":            [-111.820, 40.669],
  "Salt Lake City":      [-111.891, 40.761],
  "San Diego":           [-117.161, 32.716],
  "Irvine":              [-117.826, 33.684],
  "Los Gatos":           [-121.969, 37.226],
  "San Francisco":       [-122.419, 37.775],
  "Santa Clara":         [-121.956, 37.354],
  "Folsom":              [-121.176, 38.679],
  "Oakhurst":            [-119.650, 37.330],
  "Albuquerque":         [-106.651, 35.085],
  "Belmont":             [-71.478, 42.396],
  "Wellesley":           [-71.294, 42.296],
  "Warrington":          [-75.135, 40.248],
  "Seattle":             [-122.332, 47.606],
  "Melbourne":           [-80.602, 28.083],
};

const STATUS_COLOR: Record<StudioStatus, string> = {
  "healthy":    "#16A34A",
  "at-risk":    "#EA580C",
  "new":        "#4A638D",
  "pre-launch": "#9CA3AF",
};

interface Props {
  studios: StudioWithLatestMetric[];
}

type HoveredStudio = StudioWithLatestMetric & { coords: [number, number]; x: number; y: number };

function riskReasons(s: StudioWithLatestMetric): string[] {
  const m = s.latestMetric;
  if (!m) return ["No recent data available"];
  const reasons: string[] = [];
  if (m.classFillRate < 0.58) reasons.push(`Fill rate ${(m.classFillRate * 100).toFixed(0)}% — below 70% target`);
  if (m.weeklyChurn > 0.06)   reasons.push(`Churn ${(m.weeklyChurn * 100).toFixed(1)}% — above 2% avg`);
  if (m.weeklyChurn > 0.035 && m.weeklyChurn <= 0.06) reasons.push(`Churn trending up — monitor closely`);
  if (m.classFillRate >= 0.58 && m.classFillRate < 0.68) reasons.push(`Fill rate declining — watch trend`);
  return reasons.length ? reasons : ["Metrics under review"];
}

export function NetworkMap({ studios }: Props) {
  const [hovered, setHovered] = useState<HoveredStudio | null>(null);
  const [zoom, setZoom] = useState(2.2);
  const [center, setCenter] = useState<[number, number]>([-96, 38]);
  const MIN_ZOOM = 1;
  const MAX_ZOOM = 8;
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isDragging = useRef(false);
  const wrapperRef  = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scheduleHide = useCallback(() => {
    hideTimerRef.current = setTimeout(() => setHovered(null), 120);
  }, []);

  const cancelHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  }, []);

  const studiosWithCoords = studios.flatMap((s) => {
    const coords = CITY_COORDS[s.city];
    if (!coords) return [];
    return [{ ...s, coords }];
  });

  const counts = {
    healthy:      studios.filter((s) => s.status === "healthy").length,
    "at-risk":    studios.filter((s) => s.status === "at-risk").length,
    new:          studios.filter((s) => s.status === "new").length,
    "pre-launch": studios.filter((s) => s.status === "pre-launch").length,
  };

  function getPopupPos(x: number, y: number, wrapperW: number) {
    const popupW = 300;
    const isRight = x + 18 + popupW <= wrapperW;
    const left = isRight ? x + 18 : x - popupW - 18;
    const transformOrigin = isRight ? "top left" : "top right";
    return { left, top: y - 16, transformOrigin };
  }

  return (
    <div ref={wrapperRef} style={{ position: "relative" }}>
      <style>{`
        @keyframes at-risk-pulse {
          0%   { transform: scale(1);    opacity: 0;    animation-timing-function: ease-in; }
          20%  { transform: scale(1.2);  opacity: 0.45; animation-timing-function: ease-out; }
          80%  { transform: scale(2.2);  opacity: 0; }
          100% { transform: scale(2.2);  opacity: 0; }
        }
        .at-risk-pulse {
          animation: at-risk-pulse 2.6s linear infinite;
          transform-origin: center;
          transform-box: fill-box;
        }
        @keyframes popupEnter {
          from { opacity: 0; transform: scale(0.93) translateY(4px); }
          to   { opacity: 1; transform: scale(1)    translateY(0); }
        }
      `}</style>

      <div className="rounded-xl border overflow-hidden" style={{ borderColor: "#C8D8EE", background: "#FFFFFF" }}>
        {/* Legend row */}
        <div className="flex items-center gap-4 px-5 py-3 border-b" style={{ borderColor: "#E4EDF8" }}>
          {(Object.entries(counts) as [StudioStatus, number][]).map(([status, count]) => (
            <div key={status} className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full" style={{ background: STATUS_COLOR[status] }} />
              <span className="text-xs capitalize" style={{ color: "#6B7280" }}>
                {status.replace("-", " ")} ({count})
              </span>
            </div>
          ))}
        </div>

        {/* Map */}
        <div
          ref={containerRef}
          className="relative"
          style={{ height: "340px" }}
          onDoubleClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.8).toFixed(1)))}
        >
          {/* Zoom controls — onDoubleClick stops here so double-clicking buttons doesn't trigger map zoom-in */}
          <div className="absolute top-3 right-3 z-10 flex flex-col gap-1" onDoubleClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setZoom((z) => Math.min(MAX_ZOOM, +(z + 0.4).toFixed(1)))}
              className="w-7 h-7 rounded-md border flex items-center justify-center text-sm font-bold transition-colors hover:bg-blue-50"
              style={{ background: "#FFFFFF", borderColor: "#C8D8EE", color: "#4A638D" }}
            >+</button>
            <button
              onClick={() => setZoom((z) => Math.max(MIN_ZOOM, +(z - 0.4).toFixed(1)))}
              className="w-7 h-7 rounded-md border flex items-center justify-center text-sm font-bold transition-colors hover:bg-blue-50"
              style={{ background: "#FFFFFF", borderColor: "#C8D8EE", color: "#4A638D" }}
            >−</button>
          </div>

          <ComposableMap
            projection="geoAlbersUsa"
            style={{ width: "100%", height: "100%", cursor: "grab" }}
          >
            {/* Full-viewport hit area so drag registers over ocean/empty space */}
            <rect width="100%" height="100%" fill="transparent" />
            <ZoomableGroup
              zoom={zoom}
              center={center}
              onMoveStart={() => { isDragging.current = true; }}
              onMoveEnd={({ coordinates, zoom: z }) => {
                isDragging.current = false;
                setCenter(coordinates as [number, number]);
                setZoom(+z.toFixed(1));
              }}
              filterZoomEvent={(e) => (e as unknown as Event).type !== "wheel"}
            >
              <Geographies geography={GEO_URL}>
                {({ geographies }) =>
                  geographies.map((geo) => (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill="#EEF3FB"
                      stroke="#C8D8EE"
                      strokeWidth={0.5}
                      style={{ default: { outline: "none" }, hover: { outline: "none" }, pressed: { outline: "none" } }}
                    />
                  ))
                }
              </Geographies>

              {studiosWithCoords.map((studio) => (
                <Marker
                  key={studio.id}
                  coordinates={studio.coords}
                  onMouseEnter={(e) => {
                    if (isDragging.current) return;
                    cancelHide();
                    const wRect = wrapperRef.current!.getBoundingClientRect();
                    const x = (e as unknown as MouseEvent).clientX - wRect.left;
                    const y = (e as unknown as MouseEvent).clientY - wRect.top;
                    setHovered({ ...studio, x, y });
                  }}
                  onMouseLeave={scheduleHide}
                >
                  <circle
                    r={((hovered?.id === studio.id ? 6 : studio.status === "at-risk" ? 5 : 4) * 2.2) / zoom}
                    fill={STATUS_COLOR[studio.status as StudioStatus]}
                    stroke="#FFFFFF"
                    strokeWidth={(hovered?.id === studio.id ? 2 : 1) / zoom}
                    style={{ cursor: "pointer", opacity: 0.9 }}
                  />
                  {(studio.status === "at-risk" || hovered?.id === studio.id) && (
                    <circle
                      r={((hovered?.id === studio.id ? 10 : 8) * 2.2) / zoom}
                      fill="none"
                      stroke={STATUS_COLOR[studio.status as StudioStatus]}
                      strokeWidth={1 / zoom}
                      opacity={0.35}
                      className={studio.status === "at-risk" && hovered?.id !== studio.id ? "at-risk-pulse" : undefined}
                      style={{ pointerEvents: "none" }}
                    />
                  )}
                </Marker>
              ))}
            </ZoomableGroup>
          </ComposableMap>
        </div>
      </div>

      {/* Hover popup — rendered outside overflow-hidden card so it's never clipped */}
      {hovered && (() => {
        const m = hovered.latestMetric;
        const wrapperW = wrapperRef.current?.offsetWidth ?? 800;
        const { left, top, transformOrigin } = getPopupPos(hovered.x, hovered.y, wrapperW);
        const status = hovered.status as StudioStatus;
        const reasons = status === "at-risk" ? riskReasons(hovered) : [];

        return (
          <div
            className="absolute z-20 rounded-xl overflow-hidden"
            style={{
              left, top, width: 300,
              border: "1px solid #C8D8EE",
              boxShadow: "0 8px 32px rgba(74,99,141,0.18), 0 2px 8px rgba(74,99,141,0.10)",
              animation: "popupEnter 0.18s cubic-bezier(0.16, 1, 0.3, 1) forwards",
              transformOrigin,
              willChange: "transform, opacity",
            }}
            onMouseEnter={cancelHide}
            onMouseLeave={scheduleHide}
          >
            {/* Navy header */}
            <div className="px-4 pt-4 pb-3 flex items-start justify-between gap-2"
              style={{ background: "#4A638D" }}>
              <div className="min-w-0">
                <p className="text-sm font-bold text-white truncate"
                  style={{ fontFamily: "var(--font-montserrat), Montserrat, sans-serif", letterSpacing: "0.02em" }}>
                  {hovered.name}
                </p>
                <p className="text-xs mt-0.5" style={{ color: "rgba(255,255,255,0.6)" }}>
                  {hovered.city}{hovered.state ? `, ${hovered.state}` : ""}
                </p>
              </div>
              <span
                className="text-xs font-semibold px-2 py-0.5 rounded-full capitalize flex-shrink-0 mt-0.5"
                style={{
                  background: "rgba(255,255,255,0.15)",
                  color: "#FFFFFF",
                  border: "1px solid rgba(255,255,255,0.22)",
                  letterSpacing: "0.03em",
                }}
              >
                {status.replace("-", " ")}
              </span>
            </div>

            {/* Status accent bar */}
            <div style={{ height: "3px", background: STATUS_COLOR[status] }} />

            {/* Metrics grid */}
            {m ? (
              <div className="p-3 grid grid-cols-2 gap-2" style={{ background: "#FFFFFF" }}>
                {[
                  { label: "Fill Rate",   value: `${(m.classFillRate * 100).toFixed(0)}%`,  warn: m.classFillRate < 0.58 },
                  { label: "Members",     value: m.activeMemberships.toLocaleString(),        warn: false },
                  { label: "Weekly Rev",  value: `$${Math.round(m.weeklyRevenue / 1000)}k`,  warn: false },
                  { label: "Wkly Churn", value: `${(m.weeklyChurn * 100).toFixed(1)}%`,      warn: m.weeklyChurn > 0.04 },
                ].map(({ label, value, warn }) => (
                  <div key={label} className="rounded-lg px-2.5 py-2"
                    style={{ background: "#F0F5FB", border: "1px solid #E4EDF8" }}>
                    <p className="font-semibold uppercase" style={{ color: "#4A638D", fontSize: "9px", letterSpacing: "0.08em" }}>
                      {label}
                    </p>
                    <p className="text-sm font-bold mt-0.5" style={{ color: warn ? "#EA580C" : "#1F2937" }}>{value}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="px-4 py-3 text-xs" style={{ color: "#9CA3AF", background: "#FFFFFF" }}>No metrics available</p>
            )}

            {/* At-risk reasons */}
            {reasons.length > 0 && (
              <div className="mx-3 mb-2 rounded-lg px-3 py-2.5"
                style={{ background: "#FFF7ED", border: "1px solid #FDBA74" }}>
                <p className="text-xs font-bold uppercase mb-1.5"
                  style={{ color: "#EA580C", letterSpacing: "0.06em", fontSize: "9px" }}>
                  Why at risk
                </p>
                <ul className="space-y-1">
                  {reasons.map((r, i) => (
                    <li key={i} className="flex items-start gap-1.5 text-xs" style={{ color: "#92400E" }}>
                      <span className="mt-0.5 flex-shrink-0" style={{ color: "#EA580C" }}>▸</span>
                      {r}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* CTA */}
            <div className="px-3 pb-3" style={{ background: "#FFFFFF" }}>
              <a
                href={`/studios/${hovered.id}`}
                className="flex items-center justify-center gap-1.5 w-full py-2 rounded-lg text-xs font-semibold text-white transition-opacity hover:opacity-85"
                style={{ background: "#4A638D", letterSpacing: "0.04em" }}
              >
                View Studio Details →
              </a>
            </div>
          </div>
        );
      })()}
    </div>
  );
}
