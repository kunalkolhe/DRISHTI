"use client";

import { useEffect, useRef, useState } from "react";
import { Check, ChevronDown, Globe } from "lucide-react";
import { useLanguage } from "@/components/LanguageProvider";
import { LOCALES, LOCALE_LABELS, LOCALE_NAMES, type Locale } from "@/lib/i18n/translations";

export default function LanguageToggle() {
  const { locale, setLocale } = useLanguage();
  const [open, setOpen] = useState(false);
  const boxRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onClickOutside = (e: MouseEvent) => {
      if (boxRef.current && !boxRef.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, [open]);

  const choose = (l: Locale) => {
    setLocale(l);
    setOpen(false);
  };

  return (
    <div className="relative" ref={boxRef}>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
        className="flex items-center gap-1.5 dc-mono"
        style={{
          minHeight: 34,
          padding: "0 10px",
          borderRadius: 999,
          border: "1.5px solid rgba(18,21,15,.18)",
          background: open ? "rgba(13,83,71,.08)" : "transparent",
          color: "#3d433a",
          cursor: "pointer",
          fontSize: 11,
        }}
      >
        <Globe className="w-3.5 h-3.5" style={{ color: "#0d5347" }} />
        {LOCALE_LABELS[locale]}
        <ChevronDown className="w-3 h-3" style={{ transform: open ? "rotate(180deg)" : "none", transition: "transform .15s" }} />
      </button>

      {open && (
        <div
          role="listbox"
          aria-label="Choose language"
          className="dc-surface absolute right-0 mt-2 overflow-hidden text-left"
          style={{ width: 180, padding: 0, zIndex: 60 }}
        >
          {LOCALES.map((l) => {
            const active = l === locale;
            return (
              <button
                key={l}
                type="button"
                role="option"
                aria-selected={active}
                onClick={() => choose(l)}
                className="flex w-full items-center justify-between gap-3 px-4 py-3 text-sm"
                style={{
                  background: active ? "rgba(13,83,71,.08)" : "transparent",
                  border: "none",
                  borderBottom: "1px solid rgba(18,21,15,.08)",
                  color: "#12150f",
                  fontWeight: active ? 600 : 500,
                  cursor: active ? "default" : "pointer",
                  textAlign: "left",
                }}
              >
                {LOCALE_NAMES[l]}
                {active && <Check className="w-4 h-4" style={{ color: "#0d5347" }} />}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
