"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { confirmRepair, rejectRepair } from "@/app/actions/complaint";
import { Loader2, CheckCircle2, ThumbsDown, X } from "lucide-react";

function imgSrc(u: string) {
  return u.startsWith("http") ? u : `/${u.replace(/^\/+/, "")}`;
}

export default function RepairReview({
  complaintId,
  repairPhotoUrl,
  workerNotes,
}: {
  complaintId: number;
  repairPhotoUrl: string | null;
  workerNotes: string | null;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState<"" | "confirm" | "reject">("");
  const [showReject, setShowReject] = useState(false);
  const [reason, setReason] = useState("");
  const [err, setErr] = useState("");

  const doConfirm = async () => {
    setBusy("confirm");
    setErr("");
    const r = await confirmRepair(complaintId);
    if (r.success) router.refresh();
    else { setErr(r.error || "Something went wrong."); setBusy(""); }
  };

  const doReject = async () => {
    setBusy("reject");
    setErr("");
    const r = await rejectRepair(complaintId, reason);
    if (r.success) router.refresh();
    else { setErr(r.error || "Something went wrong."); setBusy(""); }
  };

  return (
    <div className="mt-4 dc-surface-soft p-4" style={{ borderColor: "#0d5347" }}>
      <div className="dc-mono mb-2">The repair team says this is fixed</div>

      {repairPhotoUrl && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={imgSrc(repairPhotoUrl)}
          alt="Photo of the repair"
          className="w-full rounded-lg mb-3"
          style={{ maxHeight: 220, objectFit: "cover", border: "1.5px solid rgba(18,21,15,.2)" }}
        />
      )}

      {workerNotes && (
        <p className="text-sm text-slate-600 mb-3">
          <span className="dc-mono">Worker note</span> — {workerNotes}
        </p>
      )}

      <p className="text-sm text-slate-700 mb-3">
        Please check the spot. Does this match what you see now?
      </p>

      {err && <p className="text-sm font-semibold mb-2" style={{ color: "#b23c2e" }}>{err}</p>}

      {!showReject ? (
        <div className="flex flex-col sm:flex-row gap-2">
          <button onClick={doConfirm} disabled={!!busy} className="dc-pill flex-1" style={{ minHeight: 46 }}>
            {busy === "confirm" ? <Loader2 className="w-4 h-4 animate-spin" /> : <><CheckCircle2 className="w-4 h-4" /> Yes, it&apos;s fixed</>}
          </button>
          <button onClick={() => setShowReject(true)} disabled={!!busy} className="dc-pill-ghost flex-1" style={{ minHeight: 46 }}>
            <ThumbsDown className="w-4 h-4" /> No, still broken
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="dc-mono">What&apos;s still wrong? (optional)</span>
            <button type="button" onClick={() => setShowReject(false)} className="text-slate-400 hover:text-alert">
              <X className="w-4 h-4" />
            </button>
          </div>
          <textarea
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. the light flickers, or only half the pothole is filled"
            className="dc-field resize-none"
            style={{ height: 70, fontSize: 14 }}
          />
          <button onClick={doReject} disabled={busy === "reject"} className="dc-pill w-full" style={{ minHeight: 46, background: "#b23c2e", boxShadow: "0 4px 0 rgba(140,44,34,.9)" }}>
            {busy === "reject" ? <Loader2 className="w-4 h-4 animate-spin" /> : "Send it back to the team"}
          </button>
        </div>
      )}
    </div>
  );
}
