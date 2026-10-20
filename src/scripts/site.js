/* site.js - Icare Clinic "Iris Noir" runtime (FOUNDATION lane). Vanilla, no dependencies, loaded with defer.
   Everything degrades: without JS every section is visible, every link works, details/summary still open. */
(function () {
  'use strict';
  var d = document, w = window, root = d.documentElement;
  w.__icare = true;
  var mq = function (q) { return w.matchMedia ? w.matchMedia(q).matches : false; };
  var reduce = mq('(prefers-reduced-motion: reduce)');
  var fine = mq('(hover: hover) and (pointer: fine)');
  var $ = function (s, c) { return (c || d).querySelector(s); };
  var $$ = function (s, c) { return Array.prototype.slice.call((c || d).querySelectorAll(s)); };
  var raf = w.requestAnimationFrame || function (f) { return setTimeout(f, 16); };

  /* ---------- current year ---------- */
  $$('[data-year]').forEach(function (el) { el.textContent = String(new Date().getFullYear()); });

  /* ---------- today's hours (topbar chip + footer table), on Houston time ---------- */
  (function () {
    var day = '';
    try { day = new Intl.DateTimeFormat('en-US', { weekday: 'long', timeZone: 'America/Chicago' }).format(new Date()); }
    catch (e) { day = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'][new Date().getDay()]; }
    $$('[data-today]').forEach(function (el) {
      var list = [];
      try { list = JSON.parse(el.getAttribute('data-today') || '[]'); } catch (e) { list = []; }
      var hit = list.filter(function (h) { return h.day === day; })[0];
      var t = $('.topbar__today', el);
      if (hit && t) { t.textContent = 'Today: ' + hit.time; el.setAttribute('title', day + ': ' + hit.time); }
    });
    $$('tr[data-day]').forEach(function (tr) { if (tr.getAttribute('data-day') === day) tr.classList.add('is-today'); });
  })();

  /* ---------- header compacts on scroll ---------- */
  var hdr = $('[data-hdr]');
  var lastY = -1;
  function onScroll() {
    var y = w.scrollY || w.pageYOffset || 0;
    if (hdr && (lastY < 0 || (y > 40) !== (lastY > 40))) hdr.classList.toggle('is-compact', y > 40);
    lastY = y;
  }
  w.addEventListener('scroll', onScroll, { passive: true }); onScroll();

  /* ---------- mega menus: hover intent + gap bridge + close delay, click, keyboard ---------- */
  var megas = $$('[data-mega]');
  function setMega(li, open, focusBack) {
    var t = $('.nav__toggle', li);
    li.classList.toggle('is-open', open);
    if (t) t.setAttribute('aria-expanded', open ? 'true' : 'false');
    if (!open && focusBack && t) t.focus();
  }
  function closeAll(except) { megas.forEach(function (li) { if (li !== except && li.classList.contains('is-open')) setMega(li, false); }); }
  megas.forEach(function (li) {
    var t = $('.nav__toggle', li), openT = 0, closeT = 0;
    if (fine) {
      li.addEventListener('pointerenter', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        clearTimeout(closeT); clearTimeout(openT);
        openT = setTimeout(function () { closeAll(li); setMega(li, true); }, li.classList.contains('is-open') ? 0 : 110);
      });
      li.addEventListener('pointerleave', function (e) {
        if (e.pointerType && e.pointerType !== 'mouse') return;
        clearTimeout(openT); clearTimeout(closeT);
        closeT = setTimeout(function () { setMega(li, false); }, 260);
      });
    }
    if (t) t.addEventListener('click', function (e) {
      e.preventDefault();
      var open = !li.classList.contains('is-open');
      closeAll(li); setMega(li, open);
      if (open) { var first = $('.mega__lead', li); if (first && e.detail === 0) setTimeout(function () { first.focus(); }, 60); }
    });
    li.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && li.classList.contains('is-open')) { e.stopPropagation(); setMega(li, false, true); }
    });
    li.addEventListener('focusout', function () {
      setTimeout(function () { if (!li.contains(d.activeElement) && li.classList.contains('is-open')) setMega(li, false); }, 0);
    });
  });
  d.addEventListener('click', function (e) { if (!e.target.closest || !e.target.closest('[data-mega]')) closeAll(null); });

  /* ---------- mobile drawer: focus trap, Escape, scrim ---------- */
  var drawer = $('[data-drawer]'), burger = $('.burger');
  var focusables = 'a[href], button:not([disabled]), summary, input, select, textarea, [tabindex]:not([tabindex="-1"])';
  var drawerTimer = 0;
  function drawerOpen(open) {
    if (!drawer) return;
    clearTimeout(drawerTimer);
    if (open) {
      drawer.hidden = false;
      root.classList.add('drawer-open');
      raf(function () { raf(function () { drawer.classList.add('is-open'); }); });
      if (burger) burger.setAttribute('aria-expanded', 'true');
      setTimeout(function () { var c = $('.drawer__close', drawer); if (c) c.focus(); }, 80);
    } else {
      drawer.classList.remove('is-open');
      root.classList.remove('drawer-open');
      if (burger) { burger.setAttribute('aria-expanded', 'false'); burger.focus(); }
      drawerTimer = setTimeout(function () { drawer.hidden = true; }, reduce ? 0 : 560);
    }
  }
  if (burger) burger.addEventListener('click', function () { drawerOpen(!drawer || drawer.hidden || !drawer.classList.contains('is-open')); });
  if (drawer) {
    $$('[data-drawer-close]', drawer).forEach(function (b) { b.addEventListener('click', function () { drawerOpen(false); }); });
    drawer.addEventListener('keydown', function (e) {
      if (e.key === 'Escape') { e.preventDefault(); drawerOpen(false); return; }
      if (e.key !== 'Tab') return;
      var list = $$(focusables, drawer).filter(function (el) { return el.offsetParent !== null || el === d.activeElement; });
      if (!list.length) return;
      var first = list[0], last = list[list.length - 1];
      if (e.shiftKey && d.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && d.activeElement === last) { e.preventDefault(); first.focus(); }
    });
    $$('a[href]', drawer).forEach(function (a) { a.addEventListener('click', function () { if (a.getAttribute('href').charAt(0) === '#') drawerOpen(false); }); });
    w.addEventListener('resize', function () { if (w.innerWidth > 1199 && !drawer.hidden) drawerOpen(false); });
  }
  d.addEventListener('keydown', function (e) { if (e.key === 'Escape') closeAll(null); });

  /* ---------- stagger indices ---------- */
  $$('[data-stagger]').forEach(function (p) { Array.prototype.forEach.call(p.children, function (c, i) { c.style.setProperty('--i', i); }); });

  /* ---------- reveals (IntersectionObserver + scroll fallback + 2.5 s failsafe) ---------- */
  var pending = $$('[data-reveal], [data-stagger]');
  function done(el) {
    var n = el.hasAttribute('data-stagger') ? el.children.length : 0;
    var ms = 1650 + Math.min(n, 12) * 80 + (parseFloat(getComputedStyle(el).getPropertyValue('--d')) || 0) * 1000;
    setTimeout(function () { el.classList.add('is-done'); }, reduce ? 0 : ms);
  }
  function reveal(el) {
    if (el.classList.contains('is-in')) return;
    el.classList.add('is-in'); done(el);
    var i = pending.indexOf(el); if (i > -1) pending.splice(i, 1);
  }
  function revealAll() { pending.slice().forEach(reveal); }
  function revealVisible() {
    var vh = w.innerHeight || root.clientHeight;
    pending.slice().forEach(function (el) { var r = el.getBoundingClientRect(); if (r.top < vh * 0.98 && (r.bottom > 0 || r.top < 0)) reveal(el); });
  }
  if (!root.classList.contains('js-motion') || reduce || !('IntersectionObserver' in w)) revealAll();
  else {
    var delivered = false;
    var io = new IntersectionObserver(function (es) {
      delivered = true;
      es.forEach(function (en) { if (en.isIntersecting) { reveal(en.target); io.unobserve(en.target); } });
    }, { threshold: 0, rootMargin: '0px 0px -6% 0px' });
    pending.forEach(function (el) { io.observe(el); });
    // failsafe: nothing stays invisible. After 2.5 s everything at or above the viewport is shown (and everything, if
    // the observer never delivered); later, a scroll check backs the observer up (fast scrolls, anchor jumps).
    setTimeout(function () { if (!delivered) revealAll(); else revealVisible(); }, 2500);
    var sTick = false;
    w.addEventListener('scroll', function () { if (sTick) return; sTick = true; raf(function () { sTick = false; revealVisible(); }); }, { passive: true });
    w.addEventListener('beforeprint', revealAll);
    w.addEventListener('hashchange', function () { setTimeout(revealVisible, 60); });
  }

  /* ---------- parallax: [data-depth] (rAF, transform only; off under reduced motion and below 768px) ---------- */
  var layers = (reduce || w.innerWidth < 768) ? [] : $$('[data-depth]');
  var pTick = false;
  function parallax() {
    pTick = false;
    var vh = w.innerHeight;
    for (var i = 0; i < layers.length; i++) {
      var el = layers[i], host = el.parentElement || el, r = host.getBoundingClientRect();
      if (r.bottom < -300 || r.top > vh + 300) continue;
      var k = parseFloat(el.getAttribute('data-depth')) || 0;
      var y = (r.top + r.height / 2 - vh / 2) * -k;
      el.style.transform = 'translate3d(0,' + y.toFixed(1) + 'px,0)';
    }
  }
  if (layers.length) {
    var req = function () { if (!pTick) { pTick = true; raf(parallax); } };
    w.addEventListener('scroll', req, { passive: true });
    w.addEventListener('resize', req);
    parallax();
  }

  /* ---------- tilt + moving specular (fine pointers only) ---------- */
  if (fine && !reduce) {
    $$('[data-tilt]').forEach(function (el) {
      var max = parseFloat(el.getAttribute('data-tilt')) || 6;
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect(), x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.style.setProperty('--ry', ((x - 0.5) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--rx', ((0.5 - y) * max * 2).toFixed(2) + 'deg');
        el.style.setProperty('--px', (x * 100).toFixed(1) + '%');
        el.style.setProperty('--py', (y * 100).toFixed(1) + '%');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--rx', '0deg'); el.style.setProperty('--ry', '0deg'); el.style.removeProperty('--px'); el.style.removeProperty('--py'); });
    });
    /* ---------- magnetic buttons ---------- */
    $$('[data-magnetic]').forEach(function (el) {
      el.addEventListener('pointermove', function (e) {
        var r = el.getBoundingClientRect();
        el.style.setProperty('--mgx', ((e.clientX - r.left - r.width / 2) * 0.22).toFixed(1) + 'px');
        el.style.setProperty('--mgy', ((e.clientY - r.top - r.height / 2) * 0.3).toFixed(1) + 'px');
      });
      el.addEventListener('pointerleave', function () { el.style.setProperty('--mgx', '0px'); el.style.setProperty('--mgy', '0px'); });
    });
  }

  /* ---------- pointer spotlight on dark stages ---------- */
  if (fine && !reduce) {
    $$('.spotlight').forEach(function (el) {
      var t = false, ev = null;
      el.addEventListener('pointermove', function (e) {
        ev = e; if (t) return; t = true;
        raf(function () { t = false; var r = el.getBoundingClientRect(); el.style.setProperty('--mx', (ev.clientX - r.left).toFixed(0) + 'px'); el.style.setProperty('--my', (ev.clientY - r.top).toFixed(0) + 'px'); el.classList.add('is-lit'); });
      });
      el.addEventListener('pointerleave', function () { el.classList.remove('is-lit'); });
    });
  }

  /* ---------- rails: prev/next ---------- */
  $$('.rail').forEach(function (rail) {
    var track = $('.rail__track', rail); if (!track) return;
    var prev = $('[data-rail="prev"]', rail), next = $('[data-rail="next"]', rail);
    var step = function () { var c = track.children[0]; return c ? c.getBoundingClientRect().width + (parseFloat(getComputedStyle(track).columnGap) || 20) : 320; };
    var sync = function () {
      if (prev) prev.disabled = track.scrollLeft <= 2;
      if (next) next.disabled = track.scrollLeft + track.clientWidth >= track.scrollWidth - 2;
    };
    if (prev) prev.addEventListener('click', function () { track.scrollBy({ left: -step(), behavior: reduce ? 'auto' : 'smooth' }); });
    if (next) next.addEventListener('click', function () { track.scrollBy({ left: step(), behavior: reduce ? 'auto' : 'smooth' }); });
    track.addEventListener('scroll', function () { raf(sync); }, { passive: true });
    w.addEventListener('resize', sync); sync();
  });

  /* ---------- accordions: animated open/close (native details still works without this) ---------- */
  if (!reduce && Element.prototype.animate) {
    $$('.accordion details, details.accordion, details.drawer__acc').forEach(function (det) {
      var sum = $('summary', det); if (!sum || sum.parentNode !== det) return;
      var anim = null;
      sum.addEventListener('click', function (e) {
        e.preventDefault();
        if (anim) anim.cancel();
        var start = det.offsetHeight;
        if (det.open) {
          var end = sum.offsetHeight + (parseFloat(getComputedStyle(det).borderTopWidth) || 0) + (parseFloat(getComputedStyle(det).borderBottomWidth) || 0);
          det.style.overflow = 'hidden';
          anim = det.animate({ height: [start + 'px', end + 'px'] }, { duration: 320, easing: 'cubic-bezier(.16,1,.3,1)' });
          anim.onfinish = function () { det.open = false; det.style.overflow = ''; anim = null; };
          anim.oncancel = function () { det.style.overflow = ''; };
        } else {
          det.style.overflow = 'hidden';
          det.open = true;
          var full = det.offsetHeight;
          anim = det.animate({ height: [start + 'px', full + 'px'] }, { duration: 420, easing: 'cubic-bezier(.16,1,.3,1)' });
          anim.onfinish = function () { det.style.overflow = ''; anim = null; };
          anim.oncancel = function () { det.style.overflow = ''; };
        }
      });
    });
  }

  /* ---------- loops: play only while visible; pause/play button; never autoplay under reduced motion ---------- */
  var phone = mq('(max-width: 700px) and (orientation: portrait)');
  $$('[data-loop-box]').forEach(function (box) {
    var v = $('video', box), btn = $('.loop-toggle', box);
    if (!v) return;
    if (reduce) { if (btn) btn.hidden = true; return; }
    var loaded = false, userPaused = false;
    var load = function () {
      if (loaded) return; loaded = true;
      var ph = phone && v.getAttribute('data-src-phone');
      if (ph) v.src = ph; else $$('source', v).forEach(function (s) { if (s.getAttribute('data-src')) s.src = s.getAttribute('data-src'); });
      v.load();
    };
    var play = function () { load(); var p = v.play(); if (p && p.catch) p.catch(function () {}); };
    v.addEventListener('playing', function () { box.classList.add('is-playing'); });
    if (btn) btn.addEventListener('click', function () {
      if (v.paused) { userPaused = false; play(); box.classList.remove('is-paused'); btn.setAttribute('aria-label', 'Pause background video'); btn.setAttribute('aria-pressed', 'false'); }
      else { userPaused = true; v.pause(); box.classList.add('is-paused'); btn.setAttribute('aria-label', 'Play background video'); btn.setAttribute('aria-pressed', 'true'); }
    });
    if (!('IntersectionObserver' in w)) { play(); return; }
    new IntersectionObserver(function (es) {
      es.forEach(function (en) { if (en.isIntersecting) { if (!userPaused) play(); } else if (!v.paused) v.pause(); });
    }, { threshold: 0.05 }).observe(box);
  });

  /* ---------- forms that are not wired in the pitch: a polite notice, never a submit ---------- */
  $$('form[data-unwired]').forEach(function (f) {
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = $('.form-note', f);
      if (!n) { n = d.createElement('p'); n.className = 'form-note'; n.setAttribute('role', 'status'); f.appendChild(n); }
      n.textContent = f.getAttribute('data-unwired') || 'This form is a preview and does not send yet. Please call us at 832-717-3937.';
    });
  });

  /* ---------- footer search: voice input where the browser has it; ?q= filters a [data-search-list] ---------- */
  var SR = w.SpeechRecognition || w.webkitSpeechRecognition;
  $$('[data-voice]').forEach(function (b) {
    if (!SR) return;
    var input = $('input', b.closest('form')); if (!input) return;
    b.hidden = false;
    b.addEventListener('click', function () {
      try {
        var rec = new SR(); rec.lang = 'en-US'; rec.interimResults = false; rec.maxAlternatives = 1;
        b.classList.add('is-listening');
        rec.onresult = function (ev) { input.value = ev.results[0][0].transcript; b.classList.remove('is-listening'); input.focus(); };
        rec.onerror = rec.onend = function () { b.classList.remove('is-listening'); };
        rec.start();
      } catch (e) { b.classList.remove('is-listening'); }
    });
  });
  (function () {
    var q = '';
    try { q = (new URLSearchParams(w.location.search).get('q') || '').trim().toLowerCase(); } catch (e) { q = ''; }
    var lists = $$('[data-search-list]');
    if (!q || !lists.length) return;
    $$('input[name="q"]').forEach(function (i) { i.value = q; });
    var words = q.split(/\s+/).filter(Boolean), hits = 0;
    lists.forEach(function (list) {
      $$('li', list).forEach(function (li) {
        var t = (li.textContent || '').toLowerCase();
        var ok = words.every(function (wd) { return t.indexOf(wd) > -1; });
        li.hidden = !ok && !$('li', li); if (ok) hits++;
      });
    });
    var note = $('[data-search-note]');
    if (note) { note.hidden = false; note.textContent = hits ? hits + ' pages match "' + q + '"' : 'No page title matches "' + q + '"'; }
  })();
})();
