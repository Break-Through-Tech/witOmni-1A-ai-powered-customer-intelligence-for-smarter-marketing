import Link from "next/link";
import { SegmentBadge } from "@/components/segment-badge";
import { SEGMENTS } from "@/lib/segments";

export default function SegmentNotFound() {
  return (
    <div className="py-16">
      <h1 className="text-2xl font-semibold">We couldn&apos;t find that segment</h1>
      <p className="mt-2 text-secondary">Pick one of your 4 segments:</p>
      <ul className="mt-4 space-y-2">
        {SEGMENTS.map((s) => (
          <li key={s.slug}>
            <Link href={`/segments/${s.slug}`} className="hover:underline">
              <SegmentBadge segment={s} />
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
