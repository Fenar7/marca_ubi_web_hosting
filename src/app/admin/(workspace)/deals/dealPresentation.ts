import { calculateOverdueTier } from "@/app/admin/components/Badges/badgeUtils";
import type {
  FunnelStatusItem,
  HydratedDealItem,
} from "./DealsWorkspaceClient";

const dateFormat = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});

/** Company-first identity stays identical in Board and Table without inventing a company. */
export function dealIdentity(deal: HydratedDealItem) {
  return {
    title: deal.company?.trim() || deal.name,
    contact: deal.company && deal.company !== deal.name ? deal.name : null,
  };
}

/** Initials describe the actual resolved owner; missing directory data is never a fictional person. */
export function ownerIdentity(deal: HydratedDealItem) {
  const name =
    deal.assigned_to_name ||
    (deal.assigned_to ? "Owner unavailable" : "Unassigned");
  const resolved = Boolean(
    deal.assigned_to && name !== "Owner unavailable" && name !== "Unassigned",
  );
  return {
    name,
    initials: resolved
      ? name
          .trim()
          .split(/\s+/)
          .slice(0, 2)
          .map((part) => part[0])
          .join("")
          .toUpperCase()
      : null,
  };
}

/** Preserve terminal/On Hold suppression, and format every schedule in the existing UTC contract. */
export function followUpPresentation(
  deal: HydratedDealItem,
  nowMs: number | null,
) {
  const revisit =
    deal.status_name.trim().toLowerCase() === "on hold" && deal.revisit_date;
  if (
    revisit &&
    nowMs !== null &&
    revisit > new Date(nowMs).toISOString().slice(0, 10)
  ) {
    const parsed = new Date(`${revisit}T00:00:00Z`);
    return {
      label: Number.isFinite(parsed.getTime())
        ? `Revisit ${dateFormat.format(parsed)}`
        : "Revisit date unavailable",
      overdue: false,
    };
  }
  if (!deal.next_follow_up) return { label: "Not scheduled", overdue: false };
  const date = new Date(deal.next_follow_up);
  if (!Number.isFinite(date.getTime()))
    return { label: "Schedule unavailable", overdue: false };
  const overdue =
    nowMs === null
      ? null
      : calculateOverdueTier(deal.next_follow_up, {
          bucket: deal.status_bucket,
          statusName: deal.status_name,
          revisitDate: deal.revisit_date,
          nowMs,
        });
  return {
    label: overdue?.isOverdue
      ? `${dateFormat.format(date)} · ${overdue.shortLabel}`
      : `${dateFormat.format(date)} UTC`,
    overdue: Boolean(overdue?.isOverdue),
  };
}

/** Guarded action APIs resolve certain destinations by name/bucket, so ambiguous catalogs fail closed. */
export function allowedMoveDestinations(stages: FunnelStatusItem[]) {
  return stages.filter((stage) => {
    if (stage.is_active === false) return false;
    if (stage.bucket === "converted" || stage.bucket === "lost")
      return (
        stages.filter((candidate) => candidate.bucket === stage.bucket)
          .length === 1
      );
    const name = stage.name.trim().toLowerCase();
    if (name === "negotiation" || name === "on hold")
      return (
        stages.filter(
          (candidate) => candidate.name.trim().toLowerCase() === name,
        ).length === 1
      );
    return true;
  });
}

/** A compact UI gate supplements server guards and preserves converted-record locking. */
export function canMoveDeal(deal: HydratedDealItem, role?: string) {
  return (
    ["admin", "sales_manager", "sales_executive"].includes(role || "") &&
    (role === "admin" || deal.status_bucket !== "converted")
  );
}
