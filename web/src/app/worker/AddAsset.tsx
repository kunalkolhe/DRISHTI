"use client";

import { useState, useRef } from "react";
import { createAsset } from "@/app/actions/asset";
import { Loader2, Camera, MapPin, CheckCircle2, QrCode, AlertCircle } from "lucide-react";
import QRCode from "react-qr-code";

export default function AddAsset() {
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successData, setSuccessData] = useState<any>(null);

  // GPS State
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude }),
        (err) => setErrorMsg("Could not access GPS. Please ensure location services are enabled.")
      );
    } else {
      setErrorMsg("Geolocation is not supported by this browser.");
    }
  };

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

  const retakePhoto = () => {
    setCapturedPhoto(null);
    setPhotoPreview(null);
    startCamera();
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!location) return setErrorMsg("You must tag the GPS location.");
    if (!capturedPhoto) return setErrorMsg("You must upload an installation photo.");

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData(e.currentTarget);
    formData.append("gpsLat", location.lat.toString());
    formData.append("gpsLon", location.lon.toString());
    formData.append("photo", capturedPhoto, "install.webp");

    const result = await createAsset(formData);
    
    if (result.success) {
      setSuccessData(result.asset);
    } else {
      setErrorMsg(result.error || "Failed to add asset.");
    }
    setLoading(false);
  };

  if (successData) {
    return (
      <div className="dc-surface p-8 flex flex-col items-center text-center">
        <CheckCircle2 className="w-16 h-16 text-success mb-4" />
        <h2 className="text-2xl font-semibold text-slate-800 mb-2">Asset registered</h2>
        <p className="text-slate-500 mb-8">Print or fix this QR code to the physical asset.</p>

        <div className="p-4 rounded-2xl inline-block mb-4" style={{ background: "#fefcf5", border: "1.5px solid #12150f", boxShadow: "5px 6px 0 rgba(13,83,71,.9)" }}>
          <QRCode value={successData.qrCodeId} size={150} />
        </div>
        <p className="dc-badge" style={{ fontSize: 15, letterSpacing: ".12em" }}>
          {successData.qrCodeId}
        </p>

        <p className="text-sm text-slate-500 mt-6">Next maintenance due in {successData.maintenanceIntervalDays} days.</p>

        <button onClick={() => { setSuccessData(null); setCapturedPhoto(null); setPhotoPreview(null); setLocation(null); }} className="dc-pill-dark dc-pill mt-8 w-full" style={{ minHeight: 50 }}>
          Add another asset
        </button>
      </div>
    );
  }

  return (
    <div className="dc-surface p-6 md:p-8">
      {errorMsg && (
        <div className="mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3" style={{ background: "rgba(178,60,46,.1)", border: "1.5px solid rgba(178,60,46,.3)", color: "#b23c2e" }}>
          <AlertCircle className="w-5 h-5 shrink-0" /> {errorMsg}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="dc-mono mb-2 block">Category</label>
            <select name="category" required className="dc-field">
              <option value="STREETLIGHT">Streetlight</option>
              <option value="HANDPUMP">Handpump</option>
              <option value="OPEN_GYM">Open Gym</option>
              <option value="SOLAR_LIGHT">Solar Light</option>
              <option value="CCTV">CCTV Camera</option>
              <option value="PUBLIC_TOILET">Public Toilet</option>
            </select>
          </div>
          <div>
            <label className="dc-mono mb-2 block">Department</label>
            <input type="text" name="department" required placeholder="e.g. Water Dept, PW Dept" className="dc-field" />
          </div>
          <div className="md:col-span-2">
            <label className="dc-mono mb-2 block">AMC / warranty details</label>
            <input type="text" name="warrantyStatus" placeholder="e.g. 1 Year Warranty by Vendor XYZ" className="dc-field" />
          </div>
        </div>

        {/* GPS Capture */}
        <div className="dc-surface-soft p-5" style={location ? { borderColor: "#0d5347" } : undefined}>
          <div className="flex justify-between items-center gap-4 flex-wrap">
            <div>
              <h3 className="font-semibold text-slate-800 flex items-center gap-2">
                <MapPin className={`w-5 h-5 ${location ? 'text-success' : 'text-slate-400'}`} />
                Asset GPS location
              </h3>
              <p className="text-sm text-slate-500 mt-1">Stand exactly at the asset to tag it.</p>
            </div>
            {location ? (
              <span className="dc-badge">Tagged</span>
            ) : (
              <button type="button" onClick={captureGPS} className="dc-pill dc-pill-dark text-sm" style={{ minHeight: 40, padding: "0 18px" }}>
                Tag location
              </button>
            )}
          </div>
        </div>

        {/* Camera Capture */}
        <div>
          <label className="dc-mono mb-2 block">Installation photo (day 0)</label>
          <div className={`dc-surface-soft p-6 flex flex-col items-center justify-center min-h-[200px] ${photoPreview ? '' : 'border-dashed'}`} style={photoPreview ? { borderColor: "#0d5347" } : undefined}>
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden w-full max-w-sm">
                <img src={photoPreview} alt="Install" className="w-full h-48 object-cover" />
                <button type="button" onClick={retakePhoto} className="absolute bottom-2 right-2 bg-white/90 text-slate-800 px-3 py-1 rounded-lg font-bold text-xs shadow-md">Retake</button>
              </div>
            ) : isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden w-full max-w-sm bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
                <button type="button" onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-800 px-6 py-2 rounded-full font-bold text-sm shadow-lg">Capture</button>
              </div>
            ) : (
              <button type="button" onClick={startCamera} className="text-slate-500 hover:text-primary transition-colors flex flex-col items-center gap-2 font-bold">
                <Camera className="w-10 h-10 mb-2" /> Open Camera
              </button>
            )}
            <canvas ref={canvasRef} className="hidden" />
          </div>
        </div>

        <button type="submit" disabled={loading || !location || !capturedPhoto} className="dc-pill w-full" style={{ minHeight: 56, fontSize: 16 }}>
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "Register asset & generate QR"}
        </button>

      </form>
    </div>
  );
}
