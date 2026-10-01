(() => {
  if (customElements.get('public-coupons')) return;
  customElements.define('public-coupons', class extends HTMLElement {
    connectedCallback() {
      this.abort = new AbortController();
      const on = (el, event, fn, options = {}) => el.addEventListener(event, fn, { ...options, signal: this.abort.signal });
      this.dialog = this.querySelector('dialog');
      this.launcher = this.querySelector('[data-open]');
      const track = this.querySelector('.coupon-window');
      const pause = this.querySelector('[data-pause]');
      const motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.paused = motion.matches;
      this.launcher.hidden = false;
      this.setAttribute('data-ready', '');
      this.refreshCart = async () => {
        const request = this.cartRequest = (this.cartRequest || 0) + 1;
        try {
          const response = await fetch(`${window.Shopify?.routes?.root || '/'}cart.js`, { signal: this.abort.signal });
          if (!response.ok) throw new Error('Cart unavailable');
          const cart = await response.json();
          if (request !== this.cartRequest || !this.isConnected) return;
          this.cart = cart; this.updateOffers();
        } catch { if (request === this.cartRequest) { this.cart = null; this.updateOffers(); } }
      };
      const queueCart = () => { if (!this.querySelector('[data-shipping="true"]')) return; clearTimeout(this.cartTimer); this.cartTimer = setTimeout(this.refreshCart, 150); };
      on(document, 'cart:updated', queueCart);
      on(document, 'cart:rendered', queueCart);
      on(window, 'pageshow', queueCart);
      on(document, 'visibilitychange', () => { if (!document.hidden) queueCart(); });
      this.updateOffers();
      if (this.querySelector('[data-shipping="true"]')) this.refreshCart();
      this.offerTimer = setInterval(() => this.updateOffers(), 30000);
      const label = () => {
        const name = this.paused ? pause.dataset.play : pause.dataset.stop;
        pause.setAttribute('aria-label', name); pause.title = name;
        pause.innerHTML = this.paused ? '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5v14l11-7z"/></svg>' : '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M6 5h4v14H6zm8 0h4v14h-4z"/></svg>';
      };
      label();
      // Give even a single short offer a full viewport of travel on both sides.
      // No duplicated interactive cards or obsolete marquee element needed.
      let travelWidth = 0;
      this.trackResize = new ResizeObserver(() => {
        const width = track.clientWidth;
        pause.hidden = motion.matches;
        track.style.setProperty('--coupon-travel', motion.matches ? '0px' : `${width}px`);
        if (width && width !== travelWidth) {
          track.scrollLeft = motion.matches ? 0 : width;
          travelWidth = width;
        }
      });
      this.trackResize.observe(track);
      this.trackResize.observe(track.querySelector('.coupon-track'));
      on(pause, 'click', () => { this.paused = !this.paused; label(); });
      on(track, 'focusin', () => { this.paused = true; label(); });
      on(track, 'pointerdown', () => { this.paused = true; label(); });
      on(track, 'mouseenter', () => { this.hovered = true; });
      on(track, 'mouseleave', () => { this.hovered = false; });
      on(motion, 'change', () => {
        this.paused = motion.matches; label(); pause.hidden = motion.matches;
        track.style.setProperty('--coupon-travel', motion.matches ? '0px' : `${track.clientWidth}px`);
        track.scrollLeft = motion.matches ? 0 : track.clientWidth;
      });
      on(this.launcher, 'click', () => this.dialog.showModal());
      on(this.querySelector('[data-close]'), 'click', () => this.dialog.close());
      on(this.dialog, 'click', e => { if (e.target === this.dialog) { const r = this.dialog.getBoundingClientRect(); if (e.clientX < r.left || e.clientX > r.right || e.clientY < r.top || e.clientY > r.bottom) this.dialog.close(); } });
      on(this.dialog, 'close', () => this.launcher.focus({ preventScroll: true }));
      on(this, 'click', async e => {
        const card = e.target.closest('[data-coupon]');
        if (!card) return;
        let copied = false;
        try { await navigator.clipboard.writeText(card.dataset.coupon); copied = true; } catch {
          const input = document.createElement('textarea');
          input.value = card.dataset.coupon;
          input.style.cssText = 'position:fixed;opacity:0;pointer-events:none';
          (this.dialog.open ? this.dialog : this).append(input);
          input.select();
          try { copied = document.execCommand('copy'); } catch { /* Manual copy remains available. */ }
          input.remove(); card.focus({ preventScroll: true });
        }
        if (!this.isConnected) return;
        const status = this.querySelector('.coupon-toast');
        // A modal dialog is in the top layer, so keep feedback inside it.
        (this.dialog.open ? this.dialog : this).append(status);
        status.textContent = copied ? this.dataset.success : this.dataset.failure;
        clearTimeout(this.noticeTimer);
        this.noticeTimer = setTimeout(() => { status.textContent = ''; }, 3500);
      });
      const sticky = document.querySelector('.sticky-atc');
      if (sticky) { this.resize = new ResizeObserver(() => this.style.setProperty('--public-coupon-cart-height', `${sticky.getBoundingClientRect().height}px`)); this.resize.observe(sticky); }
      // Move contents left-to-right; pause offscreen, on interaction and for reduced motion.
      this.observer = new IntersectionObserver(([entry]) => { this.visible = entry.isIntersecting; });
      this.observer.observe(track);
      track.scrollLeft = track.scrollWidth;
      this.tick = setInterval(() => {
        if (!this.visible || this.paused || this.hovered || motion.matches || document.hidden || !track.clientWidth) return;
        if (track.scrollLeft <= 0) track.scrollLeft = track.scrollWidth;
        else track.scrollLeft -= 1;
      }, 40);
    }
    updateOffers() {
      const now = Date.now();
      const timestamp = value => !value ? null : (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}(?::\d{2})?(?:Z|[+-]\d{2}:\d{2})$/.test(value) ? Date.parse(value) : NaN);
      this.querySelectorAll('[data-offer]').forEach(card => {
        const start = timestamp(card.dataset.start), end = timestamp(card.dataset.end);
        const valid = !Number.isNaN(start) && !Number.isNaN(end) && !(start !== null && end !== null && end < start);
        const active = valid && (start === null || now >= start) && (end === null || now <= end);
        card.hidden = valid && end !== null && now > end;
        const progress = card.querySelector('[data-shipping-progress]');
        progress.hidden = true;
        const minimum = Number(card.dataset.minimum);
        const currency = card.dataset.currency?.trim().toUpperCase();
        if (!active || card.dataset.shipping !== 'true' || !card.dataset.minimum || !Number.isFinite(minimum) || minimum < 0 || !this.cart?.item_count || !Number.isFinite(this.cart.total_price) || this.cart.currency !== currency) return;
        const remaining = Math.max(0, Math.round(minimum * 100) - this.cart.total_price);
        try {
          const amount = new Intl.NumberFormat(document.documentElement.lang || 'en-IN', { style: 'currency', currency, maximumFractionDigits: 2 }).format(remaining / 100);
          progress.textContent = remaining ? this.dataset.remaining.replace('[amount]', amount) : this.dataset.unlocked;
          progress.toggleAttribute('data-unlocked', remaining === 0);
          progress.hidden = false;
        } catch { /* Invalid currency configuration must not promise shipping. */ }
      });
    }
    disconnectedCallback() { this.abort?.abort(); this.observer?.disconnect(); this.resize?.disconnect(); this.trackResize?.disconnect(); clearInterval(this.tick); clearInterval(this.offerTimer); clearTimeout(this.cartTimer); clearTimeout(this.noticeTimer); }
  });
})();
