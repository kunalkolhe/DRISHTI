"use client";

import { useState, useEffect } from "react";
import { resolveComplaint } from "@/app/actions/complaint";
import { Loader2, Camera, AlertCircle, CheckCircle2, MapPin, Navigation, QrCode, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import { extractAssetCode } from "@/lib/qr";

export default function ResolveClient({ complaintId, assetQrCodeId }: { complaintId: number, assetQrCodeId: string | null }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  // Stages
  const [qrScanned, setQrScanned] = useState(assetQrCodeId === null); // Auto-pass if no asset
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [isLocationVerified, setIsLocationVerified] = useState(false);

  // Repair proof photo — a native file input opens the camera on mobile and
  // a file picker on desktop, with none of the getUserMedia/<video> ref
  // timing issues.
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);

  const [notes, setNotes] = useState("");

  // QR Scanner initialization
  useEffect(() => {
    if (showQRScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(
        (decodedText) => {
          const scannedCode = extractAssetCode(decodedText);
          if (scannedCode === assetQrCodeId) {
            setQrScanned(true);
            setShowQRScanner(false);
            scanner.clear();
          } else {
            setErrorMsg(`Incorrect QR Code. Scanned: ${scannedCode}. Expected: ${assetQrCodeId}`);
          }
        },
        () => { /* ignore frequent scan errors */ }
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
        () => {
          setIsLocationVerified(true);
          setLoading(false);
        },
        () => {
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

  const handleSubmit = async () => {
    if (!qrScanned) return setErrorMsg("You must scan the asset QR code.");
    if (!isLocationVerified) return setErrorMsg("You must verify your GPS location.");
    if (!photoFile) return setErrorMsg("You must upload a repair photo.");

    setLoading(true);
    setErrorMsg("");

    const formData = new FormData();
    formData.append("complaintId", complaintId.toString());
    formData.append("photo", photoFile, photoFile.name || "repair.jpg");
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
          <div className={`p-6 rounded-2xl border ${(isLocationVerified && photoFile) ? 'border-success bg-success/5' : 'border-gray-200'} ${!isLocationVerified && 'opacity-50 pointer-events-none'}`}>
            <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs text-white ${(isLocationVerified && photoFile) ? 'bg-success' : 'bg-slate-300'}`}>{assetQrCodeId ? '3' : '2'}</span>
              Repair Evidence
            </h3>
            <p className="text-sm text-slate-500 mb-4">Capture a clear photo of the fixed infrastructure.</p>

            {photoPreview ? (
              <div className="relative rounded-xl overflow-hidden mb-4">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoPreview} alt="Repair" className="w-full h-48 object-cover" />
                <div className="absolute bottom-4 right-4 flex gap-2">
                  <label className="bg-white/90 text-slate-800 px-4 py-2 rounded-lg font-bold text-sm backdrop-blur-md cursor-pointer">
                    Retake Photo
                    <input type="file" accept="image/*" capture="environment" onChange={onPhotoPick} className="sr-only" />
                  </label>
                  <button onClick={clearPhoto} className="bg-white/90 text-alert px-3 py-2 rounded-lg font-bold text-sm backdrop-blur-md">
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ) : (
              <label
                className="bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold py-12 px-5 rounded-xl transition-all flex flex-col items-center justify-center gap-2 w-full border-2 border-dashed border-gray-300 cursor-pointer"
              >
                <Camera className="w-8 h-8 text-slate-400" />
                <span>Take / choose a photo</span>
                <input type="file" accept="image/*" capture="environment" onChange={onPhotoPick} className="sr-only" />
              </label>
            )}
          </div>

          {/* Notes */}
          <div className={`p-6 rounded-2xl border border-gray-200 ${!photoFile && 'opacity-50 pointer-events-none'}`}>
             <h3 className="font-bold text-slate-800 mb-2 flex items-center gap-2">
              <span className="w-6 h-6 rounded-full flex items-center justify-center text-xs text-white bg-slate-800">{assetQrCodeId ? '4' : '3'}</span>
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
            disabled={!qrScanned || !isLocationVerified || !photoFile || loading}
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
