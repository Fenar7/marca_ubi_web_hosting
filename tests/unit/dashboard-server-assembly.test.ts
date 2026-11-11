import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import type { OverviewData } from "../../src/app/admin/components/Dashboard/OverviewWorkspace";

type Row = Record<string, unknown>;
interface Response {
  data: Row[] | Row | null;
  error: { message: string } | null;
  count?: number;
}
interface Read {
  table: string;
  columns: string;
  head: boolean;
  operations: string[];
}
const reads: Read[] = [];
let role = "sales_manager";
let stageFailure = false;
let missingPreview = false;
const today = new Date().toISOString().slice(0, 10);
const eligible: Row[] = Array.from({ length: 7 }, (_, index) => ({
  id: `lead-${index}`,
  lead_id: `LD-${index}`,
  name: `Eligible ${index}`,
  company: null,
  status_id: "open",
  assigned_to: null,
  next_follow_up: "2020-01-01T00:00:00Z",
  revisit_date: null,
  expected_value: 100,
  created_at: "2020-01-01T00:00:00Z",
}));
const deferred: Row = {
  ...eligible[0],
  id: "deferred",
  revisit_date: "2099-01-01",
  name: "Deferred",
};

/** Query double applies eligibility before limits and records selected columns to detect server-side disclosure. */
class Query implements PromiseLike<Response> {
  private predicates: ((row: Row) => boolean)[] = [];
  private start = 0;
  private end = Infinity;
  private single = false;
  private read: Read;
  constructor(private table: string) {
    this.read = { table, columns: "", head: false, operations: [] };
    reads.push(this.read);
  }
  select(columns: string, options?: { head?: boolean }): this {
    this.read.columns = columns;
    this.read.head = options?.head === true;
    return this;
  }
  eq(key: string, value: unknown): this {
    this.predicates.push((row) => row[key] === value);
    return this;
  }
  in(key: string, values: unknown[]): this {
    this.predicates.push((row) => values.includes(row[key]));
    return this;
  }
  is(key: string, value: unknown): this {
    this.predicates.push((row) => row[key] === value);
    return this;
  }
  not(key: string): this {
    this.predicates.push((row) => row[key] !== null);
    return this;
  }
  lt(key: string, value: string): this {
    this.predicates.push((row) => String(row[key]) < value);
    return this;
  }
  gte(key: string, value: string): this {
    this.predicates.push((row) => String(row[key]) >= value);
    return this;
  }
  lte(key: string, value: string): this {
    this.predicates.push((row) => String(row[key]) <= value);
    return this;
  }
  or(expression: string): this {
    this.read.operations.push("eligibility");
    if (expression.includes("revisit_date"))
      this.predicates.push(
        (row) => row.revisit_date === null || String(row.revisit_date) <= today,
      );
    return this;
  }
  order(): this {
    return this;
  }
  range(from: number, to: number): this {
    this.start = from;
    this.end = to;
    return this;
  }
  limit(count: number): this {
    this.read.operations.push("limit");
    this.end = count - 1;
    return this;
  }
  maybeSingle(): this {
    this.single = true;
    return this;
  }
  then<TResult1 = Response, TResult2 = never>(
    onfulfilled?:
      | ((value: Response) => TResult1 | PromiseLike<TResult1>)
      | null,
    onrejected?: ((reason: unknown) => TResult2 | PromiseLike<TResult2>) | null,
  ): PromiseLike<TResult1 | TResult2> {
    let response: Response;
    if (this.table === "profiles")
      response = {
        data: this.single
          ? {
              role,
              status: "active",
              allowed_tabs: null,
              feature_permissions: null,
            }
          : [],
        error: null,
      };
    else if (this.table === "funnel_statuses")
      response = stageFailure
        ? { data: null, error: { message: "Stage lookup unavailable" } }
        : {
            data: [
              { id: "open", name: "New", bucket: "open" },
              { id: "won", name: "Won", bucket: "converted" },
            ],
            error: null,
          };
    else {
      const rows = [deferred, ...eligible].filter((row) =>
        this.predicates.every((predicate) => predicate(row)),
      );
      response = {
        data:
          this.read.head ||
          (missingPreview && this.read.operations.includes("limit"))
            ? null
            : rows.slice(this.start, this.end + 1),
        count: rows.length,
        error: null,
      };
    }
    return Promise.resolve(response).then(onfulfilled, onrejected);
  }
}

let directory: string;
let page: (props: {
  searchParams: Promise<{ queue?: string }>;
}) => Promise<{ props: { data: OverviewData } }>;
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "marca-dashboard-test-"));
  after(() => rm(directory, { recursive: true, force: true }));
  const output = path.join(directory, "dashboard.cjs");
  await build({
    entryPoints: ["src/app/admin/(workspace)/page.tsx"],
    outfile: output,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    plugins: [
      {
        name: "isolated-dashboard-dependencies",
        setup(builder) {
          builder.onResolve(
            { filter: /^@\/app\/lib\/supabase\/server$/ },
            () => ({ path: "client", namespace: "dashboard-test" }),
          );
          builder.onResolve({ filter: /^next\/navigation$/ }, () => ({
            path: "navigation",
            namespace: "dashboard-test",
          }));
          builder.onResolve(
            { filter: /components\/Dashboard\/OverviewWorkspace$/ },
            () => ({ path: "view", namespace: "dashboard-test" }),
          );
          builder.onLoad(
            { filter: /.*/, namespace: "dashboard-test" },
            (args) => ({
              contents:
                args.path === "client"
                  ? "export const createClient = async () => globalThis.__dashboardTestClient;"
                  : args.path === "navigation"
                    ? 'export const redirect = () => { throw new Error("redirect"); }; export const notFound = () => { throw new Error("notFound"); };'
                    : "export const OverviewWorkspace = () => null;",
            }),
          );
        },
      },
    ],
  });
  const testGlobal = globalThis as typeof globalThis & {
    __dashboardTestClient?: unknown;
  };
  testGlobal.__dashboardTestClient = {
    auth: { getUser: async () => ({ data: { user: { id: "actor" } } }) },
    from: (table: string) => new Query(table),
  };
  page = createRequire(path.join(process.cwd(), "package.json"))(
    output,
  ).default;
});
after(() => {
  delete (globalThis as typeof globalThis & { __dashboardTestClient?: unknown })
    .__dashboardTestClient;
});

describe(
  "Authenticated overview server assembly",
  { concurrency: false },
  () => {
    it("filters deferred work before limiting and reconciles full count with six-row preview", async () => {
      role = "sales_manager";
      stageFailure = false;
      reads.length = 0;
      const {
        props: { data },
      } = await page({ searchParams: Promise.resolve({ queue: "overdue" }) });
      assert.equal(data.queueCounts.overdue, 7);
      assert.equal(data.records.length, 6);
      assert.equal(
        data.records.some((record) => record.name === "Deferred"),
        false,
      );
      for (const read of reads.filter((read) =>
        read.operations.includes("limit"),
      ))
        assert.ok(
          read.operations.indexOf("eligibility") <
            read.operations.indexOf("limit"),
        );
      assert.equal(data.pipelineCount, 8); // Deferred work remains in the current pipeline, just not the queue.
    });
    it("omits finance database columns and client values for the default sales-executive role", async () => {
      role = "sales_executive";
      reads.length = 0;
      const {
        props: { data },
      } = await page({ searchParams: Promise.resolve({}) });
      assert.equal(data.financials, false);
      assert.equal(data.pipelineValue, null);
      assert.equal(data.convertedValue, null);
      assert.equal(data.canExport, false);
      assert.ok(
        reads
          .filter((read) => read.table === "leads")
          .every((read) => !read.columns.includes("expected_value")),
      );
      assert.ok(data.stages.every((stage) => stage.value === null));
    });
    it("propagates a failed stage dependency to every dependent section instead of reporting zeros", async () => {
      stageFailure = true;
      const {
        props: { data },
      } = await page({ searchParams: Promise.resolve({}) });
      assert.equal(data.pipelineReady, false);
      assert.equal(data.outcomesReady, false);
      assert.equal(data.recordsReady, false);
      assert.equal(data.queueCounts.today, null);
      assert.equal(data.convertedCount, null);
      stageFailure = false;
    });
    it("does not treat a missing preview payload as a successfully empty queue", async () => {
      missingPreview = true;
      const {
        props: { data },
      } = await page({ searchParams: Promise.resolve({ queue: "overdue" }) });
      assert.equal(data.recordsReady, false);
      assert.equal(data.queueCounts.overdue, 7);
      assert.equal(data.pipelineReady, true);
      missingPreview = false;
    });
  },
);
