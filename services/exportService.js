/**
 * Export Service
 * Produces high-fidelity PPTX (16:9 widescreen 13.33" x 7.5"),
 * standalone responsive HTML decks, and Markdown exports.
 */

const pptxgen = require('pptxgenjs');

// Sophisticated theme color palettes tailored for executive-grade slides
const THEMES = {
  'cyber-dark': {
    bg: '070d1e',
    cardBg: '0e1a38',
    cardBorder: '1e3a8a',
    primary: '38bdf8',
    secondary: '818cf8',
    text: 'f8fafc',
    muted: '94a3b8',
    accent: '3b82f6',
    pillBg: '1e293b'
  },
  'midnight-blue': {
    bg: '030b1e',
    cardBg: '0a1738',
    cardBorder: '1e40af',
    primary: '60a5fa',
    secondary: '38bdf8',
    text: 'ffffff',
    muted: 'a5b4fc',
    accent: '2563eb',
    pillBg: '172554'
  },
  'emerald-tech': {
    bg: '021a14',
    cardBg: '062e24',
    cardBorder: '047857',
    primary: '34d399',
    secondary: '6ee7b7',
    text: 'ecfdf5',
    muted: 'a7f3d0',
    accent: '10b981',
    pillBg: '064e3b'
  },
  'purple-aurora': {
    bg: '0f0926',
    cardBg: '1c1142',
    cardBorder: '6d28d9',
    primary: 'c084fc',
    secondary: 'f472b6',
    text: 'faf5ff',
    muted: 'd8b4fe',
    accent: 'a855f7',
    pillBg: '3b0764'
  },
  'minimal-light': {
    bg: 'f8fafc',
    cardBg: 'ffffff',
    cardBorder: 'cbd5e1',
    primary: '2563eb',
    secondary: '0284c7',
    text: '0f172a',
    muted: '64748b',
    accent: '4f46e5',
    pillBg: 'e2e8f0'
  }
};

/**
 * Generate PPTX buffer using pptxgenjs with modern 13.33" x 7.5" 16:9 widescreen layout.
 * Ensures strict coordinate boundaries so text and shapes NEVER overlap.
 */
async function generatePptx(presentation) {
  const pptx = new pptxgen();
  pptx.layout = 'LAYOUT_WIDE'; // 13.333" width x 7.5" height
  pptx.author = 'GlowSlides AI Presentation Builder';
  pptx.company = 'GlowSlides';
  pptx.title = presentation.title || 'GlowSlides Presentation';
  pptx.subject = presentation.topic || 'Presentation';

  const themeKey = presentation.theme || 'cyber-dark';
  const palette = THEMES[themeKey] || THEMES['cyber-dark'];
  const totalSlides = (presentation.slides || []).length;

  presentation.slides.forEach((slide, index) => {
    const pSlide = pptx.addSlide();
    pSlide.background = { color: palette.bg };

    const isFirstSlide = index === 0;
    const isLastSlide = index === totalSlides - 1;

    // Header Category Badge (Pill)
    const categoryText = isFirstSlide ? 'GLOWSLIDES AI  •  EXECUTIVE BRIEFING' :
                         isLastSlide ? 'GLOWSLIDES AI  •  STRATEGIC CONCLUSION' :
                         `GLOWSLIDES AI  •  SLIDE ${index + 1} OF ${totalSlides}`;

    pSlide.addText(categoryText, {
      x: 0.9,
      y: 0.45,
      w: 8.0,
      h: 0.28,
      fontSize: 9.5,
      fontFace: 'Arial',
      color: palette.primary,
      bold: true,
      charSpacing: 2
    });

    // Slide Title
    pSlide.addText(slide.title || `Slide ${index + 1}`, {
      x: 0.9,
      y: 0.8,
      w: 11.5,
      h: 0.75,
      fontSize: 24,
      fontFace: 'Arial',
      color: palette.text,
      bold: true,
      valign: 'middle'
    });

    // Subtitle
    if (slide.subtitle) {
      pSlide.addText(slide.subtitle, {
        x: 0.9,
        y: 1.55,
        w: 11.5,
        h: 0.35,
        fontSize: 12,
        fontFace: 'Arial',
        color: palette.muted,
        italic: true,
        valign: 'top'
      });
    }

    const contentStartY = slide.subtitle ? 2.05 : 1.75;
    const availableHeight = 4.7; // From contentStartY down to ~6.75 (footer is at 6.85)

    // Layout Rendering
    if (slide.layout === 'metrics' && slide.metrics && slide.metrics.length > 0) {
      const metricCardsCount = Math.min(slide.metrics.length, 3);
      const totalWidth = 11.53;
      const gap = 0.35;
      const cardWidth = (totalWidth - (gap * (metricCardsCount - 1))) / metricCardsCount;
      const cardHeight = 1.45;

      slide.metrics.slice(0, 3).forEach((m, mIdx) => {
        const posX = 0.9 + mIdx * (cardWidth + gap);

        // Metric Card Background
        pSlide.addShape(pptx.ShapeType.roundRect, {
          x: posX,
          y: contentStartY,
          w: cardWidth,
          h: cardHeight,
          fill: { color: palette.cardBg },
          line: { color: palette.cardBorder, width: 1 },
          rectRadius: 0.1
        });

        // Metric Big Value
        pSlide.addText(m.value || 'N/A', {
          x: posX + 0.25,
          y: contentStartY + 0.15,
          w: cardWidth - 0.5,
          h: 0.65,
          fontSize: 28,
          fontFace: 'Arial',
          bold: true,
          color: palette.primary,
          valign: 'middle'
        });

        // Metric Label
        pSlide.addText(m.label || 'Metric', {
          x: posX + 0.25,
          y: contentStartY + 0.8,
          w: cardWidth - 0.5,
          h: 0.3,
          fontSize: 11,
          fontFace: 'Arial',
          color: palette.text,
          bold: true,
          valign: 'top'
        });

        // Delta / Insight
        if (m.delta) {
          pSlide.addText(m.delta, {
            x: posX + 0.25,
            y: contentStartY + 1.1,
            w: cardWidth - 0.5,
            h: 0.25,
            fontSize: 9.5,
            fontFace: 'Arial',
            color: palette.secondary,
            valign: 'top'
          });
        }
      });

      // Bullets below metric cards
      const bulletY = contentStartY + cardHeight + 0.3;
      const bulletH = 6.6 - bulletY;

      if (slide.bullets && slide.bullets.length > 0) {
        const bulletItems = slide.bullets.map(b => ({
          text: b,
          options: {
            bullet: { type: 'bullet', code: '2022' },
            fontSize: 12.5,
            fontFace: 'Arial',
            color: palette.text,
            breakLine: true,
            spaceAfter: 8
          }
        }));

        pSlide.addShape(pptx.ShapeType.roundRect, {
          x: 0.9,
          y: bulletY,
          w: 11.53,
          h: bulletH,
          fill: { color: palette.cardBg },
          line: { color: palette.cardBorder, width: 1 },
          rectRadius: 0.1
        });

        pSlide.addText(bulletItems, {
          x: 1.2,
          y: bulletY + 0.2,
          w: 10.9,
          h: bulletH - 0.4,
          valign: 'middle'
        });
      }
    } else if (slide.layout === 'two-column') {
      const colW = 5.6;
      const colGap = 0.33;
      const colH = 4.6;

      const leftItems = (slide.leftColumn && slide.leftColumn.length > 0 ? slide.leftColumn : (slide.bullets || []).slice(0, Math.ceil((slide.bullets || []).length / 2)))
        .map(b => ({
          text: b,
          options: { bullet: { type: 'bullet', code: '2022' }, fontSize: 12.5, fontFace: 'Arial', color: palette.text, breakLine: true, spaceAfter: 12 }
        }));

      const rightItems = (slide.rightColumn && slide.rightColumn.length > 0 ? slide.rightColumn : (slide.bullets || []).slice(Math.ceil((slide.bullets || []).length / 2)))
        .map(b => ({
          text: b,
          options: { bullet: { type: 'bullet', code: '2022' }, fontSize: 12.5, fontFace: 'Arial', color: palette.text, breakLine: true, spaceAfter: 12 }
        }));

      // Left Column Box
      pSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: contentStartY,
        w: colW,
        h: colH,
        fill: { color: palette.cardBg },
        line: { color: palette.cardBorder, width: 1 },
        rectRadius: 0.1
      });

      pSlide.addText('CORE PILLARS & OBSERVATIONS', {
        x: 1.2,
        y: contentStartY + 0.25,
        w: colW - 0.6,
        h: 0.35,
        fontSize: 10.5,
        fontFace: 'Arial',
        bold: true,
        color: palette.primary,
        charSpacing: 1.5
      });

      pSlide.addText(leftItems, {
        x: 1.2,
        y: contentStartY + 0.7,
        w: colW - 0.6,
        h: colH - 0.9,
        valign: 'top'
      });

      // Right Column Box
      const rightX = 0.9 + colW + colGap;
      pSlide.addShape(pptx.ShapeType.roundRect, {
        x: rightX,
        y: contentStartY,
        w: colW,
        h: colH,
        fill: { color: palette.cardBg },
        line: { color: palette.cardBorder, width: 1 },
        rectRadius: 0.1
      });

      pSlide.addText('ANALYSIS & IMPLICATIONS', {
        x: rightX + 0.3,
        y: contentStartY + 0.25,
        w: colW - 0.6,
        h: 0.35,
        fontSize: 10.5,
        fontFace: 'Arial',
        bold: true,
        color: palette.secondary,
        charSpacing: 1.5
      });

      pSlide.addText(rightItems, {
        x: rightX + 0.3,
        y: contentStartY + 0.7,
        w: colW - 0.6,
        h: colH - 0.9,
        valign: 'top'
      });
    } else {
      // Standard Cards / Bullets layout
      const boxH = 4.6;

      pSlide.addShape(pptx.ShapeType.roundRect, {
        x: 0.9,
        y: contentStartY,
        w: 11.53,
        h: boxH,
        fill: { color: palette.cardBg },
        line: { color: palette.cardBorder, width: 1 },
        rectRadius: 0.1
      });

      const bulletItems = (slide.bullets || []).map(b => ({
        text: b,
        options: {
          bullet: { type: 'bullet', code: '2022' },
          fontSize: 13.5,
          fontFace: 'Arial',
          color: palette.text,
          breakLine: true,
          spaceAfter: 16
        }
      }));

      pSlide.addText(bulletItems, {
        x: 1.3,
        y: contentStartY + 0.4,
        w: 10.73,
        h: boxH - 0.8,
        valign: 'top'
      });
    }

    // Modern Slide Footer Bar
    pSlide.addText(`GlowSlides AI  •  ${presentation.title}`, {
      x: 0.9,
      y: 6.85,
      w: 8.0,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Arial',
      color: palette.muted
    });

    pSlide.addText(`Slide ${index + 1} of ${totalSlides}`, {
      x: 9.43,
      y: 6.85,
      w: 3.0,
      h: 0.25,
      fontSize: 9,
      fontFace: 'Arial',
      color: palette.muted,
      align: 'right'
    });
  });

  return await pptx.write({ outputType: 'nodebuffer' });
}

/**
 * Generate standalone, self-contained interactive HTML presentation file
 */
function generateHtmlPresentation(presentation) {
  const slidesJson = JSON.stringify(presentation.slides);
  const theme = presentation.theme || 'cyber-dark';

  return `<!DOCTYPE html>
<html lang="en" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${presentation.title} — GlowSlides Deck</title>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@300;400;500;600;700;800&family=JetBrains+Mono:wght@400;600&display=swap" rel="stylesheet">
  <script src="https://cdn.tailwindcss.com"></script>
  <style>
    body {
      background-color: #030712;
      color: #f8fafc;
      font-family: 'Plus Jakarta Sans', sans-serif;
      margin: 0;
      overflow: hidden;
      height: 100vh;
    }
    .slide-card {
      transition: all 0.3s cubic-bezier(0.16, 1, 0.3, 1);
    }
    .radial-glow {
      background: radial-gradient(circle at 75% 70%, rgba(37, 99, 235, 0.35) 0%, rgba(29, 78, 216, 0.15) 35%, rgba(3, 7, 18, 0) 70%);
    }
    .cyber-grid {
      background-size: 50px 50px;
      background-image: 
        linear-gradient(to right, rgba(255, 255, 255, 0.03) 1px, transparent 1px),
        linear-gradient(to bottom, rgba(255, 255, 255, 0.03) 1px, transparent 1px);
    }
    @media print {
      body { overflow: visible !important; height: auto !important; background: #030712 !important; }
      .no-print { display: none !important; }
      .print-slide { page-break-after: always; height: 100vh; display: flex !important; }
    }
  </style>
</head>
<body class="relative flex flex-col justify-between selection:bg-blue-600 selection:text-white">
  <div class="pointer-events-none fixed inset-0 radial-glow z-0"></div>
  <div class="pointer-events-none fixed inset-0 cyber-grid z-0"></div>

  <!-- Top bar -->
  <header class="relative z-20 flex items-center justify-between px-6 py-4 border-b border-white/[0.08] bg-black/40 backdrop-blur-md no-print">
    <div class="flex items-center gap-3">
      <div class="w-7 h-7 rounded-lg bg-blue-600 flex items-center justify-center font-bold text-white text-xs shadow-[0_0_12px_rgba(59,130,246,0.5)]">G</div>
      <div>
        <h1 class="text-sm font-bold text-white tracking-tight">${presentation.title}</h1>
        <p class="text-[11px] text-slate-400 font-mono">${presentation.topic} • ${presentation.slides.length} Slides</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <span id="slideCounter" class="text-xs font-mono text-blue-300 bg-blue-500/10 px-3 py-1 rounded border border-blue-400/20">Slide 1 / ${presentation.slides.length}</span>
      <button onclick="toggleFullScreen()" class="text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 border border-white/[0.08] transition">⛶ Fullscreen</button>
      <button onclick="window.print()" class="text-xs font-semibold px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white shadow-[0_0_14px_rgba(37,99,235,0.4)] transition">Print / PDF</button>
    </div>
  </header>

  <!-- Progress Bar -->
  <div class="w-full bg-white/[0.06] h-1 relative z-20 no-print">
    <div id="progressBar" class="h-1 bg-gradient-to-r from-blue-500 to-indigo-400 transition-all duration-300" style="width: ${(1 / presentation.slides.length) * 100}%"></div>
  </div>

  <!-- Main Slide Viewport -->
  <main class="relative z-10 flex-1 flex items-center justify-center p-6 md:p-12 overflow-hidden">
    <div id="activeSlide" class="w-full max-w-5xl h-full max-h-[640px] rounded-2xl bg-[#070e24]/90 border border-blue-500/30 backdrop-blur-xl p-8 md:p-12 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(37,99,235,0.2)] flex flex-col justify-between slide-card">
      <!-- Dynamic slide renders here -->
    </div>
  </main>

  <!-- Navigation Footer Controls -->
  <footer class="relative z-20 flex items-center justify-between px-6 py-3 border-t border-white/[0.08] bg-black/50 backdrop-blur-md no-print text-xs">
    <div class="text-slate-400 font-mono text-[11px] hidden sm:block">
      Use <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white font-semibold">←</kbd> <kbd class="px-1.5 py-0.5 rounded bg-white/10 text-white font-semibold">→</kbd> keys or Spacebar to navigate
    </div>
    <div class="flex items-center gap-2 mx-auto sm:mx-0">
      <button onclick="prevSlide()" id="prevBtn" class="px-4 py-2 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-200 border border-white/[0.08] font-medium transition disabled:opacity-30 disabled:pointer-events-none">Previous</button>
      <button onclick="nextSlide()" id="nextBtn" class="px-5 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold shadow-[0_0_12px_rgba(59,130,246,0.5)] transition disabled:opacity-30 disabled:pointer-events-none">Next Slide</button>
    </div>
  </footer>

  <script>
    const slides = ${slidesJson};
    let currentIndex = 0;

    function renderSlide(index) {
      const slide = slides[index];
      const container = document.getElementById('activeSlide');
      const counter = document.getElementById('slideCounter');
      const progress = document.getElementById('progressBar');

      counter.textContent = \`Slide \${index + 1} / \${slides.length}\`;
      progress.style.width = \`\${((index + 1) / slides.length) * 100}%\`;

      let innerContent = '';

      if (slide.layout === 'metrics' && slide.metrics && slide.metrics.length > 0) {
        innerContent = \`
          <div>
            <div class="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
              <div>
                <span class="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Slide \${index + 1} // Data & Metrics</span>
                <h2 class="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">\${slide.title}</h2>
                \${slide.subtitle ? \`<p class="text-slate-400 text-sm mt-1">\${slide.subtitle}</p>\` : ''}
              </div>
              <span class="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-mono border border-blue-400/30">METRICS</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
              \${slide.metrics.map(m => \`
                <div class="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
                  <div class="text-xs text-slate-400 font-medium">\${m.label || 'Metric'}</div>
                  <div class="text-3xl font-bold text-blue-400 tracking-tight mt-1">\${m.value}</div>
                  \${m.delta ? \`<div class="text-xs text-emerald-400 font-mono mt-1">\${m.delta}</div>\` : ''}
                </div>
              \`).join('')}
            </div>
            <div class="space-y-3">
              \${(slide.bullets || []).map(b => \`
                <div class="flex items-start gap-3 text-slate-200 text-sm md:text-base">
                  <span class="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                  <span>\${b}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      } else if (slide.layout === 'two-column') {
        const left = slide.leftColumn && slide.leftColumn.length > 0 ? slide.leftColumn : slide.bullets.slice(0, Math.ceil(slide.bullets.length / 2));
        const right = slide.rightColumn && slide.rightColumn.length > 0 ? slide.rightColumn : slide.bullets.slice(Math.ceil(slide.bullets.length / 2));
        innerContent = \`
          <div>
            <div class="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
              <div>
                <span class="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Slide \${index + 1} // Comparative View</span>
                <h2 class="text-2xl md:text-3xl font-bold text-white tracking-tight mt-1">\${slide.title}</h2>
                \${slide.subtitle ? \`<p class="text-slate-400 text-sm mt-1">\${slide.subtitle}</p>\` : ''}
              </div>
              <span class="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-mono border border-blue-400/30">DUAL-PANE</span>
            </div>
            <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div class="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                <div class="text-xs font-mono uppercase text-blue-300 font-bold tracking-wider">Key Pillars</div>
                \${left.map(b => \`
                  <div class="flex items-start gap-2.5 text-slate-200 text-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                    <span>\${b}</span>
                  </div>
                \`).join('')}
              </div>
              <div class="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
                <div class="text-xs font-mono uppercase text-emerald-300 font-bold tracking-wider">Insights & Outcomes</div>
                \${right.map(b => \`
                  <div class="flex items-start gap-2.5 text-slate-200 text-sm">
                    <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                    <span>\${b}</span>
                  </div>
                \`).join('')}
              </div>
            </div>
          </div>
        \`;
      } else {
        innerContent = \`
          <div>
            <div class="flex items-center justify-between border-b border-white/[0.08] pb-4 mb-6">
              <div>
                <span class="text-xs font-mono text-blue-400 font-bold uppercase tracking-wider">Slide \${index + 1} of \${slides.length}</span>
                <h2 class="text-2xl md:text-4xl font-bold text-white tracking-tight mt-1.5">\${slide.title}</h2>
                \${slide.subtitle ? \`<p class="text-slate-400 text-sm md:text-base mt-1.5">\${slide.subtitle}</p>\` : ''}
              </div>
              <span class="px-2.5 py-1 rounded bg-blue-500/20 text-blue-300 text-xs font-mono border border-blue-400/30">\${(slide.layout || 'BULLETS').toUpperCase()}</span>
            </div>
            <div class="space-y-4 my-auto">
              \${(slide.bullets || []).map(b => \`
                <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 hover:bg-white/[0.04] transition">
                  <span class="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                  <span class="text-slate-200 text-sm md:text-base leading-relaxed font-medium">\${b}</span>
                </div>
              \`).join('')}
            </div>
          </div>
        \`;
      }

      const notesHtml = slide.notes ? \`
        <div class="mt-6 pt-4 border-t border-white/[0.06] flex items-start gap-2 text-xs text-slate-400 font-mono">
          <span class="text-blue-400 font-bold">SPEAKER NOTE:</span>
          <span>\${slide.notes}</span>
        </div>
      \` : '';

      container.innerHTML = innerContent + notesHtml;
      document.getElementById('prevBtn').disabled = (index === 0);
      document.getElementById('nextBtn').disabled = (index === slides.length - 1);
    }

    function nextSlide() {
      if (currentIndex < slides.length - 1) {
        currentIndex++;
        renderSlide(currentIndex);
      }
    }

    function prevSlide() {
      if (currentIndex > 0) {
        currentIndex--;
        renderSlide(currentIndex);
      }
    }

    function toggleFullScreen() {
      if (!document.fullscreenElement) {
        document.documentElement.requestFullscreen();
      } else {
        if (document.exitFullscreen) {
          document.exitFullscreen();
        }
      }
    }

    document.addEventListener('keydown', (e) => {
      if (e.key === 'ArrowRight' || e.key === ' ' || e.key === 'PageDown') {
        nextSlide();
      } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
        prevSlide();
      }
    });

    renderSlide(0);
  </script>
</body>
</html>`;
}

/**
 * Generate Markdown file representation
 */
function generateMarkdownPresentation(presentation) {
  let md = `---
title: "${presentation.title}"
topic: "${presentation.topic}"
audience: "${presentation.audience}"
tone: "${presentation.tone}"
theme: "${presentation.theme}"
slideCount: ${presentation.slides.length}
generatedAt: "${new Date().toISOString()}"
generator: "GlowSlides AI Presentation Builder"
---

# ${presentation.title}
*${presentation.topic}*

---

`;

  presentation.slides.forEach((slide, idx) => {
    md += `## Slide ${idx + 1}: ${slide.title}\n`;
    if (slide.subtitle) {
      md += `*${slide.subtitle}*\n\n`;
    }
    md += `> **Layout:** \`${slide.layout}\`\n\n`;

    if (slide.metrics && slide.metrics.length > 0) {
      md += `### Metrics:\n`;
      slide.metrics.forEach(m => {
        md += `- **${m.label || 'Metric'}**: ${m.value} *(${m.delta || ''})*\n`;
      });
      md += `\n`;
    }

    if (slide.leftColumn && slide.leftColumn.length > 0) {
      md += `### Core Vectors:\n`;
      slide.leftColumn.forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n### Strategic Impact:\n`;
      (slide.rightColumn || []).forEach(item => {
        md += `- ${item}\n`;
      });
      md += `\n`;
    }

    if (slide.bullets && slide.bullets.length > 0) {
      md += `### Key Points:\n`;
      slide.bullets.forEach(b => {
        md += `- ${b}\n`;
      });
      md += `\n`;
    }

    if (slide.notes) {
      md += `**Speaker Notes:**\n${slide.notes}\n\n`;
    }

    md += `---\n\n`;
  });

  return md;
}

module.exports = {
  generatePptx,
  generateHtmlPresentation,
  generateMarkdownPresentation,
  THEMES
};
