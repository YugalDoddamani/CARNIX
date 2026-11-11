// The information panel: a card beside the lab on wide screens, a sheet under it
// on phones. It is a plain function of "where the visitor is" (overview, a room,
// a machine), re-rendered on every navigation.
import { BACK_ICON, ICONS } from './icons.js';

const ESCAPES = { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' };
const esc = (value) => String(value ?? '').replace(/[&<>"']/g, (char) => ESCAPES[char]);

const STATUS_LABEL = { built: '3D model', planned: 'Planned' };
const statusChip = (status) => `<span class="chip chip--${status}">${STATUS_LABEL[status]}</span>`;
const sizeText = ({ w, d, h }) => `${w} × ${d} × ${h} mm`;
const plural = (count, word) => `${count} ${word}${count === 1 ? '' : 's'}`;

function overviewView({ rooms, itemsByRoom }) {
  const all = [...itemsByRoom.values()].flat();
  const built = all.filter((item) => item.status === 'built').length;
  return `
    <header class="panel__header">
      <p class="eyebrow">Lab overview</p>
      <h1>Explore our digital dental lab</h1>
      <p class="muted">${plural(rooms.length, 'room')} · ${plural(all.length, 'machine')} · ${built} in 3D so far</p>
    </header>
    <ul class="list list--rooms">
      ${rooms
        .map((room) => {
          const items = itemsByRoom.get(room.id) ?? [];
          const ready = items.filter((item) => item.status === 'built').length;
          return `
        <li>
          <button class="row" data-go-room="${esc(room.id)}">
            <span class="row__icon">${ICONS[room.icon] ?? ''}</span>
            <span class="row__text"><strong${room.shortName ? ` data-short="${esc(room.shortName)}"` : ''}>${esc(room.name)}</strong><small>${esc(room.subtitle)}</small></span>
            <span class="row__meta">${ready ? `${ready} of ${items.length} in 3D` : items.length ? `${items.length} planned` : '—'}</span>
          </button>
        </li>`;
        })
        .join('')}
    </ul>`;
}

function roomView({ room, items }) {
  return `
    <header class="panel__header">
      <button class="back" data-go-back>${BACK_ICON}<span>Lab overview</span></button>
      <p class="eyebrow">${esc(room.subtitle)}</p>
      <h1>${esc(room.name)}</h1>
      <p class="muted">${items.length ? `${plural(items.length, 'machine')} in this room` : 'No equipment placed in this room yet'}</p>
    </header>
    <ol class="list">
      ${items
        .map(
          (item, index) => `
        <li>
          <button class="row" data-go-item="${esc(item.id)}">
            <span class="row__number row__number--${item.status}">${index + 1}</span>
            <span class="row__text"><strong>${esc(item.name)}</strong><small>${esc(item.kind)}</small></span>
            ${statusChip(item.status)}
          </button>
        </li>`,
        )
        .join('')}
    </ol>`;
}

function itemView({ room, item, modelState }) {
  const built = item.status === 'built';
  let body;
  if (!built) {
    body = `<p class="note">Placeholder. This machine has not been modelled yet — the blue volume marks where it stands and roughly how big it is. Name and size are a draft to be replaced with the real make and model.</p>`;
  } else if (modelState === 'failed') {
    body = `<p class="note note--error">This model could not be loaded. Reload the page to try again.</p>`;
  } else if (modelState !== 'ready') {
    body = `<p class="note">Loading the 3D model…</p>`;
  } else if (item.canExplode) {
    body = `
      <label class="slider">
        <span class="slider__label"><span>Exploded view</span><output data-explode-value>0%</output></span>
        <input type="range" min="0" max="100" value="0" step="1" data-explode aria-label="Exploded view amount">
      </label>`;
  } else {
    body = '';
  }
  return `
    <header class="panel__header">
      <button class="back" data-go-back>${BACK_ICON}<span>${esc(room.shortName ?? room.name)}</span></button>
      <p class="eyebrow">${esc(item.kind)}</p>
      <h1>${esc(item.name)}</h1>
      <p>${statusChip(item.status)}</p>
    </header>
    <dl class="facts">
      <div><dt>${built ? 'Size as modelled' : 'Estimated size'}</dt><dd>${sizeText(item.sizeMm)}</dd></div>
      <div><dt>Location</dt><dd>${esc(room.name)}</dd></div>
    </dl>
    ${body}`;
}

/**
 * @param {HTMLElement} element
 * @param {object} handlers  { onRoom(id), onItem(id), onBack(), onExplode(0…1) }
 */
export function createPanel(element, handlers) {
  element.addEventListener('click', (event) => {
    const button = event.target.closest('button');
    if (!button || !element.contains(button)) return;
    if (button.dataset.goRoom) handlers.onRoom(button.dataset.goRoom);
    else if (button.dataset.goItem) handlers.onItem(button.dataset.goItem);
    else if ('goBack' in button.dataset) handlers.onBack();
  });

  element.addEventListener('input', (event) => {
    if (!('explode' in event.target.dataset)) return;
    const percent = Number(event.target.value);
    const output = element.querySelector('[data-explode-value]');
    if (output) output.textContent = `${percent}%`;
    handlers.onExplode(percent / 100);
  });

  return {
    /** view: { mode: 'overview' | 'room' | 'item', … } */
    render(view) {
      const html = view.mode === 'item' ? itemView(view) : view.mode === 'room' ? roomView(view) : overviewView(view);
      element.innerHTML = html;
      element.dataset.mode = view.mode;
      element.scrollTop = 0;
    },
  };
}
