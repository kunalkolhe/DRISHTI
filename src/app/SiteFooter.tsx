import Link from "next/link";
import { LogoMark } from "@/components/Logo";

const COLUMNS: { head: string; links: { label: string; href: string }[] }[] = [
  {
    head: "Report",
    links: [
      { label: "Report a problem", href: "/report" },
      { label: "Check my complaint", href: "/my-reports" },
      { label: "Scan an asset QR", href: "/report" },
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
      { label: "Citizen login", href: "/login" },
      { label: "Worker sign-in", href: "/login" },
    ],
  },
];

const PROMISES = [
  "Every asset has an ID",
  "Every fix has proof from the spot",
  "You get the final say",
];

export default function SiteFooter() {
  return (
    <footer className="relative overflow-hidden bg-[#12150f] text-[#d8d4c6]">
      {/* faint grid, echoing the hero */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            "linear-gradient(#eee8da 1px,transparent 1px),linear-gradient(90deg,#eee8da 1px,transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-5 py-10 sm:px-8 lg:px-12">
        {/* body */}
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
          {/* brand */}
          <div className="flex max-w-[320px] flex-col gap-3">
            <div className="flex items-center gap-3">
              <LogoMark size={36} />
              <span className="flex flex-col gap-[3px]">
                <span className="text-[19px] font-semibold leading-none tracking-[-0.045em] text-[#eee8da]">
                  DRISHTI
                </span>
                <span className="font-mono text-[9px] uppercase leading-none tracking-[0.22em] text-[#8a8f7f]">
                  Civic proof
                </span>
              </span>
            </div>
            <p className="m-0 text-[13px] leading-snug text-[#9a9a88]">
              {PROMISES.join(" · ")}.
            </p>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <div key={col.head} className="flex flex-col gap-2.5">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#5f7d54]">
                {col.head}
              </span>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-[14px] leading-tight text-[#c8c4b6] no-underline transition-colors hover:text-[#eee8da]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-[#d8d4c6]/12 pt-5 font-mono text-[10.5px] leading-relaxed tracking-[0.06em] text-[#8a8f7f] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DRISHTI · Built for a better city</span>
          <span>Hindi &amp; English · Works on any phone</span>
        </div>
      </div>
    </footer>
  );
}
