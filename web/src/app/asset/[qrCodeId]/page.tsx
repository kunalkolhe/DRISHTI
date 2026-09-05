import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { extractAssetCode } from "@/lib/qr";
import { prettyCategory } from "@/lib/assetTypes";
import {
  Lightbulb,
  Droplets,
  Dumbbell,
  Sun,
  Cctv,
  DoorClosed,
  MapPin,
  ShieldCheck,
  Wrench,
  AlertTriangle,
  PackagePlus,
  CircleCheck,
  IndianRupee,
  TrafficCone,
  Trash2,
} from "lucide-react";

// icon by category value — anything not listed uses the fallback
const CATEGORY_ICON: Record<string, React.ComponentType<{ className?: string }>> = {
  STREETLIGHT: Lightbulb,
  SOLAR_LIGHT: Sun,
  HIGH_MAST_LIGHT: Lightbulb,
  PARK_LIGHT: Lightbulb,
  TRAFFIC_SIGNAL: TrafficCone,
  SPEED_BREAKER: TrafficCone,
  CCTV: Cctv,
  HANDPUMP: Droplets,
  BOREWELL: Droplets,
  WATER_TANK: Droplets,
  WATER_ATM: Droplets,
  PUBLIC_TAP: Droplets,
  DRAINAGE: Droplets,
  MANHOLE: Droplets,
  OPEN_GYM: Dumbbell,
  PLAY_EQUIPMENT: Dumbbell,
  PUBLIC_TOILET: DoorClosed,
  URINAL: DoorClosed,
  COMMUNITY_BIN: Trash2,
};

const OPEN_STATUSES = new Set(["OPEN", "ROUTED", "REOPENED", "FIXED_PENDING_CONFIRMATION"]);

function fmtDate(d: Date | string | null | undefined) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function nextServiceDate(last: Date | null, intervalDays: number | null): Date | null {
  if (!last || !intervalDays) return null;
  return new Date(last.getTime() + intervalDays * 864e5);
}

function isPast(d: Date | null): boolean {
  return d ? d.getTime() < Date.now() : false;
}

export default async function PublicAssetPage({
  params,
}: {
  params: Promise<{ qrCodeId: string }>;
}) {
  const { qrCodeId } = await params;
  const code = extractAssetCode(decodeURIComponent(qrCodeId));

  const asset = await prisma.asset.findUnique({
    where: { qrCodeId: code },
    include: {
      serviceHistories: {
        orderBy: { date: "desc" },
        include: { worker: { select: { name: true } } },
      },
      complaints: { orderBy: { createdAt: "desc" } },
    },
  });

  if (!asset) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6" style={{ background: "#eee8da" }}>
        <div className="dc-surface p-8 max-w-sm text-center">
          <h1 className="text-xl font-display font-semibold text-slate-800">Asset not found</h1>
          <p className="text-slate-500 mt-2 text-sm">
            No public asset is registered against{" "}
            <span style={{ fontFamily: "var(--font-jetbrains), monospace" }}>{code}</span>.
          </p>
        </div>
      </div>
    );
  }

  const meta = { label: prettyCategory(asset.category), Icon: CATEGORY_ICON[asset.category] ?? PackagePlus };
  const { Icon } = meta;

  const openComplaints = asset.complaints.filter((c) => OPEN_STATUSES.has(c.status));
  const nextDue = nextServiceDate(asset.lastMaintenanceDate, asset.maintenanceIntervalDays);
  const overdue = isPast(nextDue);

  const health =
    openComplaints.length > 0
      ? { label: `${openComplaints.length} open ${openComplaints.length === 1 ? "fault" : "faults"}`, color: "#b23c2e", bg: "#f3d9c9" }
      : overdue
      ? { label: "Service overdue", color: "#b5762a", bg: "#f0e6cf" }
      : { label: "Healthy", color: "#0d5347", bg: "#dee8c4" };

  // Merge everything into one timeline, newest first
  type Ev = { date: Date; title: string; detail?: string | null; kind: "install" | "service" | "maintenance" | "complaint" | "fixed" };
  const events: Ev[] = [];
  if (asset.installDate) {
    events.push({ date: asset.installDate, kind: "install", title: "Asset installed & registered on DRISHTI" });
  }
  for (const s of asset.serviceHistories) {
    events.push({
      date: s.date,
      kind: s.type === "MAINTENANCE" ? "maintenance" : "service",
      title:
        (s.type === "MAINTENANCE" ? "Routine maintenance" : "Repair carried out") +
        (s.worker?.name ? ` — ${s.worker.name}` : ""),
      detail: s.notes,
    });
  }
  for (const c of asset.complaints) {
    events.push({
      date: c.createdAt,
      kind: "complaint",
      title: `Complaint filed${c.severity ? ` — ${c.severity.toLowerCase()} severity` : ""}`,
      detail: c.description,
    });
    if (c.resolvedAt) {
      events.push({ date: c.resolvedAt, kind: "fixed", title: "Marked fixed by field worker" });
    }
  }
  events.sort((a, b) => b.date.getTime() - a.date.getTime());

  const EV_STYLE: Record<Ev["kind"], { color: string; Icon: React.ComponentType<{ className?: string }> }> = {
    install: { color: "#0d5347", Icon: PackagePlus },
    service: { color: "#0d5347", Icon: Wrench },
    maintenance: { color: "#b5762a", Icon: Wrench },
    complaint: { color: "#b23c2e", Icon: AlertTriangle },
    fixed: { color: "#0d5347", Icon: CircleCheck },
  };

  const facts: Array<[string, string]> = [
    ["Installed", fmtDate(asset.installDate)],
    ["Department", asset.department],
    ...(asset.area ? [["Area", asset.area] as [string, string]] : []),
    [
      "Warranty / AMC",
      asset.warrantyExpiry
        ? `${isPast(asset.warrantyExpiry) ? "Expired" : "Valid till"} ${fmtDate(asset.warrantyExpiry)}`
        : asset.warrantyStatus || "None on record",
    ],
    ["Maintenance cycle", asset.maintenanceIntervalDays ? `Every ${asset.maintenanceIntervalDays} days` : "—"],
    ["Last serviced", fmtDate(asset.lastMaintenanceDate)],
    ["Next service due", nextDue ? `${fmtDate(nextDue)}${overdue ? " (overdue)" : ""}` : "—"],
    ["Risk score", `${Math.round(asset.riskScore)} / 100`],
  ];
  if (asset.replacementCost) facts.push(["Replacement cost", `₹${asset.replacementCost.toLocaleString("en-IN")}`]);

  return (
    <div className="min-h-screen" style={{ background: "#eee8da" }}>
      <main className="max-w-2xl mx-auto px-6 py-10">
        {/* Header */}
        <div className="dc-eyebrow mb-4">Public asset record</div>
        <div className="flex items-start gap-4">
          <div
            className="w-14 h-14 rounded-2xl grid place-items-center shrink-0"
            style={{ background: "#dee8c4", border: "1.5px solid #0d5347" }}
          >
            <Icon className="w-7 h-7 text-primary" />
          </div>
          <div className="min-w-0">
            <h1 className="text-3xl font-display font-semibold text-slate-800" style={{ letterSpacing: "-0.04em" }}>
              {meta.label}
            </h1>
            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="dc-badge">{asset.qrCodeId}</span>
              <span
                className="dc-badge"
                style={{ background: health.bg, color: health.color, borderColor: health.color }}
              >
                <ShieldCheck className="w-3 h-3" />
                {health.label}
              </span>
            </div>
          </div>
        </div>

        <a
          href={`https://www.google.com/maps?q=${asset.gpsLat},${asset.gpsLon}`}
          target="_blank"
          rel="noopener noreferrer"
          className="dc-mono inline-flex items-center gap-1 mt-3"
          style={{ color: "#0d5347" }}
        >
          <MapPin className="w-3 h-3" /> {asset.gpsLat.toFixed(5)}, {asset.gpsLon.toFixed(5)} ↗
        </a>

        {/* Facts */}
        <div className="dc-surface mt-6 p-5">
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 gap-y-3">
            {facts.map(([k, v]) => (
              <div key={k} className="flex justify-between gap-3 text-sm border-b border-black/5 pb-2">
                <dt className="text-slate-500 shrink-0">{k}</dt>
                <dd className="text-slate-800 font-medium text-right">{v}</dd>
              </div>
            ))}
          </dl>
        </div>

        {/* Timeline */}
        <h2 className="text-lg font-display font-semibold text-slate-800 mt-8 mb-3">
          Service &amp; complaint history
        </h2>
        {events.length === 0 ? (
          <div className="dc-surface-soft p-5 text-sm text-slate-500">Nothing recorded yet.</div>
        ) : (
          <div className="dc-surface p-5 space-y-4">
            {events.map((ev, i) => {
              const s = EV_STYLE[ev.kind];
              return (
                <div key={i} className="flex gap-3">
                  <div
                    className="w-8 h-8 rounded-full grid place-items-center shrink-0"
                    style={{ background: "#fefcf5", border: `1.5px solid ${s.color}` }}
                  >
                    <s.Icon className="w-4 h-4" style={{ color: s.color }} />
                  </div>
                  <div className="min-w-0 pb-3 border-b border-black/5 flex-1">
                    <div className="flex justify-between gap-3">
                      <p className="text-sm font-semibold text-slate-800">{ev.title}</p>
                      <span className="dc-mono shrink-0" style={{ textTransform: "none", letterSpacing: 0 }}>
                        {fmtDate(ev.date)}
                      </span>
                    </div>
                    {ev.detail && <p className="text-sm text-slate-500 mt-1">{ev.detail}</p>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="dc-surface-soft mt-8 p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="font-semibold text-slate-800">Something wrong with this asset?</p>
            <p className="text-sm text-slate-500">Report it in two taps — the code is pre-filled.</p>
          </div>
          <Link
            href={`/report?asset=${encodeURIComponent(asset.qrCodeId)}`}
            className="dc-pill shrink-0"
            style={{ minHeight: 48, padding: "0 24px" }}
          >
            Report a problem
          </Link>
        </div>

        <p className="dc-mono mt-6" style={{ textTransform: "none", letterSpacing: 0 }}>
          <IndianRupee className="w-3 h-3 inline" /> Public record · updated live from the DRISHTI registry.
        </p>
      </main>
    </div>
  );
}
