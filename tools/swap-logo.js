/**
 * Replaces the inline SVG brand mark (nav + footer) with /images/logo.png.
 * Idempotent: files that already use the <img> logo are skipped.
 */
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');

const TARGETS = [
  'index.html',
  ...fs.readdirSync(path.join(ROOT, 'views')).filter(f => f.endsWith('.html')).map(f => path.join('views', f)),
  path.join('tools', 'unify-chrome.js'),
];

function buildImg(indent, size, radius, extraClasses) {
  const classes = [
    `w-${size}`,
    `h-${size}`,
    radius,
    'object-cover',
    ...extraClasses,
  ].join(' ');
  return `${indent}<img alt="GlowSlides logo" class="${classes}" src="/images/logo.png" width="${size * 4}" height="${size * 4}">`;
}

// Nav mark: w-8 h-8 box > inner div > svg
const NAV_RE = /^([ \t]*)<div class="w-8 h-8 rounded-lg bg-gradient-to-tr[\s\S]*?<\/svg>\s*<\/div>\s*<\/div>/m;
// Footer mark: w-7 h-7 box > inner div > svg
const FOOTER_RE = /^([ \t]*)<div class="w-7 h-7 rounded-lg bg-gradient-to-tr[\s\S]*?<\/svg>\s*<\/div>\s*<\/div>/m;

let changed = 0;

for (const rel of TARGETS) {
  const file = path.join(ROOT, rel);
  const original = fs.readFileSync(file, 'utf8');
  let html = original;

  const navMatch = html.match(NAV_RE);
  if (navMatch) {
    html = html.replace(
      NAV_RE,
      buildImg(navMatch[1], 8, 'rounded-lg', [
        'transition-transform duration-300 group-hover:scale-110',
        'shadow-[0_0_15px_rgba(59,130,246,0.5)]',
      ])
    );
  }

  const footerMatch = html.match(FOOTER_RE);
  if (footerMatch) {
    html = html.replace(FOOTER_RE, buildImg(footerMatch[1], 7, 'rounded-lg', []));
  }

  if (html !== original) {
    fs.writeFileSync(file, html);
    changed++;
    console.log(`updated ${rel} (nav: ${!!navMatch}, footer: ${!!footerMatch})`);
  } else {
    console.log(`SKIPPED ${rel} (no inline mark found)`);
  }
}

console.log(`\n${changed}/${TARGETS.length} files updated.`);
