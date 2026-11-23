const { chromium } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("fs"),
  path = require("path");
const dir = __dirname,
  shots = path.join(dir, "screenshots");
fs.mkdirSync(shots, { recursive: true });
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  const results = [],
    errors = [];
  page.on("pageerror", (e) => errors.push(e.message));
  function check(name, passed, detail = "") {
    results.push({ name, passed, detail });
    if (!passed) console.error(name, detail);
  }
  async function open(query = "") {
    await page.goto("http://127.0.0.1:3021/admin/deals" + query);
    await page.getByRole("button", { name: "Board", exact: true }).waitFor();
    await page.evaluate(() => document.fonts.ready);
  }
  await open();
  await page.screenshot({
    path: path.join(shots, "board-desktop.png"),
    fullPage: true,
  });
  check(
    "No permanent Move select",
    (await page.locator("article select").count()) === 0,
  );
  await page
    .getByRole("button", { name: /Actions for/ })
    .first()
    .click();
  await page
    .getByRole("button", { name: "Move to stage", exact: true })
    .click();
  await page
    .getByRole("dialog")
    .screenshot({ path: path.join(shots, "move-popover.png") });
  const radio = page.getByRole("radio", { name: "Contacted", exact: true });
  await radio.check();
  await page
    .getByRole("button", { name: "Move to Contacted", exact: true })
    .click();
  await page.getByRole("status").filter({ hasText: /moved/i }).waitFor();
  check("Explicit ordinary move commits fixture", true);
  await page.getByRole("button", { name: "Table", exact: true }).click();
  await page.getByRole("table").waitFor();
  check(
    "Table semantic headings",
    (await page.getByRole("columnheader").count()) >= 6,
  );
  await page.screenshot({
    path: path.join(shots, "table-desktop.png"),
    fullPage: true,
  });
  await page.getByRole("button", { name: /Filters/ }).click();
  await page.getByRole("dialog").waitFor();
  await page
    .getByRole("dialog")
    .screenshot({ path: path.join(shots, "filters-desktop.png") });
  await page.keyboard.press("Escape");
  check(
    "Filter escape closes",
    (await page.getByRole("dialog").count()) === 0 ||
      !(await page.getByRole("dialog").isVisible()),
  );
  for (const width of [320, 375, 768, 1024, 1440, 1920]) {
    await page.setViewportSize({ width, height: 900 });
    await open();
    check(
      "No document overflow " + width,
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth + 1,
      ),
    );
    if (width === 375) {
      await page.screenshot({
        path: path.join(shots, "board-mobile.png"),
        fullPage: true,
      });
      await page.getByRole("button", { name: "Table", exact: true }).click();
      await page.screenshot({
        path: path.join(shots, "table-mobile.png"),
        fullPage: true,
      });
    }
  }
  await page.setViewportSize({ width: 1440, height: 1000 });
  await open("?role=viewer");
  await page
    .getByRole("button", { name: /Actions for/ })
    .first()
    .click();
  check(
    "Viewer has no movement action",
    (await page
      .getByRole("button", { name: "Move to stage", exact: true })
      .count()) === 0,
  );
  await page.keyboard.press("Escape");
  await open("?role=sales_executive");
  check(
    "Restricted fixture has no monetary output",
    !(await page.locator("body").innerText()).includes(
      String.fromCharCode(0x20b9),
    ),
  );
  await page.screenshot({
    path: path.join(shots, "restricted-desktop.png"),
    fullPage: true,
  });
  await open("?state=empty");
  check(
    "Empty state explicit",
    /no deals/i.test(await page.locator("body").innerText()),
  );
  await page.screenshot({
    path: path.join(shots, "empty-desktop.png"),
    fullPage: true,
  });
  await open();
  const axe = await new AxeBuilder({ page }).analyze();
  const serious = axe.violations.filter(
    (v) => v.impact === "serious" || v.impact === "critical",
  );
  check(
    "No serious or critical axe violations",
    serious.length === 0,
    JSON.stringify(
      serious.map((v) => ({ id: v.id, nodes: v.nodes.map((n) => n.target) })),
    ),
  );
  await page.evaluate(() => (document.documentElement.style.zoom = "2"));
  check(
    "200 percent CSS zoom no overflow",
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth + 1,
    ),
  );
  await page.screenshot({
    path: path.join(shots, "zoom-200-css.png"),
    fullPage: true,
  });
  check("No runtime errors", errors.length === 0, JSON.stringify(errors));
  await browser.close();
  fs.writeFileSync(
    path.join(dir, "browser-results.json"),
    JSON.stringify(
      {
        environment:
          "Isolated real-component fixtures; mutations stubbed; CSS zoom is not browser zoom",
        results,
      },
      null,
      2,
    ),
  );
  console.log(JSON.stringify(results, null, 2));
  if (results.some((r) => !r.passed)) process.exitCode = 1;
})().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
