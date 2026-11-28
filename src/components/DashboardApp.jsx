import React, { useState, useEffect } from 'react';
import MinimalEyes from './MinimalEyes.jsx';
import CompanionCoreAvatar from './CompanionCoreAvatar.jsx';
import {
  IconHome,
  IconConnections,
  IconAiChat,
  IconBuddy,
  IconWardrobe,
  IconAccount,
  IconGeneral,
  IconIsland,
  IconFocusGuard,
  IconNews,
  IconSupport,
  IconCpu,
  IconRam,
  IconWifi,
  IconBattery,
  IconBatteryCharging,
  IconSnipping,
  IconClipboard,
  IconCheck,
  IconSparkles,
  IconBot,
  IconFolder,
  IconClock,
  IconFlame,
  IconTarget,
  IconZap,
  IconEye,
  IconEyeOff,
  IconRefresh,
  IconDownload,
  IconPalette,
  IconSmile,
  IconHeartSmile,
  IconSleep,
  IconWave,
  IconX,
  IconWeather,
  IconMapPin,
} from './Icons.jsx';
import { EYELAND_THEMES, DEFAULT_COMPANION_NAME, getThemeByKey } from '../config/themes.js';
import { COMPANION_DESIGNS, DEFAULT_COMPANION_DESIGN, getDesignById } from '../config/companionDesigns.js';
import { SUPPORTED_LANGUAGES, DEFAULT_GENERAL_SETTINGS, getTranslations } from '../config/i18n.js';
import { DEFAULT_ISLAND_DISPLAY, GLASS_COLOR_OPTIONS, hexToRgbTuple } from '../config/islandDisplay.js';
import { fetchLiveWeather } from '../services/weatherService.js';

export const HUB_THEMES = EYELAND_THEMES;

const COMPANION_NAME_PRESETS = ['Bio-Core', 'Nova', 'Aether', 'Lumi', 'Pixel', 'Aura'];

function formatRelativeTime(ts) {
  if (!ts) return 'Recently';
  const diff = Date.now() - ts;
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return new Date(ts).toLocaleDateString([], { month: 'short', day: 'numeric' });
}

export default function DashboardApp() {
  const [activeNav, setActiveNav] = useState('home');
  const [isMaximized, setIsMaximized] = useState(false);
  const [userName, setUserName] = useState('Creator');
  const [currentTime, setCurrentTime] = useState({
    timeStr: '4:41 PM',
    dateStr: 'SUN 08 NOV',
    greeting: 'Good afternoon'
  });
  const [searchQuery, setSearchQuery] = useState('');
  
  // Saved vs. Draft Theme & Companion Name (Changes apply ONLY when user clicks "Save Changes")
  const [savedTheme, setSavedTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_theme_key');
      return saved && HUB_THEMES[saved] ? saved : 'mint';
    } catch (_) {
      return 'mint';
    }
  });
  const [draftTheme, setDraftTheme] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_theme_key');
      return saved && HUB_THEMES[saved] ? saved : 'mint';
    } catch (_) {
      return 'mint';
    }
  });
  const [savedCompanionName, setSavedCompanionName] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_companion_name');
      return saved && saved.trim() ? saved.trim() : DEFAULT_COMPANION_NAME;
    } catch (_) {
      return DEFAULT_COMPANION_NAME;
    }
  });
  const [draftCompanionName, setDraftCompanionName] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_companion_name');
      return saved && saved.trim() ? saved.trim() : DEFAULT_COMPANION_NAME;
    } catch (_) {
      return DEFAULT_COMPANION_NAME;
    }
  });
  const [savedDesign, setSavedDesign] = useState(() => {
    try {
      return localStorage.getItem('eyeland_companion_design') || DEFAULT_COMPANION_DESIGN;
    } catch (_) {
      return DEFAULT_COMPANION_DESIGN;
    }
  });
  const [draftDesign, setDraftDesign] = useState(() => {
    try {
      return localStorage.getItem('eyeland_companion_design') || DEFAULT_COMPANION_DESIGN;
    } catch (_) {
      return DEFAULT_COMPANION_DESIGN;
    }
  });
  const currentDesign = getDesignById(draftDesign);
  const activeTheme = draftTheme;
  const [companionExpression, setCompanionExpression] = useState('neutral');
  const [copiedActivityId, setCopiedActivityId] = useState(null);
  const [copiedClipToast, setCopiedClipToast] = useState(false);
  const [snipToast, setSnipToast] = useState(false);
  const [saveAllToast, setSaveAllToast] = useState(false);
  const [isSavingAll, setIsSavingAll] = useState(false);
  const [updateState, setUpdateState] = useState({ status: 'idle', version: null });

  // Focus productivity state synced from localStorage
  const [focusState, setFocusState] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_focus_state');
      if (s) return JSON.parse(s);
    } catch (_) {}
    return { isFocusRunning: false, focusPhase: 'work', focusSecondsLeft: 1500, focusTotalSeconds: 1500, completedSessionsToday: 0 };
  });

  // Staged files count synced from localStorage
  const [stagedFilesCount, setStagedFilesCount] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_staged_files');
      if (s) return JSON.parse(s).length;
    } catch (_) {}
    return 0;
  });

  // Clipboard items synced from localStorage & live hook
  const [clipboardItems, setClipboardItems] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_clipboard_history');
      if (s) return JSON.parse(s);
    } catch (_) {}
    return [];
  });

  // Activity History (Multimodal AI Operations, screen snips, clipboard events)
  const [activityHistory, setActivityHistory] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_activity_history');
      if (s) {
        const arr = JSON.parse(s);
        if (Array.isArray(arr)) {
          // Filter out any legacy seed entries so only 100% real operations display
          return arr.filter((item) => !item.id?.startsWith('seed-'));
        }
      }
    } catch (_) {}
    return [];
  });

  // Real System Hardware & Network Telemetry
  const [systemInfo, setSystemInfo] = useState({
    cpu: { loadPercent: 0, model: 'Scanning Hardware...', cores: 0 },
    memory: { usedGb: '0.0', totalGb: '0.0', percent: 0 },
    battery: { percent: 100, isCharging: true },
    wifi: { ssid: 'Connecting...', signal: 0, speed: '0 Mbps', radioType: 'Wi-Fi' },
    system: { uptimeHours: 0, uptimeMins: 0, hostname: '', platform: 'win32' },
  });
  const [aiStatus, setAiStatus] = useState({
    tier: 'bundled',
    activeModel: 'gemini-3.1-flash-lite',
    hasKey: true,
    maskedKey: '',
    hasBundledKey: true,
    availableModels: [
      { id: 'gemini-3.1-flash-lite', name: 'Gemini 3.1 Flash Lite', badge: 'Ultra Fast', description: 'Lowest latency (~1s) — best for instant screen snips & quick answers.' },
      { id: 'gemini-flash-lite-latest', name: 'Gemini Flash Lite (Latest)', badge: 'Auto-Updated', description: 'Always points to Google’s newest lightweight Flash-Lite release.' },
      { id: 'gemini-2.5-flash', name: 'Gemini 2.5 Flash', badge: 'Balanced', description: 'Great balance of multimodal vision accuracy, reasoning, and speed.' },
      { id: 'gemini-2.5-flash-lite', name: 'Gemini 2.5 Flash Lite', badge: 'High Quota', description: 'Lightweight model optimized for high-volume everyday tasks.' },
      { id: 'gemini-2.5-pro', name: 'Gemini 2.5 Pro', badge: 'Deep Reasoning', description: 'Maximum intelligence for complex code debugging and deep analysis.' },
    ],
  });

  // Connections Tab — Google Gemini Draft State (Staged until "Save Changes")
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [pendingClearGeminiKey, setPendingClearGeminiKey] = useState(false);
  const [draftGeminiModel, setDraftGeminiModel] = useState('gemini-3.1-flash-lite');
  const [showGeminiKey, setShowGeminiKey] = useState(false);
  const [geminiNotice, setGeminiNotice] = useState(null); // { type: 'success' | 'error', text: string }
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiTestResult, setGeminiTestResult] = useState(null);

  // Account Tab — Beta Tester / First User Registration State
  const [betaTester, setBetaTester] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_beta_tester');
      if (s) return JSON.parse(s);
    } catch (_) {}
    return null;
  });
  const [betaEmailInput, setBetaEmailInput] = useState('');
  const [isEditingBetaEmail, setIsEditingBetaEmail] = useState(false);
  const [isRegisteringBeta, setIsRegisteringBeta] = useState(false);
  const [betaError, setBetaError] = useState('');

  // General Tab — Language, Speed, Performance, Game Mode (Draft vs. Saved)
  const [savedGeneralSettings, setSavedGeneralSettings] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_general_settings');
      if (s) return { ...DEFAULT_GENERAL_SETTINGS, ...JSON.parse(s) };
    } catch (_) {}
    return { ...DEFAULT_GENERAL_SETTINGS };
  });
  const [draftGeneralSettings, setDraftGeneralSettings] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_general_settings');
      if (s) return { ...DEFAULT_GENERAL_SETTINGS, ...JSON.parse(s) };
    } catch (_) {}
    return { ...DEFAULT_GENERAL_SETTINGS };
  });
  const [confirmResetOpen, setConfirmResetOpen] = useState(false);

  // Island Display Tab — Look & On-The-Island Preferences (Draft vs. Saved)
  const [savedIslandDisplay, setSavedIslandDisplay] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_island_display');
      if (s) return { ...DEFAULT_ISLAND_DISPLAY, ...JSON.parse(s) };
    } catch (_) {}
    return { ...DEFAULT_ISLAND_DISPLAY };
  });
  const [draftIslandDisplay, setDraftIslandDisplay] = useState(() => {
    try {
      const s = localStorage.getItem('eyeland_island_display');
      if (s) return { ...DEFAULT_ISLAND_DISPLAY, ...JSON.parse(s) };
    } catch (_) {}
    return { ...DEFAULT_ISLAND_DISPLAY };
  });
  const [connectedDisplays, setConnectedDisplays] = useState([]);
  const t = getTranslations(draftGeneralSettings.language);

  // Live Weather Preview in Hub
  const [hubWeather, setHubWeather] = useState(null);
  const [isHubWeatherLoading, setIsHubWeatherLoading] = useState(false);

  useEffect(() => {
    let isCancelled = false;
    const timer = setTimeout(async () => {
      setIsHubWeatherLoading(true);
      try {
        const w = await fetchLiveWeather({
          city: draftIslandDisplay.weatherCity || '',
          units: draftIslandDisplay.weatherUnits || 'celsius',
        });
        if (!isCancelled && w) {
          setHubWeather(w);
        }
      } catch (_) {
      } finally {
        if (!isCancelled) setIsHubWeatherLoading(false);
      }
    }, 350);

    return () => {
      isCancelled = true;
      clearTimeout(timer);
    };
  }, [draftIslandDisplay.weatherCity, draftIslandDisplay.weatherUnits]);

  // Live Clock & User Info
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      const hours = now.getHours();
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      const displayHours = hours % 12 || 12;

      const days = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const months = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC'];
      const dayName = days[now.getDay()];
      const dayNum = String(now.getDate()).padStart(2, '0');
      const monthName = months[now.getMonth()];

      let greet = 'Good morning';
      if (hours >= 12 && hours < 17) greet = 'Good afternoon';
      else if (hours >= 17) greet = 'Good evening';

      setCurrentTime({
        timeStr: `${displayHours}:${minutes} ${ampm}`,
        dateStr: `${dayName} ${dayNum} ${monthName}`,
        greeting: greet
      });
    };

    updateTime();
    const interval = setInterval(updateTime, 1000);

    // Fetch user info & telemetry
    if (window.electronAPI?.getUserInfo) {
      window.electronAPI.getUserInfo().then((info) => {
        if (info?.username) setUserName(info.username);
      }).catch(() => {});
    }
    if (window.electronAPI?.isDashboardMaximized) {
      window.electronAPI.isDashboardMaximized().then(setIsMaximized).catch(() => {});
    }
    if (window.electronAPI?.getSystemTelemetry) {
      window.electronAPI.getSystemTelemetry().then((t) => {
        if (t) setSystemInfo(prev => ({ ...prev, ...t }));
      }).catch(() => {});
    }
    if (window.electronAPI?.geminiGetStatus) {
      window.electronAPI.geminiGetStatus().then((s) => {
        if (s) {
          setAiStatus((prev) => ({ ...prev, ...s }));
          if (s.activeModel) setDraftGeminiModel(s.activeModel);
        }
      }).catch(() => {});
    }
    if (window.electronAPI?.getBetaTester) {
      window.electronAPI.getBetaTester().then((rec) => {
        if (rec?.email) {
          setBetaTester(rec);
          try { localStorage.setItem('eyeland_beta_tester', JSON.stringify(rec)); } catch (_) {}
        }
      }).catch(() => {});
    }
    if (window.electronAPI?.getGeneralSettings) {
      window.electronAPI.getGeneralSettings().then((s) => {
        if (s) {
          const merged = { ...DEFAULT_GENERAL_SETTINGS, ...s };
          setSavedGeneralSettings(merged);
          setDraftGeneralSettings(merged);
          try { localStorage.setItem('eyeland_general_settings', JSON.stringify(merged)); } catch (_) {}
        }
      }).catch(() => {});
    }
    if (window.electronAPI?.getIslandDisplay) {
      window.electronAPI.getIslandDisplay().then((s) => {
        if (s) {
          const merged = { ...DEFAULT_ISLAND_DISPLAY, ...s };
          setSavedIslandDisplay(merged);
          setDraftIslandDisplay(merged);
          try { localStorage.setItem('eyeland_island_display', JSON.stringify(merged)); } catch (_) {}
        }
      }).catch(() => {});
    }
    if (window.electronAPI?.getDisplays) {
      window.electronAPI.getDisplays().then((list) => {
        if (Array.isArray(list)) setConnectedDisplays(list);
      }).catch(() => {});
    }

    return () => clearInterval(interval);
  }, []);

  // Live Telemetry Subscription
  useEffect(() => {
    if (window.electronAPI?.onTelemetryUpdate) {
      const unsub = window.electronAPI.onTelemetryUpdate((t) => {
        if (t) setSystemInfo(prev => ({ ...prev, ...t }));
      });
      return unsub;
    }
  }, []);

  // Live Real-Time Clipboard Subscription
  useEffect(() => {
    if (window.electronAPI?.onClipboardCopy) {
      const unsub = window.electronAPI.onClipboardCopy((item) => {
        if (!item || !item.text) return;
        setClipboardItems((prev) => {
          const exists = prev.some((i) => i.text === item.text);
          if (exists) return prev;
          const newItem = {
            id: 'clip_' + Date.now(),
            text: item.text,
            type: 'text',
            timestamp: Date.now()
          };
          const updated = [newItem, ...prev].slice(0, 10);
          try { localStorage.setItem('eyeland_clipboard_history', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });

        // Also add to activity history
        const actEntry = {
          id: 'act_clip_' + Date.now(),
          type: 'clipboard',
          tool: 'clipboard',
          title: 'Clipboard Capture',
          preview: item.text.slice(0, 120),
          fullText: item.text,
          timestamp: Date.now()
        };
        setActivityHistory((prev) => {
          const updated = [actEntry, ...prev].slice(0, 50);
          try { localStorage.setItem('eyeland_activity_history', JSON.stringify(updated)); } catch (_) {}
          return updated;
        });
      });
      return unsub;
    }
  }, []);

  // Live Island Actions Subscription
  useEffect(() => {
    if (window.electronAPI?.onIslandAction) {
      const unsub = window.electronAPI.onIslandAction((action) => {
        if (!action) return;
        if (action.type === 'ACTIVITY_LOGGED' && action.entry) {
          setActivityHistory((prev) => {
            const updated = [action.entry, ...prev.filter(e => e.id !== action.entry.id)].slice(0, 50);
            return updated;
          });
        } else if (action.type === 'FOCUS_UPDATE') {
          setFocusState(prev => ({ ...prev, ...action }));
        } else if (action.type === 'THEME_CHANGED' && action.themeKey && HUB_THEMES[action.themeKey]) {
          setSavedTheme(action.themeKey);
          setDraftTheme(action.themeKey);
        } else if (action.type === 'AI_STATUS_UPDATED' && action.status) {
          setAiStatus((prev) => ({ ...prev, ...action.status }));
          if (action.status.activeModel) setDraftGeminiModel(action.status.activeModel);
        } else if (action.type === 'CLIPBOARD_CLEARED') {
          setClipboardItems([]);
          try { localStorage.removeItem('eyeland_clipboard_history'); } catch (_) {}
        }
      });
      return unsub;
    }
  }, []);

  // Sync with localStorage changes across windows
  useEffect(() => {
    const handleStorage = (e) => {
      if (e.key === 'eyeland_theme_key' && e.newValue && HUB_THEMES[e.newValue]) {
        setSavedTheme(e.newValue);
        setDraftTheme(e.newValue);
      } else if (e.key === 'eyeland_companion_name') {
        const nextName = (e.newValue || '').trim() || DEFAULT_COMPANION_NAME;
        setSavedCompanionName(nextName);
        setDraftCompanionName(nextName);
      } else if (e.key === 'eyeland_companion_design') {
        const nextDesign = e.newValue || DEFAULT_COMPANION_DESIGN;
        setSavedDesign(nextDesign);
        setDraftDesign(nextDesign);
      } else if (e.key === 'eyeland_focus_state' && e.newValue) {
        try { setFocusState(JSON.parse(e.newValue)); } catch (_) {}
      } else if (e.key === 'eyeland_staged_files' && e.newValue) {
        try { setStagedFilesCount(JSON.parse(e.newValue).length); } catch (_) {}
      } else if (e.key === 'eyeland_activity_history' && e.newValue) {
        try { setActivityHistory(JSON.parse(e.newValue)); } catch (_) {}
      } else if (e.key === 'eyeland_clipboard_history') {
        if (!e.newValue) {
          setClipboardItems([]);
        } else {
          try { setClipboardItems(JSON.parse(e.newValue)); } catch (_) {}
        }
      }
    };
    window.addEventListener('storage', handleStorage);
    return () => window.removeEventListener('storage', handleStorage);
  }, []);

  // Live Auto-Update Subscription
  useEffect(() => {
    if (window.electronAPI?.onUpdateStatus) {
      const unsub = window.electronAPI.onUpdateStatus((statusObj) => {
        if (statusObj) setUpdateState(statusObj);
      });
      return unsub;
    }
  }, []);

  const handleCheckForUpdates = async () => {
    setUpdateState({ status: 'checking', version: null });
    if (window.electronAPI?.checkForUpdates) {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (res?.status === 'dev-mode') {
          setUpdateState({ status: 'dev-mode', message: res.message });
          setTimeout(() => setUpdateState({ status: 'idle', version: null }), 4000);
        } else if (res?.status === 'error') {
          setUpdateState({ status: 'error', message: res.message });
          setTimeout(() => setUpdateState({ status: 'idle', version: null }), 5000);
        }
      } catch (err) {
        setUpdateState({ status: 'error', message: err.message });
        setTimeout(() => setUpdateState({ status: 'idle', version: null }), 5000);
      }
    }
  };

  const showGeminiNoticeTemp = (type, text) => {
    setGeminiNotice({ type, text });
    setTimeout(() => {
      setGeminiNotice((prev) => (prev?.text === text ? null : prev));
    }, 3500);
  };

  // Global Unsaved Changes Computation across ALL Hub tabs
  const normalizedDraftName = draftCompanionName.trim() || DEFAULT_COMPANION_NAME;
  const isThemeDirty = draftTheme !== savedTheme;
  const isNameDirty = normalizedDraftName !== savedCompanionName;
  const isDesignDirty = draftDesign !== savedDesign;
  const isModelDirty = draftGeminiModel !== aiStatus.activeModel;
  const isKeyDirty = geminiKeyInput.trim().length > 0 || pendingClearGeminiKey;
  const isLanguageDirty = draftGeneralSettings.language !== savedGeneralSettings.language;
  const isSpeedDirty = draftGeneralSettings.speed !== savedGeneralSettings.speed;
  const isPerformanceDirty = draftGeneralSettings.performance !== savedGeneralSettings.performance;
  const isGameModeDirty = draftGeneralSettings.gameMode !== savedGeneralSettings.gameMode;
  const isStartWithWindowsDirty =
    Boolean(draftGeneralSettings.startWithWindows) !== Boolean(savedGeneralSettings.startWithWindows);
  const isAnonStatsDirty =
    Boolean(draftGeneralSettings.anonymousStats) !== Boolean(savedGeneralSettings.anonymousStats);
  const isGeneralDirty =
    isLanguageDirty ||
    isSpeedDirty ||
    isPerformanceDirty ||
    isGameModeDirty ||
    isStartWithWindowsDirty ||
    isAnonStatsDirty;
  const isIslandDisplayDirty =
    draftIslandDisplay.size !== savedIslandDisplay.size ||
    draftIslandDisplay.style !== savedIslandDisplay.style ||
    draftIslandDisplay.material !== savedIslandDisplay.material ||
    Number(draftIslandDisplay.seeThrough) !== Number(savedIslandDisplay.seeThrough) ||
    draftIslandDisplay.glassColor !== savedIslandDisplay.glassColor ||
    Boolean(draftIslandDisplay.musicColor) !== Boolean(savedIslandDisplay.musicColor) ||
    draftIslandDisplay.openMode !== savedIslandDisplay.openMode ||
    String(draftIslandDisplay.screenId) !== String(savedIslandDisplay.screenId) ||
    Boolean(draftIslandDisplay.showLyrics) !== Boolean(savedIslandDisplay.showLyrics) ||
    Boolean(draftIslandDisplay.wordByWord) !== Boolean(savedIslandDisplay.wordByWord) ||
    Boolean(draftIslandDisplay.showVolumeBar) !== Boolean(savedIslandDisplay.showVolumeBar) ||
    Boolean(draftIslandDisplay.showWeather) !== Boolean(savedIslandDisplay.showWeather) ||
    String(draftIslandDisplay.weatherCity || '') !== String(savedIslandDisplay.weatherCity || '') ||
    String(draftIslandDisplay.weatherUnits || 'celsius') !== String(savedIslandDisplay.weatherUnits || 'celsius');

  const unsavedLabels = [];
  if (isNameDirty) unsavedLabels.push('Companion Name');
  if (isDesignDirty) unsavedLabels.push('Wardrobe Design');
  if (isThemeDirty) unsavedLabels.push('Color Theme');
  if (isKeyDirty) unsavedLabels.push(pendingClearGeminiKey ? 'Clear API Key' : 'Gemini API Key');
  if (isModelDirty) unsavedLabels.push('Default Model');
  if (isLanguageDirty) unsavedLabels.push('Language');
  if (isSpeedDirty) unsavedLabels.push('Speed');
  if (isPerformanceDirty) unsavedLabels.push('Performance');
  if (isGameModeDirty) unsavedLabels.push('Game Mode');
  if (isStartWithWindowsDirty) unsavedLabels.push('Start with Windows');
  if (isAnonStatsDirty) unsavedLabels.push('Anonymous Statistics');
  if (isIslandDisplayDirty) unsavedLabels.push('Island Display');
  const hasUnsavedChanges = unsavedLabels.length > 0;

  // Stage theme change in draft (applied only when user presses "Save Changes")
  const handleChangeTheme = (themeKey) => {
    if (!HUB_THEMES[themeKey]) return;
    setDraftTheme(themeKey);
  };

  // Stage Gemini model selection in draft
  const handleSelectGeminiModel = (modelId) => {
    if (!modelId) return;
    setDraftGeminiModel(modelId);
    setGeminiTestResult(null);
  };

  // Stage clearing custom Gemini API key in draft
  const handleStageClearGeminiKey = () => {
    setGeminiKeyInput('');
    setPendingClearGeminiKey((prev) => !prev);
    setGeminiTestResult(null);
  };

  // Commit ALL staged changes across all Hub tabs
  const handleSaveAllChanges = async () => {
    if (!hasUnsavedChanges || isSavingAll) return;
    setIsSavingAll(true);
    try {
      // 1. Companion Theme, Name & Wardrobe Design
      if (isThemeDirty || isNameDirty || isDesignDirty) {
        const finalTheme = draftTheme;
        const finalName = normalizedDraftName;
        const finalDesign = draftDesign;
        setSavedTheme(finalTheme);
        setSavedCompanionName(finalName);
        setDraftCompanionName(finalName);
        setSavedDesign(finalDesign);
        try {
          localStorage.setItem('eyeland_theme_key', finalTheme);
          localStorage.setItem('eyeland_companion_name', finalName);
          localStorage.setItem('eyeland_companion_design', finalDesign);
        } catch (_) {}
        if (window.electronAPI?.sendHubAction) {
          window.electronAPI.sendHubAction({
            type: 'APPLY_COMPANION_SETTINGS',
            themeKey: finalTheme,
            companionName: finalName,
            companionDesign: finalDesign,
          });
        }
      }

      // 2. Gemini API Key (save new or clear to bundled)
      if (isKeyDirty && window.electronAPI?.geminiSaveApiKey) {
        const keyToSave = pendingClearGeminiKey ? '' : geminiKeyInput.trim();
        const res = await window.electronAPI.geminiSaveApiKey(keyToSave);
        if (res?.success) {
          if (res.status) setAiStatus((prev) => ({ ...prev, ...res.status }));
          setGeminiKeyInput('');
          setPendingClearGeminiKey(false);
          setGeminiTestResult(null);
        } else {
          showGeminiNoticeTemp('error', res?.error || 'Could not save Gemini API key.');
        }
      }

      // 3. Gemini Preferred Model
      if (isModelDirty && window.electronAPI?.geminiSaveModel) {
        const res = await window.electronAPI.geminiSaveModel(draftGeminiModel);
        if (res?.success) {
          if (res.status) {
            setAiStatus((prev) => ({ ...prev, ...res.status }));
          } else {
            setAiStatus((prev) => ({ ...prev, activeModel: draftGeminiModel }));
          }
          setGeminiTestResult(null);
        } else {
          showGeminiNoticeTemp('error', res?.error || 'Could not save Gemini model.');
        }
      }

      // 4. General Settings (Language, Speed, Performance, Game Mode)
      if (isGeneralDirty) {
        const nextGeneral = { ...draftGeneralSettings };
        setSavedGeneralSettings(nextGeneral);
        try { localStorage.setItem('eyeland_general_settings', JSON.stringify(nextGeneral)); } catch (_) {}
        if (window.electronAPI?.saveGeneralSettings) {
          await window.electronAPI.saveGeneralSettings(nextGeneral);
        } else if (window.electronAPI?.sendHubAction) {
          window.electronAPI.sendHubAction({ type: 'GENERAL_SETTINGS_UPDATED', settings: nextGeneral });
        }
      }

      // 5. Island Display Settings (Look, Glass Material, Screen, Lyrics, Word-by-Word, Volume Bar)
      if (isIslandDisplayDirty) {
        const nextDisplay = { ...draftIslandDisplay };
        setSavedIslandDisplay(nextDisplay);
        try { localStorage.setItem('eyeland_island_display', JSON.stringify(nextDisplay)); } catch (_) {}
        if (window.electronAPI?.saveIslandDisplay) {
          await window.electronAPI.saveIslandDisplay(nextDisplay);
        } else if (window.electronAPI?.sendHubAction) {
          window.electronAPI.sendHubAction({ type: 'ISLAND_DISPLAY_UPDATED', settings: nextDisplay });
        }
      }

      setSaveAllToast(true);
      setTimeout(() => setSaveAllToast(false), 2600);
    } catch (err) {
      showGeminiNoticeTemp('error', err.message || 'Failed to save changes.');
    } finally {
      setIsSavingAll(false);
    }
  };

  // Discard ALL staged changes across all Hub tabs
  const handleDiscardAllChanges = () => {
    setDraftTheme(savedTheme);
    setDraftCompanionName(savedCompanionName);
    setDraftDesign(savedDesign);
    setDraftGeminiModel(aiStatus.activeModel);
    setDraftGeneralSettings(savedGeneralSettings);
    setDraftIslandDisplay(savedIslandDisplay);
    setGeminiKeyInput('');
    setPendingClearGeminiKey(false);
    setGeminiTestResult(null);
    setGeminiNotice(null);
  };

  // Reset all preferences back to factory defaults
  const handleResetEverything = async () => {
    const defaultGeneral = { ...DEFAULT_GENERAL_SETTINGS };
    const defaultDisplay = { ...DEFAULT_ISLAND_DISPLAY };
    setSavedTheme('mint');
    setDraftTheme('mint');
    setSavedCompanionName(DEFAULT_COMPANION_NAME);
    setDraftCompanionName(DEFAULT_COMPANION_NAME);
    setSavedDesign(DEFAULT_COMPANION_DESIGN);
    setDraftDesign(DEFAULT_COMPANION_DESIGN);
    setSavedGeneralSettings(defaultGeneral);
    setDraftGeneralSettings(defaultGeneral);
    setSavedIslandDisplay(defaultDisplay);
    setDraftIslandDisplay(defaultDisplay);
    setConfirmResetOpen(false);

    try {
      localStorage.setItem('eyeland_theme_key', 'mint');
      localStorage.setItem('eyeland_companion_name', DEFAULT_COMPANION_NAME);
      localStorage.setItem('eyeland_companion_design', DEFAULT_COMPANION_DESIGN);
      localStorage.setItem('eyeland_general_settings', JSON.stringify(defaultGeneral));
      localStorage.setItem('eyeland_island_display', JSON.stringify(defaultDisplay));
    } catch (_) {}

    if (window.electronAPI?.sendHubAction) {
      window.electronAPI.sendHubAction({
        type: 'APPLY_COMPANION_SETTINGS',
        themeKey: 'mint',
        companionName: DEFAULT_COMPANION_NAME,
        companionDesign: DEFAULT_COMPANION_DESIGN,
      });
    }
    if (window.electronAPI?.saveGeneralSettings) {
      await window.electronAPI.saveGeneralSettings(defaultGeneral);
    }
    if (window.electronAPI?.saveIslandDisplay) {
      await window.electronAPI.saveIslandDisplay(defaultDisplay);
    }

    setSaveAllToast(true);
    setTimeout(() => setSaveAllToast(false), 2600);
  };

  const handleTestGeminiConnection = async () => {
    if (isTestingGemini) return;
    setIsTestingGemini(true);
    setGeminiTestResult(null);
    try {
      const res = await window.electronAPI?.geminiTestConnection?.({
        customKey: pendingClearGeminiKey ? null : (geminiKeyInput.trim() || null),
        model: draftGeminiModel || aiStatus.activeModel,
      });
      setGeminiTestResult(res || { success: false, error: 'No response from Gemini engine.' });
    } catch (err) {
      setGeminiTestResult({ success: false, error: err.message || 'Connection test failed.' });
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleRegisterBetaTester = async (e) => {
    if (e) e.preventDefault();
    const email = betaEmailInput.trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      setBetaError('Please enter a valid email address.');
      return;
    }

    setBetaError('');
    setIsRegisteringBeta(true);
    try {
      if (window.electronAPI?.registerBetaTester) {
        const res = await window.electronAPI.registerBetaTester(email);
        if (res?.success && res.data) {
          setBetaTester(res.data);
          try { localStorage.setItem('eyeland_beta_tester', JSON.stringify(res.data)); } catch (_) {}
          setBetaEmailInput('');
          setIsEditingBetaEmail(false);
        } else {
          setBetaError(res?.error || 'Could not complete registration. Please try again.');
        }
      } else {
        const record = { email, registeredAt: Date.now(), appVersion: '1.0.0', tier: 'first-user-beta' };
        setBetaTester(record);
        try { localStorage.setItem('eyeland_beta_tester', JSON.stringify(record)); } catch (_) {}
        setBetaEmailInput('');
        setIsEditingBetaEmail(false);
      }
    } catch (err) {
      setBetaError(err.message || 'Could not complete registration.');
    } finally {
      setIsRegisteringBeta(false);
    }
  };

  const handlePetCompanion = () => {
    setCompanionExpression('rejoice');
    if (window.electronAPI?.sendHubAction) {
      window.electronAPI.sendHubAction({ type: 'PET_EYES' });
    }
    setTimeout(() => {
      setCompanionExpression('neutral');
    }, 1800);
  };

  const handleTriggerSnip = (toolName = 'explain') => {
    setSnipToast(true);
    setTimeout(() => setSnipToast(false), 2500);
    if (window.electronAPI?.startSnipping) {
      window.electronAPI.startSnipping(toolName);
    }
  };

  const handleToggleFocus = () => {
    const nextRunning = !focusState.isFocusRunning;
    const updated = { ...focusState, isFocusRunning: nextRunning };
    setFocusState(updated);
    try { localStorage.setItem('eyeland_focus_state', JSON.stringify(updated)); } catch (_) {}
    if (window.electronAPI?.sendHubAction) {
      window.electronAPI.sendHubAction({ type: nextRunning ? 'START_FOCUS' : 'STOP_FOCUS' });
    }
  };

  const handleCopyClip = (text, id) => {
    if (window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText(text);
    } else {
      navigator.clipboard?.writeText?.(text);
    }
    setCopiedActivityId(id);
    setTimeout(() => setCopiedActivityId(null), 2000);
  };

  const handleCopyTopClip = () => {
    if (clipboardItems.length > 0 && clipboardItems[0]?.text) {
      const text = clipboardItems[0].text;
      if (window.electronAPI?.writeClipboardText) {
        window.electronAPI.writeClipboardText(text);
      } else {
        navigator.clipboard?.writeText?.(text);
      }
      setCopiedClipToast(true);
      setTimeout(() => setCopiedClipToast(false), 2000);
    }
  };

  const handleClearActivity = () => {
    setActivityHistory([]);
    try { localStorage.removeItem('eyeland_activity_history'); } catch (_) {}
  };

  const currentTheme = HUB_THEMES[activeTheme] || HUB_THEMES.mint;

  const handleMinimize = () => {
    window.electronAPI?.minimizeDashboard?.();
  };

  const handleMaximize = () => {
    window.electronAPI?.maximizeDashboard?.();
    setIsMaximized(!isMaximized);
  };

  const handleClose = () => {
    window.electronAPI?.closeDashboard?.();
  };

  // Categorized Navigation Items (Structured with sleek vector SVG icons)
  const navGroups = [
    {
      group: 'EYELAND',
      items: [
        { id: 'home', label: 'Home', icon: <IconHome className="w-4 h-4 shrink-0" />, badge: null },
        { id: 'connections', label: 'Connections', icon: <IconConnections className="w-4 h-4 shrink-0" />, badge: !aiStatus.hasKey ? 'dot' : null },
        { id: 'ai_chat', label: 'AI & Chat', icon: <IconAiChat className="w-4 h-4 shrink-0" />, badge: 'soon' },
      ]
    },
    {
      group: 'COMPANION',
      items: [
        { id: 'companion', label: 'Eyeland Buddy', icon: <IconBuddy className="w-4 h-4 shrink-0" />, badge: null },
        { id: 'wardrobe', label: 'Wardrobe', icon: <IconWardrobe className="w-4 h-4 shrink-0" />, badge: null },
      ]
    },
    {
      group: 'SETTINGS',
      items: [
        { id: 'account', label: 'Account', icon: <IconAccount className="w-4 h-4 shrink-0" />, badge: null },
        { id: 'general', label: 'General', icon: <IconGeneral className="w-4 h-4 shrink-0" />, badge: null },
        { id: 'island', label: 'Island Display', icon: <IconIsland className="w-4 h-4 shrink-0" />, badge: null },
        { id: 'focus_guard', label: 'Focus Guard', icon: <IconFocusGuard className="w-4 h-4 shrink-0" />, badge: null },
        { id: 'news', label: 'News & Updates', icon: <IconNews className="w-4 h-4 shrink-0" />, badge: null },
        { id: 'support', label: 'Support Eyeland', icon: <IconSupport className="w-4 h-4 shrink-0" />, badge: null },
      ]
    }
  ];

  return (
    <div className="w-screen h-screen bg-[#07070a] text-neutral-100 flex flex-col font-sans select-none overflow-hidden rounded-2xl border border-white/[0.08] shadow-[0_25px_70px_rgba(0,0,0,0.85)]">
      
      {/* =====================================================================
          1. WINDOW TITLEBAR (DRAGGABLE REGION)
          ===================================================================== */}
      <div 
        className="h-11 bg-[#0b0c10]/95 backdrop-blur-xl border-b border-white/[0.06] flex items-center justify-between px-3.5 shrink-0"
        style={{ WebkitAppRegion: 'drag' }}
      >
        {/* Left Identity: Mini-eyes icon + Eyeland Hub + BETA */}
        <div className="flex items-center gap-2.5" style={{ WebkitAppRegion: 'no-drag' }}>
          <div className="w-6 h-6 rounded-lg bg-neutral-900 border border-white/15 flex items-center justify-center gap-1 shadow-inner">
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ backgroundColor: currentTheme.accent, boxShadow: `0 0 6px ${currentTheme.accent}` }}
            />
            <div
              className="w-1.5 h-1.5 rounded-full transition-colors duration-300"
              style={{ backgroundColor: currentTheme.accent, boxShadow: `0 0 6px ${currentTheme.accent}` }}
            />
          </div>
          <span className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
            <span>Eyeland Hub</span>
            <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-neutral-800/80 text-neutral-400 border border-white/10 uppercase font-semibold">
              BETA
            </span>
          </span>
          <span
            className="w-1.5 h-1.5 rounded-full animate-pulse ml-1 transition-colors duration-300"
            style={{ backgroundColor: currentTheme.accent }}
            title="Eyeland Bezel Connected"
          />
        </div>

        {/* Center Subtitle */}
        <div className="hidden sm:flex items-center gap-2 text-[11px] font-mono text-neutral-500">
          <span>Companion Overlay • Bezel Docked</span>
        </div>

        {/* Right Window Controls (Standard Windows Actions) */}
        <div className="flex items-center gap-1.5" style={{ WebkitAppRegion: 'no-drag' }}>
          {/* Auto-Update Check Pill */}
          <button
            type="button"
            onClick={updateState.status === 'ready' ? () => window.electronAPI?.restartAndInstallUpdate?.() : handleCheckForUpdates}
            disabled={updateState.status === 'checking' || updateState.status === 'downloading'}
            className={`px-2 py-1 rounded-lg border text-[10px] font-mono flex items-center gap-1.5 transition-all cursor-pointer mr-1.5 ${
              updateState.status === 'ready'
                ? 'bg-emerald-500/20 text-emerald-300 border-emerald-400/40 shadow-[0_0_10px_rgba(16,185,129,0.3)] animate-pulse'
                : updateState.status === 'downloading'
                ? 'bg-sky-500/20 text-sky-300 border-sky-400/40'
                : 'bg-white/[0.04] hover:bg-white/10 text-neutral-400 hover:text-white border-white/10'
            }`}
            title={updateState.status === 'ready' ? 'Click to Restart & Apply Update' : 'Check GitHub Releases for Updates'}
          >
            <span className={updateState.status === 'checking' ? 'animate-spin inline-block' : ''}>
              {updateState.status === 'ready' ? <IconSparkles className="w-3.5 h-3.5 text-emerald-300" /> : updateState.status === 'downloading' ? <IconDownload className="w-3.5 h-3.5 text-sky-300" /> : <IconRefresh className="w-3.5 h-3.5" />}
            </span>
            <span>
              {updateState.status === 'checking'
                ? 'Checking...'
                : updateState.status === 'downloading'
                ? `${updateState.percent || 0}%`
                : updateState.status === 'ready'
                ? `Install v${updateState.version || 'New'}`
                : updateState.status === 'dev-mode'
                ? 'Dev Mode'
                : updateState.status === 'up-to-date'
                ? 'Up to date'
                : 'v1.0.0'}
            </span>
          </button>

          {window.electronAPI?.simulateUpdateTest && (
            <button
              type="button"
              onClick={() => window.electronAPI.simulateUpdateTest('1.0.1')}
              title="Test update banner in collapsed Eyeland pill"
              className="px-2 py-1 rounded-lg border border-emerald-500/30 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 text-[10px] font-mono flex items-center gap-1 transition-all cursor-pointer mr-1.5"
            >
              <IconSparkles className="w-3 h-3 text-emerald-300" />
              <span>Simulate Update</span>
            </button>
          )}

          {/* Minimize */}
          <button
            type="button"
            onClick={handleMinimize}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Minimize"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="5" y1="12" x2="19" y2="12" />
            </svg>
          </button>

          {/* Maximize / Restore */}
          <button
            type="button"
            onClick={handleMaximize}
            className="w-7 h-7 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="7" y="7" width="13" height="13" rx="1" />
                <path d="M4 17V4h13" />
              </svg>
            ) : (
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="3" y="3" width="18" height="18" rx="2" />
              </svg>
            )}
          </button>

          {/* Close */}
          <button
            type="button"
            onClick={handleClose}
            className="w-7 h-7 rounded-lg hover:bg-rose-600 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer"
            title="Close Hub"
          >
            <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <line x1="18" y1="6" x2="6" y2="18" />
              <line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>
      </div>

      {/* =====================================================================
          2. HUB BODY (SIDEBAR + DYNAMIC CONTENT)
          ===================================================================== */}
      <div className="flex-1 min-h-0 flex overflow-hidden">
        
        {/* LEFT NAVIGATION SIDEBAR */}
        <aside className="w-56 bg-[#090a0f]/95 border-r border-white/[0.06] p-3 flex flex-col justify-between shrink-0 select-none overflow-y-auto" style={{ scrollbarWidth: 'none' }}>
          <div className="space-y-4">
            {navGroups.map((group) => (
              <div key={group.group} className="space-y-0.5">
                <div className="px-2.5 py-1">
                  <span className="text-[9.5px] font-mono text-neutral-500 uppercase tracking-wider font-bold">
                    {group.group}
                  </span>
                </div>

                {group.items.map((item) => {
                  const isActive = activeNav === item.id;
                  return (
                    <button
                      key={item.id}
                      type="button"
                      onClick={() => setActiveNav(item.id)}
                      className={`w-full px-2.5 py-1.5 rounded-xl text-left flex items-center justify-between transition-all cursor-pointer ${
                        isActive
                          ? 'bg-neutral-800/80 border border-white/10 text-white shadow-sm font-semibold'
                          : 'text-neutral-400 hover:text-neutral-200 hover:bg-white/[0.04] border border-transparent'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <span className="text-sm shrink-0">{item.icon}</span>
                        <span className="text-xs truncate">{item.label}</span>
                      </div>
                      {item.badge === 'dot' && (
                        <span className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)]" />
                      )}
                      {item.badge === 'soon' && (
                        <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/25 uppercase font-semibold shrink-0">
                          Soon
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Bottom Companion Status Capsule */}
          <div className="mt-3 p-2 rounded-xl bg-neutral-900/80 border border-white/10 flex items-center justify-between">
            <button
              type="button"
              onClick={() => setActiveNav('companion')}
              className="flex items-center gap-2 min-w-0 text-left cursor-pointer"
              title="Customize Eyeland Buddy"
            >
              <div
                className="w-6 h-6 rounded-lg border flex items-center justify-center shrink-0 transition-colors duration-300"
                style={{ backgroundColor: currentTheme.softBg, borderColor: currentTheme.border }}
              >
                <IconBuddy className="w-3.5 h-3.5 text-neutral-300" />
              </div>
              <div className="min-w-0">
                <div className="text-[10px] font-bold text-white truncate">{normalizedDraftName}</div>
                <div
                  className="text-[8.5px] font-mono truncate transition-colors duration-300"
                  style={{ color: currentTheme.accent }}
                >
                  {hasUnsavedChanges ? 'Unsaved draft' : 'Companion Active'}
                </div>
              </div>
            </button>
            <button 
              onClick={() => {
                const keys = Object.keys(HUB_THEMES);
                const idx = keys.indexOf(activeTheme);
                const nextKey = keys[(idx + 1) % keys.length];
                handleChangeTheme(nextKey);
              }}
              className="w-6 h-6 rounded-lg hover:bg-white/10 text-neutral-400 hover:text-white flex items-center justify-center text-xs transition-colors cursor-pointer"
              title="Preview Next Glow Theme"
            >
              <IconPalette className="w-3.5 h-3.5" />
            </button>
          </div>
        </aside>

        {/* MAIN DYNAMIC CONTENT CONTAINER */}
        <main
          className={`flex-1 min-h-0 bg-[#060709] p-6 overflow-y-auto relative ${hasUnsavedChanges ? 'pb-24' : ''}`}
          style={{ scrollbarWidth: 'thin' }}
        >
          {/* Global Save Confirmation Toast */}
          {saveAllToast && (
            <div className="fixed top-14 right-8 z-50 px-3.5 py-2 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-semibold shadow-2xl backdrop-blur-md flex items-center gap-2 animate-slideUp">
              <IconCheck className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
              <span>Changes saved &amp; synced to Eyeland!</span>
            </div>
          )}
          
          {/* =================================================================
              TAB: HOME (High-Tech Bespoke Eyeland Command Cockpit)
              ================================================================= */}
          {activeNav === 'home' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn relative">

              {/* Toast Feedback Pills */}
              {snipToast && (
                <div className="fixed top-14 right-8 z-50 px-3.5 py-1.5 rounded-xl bg-sky-500/20 border border-sky-400/40 text-sky-200 text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 animate-slideUp">
                  <IconSnipping className="w-4 h-4 text-sky-300" />
                  <span>Crosshair Snipping Mode Activated! Click and drag any screen area.</span>
                </div>
              )}
              {copiedClipToast && (
                <div className="fixed top-14 right-8 z-50 px-3.5 py-1.5 rounded-xl bg-emerald-500/20 border border-emerald-400/40 text-emerald-200 text-xs font-medium shadow-2xl backdrop-blur-md flex items-center gap-2 animate-slideUp">
                  <IconCheck className="w-4 h-4 text-emerald-300" />
                  <span>Latest item copied to Windows clipboard!</span>
                </div>
              )}

              {/* GitHub Auto-Update Status Banners */}
              {updateState.status === 'ready' && (
                <div className="p-4 rounded-3xl bg-gradient-to-r from-emerald-500/20 via-teal-500/15 to-emerald-500/20 border border-emerald-400/40 shadow-[0_0_30px_rgba(16,185,129,0.15)] backdrop-blur-xl flex items-center justify-between animate-slideUp">
                  <div className="flex items-center gap-3.5">
                    <div className="w-10 h-10 rounded-2xl bg-emerald-500/25 border border-emerald-400/50 flex items-center justify-center text-xl shadow-[0_0_15px_rgba(16,185,129,0.3)]">
                      <IconSparkles className="w-5 h-5 text-emerald-300" />
                    </div>
                    <div>
                      <div className="text-sm font-bold text-white flex items-center gap-2">
                        <span>Eyeland v{updateState.version || 'New'} is downloaded and ready!</span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-emerald-500/30 text-emerald-300 border border-emerald-400/30 font-semibold">
                          GitHub Release
                        </span>
                      </div>
                      <p className="text-xs text-neutral-300 mt-0.5">
                        New features and system enhancements have arrived. Restart now to install instantly.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => window.electronAPI?.restartAndInstallUpdate?.()}
                    className="px-4 py-2 rounded-xl bg-emerald-400 hover:bg-emerald-300 text-black text-xs font-bold transition-all shadow-[0_0_20px_rgba(52,211,153,0.4)] hover:scale-105 cursor-pointer shrink-0"
                  >
                    Restart & Install Now
                  </button>
                </div>
              )}

              {updateState.status === 'downloading' && (
                <div className="p-3.5 rounded-2xl bg-sky-500/10 border border-sky-400/30 backdrop-blur-xl flex items-center justify-between shadow-lg animate-fadeIn">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-sky-500/20 border border-sky-400/40 flex items-center justify-center text-sm animate-pulse">
                      <IconDownload className="w-4 h-4 text-sky-300" />
                    </div>
                    <div>
                      <div className="text-xs font-semibold text-white">Downloading Eyeland update: {updateState.percent || 0}%</div>
                      <div className="w-56 h-1.5 bg-neutral-800 rounded-full mt-1.5 overflow-hidden">
                        <div className="h-full bg-sky-400 transition-all duration-300" style={{ width: `${updateState.percent || 0}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className="text-[10px] font-mono text-sky-300">Differential Blockmap Sync</span>
                </div>
              )}
              
              {/* 1. TOP BESPOKE HERO COCKPIT WITH INTERACTIVE ISLAND PREVIEW */}
              <div 
                className="relative rounded-3xl overflow-hidden border border-white/[0.08] p-6 bg-gradient-to-b from-[#10121a]/95 to-[#0b0c12]/95 shadow-[0_20px_50px_rgba(0,0,0,0.6)] backdrop-blur-xl"
              >
                {/* Ambient dynamic radial glow matching companion theme */}
                <div 
                  className="absolute -top-12 left-1/2 -translate-x-1/2 w-96 h-40 rounded-full blur-3xl pointer-events-none transition-all duration-700 opacity-60"
                  style={{ background: currentTheme.glow }}
                />

                {/* Top Notch Preview & Quick Theme Palette Row */}
                <div className="flex items-center justify-between gap-3 flex-wrap relative z-10 mb-4">
                  {/* Status Pill */}
                  <div className="flex items-center gap-2">
                    <span
                      className="w-2 h-2 rounded-full animate-pulse transition-colors duration-300"
                      style={{
                        backgroundColor: currentTheme.accent,
                        boxShadow: `0 0 8px ${currentTheme.accent}`,
                      }}
                    />
                    <span className="text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">
                      {normalizedDraftName} • BEZEL ACTIVE
                    </span>
                  </div>

                  {/* Quick Glow Theme Palette Selector */}
                  <div className="flex items-center gap-1.5 bg-black/40 px-2 py-1 rounded-full border border-white/10 backdrop-blur-md">
                    <span className="text-[9px] font-mono text-neutral-400 pr-1 uppercase font-semibold">Glow:</span>
                    {Object.values(HUB_THEMES).map((th) => (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleChangeTheme(th.id)}
                        title={`Preview ${th.name}`}
                        className={`w-4 h-4 rounded-full transition-all cursor-pointer flex items-center justify-center ${
                          activeTheme === th.id
                            ? 'scale-115 ring-2 ring-white/70 shadow-md'
                            : 'opacity-65 hover:opacity-100 hover:scale-110'
                        }`}
                        style={{ backgroundColor: th.accent }}
                      />
                    ))}
                  </div>
                </div>

                {/* Centerpiece: Floating Interactive Dynamic Island Preview */}
                <div className="relative z-10 py-1 my-1">
                  <div 
                    className="mx-auto max-w-sm h-12 bg-black/90 border border-white/15 rounded-2xl flex items-center justify-between px-4 shadow-[0_12px_30px_rgba(0,0,0,0.8)] backdrop-blur-xl transition-all duration-300 hover:border-white/30"
                  >
                    {/* Left: Real Clock & Date */}
                    <span className="text-[10.5px] font-mono text-neutral-300 font-semibold tracking-tight">
                      {currentTime.timeStr.replace(' AM', '').replace(' PM', '')} • {currentTime.dateStr}
                    </span>
                    
                    {/* Center: Interactive Living Companion Eyes */}
                    <div 
                      onClick={handlePetCompanion}
                      title="Click to Pet Eyeland Companion!"
                      className="cursor-pointer transform hover:scale-125 active:scale-95 transition-all p-1"
                    >
                      <MinimalEyes 
                        size="md" 
                        expression={companionExpression} 
                        themeColor={currentTheme.color} 
                        themeShadow={currentTheme.shadow} 
                      />
                    </div>

                    {/* Right: Real Battery / System Power Status & Island Indicator */}
                    <div className="flex items-center gap-1.5 text-[10px] font-mono text-neutral-400">
                      <span>{systemInfo.battery?.percent != null ? systemInfo.battery.percent : 100}%</span>
                      {systemInfo.battery?.isCharging ? (
                        <IconBatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                      ) : (
                        <IconBattery className="w-3.5 h-3.5 text-neutral-400" />
                      )}
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 shadow-[0_0_6px_#34d399]" />
                    </div>
                  </div>
                </div>

                {/* Hero Greeting & Headline */}
                <div className="relative z-10 mt-4 flex flex-col sm:flex-row sm:items-end justify-between gap-3 pt-2 border-t border-white/[0.06]">
                  <div>
                    <h2 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
                      <span>{currentTime.greeting},</span>
                      <span style={{ color: currentTheme.accent }}>{userName}</span>
                      <IconWave className="w-5 h-5 text-neutral-400 inline-block ml-1" />
                    </h2>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Eyeland is watching your display. All background listeners and AI engines are nominal.
                    </p>
                  </div>

                  {/* Model Tag */}
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-semibold flex items-center gap-1">
                      <IconZap className="w-3 h-3 text-emerald-400" />
                      <span>{aiStatus.activeModel || 'gemini-2.5-flash'}</span>
                    </span>
                    <span className="text-[9.5px] font-mono px-2 py-0.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20 font-semibold flex items-center gap-1">
                      <IconIsland className="w-3 h-3 text-sky-400" />
                      <span>{systemInfo.system?.hostname || 'Primary Display'}</span>
                    </span>
                  </div>
                </div>
              </div>

              {/* 2. TODAY'S PRODUCTIVITY & AI PULSE (4 DYNAMIC METRIC CARDS) */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {/* Metric 1: AI Operations */}
                <div className="p-3.5 rounded-2xl bg-[#0f1016]/90 border border-white/[0.06] hover:border-sky-500/30 transition-all flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>AI OPERATIONS</span>
                    <span className="text-sky-400 flex items-center gap-1">
                      <IconSparkles className="w-3 h-3" />
                      <span>Multimodal</span>
                    </span>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl font-extrabold font-mono text-white">
                      {activityHistory.filter(a => a.type?.startsWith('ai_')).length}
                    </div>
                    <div className="text-[10.5px] text-neutral-400 truncate">
                      {activityHistory.filter(a => a.type?.startsWith('ai_')).length === 1 ? 'task executed today' : 'tasks executed today'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleTriggerSnip('explain')}
                    className="w-full py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 text-[9px] font-mono font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <span>+ Snip & Ask</span>
                  </button>
                </div>

                {/* Metric 2: Deep Work Focus */}
                <div className="p-3.5 rounded-2xl bg-[#0f1016]/90 border border-white/[0.06] hover:border-amber-500/30 transition-all flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>DEEP FOCUS</span>
                    <span className="text-amber-400 flex items-center gap-1">
                      <IconTarget className="w-3 h-3" />
                      <span>Work</span>
                    </span>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl font-extrabold font-mono text-white flex items-center gap-1.5">
                      <span>{(focusState.completedSessionsToday || 0) * 25}m</span>
                      {focusState.completedSessionsToday > 0 && (
                        <span className="text-xs text-amber-400 font-sans font-bold flex items-center gap-0.5">
                          <IconFlame className="w-3.5 h-3.5 text-amber-400" />
                          <span>{focusState.completedSessionsToday}</span>
                        </span>
                      )}
                    </div>
                    <div className="text-[10.5px] text-neutral-400 truncate">
                      {focusState.isFocusRunning ? (
                        <span className="text-amber-300 font-medium animate-pulse">
                          In Session ({Math.floor((focusState.focusSecondsLeft || 1500) / 60)}m left)
                        </span>
                      ) : focusState.completedSessionsToday > 0 ? (
                        `${focusState.completedSessionsToday} sprint${focusState.completedSessionsToday > 1 ? 's' : ''} completed today`
                      ) : (
                        'Ready for 25m sprint'
                      )}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleToggleFocus}
                    className={`w-full py-1 rounded-lg border text-[9px] font-mono font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 ${
                      focusState.isFocusRunning
                        ? 'bg-amber-500/20 hover:bg-amber-500/30 border-amber-500/40 text-amber-200'
                        : 'bg-neutral-800 hover:bg-neutral-750 border-neutral-700 text-neutral-300'
                    }`}
                  >
                    <span>{focusState.isFocusRunning ? 'Pause Focus' : 'Start 25m Focus'}</span>
                  </button>
                </div>

                {/* Metric 3: Staged Shelf Files */}
                <div className="p-3.5 rounded-2xl bg-[#0f1016]/90 border border-white/[0.06] hover:border-purple-500/30 transition-all flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>STAGING SHELF</span>
                    <span className="text-purple-400 flex items-center gap-1">
                      <IconFolder className="w-3 h-3" />
                      <span>Files</span>
                    </span>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl font-extrabold font-mono text-white">
                      {stagedFilesCount}
                    </div>
                    <div className="text-[10.5px] text-neutral-400 truncate">
                      {stagedFilesCount > 0 ? (stagedFilesCount === 1 ? '1 file ready on shelf' : `${stagedFilesCount} files ready on shelf`) : 'No files staged yet'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      if (window.electronAPI?.sendHubAction) {
                        window.electronAPI.sendHubAction({ type: 'NAVIGATE_TAB', tab: 'shelf' });
                      }
                    }}
                    className="w-full py-1 rounded-lg bg-purple-500/15 hover:bg-purple-500/25 border border-purple-500/30 text-purple-300 text-[9px] font-mono font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95"
                  >
                    <span>View on Island ›</span>
                  </button>
                </div>

                {/* Metric 4: Smart Clipboard */}
                <div className="p-3.5 rounded-2xl bg-[#0f1016]/90 border border-white/[0.06] hover:border-emerald-500/30 transition-all flex flex-col justify-between shadow-sm">
                  <div className="flex items-center justify-between text-[10px] font-mono text-neutral-400">
                    <span>SMART CLIPBOARD</span>
                    <span className="text-emerald-400 flex items-center gap-1">
                      <IconClipboard className="w-3 h-3" />
                      <span>Live Sync</span>
                    </span>
                  </div>
                  <div className="my-1.5">
                    <div className="text-2xl font-extrabold font-mono text-white">
                      {clipboardItems.length}/10
                    </div>
                    <div className="text-[10.5px] text-neutral-400 truncate">
                      {clipboardItems[0]?.text ? clipboardItems[0].text.slice(0, 18) + '...' : 'Listening for Ctrl+C'}
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={handleCopyTopClip}
                    disabled={clipboardItems.length === 0}
                    className="w-full py-1 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-emerald-300 text-[9px] font-mono font-semibold flex items-center justify-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50"
                  >
                    <span>Copy Top Clip</span>
                  </button>
                </div>
              </div>

              {/* 3. 1-CLICK QUICK ACTION LAUNCHERS */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <IconZap className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Quick Island Actions</span>
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">1-Click Desktop Automation</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-4 gap-2.5">
                  {/* Action 1: Snip Screen & Ask */}
                  <div
                    onClick={() => handleTriggerSnip('explain')}
                    className="p-3 rounded-2xl bg-[#101117] hover:bg-[#161822] border border-white/[0.06] hover:border-sky-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconSnipping className="w-4 h-4 text-sky-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-sky-500/15 text-sky-400 border border-sky-500/30">
                        CROSSHAIR
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-sky-300 transition-colors">
                        Snip Screen & Ask
                      </span>
                      <span className="text-[9.5px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                        Capture any screen area to explain, solve, or translate.
                      </span>
                    </div>
                  </div>

                  {/* Action 2: Start / Pause Focus */}
                  <div
                    onClick={handleToggleFocus}
                    className="p-3 rounded-2xl bg-[#101117] hover:bg-[#161822] border border-white/[0.06] hover:border-amber-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconClock className="w-4 h-4 text-amber-400 group-hover:scale-110 transition-transform" />
                      <span className={`text-[8.5px] font-mono px-1.5 py-0.5 rounded border ${
                        focusState.isFocusRunning 
                          ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 animate-pulse' 
                          : 'bg-neutral-800 text-neutral-400 border-neutral-700'
                      }`}>
                        {focusState.isFocusRunning ? 'ACTIVE' : '25 MIN'}
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-amber-300 transition-colors">
                        {focusState.isFocusRunning ? 'Pause Focus Session' : 'Start 25m Focus'}
                      </span>
                      <span className="text-[9.5px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                        Locks companion eyes into serious mode and counts down.
                      </span>
                    </div>
                  </div>

                  {/* Action 3: Quick Paste Top Clip */}
                  <div
                    onClick={handleCopyTopClip}
                    className="p-3 rounded-2xl bg-[#101117] hover:bg-[#161822] border border-white/[0.06] hover:border-emerald-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconClipboard className="w-4 h-4 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30">
                        CLIPBOARD
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-emerald-300 transition-colors">
                        Re-Copy Top Clip
                      </span>
                      <span className="text-[9.5px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                        Instant 1-click paste of your most recent clipboard snippet.
                      </span>
                    </div>
                  </div>

                  {/* Action 4: Conversational AI Chat */}
                  <div
                    onClick={() => setActiveNav('ai_chat')}
                    className="p-3 rounded-2xl bg-[#101117] hover:bg-[#161822] border border-white/[0.06] hover:border-purple-500/50 transition-all duration-200 hover:-translate-y-0.5 hover:shadow-lg cursor-pointer group flex flex-col justify-between"
                  >
                    <div className="flex items-center justify-between mb-1.5">
                      <IconAiChat className="w-4 h-4 text-purple-400 group-hover:scale-110 transition-transform" />
                      <span className="text-[8.5px] font-mono px-1.5 py-0.5 rounded bg-purple-500/15 text-purple-400 border border-purple-500/30">
                        CONVERSATION
                      </span>
                    </div>
                    <div>
                      <span className="text-xs font-bold text-white block group-hover:text-purple-300 transition-colors">
                        Open AI & Chat
                      </span>
                      <span className="text-[9.5px] text-neutral-400 leading-snug line-clamp-2 mt-0.5">
                        Deep conversation, code writing, and question answering.
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 4. REAL SYSTEM HARDWARE TELEMETRY COCKPIT */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                    <IconZap className="w-3.5 h-3.5 text-neutral-300" />
                    <span>System Hardware Telemetry</span>
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                    <span>Real-Time Daemon</span>
                  </span>
                </div>

                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                  {/* Gauge 1: CPU */}
                  <div className="p-3 rounded-2xl bg-[#101117] border border-white/[0.06] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span className="flex items-center gap-1 font-semibold text-neutral-300">
                        <IconCpu className="w-3.5 h-3.5 text-cyan-400" />
                        <span>CPU LOAD</span>
                      </span>
                      <span className="font-mono text-cyan-400 font-bold text-[10.5px]">
                        {systemInfo.cpu?.loadPercent || 14}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                        style={{ width: `${Math.max(6, Math.min(100, systemInfo.cpu?.loadPercent || 14))}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 truncate mt-0.5">
                      <span className="truncate max-w-[120px]" title={systemInfo.cpu?.model}>
                        {systemInfo.cpu?.model?.split('with')[0]?.replace('AMD', '')?.replace('Intel', '')?.trim() || 'Detecting CPU'}
                      </span>
                      <span className="text-neutral-500">{systemInfo.cpu?.cores ? `${systemInfo.cpu.cores}T` : 'CPU'}</span>
                    </div>
                  </div>

                  {/* Gauge 2: Memory */}
                  <div className="p-3 rounded-2xl bg-[#101117] border border-white/[0.06] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span className="flex items-center gap-1 font-semibold text-neutral-300">
                        <IconRam className="w-3.5 h-3.5 text-purple-400" />
                        <span>MEMORY</span>
                      </span>
                      <span className="font-mono text-purple-400 font-bold text-[10.5px]">
                        {systemInfo.memory?.percent || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, systemInfo.memory?.percent || 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 mt-0.5">
                      <span>{systemInfo.memory?.usedGb || '0.0'} GB</span>
                      <span className="text-neutral-500">/ {systemInfo.memory?.totalGb || '0.0'} GB</span>
                    </div>
                  </div>

                  {/* Gauge 3: WLAN Link */}
                  <div className="p-3 rounded-2xl bg-[#101117] border border-white/[0.06] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span className="flex items-center gap-1 font-semibold text-neutral-300 truncate">
                        <IconWifi className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                        <span className="truncate max-w-[85px]" title={systemInfo.wifi?.ssid}>{systemInfo.wifi?.ssid || 'Disconnected'}</span>
                      </span>
                      <span className="font-mono text-sky-400 font-bold text-[10.5px]">
                        {systemInfo.wifi?.signal || 0}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
                        style={{ width: `${Math.min(100, systemInfo.wifi?.signal || 0)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 truncate mt-0.5">
                      <span className="truncate">{systemInfo.wifi?.speed || '0 Mbps'}</span>
                      <span className="text-neutral-500">{systemInfo.wifi?.radioType?.split(' ')[0] || 'Wi-Fi'}</span>
                    </div>
                  </div>

                  {/* Gauge 4: Power Matrix */}
                  <div className="p-3 rounded-2xl bg-[#101117] border border-white/[0.06] flex flex-col justify-between">
                    <div className="flex items-center justify-between text-[9px] mb-1">
                      <span className="flex items-center gap-1 font-semibold text-neutral-300">
                        {systemInfo.battery?.isCharging ? (
                          <IconBatteryCharging className="w-3.5 h-3.5 text-emerald-400" />
                        ) : (
                          <IconBattery className="w-3.5 h-3.5 text-emerald-400" />
                        )}
                        <span>POWER</span>
                      </span>
                      <span className="font-mono text-emerald-400 font-bold text-[10.5px]">
                        {systemInfo.battery?.percent != null ? systemInfo.battery.percent : 100}%
                      </span>
                    </div>
                    <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                      <div
                        className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                        style={{ width: `${Math.min(100, systemInfo.battery?.percent != null ? systemInfo.battery.percent : 100)}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 mt-0.5">
                      <span>{systemInfo.battery?.isCharging ? 'AC Powered' : 'Battery'}</span>
                      <span className="text-neutral-500">{systemInfo.battery?.percent >= 90 ? 'Optimum' : 'Normal'}</span>
                    </div>
                  </div>
                </div>
              </div>

              {/* 5. UNIFIED RECENT ACTIVITY & TIMELINE */}
              <div className="space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-neutral-300 uppercase tracking-wider flex items-center gap-1.5">
                      <IconClock className="w-3.5 h-3.5 text-neutral-400" />
                      <span>Recent Activity & AI Operations</span>
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      ({activityHistory.length} items logged)
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Search activity..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="px-2.5 py-1 text-xs rounded-xl bg-neutral-900 border border-white/10 text-white placeholder-neutral-500 outline-none focus:border-sky-500/50 w-44 transition-all"
                    />
                    {activityHistory.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearActivity}
                        className="px-2.5 py-1 text-[10px] font-mono rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-neutral-400 hover:text-white transition-all cursor-pointer"
                        title="Clear history"
                      >
                        Clear
                      </button>
                    )}
                  </div>
                </div>

                {/* Activity List */}
                <div className="space-y-2">
                  {activityHistory
                    .filter((act) => {
                      if (!searchQuery.trim()) return true;
                      const q = searchQuery.toLowerCase();
                      return (
                        act.title?.toLowerCase().includes(q) ||
                        act.preview?.toLowerCase().includes(q) ||
                        act.tool?.toLowerCase().includes(q)
                      );
                    })
                    .slice(0, 10)
                    .map((item) => {
                      const isCopied = copiedActivityId === item.id;
                      const badgeConfig = {
                        explain: { label: 'EXPLAIN', bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
                        polish: { label: 'POLISH', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
                        translate: { label: 'TRANSLATE', bg: 'bg-cyan-500/15 text-cyan-400 border-cyan-500/30' },
                        summarize: { label: 'SUMMARY', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
                        code: { label: 'FIX CODE', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
                        snip: { label: 'VISION', bg: 'bg-rose-500/15 text-rose-400 border-rose-500/30' },
                        clipboard: { label: 'CLIPBOARD', bg: 'bg-neutral-800 text-neutral-300 border-neutral-700' },
                      }[item.tool] || { label: 'AI TASK', bg: 'bg-neutral-800 text-neutral-300 border-neutral-700' };

                      return (
                        <div
                          key={item.id}
                          className="p-3 rounded-2xl bg-[#0e0f14]/90 border border-white/[0.06] hover:border-white/15 transition-all duration-200 flex items-start justify-between gap-3 group"
                        >
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${badgeConfig.bg}`}>
                                {badgeConfig.label}
                              </span>
                              <span className="text-xs font-bold text-white tracking-tight">
                                {item.title}
                              </span>
                              <span className="text-[9.5px] font-mono text-neutral-500">
                                • {formatRelativeTime(item.timestamp)}
                              </span>
                            </div>
                            <p className="text-xs text-neutral-300 leading-relaxed line-clamp-2">
                              {item.preview || item.fullText}
                            </p>
                          </div>

                          <div className="flex items-center gap-1.5 shrink-0 pt-0.5">
                            <button
                              type="button"
                              onClick={() => handleCopyClip(item.fullText || item.preview, item.id)}
                              className={`px-2.5 py-1 rounded-xl text-[10px] font-mono transition-all cursor-pointer active:scale-95 border flex items-center gap-1 ${
                                isCopied
                                  ? 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40 font-bold'
                                  : 'bg-neutral-800 hover:bg-neutral-750 text-neutral-300 hover:text-white border-neutral-700/60'
                              }`}
                            >
                              {isCopied ? <><IconCheck className="w-3 h-3 text-emerald-400" /> Copied</> : 'Copy'}
                            </button>
                          </div>
                        </div>
                      );
                    })}

                  {activityHistory.length === 0 && (
                    <div className="p-8 rounded-2xl bg-neutral-900/40 border border-white/[0.06] text-center flex flex-col items-center justify-center">
                      <IconZap className="w-8 h-8 mb-2 text-neutral-600" />
                      <h4 className="text-xs font-bold text-neutral-300">No Activity Recorded Yet</h4>
                      <p className="text-[11px] text-neutral-500 max-w-sm mt-0.5">
                        Trigger screen snips, copy clipboard items, or execute AI tools to populate this stream.
                      </p>
                      <button
                        type="button"
                        onClick={() => handleTriggerSnip('explain')}
                        className="mt-3 px-3 py-1.5 rounded-xl bg-sky-500/20 hover:bg-sky-500/30 border border-sky-500/40 text-sky-300 text-xs font-semibold cursor-pointer transition-all active:scale-95"
                      >
                        Try Snip Screen Now
                      </button>
                    </div>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* =================================================================
              TAB: CONNECTIONS (Google Gemini Core Brain Engine)
              ================================================================= */}
          {activeNav === 'connections' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">

              {/* Tab Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <IconConnections className="w-5 h-5 text-neutral-300" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Connections</h2>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold uppercase ${
                        aiStatus.hasKey
                          ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/30'
                          : 'bg-rose-500/15 text-rose-300 border-rose-400/30'
                      }`}
                    >
                      {aiStatus.hasKey ? '1 Active Engine' : 'Setup Required'}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Configure your active AI provider, bring your own Google AI Studio key, test live latency, and choose your preferred Gemini model.
                  </p>
                </div>
              </div>

              {/* GOOGLE GEMINI (CORE BRAIN) CARD */}
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl p-6 space-y-6">
                {/* Ambient glow */}
                <div
                  className="absolute -top-16 right-10 w-80 h-36 rounded-full blur-3xl pointer-events-none opacity-45"
                  style={{ background: currentTheme.glow }}
                />

                {/* Card Header: Identity, Status Tier & Test Connection Ping */}
                <div className="relative z-10 flex flex-wrap items-center justify-between gap-4 pb-5 border-b border-white/[0.07]">
                  <div className="flex items-center gap-3.5">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-sky-500/20 via-indigo-500/20 to-emerald-500/20 border border-white/15 flex items-center justify-center shadow-inner">
                      <svg className="w-6 h-6 text-sky-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 2C12.8 7.1 16.9 11.2 22 12C16.9 12.8 12.8 16.9 12 22C11.2 16.9 7.1 12.8 2 12C7.1 11.2 11.2 7.1 12 2Z" />
                      </svg>
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-base font-bold text-white tracking-tight">Google Gemini</h3>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-md bg-white/[0.06] text-neutral-300 border border-white/10 uppercase">
                          Core Brain
                        </span>
                        <span
                          className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold flex items-center gap-1.5 ${
                            aiStatus.tier === 'custom'
                              ? 'bg-emerald-500/15 text-emerald-300 border-emerald-400/35'
                              : aiStatus.tier === 'bundled'
                              ? 'bg-sky-500/15 text-sky-300 border-sky-400/35'
                              : 'bg-rose-500/15 text-rose-300 border-rose-400/35'
                          }`}
                        >
                          <span
                            className={`w-1.5 h-1.5 rounded-full ${
                              aiStatus.tier === 'custom'
                                ? 'bg-emerald-400 shadow-[0_0_6px_#34d399]'
                                : aiStatus.tier === 'bundled'
                                ? 'bg-sky-400 shadow-[0_0_6px_#38bdf8]'
                                : 'bg-rose-400'
                            }`}
                          />
                          {aiStatus.tier === 'custom'
                            ? 'Personal API Key'
                            : aiStatus.tier === 'bundled'
                            ? 'Bundled Key Active'
                            : 'No Key Configured'}
                        </span>
                      </div>
                      <div className="flex items-center gap-2 mt-1 text-[11px] text-neutral-400 font-mono flex-wrap">
                        <span>Model: <strong className="text-neutral-200">{aiStatus.activeModel}</strong></span>
                        {aiStatus.maskedKey && (
                          <>
                            <span className="text-neutral-600">•</span>
                            <span>Key: <code className="text-neutral-300">{aiStatus.maskedKey}</code></span>
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Live Test Connection Button */}
                  <button
                    type="button"
                    onClick={handleTestGeminiConnection}
                    disabled={isTestingGemini}
                    className={`px-3.5 py-2 rounded-xl border text-xs font-semibold flex items-center gap-2 transition-all cursor-pointer shrink-0 ${
                      isTestingGemini
                        ? 'bg-sky-500/15 border-sky-400/30 text-sky-300 cursor-wait'
                        : 'bg-white/[0.06] hover:bg-white/[0.12] border-white/15 text-white hover:border-white/25'
                    }`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 ${isTestingGemini ? 'animate-spin text-sky-400' : 'text-emerald-400'}`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      {isTestingGemini ? (
                        <path d="M21 12a9 9 0 1 1-6.219-8.56" />
                      ) : (
                        <polyline points="22 12 18 12 15 21 9 3 6 12 2 12" />
                      )}
                    </svg>
                    <span>{isTestingGemini ? 'Pinging Gemini...' : 'Test Connection'}</span>
                  </button>
                </div>

                {/* Live Test Connection Result Banner */}
                {geminiTestResult && (
                  <div
                    className={`relative z-10 p-3.5 rounded-2xl border flex items-center justify-between gap-3 animate-fadeIn ${
                      geminiTestResult.success
                        ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-200'
                        : 'bg-rose-500/10 border-rose-400/30 text-rose-200'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 min-w-0">
                      <span className="shrink-0">
                        {geminiTestResult.success ? (
                          <IconCheck className="w-4 h-4 text-emerald-400" />
                        ) : (
                          <IconX className="w-4 h-4 text-rose-400" />
                        )}
                      </span>
                      <div className="text-xs min-w-0">
                        {geminiTestResult.success ? (
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-semibold text-white">Connection verified!</span>
                            <span className="text-emerald-300/90 font-mono text-[11px]">
                              {geminiTestResult.modelUsed}
                            </span>
                            {geminiTestResult.usedFallback && (
                              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-400/30">
                                Fallback used
                              </span>
                            )}
                          </div>
                        ) : (
                          <div>
                            <span className="font-semibold text-white">Connection failed: </span>
                            <span className="text-rose-200/90">{geminiTestResult.error}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    {typeof geminiTestResult.latencyMs === 'number' && (
                      <span
                        className={`text-[11px] font-mono px-2.5 py-1 rounded-lg border shrink-0 font-semibold ${
                          geminiTestResult.success
                            ? 'bg-emerald-500/15 border-emerald-400/30 text-emerald-300'
                            : 'bg-rose-500/15 border-rose-400/30 text-rose-300'
                        }`}
                      >
                        {geminiTestResult.latencyMs} ms
                      </span>
                    )}
                  </div>
                )}

                {/* Inline Notice Feedback */}
                {geminiNotice && (
                  <div
                    className={`relative z-10 px-3.5 py-2.5 rounded-xl border text-xs font-medium flex items-center gap-2 animate-fadeIn ${
                      geminiNotice.type === 'success'
                        ? 'bg-emerald-500/10 border-emerald-400/30 text-emerald-300'
                        : 'bg-rose-500/10 border-rose-400/30 text-rose-300'
                    }`}
                  >
                    <span className="shrink-0">
                      {geminiNotice.type === 'success' ? (
                        <IconCheck className="w-4 h-4 text-emerald-400" />
                      ) : (
                        <span className="text-amber-400 font-bold">!</span>
                      )}
                    </span>
                    <span>{geminiNotice.text}</span>
                  </div>
                )}

                {/* SECTION 1: API KEY (BYOK) MANAGEMENT */}
                <div className="relative z-10 space-y-3">
                  <div className="flex items-center justify-between gap-2 flex-wrap">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        API Key (Bring Your Own Key)
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        {aiStatus.tier === 'custom'
                          ? 'Using your personal Google AI Studio key stored locally on this device.'
                          : aiStatus.tier === 'bundled'
                          ? 'Currently using Eyeland’s bundled key. Paste your own key below for dedicated personal quota.'
                          : 'Paste a Google AI Studio key below to enable Gemini Vision, Snip & Ask, and AI Chat.'}
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => window.electronAPI?.openExternalUrl?.('https://aistudio.google.com/apikey')}
                      className="text-[11px] text-sky-400 hover:text-sky-300 font-medium flex items-center gap-1 transition-colors cursor-pointer"
                    >
                      <span>Get API Key at AI Studio</span>
                      <span>↗</span>
                    </button>
                  </div>

                  <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={showGeminiKey ? 'text' : 'password'}
                        value={geminiKeyInput}
                        onChange={(e) => {
                          setGeminiKeyInput(e.target.value);
                          if (e.target.value.trim()) setPendingClearGeminiKey(false);
                        }}
                        placeholder={
                          pendingClearGeminiKey
                            ? 'Marked to revert to Bundled key — click Save Changes below'
                            : aiStatus.tier === 'custom'
                            ? `Active personal key (${aiStatus.maskedKey}) — paste new key to replace`
                            : 'AIzaSy...'
                        }
                        className="w-full bg-black/50 border border-white/10 focus:border-sky-400/50 rounded-xl pl-3.5 pr-10 py-2.5 text-xs text-white font-mono placeholder-neutral-500 outline-none transition-colors"
                      />
                      <button
                        type="button"
                        onClick={() => setShowGeminiKey((v) => !v)}
                        title={showGeminiKey ? 'Hide key' : 'Show key'}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-white p-1 cursor-pointer flex items-center justify-center"
                      >
                        {showGeminiKey ? <IconEyeOff className="w-4 h-4" /> : <IconEye className="w-4 h-4" />}
                      </button>
                    </div>

                    {aiStatus.tier === 'custom' && (
                      <button
                        type="button"
                        onClick={handleStageClearGeminiKey}
                        className={`px-3.5 py-2.5 rounded-xl border text-xs font-semibold transition-colors cursor-pointer shrink-0 ${
                          pendingClearGeminiKey
                            ? 'bg-amber-500/20 border-amber-400/40 text-amber-300'
                            : 'bg-rose-500/10 hover:bg-rose-500/20 border-rose-400/30 text-rose-300'
                        }`}
                        title={aiStatus.hasBundledKey ? 'Remove custom key and switch back to Bundled key' : 'Remove saved API key'}
                      >
                        {pendingClearGeminiKey
                          ? 'Undo Clear'
                          : aiStatus.hasBundledKey
                          ? 'Use Bundled'
                          : 'Clear Key'}
                      </button>
                    )}
                  </div>
                </div>

                {/* SECTION 2: PREFERRED DEFAULT MODEL SELECTOR */}
                <div className="relative z-10 space-y-3 pt-4 border-t border-white/[0.07]">
                  <div className="flex items-center justify-between">
                    <div>
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider font-mono">
                        Preferred Default Model
                      </h4>
                      <p className="text-[11px] text-neutral-400 mt-0.5">
                        Tried first for every Island chat, screen snip, and AI tool—with automatic fallback if unavailable.
                      </p>
                    </div>
                    {isModelDirty && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                        Unsaved
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                    {(aiStatus.availableModels || []).map((m) => {
                      const isSelected = draftGeminiModel === m.id;
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => handleSelectGeminiModel(m.id)}
                          className={`p-3.5 rounded-2xl text-left border transition-all cursor-pointer flex flex-col justify-between gap-1.5 ${
                            isSelected
                              ? 'bg-white/[0.07]'
                              : 'bg-black/30 border-white/[0.07] hover:bg-white/[0.04] hover:border-white/15'
                          }`}
                          style={isSelected ? {
                            borderColor: currentTheme.border,
                            boxShadow: `0 0 20px ${currentTheme.glow}`,
                          } : undefined}
                        >
                          <div className="flex items-center justify-between gap-2 w-full">
                            <div className="flex items-center gap-2 min-w-0">
                              <span
                                className="w-2 h-2 rounded-full shrink-0 transition-colors"
                                style={{
                                  backgroundColor: isSelected ? currentTheme.accent : '#525252',
                                  boxShadow: isSelected ? `0 0 8px ${currentTheme.accent}` : 'none',
                                }}
                              />
                              <span className="text-xs font-bold text-white truncate">{m.name}</span>
                            </div>
                            <span
                              className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border shrink-0"
                              style={isSelected ? {
                                backgroundColor: currentTheme.softBg,
                                color: currentTheme.accent,
                                borderColor: currentTheme.border,
                              } : {
                                backgroundColor: 'rgba(255,255,255,0.05)',
                                color: '#a3a3a3',
                                borderColor: 'rgba(255,255,255,0.1)',
                              }}
                            >
                              {m.badge}
                            </span>
                          </div>
                          <div className="text-[10px] font-mono text-neutral-500 pl-4">{m.id}</div>
                          <p className="text-[11px] text-neutral-400 leading-relaxed pl-4">{m.description}</p>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* =================================================================
              TAB: AI & CHAT (Coming Soon)
              ================================================================= */}
          {activeNav === 'ai_chat' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">
              {/* Tab Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <IconAiChat className="w-6 h-6 text-neutral-300" />
                    <h2 className="text-xl font-bold text-white tracking-tight">AI &amp; Chat</h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold uppercase">
                      Coming Soon
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Full-window conversational studio, thread history, and multimodal workspace for Eyeland Hub.
                  </p>
                </div>
              </div>

              {/* Coming Soon Hero Card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.08] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl p-10 text-center flex flex-col items-center justify-center space-y-4">
                <div
                  className="absolute -top-14 left-1/2 -translate-x-1/2 w-80 h-36 rounded-full blur-3xl pointer-events-none opacity-45"
                  style={{ background: currentTheme.glow }}
                />

                <div className="relative z-10 w-14 h-14 rounded-2xl bg-amber-500/15 border border-amber-400/30 flex items-center justify-center shadow-[0_0_25px_rgba(251,191,36,0.15)]">
                  <IconSparkles className="w-7 h-7 text-amber-300" />
                </div>

                <div className="relative z-10 space-y-1.5 max-w-md">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-500/10 border border-amber-400/25 text-amber-300 text-[10px] font-mono uppercase font-semibold">
                    In Development
                  </div>
                  <h3 className="text-lg font-bold text-white tracking-tight">
                    AI &amp; Chat Studio is Coming Soon
                  </h3>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    We&apos;re crafting a full desktop AI chat workspace with saved threads, snip context, and prompt presets. In the meantime, you can chat and use Screen Snip AI directly from your top bezel Island!
                  </p>
                </div>

                <div className="relative z-10 flex items-center gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setActiveNav('connections')}
                    className="px-4 py-2 rounded-xl bg-white/[0.07] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-white transition-colors cursor-pointer flex items-center gap-1.5"
                  >
                    <IconConnections className="w-3.5 h-3.5 text-neutral-300" />
                    <span>Configure Gemini Engine</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveNav('home')}
                    className="px-4 py-2 rounded-xl bg-neutral-900 hover:bg-neutral-800 border border-white/10 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
                  >
                    ← Back to Home
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* =================================================================
              TAB: EYELAND BUDDY (Companion Core, Name & Color Themes)
              ================================================================= */}
          {activeNav === 'companion' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">

              {/* Tab Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <IconBuddy className="w-6 h-6 text-neutral-300" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Eyeland Buddy</h2>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold uppercase"
                      style={{
                        backgroundColor: currentTheme.softBg,
                        color: currentTheme.accent,
                        borderColor: currentTheme.border,
                      }}
                    >
                      {currentTheme.name}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Personalize your companion&apos;s identity, name, and luminous color theme across the entire Island and Hub.
                  </p>
                </div>
              </div>

              {/* CONTAINER 1: CURRENT SELECTED EYELAND FACE / ROUND NEURAL CORE PREVIEW */}
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl p-6">
                {/* Dynamic ambient radial glow */}
                <div
                  className="absolute -top-14 left-1/2 -translate-x-1/2 w-96 h-44 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-55"
                  style={{ background: currentTheme.glow }}
                />

                <div className="relative z-10 flex flex-col md:flex-row items-center gap-7">
                  {/* Faithful Bio-Quantum Round Reactor Showcase Card (Matches Expanded Island Home Tab) */}
                  <div className="w-52 h-56 shrink-0 flex flex-col items-center justify-between py-3 px-3 bg-gradient-to-b from-[#121217] to-[#09090c] rounded-3xl border border-neutral-800/90 relative overflow-hidden shadow-[0_18px_40px_rgba(0,0,0,0.7)]">
                    {/* Ambient core aura */}
                    <div
                      className="absolute inset-0 pointer-events-none opacity-25 transition-all duration-500"
                      style={{ background: `radial-gradient(circle at center, ${currentTheme.accent} 0%, transparent 72%)` }}
                    />

                    {/* Top Header Tag (Dynamic Companion Name) */}
                    <div className="flex items-center gap-1.5 z-10 max-w-[180px] px-2">
                      <span
                        className="w-2 h-2 rounded-full animate-pulse shrink-0 transition-colors duration-300"
                        style={{
                          backgroundColor: currentTheme.accent,
                          boxShadow: `0 0 8px ${currentTheme.accent}`,
                        }}
                      />
                      <span className="text-[10px] font-mono tracking-widest text-neutral-300 uppercase truncate font-semibold">
                        {normalizedDraftName}
                      </span>
                    </div>

                    {/* Interactive Selected Companion Core Design with Living Eyes */}
                    <div className="my-auto">
                      <CompanionCoreAvatar
                        design={draftDesign}
                        theme={currentTheme}
                        expression={companionExpression}
                        size="lg"
                        onClick={handlePetCompanion}
                        title={`Click to pet ${normalizedDraftName}`}
                      />
                    </div>

                    {/* Bottom Status Line */}
                    <div className="flex flex-col items-center gap-1 z-10">
                      <button
                        type="button"
                        onClick={handlePetCompanion}
                        className="px-3 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-[10px] text-neutral-300 hover:text-white flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <IconSupport className="w-3 h-3 text-rose-400 shrink-0" />
                        <span className="font-medium">Pet {normalizedDraftName}</span>
                      </button>
                      <span
                        className="text-[8.5px] font-mono opacity-90 transition-colors duration-300"
                        style={{ color: currentTheme.accent }}
                      >
                        SYNC 100% • 60 FPS
                      </span>
                    </div>
                  </div>

                  {/* Right Side: Active Core Info & Live Expression Preview Controls */}
                  <div className="flex-1 space-y-4 w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          Active Companion Design
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-neutral-300">
                          {currentDesign.name}
                        </span>
                        <button
                          type="button"
                          onClick={() => setActiveNav('wardrobe')}
                          className="text-[10px] font-mono text-neutral-400 hover:text-white underline cursor-pointer transition-colors"
                        >
                          Change in Wardrobe →
                        </button>
                      </div>
                      <h3 className="text-lg font-bold text-white tracking-tight">
                        {normalizedDraftName} <span className="text-neutral-500 font-normal">•</span>{' '}
                        <span style={{ color: currentTheme.accent }}>{currentTheme.name}</span>
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {currentTheme.tagline}. Click the orb or test expressions below to preview how your companion reacts before saving.
                      </p>
                    </div>

                    {/* Expression Preview Pills */}
                    <div className="space-y-2">
                      <div className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider font-semibold">
                        Preview Expression
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {[
                          { id: 'neutral', label: 'Neutral', icon: <IconSmile className="w-3.5 h-3.5" /> },
                          { id: 'rejoice', label: 'Happy', icon: <IconHeartSmile className="w-3.5 h-3.5" /> },
                          { id: 'focused', label: 'Focused', icon: <IconTarget className="w-3.5 h-3.5" /> },
                          { id: 'sleeping', label: 'Sleepy', icon: <IconSleep className="w-3.5 h-3.5" /> },
                        ].map((exp) => {
                          const isExpActive = companionExpression === exp.id;
                          return (
                            <button
                              key={exp.id}
                              type="button"
                              onClick={() => setCompanionExpression(exp.id)}
                              className={`px-3 py-1.5 rounded-xl text-xs font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                                isExpActive
                                  ? 'text-white'
                                  : 'bg-black/35 border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                              }`}
                              style={isExpActive ? {
                                backgroundColor: currentTheme.softBg,
                                borderColor: currentTheme.border,
                                color: currentTheme.accent,
                              } : undefined}
                            >
                              <span>{exp.icon}</span>
                              <span>{exp.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Live Preview Note */}
                    {hasUnsavedChanges && (isThemeDirty || isNameDirty) && (
                      <div className="px-3 py-2 rounded-xl bg-amber-500/10 border border-amber-400/25 text-[11px] text-amber-200 flex items-center gap-2">
                        <span>●</span>
                        <span>Previewing unsaved changes — click <strong>Save Changes</strong> below to apply to your Island.</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* CONTAINER 2: EYELAND NAME */}
              <div className="rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_14px_35px_rgba(0,0,0,0.45)] p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">Eyeland Name</h3>
                      {isNameDirty && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Choose a custom name for your AI companion. This replaces the default <code className="text-neutral-300 font-mono">Bio-Core</code> label in the expanded Island Home tab and across Eyeland Hub.
                    </p>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 shrink-0">
                    {draftCompanionName.length}/24
                  </span>
                </div>

                <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                  <div className="relative flex-1">
                    <input
                      type="text"
                      maxLength={24}
                      value={draftCompanionName}
                      onChange={(e) => setDraftCompanionName(e.target.value)}
                      placeholder={DEFAULT_COMPANION_NAME}
                      className="w-full bg-black/50 border border-white/10 focus:border-white/30 rounded-xl px-4 py-2.5 text-sm text-white font-semibold placeholder-neutral-500 outline-none transition-colors"
                    />
                  </div>
                  {draftCompanionName !== DEFAULT_COMPANION_NAME && (
                    <button
                      type="button"
                      onClick={() => setDraftCompanionName(DEFAULT_COMPANION_NAME)}
                      className="px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs text-neutral-300 hover:text-white font-medium transition-colors cursor-pointer shrink-0"
                    >
                      Reset to Bio-Core
                    </button>
                  )}
                </div>

                {/* Quick Name Preset Chips */}
                <div className="flex items-center gap-2 flex-wrap pt-1">
                  <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Presets:</span>
                  {COMPANION_NAME_PRESETS.map((preset) => {
                    const isPresetActive = normalizedDraftName.toLowerCase() === preset.toLowerCase();
                    return (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setDraftCompanionName(preset)}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium border transition-all cursor-pointer ${
                          isPresetActive
                            ? 'text-white'
                            : 'bg-black/30 border-white/[0.07] text-neutral-400 hover:text-white hover:bg-white/[0.06]'
                        }`}
                        style={isPresetActive ? {
                          backgroundColor: currentTheme.softBg,
                          borderColor: currentTheme.border,
                          color: currentTheme.accent,
                        } : undefined}
                      >
                        {preset}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONTAINER 3: COLOR THEMES */}
              <div className="rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_14px_35px_rgba(0,0,0,0.45)] p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">Color Themes</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/10">
                        {Object.keys(HUB_THEMES).length} Palettes
                      </span>
                      {isThemeDirty && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Customize the accent glow across Eyeland&apos;s eyes, orbital reactor rings, expanded Island dock buttons, and Hub accents.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-2 gap-3">
                  {Object.values(HUB_THEMES).map((th) => {
                    const isSelected = draftTheme === th.id;
                    return (
                      <button
                        key={th.id}
                        type="button"
                        onClick={() => handleChangeTheme(th.id)}
                        className={`group p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex items-center justify-between gap-3 ${
                          isSelected
                            ? 'bg-white/[0.07]'
                            : 'bg-black/35 border-white/[0.07] hover:bg-white/[0.04] hover:border-white/15'
                        }`}
                        style={isSelected ? {
                          borderColor: th.border,
                          boxShadow: `0 0 24px ${th.glow}`,
                        } : undefined}
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          {/* Mini Glowing Dual-Eye Theme Orb Swatch */}
                          <div
                            className="w-11 h-11 rounded-2xl bg-[#0b0c11] border flex items-center justify-center gap-1.5 shrink-0 relative overflow-hidden"
                            style={{ borderColor: isSelected ? th.border : 'rgba(255,255,255,0.1)' }}
                          >
                            <div
                              className="absolute inset-0 opacity-25 pointer-events-none"
                              style={{ background: `radial-gradient(circle, ${th.accent} 0%, transparent 72%)` }}
                            />
                            <span
                              className="w-2 h-2.5 rounded-full relative z-10"
                              style={{ backgroundColor: th.color, boxShadow: `0 0 8px ${th.accent}` }}
                            />
                            <span
                              className="w-2 h-2.5 rounded-full relative z-10"
                              style={{ backgroundColor: th.color, boxShadow: `0 0 8px ${th.accent}` }}
                            />
                          </div>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold text-white truncate">{th.name}</span>
                              {savedTheme === th.id && (
                                <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.07] text-neutral-300 border border-white/10 uppercase">
                                  Active
                                </span>
                              )}
                            </div>
                            <p className="text-[11px] text-neutral-400 truncate mt-0.5">{th.tagline}</p>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 shrink-0">
                          <span
                            className="w-3.5 h-3.5 rounded-full border border-white/20"
                            style={{ backgroundColor: th.accent, boxShadow: isSelected ? `0 0 10px ${th.accent}` : 'none' }}
                          />
                          {isSelected && (
                            <span
                              className="w-5 h-5 rounded-full flex items-center justify-center text-black"
                              style={{ backgroundColor: th.accent }}
                            >
                              <IconCheck className="w-3 h-3 text-black stroke-[2.5]" />
                            </span>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =================================================================
              TAB: WARDROBE (AI Companion Core Designs Gallery)
              ================================================================= */}
          {activeNav === 'wardrobe' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">

              {/* Tab Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <IconWardrobe className="w-6 h-6 text-neutral-300" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Wardrobe</h2>
                    <span
                      className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold uppercase"
                      style={{
                        backgroundColor: currentTheme.softBg,
                        color: currentTheme.accent,
                        borderColor: currentTheme.border,
                      }}
                    >
                      {currentDesign.name}
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Switch your companion&apos;s silhouette and neural frame. Every design dynamically adapts to your chosen color theme and expressions.
                  </p>
                </div>
              </div>

              {/* CONTAINER 1: COMPACT LIVE FACE PREVIEW (Smaller sleeker version of Eyeland Buddy preview) */}
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_18px_45px_rgba(0,0,0,0.55)] backdrop-blur-xl p-5">
                <div
                  className="absolute -top-12 left-1/2 -translate-x-1/2 w-80 h-32 rounded-full blur-3xl pointer-events-none transition-all duration-500 opacity-50"
                  style={{ background: currentTheme.glow }}
                />

                <div className="relative z-10 flex flex-col sm:flex-row items-center gap-6">
                  {/* Compact Showcase Pod */}
                  <div className="w-40 h-44 shrink-0 flex flex-col items-center justify-between py-2.5 px-2.5 bg-gradient-to-b from-[#121217] to-[#09090c] rounded-2xl border border-neutral-800/90 relative overflow-hidden shadow-[0_14px_34px_rgba(0,0,0,0.68)]">
                    <div
                      className="absolute inset-0 pointer-events-none opacity-25 transition-all duration-500"
                      style={{ background: `radial-gradient(circle at center, ${currentTheme.accent} 0%, transparent 72%)` }}
                    />

                    {/* Top Name Tag */}
                    <div className="flex items-center gap-1.5 z-10 max-w-[140px] px-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                        style={{
                          backgroundColor: currentTheme.accent,
                          boxShadow: `0 0 8px ${currentTheme.accent}`,
                        }}
                      />
                      <span className="text-[9px] font-mono tracking-widest text-neutral-300 uppercase truncate font-semibold">
                        {normalizedDraftName}
                      </span>
                    </div>

                    {/* Live Selected Design Core */}
                    <div className="my-auto">
                      <CompanionCoreAvatar
                        design={draftDesign}
                        theme={currentTheme}
                        expression={companionExpression}
                        size="md"
                        onClick={handlePetCompanion}
                        title={`Click to pet ${normalizedDraftName}`}
                      />
                    </div>

                    {/* Status Footer */}
                    <span
                      className="text-[8px] font-mono opacity-90 z-10"
                      style={{ color: currentTheme.accent }}
                    >
                      {currentDesign.name.toUpperCase()}
                    </span>
                  </div>

                  {/* Right Side Details & Quick Expression Tester */}
                  <div className="flex-1 space-y-3 w-full">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400">
                          Equipped Design
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] border border-white/10 text-neutral-300">
                          {currentDesign.badge}
                        </span>
                        {isDesignDirty && (
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                            Unsaved Preview
                          </span>
                        )}
                      </div>
                      <h3 className="text-base font-bold text-white tracking-tight">
                        {currentDesign.name}{' '}
                        <span className="text-neutral-500 font-normal">•</span>{' '}
                        <span style={{ color: currentTheme.accent }}>{currentTheme.name}</span>
                      </h3>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        {currentDesign.tagline}. Click the avatar to pet or test moods below.
                      </p>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5">
                      {[
                        { id: 'neutral', label: 'Neutral', icon: <IconSmile className="w-3.5 h-3.5" /> },
                        { id: 'rejoice', label: 'Happy', icon: <IconHeartSmile className="w-3.5 h-3.5" /> },
                        { id: 'focused', label: 'Focused', icon: <IconTarget className="w-3.5 h-3.5" /> },
                        { id: 'sleeping', label: 'Sleepy', icon: <IconSleep className="w-3.5 h-3.5" /> },
                      ].map((exp) => {
                        const isExpActive = companionExpression === exp.id;
                        return (
                          <button
                            key={exp.id}
                            type="button"
                            onClick={() => setCompanionExpression(exp.id)}
                            className={`px-2.5 py-1 rounded-xl text-[11px] font-medium border flex items-center gap-1.5 transition-all cursor-pointer ${
                              isExpActive
                                ? 'text-white'
                                : 'bg-black/35 border-white/[0.08] text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                            style={isExpActive ? {
                              backgroundColor: currentTheme.softBg,
                              borderColor: currentTheme.border,
                              color: currentTheme.accent,
                            } : undefined}
                          >
                            <span>{exp.icon}</span>
                            <span>{exp.label}</span>
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {/* CONTAINER 2: AI CORE DESIGNS COLLECTION (7 Selectable Designs) */}
              <div className="rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_14px_35px_rgba(0,0,0,0.45)] p-6 space-y-4">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-bold text-white tracking-tight">Companion Designs</h3>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-white/[0.06] text-neutral-300 border border-white/10">
                        {COMPANION_DESIGNS.length} Styles
                      </span>
                    </div>
                    <p className="text-xs text-neutral-400 mt-0.5">
                      Pick a shell for {normalizedDraftName}. Press <strong>Save Changes</strong> in the bottom bar to equip it on your Island.
                    </p>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
                  {COMPANION_DESIGNS.map((designItem) => {
                    const isSelected = draftDesign === designItem.id;
                    const isSavedActive = savedDesign === designItem.id;
                    return (
                      <button
                        key={designItem.id}
                        type="button"
                        onClick={() => setDraftDesign(designItem.id)}
                        className={`group p-4 rounded-2xl border text-left transition-all cursor-pointer flex flex-col items-center gap-3 relative overflow-hidden ${
                          isSelected
                            ? 'bg-white/[0.07]'
                            : 'bg-black/35 border-white/[0.07] hover:bg-white/[0.04] hover:border-white/15'
                        }`}
                        style={isSelected ? {
                          borderColor: currentTheme.border,
                          boxShadow: `0 0 24px ${currentTheme.glow}`,
                        } : undefined}
                      >
                        {/* Top Badges Row */}
                        <div className="w-full flex items-center justify-between gap-2">
                          <span className="text-[9.5px] font-mono px-2 py-0.5 rounded bg-white/[0.05] text-neutral-400 border border-white/10 uppercase">
                            {designItem.badge}
                          </span>
                          <div className="flex items-center gap-1.5">
                            {isSavedActive && (
                              <span className="text-[9px] font-mono px-1.5 py-0.5 rounded bg-white/[0.08] text-neutral-300 border border-white/10 uppercase">
                                Active
                              </span>
                            )}
                            {isSelected && (
                              <span
                                className="w-4 h-4 rounded-full flex items-center justify-center text-black"
                                style={{ backgroundColor: currentTheme.accent }}
                              >
                                <IconCheck className="w-2.5 h-2.5 text-black stroke-[2.5]" />
                              </span>
                            )}
                          </div>
                        </div>

                        {/* Live Mini Avatar Preview */}
                        <div className="py-1">
                          <CompanionCoreAvatar
                            design={designItem.id}
                            theme={currentTheme}
                            expression={isSelected ? companionExpression : 'neutral'}
                            size="xs"
                            interactive={false}
                          />
                        </div>

                        {/* Design Info */}
                        <div className="w-full text-center space-y-0.5">
                          <div className="text-xs font-bold text-white">{designItem.name}</div>
                          <p className="text-[10.5px] text-neutral-400 leading-snug line-clamp-2">
                            {designItem.tagline}
                          </p>
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>

            </div>
          )}

          {/* =================================================================
              TAB: ACCOUNT (Founding Beta Tester / First User Registration)
              ================================================================= */}
          {activeNav === 'account' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">

              {/* Tab Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <IconAccount className="w-6 h-6 text-neutral-300" />
                    <h2 className="text-xl font-bold text-white tracking-tight">Account</h2>
                    {betaTester?.email && (
                      <span
                        className="text-[10px] font-mono px-2.5 py-0.5 rounded-full border font-semibold uppercase flex items-center gap-1"
                        style={{
                          backgroundColor: currentTheme.softBg,
                          color: currentTheme.accent,
                          borderColor: currentTheme.border,
                        }}
                      >
                        <IconSparkles className="w-3 h-3" />
                        <span>First User • Beta Tester</span>
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    Join Eyeland&apos;s early beta program to be recognized as one of our first users.
                  </p>
                </div>
              </div>

              {/* Beta Tester Registration Card */}
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_20px_50px_rgba(0,0,0,0.55)] backdrop-blur-xl p-6 space-y-5">
                <div
                  className="absolute -top-16 right-12 w-72 h-36 rounded-full blur-3xl pointer-events-none opacity-45"
                  style={{ background: currentTheme.glow }}
                />

                {betaTester?.email && !isEditingBetaEmail ? (
                  <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="w-12 h-12 rounded-2xl border flex items-center justify-center shrink-0"
                        style={{
                          backgroundColor: currentTheme.softBg,
                          borderColor: currentTheme.border,
                          boxShadow: `0 0 22px ${currentTheme.glow}`,
                        }}
                      >
                        <IconSparkles className="w-6 h-6" style={{ color: currentTheme.accent }} />
                      </div>
                      <div className="min-w-0 space-y-1">
                        <div className="flex items-center gap-2 flex-wrap">
                          <h3 className="text-sm font-bold text-white tracking-tight">
                            Registered as Beta Tester
                          </h3>
                          <span
                            className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold uppercase"
                            style={{
                              backgroundColor: currentTheme.softBg,
                              color: currentTheme.accent,
                              borderColor: currentTheme.border,
                            }}
                          >
                            First User
                          </span>
                        </div>
                        <p className="text-xs text-neutral-300 font-mono truncate">{betaTester.email}</p>
                        {betaTester.registeredAt && (
                          <p className="text-[11px] text-neutral-500">
                            Marked as an early Eyeland beta tester on{' '}
                            {new Date(betaTester.registeredAt).toLocaleDateString([], {
                              year: 'numeric',
                              month: 'short',
                              day: 'numeric',
                            })}
                          </p>
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setBetaEmailInput(betaTester.email || '');
                        setBetaError('');
                        setIsEditingBetaEmail(true);
                      }}
                      className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
                    >
                      Change email
                    </button>
                  </div>
                ) : (
                  <form onSubmit={handleRegisterBetaTester} className="relative z-10 space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-base font-bold text-white tracking-tight">
                        Become a First User
                      </h3>
                      <p className="text-xs text-neutral-400">
                        Enter your email below to register yourself as an Eyeland beta tester.
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5">
                      <input
                        type="email"
                        value={betaEmailInput}
                        onChange={(e) => {
                          setBetaEmailInput(e.target.value);
                          if (betaError) setBetaError('');
                        }}
                        placeholder="you@example.com"
                        className="flex-1 bg-black/50 border border-white/10 focus:border-white/30 rounded-xl px-4 py-2.5 text-sm text-white placeholder-neutral-500 outline-none transition-colors"
                      />

                      <button
                        type="submit"
                        disabled={isRegisteringBeta || !betaEmailInput.trim()}
                        className="px-5 py-2.5 rounded-xl text-xs font-bold transition-all cursor-pointer shrink-0 disabled:opacity-45 disabled:cursor-not-allowed hover:brightness-110 active:scale-95 text-black"
                        style={{
                          backgroundColor: currentTheme.accent,
                          boxShadow: `0 0 22px ${currentTheme.glow}`,
                        }}
                      >
                        {isRegisteringBeta ? 'Registering...' : 'Register yourself as beta tester'}
                      </button>

                      {isEditingBetaEmail && (
                        <button
                          type="button"
                          onClick={() => {
                            setIsEditingBetaEmail(false);
                            setBetaError('');
                          }}
                          className="px-3.5 py-2.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-neutral-300 hover:text-white transition-colors cursor-pointer shrink-0"
                        >
                          Cancel
                        </button>
                      )}
                    </div>

                    {betaError && (
                      <div className="text-xs text-rose-300 bg-rose-500/10 border border-rose-400/30 rounded-xl px-3.5 py-2">
                        {betaError}
                      </div>
                    )}
                  </form>
                )}
              </div>

            </div>
          )}

          {/* =================================================================
              TAB: GENERAL (Language, Speed, Performance & Fullscreen Game Mode)
              ================================================================= */}
          {activeNav === 'general' && (
            <div className="space-y-6 max-w-4xl animate-fadeIn">

              {/* Tab Header */}
              <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                <div>
                  <div className="flex items-center gap-2.5">
                    <IconGeneral className="w-6 h-6 text-neutral-300" />
                    <h2 className="text-xl font-bold text-white tracking-tight">{t.generalTitle}</h2>
                    {isGeneralDirty && (
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold uppercase">
                        Unsaved
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">{t.generalSubtitle}</p>
                </div>
              </div>

              {/* CONTAINER 1: LANGUAGE */}
              <div className="relative rounded-3xl overflow-hidden border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl p-6 space-y-4">
                <div
                  className="absolute -top-16 right-12 w-72 h-32 rounded-full blur-3xl pointer-events-none opacity-40"
                  style={{ background: currentTheme.glow }}
                />

                <div className="relative z-10 flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-500 font-bold">
                        {t.languageHeading}
                      </span>
                      {isLanguageDirty && (
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm font-bold text-white tracking-tight mt-0.5">
                      Language • {SUPPORTED_LANGUAGES.find((l) => l.id === draftGeneralSettings.language)?.native || 'English'}
                    </h3>
                    <p className="text-xs text-neutral-400 mt-0.5">{t.languageDesc}</p>
                  </div>
                </div>

                <div className="relative z-10 flex flex-wrap items-center gap-2 pt-1">
                  {SUPPORTED_LANGUAGES.map((lang) => {
                    const isSelected = draftGeneralSettings.language === lang.id;
                    return (
                      <button
                        key={lang.id}
                        type="button"
                        onClick={() =>
                          setDraftGeneralSettings((prev) => ({ ...prev, language: lang.id }))
                        }
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          isSelected
                            ? 'shadow-md'
                            : 'bg-black/35 border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.06] hover:border-white/15'
                        }`}
                        style={
                          isSelected
                            ? {
                                backgroundColor: currentTheme.softBg,
                                borderColor: currentTheme.border,
                                color: currentTheme.accent,
                                boxShadow: `0 0 18px ${currentTheme.glow}`,
                              }
                            : undefined
                        }
                      >
                        {lang.native}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* CONTAINER 2: BEHAVIOUR (Speed, Performance, Game Mode) */}
              <div className="rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    {t.behaviourHeading}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Island Engine Controls
                  </span>
                </div>

                {/* ROW 1: SPEED */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">{t.speedLabel}</h4>
                      {isSpeedDirty && (
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">{t.speedDesc}</p>
                  </div>

                  <div className="flex items-center gap-1.5 bg-black/45 p-1 rounded-2xl border border-white/[0.08] shrink-0 self-start sm:self-center">
                    {[
                      { id: 'fast', label: t.fast },
                      { id: 'normal', label: t.normal },
                    ].map((opt) => {
                      const isSelected = draftGeneralSettings.speed === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setDraftGeneralSettings((prev) => ({ ...prev, speed: opt.id }))
                          }
                          className={`px-4 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                            isSelected
                              ? ''
                              : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: currentTheme.softBg,
                                  borderColor: currentTheme.border,
                                  color: currentTheme.accent,
                                }
                              : undefined
                          }
                        >
                          {opt.label}
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ROW 2: PERFORMANCE */}
                <div className="flex flex-col gap-3.5 pb-5 border-b border-white/[0.06]">
                  <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                    <div className="space-y-0.5 max-w-lg">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white tracking-tight">{t.perfLabel}</h4>
                        {isPerformanceDirty && (
                          <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                            Unsaved
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-400 leading-relaxed">{t.perfDesc}</p>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {[
                      { id: 'automatic', label: t.automatic, sub: 'Adaptive' },
                      { id: 'light', label: t.light, sub: 'Low CPU' },
                      { id: 'smooth', label: t.smooth, sub: '60 Hz' },
                      { id: 'max', label: t.max, sub: '120/144 Hz' },
                    ].map((opt) => {
                      const isSelected = draftGeneralSettings.performance === opt.id;
                      return (
                        <button
                          key={opt.id}
                          type="button"
                          onClick={() =>
                            setDraftGeneralSettings((prev) => ({ ...prev, performance: opt.id }))
                          }
                          className={`p-3 rounded-2xl border text-left transition-all cursor-pointer flex flex-col gap-0.5 ${
                            isSelected
                              ? 'bg-white/[0.06]'
                              : 'bg-black/35 border-white/[0.08] hover:bg-white/[0.04] hover:border-white/15'
                          }`}
                          style={
                            isSelected
                              ? {
                                  backgroundColor: currentTheme.softBg,
                                  borderColor: currentTheme.border,
                                  boxShadow: `0 0 18px ${currentTheme.glow}`,
                                }
                              : undefined
                          }
                        >
                          <span
                            className="text-xs font-bold"
                            style={{ color: isSelected ? currentTheme.accent : '#ffffff' }}
                          >
                            {opt.label}
                          </span>
                          <span className="text-[10px] font-mono text-neutral-400">{opt.sub}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {/* ROW 3: GAME MODE */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">{t.gameModeLabel}</h4>
                      {draftGeneralSettings.gameMode && (
                        <span
                          className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold"
                          style={{
                            backgroundColor: currentTheme.softBg,
                            color: currentTheme.accent,
                            borderColor: currentTheme.border,
                          }}
                        >
                          Armed
                        </span>
                      )}
                      {isGameModeDirty && (
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">{t.gameModeDesc}</p>
                  </div>

                  {/* Interactive Switch */}
                  <button
                    type="button"
                    role="switch"
                    aria-checked={draftGeneralSettings.gameMode}
                    onClick={() =>
                      setDraftGeneralSettings((prev) => ({ ...prev, gameMode: !prev.gameMode }))
                    }
                    className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                      draftGeneralSettings.gameMode ? 'justify-end' : 'justify-start bg-neutral-800/90 border-white/15'
                    }`}
                    style={
                      draftGeneralSettings.gameMode
                        ? {
                            backgroundColor: currentTheme.softBg,
                            borderColor: currentTheme.border,
                            boxShadow: `0 0 14px ${currentTheme.glow}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-5 h-5 rounded-full shadow-md transition-all"
                      style={{
                        backgroundColor: draftGeneralSettings.gameMode ? currentTheme.accent : '#a3a3a3',
                      }}
                    />
                  </button>
                </div>
              </div>

              {/* CONTAINER 3: SYSTEM & APP (Startup, Anonymous Stats, Restart, Quit, Reset) */}
              <div className="rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl p-6 space-y-5">
                <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                    {t.systemHeading}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    Windows &amp; Lifecycle
                  </span>
                </div>

                {/* ROW 1: START WITH WINDOWS */}
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">{t.startWithWinLabel}</h4>
                      {isStartWithWindowsDirty && (
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400">{t.startWithWinDesc}</p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(draftGeneralSettings.startWithWindows)}
                    onClick={() =>
                      setDraftGeneralSettings((prev) => ({
                        ...prev,
                        startWithWindows: !prev.startWithWindows,
                      }))
                    }
                    className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                      draftGeneralSettings.startWithWindows
                        ? 'justify-end'
                        : 'justify-start bg-neutral-800/90 border-white/15'
                    }`}
                    style={
                      draftGeneralSettings.startWithWindows
                        ? {
                            backgroundColor: currentTheme.softBg,
                            borderColor: currentTheme.border,
                            boxShadow: `0 0 14px ${currentTheme.glow}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-5 h-5 rounded-full shadow-md transition-all"
                      style={{
                        backgroundColor: draftGeneralSettings.startWithWindows
                          ? currentTheme.accent
                          : '#a3a3a3',
                      }}
                    />
                  </button>
                </div>

                {/* ROW 2: ANONYMOUS STATISTICS */}
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="space-y-0.5">
                    <div className="flex items-center gap-2">
                      <h4 className="text-sm font-bold text-white tracking-tight">{t.anonStatsLabel}</h4>
                      {isAnonStatsDirty && (
                        <span className="text-[9.5px] font-mono px-1.5 py-0.5 rounded bg-amber-500/15 text-amber-300 border border-amber-400/30">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 leading-relaxed">{t.anonStatsDesc}</p>
                  </div>

                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(draftGeneralSettings.anonymousStats)}
                    onClick={() =>
                      setDraftGeneralSettings((prev) => ({
                        ...prev,
                        anonymousStats: !prev.anonymousStats,
                      }))
                    }
                    className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                      draftGeneralSettings.anonymousStats
                        ? 'justify-end'
                        : 'justify-start bg-neutral-800/90 border-white/15'
                    }`}
                    style={
                      draftGeneralSettings.anonymousStats
                        ? {
                            backgroundColor: currentTheme.softBg,
                            borderColor: currentTheme.border,
                            boxShadow: `0 0 14px ${currentTheme.glow}`,
                          }
                        : undefined
                    }
                  >
                    <span
                      className="w-5 h-5 rounded-full shadow-md transition-all"
                      style={{
                        backgroundColor: draftGeneralSettings.anonymousStats
                          ? currentTheme.accent
                          : '#a3a3a3',
                      }}
                    />
                  </button>
                </div>

                {/* ROW 3: RESTART */}
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white tracking-tight">{t.restart}</h4>
                    <p className="text-xs text-neutral-400">{t.restartDesc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.electronAPI?.restartApp?.()}
                    className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-white/[0.12] border border-white/15 text-xs font-semibold text-white transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    {t.restart}
                  </button>
                </div>

                {/* ROW 4: QUIT */}
                <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white tracking-tight">{t.quitLabel}</h4>
                    <p className="text-xs text-neutral-400">{t.quitDesc}</p>
                  </div>

                  <button
                    type="button"
                    onClick={() => window.electronAPI?.exitApp?.()}
                    className="px-4 py-2 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 border border-rose-400/30 text-xs font-semibold text-rose-300 hover:text-rose-200 transition-all active:scale-95 cursor-pointer shrink-0"
                  >
                    {t.quitLabel}
                  </button>
                </div>

                {/* ROW 5: RESET EVERYTHING */}
                <div className="flex items-center justify-between gap-4">
                  <div className="space-y-0.5">
                    <h4 className="text-sm font-bold text-white tracking-tight">{t.resetLabel}</h4>
                    <p className="text-xs text-neutral-400">{t.resetDesc}</p>
                  </div>

                  {confirmResetOpen ? (
                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        type="button"
                        onClick={() => setConfirmResetOpen(false)}
                        className="px-3 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-medium text-neutral-300 transition-colors cursor-pointer"
                      >
                        {t.cancel}
                      </button>
                      <button
                        type="button"
                        onClick={handleResetEverything}
                        className="px-3.5 py-2 rounded-xl bg-rose-500 hover:bg-rose-400 text-black text-xs font-bold transition-all active:scale-95 cursor-pointer shadow-[0_0_16px_rgba(244,63,94,0.35)]"
                      >
                        {t.confirmReset}
                      </button>
                    </div>
                  ) : (
                    <button
                      type="button"
                      onClick={() => setConfirmResetOpen(true)}
                      className="px-4 py-2 rounded-xl bg-white/[0.06] hover:bg-rose-500/15 border border-white/15 hover:border-rose-400/35 text-xs font-semibold text-neutral-200 hover:text-rose-200 transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      {t.resetBtn}
                    </button>
                  )}
                </div>
              </div>

            </div>
          )}

          {/* =================================================================
              TAB: ISLAND DISPLAY (Collapsed Look, Glass Material, Screen & On-The-Island)
              ================================================================= */}
          {activeNav === 'island' && (() => {
            const previewAlpha = Math.max(0.15, 1 - (Number(draftIslandDisplay.seeThrough) || 0) / 100);
            const glassObj = GLASS_COLOR_OPTIONS.find((g) => g.id === draftIslandDisplay.glassColor);
            const [pr, pg, pb] =
              draftIslandDisplay.material === 'glass' && draftIslandDisplay.glassColor !== 'auto' && glassObj?.rgb
                ? glassObj.rgb
                : hexToRgbTuple(currentTheme.accent);

            const previewWidth =
              draftIslandDisplay.size === 'compact'
                ? '190px'
                : draftIslandDisplay.size === 'large'
                ? '276px'
                : '232px';
            const previewHeight =
              draftIslandDisplay.size === 'compact'
                ? '30px'
                : draftIslandDisplay.size === 'large'
                ? '40px'
                : '34px';
            const isPreviewAttached = draftIslandDisplay.style === 'attached';

            const previewPillStyle = {
              width: previewWidth,
              height: previewHeight,
              borderRadius: isPreviewAttached ? '0 0 18px 18px' : '22px',
              marginTop: isPreviewAttached ? '0px' : '12px',
              borderTopWidth: isPreviewAttached ? '0px' : '1px',
              ...(draftIslandDisplay.material === 'glass'
                ? {
                    backgroundColor: `rgba(${Math.round(pr * 0.28)}, ${Math.round(pg * 0.28)}, ${Math.round(pb * 0.28)}, ${Math.min(0.84, previewAlpha * 0.72).toFixed(2)})`,
                    backdropFilter: 'blur(20px) saturate(180%)',
                    borderColor: `rgba(${pr}, ${pg}, ${pb}, 0.5)`,
                    boxShadow: `0 12px 30px rgba(0,0,0,0.6), 0 0 22px rgba(${pr}, ${pg}, ${pb}, 0.35), inset 0 1px 0 rgba(255,255,255,0.22)`,
                  }
                : {
                    backgroundColor: `rgba(0, 0, 0, ${previewAlpha.toFixed(2)})`,
                    backdropFilter: draftIslandDisplay.seeThrough > 0 ? 'blur(12px)' : undefined,
                    borderColor: 'rgba(255, 255, 255, 0.14)',
                    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.75)',
                  }),
            };

            return (
              <div className="space-y-6 max-w-4xl animate-fadeIn">

                {/* Tab Header */}
                <div className="flex items-start justify-between gap-4 border-b border-white/[0.08] pb-4">
                  <div>
                    <div className="flex items-center gap-2.5">
                      <IconIsland className="w-6 h-6 text-neutral-300" />
                      <h2 className="text-xl font-bold text-white tracking-tight">Island Display</h2>
                      <span
                        className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold uppercase"
                        style={{
                          backgroundColor: currentTheme.softBg,
                          color: currentTheme.accent,
                          borderColor: currentTheme.border,
                        }}
                      >
                        {draftIslandDisplay.material === 'glass' ? 'Colour Glass' : 'Obsidian Black'}
                      </span>
                      {isIslandDisplayDirty && (
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-amber-500/15 text-amber-300 border border-amber-400/30 font-semibold uppercase">
                          Unsaved
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-neutral-400 mt-1">
                      Customize the collapsed island&apos;s size, notch attachment, frosted glass material, display monitor, and live overlays.
                    </p>
                  </div>
                </div>

                {/* LIVE COLLAPSED ISLAND PREVIEW STAGE */}
                <div className="relative rounded-3xl overflow-hidden border border-white/[0.09] shadow-[0_18px_45px_rgba(0,0,0,0.55)] h-28 flex flex-col items-center justify-start bg-[#0a0c14]">
                  {/* Subtle vibrant desktop wallpaper gradient behind the pill so See-through & Colour Glass are immediately visible */}
                  <div
                    className="absolute inset-0 opacity-70 pointer-events-none"
                    style={{
                      background:
                        'radial-gradient(circle at 22% 35%, rgba(56,189,248,0.38), transparent 48%), radial-gradient(circle at 78% 40%, rgba(168,85,247,0.38), transparent 48%), radial-gradient(circle at 50% 80%, rgba(52,211,153,0.28), transparent 55%)',
                    }}
                  />
                  {/* Subtle wallpaper grid lines to clearly visualize translucency */}
                  <div
                    className="absolute inset-0 opacity-20 pointer-events-none"
                    style={{
                      backgroundImage:
                        'linear-gradient(to right, rgba(255,255,255,0.12) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.12) 1px, transparent 1px)',
                      backgroundSize: '24px 24px',
                    }}
                  />

                  {/* Simulated Collapsed Island Pill */}
                  <div
                    className="relative z-10 border flex items-center justify-between px-4 transition-all duration-300"
                    style={previewPillStyle}
                  >
                    <span className="text-[9.5px] font-mono text-white/75 font-semibold">
                      {currentTime.timeStr.replace(' AM', '').replace(' PM', '')}
                    </span>
                    <div className="flex items-center gap-1.5">
                      <MinimalEyes
                        expression="neutral"
                        themeColor={currentTheme.color}
                        themeShadow={currentTheme.shadow}
                        size="sm"
                      />
                    </div>
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: currentTheme.accent }} />
                  </div>

                  {/* Caption Bar */}
                  <div className="mt-auto mb-2.5 relative z-10 flex items-center gap-2 text-[10px] font-mono text-white/70 bg-black/45 px-3 py-0.5 rounded-full border border-white/10 backdrop-blur-md">
                    <span>Collapsed Preview</span>
                    <span className="text-white/30">•</span>
                    <span>{draftIslandDisplay.size}</span>
                    <span className="text-white/30">•</span>
                    <span>{draftIslandDisplay.style}</span>
                    <span className="text-white/30">•</span>
                    <span>{draftIslandDisplay.seeThrough}% see-through</span>
                  </div>
                </div>

                {/* CONTAINER 1: LOOK */}
                <div className="rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      LOOK
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Collapsed Island Appearance
                    </span>
                  </div>

                  {/* 1. SIZE */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight">Size</h4>
                      <p className="text-xs text-neutral-400">How big the collapsed island is</p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/45 p-1 rounded-2xl border border-white/[0.08] shrink-0 self-start sm:self-center">
                      {[
                        { id: 'compact', label: 'Compact' },
                        { id: 'normal', label: 'Normal' },
                        { id: 'large', label: 'Large' },
                      ].map((opt) => {
                        const isSelected = draftIslandDisplay.size === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, size: opt.id }))}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected ? '' : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: currentTheme.softBg,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.accent,
                                  }
                                : undefined
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 2. STYLE (Attached vs Floating) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight">Style</h4>
                      <p className="text-xs text-neutral-400">
                        Attached to the top edge like a laptop&apos;s notch, or floating just below it like on an iPhone
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/45 p-1 rounded-2xl border border-white/[0.08] shrink-0 self-start sm:self-center">
                      {[
                        { id: 'attached', label: 'Attached' },
                        { id: 'floating', label: 'Floating' },
                      ].map((opt) => {
                        const isSelected = draftIslandDisplay.style === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, style: opt.id }))}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected ? '' : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: currentTheme.softBg,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.accent,
                                  }
                                : undefined
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 3. MATERIAL (Black vs Colour glass — collapsed state only) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5 max-w-lg">
                      <h4 className="text-sm font-bold text-white tracking-tight">Material</h4>
                      <p className="text-xs text-neutral-400 leading-relaxed">
                        Black, or colour glass: real see-through frosted glass on the collapsed island, with a luminous glow in the colour of your music or Eyeland theme
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/45 p-1 rounded-2xl border border-white/[0.08] shrink-0 self-start sm:self-center">
                      {[
                        { id: 'black', label: 'Black' },
                        { id: 'glass', label: 'Colour glass' },
                      ].map((opt) => {
                        const isSelected = draftIslandDisplay.material === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, material: opt.id }))}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected ? '' : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: currentTheme.softBg,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.accent,
                                  }
                                : undefined
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 4. SEE-THROUGH SLIDER */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight">See-through</h4>
                      <p className="text-xs text-neutral-400">How much you see through the collapsed island</p>
                    </div>
                    <div className="flex items-center gap-3 sm:w-64">
                      <input
                        type="range"
                        min={0}
                        max={85}
                        step={5}
                        value={draftIslandDisplay.seeThrough}
                        onChange={(e) =>
                          setDraftIslandDisplay((p) => ({ ...p, seeThrough: Number(e.target.value) }))
                        }
                        className="flex-1 h-1.5 rounded-full cursor-pointer accent-emerald-400"
                        style={{ accentColor: currentTheme.accent }}
                      />
                      <span className="text-xs font-mono font-bold text-white w-10 text-right">
                        {draftIslandDisplay.seeThrough}%
                      </span>
                    </div>
                  </div>

                  {/* 5. GLASS COLOUR (Conditional — appears ONLY when Material === 'glass') */}
                  {draftIslandDisplay.material === 'glass' && (
                    <div className="flex flex-col gap-3 pb-5 border-b border-white/[0.06] animate-fadeIn">
                      <div className="space-y-0.5">
                        <div className="flex items-center gap-2">
                          <h4 className="text-sm font-bold text-white tracking-tight">Glass colour</h4>
                          <span
                            className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border uppercase"
                            style={{
                              backgroundColor: currentTheme.softBg,
                              color: currentTheme.accent,
                              borderColor: currentTheme.border,
                            }}
                          >
                            Glass Mode
                          </span>
                        </div>
                        <p className="text-xs text-neutral-400">
                          Automatic follows your music or Eyeland theme, or pick a glass tint yourself
                        </p>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {GLASS_COLOR_OPTIONS.map((opt) => {
                          const isSelected = draftIslandDisplay.glassColor === opt.id;
                          const dotColor = opt.hex || currentTheme.accent;
                          return (
                            <button
                              key={opt.id}
                              type="button"
                              onClick={() => setDraftIslandDisplay((p) => ({ ...p, glassColor: opt.id }))}
                              className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer flex items-center gap-2 ${
                                isSelected
                                  ? 'text-white'
                                  : 'bg-black/35 border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                              }`}
                              style={
                                isSelected
                                  ? {
                                      backgroundColor: `${dotColor}24`,
                                      borderColor: `${dotColor}80`,
                                      color: opt.hex || currentTheme.accent,
                                      boxShadow: `0 0 16px ${dotColor}30`,
                                    }
                                  : undefined
                              }
                            >
                              <span
                                className="w-2.5 h-2.5 rounded-full shrink-0"
                                style={{ backgroundColor: dotColor, boxShadow: `0 0 6px ${dotColor}` }}
                              />
                              <span>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 6. MUSIC COLOUR */}
                  <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight">Music colour</h4>
                      <p className="text-xs text-neutral-400">
                        When the island is see-through or glass, it takes on the colour of the album cover that is playing
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(draftIslandDisplay.musicColor)}
                      onClick={() =>
                        setDraftIslandDisplay((p) => ({ ...p, musicColor: !p.musicColor }))
                      }
                      className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                        draftIslandDisplay.musicColor
                          ? 'justify-end'
                          : 'justify-start bg-neutral-800/90 border-white/15'
                      }`}
                      style={
                        draftIslandDisplay.musicColor
                          ? {
                              backgroundColor: currentTheme.softBg,
                              borderColor: currentTheme.border,
                              boxShadow: `0 0 14px ${currentTheme.glow}`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-md transition-all"
                        style={{
                          backgroundColor: draftIslandDisplay.musicColor ? currentTheme.accent : '#a3a3a3',
                        }}
                      />
                    </button>
                  </div>

                  {/* 7. OPEN MODE (On hover vs On click) */}
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight">Open</h4>
                      <p className="text-xs text-neutral-400">
                        Opens the island when your mouse moves over it, or only when you click it
                      </p>
                    </div>
                    <div className="flex items-center gap-1.5 bg-black/45 p-1 rounded-2xl border border-white/[0.08] shrink-0 self-start sm:self-center">
                      {[
                        { id: 'hover', label: 'On hover' },
                        { id: 'click', label: 'On click' },
                      ].map((opt) => {
                        const isSelected = draftIslandDisplay.openMode === opt.id;
                        return (
                          <button
                            key={opt.id}
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, openMode: opt.id }))}
                            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                              isSelected ? '' : 'border-transparent text-neutral-400 hover:text-white hover:bg-white/[0.05]'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: currentTheme.softBg,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.accent,
                                  }
                                : undefined
                            }
                          >
                            {opt.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* 8. SCREEN (Multi-Monitor Picker) */}
                  <div className="flex flex-col gap-3">
                    <div className="flex items-center justify-between gap-2">
                      <div className="space-y-0.5">
                        <h4 className="text-sm font-bold text-white tracking-tight">Screen</h4>
                        <p className="text-xs text-neutral-400">Which screen the island is displayed on</p>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          window.electronAPI?.getDisplays?.().then((list) => {
                            if (Array.isArray(list)) setConnectedDisplays(list);
                          }).catch(() => {});
                        }}
                        className="px-2.5 py-1 rounded-lg bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-[10.5px] font-mono text-neutral-300 hover:text-white transition-colors cursor-pointer flex items-center gap-1.5"
                        title="Rescan connected monitors"
                      >
                        <IconRefresh className="w-3 h-3 text-neutral-400" />
                        <span>Refresh</span>
                      </button>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setDraftIslandDisplay((p) => ({ ...p, screenId: 'main' }))}
                        className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
                          draftIslandDisplay.screenId === 'main'
                            ? ''
                            : 'bg-black/35 border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                        }`}
                        style={
                          draftIslandDisplay.screenId === 'main'
                            ? {
                                backgroundColor: currentTheme.softBg,
                                borderColor: currentTheme.border,
                                color: currentTheme.accent,
                              }
                            : undefined
                        }
                      >
                        Main screen
                      </button>
                      {connectedDisplays.map((disp) => {
                        const isSelected = String(draftIslandDisplay.screenId) === String(disp.id);
                        return (
                          <button
                            key={disp.id}
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, screenId: String(disp.id) }))}
                            className={`px-3.5 py-2 rounded-xl text-xs font-semibold border transition-all cursor-pointer font-mono ${
                              isSelected
                                ? ''
                                : 'bg-black/35 border-white/[0.08] text-neutral-300 hover:text-white hover:bg-white/[0.06]'
                            }`}
                            style={
                              isSelected
                                ? {
                                    backgroundColor: currentTheme.softBg,
                                    borderColor: currentTheme.border,
                                    color: currentTheme.accent,
                                  }
                                : undefined
                            }
                          >
                            {disp.label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>

                {/* CONTAINER 2: ON THE ISLAND (Lyrics, Word by Word Karaoke, Volume Bar) */}
                <div className="rounded-3xl border border-white/[0.09] bg-gradient-to-b from-[#10121b]/95 to-[#0b0c12]/95 shadow-[0_18px_45px_rgba(0,0,0,0.5)] backdrop-blur-xl p-6 space-y-5">
                  <div className="flex items-center justify-between border-b border-white/[0.07] pb-3">
                    <span className="text-[10px] font-mono uppercase tracking-wider text-neutral-400 font-bold">
                      ON THE ISLAND
                    </span>
                    <span className="text-[10px] font-mono text-neutral-500">
                      Live Overlays &amp; HUD
                    </span>
                  </div>

                  {/* 1. LYRICS */}
                  <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight">Lyrics</h4>
                      <p className="text-xs text-neutral-400">
                        The line that is sung, live in the island via LRCLIB (with automatic Hinglish/Romanized sync)
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(draftIslandDisplay.showLyrics)}
                      onClick={() =>
                        setDraftIslandDisplay((p) => ({ ...p, showLyrics: !p.showLyrics }))
                      }
                      className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                        draftIslandDisplay.showLyrics
                          ? 'justify-end'
                          : 'justify-start bg-neutral-800/90 border-white/15'
                      }`}
                      style={
                        draftIslandDisplay.showLyrics
                          ? {
                              backgroundColor: currentTheme.softBg,
                              borderColor: currentTheme.border,
                              boxShadow: `0 0 14px ${currentTheme.glow}`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-md transition-all"
                        style={{
                          backgroundColor: draftIslandDisplay.showLyrics ? currentTheme.accent : '#a3a3a3',
                        }}
                      />
                    </button>
                  </div>

                  {/* 2. WORD BY WORD (KARAOKE) */}
                  <div className="flex items-center justify-between gap-4 pb-5 border-b border-white/[0.06]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <h4 className="text-sm font-bold text-white tracking-tight">Word by word</h4>
                        <span
                          className="text-[9.5px] font-mono px-1.5 py-0.5 rounded border uppercase font-semibold"
                          style={{
                            backgroundColor: currentTheme.softBg,
                            color: currentTheme.accent,
                            borderColor: currentTheme.border,
                          }}
                        >
                          Karaoke
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        The words light up one by one as they are sung, like karaoke
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(draftIslandDisplay.wordByWord)}
                      onClick={() =>
                        setDraftIslandDisplay((p) => ({ ...p, wordByWord: !p.wordByWord }))
                      }
                      className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                        draftIslandDisplay.wordByWord
                          ? 'justify-end'
                          : 'justify-start bg-neutral-800/90 border-white/15'
                      }`}
                      style={
                        draftIslandDisplay.wordByWord
                          ? {
                              backgroundColor: currentTheme.softBg,
                              borderColor: currentTheme.border,
                              boxShadow: `0 0 14px ${currentTheme.glow}`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-md transition-all"
                        style={{
                          backgroundColor: draftIslandDisplay.wordByWord ? currentTheme.accent : '#a3a3a3',
                        }}
                      />
                    </button>
                  </div>

                  {/* 3. VOLUME BAR */}
                  <div className="flex items-center justify-between gap-4">
                    <div className="space-y-0.5">
                      <h4 className="text-sm font-bold text-white tracking-tight">Volume bar</h4>
                      <p className="text-xs text-neutral-400">
                        Show the volume in the island when you change it
                      </p>
                    </div>
                    <button
                      type="button"
                      role="switch"
                      aria-checked={Boolean(draftIslandDisplay.showVolumeBar)}
                      onClick={() =>
                        setDraftIslandDisplay((p) => ({ ...p, showVolumeBar: !p.showVolumeBar }))
                      }
                      className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                        draftIslandDisplay.showVolumeBar
                          ? 'justify-end'
                          : 'justify-start bg-neutral-800/90 border-white/15'
                      }`}
                      style={
                        draftIslandDisplay.showVolumeBar
                          ? {
                              backgroundColor: currentTheme.softBg,
                              borderColor: currentTheme.border,
                              boxShadow: `0 0 14px ${currentTheme.glow}`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-md transition-all"
                        style={{
                          backgroundColor: draftIslandDisplay.showVolumeBar ? currentTheme.accent : '#a3a3a3',
                        }}
                      />
                    </button>
                  </div>
                </div>

                {/* CARD 5: LIVE WEATHER & LOCATION SETTINGS */}
                <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/[0.08] backdrop-blur-md space-y-6">
                  <div className="flex items-start justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2.5">
                        <IconWeather className="w-5 h-5 text-amber-400" />
                        <h3 className="text-base font-bold text-white tracking-tight">Weather & Location</h3>
                        <span
                          className="text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold uppercase"
                          style={{
                            backgroundColor: currentTheme.softBg,
                            color: currentTheme.accent,
                            borderColor: currentTheme.border,
                          }}
                        >
                          Live Sync
                        </span>
                      </div>
                      <p className="text-xs text-neutral-400">
                        Display real-time temperature, condition icons, and atmospheric metrics directly on Eyeland
                      </p>
                    </div>

                    {/* Master Switch: Show Weather Widget */}
                    <button
                      type="button"
                      role="switch"
                      aria-checked={draftIslandDisplay.showWeather !== false}
                      onClick={() =>
                        setDraftIslandDisplay((p) => ({ ...p, showWeather: p.showWeather === false ? true : false }))
                      }
                      className={`w-12 h-6 rounded-full p-0.5 border transition-all cursor-pointer shrink-0 flex items-center ${
                        draftIslandDisplay.showWeather !== false
                          ? 'justify-end'
                          : 'justify-start bg-neutral-800/90 border-white/15'
                      }`}
                      style={
                        draftIslandDisplay.showWeather !== false
                          ? {
                              backgroundColor: currentTheme.softBg,
                              borderColor: currentTheme.border,
                              boxShadow: `0 0 14px ${currentTheme.glow}`,
                            }
                          : undefined
                      }
                    >
                      <span
                        className="w-5 h-5 rounded-full shadow-md transition-all"
                        style={{
                          backgroundColor: draftIslandDisplay.showWeather !== false ? currentTheme.accent : '#a3a3a3',
                        }}
                      />
                    </button>
                  </div>

                  {draftIslandDisplay.showWeather !== false && (
                    <div className="space-y-5 pt-2 border-t border-white/[0.06] animate-fadeIn">
                      {/* 1. CITY / LOCATION INPUT */}
                      <div className="space-y-2">
                        <div className="flex items-center justify-between">
                          <label className="text-xs font-semibold text-neutral-300 flex items-center gap-1.5">
                            <IconMapPin className="w-3.5 h-3.5 text-rose-400" />
                            <span>Weather Location</span>
                          </label>
                          <span className="text-[10.5px] font-mono text-neutral-500">
                            {draftIslandDisplay.weatherCity?.trim() ? 'Custom Location' : 'Auto-Detect (Current Location)'}
                          </span>
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="relative flex-1">
                            <input
                              type="text"
                              value={draftIslandDisplay.weatherCity || ''}
                              onChange={(e) =>
                                setDraftIslandDisplay((p) => ({ ...p, weatherCity: e.target.value }))
                              }
                              placeholder="Auto-Detect (e.g. Tokyo, London, Bengaluru, New York)"
                              className="w-full bg-[#12131c] border border-white/15 focus:border-white/40 rounded-xl px-3.5 py-2 text-xs text-white placeholder-neutral-500 outline-none transition-all font-medium"
                            />
                            {draftIslandDisplay.weatherCity?.trim() && (
                              <button
                                type="button"
                                onClick={() => setDraftIslandDisplay((p) => ({ ...p, weatherCity: '' }))}
                                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-white p-1 cursor-pointer"
                                title="Clear to Auto-Detect"
                              >
                                <IconX className="w-3 h-3" />
                              </button>
                            )}
                          </div>

                          <button
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, weatherCity: '' }))}
                            className={`px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 border transition-all cursor-pointer shrink-0 active:scale-95 ${
                              !draftIslandDisplay.weatherCity?.trim()
                                ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                                : 'bg-white/[0.05] hover:bg-white/10 text-neutral-300 border-white/10'
                            }`}
                            title="Reset to automatic current location detection"
                          >
                            <IconRefresh className={`w-3.5 h-3.5 ${isHubWeatherLoading ? 'animate-spin' : ''}`} />
                            <span>Auto-Detect</span>
                          </button>
                        </div>

                        {/* Quick City Suggestion Chips */}
                        <div className="flex items-center gap-1.5 flex-wrap pt-1">
                          <span className="text-[10px] text-neutral-500 font-mono mr-1">Quick Cities:</span>
                          {['Bengaluru', 'Tokyo', 'London', 'New York', 'Kolkata', 'Paris', 'Dubai', 'Sydney'].map((city) => (
                            <button
                              key={city}
                              type="button"
                              onClick={() => setDraftIslandDisplay((p) => ({ ...p, weatherCity: city }))}
                              className={`px-2.5 py-0.5 rounded-lg text-[10.5px] font-medium transition-all cursor-pointer ${
                                (draftIslandDisplay.weatherCity || '').toLowerCase() === city.toLowerCase()
                                  ? 'bg-white text-black font-bold shadow-sm'
                                  : 'bg-white/[0.05] hover:bg-white/10 text-neutral-300 border border-white/[0.06]'
                              }`}
                            >
                              {city}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* 2. TEMPERATURE UNITS (°C vs °F) */}
                      <div className="flex items-center justify-between gap-4 pt-2 border-t border-white/[0.06]">
                        <div className="space-y-0.5">
                          <h4 className="text-sm font-bold text-white tracking-tight">Temperature Unit</h4>
                          <p className="text-xs text-neutral-400">Choose between Celsius and Fahrenheit</p>
                        </div>

                        <div className="flex items-center p-1 rounded-xl bg-[#12131c] border border-white/10 shrink-0">
                          <button
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, weatherUnits: 'celsius' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              (draftIslandDisplay.weatherUnits || 'celsius') === 'celsius'
                                ? 'bg-white text-black font-bold shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            °C Celsius
                          </button>
                          <button
                            type="button"
                            onClick={() => setDraftIslandDisplay((p) => ({ ...p, weatherUnits: 'fahrenheit' }))}
                            className={`px-3 py-1 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                              draftIslandDisplay.weatherUnits === 'fahrenheit'
                                ? 'bg-white text-black font-bold shadow-sm'
                                : 'text-neutral-400 hover:text-white'
                            }`}
                          >
                            °F Fahrenheit
                          </button>
                        </div>
                      </div>

                      {/* 3. LIVE WEATHER PREVIEW CARD */}
                      <div className="p-3.5 rounded-xl bg-[#141520] border border-white/10 flex items-center justify-between gap-4 shadow-sm">
                        <div className="flex items-center gap-3 min-w-0">
                          <span className="text-2xl shrink-0">
                            {hubWeather?.icon || '⛅'}
                          </span>
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-base font-bold text-white font-mono">
                                {hubWeather ? `${hubWeather.temp}${hubWeather.tempUnit}` : '--'}
                              </span>
                              <span className="text-xs font-medium text-neutral-200 truncate">
                                {hubWeather?.condition || 'Checking live weather...'}
                              </span>
                            </div>
                            <div className="text-[10px] text-neutral-400 font-mono truncate flex items-center gap-1.5 mt-0.5">
                              <span>{hubWeather?.city || draftIslandDisplay.weatherCity || 'Auto-Detecting'}</span>
                              {hubWeather?.country && <span>• {hubWeather.country}</span>}
                              {hubWeather && (
                                <span>• Feels like {hubWeather.feelsLike}{hubWeather.tempUnit}</span>
                              )}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[9.5px] font-mono px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 inline-block font-semibold">
                            {isHubWeatherLoading ? 'Syncing...' : 'Live Connected'}
                          </div>
                          {hubWeather && (
                            <div className="text-[9px] text-neutral-400 font-mono mt-1">
                              Wind: {hubWeather.windSpeed} • Hum: {hubWeather.humidity}%
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  )}
                </div>

              </div>
            );
          })()}

          {/* =================================================================
              DUMMY TABS (Configurable one by one later)
              ================================================================= */}
          {activeNav !== 'home' && activeNav !== 'connections' && activeNav !== 'ai_chat' && activeNav !== 'companion' && activeNav !== 'wardrobe' && activeNav !== 'account' && activeNav !== 'general' && activeNav !== 'island' && (
            <div className="space-y-5 max-w-4xl animate-fadeIn">
              
              {/* Tab Header */}
              <div className="border-b border-white/[0.08] pb-4 flex items-center justify-between">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">
                      {navGroups.flatMap(g => g.items).find(i => i.id === activeNav)?.icon}
                    </span>
                    <h2 className="text-xl font-bold text-white tracking-tight">
                      {navGroups.flatMap(g => g.items).find(i => i.id === activeNav)?.label}
                    </h2>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold uppercase">
                      Configuring
                    </span>
                  </div>
                  <p className="text-xs text-neutral-400 mt-1">
                    This tab is ready for customization. Tell me what features or settings you'd like to configure here next!
                  </p>
                </div>

                <button
                  onClick={() => setActiveNav('home')}
                  className="px-3 py-1.5 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-xs text-neutral-200 font-medium transition-colors cursor-pointer"
                >
                  ← Back to Home
                </button>
              </div>

              {/* Placeholder Card 1: Main Section */}
              <div className="p-6 rounded-2xl bg-neutral-900/60 border border-white/10 space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-sm font-bold text-white flex items-center gap-2">
                    <IconZap className="w-4 h-4 text-amber-400" />
                    <span>Configuration Panel</span>
                  </h3>
                  <span className="text-xs font-mono text-neutral-500">Eyeland 1.0</span>
                </div>

                <p className="text-xs text-neutral-300 leading-relaxed">
                  We have set up the complete layout and routing for the <strong>{navGroups.flatMap(g => g.items).find(i => i.id === activeNav)?.label}</strong> tab. 
                  When you are ready, let me know what specific controls, toggles, forms, or data you would like to display here!
                </p>

                {/* Mock Settings Switch Rows */}
                <div className="space-y-2 pt-2 border-t border-white/5">
                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <div className="text-xs font-semibold text-white">Enable Feature</div>
                      <div className="text-[11px] text-neutral-400">Toggle this module for active background polling</div>
                    </div>
                    <div className="w-10 h-5 bg-emerald-500/30 border border-emerald-400/50 rounded-full flex items-center p-0.5 justify-end cursor-pointer">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full shadow"></div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between py-2 border-b border-white/5">
                    <div>
                      <div className="text-xs font-semibold text-white">Auto-Sync Changes</div>
                      <div className="text-[11px] text-neutral-400">Broadcast state updates directly to top bezel island</div>
                    </div>
                    <div className="w-10 h-5 bg-emerald-500/30 border border-emerald-400/50 rounded-full flex items-center p-0.5 justify-end cursor-pointer">
                      <div className="w-4 h-4 bg-emerald-400 rounded-full shadow"></div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Placeholder Card 2: Diagnostics & Tips */}
              <div className="p-4 rounded-2xl bg-neutral-900/30 border border-white/5 flex items-center justify-between text-xs text-neutral-400">
                <div className="flex items-center gap-2">
                  <span className="text-emerald-400">●</span>
                  <span>Tab ID: <code className="text-neutral-300 font-mono">activeNav = "{activeNav}"</code></span>
                </div>
                <span className="text-[11px] text-neutral-500 font-mono">Ready to populate</span>
              </div>

            </div>
          )}

        </main>
      </div>

      {/* =====================================================================
          3. GLOBAL UNSAVED CHANGES BAR (Applies across ALL Hub tabs)
          ===================================================================== */}
      {hasUnsavedChanges && (
        <div className="fixed bottom-4 left-60 right-6 z-50 flex justify-center pointer-events-none animate-slideUp">
          <div className="pointer-events-auto w-full max-w-3xl px-4 py-3 rounded-2xl bg-[#11131b]/95 border border-white/15 shadow-[0_20px_50px_rgba(0,0,0,0.85)] backdrop-blur-xl flex items-center justify-between gap-4">
            <div className="flex items-center gap-3 min-w-0">
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse shrink-0"
                style={{
                  backgroundColor: currentTheme.accent,
                  boxShadow: `0 0 10px ${currentTheme.accent}`,
                }}
              />
              <div className="min-w-0">
                <div className="text-xs font-bold text-white truncate">
                  Careful — you have unsaved changes!
                </div>
                <div className="text-[11px] text-neutral-400 truncate font-mono">
                  Modified: {unsavedLabels.join(' • ')}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={handleDiscardAllChanges}
                disabled={isSavingAll}
                className="px-3.5 py-2 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/10 text-xs font-semibold text-neutral-300 hover:text-white transition-colors cursor-pointer"
              >
                Discard
              </button>
              <button
                type="button"
                onClick={handleSaveAllChanges}
                disabled={isSavingAll}
                className="px-4 py-2 rounded-xl text-black text-xs font-bold transition-all hover:brightness-110 active:scale-95 cursor-pointer flex items-center gap-1.5"
                style={{
                  backgroundColor: currentTheme.accent,
                  boxShadow: `0 0 20px ${currentTheme.glow}`,
                }}
              >
                <span>{isSavingAll ? 'Saving...' : 'Save Changes'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
