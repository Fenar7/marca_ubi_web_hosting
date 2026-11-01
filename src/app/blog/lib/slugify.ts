/**
 * Single source of truth for heading anchors. The Portable Text renderer
 * stamps these ids at render time and the table of contents resolves them at
 * read time; any drift between the two breaks every in-page jump link, so both
 * sides must import this exact implementation.
 */
export function slugify(text: string, index?: number): string {
  const slug = text
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s-]/gu, "")
    .trim()
    .replace(/\s+/g, "-");
  return slug || `heading-${index ?? 0}`;
}
