/* ==========================================================================
   <cart-page>

   The cart page works without this file — quantity fields are inside the
   form and the browser posts them on checkout. This only removes the need
   to press an "Update" button, which on a phone is an easy step to miss.
   ========================================================================== */

(function () {
  'use strict';

  const SECTIONS = ['main-cart', 'header', 'cart-drawer'];

  class CartPage extends HTMLElement {
    connectedCallback() {
      this.addEventListener('quantity:change', (event) => {
        const { lineKey, quantity } = event.detail;
        if (!lineKey) return;
        this.update(lineKey, quantity, event.target);
      });

      this.addEventListener('click', (event) => {
        const remove = event.target.closest('[data-cart-remove]');
        if (!remove) return;
        event.preventDefault();
        this.update(remove.getAttribute('data-line-key'), 0, remove);
      });
    }

    async update(lineKey, quantity, control) {
      const line = control.closest ? control.closest('[data-cart-item]') : null;
      if (line) line.classList.add('is-busy');

      const routes = window.BloomartsRoutes || {};
      const strings = window.BloomartsStrings || {};

      try {
        const response = await fetch(routes.cart_change || '/cart/change.js', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            id: lineKey,
            quantity,
            sections: SECTIONS,
            sections_url: window.location.pathname
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
        if (line) line.classList.remove('is-busy');
        // Falling back to a reload is acceptable here: unlike the drawer,
        // this page has nothing open that a reload would discard.
        window.location.reload();
      }
    }

    applySections(sections) {
      if (!sections) return;

      if (sections['main-cart']) {
        const doc = new DOMParser().parseFromString(sections['main-cart'], 'text/html');

        const freshItems = doc.querySelector('[data-cart-items]');
        const liveItems = this.querySelector('[data-cart-items]');
        if (freshItems && liveItems) {
          liveItems.innerHTML = freshItems.innerHTML;
        } else {
          // The cart just emptied; the whole section has to change shape.
          window.location.reload();
          return;
        }

        const freshTotal = doc.querySelector('[data-cart-subtotal]');
        const liveTotal = this.querySelector('[data-cart-subtotal]');
        if (freshTotal && liveTotal) liveTotal.textContent = freshTotal.textContent;
      }

      if (sections.header) {
        const doc = new DOMParser().parseFromString(sections.header, 'text/html');
        const fresh = doc.querySelector('[data-cart-count]');
        const live = document.querySelector('[data-cart-count]');
        if (fresh && live) {
          live.textContent = fresh.textContent;
          live.classList.toggle('is-empty', fresh.classList.contains('is-empty'));
        }
      }
    }
  }

  if (!window.customElements.get('cart-page')) {
    window.customElements.define('cart-page', CartPage);
  }
})();
