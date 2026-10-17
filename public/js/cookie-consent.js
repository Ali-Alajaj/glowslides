/**
 * GlowSlides Cookie Consent & Privacy Banner
 * Displays non-intrusive cookie banner compliant with GDPR/CCPA.
 */
(function() {
  const CONSENT_KEY = 'glowslides_cookie_consent';

  function initCookieConsent() {
    if (localStorage.getItem(CONSENT_KEY)) return;

    const banner = document.createElement('div');
    banner.id = 'cookieConsentBanner';
    banner.className = 'fixed bottom-4 left-4 right-4 sm:left-auto sm:right-6 sm:max-w-md z-50 p-4 rounded-2xl bg-[#040919]/95 border border-blue-500/30 backdrop-blur-xl shadow-[0_10px_40px_rgba(0,0,0,0.8)] text-xs text-slate-300 transition-all duration-300 transform translate-y-0';
    banner.innerHTML = `
      <div class="flex items-start gap-3">
        <div class="w-8 h-8 rounded-lg bg-blue-600/20 border border-blue-400/30 flex items-center justify-center text-blue-400 shrink-0">
          🍪
        </div>
        <div class="flex-1">
          <p class="font-semibold text-white">We respect your privacy</p>
          <p class="text-slate-400 text-[11px] mt-1 leading-relaxed">
            GlowSlides uses essential cookies and local storage to keep you logged in and safely preserve your presentation decks.
            Read our <a href="/privacy" class="text-blue-400 underline hover:text-blue-300">Privacy Policy</a>.
          </p>
          <div class="flex items-center gap-2 mt-3">
            <button id="acceptCookiesBtn" class="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs transition">
              Accept All
            </button>
            <button id="declineCookiesBtn" class="px-3 py-1.5 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] text-slate-300 text-xs transition">
              Essential Only
            </button>
          </div>
        </div>
      </div>
    `;

    document.body.appendChild(banner);

    document.getElementById('acceptCookiesBtn').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'all');
      banner.remove();
    });

    document.getElementById('declineCookiesBtn').addEventListener('click', () => {
      localStorage.setItem(CONSENT_KEY, 'essential');
      banner.remove();
    });
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCookieConsent);
  } else {
    initCookieConsent();
  }
})();
