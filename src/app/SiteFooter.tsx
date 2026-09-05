import Link from "next/link";
import { ArrowRight } from "lucide-react";
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

      <div className="relative mx-auto max-w-[1320px] px-5 pb-10 pt-14 sm:px-8 sm:pt-16 lg:px-12">
        {/* CTA band */}
        <div className="flex flex-col gap-6 border-b border-[#d8d4c6]/12 pb-12 sm:flex-row sm:items-end sm:justify-between">
          <div className="flex flex-col gap-3">
            <span className="font-mono text-[10px] font-medium uppercase tracking-[0.24em] text-[#b5762a]">
              Something broken in your area?
            </span>
            <h2 className="m-0 max-w-[16ch] text-[clamp(28px,4vw,44px)] font-bold leading-[1.08] tracking-[-0.02em] text-[#eee8da]">
              Report it once. We&apos;ll chase it.
            </h2>
          </div>
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-3 self-start rounded-2xl bg-[#eee8da] px-7 py-4 text-[17px] font-semibold leading-none text-[#12150f] no-underline shadow-[0_4px_0_rgba(181,118,42,0.9)] transition-transform hover:-translate-y-0.5 sm:self-auto"
          >
            Report a problem <ArrowRight className="h-4 w-4" />
          </Link>
        </div>

        {/* body */}
        <div className="grid gap-10 py-12 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
          {/* brand */}
          <div className="flex max-w-[320px] flex-col gap-4">
            <div className="flex items-center gap-3">
              <LogoMark size={40} />
              <span className="flex flex-col gap-[3px]">
                <span className="text-[21px] font-semibold leading-none tracking-[-0.045em] text-[#eee8da]">
                  DRISHTI
                </span>
                <span className="font-mono text-[9px] uppercase leading-none tracking-[0.22em] text-[#8a8f7f]">
                  Civic proof
                </span>
              </span>
            </div>
            <ul className="m-0 flex list-none flex-col gap-2 p-0">
              {PROMISES.map((p) => (
                <li
                  key={p}
                  className="flex items-start gap-2 text-[13.5px] leading-snug text-[#9a9a88]"
                >
                  <span className="mt-[7px] h-[5px] w-[5px] flex-none rounded-full bg-[#b5762a]" />
                  {p}
                </li>
              ))}
            </ul>
          </div>

          {/* link columns */}
          {COLUMNS.map((col) => (
            <div key={col.head} className="flex flex-col gap-3.5">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#5f7d54]">
                {col.head}
              </span>
              {col.links.map((l) => (
                <Link
                  key={l.label}
                  href={l.href}
                  className="text-[14.5px] leading-tight text-[#c8c4b6] no-underline transition-colors hover:text-[#eee8da]"
                >
                  {l.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="flex flex-col gap-3 border-t border-[#d8d4c6]/12 pt-6 font-mono text-[11px] leading-relaxed tracking-[0.06em] text-[#8a8f7f] sm:flex-row sm:items-center sm:justify-between">
          <span>© {new Date().getFullYear()} DRISHTI · Built for a better city</span>
          <span>Hindi &amp; English · Works on any phone</span>
        </div>
      </div>
    </footer>
  );
}
