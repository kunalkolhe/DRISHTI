"use client";

import QRCode from "react-qr-code";
import { Printer, ShieldCheck } from "lucide-react";
import { LogoMark } from "@/components/Logo";
import { workerCardId, workerVerifyUrl } from "@/lib/qr";

type Worker = {
  id: number;
  name: string;
  email: string | null;
  mobileNumber: string;
  role: string;
  trustScore: number;
  createdAt: string | Date;
};

const ROLE_LABEL: Record<string, string> = {
  FIELD_WORKER: "Field Worker",
  CONTRACTOR: "Contractor (AMC / Warranty)",
  DEPT_OFFICER: "Department Officer",
  ADMIN: "Administrator",
  CITIZEN: "Citizen",
};

export default function WorkerIdCard({ worker, origin = "" }: { worker: Worker; origin?: string }) {
  const cardNo = workerCardId(worker.id);
  const verifyUrl = workerVerifyUrl(worker.id, origin);
  const issued = new Date(worker.createdAt).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
  const initials = worker.name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase())
    .join("");

  return (
    <div className="space-y-6">
      <div className="dc-eyebrow">Official identity credential</div>

      {/* The card */}
      <div
        className="dc-print-card"
        style={{
          width: "100%",
          maxWidth: 380,
          background: "#fefcf5",
          border: "1.5px solid #12150f",
          borderRadius: 22,
          overflow: "hidden",
          boxShadow: "8px 10px 0 rgba(13,83,71,.92)",
        }}
      >
        {/* Top band */}
        <div
          style={{
            background: "#0d5347",
            color: "#f8fbf0",
            padding: "16px 20px",
            display: "flex",
            alignItems: "center",
            gap: 12,
          }}
        >
          <LogoMark size={34} shadow={false} />
          <div style={{ lineHeight: 1.15 }}>
            <div style={{ fontWeight: 600, letterSpacing: "-0.03em", fontSize: 16 }}>DRISHTI</div>
            <div
              style={{
                font: "500 9px/1 var(--font-jetbrains), monospace",
                letterSpacing: ".2em",
                textTransform: "uppercase",
                color: "#dee8c4",
                marginTop: 3,
              }}
            >
              {ROLE_LABEL[worker.role] || "Staff"} · Identity
            </div>
          </div>
        </div>

        {/* Body */}
        <div style={{ padding: 20, display: "flex", gap: 16 }}>
          <div
            style={{
              width: 66,
              height: 66,
              borderRadius: 16,
              background: "#dee8c4",
              border: "1.5px solid #0d5347",
              display: "grid",
              placeItems: "center",
              fontWeight: 600,
              fontSize: 24,
              color: "#0d5347",
              flexShrink: 0,
            }}
          >
            {initials || "?"}
          </div>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div style={{ fontSize: 19, fontWeight: 600, letterSpacing: "-0.03em", lineHeight: 1.2 }}>
              {worker.name}
            </div>
            <div className="dc-mono" style={{ marginTop: 4 }}>
              Card No · {cardNo}
            </div>
            <div style={{ fontSize: 13, color: "#5b6157", marginTop: 6 }}>
              {ROLE_LABEL[worker.role] || worker.role}
            </div>
            <div style={{ fontSize: 12.5, color: "#5b6157", marginTop: 2 }}>
              Active since {issued}
            </div>
          </div>
        </div>

        {/* Meta + QR */}
        <div
          style={{
            padding: "0 20px 20px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            gap: 14,
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
            <span
              className="dc-badge"
              style={{ background: worker.trustScore >= 70 ? "#dee8c4" : "#f3d9c9" }}
            >
              <ShieldCheck className="w-3 h-3" />
              Trust {Math.round(worker.trustScore)}
            </span>
            <span className="dc-mono" style={{ textTransform: "none", letterSpacing: 0 }}>
              {worker.mobileNumber}
            </span>
          </div>

          <div
            style={{
              background: "#fff",
              padding: 8,
              borderRadius: 12,
              border: "1.5px solid #12150f",
            }}
          >
            {origin ? (
              <QRCode value={verifyUrl} size={92} />
            ) : (
              <div style={{ width: 92, height: 92 }} />
            )}
          </div>
        </div>

        {/* Foot strip */}
        <div
          style={{
            background: "#12150f",
            color: "#c8c4b6",
            font: "400 10px/1.5 var(--font-jetbrains), monospace",
            letterSpacing: ".08em",
            padding: "8px 20px",
            textAlign: "center",
          }}
        >
          Scan to verify · {origin ? origin.replace(/^https?:\/\//, "") : "drishti"}/verify/{cardNo}
        </div>
      </div>

      <button
        type="button"
        onClick={() => window.print()}
        className="dc-pill-ghost dc-no-print"
        style={{ minHeight: 44, padding: "0 20px" }}
      >
        <Printer className="w-4 h-4" /> Print / save as PDF
      </button>

      <p className="dc-no-print text-sm text-slate-500 max-w-md">
        Carry this card on site. A citizen or officer can scan the QR to confirm you are a
        registered DRISHTI worker before a repair.
      </p>
    </div>
  );
}
