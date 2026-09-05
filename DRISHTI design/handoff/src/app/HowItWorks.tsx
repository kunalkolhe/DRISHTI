"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { ArrowRight, Camera, QrCode, ScanLine, ShieldCheck } from "lucide-react";

type Step = {
  n: string;
  title: string;
  body: string;
  meta: string;
  icon: React.ElementType;
  reveal: { head: string; body: string; meta: string };
};

const STEPS: Step[] = [
  {
    n: "01",
    title: "Find the QR tag",
    body: "Every streetlight, handpump and public toilet carries a small DRISHTI tag with its own ID.",
    meta: "ONE ASSET · ONE ID",
    icon: QrCode,
    reveal: {
      head: "The tag is the address.",
      body: "You don't type a street name or pick from a list. The tag already knows which pole it is, so nothing gets filed against \u201csomewhere on MG Road\u201d.",
      meta: "NO ADDRESS TYPING",
    },
  },
  {
    n: "02",
    title: "Scan with any phone",
    body: "Point your camera at the tag. No app to install, no login to remember. It opens in the browser.",
    meta: "WORKS ON ANY PHONE",
    icon: ScanLine,
    reveal: {
      head: "Nothing to download.",
      body: "The scan opens a plain web page — it works on a ₹4,000 phone, on 2G, and for someone using it for the first time.",
      meta: "NO APP · NO LOGIN",
    },
  },
  {
    n: "03",
    title: "Report in two taps",
    body: "Snap a photo or record a voice note in Hindi or English. Location is stamped on capture.",
    meta: "GEO-STAMPED ON CAPTURE",
    icon: Camera,
    reveal: {
      head: "Two taps, then you're done.",
      body: "No forms, no department names to guess. Speak it in your language if typing is hard — the time and place are attached automatically.",
      meta: "VOICE NOTES WELCOME",
    },
  },
  {
    n: "04",
    title: "You close the file",
    body: "The team fixes it and uploads a photo from the spot. Your tap — nobody else's — closes the complaint.",
    meta: "NO PROOF, NO CLOSURE",
    icon: ShieldCheck,
    reveal: {
      head: "Only you can mark it fixed.",
      body: "A geo-stamped photo from the site is mandatory before anyone can ask you to sign off — and if it isn't actually fixed, you reopen it in one tap.",
      meta: "CITIZEN HAS THE LAST WORD",
    },
  },
];

export default function HowItWorks({
  autoDemo = true,
  showConnector = true,
}: {
  autoDemo?: boolean;
  showConnector?: boolean;
}) {
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
    <section className="relative overflow-hidden bg-[#eee8da] px-10 pb-24 pt-22 text-[#0d5347]">
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
            HOW IT WORKS
          </span>
          <h2 className="m-0 text-[clamp(40px,4.6vw,72px)] font-bold leading-[1.08] tracking-[-0.02em]">
            <span className="block">From a broken light to a</span>
            <span className="block text-transparent opacity-60 [-webkit-text-stroke:1.6px_#0d5347]">
              proven fix.
            </span>
          </h2>
          <p className="m-0 max-w-[540px] text-xl leading-relaxed text-[#0d5347]/80 [text-wrap:pretty]">
            Four steps. The first two take you seconds. The last one puts the
            decision in your hands.
          </p>
          <p className="m-0 flex items-center gap-2.5 font-mono text-[11.5px] leading-none tracking-[0.16em] text-[#0d5347]/60">
            <span className="dr-pulse h-2 w-2 rounded-full bg-[#c9a84c]" />
            HOVER OR TAP A STEP TO SEE WHAT IT MEANS
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
                    {s.title}
                  </span>
                  <p className="m-0 text-[14.5px] leading-normal text-[#0d5347]/80 [text-wrap:pretty]">
                    {s.body}
                  </p>

                  <div className="mt-auto flex flex-col gap-2.5">
                    <span className="h-px bg-[#0d5347]/20" />
                    <span className="font-mono text-[10px] leading-tight tracking-[0.12em] text-[#0d5347]/60">
                      {s.meta}
                    </span>
                  </div>

                  {/* accent rail */}
                  <div
                    className="absolute inset-x-0 bottom-0 h-[5px] origin-left bg-[#c9a84c] transition-transform duration-300"
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
                      {s.reveal.head}
                    </span>
                    <p className="m-0 text-[13.5px] leading-normal text-[#f2ecdd]/85 [text-wrap:pretty]">
                      {s.reveal.body}
                    </p>
                    <span className="font-mono text-[10px] leading-tight tracking-[0.14em] text-[#c9a84c]">
                      {s.reveal.meta}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-8">
          <Link
            href="/report"
            className="inline-flex items-center gap-6 rounded-2xl bg-[#0d5347] px-8 py-5 text-[#f2ecdd] no-underline transition-transform hover:-translate-y-0.5"
          >
            <span className="text-[22px] font-semibold leading-none">
              Report a problem
            </span>
            <span className="font-mono text-xs leading-none tracking-[0.16em] opacity-70">
              2 TAPS
            </span>
          </Link>
          <Link
            href="/ward"
            className="inline-flex items-center gap-3 border-b-2 border-[#0d5347]/35 pb-2 text-[21px] font-semibold leading-none no-underline"
          >
            See how your ward is doing <span className="text-[19px]">→</span>
          </Link>
        </div>
      </div>
    </section>
  );
}
