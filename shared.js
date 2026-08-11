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

  // Pin each .wip-thumb's height to its sibling .wip-content's rendered height,
  // so the image box always hugs the text block exactly (width follows via aspect-ratio).
  // Setting the thumb's height changes its width (via aspect-ratio), which changes
  // how much space is left for the text column, which can reflow the text and change
  // its height in turn — so this watches .wip-content itself and resyncs whenever its
  // size actually changes, instead of guessing how many passes convergence needs.
  document.querySelectorAll('.wip-item').forEach(function (item) {
    var thumb = item.querySelector('.wip-thumb');
    var content = item.querySelector('.wip-content');
    if (!thumb || !content || typeof ResizeObserver === 'undefined') return;
    var lastHeight = -1;
    var ro = new ResizeObserver(function (entries) {
      var h = entries[0].contentRect.height;
      if (Math.abs(h - lastHeight) < 0.5) return;
      lastHeight = h;
      var cs = getComputedStyle(thumb);
      var vPadding = parseFloat(cs.paddingTop) + parseFloat(cs.paddingBottom);
      thumb.style.height = Math.max(0, content.offsetHeight - vPadding) + 'px';
    });
    ro.observe(content);
  });
})();
