"use client";

import { useState, useRef, useEffect } from "react";
import { createComplaint } from "@/app/actions/complaint";
import { sendComplaintEmail } from "@/app/actions/sendComplaintEmail";
import { resolveArea } from "@/app/actions/resolveArea";
import { extractAssetCode } from "@/lib/qr";
import { Camera, AlertCircle, QrCode, Loader2, CheckCircle2, ChevronRight, Mic, Square, X, Type, FileAudio, MapPin, Mail, Building2, Copy, Check, ChevronDown, Landmark } from "lucide-react";
import { useSearchParams } from "next/navigation";
import { Html5QrcodeScanner } from "html5-qrcode";
import {
  DEPARTMENT_CONTACTS,
  ISSUE_CATEGORIES,
  getDepartmentContact,
  draftComplaintEmail,
  buildMailtoLink,
} from "@/lib/departments";
import {
  JURISDICTIONS,
  AREA_TYPE_LABELS,
  TIER_LABELS,
  buildJurisdiction,
  getEscalationChain,
  type AreaType,
} from "@/lib/jurisdictions";

export default function ReportPage() {
  const searchParams = useSearchParams();
  const initialAssetId = searchParams.get("asset") || "";

  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  
  // States
  const [assetId, setAssetId] = useState(initialAssetId);
  const [showQRScanner, setShowQRScanner] = useState(false);
  const [category, setCategory] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [location, setLocation] = useState<{lat: number, lon: number} | null>(null);

  // Auto-email feature
  const [sendEmail, setSendEmail] = useState(false);
  const [ccEmail, setCcEmail] = useState("");
  const [emailDraft, setEmailDraft] = useState<
    { to: string; cc: string; subject: string; body: string; mailto: string } | null
  >(null);
  const [showEmailPreview, setShowEmailPreview] = useState(false);
  const [copied, setCopied] = useState(false);
  const [emailSent, setEmailSent] = useState<
    { mode: "smtp" | "dummy"; previewUrl: string | null } | { error: string } | null
  >(null);

  // Jurisdiction + who to escalate to
  const [jurisdictionKey, setJurisdictionKey] = useState("");
  const [customArea, setCustomArea] = useState<{ type: AreaType; name: string; state: string }>({
    type: "MUNICIPAL_CORPORATION",
    name: "",
    state: "",
  });
  const [recipientSel, setRecipientSel] = useState<Record<string, boolean>>({});
  const [areaGuess, setAreaGuess] = useState<{ label: string; source: "gps" | "text" } | null>(null);
  const [areaLoading, setAreaLoading] = useState(false);
  const [areaError, setAreaError] = useState("");

  const detectArea = async (opts?: { lat?: number; lon?: number; text?: string }) => {
    const lat = opts?.lat ?? location?.lat;
    const lon = opts?.lon ?? location?.lon;
    const rawText = opts?.text ?? address;
    const text = rawText && !/^GPS Location Attached/i.test(rawText) ? rawText : undefined;
    if (lat == null && !text) {
      setAreaError("Add a location description or tag GPS first.");
      return;
    }
    setAreaLoading(true);
    setAreaError("");
    const r = await resolveArea({ lat, lon, text });
    setAreaLoading(false);
    if (!r.ok) {
      setAreaGuess(null);
      setAreaError(r.error);
      return;
    }
    setAreaGuess({ label: r.guess.label, source: r.guess.source });
    setRecipientSel({});
    if (r.matchedKey) {
      setJurisdictionKey(r.matchedKey);
    } else {
      setJurisdictionKey("__custom__");
      setCustomArea({ type: r.guess.areaType, name: r.guess.areaName, state: r.guess.state });
    }
  };

  const deptContact = category ? getDepartmentContact(category) : null;

  const jurisdiction =
    jurisdictionKey === "__custom__"
      ? customArea.name.trim()
        ? buildJurisdiction({
            displayName: `${customArea.name.trim()} (${AREA_TYPE_LABELS[customArea.type].split(" — ")[0]})`,
            areaType: customArea.type,
            areaName: customArea.name.trim(),
            state: customArea.state.trim() || undefined,
          })
        : null
      : jurisdictionKey
      ? JURISDICTIONS[jurisdictionKey]
      : null;

  const escalationChain =
    jurisdiction && category ? getEscalationChain(jurisdiction, category) : [];
  const isChosen = (id: string, dflt?: boolean) => recipientSel[id] ?? !!dflt;
  const chosenRecipients = escalationChain.filter((a) => isChosen(a.id, a.defaultSelected));
  const primaryRecipientId = chosenRecipients[0]?.id ?? escalationChain[0]?.id;
  
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
          setAssetId(extractAssetCode(decodedText));
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
          const lat = pos.coords.latitude;
          const lon = pos.coords.longitude;
          setLocation({ lat, lon });
          setAddress(`GPS Location Attached (${lat.toFixed(4)}, ${lon.toFixed(4)})`);
          // Work out the ward / town / village from the point
          detectArea({ lat, lon });
        },
        () => alert("Could not access GPS. Please ensure location services are enabled.")
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

    const severity = (formData.get("severity") as string) || "MEDIUM";

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
      // Draft the formal complaint email if the citizen asked for it
      if (sendEmail && category) {
        const raw = result.complaint?.originalPhotoUrl || "";
        const photoUrl = raw
          ? new URL(raw.startsWith("/") ? raw : `/${raw}`, window.location.origin).toString()
          : null;

        // Split the chosen escalation chain into "addressed to" + "copy to"
        const picked = chosenRecipients.length ? chosenRecipients : escalationChain.slice(0, 1);
        const primary = picked[0]
          ? { role: picked[0].role, name: picked[0].name, email: picked[0].email }
          : undefined;
        const ccRecipients = picked.slice(1).map((a) => ({ role: a.role, name: a.name, email: a.email }));

        const citizenName = result.citizen?.name ?? null;
        const citizenContact = [
          result.citizen?.mobileNumber ? `Mobile: ${result.citizen.mobileNumber}` : null,
          result.citizen?.email ? `Email: ${result.citizen.email}` : null,
        ].filter(Boolean).join("  •  ") || null;

        const areaLabel =
          (jurisdiction && jurisdictionKey !== "__custom__"
            ? JURISDICTIONS[jurisdictionKey]?.displayName
            : customArea.name.trim()) ||
          address ||
          null;

        const emailInput = {
          category,
          address,
          areaLabel,
          gpsLat: location?.lat ?? null,
          gpsLon: location?.lon ?? null,
          description,
          severity,
          photoUrl,
          citizenName,
          citizenContact,
          referenceId: result.complaint?.id ?? null,
          reportedAt: result.complaint?.createdAt ?? new Date(),
          primaryRecipient: primary,
          ccRecipients,
          policyNote: jurisdiction?.policyNote ?? null,
          extraCc: ccEmail.trim() || null,
        };

        // Client-side draft = the "link" version, for the mailto: button + preview
        const draft = draftComplaintEmail({ ...emailInput, photoMode: "link" });
        const allCc = [draft.cc, ccEmail.trim()].filter(Boolean).join(", ");

        setEmailDraft({
          to: draft.to,
          subject: draft.subject,
          body: draft.text,
          cc: allCc,
          mailto: buildMailtoLink({
            to: draft.to,
            cc: allCc || null,
            subject: draft.subject,
            body: draft.text,
          }),
        });

        // Fire the real send. With no SMTP_* env vars this runs in DUMMY mode:
        // the mail is accepted by a test server and never delivered, but you
        // get a preview URL to inspect it — with the photo attached.
        try {
          const sent = await sendComplaintEmail({
            ...emailInput,
            photoPath: result.complaint?.originalPhotoUrl ?? null,
            voicePath: result.complaint?.voiceNoteUrl ?? null,
          });
          setEmailSent(sent.ok ? { mode: sent.mode, previewUrl: sent.previewUrl } : { error: sent.error });
        } catch {
          setEmailSent({ error: "Could not reach the mail server." });
        }
      }
      setSuccess(true);
    } else {
      setErrorMsg(result.error || "Failed to submit.");
    }
    setLoading(false);
  }

  const copyEmailText = async () => {
    if (!emailDraft) return;
    const text = `To: ${emailDraft.to}\n${emailDraft.cc ? `Cc: ${emailDraft.cc}\n` : ""}Subject: ${emailDraft.subject}\n\n${emailDraft.body}`;
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      alert("Could not copy automatically. Please select the text in the preview and copy it.");
    }
  };

  const resetForm = () => {
    setSuccess(false);
    setEmailDraft(null);
    setEmailSent(null);
    setShowEmailPreview(false);
    setPhotoFile(null);
    setPhotoPreview(null);
    setAudioBlob(null);
    setAudioUrl(null);
    setDescription("");
    setCategory("");
    setSendEmail(false);
    setCcEmail("");
    setJurisdictionKey("");
    setCustomArea({ type: "MUNICIPAL_CORPORATION", name: "", state: "" });
    setRecipientSel({});
    setAreaGuess(null);
    setAreaError("");
  };

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#eee8da" }}>
        <div className={`dc-surface p-8 w-full space-y-6 ${emailDraft ? "max-w-lg" : "max-w-sm text-center"}`}>
          <div className={`w-20 h-20 rounded-full flex items-center justify-center ${emailDraft ? "" : "mx-auto"}`} style={{ background: "#dee8c4", border: "1.5px solid rgba(13,83,71,.4)" }}>
            <CheckCircle2 className="w-10 h-10 text-primary" />
          </div>
          <div>
            <h2 className="text-2xl font-display font-semibold text-primary mb-2">Report logged</h2>
            <p className="text-slate-500 text-sm leading-relaxed">
              Your report is on record and the SLA clock started at capture time.
            </p>
          </div>

          {emailDraft && deptContact && (
            <div className="dc-surface-soft p-5 space-y-4 text-left">
              <div className="dc-mono">Formal email ready</div>
              <p className="text-sm text-slate-600 leading-relaxed">
                We&apos;ve drafted a formal complaint addressed to <strong>{emailDraft.to}</strong>.
                Open your email app and press send — nothing else to write.
                {emailDraft.cc && (() => {
                  const n = emailDraft.cc.split(/\s*,\s*/).filter(Boolean).length;
                  return (
                    <> A copy goes to <strong>{n}</strong> other {n === 1 ? "recipient" : "recipients"}{" "}
                    (department heads, elected representatives and your own address, if given).</>
                  );
                })()}
              </p>

              {emailSent && "mode" in emailSent && (
                <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(13,83,71,.08)", border: "1.5px solid rgba(13,83,71,.3)", color: "#0d5347" }}>
                  {emailSent.mode === "dummy" ? (
                    <>
                      <div className="flex items-center gap-2 font-semibold">
                        <Check className="w-4 h-4" /> Test email sent (dummy inbox)
                      </div>
                      <p className="mt-1 text-xs leading-relaxed" style={{ color: "#4b473b" }}>
                        Delivered to a throwaway test server — it did <strong>not</strong> reach any real address.
                      </p>
                      {emailSent.previewUrl && (
                        <a href={emailSent.previewUrl} target="_blank" rel="noopener noreferrer" className="dc-mono inline-flex items-center gap-1 mt-2" style={{ color: "#0d5347" }}>
                          Open the email that was sent ↗
                        </a>
                      )}
                    </>
                  ) : (
                    <div className="flex items-center gap-2 font-semibold">
                      <Check className="w-4 h-4" /> Email delivered via SMTP
                    </div>
                  )}
                </div>
              )}
              {emailSent && "error" in emailSent && (
                <div className="rounded-xl p-3 text-sm" style={{ background: "rgba(178,60,46,.1)", border: "1.5px solid rgba(178,60,46,.3)", color: "#b23c2e" }}>
                  Automatic send failed ({emailSent.error}). Use the button below to send it yourself.
                </div>
              )}

              <a href={emailDraft.mailto} className="dc-pill w-full" style={{ minHeight: 52 }}>
                <Mail className="w-4 h-4" /> Open email app to send
              </a>

              <div className="flex gap-2">
                <button type="button" onClick={copyEmailText} className="dc-pill-ghost flex-1 text-sm" style={{ minHeight: 44 }}>
                  {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                  {copied ? "Copied" : "Copy email text"}
                </button>
                <button type="button" onClick={() => setShowEmailPreview((v) => !v)} className="dc-pill-ghost flex-1 text-sm" style={{ minHeight: 44 }}>
                  <ChevronDown className="w-4 h-4" style={{ transform: showEmailPreview ? "rotate(180deg)" : "none" }} />
                  {showEmailPreview ? "Hide" : "Preview"}
                </button>
              </div>

              {showEmailPreview && (
                <div className="rounded-xl p-4 text-xs leading-relaxed" style={{ background: "#fdfbf3", border: "1.5px solid rgba(18,21,15,.18)" }}>
                  <p className="dc-mono mb-1" style={{ fontSize: 9 }}>To</p>
                  <p className="mb-3" style={{ fontFamily: "var(--font-jetbrains), monospace", overflowWrap: "anywhere" }}>{emailDraft.to}</p>
                  {emailDraft.cc && (
                    <>
                      <p className="dc-mono mb-1" style={{ fontSize: 9 }}>Cc</p>
                      <ul className="mb-3 list-none p-0" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                        {emailDraft.cc.split(/\s*,\s*/).filter(Boolean).map((addr, i) => (
                          <li key={i} style={{ overflowWrap: "anywhere", marginBottom: 2 }}>{addr}</li>
                        ))}
                      </ul>
                    </>
                  )}
                  <p className="dc-mono mb-1" style={{ fontSize: 9 }}>Subject</p>
                  <p className="mb-3 font-semibold" style={{ overflowWrap: "anywhere" }}>{emailDraft.subject}</p>
                  <p className="dc-mono mb-1" style={{ fontSize: 9 }}>Message</p>
                  <pre className="whitespace-pre-wrap" style={{ fontFamily: "inherit", margin: 0, overflowWrap: "anywhere" }}>{emailDraft.body}</pre>
                </div>
              )}

              <p className="text-slate-400" style={{ fontSize: 11 }}>
                Tip: if the button does nothing, your device has no email app set up — use “Copy email text” and paste it into Gmail or any webmail.
              </p>
            </div>
          )}

          <button onClick={resetForm} className={emailDraft ? "dc-pill-ghost w-full" : "dc-pill w-full"} style={{ minHeight: 52 }}>
            {emailDraft ? "Report another issue" : "Done"}
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
                onBlur={(e) => {
                  const t = e.target.value.trim();
                  if (t.length > 4 && !/^GPS Location Attached/i.test(t) && !jurisdictionKey && !areaLoading) {
                    detectArea({ text: t });
                  }
                }}
                required
                placeholder="e.g. Kothrud, near Mhatre bridge, Pune"
                className="dc-field"
              />
              <p className="dc-mono mt-1" style={{ textTransform: "none", letterSpacing: 0 }}>
                Add the locality / area name — we use it to find your ward and officers.
              </p>
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

            {/* Issue Category → auto-routing */}
            <div>
              <label className="dc-mono mb-2 block">What is the problem?</label>
              <select
                name="category"
                required
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="dc-field"
              >
                <option value="" disabled>Choose a category…</option>
                {ISSUE_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{DEPARTMENT_CONTACTS[c].label}</option>
                ))}
              </select>

              {deptContact && !jurisdiction && (
                <div className="dc-surface-soft p-4 mt-3 space-y-1.5">
                  <div className="dc-mono">First responder</div>
                  <div className="flex items-start gap-2 text-sm font-semibold text-slate-800">
                    <Building2 className="w-4 h-4 mt-0.5 shrink-0 text-primary" />
                    {deptContact.department}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-slate-600" style={{ fontFamily: "var(--font-jetbrains), monospace" }}>
                    <Mail className="w-4 h-4 shrink-0 text-primary" />
                    {deptContact.email}
                  </div>
                  {deptContact.phone && (
                    <div className="dc-mono">Helpline {deptContact.phone}</div>
                  )}
                  <p className="dc-mono" style={{ textTransform: "none", letterSpacing: 0 }}>
                    Pick your area below to also reach the ward officer, corporator, mayor, MLA and MP.
                  </p>
                </div>
              )}
            </div>

            {/* Jurisdiction */}
            <div>
              <label className="mb-2 flex justify-between items-center gap-2">
                <span className="dc-mono">Which area is this in?</span>
                <button
                  type="button"
                  onClick={() => detectArea()}
                  disabled={areaLoading}
                  className="dc-mono flex items-center gap-1"
                  style={{ color: "#0d5347" }}
                >
                  {areaLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <MapPin className="w-3 h-3" />}
                  {areaLoading ? "Finding…" : "Find from location"}
                </button>
              </label>

              {areaGuess && (
                <div className="dc-badge mb-2" style={{ textTransform: "none", letterSpacing: 0, maxWidth: "100%" }}>
                  <MapPin className="w-3 h-3 shrink-0" />
                  <span className="truncate">
                    {areaGuess.source === "gps" ? "From your GPS: " : "From your description: "}
                    {areaGuess.label}
                  </span>
                </div>
              )}
              {areaError && (
                <p className="mb-2" style={{ fontSize: 12, color: "#b23c2e" }}>{areaError}</p>
              )}

              <select
                value={jurisdictionKey}
                onChange={(e) => { setJurisdictionKey(e.target.value); setRecipientSel({}); setAreaGuess(null); }}
                className="dc-field"
              >
                <option value="">Choose your city / town / village…</option>
                {Object.values(JURISDICTIONS).map((j) => (
                  <option key={j.key} value={j.key}>{j.displayName}</option>
                ))}
                <option value="__custom__">
                  {areaGuess && jurisdictionKey === "__custom__"
                    ? `Detected: ${customArea.name || "my area"}`
                    : "My area isn't listed…"}
                </option>
              </select>

              {jurisdictionKey === "__custom__" && (
                <div className="mt-3 space-y-3">
                  <select
                    value={customArea.type}
                    onChange={(e) => { setCustomArea((a) => ({ ...a, type: e.target.value as AreaType })); setRecipientSel({}); }}
                    className="dc-field"
                  >
                    {(Object.keys(AREA_TYPE_LABELS) as AreaType[]).map((t) => (
                      <option key={t} value={t}>{AREA_TYPE_LABELS[t]}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={customArea.name}
                    onChange={(e) => { setCustomArea((a) => ({ ...a, name: e.target.value })); setRecipientSel({}); }}
                    placeholder="Area / ward / village name — e.g. Kothrud"
                    className="dc-field"
                  />
                  <input
                    type="text"
                    value={customArea.state}
                    onChange={(e) => setCustomArea((a) => ({ ...a, state: e.target.value }))}
                    placeholder="State (optional) — e.g. Maharashtra"
                    className="dc-field"
                  />
                </div>
              )}
            </div>

            {/* Escalation recipient checklist */}
            {escalationChain.length > 0 && jurisdiction && (
              <div className="dc-surface-soft p-4 space-y-3">
                <div className="flex items-center gap-2">
                  <Landmark className="w-4 h-4 text-primary shrink-0" />
                  <span className="dc-mono">Send to — tick everyone who should get this</span>
                </div>

                {escalationChain.map((a) => {
                  const on = isChosen(a.id, a.defaultSelected);
                  const isPrimary = on && a.id === primaryRecipientId;
                  return (
                    <label key={a.id} className="flex items-start gap-3 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={on}
                        onChange={(e) => setRecipientSel((s) => ({ ...s, [a.id]: e.target.checked }))}
                        className="mt-1 w-4 h-4 shrink-0"
                        style={{ accentColor: "#0d5347" }}
                      />
                      <span className="min-w-0">
                        <span className="text-sm font-semibold text-slate-800">
                          {a.role}{a.name ? ` — ${a.name}` : ""}
                          {isPrimary && (
                            <span className="dc-badge ml-2" style={{ fontSize: 9, padding: "2px 6px" }}>addressed to</span>
                          )}
                        </span>
                        <span className="block truncate" style={{ fontFamily: "var(--font-jetbrains), monospace", fontSize: 11, color: "#6a6555" }}>
                          {a.email}
                        </span>
                        <span className="block dc-mono">
                          {TIER_LABELS[a.tier]}{a.note ? ` · ${a.note}` : ""}
                        </span>
                      </span>
                    </label>
                  );
                })}

                <p className="text-xs leading-relaxed" style={{ color: "#6a6555" }}>
                  {jurisdiction.policyNote}
                </p>
                {jurisdiction.grievancePortal && (
                  <a
                    href={jurisdiction.grievancePortal.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="dc-mono inline-flex items-center gap-1"
                    style={{ color: "#0d5347" }}
                  >
                    {jurisdiction.grievancePortal.name} ↗
                  </a>
                )}
              </div>
            )}

            {/* Auto-email opt-in */}
            <div className="space-y-3">
              <label className="flex items-start gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  checked={sendEmail}
                  onChange={(e) => setSendEmail(e.target.checked)}
                  className="mt-1 w-4 h-4 shrink-0"
                  style={{ accentColor: "#0d5347" }}
                />
                <span>
                  <span className="font-semibold text-sm text-slate-800">Also send a formal email to the authorities</span>
                  <span className="block dc-mono">We write the letter — you just press send</span>
                </span>
              </label>

              {sendEmail && (
                <div>
                  <label className="dc-mono mb-2 block">Your email — to receive a copy (optional)</label>
                  <input
                    type="email"
                    value={ccEmail}
                    onChange={(e) => setCcEmail(e.target.value)}
                    placeholder="you@example.com"
                    className="dc-field"
                    style={{ fontFamily: "var(--font-jetbrains), monospace" }}
                  />
                </div>
              )}
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
