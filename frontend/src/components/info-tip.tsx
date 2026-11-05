"use client";

import { useId, useState } from "react";

/** ⓘ icon with a tooltip on hover and keyboard focus (003 §5 Info tooltip). */
export function InfoTip({ text, label }: { text: string; label: string }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  return (
    <span className="relative inline-flex align-middle">
      <button
        type="button"
        aria-label={`About ${label}`}
        aria-describedby={open ? id : undefined}
        className="inline-flex h-4 w-4 items-center justify-center rounded-full border border-border text-[10px] leading-none text-muted hover:text-secondary"
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        onFocus={() => setOpen(true)}
        onBlur={() => setOpen(false)}
        onClick={(e) => {
          e.preventDefault(); // tiles are links; the icon shouldn't navigate
          e.stopPropagation();
          setOpen((o) => !o);
        }}
        onKeyDown={(e) => e.key === "Escape" && setOpen(false)}
      >
        i
      </button>
      {open && (
        <span
          role="tooltip"
          id={id}
          className="absolute top-6 left-1/2 z-20 w-60 -translate-x-1/2 rounded-[6px] border border-border bg-surface-1 p-2 text-xs font-normal text-secondary shadow-md"
        >
          {text}
        </span>
      )}
    </span>
  );
}
