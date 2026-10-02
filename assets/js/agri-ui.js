/* ============================================================================
   Agricalc UI — Template Behaviours  ·  agri-ui.js
   ----------------------------------------------------------------------------
   Dependency-free, defensive, and safe to load on every page: each feature
   bails out silently when its markup is absent, so legacy pages are unaffected.
   No globals are leaked; nothing is redefined from common.js.
   ----------------------------------------------------------------------------
   Features
     1. Theme toggle      — synced with common.js (localStorage "darkMode")
     2. Mobile navigation
     3. Reading progress  — element [data-ag-progress]
     4. Table of contents — auto-built from .prose h2/h3 + scroll-spy
     5. Heading anchors   — permalink "#" on hover
     6. Code copy buttons — inside .code-block
     7. FAQ accordion     — optional single-open behaviour
     8. Lazy <img> hygiene— adds decoding="async" and guards missing sizes
   ========================================================================== */

(function () {
  'use strict';

  var ag$ = function (s, r) { return (r || document).querySelector(s); };
  var ag$$ = function (s, r) { return Array.prototype.slice.call((r || document).querySelectorAll(s)); };

  /* ——————————————————————————————————————————————————————————————————————
     0. COPY
     Every page declares its language on <html lang>. UI strings the script
     injects follow that; unknown languages fall back to English.
     —————————————————————————————————————————————————————————————————————— */
  var AG_LANG = (function () {
    var l = (document.documentElement.getAttribute('lang') || 'en')
      .toLowerCase().slice(0, 2);
    return (l === 'es' || l === 'fr') ? l : 'en';
  })();

  var AG_COPY = {
    en: {
      toc: 'On this page',
      linkSection: 'Link to this section',
      copy: 'Copy',
      copied: 'Copied',
      themeLight: 'Switch to light theme',
      themeDark: 'Switch to dark theme',
      shown: function (a, b) { return a + ' of ' + b + ' shown'; }
    },
    es: {
      toc: 'En esta página',
      linkSection: 'Enlace a esta sección',
      copy: 'Copiar',
      copied: 'Copiado',
      themeLight: 'Cambiar al tema claro',
      themeDark: 'Cambiar al tema oscuro',
      shown: function (a, b) { return a + ' de ' + b + ' mostrados'; }
    },
    fr: {
      toc: 'Sur cette page',
      linkSection: 'Lien vers cette section',
      copy: 'Copier',
      copied: 'Copié',
      themeLight: 'Passer au thème clair',
      themeDark: 'Passer au thème sombre',
      shown: function (a, b) { return a + ' sur ' + b + ' affichés'; }
    }
  }[AG_LANG];

  /* ——————————————————————————————————————————————————————————————————————
     1. THEME
     Reuses the legacy "darkMode" storage key so the existing toggle stays
     in sync and users keep their preference across old and new pages.
     —————————————————————————————————————————————————————————————————————— */
  function initTheme() {
    var root = document.documentElement;
    var body = document.body;
    if (!body || !body.classList.contains('ag-page')) return;

    var stored = null;
    try { stored = localStorage.getItem('darkMode'); } catch (e) { /* private mode */ }

    var wantsDark = stored === '1' ||
      (stored === null && window.matchMedia &&
       window.matchMedia('(prefers-color-scheme: dark)').matches);

    setDark(!!wantsDark);

    ag$$('[data-ag-theme-toggle]').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var next = !body.classList.contains('dark-mode');
        setDark(next);
        try { localStorage.setItem('darkMode', next ? '1' : '0'); } catch (e) {}
        btn.setAttribute('aria-pressed', String(next));
        btn.setAttribute('aria-label', next ? AG_COPY.themeLight : AG_COPY.themeDark);
      });
      var isDark = body.classList.contains('dark-mode');
      btn.setAttribute('aria-pressed', String(isDark));
      // Describe what the next click will do, in the page's language.
      btn.setAttribute('aria-label', isDark ? AG_COPY.themeLight : AG_COPY.themeDark);
    });

    function setDark(on) {
      body.classList.toggle('dark-mode', on);
      root.setAttribute('data-theme', on ? 'dark' : 'light');
      ag$$('[data-ag-theme-icon]').forEach(function (el) {
        el.hidden = (el.getAttribute('data-ag-theme-icon') === 'dark') ? !on : on;
      });
      var meta = ag$('meta[name="theme-color"]');
      if (meta) meta.setAttribute('content', on ? '#0F1412' : '#FBFAF8');
    }
  }

  /* ——————————————————————————————————————————————————————————————————————
     2. MOBILE NAV
     —————————————————————————————————————————————————————————————————————— */
  function initMobileNav() {
    var btn = ag$('[data-ag-menu-toggle]');
    var panel = ag$('#agMobileNav');
    if (!btn || !panel) return;

    btn.setAttribute('aria-expanded', 'false');
    btn.addEventListener('click', function () {
      var open = panel.getAttribute('data-open') !== 'true';
      panel.setAttribute('data-open', String(open));
      btn.setAttribute('aria-expanded', String(open));
    });

    ag$$('a', panel).forEach(function (a) {
      a.addEventListener('click', function () {
        panel.setAttribute('data-open', 'false');
        btn.setAttribute('aria-expanded', 'false');
      });
    });

    document.addEventListener('keydown', function (e) {
      if (e.key === 'Escape' && panel.getAttribute('data-open') === 'true') {
        panel.setAttribute('data-open', 'false');
        btn.setAttribute('aria-expanded', 'false');
        btn.focus();
      }
    });
  }

  /* ——————————————————————————————————————————————————————————————————————
     3. READING PROGRESS
     Measures the article body, not the whole document, so it stays honest
     about how much of the *content* is left.
     —————————————————————————————————————————————————————————————————————— */
  function initProgress() {
    var bar = ag$('[data-ag-progress]');
    var target = ag$('[data-ag-progress-target]') || ag$('.prose');
    if (!bar || !target) return;

    var ticking = false;
    function update() {
      var rect = target.getBoundingClientRect();
      var vh = window.innerHeight || document.documentElement.clientHeight;
      var total = rect.height - vh * 0.6;
      var scrolled = -rect.top + vh * 0.25;
      var pct = total > 0 ? (scrolled / total) * 100 : 0;
      bar.style.width = Math.max(0, Math.min(100, pct)).toFixed(2) + '%';
      ticking = false;
    }
    function onScroll() {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    }
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', onScroll, { passive: true });
    update();
  }

  /* ——————————————————————————————————————————————————————————————————————
     4. TABLE OF CONTENTS
     Builds nested lists from h2/h3 inside .prose, inserts ids, and
     highlights the section currently in view.
     —————————————————————————————————————————————————————————————————————— */
  function slugify(text) {
    return text.toLowerCase().trim()
      .replace(/[^\w\s-]/g, '')
      .replace(/\s+/g, '-')
      .replace(/-+/g, '-')
      .slice(0, 60);
  }

  function initToc() {
    var lists = ag$$('[data-ag-toc]');
    if (!lists.length) return;

    var scope = ag$('[data-ag-progress-target]') || ag$('.prose');
    if (!scope) return;

    var heads = ag$$('h2, h3', scope);
    if (heads.length < 2) return;

    var used = {};
    var items = heads.map(function (h) {
      var id = h.id || slugify(h.textContent || '');
      if (!id) id = 'section';
      if (used[id]) { used[id] += 1; id = id + '-' + used[id]; }
      else { used[id] = 1; }
      h.id = id;
      return { el: h, id: id, level: h.tagName === 'H2' ? 2 : 3,
               text: (h.textContent || '').trim() };
    });

    // Render into every TOC host on the page (sidebar + mobile variant).
    lists.forEach(function (host) {
      var frag = document.createDocumentFragment();
      items.forEach(function (it) {
        var li = document.createElement('li');
        if (it.level === 3) li.className = 'ag-toc__item--sub';
        var a = document.createElement('a');
        a.href = '#' + it.id;
        a.textContent = it.text;
        a.setAttribute('data-ag-toc-link', it.id);
        li.appendChild(a);
        frag.appendChild(li);
      });
      var ul = document.createElement('ul');
      ul.className = 'ag-toc__list';
      ul.appendChild(frag);
      host.innerHTML = '';
      var title = document.createElement('p');
      title.className = 'ag-toc__title';
      title.textContent = AG_COPY.toc;
      host.appendChild(title);
      host.appendChild(ul);
    });

    // Smooth in-page navigation that keeps the URL shareable.
    ag$$('[data-ag-toc-link]').forEach(function (a) {
      a.addEventListener('click', function (e) {
        var el = document.getElementById(a.getAttribute('data-ag-toc-link'));
        if (!el) return;
        e.preventDefault();
        var top = el.getBoundingClientRect().top + window.pageYOffset -
                  (parseInt(getComputedStyle(document.documentElement)
                    .getPropertyValue('--ag-header-h'), 10) || 64) - 16;
        window.scrollTo({ top: top, behavior: 'smooth' });
        history.replaceState(null, '', '#' + el.id);
      });
    });

    // Scroll-spy
    var links = ag$$('[data-ag-toc-link]');
    var ticking = false;
    function spy() {
      ticking = false;
      var offset = (parseInt(getComputedStyle(document.documentElement)
        .getPropertyValue('--ag-header-h'), 10) || 64) + 24;
      var current = items[0];
      for (var i = 0; i < items.length; i++) {
        if (items[i].el.getBoundingClientRect().top - offset <= 0) current = items[i];
        else break;
      }
      links.forEach(function (a) {
        a.classList.toggle('is-active', a.getAttribute('data-ag-toc-link') === current.id);
      });
    }
    window.addEventListener('scroll', function () {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(spy);
    }, { passive: true });
    spy();
  }

  /* ——————————————————————————————————————————————————————————————————————
     5. HEADING PERMALINKS
     —————————————————————————————————————————————————————————————————————— */
  function initHeadingAnchors() {
    var scope = ag$('.prose');
    if (!scope) return;
    if (scope.getAttribute('data-ag-anchors') === 'off') return;

    ag$$('h2[id], h3[id]', scope).forEach(function (h) {
      var a = document.createElement('a');
      a.href = '#' + h.id;
      a.className = 'ag-heading-anchor';
      a.setAttribute('aria-label', AG_COPY.linkSection);
      a.textContent = '#';
      a.addEventListener('click', function () {
        history.replaceState(null, '', '#' + h.id);
      });
      h.appendChild(a);
    });
  }

  /* ——————————————————————————————————————————————————————————————————————
     6. CODE COPY
     —————————————————————————————————————————————————————————————————————— */
  function initCodeCopy() {
    ag$$('.code-block').forEach(function (block) {
      var pre = ag$('pre', block);
      if (!pre) return;
      if (ag$('.code-block__copy', block)) return;

      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'code-block__copy';
      btn.textContent = AG_COPY.copy;
      btn.addEventListener('click', function () {
        var code = pre.querySelector('code') || pre;
        var text = code.innerText;
        var done = function () {
          btn.textContent = AG_COPY.copied;
          setTimeout(function () { btn.textContent = AG_COPY.copy; }, 1600);
        };
        if (navigator.clipboard && navigator.clipboard.writeText) {
          navigator.clipboard.writeText(text).then(done, function () { fallback(text, done); });
        } else {
          fallback(text, done);
        }
      });
      block.appendChild(btn);
    });

    function fallback(text, done) {
      var ta = document.createElement('textarea');
      ta.value = text;
      ta.setAttribute('readonly', '');
      ta.style.position = 'fixed';
      ta.style.top = '-1000px';
      document.body.appendChild(ta);
      ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  /* ——————————————————————————————————————————————————————————————————————
     7. FAQ — optional single-open accordion
     —————————————————————————————————————————————————————————————————————— */
  function initFaq() {
    ag$$('[data-ag-faq-single]').forEach(function (group) {
      var items = ag$$('details', group);
      items.forEach(function (d) {
        d.addEventListener('toggle', function () {
          if (!d.open) return;
          items.forEach(function (o) { if (o !== d) o.open = false; });
        });
      });
    });
  }

  /* ——————————————————————————————————————————————————————————————————————
     8. IMAGE HYGIENE
     Adds async decoding, and marks images without intrinsic dimensions so CSS
     can reserve space and prevent layout shift.
     —————————————————————————————————————————————————————————————————————— */
  function initImages() {
    ag$$('.prose img, .ag-article-card__media img').forEach(function (img) {
      if (!img.hasAttribute('decoding')) img.setAttribute('decoding', 'async');
      if (!img.hasAttribute('loading') && !img.hasAttribute('fetchpriority')) {
        img.setAttribute('loading', 'lazy');
      }
      if (!img.hasAttribute('width') || !img.hasAttribute('height')) {
        img.setAttribute('data-ag-no-size', '1');
      }
      img.addEventListener('error', function () {
        img.setAttribute('data-ag-img-error', '1');
      }, { once: true });
    });
  }

  /* ——————————————————————————————————————————————————————————————————————
     9. COLLECTION FILTER  —  category chips + live search
     Markup contract (emitted by tools/migrate-page.py on index pages):
       [data-ag-filter-group]  buttons[data-ag-filter="slug" | "*"]
       [data-ag-filter-list]   ul  >  li[data-ag-cat][data-ag-text]
       [data-ag-search]        input[type=search]
       [data-ag-filter-status]  (optional) live region
     Everything is optional — if the group or the list is missing, it exits.
     —————————————————————————————————————————————————————————————————————— */
  function initFilter() {
    var group = ag$('[data-ag-filter-group]');
    var list  = ag$('[data-ag-filter-list]');
    if (!group || !list) return;

    var items  = ag$$('li[data-ag-cat]', list);
    var chips  = ag$$('[data-ag-filter]', group);
    var input  = ag$('[data-ag-search]');
    var status = ag$('[data-ag-filter-status]');
    if (!items.length) return;

    var state = { cat: '*', q: '' };

    function apply() {
      var q = state.q.toLowerCase();
      var shown = 0;
      items.forEach(function (li) {
        var okCat = state.cat === '*' || li.getAttribute('data-ag-cat') === state.cat;
        var hay   = li.getAttribute('data-ag-text') || li.textContent.toLowerCase();
        var okQ   = !q || hay.indexOf(q) !== -1;
        var on    = okCat && okQ;
        li.hidden = !on;
        if (on) shown++;
      });
      chips.forEach(function (c) {
        var on = c.getAttribute('data-ag-filter') === state.cat;
        c.classList.toggle('is-active', on);
        c.setAttribute('aria-pressed', on ? 'true' : 'false');
      });
      if (status) {
        status.textContent = shown === items.length
          ? ''
          : AG_COPY.shown(shown, items.length);
      }
    }

    chips.forEach(function (c) {
      c.addEventListener('click', function () {
        state.cat = c.getAttribute('data-ag-filter');
        apply();
        var first = items.filter(function (li) { return !li.hidden; })[0];
        if (first && first.scrollIntoView) {
          first.scrollIntoView({ block: 'nearest' });
        }
      });
    });

    if (input) {
      var t;
      input.addEventListener('input', function () {
        clearTimeout(t);
        t = setTimeout(function () { state.q = input.value.trim(); apply(); }, 120);
      });
      // "/" focuses the search box, Escape clears it
      document.addEventListener('keydown', function (e) {
        var tag = (e.target.tagName || '').toLowerCase();
        if (e.key === '/' && tag !== 'input' && tag !== 'textarea') {
          e.preventDefault();
          input.focus();
        } else if (e.key === 'Escape' && document.activeElement === input) {
          input.value = '';
          state.q = '';
          apply();
          input.blur();
        }
      });
    }

    apply();
  }

  /* ——————————————————————————————————————————————————————————————————————
     BOOT
     —————————————————————————————————————————————————————————————————————— */
  function boot() {
    initTheme();
    initMobileNav();
    initProgress();
    initToc();
    initHeadingAnchors();
    initCodeCopy();
    initFaq();
    initImages();
    initFilter();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', boot);
  } else {
    boot();
  }
})();
