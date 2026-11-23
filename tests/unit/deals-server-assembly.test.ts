import { after, before, describe, it } from "node:test";
import assert from "node:assert/strict";
import { build } from "esbuild";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { createRequire } from "node:module";
import type React from "react";
import type { HydratedDealItem } from "../../src/app/admin/(workspace)/deals/DealsWorkspaceClient";

type TestElement = {
  props: {
    children?: React.ReactNode;
    initialDeals?: HydratedDealItem[];
    canViewFinancials?: boolean;
  };
};
let financial = true;
let missing = false;
const reads: string[] = [];
class Query {
  constructor(private table: string) {}
  select(columns: string): this {
    if (this.table === "leads") reads.push(columns);
    return this;
  }
  eq(): this {
    return this;
  }
  order(): this {
    return this;
  }
  range(): this {
    return this;
  }
  maybeSingle(): this {
    return this;
  }
  then(resolve: (value: unknown) => unknown) {
    const profile = {
      id: "user",
      role: "sales_manager",
      status: "active",
      allowed_tabs: ["deals"],
      feature_permissions: { can_view_financials: financial },
    };
    const record = {
      id: "deal",
      lead_id: "LD-1",
      name: "Contact",
      company: "Company",
      expected_value: 250000,
      priority: "High",
      status_id: "new",
      funnel_status: {
        id: "new",
        name: "New",
        bucket: "open",
        sort_order: 1,
        color_code: "#454542",
      },
    };
    const data =
      this.table === "profiles"
        ? profile
        : this.table === "funnel_statuses"
          ? [
              {
                id: "new",
                name: "New",
                bucket: "open",
                sort_order: 1,
                color_code: "#454542",
              },
            ]
          : this.table === "leads"
            ? missing
              ? null
              : [record]
            : [];
    return Promise.resolve({ data, error: null, count: 1 }).then(resolve);
  }
}
let runPage: (props: Record<string, never>) => Promise<TestElement>;
let directory: string;
const globals = globalThis as typeof globalThis & { __dealsClient?: unknown };
function findWorkspace(node: unknown): TestElement | null {
  if (Array.isArray(node)) {
    for (const child of node) {
      const found = findWorkspace(child);
      if (found) return found;
    }
    return null;
  }
  if (!node || typeof node !== "object" || !("props" in node)) return null;
  const element = node as TestElement;
  return element.props.initialDeals
    ? element
    : findWorkspace(element.props.children);
}
before(async () => {
  directory = await mkdtemp(path.join(tmpdir(), "deals-assembly-"));
  const output = path.join(directory, "page.cjs");
  await build({
    entryPoints: ["src/app/admin/(workspace)/deals/page.tsx"],
    outfile: output,
    bundle: true,
    platform: "node",
    format: "cjs",
    jsx: "automatic",
    plugins: [
      {
        name: "isolated-deals-server",
        setup(builder) {
          builder.onResolve(
            { filter: /^@\/app\/lib\/supabase\/server$/ },
            () => ({ path: "client", namespace: "test" }),
          );
          builder.onResolve(
            { filter: /^next\/(navigation|link)$/ },
            (args) => ({ path: args.path, namespace: "test" }),
          );
          builder.onResolve(
            { filter: /DealsWorkspaceClient$|DealsLoading$|ResultPagination$/ },
            () => ({ path: "view", namespace: "test" }),
          );
          builder.onResolve({ filter: /\.scss$/ }, () => ({
            path: "style",
            namespace: "test",
          }));
          builder.onLoad({ filter: /.*/, namespace: "test" }, (args) => ({
            contents:
              args.path === "client"
                ? "export const createClient=async()=>globalThis.__dealsClient"
                : args.path === "next/navigation"
                  ? 'export const redirect=()=>{throw new Error("redirect")};'
                  : args.path === "next/link"
                    ? "export default ()=>null"
                    : args.path === "style"
                      ? "export default {}"
                      : "export const DealsWorkspaceClient=()=>null;export const DealsLoading=()=>null;export const ResultPagination=()=>null;",
          }));
        },
      },
    ],
  });
  globals.__dealsClient = {
    auth: { getUser: async () => ({ data: { user: { id: "user" } } }) },
    from: (table: string) => new Query(table),
  };
  runPage = createRequire(path.join(process.cwd(), "package.json"))(
    output,
  ).default;
});
after(async () => {
  delete globals.__dealsClient;
  if (directory) await rm(directory, { recursive: true, force: true });
});
describe("Deals server assembly", { concurrency: false }, () => {
  it("excludes monetary selects and DTO values for a financially restricted authenticated user", async () => {
    financial = false;
    missing = false;
    reads.length = 0;
    const workspace = findWorkspace(await runPage({}));
    assert.ok(workspace);
    assert.equal(
      reads.some((columns) => columns.includes("expected_value")),
      false,
    );
    assert.equal(workspace.props.canViewFinancials, false);
    assert.equal(workspace.props.initialDeals?.[0].expected_value, null);
  });
  it("preserves authorized values while treating a missing payload as unavailable", async () => {
    financial = true;
    missing = false;
    reads.length = 0;
    const workspace = findWorkspace(await runPage({}));
    assert.equal(workspace?.props.initialDeals?.[0].expected_value, 250000);
    assert.equal(
      reads.some((columns) => columns.includes("expected_value")),
      true,
    );
    missing = true;
    assert.equal(findWorkspace(await runPage({})), null);
  });
});
