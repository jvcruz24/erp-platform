import { z } from 'zod';

/**
 * Parses `data` against `schema` and throws a single readable message on
 * failure. This has no knowledge of tickets, columns, or any other domain
 * — it's the one place "how do we turn a Zod failure into an error" is
 * decided, so every domain package (kanban-domain today, others later)
 * gets identical error formatting for free instead of re-deciding it.
 */
export function parseOrThrow<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): z.infer<T> {
  const result = schema.safeParse(data);
  if (!result.success) {
    const message = result.error.issues
      .map((issue) => issue.message)
      .join('; ');
    throw new Error(message);
  }
  return result.data;
}

/**
 * Same idea, but returns a discriminated result instead of throwing — the
 * shape an API route handler wants (400 + field errors) rather than the
 * shape a repository method wants (throw, let the caller's try/catch
 * handle rollback). Both call the same underlying schema.safeParse; this
 * just standardizes the "not thrown" path too.
 */
export function parseSafely<T extends z.ZodTypeAny>(
  schema: T,
  data: unknown,
): { success: true; data: z.infer<T> } | { success: false; errors: string[] } {
  const result = schema.safeParse(data);
  if (!result.success) {
    return {
      success: false,
      errors: result.error.issues.map((issue) => issue.message),
    };
  }
  return { success: true, data: result.data };
}
