// Presentation Studio Editor & Real-time Canvas Logic

let currentPresentation = null;
let activeSlideIndex = 0;
let saveTimeout = null;

function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className = `fixed bottom-6 right-6 z-50 transform translate-y-0 opacity-100 transition-all duration-300 max-w-md p-4 rounded-xl shadow-2xl border flex items-center gap-3 font-sans text-xs ${
    type === 'error'
      ? 'bg-rose-950/90 border-rose-500/50 text-rose-200'
      : type === 'success'
      ? 'bg-emerald-950/90 border-emerald-500/50 text-emerald-200'
      : 'bg-blue-950/90 border-blue-500/50 text-blue-200'
  }`;

  setTimeout(() => {
    toast.className += ' translate-y-20 opacity-0';
  }, 4000);
}

function getQueryParam(param) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(param);
}

async function loadPresentation() {
  const id = getQueryParam('id');
  if (!id) {
    showToast('No presentation ID specified. Redirecting to dashboard...', 'error');
    setTimeout(() => { window.location.href = '/dashboard'; }, 1500);
    return;
  }

  try {
    const res = await fetch(`/api/presentations/${id}`);
    const data = await res.json();

    if (!data.success || !data.data) {
      throw new Error(data.error || 'Failed to load presentation');
    }

    currentPresentation = data.data;

    // Header info
    document.getElementById('deckTitleInput').value = currentPresentation.title || 'Untitled Presentation';
    document.getElementById('deckTopicText').textContent = currentPresentation.topic || 'AI Deck';
    const themeSel = document.getElementById('deckThemeSelector');
    if (themeSel) {
      themeSel.value = currentPresentation.theme || 'cyber-dark';
    }
    applyThemeToCanvas(currentPresentation.theme || 'cyber-dark');

    renderFilmstrip();
    selectSlide(0);
  } catch (err) {
    console.error('Error loading presentation:', err);
    showToast(err.message, 'error');
  }
}

function renderFilmstrip() {
  const container = document.getElementById('filmstripList');
  const countBadge = document.getElementById('slideCountSidebar');
  const slides = currentPresentation.slides || [];

  countBadge.textContent = slides.length;

  container.innerHTML = slides.map((slide, idx) => {
    const isActive = idx === activeSlideIndex;
    return `
      <div onclick="selectSlide(${idx})" class="p-2.5 rounded-xl cursor-pointer transition-all ${
        isActive
          ? 'bg-blue-600/20 border-2 border-blue-400/60 shadow-[0_0_15px_rgba(59,130,246,0.3)]'
          : 'bg-white/[0.02] border border-white/[0.06] hover:bg-white/[0.05]'
      }">
        <div class="flex items-center justify-between text-[10px] font-mono mb-1">
          <span class="font-bold ${isActive ? 'text-blue-300' : 'text-slate-400'}">0${idx + 1} // ${slide.layout || 'BULLETS'}</span>
          ${isActive ? '<span class="w-1.5 h-1.5 rounded-full bg-blue-400"></span>' : ''}
        </div>
        <div class="text-xs font-semibold text-white truncate">${escapeHtml(slide.title)}</div>
        <div class="text-[10px] text-slate-400 truncate mt-0.5">${escapeHtml(slide.subtitle || (slide.bullets && slide.bullets[0]) || '')}</div>
      </div>
    `;
  }).join('');
}

function selectSlide(index) {
  if (!currentPresentation || !currentPresentation.slides || !currentPresentation.slides[index]) return;
  activeSlideIndex = index;

  renderFilmstrip();
  renderActiveSlide();
  populateFormFields();

  // Slide navigator (guarded: never let a missing control break slide rendering)
  const pagination = document.getElementById('footerPagination');
  const prevBtn = document.getElementById('prevSlideBtn');
  const nextBtn = document.getElementById('nextSlideBtn');
  const total = currentPresentation.slides.length;
  if (pagination) pagination.textContent = `${index + 1} / ${total}`;
  if (prevBtn) prevBtn.disabled = (index === 0);
  if (nextBtn) nextBtn.disabled = (index === total - 1);
}

function renderActiveSlide() {
  const slide = currentPresentation.slides[activeSlideIndex];
  const container = document.getElementById('slideContentDisplay');
  const numBadge = document.getElementById('canvasSlideNumberBadge');
  const layoutBadge = document.getElementById('canvasLayoutBadge');
  const notesText = document.getElementById('speakerNotesText');

  numBadge.textContent = `Slide ${activeSlideIndex + 1} of ${currentPresentation.slides.length}`;
  layoutBadge.textContent = `${(slide.layout || 'BULLETS').toUpperCase()} LAYOUT`;
  notesText.textContent = slide.notes || 'No speaker notes specified for this slide.';

  let contentHtml = '';

  if (slide.layout === 'metrics' && slide.metrics && slide.metrics.length > 0) {
    contentHtml = `
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">${escapeHtml(slide.title)}</h2>
        ${slide.subtitle ? `<p class="text-slate-400 text-sm mt-1 mb-6">${escapeHtml(slide.subtitle)}</p>` : '<div class="mb-6"></div>'}
        
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          ${slide.metrics.map(m => `
            <div class="p-4 rounded-xl bg-white/[0.03] border border-white/[0.08]">
              <div class="text-xs text-slate-400">${escapeHtml(m.label || 'Metric')}</div>
              <div class="text-3xl font-bold text-blue-400 tracking-tight mt-1">${escapeHtml(m.value || '')}</div>
              ${m.delta ? `<div class="text-xs text-emerald-400 font-mono mt-1">${escapeHtml(m.delta)}</div>` : ''}
            </div>
          `).join('')}
        </div>

        <div class="space-y-2.5">
          ${(slide.bullets || []).map(b => `
            <div class="flex items-start gap-2.5 text-slate-200 text-sm">
              <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <span>${escapeHtml(b)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  } else if (slide.layout === 'two-column') {
    const left = slide.leftColumn && slide.leftColumn.length > 0 ? slide.leftColumn : (slide.bullets || []).slice(0, Math.ceil((slide.bullets || []).length / 2));
    const right = slide.rightColumn && slide.rightColumn.length > 0 ? slide.rightColumn : (slide.bullets || []).slice(Math.ceil((slide.bullets || []).length / 2));

    contentHtml = `
      <div>
        <h2 class="text-2xl sm:text-3xl font-bold text-white tracking-tight">${escapeHtml(slide.title)}</h2>
        ${slide.subtitle ? `<p class="text-slate-400 text-sm mt-1 mb-6">${escapeHtml(slide.subtitle)}</p>` : '<div class="mb-6"></div>'}

        <div class="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div class="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div class="text-xs font-mono uppercase text-blue-300 font-bold tracking-wider">Primary Vectors</div>
            ${left.map(b => `
              <div class="flex items-start gap-2.5 text-slate-200 text-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-blue-400 mt-2 shrink-0"></span>
                <span>${escapeHtml(b)}</span>
              </div>
            `).join('')}
          </div>
          <div class="p-5 rounded-xl bg-white/[0.02] border border-white/[0.08] space-y-3">
            <div class="text-xs font-mono uppercase text-emerald-300 font-bold tracking-wider">Target Outcomes</div>
            ${right.map(b => `
              <div class="flex items-start gap-2.5 text-slate-200 text-sm">
                <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2 shrink-0"></span>
                <span>${escapeHtml(b)}</span>
              </div>
            `).join('')}
          </div>
        </div>
      </div>
    `;
  } else {
    // Title, Bullets, Conclusion
    contentHtml = `
      <div>
        <h2 class="text-2xl sm:text-4xl font-bold text-white tracking-tight leading-tight">${escapeHtml(slide.title)}</h2>
        ${slide.subtitle ? `<p class="text-slate-400 text-sm sm:text-base mt-2 mb-6 font-normal">${escapeHtml(slide.subtitle)}</p>` : '<div class="mb-6"></div>'}

        <div class="space-y-3.5 my-auto">
          ${(slide.bullets || []).map(b => `
            <div class="p-3.5 rounded-xl bg-white/[0.02] border border-white/[0.06] flex items-start gap-3 hover:bg-white/[0.04] transition">
              <span class="w-2 h-2 rounded-full bg-blue-400 mt-2 shrink-0"></span>
              <span class="text-slate-200 text-sm sm:text-base leading-relaxed font-medium">${escapeHtml(b)}</span>
            </div>
          `).join('')}
        </div>
      </div>
    `;
  }

  container.innerHTML = contentHtml;
}

function populateFormFields() {
  const slide = currentPresentation.slides[activeSlideIndex];
  document.getElementById('editSlideTitle').value = slide.title || '';
  document.getElementById('editSlideSubtitle').value = slide.subtitle || '';
  document.getElementById('editSlideLayout').value = slide.layout || 'bullets';
  document.getElementById('editSlideVisualCue').value = slide.visualCue || '';
  document.getElementById('editSlideBullets').value = (slide.bullets || []).join('\n');
  document.getElementById('editSlideNotes').value = slide.notes || '';

  const isTwoCol = slide.layout === 'two-column';
  document.getElementById('twoColumnEditorContainer').classList.toggle('hidden', !isTwoCol);
  document.getElementById('editLeftColumn').value = (slide.leftColumn || []).join('\n');
  document.getElementById('editRightColumn').value = (slide.rightColumn || []).join('\n');
}

function updateActiveSlideFromForm() {
  if (!currentPresentation || !currentPresentation.slides[activeSlideIndex]) return;

  const slide = currentPresentation.slides[activeSlideIndex];
  slide.title = document.getElementById('editSlideTitle').value;
  slide.subtitle = document.getElementById('editSlideSubtitle').value;
  slide.layout = document.getElementById('editSlideLayout').value;
  slide.visualCue = document.getElementById('editSlideVisualCue').value;
  slide.notes = document.getElementById('editSlideNotes').value;

  const bulletsText = document.getElementById('editSlideBullets').value;
  slide.bullets = bulletsText.split('\n').filter(b => b.trim() !== '');

  if (slide.layout === 'two-column') {
    slide.leftColumn = document.getElementById('editLeftColumn').value.split('\n').filter(b => b.trim() !== '');
    slide.rightColumn = document.getElementById('editRightColumn').value.split('\n').filter(b => b.trim() !== '');
  }

  renderActiveSlide();
  renderFilmstrip();
  triggerAutoSave();
}

function handleLayoutChange() {
  const newLayout = document.getElementById('editSlideLayout').value;
  const isTwoCol = newLayout === 'two-column';
  document.getElementById('twoColumnEditorContainer').classList.toggle('hidden', !isTwoCol);
  updateActiveSlideFromForm();
}

function handleTitleChange() {
  const newTitle = document.getElementById('deckTitleInput').value.trim();
  if (newTitle && currentPresentation) {
    currentPresentation.title = newTitle;
    triggerAutoSave();
  }
}

function triggerAutoSave() {
  const badge = document.getElementById('saveStatusBadge');
  badge.textContent = 'Saving...';
  badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 shrink-0';

  clearTimeout(saveTimeout);
  saveTimeout = setTimeout(async () => {
    await saveCurrentDeck();
  }, 1000);
}

async function saveCurrentDeck() {
  if (!currentPresentation) return;
  const id = currentPresentation._id || currentPresentation.id;
  const badge = document.getElementById('saveStatusBadge');

  try {
    const res = await fetch(`/api/presentations/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        title: currentPresentation.title,
        slides: currentPresentation.slides,
        theme: currentPresentation.theme
      })
    });

    const data = await res.json();
    if (data.success) {
      badge.textContent = 'Saved';
      badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 border border-emerald-400/30 shrink-0';
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    badge.textContent = 'Error';
    badge.className = 'text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-400/30 shrink-0';
    console.error('Save failed:', err);
  }
}

function addNewSlide() {
  if (!currentPresentation) return;
  const newSlideNum = currentPresentation.slides.length + 1;
  const newSlide = {
    slideNumber: newSlideNum,
    title: `Key Focus Area ${newSlideNum}`,
    subtitle: 'Strategic alignment and implementation nuance',
    layout: 'bullets',
    bullets: [
      'High priority initiative tailored to stakeholder roadmap',
      'Actionable milestones with measurable performance metrics',
      'Continuous feedback loop ensuring on-time delivery'
    ],
    notes: 'Speaker notes for the new slide.'
  };

  currentPresentation.slides.push(newSlide);
  selectSlide(currentPresentation.slides.length - 1);
  triggerAutoSave();
  showToast('New slide added', 'success');
}

function deleteCurrentSlide() {
  if (!currentPresentation || currentPresentation.slides.length <= 1) {
    showToast('A presentation must have at least one slide', 'error');
    return;
  }

  if (!confirm(`Delete Slide ${activeSlideIndex + 1}?`)) return;

  currentPresentation.slides.splice(activeSlideIndex, 1);
  currentPresentation.slides.forEach((s, idx) => { s.slideNumber = idx + 1; });

  const nextIndex = Math.min(activeSlideIndex, currentPresentation.slides.length - 1);
  selectSlide(nextIndex);
  triggerAutoSave();
  showToast('Slide deleted', 'info');
}

async function aiRegenerateCurrentSlide() {
  const slide = currentPresentation.slides[activeSlideIndex];
  const btn = document.getElementById('aiRegenBtn');
  const origText = btn.innerHTML;
  btn.innerHTML = '<span>Regenerating...</span>';
  btn.disabled = true;

  try {
    const id = currentPresentation._id || currentPresentation.id;
    const res = await fetch(`/api/presentations/${id}/slides/${slide.slideNumber}/regenerate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tone: currentPresentation.tone || 'professional' })
    });

    const data = await res.json();
    if (!data.success) throw new Error(data.error);

    currentPresentation.slides[activeSlideIndex] = data.data;
    selectSlide(activeSlideIndex);
    showToast('Slide regenerated with Nvidia AI!', 'success');
  } catch (err) {
    console.error('AI regen failed:', err);
    showToast('AI regeneration error: ' + err.message, 'error');
  } finally {
    btn.innerHTML = origText;
    btn.disabled = false;
  }
}

function stepSlide(delta) {
  const next = activeSlideIndex + delta;
  if (next >= 0 && next < currentPresentation.slides.length) {
    selectSlide(next);
  }
}

function downloadExport(format) {
  if (!currentPresentation) return;
  const id = currentPresentation._id || currentPresentation.id;
  window.location.href = `/api/presentations/${id}/export?format=${format}`;
}

function startPresentationMode() {
  const canvas = document.getElementById('slideCanvasCard');
  if (canvas.requestFullscreen) {
    canvas.requestFullscreen();
  }
}

function changeDeckTheme(newTheme) {
  if (!currentPresentation) return;
  currentPresentation.theme = newTheme;
  applyThemeToCanvas(newTheme);
  triggerAutoSave();
  showToast(`Theme updated to ${newTheme}`, 'info');
}

function applyThemeToCanvas(theme) {
  const canvas = document.getElementById('slideCanvasCard');
  if (!canvas) return;

  const themes = {
    'cyber-dark': 'border-blue-500/30 bg-[#070e24]/95',
    'midnight-blue': 'border-indigo-500/30 bg-[#0a122e]/95',
    'emerald-tech': 'border-emerald-500/30 bg-[#031c15]/95',
    'purple-aurora': 'border-purple-500/30 bg-[#160c2e]/95',
    'minimal-light': 'border-slate-300 bg-slate-900/95'
  };

  // Reset base classes and add selected theme
  canvas.className = `rounded-2xl border ${themes[theme] || themes['cyber-dark']} backdrop-blur-xl p-6 sm:p-10 shadow-[0_20px_60px_rgba(0,0,0,0.8),0_0_40px_rgba(37,99,235,0.2)] relative min-h-[460px] flex flex-col justify-between transition-all`;
}

function moveCurrentSlide(direction) {
  if (!currentPresentation || !currentPresentation.slides) return;
  const newIndex = activeSlideIndex + direction;
  if (newIndex < 0 || newIndex >= currentPresentation.slides.length) return;

  const temp = currentPresentation.slides[activeSlideIndex];
  currentPresentation.slides[activeSlideIndex] = currentPresentation.slides[newIndex];
  currentPresentation.slides[newIndex] = temp;

  // Re-index
  currentPresentation.slides.forEach((s, i) => { s.slideNumber = i + 1; });
  selectSlide(newIndex);
  triggerAutoSave();
  showToast('Slide reordered', 'info');
}

function duplicateCurrentSlide() {
  if (!currentPresentation || !currentPresentation.slides[activeSlideIndex]) return;

  const slideCopy = JSON.parse(JSON.stringify(currentPresentation.slides[activeSlideIndex]));
  slideCopy.title = `${slideCopy.title} (Copy)`;
  
  currentPresentation.slides.splice(activeSlideIndex + 1, 0, slideCopy);
  currentPresentation.slides.forEach((s, i) => { s.slideNumber = i + 1; });

  selectSlide(activeSlideIndex + 1);
  triggerAutoSave();
  showToast('Slide duplicated', 'success');
}

function openShareModal() {
  if (!currentPresentation) return;
  const id = currentPresentation._id || currentPresentation.id;
  const shareUrl = `${window.location.origin}/api/presentations/${id}/export?format=html`;
  
  document.getElementById('shareLinkInput').value = shareUrl;
  document.getElementById('openWebDeckLink').href = shareUrl;
  document.getElementById('shareModal').classList.remove('hidden');
}

function closeShareModal() {
  document.getElementById('shareModal').classList.add('hidden');
}

function copyShareLink() {
  const input = document.getElementById('shareLinkInput');
  input.select();
  navigator.clipboard.writeText(input.value);
  const btn = document.getElementById('copyShareBtn');
  btn.textContent = 'Copied!';
  setTimeout(() => { btn.textContent = 'Copy'; }, 2000);
}

function escapeHtml(text) {
  if (!text) return '';
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

// Keyboard shortcuts for slides navigation
document.addEventListener('keydown', (e) => {
  // Avoid capturing when typing inside inputs
  if (['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
    return;
  }

  if (e.key === 'ArrowRight' || e.key === 'PageDown') {
    stepSlide(1);
  } else if (e.key === 'ArrowLeft' || e.key === 'PageUp') {
    stepSlide(-1);
  }
});

// Initialize
document.addEventListener('DOMContentLoaded', loadPresentation);
