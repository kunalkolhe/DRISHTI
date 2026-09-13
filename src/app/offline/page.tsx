import Link from "next/link";
import { LogoMark } from "@/components/Logo";

// No cookies/headers/DB calls of its own on purpose (the shared Navbar in
// the root layout still reads a cookie, which makes every route in this
// app server-rendered per-request, this one included — that's fine, the
// service worker just fetches-and-caches whatever HTML comes back the
// first time it's reachable, then serves that same copy when it isn't).
export default function OfflinePage() {
  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-6 text-center"
      style={{ background: "#eee8da" }}
    >
      <LogoMark size={56} />
      <h1 className="mt-6 text-2xl font-display font-semibold text-primary">
        You&apos;re offline
      </h1>
      <p className="mt-2 max-w-sm text-slate-500 text-sm leading-relaxed">
        DRISHTI needs a connection to report issues, check your reports, or load anything
        live. Reconnect and try again — nothing you started has been lost.
      </p>
      <Link href="/" className="dc-pill mt-6" style={{ padding: "0 24px", minHeight: 48 }}>
        Try again
      </Link>
    </div>
  );
}
