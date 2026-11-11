import {
  ROLE_DEFAULT_FEATURES,
  ROLE_DEFAULT_TABS,
  type CrmTabKey,
  type CrmUserRole,
} from "@/types/crm";

export type OverviewQueue = "overdue" | "today" | "unassigned";

/** Select lists are permission-specific at the database boundary, before client serialization. */
export function dashboardSelect(
  financial: boolean,
  kind: "pipeline" | "conversion",
): string {
  const columns =
    kind === "pipeline" ? "id, status_id" : "converted_at, created_at";
  return columns + (financial ? ", expected_value" : "");
}

/**
 * Select lists for the dashboard follow-up queue preview.
 * When financial permissions are absent, expected_value is strictly omitted from the database read.
 */
export function dashboardPreviewSelect(financial: boolean): string {
  const columns =
    "id, lead_id, name, company, status_id, assigned_to, next_follow_up, created_at, service_category";
  return columns + (financial ? ", expected_value" : "");
}

export interface DashboardPageResult<T> {
  data: T[] | null;
  error: { message: string } | null;
}

/** Never publish a truncated aggregate; the extra boundary read distinguishes exactly-at-cap data. */
export async function foldDashboardPages<T, S>(
  load: (from: number, to: number) => Promise<DashboardPageResult<T>>,
  initial: S,
  consume: (summary: S, row: T) => void,
  maxRows = 50_000,
  pageSize = 1000,
): Promise<S | null> {
  for (let from = 0; from <= maxRows; from += pageSize) {
    const result = await load(
      from,
      from === maxRows ? from : from + pageSize - 1,
    );
    if (
      result.error ||
      !result.data ||
      (from === maxRows && result.data.length > 0)
    ) {
      console.error(
        "[dashboard] Aggregate unavailable",
        result.error?.message ?? "Missing payload or safe row limit exceeded",
      );
      return null;
    }
    for (const row of result.data) consume(initial, row);
    if (result.data.length < pageSize) return initial;
  }
  return null;
}

/** Explicit stored booleans override role defaults; malformed permission records fail closed. */
export function dashboardFeature(
  role: CrmUserRole,
  permissions: unknown,
  key: "can_view_financials" | "can_export_data",
): boolean {
  if (role === "admin") return true;
  if (permissions === null || permissions === undefined)
    return ROLE_DEFAULT_FEATURES[role]?.[key] === true;
  if (typeof permissions !== "object" || Array.isArray(permissions))
    return false;
  const value = (permissions as Record<string, unknown>)[key];
  return typeof value === "boolean" ? value : false;
}

/** Navigation and dashboard drill-throughs share the existing custom-tab override contract. */
export function dashboardTab(
  role: CrmUserRole,
  allowedTabs: unknown,
  key: CrmTabKey,
): boolean {
  if (role === "admin") return true;
  if (Array.isArray(allowedTabs) && allowedTabs.length > 0)
    return allowedTabs.includes(key);
  return ROLE_DEFAULT_TABS[role]?.[key] === true;
}

/** A missing selection chooses useful work without treating unavailable counts as zero. */
export function overviewQueue(
  value: string | undefined,
  overdueCount: number | null,
): OverviewQueue {
  if (value === "overdue" || value === "today" || value === "unassigned")
    return value;
  return overdueCount !== null && overdueCount > 0 ? "overdue" : "today";
}

/** Reject invalid monetary records rather than quietly understating pipeline value. */
export function dashboardAmount(value: unknown): number | null {
  if (typeof value !== "number" && typeof value !== "string") return null;
  if (typeof value === "string" && value.trim() === "") return null;
  const amount = Number(value);
  return Number.isFinite(amount) && amount >= 0 ? amount : null;
}

/** Spreadsheet exports preserve quoted cells and neutralize formula-leading user text. */
export function dashboardCsvCell(value: string | number | null): string {
  const raw = value === null ? "" : String(value);
  const safe = /^[=+\-@\t\r]/.test(raw) ? "'" + raw : raw;
  return '"' + safe.replace(/"/g, '""') + '"';
}
