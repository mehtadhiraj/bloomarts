/* ==========================================================================
   <sticky-atc>

   Reveals when the inline Add to cart has scrolled above the viewport, and
   hides again when it scrolls back into view.

   It deliberately does NOT hide when the footer appears. That was the first
   approach and it failed in practice: a real footer enters the viewport
   long before the reader has finished the page, which suppressed the bar
   for most of the scroll. Instead the product template reserves matching
   bottom padding on the footer in CSS, so the bar can never cover footer
   content and nothing shifts to make room for it.

   Driven entirely by IntersectionObserver. No scroll listener: a scroll
   handler that reads layout runs on every frame of a flick gesture, which
   is exactly the jank this bar must not introduce.
   ========================================================================== */

(function () {
  'use strict';

  class StickyAtc extends HTMLElement {
    connectedCallback() {
      this.anchor = document.querySelector('[data-atc-anchor]');

      // Desktop keeps the inline button in a sticky column; there is nothing
      // for this element to do, so it never starts observing.
      this.query = window.matchMedia('(max-width: 1023px)');

      if (!this.anchor || !('IntersectionObserver' in window)) return;

      this.anchorPassed = false;

      this.anchorObserver = new IntersectionObserver(
        ([entry]) => {
          // Above the viewport, not merely outside it — scrolling DOWN past
          // the button reveals the bar, but scrolling up so the button sits
          // below the fold must not.
          this.anchorPassed = !entry.isIntersecting && entry.boundingClientRect.top < 0;
          this.update();
        },
        { threshold: 0 }
      );
      this.anchorObserver.observe(this.anchor);

      this.query.addEventListener('change', () => this.update());
    }

    disconnectedCallback() {
      if (this.anchorObserver) this.anchorObserver.disconnect();
    }

    update() {
      const visible = this.query.matches && this.anchorPassed;
      if (visible === this.visible) return;
      this.visible = visible;

      this.classList.toggle('is-visible', visible);
      // Hidden from assistive tech while off-screen: the inline button is
      // the one in the reading order, and announcing a duplicate would be
      // noise.
      this.setAttribute('aria-hidden', String(!visible));
    }
  }

  if (!window.customElements.get('sticky-atc')) {
    window.customElements.define('sticky-atc', StickyAtc);
  }
})();
