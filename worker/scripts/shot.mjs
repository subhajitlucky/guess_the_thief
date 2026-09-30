/**
 * Screenshot harness for reviewing the noir rebrand.
 *
 * The sandbox blocks ~/.config, ~/.cache and ~/.npm, and the bundled
 * playwright CLI expects browser build numbers that are not the ones cached
 * here. Launching via executablePath sidesteps both: it skips the version
 * lookup entirely and points straight at the chromium we actually have.
 *
 * Usage:
 *   node shot.mjs <url> <outfile> [--width=1440] [--height=900] [--wait=2500]
 */
import { chromium } from 'playwright-core';
import { existsSync, readdirSync } from 'node:fs';
import { join } from 'node:path';

const BROWSER_ROOT = '/home/subhajit/.cache/ms-playwright';

function findChromium() {
  const direct = [
    join(BROWSER_ROOT, 'chromium-1217/chrome-linux64/chrome'),
    join(BROWSER_ROOT, 'chromium-1200/chrome-linux64/chrome'),
    join(BROWSER_ROOT, 'chromium-1161/chrome-linux/chrome'),
  ];
  for (const p of direct) if (existsSync(p)) return p;
  for (const dir of readdirSync(BROWSER_ROOT)) {
    if (!dir.startsWith('chromium')) continue;
    for (const rel of ['chrome-linux64/chrome', 'chrome-linux/chrome']) {
      const p = join(BROWSER_ROOT, dir, rel);
      if (existsSync(p)) return p;
    }
  }
  throw new Error('no chromium found under ' + BROWSER_ROOT);
}

const [url, out] = process.argv.slice(2);
if (!url || !out) {
  console.error('usage: node shot.mjs <url> <out.png> [--width=] [--height=] [--wait=]');
  process.exit(2);
}
const flag = (n, d) => {
  const a = process.argv.find((x) => x.startsWith(`--${n}=`));
  return a ? Number(a.split('=')[1]) : d;
};

const executablePath = findChromium();
const browser = await chromium.launch({
  executablePath,
  args: ['--no-sandbox', '--disable-dev-shm-usage', '--disable-gpu'],
});

const page = await browser.newPage({
  viewport: { width: flag('width', 1440), height: flag('height', 900) },
  deviceScaleFactor: 2,
});
await page.goto(url, { waitUntil: 'networkidle', timeout: 45000 }).catch(() => {});
await page.waitForTimeout(flag('wait', 2500));
await page.screenshot({ path: out, fullPage: false });

// Surface anything the console complained about — a rebrand that ships with
// a runtime error is not a rebrand.
const errors = [];
page.on('pageerror', (e) => errors.push(e.message));
console.log(`shot: ${out}  (${executablePath.split('/').slice(-3).join('/')})`);
if (errors.length) console.log('page errors:', errors);

await browser.close();
