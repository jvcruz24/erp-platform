// ── Input hardening ──────────────────────────────────────────────────────
// React escapes JSX text nodes automatically, so this isn't "the" XSS
// defense — but titles/column names here will eventually be persisted and
// re-rendered in other surfaces (emails, exports, other clients) that may
// NOT escape by default. Treat all free-text user input as untrusted at
// the boundary, not just at render time.

export const TITLE_MAX_LENGTH = 200;
export const COLUMN_NAME_MAX_LENGTH = 60;

/**
 * Strips control/zero-width characters, collapses whitespace, and trims.
 * Throws on empty or over-length input so callers fail fast with a clear
 * error instead of silently persisting garbage.
 */
export function sanitizePlainText(
  raw: string,
  maxLength: number,
  fieldName = 'value',
): string {
  const withoutControlChars = raw.replace(
    /[\u0000-\u001F\u007F\u200B-\u200D\uFEFF]/g,
    '',
  );
  const collapsed = withoutControlChars.replace(/\s+/g, ' ').trim();

  if (collapsed.length === 0) {
    throw new Error(`${fieldName} cannot be empty`);
  }
  if (collapsed.length > maxLength) {
    throw new Error(`${fieldName} must be ${maxLength} characters or fewer`);
  }
  return collapsed;
}

export function isValidMemberId(
  id: string | null,
  members: { id: string }[],
): boolean {
  if (id === null) return true;
  return members.some((m) => m.id === id);
}
