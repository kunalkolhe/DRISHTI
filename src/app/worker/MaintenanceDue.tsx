"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { logMaintenance } from "@/app/actions/asset";
import { prettyCategory } from "@/lib/assetTypes";
import { Loader2, Camera, CheckCircle2, AlertTriangle, PenTool, Navigation, ExternalLink, X } from "lucide-react";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Asset = any;

type Counts = { overdue: number; soon: number; all: number };

function fmt(d: string | Date) {
  return new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function dueBadge(days: number) {
  if (days < 0) return { text: `${Math.abs(days)} ${Math.abs(days) === 1 ? "day" : "days"} overdue`, bg: "#f3d9c9", fg: "#b23c2e" };
  if (days === 0) return { text: "Due today", bg: "#f0e6cf", fg: "#b5762a" };
  return { text: `Due in ${days} ${days === 1 ? "day" : "days"}`, bg: "#f0e6cf", fg: "#b5762a" };
}

export default function MaintenanceDue({
  assets,
  counts,
  filter,
  workerArea,
}: {
  assets: Asset[];
  counts: Counts;
  filter: string;
  workerArea: string | null;
}) {
  const router = useRouter();
  const [activeId, setActiveId] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notes, setNotes] = useState("");
  const [cost, setCost] = useState("");
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const resetForm = () => {
    setActiveId(null);
    setNotes("");
    setCost("");
    setPhotoFile(null);
    setPhotoPreview(null);
    setErrorMsg("");
  };

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPhotoFile(f);
    setPhotoPreview(URL.createObjectURL(f));
    setErrorMsg("");
  };

  const submit = async () => {
    if (!activeId) return;
    if (!photoFile) return setErrorMsg("Take a proof photo of the completed service.");
    setLoading(true);
    setErrorMsg("");

    const fd = new FormData();
    fd.append("assetId", String(activeId));
    fd.append("photo", photoFile, photoFile.name || "maintenance.jpg");
    fd.append("notes", notes);
    fd.append("repairCost", cost);

    const res = await logMaintenance(fd);
    setLoading(false);
    if (res.success) {
      resetForm();
      router.refresh();
    } else {
      setErrorMsg(res.error || "Failed to log the service.");
    }
  };

  const tabs: { id: string; label: string; n: number }[] = [
    { id: "overdue", label: "Overdue", n: counts.overdue },
    { id: "due", label: "Due soon", n: counts.soon },
    { id: "all", label: "All scheduled", n: counts.all },
  ];

  return (
    <div className="space-y-6">
      {/* filter tabs */}
      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const active = filter === t.id;
          return (
            <Link
              key={t.id}
              href={`?tab=maintenance&filter=${t.id}`}
              className="inline-flex items-center gap-2 rounded-full text-sm"
              style={{
                padding: "8px 16px",
                border: "1.5px solid rgba(18,21,15,.6)",
                background: active ? "#0d5347" : "transparent",
                color: active ? "#f8fbf0" : "#12150f",
                boxShadow: active ? "0 3px 0 rgba(9,58,50,.9)" : "none",
                fontWeight: 500,
              }}
            >
              {t.label}
              <span
                className="dc-mono"
                style={{ color: active ? "#dee8c4" : "#7a8074", letterSpacing: 0 }}
              >
                {t.n}
              </span>
            </Link>
          );
        })}
      </div>

      {workerArea && (
        <p className="dc-mono" style={{ textTransform: "none", letterSpacing: 0 }}>
          Showing assets in <strong>{workerArea}</strong> (and any not yet geo-tagged).
        </p>
      )}

      {assets.length === 0 ? (
        <div className="p-12 text-center dc-surface flex flex-col items-center">
          <CheckCircle2 className="w-16 h-16 text-success/50 mb-4" />
          <h3 className="font-semibold text-xl text-slate-800">
            {filter === "overdue" ? "Nothing overdue" : "All caught up"}
          </h3>
          <p className="text-slate-500 mt-1">
            {filter === "all"
              ? "No assets have a maintenance schedule yet."
              : "No assets need a check-up in this window."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {assets.map((asset) => {
            const badge = dueBadge(asset._dueInDays);
            const mapUrl = `https://www.google.com/maps/dir/?api=1&destination=${asset.gpsLat},${asset.gpsLon}`;
            const open = activeId === asset.id;
            return (
              <div key={asset.id} className="dc-surface overflow-hidden flex flex-col" style={{ padding: 0 }}>
                {/* photo header */}
                <div className="h-40 relative w-full" style={{ background: "#e7e0cd" }}>
                  {asset.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={asset.photoUrl.startsWith("http") ? asset.photoUrl : `/${asset.photoUrl.replace(/^\/+/, "")}`}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="absolute inset-0 flex items-center justify-center text-slate-400 text-sm">No photo</div>
                  )}
                  <span
                    className="absolute top-3 left-3 inline-flex items-center gap-1.5 rounded-lg text-xs font-bold px-3 py-1.5"
                    style={{ background: badge.bg, color: badge.fg, border: `1.5px solid ${badge.fg}` }}
                  >
                    <AlertTriangle className="w-3 h-3" /> {badge.text}
                  </span>
                </div>

                <div className="p-5 flex-grow flex flex-col">
                  <h3 className="font-semibold text-lg text-slate-800">{prettyCategory(asset.category)}</h3>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="dc-badge">{asset.qrCodeId}</span>
                    {asset.area && (
                      <span className="dc-badge" style={{ textTransform: "none", letterSpacing: 0 }}>
                        {asset.area}
                      </span>
                    )}
                  </div>

                  <dl className="mt-4 text-sm space-y-1.5" style={{ color: "#4b473b" }}>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Department</dt>
                      <dd className="text-right">{asset.department}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Cycle</dt>
                      <dd className="text-right">every {asset.maintenanceIntervalDays} days</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Last serviced</dt>
                      <dd className="text-right">{fmt(asset.lastMaintenanceDate)}</dd>
                    </div>
                    <div className="flex justify-between gap-3">
                      <dt className="text-slate-500">Next due</dt>
                      <dd className="text-right font-semibold" style={{ color: badge.fg }}>{fmt(asset._nextDue)}</dd>
                    </div>
                  </dl>

                  <div className="flex gap-2 mt-4">
                    <a href={mapUrl} target="_blank" rel="noopener noreferrer" className="dc-pill-ghost flex-1 text-sm" style={{ minHeight: 40 }}>
                      <Navigation className="w-4 h-4" /> Route
                    </a>
                    <Link href={`/asset/${encodeURIComponent(asset.qrCodeId)}`} className="dc-pill-ghost text-sm" style={{ minHeight: 40, padding: "0 14px" }}>
                      <ExternalLink className="w-4 h-4" /> Record
                    </Link>
                  </div>

                  {open ? (
                    <div className="mt-4 pt-4 space-y-3" style={{ borderTop: "1.5px solid rgba(18,21,15,.14)" }}>
                      <div className="flex items-center justify-between">
                        <h4 className="dc-mono">Log the service</h4>
                        <button type="button" onClick={resetForm} className="text-slate-400 hover:text-alert">
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      {errorMsg && <p style={{ color: "#b23c2e", fontSize: 12, fontWeight: 600 }}>{errorMsg}</p>}

                      {photoPreview ? (
                        <div className="dc-surface-soft p-2" style={{ borderColor: "#0d5347" }}>
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={photoPreview} alt="Proof" className="w-full h-28 object-cover rounded-lg" />
                          <label className="dc-pill-ghost w-full text-sm mt-2 cursor-pointer" style={{ minHeight: 36 }}>
                            <Camera className="w-4 h-4" /> Retake
                            <input type="file" accept="image/*" capture="environment" onChange={onPhotoPick} className="sr-only" />
                          </label>
                        </div>
                      ) : (
                        <label className="dc-surface-soft border-dashed p-5 flex flex-col items-center gap-1.5 cursor-pointer text-slate-500 hover:text-primary transition-colors">
                          <Camera className="w-7 h-7" />
                          <span className="text-xs font-semibold">Take proof photo</span>
                          <input type="file" accept="image/*" capture="environment" onChange={onPhotoPick} className="sr-only" />
                        </label>
                      )}

                      <textarea
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="What was done — e.g. cleaned solar panel, tightened bolts, greased pump"
                        className="dc-field resize-none"
                        style={{ height: 64, fontSize: 14 }}
                      />
                      <input
                        type="number"
                        min="0"
                        value={cost}
                        onChange={(e) => setCost(e.target.value)}
                        placeholder="Cost of parts / labour (₹, optional)"
                        className="dc-field"
                        style={{ fontSize: 14 }}
                      />

                      <button onClick={submit} disabled={loading} className="dc-pill w-full text-sm" style={{ minHeight: 44 }}>
                        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit & reset the clock"}
                      </button>
                    </div>
                  ) : (
                    <button onClick={() => setActiveId(asset.id)} className="dc-pill dc-pill-dark w-full text-sm mt-4" style={{ minHeight: 44 }}>
                      <PenTool className="w-4 h-4" /> Log service
                    </button>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
