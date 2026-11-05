"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Suspense, useState } from "react";

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/segments", label: "Segments" },
  { href: "/customers", label: "Customers" },
  { href: "/categories", label: "Categories" },
  { href: "/assistant", label: "Assistant" },
  { href: "/model", label: "Model" },
];

function isActive(pathname: string | null, href: string) {
  if (!pathname) return false;
  return href === "/" ? pathname === "/" : pathname.startsWith(href);
}

function NavLinks({
  pathname,
  onNavigate,
}: {
  pathname: string | null;
  onNavigate?: () => void;
}) {
  return (
    <ul className="space-y-1">
      {NAV.map((item) => {
        const active = isActive(pathname, item.href);
        return (
          <li key={item.href}>
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-current={active ? "page" : undefined}
              className={`block rounded-[6px] px-3 py-2 text-sm ${
                active
                  ? "bg-surface-0 font-medium text-primary"
                  : "text-secondary hover:bg-surface-0"
              }`}
            >
              {item.label}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

// usePathname is runtime data, so it lives inside Suspense; the fallback
// renders the same links without the active highlight.
function ActiveNavLinks({ onNavigate }: { onNavigate: () => void }) {
  return <NavLinks pathname={usePathname()} onNavigate={onNavigate} />;
}

export function Sidebar() {
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <aside className="border-b border-border bg-surface-1 lg:sticky lg:top-0 lg:h-screen lg:w-56 lg:shrink-0 lg:border-r lg:border-b-0">
      <div className="flex items-center justify-between px-4 py-4">
        {/* Text wordmark until Witomni sends the logo (003 §8). */}
        <Link href="/" className="text-lg font-semibold tracking-tight">
          Witomni
        </Link>
        <button
          type="button"
          className="rounded-[6px] border border-border px-3 py-1 text-sm lg:hidden"
          aria-expanded={open}
          aria-controls="main-nav"
          onClick={() => setOpen((o) => !o)}
        >
          Menu
        </button>
      </div>
      <nav
        id="main-nav"
        aria-label="Main"
        className={`${open ? "block" : "hidden"} px-2 pb-4 lg:block`}
      >
        <Suspense fallback={<NavLinks pathname={null} />}>
          <ActiveNavLinks onNavigate={close} />
        </Suspense>
      </nav>
    </aside>
  );
}
