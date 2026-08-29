/* ==========================================================================
   <variant-picker> and <product-form>

   Both progressively enhance a working native form. With scripting off, the
   <noscript> variant select and a normal POST to /cart/add still add the
   product — including uploaded files, because the form is multipart.
   ========================================================================== */

(function () {
  'use strict';

  /* ======================================================================
     <variant-picker>
     ====================================================================== */

  class VariantPicker extends HTMLElement {
    connectedCallback() {
      const dataScript = this.querySelector('[data-variant-data]');
      if (!dataScript) return;

      try {
        this.variants = JSON.parse(dataScript.textContent);
      } catch (error) {
        // Without variant data the picker cannot function, but the native
        // form still can — so bail out rather than throwing.
        return;
      }

      this.idInput = this.querySelector('[data-variant-id]');
      // Naming it here is what makes it submit. Before this line runs the
      // <noscript> select is the live control.
      if (this.idInput) this.idInput.name = 'id';

      this.inputs = Array.from(this.querySelectorAll('[data-variant-option]'));
      this.inputs.forEach((input) => {
        input.addEventListener('change', () => this.onChange());
      });

      this.updateAvailability();
    }

    get selectedValues() {
      const values = [];
      this.inputs.forEach((input) => {
        if (!input.checked) return;
        values[Number(input.getAttribute('data-option-index')) - 1] = input.value;
      });
      return values;
    }

    findVariant(values) {
      return this.variants.find((variant) =>
        variant.options.every((option, index) => option === values[index])
      );
    }

    onChange() {
      const values = this.selectedValues;
      const variant = this.findVariant(values);

      // Echo the chosen value back into each legend.
      values.forEach((value, index) => {
        const label = this.querySelector(`[data-option-value="${index + 1}"]`);
        if (label) label.textContent = value;
      });

      this.updateAvailability();

      if (this.idInput && variant) this.idInput.value = variant.id;

      this.updatePrice(variant);
      this.updateButton(variant);
      this.updateUrl(variant);
      this.updateGallery(variant);

      this.dispatchEvent(
        new CustomEvent('variant:change', { bubbles: true, detail: { variant } })
      );
    }

    /* Marks values that cannot produce an available variant given the other
       current selections. They stay selectable — blocking them entirely
       would strand someone whose first pick has no stock in any size. */
    updateAvailability() {
      const values = this.selectedValues;

      this.inputs.forEach((input) => {
        const index = Number(input.getAttribute('data-option-index')) - 1;
        const candidate = values.slice();
        candidate[index] = input.value;

        const reachable = this.variants.some(
          (variant) =>
            variant.available &&
            variant.options.every((option, i) => (i === index ? option === input.value : option === candidate[i]))
        );

        input.setAttribute('data-unavailable', String(!reachable));
        // The visual state lives on the label, which is the sibling the
        // stylesheet can reach from the input.
        const label = input.nextElementSibling;
        if (label) label.setAttribute('data-unavailable', String(!reachable));
      });
    }

    updatePrice(variant) {
      const format = window.Bloomarts && window.Bloomarts.formatMoney;
      if (!format) return;

      document.querySelectorAll('[data-product-price]').forEach((node) => {
        node.textContent = variant ? format(variant.price) : '';
      });

      document.querySelectorAll('[data-product-compare]').forEach((node) => {
        const showCompare = variant && variant.compare_at_price && variant.compare_at_price > variant.price;
        node.textContent = showCompare ? format(variant.compare_at_price) : '';
        node.hidden = !showCompare;
      });
    }

    updateButton(variant) {
      const strings = window.BloomartsStrings || {};

      document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
        const text = button.querySelector('[data-add-to-cart-text]') || button;

        if (!variant) {
          button.disabled = true;
          text.textContent = strings.unavailable || 'Unavailable';
        } else if (!variant.available) {
          button.disabled = true;
          text.textContent = strings.soldOut || 'Sold out';
        } else {
          button.disabled = false;
          text.textContent = button.getAttribute('data-default-text') || 'Add to cart';
        }
      });
    }

    /* replaceState, not pushState: choosing a colour is not a navigation,
       and filling the history stack would make Back feel broken. */
    updateUrl(variant) {
      if (!variant || !window.history || !window.history.replaceState) return;
      const base = this.getAttribute('data-url');
      if (!base) return;
      window.history.replaceState({}, '', `${base}?variant=${variant.id}`);
    }

    updateGallery(variant) {
      if (!variant || !variant.featured_image) return;
      const gallery = document.querySelector('product-gallery');
      if (gallery && typeof gallery.showMedia === 'function') {
        gallery.showMedia(variant.featured_image.id);
      }
    }
  }

  /* ======================================================================
     <product-form>
     ====================================================================== */

  class ProductForm extends HTMLElement {
    connectedCallback() {
      this.form = this.querySelector('form');
      if (!this.form) return;

      this.submitButton = this.querySelector('[data-add-to-cart]');
      this.errorSummary = this.querySelector('[data-error-summary]');
      this.errorList = this.querySelector('[data-error-list]');

      this.form.addEventListener('submit', this.onSubmit.bind(this));

      this.setupCounters();
      this.setupFileFields();

      // Clear a field's error as soon as it is corrected — leaving stale red
      // text under a now-valid field is its own usability problem.
      this.querySelectorAll('[data-custom-input]').forEach((input) => {
        input.addEventListener('input', () => this.clearFieldError(input));
        input.addEventListener('change', () => this.clearFieldError(input));
      });
    }

    /* ---- Character counters ---- */

    setupCounters() {
      this.querySelectorAll('[data-max-length]').forEach((input) => {
        const max = Number(input.getAttribute('data-max-length'));
        const counter = document.getElementById(`${input.id}-count`);
        if (!counter) return;

        const template =
          (window.BloomartsStrings && window.BloomartsStrings.charactersRemaining) ||
          '{{ count }} characters remaining';

        const update = () => {
          const remaining = Math.max(0, max - input.value.length);
          counter.textContent = template.replace(/\{\{\s*count\s*\}\}/, String(remaining));
        };

        input.addEventListener('input', update);
        update();
      });
    }

    /* ---- File fields ---- */

    setupFileFields() {
      this.querySelectorAll('input[type="file"][data-custom-input]').forEach((input) => {
        const field = input.closest('.file-field');
        if (!field) return;

        const status = field.querySelector('[data-file-status]');
        const removeButton = field.querySelector('[data-file-remove]');
        const buttonText = field.querySelector('[data-file-button-text]');

        const reset = () => {
          input.value = '';
          if (status) {
            status.textContent =
              (window.BloomartsStrings && window.BloomartsStrings.noFile) || 'No file chosen';
            status.classList.remove('is-set');
          }
          if (removeButton) removeButton.hidden = true;
          if (buttonText) {
            buttonText.textContent =
              (window.BloomartsStrings && window.BloomartsStrings.uploadChoose) || 'Choose file';
          }
          this.clearFieldError(input);
        };

        input.addEventListener('change', () => {
          const file = input.files && input.files[0];
          if (!file) {
            reset();
            return;
          }

          const error = this.validateFile(input, file);
          if (error) {
            this.setFieldError(input, error);
            // Rejecting the file outright is clearer than leaving an invalid
            // one attached with an error beside it.
            input.value = '';
            return;
          }

          if (status) {
            const sizeMb = (file.size / (1024 * 1024)).toFixed(1);
            status.textContent = `${file.name} (${sizeMb} MB)`;
            status.classList.add('is-set');
          }
          if (removeButton) removeButton.hidden = false;
          if (buttonText) {
            buttonText.textContent =
              (window.BloomartsStrings && window.BloomartsStrings.uploadReplace) || 'Replace file';
          }
        });

        if (removeButton) removeButton.addEventListener('click', reset);
      });
    }

    validateFile(input, file) {
      const strings = window.BloomartsStrings || {};
      const maxMb = Number(input.getAttribute('data-max-size-mb')) || 5;

      if (file.size > maxMb * 1024 * 1024) {
        return (strings.fileTooLarge || 'That file is too large.').replace(
          /\{\{\s*size\s*\}\}/,
          String(maxMb)
        );
      }

      const accept = (input.getAttribute('accept') || '')
        .split(',')
        .map((type) => type.trim())
        .filter(Boolean);

      if (accept.length > 0) {
        const matches = accept.some((type) => {
          if (type.endsWith('/*')) return file.type.startsWith(type.slice(0, -1));
          if (type.startsWith('.')) return file.name.toLowerCase().endsWith(type.toLowerCase());
          return file.type === type;
        });
        if (!matches) return strings.fileWrongType || "That file type isn't supported.";
      }

      return null;
    }

    /* ---- Validation ---- */

    validate() {
      const strings = window.BloomartsStrings || {};
      const errors = [];

      this.querySelectorAll('[data-custom-field]').forEach((field) => {
        const inputs = Array.from(field.querySelectorAll('[data-custom-input]'));
        if (inputs.length === 0) return;

        const first = inputs[0];
        const required = inputs.some((input) => input.required);
        if (!required) return;

        let filled;
        if (first.type === 'radio') {
          filled = inputs.some((input) => input.checked);
        } else if (first.type === 'file') {
          filled = first.files && first.files.length > 0;
        } else {
          filled = first.value.trim().length > 0;
        }

        if (!filled) {
          const message = strings.required || 'This field is required.';
          this.setFieldError(first, message);
          errors.push({ input: first, message: `${this.labelFor(field)}: ${message}` });
        }
      });

      return errors;
    }

    labelFor(field) {
      const label = field.querySelector('legend, .field__label, label');
      return label ? label.textContent.trim().replace(/\s*\*$/, '').replace(/:$/, '') : 'Field';
    }

    setFieldError(input, message) {
      const field = input.closest('[data-custom-field]') || input.closest('.field');
      if (!field) return;
      const error = field.querySelector('[data-field-error]');
      if (error) error.textContent = message;
      input.setAttribute('aria-invalid', 'true');
    }

    clearFieldError(input) {
      const field = input.closest('[data-custom-field]') || input.closest('.field');
      if (!field) return;
      const error = field.querySelector('[data-field-error]');
      if (error) error.textContent = '';
      input.removeAttribute('aria-invalid');
    }

    showErrorSummary(errors) {
      if (!this.errorSummary || !this.errorList) return;

      this.errorList.innerHTML = errors
        .map((error) => {
          const id = error.input.id || '';
          return `<li>${id ? `<a href="#${id}">${escapeHtml(error.message)}</a>` : escapeHtml(error.message)}</li>`;
        })
        .join('');

      this.errorSummary.hidden = false;
      // Focus the summary rather than the first field: it tells the user how
      // many problems there are before dropping them into one of them.
      this.errorSummary.setAttribute('tabindex', '-1');
      this.errorSummary.focus({ preventScroll: false });
    }

    hideErrorSummary() {
      if (!this.errorSummary) return;
      this.errorSummary.hidden = true;
      if (this.errorList) this.errorList.innerHTML = '';
    }

    /* ---- Submit ---- */

    async onSubmit(event) {
      // No cart drawer means no reason to intercept: let the browser POST
      // and land on /cart, which always works.
      const drawer = document.querySelector('cart-drawer');
      if (!drawer) return;

      event.preventDefault();
      this.hideErrorSummary();

      const errors = this.validate();
      if (errors.length > 0) {
        this.showErrorSummary(errors);
        return;
      }

      this.setLoading(true);

      const strings = window.BloomartsStrings || {};
      const routes = window.BloomartsRoutes || {};

      try {
        // FormData, not JSON — it is the only body type that can carry an
        // uploaded reference image alongside the line item properties.
        const body = new FormData(this.form);
        body.append('sections', 'cart-drawer,header');
        body.append('sections_url', window.location.pathname);

        const response = await fetch(routes.cart_add || '/cart/add', {
          method: 'POST',
          headers: { Accept: 'application/json' },
          body
        });

        const data = await response.json();

        if (!response.ok) {
          // Shopify returns a human-readable description for stock and
          // property errors; prefer it over a generic message.
          throw new Error(data.description || data.message || strings.addToCartError);
        }

        document.dispatchEvent(
          new CustomEvent('cart:updated', {
            detail: { sections: data.sections, opener: this.submitButton }
          })
        );

        if (window.Bloomarts && window.Bloomarts.announce) {
          window.Bloomarts.announce(strings.addedToCart || 'Added to cart');
        }
      } catch (error) {
        this.showErrorSummary([
          { input: this.submitButton || this.form, message: error.message || strings.addToCartError }
        ]);
      } finally {
        this.setLoading(false);
      }
    }

    setLoading(state) {
      document.querySelectorAll('[data-add-to-cart]').forEach((button) => {
        button.classList.toggle('is-loading', state);
        button.disabled = state;
        button.setAttribute('aria-busy', String(state));
      });
    }
  }

  function escapeHtml(value) {
    return String(value).replace(/[&<>"']/g, (char) => {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[char];
    });
  }

  if (!window.customElements.get('variant-picker')) {
    window.customElements.define('variant-picker', VariantPicker);
  }
  if (!window.customElements.get('product-form')) {
    window.customElements.define('product-form', ProductForm);
  }
})();
