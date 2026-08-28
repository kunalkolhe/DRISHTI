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
    <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
      
      <div className="mb-8 border-b border-gray-50 pb-6">
        <h2 className="text-2xl font-display font-extrabold text-primary mb-2">Register Public Asset</h2>
        <p className="text-slate-500 text-sm">Create a new Digital Twin in the DRISHTI system.</p>
      </div>

      {successMsg && (
        <div className="mb-8 p-4 bg-success/10 border border-success/20 text-success rounded-xl flex items-center gap-3">
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
            <select name="category" required className="w-full bg-background border border-gray-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3.5 outline-none transition-shadow">
              {Object.values(AssetCategory).map((cat) => (
                <option key={cat} value={cat}>{cat.replace("_", " ")}</option>
              ))}
            </select>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              Owning Department
            </label>
            <input type="text" name="department" required placeholder="e.g. Electrical Dept." className="w-full bg-background border border-gray-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3.5 outline-none transition-shadow" />
          </div>
        </div>

        {/* GPS Coordinates */}
        <div className="bg-background p-6 rounded-xl border border-gray-100 space-y-4">
          <h3 className="text-sm font-bold text-slate-800 flex items-center gap-2">
            <MapPin className="w-4 h-4 text-slate-400" />
            Geolocation Data
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Latitude</label>
              <input type="number" step="any" name="gpsLat" required placeholder="19.0760" className="w-full bg-white border border-gray-200 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block p-3 outline-none transition-shadow" />
            </div>
            <div className="space-y-2">
              <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Longitude</label>
              <input type="number" step="any" name="gpsLon" required placeholder="72.8777" className="w-full bg-white border border-gray-200 text-slate-800 text-sm rounded-lg focus:ring-2 focus:ring-primary focus:border-primary block p-3 outline-none transition-shadow" />
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
            <input type="text" name="warrantyStatus" placeholder="Valid till 2028" className="w-full bg-background border border-gray-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3.5 outline-none transition-shadow" />
          </div>
          
          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-800 flex items-center gap-2">
              <DollarSign className="w-4 h-4 text-slate-400" />
              Replacement Cost (₹)
            </label>
            <input type="number" name="replacementCost" placeholder="15000" className="w-full bg-background border border-gray-200 text-slate-800 text-sm rounded-xl focus:ring-2 focus:ring-primary focus:border-primary block p-3.5 outline-none transition-shadow" />
          </div>
        </div>

        {/* Submit Button */}
        <button 
          type="submit" 
          disabled={loading}
          className="w-full mt-4 bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl shadow-md shadow-primary/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70"
        >
          {loading ? (
            <><Loader2 className="w-5 h-5 animate-spin" /> Minting Digital Twin...</>
          ) : (
            "Create Digital Twin"
          )}
        </button>

      </form>
    </div>
  );
}
