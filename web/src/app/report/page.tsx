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
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6">
        <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 max-w-sm w-full text-center space-y-6">
          <div className="mx-auto w-20 h-20 bg-success/10 text-success rounded-full flex items-center justify-center">
            <CheckCircle2 className="w-10 h-10" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-extrabold text-primary mb-2">Report Logged</h2>
            <p className="text-slate-500 text-sm leading-relaxed">Your report is permanently bound to the asset's Digital Twin.</p>
          </div>
          <button onClick={() => { setSuccess(false); setPhotoFile(null); setAudioBlob(null); setAudioUrl(null); setDescription(""); }} className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 rounded-xl transition-colors">
            Done
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col max-w-md mx-auto relative shadow-2xl pb-24">
      
      <header className="bg-white p-6 border-b border-gray-100 sticky top-0 z-10 flex items-center justify-between">
        <h1 className="font-display font-extrabold text-xl text-primary">Report Issue</h1>
        {location && (
          <div className="bg-success/10 text-success text-[10px] uppercase tracking-wider font-bold px-2 py-1 rounded flex items-center gap-1 shadow-sm">
            <MapPin className="w-3 h-3" /> GPS Tagged
          </div>
        )}
      </header>

      <main className="flex-grow p-6">
        {errorMsg && (
          <div className="mb-6 p-4 bg-alert/10 border border-alert/20 text-alert rounded-xl text-sm font-medium flex items-center gap-3">
            <AlertCircle className="w-5 h-5 shrink-0" />
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8" id="report-form">
          
          <div className="space-y-6">
            
            {/* QR Scanner Field */}
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 flex justify-between items-center">
                <span>Asset ID <span className="text-slate-400 font-normal text-xs">(Optional)</span></span>
                <button type="button" onClick={() => setShowQRScanner(true)} className="text-accent text-xs font-bold uppercase tracking-wider flex items-center gap-1">
                  <QrCode className="w-3 h-3" /> Scan QR
                </button>
              </label>
              <div className="relative">
                <input 
                  type="text" 
                  name="qrCodeId" 
                  value={assetId}
                  onChange={(e) => setAssetId(e.target.value)}
                  placeholder="Scan QR or enter ID" 
                  className="w-full bg-white border border-gray-200 text-slate-800 font-mono text-base rounded-xl px-4 py-4 focus:ring-2 focus:ring-accent focus:border-accent outline-none shadow-sm transition-all" 
                />
              </div>
            </div>

            {/* Manual Location Field */}
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 flex justify-between items-center">
                <span>Location Description</span>
                <button type="button" onClick={captureGPS} className={`text-xs font-bold uppercase tracking-wider flex items-center gap-1 transition-colors ${location ? 'text-success' : 'text-accent'}`}>
                  <MapPin className="w-3 h-3" /> {location ? "GPS Tagged" : "Use GPS"}
                </button>
              </label>
              <input 
                type="text" 
                name="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                required
                placeholder="e.g. Opposite Central Station, near main gate" 
                className="w-full bg-white border border-gray-200 text-slate-800 text-base rounded-xl px-4 py-4 focus:ring-2 focus:ring-accent focus:border-accent outline-none shadow-sm transition-all" 
              />
            </div>

            {/* Severity Select */}
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 block">Severity</label>
              <select name="severity" required className="w-full bg-white border border-gray-200 text-slate-800 text-base rounded-xl px-4 py-4 outline-none shadow-sm transition-all">
                <option value="LOW">Low (Minor damage, still functional)</option>
                <option value="MEDIUM">Medium (Partially broken)</option>
                <option value="HIGH">High (Completely broken / Dangerous)</option>
              </select>
            </div>

            {/* Text Description (Auto-populated by Voice) */}
            <div>
              <label className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
                <Type className="w-4 h-4 text-slate-400" />
                Description <span className="text-slate-400 font-normal text-xs">(Optional)</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder={isRecording ? "Listening to your voice..." : "Write a brief description or use voice note..."}
                className={`w-full bg-white border border-gray-200 text-slate-800 text-base rounded-xl px-4 py-3 h-24 focus:ring-2 focus:ring-accent focus:border-accent outline-none shadow-sm transition-all resize-none ${isRecording ? 'bg-primary/5 border-primary/50 placeholder:text-primary animate-pulse' : ''}`}
              />
            </div>

            {/* Hardware Controls */}
            <div>
              <label className="text-sm font-bold text-slate-800 mb-3 block">Attach Evidence</label>
              <div className="grid grid-cols-2 gap-4">
                
                {/* Photo Capture Card */}
                <label className="relative cursor-pointer group">
                  <input type="file" accept="image/*" capture="environment" onChange={handlePhotoCapture} className="peer sr-only" />
                  <div className={`bg-white p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3 ${photoPreview ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                    {photoPreview ? (
                      <div className="w-12 h-12 rounded-lg bg-cover bg-center shadow-sm" style={{ backgroundImage: `url(${photoPreview})` }} />
                    ) : (
                      <Camera className="w-8 h-8 text-slate-400 group-hover:text-primary transition-colors" />
                    )}
                    <span className={`font-semibold text-sm ${photoPreview ? 'text-primary' : 'text-slate-700'}`}>
                      {photoPreview ? "Retake Photo" : "Take Photo"}
                    </span>
                  </div>
                </label>
                
                {/* Voice Record Card */}
                <div onClick={isRecording ? stopRecording : (!audioBlob ? startRecording : undefined)} className={`cursor-pointer bg-white p-6 rounded-2xl border-2 transition-all text-center flex flex-col items-center gap-3 ${isRecording ? 'border-alert bg-alert/5 shadow-[0_0_15px_rgba(196,69,61,0.2)]' : audioBlob ? 'border-primary bg-primary/5' : 'border-gray-100 hover:border-gray-200'}`}>
                  
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
                <div className="mt-4 p-4 bg-primary/5 border border-primary/20 rounded-xl flex items-center justify-between gap-4">
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

      <footer className="fixed bottom-0 w-full max-w-md p-6 bg-white border-t border-gray-100 z-10 shadow-[0_-10px_20px_-10px_rgba(0,0,0,0.05)]">
        <button 
          form="report-form"
          type="submit" 
          disabled={loading || (!photoFile && !audioBlob && !description)} // Enable if they just typed a description too!
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/20 transition-all flex justify-center items-center gap-2 active:scale-[0.98] disabled:opacity-70 disabled:active:scale-100"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>Submit Report <ChevronRight className="w-5 h-5" /></>}
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
