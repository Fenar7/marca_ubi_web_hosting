const { chromium, expect } = require("@playwright/test");
const AxeBuilder = require("@axe-core/playwright").default;
const fs = require("node:fs");
const path = require("node:path");

const base = "http://127.0.0.1:3026/admin/works";
const screenshots = path.join(__dirname, "screenshots");
fs.mkdirSync(screenshots, { recursive: true });

async function verify() {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    viewport: { width: 1440, height: 1000 },
  });
  const page = await context.newPage();
  page.setDefaultTimeout(7000);
  const results = [];
  const runtimeErrors = [];
  page.on("pageerror", (error) => runtimeErrors.push(error.message));

  async function check(name, run) {
    try {
      await run();
      results.push({ name, passed: true });
    } catch (error) {
      results.push({ name, passed: false, detail: error.message });
      console.error(name, error.message);
    }
  }

  async function open(query = "") {
    await page.goto(base + query);
    await page
      .getByRole("heading", { name: "Client works", exact: true })
      .waitFor();
    await page.evaluate(() => document.fonts.ready);
  }

  const details = (code = "SAMPLE-01") =>
    page.getByRole("article").getByRole("button", { name: new RegExp(code) });
  const milestone = () =>
    page.getByRole("checkbox", { checked: false }).first();
  const search = () => page.getByRole("searchbox", { name: "Search projects" });
  const saveScreenshot = (name) =>
    page.screenshot({ path: path.join(screenshots, name), fullPage: true });

  try {
    await check(
      "Loaded sample projects and actual project details",
      async () => {
        await open("?sample=1");
        await expect(
          page.getByText("Paper Finch Studio", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Juniper Signal", { exact: true }),
        ).toBeVisible();
        await saveScreenshot("works-desktop.png");
        await details().click();
        await expect(details()).toHaveAttribute("aria-expanded", "true");
        await expect(
          page.getByRole("heading", { name: "Milestones", exact: true }),
        ).toBeVisible();
        await saveScreenshot("works-details.png");
      },
    );

    await check(
      "Sample and viewer projects expose no editing affordances",
      async () => {
        for (const query of ["?sample=1", "?role=viewer"]) {
          await open(query);
          await details().click();
          await expect(
            page.getByRole("button", { name: /Assign directors/i }),
          ).toHaveCount(0);
          await expect(
            page
              .getByRole("region", { name: "Project information" })
              .getByRole("combobox"),
          ).toHaveCount(0);
          await expect(page.getByRole("checkbox")).toHaveCount(0);
        }
      },
    );

    await check("Assigned director can edit their project only", async () => {
      await open("?role=sales_executive&user=sample-creative-01");
      await details().click();
      await expect(milestone()).toBeEnabled();
      await details("SAMPLE-02").click();
      await expect(page.getByRole("checkbox")).toHaveCount(0);
    });

    await check("Search and health filter work together", async () => {
      await open();
      await page
        .getByRole("combobox", { name: "Project health", exact: true })
        .selectOption("blocked");
      await expect(details("SAMPLE-02")).toBeVisible();
      await expect(details("SAMPLE-01")).toHaveCount(0);
      await search().fill("no matching mock project");
      await expect(details("SAMPLE-02")).toHaveCount(0);
      await expect(page.getByText(/No matching projects/i)).toBeVisible();
      await search().fill("Ceramic North");
      await expect(details("SAMPLE-02")).toBeVisible();
    });

    await check("Stage filter selects the matching project", async () => {
      await open();
      await page
        .getByRole("combobox", { name: "Delivery stage", exact: true })
        .selectOption("delivered");
      await expect(details("SAMPLE-06")).toBeVisible();
      await expect(details("SAMPLE-01")).toHaveCount(0);
    });

    await check(
      "Attention shortcut clears filters, opens the project and focuses it",
      async () => {
        await open();
        await search().fill("Paper Finch");
        await expect(details("SAMPLE-02")).toHaveCount(0);
        await page
          .getByRole("button", { name: /Ceramic North.*Blocked/i })
          .click();
        await expect(search()).toHaveValue("");
        await expect(details("SAMPLE-02")).toHaveAttribute(
          "aria-expanded",
          "true",
        );
        await expect(details("SAMPLE-02")).toBeFocused();
      },
    );

    await check(
      "Milestone becomes completed and issues one write",
      async () => {
        await open();
        await details().click();
        const pending = milestone();
        const title = await pending.evaluate((input) =>
          input.labels[0].textContent.trim(),
        );
        await pending.click();
        const completed = page.getByRole("checkbox", {
          name: title,
          exact: true,
        });
        await expect(completed).toBeChecked();
        await expect(completed).toBeEnabled();
        expect(await page.evaluate(() => window.fixtureWrites)).toEqual([
          expect.objectContaining({
            operation: "milestone",
            data: expect.objectContaining({ status: "completed" }),
          }),
        ]);
      },
    );

    await check(
      "A rejected milestone write restores the original state",
      async () => {
        await open("?reject=1");
        await details().click();
        const pending = milestone();
        const title = await pending.evaluate((input) =>
          input.labels[0].textContent.trim(),
        );
        await pending.click();
        await expect(page.getByRole("alert")).toContainText(
          "Fixture write rejected",
        );
        await expect(
          page.getByRole("checkbox", { name: title, exact: true }),
        ).not.toBeChecked();
      },
    );

    await check(
      "Director dialog supports Escape and returns focus",
      async () => {
        await open();
        await details().click();
        const assign = page
          .getByRole("button", { name: /Assign directors/i })
          .first();
        await assign.click();
        await expect(
          page.getByRole("dialog", { name: /Assign directors/i }),
        ).toBeVisible();
        await page.keyboard.press("Escape");
        await expect(page.getByRole("dialog")).toHaveCount(0);
        await expect(assign).toBeFocused();
      },
    );

    await check(
      "Director assignment submits a stub write and updates the project",
      async () => {
        await open();
        await details().click();
        await page
          .getByRole("button", { name: "Assign directors", exact: true })
          .click();
        const dialog = page.getByRole("dialog", { name: "Assign directors" });
        await dialog
          .getByLabel("Technical director")
          .selectOption("fixture-technical");
        await dialog.getByRole("button", { name: "Save directors" }).click();
        await expect(dialog).toHaveCount(0);
        await expect(
          page.getByText("Sample Technical Lead", { exact: true }),
        ).toBeVisible();
        expect(await page.evaluate(() => window.fixtureWrites)).toEqual([
          expect.objectContaining({
            operation: "directors",
            data: expect.objectContaining({ techLeadId: "fixture-technical" }),
          }),
        ]);
      },
    );

    await check(
      "Stage and health changes use the Works write handlers",
      async () => {
        await open();
        await details().click();
        const editor = page.getByRole("region", {
          name: "Project information",
        });
        const stage = editor.getByLabel("Delivery stage");
        const health = editor.getByLabel("Project health");
        await stage.selectOption("development");
        await expect(stage).toBeEnabled();
        await health.selectOption("blocked");
        await expect(health).toBeEnabled();
        expect(
          await page.evaluate(() =>
            window.fixtureWrites.map((write) => write.operation),
          ),
        ).toEqual(["stage", "health"]);
      },
    );

    await check("Empty workspace has a genuine empty state", async () => {
      await open("?empty=1");
      await expect(
        page.getByRole("heading", { name: "No client projects yet" }),
      ).toBeVisible();
      await expect(details()).toHaveCount(0);
      await saveScreenshot("works-empty.png");
    });

    for (const width of [320, 375, 768, 1024, 1440, 1920]) {
      await check(`No horizontal overflow at ${width}px`, async () => {
        await page.setViewportSize({ width, height: 900 });
        await open("?sample=1");
        expect(
          await page.evaluate(() => document.documentElement.scrollWidth),
        ).toBeLessThanOrEqual(width + 1);
        if (width === 375) await saveScreenshot("works-mobile.png");
      });
    }

    await check("Expanded project reflows on a 320px screen", async () => {
      await page.setViewportSize({ width: 320, height: 875 });
      await open("?sample=1");
      await details().click();
      await expect(
        page.getByRole("heading", { name: "Milestones", exact: true }),
      ).toBeVisible();
      expect(
        await page.evaluate(() => document.documentElement.scrollWidth),
      ).toBeLessThanOrEqual(321);
    });

    await check("No serious or critical axe violations", async () => {
      await page.setViewportSize({ width: 1440, height: 1000 });
      await open();
      await details().click();
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(
        violations
          .filter(({ impact }) => impact === "critical" || impact === "serious")
          .map(({ id, nodes }) => ({
            id,
            targets: nodes.flatMap(({ target }) => target),
          })),
      ).toEqual([]);
    });

    await check("No browser runtime errors", async () =>
      expect(runtimeErrors).toEqual([]),
    );
  } finally {
    await browser.close();
  }

  fs.writeFileSync(
    path.join(__dirname, "browser-results.json"),
    JSON.stringify(
      {
        environment:
          "Loopback harness, actual Client Works component and fixture records, stubbed mutations",
        results,
      },
      null,
      2,
    ) + "\n",
  );
  console.log(
    `${results.filter(({ passed }) => passed).length}/${results.length} Client Works browser checks passed.`,
  );
  if (results.some(({ passed }) => !passed)) process.exitCode = 1;
}

verify().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
