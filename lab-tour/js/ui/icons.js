// Small stroke icons (24 × 24 grid), one per room.
const svg = (paths) =>
  `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths}</svg>`;

export const ICONS = {
  // monitor
  design: svg('<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20 H16 M12 16 V20"/>'),
  // cube
  printing: svg('<path d="M12 3 L20 7.5 V16.5 L12 21 L4 16.5 V7.5 Z"/><path d="M4 7.5 L12 12 L20 7.5 M12 12 V21"/>'),
  // two people
  clinic: svg('<circle cx="9" cy="8" r="3"/><path d="M3 20 A6 6 0 0 1 15 20"/><circle cx="17.2" cy="9" r="2.4"/><path d="M16.5 14.2 A5.4 5.4 0 0 1 21 19.6"/>'),
  // stacked layers
  plaster: svg('<path d="M12 3 L21 7.8 L12 12.6 L3 7.8 Z"/><path d="M3 12.2 L12 17 L21 12.2 M3 16.4 L12 21.2 L21 16.4"/>'),
  // flame
  ceramic: svg('<path d="M12 3 C13 6.4 16.5 8.2 16.5 12.5 A4.5 4.5 0 0 1 7.5 12.5 C7.5 10.9 8.1 9.6 9.1 8.5 C9.5 9.9 10.2 10.6 11.1 10.8 C10.7 8.2 11 5.5 12 3 Z"/>'),
  // tooth
  acrylic: svg('<path d="M7.5 3.5 C5.2 3.5 3.5 5.4 3.5 8 C3.5 10 4.3 11.2 4.8 13 C5.3 14.9 5.4 20.5 7.5 20.5 C9.3 20.5 9 15.5 12 15.5 C15 15.5 14.7 20.5 16.5 20.5 C18.6 20.5 18.7 14.9 19.2 13 C19.7 11.2 20.5 10 20.5 8 C20.5 5.4 18.8 3.5 16.5 3.5 C14.8 3.5 13.5 4.5 12 4.5 C10.5 4.5 9.2 3.5 7.5 3.5 Z"/>'),
};

export const BACK_ICON = svg('<path d="M15 5 L8 12 L15 19"/>');
