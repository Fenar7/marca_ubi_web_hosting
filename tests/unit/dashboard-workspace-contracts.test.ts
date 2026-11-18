import { describe, it } from "node:test";
import assert from "node:assert/strict";
import {
  dashboardAmount,
  dashboardCsvCell,
  dashboardFeature,
  dashboardSelect,
  dashboardTab,
  foldDashboardPages,
  overviewQueue,
} from "../../src/app/admin/lib/dashboardContracts";
import {
  getUtcDayWindow,
  isFollowUpInQueue,
} from "../../src/app/admin/lib/followUpQueue";

describe("Overview permission and aggregation contracts", () => {
  it("does not select monetary columns when financial access is absent", () => {
    for (const kind of ["pipeline", "conversion"] as const) {
      assert.equal(
        dashboardSelect(false, kind).includes("expected_value"),
        false,
      );
      assert.equal(
        dashboardSelect(true, kind).includes("expected_value"),
        true,
      );
    }
    assert.equal(
      dashboardFeature("sales_executive", null, "can_view_financials"),
      false,
    );
    assert.equal(
      dashboardFeature(
        "sales_manager",
        { can_view_financials: false },
        "can_view_financials",
      ),
      false,
    );
    assert.equal(
      dashboardFeature(
        "sales_executive",
        { can_view_financials: true },
        "can_view_financials",
      ),
      true,
    );
    assert.equal(
      dashboardFeature("sales_manager", "invalid", "can_view_financials"),
      false,
    );
    assert.equal(dashboardFeature("viewer", {}, "can_export_data"), false);
  });

  it("honors explicit tab overrides without granting related destinations", () => {
    assert.equal(
      dashboardTab("sales_manager", ["command_center"], "deals"),
      false,
    );
    assert.equal(dashboardTab("viewer", [], "tasks"), false);
    assert.equal(dashboardTab("viewer", ["tasks"], "tasks"), true);
  });

  it("publishes exact-at-limit totals but refuses a partial result above the safety cap", async () => {
    const load = (values: number[]) => async (from: number, to: number) => ({
      data: values.slice(from, to + 1),
      error: null,
    });
    const sum = (summary: { value: number }, row: number) => {
      summary.value += row;
    };
    assert.deepEqual(
      await foldDashboardPages(load([1, 2, 3, 4]), { value: 0 }, sum, 4, 2),
      { value: 10 },
    );
    assert.equal(
      await foldDashboardPages(load([1, 2, 3, 4, 5]), { value: 0 }, sum, 4, 2),
      null,
    );
    assert.equal(
      await foldDashboardPages(
        async () => ({ data: null, error: { message: "Unavailable" } }),
        { value: 0 },
        sum,
      ),
      null,
    );
    assert.deepEqual(await foldDashboardPages(load([]), { value: 0 }, sum), {
      value: 0,
    });
  });

  it("keeps day boundaries disjoint across browser-local dates and selects useful work", () => {
    const window = getUtcDayWindow(new Date("2026-11-11T00:30:00+05:30"));
    assert.equal(window.date, "2026-11-10");
    assert.equal(isFollowUpInQueue("overdue", window.start, window), false);
    assert.equal(isFollowUpInQueue("today", window.start, window), true);
    assert.equal(isFollowUpInQueue("today", window.end, window), true);
    assert.equal(
      isFollowUpInQueue("overdue", "2026-11-09T23:59:59.999Z", window),
      true,
    );
    assert.equal(isFollowUpInQueue("unassigned", null, window, true), true);
    assert.equal(
      isFollowUpInQueue("unassigned", window.start, window, true),
      false,
    );
    assert.equal(overviewQueue(undefined, 7), "overdue");
    assert.equal(overviewQueue("invalid", null), "today");
    assert.equal(overviewQueue("unassigned", 7), "unassigned");
  });

  it("does not turn corrupt currency into a believable zero and neutralizes CSV formulas", () => {
    for (const value of [null, undefined, "", "bad", -1, Infinity])
      assert.equal(dashboardAmount(value), null);
    assert.equal(dashboardAmount("0"), 0);
    assert.equal(dashboardAmount("125.25"), 125.25);
    assert.equal(
      dashboardCsvCell('=HYPERLINK("evil")'),
      '"\'=HYPERLINK(""evil"")"',
    );
    assert.equal(dashboardCsvCell("Brand, Inc"), '"Brand, Inc"');
  });
});
