/* ==========================================================================
   <predictive-search>

   Decorates a working GET form. If this script never loads, or the network
   is too slow to be useful, submitting the form still runs a normal search.
   ========================================================================== */

(function () {
  'use strict';

  class PredictiveSearch extends HTMLElement {
    connectedCallback() {
      this.input = this.querySelector('[data-search-input]');
      this.results = this.querySelector('[data-search-results]');
      this.clearButton = this.querySelector('[data-search-clear]');
      this.controller = null;
      this.activeIndex = -1;

      if (!this.input || !this.results) return;

      // A cheap phone on a slow connection gets fewer, later requests —
      // typing must never feel like it is fighting the network.
      const capability = (window.Bloomarts && window.Bloomarts.Capability) || {};
      this.debounceMs = capability.saveData || capability.slowNetwork ? 600 : 250;
      this.limit = capability.saveData || capability.slowNetwork ? 4 : 6;

      this.input.addEventListener('input', this.onInput.bind(this));
      this.input.addEventListener('keydown', this.onKeydown.bind(this));

      if (this.clearButton) {
        this.clearButton.addEventListener('click', () => {
          this.input.value = '';
          this.input.focus();
          this.reset();
        });
      }

      this.syncClearButton();
    }

    disconnectedCallback() {
      if (this.controller) this.controller.abort();
      clearTimeout(this.timer);
    }

    onInput() {
      this.syncClearButton();
      clearTimeout(this.timer);

      const term = this.input.value.trim();
      // Single characters match almost everything; the results are noise.
      if (term.length < 2) {
        this.reset();
        return;
      }

      this.timer = setTimeout(() => this.search(term), this.debounceMs);
    }

    onKeydown(event) {
      const options = Array.from(this.results.querySelectorAll('[role="option"]'));

      switch (event.key) {
        case 'Escape':
          this.reset();
          break;
        case 'ArrowDown':
          if (options.length === 0) return;
          event.preventDefault();
          this.moveActive(options, 1);
          break;
        case 'ArrowUp':
          if (options.length === 0) return;
          event.preventDefault();
          this.moveActive(options, -1);
          break;
        case 'Enter':
          if (this.activeIndex > -1 && options[this.activeIndex]) {
            event.preventDefault();
            options[this.activeIndex].click();
          }
          break;
        default:
          break;
      }
    }

    moveActive(options, direction) {
      this.activeIndex = (this.activeIndex + direction + options.length) % options.length;
      options.forEach((option, index) => {
        const isActive = index === this.activeIndex;
        option.setAttribute('aria-selected', String(isActive));
        if (isActive) {
          this.input.setAttribute('aria-activedescendant', option.id);
          // block:'nearest' keeps the list from jumping under the thumb.
          option.scrollIntoView({ block: 'nearest' });
        }
      });
    }

    syncClearButton() {
      if (!this.clearButton) return;
      this.clearButton.hidden = this.input.value.length === 0;
    }

    reset() {
      if (this.controller) this.controller.abort();
      this.results.innerHTML = '';
      this.activeIndex = -1;
      this.input.setAttribute('aria-expanded', 'false');
      this.input.removeAttribute('aria-activedescendant');
    }

    async search(term) {
      // Abandon the in-flight request: without this, a slow early response
      // can land after a fast later one and show stale results.
      if (this.controller) this.controller.abort();
      this.controller = new AbortController();

      const routes = window.BloomartsRoutes || {};
      const base = routes.predictive_search || '/search/suggest';
      const url =
        `${base}.json?q=${encodeURIComponent(term)}` +
        `&resources[type]=product&resources[limit]=${this.limit}`;

      try {
        const response = await fetch(url, { signal: this.controller.signal });
        if (!response.ok) throw new Error(`Search failed: ${response.status}`);

        const data = await response.json();
        const products =
          (data.resources && data.resources.results && data.resources.results.products) || [];

        this.render(products, term);
      } catch (error) {
        if (error.name === 'AbortError') return;
        // Degrade to the real search rather than showing an error state —
        // the submit button is right there and still works.
        this.reset();
      }
    }

    render(products, term) {
      this.activeIndex = -1;

      if (products.length === 0) {
        this.results.innerHTML =
          `<p class="search__status">${this.escape(
            (window.BloomartsStrings && window.BloomartsStrings.noResults) ||
              'No results found.'
          )}</p>`;
        this.input.setAttribute('aria-expanded', 'true');
        return;
      }

      const items = products
        .map((product, index) => {
          const image = product.image
            ? `<img class="search__result-image" src="${this.escape(
                product.image
              )}" alt="" width="48" height="48" loading="lazy" decoding="async">`
            : '<span class="search__result-image" aria-hidden="true"></span>';

          const price = this.formatPrice(product.price);

          return `
            <li>
              <a
                class="search__result"
                id="search-option-${index}"
                role="option"
                aria-selected="false"
                href="${this.escape(product.url)}"
              >
                ${image}
                <span class="search__result-text">
                  <span class="search__result-title">${this.escape(product.title)}</span>
                  ${price ? `<span class="search__result-price">${this.escape(price)}</span>` : ''}
                </span>
              </a>
            </li>`;
        })
        .join('');

      this.results.innerHTML = `<ul class="search__list" role="list">${items}</ul>`;
      this.input.setAttribute('aria-expanded', 'true');

      if (window.Bloomarts && window.Bloomarts.announce) {
        window.Bloomarts.announce(`${products.length} results for ${term}`);
      }
    }

    /* suggest.json returns price as a decimal string in the shop currency,
       not the cents integer the Cart API uses. */
    formatPrice(value) {
      if (value === undefined || value === null || value === '') return '';
      const amount = Number(value);
      if (Number.isNaN(amount)) return String(value);
      if (window.Bloomarts && window.Bloomarts.formatMoney) {
        return window.Bloomarts.formatMoney(Math.round(amount * 100));
      }
      return amount.toFixed(2);
    }

    escape(value) {
      return String(value).replace(/[&<>"']/g, (char) => {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
      });
    }
  }

  if (!window.customElements.get('predictive-search')) {
    window.customElements.define('predictive-search', PredictiveSearch);
  }
})();
