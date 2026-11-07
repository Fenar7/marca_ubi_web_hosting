interface CommercialSearchFilter {
  filter: string | null;
  error: string | null;
}

/** Quotes PostgREST values so punctuation cannot alter the OR filter's structure. */
export function buildCommercialSearchFilter(value: string | undefined): CommercialSearchFilter {
  const search = value?.trim() ?? '';
  if (!search) return { filter: null, error: null };
  if (search.length > 120 || /[%_*\\\x00-\x1f\x7f]/.test(search)) {
    return { filter: null, error: 'Use up to 120 characters without %, _, *, or backslashes.' };
  }
  const quotedPattern = `"%${search.replace(/"/g, '\\"')}%"`;
  return {
    filter: `name.ilike.${quotedPattern},company.ilike.${quotedPattern},lead_id.ilike.${quotedPattern}`,
    error: null,
  };
}
