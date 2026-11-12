// The navigation bar at the bottom: the whole lab, then one stop per room in
// tour order. On a phone it is a tab bar across the bottom edge; on a wide
// screen it floats over the lab. One highlight slides to whichever stop is
// current.
import { ICONS } from './icons.js';

/**
 * @param {HTMLElement} element  the <nav>
 * @param {object} options
 * @param {{ id, label, title, icon }[]} options.items
 * @param {(id: string) => void} options.onSelect
 */
export function createDock(element, { items, onSelect }) {
  const highlight = document.createElement('span');
  highlight.className = 'dock__highlight';
  highlight.setAttribute('aria-hidden', 'true');
  element.append(highlight);

  const buttons = new Map();
  for (const item of items) {
    const button = document.createElement('button');
    button.type = 'button';
    button.className = 'dock__item';
    button.dataset.id = item.id;
    button.title = item.title;
    button.setAttribute('aria-label', item.title);
    const icon = document.createElement('span');
    icon.className = 'dock__icon';
    icon.innerHTML = ICONS[item.icon] ?? ICONS.machine;
    const label = document.createElement('span');
    label.className = 'dock__label';
    label.textContent = item.label;
    button.append(icon, label);
    button.addEventListener('click', () => onSelect(item.id));
    element.append(button);
    buttons.set(item.id, button);
  }

  let active = null;

  /** Move the highlight under the current stop. */
  function place() {
    const button = buttons.get(active);
    if (!button) return;
    element.style.setProperty('--x', `${button.offsetLeft}px`);
    element.style.setProperty('--y', `${button.offsetTop}px`);
    element.style.setProperty('--w', `${button.offsetWidth}px`);
    element.style.setProperty('--h', `${button.offsetHeight}px`);
  }

  // Labels appear and disappear with the window width, which moves the stops.
  new ResizeObserver(place).observe(element);

  return {
    setActive(id) {
      if (id === active) return;
      const first = active === null;
      active = id;
      for (const [key, button] of buttons) {
        if (key === id) button.setAttribute('aria-current', 'page');
        else button.removeAttribute('aria-current');
      }
      place();
      // The very first placement must not slide in from the corner.
      if (first) requestAnimationFrame(() => element.classList.add('is-ready'));
      // The stops change width as labels appear; follow them while they do.
      requestAnimationFrame(place);
    },
    get active() {
      return active;
    },
  };
}
