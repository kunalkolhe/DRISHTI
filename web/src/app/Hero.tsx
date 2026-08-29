"use client";

import Link from "next/link";
import { useState } from "react";
import Logo from "@/components/Logo";

const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace";

type StepStyle = { dotBg: string; dotBorder: string; dotFg: string; mark: string };

const DONE: StepStyle = { dotBg: "#0d5347", dotBorder: "#0d5347", dotFg: "#f8fbf0", mark: "✓" };
const WAIT: StepStyle = { dotBg: "transparent", dotBorder: "#0d5347", dotFg: "#0d5347", mark: "3" };
const REOPENED: StepStyle = { dotBg: "#eee8da", dotBorder: "#12150f", dotFg: "#12150f", mark: "!" };

export default function Hero({
  showTrust = true,
  showTicker = true,
  tiltStrength = 7,
}: {
  showTrust?: boolean;
  showTicker?: boolean;
  tiltStrength?: number;
}) {
  const [confirmed, setConfirmed] = useState<boolean | null>(null);
  const [tilt, setTilt] = useState({ rx: 0, ry: 0 });

  const onTilt = (e: React.MouseEvent<HTMLDivElement>) => {
    const r = e.currentTarget.getBoundingClientRect();
    const px = (e.clientX - r.left) / r.width - 0.5;
    const py = (e.clientY - r.top) / r.height - 0.5;
    setTilt({ ry: px * tiltStrength, rx: -py * tiltStrength });
  };
  const onRest = () => setTilt({ rx: 0, ry: 0 });

  const third = confirmed === null ? WAIT : confirmed ? DONE : REOPENED;
  const steps = [
    { ...DONE, label: "Photo taken at the pole", meta: "14:22" },
    { ...DONE, label: "Location matched", meta: "1.8 M" },
    {
      ...third,
      label:
        confirmed === null
          ? "Waiting for your confirmation"
          : confirmed
          ? "You confirmed it works"
          : "Reopened — team notified",
      meta: confirmed === null ? "YOU" : confirmed ? "CLOSED" : "OPEN",
    },
  ];
  const confirmLabel = confirmed === true ? "Confirmed — thank you" : "Yes, it's working";
  const statusNote =
    confirmed === null
      ? "Your answer closes this complaint. Nobody else can."
      : confirmed
      ? "Closed with proof on 6 August."
      : "Sent back to the ward team with your note.";

  const tickerItems = [
    "1,284 assets in your ward",
    "41h median verified fix",
    "works on any phone",
    "Hindi & English",
  ];

  return (
    <section
      className="drishti-hero"
      style={{
        fontFamily: "var(--font-bricolage), system-ui, sans-serif",
        background: "#eee8da",
        color: "#12150f",
        minHeight: "100vh",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* background texture */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(90deg,rgba(18,21,15,.045) 1px,transparent 1px)", backgroundSize: "8.3333% 100%", pointerEvents: "none" }} />
      <div style={{ position: "absolute", inset: 0, backgroundImage: "radial-gradient(rgba(18,21,15,.07) .8px,transparent .8px)", backgroundSize: "5px 5px", opacity: 0.55, pointerEvents: "none" }} />
      <div style={{ position: "absolute", left: -220, top: -260, width: 680, height: 680, borderRadius: "50%", background: "#dee8c4", opacity: 0.62, filter: "blur(2px)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: -160, bottom: -260, width: 560, height: 560, borderRadius: "50%", border: "1.5px solid rgba(13,83,71,.22)", pointerEvents: "none" }} />
      <div style={{ position: "absolute", right: -90, bottom: -190, width: 420, height: 420, borderRadius: "50%", border: "1.5px solid rgba(13,83,71,.14)", pointerEvents: "none" }} />

      {/* nav */}
      <nav style={{ position: "relative", display: "flex", alignItems: "center", gap: 8, padding: "18px 52px", flexWrap: "wrap", borderBottom: "1px solid rgba(18,21,15,.16)", animation: "drishti-fadeIn .5s both" }}>
        <div style={{ marginRight: "auto" }}>
          <Logo href="/" size={40} subtitle={"दृष्टि · civic proof"} />
        </div>

        <Link href="#how-it-works" className="drishti-hover drishti-navlink" style={{ fontSize: 16.5, color: "#3d433a", padding: "11px 16px", borderRadius: 999, textDecoration: "none" }}>How it works</Link>
        <Link href="/scorecard" className="drishti-hover drishti-navlink" style={{ fontSize: 16.5, color: "#3d433a", padding: "11px 16px", borderRadius: 999, textDecoration: "none" }}>Your ward</Link>
        <Link href="/login" className="drishti-hover drishti-navlink" style={{ fontSize: 16.5, color: "#3d433a", padding: "11px 16px", borderRadius: 999, textDecoration: "none" }}>Help</Link>
        <Link href="/report" className="drishti-hover drishti-navcta" style={{ marginLeft: 12, fontSize: 16.5, fontWeight: 500, background: "#12150f", color: "#eee8da", padding: "0 26px", minHeight: 50, borderRadius: 999, display: "inline-flex", alignItems: "center", boxShadow: "0 3px 0 rgba(18,21,15,.45)", textDecoration: "none" }}>Report a problem</Link>
      </nav>

      {/* body */}
      <div style={{ position: "relative", flex: "1 1 auto", display: "flex", flexWrap: "wrap", gap: 72, alignItems: "center", justifyContent: "center", padding: "76px 52px 52px", maxWidth: 1420, margin: "0 auto", width: "100%", boxSizing: "border-box" }}>
        {/* left column */}
        <div style={{ flex: "1 1 520px", minWidth: "min(100%,440px)", maxWidth: 690, animation: "drishti-riseIn .75s cubic-bezier(.2,.7,.3,1) both" }}>
          <h1 className="drishti-balance" style={{ margin: 0, fontSize: "clamp(46px,6.1vw,84px)", lineHeight: 1.04, letterSpacing: "-0.052em", fontWeight: 600, maxWidth: "16ch", fontFamily: "inherit" }}>
            Report it once.
            <span style={{ display: "block", position: "relative", width: "fit-content" }}>
              <span style={{ position: "relative", zIndex: 1 }}>We chase it</span>
              <span style={{ position: "absolute", left: "-.03em", right: "-.03em", bottom: ".055em", height: ".065em", background: "#0d5347", borderRadius: 999, animation: "drishti-drawUnder .9s .5s cubic-bezier(.2,.7,.3,1) both" }} />
            </span>
            <span style={{ display: "block", color: "transparent", WebkitTextStroke: "1.4px #12150f", fontWeight: 700, textShadow: "2px 3px 0 rgba(13,83,71,.16)" }}>till it&apos;s proven.</span>
          </h1>

          <p className="drishti-pretty" style={{ margin: "32px 0 0", fontSize: 20.5, lineHeight: 1.6, color: "#3d433a", maxWidth: "43ch" }}>
            Broken streetlight? Dry handpump? Tell us in two taps. The repair team must send a photo from the spot &mdash; and you get the final say.
          </p>

          <div style={{ display: "flex", alignItems: "center", gap: 30, marginTop: 40, flexWrap: "wrap" }}>
            <Link href="/report" className="drishti-hover drishti-primarycta" style={{ display: "inline-flex", alignItems: "center", gap: 16, minHeight: 64, background: "#0d5347", color: "#f8fbf0", fontSize: 20, fontWeight: 500, padding: "0 34px", borderRadius: 999, boxShadow: "0 4px 0 rgba(9,58,50,.95),0 18px 30px -18px rgba(13,83,71,.8)", textDecoration: "none" }}>
              Report a problem
              <span style={{ font: `500 10.5px/1 ${MONO}`, letterSpacing: ".18em", opacity: 0.72 }}>2 TAPS</span>
            </Link>
            <Link href="/my-reports" className="drishti-hover drishti-textlink" style={{ fontSize: 18.5, fontWeight: 500, color: "#12150f", borderBottom: "1.5px solid rgba(18,21,15,.28)", paddingBottom: 5, textDecoration: "none" }}>
              Check my complaint &rarr;
            </Link>
          </div>

          {showTrust && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "26px 40px", marginTop: 52, paddingTop: 26, borderTop: "1px solid rgba(18,21,15,.18)" }}>
              {[
                { label: "Photo from the spot", meta: "Geo-stamped on capture" },
                { label: "Location matched", meta: "Within 5 metres" },
                { label: "You confirm it", meta: "Your tap closes the file" },
              ].map((t) => (
                <div key={t.label} style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  <span style={{ fontSize: 15.5, color: "#3d433a", display: "inline-flex", alignItems: "center", gap: 10 }}>
                    <span style={{ width: 22, height: 22, borderRadius: "50%", background: "#dee8c4", border: "1.5px solid #0d5347", boxSizing: "border-box", display: "grid", placeItems: "center", fontSize: 12, color: "#0d5347", boxShadow: "0 2px 0 rgba(13,83,71,.35)" }}>{"✓"}</span>
                    {t.label}
                  </span>
                  <span style={{ font: `400 10px/1 ${MONO}`, letterSpacing: ".16em", textTransform: "uppercase", color: "#7a8074", paddingLeft: 32 }}>{t.meta}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* right column: 3D card */}
        <div onMouseMove={onTilt} onMouseLeave={onRest} style={{ position: "relative", flex: "0 1 470px", minWidth: "min(100%,320px)", maxWidth: 490, perspective: 1500, perspectiveOrigin: "60% 40%" }}>
          <div style={{ position: "relative", transformStyle: "preserve-3d", transform: `rotateX(${tilt.rx.toFixed(2)}deg) rotateY(${tilt.ry.toFixed(2)}deg)`, transition: "transform .45s cubic-bezier(.2,.7,.3,1)" }}>
            {/* ground plane */}
            <div style={{ position: "absolute", left: -96, right: -58, bottom: -104, height: 330, transformOrigin: "50% 100%", transformStyle: "preserve-3d", animation: "drishti-planeIn 1s .1s cubic-bezier(.2,.7,.3,1) both", pointerEvents: "none" }}>
              <div style={{ position: "absolute", inset: 0, border: "1.5px solid rgba(13,83,71,.42)", borderRadius: 12, background: "#e5dfd0", backgroundImage: "linear-gradient(90deg,rgba(13,83,71,.16) 1px,transparent 1px),linear-gradient(rgba(13,83,71,.16) 1px,transparent 1px)", backgroundSize: "46px 46px", boxShadow: "0 0 0 1px rgba(18,21,15,.06) inset" }} />
              <div style={{ position: "absolute", left: "18%", top: "26%", width: "40%", height: 1.5, background: "rgba(13,83,71,.45)" }} />
              <div style={{ position: "absolute", left: "58%", top: "26%", width: 1.5, height: "46%", background: "rgba(13,83,71,.45)" }} />
              <div style={{ position: "absolute", left: "18%", top: "26%", width: 2, height: 64, transformOrigin: "50% 100%", transform: "translate(-50%,-100%) rotateZ(14deg) rotateX(-64deg)", transformStyle: "preserve-3d", background: "linear-gradient(#0d5347,rgba(13,83,71,.55))" }}>
                <div style={{ position: "absolute", left: "50%", top: -9, transform: "translateX(-50%)", width: 16, height: 16, borderRadius: "50%", background: "#0d5347", boxShadow: "0 0 0 5px rgba(13,83,71,.16)" }} />
              </div>
              <div style={{ position: "absolute", left: "58%", top: "72%", width: 2, height: 52, transformOrigin: "50% 100%", transform: "translate(-50%,-100%) rotateZ(14deg) rotateX(-64deg)", transformStyle: "preserve-3d", background: "linear-gradient(#0d5347,rgba(13,83,71,.5))" }}>
                <div style={{ position: "absolute", left: "50%", top: -8, transform: "translateX(-50%)", width: 14, height: 14, borderRadius: "50%", background: "#dee8c4", border: "2px solid #0d5347", boxSizing: "border-box" }} />
              </div>
              <div style={{ position: "absolute", left: "80%", top: "44%", width: 2, height: 40, transformOrigin: "50% 100%", transform: "translate(-50%,-100%) rotateZ(14deg) rotateX(-64deg)", background: "rgba(18,21,15,.32)" }}>
                <div style={{ position: "absolute", left: "50%", top: -7, transform: "translateX(-50%)", width: 11, height: 11, borderRadius: "50%", background: "#8b9184" }} />
              </div>
              <div style={{ position: "absolute", left: "34%", top: "82%", width: 2, height: 34, transformOrigin: "50% 100%", transform: "translate(-50%,-100%) rotateZ(14deg) rotateX(-64deg)", background: "rgba(18,21,15,.28)" }}>
                <div style={{ position: "absolute", left: "50%", top: -6, transform: "translateX(-50%)", width: 10, height: 10, borderRadius: "50%", background: "#8b9184" }} />
              </div>
            </div>

            {/* offset back card */}
            <div style={{ position: "absolute", left: -34, top: 34, right: 52, height: "84%", background: "#dee8c4", border: "1.5px solid rgba(18,21,15,.5)", borderRadius: 30, transform: "translateZ(20px) rotate(2.6deg)", boxShadow: "0 26px 44px -30px rgba(18,21,15,.7)", pointerEvents: "none" }} />

            {/* main card */}
            <div style={{ position: "relative", background: "#fefcf5", border: "1.5px solid rgba(18,21,15,.6)", borderRadius: 30, padding: 28, transformStyle: "preserve-3d", boxShadow: "14px 16px 0 rgba(13,83,71,.95),0 44px 70px -34px rgba(18,21,15,.65)", animation: "drishti-cardIn3d .95s .22s cubic-bezier(.2,.7,.3,1) both" }}>
              <div style={{ display: "flex", alignItems: "center", gap: 12, flexWrap: "wrap" }}>
                <span style={{ font: `500 12px/1 ${MONO}`, letterSpacing: ".14em", color: "#0d5347", background: "#dee8c4", border: "1px solid rgba(13,83,71,.5)", padding: "8px 13px", borderRadius: 999, boxShadow: "0 2px 0 rgba(13,83,71,.28)" }}>SL-4412</span>
                <span style={{ font: `400 12px/1 ${MONO}`, letterSpacing: ".1em", color: "#6d7368", textTransform: "uppercase" }}>Ward 18 &middot; #2214</span>
                <span style={{ marginLeft: "auto", display: "inline-flex", alignItems: "center", gap: 7, font: `400 11px/1 ${MONO}`, letterSpacing: ".14em", color: "#0d5347", textTransform: "uppercase" }}>
                  <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#0d5347" }} />live
                </span>
              </div>

              <div style={{ marginTop: 22, fontSize: 28, fontWeight: 600, letterSpacing: "-0.035em", lineHeight: 1.12, transform: "translateZ(26px)" }}>Streetlight, MG Road</div>
              <div style={{ marginTop: 7, fontSize: 16, color: "#5b6157", transform: "translateZ(18px)" }}>Pole 12 &middot; reported 6 August, 9:10 am</div>

              <div style={{ height: 1, background: "rgba(18,21,15,.14)", margin: "22px 0 4px" }} />

              {steps.map((step, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 15 }}>
                  <span style={{ flex: "none", width: 32, height: 32, borderRadius: "50%", background: step.dotBg, border: `1.5px solid ${step.dotBorder}`, boxSizing: "border-box", color: step.dotFg, display: "grid", placeItems: "center", fontSize: 15, fontWeight: 500, boxShadow: "0 2px 0 rgba(13,83,71,.3)" }}>{step.mark}</span>
                  <span style={{ fontSize: 17.5, color: "#25291f" }}>{step.label}</span>
                  <span style={{ marginLeft: "auto", font: `400 11.5px/1 ${MONO}`, letterSpacing: ".12em", color: "#6d7368" }}>{step.meta}</span>
                </div>
              ))}

              <div style={{ display: "flex", alignItems: "stretch", gap: 12, marginTop: 22, transformStyle: "preserve-3d" }}>
                <div style={{ flex: "1 1 auto", border: "1px dashed rgba(18,21,15,.28)", borderRadius: 18, height: 124, background: "repeating-linear-gradient(135deg,rgba(13,83,71,.08) 0 1.5px,transparent 1.5px 10px)", display: "grid", placeItems: "center" }}>
                  <span style={{ fontSize: 14.5, color: "#5b6157" }}>photo of the repaired light</span>
                </div>
                <div style={{ flex: "none", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", gap: 9, padding: 12, border: "1.5px solid rgba(18,21,15,.35)", borderRadius: 18, background: "#eee8da", transform: "translateZ(34px) rotateY(-14deg)", transformStyle: "preserve-3d", boxShadow: "-5px 5px 0 rgba(13,83,71,.28),0 16px 24px -14px rgba(18,21,15,.6)" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(4,6px)", gridAutoRows: "6px", gap: 2 }}>
                    {[1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 1, 0, 1, 0].map((on, i) => (
                      <div key={i} style={{ background: on ? "#12150f" : "transparent" }} />
                    ))}
                  </div>
                  <span style={{ font: `400 8.5px/1 ${MONO}`, letterSpacing: ".14em", color: "#6d7368", textTransform: "uppercase" }}>scan</span>
                </div>
              </div>

              <div style={{ display: "flex", alignItems: "center", gap: 14, marginTop: 24, flexWrap: "wrap", transform: "translateZ(22px)" }}>
                <button onClick={() => setConfirmed(true)} className="drishti-hover drishti-confirm" style={{ flex: "1 1 190px", minHeight: 56, background: "#12150f", color: "#eee8da", border: "none", borderRadius: 999, display: "grid", placeItems: "center", fontSize: 18, fontWeight: 500, cursor: "pointer", boxShadow: "0 4px 0 rgba(18,21,15,.5)", fontFamily: "inherit" }}>{confirmLabel}</button>
                <button onClick={() => setConfirmed(false)} className="drishti-hover drishti-reject" style={{ flex: "0 0 auto", minHeight: 56, padding: "0 24px", background: "transparent", border: "1.5px solid #12150f", borderRadius: 999, display: "grid", placeItems: "center", fontSize: 18, cursor: "pointer", boxShadow: "0 3px 0 rgba(18,21,15,.22)", fontFamily: "inherit" }}>Not yet</button>
              </div>

              <div style={{ marginTop: 16, textAlign: "center", fontSize: 14.5, color: "#5b6157", lineHeight: 1.5 }}>{statusNote}</div>
            </div>

          </div>
        </div>
      </div>

      {/* ticker */}
      {showTicker && (
        <div style={{ position: "relative", background: "#0d5347", color: "#dee8c4", overflow: "hidden", borderTop: "1.5px solid rgba(18,21,15,.5)", boxShadow: "0 -8px 22px -16px rgba(18,21,15,.8)" }}>
          <div style={{ display: "flex", width: "max-content", animation: "drishti-ticker 34s linear infinite", padding: "14px 0", font: `500 11.5px/1 ${MONO}`, letterSpacing: ".22em", textTransform: "uppercase" }}>
            {[0, 1].map((dup) => (
              <span key={dup} style={{ display: "flex", gap: 34, paddingRight: 34 }}>
                {tickerItems.map((t) => (
                  <span key={t} style={{ display: "flex", gap: 34 }}>
                    <span>{t}</span>
                    <span style={{ opacity: 0.6 }}>{"✳"}</span>
                  </span>
                ))}
              </span>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
