import Link from "next/link";
import { getSession, logoutUser } from "@/app/actions/auth";
import { LogOut } from "lucide-react";
import Logo from "@/components/Logo";

export default async function Navbar() {
  const session = await getSession();

  return (
    <header
      className="w-full sticky top-0 z-50"
      style={{
        background: "#eee8da",
        borderBottom: "1px solid rgba(18,21,15,.16)",
      }}
    >
      <div className="max-w-7xl mx-auto px-6 py-3.5 flex justify-between items-center gap-3 flex-wrap">
        <div className="mr-auto">
          <Logo href="/" size={36} />
        </div>

        <nav className="flex gap-2 items-center flex-wrap" style={{ fontSize: 15 }}>
          <Link href="/scorecard" className="drishti-hover drishti-navlink hidden md:inline-block" style={{ color: "#3d433a", padding: "9px 14px", borderRadius: 999, textDecoration: "none" }}>
            Scorecard
          </Link>

          {!session ? (
            <>
              <Link href="/login" className="drishti-hover drishti-navlink" style={{ color: "#3d433a", padding: "9px 14px", borderRadius: 999, textDecoration: "none" }}>
                Login
              </Link>
              <Link href="/report" className="drishti-hover drishti-navcta" style={{ fontWeight: 500, background: "#12150f", color: "#eee8da", padding: "0 22px", minHeight: 44, borderRadius: 999, display: "inline-flex", alignItems: "center", boxShadow: "0 3px 0 rgba(18,21,15,.45)", textDecoration: "none" }}>
                Report a problem
              </Link>
            </>
          ) : (
            <>
              {session.role === "CITIZEN" && (
                <Link href="/my-reports" className="drishti-hover drishti-navlink" style={{ color: "#3d433a", padding: "9px 14px", borderRadius: 999, textDecoration: "none" }}>
                  My Reports
                </Link>
              )}
              {session.role === "FIELD_WORKER" && (
                <Link href="/worker" className="drishti-hover drishti-navcta" style={{ fontWeight: 500, background: "#0d5347", color: "#f8fbf0", padding: "0 20px", minHeight: 44, borderRadius: 999, display: "inline-flex", alignItems: "center", boxShadow: "0 3px 0 rgba(9,58,50,.9)", textDecoration: "none" }}>
                  Worker Dashboard
                </Link>
              )}
              {session.role === "ADMIN" && (
                <Link href="/admin" className="drishti-hover drishti-navcta" style={{ fontWeight: 500, background: "#12150f", color: "#eee8da", padding: "0 20px", minHeight: 44, borderRadius: 999, display: "inline-flex", alignItems: "center", boxShadow: "0 3px 0 rgba(18,21,15,.45)", textDecoration: "none" }}>
                  Admin Panel
                </Link>
              )}

              <div className="flex items-center gap-3 pl-3" style={{ borderLeft: "1px solid rgba(18,21,15,.18)", marginLeft: 6 }}>
                <span className="dc-mono hidden sm:inline-block" style={{ fontSize: 10, color: "#3d433a" }}>{session.name}</span>
                <form action={logoutUser}>
                  <button type="submit" title="Logout" className="p-1" style={{ background: "transparent", border: "none", cursor: "pointer", color: "#8a8676" }}>
                    <LogOut className="w-4 h-4" />
                  </button>
                </form>
              </div>
            </>
          )}
        </nav>
      </div>
    </header>
  );
}
