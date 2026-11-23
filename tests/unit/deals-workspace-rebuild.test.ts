import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { dashboardFeature } from "../../src/app/admin/lib/dashboardContracts";
import {
  dealsFilterUrl,
  dealSelectColumns,
  sortPageDeals,
  normalizeDealAmount,
  dealsPayloadAvailable,
} from "../../src/app/admin/(workspace)/deals/dealsWorkspaceModel";
import type { HydratedDealItem } from "../../src/app/admin/(workspace)/deals/DealsWorkspaceClient";

const deal = (
  id: string,
  fields: Partial<HydratedDealItem> = {},
): HydratedDealItem => ({
  id,
  lead_id: id,
  name: id,
  company: null,
  phone: null,
  email: null,
  expected_value: null,
  priority: "Medium",
  next_follow_up: null,
  created_at: "",
  updated_at: "",
  assigned_to: null,
  status_id: "new",
  lead_source_id: "",
  assigned_to_name: "Unassigned",
  status_name: "New",
  status_bucket: "open",
  status_color: "#454542",
  source_name: "Referral",
  ...fields,
});

describe("Deals workspace query and sorting contracts", () => {
  it("distinguishes genuine empty payloads and valid zero values from unavailable or malformed data", () => {
    assert.equal(dealsPayloadAvailable([], null), true);
    assert.equal(dealsPayloadAvailable(null, null), false);
    assert.equal(dealsPayloadAvailable([], { message: "failed" }), false);
    for (const value of [
      "",
      " ",
      -1,
      "-2",
      Infinity,
      NaN,
      null,
      undefined,
      true,
    ])
      assert.equal(normalizeDealAmount(value), null);
    assert.equal(normalizeDealAmount("0"), 0);
    assert.equal(normalizeDealAmount("120.50"), 120.5);
  });
  it("excludes amounts for default executives and explicit restrictive overrides", () => {
    for (const allowed of [
      dashboardFeature("sales_executive", null, "can_view_financials"),
      dashboardFeature(
        "sales_manager",
        { can_view_financials: false },
        "can_view_financials",
      ),
    ]) {
      assert.equal(allowed, false);
      assert.equal(
        dealSelectColumns(allowed).includes("expected_value"),
        false,
      );
    }
    assert.ok(dealSelectColumns(true).includes("expected_value"));
    assert.ok(dealSelectColumns(false).includes("next_follow_up"));
  });
  it("preserves page on view changes and resets it for filters without losing other scopes", () => {
    assert.equal(
      dealsFilterUrl("page=4&stage=x&search=abc", { view: "table" }),
      "/admin/deals?page=4&stage=x&search=abc&view=table",
    );
    const result = new URL(
      dealsFilterUrl("page=4&stage=x&view=table&q=old", {
        search: "A&B",
        priority: "high",
      }),
      "https://test.invalid",
    );
    assert.equal(result.searchParams.has("page"), false);
    assert.equal(result.searchParams.has("q"), false);
    assert.equal(result.searchParams.get("stage"), "x");
    assert.equal(result.searchParams.get("search"), "A&B");
    assert.equal(
      dealsFilterUrl("bucket=open", { bucket: "all", search: "all" }),
      "/admin/deals?search=all",
    );
  });
  it("sorts company-first identities without mutating the loaded records", () => {
    const rows = [
      deal("a", { name: "Alice", company: "Zulu" }),
      deal("b", { name: "Zach", company: "Acme" }),
    ];
    assert.deepEqual(
      sortPageDeals(rows, "identity", true).map((row) => row.id),
      ["b", "a"],
    );
    assert.deepEqual(
      rows.map((row) => row.id),
      ["a", "b"],
    );
  });
  it("keeps unavailable amounts and invalid due dates last in either direction", () => {
    const rows = [
      deal("null"),
      deal("large", {
        expected_value: 200,
        next_follow_up: "2026-11-22T00:00:00Z",
      }),
      deal("small", {
        expected_value: 0,
        next_follow_up: "2026-11-21T00:00:00Z",
      }),
      deal("invalid", { next_follow_up: "bad" }),
    ];
    for (const field of ["expected_value", "next_follow_up"] as const) {
      assert.deepEqual(
        sortPageDeals(rows, field, false)
          .slice(0, 2)
          .map((row) => row.id),
        ["large", "small"],
      );
      assert.deepEqual(
        sortPageDeals(rows, field, true)
          .slice(0, 2)
          .map((row) => row.id),
        ["small", "large"],
      );
    }
  });
});
