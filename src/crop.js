export function cropRect(sw, sh, width, height, cx = 0.5, cy = 0.5, zoom = 1) {
  if (![sw, sh, width, height, cx, cy, zoom].every(Number.isFinite) || Math.min(sw, sh, width, height) <= 0 || zoom < 1 || zoom > 10) throw new Error('Invalid crop');
  const ratio = width / height;
  const w = Math.max(1, Math.min(sw, Math.floor(Math.min(sw, sh * ratio) / zoom)));
  const h = Math.max(1, Math.min(sh, Math.floor(Math.min(sw, sh * ratio) / zoom / ratio)));
  return { x: Math.round(Math.max(0, Math.min(sw - w, Math.max(0, Math.min(1, cx)) * sw - w / 2))), y: Math.round(Math.max(0, Math.min(sh - h, Math.max(0, Math.min(1, cy)) * sh - h / 2))), width: w, height: h };
}
export function outputSize(crop, width, height) {
  const scale = Math.min(crop.width / width, crop.height / height, 1);
  return { width: Math.max(1, Math.floor(width * scale)), height: Math.max(1, Math.floor(height * scale)) };
}
