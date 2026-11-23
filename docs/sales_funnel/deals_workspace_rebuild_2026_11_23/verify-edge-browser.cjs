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
  const source = p
    .getByRole("region", { name: "New", exact: true })
    .getByRole("article")
    .first();
  const lane = p.getByRole("region", { name: "Contacted", exact: true });
  await source.dragTo(lane, {
    sourcePosition: { x: 20, y: 105 },
    targetPosition: { x: 100, y: 30 },
  });
  await p
    .getByRole("status")
    .filter({ hasText: /moved/i })
    .waitFor({ timeout: 3000 });
  check(
    "Mouse drag from the card body confirms the stage change",
    (await lane.getByRole("article").count()) === 4,
  );
  await open();
  const onHold = p.getByRole("region", { name: "On Hold", exact: true });
  await source.dragTo(onHold, {
    sourcePosition: { x: 20, y: 105 },
    targetPosition: { x: 100, y: 30 },
  });
  await p.getByRole("dialog", { name: "Fixture guarded transition" }).waitFor();
  await p.getByRole("button", { name: "Cancel transition" }).click();
  check(
    "Mouse drag to a guarded stage requires its form and cancellation keeps the card",
    (await p
      .getByRole("region", { name: "New", exact: true })
      .getByRole("article")
      .count()) === 3,
  );
  await open("?role=viewer");
  check(
    "Viewer cards are not draggable",
    (await p.locator('article[draggable="true"]').count()) === 0,
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
  await open("?fixture_delay=1");
  await p.getByRole("searchbox", { name: "Search deals" }).fill("Alserkal");
  await p.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll("button"));
    for (const name of ["Table", "Open"]) {
      const button = buttons.find((item) => item.textContent.trim() === name);
      if (!button) throw new Error(`Missing fixture control ${name}`);
      button.click();
    }
  });
  check(
    "Overlapping delayed navigation keeps view, bucket and debounced search",
    await p
      .waitForURL(
        (url) =>
          url.searchParams.get("search") === "Alserkal" &&
          url.searchParams.get("view") === "table" &&
          url.searchParams.get("bucket") === "open",
        { timeout: 5000 },
      )
      .then(
        () => true,
        () => false,
      ),
  );
  await b.close();
  fs.writeFileSync(
    path.join(__dirname, "edge-browser-results.json"),
    JSON.stringify(
      {
        environment:
          "Actual components; isolated stubbed mutations; drag performed through browser mouse input",
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
