/* ==========================================================================
   3D card tilt

   Purely decorative enhancement. Nothing here affects layout, focus order,
   or whether anything is clickable — if this file never loads, cards are
   simply flat.

   Three things keep it cheap:

     1. It never runs on touch. The whole thing is behind
        (hover: hover) and (pointer: fine), so a phone never attaches a
        single listener.
     2. One delegated listener on the document, not one per card.
     3. Layout is read at most once per pointer-enter (and once after a
        scroll), never per frame. Writes are batched into rAF, so read and
        write never interleave — which is what causes layout thrash.

   JavaScript only sets custom properties. The transform that consumes them
   lives in scroll-effects.css, so the browser interpolates it rather than
   having JS push a new matrix every frame.
   ========================================================================== */

(function () {
  'use strict';

  const root = document.documentElement;

  // The merchant switch is read once; it cannot change without a reload.
  if (root.dataset.depth !== 'true') return;

  const pointerQuery = window.matchMedia('(hover: hover) and (pointer: fine)');
  const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');

  const MAX_LIFT = -4; // px, upward

  let active = null;      // the card currently under the pointer
  let rect = null;        // its cached bounding box
  let rectDirty = false;  // set when the page scrolls beneath the pointer
  let pending = null;     // latest pointer position awaiting a frame
  let frame = 0;

  function enabled() {
    return (
      pointerQuery.matches &&
      !motionQuery.matches &&
      !root.classList.contains('reduce-motion')
    );
  }

  function maxTilt() {
    const raw = getComputedStyle(root).getPropertyValue('--tilt-max');
    const value = parseFloat(raw);
    return Number.isFinite(value) ? value : 5;
  }

  function clear(card) {
    card.classList.remove('is-tilting');
    card.style.removeProperty('--tilt-x');
    card.style.removeProperty('--tilt-y');
    card.style.removeProperty('--tilt-lift');
  }

  function render() {
    frame = 0;
    if (!active || !pending) return;

    // Single, batched layout read — only when scrolling has invalidated it.
    if (rectDirty || !rect) {
      rect = active.getBoundingClientRect();
      rectDirty = false;
    }
    if (rect.width === 0 || rect.height === 0) return;

    // Normalise the pointer to -0.5..0.5 across the card.
    const nx = (pending.x - rect.left) / rect.width - 0.5;
    const ny = (pending.y - rect.top) / rect.height - 0.5;
    const limit = maxTilt();

    // Pointer right tilts the right edge away, so rotateY follows +nx;
    // pointer down tilts the bottom away, so rotateX follows -ny.
    active.style.setProperty('--tilt-y', `${(nx * limit).toFixed(2)}deg`);
    active.style.setProperty('--tilt-x', `${(-ny * limit).toFixed(2)}deg`);
    active.style.setProperty('--tilt-lift', `${MAX_LIFT}px`);
  }

  function schedule() {
    if (frame) return;
    frame = requestAnimationFrame(render);
  }

  document.addEventListener(
    'pointerover',
    (event) => {
      if (!enabled()) return;
      const card = event.target.closest && event.target.closest('.card');
      if (!card || card === active) return;

      if (active) clear(active);
      active = card;
      rect = card.getBoundingClientRect();
      rectDirty = false;
      card.classList.add('is-tilting');
    },
    { passive: true }
  );

  document.addEventListener(
    'pointermove',
    (event) => {
      if (!active || !enabled()) return;
      pending = { x: event.clientX, y: event.clientY };
      schedule();
    },
    { passive: true }
  );

  document.addEventListener(
    'pointerout',
    (event) => {
      if (!active) return;
      // Ignore moves between the card's own descendants.
      if (event.relatedTarget && active.contains(event.relatedTarget)) return;
      clear(active);
      active = null;
      rect = null;
      pending = null;
    },
    { passive: true }
  );

  // Scrolling under a hovered card invalidates the cached rect. Flagging it
  // here and re-reading inside the next frame keeps the read out of the
  // scroll handler itself.
  window.addEventListener(
    'scroll',
    () => {
      if (active) rectDirty = true;
    },
    { passive: true }
  );

  window.addEventListener(
    'resize',
    () => {
      if (active) rectDirty = true;
    },
    { passive: true }
  );

  // A tilted card left mid-animation when the user turns motion off would
  // stay crooked, so state is dropped as soon as the preference changes.
  const reset = () => {
    if (!active) return;
    clear(active);
    active = null;
    rect = null;
    pending = null;
  };
  motionQuery.addEventListener('change', reset);
  pointerQuery.addEventListener('change', reset);
})();
