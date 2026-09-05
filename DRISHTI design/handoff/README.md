# DRISHTI — hero + how-it-works handoff (Next.js App Router, Tailwind v4)

## Files

| Copy this | To |
|---|---|
| `src/app/Hero.tsx` | `src/app/Hero.tsx` (replaces yours) |
| `src/app/HowItWorks.tsx` | `src/app/HowItWorks.tsx` (replaces yours) |
| `src/components/Logo.tsx` | `src/components/Logo.tsx` |
| `src/app/globals.additions.css` | paste its contents at the end of `src/app/globals.css` |
| `public/drishti-logo.png` | `public/drishti-logo.png` |

The logo PNG is in this project at `assets/drishti-logo.png` — download it and drop it in `/public`.

## Compose

```tsx
// src/app/page.tsx
import Hero from "./Hero";
import HowItWorks from "./HowItWorks";
import SiteFooter from "./SiteFooter";

export default function Page() {
  return (
    <>
      <Hero />
      <HowItWorks />
      <SiteFooter />
    </>
  );
}
```

`Navbar.tsx` stays yours — just swap its mark for `<Logo />`.

## Notes

- Both sections are `"use client"` (hover/tap state, interval demo). Colours are written as literal hex so they work before you map them to `@theme` tokens — swap `#0d5347` → `text-green`/`bg-green` etc. once you decide the token names.
- Icons are `lucide-react`: `Check`, `QrCode`, `ScanLine`, `Camera`, `ShieldCheck`, `ArrowRight`.
- Type: headings inherit your Bricolage Grotesque body font; every mono run uses `font-mono` (JetBrains Mono).
- `HowItWorks` takes two props: `autoDemo` (cards reveal themselves in sequence until the user interacts — default `true`) and `showConnector` (dashed step line — default `true`).
- The reveal sheet is keyboard reachable (`tabIndex`, focus opens it) and tap-toggles on touch, since there is no hover there.
- Phone 3D tilt is pure CSS `perspective` + `rotateY/rotateX`; it eases upright on hover. All motion is disabled under `prefers-reduced-motion`.
- I kept your `.dc-*` utilities out of it deliberately — if `dc-surface`/`dc-pill` already encode the cream card + pill, replace the literal `rounded-[18px] border … bg-[#f7f3e8]` and `rounded-[20px] bg-[#dee8c4]` runs with those classes.
