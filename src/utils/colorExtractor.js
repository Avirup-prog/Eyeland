/**
 * Real-time Dynamic Ambient Lighting & Color Extraction Engine
 * Extracts dominant vibrant colors from album artwork posters using HTML5 canvas.
 */

const FALLBACK_PALETTES = {
  default: { hex: '#10b981', secondaryHex: '#059669', r: 16, g: 185, b: 129 },
  synthwave: { hex: '#8b5cf6', secondaryHex: '#06b6d4', r: 139, g: 92, b: 246 },
  crimson: { hex: '#ef4444', secondaryHex: '#f59e0b', r: 239, g: 68, b: 68 },
  cyberpunk: { hex: '#ec4899', secondaryHex: '#8b5cf6', r: 236, g: 72, b: 153 },
  ambient: { hex: '#06b6d4', secondaryHex: '#3b82f6', r: 6, g: 182, b: 212 },
  disco: { hex: '#f59e0b', secondaryHex: '#ef4444', r: 245, g: 158, b: 11 },
};

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h, s, l = (max + min) / 2;

  if (max === min) {
    h = s = 0;
  } else {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = (g - b) / d + (g < b ? 6 : 0); break;
      case g: h = (b - r) / d + 2; break;
      case b: h = (r - g) / d + 4; break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

/**
 * Extracts vibrant dominant color & secondary harmony from an image URL
 */
export function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      return resolve(formatPalette(FALLBACK_PALETTES.default));
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 32;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;
        const colorBuckets = [];

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];

          if (a < 128) continue;

          const { h, s, l } = rgbToHsl(r, g, b);

          // Filter out dull greys, extreme pitch black, or blinding whites for rich ambient lighting
          if (s > 0.22 && l > 0.18 && l < 0.85) {
            const vibrancyScore = s * 1.5 + (1 - Math.abs(l - 0.5)) * 2;
            colorBuckets.push({ r, g, b, h, s, l, score: vibrancyScore });
          }
        }

        if (colorBuckets.length === 0) {
          return resolve(formatPalette(FALLBACK_PALETTES.default));
        }

        // Sort by vibrant presence
        colorBuckets.sort((a, b) => b.score - a.score);

        // Best vibrant primary
        const primary = colorBuckets[0];

        // Find a complementary or shifted hue for secondary ambient lighting
        const secondary = colorBuckets.find(
          (c) => Math.abs(c.h - primary.h) > 25 && Math.abs(c.h - primary.h) < 200
        ) || colorBuckets[Math.min(colorBuckets.length - 1, 5)] || primary;

        resolve(
          formatPalette({
            hex: rgbToHex(primary.r, primary.g, primary.b),
            secondaryHex: rgbToHex(secondary.r, secondary.g, secondary.b),
            r: primary.r,
            g: primary.g,
            b: primary.b,
          })
        );
      } catch (err) {
        resolve(formatPalette(FALLBACK_PALETTES.default));
      }
    };

    img.onerror = () => {
      resolve(formatPalette(FALLBACK_PALETTES.default));
    };
  });
}

function formatPalette({ hex, secondaryHex, r, g, b }) {
  return {
    hex,
    secondaryHex,
    r,
    g,
    b,
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: (alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
    radialAura: `radial-gradient(circle at 22% 48%, rgba(${r}, ${g}, ${b}, 0.45) 0%, ${secondaryHex}22 50%, transparent 80%)`,
    glowShadow: `0 12px 36px rgba(${r}, ${g}, ${b}, 0.55), 0 0 20px rgba(${r}, ${g}, ${b}, 0.35)`,
    subtleShadow: `0 0 14px rgba(${r}, ${g}, ${b}, 0.45)`,
  };
}
