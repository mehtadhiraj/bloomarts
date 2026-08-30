/* ==========================================================================
   <product-gallery>

   The scroll container is the source of truth. This element never drives
   the scroll position frame by frame — it asks the browser to scroll and
   then reacts to where the browser ended up. Anything else fights the
   native momentum on touch.
   ========================================================================== */

(function () {
  'use strict';

  class ProductGallery extends HTMLElement {
    connectedCallback() {
      this.track = this.querySelector('[data-gallery-track]');
      if (!this.track) return;

      this.slides = Array.from(this.querySelectorAll('[data-gallery-slide]'));
      this.dots = Array.from(this.querySelectorAll('[data-gallery-dots] [data-gallery-goto]'));
      this.thumbs = Array.from(this.querySelectorAll('[data-gallery-thumbs] [data-gallery-goto]'));
      this.prevButton = this.querySelector('[data-gallery-prev]');
      this.nextButton = this.querySelector('[data-gallery-next]');
      this.index = 0;

      // Before the single-slide bail-out: a product with one photograph
      // still gets to have that photograph zoomed.
      this.setupZoom();

      if (this.slides.length <= 1) return;

      this.querySelectorAll('[data-gallery-goto]').forEach((button) => {
        button.addEventListener('click', () => {
          this.goTo(Number(button.getAttribute('data-gallery-goto')));
        });
      });

      if (this.prevButton) this.prevButton.addEventListener('click', () => this.goTo(this.index - 1));
      if (this.nextButton) this.nextButton.addEventListener('click', () => this.goTo(this.index + 1));

      this.track.addEventListener('keydown', this.onKeydown.bind(this));

      this.observe();
      this.sync();

      // A rotation changes slide width; the browser keeps the raw scroll
      // offset, which lands the track between two slides.
      window.addEventListener('orientationchange', () => {
        requestAnimationFrame(() => this.goTo(this.index, 'instant'));
      });
    }

    disconnectedCallback() {
      if (this.observer) this.observer.disconnect();
    }

    /* ------------------------------------------------------------------
       Click to zoom, move to pan.

       The scale and the pan both live in CSS custom properties, so this
       only ever writes two numbers and lets the compositor do the work —
       no layout, no per-frame style recalculation of anything else.
       ------------------------------------------------------------------ */

    setupZoom() {
      this.querySelectorAll('[data-gallery-zoom]').forEach((frame) => {
        const clamp = (n) => Math.min(100, Math.max(0, n));

        const panTo = (event) => {
          const rect = frame.getBoundingClientRect();
          if (!rect.width || !rect.height) return;
          const x = ((event.clientX - rect.left) / rect.width) * 100;
          const y = ((event.clientY - rect.top) / rect.height) * 100;
          // The origin is the point held still under the cursor, so moving
          // right reveals what is off to the right — the image tracks the
          // pointer rather than running away from it.
          frame.style.setProperty('--zoom-x', `${clamp(x)}%`);
          frame.style.setProperty('--zoom-y', `${clamp(y)}%`);
        };

        const zoomOut = () => {
          if (!frame.classList.contains('is-zoomed')) return;
          frame.classList.remove('is-zoomed');
          frame.setAttribute('aria-pressed', 'false');
          frame.removeEventListener('pointermove', panTo);
          frame.style.removeProperty('--zoom-x');
          frame.style.removeProperty('--zoom-y');
        };

        frame.addEventListener('click', (event) => {
          if (frame.classList.contains('is-zoomed')) {
            zoomOut();
            return;
          }

          frame.classList.add('is-zoomed');
          frame.setAttribute('aria-pressed', 'true');

          // detail is 0 when the click came from Enter or Space, where
          // clientX/clientY are both 0 and would slam the origin into the
          // top-left corner. Keyboard zoom starts centred.
          if (event.detail > 0) panTo(event);

          frame.addEventListener('pointermove', panTo);
        });

        // Leaving the image is the same intent as clicking again.
        frame.addEventListener('pointerleave', zoomOut);
        frame.addEventListener('keydown', (event) => {
          if (event.key === 'Escape') zoomOut();
        });
      });
    }

    /* Watching the slides is far cheaper than a scroll handler, and it
       reports the settled position rather than every intermediate frame. */
    observe() {
      if (!('IntersectionObserver' in window)) return;

      this.observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (!entry.isIntersecting) return;
            const index = Number(entry.target.getAttribute('data-index'));
            if (index === this.index) return;
            this.index = index;
            this.sync();
            this.announce();
          });
        },
        { root: this.track, threshold: 0.6 }
      );

      this.slides.forEach((slide) => this.observer.observe(slide));
    }

    onKeydown(event) {
      if (event.key === 'ArrowRight') {
        event.preventDefault();
        this.goTo(this.index + 1);
      } else if (event.key === 'ArrowLeft') {
        event.preventDefault();
        this.goTo(this.index - 1);
      } else if (event.key === 'Home') {
        event.preventDefault();
        this.goTo(0);
      } else if (event.key === 'End') {
        event.preventDefault();
        this.goTo(this.slides.length - 1);
      }
    }

    goTo(index, behavior) {
      const clamped = Math.min(this.slides.length - 1, Math.max(0, index));
      const slide = this.slides[clamped];
      if (!slide) return;

      const reduced = document.documentElement.classList.contains('reduce-motion');
      this.track.scrollTo({
        left: slide.offsetLeft - this.track.offsetLeft,
        behavior: behavior || (reduced ? 'instant' : 'smooth')
      });

      // Update immediately rather than waiting for the observer, so the dot
      // responds on tap even mid-scroll.
      this.index = clamped;
      this.sync();
    }

    sync() {
      [...this.dots, ...this.thumbs].forEach((button) => {
        const isCurrent = Number(button.getAttribute('data-gallery-goto')) === this.index;
        if (isCurrent) {
          button.setAttribute('aria-current', 'true');
        } else {
          button.removeAttribute('aria-current');
        }
      });

      if (this.prevButton) this.prevButton.disabled = this.index === 0;
      if (this.nextButton) this.nextButton.disabled = this.index === this.slides.length - 1;
    }

    announce() {
      const strings = window.BloomartsStrings || {};
      const template = strings.slideOf || 'Image {{ current }} of {{ total }}';
      const message = template
        .replace(/\{\{\s*current\s*\}\}/, String(this.index + 1))
        .replace(/\{\{\s*total\s*\}\}/, String(this.slides.length));

      if (window.Bloomarts && window.Bloomarts.announce) window.Bloomarts.announce(message);
    }

    /* Called by the variant picker when a variant has its own image. */
    showMedia(mediaId) {
      const slide = this.slides.find((s) => s.id === `gallery-slide-${mediaId}`);
      if (slide) this.goTo(Number(slide.getAttribute('data-index')));
    }
  }

  if (!window.customElements.get('product-gallery')) {
    window.customElements.define('product-gallery', ProductGallery);
  }
})();
