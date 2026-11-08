import React from 'react';

export default function MinimalEyes({ 
  tiltDeg = 0, 
  offsetX = 0, 
  offsetY = 0, 
  expression = 'neutral',
  themeColor = '#c5f8d6',
  themeShadow = '0 0 14px rgba(197, 248, 214, 0.95), 0 0 26px rgba(197, 248, 214, 0.4)',
  size = 'md' 
}) {
  const isLg = size === 'lg';
  const isSm = size === 'sm';

  // ROUND EYES DIMENSIONS (Circular shape by default)
  const roundSize = isLg ? '18px' : isSm ? '6px' : '10px';
  const gap = isLg ? 'gap-3.5' : isSm ? 'gap-1.5' : 'gap-2.5';

  const isRejoicing = expression === 'rejoice';
  const isSleeping = expression === 'sleeping';
  const isGreeting = expression === 'greeting';

  let width = roundSize;
  let height = roundSize;
  let borderRadius = '50%';
  let customTransform = `translate(${offsetX}px, ${offsetY}px) rotate(${tiltDeg}deg)`;
  let currentShadow = themeShadow;

  if (isSleeping) {
    // SLEEPING EYES: Closed horizontal calm breathing slits
    width = isLg ? '18px' : '10px';
    height = isLg ? '3px' : '2px';
    borderRadius = '9999px';
    customTransform = undefined;
    currentShadow = `0 0 8px ${themeColor}60`;
  } else if (expression === 'happy') {
    customTransform = 'translateY(-2px) scaleY(0.4)';
    borderRadius = '9999px 9999px 0 0';
  } else if (expression === 'scan') {
    customTransform = 'scaleY(0.2)';
    borderRadius = '2px';
  } else if (expression === 'sleepy') {
    customTransform = 'translateY(2px) scaleY(0.4)';
    borderRadius = '9999px';
  } else if (expression === 'serious' || expression === 'focused') {
    // Serious, laser-focused determined eyes for deep work interval
    width = isLg ? '18px' : isSm ? '6px' : '10px';
    height = isLg ? '10px' : isSm ? '4px' : '6px';
    borderRadius = '3px 3px 5px 5px';
    customTransform = `translate(${offsetX}px, ${offsetY}px) scaleX(1.15)`;
    currentShadow = `0 0 16px ${themeColor}, 0 0 28px ${themeColor}80`;
  } else if (expression === 'relaxed' || expression === 'break' || expression === 'zen') {
    // Relaxed, calm gentle eyes for break intervals
    width = isLg ? '18px' : isSm ? '6px' : '10px';
    height = isLg ? '5px' : isSm ? '2px' : '3px';
    borderRadius = '0 0 9999px 9999px';
    customTransform = `translate(${offsetX * 0.3}px, ${offsetY * 0.3}px)`;
    currentShadow = `0 0 12px ${themeColor}90, 0 0 20px ${themeColor}40`;
  }

  const baseEyeStyle = {
    width,
    height,
    borderRadius,
    backgroundColor: themeColor,
    boxShadow: isRejoicing 
      ? `0 0 20px ${themeColor}, 0 0 35px ${themeColor}80` 
      : isGreeting
      ? `0 0 20px ${themeColor}, 0 0 32px ${themeColor}90`
      : currentShadow,
    transform: isRejoicing || isSleeping || isGreeting ? undefined : customTransform,
  };

  return (
    <div className={`relative flex items-center ${gap} ${isSleeping || isGreeting ? '' : 'blink-loop'} pt-0.5 select-none`}>
      {/* Floating Hearts during Rejoice */}
      {isRejoicing && (
        <div className="absolute -top-4 inset-x-0 flex items-center justify-center pointer-events-none">
          <span className="heart-bubble text-xs">💖</span>
        </div>
      )}

      {/* Floating Sparkles during Greeting */}
      {isGreeting && (
        <div className="absolute -top-4 inset-x-0 flex items-center justify-center pointer-events-none">
          <span className="greeting-sparkle-anim text-xs">✨</span>
        </div>
      )}

      {/* Floating ZZZ particles during Sleeping Animation (Fully visible, horizontal drift to the right) */}
      {isSleeping && (
        <div 
          className="absolute left-[calc(100%+8px)] top-1/2 -translate-y-1/2 flex items-center pointer-events-none select-none whitespace-nowrap" 
          style={{ 
            color: themeColor, 
            textShadow: `0 0 8px ${themeColor}80` 
          }}
        >
          <span className="zzz-particle-h zzz-h-1">z</span>
          <span className="zzz-particle-h zzz-h-2">z</span>
          <span className="zzz-particle-h zzz-h-3">Z</span>
        </div>
      )}

      {/* Left Eye */}
      <div 
        className={`eye-anim select-none pointer-events-none ${
          isRejoicing ? 'rejoice-anim-left' : isGreeting ? 'greeting-anim' : isSleeping ? 'sleep-anim' : ''
        }`} 
        style={baseEyeStyle} 
      />

      {/* Right Eye */}
      <div 
        className={`eye-anim select-none pointer-events-none ${
          isRejoicing ? 'rejoice-anim-right' : isGreeting ? 'greeting-anim' : isSleeping ? 'sleep-anim' : ''
        }`} 
        style={baseEyeStyle} 
      />
    </div>
  );
}
