(() => {
  if (!customElements.get('occasion-art')) {
    customElements.define('occasion-art', class extends HTMLElement {
      connectedCallback() {
        this.image = this.querySelector('img');
        if (!this.image) return;
        this.sample = () => {
          const source = this.image.currentSrc || this.image.src;
          if (!this.image.naturalWidth || source === this.source) return;
          this.source = source;
          const probe = new Image();
          probe.crossOrigin = 'anonymous';
          probe.onload = () => {
            if (!this.isConnected || this.source !== source) return;
            try {
              const canvas = document.createElement('canvas');
              canvas.width = canvas.height = 16;
              const context = canvas.getContext('2d', { willReadFrequently: true });
              if (!context) return;
              context.drawImage(probe, 0, 0, 16, 16);
              const pixels = context.getImageData(0, 0, 16, 16).data;
              // Keep each border distinct; never use the centre/dominant colour.
              const edges = {
                top: (x, y) => y < 2,
                bottom: (x, y) => y > 13,
                left: (x, y) => x < 2,
                right: (x, y) => x > 13
              };
              const panel = this.closest('.occasion__panel');
              for (const [edge, includes] of Object.entries(edges)) {
                const sums = [0, 0, 0];
                let weight = 0;
                for (let y = 0; y < 16; y++) for (let x = 0; x < 16; x++) {
                  if (!includes(x, y)) continue;
                  const offset = (y * 16 + x) * 4;
                  const alpha = pixels[offset + 3] / 255;
                  weight += alpha;
                  sums.forEach((_, c) => { sums[c] += pixels[offset + c] * alpha; });
                }
                const property = `--occasion-edge-${edge}`;
                if (weight) panel?.style.setProperty(property, `rgb(${sums.map(value => Math.round(value / weight)).join(', ')})`);
                else panel?.style.removeProperty(property);
              }
            } catch { /* Cross-origin restrictions retain the brand fallback. */ }
          };
          probe.onerror = () => {};
          probe.src = source;
        };
        this.image.addEventListener('load', this.sample);
        this.sample();
      }
      disconnectedCallback() {
        this.image?.removeEventListener('load', this.sample);
        this.source = null;
      }
    });
  }
  if (customElements.get('occasion-carousel')) return;
  class OccasionCarousel extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-occasion-track]');
      this.slides = [...this.querySelectorAll('[data-occasion-slide]')];
      if (!this.track || this.slides.length < 2) return;
      this.abort = new AbortController();
      const on = (target, event, fn, options = {}) => target.addEventListener(event, fn, { ...options, signal: this.abort.signal });
      this.motion = matchMedia('(prefers-reduced-motion: reduce)');
      this.paused = this.dataset.autoplay !== 'true' || this.dataset.editor === 'true' || this.motion.matches;
      this.active = 0;
      this.visible = false;
      this.hovering = false;
      this.toggle = this.querySelector('[data-occasion-toggle]');
      this.count = this.querySelector('[data-occasion-count]');
      this.querySelector('[data-occasion-controls]').hidden = false;
      on(this, 'focusin', () => { this.paused = true; this.schedule(); });
      on(this, 'mouseenter', () => { this.hovering = true; this.schedule(); });
      on(this, 'mouseleave', () => { this.hovering = false; this.schedule(); });
      on(this.track, 'pointerdown', () => { this.paused = true; this.schedule(); }, { passive: true });
      on(this.toggle, 'pointerdown', () => { this.toggleWasPaused = this.paused; });
      on(this.toggle, 'click', event => {
        this.paused = !(event.detail > 0 && this.toggleWasPaused !== undefined ? this.toggleWasPaused : this.paused);
        this.toggleWasPaused = undefined;
        this.schedule();
      });
      on(this.querySelector('[data-occasion-prev]'), 'click', () => { this.paused = true; this.go(this.active - 1); });
      on(this.querySelector('[data-occasion-next]'), 'click', () => { this.paused = true; this.go(this.active + 1); });
      on(document, 'visibilitychange', () => this.schedule());
      on(this.motion, 'change', () => { if (this.motion.matches) this.paused = true; this.schedule(); });
      on(this.track, 'scroll', () => {
        clearTimeout(this.scrollTimer);
        this.scrollTimer = setTimeout(() => this.sync(), 120);
      }, { passive: true });
      on(this, 'shopify:block:select', event => {
        const slide = event.target.closest('[data-occasion-slide]');
        if (slide) { this.paused = true; this.go(this.slides.indexOf(slide), false); }
      });
      this.observer = new IntersectionObserver(entries => {
        this.visible = entries[0].isIntersecting;
        this.schedule();
      }, { threshold: 0.15 });
      this.observer.observe(this);
      this.resize = new ResizeObserver(() => this.go(this.active, false));
      this.resize.observe(this.track);
      this.sync();
    }
    go(index, smooth = true) {
      this.active = (index + this.slides.length) % this.slides.length;
      const delta = this.slides[this.active].getBoundingClientRect().left - this.track.getBoundingClientRect().left;
      this.track.scrollBy({ left: delta, behavior: smooth && !this.motion.matches ? 'smooth' : 'instant' });
      this.schedule();
    }
    sync() {
      const left = this.track.getBoundingClientRect().left;
      let closest = 0;
      this.slides.forEach((slide, index) => {
        if (Math.abs(slide.getBoundingClientRect().left - left) < Math.abs(this.slides[closest].getBoundingClientRect().left - left)) closest = index;
      });
      this.active = closest;
      this.slides.forEach((slide, index) => {
        slide.inert = index !== closest;
        slide.setAttribute('aria-hidden', String(index !== closest));
      });
      this.count.textContent = `${closest + 1} / ${this.slides.length}`;
      this.schedule();
    }
    schedule() {
      clearTimeout(this.timer);
      const stopped = this.paused || this.motion.matches;
      this.toggle.setAttribute('aria-label', stopped ? this.toggle.dataset.play : this.toggle.dataset.pause);
      this.toggle.dataset.paused = String(stopped);
      this.count.setAttribute('aria-live', this.paused ? 'polite' : 'off');
      if (this.paused || this.motion.matches || !this.visible || this.hovering || document.hidden || this.dataset.editor === 'true') return;
      this.timer = setTimeout(() => this.go(this.active + 1), Math.max(0.5, Number(this.dataset.interval) || 1) * 1000);
    }
    disconnectedCallback() {
      this.abort?.abort();
      this.observer?.disconnect();
      this.resize?.disconnect();
      clearTimeout(this.timer);
      clearTimeout(this.scrollTimer);
    }
  }
  customElements.define('occasion-carousel', OccasionCarousel);
})();
