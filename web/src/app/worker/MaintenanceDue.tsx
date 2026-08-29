"use client";

import { useState, useRef } from "react";
import { logMaintenance } from "@/app/actions/asset";
import { Loader2, Camera, CheckCircle2, AlertTriangle, PenTool } from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";

export default function MaintenanceDue({ assets }: { assets: any[] }) {
  const router = useRouter();
  const [activeAssetId, setActiveAssetId] = useState<number | null>(null);
  
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [notes, setNotes] = useState("");

  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: "environment" } });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setErrorMsg("Camera access denied.");
    }
  };

  const capturePhoto = () => {
    if (videoRef.current && canvasRef.current) {
      const context = canvasRef.current.getContext("2d");
      if (context) {
        canvasRef.current.width = videoRef.current.videoWidth;
        canvasRef.current.height = videoRef.current.videoHeight;
        context.drawImage(videoRef.current, 0, 0);
        
        canvasRef.current.toBlob((blob) => {
          if (blob) {
            setCapturedPhoto(blob);
            setPhotoPreview(URL.createObjectURL(blob));
            setIsCameraActive(false);
            const stream = videoRef.current?.srcObject as MediaStream;
            stream?.getTracks().forEach(track => track.stop());
          }
        }, "image/webp", 0.8);
      }
    }
  };

  const handleSubmit = async () => {
    if (!activeAssetId) return;
    if (!capturedPhoto) return setErrorMsg("A photo of the completed maintenance is required.");

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("assetId", activeAssetId.toString());
    formData.append("photo", capturedPhoto, "maintenance.webp");
    formData.append("notes", notes);

    const result = await logMaintenance(formData);
    
    if (result.success) {
      setActiveAssetId(null);
      setCapturedPhoto(null);
      setPhotoPreview(null);
      setNotes("");
      router.refresh(); // Refresh page to update list
    } else {
      setErrorMsg(result.error || "Failed to log maintenance.");
      setLoading(false);
    }
  };

  if (assets.length === 0) {
    return (
      <div className="p-12 text-center dc-surface flex flex-col items-center">
        <CheckCircle2 className="w-16 h-16 text-success/50 mb-4" />
        <h3 className="font-semibold text-xl text-slate-800">All caught up</h3>
        <p className="text-slate-500 mt-1">No assets require proactive maintenance right now.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      {assets.map(asset => (
        <div key={asset.id} className="dc-surface overflow-hidden flex flex-col" style={{ padding: 0 }}>
          <div className="h-48 bg-slate-100 relative w-full">
            {asset.photoUrl ? (
              <Image src={asset.photoUrl.startsWith('http') ? asset.photoUrl : `/${asset.photoUrl}`} alt="Asset" fill className="object-cover" />
            ) : (
              <div className="absolute inset-0 flex items-center justify-center text-slate-300">No Installation Photo</div>
            )}
            
            <div className="absolute top-3 left-3">
              <span className="px-3 py-1.5 text-xs font-bold uppercase tracking-wider rounded-lg shadow-sm backdrop-blur-md bg-alert text-white flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Due for Service
              </span>
            </div>
          </div>
          
          <div className="p-6 flex-grow flex flex-col justify-between">
            <div>
              <h3 className="font-bold text-lg text-slate-800 mb-1">{asset.category.replace('_', ' ')}</h3>
              <p className="text-sm text-slate-500">QR Tag: <span className="font-mono font-bold">{asset.qrCodeId}</span></p>
              
              <div className="mt-4 p-3 bg-slate-50 rounded-xl border border-gray-100 text-sm">
                <p><span className="font-bold text-slate-700">Interval:</span> Every {asset.maintenanceIntervalDays} days</p>
                <p><span className="font-bold text-slate-700">Last Serviced:</span> {new Date(asset.lastMaintenanceDate).toLocaleDateString()}</p>
              </div>
            </div>
            
            {activeAssetId === asset.id ? (
              <div className="mt-6 pt-6 border-t border-gray-100 space-y-4">
                <h4 className="font-bold text-sm text-slate-800">Log Maintenance Report</h4>
                
                {errorMsg && <p className="text-alert text-xs font-bold">{errorMsg}</p>}

                {/* Photo Capture Mini */}
                <div className={`p-4 rounded-xl border ${photoPreview ? 'border-success bg-success/5' : 'border-dashed border-gray-300'}`}>
                  {photoPreview ? (
                     <div className="relative rounded-lg overflow-hidden h-24">
                       <img src={photoPreview} alt="Proof" className="w-full h-full object-cover" />
                     </div>
                  ) : isCameraActive ? (
                     <div className="relative rounded-lg overflow-hidden h-24 bg-black">
                       <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                       <button onClick={capturePhoto} className="absolute inset-0 flex items-center justify-center text-white font-bold bg-black/20 hover:bg-black/40">Capture</button>
                     </div>
                  ) : (
                    <button onClick={startCamera} className="w-full py-4 flex flex-col items-center justify-center gap-2 text-slate-500 hover:text-primary transition-colors text-xs font-bold">
                      <Camera className="w-6 h-6" /> Take Proof Photo
                    </button>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>

                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Notes (e.g. cleaned panels, tightened bolts...)"
                  className="dc-field resize-none"
                  style={{ height: 64, fontSize: 14 }}
                />

                <div className="flex gap-2">
                  <button onClick={() => { setActiveAssetId(null); setPhotoPreview(null); setNotes(""); }} className="dc-pill-ghost flex-1 text-sm" style={{ minHeight: 40 }}>Cancel</button>
                  <button onClick={handleSubmit} disabled={loading || !capturedPhoto} className="dc-pill flex-1 text-sm" style={{ minHeight: 40 }}>
                    {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Submit log"}
                  </button>
                </div>
              </div>
            ) : (
              <button onClick={() => setActiveAssetId(asset.id)} className="dc-pill dc-pill-dark mt-6 w-full text-sm" style={{ minHeight: 48 }}>
                <PenTool className="w-4 h-4" /> Log service
              </button>
            )}
            
          </div>
        </div>
      ))}
    </div>
  );
}
