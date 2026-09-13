import { prisma } from "@/lib/prisma";
import { Activity, CheckCircle2, TrendingUp, Users, MapIcon } from "lucide-react";
import { prettyCategory } from "@/lib/assetTypes";
import CityMapLoader from "@/components/CityMapLoader";
import type { MapPoint } from "@/components/CityMap";

const STATUS_MAP_COLOR: Record<string, string> = {
  OPEN: "#b23c2e",
  ROUTED: "#b5762a",
  REOPENED: "#b5762a",
  FIXED_PENDING_CONFIRMATION: "#0d5347",
  CLOSED: "#0d5347",
  REJECTED: "#6a6555",
};

/** Pulls the "(Category label)" tag createComplaint writes at the front of description. */
function categoryFromDescription(description: string | null): string | null {
  return description?.match(/^\(([^)]+)\)/)?.[1] ?? null;
}

// This is a Server Component, meaning this code runs on the backend
// and fetches fresh data every time the page loads!
export default async function ScorecardPage() {
  
  // 1. Fetch all aggregate metrics from PostgreSQL using Prisma
  const totalAssets = await prisma.asset.count();
  const totalComplaints = await prisma.complaint.count();
  const resolvedComplaints = await prisma.complaint.count({
    where: { status: "CLOSED" }
  });
  
  // Calculate Resolution Rate
  const resolutionRate = totalComplaints > 0 
    ? Math.round((resolvedComplaints / totalComplaints) * 100) 
    : 100;

  // 2. Fetch the 5 most recent active complaints
  const recentComplaints = await prisma.complaint.findMany({
    take: 5,
    orderBy: { createdAt: 'desc' },
    include: { asset: true }
  });

  // 3. Map data — only complaints/assets that actually have a GPS point can
  // be plotted; a citizen who only typed an address has nothing to show
  // here (honest limitation, flagged in the caption under the map).
  const [mappedComplaints, mappedAssets, totalGeotagged] = await Promise.all([
    prisma.complaint.findMany({
      where: { gpsLat: { not: null }, gpsLon: { not: null } },
      select: {
        id: true, status: true, gpsLat: true, gpsLon: true, createdAt: true,
        description: true, asset: { select: { category: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 300,
    }),
    prisma.asset.findMany({
      select: { id: true, category: true, gpsLat: true, gpsLon: true, qrCodeId: true },
      take: 300,
    }),
    prisma.complaint.count({ where: { gpsLat: { not: null } } }),
  ]);

  const mapPoints: MapPoint[] = [
    ...mappedAssets.map((a): MapPoint => ({
      id: a.id,
      kind: "asset",
      lat: a.gpsLat,
      lon: a.gpsLon,
      label: prettyCategory(a.category),
      sublabel: `Registered asset · ${a.qrCodeId}`,
      color: "#0d5347",
      href: `/asset/${a.qrCodeId}`,
    })),
    ...mappedComplaints.map((c): MapPoint => ({
      id: c.id,
      kind: "complaint",
      lat: c.gpsLat as number,
      lon: c.gpsLon as number,
      label: c.asset ? prettyCategory(c.asset.category) : (categoryFromDescription(c.description) || "General issue"),
      sublabel: `${c.status.replace(/_/g, " ")} · ${new Date(c.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`,
      color: STATUS_MAP_COLOR[c.status] || "#6a6555",
    })),
  ];

  return (
    <div className="min-h-screen bg-background selection:bg-accent/20">
      
      <main className="max-w-7xl mx-auto px-6 py-12">
        
        {/* Title Section */}
        <div className="mb-12">
          <div className="dc-eyebrow mb-4">Live city metrics</div>
          <h1 className="text-4xl md:text-5xl font-display font-semibold text-slate-800" style={{ letterSpacing: "-0.045em" }}>
            Public scorecard
          </h1>
          <p className="text-lg text-slate-500 mt-4 max-w-2xl leading-relaxed">
            Total transparency into how the city&apos;s infrastructure is performing and how quickly issues are being resolved.
          </p>
        </div>

        {/* KPI Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          
          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Total assets tracked</span>
              <div className="p-2 bg-primary/10 text-primary rounded-xl"><Activity className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-black text-slate-800">{totalAssets}</h2>
          </div>

          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Total issues reported</span>
              <div className="p-2 bg-alert/10 text-alert rounded-xl"><Users className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-black text-slate-800">{totalComplaints}</h2>
          </div>

          <div className="dc-surface p-6 flex flex-col justify-between h-40">
            <div className="flex justify-between items-start">
              <span className="dc-mono">Issues fixed</span>
              <div className="p-2 bg-success/10 text-success rounded-xl"><CheckCircle2 className="w-5 h-5" /></div>
            </div>
            <h2 className="text-5xl font-display font-black text-slate-800">{resolvedComplaints}</h2>
          </div>

          <div className="p-6 flex flex-col justify-between h-40" style={{ background: "#0d5347", borderRadius: 22, border: "1.5px solid rgba(18,21,15,.55)", boxShadow: "6px 8px 0 rgba(18,21,15,.85)" }}>
            <div className="flex justify-between items-start">
              <span className="dc-mono" style={{ color: "rgba(248,251,240,.75)" }}>Resolution rate</span>
              <div className="p-2 bg-white/20 text-white rounded-xl"><TrendingUp className="w-5 h-5" /></div>
            </div>
            <div className="flex items-baseline gap-2">
              <h2 className="text-5xl font-display font-black text-white">{resolutionRate}</h2>
              <span className="text-2xl font-bold text-white/80">%</span>
            </div>
          </div>

        </div>

        {/* Live Map */}
        <div className="dc-surface overflow-hidden mb-8" style={{ padding: 0 }}>
          <div className="p-6 flex flex-wrap items-center justify-between gap-3" style={{ borderBottom: "1.5px solid rgba(18,21,15,.14)" }}>
            <div className="flex items-center gap-2">
              <MapIcon className="w-4 h-4 text-primary" />
              <h3 className="font-semibold text-slate-800 text-lg">Where things stand</h3>
            </div>
            <div className="flex flex-wrap items-center gap-4 text-xs text-slate-500">
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#b23c2e" }} /> Open</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#b5762a" }} /> In progress</span>
              <span className="flex items-center gap-1.5"><span className="inline-block w-2.5 h-2.5 rounded-full" style={{ background: "#0d5347" }} /> Fixed / asset</span>
            </div>
          </div>
          {mapPoints.length === 0 ? (
            <div className="p-12 text-center text-slate-400 font-medium">
              Nothing with a GPS location yet — the map fills in as reports and assets come in with location tagged.
            </div>
          ) : (
            <>
              <div style={{ height: 420 }}>
                <CityMapLoader points={mapPoints} />
              </div>
              <p className="px-6 py-3 text-xs text-slate-400" style={{ borderTop: "1.5px solid rgba(18,21,15,.1)" }}>
                {totalGeotagged} of {totalComplaints} reports have a mapped location · {mappedAssets.length} registered assets shown.
              </p>
            </>
          )}
        </div>

        {/* Live Feed */}
        <div className="dc-surface overflow-hidden" style={{ padding: 0 }}>
          <div className="p-6" style={{ borderBottom: "1.5px solid rgba(18,21,15,.14)" }}>
            <h3 className="font-semibold text-slate-800 text-lg">Recent reports activity</h3>
          </div>

          <div className="divide-y" style={{ borderColor: "rgba(18,21,15,.1)" }}>
            {recentComplaints.length === 0 ? (
              <div className="p-12 text-center text-slate-400 font-medium">No complaints logged yet.</div>
            ) : (
              recentComplaints.map((complaint) => (
                <div key={complaint.id} className="p-6 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/50 transition-colors">
                  <div>
                    <div className="flex items-center gap-3 mb-2">
                      <span className={`px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider rounded-md ${
                        complaint.status === 'OPEN' ? 'bg-alert/10 text-alert' :
                        complaint.status === 'ROUTED' ? 'bg-accent/10 text-accent' :
                        'bg-success/10 text-success'
                      }`}>
                        {complaint.status}
                      </span>
                      <span className="text-sm font-semibold text-slate-500">
                        {new Date(complaint.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                    <p className="font-bold text-slate-800 text-lg">
                      {complaint.asset ? complaint.asset.category.replace('_', ' ') : "General Infrastructure"} Issue
                    </p>
                    <p className="text-sm text-slate-500 mt-1 font-mono">{complaint.asset ? complaint.asset.qrCodeId : (complaint.address ? "Custom Location" : "Unregistered Asset")}</p>
                  </div>
                  <div className="sm:text-right">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block mb-1">Severity</span>
                    <span className={`font-bold ${
                      complaint.severity === 'HIGH' ? 'text-alert' :
                      complaint.severity === 'MEDIUM' ? 'text-accent' : 'text-success'
                    }`}>{complaint.severity || 'UNKNOWN'}</span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </main>
    </div>
  );
}
