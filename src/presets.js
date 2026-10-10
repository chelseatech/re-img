export const PRESET_STORAGE_KEY = 'web-image-prep-presets';
export const defaults = [
  { name: 'Article image', width: 830, height: 553, cap: 1000, circle: false, uottawa: true, format: 'jpeg' },
  { name: 'Article / event card', width: 390, height: 260, cap: 0, circle: false, uottawa: true, format: 'jpeg' },
  { name: 'Author portrait', width: 80, height: 80, cap: 200, circle: true, uottawa: true, format: 'jpeg' },
  { name: 'Circular card', width: 200, height: 200, cap: 0, circle: true, uottawa: true, format: 'jpeg' },
  { name: 'Custom client profile', width: 1200, height: 800, cap: 0, circle: false, uottawa: false, format: 'jpeg' },
];

function validSettings(p) {
  return p && Number.isInteger(p.width) && p.width > 0 && p.width <= 10000
    && Number.isInteger(p.height) && p.height > 0 && p.height <= 10000
    && Number.isFinite(p.cap) && p.cap >= 0 && p.cap <= 100000;
}
function validName(name) {
  return typeof name === 'string' && name.trim().length > 0 && name.trim().length <= 80
    && !/[\u0000-\u001f\u007f]/.test(name);
}
function safeFormat(format, uottawa) {
  return ['jpeg', 'png', 'webp'].includes(format) && !(uottawa && format === 'webp') ? format : 'jpeg';
}

// Extend the original array in the original key. The first five slots retain
// their trusted names/policies, including when loading the legacy format-less data.
export function loadPresets(storage) {
  const presets = structuredClone(defaults);
  try {
    const saved = JSON.parse((storage ?? globalThis.localStorage).getItem(PRESET_STORAGE_KEY));
    if (!Array.isArray(saved) || saved.length < defaults.length) return presets;
    defaults.forEach((base, i) => {
      const p = saved[i];
      if (validSettings(p)) presets[i] = { ...base, width: p.width, height: p.height, cap: p.cap,
        circle: Boolean(p.circle), format: safeFormat(p.format, base.uottawa) };
    });
    for (const p of saved.slice(defaults.length)) {
      if (!validSettings(p) || !validName(p.name) || presets.some(existing => existing.name.toLowerCase() === p.name.trim().toLowerCase())) continue;
      presets.push({ name: p.name.trim(), width: p.width, height: p.height, cap: p.cap,
        circle: Boolean(p.circle), uottawa: false, format: safeFormat(p.format, false) });
    }
  } catch { /* Unavailable or malformed storage falls back to verified defaults. */ }
  return presets;
}

export function persistPresets(storage, presets) {
  try { storage.setItem(PRESET_STORAGE_KEY, JSON.stringify(presets)); }
  catch { throw new Error('Could not save presets on this device. Your saved presets have not been changed. Try again after freeing local storage.'); }
}

export function createPreset(input, presets) {
  const name = typeof input.name === 'string' ? input.name.trim() : '';
  if (!validName(name)) throw new Error('Enter a preset name using 1–80 characters.');
  if (presets.some(p => p.name.toLowerCase() === name.toLowerCase())) throw new Error('That preset name is already in use. Choose a different name.');
  const width = Number(input.width), height = Number(input.height);
  if (!Number.isInteger(width) || width < 1 || width > 10000) throw new Error('Enter a width between 1 and 10,000 whole pixels.');
  if (!Number.isInteger(height) || height < 1 || height > 10000) throw new Error('Enter a height between 1 and 10,000 whole pixels.');
  const cap = Number(input.cap ?? '');
  if (!Number.isInteger(cap) || cap < 0 || cap > 100000) throw new Error('Leave the size target blank, or enter 0–100,000 whole KB.');
  if (!['jpeg', 'png', 'webp'].includes(input.format)) throw new Error('Choose JPEG, PNG or lossless WebP.');
  return { name, width, height, cap, format: input.format, circle: false, uottawa: false };
}

export function restoreStarterPresets(presets) {
  return [...structuredClone(defaults), ...presets.slice(defaults.length)];
}
