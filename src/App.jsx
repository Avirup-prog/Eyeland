import React, { useState, useEffect, useRef } from 'react';
import DynamicIsland from './components/DynamicIsland.jsx';
import DashboardApp from './components/DashboardApp.jsx';
import { getRandomGreeting, formatUserName } from './utils/greetings.js';
import { EYELAND_THEMES, DEFAULT_COMPANION_NAME, getThemeByKey } from './config/themes.js';
import { DEFAULT_COMPANION_DESIGN } from './config/companionDesigns.js';
import { DEFAULT_GENERAL_SETTINGS } from './config/i18n.js';
import { DEFAULT_ISLAND_DISPLAY } from './config/islandDisplay.js';

const THEMES = EYELAND_THEMES;

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isDashboardView = urlParams.get('view') === 'dashboard' || window.location.hash === '#dashboard';

  if (isDashboardView) {
    return <DashboardApp />;
  }

  const [currentThemeKey, setCurrentThemeKey] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_theme_key');
      return saved && THEMES[saved] ? saved : 'mint';
    } catch (_) {
      return 'mint';
    }
  });
  const [companionName, setCompanionName] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_companion_name');
      return saved && saved.trim() ? saved.trim() : DEFAULT_COMPANION_NAME;
    } catch (_) {
      return DEFAULT_COMPANION_NAME;
    }
  });
  const [companionDesign, setCompanionDesign] = useState(() => {
    try {
      return localStorage.getItem('eyeland_companion_design') || DEFAULT_COMPANION_DESIGN;
    } catch (_) {
      return DEFAULT_COMPANION_DESIGN;
    }
  });
  const [generalSettings, setGeneralSettings] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_general_settings');
      if (s) return { ...DEFAULT_GENERAL_SETTINGS, ...JSON.parse(s) };
    } catch (_) {}
    return { ...DEFAULT_GENERAL_SETTINGS };
  });
  const [islandDisplay, setIslandDisplay] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_island_display');
      if (s) return { ...DEFAULT_ISLAND_DISPLAY, ...JSON.parse(s) };
    } catch (_) {}
    return { ...DEFAULT_ISLAND_DISPLAY };
  });
  const islandSpeedRef = useRef(generalSettings.speed);
  islandSpeedRef.current = generalSettings.speed;
  const islandDisplayRef = useRef(islandDisplay);
  islandDisplayRef.current = islandDisplay;
  const isMouseInteractiveRef = useRef(false);
  const [expression, setExpression] = useState('sleeping');
  const [eyeTracking, setEyeTracking] = useState({ tiltDeg: 0, offsetX: 0, offsetY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Cinematic Startup Wake & Greeting State ('off' -> 'seed' -> 'pill' -> 'greet' -> 'full' -> 'done')
  const [wakeStage, setWakeStage] = useState('off');
  const [userName, setUserName] = useState('Creator');
  const [rippleActive, setRippleActive] = useState(false);
  const [rippleKey, setRippleKey] = useState(0);
  const [isSnippingMode, setIsSnippingMode] = useState(false);

  const isHoveredRef = useRef(isHovered);
  const isPinnedRef = useRef(isPinned);
  const isInputFocusedRef = useRef(isInputFocused);
  const isDropdownOpenRef = useRef(isDropdownOpen);
  const expressionRef = useRef(expression);
  const wakeStageRef = useRef('off');
  const isSnippingModeRef = useRef(false);
  const collapseTimerRef = useRef(null);
  const isDraggingFileRef = useRef(false);
  const dragLeaveTimeoutRef = useRef(null);

  // Inactivity tracking (sleep after 3 minutes of no movement)
  const lastActivityRef = useRef(Date.now());
  const lastCursorPosRef = useRef({ x: 0, y: 0 });

  isHoveredRef.current = isHovered;
  isPinnedRef.current = isPinned;
  isInputFocusedRef.current = isInputFocused;
  isDropdownOpenRef.current = isDropdownOpen;
  expressionRef.current = expression;
  wakeStageRef.current = wakeStage;
  isSnippingModeRef.current = isSnippingMode;

  const triggerPing = () => {
    setRippleKey((k) => k + 1);
    setRippleActive(true);
  };

  // Step-by-Step Startup Wake-Up & Greeting Sequence (Option A)
  useEffect(() => {
    let timers = [];
    const addTimer = (fn, delay) => {
      const id = setTimeout(fn, delay);
      timers.push(id);
      return id;
    };

    // Fetch OS user info (username)
    if (window.electronAPI?.getUserInfo) {
      window.electronAPI.getUserInfo().then((info) => {
        const detected = info?.username ? info.username : 'Creator';
        setUserName(detected);
      }).catch(() => {});
    }

    // Pass-through initial mouse events while dormant/seed
    window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });

    // Step 0: Glowing seed dot (350ms)
    addTimer(() => {
      setWakeStage('seed');
    }, 350);

    // Step 1: Smoothly stretch into 230px pill with sleeping slit eyes (1100ms)
    addTimer(() => {
      setWakeStage('pill');
      setExpression('sleeping');
    }, 1100);

    // Step 2: Eyes open to round idle orbs (1850ms)
    addTimer(() => {
      setExpression('neutral');
    }, 1850);

    // Step 3: Eyes glance left and right (2450ms)
    addTimer(() => {
      setExpression('look');
    }, 2450);

    // Step 4: Eyes squint into happy smile (3550ms)
    addTimer(() => {
      setExpression('happy');
    }, 3550);

    // Step 5: Greet Stage (4000ms) - Widens to greeting pill, ripple ping #1, wave, letter-by-letter name reveal
    addTimer(() => {
      setWakeStage('greet');
      triggerPing();
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    }, 4000);

    // Step 6: Full Expansion (6500ms) - Springs open to full 540x315 cockpit, ripple ping #2, cards pop in, telemetry count-up
    addTimer(() => {
      setWakeStage('full');
      triggerPing();
      setExpression('neutral');
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    }, 6500);

    // Step 7: Option A completion (11000ms - after 4.5 seconds in full dashboard view)
    addTimer(() => {
      setWakeStage('done');
      setRippleActive(false);
      // Auto-collapse if user is NOT currently hovering or pinned
      if (!isHoveredRef.current && !isPinnedRef.current) {
        setIsHovered(false);
        isHoveredRef.current = false;
        window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });
      }
    }, 11000);

    return () => {
      timers.forEach(clearTimeout);
    };
  }, []);

  // Apply Speed & Performance profiles to DOM root immediately
  useEffect(() => {
    document.documentElement.dataset.islandSpeed = generalSettings.speed || 'fast';
    document.documentElement.dataset.islandPerf = generalSettings.performance || 'smooth';
  }, [generalSettings.speed, generalSettings.performance]);

  // Fetch initial persisted general & island display settings from main process
  useEffect(() => {
    if (window.electronAPI?.getGeneralSettings) {
      window.electronAPI.getGeneralSettings().then((s) => {
        if (s) {
          setGeneralSettings((prev) => ({ ...prev, ...s }));
          try { localStorage.setItem('eyeland_general_settings', JSON.stringify(s)); } catch (_) {}
        }
      }).catch(() => {});
    }
    if (window.electronAPI?.getIslandDisplay) {
      window.electronAPI.getIslandDisplay().then((s) => {
        if (s) {
          setIslandDisplay((prev) => ({ ...prev, ...s }));
          try { localStorage.setItem('eyeland_island_display', JSON.stringify(s)); } catch (_) {}
        }
      }).catch(() => {});
    }
  }, []);

  // Listen for Hub actions sent from Eyeland Hub window
  useEffect(() => {
    try {
      localStorage.setItem('eyeland_theme_key', currentThemeKey);
    } catch (_) {}
  }, [currentThemeKey]);

  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'eyeland_theme_key' && e.newValue && THEMES[e.newValue]) {
        setCurrentThemeKey(e.newValue);
      } else if (e.key === 'eyeland_companion_name') {
        const nextName = (e.newValue || '').trim() || DEFAULT_COMPANION_NAME;
        setCompanionName(nextName);
      } else if (e.key === 'eyeland_companion_design') {
        setCompanionDesign(e.newValue || DEFAULT_COMPANION_DESIGN);
      } else if (e.key === 'eyeland_general_settings' && e.newValue) {
        try { setGeneralSettings((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      } else if (e.key === 'eyeland_island_display' && e.newValue) {
        try { setIslandDisplay((prev) => ({ ...prev, ...JSON.parse(e.newValue) })); } catch (_) {}
      }
    };
    window.addEventListener('storage', handleStorage);

    let unsubHub = null;
    if (window.electronAPI?.onHubAction) {
      unsubHub = window.electronAPI.onHubAction((action) => {
        if (!action) return;
        if (action.type === 'GENERAL_SETTINGS_UPDATED' && action.settings) {
          setGeneralSettings((prev) => ({ ...prev, ...action.settings }));
          try { localStorage.setItem('eyeland_general_settings', JSON.stringify(action.settings)); } catch (_) {}
        } else if (action.type === 'ISLAND_DISPLAY_UPDATED' && action.settings) {
          setIslandDisplay((prev) => ({ ...prev, ...action.settings }));
          try { localStorage.setItem('eyeland_island_display', JSON.stringify(action.settings)); } catch (_) {}
        } else if (action.type === 'APPLY_COMPANION_SETTINGS') {
          if (action.themeKey && THEMES[action.themeKey]) {
            setCurrentThemeKey(action.themeKey);
            try { localStorage.setItem('eyeland_theme_key', action.themeKey); } catch (_) {}
          }
          if (typeof action.companionName === 'string') {
            const cleanName = action.companionName.trim() || DEFAULT_COMPANION_NAME;
            setCompanionName(cleanName);
            try { localStorage.setItem('eyeland_companion_name', cleanName); } catch (_) {}
          }
          if (typeof action.companionDesign === 'string' && action.companionDesign.trim()) {
            const cleanDesign = action.companionDesign.trim();
            setCompanionDesign(cleanDesign);
            try { localStorage.setItem('eyeland_companion_design', cleanDesign); } catch (_) {}
          }
        } else if (action.type === 'SET_THEME' && action.themeKey && THEMES[action.themeKey]) {
          setCurrentThemeKey(action.themeKey);
          try { localStorage.setItem('eyeland_theme_key', action.themeKey); } catch (_) {}
        } else if (action.type === 'SET_COMPANION_NAME' && typeof action.companionName === 'string') {
          const cleanName = action.companionName.trim() || DEFAULT_COMPANION_NAME;
          setCompanionName(cleanName);
          try { localStorage.setItem('eyeland_companion_name', cleanName); } catch (_) {}
        } else if (action.type === 'SET_MOOD' && action.expression) {
          setExpression(action.expression);
        } else if (action.type === 'PET_EYES') {
          setExpression('rejoice');
          triggerPing();
          setTimeout(() => setExpression('neutral'), 1800);
        }
      });
    }

    return () => {
      window.removeEventListener('storage', handleStorage);
      unsubHub?.();
    };
  }, []);

  // Fold-in cooldown prevents cursor poll from immediately re-expanding during collapse transition
  const foldCooldownUntilRef = useRef(0);

  const handleFoldIn = () => {
    foldCooldownUntilRef.current = Date.now() + 700;
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setIsDropdownOpen(false);
    isDropdownOpenRef.current = false;
    setIsInputFocused(false);
    isInputFocusedRef.current = false;
    setIsPinned(false);
    isPinnedRef.current = false;
    setIsHovered(false);
    isHoveredRef.current = false;
    isMouseInteractiveRef.current = false;
    window.electronAPI?.setIgnoreMouseEvents?.(true);
  };

  const handleRequestExpand = () => {
    if (isSnippingModeRef.current) return;
    if (collapseTimerRef.current) {
      clearTimeout(collapseTimerRef.current);
      collapseTimerRef.current = null;
    }
    setIsHovered(true);
    isHoveredRef.current = true;
    isMouseInteractiveRef.current = true;
    window.electronAPI?.setIgnoreMouseEvents?.(false);
  };

  // Listen for precision snipping mode: collapse island during snip so entire screen is visible
  const handleSnippingModeChange = (active) => {
    isSnippingModeRef.current = active;
    setIsSnippingMode(active);
    if (active) {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      setIsHovered(false);
      isHoveredRef.current = false;
      window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });
    }
  };

  useEffect(() => {
    let cleanupStatus = null;
    let cleanupResult = null;
    if (window.electronAPI?.onSnipperStatus) {
      cleanupStatus = window.electronAPI.onSnipperStatus((status) => {
        const active = Boolean(status?.active);
        handleSnippingModeChange(active);
      });
    }
    if (window.electronAPI?.onSnippedResult) {
      cleanupResult = window.electronAPI.onSnippedResult((res) => {
        isSnippingModeRef.current = false;
        setIsSnippingMode(false);
        if (res?.success && res.dataUrl) {
          // Snip captured! Expand island to display neural analysis card
          setIsHovered(true);
          isHoveredRef.current = true;
          window.electronAPI?.setIgnoreMouseEvents?.(false);
        } else {
          // Cancelled: stay collapsed and pass-through
          setIsHovered(false);
          isHoveredRef.current = false;
          window.electronAPI?.setIgnoreMouseEvents?.(true, { forward: true });
        }
      });
    }
    return () => {
      if (typeof cleanupStatus === 'function') cleanupStatus();
      if (typeof cleanupResult === 'function') cleanupResult();
    };
  }, []);

  // Wake up helper
  const registerUserActivity = () => {
    lastActivityRef.current = Date.now();
    if (expressionRef.current === 'sleeping') {
      setExpression('neutral');
    }
  };

  // Inactivity Interval Monitor (3 minutes of inactivity)
  useEffect(() => {
    const INACTIVITY_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutes
    const interval = setInterval(() => {
      const idleTime = Date.now() - lastActivityRef.current;
      if (idleTime >= INACTIVITY_TIMEOUT_MS) {
        if (expressionRef.current === 'neutral') {
          setExpression('sleeping');
        }
      }
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Gaze Tracking calculation (memoized to eliminate unnecessary React re-renders)
  const lastGazeRef = useRef({ tiltDeg: 0, offsetX: 0, offsetY: 0 });
  const calculateGaze = (cursorX, cursorY, islandCenterX, islandCenterY) => {
    const dx = cursorX - islandCenterX;
    const dy = cursorY - islandCenterY;
    const angle = Math.atan2(dy, dx);

    // Subtle organic tilt towards cursor: max 10 deg tilt
    const tiltDeg = parseFloat((Math.sin(angle) * (dx > 0 ? 1 : -1) * 10).toFixed(1));
    const offsetX = parseFloat((Math.cos(angle) * 3.5).toFixed(1));
    const offsetY = parseFloat((Math.sin(angle) * 2.5).toFixed(1));

    if (
      lastGazeRef.current.tiltDeg === tiltDeg &&
      lastGazeRef.current.offsetX === offsetX &&
      lastGazeRef.current.offsetY === offsetY
    ) {
      return;
    }

    lastGazeRef.current = { tiltDeg, offsetX, offsetY };
    setEyeTracking({ tiltDeg, offsetX, offsetY });
  };

  // Global OS Cursor Polling & Failsafe Auto-Collapse
  useEffect(() => {
    if (window.electronAPI?.onGlobalCursor) {
      const cleanup = window.electronAPI.onGlobalCursor((data) => {
        const islandCenterX = data.windowX + data.windowWidth / 2;
        const topOffset = islandDisplayRef.current.style === 'floating' ? 10 : 0;
        const islandTop = data.windowY + topOffset;
        const islandCenterY = islandTop + 18;

        // Proximity Radius: Detect cursor ONLY within the radius of where the island expands (~310px H, ~360px V)
        const dx = data.cursorX - islandCenterX;
        const dy = Math.max(0, data.cursorY - islandTop);
        const inDetectionRadius = Math.abs(dx) <= 310 && dy <= 360;

        // Detect cursor movement anywhere across the OS to reset inactivity timer
        const dist = Math.hypot(
          data.cursorX - lastCursorPosRef.current.x,
          data.cursorY - lastCursorPosRef.current.y
        );
        if (dist > 3) {
          lastCursorPosRef.current = { x: data.cursorX, y: data.cursorY };
          registerUserActivity();
        }

        if (inDetectionRadius) {
          // Follow cursor gaze within detection radius
          calculateGaze(data.cursorX, data.cursorY, islandCenterX, islandCenterY);
        } else {
          // Outside detection radius: relax eyes to neutral forward gaze
          setEyeTracking({ tiltDeg: 0, offsetX: 0, offsetY: 0 });
        }

        const isExp = (isHoveredRef.current || isPinnedRef.current || wakeStageRef.current === 'full') && !isSnippingModeRef.current;
        const islandEl = document.getElementById('dynamic-island');
        const currentW = islandEl ? islandEl.offsetWidth : (isExp ? 540 : 230);
        const currentH = islandEl ? islandEl.offsetHeight : (isExp ? 315 : 36);

        const islandLeft = data.windowX + (data.windowWidth - currentW) / 2;
        const islandRight = islandLeft + currentW;
        const islandBottom = islandTop + currentH;

        // Accurate boundary collision detection
        const isInside = (
          data.cursorX >= islandLeft - 4 &&
          data.cursorX <= islandRight + 4 &&
          data.cursorY >= islandTop - 2 &&
          data.cursorY <= islandBottom + 6
        );

        if (isInside && !isSnippingModeRef.current && Date.now() > foldCooldownUntilRef.current) {
          // Cursor entered island: cancel collapse timer
          if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
          }
          if (islandDisplayRef.current.openMode === 'click') {
            // Click-to-open mode: allow clicking the collapsed pill without auto-expanding on hover
            if (!isMouseInteractiveRef.current) {
              isMouseInteractiveRef.current = true;
              window.electronAPI.setIgnoreMouseEvents(false);
            }
          } else if (!isHoveredRef.current) {
            setIsHovered(true);
            isHoveredRef.current = true;
            isMouseInteractiveRef.current = true;
            window.electronAPI.setIgnoreMouseEvents(false);
          }
        } else {
          // Cursor outside island
          if (!isHoveredRef.current && isMouseInteractiveRef.current) {
            isMouseInteractiveRef.current = false;
            window.electronAPI?.setIgnoreMouseEvents(true);
          }
          if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && wakeStageRef.current === 'done' && !isDraggingFileRef.current && isHoveredRef.current) {
            if (!collapseTimerRef.current) {
              collapseTimerRef.current = setTimeout(() => {
                if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && wakeStageRef.current === 'done' && !isDraggingFileRef.current) {
                  setIsHovered(false);
                  isHoveredRef.current = false;
                  isMouseInteractiveRef.current = false;
                  window.electronAPI?.setIgnoreMouseEvents(true);
                }
                collapseTimerRef.current = null;
              }, islandSpeedRef.current === 'fast' ? 85 : 185);
            }
          }
        }
      });

      return () => {
        cleanup();
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      };
    } else {
      // Browser Fallback (Vite web preview)
      const handleMouseMove = (e) => {
        const island = document.getElementById('dynamic-island');
        if (!island) return;
        const rect = island.getBoundingClientRect();

        const centerX = rect.left + rect.width / 2;
        const top = rect.top;

        // Proximity Radius: Detect cursor ONLY within radius of where it expands (~310px H, ~360px V)
        const dx = e.clientX - centerX;
        const dy = Math.max(0, e.clientY - top);
        const inDetectionRadius = Math.abs(dx) <= 310 && dy <= 360;

        if (inDetectionRadius) {
          registerUserActivity();
          const islandCenterY = top + 18;
          calculateGaze(e.clientX, e.clientY, centerX, islandCenterY);
        } else {
          setEyeTracking({ tiltDeg: 0, offsetX: 0, offsetY: 0 });
        }

        const isInside = (
          e.clientX >= rect.left - 4 &&
          e.clientX <= rect.right + 4 &&
          e.clientY >= 0 &&
          e.clientY <= rect.bottom + 6
        );

        if (isInside && !isSnippingModeRef.current && Date.now() > foldCooldownUntilRef.current) {
          if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
          }
          if (islandDisplayRef.current.openMode !== 'click' && !isHoveredRef.current) {
            setIsHovered(true);
            isHoveredRef.current = true;
          }
        } else {
          if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && wakeStageRef.current === 'done' && !isDraggingFileRef.current && isHoveredRef.current) {
            if (!collapseTimerRef.current) {
              collapseTimerRef.current = setTimeout(() => {
                if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && wakeStageRef.current === 'done' && !isDraggingFileRef.current) {
                  setIsHovered(false);
                  isHoveredRef.current = false;
                }
                collapseTimerRef.current = null;
              }, islandSpeedRef.current === 'fast' ? 85 : 185);
            }
          }
        }
      };

      const handleUserEvent = () => registerUserActivity();
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mousedown', handleUserEvent);
      window.addEventListener('keydown', handleUserEvent);

      return () => {
        window.removeEventListener('mousemove', handleMouseMove);
        window.removeEventListener('mousedown', handleUserEvent);
        window.removeEventListener('keydown', handleUserEvent);
        if (collapseTimerRef.current) clearTimeout(collapseTimerRef.current);
      };
    }
  }, []);

  const handleWindowDragOver = (e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'copy';
      isDraggingFileRef.current = true;
      if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current);
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      if (!isHoveredRef.current) {
        setIsHovered(true);
        isHoveredRef.current = true;
        window.electronAPI?.setIgnoreMouseEvents?.(false);
      }
    }
  };

  const handleWindowDragLeave = () => {
    if (dragLeaveTimeoutRef.current) clearTimeout(dragLeaveTimeoutRef.current);
    dragLeaveTimeoutRef.current = setTimeout(() => {
      isDraggingFileRef.current = false;
    }, 400);
  };

  const handleDragOutChange = (isDragging) => {
    isDraggingFileRef.current = isDragging;
    if (isDragging) {
      if (collapseTimerRef.current) {
        clearTimeout(collapseTimerRef.current);
        collapseTimerRef.current = null;
      }
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    }
  };

  return (
    <div 
      className="w-screen h-screen flex flex-col items-center justify-start bg-transparent overflow-hidden select-none relative transition-all duration-300"
      style={{ paddingTop: islandDisplay.style === 'floating' ? '10px' : '0px' }}
      onDragEnter={handleWindowDragOver}
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
    >
      {/* Radiating Circular Ripple Ping Wave */}
      {rippleActive && (
        <div 
          key={rippleKey} 
          className="ripple-ring pointer-events-none" 
          style={{ 
            borderColor: THEMES[currentThemeKey]?.color || '#5EEAD4',
            boxShadow: `0 0 16px ${THEMES[currentThemeKey]?.color || '#5EEAD4'}80`
          }} 
        />
      )}

      {/* Eyeland docked with smooth rounded corners */}
      <DynamicIsland
        theme={getThemeByKey(currentThemeKey)}
        setThemeKey={setCurrentThemeKey}
        themes={THEMES}
        companionName={companionName}
        companionDesign={companionDesign}
        language={generalSettings.language}
        displaySettings={islandDisplay}
        onRequestExpand={handleRequestExpand}
        eyeTracking={eyeTracking}
        expression={expression}
        setExpression={setExpression}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        isSnippingMode={isSnippingMode}
        onSnippingModeChange={handleSnippingModeChange}
        onInputFocusChange={setIsInputFocused}
        onDropdownChange={setIsDropdownOpen}
        onDragOutChange={handleDragOutChange}
        onFoldIn={handleFoldIn}
        wakeStage={wakeStage}
        userName={userName}
      />
    </div>
  );
}
