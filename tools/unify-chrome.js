/**
 * One-off maintenance script: unify header + footer across all HTML pages.
 * Run with: node tools/unify-chrome.js
 */
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');

function header() {
  // Header markup is deliberately byte-identical on every page.
  const item = (label, href) =>
    `<a class="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 transition-colors" href="${href}">${label}</a>`;

  // Mobile panel links: generous 44px+ tap targets, one per row.
  const mItem = (label, href) =>
    `<a class="block w-full py-3.5 px-1 text-[15px] font-medium text-slate-200 hover:text-white border-b border-white/[0.06]" href="${href}">${label}</a>`;

  return `<!-- BEGIN: CanonicalTopNavigation -->
<header class="relative z-50 w-full border-b border-white/[0.08] backdrop-blur-md bg-gray-950/70" data-purpose="site-navigation">
  <div class="max-w-[1440px] mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-3">
    <a aria-label="GlowSlides Home" class="flex items-center gap-3 group shrink-0 min-h-[44px]" href="/">
      <img alt="GlowSlides logo" class="w-8 h-8 rounded-lg object-cover transition-transform duration-300 group-hover:scale-110 shadow-[0_0_15px_rgba(59,130,246,0.5)]" src="/images/logo.png" width="32" height="32" onerror="this.remove()">
      <span class="text-lg sm:text-xl font-bold tracking-tight text-white flex items-center gap-1">
        GlowSlides
        <span class="w-1.5 h-1.5 rounded-full bg-blue-500 inline-block animate-pulse"></span>
      </span>
    </a>

    <nav class="hidden md:flex items-center space-x-1" data-purpose="main-menu">
      ${item('Dashboard', '/dashboard')}
      ${item('Templates', '/templates')}
      ${item('AI Engine', '/engine')}
      ${item('Integrations', '/integrations')}
      ${item('Enterprise', '/enterprise')}
      ${item('Pricing', '/pricing')}
    </nav>

    <div class="flex items-center gap-2 sm:gap-3 shrink-0" data-purpose="header-actions">
      <a class="hidden md:inline-flex items-center text-sm font-medium text-slate-300 hover:text-white px-4 min-h-[44px] rounded-lg bg-white/[0.03] hover:bg-white/[0.08] border border-white/[0.08] transition-all" href="/login">Sign in</a>
      <a class="group inline-flex items-center gap-2 text-sm font-semibold text-white px-3 sm:px-4 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-500 border border-blue-400/40 shadow-[0_0_20px_rgba(37,99,235,0.4)] transition-all" href="/dashboard">
        <span class="hidden sm:inline">Open Studio</span>
        <span class="sm:hidden">Studio</span>
        <svg class="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path d="M14 5l7 7m0 0l-7 7m7-7H3" stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5"></path>
        </svg>
      </a>

      <!-- Mobile menu trigger (shown only where the desktop nav is hidden) -->
      <button id="mobileNavToggle" type="button" aria-expanded="false" aria-controls="mobileNavPanel" aria-label="Open navigation menu"
              class="md:hidden inline-flex items-center justify-center w-11 h-11 shrink-0 rounded-lg border border-white/[0.1] bg-white/[0.04] hover:bg-white/[0.08] text-slate-200 transition-colors">
        <svg data-icon="open" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7h16M4 12h16M4 17h16"></path>
        </svg>
        <svg data-icon="close" class="w-5 h-5 hidden" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 6l12 12M18 6L6 18"></path>
        </svg>
      </button>
    </div>
  </div>

  <!-- Mobile navigation panel -->
  <div id="mobileNavPanel" class="hidden md:hidden border-t border-white/[0.08] bg-gray-950/95 backdrop-blur-xl" data-purpose="mobile-menu">
    <nav class="max-w-[1440px] mx-auto px-4 py-2 flex flex-col" aria-label="Mobile navigation">
      ${mItem('Dashboard', '/dashboard')}
      ${mItem('Templates', '/templates')}
      ${mItem('AI Engine', '/engine')}
      ${mItem('Integrations', '/integrations')}
      ${mItem('Enterprise', '/enterprise')}
      ${mItem('Pricing', '/pricing')}
      ${mItem('System Status', '/status')}
      ${mItem('Security', '/security')}
      ${mItem('Settings', '/settings')}
      <a class="mt-3 mb-4 inline-flex items-center justify-center gap-2 py-3.5 rounded-xl bg-white/[0.05] border border-white/[0.1] text-[15px] font-medium text-slate-200" href="/login">Sign in</a>
    </nav>
  </div>

  <script src="/js/nav.js" defer></script>
</header>
<!-- END: CanonicalTopNavigation -->`;
}

const FOOTER = `<!-- BEGIN: CanonicalSiteFooter -->
<footer class="relative z-10 border-t border-white/[0.08] bg-black/60 py-10" data-purpose="site-footer">
  <div class="max-w-[1440px] mx-auto px-6 flex flex-col lg:flex-row items-center justify-between gap-8">
    <div class="flex flex-col sm:flex-row items-center gap-4">
      <a class="flex items-center gap-2.5 min-h-[44px]" href="/">
        <img alt="GlowSlides logo" class="w-7 h-7 rounded-lg object-cover" src="/images/logo.png" width="28" height="28" onerror="this.remove()">
        <span class="text-sm font-bold text-white">GlowSlides</span>
      </a>
      <span class="text-xs text-slate-400">GlowSlides Inc. © 2026. All rights reserved.</span>
    </div>

    <nav class="flex flex-wrap items-center justify-center gap-x-6 gap-y-3 text-xs text-slate-400" data-purpose="footer-menu">
      <a class="hover:text-white transition-colors" href="/dashboard">Dashboard</a>
      <a class="hover:text-white transition-colors" href="/templates">Templates</a>
      <a class="hover:text-white transition-colors" href="/engine">AI Engine</a>
      <a class="hover:text-white transition-colors" href="/integrations">Integrations</a>
      <a class="hover:text-white transition-colors" href="/enterprise">Enterprise</a>
      <a class="hover:text-white transition-colors" href="/pricing">Pricing</a>
      <a class="hover:text-white transition-colors" href="/security">Security</a>
      <a class="hover:text-white transition-colors" href="/status">System Status</a>
      <a class="hover:text-white transition-colors" href="/privacy">Privacy Policy</a>
      <a class="hover:text-white transition-colors" href="/terms">Terms of Service</a>
      <a class="hover:text-white transition-colors" href="/settings">Settings</a>
    </nav>

    <div class="flex items-center gap-3 text-[11px] font-mono text-slate-500">
      <span class="px-2 py-1 rounded bg-white/[0.04] border border-white/[0.08] text-slate-300">SOC 2 TYPE II</span>
      <a href="/status" class="px-2.5 min-h-[44px] rounded bg-emerald-500/10 border border-emerald-400/20 text-emerald-400 flex items-center gap-1.5 hover:bg-emerald-500/20 transition-colors">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        ALL SYSTEMS OPERATIONAL
      </a>
    </div>
  </div>
</footer>
<!-- END: CanonicalSiteFooter -->`;

// The Editor is a workspace, not a marketing page. It gets:
//   1. the exact same canonical navbar (identical markup to every other page)
//   2. the exact same canonical footer
//   3. its studio controls preserved in a dedicated secondary ribbon below the navbar
const EDITOR_RIBBON = `<!-- BEGIN: StudioWorkspaceRibbon -->
<div class="relative z-40 w-full border-b border-white/[0.08] bg-black/40 backdrop-blur-md">
  <div class="max-w-[1536px] mx-auto px-4 sm:px-6 py-2 min-h-[3.5rem] flex flex-wrap items-center justify-between gap-3 gap-y-2">
    <div class="flex items-center gap-3 min-w-0">
      <span class="hidden sm:flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-blue-400 shrink-0">
        <span class="w-1.5 h-1.5 rounded-full bg-blue-400 animate-pulse"></span> Studio
      </span>
      <input id="deckTitleInput" type="text" value="Loading Presentation..." aria-label="Presentation title" class="bg-transparent border-0 border-b border-transparent hover:border-white/20 focus:border-blue-500 focus:ring-0 text-white font-bold text-sm tracking-tight px-0 py-2 min-h-[44px] max-w-[200px] sm:max-w-md truncate" onblur="handleTitleChange()">
      <span id="saveStatusBadge" class="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0">Saved</span>
      <div class="hidden xl:flex items-center gap-2 text-[10px] font-mono text-slate-400 truncate">
        <span id="deckTopicText">Autonomous AI Synthesis</span>
        <span>•</span>
        <select id="deckThemeSelector" onchange="changeDeckTheme(this.value)" class="bg-white/[0.04] border border-white/[0.1] rounded px-1.5 py-0.5 text-[10px] font-mono text-blue-300 focus:ring-0">
          <option value="cyber-dark">Cyber Dark</option>
          <option value="midnight-blue">Midnight Blue</option>
          <option value="emerald-tech">Emerald Tech</option>
          <option value="purple-aurora">Purple Aurora</option>
          <option value="minimal-light">Minimal Light</option>
        </select>
      </div>
    </div>

    <div class="flex flex-wrap items-center gap-2">
      <button onclick="addNewSlide()" class="px-3 py-2.5 min-h-[44px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition">
        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
        <span class="hidden md:inline">Add Slide</span>
      </button>

      <button onclick="saveCurrentDeck()" class="px-3 py-2.5 min-h-[44px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition">
        <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"></path></svg>
        <span class="hidden sm:inline">Save</span>
      </button>

      <button onclick="openShareModal()" class="px-3 py-2.5 min-h-[44px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition">
        <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8.684 13.342C8.886 12.938 9 12.482 9 12c0-.482-.114-.938-.316-1.342m0 2.684a3 3 0 110-2.684m0 2.684l6.632 3.316m-6.632-6l6.632-3.316m0 0a3 3 0 105.367-2.684 3 3 0 00-5.367 2.684zm0 9.316a3 3 0 105.368 2.684 3 3 0 00-5.368-2.684z"></path></svg>
        <span class="hidden sm:inline">Share</span>
      </button>

      <div class="relative group">
        <button class="px-3 py-2.5 min-h-[44px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium flex items-center gap-1.5 transition">
          <svg class="w-3.5 h-3.5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"></path></svg>
          <span>Export</span>
          <svg class="w-3 h-3 opacity-60" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path d="M19 9l-7 7-7-7" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"></path></svg>
        </button>
        <div class="absolute right-0 mt-1 w-48 rounded-xl bg-[#070e24] border border-blue-500/30 p-1.5 shadow-2xl backdrop-blur-xl hidden group-hover:block z-50">
          <button onclick="downloadExport('pptx')" class="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-xs text-slate-200 hover:bg-blue-600/30 hover:text-white flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-blue-400"></span>PowerPoint (.pptx)</button>
          <button onclick="downloadExport('html')" class="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-xs text-slate-200 hover:bg-blue-600/30 hover:text-white flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-emerald-400"></span>Standalone Web Deck (.html)</button>
          <button onclick="downloadExport('markdown')" class="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-xs text-slate-200 hover:bg-blue-600/30 hover:text-white flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-amber-400"></span>Markdown (.md)</button>
          <button onclick="window.print()" class="w-full text-left px-3 py-2.5 min-h-[44px] rounded-lg text-xs text-slate-200 hover:bg-blue-600/30 hover:text-white flex items-center gap-2"><span class="w-2 h-2 rounded-full bg-indigo-400"></span>Print to PDF</button>
        </div>
      </div>

      <button onclick="startPresentationMode()" class="px-3.5 py-2.5 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_15px_rgba(37,99,235,0.4)] flex items-center gap-1.5 transition">
        <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"></path></svg>
        <span>Present</span>
      </button>
    </div>
  </div>
</div>
<!-- END: StudioWorkspaceRibbon -->`;

const headerRegex = /(?:<!-- BEGIN: (?:TopNavigation|CanonicalTopNavigation) -->\s*)?<header[\s\S]*?<\/header>(?:\s*<!-- END: (?:TopNavigation|CanonicalTopNavigation) -->)?/;
const footerRegex = /(?:<!-- BEGIN: CanonicalSiteFooter -->\s*)?<footer[\s\S]*?<\/footer>(?:\s*<!-- END: CanonicalSiteFooter -->)?/;

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
  'views/settings.html'
];

const report = [];

for (const rel of pages) {
  const abs = path.join(root, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  if (!headerRegex.test(html)) report.push(`MISS header: ${rel}`);
  html = html.replace(headerRegex, header());

  if (!footerRegex.test(html)) report.push(`MISS footer: ${rel}`);
  html = html.replace(footerRegex, FOOTER);

  if (html !== before) {
    fs.writeFileSync(abs, html, 'utf8');
    report.push(`OK   ${rel}`);
  } else {
    report.push(`NOCH ${rel}`);
  }
}

// Editor gets canonical navbar + canonical footer, with studio controls in a ribbon
{
  const rel = 'views/editor.html';
  const abs = path.join(root, rel);
  let html = fs.readFileSync(abs, 'utf8');
  const before = html;

  if (!headerRegex.test(html)) report.push(`MISS header: ${rel}`);
  // Drop any previously injected ribbons so the script stays idempotent
  html = html.replace(/\s*<!-- BEGIN: StudioWorkspaceRibbon -->[\s\S]*?<!-- END: StudioWorkspaceRibbon -->/g, '');
  html = html.replace(headerRegex, `${header()}\n\n  ${EDITOR_RIBBON}`);

  if (!footerRegex.test(html)) report.push(`MISS footer: ${rel}`);
  html = html.replace(footerRegex, FOOTER);

  if (html !== before) {
    fs.writeFileSync(abs, html, 'utf8');
    report.push(`OK   ${rel} (canonical navbar + footer, studio controls preserved)`);
  } else {
    report.push(`NOCH ${rel}`);
  }
}

console.log(report.join('\n'));
