export const DEFAULT_ISLAND_DISPLAY = {
  size: 'normal', // 'compact' | 'normal' | 'large'
  style: 'attached', // 'attached' | 'floating'
  material: 'black', // 'black' | 'glass' (collapsed state only)
  seeThrough: 0, // 0..85 (%)
  glassColor: 'auto', // 'auto' | 'blue' | 'purple' | 'pink' | 'green' | 'orange' | 'grey'
  musicColor: true, // boolean
  openMode: 'hover', // 'hover' | 'click'
  screenId: 'main', // 'main' | '<displayId>'
  showLyrics: true, // boolean
  wordByWord: false, // boolean (karaoke word-by-word illumination)
  showVolumeBar: true, // boolean
  showWeather: true, // boolean (weather widget in expanded island)
  weatherCity: '', // string ('' for auto-detect or specific city name)
  weatherUnits: 'celsius', // 'celsius' | 'fahrenheit'
};

export const GLASS_COLOR_OPTIONS = [
  { id: 'auto', label: 'Automatic', hex: null, rgb: null },
  { id: 'blue', label: 'Blue', hex: '#38bdf8', rgb: [56, 189, 248] },
  { id: 'purple', label: 'Purple', hex: '#a855f7', rgb: [168, 85, 247] },
  { id: 'pink', label: 'Pink', hex: '#ec4899', rgb: [236, 72, 153] },
  { id: 'green', label: 'Green', hex: '#34d399', rgb: [52, 211, 153] },
  { id: 'orange', label: 'Orange', hex: '#f97316', rgb: [249, 115, 22] },
  { id: 'grey', label: 'Grey', hex: '#94a3b8', rgb: [148, 163, 184] },
];

export function hexToRgbTuple(hex) {
  if (!hex || typeof hex !== 'string') return [52, 211, 153];
  const clean = hex.replace('#', '').trim();
  if (clean.length === 3) {
    return [
      parseInt(clean[0] + clean[0], 16) || 52,
      parseInt(clean[1] + clean[1], 16) || 211,
      parseInt(clean[2] + clean[2], 16) || 153,
    ];
  }
  if (clean.length >= 6) {
    return [
      parseInt(clean.slice(0, 2), 16) || 52,
      parseInt(clean.slice(2, 4), 16) || 211,
      parseInt(clean.slice(4, 6), 16) || 153,
    ];
  }
  return [52, 211, 153];
}
