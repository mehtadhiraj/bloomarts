/* ==========================================================================
   Bloomarts — global runtime

   Everything here is progressive enhancement. Without this file the
   storefront still renders, navigates, filters (form GET), and adds to cart
   (native form POST). These custom elements only upgrade what already works.
   ========================================================================== */

(function () {
  'use strict';

  /* ------------------------------------------------------------------
     Device capability
     Decides whether decorative motion is affordable. Checked once — these
     signals do not change mid-session, and polling them would itself cost
     more than the animations save.
     ------------------------------------------------------------------ */

  const Capability = {
    // Read live via reducedMotionQuery below; kept here for callers that
    // want a one-shot snapshot.
    get prefersReducedMotion() {
      return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    },

    // navigator.deviceMemory and hardwareConcurrency are absent on Safari,
    // so a missing value must not be read as "low powered".
    lowPowered:
      (navigator.deviceMemory !== undefined && navigator.deviceMemory <= 4) ||
      (navigator.hardwareConcurrency !== undefined && navigator.hardwareConcurrency <= 4),

    saveData: !!(navigator.connection && navigator.connection.saveData),

    slowNetwork: !!(
      navigator.connection &&
      /^(slow-)?2g$/.test(navigator.connection.effectiveType || '')
    ),

    get smallScreen() {
      return window.matchMedia('(max-width: 767px)').matches;
    },

    get coarsePointer() {
      return window.matchMedia('(pointer: coarse)').matches;
    }
  };

  const smallScreenQuery = window.matchMedia('(max-width: 767px)');
  const reducedMotionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  /* Two tiers, not one.

     reduce-motion   HARD brake. The user or the merchant has asked for no
                     motion, or the connection cannot afford it. Everything
                     stops, including cheap fades.

     simplify-motion SOFT brake. A small or low-powered device. Only the
                     EXPENSIVE effects stop — parallax, blur, 3D, scroll-
                     linked drift. Cheap opacity/transform reveals keep
                     running.

     A single brake was wrong: it meant a phone got no animation at all,
     when the requirement is to "reduce or simplify resource-intensive
     animation on smaller or lower-powered devices" — simplify, not
     eliminate. */
  function evaluateMotionPolicy() {
    const root = document.documentElement;
    const simplifyOnMobile = root.dataset.reduceMotionMobile === 'true';
    const merchantDisabled = root.dataset.animations === 'false';

    const reduce =
      merchantDisabled ||
      reducedMotionQuery.matches ||
      Capability.saveData ||
      Capability.slowNetwork;

    const simplify =
      reduce || (simplifyOnMobile && (smallScreenQuery.matches || Capability.lowPowered));

    return { reduce, simplify };
  }

  /* Re-evaluated whenever the inputs change, not just once at load.

     Evaluating only at DOMContentLoaded meant a phone that loaded in
     portrait and rotated to landscape stayed simplified for the rest of the
     session — and a desktop window dragged narrow then wide did the same.
     Both media queries are live, so this now tracks them. */
  function applyMotionPolicy() {
    const { reduce, simplify } = evaluateMotionPolicy();
    const root = document.documentElement;
    root.classList.toggle('reduce-motion', reduce);
    root.classList.toggle('simplify-motion', simplify);
    return reduce;
  }

  function watchMotionPolicy() {
    const reapply = () => applyMotionPolicy();
    smallScreenQuery.addEventListener('change', reapply);
    reducedMotionQuery.addEventListener('change', reapply);
    // Orientation settles a frame after the media query fires on some
    // Android browsers.
    window.addEventListener('orientationchange', () => requestAnimationFrame(reapply));
  }

  /* ------------------------------------------------------------------
     Header height
     Published as a custom property so sticky offsets, drawer heights and
     scroll-padding never hardcode a value that a taller announcement bar
     or a wrapped nav would invalidate.
     ------------------------------------------------------------------ */

  function trackHeaderHeight() {
    const header = document.querySelector('[data-header]');
    if (!header) return;

    const publish = () => {
      document.documentElement.style.setProperty(
        '--header-height',
        `${Math.round(header.getBoundingClientRect().height)}px`
      );
    };

    publish();

    if ('ResizeObserver' in window) {
      new ResizeObserver(publish).observe(header);
    } else {
      window.addEventListener('resize', publish, { passive: true });
    }
    // Orientation change settles a frame after the resize event fires.
    window.addEventListener('orientationchange', () => {
      requestAnimationFrame(publish);
    });
  }

  /* ------------------------------------------------------------------
     Scroll lock
     overflow:hidden on <body> does not hold on iOS Safari — the page still
     rubber-bands behind the drawer and the scroll position is lost on
     release. Pinning with position:fixed and restoring the offset is the
     only approach that behaves on both platforms.
     ------------------------------------------------------------------ */

  const ScrollLock = {
    _depth: 0,
    _offset: 0,

    lock() {
      if (this._depth++ > 0) return;

      this._offset = window.scrollY;
      const body = document.body;

      // Compensating for the scrollbar prevents a horizontal jump on
      // desktop; mobile overlay scrollbars have zero width, so this is a
      // no-op there.
      const scrollbar = window.innerWidth - document.documentElement.clientWidth;

      body.style.position = 'fixed';
      body.style.top = `-${this._offset}px`;
      body.style.left = '0';
      body.style.right = '0';
      body.style.width = '100%';
      if (scrollbar > 0) body.style.paddingRight = `${scrollbar}px`;
    },

    unlock() {
      if (this._depth === 0) return;
      if (--this._depth > 0) return;

      const body = document.body;
      body.style.position = '';
      body.style.top = '';
      body.style.left = '';
      body.style.right = '';
      body.style.width = '';
      body.style.paddingRight = '';

      // Instant, not smooth: a smooth scroll here reads as the page
      // sliding away after the drawer closes.
      window.scrollTo({ top: this._offset, behavior: 'instant' });
    }
  };

  /* ------------------------------------------------------------------
     Focus management
     ------------------------------------------------------------------ */

  const FOCUSABLE = [
    'a[href]',
    'button:not([disabled])',
    'input:not([disabled]):not([type="hidden"])',
    'select:not([disabled])',
    'textarea:not([disabled])',
    'details > summary',
    '[tabindex]:not([tabindex="-1"])'
  ].join(',');

  function focusableWithin(root) {
    return Array.from(root.querySelectorAll(FOCUSABLE)).filter((el) => {
      return el.offsetWidth > 0 || el.offsetHeight > 0 || el === document.activeElement;
    });
  }

  function trapFocus(container, event) {
    if (event.key !== 'Tab') return;

    const items = focusableWithin(container);
    if (items.length === 0) {
      event.preventDefault();
      return;
    }

    const first = items[0];
    const last = items[items.length - 1];
    const active = document.activeElement;

    if (event.shiftKey && (active === first || !container.contains(active))) {
      event.preventDefault();
      last.focus();
    } else if (!event.shiftKey && active === last) {
      event.preventDefault();
      first.focus();
    }
  }

  /* ------------------------------------------------------------------
     Screen reader announcements
     One shared polite region — separate regions per component talk over
     each other.
     ------------------------------------------------------------------ */

  function announce(message) {
    const region = document.getElementById('live-region');
    if (!region || !message) return;
    // Clearing first forces a re-announcement when the text is unchanged.
    region.textContent = '';
    requestAnimationFrame(() => {
      region.textContent = message;
    });
  }

  /* ------------------------------------------------------------------
     <bloom-drawer>
     Shared behaviour for the mobile menu, cart drawer and filter sheet.
     Presentation (bottom sheet vs side panel) is entirely CSS; this class
     only owns state, focus and dismissal.
     ------------------------------------------------------------------ */

  class BloomDrawer extends HTMLElement {
    connectedCallback() {
      this.panel = this.querySelector('[data-drawer-panel]');
      this.overlay = this.querySelector('[data-drawer-overlay]');
      this.opener = null;

      this.addEventListener('click', (event) => {
        if (event.target.closest('[data-drawer-close]') || event.target === this.overlay) {
          this.close();
        }
      });

      this.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          event.stopPropagation();
          this.close();
        } else {
          trapFocus(this.panel || this, event);
        }
      });

      this._setupSwipeDismiss();
      this.setAttribute('data-ready', '');
    }

    /* A downward drag on the grab handle dismisses a bottom sheet — the
       gesture people already expect from native sheets, and reachable
       one-handed in a way a top-corner close button is not. The handle is
       the only drag surface, so scrolling the sheet's content is unaffected. */
    _setupSwipeDismiss() {
      const handle = this.querySelector('[data-drawer-handle]');
      if (!handle || !this.panel) return;

      let startY = 0;
      let deltaY = 0;
      let dragging = false;

      handle.addEventListener(
        'touchstart',
        (event) => {
          if (!window.matchMedia('(max-width: 767px)').matches) return;
          dragging = true;
          startY = event.touches[0].clientY;
          deltaY = 0;
          this.panel.style.transition = 'none';
        },
        { passive: true }
      );

      handle.addEventListener(
        'touchmove',
        (event) => {
          if (!dragging) return;
          deltaY = Math.max(0, event.touches[0].clientY - startY);
          this.panel.style.transform = `translateY(${deltaY}px)`;
        },
        { passive: true }
      );

      const end = () => {
        if (!dragging) return;
        dragging = false;
        this.panel.style.transition = '';
        this.panel.style.transform = '';
        // A quarter of the sheet height is far enough to read as intent
        // rather than an accidental brush.
        if (deltaY > this.panel.offsetHeight * 0.25) this.close();
      };

      handle.addEventListener('touchend', end);
      handle.addEventListener('touchcancel', end);
    }

    open(opener) {
      if (this.hasAttribute('open')) return;

      this.opener = opener || document.activeElement;
      this.setAttribute('open', '');
      ScrollLock.lock();
      this._setBackgroundInert(true);

      if (this.opener && this.opener.setAttribute) {
        this.opener.setAttribute('aria-expanded', 'true');
      }

      // Wait a frame so the panel is laid out before focusing, otherwise
      // iOS scrolls the not-yet-positioned element into view.
      requestAnimationFrame(() => {
        const target =
          this.querySelector('[data-drawer-initial-focus]') ||
          this.querySelector('[data-drawer-close]') ||
          this.panel;
        if (target) target.focus({ preventScroll: true });
      });

      this.dispatchEvent(new CustomEvent('drawer:open', { bubbles: true }));
    }

    close() {
      if (!this.hasAttribute('open')) return;

      this.removeAttribute('open');
      ScrollLock.unlock();
      this._setBackgroundInert(false);

      if (this.opener && this.opener.setAttribute) {
        this.opener.setAttribute('aria-expanded', 'false');
        if (document.body.contains(this.opener)) {
          this.opener.focus({ preventScroll: true });
        }
      }

      this.dispatchEvent(new CustomEvent('drawer:close', { bubbles: true }));
    }

    toggle(opener) {
      this.hasAttribute('open') ? this.close() : this.open(opener);
    }

    /* inert removes background content from the a11y tree and from tab
       order together — belt and braces alongside the focus trap, and the
       part screen readers actually respect. */
    _setBackgroundInert(state) {
      Array.from(document.body.children).forEach((child) => {
        if (child === this || child.tagName === 'SCRIPT') return;
        if (child.contains(this)) return;
        state ? child.setAttribute('inert', '') : child.removeAttribute('inert');
      });
    }
  }

  /* ------------------------------------------------------------------
     Drawer openers — any [data-drawer-open="id"] toggles that drawer.
     ------------------------------------------------------------------ */

  document.addEventListener('click', (event) => {
    const opener = event.target.closest('[data-drawer-open]');
    if (!opener) return;

    const drawer = document.getElementById(opener.getAttribute('data-drawer-open'));
    if (!drawer || typeof drawer.toggle !== 'function') return;

    event.preventDefault();
    drawer.toggle(opener);
  });

  /* ------------------------------------------------------------------
     Responsive accordions

     [data-collapse-mobile] elements are authored OPEN so that, without
     JavaScript, nothing is hidden. Below the breakpoint we close them for
     tidiness. Anything the user has since toggled by hand is left alone.
     ------------------------------------------------------------------ */

  function setupResponsiveAccordions() {
    const items = document.querySelectorAll('details[data-collapse-mobile]');
    if (items.length === 0) return;

    items.forEach((item) => {
      item.addEventListener('toggle', () => {
        item.dataset.userToggled = 'true';
      });
    });

    const apply = () => {
      items.forEach((item) => {
        if (item.dataset.userToggled === 'true') return;
        item.open = !smallScreenQuery.matches;
      });
    };

    apply();
    // A rotation can cross the breakpoint; re-evaluate rather than leaving
    // a phone-shaped footer on a landscape tablet.
    smallScreenQuery.addEventListener('change', () => {
      items.forEach((item) => delete item.dataset.userToggled);
      apply();
    });
  }

  /* ------------------------------------------------------------------
     Scroll reveal

     Elements are authored VISIBLE. The .reveal-ready class — which is what
     hides them so they can animate in — is only added once we have
     confirmed motion is allowed and IntersectionObserver exists. If this
     script fails, never loads, or the observer is missing, every element
     stays visible. Nothing can be stranded at opacity 0.
     ------------------------------------------------------------------ */

  function setupReveal(reduced) {
    const root = document.documentElement;
    const style = root.dataset.revealStyle || 'rise';

    if (reduced || style === 'none' || !('IntersectionObserver' in window)) return;

    const targets = document.querySelectorAll('[data-reveal]');
    if (targets.length === 0) return;

    /* Where scroll-driven animations exist, CSS owns the reveal — see
       scroll-effects.css. Those are tied to scroll position, so they reverse
       on the way back up and replay on the way down. The observer path below
       is the FALLBACK: it can only fire once, because re-observing would mean
       re-hiding content the reader has already seen.

       The merchant can force the one-shot behaviour with "play only once". */
    const scrollLinked =
      window.CSS &&
      CSS.supports &&
      CSS.supports('animation-timeline: view()') &&
      root.dataset.revealOnce !== 'true';

    if (scrollLinked) return;

    /* Arming means hiding elements so they can animate in. A background tab
       does not dispatch IntersectionObserver callbacks, so arming one would
       hide content that never gets revealed. Wait until the page is actually
       visible before hiding anything. */
    if (document.visibilityState === 'hidden') {
      document.addEventListener('visibilitychange', () => setupReveal(reduced), { once: true });
      return;
    }

    root.classList.add('reveal-ready');

    const once = root.dataset.revealOnce === 'true';

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('is-revealed');
            // Only stop watching when the merchant asked for one-shot.
            // Otherwise keep observing so the reveal can replay.
            if (once) observer.unobserve(entry.target);
            return;
          }

          if (once) return;

          /* Reset only when the element has left UPWARD or DOWNWARD past the
             viewport, never while it is merely partly out of view — otherwise
             an element straddling the fold flickers as you scroll.

             This is the fallback for browsers without scroll-driven
             animations; where those exist, CSS handles reveals and this code
             never runs. */
          entry.target.classList.remove('is-revealed');
        });
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0.05 }
    );

    targets.forEach((el) => observer.observe(el));
  }

  /* Staggering is applied per group rather than per document, so the fifth
     card in the second row does not wait on the first row's delay. */
  function applyStagger() {
    if (document.documentElement.dataset.revealStyle !== 'rise-stagger') return;

    document.querySelectorAll('[data-reveal-group]').forEach((group) => {
      const items = group.querySelectorAll('[data-reveal]');
      items.forEach((el, index) => {
        // Capped: beyond about six steps the last item feels broken rather
        // than choreographed.
        const step = Math.min(index, 6);
        // Observer path: a wall-clock delay.
        el.style.setProperty('--reveal-delay', `calc(var(--reveal-stagger) * ${step})`);
        // Scroll-linked path: there is no wall clock to delay against, so
        // each item starts a little further along the scroll instead.
        el.style.setProperty('--reveal-offset', `${step * 4}%`);
      });
    });
  }

  /* ------------------------------------------------------------------
     Materials pin

     The pinned layout hides each panel off-screen so it can slide in. If the
     named scroll timeline does not resolve, those panels stay hidden and the
     section renders blank — which is exactly what happened when another rule
     overwrote view-timeline-name on the same element.

     So the pin is opt-in: confirm the timeline is declared and supported,
     THEN allow the CSS to hide anything. Otherwise the section stays the
     plain swipeable row, which is complete and correct on its own.
     ------------------------------------------------------------------ */

  function setupMaterialsPin() {
    const section = document.querySelector('[data-materials]');
    if (!section) return;

    const supportsTimelines =
      window.CSS && CSS.supports && CSS.supports('animation-timeline: view()');
    if (!supportsTimelines) return;

    const apply = () => {
      // The pinned treatment is desktop-only; below that the swipe row is
      // the better interaction, not a fallback.
      if (!window.matchMedia('(min-width: 1024px)').matches) {
        document.documentElement.classList.remove('materials-ready');
        return;
      }

      const declared = getComputedStyle(section).viewTimelineName || '';
      const resolved = declared.indexOf('--materials-pin') !== -1;
      document.documentElement.classList.toggle('materials-ready', resolved);
    };

    apply();
    window.matchMedia('(min-width: 1024px)').addEventListener('change', apply);

    /* Section stylesheets are <link>s inside <body>, which are not
       guaranteed to have applied by DOMContentLoaded — so the computed
       view-timeline-name can still read "none" at init and the pin would
       never engage. Re-check once everything has loaded. */
    if (document.readyState !== 'complete') {
      window.addEventListener('load', apply, { once: true });
    }
  }

  /* ------------------------------------------------------------------
     Inline SVG artwork

     An SVG referenced by <img> is a sealed document: stylesheets and
     scripts in this page cannot address a single shape inside it, and
     scripts inside it never run. Animating its parts is therefore not a
     matter of writing better CSS — the markup has to be in this document.
     So the file is fetched and the <img> replaced with the SVG itself.

     Only same-origin files, and the markup is stripped before it goes in.
     Inlining is injecting third-party markup into the page, and an SVG can
     legally carry <script>, event handlers and external references; as an
     <img> none of that could ever execute, and that guarantee should not be
     quietly given up in exchange for an animation.
     ------------------------------------------------------------------ */

  const SVG_FORBIDDEN_TAGS = ['script', 'foreignObject', 'iframe', 'embed', 'object', 'animate', 'set', 'handler'];

  /* A reference is safe if it points inside this document, or if it is an
     embedded raster image.

     The raster case is not a nicety: export tools routinely emit an "SVG"
     that is really a wrapper around base64 PNGs in <image xlink:href>, and
     the first version of this stripped every non-fragment href — which threw
     the artwork away and left an empty frame. Rasters cannot execute
     anything, so they are allowed.

     data:image/svg+xml is deliberately NOT allowed: a nested SVG can carry
     script, and it would arrive after this pass had already run. */
  function isSafeSvgRef(value) {
    const ref = value.trim();
    if (ref.startsWith('#')) return true;
    return /^data:image\/(png|jpe?g|gif|webp|avif);base64,/i.test(ref);
  }

  function sanitiseSvg(svg) {
    SVG_FORBIDDEN_TAGS.forEach((tag) => {
      svg.querySelectorAll(tag).forEach((node) => node.remove());
    });

    svg.querySelectorAll('*').forEach((node) => {
      Array.from(node.attributes).forEach((attr) => {
        const name = attr.name.toLowerCase();
        const value = (attr.value || '').trim();

        // Inline handlers.
        if (name.startsWith('on')) {
          node.removeAttribute(attr.name);
          return;
        }

        if (name === 'href' || name === 'xlink:href') {
          if (!isSafeSvgRef(value)) node.removeAttribute(attr.name);
          return;
        }

        if (value.toLowerCase().startsWith('javascript:')) node.removeAttribute(attr.name);
      });
    });

    return svg;
  }

  async function inlineSvg(img) {
    const source = img.getAttribute('src') || '';
    if (!source.split('?')[0].toLowerCase().endsWith('.svg')) return null;

    // Same-origin only. A cross-origin fetch would fail on CORS anyway, but
    // being explicit keeps the rule visible rather than incidental.
    const url = new URL(source, window.location.href);
    if (url.origin !== window.location.origin) return null;

    const response = await fetch(url.href);
    if (!response.ok) return null;

    const parsed = new DOMParser().parseFromString(await response.text(), 'image/svg+xml');
    if (parsed.querySelector('parsererror')) return null;

    const svg = parsed.documentElement;
    if (!svg || svg.tagName.toLowerCase() !== 'svg') return null;

    sanitiseSvg(svg);

    const adopted = document.importNode(svg, true);
    adopted.setAttribute('class', `${img.className} editorial-art`);
    // meet, not slice: this is artwork rather than a photograph, and cropping
    // a drawing to fill a box cuts off the drawing.
    adopted.setAttribute('preserveAspectRatio', 'xMidYMid meet');
    adopted.removeAttribute('width');
    adopted.removeAttribute('height');

    const alt = img.getAttribute('alt');
    if (alt) {
      adopted.setAttribute('role', 'img');
      adopted.setAttribute('aria-label', alt);
    } else {
      adopted.setAttribute('aria-hidden', 'true');
    }

    // Top-level groups are the drawing's own parts. Numbering them is all
    // the CSS needs to stagger them — no assumption about ids the merchant's
    // export tool may or may not have written.
    Array.from(adopted.children)
      .filter((node) => node.tagName.toLowerCase() === 'g')
      .forEach((group, index) => group.setAttribute('data-art-part', index + 1));

    img.replaceWith(adopted);
    return adopted;
  }

  function setupInlineArt() {
    document.querySelectorAll('[data-inline-svg] img').forEach((img) => {
      inlineSvg(img)
        .then((svg) => {
          if (!svg) return;
          if (!('IntersectionObserver' in window)) {
            svg.classList.add('is-drawn');
            return;
          }
          // Toggled, not added once: the band this sits in sweeps out and
          // back as you scroll past and return, and a one-shot draw would
          // play to an empty screen and never again.
          const observer = new IntersectionObserver(
            ([entry]) => svg.classList.toggle('is-drawn', entry.isIntersecting),
            { threshold: 0.25 }
          );
          observer.observe(svg);
        })
        .catch(() => {
          /* The <img> is still there and still correct. An animation is not
             worth a broken image. */
        });
    });
  }

  /* ------------------------------------------------------------------
     Editorial pin readiness

     Same gate as the materials pin, for the same reason: the sweep's first
     keyframe is fully off-screen at zero opacity, so if the named timeline
     never resolves an ungated pin would leave a two-viewport band holding
     invisible content. Confirm the timeline first, then let CSS pin.
     ------------------------------------------------------------------ */

  function setupEditorialPin() {
    const section = document.querySelector('.image-text--editorial');
    if (!section) return;

    if (!(window.CSS && CSS.supports && CSS.supports('animation-timeline: view()'))) return;

    const query = window.matchMedia('(min-width: 768px)');

    const apply = () => {
      if (!query.matches) {
        document.documentElement.classList.remove('editorial-ready');
        return;
      }
      const declared = getComputedStyle(section).viewTimelineName || '';
      document.documentElement.classList.toggle(
        'editorial-ready',
        declared.indexOf('--editorial-pin') !== -1
      );
    };

    apply();
    query.addEventListener('change', apply);

    // Section stylesheets are <link>s in the body and are not guaranteed to
    // have applied by DOMContentLoaded, so the computed name can still read
    // "none" at init.
    if (document.readyState !== 'complete') {
      window.addEventListener('load', apply, { once: true });
    }
  }

  /* ------------------------------------------------------------------
     Sticky header state

     Only relevant when the header is transparent over a hero. Watching a
     zero-height sentinel costs nothing per frame, unlike reading scrollY in
     a scroll handler.
     ------------------------------------------------------------------ */

  function setupStickyHeader() {
    const header = document.querySelector('[data-header-transparent]');
    const sentinel = document.querySelector('[data-header-sentinel]');
    if (!header || !sentinel || !('IntersectionObserver' in window)) {
      // Without an observer the header stays solid, which is the safe state:
      // a permanently transparent header over scrolled content would be
      // unreadable.
      if (header) header.classList.add('is-stuck');
      return;
    }

    /* Sections opt in with data-header-overlay — the hero and the full-bleed
       material panels. The header stays transparent across all of them and
       only fades to its solid colour once the LAST one has passed under it,
       so the sentinel is moved to the end of that run. */
    const overlays = document.querySelectorAll('[data-header-overlay]');
    if (overlays.length > 0) {
      overlays[overlays.length - 1].insertAdjacentElement('afterend', sentinel);
    }

    const headerHeight = () => header.getBoundingClientRect().height;

    /* Deciding from boundingClientRect rather than isIntersecting matters:
       a sentinel far BELOW the viewport is also "not intersecting", which
       would wrongly read as scrolled-past and make the header solid at the
       top of the page. Its position tells us which side it is on. */
    const evaluate = (entry) => {
      const top = entry
        ? entry.boundingClientRect.top
        : sentinel.getBoundingClientRect().top;
      header.classList.toggle('is-stuck', top <= headerHeight());
    };

    let observer;
    const observe = () => {
      if (observer) observer.disconnect();
      observer = new IntersectionObserver(([entry]) => evaluate(entry), {
        // A detection line level with the bottom of the header.
        rootMargin: `-${Math.round(headerHeight())}px 0px 0px 0px`,
        threshold: 0
      });
      observer.observe(sentinel);
      evaluate(null);
    };

    observe();
    // The header changes height across breakpoints, which moves the line.
    window.addEventListener('resize', () => observe(), { passive: true });
  }

  /* ------------------------------------------------------------------
     Back to top

     Shown once the top of the page has scrolled away. Watches a zero-height
     sentinel rather than listening to scroll, so it costs nothing per frame.
     The control is a plain anchor to #main-content, so it works — and is
     reachable by keyboard — whether or not this runs.
     ------------------------------------------------------------------ */

  function setupBackToTop() {
    const button = document.querySelector('[data-to-top]');
    const sentinel = document.getElementById('top-sentinel');
    if (!button || !sentinel || !('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        button.classList.toggle('is-shown', !entry.isIntersecting);
      },
      // Only once the top is a screenful behind us.
      { rootMargin: '400px 0px 0px 0px', threshold: 0 }
    );
    observer.observe(sentinel);

    button.addEventListener('click', (event) => {
      event.preventDefault();
      const reduced = document.documentElement.classList.contains('reduce-motion');
      window.scrollTo({ top: 0, behavior: reduced ? 'instant' : 'smooth' });
      // Focus the top of the content so a keyboard user actually lands
      // there, rather than the page merely scrolling under them.
      const main = document.getElementById('main-content');
      if (main) main.focus({ preventScroll: true });
    });
  }

  /* ------------------------------------------------------------------
     Reel playback

     Six autoplaying videos is a real cost on a phone — battery, data, and
     decoder pressure — and five of them are off screen. So each reel loads
     nothing until it is close to view, plays only while visible, and pauses
     the moment it leaves. Under the hard motion brake it never plays at all
     and the poster carries the tile, which is why the poster is a real
     attribute rather than a first frame.
     ------------------------------------------------------------------ */

  function setupReels() {
    const reels = document.querySelectorAll('video[data-reel]');
    if (!reels.length) return;

    const root = document.documentElement;
    if (root.classList.contains('reduce-motion')) return;
    if (!('IntersectionObserver' in window)) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const video = entry.target;
          if (entry.isIntersecting) {
            // preload is 'none' in the markup so nothing downloads until a
            // tile is actually approaching the viewport.
            if (video.preload === 'none') video.preload = 'metadata';
            const attempt = video.play();
            if (attempt && typeof attempt.catch === 'function') {
              // Autoplay can still be refused (Low Power Mode, Save-Data).
              // The poster is already there, so there is nothing to repair.
              attempt.catch(() => {});
            }
            video.setAttribute('data-reel-playing', '');
          } else {
            video.pause();
            video.removeAttribute('data-reel-playing');
          }
        });
      },
      { rootMargin: '200px 0px', threshold: 0.25 }
    );

    reels.forEach((video) => {
      // Safari honours the property but not always the attribute.
      video.muted = true;
      observer.observe(video);
    });

    // A backgrounded tab keeps decoding otherwise.
    document.addEventListener('visibilitychange', () => {
      if (document.hidden) reels.forEach((video) => video.pause());
    });
  }

  /* ------------------------------------------------------------------
     Instagram embeds

     Measured on the live store, an embed document takes around eight
     seconds to arrive, and the app inside it needs longer still. Native
     lazy loading only starts a few hundred pixels out, which on this page
     means the reels are still blank when the shopper reaches them.

     So the frames stay lazy in the markup — that is the no-JS behaviour and
     it is the right default — and this promotes them to eager once the
     section is roughly two screens away. Far enough ahead to have loaded by
     the time it is scrolled to, late enough that landing on the homepage
     does not pull six Instagram pages down with it.
     ------------------------------------------------------------------ */

  function setupEmbedPreload() {
    const frames = document.querySelectorAll('iframe[loading="lazy"][data-embed-preload]');
    if (!frames.length || !('IntersectionObserver' in window)) return;

    // Save-Data means the shopper has asked for less. Six third-party frames
    // is exactly the sort of thing they meant.
    const connection = navigator.connection;
    if (connection && connection.saveData) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.loading = 'eager';
          observer.unobserve(entry.target);
        });
      },
      { rootMargin: '200% 0px' }
    );

    frames.forEach((frame) => observer.observe(frame));
  }

  /* ------------------------------------------------------------------
     Cart badge confirmation
     ------------------------------------------------------------------ */

  function setupCartBump() {
    document.addEventListener('cart:rendered', () => {
      const badge = document.querySelector('[data-cart-count]');
      if (!badge || document.documentElement.classList.contains('reduce-motion')) return;
      badge.classList.remove('is-bumped');
      // Reading offsetWidth forces a reflow so the class can be re-added and
      // the animation actually restarts on a second add.
      void badge.offsetWidth;
      badge.classList.add('is-bumped');
    });
  }

  /* ------------------------------------------------------------------
     Boot
     ------------------------------------------------------------------ */

  if (!window.customElements.get('bloom-drawer')) {
    window.customElements.define('bloom-drawer', BloomDrawer);
  }

  window.Bloomarts = {
    // Exposed so cart-drawer.js and facets.js can extend the shell rather
    // than reimplement focus trapping and scroll locking.
    BloomDrawer,
    Capability,
    // Exposed so the motion policy can be re-run and asserted directly,
    // rather than only via media-query events (which browsers suppress in
    // a backgrounded tab, making the behaviour untestable otherwise).
    applyMotionPolicy,
    ScrollLock,
    trapFocus,
    focusableWithin,
    announce,
    formatMoney(cents) {
      const format = window.BloomartsMoneyFormat || '${{amount}}';
      const amount = (cents / 100).toFixed(2);
      return format.replace(/\{\{\s*amount[^}]*\}\}/, amount);
    }
  };

  /* Each step is isolated.

     Previously a ReferenceError in one setup function aborted init() and
     silently took every later feature with it — reveals, the cart badge
     bump, back-to-top and the footer accordions all stopped, with no
     visible symptom beyond "the animations don't work". Failing one
     component must never cascade. */
  function run(label, fn) {
    try {
      fn();
    } catch (error) {
      if (window.console && console.error) {
        console.error(`[Bloomarts] ${label} failed to initialise:`, error);
      }
    }
  }

  function init() {
    let reduced = false;
    run('motion policy', () => {
      reduced = applyMotionPolicy();
      watchMotionPolicy();
    });
    run('header height', trackHeaderHeight);
    run('responsive accordions', setupResponsiveAccordions);
    run('reveal stagger', applyStagger);
    run('scroll reveal', () => setupReveal(reduced));
    run('cart bump', setupCartBump);
    run('materials pin', setupMaterialsPin);
    run('editorial pin', setupEditorialPin);
    run('inline art', setupInlineArt);
    run('sticky header', setupStickyHeader);
    run('back to top', setupBackToTop);
    run('reels', setupReels);
    run('embed preload', setupEmbedPreload);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
