import fs from 'node:fs';
import vm from 'node:vm';
import assert from 'node:assert/strict';

let Component, serial = 0, fail = false;
let cart = { items: [] };
class Data extends Map { constructor(form) { super(form?.entries || []); } }
const calls = [];
vm.runInNewContext(fs.readFileSync(new URL('../assets/quick-purchase.js', import.meta.url), 'utf8'), {
  HTMLElement: class {}, FormData: Data, File: class {},
  customElements: { get() {}, define(name, value) { Component = value; } },
  window: {}, document: { dispatchEvent() {} }, CustomEvent: class {},
  crypto: { randomUUID: () => `selection-${++serial}` },
  fetch: async (url, options) => {
    calls.push(url);
    if (!options?.body) return { ok: true, json: async () => cart };
    if (fail) return { ok: false, json: async () => ({ description: 'Sold out' }) };
    const body = options.body instanceof Data ? options.body : JSON.parse(options.body);
    let data;
    if (url.endsWith('/add.js')) {
      const properties = Object.fromEntries([...body].filter(([key]) => key.startsWith('properties[')).map(([key, value]) => [key.slice(11, -1), value]));
      data = { key: `key-${serial}`, variant_id: Number(body.get('id')), quantity: Number(body.get('quantity')), properties };
      cart.items.push(data);
    } else {
      const item = cart.items.find(item => item.key === body.id);
      assert.ok(item, 'Mutation uses a current cart line key');
      item.quantity = body.quantity;
      if (body.properties) item.properties = body.properties;
      cart.items = cart.items.filter(item => item.quantity > 0); data = cart;
    }
    return { ok: true, json: async () => data };
  }
});
const component = new Component();
component.form = { entries: [['id', '1'], ['quantity', '2'], ['properties[Colour]', 'Sage']], querySelector: () => ({ value: '2' }) };
component.productForm = { hideErrorSummary() {}, validate: () => [], showErrorSummary() {} };
component.dialog = { open: false };
component.render = () => {};
component.error = message => { component.message = message; };
await component.save();
assert.equal(cart.items.length, 1); assert.equal(component.quantity, 2);
component.form.entries[2][1] = 'Coral';
await component.save();
assert.equal(component.message, '');
assert.equal(cart.items.length, 1); assert.equal(cart.items[0].properties.Colour, 'Coral');
cart.items[0].key = 'changed-by-discount';
await component.change(1); assert.equal(component.quantity, 3);
fail = true;
await component.change(1); assert.equal(component.quantity, 3); assert.equal(component.message, 'Sold out');
fail = false;
await component.change(-3); assert.equal(cart.items.length, 0); assert.equal(component.line, undefined);
assert.ok(calls.includes('/cart.js'));
console.log('Quick purchase: add, edit without duplication, current keys, stock failure, and removal passed.');
