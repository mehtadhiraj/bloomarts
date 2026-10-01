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
      pause.hidden = false;
      this.setAttribute('data-ready', '');
      const label = () => { pause.textContent = this.paused ? pause.dataset.play : pause.dataset.stop; };
      label();
      on(pause, 'click', () => { this.paused = !this.paused; label(); });
      on(track, 'focusin', () => { this.paused = true; label(); });
      on(track, 'pointerdown', () => { this.paused = true; label(); });
      on(track, 'mouseenter', () => { this.hovered = true; });
      on(track, 'mouseleave', () => { this.hovered = false; });
      on(motion, 'change', () => { this.paused = motion.matches; label(); });
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
    disconnectedCallback() { this.abort?.abort(); this.observer?.disconnect(); this.resize?.disconnect(); clearInterval(this.tick); clearTimeout(this.noticeTimer); }
  });
})();
