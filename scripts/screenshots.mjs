// Takes screenshots of the mock-mode web export (dist/) with Playwright + Chromium.
// Usage: EXPO_PUBLIC_MOCK=1 npx expo export --platform web && node scripts/screenshots.mjs
import { createServer } from 'node:http';
import { readFile, stat, mkdir } from 'node:fs/promises';
import { extname, join } from 'node:path';
import { createHash, X509Certificate } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { chromium } from 'playwright-core';

const DIST = new URL('../dist/', import.meta.url).pathname;
const OUT = new URL('../docs/screenshots/', import.meta.url).pathname;
const PORT = 4789;
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.ttf': 'font/ttf', '.png': 'image/png', '.ico': 'image/x-icon', '.json': 'application/json' };

const server = createServer(async (req, res) => {
  const path = decodeURIComponent(new URL(req.url, 'http://x').pathname);
  let file = join(DIST, path);
  try {
    if (!(await stat(file)).isFile()) throw new Error();
  } catch {
    file = join(DIST, 'index.html'); // SPA fallback
  }
  res.writeHead(200, { 'Content-Type': TYPES[extname(file)] ?? 'application/octet-stream' });
  res.end(await readFile(file));
});
await new Promise((r) => server.listen(PORT, r));
await mkdir(OUT, { recursive: true });

const proxy = process.env.HTTPS_PROXY ? { server: process.env.HTTPS_PROXY, bypass: 'localhost,127.0.0.1' } : undefined;
// In the sandboxed cloud session, outbound HTTPS is re-signed by a proxy CA that this
// Chromium build doesn't read from the system store; trust exactly that CA (by SPKI pin).
const args = [];
const proxyCa = '/root/.ccr/agent-proxy-ca.crt';
if (proxy && existsSync(proxyCa)) {
  const spki = new X509Certificate(readFileSync(proxyCa)).publicKey.export({ type: 'spki', format: 'der' });
  args.push(`--ignore-certificate-errors-spki-list=${createHash('sha256').update(spki).digest('base64')}`);
}
const browser = await chromium.launch({ executablePath: process.env.CHROMIUM_PATH ?? '/opt/pw-browsers/chromium', proxy, args });
const base = `http://localhost:${PORT}`;

const settings = (mode, extra = {}) => ({
  state: {
    onboarded: true,
    location: { kind: 'gps', lat: 23.2332, lng: 77.4243, label: 'MP Nagar, Bhopal' },
    radiusKm: 10,
    appearance: { mode, accent: 'blue', textSize: 'default', reduceMotion: 'on', haptics: true },
    ...extra,
  },
  version: 1,
});

async function newPage(mode, { onboarded = true, dark = false, extra = {} } = {}) {
  const context = await browser.newContext({
    viewport: { width: 412, height: 892 },
    deviceScaleFactor: 2,
    colorScheme: dark ? 'dark' : 'light',
    hasTouch: true,
    isMobile: true,
  });
  const value = JSON.stringify(onboarded ? settings(mode, extra) : { state: { appearance: { mode } }, version: 1 });
  await context.addInitScript((v) => {
    if (!sessionStorage.getItem('seeded')) {
      localStorage.setItem('wowcity.settings', v);
      localStorage.setItem('wowcity.recentSearches', JSON.stringify({ state: { items: ['linen shirt', 'kurta', 'levis 511'] }, version: 0 }));
      sessionStorage.setItem('seeded', '1');
    }
  }, value);
  const page = await context.newPage();
  page.on('pageerror', (e) => console.error('pageerror', e.message));
  return { page, context };
}

async function waitForImages(page) {
  await page.waitForTimeout(700);
  await page
    .waitForFunction(() => [...document.images].filter((i) => i.getBoundingClientRect().top < innerHeight).every((i) => i.complete), null, { timeout: 15000 })
    .catch(() => {});
  await page.waitForTimeout(500);
}

async function shot(page, name) {
  await waitForImages(page);
  await page.screenshot({ path: join(OUT, `${name}.png`) });
  console.log('saved', name);
}

const only = process.argv[2];
const modes = only ? [only] : ['light', 'dark', 'eyeComfort'];

for (const mode of modes) {
  // Welcome (fresh install)
  {
    const { page, context } = await newPage(mode, { onboarded: false });
    await page.goto(`${base}/welcome`);
    await page.getByText('Where are you shopping?').waitFor();
    await shot(page, `${mode}-01-welcome`);
    await context.close();
  }
  const { page, context } = await newPage(mode);
  await page.goto(`${base}/home`);
  await page.getByText('Newest nearby').waitFor({ timeout: 20000 });
  await page.waitForTimeout(1200);
  await shot(page, `${mode}-02-home`);

  await page.mouse.wheel(0, 900);
  await page.waitForTimeout(800);
  await shot(page, `${mode}-03-home-feed`);

  await page.goto(`${base}/product/st_zari/p_zt_anarkali`);
  await page.getByText('Ivory chikankari anarkali').first().waitFor({ timeout: 20000 });
  await shot(page, `${mode}-04-product`);
  await page.mouse.wheel(0, 700);
  await page.waitForTimeout(600);
  await shot(page, `${mode}-05-product-details`);

  await page.goto(`${base}/product/st_lakeview/p_lv_trench`);
  await page.getByText('Sold out at this shop').first().waitFor({ timeout: 20000 });
  await page.mouse.wheel(0, 380);
  await shot(page, `${mode}-06-product-sold-out`);

  await page.goto(`${base}/search`);
  await page.getByText('Recent searches').waitFor({ timeout: 20000 });
  await shot(page, `${mode}-07-search`);
  await page.getByTestId('search-input').fill('jeans');
  await page.getByText(/items? for “jeans”/).waitFor({ timeout: 20000 });
  await shot(page, `${mode}-08-search-results`);
  await page.getByText('Filters', { exact: true }).click();
  await page.getByTestId('filter-sheet').waitFor();
  await page.waitForTimeout(600);
  await shot(page, `${mode}-09-filters`);

  await page.goto(`${base}/shop/st_kapdaghar`);
  await page.getByText(/items? in stock/).first().waitFor({ timeout: 20000 });
  await shot(page, `${mode}-10-shop`);

  await page.goto(`${base}/shops`);
  await page.getByText(/shops? within/).waitFor({ timeout: 20000 });
  await shot(page, `${mode}-11-shops`);

  await page.goto(`${base}/saved`);
  await page.getByText('Keep the things you love').waitFor({ timeout: 20000 });
  await shot(page, `${mode}-12-saved-signed-out`);

  await page.goto(`${base}/account`);
  await page.getByText('Appearance').first().waitFor();
  await shot(page, `${mode}-13-account`);

  await page.goto(`${base}/appearance`);
  await page.getByText('Accent colour').waitFor();
  await shot(page, `${mode}-14-appearance`);

  // Save while signed out → sign in → the save completes → Saved tab.
  await page.goto(`${base}/product/st_kapdaghar/p_kg_crewtee`);
  await page.getByTestId('save-button').waitFor({ timeout: 20000 });
  await page.getByTestId('save-button').click();
  await page.getByTestId('identifier-input').waitFor();
  await page.getByTestId('identifier-input').fill('9876543210');
  await shot(page, `${mode}-15-sign-in`);
  await page.getByTestId('send-code').click();
  await page.getByText('Enter the code').waitFor();
  await page.getByLabel('6-digit code').fill('123456');
  await page.getByText('Saved', { exact: true }).first().waitFor({ timeout: 20000 });
  await page.waitForTimeout(800);
  await shot(page, `${mode}-16-saved-after-sign-in`);
  await page.goto(`${base}/saved`);
  await page.waitForTimeout(300);
  await context.close();
}

await browser.close();
server.close();
