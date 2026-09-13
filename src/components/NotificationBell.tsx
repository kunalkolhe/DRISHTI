"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { Bell } from "lucide-react";
import {
  getNotifications,
  markNotificationRead,
  markAllNotificationsRead,
  type NotificationItem,
} from "@/app/actions/notifications";

const POLL_MS = 25000;

function timeAgo(d: Date | string) {
  const ms = Date.now() - new Date(d).getTime();
  const min = Math.floor(ms / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr}h ago`;
  return `${Math.floor(hr / 24)}d ago`;
}

export default function NotificationBell() {
  const [items, setItems] = useState<NotificationItem[]>([]);
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  const refresh = useCallback(async () => {
    const r = await getNotifications();
    setItems(r.items);
    setUnread(r.unread);
  }, []);

  // Poll for new alerts — no websocket infra here, so this is the working
  // mechanism: fetch on mount, every 25s, and whenever the tab regains focus.
  useEffect(() => {
    // Initial load, then poll — this *is* "subscribing to an external
    // system's updates" (the notifications table), which is exactly what
    // effects are for; the lint rule can't see that refresh() only ever
    // calls setState from inside its own resolved promise, not synchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    refresh();
    const interval = setInterval(refresh, POLL_MS);
    const onVisible = () => {
      if (document.visibilityState === "visible") refresh();
    };
    document.addEventListener("visibilitychange", onVisible);
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisible);
    };
  }, [refresh]);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const openItem = async (item: NotificationItem) => {
    setOpen(false);
    if (item.read) return;
    setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, read: true } : i)));
    setUnread((u) => Math.max(0, u - 1));
    await markNotificationRead(item.id);
  };

  const markAll = async () => {
    setItems((prev) => prev.map((i) => ({ ...i, read: true })));
    setUnread(0);
    await markAllNotificationsRead();
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        aria-label={unread > 0 ? `Notifications (${unread} unread)` : "Notifications"}
        onClick={() => setOpen((v) => !v)}
        className="relative flex items-center justify-center rounded-full"
        style={{
          width: 36,
          height: 36,
          background: open ? "rgba(13,83,71,.1)" : "transparent",
          border: "1.5px solid rgba(18,21,15,.18)",
          cursor: "pointer",
        }}
      >
        <Bell className="w-4 h-4" style={{ color: "#12150f" }} />
        {unread > 0 && (
          <span
            className="absolute flex items-center justify-center rounded-full font-mono"
            style={{
              top: -4,
              right: -4,
              minWidth: 16,
              height: 16,
              padding: "0 3px",
              fontSize: 9,
              background: "#b23c2e",
              color: "#fff",
              lineHeight: 1,
            }}
          >
            {unread > 9 ? "9+" : unread}
          </span>
        )}
      </button>

      {open && (
        <div
          className="dc-surface absolute right-0 mt-2 overflow-hidden text-left"
          style={{ width: 320, maxWidth: "calc(100vw - 32px)", padding: 0, zIndex: 60 }}
        >
          <div
            className="flex items-center justify-between px-4 py-3"
            style={{ borderBottom: "1.5px solid rgba(18,21,15,.12)" }}
          >
            <span className="dc-mono">Notifications</span>
            {unread > 0 && (
              <button
                type="button"
                onClick={markAll}
                className="dc-mono"
                style={{ color: "#0d5347", background: "none", border: "none", cursor: "pointer" }}
              >
                Mark all read
              </button>
            )}
          </div>

          <div style={{ maxHeight: 360, overflowY: "auto" }}>
            {items.length === 0 ? (
              <p className="px-4 py-8 text-center text-sm text-slate-400">
                No notifications yet.
              </p>
            ) : (
              items.map((item) => {
                const row = (
                  <div
                    className="flex flex-col gap-1 px-4 py-3"
                    style={{
                      borderBottom: "1px solid rgba(18,21,15,.08)",
                      background: item.read ? "transparent" : "rgba(13,83,71,.06)",
                    }}
                  >
                    <div className="flex items-start justify-between gap-2">
                      <span className="text-sm font-semibold text-slate-800">{item.title}</span>
                      {!item.read && (
                        <span
                          className="flex-none rounded-full"
                          style={{ width: 7, height: 7, marginTop: 5, background: "#0d5347" }}
                        />
                      )}
                    </div>
                    <span className="text-xs leading-snug text-slate-500">{item.message}</span>
                    <span className="dc-mono" style={{ fontSize: 9 }}>
                      {timeAgo(item.createdAt)}
                    </span>
                  </div>
                );
                return item.link ? (
                  <Link
                    key={item.id}
                    href={item.link}
                    onClick={() => openItem(item)}
                    style={{ display: "block", textDecoration: "none", color: "inherit" }}
                  >
                    {row}
                  </Link>
                ) : (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => openItem(item)}
                    style={{ display: "block", width: "100%", textAlign: "left", background: "none", border: "none", padding: 0, cursor: "pointer" }}
                  >
                    {row}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
