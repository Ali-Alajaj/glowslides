/**
 * One-off maintenance script: reference the brand favicon in every page <head>.
 * Without this, browsers request /favicon.ico and log a 404 on every page.
 * Idempotent - safe to re-run after new pages are added.
 *
 * Run with: node tools/add-favicon.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const TAGS = '  <link rel="icon" type="image/svg+xml" href="/favicon.svg">\n';

const pages = [
  'index.html',
  'views/dashboard.html',
  'views/templates.html',
  'views/engine.html',
  'views/integrations.html',
  'views/enterprise.html',
  'views/pricing.html',
  'views/security.html',
  'views/status.html',
  'views/privacy.html',
  'views/terms.html',
  'views/login.html',
  'views/settings.html',
  'views/editor.html'
];

const report = [];

for (const rel of pages) {
  const abs = path.join(root, rel);
  let html = fs.readFileSync(abs, 'utf8');

  // Strip any previous injection so re-running cannot stack duplicates.
  const cleaned = html.replace(/\s*<link rel="icon" type="image\/svg\+xml" href="\/favicon\.svg">/g, '');

  if (!/<\/head>/i.test(cleaned)) {
    report.push(`MISS </head>: ${rel}`);
    continue;
  }

  const next = cleaned.replace(/<\/head>/i, `${TAGS}</head>`);
  if (next !== html) {
    fs.writeFileSync(abs, next, 'utf8');
    report.push(`OK   ${rel}`);
  } else {
    report.push(`NOCH ${rel}`);
  }
}

console.log(report.join('\n'));
