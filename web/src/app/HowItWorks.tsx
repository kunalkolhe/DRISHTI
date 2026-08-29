import Link from "next/link";

const MONO = "var(--font-jetbrains), ui-monospace, SFMono-Regular, monospace";
const DISPLAY = "var(--font-bricolage), system-ui, sans-serif";

const STEPS = [
  {
    no: "01",
    title: "Find the QR tag",
    body: "Every streetlight, handpump and public toilet carries a small DRISHTI tag with its own ID.",
    meta: "One asset · one ID",
  },
  {
    no: "02",
    title: "Scan with any phone",
    body: "Point your camera at the tag. No app to install, no login to remember. It opens in the browser.",
    meta: "Works on any phone",
  },
  {
    no: "03",
    title: "Report in two taps",
    body: "Snap a photo or record a voice note in Hindi or English. Location is stamped on capture.",
    meta: "Geo-stamped on capture",
  },
  {
    no: "04",
    title: "You close the file",
    body: "The team fixes it and uploads a photo from the spot. Your tap — nobody else's — closes the complaint.",
    meta: "No proof, no closure",
  },
];

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      style={{
        position: "relative",
        background: "#eee8da",
        color: "#12150f",
        fontFamily: DISPLAY,
        borderTop: "1.5px solid rgba(18,21,15,.5)",
        padding: "96px 52px 104px",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          position: "absolute",
          inset: 0,
          backgroundImage:
            "radial-gradient(rgba(18,21,15,.07) .8px,transparent .8px)",
          backgroundSize: "5px 5px",
          opacity: 0.5,
          pointerEvents: "none",
        }}
      />
      <div
        style={{
          position: "absolute",
          left: "-180px",
          bottom: "-220px",
          width: 520,
          height: 520,
          borderRadius: "50%",
          border: "1.5px solid rgba(13,83,71,.16)",
          pointerEvents: "none",
        }}
      />

      <div style={{ position: "relative", maxWidth: 1320, margin: "0 auto" }}>
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 14,
            font: `500 10.5px/1 ${MONO}`,
            letterSpacing: ".2em",
            textTransform: "uppercase",
            color: "#0d5347",
          }}
        >
          <span style={{ width: 26, height: 1, background: "#0d5347" }} />
          How it works
        </div>

        <h2
          style={{
            margin: "22px 0 0",
            fontSize: "clamp(34px,4.4vw,58px)",
            lineHeight: 1.05,
            letterSpacing: "-0.045em",
            fontWeight: 600,
            maxWidth: "18ch",
            fontFamily: DISPLAY,
          }}
        >
          From a broken light to a{" "}
          <span
            style={{
              color: "transparent",
              WebkitTextStroke: "1.2px #12150f",
              fontWeight: 700,
            }}
          >
            proven fix.
          </span>
        </h2>

        <p
          style={{
            margin: "20px 0 0",
            fontSize: 18.5,
            lineHeight: 1.6,
            color: "#3d433a",
            maxWidth: "46ch",
          }}
        >
          Four steps. The first two take you seconds. The last one puts the
          decision in your hands.
        </p>

        <div
          style={{
            marginTop: 56,
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(255px,1fr))",
            gap: 26,
          }}
        >
          {STEPS.map((s) => (
            <div
              key={s.no}
              style={{
                position: "relative",
                background: "#fefcf5",
                border: "1.5px solid rgba(18,21,15,.6)",
                borderRadius: 24,
                padding: "26px 24px 24px",
                boxShadow: "8px 10px 0 rgba(13,83,71,.95)",
                display: "flex",
                flexDirection: "column",
                gap: 12,
              }}
            >
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <span
                  style={{
                    font: `500 12px/1 ${MONO}`,
                    letterSpacing: ".14em",
                    color: "#0d5347",
                    background: "#dee8c4",
                    border: "1px solid rgba(13,83,71,.5)",
                    padding: "8px 12px",
                    borderRadius: 999,
                    boxShadow: "0 2px 0 rgba(13,83,71,.28)",
                  }}
                >
                  {s.no}
                </span>
                <span
                  style={{
                    width: 34,
                    height: 34,
                    borderRadius: "50%",
                    border: "1.5px solid rgba(18,21,15,.35)",
                    display: "grid",
                    placeItems: "center",
                    font: `500 14px/1 ${MONO}`,
                    color: "#12150f",
                  }}
                >
                  →
                </span>
              </div>

              <h3
                style={{
                  margin: "6px 0 0",
                  fontSize: 22,
                  fontWeight: 600,
                  letterSpacing: "-0.03em",
                  lineHeight: 1.15,
                  fontFamily: DISPLAY,
                }}
              >
                {s.title}
              </h3>

              <p
                style={{
                  margin: 0,
                  fontSize: 15.5,
                  lineHeight: 1.55,
                  color: "#5b6157",
                  flex: "1 1 auto",
                }}
              >
                {s.body}
              </p>

              <span
                style={{
                  marginTop: 4,
                  paddingTop: 14,
                  borderTop: "1px solid rgba(18,21,15,.14)",
                  font: `400 10px/1 ${MONO}`,
                  letterSpacing: ".14em",
                  textTransform: "uppercase",
                  color: "#7a8074",
                }}
              >
                {s.meta}
              </span>
            </div>
          ))}
        </div>

        <div
          style={{
            marginTop: 52,
            display: "flex",
            alignItems: "center",
            gap: 26,
            flexWrap: "wrap",
          }}
        >
          <Link
            href="/report"
            className="drishti-hover drishti-primarycta"
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 16,
              minHeight: 62,
              background: "#0d5347",
              color: "#f8fbf0",
              fontSize: 19,
              fontWeight: 500,
              padding: "0 32px",
              borderRadius: 999,
              boxShadow:
                "0 4px 0 rgba(9,58,50,.95),0 18px 30px -18px rgba(13,83,71,.8)",
              textDecoration: "none",
            }}
          >
            Report a problem
            <span
              style={{
                font: `500 10.5px/1 ${MONO}`,
                letterSpacing: ".18em",
                opacity: 0.72,
              }}
            >
              2 TAPS
            </span>
          </Link>
          <Link
            href="/scorecard"
            className="drishti-hover drishti-textlink"
            style={{
              fontSize: 17.5,
              fontWeight: 500,
              color: "#12150f",
              borderBottom: "1.5px solid rgba(18,21,15,.28)",
              paddingBottom: 5,
              textDecoration: "none",
            }}
          >
            See how your ward is doing →
          </Link>
        </div>
      </div>
    </section>
  );
}
