import type { HydratedDealItem } from "./DealsWorkspaceClient";

export type DealSortField =
  | "identity"
  | "status_name"
  | "expected_value"
  | "assigned_to_name"
  | "next_follow_up"
  | "priority";

/** Stored blanks, negative and nonfinite values are unavailable, rather than fabricated zero amounts. */
export function normalizeDealAmount(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/** A null Supabase payload is not a successful empty list; [] remains a legitimate result. */
export function dealsPayloadAvailable(data: unknown, error: unknown): boolean {
  return Array.isArray(data) && !error;
}

/** One URL mutation preserves other scopes while filter changes return to the first result page. */
export function dealsFilterUrl(
  current: string,
  changes: Record<string, string | null>,
): string {
  const params = new URLSearchParams(current);
  for (const [key, value] of Object.entries(changes)) {
    if (value && !(key === "bucket" && value === "all")) params.set(key, value);
    else params.delete(key);
  }
  if (Object.keys(changes).some((key) => key !== "view")) params.delete("page");
  if ("search" in changes) params.delete("q");
  return `/admin/deals${params.size ? `?${params.toString()}` : ""}`;
}

/** Sorting is intentionally limited to loaded rows; null values remain last in either direction. */
export function sortPageDeals(
  deals: HydratedDealItem[],
  field: DealSortField,
  ascending: boolean,
): HydratedDealItem[] {
  const direction = ascending ? 1 : -1;
  const priority = { High: 3, Medium: 2, Low: 1 };
  return [...deals].sort((a, b) => {
    let left: string | number | null;
    let right: string | number | null;
    if (field === "identity") {
      left = (a.company || a.name).toLowerCase();
      right = (b.company || b.name).toLowerCase();
    } else if (field === "priority") {
      left = priority[a.priority];
      right = priority[b.priority];
    } else if (field === "next_follow_up") {
      const aTime = Date.parse(a.next_follow_up ?? "");
      const bTime = Date.parse(b.next_follow_up ?? "");
      left = Number.isFinite(aTime) ? aTime : null;
      right = Number.isFinite(bTime) ? bTime : null;
    } else {
      left = a[field];
      right = b[field];
    }
    if (left === null && right === null) return a.id.localeCompare(b.id);
    if (left === null) return 1;
    if (right === null) return -1;
    const comparison =
      typeof left === "number" && typeof right === "number"
        ? left - right
        : String(left).localeCompare(String(right), "en", {
            sensitivity: "base",
          });
    return comparison * direction || a.id.localeCompare(b.id);
  });
}

/** Financial data is absent from restricted selects, not merely concealed by presentation styles. */
export function dealSelectColumns(financial: boolean): string {
  return `id, lead_id, name, company, phone, email, priority, service_category,
    next_follow_up, revisit_date, created_at, updated_at, assigned_to, status_id, lead_source_id,
    ${financial ? "expected_value," : ""}
    funnel_status:funnel_statuses!leads_status_id_fkey!inner(id, name, sort_order, bucket, color_code)`;
}
