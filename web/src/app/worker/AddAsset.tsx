"use client";

import { useState } from "react";
import { createAsset } from "@/app/actions/asset";
import { Loader2, Camera, MapPin, CheckCircle2, AlertCircle, Printer, ScanLine, RotateCcw } from "lucide-react";
import QRCode from "react-qr-code";
import { assetUrl } from "@/lib/qr";
import { ASSET_TYPES, WARRANTY_OPTIONS, getAssetType } from "@/lib/assetTypes";
import { resolveAddress } from "@/app/actions/geocodeAddress";
import { resolveArea } from "@/app/actions/resolveArea";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type SuccessData = any;

export default function AddAsset({ origin = "" }: { origin?: string }) {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<SuccessData>(null);

  const [category, setCategory] = useState("STREETLIGHT");
  const [customCategory, setCustomCategory] = useState("");
  const [department, setDepartment] = useState(getAssetType("STREETLIGHT").department);
  const [deptTouched, setDeptTouched] = useState(false);

  const [location, setLocation] = useState<{ lat: number; lon: number } | null>(null);
  const [locationLabel, setLocationLabel] = useState("");
  const [areaLabel, setAreaLabel] = useState("");
  const [gpsBusy, setGpsBusy] = useState(false);
  const [manualGps, setManualGps] = useState(false);
  const [manualInput, setManualInput] = useState("");
  const [manualBusy, setManualBusy] = useState(false);

  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const isCustom = category === "OTHER";

  function onCategoryChange(value: string) {
    setCategory(value);
    // auto-fill the department unless the worker has hand-edited it
    if (!deptTouched) {
      setDepartment(value === "OTHER" ? "" : getAssetType(value).department);
    }
  }

  const captureGPS = () => {
    setErrorMsg("");
    if (typeof window !== "undefined" && !window.isSecureContext) {
      setManualGps(true);
      setErrorMsg(
        "GPS needs a secure connection. Open the app at http://localhost:3000 (or over HTTPS), or type the address manually below.",
      );
      return;
    }
    if (!navigator.geolocation) {
      setManualGps(true);
      setErrorMsg("This browser has no location support — type the address manually below.");
      return;
    }
    setGpsBusy(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLocation({ lat, lon });
        setLocationLabel("");
        setGpsBusy(false);
        try {
          const r = await resolveArea({ lat, lon });
          if (r.ok) setAreaLabel(r.guess.areaName || r.guess.label);
        } catch {}
      },
      (err) => {
        setGpsBusy(false);
        setManualGps(true);
        setErrorMsg(
          err.code === err.PERMISSION_DENIED
            ? "Location was blocked. Allow it in the browser's site settings (the padlock icon), or type the address manually below."
            : err.code === err.POSITION_UNAVAILABLE
            ? "Your device couldn't get a fix (common on desktops / indoors). Type the address manually below."
            : "Location request timed out. Try again, or type the address manually below.",
        );
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 },
    );
  };

  const applyManualLocation = async () => {
    const text = manualInput.trim();
    if (!text) return;
    setErrorMsg("");

    // If they pasted plain coordinates, use them directly.
    const coords = text.match(/^\s*(-?\d{1,2}(?:\.\d+)?)\s*[, ]\s*(-?\d{1,3}(?:\.\d+)?)\s*$/);
    if (coords) {
      const lat = parseFloat(coords[1]);
      const lon = parseFloat(coords[2]);
      if (Math.abs(lat) > 90 || Math.abs(lon) > 180) {
        setErrorMsg("Those coordinates are out of range.");
        return;
      }
      setLocation({ lat, lon });
      setLocationLabel("");
      try {
        const r = await resolveArea({ lat, lon });
        if (r.ok) setAreaLabel(r.guess.areaName || r.guess.label);
      } catch {}
      return;
    }

    // Otherwise geocode the address.
    setManualBusy(true);
    const res = await resolveAddress(text);
    setManualBusy(false);
    if (!res.ok) {
      setErrorMsg(res.error);
      return;
    }
    setLocation({ lat: res.lat, lon: res.lon });
    setLocationLabel(res.label);
    setAreaLabel(res.area || "");
  };

  const onPhotoPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoFile(file);
    setPhotoPreview(URL.createObjectURL(file));
    setErrorMsg("");
  };

  const clearPhoto = () => {
    setPhotoFile(null);
    setPhotoPreview(null);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (isCustom && !customCategory.trim()) return setErrorMsg("Type the asset category.");
    if (!department.trim()) return setErrorMsg("Enter the owning department.");
    if (!location) return setErrorMsg("Tag the GPS location.");
    if (!photoFile) return setErrorMsg("Add an installation photo.");

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("category", category);
    formData.append("customCategory", customCategory);
    formData.append("department", department);
    formData.append("warranty", (e.currentTarget.elements.namedItem("warranty") as HTMLSelectElement)?.value || "none");
    formData.append("replacementCost", (e.currentTarget.elements.namedItem("replacementCost") as HTMLInputElement)?.value || "");
    formData.append("area", areaLabel);
    formData.append("gpsLat", location.lat.toString());
    formData.append("gpsLon", location.lon.toString());
    formData.append("photo", photoFile, photoFile.name || "install.jpg");

    const result = await createAsset(formData);
    if (result.success) {
      setSuccessData(result.asset);
    } else {
      setErrorMsg(result.error || "Failed to add asset.");
    }
    setLoading(false);
  };

  /* ---------------- success / QR label ---------------- */
  if (successData) {
    const url = assetUrl(successData.qrCodeId, origin);
    return (
      <div className="dc-surface p-8 flex flex-col items-center text-center">
        <CheckCircle2 className="w-16 h-16 text-success mb-4 dc-no-print" />
        <h2 className="text-2xl font-semibold text-slate-800 mb-2 dc-no-print">Asset registered</h2>
        <p className="text-slate-500 mb-6 dc-no-print">Print this label and fix it to the asset.</p>

        <div
          className="dc-print-card"
          style={{ background: "#fefcf5", border: "1.5px solid #12150f", borderRadius: 18, padding: 20, boxShadow: "5px 6px 0 rgba(13,83,71,.9)", width: 240 }}
        >
          <div className="dc-mono" style={{ marginBottom: 10 }}>DRISHTI Asset Tag</div>
          <div style={{ background: "#fff", padding: 8, borderRadius: 10, border: "1.5px solid #12150f" }}>
            {origin ? <QRCode value={url} size={180} style={{ width: "100%", height: "auto" }} /> : <div style={{ height: 180 }} />}
          </div>
          <p style={{ fontFamily: "var(--font-jetbrains), monospace", fontWeight: 600, fontSize: 15, letterSpacing: ".08em", marginTop: 10 }}>
            {successData.qrCodeId}
          </p>
          <p className="dc-mono" style={{ textTransform: "none", letterSpacing: 0, marginTop: 4 }}>
            Scan for full asset history
          </p>
        </div>

        <div className="dc-surface-soft p-4 mt-6 text-left w-full dc-no-print">
          <div className="dc-mono mb-2 flex items-center gap-1.5"><ScanLine className="w-3 h-3" /> When scanned, anyone sees</div>
          <ul className="text-sm text-slate-600 space-y-1" style={{ listStyle: "disc", paddingLeft: 18 }}>
            <li>When it was installed &amp; which department owns it</li>
            <li>Every repair and routine maintenance, with dates</li>
            <li>Warranty / AMC status and current health</li>
            <li>Open complaints — and a button to report a new one</li>
          </ul>
        </div>

        <p className="text-sm text-slate-500 mt-4 dc-no-print">
          Next maintenance due in {successData.maintenanceIntervalDays} days.
        </p>

        <div className="flex gap-3 mt-6 w-full dc-no-print">
          <button onClick={() => window.print()} className="dc-pill-ghost flex-1" style={{ minHeight: 48 }}>
            <Printer className="w-4 h-4" /> Print label
          </button>
          <button
            onClick={() => { setSuccessData(null); clearPhoto(); setLocation(null); setLocationLabel(""); setAreaLabel(""); setManualGps(false); setManualInput(""); setDeptTouched(false); }}
            className="dc-pill dc-pill-dark flex-1"
            style={{ minHeight: 48 }}
          >
            Add another
          </button>
        </div>
      </div>
    );
  }

  /* ---------------- form ---------------- */
  return (
    <div className="dc-surface p-6 md:p-8">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3" style={{ background: "rgba(178,60,46,.1)", border: "1.5px solid rgba(178,60,46,.3)", color: "#b23c2e" }}>
          <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Category */}
          <div>
            <label className="dc-mono mb-2 block">Category</label>
            <select
              value={category}
              onChange={(e) => onCategoryChange(e.target.value)}
              className="dc-field"
            >
              {ASSET_TYPES.map((t) => (
                <option key={t.value} value={t.value}>{t.label}</option>
              ))}
              <option value="OTHER">Other — type it manually…</option>
            </select>
            {isCustom && (
              <input
                type="text"
                value={customCategory}
                onChange={(e) => setCustomCategory(e.target.value)}
                placeholder="e.g. Cattle water trough"
                className="dc-field mt-2"
              />
            )}
          </div>

          {/* Department (auto-filled from category, still editable) */}
          <div>
            <label className="dc-mono mb-2 flex items-center justify-between">
              <span>Owning department</span>
              {deptTouched && (
                <button
                  type="button"
                  onClick={() => { setDeptTouched(false); setDepartment(isCustom ? "" : getAssetType(category).department); }}
                  className="flex items-center gap-1"
                  style={{ color: "#0d5347" }}
                >
                  <RotateCcw className="w-3 h-3" /> auto
                </button>
              )}
            </label>
            <input
              type="text"
              value={department}
              onChange={(e) => { setDepartment(e.target.value); setDeptTouched(true); }}
              placeholder="e.g. Water Supply Department"
              className="dc-field"
            />
            {!deptTouched && !isCustom && (
              <p className="dc-mono mt-1" style={{ textTransform: "none", letterSpacing: 0 }}>
                Auto-selected for {getAssetType(category).label.toLowerCase()}
              </p>
            )}
          </div>

          {/* Warranty / AMC */}
          <div>
            <label className="dc-mono mb-2 block">AMC / warranty period</label>
            <select name="warranty" defaultValue="none" className="dc-field">
              {WARRANTY_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <p className="dc-mono mt-1" style={{ textTransform: "none", letterSpacing: 0 }}>
              Counted from today; expiry is stored on the asset.
            </p>
          </div>

          {/* Replacement cost */}
          <div>
            <label className="dc-mono mb-2 block">Replacement cost (₹, optional)</label>
            <input type="number" name="replacementCost" min="0" step="1" placeholder="e.g. 18000" className="dc-field" />
          </div>
        </div>

        {/* GPS */}
        <div className="dc-surface-soft p-5" style={location ? { borderColor: "#0d5347" } : undefined}>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className={`w-5 h-5 ${location ? "text-success" : "text-slate-400"}`} />
                Asset GPS location
              </h3>
              <p className="text-sm text-slate-500 mt-1">
                {location
                  ? locationLabel || `${location.lat.toFixed(5)}, ${location.lon.toFixed(5)}`
                  : "Stand exactly at the asset to tag it."}
              </p>
              {location && locationLabel && (
                <p className="dc-mono mt-0.5" style={{ textTransform: "none", letterSpacing: 0 }}>
                  {location.lat.toFixed(5)}, {location.lon.toFixed(5)}
                </p>
              )}
              {location && areaLabel && (
                <span className="dc-badge mt-2" style={{ textTransform: "none", letterSpacing: 0 }}>
                  Area: {areaLabel}
                </span>
              )}
            </div>
            {location ? (
              <button type="button" onClick={captureGPS} disabled={gpsBusy} className="dc-pill-ghost text-sm" style={{ minHeight: 38, padding: "0 16px" }}>
                {gpsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Re-tag"}
              </button>
            ) : (
              <button type="button" onClick={captureGPS} disabled={gpsBusy} className="dc-pill dc-pill-dark text-sm" style={{ minHeight: 40, padding: "0 18px" }}>
                {gpsBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Tag location"}
              </button>
            )}
          </div>

          {!manualGps && (
            <button
              type="button"
              onClick={() => setManualGps(true)}
              className="dc-mono mt-3 inline-block"
              style={{ color: "#0d5347" }}
            >
              Type the address manually
            </button>
          )}

          {manualGps && (
            <div className="mt-4 pt-4" style={{ borderTop: "1.5px solid rgba(18,21,15,.12)" }}>
              <label className="dc-mono mb-2 block">Type an address or landmark</label>
              <div className="flex gap-2 flex-wrap">
                <input
                  type="text"
                  value={manualInput}
                  onChange={(e) => setManualInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); applyManualLocation(); } }}
                  placeholder="e.g. Pole 12, MG Road, Kothrud, Pune"
                  className="dc-field"
                  style={{ flex: "1 1 220px" }}
                />
                <button
                  type="button"
                  onClick={applyManualLocation}
                  disabled={manualBusy}
                  className="dc-pill dc-pill-dark text-sm"
                  style={{ minHeight: 40, padding: "0 18px" }}
                >
                  {manualBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : "Find"}
                </button>
              </div>
              <p className="dc-mono mt-2" style={{ textTransform: "none", letterSpacing: 0 }}>
                Add the area / city so the match is accurate. You can also paste GPS coordinates
                (&ldquo;lat, lon&rdquo;) here.
              </p>
            </div>
          )}
        </div>

        {/* Installation photo — native camera / file picker */}
        <div>
          <label className="dc-mono mb-2 block">Installation photo (day 0)</label>
          {photoPreview ? (
            <div className="dc-surface-soft p-3" style={{ borderColor: "#0d5347" }}>
              <div className="relative rounded-xl overflow-hidden">
                <img src={photoPreview} alt="Installation" className="w-full h-52 object-cover" />
              </div>
              <div className="flex gap-2 mt-3">
                <label className="dc-pill-ghost flex-1 text-sm cursor-pointer" style={{ minHeight: 40 }}>
                  <Camera className="w-4 h-4" /> Retake
                  <input type="file" accept="image/*" capture="environment" onChange={onPhotoPick} className="sr-only" />
                </label>
                <button type="button" onClick={clearPhoto} className="dc-pill-ghost text-sm" style={{ minHeight: 40, padding: "0 16px" }}>
                  Remove
                </button>
              </div>
            </div>
          ) : (
            <label className="dc-surface-soft border-dashed p-8 flex flex-col items-center justify-center gap-2 cursor-pointer text-slate-500 hover:text-primary transition-colors">
              <Camera className="w-10 h-10" />
              <span className="font-semibold text-sm">Take / choose a photo</span>
              <span className="dc-mono" style={{ textTransform: "none", letterSpacing: 0 }}>
                Opens the camera on a phone
              </span>
              <input type="file" accept="image/*" capture="environment" onChange={onPhotoPick} className="sr-only" />
            </label>
          )}
        </div>

        <div className="dc-surface-soft p-4 flex items-start gap-2.5">
          <ScanLine className="w-4 h-4 text-primary shrink-0 mt-0.5" />
          <p className="text-sm text-slate-600">
            A permanent QR code is generated on save. Print it and fix it to the asset — scanning it
            opens the asset&apos;s full public record (install date, every service, warranty, open complaints).
          </p>
        </div>

        <button type="submit" disabled={loading} className="dc-pill w-full" style={{ minHeight: 56, fontSize: 16 }}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register asset & generate QR"}
        </button>
      </form>
    </div>
  );
}
