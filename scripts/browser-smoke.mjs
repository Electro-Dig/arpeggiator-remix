import assert from 'node:assert/strict';
import { mkdir } from 'node:fs/promises';
import { pathToFileURL } from 'node:url';

const target = process.argv[2] ?? 'http://localhost:8000/';
const outputDirectory = process.argv[3] ?? new URL('../.artifacts/', import.meta.url).pathname;
const playwrightEntry = process.env.PLAYWRIGHT_ENTRY;
const playwright = playwrightEntry
  ? await import(pathToFileURL(playwrightEntry))
  : await import('playwright');

await mkdir(outputDirectory, { recursive: true });

const browser = await playwright.chromium.launch({
  headless: true,
  executablePath: process.env.CHROME_EXECUTABLE || undefined,
  args: [
    '--use-fake-device-for-media-stream',
    '--use-fake-ui-for-media-stream',
    '--autoplay-policy=no-user-gesture-required',
  ],
});

const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  permissions: ['camera', 'microphone'],
});
const page = await context.newPage();
const consoleErrors = [];
const pageErrors = [];
const failedRequests = [];
const httpErrors = [];
const drumResponses = [];

page.on('console', (message) => {
  if (message.type() === 'error') {
    consoleErrors.push({ text: message.text(), location: message.location() });
  }
});
page.on('pageerror', (error) => pageErrors.push(error.message));
page.on('requestfailed', (request) => failedRequests.push({
  url: request.url(),
  error: request.failure()?.errorText,
}));
page.on('response', (response) => {
  if (response.status() >= 400) {
    httpErrors.push({ url: response.url(), status: response.status() });
  }
  if (response.url().includes('/assets/drums/')) {
    drumResponses.push({ url: response.url(), status: response.status() });
  }
});

try {
  await page.goto(target, { waitUntil: 'load', timeout: 45_000 });
  await page.waitForFunction(() => window.game && window.drumManager, null, { timeout: 45_000 });
  await page.waitForFunction(() => (
    window.drumManager.getDrumKitStatuses().every(({ status }) => status !== 'loading')
  ), null, { timeout: 45_000 });

  const initial = await page.evaluate(() => {
    const rect = (selector) => {
      const element = document.querySelector(selector);
      if (!element) return null;
      const bounds = element.getBoundingClientRect();
      return {
        left: bounds.left,
        top: bounds.top,
        right: bounds.right,
        bottom: bounds.bottom,
        width: bounds.width,
        height: bounds.height,
      };
    };
    const overlaps = (a, b) => Boolean(a && b
      && a.left < b.right && a.right > b.left && a.top < b.bottom && a.bottom > b.top);
    const rhythm = rect('#rhythm-space');
    const social = rect('.social-links');
    const scenes = rect('.performance-controls');
    const hud = rect('.hud--top');
    return {
      kit: window.drumManager.getCurrentDrumKit(),
      statuses: window.drumManager.getDrumKitStatuses(),
      kitLabel: document.querySelector('#drum-kit-label')?.textContent,
      axes: [...document.querySelectorAll('.rhythm-space__axis')].map((node) => node.textContent),
      grid: rect('.rhythm-space__grid'),
      rhythm,
      overlap: {
        social: overlaps(rhythm, social),
        scenes: overlaps(rhythm, scenes),
        hud: overlaps(rhythm, hud),
      },
    };
  });

  assert.equal(initial.kit?.id, 'acoustic');
  assert.ok(initial.statuses.every(({ status }) => status === 'ready'));
  assert.equal(initial.kitLabel, 'KIT / ACOUSTIC');
  assert.deepEqual(initial.axes, ['STRAIGHT → BROKEN', 'MINIMAL → ENERGY']);
  assert.equal(initial.grid?.width, 160);
  assert.equal(initial.grid?.height, 160);
  assert.deepEqual(initial.overlap, { social: false, scenes: false, hud: false });

  await page.click('#control-deck-toggle');
  await page.waitForSelector('#drum-kit-select', { state: 'visible' });
  await page.selectOption('#drum-kit-select', 'electronic');
  await page.waitForFunction(() => document.querySelector('#drum-kit-label')?.textContent === 'KIT / ELECTRONIC');
  await page.selectOption('#drum-kit-select', 'synthwave');
  await page.waitForFunction(() => document.querySelector('#drum-kit-label')?.textContent === 'KIT / SYNTHWAVE');
  await page.click('#control-deck-toggle');

  await page.screenshot({ path: `${outputDirectory}/rhythm-kits-desktop.png`, fullPage: true });
  await page.setViewportSize({ width: 390, height: 844 });
  await page.screenshot({ path: `${outputDirectory}/rhythm-kits-mobile.png`, fullPage: true });

  assert.equal(pageErrors.length, 0, `page errors: ${pageErrors.join(' | ')}`);
  assert.equal(consoleErrors.length, 0, `console errors: ${JSON.stringify(consoleErrors)}; HTTP: ${JSON.stringify(httpErrors)}`);
  assert.equal(failedRequests.length, 0, `failed requests: ${JSON.stringify(failedRequests)}`);
  assert.equal(new Set(drumResponses.map(({ url }) => url)).size, 15);
  assert.ok(drumResponses.every(({ status }) => status === 200));

  console.log(JSON.stringify({
    target,
    initial,
    drumResponses: drumResponses.length,
    screenshots: [
      `${outputDirectory}/rhythm-kits-desktop.png`,
      `${outputDirectory}/rhythm-kits-mobile.png`,
    ],
  }, null, 2));
} finally {
  await browser.close();
}
