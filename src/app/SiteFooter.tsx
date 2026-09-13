"use client";

import Link from "next/link";
import { LogoMark } from "@/components/Logo";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

export default function SiteFooter() {
  const { t } = useLanguage();

  const columns: { headKey: TranslationKey; links: { labelKey: TranslationKey; href: string }[] }[] = [
    {
      headKey: "footer.col.report",
      links: [
        { labelKey: "footer.link.reportProblem", href: "/report" },
        { labelKey: "footer.link.checkComplaint", href: "/my-reports" },
        { labelKey: "footer.link.scanQr", href: "/report" },
      ],
    },
    {
      headKey: "footer.col.transparency",
      links: [
        { labelKey: "footer.link.wardScorecard", href: "/scorecard" },
        { labelKey: "footer.link.howItWorks", href: "/#how-it-works" },
      ],
    },
    {
      headKey: "footer.col.account",
      links: [
        { labelKey: "footer.link.citizenLogin", href: "/login" },
        { labelKey: "footer.link.workerSignin", href: "/login" },
      ],
    },
  ];

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
                  {t("footer.civicProof")}
                </span>
              </span>
            </div>
            <p className="m-0 text-[13px] leading-snug text-[#9a9a88]">{t("footer.tagline")}</p>
          </div>

          {/* link columns */}
          {columns.map((col) => (
            <div key={col.headKey} className="flex flex-col gap-2.5">
              <span className="font-mono text-[10px] font-medium uppercase tracking-[0.18em] text-[#5f7d54]">
                {t(col.headKey)}
              </span>
              {col.links.map((l) => (
                <Link
                  key={l.labelKey}
                  href={l.href}
                  className="text-[14px] leading-tight text-[#c8c4b6] no-underline transition-colors hover:text-[#eee8da]"
                >
                  {t(l.labelKey)}
                </Link>
              ))}
            </div>
          ))}
        </div>

        {/* bottom bar */}
        <div className="mt-8 flex flex-col gap-2 border-t border-[#d8d4c6]/12 pt-5 font-mono text-[10.5px] leading-relaxed tracking-[0.06em] text-[#8a8f7f] sm:flex-row sm:items-center sm:justify-between">
          <span>{t("footer.copyright", { year: new Date().getFullYear() })}</span>
          <span>{t("footer.languages")}</span>
        </div>
      </div>
    </footer>
  );
}
