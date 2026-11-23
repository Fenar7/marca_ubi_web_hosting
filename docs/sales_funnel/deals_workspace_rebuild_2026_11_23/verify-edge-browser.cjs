const { chromium } = require("@playwright/test");
const fs = require("fs"),
  path = require("path");
(async () => {
  const b = await chromium.launch({ headless: true });
  const c = await b.newContext({ viewport: { width: 1440, height: 1000 } });
  const p = await c.newPage();
  const r = [];
  const check = (name, passed, detail = "") => r.push({ name, passed, detail });
  const open = async (q) => {
    await p.goto("http://127.0.0.1:3021/admin/deals" + (q || ""));
    await p.getByRole("button", { name: "Board", exact: true }).waitFor();
  };
  const actions = async () => {
    await p
      .getByRole("button", { name: /Actions for/ })
      .first()
      .click();
    await p.getByRole("button", { name: "Move to stage", exact: true }).click();
  };
  await open("?state=move-error");
  await actions();
  await p.getByRole("radio", { name: "Contacted", exact: true }).check();
  await p
    .getByRole("button", { name: "Move to Contacted", exact: true })
    .click();
  await p.getByRole("alert").waitFor();
  check(
    "Failed ordinary move remains in source lane",
    (await p
      .getByRole("region", { name: "New", exact: true })
      .getByRole("article")
      .count()) === 3,
  );
  await actions();
  check(
    "Failed move destination retained on retry",
    await p.getByRole("radio", { name: "Contacted", exact: true }).isChecked(),
  );
  await p.keyboard.press("Escape");
  check(
    "Escape restores action trigger focus",
    await p.evaluate(() =>
      document.activeElement
        ?.getAttribute("aria-label")
        ?.startsWith("Actions for"),
    ),
  );
  await open();
  await actions();
  await p.getByRole("radio", { name: "Negotiation", exact: true }).check();
  await p
    .getByRole("button", { name: "Continue to Negotiation", exact: true })
    .click();
  await p.getByRole("dialog", { name: "Fixture guarded transition" }).waitFor();
  await p.getByRole("button", { name: "Cancel transition" }).click();
  check(
    "Guarded cancellation leaves source stage",
    (await p
      .getByRole("region", { name: "New", exact: true })
      .getByRole("article")
      .count()) === 3,
  );
  await open();
  const dt = await p.evaluateHandle(() => new DataTransfer());
  const handle = p.locator("[draggable=true]").first();
  await handle.dispatchEvent("dragstart", { dataTransfer: dt });
  const lane = p.getByRole("region", { name: "Contacted", exact: true });
  await lane.dispatchEvent("dragover", { dataTransfer: dt });
  await lane.dispatchEvent("drop", { dataTransfer: dt });
  await p.getByRole("status").filter({ hasText: /moved/i }).waitFor();
  check(
    "Drag uses same confirmed transition handler",
    (await lane.getByRole("article").count()) === 4,
  );
  await open();
  await p.getByRole("searchbox", { name: "Search deals" }).fill("Alserkal");
  await p.waitForURL(/search=Alserkal/);
  await p.getByRole("button", { name: "Table", exact: true }).click();
  await p.getByRole("table").waitFor();
  check(
    "View toggle preserves search",
    new URL(p.url()).searchParams.get("search") === "Alserkal",
  );
  await p.getByRole("button", { name: /Filters/ }).click();
  await p
    .getByRole("dialog")
    .locator("select[name=assigned_to]")
    .selectOption("owner-1");
  await p.getByRole("button", { name: "Apply filters", exact: true }).click();
  await p.waitForURL(/assigned_to=owner-1/);
  check(
    "Applied owner filter preserves view/search",
    new URL(p.url()).searchParams.get("view") === "table" &&
      new URL(p.url()).searchParams.get("search") === "Alserkal",
  );
  await b.close();
  fs.writeFileSync(
    path.join(__dirname, "edge-browser-results.json"),
    JSON.stringify(
      {
        environment:
          "Actual components; isolated stubbed mutations; drag dispatched through DOM events",
        results: r,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(r, null, 2));
  if (r.some((x) => !x.passed)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
