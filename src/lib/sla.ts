/**
 * SLA windows per severity, and how many of those windows a complaint has
 * blown past. Shared by the worker dashboard's "6h remaining" badge and
 * the escalation cron (src/app/api/cron/escalate/route.ts) — one source
 * of truth for what "overdue" means.
 */
export const SLA_HOURS: Record<string, number> = {
  HIGH: 24,
  MEDIUM: 72,
  LOW: 168,
};

export function slaHoursFor(severity: string | null | undefined): number {
  return SLA_HOURS[severity || "LOW"] ?? SLA_HOURS.LOW;
}

export function getSLA(createdAt: Date, severity: string | null | undefined) {
  const hours = slaHoursFor(severity);
  const deadline = new Date(createdAt.getTime() + hours * 60 * 60 * 1000);
  const diffHours = (deadline.getTime() - Date.now()) / (1000 * 60 * 60);

  if (diffHours < 0) return { text: `${Math.abs(Math.round(diffHours))}h OVERDUE`, urgent: true };
  return { text: `${Math.round(diffHours)}h remaining`, urgent: diffHours < 12 };
}

/**
 * How many full SLA windows overdue this complaint is — 0 while it's
 * still on time, 1 the moment it first breaches, 2+ for every further
 * window it sits open past that. Capped at 3: beyond that, more tiers
 * don't add anything actionable.
 */
export function escalationTierFor(createdAt: Date, severity: string | null | undefined): number {
  const hours = slaHoursFor(severity);
  const ageHours = (Date.now() - createdAt.getTime()) / (1000 * 60 * 60);
  if (ageHours <= hours) return 0;
  return Math.min(3, Math.floor(ageHours / hours));
}
