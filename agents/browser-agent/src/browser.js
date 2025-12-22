const { chromium } = require('playwright');

async function renderPage(url) {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();
  const page = await context.newPage();

  try {
    await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 45000 });

    const html = await page.evaluate(() => document.documentElement.outerHTML);
    const title = await page.title();
    const finalUrl = page.url();

    return {
      html,
      title,
      finalUrl
    };
  } finally {
    await browser.close();
  }
}

module.exports = { renderPage };