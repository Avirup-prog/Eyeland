import React from 'react';
import MinimalEyes from './MinimalEyes.jsx';

const SIZE_MAP = {
  xs: { box: 'w-16 h-16', glow: 'w-10 h-10', eyeSize: 'sm' },
  sm: { box: 'w-20 h-20', glow: 'w-14 h-14', eyeSize: 'md' },
  md: { box: 'w-24 h-24', glow: 'w-16 h-16', eyeSize: 'md' },
  lg: { box: 'w-28 h-28', glow: 'w-20 h-20', eyeSize: 'lg' },
};

export default function CompanionCoreAvatar({
  design = 'orbital',
  theme,
  expression = 'neutral',
  eyeTracking = { tiltDeg: 0, offsetX: 0, offsetY: 0 },
  eyeColor,
  eyeShadow,
  size = 'sm',
  onClick,
  title,
  interactive = true,
}) {
  const accent = theme?.accent || theme?.color || '#34d399';
  const secondary = theme?.secondary || theme?.color || '#22d3ee';
  const finalEyeColor = eyeColor || theme?.color || '#c5f8d6';
  const finalEyeShadow = eyeShadow || theme?.shadow || '0 0 14px rgba(197, 248, 214, 0.95)';
  const dims = SIZE_MAP[size] || SIZE_MAP.sm;

  const renderFrame = () => {
    switch (design) {
      case 'hex_shield':
        return (
          <>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300"
              style={{ color: accent }}
              viewBox="0 0 100 100"
            >
              {/* Outer Armored Hexagon */}
              <polygon
                points="50,5 89,27.5 89,72.5 50,95 11,72.5 11,27.5"
                fill="rgba(10,12,18,0.65)"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeOpacity="0.72"
              />
              {/* Inner Dashed Tech Hexagon */}
              <polygon
                points="50,13 82,31.5 82,68.5 50,87 18,68.5 18,31.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="0.9"
                strokeDasharray="6 5"
                strokeOpacity="0.45"
              />
              {/* Corner Energy Nodes */}
              <circle cx="50" cy="5" r="2" fill="currentColor" opacity="0.9" />
              <circle cx="50" cy="95" r="2" fill="currentColor" opacity="0.9" />
              <circle cx="89" cy="27.5" r="1.6" fill="currentColor" opacity="0.7" />
              <circle cx="11" cy="72.5" r="1.6" fill="currentColor" opacity="0.7" />
            </svg>
            <svg
              className="absolute inset-0 w-full h-full cyber-orbit pointer-events-none opacity-30 transition-colors duration-300"
              style={{ color: secondary }}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="3 18" />
            </svg>
          </>
        );

      case 'cat_ears':
        return (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300"
            style={{ color: accent }}
            viewBox="0 0 100 100"
          >
            {/* Left & Right Cyber Cat Ears */}
            <path
              d="M20,38 L16,12 L40,26"
              fill="rgba(10,12,18,0.75)"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeOpacity="0.85"
            />
            <path
              d="M80,38 L84,12 L60,26"
              fill="rgba(10,12,18,0.75)"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinejoin="round"
              strokeOpacity="0.85"
            />
            {/* Inner Glowing Ear Triangles */}
            <polygon points="22,31 20,19 33,27" fill={secondary} opacity="0.42" />
            <polygon points="78,31 80,19 67,27" fill={secondary} opacity="0.42" />
            {/* Sleek Rounded Head Visor Pod */}
            <rect
              x="14"
              y="26"
              width="72"
              height="60"
              rx="28"
              fill="rgba(10,12,18,0.72)"
              stroke="currentColor"
              strokeWidth="1.9"
              strokeOpacity="0.82"
            />
            {/* Inner Visor Rim */}
            <rect
              x="19"
              y="31"
              width="62"
              height="50"
              rx="23"
              fill="none"
              stroke={secondary}
              strokeWidth="0.9"
              strokeDasharray="10 6"
              strokeOpacity="0.4"
            />
            {/* Cute Side Whisker Ticks */}
            <line x1="6" y1="53" x2="12" y2="54" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
            <line x1="7" y1="60" x2="13" y2="59" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
            <line x1="94" y1="53" x2="88" y2="54" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
            <line x1="93" y1="60" x2="87" y2="59" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" opacity="0.5" />
          </svg>
        );

      case 'squircle_bot':
        return (
          <svg
            className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300"
            style={{ color: accent }}
            viewBox="0 0 100 100"
          >
            {/* Top Mini Antenna Beacon */}
            <line x1="50" y1="8" x2="50" y2="17" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.7" />
            <circle cx="50" cy="7" r="2.6" fill="currentColor" opacity="0.95" />
            {/* Rounded EVA Visor Hull */}
            <rect
              x="12"
              y="18"
              width="76"
              height="68"
              rx="20"
              fill="rgba(10,12,18,0.72)"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeOpacity="0.75"
            />
            {/* Inner Glass Screen */}
            <rect
              x="18"
              y="24"
              width="64"
              height="56"
              rx="14"
              fill="none"
              stroke={secondary}
              strokeWidth="0.9"
              strokeOpacity="0.35"
            />
            {/* Corner HUD Brackets */}
            <path d="M23,33 L23,28 L28,28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
            <path d="M77,33 L77,28 L72,28" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
            <path d="M23,71 L23,76 L28,76" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
            <path d="M77,71 L77,76 L72,76" fill="none" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" opacity="0.85" />
            {/* Side Audio Pods */}
            <rect x="6" y="42" width="4" height="20" rx="2" fill="currentColor" opacity="0.55" />
            <rect x="90" y="42" width="4" height="20" rx="2" fill="currentColor" opacity="0.55" />
          </svg>
        );

      case 'prism_diamond':
        return (
          <>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300"
              style={{ color: accent }}
              viewBox="0 0 100 100"
            >
              {/* Outer Diamond Crystal Hull */}
              <polygon
                points="50,6 94,50 50,94 6,50"
                fill="rgba(10,12,18,0.68)"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinejoin="round"
                strokeOpacity="0.78"
              />
              {/* Secondary Rotated Square Frame */}
              <rect
                x="19"
                y="19"
                width="62"
                height="62"
                rx="10"
                fill="none"
                stroke={secondary}
                strokeWidth="1"
                strokeDasharray="8 6"
                strokeOpacity="0.45"
              />
              {/* 4 Cardinal Starlight Nodes */}
              <circle cx="50" cy="6" r="2.3" fill="currentColor" />
              <circle cx="94" cy="50" r="2.3" fill="currentColor" />
              <circle cx="50" cy="94" r="2.3" fill="currentColor" />
              <circle cx="6" cy="50" r="2.3" fill="currentColor" />
            </svg>
          </>
        );

      case 'halo_crown':
        return (
          <>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300"
              style={{ color: accent }}
              viewBox="0 0 100 100"
            >
              {/* Floating Glowing Halo Crown Above Head */}
              <ellipse
                cx="50"
                cy="14"
                rx="22"
                ry="5.5"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.2"
                strokeOpacity="0.92"
              />
              <ellipse
                cx="50"
                cy="14"
                rx="15"
                ry="2.8"
                fill="none"
                stroke={secondary}
                strokeWidth="0.9"
                strokeOpacity="0.55"
              />
              {/* Ethereal Core Sphere */}
              <circle
                cx="50"
                cy="55"
                r="31"
                fill="rgba(10,12,18,0.68)"
                stroke="currentColor"
                strokeWidth="1.7"
                strokeOpacity="0.75"
              />
              {/* Twin Soft Wing Arcs Flanking the Orb */}
              <path
                d="M15,41 C7,48 7,62 15,69"
                fill="none"
                stroke={secondary}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0.7"
              />
              <path
                d="M10,46 C4,51 4,59 10,64"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
              <path
                d="M85,41 C93,48 93,62 85,69"
                fill="none"
                stroke={secondary}
                strokeWidth="1.8"
                strokeLinecap="round"
                strokeOpacity="0.7"
              />
              <path
                d="M90,46 C96,51 96,59 90,64"
                fill="none"
                stroke="currentColor"
                strokeWidth="1.3"
                strokeLinecap="round"
                strokeOpacity="0.45"
              />
            </svg>
          </>
        );

      case 'radar_mech':
        return (
          <>
            <svg
              className="absolute inset-0 w-full h-full pointer-events-none transition-colors duration-300"
              style={{ color: accent }}
              viewBox="0 0 100 100"
            >
              {/* Inner Solid Tactical Ring */}
              <circle
                cx="50"
                cy="50"
                r="34"
                fill="rgba(10,12,18,0.66)"
                stroke="currentColor"
                strokeWidth="1.4"
                strokeOpacity="0.65"
              />
              {/* Cardinal Reticle Notches (N / E / S / W) */}
              <line x1="50" y1="4" x2="50" y2="14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
              <line x1="50" y1="86" x2="50" y2="96" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
              <line x1="4" y1="50" x2="14" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
              <line x1="86" y1="50" x2="96" y2="50" stroke="currentColor" strokeWidth="2" strokeLinecap="round" opacity="0.9" />
              {/* Diagonal Precision Ticks */}
              <line x1="18" y1="18" x2="23" y2="23" stroke={secondary} strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
              <line x1="82" y1="18" x2="77" y2="23" stroke={secondary} strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
              <line x1="18" y1="82" x2="23" y2="77" stroke={secondary} strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
              <line x1="82" y1="82" x2="77" y2="77" stroke={secondary} strokeWidth="1.4" strokeLinecap="round" opacity="0.65" />
            </svg>
            {/* Sweeping Segmented Arc */}
            <svg
              className="absolute inset-0 w-full h-full cyber-orbit-fast pointer-events-none opacity-60 transition-colors duration-300"
              style={{ color: secondary }}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="1.8" strokeDasharray="24 44 12 44" strokeLinecap="round" />
            </svg>
          </>
        );

      case 'orbital':
      default:
        return (
          <>
            {/* Outer Rotating Cyber Ring */}
            <svg
              className="absolute inset-0 w-full h-full cyber-orbit pointer-events-none opacity-50 transition-colors duration-300"
              style={{ color: accent }}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 8 20 6" />
              <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 6 12 6" />
            </svg>

            {/* Counter-rotating Inner Ring */}
            <svg
              className="absolute inset-0 w-full h-full cyber-orbit-fast pointer-events-none opacity-38 transition-colors duration-300"
              style={{ color: secondary }}
              viewBox="0 0 100 100"
            >
              <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 14 6 14" />
            </svg>
          </>
        );
    }
  };

  // Subtle vertical nudge for designs with top ears/halo so eyes sit right in the optical center of the visor
  const eyeOffsetClass =
    design === 'cat_ears'
      ? 'translate-y-1.5'
      : design === 'halo_crown'
      ? 'translate-y-1'
      : design === 'squircle_bot'
      ? 'translate-y-0.5'
      : '';

  return (
    <div
      onClick={onClick}
      title={title}
      className={`relative ${dims.box} flex items-center justify-center ${
        interactive ? 'cursor-pointer transform hover:scale-105 active:scale-95 transition-all' : ''
      }`}
    >
      {/* Ambient Core Breathing Glow */}
      <div
        className={`absolute ${dims.glow} rounded-full blur-md opacity-32 pointer-events-none radar-breath transition-colors duration-500`}
        style={{ backgroundColor: accent }}
      />

      {renderFrame()}

      {/* Centered Living Pearl Eyes */}
      <div className={`relative z-10 pointer-events-none ${eyeOffsetClass}`}>
        <MinimalEyes
          tiltDeg={eyeTracking.tiltDeg || 0}
          offsetX={eyeTracking.offsetX || 0}
          offsetY={eyeTracking.offsetY || 0}
          expression={expression}
          themeColor={finalEyeColor}
          themeShadow={finalEyeShadow}
          size={dims.eyeSize}
        />
      </div>
    </div>
  );
}
