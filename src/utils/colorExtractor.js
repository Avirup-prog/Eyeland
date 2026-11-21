/**
 * Real-time Dynamic Ambient Lighting & Color Extraction Engine
 * Uses area-weighted 36-bin hue clustering on HTML5 canvas so dominant album
 * colors (crimson, rose, cobalt, gold, purple, teal, silver, etc.) are extracted
 * accurately without tiny accent pixels hijacking the whole palette.
 */

const FALLBACK_PALETTE = {
  hex: '#10b981',
  secondaryHex: '#059669',
  r: 16,
  g: 185,
  b: 129,
};

function rgbToHex(r, g, b) {
  const toHex = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, '0');
  return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
}

function rgbToHsl(r, g, b) {
  r /= 255;
  g /= 255;
  b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0;
  let s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r:
        h = (g - b) / d + (g < b ? 6 : 0);
        break;
      case g:
        h = (b - r) / d + 2;
        break;
      case b:
        h = (r - g) / d + 4;
        break;
    }
    h /= 6;
  }
  return { h: h * 360, s, l };
}

function hslToRgb(h, s, l) {
  h = ((h % 360) + 360) % 360 / 360;
  let r, g, b;
  if (s === 0) {
    r = g = b = l;
  } else {
    const hue2rgb = (p, q, t) => {
      if (t < 0) t += 1;
      if (t > 1) t -= 1;
      if (t < 1 / 6) return p + (q - p) * 6 * t;
      if (t < 1 / 2) return q;
      if (t < 2 / 3) return p + (q - p) * (2 / 3 - t) * 6;
      return p;
    };
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    r = hue2rgb(p, q, h + 1 / 3);
    g = hue2rgb(p, q, h);
    b = hue2rgb(p, q, h - 1 / 3);
  }
  return {
    r: Math.round(r * 255),
    g: Math.round(g * 255),
    b: Math.round(b * 255),
  };
}

/**
 * Gently normalize a dominant cluster color so it stays true to its exact hue
 * while remaining crisp & luminous against dark obsidian/glass surfaces.
 */
function enhanceForDarkUI(r, g, b) {
  const hsl = rgbToHsl(r, g, b);
  if (hsl.s < 0.12) {
    // True monochrome/B&W album cover -> crisp luminous silver-slate
    const l = Math.max(0.55, Math.min(0.78, hsl.l + 0.12));
    return hslToRgb(hsl.h, Math.min(0.1, hsl.s), l);
  }
  const s = Math.max(0.42, Math.min(0.88, hsl.s * 1.12));
  const l = Math.max(0.42, Math.min(0.62, hsl.l));
  return hslToRgb(hsl.h, s, l);
}

/**
 * Extracts true area-weighted dominant color & secondary harmony from an artwork URL/dataUrl
 */
export function extractDominantColor(imageUrl) {
  return new Promise((resolve) => {
    if (!imageUrl) {
      return resolve(formatPalette(FALLBACK_PALETTE));
    }

    const img = new Image();
    img.crossOrigin = 'Anonymous';
    img.src = imageUrl;

    img.onload = () => {
      try {
        const canvas = document.createElement('canvas');
        const size = 48;
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d', { willReadFrequently: true });
        ctx.drawImage(img, 0, 0, size, size);

        const imgData = ctx.getImageData(0, 0, size, size).data;

        // 36 fine-grained hue bins (10° each) covering the full 360° color spectrum
        const NUM_BINS = 36;
        const bins = Array.from({ length: NUM_BINS }, () => ({
          count: 0,
          rSum: 0,
          gSum: 0,
          bSum: 0,
          sSum: 0,
          lSum: 0,
        }));

        let neutralCount = 0;
        let neutralR = 0;
        let neutralG = 0;
        let neutralB = 0;
        let coloredPixels = 0;

        for (let i = 0; i < imgData.length; i += 4) {
          const r = imgData[i];
          const g = imgData[i + 1];
          const b = imgData[i + 2];
          const a = imgData[i + 3];
          if (a < 128) continue;

          const { h, s, l } = rgbToHsl(r, g, b);

          // Skip near-pure black shadows and blown-out pure white glare
          if (l < 0.08 || l > 0.94) continue;

          if (s < 0.14) {
            neutralCount++;
            neutralR += r;
            neutralG += g;
            neutralB += b;
            continue;
          }

          coloredPixels++;
          const binIdx = Math.floor(h / (360 / NUM_BINS)) % NUM_BINS;
          const bin = bins[binIdx];
          bin.count++;
          bin.rSum += r;
          bin.gSum += g;
          bin.bSum += b;
          bin.sSum += s;
          bin.lSum += l;
        }

        // If album cover is genuinely monochrome/grayscale (>88% neutral)
        if (coloredPixels < 25 || (neutralCount > coloredPixels * 6 && neutralCount > 40)) {
          if (neutralCount > 0) {
            const nr = neutralR / neutralCount;
            const ng = neutralG / neutralCount;
            const nb = neutralB / neutralCount;
            const enhanced = enhanceForDarkUI(nr, ng, nb);
            const hex = rgbToHex(enhanced.r, enhanced.g, enhanced.b);
            return resolve(
              formatPalette({
                hex,
                secondaryHex: '#94a3b8',
                r: enhanced.r,
                g: enhanced.g,
                b: enhanced.b,
              })
            );
          }
          return resolve(formatPalette(FALLBACK_PALETTE));
        }

        // Score each hue cluster by dominant area + balanced vibrancy (prevents tiny corner dots winning!)
        const scoredBins = bins
          .map((bin, idx) => {
            if (bin.count === 0) return null;
            const avgR = bin.rSum / bin.count;
            const avgG = bin.gSum / bin.count;
            const avgB = bin.bSum / bin.count;
            const avgS = bin.sSum / bin.count;
            const avgL = bin.lSum / bin.count;
            const areaRatio = bin.count / coloredPixels;
            const lightnessFactor = 1 - Math.abs(avgL - 0.48) * 0.55;
            // Area dominates so the true main color of the poster always wins!
            const score = areaRatio * 100 * (0.55 + avgS * 0.85) * lightnessFactor;
            return { idx, count: bin.count, avgR, avgG, avgB, avgS, avgL, score };
          })
          .filter(Boolean)
          .sort((a, b) => b.score - a.score);

        if (scoredBins.length === 0) {
          return resolve(formatPalette(FALLBACK_PALETTE));
        }

        // Merge immediate adjacent hue neighbors (±1 bin = ±10°) into the winning cluster for smoother natural average
        const top = scoredBins[0];
        let totalCount = top.count;
        let rSum = top.avgR * top.count;
        let gSum = top.avgG * top.count;
        let bSum = top.avgB * top.count;

        for (const offset of [-1, 1]) {
          const neighborIdx = (top.idx + offset + NUM_BINS) % NUM_BINS;
          const neighbor = bins[neighborIdx];
          if (neighbor.count > top.count * 0.15) {
            totalCount += neighbor.count;
            rSum += neighbor.rSum;
            gSum += neighbor.gSum;
            bSum += neighbor.bSum;
          }
        }

        const primaryRgb = enhanceForDarkUI(rSum / totalCount, gSum / totalCount, bSum / totalCount);

        // Pick a genuine secondary accent cluster at least 30° away in hue
        const secondaryBin =
          scoredBins.find((b) => {
            const dist = Math.min(Math.abs(b.idx - top.idx), NUM_BINS - Math.abs(b.idx - top.idx));
            return dist >= 3 && b.count >= Math.max(8, coloredPixels * 0.04);
          }) || scoredBins[Math.min(1, scoredBins.length - 1)];

        const secondaryRgb = secondaryBin
          ? enhanceForDarkUI(secondaryBin.avgR, secondaryBin.avgG, secondaryBin.avgB)
          : primaryRgb;

        resolve(
          formatPalette({
            hex: rgbToHex(primaryRgb.r, primaryRgb.g, primaryRgb.b),
            secondaryHex: rgbToHex(secondaryRgb.r, secondaryRgb.g, secondaryRgb.b),
            r: primaryRgb.r,
            g: primaryRgb.g,
            b: primaryRgb.b,
          })
        );
      } catch (err) {
        resolve(formatPalette(FALLBACK_PALETTE));
      }
    };

    img.onerror = () => {
      resolve(formatPalette(FALLBACK_PALETTE));
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
    rgbTuple: [r, g, b],
    rgb: `rgb(${r}, ${g}, ${b})`,
    rgba: (alpha) => `rgba(${r}, ${g}, ${b}, ${alpha})`,
    radialAura: `radial-gradient(circle at 22% 48%, rgba(${r}, ${g}, ${b}, 0.45) 0%, ${secondaryHex}22 50%, transparent 80%)`,
    glowShadow: `0 12px 36px rgba(${r}, ${g}, ${b}, 0.55), 0 0 20px rgba(${r}, ${g}, ${b}, 0.35)`,
    subtleShadow: `0 0 14px rgba(${r}, ${g}, ${b}, 0.45)`,
  };
}
