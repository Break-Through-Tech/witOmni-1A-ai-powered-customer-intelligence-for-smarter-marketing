import Link from "next/link";
import { InfoTip } from "./info-tip";

/** Label, big number, one-line context, optional link (003 §5). */
export function KpiTile({
  label,
  value,
  context,
  href,
  info,
}: {
  label: string;
  value: string;
  context?: string;
  href?: string;
  info?: string;
}) {
  const body = (
    <>
      <div className="flex items-center gap-1.5 text-sm text-secondary">
        {label}
        {info && <InfoTip text={info} label={label} />}
      </div>
      <div className="mt-2 text-[32px] leading-none font-semibold tracking-tight">
        {value}
      </div>
      {context && <div className="mt-2 text-xs text-muted">{context}</div>}
    </>
  );
  const cls =
    "block rounded-[8px] border border-border bg-surface-1 p-4 transition-colors";
  return href ? (
    <Link href={href} className={`${cls} hover:border-accent`}>
      {body}
    </Link>
  ) : (
    <div className={cls}>{body}</div>
  );
}
