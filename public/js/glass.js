(() => {
  const root = document.documentElement;
  const SEL = '.nbnav, .top.glass';
  const style = root.style;
  const supported =
    ('backdropFilter' in style) ||
    ('webkitBackdropFilter' in style) ||
    (!!window.CSS && !!CSS.supports &&
      (CSS.supports('backdrop-filter', 'blur(1px)') ||
        CSS.supports('-webkit-backdrop-filter', 'blur(1px)')));

  root.classList.toggle('nb-glass-ok', supported);
  root.classList.toggle('nb-glass-none', !supported);

  const ls = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
  };

  function setTheme(name) {
    if (name === 'light' || name === 'dark') {
      root.dataset.nbTheme = name;
      ls.set('nb-scheme', name);
    } else {
      delete root.dataset.nbTheme;
      try { localStorage.removeItem('nb-scheme'); } catch (e) {}
    }
  }

  const saved = ls.get('nb-scheme');
  if (saved === 'light' || saved === 'dark') root.dataset.nbTheme = saved;

  let queued = false;
  function mark() {
    queued = false;
    document.querySelectorAll(SEL).forEach((el) => {
      el.setAttribute('data-nb-glass', supported ? 'on' : 'off');
    });
  }
  function queueMark() {
    if (queued) return;
    queued = true;
    requestAnimationFrame(mark);
  }

  mark();
  new MutationObserver((records) => {
    for (const record of records) {
      for (const node of record.addedNodes) {
        if (node.nodeType !== 1) continue;
        if (node.matches(SEL) || node.querySelector(SEL)) { queueMark(); return; }
      }
    }
  }).observe(document.body, { childList: true, subtree: true });

  let raf = 0;
  let pending = null;
  function paint() {
    raf = 0;
    if (!pending) return;
    const { el, x, y } = pending;
    el.style.setProperty('--nb-mx', x.toFixed(1) + 'px');
    el.style.setProperty('--nb-my', y.toFixed(1) + 'px');
  }
  function reset(el) {
    el.style.setProperty('--nb-mx', '50%');
    el.style.setProperty('--nb-my', '0%');
  }

  document.addEventListener('pointermove', (e) => {
    const t = e.target;
    const el = t && t.closest ? t.closest(SEL) : null;
    if (!el) return;
    const r = el.getBoundingClientRect();
    pending = { el, x: e.clientX - r.left, y: e.clientY - r.top };
    if (!raf) raf = requestAnimationFrame(paint);
  }, { passive: true });

  document.addEventListener('pointerout', (e) => {
    const t = e.target;
    const el = t && t.closest ? t.closest(SEL) : null;
    if (!el) return;
    if (e.relatedTarget && el.contains(e.relatedTarget)) return;
    reset(el);
  }, true);

  window.nbGlass = { supported, setTheme, refresh: mark };
})();
