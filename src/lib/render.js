/* ====================================================================
 *  Client-side navigation layer (progressive enhancement only).
 *
 *  This file does NOT talk to any new endpoint and does NOT change the
 *  shape of any request/response. It intercepts clicks on internal
 *  links, re-issues the EXACT SAME GET request the browser would have
 *  made, and swaps the returned <body> into the page instead of doing
 *  a full navigation. If anything looks unexpected (non-HTML response,
 *  network error, different origin, etc.) it always falls back to a
 *  normal browser navigation, so the site can never end up "stuck".
 * ==================================================================== */
export const ROUTER_JS = String.raw`
(function () {
  'use strict';

  var cache = new Map();               // short-lived GET response cache (prefetch on hover)
  var current = location.href;
  var inFlight = null;

  /* ---------- sidebar + theme (single source of truth) ---------- */
  function closeSidebar() {
    var nav = document.getElementById('sideNav');
    var backdrop = document.getElementById('navBackdrop');
    if (nav) nav.classList.remove('open');
    if (backdrop) backdrop.classList.remove('show');
  }
  window.toggleSidebar = function () {
    var nav = document.getElementById('sideNav');
    var backdrop = document.getElementById('navBackdrop');
    if (!nav) return;
    var opening = !nav.classList.contains('open');
    nav.classList.toggle('open');
    if (backdrop) backdrop.classList.toggle('show', opening);
  };
  window.toggleTheme = function () {
    var body = document.body;
    body.classList.toggle('dark-mode');
    var isDark = body.classList.contains('dark-mode');
    localStorage.setItem('theme', isDark ? 'dark' : 'light');
    syncThemeIcon();
  };
  function syncThemeIcon() {
    var btn = document.getElementById('themeToggleBtn');
    if (!btn) return;
    btn.textContent = document.body.classList.contains('dark-mode') ? '\u2600\uFE0F' : '\uD83C\uDF19';
  }
  function applySavedTheme() {
    var saved = localStorage.getItem('theme') || 'dark';
    document.body.classList.toggle('dark-mode', saved === 'dark');
    syncThemeIcon();
  }
  applySavedTheme();

  /* ---------- tiny top progress bar (YouTube/GitHub style) ---------- */
  // Queried live (not cached) because the bar's own DOM node is replaced
  // whenever the page body is swapped during navigation.
  var barTimer = null;
  function progressStart() {
    var bar = document.getElementById('nprogress-bar');
    if (!bar) return;
    clearTimeout(barTimer);
    bar.style.transition = 'none';
    bar.style.width = '0%';
    bar.style.opacity = '1';
    // force reflow so the next transition actually animates from 0
    void bar.offsetWidth;
    bar.style.transition = 'width 0.4s ease-out, opacity 0.2s ease';
    requestAnimationFrame(function () { bar.style.width = '75%'; });
  }
  function progressDone() {
    var bar = document.getElementById('nprogress-bar');
    if (!bar) return;
    bar.style.width = '100%';
    barTimer = setTimeout(function () {
      bar.style.opacity = '0';
      setTimeout(function () { bar.style.width = '0%'; }, 250);
    }, 150);
  }

  /* ---------- helpers ---------- */
  function isInternal(a) {
    if (!a || !a.getAttribute) return false;
    var href = a.getAttribute('href');
    if (!href || href.charAt(0) === '#') return false;
    if (a.target && a.target !== '' && a.target !== '_self') return false;
    if (a.hasAttribute('download')) return false;
    if (a.dataset && a.dataset.noSpa !== undefined) return false;
    if (/^(mailto|tel|javascript):/i.test(href)) return false;
    var url;
    try { url = new URL(href, location.href); } catch (e) { return false; }
    if (url.origin !== location.origin) return false;
    // Routes that legitimately need a real browser request/response cycle:
    // HTTP Basic-Auth admin area, and any /api or /assets path.
    if (/^\/admin(\/|$)/.test(url.pathname)) return false;
    if (/^\/api(\/|$)/.test(url.pathname)) return false;
    if (/^\/assets(\/|$)/.test(url.pathname)) return false;
    return url;
  }

  function runScripts(container) {
    var scripts = container.querySelectorAll('script');
    scripts.forEach(function (old) {
      var s = document.createElement('script');
      for (var i = 0; i < old.attributes.length; i++) {
        s.setAttribute(old.attributes[i].name, old.attributes[i].value);
      }
      s.text = old.textContent;
      old.parentNode.replaceChild(s, old);
    });
  }

  function applyDoc(html, finalUrl) {
    var doc = new DOMParser().parseFromString(html, 'text/html');
    var newBody = doc.body;
    if (!newBody) return false;

    document.title = doc.title || document.title;

    var view = document.body;
    view.classList.add('spa-leaving');

    setTimeout(function () {
      // Replace body content (keeps <head>, keeps the router script + its
      // listeners alive, keeps dark/light mode class on <body> untouched).
      view.innerHTML = newBody.innerHTML;
      view.classList.remove('spa-leaving');
      view.classList.add('spa-entering');
      runScripts(view);
      syncThemeIcon();
      requestAnimationFrame(function () {
        view.classList.remove('spa-entering');
      });
      window.scrollTo({ top: 0, behavior: 'instant' in window ? 'instant' : 'auto' });
      current = finalUrl;
    }, 90);
    return true;
  }

  function fetchPage(url) {
    var key = url.href;
    if (cache.has(key)) return cache.get(key);
    var p = fetch(key, {
      credentials: 'same-origin',
      headers: { 'X-Spa-Nav': '1' },
    }).then(function (res) {
      var ct = res.headers.get('Content-Type') || '';
      if (!res.ok || ct.indexOf('text/html') === -1) {
        throw new Error('non-html-response');
      }
      return res.text().then(function (html) {
        return { html: html, finalUrl: res.url || key, redirected: res.redirected };
      });
    });
    cache.set(key, p);
    setTimeout(function () { cache.delete(key); }, 15000); // short TTL, avoids staleness
    return p;
  }

  function go(url, addHistory) {
    progressStart();
    inFlight = fetchPage(url);
    inFlight
      .then(function (result) {
        var ok = applyDoc(result.html, result.finalUrl);
        if (!ok) { location.href = url.href; return; }
        if (addHistory) {
          if (result.redirected) history.pushState({ spa: true }, '', result.finalUrl);
          else history.pushState({ spa: true }, '', url.href);
        }
        progressDone();
      })
      .catch(function () {
        // Anything unexpected: do a real navigation, never leave the user stuck.
        location.href = url.href;
      });
  }

  /* ---------- click interception ---------- */
  document.addEventListener('click', function (e) {
    if (e.target && e.target.id === 'navBackdrop') { closeSidebar(); return; }
    if (e.defaultPrevented || e.button !== 0) return;
    if (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    var url = isInternal(a);
    if (!url) { if (a) closeSidebar(); return; }
    e.preventDefault();
    closeSidebar();
    if (url.href === current) return;
    go(url, true);
  }, false);

  document.addEventListener('keydown', function (e) {
    if (e.key === 'Escape') closeSidebar();
  });

  /* ---------- hover / touch prefetch for snappier nav ---------- */
  document.addEventListener('mouseover', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    var url = isInternal(a);
    if (url) fetchPage(url);
  }, { passive: true });
  document.addEventListener('touchstart', function (e) {
    var a = e.target.closest ? e.target.closest('a[href]') : null;
    var url = isInternal(a);
    if (url) fetchPage(url);
  }, { passive: true });

  /* ---------- back / forward buttons ---------- */
  window.addEventListener('popstate', function () {
    var url;
    try { url = new URL(location.href); } catch (e) { location.reload(); return; }
    go(url, false);
  });

  history.replaceState({ spa: true }, '', location.href);
})();
`;
