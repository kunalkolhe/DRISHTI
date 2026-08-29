"use client";

import { useState, useRef, useEffect } from "react";
import { resolveComplaint } from "@/app/actions/complaint";
import { Loader2, Camera, AlertCircle, CheckCircle2, MapPin, Navigation, QrCode, X, Type } from "lucide-react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

// Haversine formula to calculate distance in meters between two coordinates
function getDistanceFromLatLonInMeters(lat1: number, lon1: number, lat2: number, lon2: number) {
  const R = 6371e3; // Radius of the earth in m
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * (Math.PI / 180)) * Math.cos(lat2 * (Math.PI / 180)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a)); 
  return R * c; 
}

export default function ResolveClient({ complaintId, assetQrCodeId }: { complaintId: number, assetQrCodeId: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");
  
  // Stages
  const [qrScanned, setQrScanned] = useState(assetQrCodeId === null); // Auto-pass if no asset
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isLocationVerified, setIsLocationVerified] = useState(false);
  
  // Camera State
  const [isCameraActive, setIsCameraActive] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [capturedPhoto, setCapturedPhoto] = useState<Blob | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [notes, setNotes] = useState("");

  // QR Scanner initialization
  useEffect(() => {
    if (showQRScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(
        (decodedText) => {
          if (decodedText === assetQrCodeId) {
            setQrScanned(true);
            setShowQRScanner(false);
            scanner.clear();
          } else {
            setErrorMsg(`Incorrect QR Code. Scanned: ${decodedText}. Expected: ${assetQrCodeId}`);
          }
        },
        (error) => { /* ignore */ }
      );

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [showQRScanner, assetQrCodeId]);

  const verifyLocation = () => {
    setLoading(true);
    setErrorMsg("");
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setIsLocationVerified(true);
          setLoading(false);
        },
        (err) => {
          setErrorMsg("Could not verify location. Please enable GPS permissions.");
          setLoading(false);
        },
        { enableHighAccuracy: true }
      );
    } else {
      setErrorMsg("Geolocation not supported by this browser.");
      setLoading(false);
    }
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: { facingMode: "environment" } 
      });
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        setIsCameraActive(true);
      }
    } catch (err) {
      setErrorMsg("Camera access denied or unavailable.");
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
            
            // Stop camera stream
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

  const handleSubmit = async () => {
    if (!qrScanned) return setErrorMsg("You must scan the asset QR code.");
    if (!isLocationVerified) return setErrorMsg("You must verify your GPS location.");
    if (!capturedPhoto) return setErrorMsg("You must upload a repair photo.");

    setLoading(true);
    setErrorMsg("");
    
    const formData = new FormData();
    formData.append("complaintId", complaintId.toString());
    formData.append("photo", capturedPhoto, "repair.webp");
    formData.append("notes", notes);

    const result = await resolveComplaint(formData);
    
    if (result.success) {
      setSuccessMsg("Issue marked as FIXED! Waiting for citizen confirmation.");
      setTimeout(() => router.push("/worker"), 2500);
    } else {
      setErrorMsg(result.error || "Failed to resolve issue.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen py-12 px-6" style={{ background: "#eee8da" }}>
      <div className="max-w-xl mx-auto dc-surface overflow-hidden p-8">

        <div className="mb-8">
          <div className="dc-eyebrow mb-3">Proof-based closure</div>
          <h1 className="text-2xl font-display font-semibold text-slate-800" style={{ letterSpacing: "-0.04em" }}>Resolve issue #{complaintId}</h1>
          <p className="text-slate-500 mt-2">Every step must pass. No proof, no closure.</p>
        </div>

        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3" style={{ background: "rgba(178,60,46,.1)", border: "1.5px solid rgba(178,60,46,.3)", color: "#b23c2e" }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3" style={{ background: "rgba(13,83,71,.1)", border: "1.5px solid rgba(13,83,71,.3)", color: "#0d5347" }}>
            <CheckCircle2 className="w-5 h-5 shrink-0" />
            {successMsg}
          </div>
        )}

        <div className="space-y-8">

          {/* Step 0: QR Scanner if asset attached */}
          {assetQrCodeId !== null && (
            <div className={`p-6 rounded-2xl border ${qrScanned ? 'border-success bg-success/5' : 'border-gray-200'}`}>
              <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
                <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${qrScanned ? 'bg-success' : 'bg-slate-300'}`}>1</span>
                Scan QR Code
              </h3>
              <p className="text-sm text-slate-500 mb-4">Confirm you are at the correct asset.</p>
              
              {qrScanned ? (
                <div className="flex items-center gap-2 text-success font-bold text-sm bg-white py-2 px-4 rounded-lg inline-flex border border-success/20">
                  <QrCode className="w-4 h-4" /> QR Verified
                </div>
              ) : (
                <button 
                  onClick={() => setShowQRScanner(true)}
                  className="dc-pill dc-pill-dark py-3 px-5 text-sm"
                >
                  <QrCode className="w-4 h-4" /> Scan Asset Tag
                </button>
              )}
            </div>
          )}
          
          {/* Step 1: GPS Verification */}
          <div className={`p-6 rounded-2xl border ${isLocationVerified ? 'border-success bg-success/5' : 'border-gray-200'} ${!qrScanned && 'opacity-50 pointer-events-none'}`}>
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${isLocationVerified ? 'bg-success' : 'bg-slate-300'}`}>{assetQrCodeId ? '2' : '1'}</span>
              GPS Geofencing
            </h3>
            <p className="text-sm text-slate-500 mb-4">Confirm your physical presence.</p>
            
            {isLocationVerified ? (
              <div className="flex items-center gap-2 text-success font-bold text-sm bg-white py-2 px-4 rounded-lg inline-flex border border-success/20">
                <MapPin className="w-4 h-4" /> Location Verified
              </div>
            ) : (
              <button 
                onClick={verifyLocation}
                disabled={loading}
                className="dc-pill dc-pill-dark py-3 px-5 text-sm"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Navigation className="w-4 h-4" />}
                Verify My Location
              </button>
            )}
          </div>

          {/* Step 2: Repair Photo */}
          <div className={`p-6 rounded-2xl border ${(isLocationVerified && capturedPhoto) ? 'border-success bg-success/5' : 'border-gray-200'} ${!isLocationVerified && 'opacity-50 pointer-events-none'}`}>
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${(isLocationVerified && capturedPhoto) ? 'bg-success' : 'bg-slate-300'}`}>{assetQrCodeId ? '3' : '2'}</span>
              Repair Evidence
            </h3>
            <p className="text-sm text-slate-500 mb-4">Capture a clear photo of the fixed infrastructure.</p>
            
            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden mb-4">
                <img src={photoPreview} alt="Repair" className="w-full h-48 object-cover" />
                <button onClick={retakePhoto} className="absolute bottom-4 right-4 bg-white/90 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-md">
                  Retake Photo
                </button>
              </div>
            ) : isCameraActive ? (
              <div className="relative rounded-xl overflow-hidden mb-4 bg-black">
                <video ref={videoRef} autoPlay playsInline className="w-full h-48 object-cover" />
                <button onClick={capturePhoto} className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-white text-slate-800 px-6 py-2 rounded-full font-bold text-sm shadow-lg">
                  Capture
                </button>
              </div>
            ) : (
              <button 
                onClick={startCamera}
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-12 px-5 rounded-xl transition-all flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300"
              >
                <Camera className="w-8 h-8 text-slate-400" />
                <span>Open Camera</span>
              </button>
            )}
            
            <canvas ref={canvasRef} className="hidden" />
          </div>

          {/* Notes */}
          <div className={`p-6 rounded-2xl border border-gray-200 ${!capturedPhoto && 'opacity-50 pointer-events-none'}`}>
             <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white bg-slate-800`}>{assetQrCodeId ? '4' : '3'}</span>
              Worker Notes <span className="text-slate-400 font-normal ml-2 text-xs">(Optional)</span>
            </h3>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="E.g. replaced bulb, repainted pole..."
              className="dc-field resize-none"
              style={{ height: 96 }}
            />
          </div>

          {/* Submit */}
          <button
            onClick={handleSubmit}
            disabled={!qrScanned || !isLocationVerified || !capturedPhoto || loading}
            className="dc-pill w-full"
            style={{ minHeight: 56, fontSize: 17 }}
          >
            {loading && successMsg === "" ? <Loader2 className="w-5 h-5 animate-spin" /> : "Mark as fixed"}
          </button>

        </div>
      </div>

      {/* QR Scanner Modal Overlay */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6">
          <button onClick={() => setShowQRScanner(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div id="reader" className="w-full bg-black"></div>
            <div className="p-4 text-center bg-white">
              <p className="font-bold text-slate-800">Scan Asset QR</p>
              <p className="text-xs text-slate-500">Scan the QR code to verify you are at the correct location.</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
