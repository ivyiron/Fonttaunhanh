/**
 * Automatically syncs the left-side filled track of all HTML5 range sliders.
 * Sets the CSS variable `--range-progress` (0% to 100%) on every range input,
 * enabling real-time visual progress fill in both Light and Dark themes.
 */

export function initSliderProgressTracking() {
  if (typeof window === 'undefined') return;

  function updateSlider(input: HTMLInputElement) {
    const min = input.min !== '' ? parseFloat(input.min) : 0;
    const max = input.max !== '' ? parseFloat(input.max) : 100;
    const val = input.value !== '' ? parseFloat(input.value) : 0;
    const percent = max > min ? Math.min(100, Math.max(0, ((val - min) / (max - min)) * 100)) : 50;
    input.style.setProperty('--range-progress', `${percent}%`);
  }

  // Intercept HTMLInputElement.prototype.value setter so controlled React inputs update automatically
  const descriptor = Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value');
  if (descriptor && descriptor.set) {
    const originalSet = descriptor.set;
    descriptor.set = function(this: HTMLInputElement, val: string) {
      originalSet.call(this, val);
      if (this.type === 'range') {
        updateSlider(this);
      }
    };
    Object.defineProperty(HTMLInputElement.prototype, 'value', descriptor);
  }

  // Listen to input and change events when user drags slider
  window.addEventListener(
    'input',
    (e) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'range') {
        updateSlider(e.target);
      }
    },
    { capture: true, passive: true }
  );

  window.addEventListener(
    'change',
    (e) => {
      if (e.target instanceof HTMLInputElement && e.target.type === 'range') {
        updateSlider(e.target);
      }
    },
    { capture: true, passive: true }
  );

  // Sync all existing sliders in DOM
  const syncAll = () => {
    document.querySelectorAll<HTMLInputElement>('input[type="range"]').forEach(updateSlider);
  };

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', syncAll);
  } else {
    syncAll();
  }

  // MutationObserver to track any newly rendered sliders
  const observer = new MutationObserver(() => {
    syncAll();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
}
