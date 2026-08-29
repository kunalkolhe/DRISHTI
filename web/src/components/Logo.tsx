import Link from "next/link";

/**
 * DRISHTI mark — a civic "eye" set in a hard-edged tile.
 * The pupil is a rounded square: a nod to the QR asset tag every
 * streetlight and handpump carries. Matches the site's offset-shadow,
 * 1.5px-ink-border visual language.
 */
export function LogoMark({
  size = 40,
  shadow = true,
}: {
  size?: number;
  shadow?: boolean;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 44 44"
      fill="none"
      role="img"
      aria-label="DRISHTI"
    >
      {shadow && <rect x="6" y="8" width="33" height="33" rx="10.5" fill="#0a3f36" />}
      <rect
        x="3.5"
        y="3.5"
        width="33"
        height="33"
        rx="10.5"
        fill="#0d5347"
        stroke="#12150f"
        strokeWidth="1.6"
      />
      {/* eye */}
      <path
        d="M8.5 20C12.5 12.8 27.5 12.8 31.5 20C27.5 27.2 12.5 27.2 8.5 20Z"
        stroke="#e9edd3"
        strokeWidth="1.7"
        strokeLinejoin="round"
      />
      {/* pupil = asset tag */}
      <rect x="16.4" y="16.4" width="7.2" height="7.2" rx="2.1" fill="#e9edd3" />
      <rect x="19.1" y="19.1" width="1.8" height="1.8" rx="0.5" fill="#0d5347" />
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
