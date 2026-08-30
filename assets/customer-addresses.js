/* ==========================================================================
   Customer addresses

   Three jobs, all of them progressive enhancement: filter the province list
   to the chosen country, open an edit form, and confirm before deleting.

   Without this script every form still submits — the edit forms sit open
   under their address instead of behind a toggle, and the province select is
   unfiltered. Both are worse than this, neither is broken.
   ========================================================================== */

(() => {
  'use strict';

  /* Shopify renders the province list into a data attribute on each country
     option rather than shipping the whole world's provinces as markup. */
  function fillProvinces(countrySelect) {
    const targetId = countrySelect.getAttribute('data-province-target');
    const province = document.getElementById(targetId);
    if (!province) return;

    const wrapper = province.closest('[data-province-wrapper]');
    const option = countrySelect.options[countrySelect.selectedIndex];
    let provinces = [];

    try {
      provinces = JSON.parse(option.getAttribute('data-provinces') || '[]');
    } catch (error) {
      provinces = [];
    }

    province.innerHTML = '';

    // A country with no provinces should not show an empty select — that
    // reads as a field the shopper has failed to fill in.
    if (!provinces.length) {
      if (wrapper) wrapper.hidden = true;
      return;
    }

    if (wrapper) wrapper.hidden = false;
    const wanted = province.getAttribute('data-default') || '';

    provinces.forEach(([value, label]) => {
      const opt = document.createElement('option');
      opt.value = value;
      opt.textContent = label;
      if (value === wanted) opt.selected = true;
      province.appendChild(opt);
    });
  }

  function setupCountries() {
    document.querySelectorAll('[data-address-country]').forEach((select) => {
      const preferred = select.getAttribute('data-default');
      if (preferred) select.value = preferred;
      fillProvinces(select);
      select.addEventListener('change', () => fillProvinces(select));
    });
  }

  function setupEditToggles() {
    document.querySelectorAll('[data-address-edit]').forEach((button) => {
      const id = button.getAttribute('data-address-edit');
      const form = document.querySelector(`[data-address-form="${id}"]`);
      if (!form) return;

      // Only hide the forms once we know we can reveal them again.
      form.hidden = true;

      button.addEventListener('click', () => {
        const open = form.hidden;
        form.hidden = !open;
        button.setAttribute('aria-expanded', String(open));
        if (open) {
          const first = form.querySelector('input, select');
          if (first) first.focus();
        }
      });
    });
  }

  function setupDelete() {
    document.querySelectorAll('[data-address-delete]').forEach((button) => {
      button.addEventListener('click', () => {
        /* Deleting an address cannot be undone, so it asks first. confirm()
           blocks the page, which is exactly what is wanted here and nowhere
           else in this theme. */
        if (!window.confirm(button.getAttribute('data-confirm'))) return;

        const url = button.getAttribute('data-address-delete');
        const form = document.createElement('form');
        form.method = 'post';
        form.action = url;
        form.hidden = true;

        const method = document.createElement('input');
        method.type = 'hidden';
        method.name = '_method';
        method.value = 'delete';
        form.appendChild(method);

        document.body.appendChild(form);
        form.submit();
      });
    });
  }

  function init() {
    if (!document.querySelector('[data-address-country], [data-address-edit]')) return;
    setupCountries();
    setupEditToggles();
    setupDelete();
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
