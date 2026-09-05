"use client";

import Link from "next/link";
import { Check, QrCode } from "lucide-react";

const PROMISES = [
  { label: "Photo from the spot", meta: "GEO-STAMPED ON CAPTURE" },
  { label: "Location matched", meta: "WITHIN 5 METRES" },
  { label: "You confirm it", meta: "YOUR TAP CLOSES THE FILE" },
];

const TICKER = [
  "41H MEDIAN VERIFIED FIX",
  "WORKS ON ANY PHONE",
  "HINDI & ENGLISH",
  "1,284 ASSETS IN YOUR WARD",
];

export default function Hero() {
  return (
    <section className="relative flex min-h-screen flex-col overflow-hidden bg-[#eee8da] text-[#0d5347]">
      {/* grid + blobs */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.045]"
        style={{
          backgroundImage:
            "linear-gradient(#0d5347 1px,transparent 1px),linear-gradient(90deg,#0d5347 1px,transparent 1px)",
          backgroundSize: "46px 46px",
        }}
      />
      <div className="pointer-events-none absolute -left-40 -top-32 h-[320px] w-[360px] rounded-full bg-[#dee8c4]/45 sm:h-[560px] sm:w-[640px] sm:bg-[#dee8c4]/75" />
      <div className="pointer-events-none absolute -right-28 top-24 h-[300px] w-[300px] rounded-full bg-[#dee8c4]/25 sm:h-[520px] sm:w-[520px] sm:bg-[#dee8c4]/40" />

      <div className="relative mx-auto grid w-full max-w-[1560px] flex-1 items-start gap-12 px-5 pb-14 pt-10 sm:px-8 sm:pb-16 sm:pt-14 lg:items-center lg:gap-14 lg:px-10 lg:pb-22 lg:pt-16 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)]">
        {/* copy column */}
        <div className="flex min-w-0 flex-col gap-7 sm:gap-8">
          <h1 className="m-0 text-[clamp(31px,5.6vw,86px)] font-bold leading-[1.1] tracking-[-0.02em] [text-wrap:balance]">
            <span className="block">Report it once.</span>
            <span className="inline-block pb-1 shadow-[inset_0_-5px_0_0_#0d5347] sm:pb-1.5 sm:shadow-[inset_0_-6px_0_0_#0d5347]">
              We chase it
            </span>
            <span className="block text-[#0d5347]/45 sm:text-transparent sm:opacity-55 sm:[-webkit-text-stroke:2px_#0d5347]">
              till it&apos;s proven.
            </span>
          </h1>

          <p className="m-0 max-w-[560px] text-[18px] leading-relaxed text-[#0d5347]/85 sm:text-[21px] [text-wrap:pretty]">
            Broken streetlight? Dry handpump? Tell us in two taps. The repair
            team must send a photo from the spot — and you get the final say.
          </p>

          <div className="flex flex-col items-stretch gap-5 sm:flex-row sm:flex-wrap sm:items-center sm:gap-8">
            <Link
              href="/report"
              className="inline-flex items-center justify-center gap-4 rounded-2xl bg-[#0d5347] px-6 py-4 text-[#f2ecdd] no-underline shadow-[0_14px_28px_rgba(13,83,71,0.22)] transition-transform hover:-translate-y-0.5 sm:gap-6 sm:px-8 sm:py-5"
            >
              <span className="text-[19px] font-semibold leading-none sm:text-[22px]">
                Report a problem
              </span>
              <span className="font-mono text-xs leading-none tracking-[0.16em] opacity-70">
                2 TAPS
              </span>
            </Link>
            <Link
              href="/my-reports"
              className="inline-flex items-center justify-center gap-3 border-b-2 border-[#0d5347]/35 pb-2 text-[19px] font-semibold leading-none no-underline sm:text-[21px]"
            >
              Check my complaint <span className="text-[19px]">→</span>
            </Link>
          </div>

          <div className="grid gap-6 border-t border-[#0d5347]/20 pt-7 sm:grid-cols-2 lg:grid-cols-3">
            {PROMISES.map((p) => (
              <div key={p.label} className="flex items-start gap-3">
                <span className="flex h-6 w-6 flex-none items-center justify-center rounded-full border-[1.6px] border-[#0d5347]/50">
                  <Check size={13} strokeWidth={2.6} />
                </span>
                <span className="flex flex-col gap-1.5">
                  <span className="text-[17px] font-medium leading-tight">
                    {p.label}
                  </span>
                  <span className="font-mono text-[10.5px] leading-tight tracking-[0.13em] text-[#0d5347]/60">
                    {p.meta}
                  </span>
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* phone column */}
        <div className="relative flex min-w-0 justify-center">
          <div className="relative w-[320px] max-w-full [perspective:1600px] sm:w-[400px]">
            <div className="group relative transition-transform duration-500 [transform:rotateY(-4deg)_rotateX(2deg)_rotate(-0.5deg)] [transform-style:preserve-3d] hover:[transform:rotateY(-4deg)_rotateX(1deg)] sm:[transform:rotateY(-11deg)_rotateX(4deg)_rotate(-1deg)]">
              {/* 3D extrusion */}
              <div className="absolute inset-0 rounded-[52px] bg-[linear-gradient(120deg,#0a4038,#1b6b5c)] [transform:translateZ(-13px)_translateX(-9px)_translateY(5px)]" />

              {/* phone body */}
              <div className="relative rounded-[52px] border-[3px] border-[#0d5347] bg-[#f7f3e8] px-3.5 pb-3.5 pt-4">
                <div className="flex items-center justify-between px-4 pb-3 pt-0.5 font-mono text-[11px] leading-none tracking-[0.1em] text-[#0d5347]/75">
                  <span>9:41</span>
                  <span className="h-[22px] w-[76px] rounded-[11px] bg-[#0d5347]" />
                  <span className="flex items-center gap-1.5">
                    <span className="relative block h-[9px] w-4 rounded-sm border-[1.4px] border-[#0d5347] p-[1.5px]">
                      <span className="block h-full w-full rounded-[1px] bg-[#0d5347]" />
                      <span className="absolute left-full top-1/2 h-[4px] w-[1.5px] -translate-y-1/2 rounded-r-sm bg-[#0d5347]" />
                    </span>
                    <span className="opacity-70">5G</span>
                  </span>
                </div>

                {/* screen */}
                <div className="flex flex-col gap-[18px] rounded-[38px] bg-[#eee8da] px-5 pb-6 pt-5">
                  <div className="flex flex-wrap items-center justify-between gap-2.5">
                    <span className="rounded-[20px] bg-[#dee8c4] px-3.5 py-[7px] font-mono text-[12.5px] font-medium leading-none tracking-[0.1em]">
                      SL-4412
                    </span>
                    <span className="whitespace-nowrap font-mono text-[11.5px] leading-none tracking-[0.06em] opacity-70">
                      WARD 18 · #2214
                    </span>
                    <span className="flex items-center gap-1.5 font-mono text-[11.5px] font-medium leading-none tracking-[0.12em]">
                      <span className="dr-pulse h-[7px] w-[7px] rounded-full bg-[#0d5347]" />
                      LIVE
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <span className="text-[27px] font-semibold leading-tight tracking-[-0.01em]">
                      Streetlight, MG Road
                    </span>
                    <span className="text-[14.5px] leading-snug text-[#0d5347]/70">
                      Pole 12 · reported 6 August, 9:10 am
                    </span>
                  </div>

                  <div className="h-px bg-[#0d5347]/15" />

                  <div className="flex flex-col gap-3.5">
                    {[
                      { t: "Photo taken at the pole", m: "14:22", done: true },
                      { t: "Location matched", m: "1.8 M", done: true },
                      { t: "Waiting for your confirmation", m: "YOU", done: false },
                    ].map((r) => (
                      <div key={r.t} className="flex items-center gap-3">
                        {r.done ? (
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full bg-[#0d5347] text-[#f7f3e8]">
                            <Check size={15} strokeWidth={3} />
                          </span>
                        ) : (
                          <span className="flex h-8 w-8 flex-none items-center justify-center rounded-full border-2 border-[#b5762a] font-mono text-sm">
                            3
                          </span>
                        )}
                        <span className="min-w-0 flex-1 text-base font-medium leading-snug">
                          {r.t}
                        </span>
                        <span className="font-mono text-[11px] leading-none tracking-[0.1em] opacity-60">
                          {r.m}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="flex items-stretch gap-3">
                    <div className="flex min-h-[118px] min-w-0 flex-1 items-center justify-center rounded-2xl border-[1.5px] border-dashed border-[#0d5347]/40 bg-[repeating-linear-gradient(45deg,rgba(13,83,71,0.07)_0_6px,transparent_6px_13px)] p-3 text-center font-mono text-[12.5px] leading-snug text-[#0d5347]/65">
                      photo of the repaired light
                    </div>
                    <div className="flex w-[66px] flex-none flex-col items-center justify-center gap-2 rounded-2xl border border-[#0d5347]/15 bg-[#f7f3e8]">
                      <QrCode size={26} strokeWidth={1.8} />
                      <span className="font-mono text-[9.5px] leading-none tracking-[0.14em] opacity-65">
                        SCAN
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    <button className="min-w-0 flex-1 rounded-[32px] bg-[#12150f] px-3.5 py-[17px] text-[15px] font-semibold leading-none text-[#f7f3e8] sm:py-[19px] sm:text-[17.5px]">
                      Yes, it&apos;s working
                    </button>
                    <button className="flex-none rounded-[32px] border-[1.5px] border-[#0d5347]/35 bg-[#f7f3e8] px-4 py-[17px] text-[15px] font-semibold leading-none sm:px-5 sm:py-[19px] sm:text-[17.5px]">
                      Not yet
                    </button>
                  </div>

                  <p className="m-0 text-center text-[13.5px] leading-snug text-[#0d5347]/70">
                    Your answer closes this complaint. Nobody else can.
                  </p>
                </div>

                {/* sheen */}
                <div className="pointer-events-none absolute inset-0 rounded-[52px] bg-[linear-gradient(115deg,rgba(247,243,232,0.55)_0%,rgba(247,243,232,0)_34%,rgba(13,83,71,0.06)_100%)]" />

                {/* dynamic notification */}
                <div className="dr-notif absolute left-[18px] right-[18px] top-[22px] flex items-center gap-3 rounded-[22px] border border-[#0d5347]/15 bg-[#f7f3e8] px-4 py-3.5 shadow-[0_14px_30px_rgba(13,83,71,0.22)]">
                  <span className="flex h-[34px] w-[34px] flex-none items-center justify-center rounded-xl bg-[#0d5347] text-[#dee8c4]">
                    <Check size={16} strokeWidth={3} />
                  </span>
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="whitespace-nowrap text-sm font-semibold leading-tight">
                      Worker uploaded proof
                    </span>
                    <span className="font-mono text-[10px] leading-none tracking-[0.11em] opacity-60">
                      SL-4412 · JUST NOW
                    </span>
                  </span>
                  <span className="dr-pulse ml-auto h-2 w-2 rounded-full bg-[#b5762a]" />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ticker */}
      <div className="relative overflow-hidden bg-[#0d5347] py-3.5 text-[#eee8da]">
        <div className="dr-tick flex w-max">
          {[0, 1].map((dup) => (
            <div
              key={dup}
              className="flex items-center gap-11 whitespace-nowrap pr-11 font-mono text-[12.5px] leading-none tracking-[0.18em]"
            >
              {TICKER.map((t) => (
                <span key={t} className="flex items-center gap-11">
                  {t}
                  <span className="opacity-50">✳</span>
                </span>
              ))}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
