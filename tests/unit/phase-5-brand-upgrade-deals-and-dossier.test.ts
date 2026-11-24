import { describe, it } from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import path from "node:path";
import {
  canMoveDeal,
  allowedMoveDestinations,
  followUpPresentation,
} from "../../src/app/admin/(workspace)/deals/dealPresentation";
import type {
  HydratedDealItem,
  FunnelStatusItem,
} from "../../src/app/admin/(workspace)/deals/DealsWorkspaceClient";

const read = (file: string) =>
  fs.readFileSync(path.join(process.cwd(), file), "utf8");
const record: HydratedDealItem = {
  id: "deal",
  lead_id: "LD-1",
  name: "Contact",
  company: "Company",
  phone: null,
  email: null,
  expected_value: null,
  priority: "High",
  next_follow_up: "2026-10-01T00:00:00Z",
  revisit_date: "2026-12-01",
  created_at: "",
  updated_at: "",
  assigned_to: null,
  status_id: "hold",
  lead_source_id: "",
  assigned_to_name: "Unassigned",
  status_name: "On Hold",
  status_bucket: "open",
  status_color: "#454542",
  source_name: "Referral",
};
const stage = (
  id: string,
  name: string,
  bucket = "open",
): FunnelStatusItem => ({
  id,
  name,
  bucket,
  sort_order: 0,
  color_code: "#454542",
  is_active: true,
});

describe("Deals presentation and preserved dossier contracts", () => {
  it("keeps read-only and converted-record locking before movement controls", () => {
    assert.equal(canMoveDeal(record, "viewer"), false);
    assert.equal(
      canMoveDeal({ ...record, status_bucket: "converted" }, "sales_manager"),
      false,
    );
    assert.equal(
      canMoveDeal({ ...record, status_bucket: "converted" }, "admin"),
      true,
    );
    assert.equal(canMoveDeal(record, "sales_executive"), true);
  });
  it("excludes inactive and ambiguous guarded destinations", () => {
    const choices = allowedMoveDestinations([
      stage("a", "New"),
      { ...stage("b", "Retired"), is_active: false },
      stage("c", "Converted", "converted"),
      stage("d", "Won", "converted"),
      stage("e", "On Hold"),
      stage("f", "On Hold"),
    ]);
    assert.deepEqual(
      choices.map((choice) => choice.id),
      ["a"],
    );
  });
  it("shows recorded revisit context rather than a false overdue reminder", () => {
    const result = followUpPresentation(
      record,
      Date.parse("2026-11-23T00:00:00Z"),
    );
    assert.equal(result.overdue, false);
    assert.ok(result.label.startsWith("Revisit"));
  });
  it("preserves bounded server pagination and permission-specific selects", () => {
    const page = read("src/app/admin/(workspace)/deals/page.tsx");
    assert.ok(page.includes("dealSelectColumns(canViewFinancials)"));
    assert.ok(
      page.includes(".range((page - 1) * pageSize, page * pageSize - 1)"),
    );
    assert.ok(page.includes("feature_permissions"));
  });
  it("uses an explicit guarded workflow and one shared card/table action menu", () => {
    const workspace = read(
      "src/app/admin/(workspace)/deals/DealsWorkspaceClient.tsx",
    );
    const table = read("src/app/admin/(workspace)/deals/DealsTable.tsx");
    assert.ok(workspace.includes("<StageTransitionModal"));
    assert.ok(workspace.includes("moveLock.current"));
    assert.ok(table.includes("<DealActionsMenu"));
    assert.ok(table.includes("<table"));
    assert.ok(table.includes("aria-sort"));
  });
  it("retains dossier Escape/Tab handling, scroll locking, real contact links and brief accordion", () => {
    const drawer = read(
      "src/app/admin/components/DossierDrawer/ClientDossierDrawer.tsx",
    );
    const organization = read(
      "src/app/admin/components/DossierDrawer/OrganizationDossier.tsx",
    );
    assert.match(drawer, /key === ["']Escape["']/);
    assert.match(drawer, /key === ["']Tab["']/);
    assert.ok(drawer.includes("document.body.style.overflow"));
    assert.ok(organization.includes("sanitizeTelUri"));
    assert.ok(organization.includes("createWhatsAppUri"));
    assert.ok(organization.includes("<RawBriefAccordion"));
  });
  it("keeps responsive touch controls, visible focus and currency alignment", () => {
    const styles = read(
      "src/app/admin/(workspace)/deals/DealsWorkspaceClient.module.scss",
    );
    assert.ok(styles.includes("min-height: 44px"));
    assert.ok(styles.includes(":focus-visible"));
    assert.ok(styles.includes("tabular-nums"));
    assert.ok(styles.includes("prefers-reduced-motion"));
    assert.equal(/#2563eb|#1d4ed8/i.test(styles), false);
  });
});
