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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-revealed');
          // Unobserve immediately: a reveal is a one-shot, and leaving it
          // observed would keep the callback firing for the life of the page.
          observer.unobserve(entry.target);
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
    run('back to top', setupBackToTop);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
