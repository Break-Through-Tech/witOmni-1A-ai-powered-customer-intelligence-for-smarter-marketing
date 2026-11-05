import Link from "next/link";
import { SEGMENTS, type SegmentSlug } from "@/lib/segments";

/** All 4 segments in fixed order (005 §3.1). Each tab is a link, so the URL changes. */
export function SegmentTabs({ active }: { active: SegmentSlug }) {
  return (
    <nav aria-label="Segments" className="-mx-4 mb-6 overflow-x-auto px-4">
      <ul className="flex min-w-max gap-1 border-b border-border">
        {SEGMENTS.map((s) => {
          const isActive = s.slug === active;
          return (
            <li key={s.slug}>
              <Link
                href={`/segments/${s.slug}`}
                aria-current={isActive ? "page" : undefined}
                className={`-mb-px flex items-center gap-2 border-b-2 px-3 py-2 text-sm ${
                  isActive
                    ? "border-accent font-medium text-primary"
                    : "border-transparent text-secondary hover:text-primary"
                }`}
              >
                <span
                  aria-hidden
                  className="h-2 w-2 rounded-full"
                  style={{ background: `var(--seg-${s.slug})` }}
                />
                {s.name}
                {s.focus && <span className="text-[11px] text-muted">Focus</span>}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
