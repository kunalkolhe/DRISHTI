import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { parseWorkerCardId, workerCardId } from "@/lib/qr";
import { ShieldCheck, ShieldX } from "lucide-react";

const ROLE_LABEL: Record<string, string> = {
  FIELD_WORKER: "Field Worker",
  CONTRACTOR: "Contractor (AMC / Warranty)",
  DEPT_OFFICER: "Department Officer",
  ADMIN: "Administrator",
};

const CREDENTIALLED = new Set(["FIELD_WORKER", "CONTRACTOR", "DEPT_OFFICER", "ADMIN"]);

export default async function VerifyWorkerPage({
  params,
}: {
  params: Promise<{ cardId: string }>;
}) {
  const { cardId } = await params;
  const userId = parseWorkerCardId(cardId);

  const worker = userId
    ? await prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, role: true, trustScore: true, createdAt: true },
      })
    : null;

  const valid = worker && CREDENTIALLED.has(worker.role);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center p-6" style={{ background: "#eee8da" }}>
      <div className="dc-surface p-8 max-w-sm w-full text-center space-y-5">
        <div
          className="w-20 h-20 rounded-full flex items-center justify-center mx-auto"
          style={
            valid
              ? { background: "#dee8c4", border: "1.5px solid rgba(13,83,71,.4)" }
              : { background: "#f3d9c9", border: "1.5px solid rgba(178,60,46,.4)" }
          }
        >
          {valid ? (
            <ShieldCheck className="w-10 h-10 text-primary" />
          ) : (
            <ShieldX className="w-10 h-10" style={{ color: "#b23c2e" }} />
          )}
        </div>

        {valid ? (
          <>
            <div>
              <div className="dc-mono">Verified credential</div>
              <h1 className="text-2xl font-display font-semibold text-primary mt-1">{worker.name}</h1>
            </div>
            <div className="dc-surface-soft p-4 text-left space-y-1.5">
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Card No</span>
                <span style={{ fontFamily: "var(--font-jetbrains), monospace" }}>{workerCardId(worker.id)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Role</span>
                <span className="font-semibold text-slate-800">{ROLE_LABEL[worker.role] || worker.role}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Active since</span>
                <span className="text-slate-800">
                  {new Date(worker.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-slate-500">Trust score</span>
                <span className="font-semibold" style={{ color: worker.trustScore >= 70 ? "#0d5347" : "#b23c2e" }}>
                  {Math.round(worker.trustScore)} / 100
                </span>
              </div>
            </div>
            <p className="text-xs text-slate-500">
              This person is a registered DRISHTI worker and is authorised to inspect and repair public assets on
              record. Repairs are still only closed with a geo-stamped photo from the site.
            </p>
          </>
        ) : (
          <>
            <div>
              <div className="dc-mono" style={{ color: "#b23c2e" }}>Not verified</div>
              <h1 className="text-xl font-display font-semibold text-slate-800 mt-1">
                No worker matches this card
              </h1>
            </div>
            <p className="text-sm text-slate-500">
              The code <span style={{ fontFamily: "var(--font-jetbrains), monospace" }}>{cardId}</span> does not
              belong to a registered DRISHTI field worker. Do not allow work on the asset — report it to the ward
              office.
            </p>
          </>
        )}

        <Link href="/" className="dc-pill-ghost w-full" style={{ minHeight: 46 }}>
          Back to DRISHTI
        </Link>
      </div>
    </div>
  );
}
