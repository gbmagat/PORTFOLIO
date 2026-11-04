/* Gabriel Magat Jr. — portfolio interactions (no dependencies) */
(function () {
  'use strict';

  var root = document.documentElement;
  var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  var forEach = function (list, fn) { Array.prototype.forEach.call(list, fn); };

  function readStore(key) {
    try { return localStorage.getItem(key); } catch (e) { return null; }
  }
  function writeStore(key, value) {
    try { localStorage.setItem(key, value); } catch (e) { /* storage unavailable */ }
  }

  /* ---------- Theme (day / night) ---------- */
  var themeBtn = document.querySelector('[data-theme-toggle]');
  var themeMeta = document.querySelector('meta[name="theme-color"]');
  var systemDark = window.matchMedia('(prefers-color-scheme: dark)');

  function applyTheme(theme) {
    root.setAttribute('data-theme', theme);
    if (themeBtn) {
      themeBtn.setAttribute('aria-label', theme === 'night' ? 'Switch to day theme' : 'Switch to night theme');
    }
    if (themeMeta) themeMeta.setAttribute('content', theme === 'night' ? '#121610' : '#e9e6d7');
  }

  applyTheme(root.getAttribute('data-theme') === 'night' ? 'night' : 'day');

  if (themeBtn) {
    themeBtn.addEventListener('click', function () {
      var next = root.getAttribute('data-theme') === 'night' ? 'day' : 'night';
      applyTheme(next);
      writeStore('theme', next);
    });
  }
  if (systemDark.addEventListener) {
    systemDark.addEventListener('change', function (e) {
      if (!readStore('theme')) applyTheme(e.matches ? 'night' : 'day');
    });
  }

  /* ---------- Mobile menu ---------- */
  var navToggle = document.querySelector('[data-nav-toggle]');
  var nav = document.getElementById('site-nav');

  function setMenu(open) {
    if (!navToggle) return;
    navToggle.setAttribute('aria-expanded', String(open));
    navToggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    document.body.classList.toggle('nav-open', open);
  }

  if (navToggle && nav) {
    navToggle.addEventListener('click', function () {
      setMenu(navToggle.getAttribute('aria-expanded') !== 'true');
    });
    nav.addEventListener('click', function (e) {
      if (e.target.closest('a')) setMenu(false);
    });
    document.addEventListener('click', function (e) {
      if (document.body.classList.contains('nav-open') && !nav.contains(e.target) && !navToggle.contains(e.target)) {
        setMenu(false);
      }
    });
    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && document.body.classList.contains('nav-open')) {
        setMenu(false);
        navToggle.focus();
      }
    });
    var wide = window.matchMedia('(min-width: 900px)');
    if (wide.addEventListener) wide.addEventListener('change', function (e) { if (e.matches) setMenu(false); });
  }

  /* ---------- Header border + section label (scrollspy) ---------- */
  var header = document.querySelector('.site-header');
  var sectionLabel = document.querySelector('[data-section-label]');
  var navLinks = document.querySelectorAll('.nav a[href^="#"]');
  var sections = document.querySelectorAll('main section[data-label]');

  function onScroll() {
    if (header) header.classList.toggle('is-scrolled', window.scrollY > 8);
  }
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  function setCurrent(section) {
    if (sectionLabel) sectionLabel.textContent = section.getAttribute('data-label');
    forEach(navLinks, function (a) {
      if (a.getAttribute('href') === '#' + section.id) a.setAttribute('aria-current', 'true');
      else a.removeAttribute('aria-current');
    });
  }

  if ('IntersectionObserver' in window && sections.length) {
    var spy = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) { if (entry.isIntersecting) setCurrent(entry.target); });
    }, { rootMargin: '-40% 0px -55% 0px' });
    forEach(sections, function (s) { spy.observe(s); });
  }

  /* ---------- Reveal on scroll ---------- */
  var revealEls = document.querySelectorAll('[data-reveal]');
  if (!reduceMotion.matches && 'IntersectionObserver' in window && revealEls.length) {
    forEach(revealEls, function (el) {
      if (el.tagName !== 'LI' || !el.parentElement) return;
      var items = Array.prototype.filter.call(el.parentElement.children, function (c) {
        return c.hasAttribute('data-reveal');
      });
      el.style.setProperty('--i', String(Math.min(items.indexOf(el), 5)));
    });
    root.classList.add('reveal-ready');
    var revealer = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          entry.target.classList.add('is-visible');
          revealer.unobserve(entry.target);
        }
      });
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    forEach(revealEls, function (el) { revealer.observe(el); });
  }

  /* ---------- Toast ---------- */
  var toastEl = document.querySelector('.toast');
  var toastText = toastEl ? toastEl.querySelector('[data-toast-text]') : null;
  var toastTimer;

  function toast(message) {
    if (!toastEl || !toastText) return;
    toastText.textContent = message;
    toastEl.classList.add('is-visible');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { toastEl.classList.remove('is-visible'); }, 3400);
  }

  /* ---------- Dino: click to hop and say something ---------- */
  var scene = document.querySelector('[data-dino]');
  if (scene) {
    var dino = scene.querySelector('.dino');
    var bubble = scene.querySelector('[data-bubble]');
    var lines = [
      'Hi! You’re online.',
      'Rawr means hello.',
      'Projects are below ↓',
      'No cacti were harmed.',
      'Thanks for stopping by!'
    ];
    var lineIndex = 0;
    var talkTimer;

    scene.addEventListener('click', function () {
      if (dino && !reduceMotion.matches) {
        dino.classList.remove('is-hopping');
        dino.getBoundingClientRect(); // restart the animation
        dino.classList.add('is-hopping');
      }
      if (bubble) {
        bubble.textContent = lines[lineIndex % lines.length];
        lineIndex += 1;
        scene.classList.add('is-talking');
        clearTimeout(talkTimer);
        talkTimer = setTimeout(function () { scene.classList.remove('is-talking'); }, 2400);
      }
    });
    if (dino) {
      dino.addEventListener('animationend', function (e) {
        if (e.animationName === 'hop') dino.classList.remove('is-hopping');
      });
    }
  }

  /* ---------- Local time in the Philippines ---------- */
  var timeEls = document.querySelectorAll('[data-local-time]');
  if (timeEls.length && window.Intl && Intl.DateTimeFormat) {
    try {
      var timeFormat = new Intl.DateTimeFormat('en-US', { hour: 'numeric', minute: '2-digit', timeZone: 'Asia/Manila' });
      var tick = function () {
        var now = timeFormat.format(new Date());
        forEach(timeEls, function (el) { el.textContent = now; });
      };
      tick();
      setInterval(tick, 30000);
    } catch (e) { /* time zone not supported: keep the "PHT" fallback */ }
  }

  /* ---------- Case study dialogs ---------- */
  var lastTrigger = null;

  function openCase(id, trigger) {
    var dialog = document.getElementById(id);
    if (!dialog || typeof dialog.showModal !== 'function') return false;
    lastTrigger = trigger || null;
    if (!dialog.open) dialog.showModal();
    var scroller = dialog.querySelector('.case__scroll');
    if (scroller) scroller.scrollTop = 0;
    if (history.replaceState) history.replaceState(null, '', '#' + id);
    return true;
  }

  forEach(document.querySelectorAll('dialog.case'), function (dialog) {
    // Clicking the dimmed backdrop closes the dialog
    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
    dialog.addEventListener('close', function () {
      if (history.replaceState && location.hash === '#' + dialog.id) {
        history.replaceState(null, '', location.pathname + location.search);
      }
      if (lastTrigger && document.body.contains(lastTrigger)) lastTrigger.focus();
      lastTrigger = null;
    });
  });

  if (/^#case-[\w-]+$/.test(location.hash)) openCase(location.hash.slice(1));

  /* ---------- Copy email ---------- */
  function copyText(text) {
    var done = function () { toast('Email copied: ' + text); };
    var fail = function () { toast('Couldn’t copy. Email: ' + text); };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, fail);
      return;
    }
    var area = document.createElement('textarea');
    area.value = text;
    area.setAttribute('readonly', '');
    area.style.position = 'fixed';
    area.style.opacity = '0';
    document.body.appendChild(area);
    area.select();
    try { if (document.execCommand('copy')) done(); else fail(); } catch (e) { fail(); }
    document.body.removeChild(area);
  }

  /* ---------- One click handler for buttons with data attributes ---------- */
  document.addEventListener('click', function (e) {
    var opener = e.target.closest('[data-open]');
    if (opener) {
      if (openCase(opener.getAttribute('data-open'), opener)) e.preventDefault();
      return;
    }
    var closer = e.target.closest('[data-close]');
    if (closer) {
      var dialog = closer.closest('dialog');
      if (dialog) dialog.close();
      return;
    }
    var copier = e.target.closest('[data-copy]');
    if (copier) copyText(copier.getAttribute('data-copy'));
  });

  /* ---------- Offline / online notice (a nod to the dino page) ---------- */
  window.addEventListener('offline', function () {
    toast('You’re offline — this page is already loaded, so keep browsing.');
  });
  window.addEventListener('online', function () { toast('Back online.'); });

  /* ---------- Contact terminal typing effect ---------- */
  var terminal = document.querySelector('[data-terminal]');
  if (terminal && !reduceMotion.matches && 'IntersectionObserver' in window) {
    terminal.classList.add('is-armed');
    var termObserver = new IntersectionObserver(function (entries) {
      if (entries[0].isIntersecting) {
        terminal.classList.add('is-live');
        termObserver.disconnect();
      }
    }, { threshold: 0.35 });
    termObserver.observe(terminal);
  }

  /* ---------- Résumé: print / save as PDF ---------- */
  forEach(document.querySelectorAll('[data-print]'), function (btn) {
    btn.addEventListener('click', function () { window.print(); });
  });

  /* ---------- Footer year ---------- */
  forEach(document.querySelectorAll('[data-year]'), function (el) {
    el.textContent = String(new Date().getFullYear());
  });
})();
