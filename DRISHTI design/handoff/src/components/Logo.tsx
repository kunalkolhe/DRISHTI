import Image from "next/image";
import Link from "next/link";

/**
 * Drop drishti-logo.png into /public first (see handoff/README.md).
 */
export default function Logo({ href = "/" }: { href?: string }) {
  return (
    <Link href={href} className="flex items-center gap-3.5 no-underline">
      <Image
        src="/drishti-logo.png"
        alt="DRISHTI"
        width={46}
        height={46}
        priority
        className="h-[46px] w-[46px] object-contain"
      />
      <span className="flex flex-col gap-0.5">
        <span className="text-2xl font-bold leading-none tracking-[0.02em] text-[#0d5347]">
          DRISHTI
        </span>
        <span className="font-mono text-[10px] leading-none tracking-[0.18em] text-[#0d5347]/70">
          दृष्टि · CIVIC PROOF
        </span>
      </span>
    </Link>
  );
}
