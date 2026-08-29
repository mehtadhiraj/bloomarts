/* ==========================================================================
   Mobile validation audit.

   Paste into the browser console on any rendered harness page, or load it
   into an iframe probe. Returns a report for the current viewport.

   Checks:
     - horizontal overflow (and what is causing it)
     - touch targets under 44px
     - images missing intrinsic dimensions, alt, or srcset
     - text clipped by an overflow:hidden ancestor
     - colour contrast against WCAG 2.2 AA

   Known limits, stated rather than hidden:
     - Text over a gradient or photograph cannot be sampled from computed
       style. Those are counted separately as `overGradient`, never as
       passes. The hero scrim was verified by hand instead.
     - Chrome resolves color-mix() to color(srgb r g b) with 0-1 floats.
       parse() handles that; a naive 0-255 read reports false failures.
   ========================================================================== */

window.bloomAudit = function bloomAudit() {
  const out = { viewport: { w: innerWidth, h: innerHeight, dpr: devicePixelRatio } };
  const de = document.documentElement;

  /* ---- Horizontal overflow ---- */
  out.overflow = {
    scrollWidth: de.scrollWidth,
    clientWidth: de.clientWidth,
    overflows: de.scrollWidth > de.clientWidth + 1,
    offenders: []
  };
  if (out.overflow.overflows) {
    document.querySelectorAll('body *').forEach((el) => {
      const r = el.getBoundingClientRect();
      if (r.width === 0 || r.height === 0) return;
      if (getComputedStyle(el).position === 'fixed') return;
      if (r.right > de.clientWidth + 1 || r.left < -1) {
        out.overflow.offenders.push({
          tag: el.tagName.toLowerCase(),
          cls: String(el.className || '').slice(0, 60),
          left: Math.round(r.left),
          right: Math.round(r.right)
        });
      }
    });
    out.overflow.offenders = out.overflow.offenders.slice(0, 10);
  }

  /* ---- Touch targets ---- */
  const SEL =
    'a[href], button, input:not([type=hidden]), select, textarea, summary, [role=button]';
  const controls = [...document.querySelectorAll(SEL)];
  const small = [];
  for (const el of controls) {
    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden') continue;
    if (el.classList.contains('visually-hidden') || el.closest('.visually-hidden')) continue;
    if (el.closest('[aria-hidden="true"]')) continue;

    const r = el.getBoundingClientRect();
    if (r.width === 0 && r.height === 0) continue;

    // A small control inside a large label/row is fine — the row is the target.
    const wrapper = el.closest(
      'label, .tap-target, .card, .facets__row, .swatch-list__item, .option-list__item, .active-filters__item, .qty'
    );
    if (wrapper && wrapper !== el) {
      const wr = wrapper.getBoundingClientRect();
      if (wr.width >= 44 && wr.height >= 44) continue;
    }

    // WCAG 2.5.8 exempts links inline within a sentence.
    if (el.tagName === 'A' && el.closest('.rte, p') && cs.display.includes('inline')) continue;

    let w = r.width;
    let h = r.height;
    if (el.classList.contains('tap-target--expand')) {
      w = Math.max(w, 44);
      h = Math.max(h, 44);
    }
    if (w < 44 || h < 44) {
      small.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 45),
        text: (el.innerText || '').trim().slice(0, 24),
        w: +w.toFixed(1),
        h: +h.toFixed(1)
      });
    }
  }
  out.touchTargets = { checked: controls.length, tooSmall: small.length, examples: small.slice(0, 12) };

  /* ---- Images ---- */
  const imgs = [...document.images];
  out.images = {
    total: imgs.length,
    missingDimensions: imgs.filter((i) => !i.getAttribute('width') || !i.getAttribute('height')).length,
    missingAlt: imgs.filter((i) => i.getAttribute('alt') === null).length,
    missingSrcset: imgs.filter((i) => !i.getAttribute('srcset') && !i.closest('picture')).length
  };

  /* ---- Clipped text ---- */
  const clipped = [];
  const textish = [...document.querySelectorAll('p, h1, h2, h3, h4, li, dd, dt, legend, .field__label, .field__hint, .card__title, .price, .btn')];
  for (const el of textish) {
    if (el.closest('.visually-hidden')) continue;
    const cs = getComputedStyle(el);
    if (!(cs.overflowY === 'hidden' || cs.overflowY === 'clip')) continue;
    if (cs.textOverflow === 'ellipsis') continue;
    if (cs.webkitLineClamp && cs.webkitLineClamp !== 'none') continue;
    if (el.scrollHeight > el.clientHeight + 2 && el.clientHeight > 0) {
      clipped.push({ tag: el.tagName.toLowerCase(), cls: String(el.className || '').slice(0, 45) });
    }
  }
  out.clippedText = { count: clipped.length, examples: clipped.slice(0, 8) };

  /* ---- Contrast ---- */
  const parse = (c) => {
    if (!c) return null;
    const m = c.match(/[\d.]+/g);
    if (!m) return null;
    const v = m.slice(0, 3).map(Number);
    // color-mix() resolves to color(srgb r g b) with 0-1 floats.
    if (/^color\(/.test(c.trim())) return v.map((n) => Math.round(n * 255));
    return v;
  };
  const alphaOf = (c) => {
    const m = c && c.match(/[\d.]+/g);
    return m && m.length > 3 ? Number(m[3]) : 1;
  };
  const lin = (v) => {
    v /= 255;
    return v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4);
  };
  const lum = (rgb) => 0.2126 * lin(rgb[0]) + 0.7152 * lin(rgb[1]) + 0.0722 * lin(rgb[2]);
  const ratio = (a, b) => {
    const l1 = lum(a);
    const l2 = lum(b);
    const [hi, lo] = l1 > l2 ? [l1, l2] : [l2, l1];
    return (hi + 0.05) / (lo + 0.05);
  };

  // null means the background is a gradient or image and cannot be sampled.
  function backgroundOf(el) {
    let n = el;
    while (n && n !== document.documentElement) {
      const st = getComputedStyle(n);
      if (st.backgroundImage && st.backgroundImage !== 'none') return null;
      const c = st.backgroundColor;
      if (c && alphaOf(c) > 0.85) return parse(c);
      n = n.parentElement;
    }
    return parse(getComputedStyle(document.body).backgroundColor) || [251, 246, 238];
  }

  const failures = [];
  const unmeasurable = [];
  const candidates = [...document.querySelectorAll('p, h1, h2, h3, h4, li, a, button, span, label, legend, dd, dt, summary, .price, .eyebrow')];
  for (const el of candidates) {
    if (el.classList.contains('visually-hidden') || el.closest('.visually-hidden')) continue;
    if (el.closest('[aria-hidden="true"]')) continue;
    const hasOwnText = [...el.childNodes].some((n) => n.nodeType === 3 && n.textContent.trim().length > 1);
    if (!hasOwnText) continue;

    const cs = getComputedStyle(el);
    if (cs.display === 'none' || cs.visibility === 'hidden' || Number(cs.opacity) < 0.4) continue;

    const fg = parse(cs.color);
    if (!fg) continue;
    const bg = backgroundOf(el);
    if (!bg) {
      unmeasurable.push({ cls: String(el.className || '').slice(0, 40), text: el.textContent.trim().slice(0, 26) });
      continue;
    }

    const size = parseFloat(cs.fontSize);
    const weight = Number(cs.fontWeight) || 400;
    const isLarge = size >= 24 || (size >= 18.66 && weight >= 700);
    const required = isLarge ? 3 : 4.5;
    const measured = ratio(fg, bg);
    if (measured < required) {
      failures.push({
        tag: el.tagName.toLowerCase(),
        cls: String(el.className || '').slice(0, 40),
        text: el.textContent.trim().slice(0, 28),
        size: +size.toFixed(1),
        measured: +measured.toFixed(2),
        required
      });
    }
  }
  out.contrast = {
    checked: candidates.length,
    failures: failures.length,
    examples: failures.slice(0, 10),
    overGradient: unmeasurable.length,
    overGradientExamples: unmeasurable.slice(0, 6)
  };

  return out;
};

if (typeof module !== 'undefined') module.exports = window.bloomAudit;
