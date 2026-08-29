"use client";

import { useState, useRef, useEffect } from "react";
import { createComplaint } from "@/app/actions/complaint";
import { Camera, AlertCircle, QrCode, Loader2, CheckCircle2, ChevronRight, Mic, Square, X, Type, FileAudio, MapPin } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get("asset") || "";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // States
  const [assetId, setAssetId] = useState(initialAssetId);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);
  
  const [photoPreview, setPhotoPreview] = useState<string | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const speechRecognitionRef = useRef<any>(null); // For Speech-to-Text

  // Initialize QR Scanner when modal opens
  useEffect(() => {
    if (showQRScanner) {
      const scanner = new Html5QrcodeScanner("reader", { fps: 10, qrbox: { width: 250, height: 250 } }, false);
      scanner.render(
        (decodedText) => {
          setAssetId(decodedText);
          setShowQRScanner(false);
          scanner.clear();
        },
        (error) => { /* ignore frequent scan errors */ }
      );

      return () => {
        scanner.clear().catch(e => console.error("Failed to clear scanner", e));
      };
    }
  }, [showQRScanner]);

  // Setup SpeechRecognition
  useEffect(() => {
    if (typeof window !== "undefined") {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (SpeechRecognition) {
        const recognition = new SpeechRecognition();
        recognition.continuous = true;
        recognition.interimResults = true; // Show text as they speak
        
        recognition.onresult = (event: any) => {
          let finalTranscript = "";
          for (let i = event.resultIndex; i < event.results.length; ++i) {
            if (event.results[i].isFinal) {
              finalTranscript += event.results[i][0].transcript;
            }
          }
          if (finalTranscript) {
             // Append to description natively
             setDescription(prev => (prev ? prev + " " + finalTranscript : finalTranscript).trim());
          }
        };

        recognition.onerror = (e: any) => console.log("Speech recognition error", e);
        speechRecognitionRef.current = recognition;
      }
    }
  }, []);

  // Handle Native Photo Capture
  const handlePhotoCapture = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setPhotoFile(file);
      setPhotoPreview(URL.createObjectURL(file));
      setAudioBlob(null); 
      setAudioUrl(null);
    }
  };

  // Handle Voice Recording & Speech-to-Text
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => audioChunksRef.current.push(e.data);
      recorder.onstop = () => {
        const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        setAudioBlob(blob);
        setAudioUrl(URL.createObjectURL(blob));
        setPhotoFile(null);
        setPhotoPreview(null);
      };

      recorder.start();
      setIsRecording(true);
      
      // Start Speech-to-Text concurrently
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.start();
      }
    } catch (err) {
      alert("Microphone access denied or not available.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Stop Speech-to-Text
      if (speechRecognitionRef.current) {
        speechRecognitionRef.current.stop();
      }
    }
  };

  // Clear Audio
  const clearAudio = () => {
    setAudioBlob(null);
    setAudioUrl(null);
  };

  const captureGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLocation({ lat: pos.coords.latitude, lon: pos.coords.longitude });
          setAddress(`GPS Location Attached (${pos.coords.latitude.toFixed(4)}, ${pos.coords.longitude.toFixed(4)})`);
        },
        (err) => alert("Could not access GPS. Please ensure location services are enabled.")
      );
    } else {
      alert("Geolocation is not supported by this browser.");
    }
  };

  // Handle Submission
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");
    
    const formData = new FormData(e.currentTarget);
    formData.append("description", description);
    
    if (photoFile) {
      formData.append("photo", photoFile);
    }
    if (audioBlob) {
      formData.append("voice", new File([audioBlob], "voice_note.webm", { type: "audio/webm" }));
    }

    if (location) {
      formData.append("gpsLat", location.lat.toString());
      formData.append("gpsLon", location.lon.toString());
    }

    const result = await createComplaint(formData);
    
    if (result.success) {
      setSuccess(true);
    } else {
      setErrorMsg(result.error || "Failed to submit.");
    }
    setLoading(false);
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#eee8da" }}>
        <div className="dc-surface p-8 max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 rounded-full flex items-center justify-center" style={{ background: "#dee8c4", border: "1.5px solid rgba(13,83,71,.4)" }}>
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold text-primary mb-2">Report logged</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Your report is permanently bound to the asset&apos;s digital twin. The SLA clock started at capture time.</p>
          </div>
          <button onClick={() => { setSuccess(false); setPhotoFile(null); setAudioBlob(null); setAudioUrl(null); setDescription(""); }} className="dc-pill w-full" style={{ minHeight: 52 }}>
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col max-w-md mx-auto relative pb-24" style={{ background: "#eee8da", borderLeft: "1.5px solid rgba(18,21,15,.14)", borderRight: "1.5px solid rgba(18,21,15,.14)" }}>

      <header className="p-6 sticky top-0 z-10 flex items-center justify-between" style={{ background: "#eee8da", borderBottom: "1.5px solid rgba(18,21,15,.16)" }}>
        <h1 className="font-display font-semibold text-xl text-primary">Report an issue</h1>
        {location && (
          <div className="dc-badge">
            <MapPin className="w-3 h-3" /> GPS tagged
          </div>
        )}
      </header>

      <main className="flex-grow p-6">
        {errorMsg && (
          <div className="mb-6 p-4 rounded-xl text-sm font-medium flex items-center gap-3" style={{ background: "rgba(178,60,46,.1)", border: "1.5px solid rgba(178,60,46,.3)", color: "#b23c2e" }}>
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" id="report-form">
          
          <div className="space-y-6">
            
            {/* QR Scanner Field */}
            <div>
              <label className="mb-2 flex justify-between items-center">
                <span className="dc-mono">Asset ID (optional)</span>
                <button type="button" onClick={() => setShowQRScanner(true)} className="dc-mono flex items-center gap-1" style={{ color: "#0d5347" }}>
                  <QrCode className="w-3 h-3" /> Scan QR
                </button>
              </label>
              <input
                type="text"
                name="qrCodeId"
                value={assetId}
                onChange={(e) => setAssetId(e.target.value)}
                placeholder="Scan QR or enter ID"
                className="dc-field"
                style={{ fontFamily: "var(--font-jetbrains), monospace" }}
              />
            </div>

            {/* Manual Location Field */}
            <div>
              <label className="mb-2 flex justify-between items-center">
                <span className="dc-mono">Location description</span>
                <button type="button" onClick={captureGPS} className="dc-mono flex items-center gap-1" style={{ color: location ? "#0d5347" : "#b5762a" }}>
                  <MapPin className="w-3 h-3" /> {location ? "GPS tagged" : "Use GPS"}
                </button>
              </label>
              <input
                type="text"
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="e.g. Opposite Central Station, near main gate"
                className="dc-field"
              />
            </div>

            {/* Severity Select */}
            <div>
              <label className="dc-mono mb-2 block">Severity</label>
              <select name="severity" required className="dc-field">
                <option value="LOW">Low — minor damage, still functional</option>
                <option value="MEDIUM">Medium — partially broken</option>
                <option value="HIGH">High — completely broken / dangerous</option>
              </select>
            </div>

            {/* Text Description (Auto-populated by Voice) */}
            <div>
              <label className="dc-mono mb-2 flex items-center gap-2">
                <Type className="w-4 h-4" />
                Description (optional)
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isRecording ? "Listening to your voice..." : "Write a brief description or use a voice note..."}
                className="dc-field resize-none"
                style={{ height: 96, ...(isRecording ? { borderColor: "#0d5347", background: "rgba(13,83,71,.06)" } : {}) }}
              />
            </div>

            {/* Hardware Controls */}
            <div>
              <label className="dc-mono mb-3 block">Attach evidence</label>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Photo Capture Card */}
                <label className="relative cursor-pointer group">
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="peer sr-only" />
                  <div className="dc-surface-soft p-6 text-center flex flex-col items-center gap-3" style={photoPreview ? { borderColor: "#0d5347" } : undefined}>
                    {photoPreview ? (
                      <div className="w-12 h-12 rounded-lg bg-cover bg-center" style={{ backgroundImage: `url(${photoPreview})` }} />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                    )}
                    <span className={`font-semibold text-sm ${photoPreview ? 'text-primary' : 'text-slate-700'}`}>
                      {photoPreview ? "Retake photo" : "Take photo"}
                    </span>
                  </div>
                </label>

                {/* Voice Record Card */}
                <div onClick={isRecording ? stopRecording : (!audioBlob ? startRecording : undefined)} className="cursor-pointer dc-surface-soft p-6 text-center flex flex-col items-center gap-3" style={isRecording ? { borderColor: "#b23c2e" } : audioBlob ? { borderColor: "#0d5347" } : undefined}>
                  
                  {isRecording ? (
                    <Square className="w-8 h-8 text-alert animate-pulse" />
                  ) : audioBlob ? (
                    <FileAudio className="w-8 h-8 text-primary" />
                  ) : (
                    <Mic className="w-8 h-8 text-slate-400" />
                  )}

                  <span className={`font-semibold text-sm ${isRecording ? 'text-alert' : audioBlob ? 'text-primary' : 'text-slate-700'}`}>
                    {isRecording ? "Stop..." : audioBlob ? "Recorded" : "Voice Note"}
                  </span>
                </div>
              </div>

              {/* Audio Playback Section */}
              {audioUrl && !isRecording && (
                <div className="mt-4 p-4 rounded-xl flex items-center justify-between gap-4" style={{ background: "rgba(13,83,71,.06)", border: "1.5px solid rgba(13,83,71,.25)" }}>
                  <audio src={audioUrl} controls className="h-10 flex-grow" />
                  <button type="button" onClick={clearAudio} className="text-slate-400 hover:text-alert transition-colors">
                    <X className="w-5 h-5" />
                  </button>
                </div>
              )}
            </div>
          </div>
        </form>
      </main>

      <footer className="fixed bottom-0 w-full max-w-md p-6 z-10" style={{ background: "#eee8da", borderTop: "1.5px solid rgba(18,21,15,.16)" }}>
        <button
          form="report-form"
          type="submit"
          disabled={loading || (!photoFile && !audioBlob && !description)}
          className="dc-pill w-full"
          style={{ minHeight: 56, fontSize: 17 }}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit report <ChevronRight className="w-5 h-5" /></>}
        </button>
      </footer>

      {/* QR Scanner Modal Overlay */}
      {showQRScanner && (
        <div className="fixed inset-0 z-50 bg-black/90 flex flex-col items-center justify-center p-6">
          <button onClick={() => setShowQRScanner(false)} className="absolute top-6 right-6 p-2 bg-white/10 rounded-full text-white">
            <X className="w-6 h-6" />
          </button>
          <div className="w-full max-w-sm bg-white rounded-2xl overflow-hidden">
            <div id="reader" className="w-full bg-black"></div>
            <div className="p-4 text-center bg-white">
              <p className="font-bold text-slate-800">Scan DRISHTI QR Code</p>
              <p className="text-xs text-slate-500">Point camera at the asset's digital twin tag.</p>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
