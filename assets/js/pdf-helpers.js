// Loads an image from a URL and returns { dataUrl, width, height }.
// Cached so repeated PDFs don't re-fetch.
const cache = new Map();

export async function loadImage(url) {
  if (cache.has(url)) return cache.get(url);

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
      cache.set(url, result);
      resolve(result);
    };
    img.onerror = () => reject(new Error(`Failed to load image: ${url}`));
    img.src = url;
  });
}

// Placeholder settings. Later this will read from a `settings` table
// populated via the admin control panel.
export const DEFAULT_SETTINGS = {
  bank: {
    name: 'Bank Name',
    accountName: 'Creation Lab',
    accountNumber: 'XXXXXXXXXXXX',
    ifsc: 'XXXX0000000',
    branch: 'Branch',
  },
  upi: {
    id: 'creationlab@upi',
    qrUrl: '/assets/upi-qr.png',
  },
  contact: {
    phone: '+91 XXXXXXXXXX',
    email: 'lab@example.com',
  },
};