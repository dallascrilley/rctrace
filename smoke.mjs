import { loadPlaywright, launchChrome } from './tools/find-playwright.mjs';
import { startServer } from './tools/static-server.mjs';

const playwright = loadPlaywright();
if (!playwright) throw new Error('Playwright is required. Set NODE_PATH to the existing runtime package directory.');
const server = await startServer('public', 0);
const browser = await launchChrome(playwright);
try {
  const page = await browser.newPage({ viewport: { width: 1280, height: 900 } });
  const errors = [];
  const externalRequests = [];
  page.on('pageerror', (error) => errors.push(error.message));
  page.on('console', (message) => { if (message.type() === 'error') errors.push(message.text()); });
  page.on('request', (request) => {
    if (new URL(request.url()).origin !== new URL(server.url).origin) externalRequests.push(request.url());
  });
  await page.goto(server.url, { waitUntil: 'load' });
  await page.getByText('Paste Bazel --announce_rc output or load the sample.').waitFor();
  await page.screenshot({ path: 'docs/empty-preview.png', fullPage: true });
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByText('--remote_cache=grpcs://cache.example.net').waitFor();
  await page.getByText('--compilation_mode=opt').waitFor();
  const groups = await page.locator('.result-group h3').allTextContents();
  if (JSON.stringify(groups) !== JSON.stringify(['Action cache', 'Action cache behavior', 'Repository downloads', 'Action configuration'])) {
    throw new Error(`Unexpected sample groups: ${groups.join(', ')}`);
  }
  if (!(await page.getByText('/private/tmp/rctrace-bazel-fixture/.bazelrc', { exact: false }).count())) throw new Error('The reported source file was not shown.');
  if (!(await page.getByText(/not proof of the final effective value/).count())) throw new Error('The precedence boundary is not visible.');

  await page.getByLabel('Paste Bazel --announce_rc output').fill(
    "INFO: Reading rc options for 'build' from /local/project/.bazelrc:\n  'build' options: --noremote_accept_cached --disk_cache=/tmp/action-cache\nINFO: Reading rc options for 'build' from /local/project/.bazelrc:\n  'build' options: --unclassified_future_option=yes",
  );
  await page.getByText('--noremote_accept_cached').waitFor();
  if (await page.locator('.option-row').count() !== 2) throw new Error('Pasted input should show only the two supported options.');
  await page.getByRole('button', { name: 'Clear' }).click();
  await page.getByText('Paste Bazel --announce_rc output or load the sample.').waitFor();

  await page.setViewportSize({ width: 390, height: 844 });
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth);
  if (overflow) throw new Error('The narrow layout overflows horizontally.');
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByText('--remote_cache=grpcs://cache.example.net').waitFor();
  await page.screenshot({ path: 'docs/mobile-preview.png', fullPage: true });
  if (externalRequests.length) throw new Error(`Unexpected external requests: ${externalRequests.join(', ')}`);
  if (errors.length) throw new Error(`Browser errors: ${errors.join('; ')}`);
  await page.setViewportSize({ width: 1280, height: 900 });
  await page.getByRole('button', { name: 'Load sample' }).click();
  await page.getByText('--remote_cache=grpcs://cache.example.net').waitFor();
  await page.screenshot({ path: 'docs/demo-final.png', fullPage: true });
  console.log('browser smoke: sample, pasted output, unsupported flag filtering, clear state, narrow layout, and no external requests passed');
} finally {
  await browser.close();
  await server.close();
}
