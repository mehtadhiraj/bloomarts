(() => {
  if (customElements.get('offer-ribbons')) return;
  customElements.define('offer-ribbons', class extends HTMLElement {
    connectedCallback() {
      this.abort = new AbortController();
      const on = (target, type, fn, options = {}) => target.addEventListener(type, fn, { ...options, signal: this.abort.signal });
      this.panel = this.querySelector('[data-offers-panel]');
      this.launcher = this.querySelector('[data-offers-toggle]');
      this.launcher.hidden = false;
      on(this.launcher, 'click', () => this.panel.hidden || this.hasAttribute('data-closing') ? this.open(true) : this.close());
      const sticky = document.querySelector('.sticky-atc');
      if (sticky) {
        this.resize = new ResizeObserver(() => document.documentElement.style.setProperty('--offers-cart-height', `${sticky.getBoundingClientRect().height}px`));
        this.resize.observe(sticky);
      }
      on(this.panel, 'click', event => {
        if (event.target === this.panel || event.target.classList.contains('offer-ribbons__group')) this.close();
      });
      on(document, 'keydown', event => { if (event.key === 'Escape') this.close(); });
      on(window, 'scroll', () => { if (Math.abs(window.scrollY - this.openY) > 12) this.close(); }, { passive: true });
      on(this, 'shopify:block:select', () => this.open(false));
      // Homepage only: do not pop offers open on product pages or restored scroll.
      if (this.dataset.autoOpen === 'true' && window.scrollY < 20 && this.dataset.editor !== 'true') this.open(false);
    }
    open(focus) {
      this.cancelCloseAnimation();
      clearTimeout(this.timer);
      cancelAnimationFrame(this.frame);
      this.removeAttribute('data-closing');
      this.setAttribute('data-opening', '');
      this.panel.hidden = false;
      this.panel.inert = false;
      this.launcher.hidden = false;
      this.launcher.setAttribute('aria-expanded', 'true');
      this.launcher.setAttribute('aria-label', this.launcher.dataset.closeLabel);
      this.openY = window.scrollY;
      // Establish the corner positions before transitioning into view.
      void this.panel.offsetWidth;
      this.frame = requestAnimationFrame(() => this.removeAttribute('data-opening'));
      if (focus) this.launcher.focus({ preventScroll: true });
    }
    close() {
      if (this.panel.hidden || this.hasAttribute('data-closing')) return;
      const restore = this.panel.contains(document.activeElement);
      cancelAnimationFrame(this.frame);
      this.removeAttribute('data-opening');
      const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
      const centre = { x: window.innerWidth / 2, y: window.innerHeight / 2 };
      const button = this.launcher.getBoundingClientRect();
      const groups = [...this.querySelectorAll('.offer-ribbons__group')].map(group => ({ group, rect: group.getBoundingClientRect() }));
      this.setAttribute('data-closing', '');
      this.launcher.hidden = false;
      this.launcher.setAttribute('aria-expanded', 'false');
      this.launcher.setAttribute('aria-label', this.launcher.dataset.openLabel);
      if (restore) this.launcher.focus({ preventScroll: true });
      this.panel.inert = true;
      if (!reduce) {
        const x = centre.x - button.left - button.width / 2;
        const y = centre.y - button.top - button.height / 2;
        this.closeAnimations = groups.map(({ group, rect }) => {
          const baseX = group.offsetLeft + group.offsetWidth / 2;
          const baseY = group.offsetTop + group.offsetHeight / 2;
          return group.animate([
            { transformOrigin: 'center', transform: `translate(${rect.left + rect.width / 2 - baseX}px, ${rect.top + rect.height / 2 - baseY}px) rotate(-12deg) scale(1)`, opacity: 1 },
            { transformOrigin: 'center', transform: `translate(${centre.x - baseX}px, ${centre.y - baseY}px) rotate(8deg) scale(.02)`, opacity: 0 }
          ], { duration: 850, easing: 'cubic-bezier(.55,0,.3,1)', fill: 'forwards' });
        });
        this.closeAnimations.push(this.launcher.animate([
          { transform: `translate(${x}px, ${y}px) scale(.65) rotate(0deg)`, offset: 0 },
          { transform: `translate(${x}px, ${y}px) scale(1.12) rotate(360deg)`, offset: .5 },
          { transform: `translate(${x}px, ${y}px) scale(1) rotate(360deg)`, offset: .58 },
          { transform: 'translate(0,0) scale(1) rotate(720deg)', offset: 1 }
        ], { duration: 1600, easing: 'cubic-bezier(.22,1,.36,1)', fill: 'forwards' }));
      }
      this.timer = setTimeout(() => {
        this.panel.hidden = true;
        this.removeAttribute('data-closing');
        this.cancelCloseAnimation();
      }, reduce ? 0 : 1600);
    }
    cancelCloseAnimation() { this.closeAnimations?.forEach(animation => animation.cancel()); this.closeAnimations = []; }
    disconnectedCallback() { this.abort?.abort(); this.resize?.disconnect(); clearTimeout(this.timer); cancelAnimationFrame(this.frame); this.cancelCloseAnimation(); }
  });
})();
