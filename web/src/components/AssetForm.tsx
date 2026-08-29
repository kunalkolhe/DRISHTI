"use client";

import { useState } from "react";
import { createAsset } from "@/app/actions/asset";
import { MapPin, Settings2, ShieldCheck, DollarSign, Loader2, CheckCircle2 } from "lucide-react";
import { AssetCategory } from "@prisma/client";

export default function AssetForm() {
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");

  async function handleSubmit(formData: FormData) {
    setLoading(true);
    setSuccessMsg("");
    
    const result = await createAsset(formData);
    
    if (result.success && result.asset) {
      setSuccessMsg(`Asset registered successfully! Digital Twin ID: ${result.asset.qrCodeId}`);
    } else {
      alert("Failed to register asset. Check console.");
    }
    
    setLoading(false);
  }

  return (
    <div className="max-w-2xl mx-auto dc-surface p-8">

      <div className="mb-8 pb-6" style={{ borderBottom: "1.5px solid rgba(18,21,15,.14)" }}>
        <h2 className="text-2xl font-display font-semibold text-primary mb-2" style={{ letterSpacing: "-0.04em" }}>Register public asset</h2>
        <p className="text-slate-500 text-sm">Create a new digital twin in the DRISHTI system.</p>
      </div>

      {successMsg && (
        <div className="mb-8 p-4 rounded-xl flex items-center gap-3" style={{ background: "rgba(13,83,71,.1)", border: "1.5px solid rgba(13,83,71,.3)", color: "#0d5347" }}>
          <CheckCircle2 className="w-5 h-5 shrink-0" />
          <span className="font-semibold text-sm">{successMsg}</span>
        </div>
      )}

      <form action={handleSubmit} className="space-y-8">
        
        {/* Category & Department */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <Settings2 className="w-4 h-4 text-slate-400" />
              Asset Category
            </label>
            <select name="category" required className="dc-field">
              {Object.values(AssetCategory).map((cat) => (
                <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Owning Department
            </label>
            <input type="text" name="department" required placeholder="e.g. Electrical Dept." className="dc-field" />
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="dc-surface-soft p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Geolocation Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latitude</label>
              <input type="number" step="any" name="gpsLat" required placeholder="19.0760" className="dc-field" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Longitude</label>
              <input type="number" step="any" name="gpsLon" required placeholder="72.8777" className="dc-field" />
            </div>
          </div>
        </div>

        {/* Warranty & Cost */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-slate-400" />
              Warranty / AMC Status
            </label>
            <input type="text" name="warrantyStatus" placeholder="Valid till 2028" className="dc-field" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Replacement Cost (₹)
            </label>
            <input type="number" name="replacementCost" placeholder="15000" className="dc-field" />
          </div>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={loading}
          className="dc-pill w-full mt-4"
          style={{ minHeight: 56, fontSize: 16 }}
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Minting digital twin…</>
          ) : (
            "Create digital twin"
          )}
        </button>

      </form>
    </div>
  );
}
