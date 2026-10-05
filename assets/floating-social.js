(() => {
  if (customElements.get('floating-social')) return;
  customElements.define('floating-social', class extends HTMLElement {
    connectedCallback() {
      const mobile = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent)
        || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
      const whatsapp = this.querySelector('[data-social-whatsapp]');
      if (whatsapp) {
        const phone = whatsapp.dataset.phone.replace(/\D/g, '');
        whatsapp.href = mobile ? `https://wa.me/${phone}` : `https://web.whatsapp.com/send?phone=${phone}`;
      }
      // Standard HTTPS app links allow the OS to open installed apps, while
      // preserving a working website fallback. Never force custom URL schemes.
      if (mobile) this.querySelectorAll('a').forEach(link => link.removeAttribute('target'));
      const cart = document.querySelector('.sticky-atc');
      if (!cart) return;
      this.resize = new ResizeObserver(() => this.style.setProperty('--floating-social-cart-height', `${cart.getBoundingClientRect().height}px`));
      this.resize.observe(cart);
    }
    disconnectedCallback() { this.resize?.disconnect(); }
  });
})();
