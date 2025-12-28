export function normalizeHex(hex: string) {
  let h = (hex || '').replace('#', '').trim();
  if (h.length === 3) {
    h = h.split('').map((c) => c + c).join('');
  }
  if (h.length !== 6) return null;
  return h.toLowerCase();
}

export function hexToRgb(hex: string) {
  const n = normalizeHex(hex);
  if (!n) return null;
  const r = parseInt(n.slice(0, 2), 16);
  const g = parseInt(n.slice(2, 4), 16);
  const b = parseInt(n.slice(4, 6), 16);
  return { r, g, b };
}

export function hexToRgba(hex: string, alpha: number) {
  const rgb = hexToRgb(hex);
  if (!rgb) return 'rgba(0,0,0,' + alpha + ')';
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${alpha})`;
}

export function addAlphaToHex(hex: string, alpha: number) {
  const n = normalizeHex(hex);
  if (!n) return hex;
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255);
  const aHex = a.toString(16).padStart(2, '0');
  return `#${n}${aHex}`;
}
