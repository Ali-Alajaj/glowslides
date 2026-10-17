// Shared site navigation behaviour (loaded by the canonical header on every page).
(function () {
  'use strict';

  var toggle = document.getElementById('mobileNavToggle');
  var panel = document.getElementById('mobileNavPanel');
  if (!toggle || !panel) return;

  function setOpen(open) {
    panel.classList.toggle('hidden', !open);
    toggle.setAttribute('aria-expanded', String(open));
    toggle.setAttribute('aria-label', open ? 'Close navigation menu' : 'Open navigation menu');
    var icon = toggle.querySelector('[data-icon="open"]');
    var close = toggle.querySelector('[data-icon="close"]');
    if (icon) icon.classList.toggle('hidden', open);
    if (close) close.classList.toggle('hidden', !open);
  }

  toggle.addEventListener('click', function (e) {
    e.preventDefault();
    setOpen(panel.classList.contains('hidden'));
  });

  // Collapse after tapping a link so the panel doesn't linger over the next page.
  panel.addEventListener('click', function (e) {
    if (e.target.closest && e.target.closest('a')) setOpen(false);
  });

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape' || e.key === 'Esc') setOpen(false);
  });

  // Never leave the panel open if the viewport grows into the desktop breakpoint.
  var mq = window.matchMedia('(min-width: 768px)');
  var onChange = function (ev) { if (ev.matches) setOpen(false); };
  if (mq.addEventListener) mq.addEventListener('change', onChange);
  else if (mq.addListener) mq.addListener(onChange);

  setOpen(false);
})();
