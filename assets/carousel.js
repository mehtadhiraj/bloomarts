/* ==========================================================================
   <bloom-carousel>

   Adds prev/next controls to any native scroll-snap row. The row already
   scrolls and snaps without this — swipe on touch, trackpad or shift-wheel
   on desktop — so this only supplies the affordance a mouse user has no
   gesture for.
   ========================================================================== */

(function () {
  'use strict';

  class BloomCarousel extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-carousel-track]');
      this.prevButton = this.querySelector('[data-carousel-prev]');
      this.nextButton = this.querySelector('[data-carousel-next]');
      if (!this.track) return;

      this.items = Array.from(this.track.querySelectorAll('[data-carousel-item]'));
      if (this.items.length === 0) return;

      if (this.prevButton) this.prevButton.addEventListener('click', () => this.page(-1));
      if (this.nextButton) this.nextButton.addEventListener('click', () => this.page(1));

      // Reading scroll offsets is cheap, but doing it on every scroll event
      // is not — one rAF per burst is enough to keep the arrows in step.
      this.track.addEventListener('scroll', () => this.scheduleSync(), { passive: true });
      window.addEventListener('resize', () => this.scheduleSync(), { passive: true });

      this.sync();
    }

    scheduleSync() {
      if (this.frame) return;
      this.frame = requestAnimationFrame(() => {
        this.frame = 0;
        this.sync();
      });
    }

    /* Scroll by whole items rather than a fixed pixel amount, so a page
       always lands on a snap point regardless of how many fit. */
    page(direction) {
      const first = this.items[0];
      if (!first) return;

      const itemWidth = first.getBoundingClientRect().width;
      const gap = parseFloat(getComputedStyle(this.track).columnGap) || 0;
      const step = itemWidth + gap;
      const perPage = Math.max(1, Math.floor(this.track.clientWidth / step));

      const reduced = document.documentElement.classList.contains('reduce-motion');
      this.track.scrollBy({
        left: step * perPage * direction,
        behavior: reduced ? 'instant' : 'smooth'
      });
    }

    sync() {
      if (!this.prevButton || !this.nextButton) return;
      const { scrollLeft, scrollWidth, clientWidth } = this.track;
      // 2px of slack: sub-pixel layout means scrollLeft rarely hits the
      // exact end, which would leave the next arrow enabled forever.
      this.prevButton.disabled = scrollLeft <= 2;
      this.nextButton.disabled = scrollLeft + clientWidth >= scrollWidth - 2;
    }
  }

  if (!window.customElements.get('bloom-carousel')) {
    window.customElements.define('bloom-carousel', BloomCarousel);
  }
})();
