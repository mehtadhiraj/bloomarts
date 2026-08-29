/* ==========================================================================
   <quantity-input>

   Steps the value and emits a single `quantity:change` event. It does not
   know about carts — the cart component listens and decides what to do,
   which keeps the same element usable on the product page where there is
   no line to update.
   ========================================================================== */

(function () {
  'use strict';

  class QuantityInput extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('[data-qty-input]');
      if (!this.input) return;

      this.querySelectorAll('[data-qty-step]').forEach((button) => {
        button.addEventListener('click', () => {
          this.step(Number(button.getAttribute('data-qty-step')));
        });
      });

      // 'change' rather than 'input': committing on every keystroke would
      // fire a cart request for the intermediate value while typing "12".
      this.input.addEventListener('change', () => this.commit());

      this.syncButtons();
    }

    get min() {
      const value = Number(this.input.getAttribute('min'));
      return Number.isFinite(value) ? value : 1;
    }

    get max() {
      const raw = this.input.getAttribute('max');
      if (raw === null || raw === '') return Infinity;
      const value = Number(raw);
      return Number.isFinite(value) ? value : Infinity;
    }

    step(delta) {
      const current = Number(this.input.value) || this.min;
      const next = Math.min(this.max, Math.max(this.min, current + delta));
      if (next === current) return;
      this.input.value = String(next);
      this.commit();
    }

    commit() {
      let value = parseInt(this.input.value, 10);
      // A cleared field must not silently post NaN to the Cart API.
      if (!Number.isFinite(value)) value = this.min;
      value = Math.min(this.max, Math.max(this.min, value));
      this.input.value = String(value);

      this.syncButtons();
      this.dispatchEvent(
        new CustomEvent('quantity:change', {
          bubbles: true,
          detail: { quantity: value, lineKey: this.getAttribute('data-line-key') }
        })
      );
    }

    syncButtons() {
      const value = Number(this.input.value);
      this.querySelectorAll('[data-qty-step]').forEach((button) => {
        const delta = Number(button.getAttribute('data-qty-step'));
        const next = value + delta;
        button.disabled = next < this.min || next > this.max;
      });
    }

    setBusy(state) {
      this.classList.toggle('is-busy', state);
    }
  }

  if (!window.customElements.get('quantity-input')) {
    window.customElements.define('quantity-input', QuantityInput);
  }
})();
