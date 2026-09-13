"use server";

import { prisma } from "@/lib/prisma";
import { getSession } from "@/app/actions/auth";

export type NotificationItem = {
  id: number;
  type: string;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: Date;
};

/** Latest notifications for the signed-in user, plus the unread count. */
export async function getNotifications(): Promise<{ items: NotificationItem[]; unread: number }> {
  const session = await getSession();
  if (!session) return { items: [], unread: 0 };

  const [items, unread] = await Promise.all([
    prisma.notification.findMany({
      where: { userId: session.id },
      orderBy: { createdAt: "desc" },
      take: 25,
    }),
    prisma.notification.count({ where: { userId: session.id, read: false } }),
  ]);

  return { items, unread };
}

export async function markNotificationRead(id: number) {
  const session = await getSession();
  if (!session) return { success: false };
  await prisma.notification.updateMany({
    where: { id, userId: session.id },
    data: { read: true },
  });
  return { success: true };
}

export async function markAllNotificationsRead() {
  const session = await getSession();
  if (!session) return { success: false };
  await prisma.notification.updateMany({
    where: { userId: session.id, read: false },
    data: { read: true },
  });
  return { success: true };
}
