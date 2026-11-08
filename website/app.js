/**
 * Eyeland Landing Page Application
 * Orchestrates:
 * 1. Full-screen round eyes splash & signature wink
 * 2. Direct shrink of black splash screen into the Dynamic Island pill at the top edge of laptop
 * 3. Left-to-right animated reveal of the navbar
 * 4. Typewriter reveal of the hero section headline and subtitle
 */

(function () {
  'use strict';

  const splashBackdrop = document.getElementById('splash-backdrop');
  const splashEyesLayer = document.getElementById('splash-eyes-layer');
  const splashEyesWrap = document.getElementById('splash-eyes-wrap');
  const splashEyeLeft = document.getElementById('splash-eye-left');
  const splashEyeRight = document.getElementById('splash-eye-right');
  const splashSparkle = document.getElementById('splash-sparkle');
  const collapsedPill = document.getElementById('replica-collapsed-pill');

  let hasShrunk = false;
  let winkTimer = null;
  let shrinkTimer = null;

  // Accessibility check
  const prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------------------------
  // 1. Splash Screen: Round Eyes & Gaze Tracking
  // ---------------------------------------------------------------------------
  function initSplashScreen() {
    if (prefersReducedMotion || window.location.hash === '#no-splash') {
      if (splashBackdrop) splashBackdrop.style.display = 'none';
      if (splashEyesLayer) splashEyesLayer.style.display = 'none';
      if (collapsedPill) {
        collapsedPill.style.opacity = '1';
        collapsedPill.style.display = 'flex';
      }
      instantRevealPage();
      return;
    }

    // Keep collapsed pill hidden while splash screen is shrinking into it
    if (collapsedPill) {
      collapsedPill.style.opacity = '0';
      collapsedPill.style.transition = 'opacity 0.25s ease';
    }

    // Lock page scroll during splash intro
    document.body.style.overflow = 'hidden';
    window.scrollTo(0, 0);

    window.addEventListener('mousemove', handleSplashGaze);

    // Wink at 1.4s
    winkTimer = setTimeout(() => {
      triggerWink();
    }, 1400);

    // Smooth Shrink at 2.6s
    shrinkTimer = setTimeout(() => {
      executeSmoothShrink();
    }, 2600);

    // Click anywhere to fast-forward into shrink
    if (splashBackdrop) {
      splashBackdrop.addEventListener('click', () => {
        clearTimeout(winkTimer);
        clearTimeout(shrinkTimer);
        executeSmoothShrink();
      });
    }
  }

  function handleSplashGaze(e) {
    if (!splashEyeLeft || !splashEyeRight || hasShrunk) return;
    const { clientX, clientY } = e;
    const centerX = window.innerWidth / 2;
    const centerY = window.innerHeight / 2;

    const deltaX = (clientX - centerX) / centerX;
    const deltaY = (clientY - centerY) / centerY;

    const moveX = deltaX * 10;
    const moveY = deltaY * 8;

    splashEyeLeft.style.transform = `translate(${moveX}px, ${moveY}px)`;
    if (!splashEyeRight.classList.contains('eye-winking')) {
      splashEyeRight.style.transform = `translate(${moveX}px, ${moveY}px)`;
    }
  }

  function triggerWink() {
    if (!splashEyeRight) return;
    splashEyeRight.classList.add('eye-winking');
    if (splashSparkle) {
      splashSparkle.classList.add('sparkle-active');
    }
  }

  // ---------------------------------------------------------------------------
  // 2. Exact Top-Edge Shrink Animation:
  //    The full-screen black splash contracts directly into the 230px x 36px Island!
  // ---------------------------------------------------------------------------
  function executeSmoothShrink() {
    if (hasShrunk) return;
    hasShrunk = true;
    window.removeEventListener('mousemove', handleSplashGaze);

    // Reset gaze offsets for smooth centering into the island
    if (splashEyeLeft) splashEyeLeft.style.transform = 'none';
    if (splashEyeRight) splashEyeRight.style.transform = 'none';

    // Restore page scrolling
    document.body.style.overflow = '';

    if (!splashBackdrop || !collapsedPill || !splashEyesWrap) {
      if (splashBackdrop) splashBackdrop.style.display = 'none';
      if (splashEyesLayer) splashEyesLayer.style.display = 'none';
      if (collapsedPill) collapsedPill.style.opacity = '1';
      instantRevealPage();
      return;
    }

    // Measure exact destination coordinates of the collapsed Dynamic Island on the laptop
    const targetRect = collapsedPill.getBoundingClientRect();

    // 1. Shrink Black Splash Screen directly to the Island Capsule dimensions and position
    splashBackdrop.classList.add('shrinking-to-island');
    splashBackdrop.style.top = `${targetRect.top}px`;
    splashBackdrop.style.left = `${targetRect.left}px`;
    splashBackdrop.style.width = `${targetRect.width}px`;
    splashBackdrop.style.height = `${targetRect.height}px`;
    splashBackdrop.style.borderRadius = '20px';
    splashBackdrop.style.borderColor = '#1e1e22';
    splashBackdrop.style.boxShadow = '0 28px 60px rgba(0, 0, 0, 0.98)';

    // 2. Shrink and Translate Eyes directly into the center of the Island Capsule
    const initialCenterX = window.innerWidth / 2;
    const initialCenterY = window.innerHeight / 2;
    const destCenterX = targetRect.left + targetRect.width / 2;
    const destCenterY = targetRect.top + targetRect.height / 2;

    const eyesDeltaX = destCenterX - initialCenterX;
    const eyesDeltaY = destCenterY - initialCenterY;
    // 50px splash eye scales down to 10px collapsed eye (exact 0.2 scale)
    const eyesScale = 0.2;

    splashEyesWrap.style.transform = `translate(${eyesDeltaX}px, ${eyesDeltaY}px) scale(${eyesScale})`;

    // 3. Island locks into place at 1150ms -> Trigger Animated Page Load!
    setTimeout(() => {
      if (collapsedPill) {
        collapsedPill.style.opacity = '1';
      }
      if (splashBackdrop) {
        splashBackdrop.style.opacity = '0';
      }
      if (splashEyesLayer) {
        splashEyesLayer.style.opacity = '0';
      }

      setTimeout(() => {
        if (splashBackdrop) splashBackdrop.style.display = 'none';
        if (splashEyesLayer) splashEyesLayer.style.display = 'none';
      }, 250);

      // 4. Trigger Navbar left-to-right cascade loading
      runNavbarSequence();

      // 5. Trigger Hero Section Typewriter sequence shortly after
      setTimeout(() => {
        runTypewriterSequence();
      }, 350);

    }, 1150);
  }

  // ---------------------------------------------------------------------------
  // 3. Navbar Left-to-Right Loading Sequence
  // ---------------------------------------------------------------------------
  function runNavbarSequence() {
    const scanLine = document.getElementById('nav-border-scan');
    if (scanLine) {
      scanLine.style.width = '100%';
    }

    const items = Array.from(document.querySelectorAll('.nav-reveal-item'));
    items.forEach((item, index) => {
      setTimeout(() => {
        item.classList.add('revealed');
      }, index * 70);
    });
  }

  // ---------------------------------------------------------------------------
  // 4. Hero Section Typewriter Sequence
  // ---------------------------------------------------------------------------
  function runTypewriterSequence() {
    const line1El = document.getElementById('typewriter-line1');
    const line2El = document.getElementById('typewriter-line2');
    const cursorEl = document.getElementById('typewriter-cursor');
    const subtitleEl = document.getElementById('hero-subtitle');
    const badgeEl = document.getElementById('hero-badge');

    // Reveal badge first
    if (badgeEl) {
      badgeEl.style.opacity = '1';
      badgeEl.style.transform = 'translateY(0)';
    }

    const text1 = 'Your Desktop,';
    const text2 = 'Reimagined at the Top Edge.';

    let charIdx1 = 0;
    let charIdx2 = 0;

    function typeLine1() {
      if (charIdx1 <= text1.length) {
        if (line1El) line1El.textContent = text1.slice(0, charIdx1);
        charIdx1++;
        setTimeout(typeLine1, 32);
      } else {
        setTimeout(typeLine2, 100);
      }
    }

    function typeLine2() {
      if (charIdx2 <= text2.length) {
        if (line2El) line2El.textContent = text2.slice(0, charIdx2);
        charIdx2++;
        setTimeout(typeLine2, 32);
      } else {
        // Finished typing: fade out cursor after 1s
        if (cursorEl) {
          setTimeout(() => {
            cursorEl.classList.add('finished');
          }, 1200);
        }
        // Smoothly reveal subtitle paragraph
        if (subtitleEl) {
          subtitleEl.style.opacity = '1';
          subtitleEl.style.transform = 'translateY(0)';
        }
      }
    }

    setTimeout(typeLine1, 120);
  }

  // Instant fallback for #no-splash or reduced motion
  function instantRevealPage() {
    const scanLine = document.getElementById('nav-border-scan');
    if (scanLine) scanLine.style.width = '100%';

    document.querySelectorAll('.nav-reveal-item').forEach((item) => {
      item.classList.add('revealed');
    });

    const line1El = document.getElementById('typewriter-line1');
    const line2El = document.getElementById('typewriter-line2');
    const cursorEl = document.getElementById('typewriter-cursor');
    const subtitleEl = document.getElementById('hero-subtitle');
    const badgeEl = document.getElementById('hero-badge');

    if (line1El) line1El.textContent = 'Your Desktop,';
    if (line2El) line2El.textContent = 'Reimagined at the Top Edge.';
    if (cursorEl) cursorEl.style.display = 'none';
    if (badgeEl) {
      badgeEl.style.opacity = '1';
      badgeEl.style.transform = 'translateY(0)';
    }
    if (subtitleEl) {
      subtitleEl.style.opacity = '1';
      subtitleEl.style.transform = 'translateY(0)';
    }
  }

  // Initialize
  window.addEventListener('DOMContentLoaded', () => {
    initSplashScreen();
  });
})();
