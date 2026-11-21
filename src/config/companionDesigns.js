export const DEFAULT_COMPANION_DESIGN = 'orbital';

export const COMPANION_DESIGNS = [
  {
    id: 'orbital',
    name: 'Orbital Core',
    badge: 'Classic',
    tagline: 'Dual counter-rotating round cyber rings',
  },
  {
    id: 'hex_shield',
    name: 'Cyber Hex',
    badge: 'Sci-Fi',
    tagline: 'Armored hexagonal neural visor frame',
  },
  {
    id: 'cat_ears',
    name: 'Neko Droid',
    badge: 'Playful',
    tagline: 'Sleek rounded pod with luminous cyber cat ears',
  },
  {
    id: 'squircle_bot',
    name: 'Retro Visor',
    badge: 'Minimal',
    tagline: 'EVA-inspired rounded display with HUD corner brackets',
  },
  {
    id: 'prism_diamond',
    name: 'Astral Prism',
    badge: 'Geometric',
    tagline: 'Crystalline diamond frame with starlight nodes',
  },
  {
    id: 'halo_crown',
    name: 'Seraph Halo',
    badge: 'Ethereal',
    tagline: 'Floating luminous halo crown with twin wing arcs',
  },
  {
    id: 'radar_mech',
    name: 'Tactical HUD',
    badge: 'Precision',
    tagline: 'Segmented reticle with orbital telemetry notches',
  },
];

export function getDesignById(id) {
  return COMPANION_DESIGNS.find((d) => d.id === id) || COMPANION_DESIGNS[0];
}
