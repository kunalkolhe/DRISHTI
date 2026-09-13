/**
 * Notification creation — plain server-only helpers (not server actions).
 * Called from inside the complaint server actions right after the DB write
 * that should trigger an alert. Every call is wrapped so a notification
 * failure can never break the action that triggered it (reporting, resolving,
 * confirming, rejecting a complaint must all still succeed either way).
 */
import { prisma } from "@/lib/prisma";
import type { NotificationType } from "@prisma/client";

export async function notify(
  userId: number,
  type: NotificationType,
  title: string,
  message: string,
  opts?: { link?: string; complaintId?: number },
) {
  try {
    await prisma.notification.create({
      data: {
        userId,
        type,
        title,
        message,
        link: opts?.link ?? null,
        complaintId: opts?.complaintId ?? null,
      },
    });
  } catch (e) {
    console.error("notify() failed:", e);
  }
}

/**
 * Notifies every field worker whose allocated area is a substring of the
 * complaint's address — the same case-insensitive match the worker
 * dashboard already uses to decide which complaints a worker sees.
 */
export async function notifyWorkersInArea(
  address: string | null | undefined,
  type: NotificationType,
  title: string,
  message: string,
  opts?: { link?: string; complaintId?: number },
) {
  const addr = (address || "").trim();
  if (!addr) return;

  try {
    const workers = await prisma.user.findMany({
      where: { role: "FIELD_WORKER", area: { not: null } },
      select: { id: true, area: true },
    });
    const matched = workers.filter(
      (w) => w.area && addr.toLowerCase().includes(w.area.toLowerCase()),
    );
    if (!matched.length) return;

    await prisma.notification.createMany({
      data: matched.map((w) => ({
        userId: w.id,
        type,
        title,
        message,
        link: opts?.link ?? null,
        complaintId: opts?.complaintId ?? null,
      })),
    });
  } catch (e) {
    console.error("notifyWorkersInArea() failed:", e);
  }
}
