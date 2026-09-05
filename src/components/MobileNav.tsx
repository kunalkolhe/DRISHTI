"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Camera, Menu, X, LogOut } from "lucide-react";
import { logoutUser } from "@/app/actions/auth";

type Session = { role: string; name: string } | null;

export default function MobileNav({ session }: { session: Session }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const close = () => setOpen(false);

  const links: { href: string; label: string }[] = [
    { href: "/scorecard", label: "Ward scorecard" },
    { href: "/report", label: "Report a problem" },
  ];
  if (!session) {
    links.push({ href: "/login", label: "Login" });
  } else if (session.role === "CITIZEN") {
    links.push({ href: "/my-reports", label: "My reports" });
  } else if (session.role === "FIELD_WORKER") {
    links.push({ href: "/worker", label: "Worker dashboard" });
  } else if (session.role === "ADMIN") {
    links.push({ href: "/admin", label: "Admin panel" });
  }

  return (
    <div className="flex items-center gap-1 md:hidden">
      {/* Quick "report a problem" camera shortcut */}
      <Link
        href="/report"
        aria-label="Report a problem"
        onClick={close}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 40,
          height: 40,
          background: "#0d5347",
          color: "#f8fbf0",
          boxShadow: "0 3px 0 rgba(9,58,50,.9)",
        }}
      >
        <Camera className="w-[18px] h-[18px]" />
      </Link>

      {/* Menu toggle */}
      <button
        type="button"
        aria-label={open ? "Close menu" : "Open menu"}
        aria-expanded={open}
        onClick={() => setOpen((v) => !v)}
        className="flex items-center justify-center rounded-full"
        style={{
          width: 40,
          height: 40,
          background: "transparent",
          border: "1.5px solid rgba(18,21,15,.35)",
          color: "#12150f",
        }}
      >
        {open ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Dropdown sheet */}
      {open && (
        <>
          <div
            className="fixed inset-0 z-40"
            style={{ background: "rgba(18,21,15,.35)" }}
            onClick={() => setOpen(false)}
          />
          <div
            className="fixed left-0 right-0 z-50 p-4"
            style={{
              top: "var(--nav-h, 56px)",
              animation: "drishti-riseIn .22s ease",
            }}
          >
            <nav
              className="dc-surface flex flex-col overflow-hidden"
              style={{ padding: 0 }}
            >
              {links.map((l) => {
                const active = pathname === l.href;
                return (
                  <Link
                    key={l.href}
                    href={l.href}
                    onClick={close}
                    className="flex items-center justify-between px-5 py-4 text-[15px] font-medium"
                    style={{
                      color: active ? "#0d5347" : "#12150f",
                      background: active ? "rgba(13,83,71,.08)" : "transparent",
                      borderBottom: "1.5px solid rgba(18,21,15,.1)",
                      textDecoration: "none",
                    }}
                  >
                    {l.label}
                    {active && (
                      <span
                        className="dc-mono"
                        style={{ fontSize: 9, color: "#0d5347" }}
                      >
                        HERE
                      </span>
                    )}
                  </Link>
                );
              })}

              {session && (
                <form action={logoutUser}>
                  <button
                    type="submit"
                    className="flex w-full items-center gap-2 px-5 py-4 text-[15px] font-medium"
                    style={{
                      color: "#b23c2e",
                      background: "transparent",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    <LogOut className="w-4 h-4" /> Sign out
                    <span
                      className="dc-mono ml-auto"
                      style={{ fontSize: 9, color: "#8a8676" }}
                    >
                      {session.name}
                    </span>
                  </button>
                </form>
              )}
            </nav>
          </div>
        </>
      )}
    </div>
  );
}
