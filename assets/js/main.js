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
  function openCase(id, trigger) {
    var dialog = document.getElementById(id);
    if (!dialog || typeof dialog.showModal !== 'function') return false;
    dialog.returnFocusTo = trigger || null; // each dialog remembers its own opener
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
      var opener = dialog.returnFocusTo;
      dialog.returnFocusTo = null;
      if (opener && document.body.contains(opener)) opener.focus();
    });
  });

  if (/^#case-[\w-]+$/.test(location.hash)) openCase(location.hash.slice(1));

  /* ---------- Copy email ---------- */
  function copyText(text) {
    var done = function () { toast('Email copied: ' + text); };
    var fail = function () { toast('Couldn’t copy. Email: ' + text); };
    // Older method, used when the Clipboard API is missing or refuses
    var legacyCopy = function () {
      var area = document.createElement('textarea');
      area.value = text;
      area.setAttribute('readonly', '');
      area.style.position = 'fixed';
      area.style.opacity = '0';
      document.body.appendChild(area);
      area.select();
      var ok = false;
      try { ok = document.execCommand('copy'); } catch (e) { ok = false; }
      document.body.removeChild(area);
      if (ok) done(); else fail();
    };
    if (navigator.clipboard && window.isSecureContext) {
      navigator.clipboard.writeText(text).then(done, legacyCopy);
    } else {
      legacyCopy();
    }
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

  /* ---------- The road so far: put the dino on the current year ---------- */
  var thisYear = new Date().getFullYear();
  forEach(document.querySelectorAll('.road__stop[data-road-year]'), function (stop) {
    var year = parseInt(stop.getAttribute('data-road-year'), 10);
    stop.classList.toggle('is-past', year < thisYear);
    stop.classList.toggle('is-now', year === thisYear);
    stop.classList.toggle('is-next', year > thisYear);
  });

  /* ---------- Divider: seamless scrolling row (data-marquee = speed in px/s) ---------- */
  forEach(document.querySelectorAll('[data-marquee]'), function (row) {
    var track = row.firstElementChild;
    if (!track || reduceMotion.matches) return;
    var speed = parseFloat(row.getAttribute('data-marquee')) || 40;
    var originals = Array.prototype.slice.call(track.children);
    var minWidth = Math.max(window.innerWidth, (window.screen && screen.width) || 0, 1280) * 1.1;
    for (var n = 0; track.scrollWidth < minWidth && n < 6; n++) {
      originals.forEach(function (li) { track.appendChild(li.cloneNode(true)); });
    }
    row.appendChild(track.cloneNode(true)); // second copy makes the loop seamless
    row.style.setProperty('--marquee-time', Math.round(track.scrollWidth / speed) + 's');
    row.classList.add('is-ready');
  });

  /* ---------- Chat with Gabriel ---------- */
  // To deliver chat messages straight to Gabriel's inbox, paste a free Web3Forms access key below
  // (create one at https://web3forms.com with gabrielmagatjr.cs@gmail.com). While it is empty,
  // the chat opens the visitor's own email app with the message ready to send.
  var CHAT = {
    web3formsKey: '',
    email: 'gabrielmagatjr.cs@gmail.com',
    linkedin: 'https://www.linkedin.com/in/gabriel-magat-jr/'
  };

  var chatRoot = document.querySelector('[data-chat]');
  if (chatRoot) {
    var chatPanel = chatRoot.querySelector('.chat__panel');
    var chatToggle = chatRoot.querySelector('[data-chat-toggle]');
    var chatBadge = chatRoot.querySelector('[data-chat-badge]');
    var chatLog = chatRoot.querySelector('[data-chat-log]');
    var chatChips = chatRoot.querySelector('[data-chat-chips]');
    var chatForm = chatRoot.querySelector('[data-chat-form]');
    var chatInput = chatRoot.querySelector('[data-chat-input]');
    var chatTrap = chatRoot.querySelector('[name="botcheck"]');
    var chatNote = chatRoot.querySelector('[data-chat-note]');
    var chatClose = chatRoot.querySelector('[data-chat-close]');
    var finePointer = window.matchMedia('(pointer: fine)');

    var chatState = 'menu'; // menu → name → email → message → sending
    var draft = { name: '', email: '', message: '' };
    var greeted = false;
    var busy = false;

    var MENU = [
      ['What does Gabriel do?', 'about'],
      ['Show me projects', 'projects'],
      ['Is he available?', 'available'],
      ['His résumé', 'resume'],
      ['Message Gabriel', 'message']
    ];
    var CANCEL = [['Cancel', 'cancel']]; // offered at every step of writing a message

    if (chatNote) {
      chatNote.textContent = CHAT.web3formsKey
        ? 'Messages are delivered to Gabriel’s email.'
        : 'Messages open in your email app, addressed to Gabriel.';
    }
    if (chatBadge && readStore('chatSeen') === '1') chatBadge.hidden = true;

    var addText = function (el, str) { el.appendChild(document.createTextNode(str)); };
    var addLink = function (el, label, href, external, className) {
      var a = document.createElement('a');
      a.href = href;
      a.textContent = label;
      if (className) a.className = className;
      if (external) { a.target = '_blank'; a.rel = 'noopener'; }
      el.appendChild(a);
      return a;
    };
    var linkRow = function (el) {
      var row = document.createElement('div');
      row.className = 'msg__links';
      el.appendChild(row);
      return row;
    };

    function bubble(from, content) {
      var el = document.createElement('div');
      el.className = 'msg msg--' + from;
      if (typeof content === 'function') content(el); else addText(el, content);
      chatLog.appendChild(el);
      chatLog.scrollTop = chatLog.scrollHeight;
      return el;
    }

    // Dino "types" for a moment, then replies
    function say(content, delay) {
      return new Promise(function (resolve) {
        var typing = bubble('bot', function (el) {
          el.setAttribute('aria-hidden', 'true');
          el.innerHTML = '<span class="typing"><i></i><i></i><i></i></span>';
        });
        setTimeout(function () {
          chatLog.removeChild(typing);
          resolve(bubble('bot', content));
        }, reduceMotion.matches ? 0 : (delay || 650));
      });
    }

    function setChips(list) {
      chatChips.innerHTML = '';
      (list || []).forEach(function (item) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'chip';
        b.textContent = item[0];
        b.addEventListener('click', function () {
          if (busy) return;
          bubble('me', item[0]);
          run(item[1]);
        });
        chatChips.appendChild(b);
      });
    }

    // field: 'name' | 'email' | undefined — sets the right phone keyboard and autofill for each step
    function ready(chips, placeholder, field) {
      busy = false;
      setChips(chips);
      chatInput.placeholder = placeholder || 'Type a message…';
      chatInput.setAttribute('inputmode', field === 'email' ? 'email' : 'text');
      chatInput.setAttribute('autocomplete', field === 'name' ? 'name' : field === 'email' ? 'email' : 'off');
      chatInput.setAttribute('autocapitalize', field === 'email' ? 'off' : 'sentences');
      chatLog.scrollTop = chatLog.scrollHeight; // chips take space, so keep the newest reply in view
    }

    function run(action) {
      busy = true;
      setChips([]);
      if (action === 'message') { startMessage(''); return; }
      if (action === 'cancel') {
        chatState = 'menu';
        draft = { name: '', email: '', message: '' };
        say('No problem — nothing was sent. Anything else?').then(function () { ready(MENU); });
        return;
      }
      var replies = {
        about: 'Gabriel is a fourth-year Computer Science student at Holy Angel University and a freelance web developer since 2025. He builds full-stack web apps with React, Node.js, and SQL, then deploys them on Linux servers.',
        stack: 'His main tools are React, Next.js, TypeScript, Node.js, Express, MySQL, PostgreSQL, and SQLite — plus Linux, nginx, AWS, and Docker for deployment.',
        available: 'He’s open to opportunities and freelance web projects. Leave him a message here and he’ll get back to you by email.',
        hello: 'Hello! What would you like to know about Gabriel?',
        projects: function (el) {
          addText(el, 'Here are his featured projects. Tap one to read its case study:');
          var row = linkRow(el);
          [['JobFinder', 'case-jobfinder'], ['Our Places', 'case-ourplaces'], ['It’s a Match', 'case-itsamatch'], ['MOPAC', 'case-mopac']].forEach(function (p) {
            var b = document.createElement('button');
            b.type = 'button';
            b.className = 'msg__link';
            b.textContent = p[0];
            b.setAttribute('data-open', p[1]);
            row.appendChild(b);
          });
        },
        resume: function (el) {
          addText(el, 'Here’s his résumé — you can save it as a PDF from that page.');
          addLink(linkRow(el), 'Open résumé', 'resume.html', false, 'msg__link');
        },
        contact: function (el) {
          addText(el, 'You can message him right here, email ');
          addLink(el, CHAT.email, 'mailto:' + CHAT.email);
          addText(el, ', or connect on ');
          addLink(el, 'LinkedIn', CHAT.linkedin, true);
          addText(el, '.');
        }
      };
      var next = action === 'available'
        ? [['Message Gabriel', 'message'], ['Show me projects', 'projects'], ['His résumé', 'resume']]
        : MENU;
      say(replies[action] || replies.hello).then(function () { ready(next); });
    }

    function startMessage(prefill) {
      busy = true;
      setChips([]);
      draft = { name: '', email: '', message: prefill || '' };
      chatState = 'name';
      say(prefill ? 'I’ll pass that on to Gabriel. First, what’s your name?' : 'Sure! What’s your name?')
        .then(function () { ready(CANCEL, 'Your name', 'name'); });
    }

    function onName(value) {
      draft.name = value.slice(0, 80);
      chatState = 'email';
      say('Nice to meet you, ' + draft.name + '! What’s your email address, so Gabriel can reply?')
        .then(function () { ready(CANCEL, 'you@example.com', 'email'); });
    }

    function onEmail(value) {
      if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(value)) {
        say('Hmm, that doesn’t look like an email address. Could you check it?')
          .then(function () { ready(CANCEL, 'you@example.com', 'email'); });
        return;
      }
      draft.email = value.slice(0, 120);
      if (draft.message) { send(); return; }
      chatState = 'message';
      say('Got it. What would you like to tell Gabriel?')
        .then(function () { ready(CANCEL, 'Your message'); });
    }

    function mailtoHref() {
      var subject = 'Hello from your portfolio — ' + draft.name;
      var body = draft.message + '\n\n— ' + draft.name + ' (' + draft.email + ')';
      return 'mailto:' + CHAT.email + '?subject=' + encodeURIComponent(subject) + '&body=' + encodeURIComponent(body);
    }

    function finish(content) {
      say(content).then(function () {
        chatState = 'menu';
        draft = { name: '', email: '', message: '' };
        ready(MENU);
      });
    }

    function handOffToEmail(failed) {
      var href = mailtoHref();
      finish(function (el) {
        addText(el, failed ? 'I couldn’t send that just now. ' : 'Almost done! ');
        addText(el, 'Tap below to open your email app with your message ready, then press send.');
        addLink(linkRow(el), 'Open my email app', href, false, 'msg__link msg__link--strong');
      });
    }

    function send() {
      chatState = 'sending';
      if (chatTrap && chatTrap.checked) { finish('Thanks! Your message is on its way.'); return; }
      if (!CHAT.web3formsKey || !window.fetch) { handOffToEmail(false); return; }
      var replyTo = draft.email;
      say('Sending your message…', 300).then(function () {
        return fetch('https://api.web3forms.com/submit', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            access_key: CHAT.web3formsKey,
            subject: 'Portfolio chat from ' + draft.name,
            from_name: 'Portfolio chat',
            name: draft.name,
            email: draft.email,
            message: draft.message
          })
        }).then(function (res) { return res.json(); });
      }).then(function (data) {
        if (!data || !data.success) throw new Error('not sent');
        finish('Sent! ✓ Gabriel will reply to ' + replyTo + '. Thanks for reaching out.');
      }).catch(function () { handOffToEmail(true); });
    }

    // Short questions get an instant answer; anything else is passed on to Gabriel
    function route(value) {
      if (value.split(/\s+/).length <= 5) {
        if (/r[eé]sum|\bcv\b/i.test(value)) return run('resume');
        if (/project|portfolio|thesis|jobfinder/i.test(value)) return run('projects');
        if (/skill|stack|tech|language|framework|\btools?\b/i.test(value)) return run('stack');
        if (/hire|hiring|availab|freelance|intern|opportunit|\bjobs?\b/i.test(value)) return run('available');
        if (/contact|e-?mail|linkedin|github|reach/i.test(value)) return run('contact');
        if (/^(hi|hello|hey|yo|kumusta|musta|good (morning|afternoon|evening))\b/i.test(value)) return run('hello');
      }
      startMessage(value);
    }

    function autosize() {
      chatInput.style.height = 'auto';
      chatInput.style.height = Math.min(chatInput.scrollHeight + 3, 120) + 'px';
      chatInput.style.overflowY = chatInput.scrollHeight > 120 ? 'auto' : 'hidden';
    }

    chatInput.addEventListener('input', autosize);
    chatInput.addEventListener('keydown', function (e) {
      if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
        e.preventDefault();
        if (chatForm.requestSubmit) chatForm.requestSubmit();
        else chatForm.dispatchEvent(new Event('submit', { cancelable: true }));
      }
    });
    chatForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var value = chatInput.value.trim();
      if (!value || busy) return;
      chatInput.value = '';
      autosize();
      bubble('me', value);
      busy = true;
      if (chatState === 'name') onName(value);
      else if (chatState === 'email') onEmail(value);
      else if (chatState === 'message') { draft.message = value.slice(0, 2000); send(); }
      else route(value);
    });

    function openChat() {
      if (!chatPanel.hidden) return;
      chatPanel.hidden = false;
      chatToggle.setAttribute('aria-expanded', 'true');
      root.classList.add('chat-open');
      if (chatBadge) chatBadge.hidden = true;
      writeStore('chatSeen', '1');
      if (!greeted) {
        greeted = true;
        busy = true;
        say('Hi! I’m Dino — I look after Gabriel’s site.', 500)
          .then(function () { return say('Ask me something below, or leave Gabriel a message and he’ll reply by email.', 700); })
          .then(function () { ready(MENU); });
      }
      // Mouse users can type right away; on touch screens focus the close button so the keyboard stays down
      setTimeout(function () { (finePointer.matches ? chatInput : chatClose || chatInput).focus(); }, 60);
    }

    function closeChat(returnFocus) {
      if (chatPanel.hidden) return;
      chatPanel.hidden = true;
      chatToggle.setAttribute('aria-expanded', 'false');
      root.classList.remove('chat-open');
      if (returnFocus) chatToggle.focus();
    }

    chatToggle.addEventListener('click', function () {
      if (chatPanel.hidden) openChat(); else closeChat(false);
    });
    if (chatClose) chatClose.addEventListener('click', function () { closeChat(true); });
    document.addEventListener('keydown', function (e) {
      // Esc closes the chat, unless a case study is open on top of it (Esc closes that first)
      if (e.key === 'Escape' && !chatPanel.hidden && !document.querySelector('dialog[open]')) closeChat(true);
    });
    document.addEventListener('click', function (e) {
      if (e.target.closest('[data-chat-open]')) openChat();
    });
    // A link to .../#chat opens the chat straight away
    if (location.hash === '#chat') openChat();
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
