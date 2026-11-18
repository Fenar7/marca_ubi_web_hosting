/** Repeatable fixture-only browser checks; never points at an authenticated production route. */
const { chromium } = require('@playwright/test');
const AxeBuilder = require('@axe-core/playwright').default;
const fs = require('node:fs');
const path = require('node:path');
const directory = __dirname;
const screenshots = path.join(directory, 'screenshots');
fs.mkdirSync(screenshots, { recursive: true });
const results = [];
function check(name, passed, detail = '') { results.push({ name, passed, detail }); if (!passed) console.error(name, detail); }
(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({ viewport: { width: 1440, height: 1000 }, reducedMotion: 'reduce' });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await page.goto('http://127.0.0.1:3017');
  await page.getByRole('heading', { name: 'Overview', exact: true }).waitFor();
  await page.evaluate(() => document.fonts.ready);
  await page.screenshot({ path: path.join(screenshots, 'desktop-ready.png'), fullPage: true });
  check('Six queue preview records', await page.getByRole('link', { name: /^Open (Alserkal|SLS|Emirates|Symphony|A long|Brand strategy)/ }).count() === 6);
  await page.getByRole('button', { name: /^Today 6$/ }).click();
  await page.waitForFunction(() => document.querySelector('button[aria-pressed="true"]')?.textContent?.startsWith('Today'));
  check('Queue URL and selection update', page.url().includes('queue=today') && await page.getByRole('button', { name: /^Today 6$/ }).getAttribute('aria-pressed') === 'true');
  await page.getByRole('combobox', { name: 'Outcomes period' }).selectOption('7d');
  check('Period retains queue scope', page.url().includes('timeframe=7d') && page.url().includes('queue=today'));
  await page.getByText('Metric definitions and reporting scope', { exact: true }).click();
  check('Reporting definitions expand', await page.getByText(/This describes their current status/).isVisible());
  const downloadPromise = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Export summary', exact: true }).click();
  const download = await downloadPromise;
  const csv = fs.readFileSync(await download.path(), 'utf8');
  check('Export declares snapshot and period', csv.includes('Current open and potential pipeline') && csv.includes('Outcomes window start') && !csv.includes('Alserkal'));
  await page.getByRole('button', { name: 'Collapse navigation', exact: true }).click();
  check('Sidebar collapse responds', await page.getByRole('button', { name: 'Expand navigation', exact: true }).isVisible());
  await page.getByRole('button', { name: 'Expand navigation', exact: true }).click();
  await page.keyboard.press('Control+k');
  await page.getByRole('dialog', { name: 'Search or navigate' }).waitFor();
  check('Launcher focuses query', await page.locator('#workspace-launcher-query').evaluate(el => document.activeElement === el));
  await page.locator('#workspace-launcher-query').fill('Acme');
  check('Launcher real workspace search destinations', await page.locator('dialog a[href*="search=Acme"]').count() === 2);
  await page.keyboard.press('Escape');
  check('Launcher Escape closes', !(await page.getByRole('dialog', { name: 'Search or navigate' }).isVisible()));
  const axe = await new AxeBuilder({ page }).analyze();
  check('Desktop axe WCAG2AA', axe.violations.filter(v => v.tags.some(t => ['wcag2a','wcag2aa','wcag21aa','wcag22aa'].includes(t))).length === 0, JSON.stringify(axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => n.target) }))));
  for (const width of [320,375,768,1024,1440,1920]) {
    await page.setViewportSize({ width, height: 900 });
    check(`No horizontal overflow ${width}`, await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    if (width === 375) {
      await page.evaluate(() => window.scrollTo(0,0));
      await page.screenshot({ path: path.join(screenshots,'mobile-ready.png'), fullPage:true });
      await page.getByRole('button', { name: 'Menu', exact:true }).click();
      await page.getByRole('dialog', { name:/navigation/i }).waitFor({state:'visible'});
      check('Mobile drawer opens', await page.getByRole('dialog', { name:/navigation/i }).isVisible());
      await page.keyboard.press('Escape');
      check('Mobile drawer Escape focus restoration', await page.getByRole('button', { name:'Menu',exact:true }).evaluate(el => document.activeElement === el));
    }
  }
  await page.setViewportSize({ width:1440,height:1000 });
  for(const state of ['empty','unavailable']) {
    await page.goto(`http://127.0.0.1:3017/?state=${state}`);
    await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();
    check(`${state} state explicit`, state==='empty'?await page.getByRole('heading',{name:'No overdue follow-ups'}).isVisible():await page.getByRole('heading',{name:'Records couldn’t be loaded'}).isVisible());
    await page.screenshot({path:path.join(screenshots,`desktop-${state}.png`),fullPage:true});
  }
  for(const role of ['viewer','sales_executive']) {
    await page.goto(`http://127.0.0.1:3017/?role=${role}`);
    await page.getByRole('heading',{name:'Overview',exact:true}).waitFor();
    check(`${role} controls restricted`, await page.getByRole('button',{name:'Export summary'}).count()===0);
    if(role==='viewer')check('Viewer opportunities replace task queue',await page.getByRole('heading',{name:'Active opportunities',exact:true}).isVisible()&&await page.getByRole('link',{name:'Follow-ups',exact:true}).count()===0);
    else check('Executive fixture has no monetary output', !(await page.locator('body').innerText()).includes('₹'));
    await page.screenshot({path:path.join(screenshots,`desktop-${role}.png`),fullPage:true});
  }
  check('No browser runtime errors', errors.length===0,JSON.stringify(errors));
  await browser.close();
  fs.writeFileSync(path.join(directory,'visual-check-results.json'),JSON.stringify({environment:'Isolated actual-component fixtures; no live authentication/database',results},null,2));
  console.log(JSON.stringify(results,null,2));
  if(results.some(result=>!result.passed)) process.exitCode=1;
})().catch(error=>{console.error(error);process.exitCode=1});
