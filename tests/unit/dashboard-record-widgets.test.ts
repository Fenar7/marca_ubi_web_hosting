import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import type { OverviewRecord } from "../../src/app/admin/components/Dashboard/OverviewWorkspace";

// Node's renderer has no CSS loader. Limit the stylesheet stub to these module imports.
const previousSassLoader = require.extensions[".scss"];
require.extensions[".scss"] = (module) => { module.exports = {}; };
const { UpcomingSlaCard }: typeof import("../../src/app/admin/components/Dashboard/UpcomingSlaCard") = require("../../src/app/admin/components/Dashboard/UpcomingSlaCard");
const { RecentTransactionsTable }: typeof import("../../src/app/admin/components/Dashboard/RecentTransactionsTable") = require("../../src/app/admin/components/Dashboard/RecentTransactionsTable");
const { CommercialDealsLedger, StageDistribution }: typeof import("../../src/app/admin/components/Dashboard/CommercialDealsLedger") = require("../../src/app/admin/components/Dashboard/CommercialDealsLedger");
if (previousSassLoader) require.extensions[".scss"] = previousSassLoader;
else delete require.extensions[".scss"];

const generatedAt = "2026-11-22T00:00:00.000Z";
const record: OverviewRecord = {
  id: "a", leadId: "LD-1", name: "Contact", company: "Long Client Company Name", href: null,
  owner: "Unassigned", stage: "Intake", stageId: "one", stageBucket: "open", serviceCategory: null,
  expectedValue: 157500, createdAt: "", due: "2026-11-22T01:30:00+02:00", canAdvance: false, nextStage: null,
};
const queue = { records: [record], recordsReady: true, canTasks: true, generatedAt, queueCounts: { overdue: 14, today: 0, unassigned: null } };
const stageProps = { financials: false, stages: [{ id: "one", name: "Intake", count: 96, value: 157500 }], selectedStageId: null, onStageSelect: () => {} };

describe("Commercial overview record widgets", () => {
  it("classifies dates against the server's UTC day and keeps independent count failures distinguishable", () => {
    const html = renderToStaticMarkup(createElement(UpcomingSlaCard, queue));
    assert.match(html, /21 Nov 2026/);
    assert.match(html, /data-timing="Overdue"/);
    assert.match(html, />14</);
    assert.match(html, />0</);
    assert.match(html, />Unavailable</);
    assert.match(html, /href="\/admin\/tasks"/);
    assert.equal(renderToStaticMarkup(createElement(UpcomingSlaCard, { ...queue, canTasks: false })), "");
  });
  it("keeps failed intake reads distinct from empty intake and never invents creation dates", () => {
    const html = renderToStaticMarkup(createElement(RecentTransactionsTable, { records: [record], recordsReady: true }));
    assert.match(html, /Date unavailable/);
    assert.doesNotMatch(html, /Success|transaction|href=/i);
    const failed = renderToStaticMarkup(createElement(RecentTransactionsTable, { records: [], recordsReady: false }));
    const empty = renderToStaticMarkup(createElement(RecentTransactionsTable, { records: [], recordsReady: true }));
    assert.match(failed, /unavailable/);
    assert.match(empty, /No open opportunities/);
  });
  it("shows server totals independently of the preview and never exposes restricted values or transitions", () => {
    const stages = renderToStaticMarkup(createElement(StageDistribution, { ...stageProps, pipelineReady: true }));
    assert.match(stages, /96 open opportunities/);
    assert.doesNotMatch(stages, /157500|1,57,500|₹/);
    const ledger = renderToStaticMarkup(createElement(CommercialDealsLedger, {
      ...stageProps, records: [record], recordsReady: true, generatedAt, onAdvanceStage: () => {},
    }));
    assert.match(ledger, /Long Client Company Name/);
    assert.doesNotMatch(ledger, /Expected value|Move to|href=|₹/);
  });
});