(() => {
  if (customElements.get('quick-purchase')) return;
  const root = () => window.Shopify?.routes?.root || '/';
  const request = async (path, body) => {
    const response = await fetch(`${root()}${path}`, body ? {
      method: 'POST', headers: body instanceof FormData ? { Accept: 'application/json' } : { 'Content-Type': 'application/json' },
      body: body instanceof FormData ? body : JSON.stringify(body)
    } : {});
    let data;
    try { data = await response.json(); } catch { throw new Error('Cart service unavailable. Please try again on the Shopify storefront.'); }
    if (!response.ok || data.status >= 400) throw new Error(data.description || data.message || 'Unable to update cart. Please try again.');
    return data;
  };
  class QuickPurchase extends HTMLElement {
    connectedCallback() {
      if (this.ready) return;
      this.ready = true; this.quantity = 1;
      this.querySelector('[data-quick-add]').addEventListener('click', () => this.start());
      this.querySelector('[data-quick-edit]').addEventListener('click', () => this.open());
      this.querySelector('[data-quick-plus]').addEventListener('click', () => this.change(1));
      this.querySelector('[data-quick-minus]').addEventListener('click', () => this.change(-1));
      document.dispatchEvent(new CustomEvent('shipping:render'));
    }
    error(message) {
      const node = this.querySelector('[data-quick-error]');
      node.textContent = message || ''; node.hidden = !message;
      if (this.dialog?.open) { this.panelError.textContent = message || ''; }
    }
    render() {
      this.querySelector('[data-quick-add]').hidden = this.draft || !!this.line;
      this.querySelector('[data-quick-controls]').hidden = !this.draft && !this.line;
      this.querySelector('[data-quick-count]').textContent = this.quantity;
      const input = this.form?.querySelector('[name="quantity"]');
      if (input) input.value = this.quantity;
      this.querySelectorAll('button').forEach(button => { button.disabled = !!this.busy; });
      if (this.dialog) this.dialog.querySelector('[data-quick-close]').disabled = !!this.busy;
      const submit = this.form?.querySelector('[data-add-to-cart]');
      if (submit && this.busy && !submit.hasAttribute('data-quick-busy')) {
        submit.dataset.quickDisabled = String(submit.disabled); submit.dataset.quickBusy = ''; submit.disabled = true;
      } else if (submit && !this.busy && submit.hasAttribute('data-quick-busy')) {
        submit.disabled = submit.dataset.quickDisabled === 'true'; delete submit.dataset.quickBusy;
      }
    }
    async prepare() {
      if (this.form) return;
      const response = await fetch(this.dataset.url);
      if (!response.ok) throw new Error('Could not load product options. Please try again.');
      const page = new DOMParser().parseFromString(await response.text(), 'text/html');
      const source = page.querySelector('product-form');
      if (!source) throw new Error('Product options are unavailable. Please open the product page.');
      this.dialog = document.createElement('dialog');
      this.dialog.className = 'quick-purchase-dialog'; this.dialog.dataset.quickPanel = '';
      this.dialog.setAttribute('aria-label', 'Product options and quantity');
      const close = document.createElement('button'); close.type = 'button'; close.dataset.quickClose = ''; close.textContent = '×'; close.setAttribute('aria-label', 'Close product options');
      close.addEventListener('click', () => this.dialog.close());
      this.dialog.append(close);
      // Import the product's actual configured form: no duplicated field schema.
      const formElement = document.importNode(source, true);
      const prefix = `quick-${crypto.randomUUID()}-`;
      const ids = new Map();
      formElement.querySelectorAll('[id]').forEach(node => { const id = node.getAttribute('id'); ids.set(id, prefix + id); node.setAttribute('id', prefix + id); });
      formElement.querySelectorAll('*').forEach(node => {
        ['for', 'form', 'aria-labelledby', 'aria-describedby'].forEach(attr => {
          if (node.hasAttribute(attr)) node.setAttribute(attr, node.getAttribute(attr).split(' ').map(id => ids.get(id) || id).join(' '));
        });
      });
      this.panelError = document.createElement('p'); this.panelError.setAttribute('role', 'alert');
      this.dialog.append(formElement, this.panelError); document.body.append(this.dialog);
      this.productForm = formElement; this.form = formElement.querySelector('form');
      this.dialog.addEventListener('cancel', event => { if (this.busy) event.preventDefault(); });
      this.dialog.addEventListener('close', () => {
        if (!this.line) this.quantity = Math.max(1, Number(this.form.querySelector('[name="quantity"]')?.value) || 1);
        this.render(); this.querySelector('[data-quick-edit]').focus();
      });
      this.form.addEventListener('submit', event => { event.preventDefault(); event.stopImmediatePropagation(); this.save(); }, true);
      this.form.querySelectorAll('[data-file-remove]').forEach(button => button.addEventListener('click', () => {
        const input = button.closest('.file-field')?.querySelector('input[type="file"]');
        if (input) input.dataset.quickRemoved = 'true';
      }));
      this.customized = !!this.form.querySelector('[data-custom-field], variant-picker');
      this.querySelector('[data-quick-edit]').hidden = !this.customized;
      this.render();
      document.dispatchEvent(new CustomEvent('shipping:render'));
    }
    async start() {
      if (this.busy) return;
      this.busy = true; this.error(''); this.render();
      try {
        await this.prepare(); this.draft = true;
        if (this.customized) this.dialog.showModal();
      } catch (error) { this.error(error.message); }
      finally { this.busy = false; this.render(); }
      if (this.form && !this.customized) await this.save();
    }
    async open() {
      if (this.busy) return;
      try { await this.prepare(); this.render(); this.dialog.showModal(); } catch (error) { this.error(error.message); }
    }
    async change(delta) {
      if (this.busy) return;
      const quantity = Math.max(0, this.quantity + delta);
      if (!this.line) { this.quantity = Math.max(1, quantity); this.draft = quantity > 0; this.render(); return; }
      this.busy = true; this.error(''); this.render();
      try {
        const current = await request('cart.js');
        const existing = current.items.find(item => item.properties?._bloom_selection === this.token);
        if (!existing) { this.line = null; this.draft = false; this.quantity = 1; throw new Error('This item was removed from your cart. Add it again to continue.'); }
        const cart = await request('cart/change.js', { id: existing.key, quantity: Math.max(0, existing.quantity + delta) });
        this.line = cart.items.find(item => item.properties?._bloom_selection === this.token);
        this.quantity = this.line?.quantity || 1; this.draft = false;
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { open: false } }));
      } catch (error) { this.error(error.message); }
      finally { this.busy = false; this.render(); }
    }
    async save() {
      if (this.busy) return;
      this.productForm.hideErrorSummary();
      const errors = this.productForm.validate();
      if (errors.length) { if (!this.dialog.open) this.dialog.showModal(); this.productForm.showErrorSummary(errors); return; }
      this.quantity = Number(this.form.querySelector('[name="quantity"]')?.value || 1);
      this.busy = true; this.error(''); this.render();
      let old = this.line;
      try {
        if (old) {
          const current = await request('cart.js');
          old = current.items.find(item => item.properties?._bloom_selection === this.token);
          if (!old) { this.line = null; throw new Error('This item was removed from your cart. Submit again to add your selection.'); }
        }
        const body = new FormData(this.form);
        const quantity = Number(body.get('quantity') || 1);
        if (!Number.isInteger(quantity) || quantity < 1) throw new Error('Choose a quantity of at least 1.');
        const token = this.token || crypto.randomUUID();
        body.set('properties[_bloom_selection]', token);
        if (old) {
          // Preserve uploaded URLs unless a replacement file was selected.
          for (const [name, value] of [...body.entries()]) {
            if (value instanceof File && !value.size) {
              const property = name.match(/^properties\[(.*)\]$/)?.[1];
              const removed = Array.from(this.form.querySelectorAll('input[type="file"]')).some(input => input.name === name && input.dataset.quickRemoved === 'true');
              if (!removed && property && old.properties?.[property]) body.set(name, old.properties[property]);
              else body.delete(name);
            }
          }
          const files = [...body.values()].some(value => value instanceof File && value.size);
          if (!files && String(body.get('id')) === String(old.variant_id)) {
            const properties = {};
            for (const [name, value] of body) { const key = name.match(/^properties\[(.*)\]$/)?.[1]; if (key) properties[key] = value; }
            const cart = await request('cart/change.js', { id: old.key, quantity, properties });
            this.line = cart.items.find(item => item.properties?._bloom_selection === token);
          } else {
            // A new upload/variant must go through multipart add. Use a separate
            // identity so rollback cannot accidentally remove the original.
            const replacement = crypto.randomUUID(); body.set('properties[_bloom_selection]', replacement);
            const added = await request('cart/add.js', body);
            try { await request('cart/change.js', { id: old.key, quantity: 0 }); }
            catch (error) {
              try { await request('cart/change.js', { id: added.key, quantity: 0 }); }
              catch { throw new Error('Cart changed unexpectedly. Check your cart before trying again.'); }
              throw error;
            }
            this.line = added; this.token = replacement;
          }
        } else { this.line = await request('cart/add.js', body); this.token = token; }
        this.quantity = this.line.quantity; this.draft = false;
        if (this.dialog.open) this.dialog.close();
        document.dispatchEvent(new CustomEvent('cart:updated', { detail: { open: false } }));
      } catch (error) { this.error(error.message); }
      finally {
        this.busy = false; this.render();
      }
    }
    disconnectedCallback() { this.dialog?.remove(); }
  }
  customElements.define('quick-purchase', QuickPurchase);
})();
