(function () {
  // Reveal animation
  var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
  els.forEach(function (el, i) {
    el.style.animationDelay = (i * 60) + 'ms';
    el.classList.add('reveal');
  });

  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  if (themeBtn) {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      themeBtn.setAttribute('aria-pressed', 'true');
      themeBtn.setAttribute('aria-label', 'Switch to light mode');
      themeBtn.setAttribute('data-tooltip', 'Switch to light mode');
    }
    themeBtn.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeBtn.setAttribute('aria-label', label);
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeBtn.setAttribute('data-tooltip', label);
    });
  }

  // Pause toggle
  var pauseBtn = document.getElementById('pause-toggle');
  if (pauseBtn) {
    pauseBtn.addEventListener('click', function () {
      var paused = document.documentElement.classList.toggle('paused');
      document.querySelectorAll('svg').forEach(function (s) {
        paused ? s.pauseAnimations() : s.unpauseAnimations();
      });
      pauseBtn.setAttribute('aria-pressed', paused ? 'true' : 'false');
      pauseBtn.setAttribute('data-tooltip', paused ? 'Resume animations' : 'Pause animations');
      pauseBtn.setAttribute('aria-label', paused ? 'Resume animations' : 'Pause animations');
    });
  }

  // Details expand/collapse animation
  // Wrap .dd-body children in an inner div so grid-template-rows trick works
  document.querySelectorAll('.dd-body').forEach(function (body) {
    var inner = document.createElement('div');
    while (body.firstChild) inner.appendChild(body.firstChild);
    body.appendChild(inner);
  });

  document.querySelectorAll('details').forEach(function (det) {
    det.addEventListener('click', function (e) {
      if (!e.target.closest('summary')) return;
      if (det.open) {
        e.preventDefault();
        det.setAttribute('data-closing', '');
        var body = det.querySelector('.dd-body');
        if (body) {
          body.addEventListener('transitionend', function h() {
            det.removeAttribute('open');
            det.removeAttribute('data-closing');
            body.removeEventListener('transitionend', h);
          }, { once: true });
        } else {
          det.removeAttribute('open');
        }
      }
    });
  });

  // Grow .wip-thumb beyond its default max-width when the text column needs
  // more vertical room than the image naturally provides, so there's always
  // at least the CSS-defined gap between the icon row and the body text.
  // (aspect-ratio: 3414 / 2062, box-sizing: content-box, 12px padding each side)
  document.querySelectorAll('.wip-item').forEach(function (item) {
    var thumb = item.querySelector('.wip-thumb');
    var content = item.querySelector('.wip-content');
    if (!thumb || !content || typeof ResizeObserver === 'undefined') return;
    if (window.matchMedia('(max-width: 600px)').matches) return; // mobile stacks; no growth needed
    var RATIO = 3414 / 2062;
    var PADDING = 24; // 12px top + 12px bottom (content-box)
    var lastContentH = -1;
    var ro = new ResizeObserver(function () {
      var contentH = content.offsetHeight;
      if (Math.abs(contentH - lastContentH) < 0.5) return;
      lastContentH = contentH;
      // Always measure against the CSS-default (natural) size, not our own
      // prior override, so this can't feed back on itself and oscillate.
      thumb.style.width = '';
      thumb.style.maxWidth = '';
      var naturalH = thumb.getBoundingClientRect().height;
      if (contentH > naturalH) {
        var neededContentBoxW = (contentH - PADDING) * RATIO;
        thumb.style.width = neededContentBoxW + 'px';
        thumb.style.maxWidth = 'none';
      }
    });
    ro.observe(content);
  });
})();
