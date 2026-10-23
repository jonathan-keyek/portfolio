(function () {
  // Reveal animation
  // Only what's on screen gets the staggered refraction reveal; anything
  // below the fold settles immediately with a plain fade (no filter cost).
  var els = [].slice.call(document.querySelectorAll('[data-reveal]'));
  var stagger = 0;
  els.forEach(function (el) {
    // Rows tucked inside the collapsed "Show more" are clipped, so they
    // shouldn't take a stagger slot (that read as a pause mid-cascade).
    var hidden = el.closest('.more-wrap:not(.open)');
    if (!hidden && el.getBoundingClientRect().top < innerHeight) {
      el.style.animationDelay = (stagger++ * 60) + 'ms';
    } else {
      el.classList.add('reveal-lite');
    }
    el.classList.add('reveal');
    // The contact rows' divider lives on the wrapping link, not the row, so
    // it needs revealing in step or it shows before the content does.
    var wrap = el.parentElement;
    if (wrap && wrap.classList.contains('contact-rowlink')) {
      wrap.style.animationDelay = el.style.animationDelay;
      wrap.classList.add('reveal-border');
    }
  });

  // Theme toggle
  var themeBtn = document.getElementById('theme-toggle');
  var themeRow = document.querySelector('.theme-toggle-row');
  // Tapping anywhere on the row (icon, padding) flips the theme, not just the switch.
  if (themeBtn && themeRow) themeRow.addEventListener('click', function (e) {
    if (e.target !== themeBtn) themeBtn.click();
  });
  // The browser's own backing color (from color-scheme) peeks through at the
  // window's rounded edges, so it must match whatever theme is at the edge.
  // It's driven separately from .dark so the sweep can flip it mid-way.
  var schemeMeta = document.querySelector('meta[name="color-scheme"]');
  var syncScheme = function (isDark) {
    document.documentElement.classList.toggle('scheme-dark', isDark);
    if (schemeMeta) schemeMeta.setAttribute('content', isDark ? 'dark' : 'light');
  };
  // Sweep speed in px/ms (average): bigger screens just take longer.
  var SWEEP_SPEED = 2.5;
  // The sweep's easing, cubic-bezier(.65, 0, .35, 1) — must match the CSS.
  // Given how far along the edge is (0..1), returns how far along in time
  // it gets there, so content can refract exactly as the edge arrives.
  var sweepTimeAt = function (p) {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    var lo = 0, hi = 1, u = p;
    for (var i = 0; i < 24; i++) {          // y(u) = 3u² − 2u³ (y1=0, y2=1)
      u = (lo + hi) / 2;
      if (3 * u * u - 2 * u * u * u < p) lo = u; else hi = u;
    }
    var m = 1 - u;                          // x(u) with x1=.65, x2=.35
    return 3 * m * m * u * .65 + 3 * m * u * u * .35 + u * u * u;
  };
  var SWEEP_TAIL = 320; // must match the band depth used in the CSS masks

  // The first time Chrome draws a masked layer or a blur/drop-shadow filter
  // it compiles shaders, which would stall the first ripple. Draw the same
  // kinds of effects once, nearly invisible, while the page is idle.
  if (themeBtn && window.requestAnimationFrame) {
    (window.requestIdleCallback || function (fn) { setTimeout(fn, 300); })(function () {
      var warm = document.createElement('div');
      warm.setAttribute('aria-hidden', 'true');
      warm.textContent = 'Aa';
      warm.style.cssText = 'position:fixed;left:0;top:0;pointer-events:none;opacity:.01;' +
        'filter:blur(3px) drop-shadow(-4px 0 0 rgb(255 40 90 / .32)) drop-shadow(4px 0 0 rgb(40 120 255 / .32));' +
        'mask-image:radial-gradient(circle, #000 40%, transparent 60%);' +
        '-webkit-mask-image:radial-gradient(circle, #000 40%, transparent 60%)';
      document.body.appendChild(warm);
      requestAnimationFrame(function () {
        requestAnimationFrame(function () { warm.remove(); });
      });
    });
  }

  // The theme switch reuses the load-in's refraction (blur + red/blue split
  // settling into focus) on each on-screen block, timed so it starts as the
  // ripple's edge reaches that block. Blocks stay fully visible — only the
  // refraction replays, not the rise/fade.
  var refractOnSweep = function (x, y, total, dur) {
    var started = [];
    els.forEach(function (el) {
      // The photo sits outside the switch (always visible, never masked), so
      // it uses a variant that stays sharp through its delay and ramps in.
      var isAvatar = el.classList.contains('avatar-wrap');
      var b = el.getBoundingClientRect();
      if (b.bottom < 0 || b.top > innerHeight || !b.width) return;
      var cx = Math.max(b.left, Math.min(x, b.right));
      var cy = Math.max(b.top, Math.min(y, b.bottom));
      // The reveal edge trails the sweep radius by ~90px (mask midpoint).
      var delay = Math.round(dur * sweepTimeAt((Math.hypot(x - cx, y - cy) + 90) / total));
      el.style.animation = 'none';
      void el.offsetWidth; // restart even if it ran last switch
      // (Its blur ramps up over the first 10%, so start it a touch early to
      // peak as the edge arrives.)
      if (isAvatar) delay = Math.max(0, delay - 60);
      // fadeUp only restores the load-in's end state (visible, in place);
      // the -1ms delay starts it already finished, so no frame ever renders
      // its opacity-0 / 14px-down first keyframe.
      el.style.animation = 'fadeUp 1ms -1ms both, ' + (isAvatar ? 'refractInAvatar' : 'refractIn') +
        ' 800ms linear ' + delay + 'ms both';
      // The avatar is on screen during the hold (nothing masks it), so its
      // 1ms fadeUp must run, not sit paused at opacity 0 (it'd vanish, then
      // pop back). Only its refraction is held with the rest.
      started = started.concat(el.getAnimations().filter(function (a) {
        return !isAvatar || a.animationName === 'refractInAvatar';
      }));
    });
    return started;
  };

  if (themeBtn) {
    var saved = localStorage.getItem('theme');
    if (saved === 'dark') {
      document.documentElement.classList.add('dark');
      syncScheme(true);
      themeBtn.setAttribute('aria-pressed', 'true');
      themeBtn.setAttribute('aria-label', 'Switch to light mode');
      themeBtn.setAttribute('data-tooltip', 'Switch to light mode');
    }
    var applyTheme = function (withScheme) {
      var isDark = document.documentElement.classList.toggle('dark');
      var label = isDark ? 'Switch to light mode' : 'Switch to dark mode';
      localStorage.setItem('theme', isDark ? 'dark' : 'light');
      if (withScheme) syncScheme(isDark);
      themeBtn.setAttribute('aria-label', label);
      themeBtn.setAttribute('aria-pressed', isDark ? 'true' : 'false');
      themeBtn.setAttribute('data-tooltip', label);
      return isDark;
    };
    var sweeping = false;
    themeBtn.addEventListener('click', function () {
      if (sweeping) return;
      var reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
      if (!document.startViewTransition || reduce) { applyTheme(true); return; }
      sweeping = true;
      document.documentElement.classList.add('vt-lock'); // no scrolling mid-sweep
      // Ripple the new theme outward from the toggle (eased in and out); the
      // content refracts into focus as the edge passes (refractOnSweep).
      var r = themeBtn.getBoundingClientRect();
      var x = r.left + r.width / 2;
      var y = r.top + r.height / 2;
      var end = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
      var total = end + SWEEP_TAIL;
      var dur = Math.round(total / SWEEP_SPEED);
      var root = document.documentElement;
      root.style.setProperty('--vt-x', x + 'px');
      root.style.setProperty('--vt-y', y + 'px');
      root.style.setProperty('--vt-r-end', end + 'px');
      root.style.setProperty('--vt-dur', dur + 'ms');

      var isDark, flip;
      var vt = document.startViewTransition(function () { isDark = applyTheme(false); });
      // The first switch into a theme makes Chrome rasterize the page in
      // its new colors (text, images) from scratch, a one-off hitch of up to
      // ~70ms. Hold the ripple at its starting point until frames come back
      // fast, so that hitch lands before anything moves instead of mid-ripple.
      vt.ready.then(function () {
        var anims = document.getAnimations().filter(function (a) {
          return a.animationName === 'vt-sweep';
        });
        // Start the content refraction too, held at its blurred first frame,
        // so that state is rasterized up front along with the new theme.
        anims = anims.concat(refractOnSweep(x, y, total, dur));
        anims.forEach(function (a) { a.pause(); });
        // A fully masked layer isn't drawn at all, so show the whole new
        // theme at 1% (imperceptible) while holding, forcing it to raster.
        root.classList.add('vt-prime');
        var start = performance.now(), last = start, smooth = 0;
        var go = function () {
          root.classList.remove('vt-prime');
          anims.forEach(function (a) { a.play(); });
          // Flip the backing color once the sweep is roughly halfway across
          // the edges, rather than instantly (which outlined the old theme
          // in white).
          flip = setTimeout(function () { syncScheme(isDark); }, dur * 0.5);
        };
        var wait = function (now) {
          smooth = now - last < 20 ? smooth + 1 : 0;
          last = now;
          // Rasterizing runs off the main thread, so fast frames alone don't
          // prove it's done: also hold a minimum 80ms (not perceptible as
          // lag on a click).
          if ((smooth >= 3 && now - start > 80) || now - start > 300) go();
          else requestAnimationFrame(wait);
        };
        requestAnimationFrame(wait);
      }, function () {});
      // Background tabs pause the sweep; don't leave it hanging.
      var bail = setTimeout(function () {
        if (vt.skipTransition) vt.skipTransition();
      }, dur + 1800);
      vt.finished.finally(function () {
        clearTimeout(flip);
        clearTimeout(bail);
        syncScheme(root.classList.contains('dark'));
        root.classList.remove('vt-prime');
        document.documentElement.classList.remove('vt-lock');
        sweeping = false;
      });
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
