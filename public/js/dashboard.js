// Dashboard State & API Handlers
let allPresentations = [];
let searchQuery = '';
let showOnlyFavorites = false;

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

function setTopic(text) {
  const input = document.getElementById('topicInput');
  input.value = text;
  input.focus();
}

async function checkHealth() {
  try {
    const res = await fetch('/api/health');
    const data = await res.json();
    
    // Update AI status badge (only present on layouts that render it)
    const aiBadge = document.getElementById('aiStatusBadge');
    if (aiBadge) {
      if (data.nvidia && data.nvidia.connected) {
        aiBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-emerald-400"></span><span>Nvidia NIM (${data.nvidia.model})</span>`;
      } else {
        aiBadge.innerHTML = `<span class="w-2 h-2 rounded-full bg-blue-400"></span><span>Autonomous AI: Ready</span>`;
      }
    }

    // Update save-state badge (vendor-neutral wording -- users don't care where it is stored)
    const dbBadge = document.getElementById('dbStatusBadge');
    if (data.storage && data.storage.healthy) {
      dbBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-emerald-400"></span> Synced';
      dbBadge.className = 'text-xs font-semibold text-emerald-400 flex items-center gap-1.5 mt-1';
    } else {
      dbBadge.innerHTML = '<span class="w-2 h-2 rounded-full bg-amber-400"></span> Session only';
      dbBadge.className = 'text-xs font-semibold text-amber-300 flex items-center gap-1.5 mt-1';
    }
  } catch (err) {
    console.warn('Health check issue:', err);
  }
}

async function loadPresentations() {
  const container = document.getElementById('decksContainer');
  const emptyState = document.getElementById('emptyState');
  const countBadge = document.getElementById('totalDecksCount');

  try {
    const res = await fetch('/api/presentations');
    const result = await res.json();

    if (!result.success || !result.data) {
      container.innerHTML = '';
      emptyState.classList.remove('hidden');
      countBadge.textContent = '0';
      allPresentations = [];
      return;
    }

    allPresentations = result.data;
    countBadge.textContent = allPresentations.length;
    renderFilteredPresentations();
  } catch (err) {
    console.error('Error loading presentations:', err);
    showToast('Failed to load presentations', 'error');
  }
}

function handleSearch(val) {
  searchQuery = (val || '').toLowerCase().trim();
  renderFilteredPresentations();
}

function toggleFavoritesFilter() {
  showOnlyFavorites = !showOnlyFavorites;
  const btn = document.getElementById('favoriteFilterBtn');
  if (showOnlyFavorites) {
    btn.className = 'text-xs font-semibold px-3 py-1.5 rounded-lg bg-amber-500/20 text-amber-300 border border-amber-400/40 flex items-center gap-1.5 transition';
  } else {
    btn.className = 'text-xs font-medium px-3 py-1.5 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] flex items-center gap-1.5 transition';
  }
  renderFilteredPresentations();
}

function renderFilteredPresentations() {
  const container = document.getElementById('decksContainer');
  const emptyState = document.getElementById('emptyState');

  let list = allPresentations.filter(deck => {
    const matchesSearch = !searchQuery || 
      (deck.title && deck.title.toLowerCase().includes(searchQuery)) ||
      (deck.topic && deck.topic.toLowerCase().includes(searchQuery)) ||
      (deck.audience && deck.audience.toLowerCase().includes(searchQuery));
    const matchesFav = !showOnlyFavorites || Boolean(deck.isFavorite);
    return matchesSearch && matchesFav;
  });

  if (list.length === 0) {
    container.innerHTML = '';
    emptyState.classList.remove('hidden');
    return;
  }

  emptyState.classList.add('hidden');

  container.innerHTML = list.map(deck => {
    const id = deck._id || deck.id;
    const isFav = Boolean(deck.isFavorite);
    const formattedDate = new Date(deck.updatedAt || deck.createdAt).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });

    return `
      <div class="p-6 rounded-2xl bg-[#040919]/90 border border-white/[0.08] hover:border-blue-500/40 backdrop-blur-xl transition-all duration-300 group flex flex-col justify-between shadow-[0_10px_30px_rgba(0,0,0,0.5)]">
        <div>
          <!-- Header Tag -->
          <div class="flex items-center justify-between text-[10px] font-mono mb-3">
            <div class="flex items-center gap-2">
              <span class="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-400/30 uppercase font-semibold">
                ${deck.slideCount || 6} Slides
              </span>
              <button onclick="toggleFavorite('${id}')" aria-pressed="${isFav ? 'true' : 'false'}" aria-label="${escapeHtml(deck.title)} — ${isFav ? 'remove from favorites' : 'mark as favorite'}" class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] transition ${isFav ? 'text-amber-400' : 'text-slate-600 hover:text-amber-400'}" title="${isFav ? 'Remove Favorite' : 'Mark Favorite'}">
                <span aria-hidden="true">
                  ${isFav ? '★' : '☆'}
                </span>
              </button>
            </div>
            <span class="text-slate-500">${formattedDate}</span>
          </div>

          <!-- Title & Topic -->
          <h3 class="text-lg font-bold text-white group-hover:text-blue-300 transition-colors line-clamp-1">
            ${escapeHtml(deck.title)}
          </h3>
          <p class="text-xs text-slate-400 line-clamp-2 mt-1 leading-relaxed">
            ${escapeHtml(deck.topic)}
          </p>

          <!-- Parameters strip -->
          <div class="flex flex-wrap gap-1.5 mt-4 text-[10px] font-mono text-slate-400">
            <span class="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">${deck.audience || 'General'}</span>
            <span class="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">${deck.tone || 'Professional'}</span>
            <span class="px-2 py-0.5 rounded bg-white/[0.04] border border-white/[0.06]">${deck.theme || 'cyber-dark'}</span>
          </div>
        </div>

        <!-- Bottom Action Buttons (wraps on narrow screens so nothing overflows) -->
        <div class="mt-6 pt-4 border-t border-white/[0.06] flex flex-wrap items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-1.5">
            <a href="/editor?id=${id}" class="px-3.5 py-2 min-h-[44px] rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-[0_0_12px_rgba(37,99,235,0.4)] transition flex items-center gap-1">
              <span>Edit</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
            </a>
            <button onclick="duplicatePresentation('${id}')" class="px-3 py-2 min-h-[44px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium transition" title="Duplicate Deck">
              Copy
            </button>
            <a href="/api/presentations/${id}/export?format=pptx" download class="px-3 py-2 min-h-[44px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium transition" title="Download PPTX">
              PPTX
            </a>
            <a href="/api/presentations/${id}/export?format=html" download class="px-3 py-2 min-h-[44px] rounded-lg bg-white/[0.04] hover:bg-white/[0.08] text-slate-300 border border-white/[0.08] text-xs font-medium transition" title="Download HTML Deck">
              HTML
            </a>
          </div>

          <button onclick="deletePresentation('${id}')" class="inline-flex items-center justify-center min-w-[44px] min-h-[44px] p-2 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition ml-auto" title="Delete Presentation" aria-label="Delete presentation">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path></svg>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

async function toggleFavorite(id) {
  try {
    const res = await fetch(`/api/presentations/${id}/favorite`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      const item = allPresentations.find(p => (p._id || p.id) === id);
      if (item) item.isFavorite = data.isFavorite;
      renderFilteredPresentations();
      showToast(data.isFavorite ? 'Added to favorites ★' : 'Removed from favorites', 'info');
    }
  } catch (err) {
    showToast('Failed to toggle favorite', 'error');
  }
}

async function duplicatePresentation(id) {
  try {
    const res = await fetch(`/api/presentations/${id}/duplicate`, { method: 'POST' });
    const data = await res.json();
    if (data.success) {
      showToast('Deck duplicated successfully!', 'success');
      loadPresentations();
    } else {
      throw new Error(data.error);
    }
  } catch (err) {
    showToast('Failed to duplicate deck: ' + err.message, 'error');
  }
}

async function handleGenerate(e) {
  e.preventDefault();

  const topic = document.getElementById('topicInput').value.trim();
  const slideCount = document.getElementById('slideCount').value;
  const audience = document.getElementById('audienceInput').value;
  const tone = document.getElementById('toneInput').value;
  const theme = document.getElementById('themeInput').value;
  const model = document.getElementById('nvidiaModelSelect').value;

  if (!topic) {
    showToast('Please enter a presentation topic or prompt', 'error');
    return;
  }

  const overlay = document.getElementById('loadingOverlay');
  const statusText = document.getElementById('loadingStatusText');
  overlay.classList.remove('hidden');

  const steps = [
    'Connecting to Nvidia AI inference server...',
    'Synthesizing presentation structure & narrative...',
    'Generating data points, layouts, and speaker notes...',
    'Formatting high-fidelity 16:9 slides...',
    'Saving to your workspace...'
  ];

  let stepIdx = 0;
  const stepInterval = setInterval(() => {
    if (stepIdx < steps.length) {
      statusText.textContent = steps[stepIdx];
      stepIdx++;
    }
  }, 1200);

  try {
    const res = await fetch('/api/presentations/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ topic, slideCount, audience, tone, theme, model })
    });

    clearInterval(stepInterval);
    const data = await res.json();

    if (!data.success) {
      throw new Error(data.error || 'Synthesis failed');
    }

    const createdId = data.data._id || data.data.id;
    showToast('Presentation crafted successfully! Redirecting...', 'success');

    // Redirect to editor/viewer
    setTimeout(() => {
      window.location.href = `/editor?id=${createdId}`;
    }, 800);

  } catch (err) {
    clearInterval(stepInterval);
    overlay.classList.add('hidden');
    console.error('Generation error:', err);
    showToast(err.message || 'Error synthesizing deck', 'error');
  }
}

async function deletePresentation(id) {
  if (!confirm('Are you sure you want to delete this presentation?')) return;

  try {
    const res = await fetch(`/api/presentations/${id}`, { method: 'DELETE' });
    const data = await res.json();
    if (data.success) {
      showToast('Presentation deleted', 'info');
      loadPresentations();
    } else {
      showToast(data.error || 'Failed to delete', 'error');
    }
  } catch (err) {
    showToast('Failed to delete presentation', 'error');
  }
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

// Initial bootstrap
document.addEventListener('DOMContentLoaded', () => {
  checkHealth();
  loadPresentations();

  // Check if routed from /templates with a preloaded blueprint
  const savedBp = sessionStorage.getItem('sc_blueprint');
  if (savedBp) {
    try {
      const bp = JSON.parse(savedBp);
      sessionStorage.removeItem('sc_blueprint');
      if (bp.topic) setTopic(bp.topic);
      if (bp.count) document.getElementById('slideCount').value = bp.count;
      if (bp.audience) document.getElementById('audienceInput').value = bp.audience;
      if (bp.tone) document.getElementById('toneInput').value = bp.tone;
      if (bp.theme) document.getElementById('themeInput').value = bp.theme;
      showToast('Blueprint template loaded! Click Synthesize to build.', 'info');
      document.getElementById('generatorCard').scrollIntoView({ behavior: 'smooth' });
    } catch (e) {
      console.warn('Could not parse template blueprint', e);
    }
  }
});
