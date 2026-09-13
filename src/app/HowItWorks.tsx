"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, QrCode, ScanLine, ShieldCheck } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import type { TranslationKey } from "@/lib/i18n/translations";

type Step = {
  n: string;
  titleKey: TranslationKey;
  bodyKey: TranslationKey;
  metaKey: TranslationKey;
  icon: React.ElementType;
  reveal: { headKey: TranslationKey; bodyKey: TranslationKey; metaKey: TranslationKey };
};

const STEPS: Step[] = [
  {
    n: "01",
    titleKey: "how.step1.title",
    bodyKey: "how.step1.body",
    metaKey: "how.step1.meta",
    icon: QrCode,
    reveal: { headKey: "how.step1.revealHead", bodyKey: "how.step1.revealBody", metaKey: "how.step1.revealMeta" },
  },
  {
    n: "02",
    titleKey: "how.step2.title",
    bodyKey: "how.step2.body",
    metaKey: "how.step2.meta",
    icon: ScanLine,
    reveal: { headKey: "how.step2.revealHead", bodyKey: "how.step2.revealBody", metaKey: "how.step2.revealMeta" },
  },
  {
    n: "03",
    titleKey: "how.step3.title",
    bodyKey: "how.step3.body",
    metaKey: "how.step3.meta",
    icon: Camera,
    reveal: { headKey: "how.step3.revealHead", bodyKey: "how.step3.revealBody", metaKey: "how.step3.revealMeta" },
  },
  {
    n: "04",
    titleKey: "how.step4.title",
    bodyKey: "how.step4.body",
    metaKey: "how.step4.meta",
    icon: ShieldCheck,
    reveal: { headKey: "how.step4.revealHead", bodyKey: "how.step4.revealBody", metaKey: "how.step4.revealMeta" },
  },
];

export default function HowItWorks({
  autoDemo = true,
  showConnector = true,
}: {
  autoDemo?: boolean;
  showConnector?: boolean;
}) {
  const { t } = useLanguage();
  const [active, setActive] = useState<number | null>(null);
  const [touched, setTouched] = useState(false);
  const [cycle, setCycle] = useState(0);

  useEffect(() => {
    if (!autoDemo || touched) return;
    const t = setInterval(() => setCycle((c) => (c + 1) % 6), 2100);
    return () => clearInterval(t);
  }, [autoDemo, touched]);

  const isOn = (i: number) =>
    active !== null ? active === i : !touched && cycle === i + 1;

  const open = (i: number) => {
    setActive(i);
    setTouched(true);
  };

  return (
    <section id="how-it-works" className="relative overflow-hidden bg-[#eee8da] px-5 pb-16 pt-16 text-[#0d5347] sm:px-8 sm:pb-20 sm:pt-20 lg:px-10 lg:pb-24 lg:pt-22">
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(#0d5347 1px,transparent 1px),linear-gradient(90deg,#0d5347 1px,transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />
      <div className="pointer-events-none absolute -right-40 -top-28 h-[480px] w-[520px] rounded-full bg-[#dee8c4]/50" />

      <div className="relative mx-auto flex max-w-[1560px] flex-col gap-13">
        <div className="flex flex-col gap-5">
          <span className="font-mono text-xs font-medium leading-none tracking-[0.24em]">
            {t("how.eyebrow")}
          </span>
          <h2 className="m-0 text-[clamp(32px,4.6vw,72px)] font-bold leading-[1.1] tracking-[-0.02em]">
            <span className="block">{t("how.title1")}</span>
            <span className="block text-transparent opacity-60 [-webkit-text-stroke:1.6px_#0d5347]">
              {t("how.title2")}
            </span>
          </h2>
          <p className="m-0 max-w-[540px] text-lg leading-relaxed text-[#0d5347]/80 sm:text-xl [text-wrap:pretty]">
            {t("how.subtitle")}
          </p>
          <p className="m-0 flex items-center gap-2.5 font-mono text-[11.5px] leading-none tracking-[0.16em] text-[#0d5347]/60">
            <span className="dr-pulse h-2 w-2 rounded-full bg-[#b5762a]" />
            {t("how.hint")}
          </p>
        </div>

        <div className="relative">
          {showConnector && (
            <div className="pointer-events-none absolute left-[6%] right-[6%] top-9 h-0.5 bg-[repeating-linear-gradient(90deg,rgba(13,83,71,0.4)_0_6px,transparent_6px_16px)]" />
          )}

          <div className="relative grid gap-5.5 [grid-template-columns:repeat(auto-fit,minmax(215px,1fr))]">
            {STEPS.map((s, i) => {
              const Icon = s.icon;
              const on = isOn(i);
              return (
                <div
                  key={s.n}
                  role="button"
                  tabIndex={0}
                  onMouseEnter={() => open(i)}
                  onMouseLeave={() => setActive(null)}
                  onFocus={() => open(i)}
                  onBlur={() => setActive(null)}
                  onClick={() => {
                    setTouched(true);
                    setActive((a) => (a === i ? null : i));
                  }}
                  className="relative isolate flex min-h-[278px] cursor-pointer flex-col gap-3.5 overflow-hidden rounded-[18px] border-[1.5px] border-[#0d5347] bg-[#f7f3e8] p-5 pb-4.5 shadow-[7px_8px_0_#0d5347] outline-none transition-all duration-300 hover:translate-x-1 hover:translate-y-[5px] hover:shadow-[4px_5px_0_#0d5347] focus-visible:translate-x-1 focus-visible:translate-y-[5px] focus-visible:shadow-[4px_5px_0_#0d5347]"
                >
                  <div className="flex items-center justify-between">
                    <span className="rounded-[20px] bg-[#dee8c4] px-3 py-1.5 font-mono text-xs font-medium leading-none tracking-[0.1em]">
                      {s.n}
                    </span>
                    <span className="flex h-8 w-8 items-center justify-center rounded-full border-[1.5px] border-[#0d5347]/40">
                      <ArrowRight size={14} strokeWidth={2} />
                    </span>
                  </div>

                  <span className="text-[21px] font-semibold leading-tight tracking-[-0.01em]">
                    {t(s.titleKey)}
                  </span>
                  <p className="m-0 text-[14.5px] leading-normal text-[#0d5347]/80 [text-wrap:pretty]">
                    {t(s.bodyKey)}
                  </p>

                  <div className="mt-auto flex flex-col gap-2.5">
                    <span className="h-px bg-[#0d5347]/20" />
                    <span className="font-mono text-[10px] leading-tight tracking-[0.12em] text-[#0d5347]/60">
                      {t(s.metaKey)}
                    </span>
                  </div>

                  {/* accent rail */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-[5px] origin-left bg-[#b5762a] transition-transform duration-300"
                    style={{ transform: `scaleX(${on ? 1 : 0})` }}
                  />

                  {/* reveal sheet */}
                  <div
                    className="absolute inset-0 z-[2] flex flex-col justify-center gap-3.5 bg-[#0d5347] p-5 text-[#f2ecdd] transition-all duration-[420ms] ease-[cubic-bezier(0.22,1,0.36,1)]"
                    style={{
                      transform: on ? "translateY(0)" : "translateY(101%)",
                      opacity: on ? 1 : 0,
                    }}
                  >
                    <Icon size={30} strokeWidth={1.8} className="text-[#dee8c4]" />
                    <span className="text-[17px] font-semibold leading-snug">
                      {t(s.reveal.headKey)}
                    </span>
                    <p className="m-0 text-[13.5px] leading-normal text-[#f2ecdd]/85 [text-wrap:pretty]">
                      {t(s.reveal.bodyKey)}
                    </p>
                    <span className="font-mono text-[10px] leading-tight tracking-[0.14em] text-[#b5762a]">
                      {t(s.reveal.metaKey)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
          <Link
            href="/report"
            className="inline-flex items-center justify-center gap-4 rounded-2xl bg-[#0d5347] px-6 py-4 text-[#f2ecdd] no-underline transition-transform hover:-translate-y-0.5 sm:gap-6 sm:px-8 sm:py-5"
          >
            <span className="text-[19px] font-semibold leading-none sm:text-[22px]">
              {t("cta.reportProblem")}
            </span>
            <span className="font-mono text-xs leading-none tracking-[0.16em] opacity-70">
              {t("hero.twoTaps")}
            </span>
          </Link>
          <Link
            href="/scorecard"
            className="inline-flex items-center justify-center gap-3 border-b-2 border-[#0d5347]/35 pb-2 text-[18px] font-semibold leading-tight no-underline sm:text-[21px]"
          >
            {t("how.seeWard")} <span className="text-[19px]">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
