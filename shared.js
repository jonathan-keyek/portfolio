(function () {
  // Reveal animation
  var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
  els.forEach(function (el, i) {
    el.style.animationDelay = (i * 60) + 'ms';
    el.classList.add('reveal');
  });

  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  var favicon = document.getElementById('favicon');
  var updateFavicon = function (isDark) {
    if (!favicon) return;
    var base = favicon.getAttribute('href').replace(/jk-logo-(black|white)\.png$/, '');
    favicon.setAttribute('href', base + (isDark ? 'jk-logo-white.png' : 'jk-logo-black.png'));
  };
  if (themeBtn) {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      themeBtn.setAttribute('aria-pressed', 'true');
      themeBtn.setAttribute('aria-label', 'Switch to light mode');
      themeBtn.setAttribute('data-tooltip', 'Switch to light mode');
    }
    updateFavicon(saved === 'dark');
    themeBtn.addEventListener('click', function () {
      var isDark = document.documentElement.classList.toggle('dark');
      var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      themeBtn.setAttribute('aria-label', label);
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeBtn.setAttribute('data-tooltip', label);
      updateFavicon(isDark);
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

  // WIP thumbnail lightbox
  var overlay = document.getElementById('lightbox-overlay');
  var lightboxImg = document.getElementById('lightbox-img');
  var lightboxClose = document.getElementById('lightbox-close');
  if (overlay && lightboxImg) {
    var openLightbox = function (src, alt) {
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      overlay.classList.add('open');
      document.body.style.overflow = 'hidden';
    };
    var closeLightbox = function () {
      overlay.classList.remove('open');
      document.body.style.overflow = '';
    };
    document.querySelectorAll('.wip-thumb img').forEach(function (img) {
      img.addEventListener('click', function () {
        openLightbox(img.src, img.alt);
      });
    });
    lightboxClose.addEventListener('click', closeLightbox);
    overlay.addEventListener('click', function (e) {
      if (e.target === overlay) closeLightbox();
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && overlay.classList.contains('open')) closeLightbox();
    });
  }
})();
