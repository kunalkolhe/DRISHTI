import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { escalationTierFor } from "@/lib/sla";
import { notify, notifyWorkersInArea } from "@/lib/notify";

export const dynamic = "force-dynamic";

/**
 * Auto-escalation on SLA breach — meant to be hit on a schedule (Vercel
 * Cron, or any external scheduler like cron-job.org / a GitHub Actions
 * scheduled workflow) roughly hourly, not by a browser.
 *
 * Every OPEN/ROUTED/REOPENED complaint's age is checked against its SLA
 * window (src/lib/sla.ts). The first time it breaches, the area's field
 * workers get an urgent notification. Every *additional* full SLA window
 * it's still not fixed, admins get notified instead — the assumption
 * being a worker had their chance, this now needs a human escalating it
 * outside the app (chasing the department, reassigning it, etc.).
 * `slaEscalationTier` on the complaint makes each tier fire exactly once,
 * not on every run of this job.
 *
 * Deliberately does NOT touch `severity`: an earlier version bumped it up
 * a notch on breach, which shrinks that complaint's own SLA window on the
 * next run (HIGH's window is shorter than MEDIUM's) and caused runaway
 * re-escalation straight to the max tier one run later. Caught by actually
 * running this twice in a row before calling it done, not hypothetical.
 *
 * Auth: requires `Authorization: Bearer <CRON_SECRET>`. Vercel Cron sends
 * that automatically when a CRON_SECRET env var is set on the project;
 * any other scheduler just needs that header configured by hand.
 */
export async function GET(req: NextRequest) {
  const secret = process.env.CRON_SECRET;
  if (!secret) {
    console.error("escalate cron: CRON_SECRET is not set — refusing to run.");
    return NextResponse.json({ error: "Not configured" }, { status: 503 });
  }
  if (req.headers.get("authorization") !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const candidates = await prisma.complaint.findMany({
    where: { status: { in: ["OPEN", "ROUTED", "REOPENED"] } },
    select: { id: true, createdAt: true, severity: true, address: true, slaEscalationTier: true },
  });

  let escalated = 0;
  const results: { id: number; tier: number }[] = [];

  for (const c of candidates) {
    const targetTier = escalationTierFor(c.createdAt, c.severity);
    if (targetTier <= c.slaEscalationTier) continue; // not a new breach — leave it alone

    await prisma.complaint.update({
      where: { id: c.id },
      data: { slaEscalationTier: targetTier, lastEscalatedAt: new Date() },
    });

    if (targetTier === 1) {
      await notifyWorkersInArea(
        c.address,
        "SLA_ESCALATED",
        "Overdue complaint — please prioritize",
        `Complaint #${c.id} has passed its SLA window without being fixed.`,
        { link: "/worker", complaintId: c.id },
      );
    } else {
      const admins = await prisma.user.findMany({ where: { role: "ADMIN" }, select: { id: true } });
      for (const admin of admins) {
        await notify(
          admin.id,
          "SLA_ESCALATED",
          `Complaint #${c.id} is severely overdue (tier ${targetTier})`,
          "It's breached its SLA more than once now — may need manual follow-up with the department.",
          { link: "/admin", complaintId: c.id },
        );
      }
    }

    escalated++;
    results.push({ id: c.id, tier: targetTier });
  }

  return NextResponse.json({ ok: true, checked: candidates.length, escalated, results });
}
