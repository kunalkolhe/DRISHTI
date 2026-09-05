import Link from "next/link";
import { LogoMark } from "@/components/Logo";

const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace";
const DISPLAY = "var(--font-bricolage), system-ui, sans-serif";

export default function SiteFooter() {
  return (
    <footer
      style={{
        position: "relative",
        background: "#12150f",
        color: "#d8d4c6",
        fontFamily: DISPLAY,
        padding: "48px clamp(20px, 6vw, 52px) 36px",
        borderTop: "1.5px solid rgba(18,21,15,.5)",
      }}
    >
      <div
        style={{
          maxWidth: 1320,
          margin: "0 auto",
          display: "flex",
          flexWrap: "wrap",
          gap: "36px 60px",
          alignItems: "flex-start",
          justifyContent: "space-between",
        }}
      >
        <div style={{ maxWidth: 340 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 13 }}>
            <LogoMark size={40} shadow={false} />
            <div style={{ display: "flex", flexDirection: "column", gap: 3 }}>
              <span
                style={{
                  fontSize: 21,
                  fontWeight: 600,
                  letterSpacing: "-0.045em",
                  lineHeight: 1,
                  color: "#eee8da",
                }}
              >
                DRISHTI
              </span>
              <span
                style={{
                  font: `400 9px/1 ${MONO}`,
                  letterSpacing: ".22em",
                  color: "#8a8f7f",
                  textTransform: "uppercase",
                }}
              >
                Civic proof
              </span>
            </div>
          </div>
          <p
            style={{
              margin: "18px 0 0",
              fontSize: 14.5,
              lineHeight: 1.6,
              color: "#9a9a88",
            }}
          >
            Every public asset has an ID. Every fix has proof from the spot. You
            get the final say.
          </p>
        </div>

        <div
          style={{
            display: "flex",
            gap: "40px 64px",
            flexWrap: "wrap",
          }}
        >
          {[
            {
              head: "Report",
              links: [
                { label: "Report a problem", href: "/report" },
                { label: "Check my complaint", href: "/my-reports" },
              ],
            },
            {
              head: "Transparency",
              links: [
                { label: "Ward scorecard", href: "/scorecard" },
                { label: "How it works", href: "/#how-it-works" },
              ],
            },
            {
              head: "Account",
              links: [
                { label: "Login", href: "/login" },
                { label: "Worker sign-in", href: "/login" },
              ],
            },
          ].map((col) => (
            <div
              key={col.head}
              style={{ display: "flex", flexDirection: "column", gap: 12 }}
            >
              <span
                style={{
                  font: `500 10px/1 ${MONO}`,
                  letterSpacing: ".18em",
                  textTransform: "uppercase",
                  color: "#0d5347",
                  filter: "brightness(1.7)",
                }}
              >
                {col.head}
              </span>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  style={{
                    fontSize: 14.5,
                    color: "#c8c4b6",
                    textDecoration: "none",
                  }}
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div
        style={{
          maxWidth: 1320,
          margin: "40px auto 0",
          paddingTop: 22,
          borderTop: "1px solid rgba(216,212,198,.14)",
          display: "flex",
          flexWrap: "wrap",
          gap: 14,
          justifyContent: "space-between",
          font: `400 11px/1.6 ${MONO}`,
          letterSpacing: ".08em",
          color: "#8a8f7f",
        }}
      >
        <span>© {new Date().getFullYear()} DRISHTI · Built for a better city</span>
        <span>Hindi &amp; English · Works on any phone</span>
      </div>
    </footer>
  );
}
