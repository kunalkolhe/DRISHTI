"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import QRCode from "react-qr-code";
import { Printer, Camera, Loader2, Check, Pencil, X } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { workerCardId, workerVerifyUrl } from "@/lib/qr";
import { updateWorkerProfile } from "@/app/actions/workerProfile";

type Worker = {
  id: number;
  name: string;
  email: string | null;
  mobileNumber: string;
  role: string;
  department: string | null;
  photoUrl: string | null;
  trustScore: number;
  createdAt: string | Date;
};

const ROLE_TITLE: Record<string, string> = {
  FIELD_WORKER: "Certified Field Worker",
  CONTRACTOR: "AMC / Warranty Contractor",
  DEPT_OFFICER: "Department Officer",
  ADMIN: "System Administrator",
  CITIZEN: "Registered Citizen",
};

const GREEN = "#0d5347";
const INK = "#12150f";
const CREAM = "#f2ede0";

function PlaceholderAvatar() {
  return (
    <svg viewBox="0 0 100 120" width="100%" height="100%" aria-hidden="true">
      <ellipse cx="50" cy="60" rx="46" ry="56" fill="#cfc9b8" />
      <circle cx="50" cy="46" r="20" fill="#a9a390" />
      <path d="M12 108c4-24 20-34 38-34s34 10 38 34z" fill="#a9a390" />
    </svg>
  );
}

export default function WorkerIdCard({ worker, origin = "" }: { worker: Worker; origin?: string }) {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);
  const [dept, setDept] = useState(worker.department || "");
  const [preview, setPreview] = useState<string | null>(null);
  const [pendingFile, setPendingFile] = useState<File | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState("");
  const [editing, setEditing] = useState(false);

  const cardNo = workerCardId(worker.id);
  const verifyUrl = workerVerifyUrl(worker.id, origin);
  const roleTitle = ROLE_TITLE[worker.role] || worker.role;

  const issued = new Date(worker.createdAt);
  const validTill = `Dec ${issued.getFullYear() + 3}`;

  const photoSrc =
    preview ||
    (worker.photoUrl
      ? worker.photoUrl.startsWith("http")
        ? worker.photoUrl
        : `/${worker.photoUrl.replace(/^\/+/, "")}`
      : null);

  const onPick = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPendingFile(f);
    setPreview(URL.createObjectURL(f));
    setSaved(false);
    setErr("");
  };

  const save = async () => {
    setSaving(true);
    setErr("");
    const fd = new FormData();
    if (pendingFile) fd.append("photo", pendingFile);
    if (dept.trim() && dept.trim() !== (worker.department || "")) fd.append("department", dept.trim());
    const res = await updateWorkerProfile(fd);
    setSaving(false);
    if (res.ok) {
      setSaved(true);
      setPendingFile(null);
      setTimeout(() => setEditing(false), 700);
      router.refresh();
    } else {
      setErr(res.error);
    }
  };

  const dirty = !!pendingFile || dept.trim() !== (worker.department || "");

  return (
    <div className="flex flex-col items-start gap-4" style={{ maxWidth: 420 }}>
      <div className="dc-eyebrow dc-no-print">Official identity credential</div>

      {/* ---------------- the card ---------------- */}
      <div
        className="dc-print-card"
        style={{
          width: "100%",
          background: CREAM,
          border: `1.5px solid ${INK}`,
          borderRadius: 20,
          overflow: "hidden",
          boxShadow: "8px 10px 0 rgba(13,83,71,.92)",
          position: "relative",
        }}
      >
        {/* small edit icon (not printed) */}
        <button
          type="button"
          onClick={() => setEditing((v) => !v)}
          title="Edit photo & department"
          aria-label="Edit card"
          className="dc-no-print"
          style={{
            position: "absolute",
            top: 12,
            right: 12,
            width: 30,
            height: 30,
            display: "grid",
            placeItems: "center",
            borderRadius: 9,
            background: editing ? "#f2ede0" : "rgba(242,237,224,.18)",
            border: "1.5px solid rgba(242,237,224,.55)",
            color: editing ? GREEN : "#f2ede0",
            cursor: "pointer",
            zIndex: 2,
          }}
        >
          {editing ? <X className="w-4 h-4" /> : <Pencil className="w-3.5 h-3.5" />}
        </button>

        {/* header band */}
        <div style={{ background: GREEN, color: "#f2ede0", display: "flex", alignItems: "center", gap: 12, padding: "13px 18px" }}>
          <LogoMark size={32} shadow={false} />
          <div style={{ lineHeight: 1.2, minWidth: 0 }}>
            <div style={{ fontSize: 19, fontWeight: 700, letterSpacing: "-0.02em" }}>DRISHTI</div>
            <div style={{ font: "400 9px/1.2 var(--font-jetbrains), monospace", letterSpacing: ".13em", textTransform: "uppercase", color: "#cfe0c0", marginTop: 3 }}>
              Municipal Infrastructure Services
            </div>
          </div>
        </div>

        {/* body */}
        <div style={{ position: "relative", padding: "18px 18px 14px" }}>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage: "radial-gradient(rgba(18,21,15,.08) .8px, transparent .8px)",
              backgroundSize: "6px 6px",
              opacity: 0.5,
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative", display: "flex", gap: 16 }}>
            {/* photo */}
            <div
              style={{
                width: 100,
                height: 120,
                flex: "none",
                borderRadius: 12,
                overflow: "hidden",
                border: `1.5px solid ${INK}`,
                background: "#e5dfce",
              }}
            >
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoSrc} alt={worker.name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <PlaceholderAvatar />
              )}
            </div>

            {/* details */}
            <div style={{ flex: 1, minWidth: 0, display: "flex", flexDirection: "column" }}>
              <div style={{ fontSize: 21, fontWeight: 700, color: GREEN, letterSpacing: "-0.02em", lineHeight: 1.15 }}>
                {worker.name}
              </div>
              <div style={{ fontSize: 13.5, color: INK, marginTop: 7 }}>{roleTitle}</div>
              {(worker.department || dept) && (
                <div style={{ fontSize: 13.5, color: INK, marginTop: 2 }}>{worker.department || dept}</div>
              )}
              <div style={{ marginTop: "auto", paddingTop: 14 }}>
                <div style={{ font: "500 12.5px/1.6 var(--font-jetbrains), monospace", color: INK }}>ID No: {cardNo}</div>
                <div style={{ font: "500 12.5px/1.6 var(--font-jetbrains), monospace", color: INK }}>Valid till: {validTill}</div>
              </div>
            </div>
          </div>
        </div>

        {/* footer: rule + QR */}
        <div style={{ position: "relative", display: "flex", alignItems: "flex-end", gap: 14, padding: "0 18px 16px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ height: 2, background: GREEN, borderRadius: 2 }} />
            <div style={{ font: "400 8.5px/1.4 var(--font-jetbrains), monospace", letterSpacing: ".05em", color: "#6d7368", marginTop: 6, wordBreak: "break-all" }}>
              Scan to verify · {(origin || "drishti").replace(/^https?:\/\//, "")}/verify/{cardNo}
            </div>
          </div>
          <div style={{ background: "#fff", padding: 6, borderRadius: 8, border: `1.5px solid ${INK}`, flex: "none" }}>
            {origin ? <QRCode value={verifyUrl} size={78} /> : <div style={{ width: 78, height: 78 }} />}
          </div>
        </div>
      </div>

      {/* action row */}
      <div className="dc-no-print w-full">
        <button type="button" onClick={() => window.print()} className="dc-pill-ghost text-sm w-full" style={{ minHeight: 42 }}>
          <Printer className="w-4 h-4" /> Print / save as PDF
        </button>
      </div>
      <p className="dc-mono dc-no-print" style={{ textTransform: "none", letterSpacing: 0, marginTop: -6 }}>
        Tap the pencil on the card to change your photo or department.
      </p>

      {/* ---------------- edit panel (collapsed until the icon is clicked) ---------------- */}
      {editing && (
        <div className="dc-surface-soft p-5 space-y-4 dc-no-print w-full">
          <div className="flex items-center justify-between">
            <div className="dc-mono">Update your card</div>
            <button type="button" onClick={() => setEditing(false)} className="text-slate-400 hover:text-alert">
              <X className="w-4 h-4" />
            </button>
          </div>

          {err && <p style={{ color: "#b23c2e", fontSize: 13, fontWeight: 600 }}>{err}</p>}

          <div className="flex items-center gap-3">
            <div style={{ width: 52, height: 52, borderRadius: 12, overflow: "hidden", border: `1.5px solid ${INK}`, background: "#e5dfce", flex: "none" }}>
              {photoSrc ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={photoSrc} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              ) : (
                <PlaceholderAvatar />
              )}
            </div>
            <label className="dc-pill-ghost text-sm cursor-pointer" style={{ minHeight: 40 }}>
              <Camera className="w-4 h-4" /> {worker.photoUrl || preview ? "Change photo" : "Add photo"}
              <input ref={fileRef} type="file" accept="image/*" onChange={onPick} className="sr-only" />
            </label>
          </div>

          <div>
            <label className="dc-mono mb-1.5 block">Department / posting</label>
            <input
              type="text"
              value={dept}
              onChange={(e) => { setDept(e.target.value); setSaved(false); }}
              placeholder="e.g. Public Works Department, Ward 18"
              className="dc-field"
            />
          </div>

          <button onClick={save} disabled={!dirty || saving} className="dc-pill w-full" style={{ minHeight: 46 }}>
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? <><Check className="w-4 h-4" /> Saved</> : "Save"}
          </button>
        </div>
      )}

      <p className="dc-no-print text-sm text-slate-500">
        Carry this card on site. A citizen or officer can scan the QR to confirm you are a registered
        DRISHTI {roleTitle.toLowerCase()} before a repair.
      </p>
    </div>
  );
}
