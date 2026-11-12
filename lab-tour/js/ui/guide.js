// The welcome guide: what this page is and how to use it, in three steps.
// Shown once to a first-time visitor and any time from the Guide button.
import { ICONS, UI } from './icons.js';

const SEEN_KEY = 'lab-tour:welcomed';
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[char]);

/** Storage can be switched off (private windows, strict settings); the guide then simply shows again next time. */
function remember() {
  try {
    localStorage.setItem(SEEN_KEY, '1');
  } catch {
    /* not available */
  }
}
function wasSeen() {
  try {
    return localStorage.getItem(SEEN_KEY) === '1';
  } catch {
    return false;
  }
}

/**
 * @param {object} options
 * @param {object} options.content   GUIDE from knowledge.js
 * @param {() => void} options.onStart   the visitor chose the guided tour
 */
export function createGuide({ content, onStart }) {
  const dialog = document.createElement('dialog');
  dialog.className = 'guide';
  dialog.setAttribute('aria-labelledby', 'guide-title');
  dialog.innerHTML = `
    <div class="guide__card" tabindex="-1" autofocus>
      <button type="button" class="guide__close" data-close aria-label="Close the guide">${UI.close}</button>
      <p class="eyebrow">${esc(content.eyebrow)}</p>
      <h2 id="guide-title">${esc(content.title)}</h2>
      <p class="lead">${esc(content.lead)}</p>
      <ol class="guide__steps">
        ${content.steps
          .map(
            (step, index) => `
          <li style="--i:${index}">
            <span class="guide__icon guide__icon--${index + 1}" aria-hidden="true">${ICONS[step.icon] ?? UI[step.icon] ?? ''}</span>
            <span><strong>${esc(step.title)}</strong><small>${esc(step.text)}</small></span>
          </li>`,
          )
          .join('')}
      </ol>
      <div class="guide__actions">
        <button type="button" class="button button--primary" data-start>${esc(content.start)}${UI.arrow}</button>
        <button type="button" class="button" data-close>${esc(content.skip)}</button>
      </div>
      <p class="guide__hint">${esc(content.reopen)}</p>
    </div>`;
  document.body.append(dialog);

  let closing = null;

  function close() {
    if (!dialog.open || closing) return;
    // Let it fade out before it goes; never wait long for an animation that
    // may not run (reduced motion, a tab in the background).
    dialog.classList.add('is-closing');
    closing = setTimeout(() => {
      closing = null;
      dialog.classList.remove('is-closing');
      dialog.close();
    }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 0 : 170);
  }

  dialog.addEventListener('click', (event) => {
    // The card fills the dialog, so a click that lands on the dialog itself was
    // on the dimmed page around it.
    if (event.target === dialog) return close();
    const button = event.target.closest('button');
    if (!button) return;
    if ('start' in button.dataset) {
      close();
      onStart();
    } else if ('close' in button.dataset) close();
  });
  // Escape: the browser asks to close at once; do it with the same fade.
  dialog.addEventListener('cancel', (event) => {
    event.preventDefault();
    close();
  });
  dialog.addEventListener('close', remember);

  return {
    open() {
      if (dialog.open) return;
      dialog.showModal();
      remember();
    },
    close,
    get isOpen() {
      return dialog.open;
    },
    /** Has this visitor been welcomed before (on this device)? */
    wasSeen,
  };
}
