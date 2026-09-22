import { supabase } from './supabase.js';

// ============================================================
// Image loader — used for logo + QR in PDFs
// ============================================================
const imageCache = new Map();

export async function loadImage(url) {
  if (!url) throw new Error('No image URL provided');
  if (imageCache.has(url)) return imageCache.get(url);

  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.naturalWidth;
      canvas.height = img.naturalHeight;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0);
      const dataUrl = canvas.toDataURL('image/png');
      const result = { dataUrl, width: img.naturalWidth, height: img.naturalHeight };
      imageCache.set(url, result);
      resolve(result);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// ============================================================
// Settings loader — reads from public.settings (single row)
// Falls back to empty values if the row is missing.
// Cached for the lifetime of the page. Call invalidateSettings()
// after saving from Control Panel to force a refresh.
// ============================================================
let settingsCache = null;

const FALLBACK_SETTINGS = {
  bank: {
    name: '',
    accountName: '',
    accountNumber: '',
    ifsc: '',
    branch: '',
  },
  upi: {
    id: '',
    qrUrl: '/assets/upi-qr.png',
  },
  contact: {
    phone: '',
    email: '',
    address: '',
  },
  invoice: {
    prefix: 'CARNIX',
    terms: '',
  },
};

export async function loadSettings() {
  if (settingsCache) return settingsCache;

  const { data, error } = await supabase
    .from('settings')
    .select('bank, upi, contact, invoice')
    .eq('id', 1)
    .maybeSingle();

  if (error || !data) {
    settingsCache = { ...FALLBACK_SETTINGS };
    return settingsCache;
  }

  settingsCache = {
    bank:    { ...FALLBACK_SETTINGS.bank,    ...(data.bank    || {}) },
    upi:     { ...FALLBACK_SETTINGS.upi,     ...(data.upi     || {}) },
    contact: { ...FALLBACK_SETTINGS.contact, ...(data.contact || {}) },
    invoice: { ...FALLBACK_SETTINGS.invoice, ...(data.invoice || {}) },
  };
  return settingsCache;
}

export function invalidateSettings() {
  settingsCache = null;
  imageCache.clear();
}
export function invalidateImages() {
  imageCache.clear();
}