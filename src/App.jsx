import React, { useState, useEffect, useRef } from 'react';
import DynamicIsland from './components/DynamicIsland.jsx';
import DashboardApp from './components/DashboardApp.jsx';
import { getRandomGreeting, formatUserName } from './utils/greetings.js';

const THEMES = {
  mint: {
    name: 'Mint Glow (Reference)',
    color: '#c5f8d6',
    shadow: '0 0 14px rgba(197, 248, 214, 0.95), 0 0 26px rgba(197, 248, 214, 0.4)',
  },
  white: {
    name: 'Studio White',
    color: '#FFFFFF',
    shadow: '0 0 14px rgba(255, 255, 255, 0.9), 0 0 24px rgba(255, 255, 255, 0.35)',
  },
  cyan: {
    name: 'Cyber Cyan',
    color: '#38bdf8',
    shadow: '0 0 14px rgba(56, 189, 248, 0.95), 0 0 26px rgba(56, 189, 248, 0.4)',
  },
  amber: {
    name: 'Warm Amber',
    color: '#fbbf24',
    shadow: '0 0 14px rgba(251, 191, 36, 0.95), 0 0 26px rgba(251, 191, 36, 0.4)',
  },
};

export default function App() {
  const urlParams = new URLSearchParams(window.location.search);
  const isDashboardView = urlParams.get('view') === 'dashboard' || window.location.hash === '#dashboard';

  if (isDashboardView) {
    return <DashboardApp />;
  }

  const [currentThemeKey, setCurrentThemeKey] = useState('mint');
  const [expression, setExpression] = useState('greeting');
  const [eyeTracking, setEyeTracking] = useState({ tiltDeg: 0, offsetX: 0, offsetY: 0 });
  const [isHovered, setIsHovered] = useState(false);
  const [isPinned, setIsPinned] = useState(false);
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Startup Greeting State
  const [userName, setUserName] = useState('Creator');
  const [greeting, setGreeting] = useState(null);
  const [isGreetingActive, setIsGreetingActive] = useState(true);

  const isHoveredRef = useRef(isHovered);
  const isPinnedRef = useRef(isPinned);
  const isInputFocusedRef = useRef(isInputFocused);
  const isDropdownOpenRef = useRef(isDropdownOpen);
  const expressionRef = useRef(expression);
  const isGreetingActiveRef = useRef(true);
  const collapseTimerRef = useRef(null);
  const greetingTimerRef = useRef(null);
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
  isGreetingActiveRef.current = isGreetingActive;

  // Trigger Startup / Interactive Greeting
  const triggerGreeting = (targetName = userName) => {
    if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    const g = getRandomGreeting(targetName);
    setGreeting(g);
    setIsGreetingActive(true);
    isGreetingActiveRef.current = true;
    setExpression('greeting');
    expressionRef.current = 'greeting';
    window.electronAPI?.setIgnoreMouseEvents(false);

    greetingTimerRef.current = setTimeout(() => {
      setIsGreetingActive(false);
      isGreetingActiveRef.current = false;
      if (expressionRef.current === 'greeting') {
        setExpression('neutral');
      }
      if (!isHoveredRef.current && !isPinnedRef.current) {
        window.electronAPI?.setIgnoreMouseEvents(true);
      }
    }, 6500);
  };

  const dismissGreeting = () => {
    if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
    setIsGreetingActive(false);
    isGreetingActiveRef.current = false;
    if (expressionRef.current === 'greeting') {
      setExpression('neutral');
    }
    if (!isHoveredRef.current && !isPinnedRef.current) {
      window.electronAPI?.setIgnoreMouseEvents(true);
    }
  };

  // Fetch OS user info and greet on launch
  useEffect(() => {
    if (window.electronAPI?.getUserInfo) {
      window.electronAPI.getUserInfo().then((info) => {
        const detected = info?.username ? info.username : 'Creator';
        setUserName(detected);
        triggerGreeting(detected);
      }).catch(() => {
        triggerGreeting('Creator');
      });
    } else {
      triggerGreeting('Creator');
    }

    return () => {
      if (greetingTimerRef.current) clearTimeout(greetingTimerRef.current);
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

  // Gaze Tracking calculation
  const calculateGaze = (cursorX, cursorY, islandCenterX, islandCenterY) => {
    const dx = cursorX - islandCenterX;
    const dy = cursorY - islandCenterY;
    const angle = Math.atan2(dy, dx);

    // Subtle organic tilt towards cursor: max 10 deg tilt
    const tiltDeg = Math.sin(angle) * (dx > 0 ? 1 : -1) * 10;
    const offsetX = Math.cos(angle) * 3.5;
    const offsetY = Math.sin(angle) * 2.5;

    setEyeTracking({
      tiltDeg: parseFloat(tiltDeg.toFixed(1)),
      offsetX: parseFloat(offsetX.toFixed(1)),
      offsetY: parseFloat(offsetY.toFixed(1)),
    });
  };

  // Global OS Cursor Polling & Failsafe Auto-Collapse
  useEffect(() => {
    if (window.electronAPI?.onGlobalCursor) {
      const cleanup = window.electronAPI.onGlobalCursor((data) => {
        const islandCenterX = data.windowX + data.windowWidth / 2;
        const islandTop = data.windowY; // 0
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

        const isExp = isHoveredRef.current || isPinnedRef.current || isGreetingActiveRef.current;
        const islandEl = document.getElementById('dynamic-island');
        const currentW = islandEl ? islandEl.offsetWidth : (isExp ? 540 : 230);
        const currentH = islandEl ? islandEl.offsetHeight : (isExp ? (isGreetingActiveRef.current && !isHoveredRef.current && !isPinnedRef.current ? 210 : 315) : 36);

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

        if (isInside) {
          // Cursor entered island: cancel collapse timer & expand immediately
          if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
          }
          if (!isHoveredRef.current) {
            setIsHovered(true);
            isHoveredRef.current = true;
            window.electronAPI.setIgnoreMouseEvents(false);
          }
        } else {
          // Cursor outside island
          if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && !isGreetingActiveRef.current && !isDraggingFileRef.current && isHoveredRef.current) {
            if (!collapseTimerRef.current) {
              collapseTimerRef.current = setTimeout(() => {
                if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && !isGreetingActiveRef.current && !isDraggingFileRef.current) {
                  setIsHovered(false);
                  isHoveredRef.current = false;
                  window.electronAPI?.setIgnoreMouseEvents(true);
                }
                collapseTimerRef.current = null;
              }, 140);
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

        if (isInside) {
          if (collapseTimerRef.current) {
            clearTimeout(collapseTimerRef.current);
            collapseTimerRef.current = null;
          }
          if (!isHoveredRef.current) {
            setIsHovered(true);
            isHoveredRef.current = true;
          }
        } else {
          if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && !isGreetingActiveRef.current && !isDraggingFileRef.current && isHoveredRef.current) {
            if (!collapseTimerRef.current) {
              collapseTimerRef.current = setTimeout(() => {
                if (!isPinnedRef.current && !isInputFocusedRef.current && !isDropdownOpenRef.current && !isGreetingActiveRef.current && !isDraggingFileRef.current) {
                  setIsHovered(false);
                  isHoveredRef.current = false;
                }
                collapseTimerRef.current = null;
              }, 140);
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
      className="w-screen h-screen flex flex-col items-center justify-start bg-transparent overflow-hidden select-none"
      onDragEnter={handleWindowDragOver}
      onDragOver={handleWindowDragOver}
      onDragLeave={handleWindowDragLeave}
    >
      {/* Eyeland docked with smooth rounded corners */}
      <DynamicIsland
        theme={THEMES[currentThemeKey]}
        setThemeKey={setCurrentThemeKey}
        themes={THEMES}
        eyeTracking={eyeTracking}
        expression={expression}
        setExpression={setExpression}
        isHovered={isHovered}
        setIsHovered={setIsHovered}
        isPinned={isPinned}
        setIsPinned={setIsPinned}
        onInputFocusChange={setIsInputFocused}
        onDropdownChange={setIsDropdownOpen}
        onDragOutChange={handleDragOutChange}
        greeting={greeting}
        isGreetingActive={isGreetingActive}
        onDismissGreeting={dismissGreeting}
        onTriggerGreeting={() => triggerGreeting(userName)}
      />
    </div>
  );
}
