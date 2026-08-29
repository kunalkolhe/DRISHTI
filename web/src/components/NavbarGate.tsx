"use client";

import { usePathname } from "next/navigation";

// The homepage ships its own navigation baked into the hero design,
// so we hide the global Navbar there and show it everywhere else.
export default function NavbarGate({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return <>{children}</>;
}
