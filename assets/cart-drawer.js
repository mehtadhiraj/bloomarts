/* ==========================================================================
   <cart-drawer>

   Owns every cart mutation. Extends the shared drawer so focus trapping,
   the scroll lock and dismissal behave identically to the menu and filter
   sheets.

   Updated markup always comes from Liquid via the Section Rendering API.
   Building line items in JavaScript would mean a second copy of the
   template that silently drifts from snippets/cart-line-item.liquid.
   ========================================================================== */

(function () {
  'use strict';

  const Base = (window.Bloomarts && window.Bloomarts.BloomDrawer) || HTMLElement;

  // Sections re-rendered after every mutation: the drawer for its contents,
  // the header for its cart badge.
  const SECTIONS = ['cart-drawer', 'header'];

  class CartDrawer extends Base {
    connectedCallback() {
      if (super.connectedCallback) super.connectedCallback();

      this.contents = this.querySelector('[data-cart-contents]');

      this.addEventListener('quantity:change', (event) => {
        const { lineKey, quantity } = event.detail;
        if (!lineKey) return;
        this.updateLine(lineKey, quantity, event.target);
      });

      this.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-cart-remove]');
        if (!remove) return;
        event.preventDefault();
        this.updateLine(remove.getAttribute('data-line-key'), 0, remove);
      });

      // Fired by product-form.js after a successful add.
      document.addEventListener('cart:updated', (event) => {
        const detail = event.detail || {};
        if (detail.sections) {
          this.applySections(detail.sections);
        } else {
          this.refresh();
        }
        if (detail.open !== false) this.open(detail.opener);
      });
    }

    get sectionsUrl() {
      // Section rendering needs a real storefront path; the cart is always
      // valid and avoids re-rendering an expensive product template.
      return window.location.pathname;
    }

    async updateLine(lineKey, quantity, control) {
      if (!lineKey) return;

      this.setBusy(control, true);

      const routes = window.BloomartsRoutes || {};
      const strings = window.BloomartsStrings || {};

      try {
        const response = await fetch(routes.cart_change || '/cart/change.js', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json'
          },
          body: JSON.stringify({
            id: lineKey,
            quantity,
            sections: SECTIONS,
            sections_url: this.sectionsUrl
          })
        });

        if (!response.ok) throw new Error(`Cart update failed: ${response.status}`);

        const data = await response.json();
        this.applySections(data.sections);

        if (window.Bloomarts && window.Bloomarts.announce) {
          window.Bloomarts.announce(
            quantity === 0 ? strings.itemRemoved || 'Item removed' : strings.cartUpdated || 'Cart updated'
          );
        }
      } catch (error) {
        this.setBusy(control, false);
        this.showError(control);
      }
    }

    /* Re-fetches the current page purely for its rendered sections. Used as
       a fallback when a mutation happened somewhere that did not request
       them. */
    async refresh() {
      try {
        const url = `${this.sectionsUrl}?sections=${SECTIONS.join(',')}`;
        const response = await fetch(url, { headers: { Accept: 'application/json' } });
        if (!response.ok) throw new Error(`Cart refresh failed: ${response.status}`);
        this.applySections(await response.json());
      } catch (error) {
        /* Leaving the stale drawer in place is better than blanking it —
           the customer can still reach /cart, which is always accurate. */
      }
    }

    applySections(sections) {
      if (!sections) return;

      if (sections['cart-drawer'] && this.contents) {
        const fresh = this.parse(sections['cart-drawer'], '[data-cart-contents]');
        if (fresh) {
          this.contents.innerHTML = fresh.innerHTML;
          this.classList.toggle('is-empty', !this.querySelector('[data-cart-items]'));
        }
      }

      if (sections.header) {
        this.syncHeaderCount(sections.header);
      }

      document.dispatchEvent(new CustomEvent('cart:rendered', { bubbles: true }));
    }

    syncHeaderCount(html) {
      const doc = new DOMParser().parseFromString(html, 'text/html');

      const freshCount = doc.querySelector('[data-cart-count]');
      const liveCount = document.querySelector('[data-cart-count]');
      if (freshCount && liveCount) {
        liveCount.textContent = freshCount.textContent;
        liveCount.classList.toggle('is-empty', freshCount.classList.contains('is-empty'));
      }

      const freshText = doc.querySelector('[data-cart-count-text]');
      const liveText = document.querySelector('[data-cart-count-text]');
      if (freshText && liveText) liveText.textContent = freshText.textContent;

      const freshLabel = doc.querySelector('[data-cart-count-label]');
      const liveLabel = this.querySelector('[data-cart-count-label]');
      if (freshLabel && liveLabel) liveLabel.textContent = freshLabel.textContent;
    }

    parse(html, selector) {
      return new DOMParser().parseFromString(html, 'text/html').querySelector(selector);
    }

    setBusy(control, state) {
      const line = control && control.closest ? control.closest('[data-cart-item]') : null;
      if (line) line.classList.toggle('is-busy', state);
    }

    showError(control) {
      const strings = window.BloomartsStrings || {};
      const message = strings.addToCartError || 'Something went wrong. Please try again.';
      if (window.Bloomarts && window.Bloomarts.announce) window.Bloomarts.announce(message);

      const line = control && control.closest ? control.closest('[data-cart-item]') : null;
      const host = line || this.querySelector('[data-cart-contents]');
      if (!host) return;

      let error = host.querySelector('[data-cart-error]');
      if (!error) {
        error = document.createElement('p');
        error.className = 'field__error text-sm';
        error.setAttribute('role', 'alert');
        error.setAttribute('data-cart-error', '');
        host.appendChild(error);
      }
      error.textContent = message;
    }
  }

  if (!window.customElements.get('cart-drawer')) {
    window.customElements.define('cart-drawer', CartDrawer);
  }
})();
