// Citations for assistant answers (spec 008 §6 "Every answer cites its data").
// Shared by server and client: every lookup result carries a `source`, the
// model cites its id like [segment:at-risk-lapsed], and the chat checks each
// citation against the sources that were actually looked up.

export interface Source {
  /** Stable id the model cites, e.g. "segment:at-risk-lapsed". */
  id: string;
  /** What the data is, in plain words. */
  label: string;
  /** Dashboard page that shows the same numbers. */
  href: string;
}

/** Message metadata sent by /api/assistant: sources not carried by a tool result. */
export interface AssistantMetadata {
  sources?: Source[];
}

export const SEGMENT_GUIDE_SOURCE: Source = {
  id: "segment-guide",
  label: "Segment definitions and recommended actions",
  href: "/segments",
};

/**
 * Matches anything shaped like a citation, e.g. [segment:at-risk-lapsed] or
 * [customer:12347; overview]. Deliberately loose, so made-up ids are caught
 * and flagged instead of slipping through as plain text. One capture group,
 * so `text.split(CITATION_RE)` alternates text / citation contents.
 */
export const CITATION_RE = /\[([a-z][\w-]*(?::[\w-]+)?(?:\s*[;,]\s*[a-z][\w-]*(?::[\w-]+)?)*)\]/;

/** Split "[a; b]" contents into ids. */
export function citationIds(inner: string): string[] {
  return inner.split(/\s*[;,]\s*/).filter(Boolean);
}
