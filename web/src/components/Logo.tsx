import Link from "next/link";

/**
 * DRISHTI mark — the "civic eye": two interlocking crescents (civic green +
 * ochre) that swirl into an almond eye around a green iris. `shadow` is kept
 * for call-site compatibility and no longer draws anything.
 */
export function LogoMark({
  size = 40,
}: {
  size?: number;
  /** @deprecated no longer used */
  shadow?: boolean;
}) {
  return (
    <svg
      width={size}
      height={Math.round(size * 0.88)}
      viewBox="0 0 100 88"
      fill="none"
      role="img"
      aria-label="DRISHTI"
    >
      {/* green blade — sweeps over the top and curls down the left */}
      <path
        d="M5 44 C24 6 76 6 95 44 C80 22 58 28 50 44 C42 60 20 66 5 44 Z"
        fill="#0d5347"
      />
      {/* ochre blade — sweeps under the bottom and curls up the right */}
      <path
        d="M5 44 C20 66 42 60 50 44 C58 28 80 22 95 44 C76 82 24 82 5 44 Z"
        fill="#b5762a"
      />
      {/* cream gap along the swirl */}
      <path
        d="M5 44 C20 66 42 60 50 44 C58 28 80 22 95 44"
        fill="none"
        stroke="#fdfaf1"
        strokeWidth="2.6"
        strokeLinecap="round"
      />
      {/* iris */}
      <circle cx="50" cy="43" r="13" fill="#fdfaf1" />
      <circle cx="50" cy="43" r="11" fill="#0d5347" />
      <circle cx="55" cy="38" r="4.4" fill="#fdfaf1" />
    </svg>
  );
}

export default function Logo({
  href = "/",
  size = 38,
  subtitle = "Civic proof",
  className = "",
}: {
  href?: string | null;
  size?: number;
  subtitle?: string | null;
  className?: string;
}) {
  const inner = (
    <span className={`inline-flex items-center gap-3 ${className}`} style={{ textDecoration: "none", color: "inherit" }}>
      <LogoMark size={size} />
      <span className="flex flex-col" style={{ gap: 2 }}>
        <span style={{ fontSize: size * 0.55, fontWeight: 600, letterSpacing: "-0.045em", lineHeight: 1 }}>
          DRISHTI
        </span>
        {subtitle && (
          <span
            className="dc-mono"
            style={{ fontSize: 9, letterSpacing: "0.24em", color: "#5f665a" }}
          >
            {subtitle}
          </span>
        )}
      </span>
    </span>
  );

  if (!href) return inner;
  return (
    <Link href={href} style={{ textDecoration: "none", color: "inherit" }}>
      {inner}
    </Link>
  );
}
