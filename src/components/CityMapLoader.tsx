"use client";

import dynamic from "next/dynamic";
import type { MapPoint } from "./CityMap";

// Leaflet touches `window`/`document` while it sets itself up, which
// crashes if Next tries to render it on the server. `ssr: false` is only
// legal from inside a Client Component, which is the one thing this file
// exists to do — the scorecard page itself stays a Server Component.
const CityMap = dynamic(() => import("./CityMap"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full items-center justify-center text-sm text-slate-400">
      Loading map…
    </div>
  ),
});

export default function CityMapLoader({ points }: { points: MapPoint[] }) {
  return <CityMap points={points} />;
}
