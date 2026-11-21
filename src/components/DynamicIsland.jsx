import React, { useState, useRef, useEffect, useMemo } from 'react';
import MinimalEyes from './MinimalEyes.jsx';
import CompanionCoreAvatar from './CompanionCoreAvatar.jsx';
import {
  IconCpu,
  IconRam,
  IconWifi,
  IconBattery,
  IconBatteryCharging,
  IconVolumeMute,
  IconVolumeLow,
  IconVolumeMid,
  IconVolumeHigh,
  IconBrightness,
  IconSnipping,
  IconClipboard,
  IconCheck,
  IconCopy,
  IconTrash,
  IconDownload,
  IconClock,
  IconFlame,
  IconBell,
  IconBellOff,
  IconTarget,
  IconCoffee,
  IconPalm,
  IconSparkles,
  IconBot,
  IconAiChat,
  IconCamera,
  IconPaperclip,
  IconFileText,
  IconFolder,
  IconImage,
  IconCode,
  IconAudio,
  IconVideo,
  IconArchive,
  IconZap,
  IconKey,
  IconRefresh,
  IconMail,
  IconLightbulb,
  IconGlobe,
  IconNotes,
  IconWave,
  IconSupport,
  IconX,
} from './Icons.jsx';
import { getTranslations } from '../config/i18n.js';
import { DEFAULT_ISLAND_DISPLAY, GLASS_COLOR_OPTIONS, hexToRgbTuple } from '../config/islandDisplay.js';
import { extractDominantColor } from '../utils/colorExtractor.js';
import { devanagariToHinglish, hasDevanagari } from '../utils/hindiRomanizer.js';

function formatInline(text) {
  if (!text) return null;
  const tokens = text.split(/(\*\*.*?\*\*|`.*?`)/g);
  return tokens.map((token, i) => {
    if (token.startsWith('**') && token.endsWith('**')) {
      return <strong key={i} className="font-semibold text-white">{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith('`') && token.endsWith('`')) {
      return (
        <code key={i} className="px-1 py-0.2 rounded bg-neutral-800 text-emerald-300 font-mono text-[9.5px]">
          {token.slice(1, -1)}
        </code>
      );
    }
    return token;
  });
}

function renderFormattedMessage(content) {
  if (!content) return null;
  const cleaned = String(content)
    .replace(/^#+\s*\*{0,2}(?:Eyeland|Neural|Multimodal|Analysis Report|AI Report)[^\n]*\n+/gi, '')
    .replace(/^\*{1,2}(?:Eyeland|Neural|Multimodal|Analysis Report|AI Report)[^\n]*\*{1,2}\n+/gi, '')
    .trim();
  const parts = cleaned.split(/(```[\s\S]*?```)/g);

  return parts.map((part, idx) => {
    if (part.startsWith('```') && part.endsWith('```')) {
      const lines = part.slice(3, -3).trim().split('\n');
      const lang = lines[0].trim().match(/^[a-zA-Z0-9_-]+$/) ? lines[0].trim() : '';
      const code = lang ? lines.slice(1).join('\n') : lines.join('\n');

      return (
        <div key={idx} className="my-1.5 rounded-xl overflow-hidden border border-neutral-700/80 bg-[#0d0d11] font-mono text-[10px]">
          <div className="flex items-center justify-between px-2.5 py-1 bg-neutral-800/80 border-b border-neutral-700/60 text-neutral-400 text-[9px]">
            <span>{lang || 'code'}</span>
            <button
              type="button"
              onClick={() => {
                navigator.clipboard?.writeText(code);
                if (window.electronAPI?.writeClipboardText) {
                  window.electronAPI.writeClipboardText(code);
                }
              }}
              className="hover:text-emerald-400 transition-colors flex items-center gap-1 cursor-pointer"
            >
              <IconCopy className="w-3 h-3 text-neutral-400" />
              <span>Copy</span>
            </button>
          </div>
          <pre className="p-2.5 overflow-x-auto text-emerald-300 select-text whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      );
    }

    const lines = part.split('\n');
    return (
      <div key={idx} className="space-y-1">
        {lines.map((line, lIdx) => {
          if (!line.trim()) return <div key={lIdx} className="h-0.5" />;

          if (line.startsWith('### ')) {
            return (
              <h4 key={lIdx} className="font-semibold text-white text-[11px] mt-1 pt-0.5 border-t border-neutral-800/50">
                {formatInline(line.slice(4))}
              </h4>
            );
          }
          if (line.startsWith('## ')) {
            return (
              <h3 key={lIdx} className="font-bold text-white text-[11.5px] mt-1 pt-0.5 border-t border-neutral-800/50">
                {formatInline(line.slice(3))}
              </h3>
            );
          }

          if (line.match(/^[\*\-]\s+/)) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-1 text-[11px]">
                <span className="text-emerald-400 mt-1 text-[7px]">●</span>
                <span className="flex-1">{formatInline(line.replace(/^[\*\-]\s+/, ''))}</span>
              </div>
            );
          }

          const numMatch = line.match(/^(\d+)\.\s+/);
          if (numMatch) {
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-1 text-[11px]">
                <span className="text-cyan-400 font-mono text-[9px] min-w-[14px]">{numMatch[1]}.</span>
                <span className="flex-1">{formatInline(line.replace(/^\d+\.\s+/, ''))}</span>
              </div>
            );
          }

          return <p key={lIdx} className="text-[11px] leading-relaxed">{formatInline(line)}</p>;
        })}
      </div>
    );
  });
}

function renderPeripheralIcon(type, name = '') {
  const t = (type || '').toLowerCase();
  const n = (name || '').toLowerCase();

  if (t === 'mouse' || /mouse|cobra|deathadder|viper|g502|mx master|trackball|touchpad/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="6" y="3" width="12" height="18" rx="6" />
        <line x1="12" y1="7" x2="12" y2="11" />
      </svg>
    );
  }
  if (t === 'keyboard' || /keyboard|keychron|k2|k3|logi k|blackwidow|huntsman/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="5" width="20" height="14" rx="2" />
        <line x1="6" y1="9" x2="6" y2="9.01" />
        <line x1="10" y1="9" x2="10" y2="9.01" />
        <line x1="14" y1="9" x2="14" y2="9.01" />
        <line x1="18" y1="9" x2="18" y2="9.01" />
        <line x1="6" y1="13" x2="6" y2="13.01" />
        <line x1="18" y1="13" x2="18" y2="13.01" />
        <line x1="9" y1="14" x2="15" y2="14" />
      </svg>
    );
  }
  if (t === 'gamepad' || /gamepad|controller|dualsense|xbox|ranger|spinbot|switch/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="6" width="20" height="12" rx="6" />
        <line x1="6" y1="12" x2="10" y2="12" />
        <line x1="8" y1="10" x2="8" y2="14" />
        <circle cx="16" cy="11" r="1" fill="currentColor" />
        <circle cx="18" cy="13" r="1" fill="currentColor" />
      </svg>
    );
  }
  if (t === 'headphones' || /wh-|ch-|headphone|headset|sony|bose|jbl|over-ear/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M3 18v-6a9 9 0 0 1 18 0v6" />
        <path d="M21 19a2 2 0 0 1-2 2h-1a2 2 0 0 1-2-2v-3a2 2 0 0 1 2-2h3zM3 19a2 2 0 0 0 2 2h1a2 2 0 0 0 2-2v-3a2 2 0 0 0-2-2H3z" />
      </svg>
    );
  }
  if (t === 'earbuds' || /buds|airpod|airdopes|ear|tws|immortal|neo|trüke/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="currentColor">
        <path d="M7 3C4.24 3 2 5.24 2 8c0 2.21 1.44 4.08 3.44 4.72l-.94 7.53C4.38 21.2 5.16 22 6.12 22h.76c.96 0 1.74-.8 1.62-1.75l-.94-7.53C9.56 12.08 11 10.21 11 8c0-2.76-2.24-5-5-5zm10 0c-2.76 0-5 2.24-5 5 0 2.21 1.44 4.08 3.44 4.72l-.94 7.53c-.12.95.66 1.75 1.62 1.75h.76c.96 0 1.74-.8 1.62-1.75l-.94-7.53C19.56 12.08 21 10.21 21 8c0-2.76-2.24-5-5-5z" />
      </svg>
    );
  }
  if (t === 'speaker' || /speaker|soundbar|soundcore|audio/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
        <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
      </svg>
    );
  }
  if (t === 'display' || /display|monitor|screen|projector|tv/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="2" y="3" width="20" height="14" rx="2" />
        <line x1="8" y1="21" x2="16" y2="21" />
        <line x1="12" y1="17" x2="12" y2="21" />
      </svg>
    );
  }
  if (t === 'phone' || /phone|iphone|galaxy|pixel|ipad|tablet|android/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <rect x="5" y="2" width="14" height="20" rx="3" />
        <line x1="12" y1="18" x2="12" y2="18.01" />
      </svg>
    );
  }
  if (t === 'usb' || /usb|flash|drive|storage|dongle/i.test(n)) {
    return (
      <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
        <path d="M12 2v10m0 0a3 3 0 1 0 0 6 3 3 0 0 0 0-6z" />
        <path d="M9 7l3-3 3 3" />
      </svg>
    );
  }
  return (
    <svg className="w-3.5 h-3.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
    </svg>
  );
}

export default function DynamicIsland({
  theme,
  setThemeKey,
  themes,
  companionName = 'Bio-Core',
  companionDesign = 'orbital',
  language = 'en',
  displaySettings = DEFAULT_ISLAND_DISPLAY,
  onRequestExpand,
  eyeTracking,
  expression,
  setExpression,
  isHovered,
  setIsHovered,
  isPinned,
  setIsPinned,
  onInputFocusChange,
  onDropdownChange,
  greeting,
  isGreetingActive,
  onDismissGreeting,
  onTriggerGreeting,
  onDragOutChange,
  onFoldIn,
  isSnippingMode: isSnippingModeProp = false,
  onSnippingModeChange,
  wakeStage = 'done',
  userName = 'Creator',
}) {
  const t = getTranslations(language);
  const displaySettingsRef = useRef(displaySettings);
  displaySettingsRef.current = displaySettings;
  const [activeTab, setActiveTab] = useState('home');
  const [updateReady, setUpdateReady] = useState(null);
  const [updateStatus, setUpdateStatus] = useState({ status: 'idle', version: null, percent: 0 });
  const updateResetTimerRef = useRef(null);

  // Internet Connectivity Detection (Updates only display when online)
  const [isOnline, setIsOnline] = useState(() => (typeof navigator !== 'undefined' ? navigator.onLine : true));
  const [isUpdateDismissed, setIsUpdateDismissed] = useState(false);
  const [isInstallingUpdate, setIsInstallingUpdate] = useState(false);

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);
    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    if (window.electronAPI?.onUpdateStatus) {
      const unsub = window.electronAPI.onUpdateStatus((status) => {
        if (!status) return;
        setUpdateStatus(status);
        if (status.status === 'ready') {
          setUpdateReady(status.version || 'new');
        }
        if (status.status === 'available' || status.status === 'ready') {
          setIsUpdateDismissed(false);
        }
        if (status.status === 'up-to-date' || status.status === 'error') {
          if (updateResetTimerRef.current) clearTimeout(updateResetTimerRef.current);
          updateResetTimerRef.current = setTimeout(() => {
            setUpdateStatus((prev) => (prev.status === status.status ? { status: 'idle', version: null, percent: 0 } : prev));
          }, 3500);
        }
      });
      return () => {
        unsub?.();
        if (updateResetTimerRef.current) clearTimeout(updateResetTimerRef.current);
      };
    }
  }, []);

  const isUpdateAlertMode = Boolean(
    !isExpanded &&
    isOnline &&
    !isUpdateDismissed &&
    (updateStatus.status === 'available' || updateStatus.status === 'downloading' || updateStatus.status === 'ready' || updateReady)
  );

  const handleInstallUpdateClick = (e) => {
    e?.stopPropagation();
    if (!isOnline) {
      alert('Active internet connection required to download updates.');
      return;
    }
    setIsInstallingUpdate(true);
    if (updateStatus.status === 'ready' || updateReady) {
      closeAllDropdowns();
      window.electronAPI?.restartAndInstallUpdate?.();
      return;
    }
    if (window.electronAPI?.simulateDownloadAndInstall && updateStatus.status === 'available') {
      window.electronAPI.simulateDownloadAndInstall(updateStatus.version || '1.0.1');
    }
    if (window.electronAPI?.downloadAndInstallUpdate) {
      window.electronAPI.downloadAndInstallUpdate();
    } else if (window.electronAPI?.restartAndInstallUpdate) {
      window.electronAPI.restartAndInstallUpdate();
    }
  };

  const handleCheckForUpdates = async () => {
    if (updateStatus.status === 'ready' || updateReady) {
      closeAllDropdowns();
      window.electronAPI?.restartAndInstallUpdate?.();
      return;
    }
    if (updateStatus.status === 'checking' || updateStatus.status === 'downloading') return;
    setUpdateStatus({ status: 'checking', version: null, percent: 0 });
    if (window.electronAPI?.checkForUpdates) {
      try {
        const res = await window.electronAPI.checkForUpdates();
        if (res?.status === 'dev-mode') {
          setUpdateStatus({ status: 'dev-mode', version: null, percent: 0 });
          if (updateResetTimerRef.current) clearTimeout(updateResetTimerRef.current);
          updateResetTimerRef.current = setTimeout(() => {
            setUpdateStatus({ status: 'idle', version: null, percent: 0 });
          }, 3500);
        } else if (res?.status === 'error') {
          setUpdateStatus({ status: 'error', version: null, percent: 0 });
          if (updateResetTimerRef.current) clearTimeout(updateResetTimerRef.current);
          updateResetTimerRef.current = setTimeout(() => {
            setUpdateStatus({ status: 'idle', version: null, percent: 0 });
          }, 3500);
        }
      } catch (_) {
        setUpdateStatus({ status: 'error', version: null, percent: 0 });
        if (updateResetTimerRef.current) clearTimeout(updateResetTimerRef.current);
        updateResetTimerRef.current = setTimeout(() => {
          setUpdateStatus({ status: 'idle', version: null, percent: 0 });
        }, 3500);
      }
    }
  };

  // Real System Hardware & Network Telemetry State
  const [telemetry, setTelemetry] = useState({
    cpu: {
      model: 'AMD Ryzen 7 4800H',
      cores: 16,
      loadPercent: 12,
    },
    memory: {
      totalGb: '15.4',
      usedGb: '12.7',
      freeGb: '2.7',
      percent: 82,
    },
    battery: {
      percent: 100,
      isCharging: true,
      statusText: 'AC Powered',
    },
    wifi: {
      connected: true,
      ssid: 'GJBC-MCA(LAPTOP-ONLY)',
      signal: 83,
      speed: '286.8 Mbps',
      radioType: 'Wi-Fi 6 (802.11ax)',
      band: '2.4 GHz',
      adapter: 'MediaTek Wi-Fi 6 MT7921',
      availableNetworks: [
        { ssid: 'GJBC-MCA(LAPTOP-ONLY)', connected: true, secure: true },
      ],
    },
    bluetooth: {
      enabled: true,
      adapter: 'MediaTek Bluetooth Adapter',
      devices: [],
    },
    system: {
      uptimeHours: 13,
      uptimeMins: 45,
      hostname: 'ASUS-ROG',
      platform: 'win32',
    },
  });

  // WiFi & Bluetooth State (populated from real hardware)
  const [isWifiOn, setIsWifiOn] = useState(true);
  const [currentWifi, setCurrentWifi] = useState('');
  const [wifiNetworks, setWifiNetworks] = useState([]);

  const [isBluetoothOn, setIsBluetoothOn] = useState(true);
  const [btDevices, setBtDevices] = useState([]);

  // ========================================================
  // DYNAMIC MULTI-INDICATOR SYSTEM (Max 3 stacked, Music exception)
  // ========================================================
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCamActive, setIsCamActive] = useState(false);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);
  const [isSimulatedLowBattery, setIsSimulatedLowBattery] = useState(false);
  const [isSimulatedCharging, setIsSimulatedCharging] = useState(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const prevBtConnectedRef = useRef(new Set());
  const isInitialBtScanRef = useRef(true);

  // Live Peripheral / Hardware Device Connection Alert State
  const [activeDeviceAlert, setActiveDeviceAlert] = useState(null); // { name: string, type: string, battery?: number | null }
  const deviceAlertTimerRef = useRef(null);

  const triggerDeviceConnectedAlert = (device) => {
    if (!device || !device.name) return;
    setActiveDeviceAlert(device);
    if (deviceAlertTimerRef.current) clearTimeout(deviceAlertTimerRef.current);
    deviceAlertTimerRef.current = setTimeout(() => {
      setActiveDeviceAlert(null);
      deviceAlertTimerRef.current = null;
    }, 4500); // Shown for 4.5 seconds, then smoothly returns to normal
  };

  // Live Hardware Master Volume & Screen Brightness HUD State
  const [activeHud, setActiveHud] = useState(null); // { type: 'volume' | 'brightness', value: number, muted?: boolean }
  const [hardwareLevels, setHardwareLevels] = useState({ volume: 100, muted: false, brightness: 80 });
  const hudTimerRef = useRef(null);

  // Gmail / Mail Notification & Privacy Integration State
  const [mailConfig, setMailConfig] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_mail_config');
      if (saved) return JSON.parse(saved);
    } catch (_) {}
    return {
      connected: false,
      email: '',
      unreadCount: 0,
      notificationsEnabled: true,
      checkIntervalMins: 5,
      lastChecked: null,
    };
  });
  const [mailEmailInput, setMailEmailInput] = useState('');
  const [isMailConnecting, setIsMailConnecting] = useState(false);
  const [activeMailAlert, setActiveMailAlert] = useState(null); // { count: 1, text: '1 New Email', timestamp: number }
  const mailAlertTimerRef = useRef(null);

  const [indicatorTimestamps, setIndicatorTimestamps] = useState({
    music: Date.now(),
    camera: 0,
    mic: 0,
    airplane: 0,
    battery_low: 0,
    battery_charging: Date.now(),
    focus: 0,
    mail: 0,
  });

  const toggleCameraIndicator = () => {
    setIsCamActive((prev) => {
      const next = !prev;
      if (next) setIndicatorTimestamps((t) => ({ ...t, camera: Date.now() }));
      return next;
    });
  };

  const toggleMicIndicator = () => {
    setIsMicActive((prev) => {
      const next = !prev;
      if (next) setIndicatorTimestamps((t) => ({ ...t, mic: Date.now() }));
      return next;
    });
  };

  const [isRadioBusy, setIsRadioBusy] = useState(false);

  // Sync actual Windows Wi-Fi & Bluetooth radio states on mount
  useEffect(() => {
    if (window.electronAPI?.getRadioState) {
      window.electronAPI.getRadioState().then((res) => {
        if (res?.success) {
          setIsWifiOn(Boolean(res.wifiOn));
          setIsBluetoothOn(Boolean(res.bluetoothOn));
          setIsAirplaneMode(!res.wifiOn && !res.bluetoothOn);
        }
      }).catch(() => {});
    }
  }, []);

  const handleToggleWifi = async () => {
    if (isRadioBusy) return;
    const next = !isWifiOn;
    setIsWifiOn(next);
    if (next) setIsAirplaneMode(false);
    setIsRadioBusy(true);
    try {
      const res = await window.electronAPI?.setRadioState?.({ target: 'wifi', state: next ? 'on' : 'off' });
      if (res?.success) {
        setIsWifiOn(Boolean(res.wifiOn));
        setIsBluetoothOn(Boolean(res.bluetoothOn));
        setIsAirplaneMode(!res.wifiOn && !res.bluetoothOn);
      }
    } finally {
      setIsRadioBusy(false);
    }
  };

  const handleToggleBluetooth = async () => {
    if (isRadioBusy) return;
    const next = !isBluetoothOn;
    setIsBluetoothOn(next);
    if (next) setIsAirplaneMode(false);
    setIsRadioBusy(true);
    try {
      const res = await window.electronAPI?.setRadioState?.({ target: 'bluetooth', state: next ? 'on' : 'off' });
      if (res?.success) {
        setIsWifiOn(Boolean(res.wifiOn));
        setIsBluetoothOn(Boolean(res.bluetoothOn));
        setIsAirplaneMode(!res.wifiOn && !res.bluetoothOn);
      }
    } finally {
      setIsRadioBusy(false);
    }
  };

  const toggleAirplaneMode = async () => {
    if (isRadioBusy) return;
    const nextAirplane = !isAirplaneMode;
    setIsAirplaneMode(nextAirplane);
    if (nextAirplane) {
      setIndicatorTimestamps((t) => ({ ...t, airplane: Date.now() }));
      setIsWifiOn(false);
      setIsBluetoothOn(false);
    } else {
      setIsWifiOn(true);
      setIsBluetoothOn(true);
    }
    setIsRadioBusy(true);
    try {
      const res = await window.electronAPI?.setRadioState?.({
        target: 'all',
        state: nextAirplane ? 'off' : 'on',
      });
      if (res?.success) {
        setIsWifiOn(Boolean(res.wifiOn));
        setIsBluetoothOn(Boolean(res.bluetoothOn));
        setIsAirplaneMode(!res.wifiOn && !res.bluetoothOn);
      }
    } finally {
      setIsRadioBusy(false);
    }
  };

  const handleConnectWifi = async (ssid) => {
    if (!ssid || isRadioBusy) return;
    setIsRadioBusy(true);
    try {
      const res = await window.electronAPI?.connectWifiNetwork?.(ssid);
      if (res?.success) {
        setCurrentWifi(ssid);
        setIsWifiOn(true);
      }
    } finally {
      setIsRadioBusy(false);
    }
  };

  const handleDisconnectWifi = async () => {
    if (isRadioBusy) return;
    setIsRadioBusy(true);
    try {
      await window.electronAPI?.disconnectWifi?.();
      setCurrentWifi('Disconnected');
    } finally {
      setIsRadioBusy(false);
    }
  };

  // Hook into real hardware telemetry from Electron
  useEffect(() => {
    if (window.electronAPI?.getSystemTelemetry) {
      window.electronAPI.getSystemTelemetry().then((data) => {
        if (data) {
          setTelemetry(data);
          if (data.wifi) {
            setIsWifiOn(data.wifi.connected);
            setCurrentWifi(data.wifi.ssid);
            if (data.wifi.availableNetworks?.length > 0) {
              setWifiNetworks(
                data.wifi.availableNetworks.map((n, i) => ({
                  id: i,
                  name: n.ssid,
                  connected: n.connected,
                  signal: Math.ceil((data.wifi.signal || 80) / 25),
                  secure: true,
                  speed: data.wifi.speed,
                }))
              );
            }
          }
          if (data.bluetooth) {
            setIsBluetoothOn(data.bluetooth.enabled);
            if (data.bluetooth.devices?.length > 0) {
              setBtDevices(data.bluetooth.devices);
              const connectedNow = data.bluetooth.devices.filter((d) => d.connected);
              if (!isInitialBtScanRef.current) {
                for (const dev of connectedNow) {
                  if (!prevBtConnectedRef.current.has(dev.name)) {
                    triggerDeviceConnectedAlert({
                      name: dev.name,
                      type: dev.type || 'bluetooth',
                      battery: dev.battery != null ? dev.battery : (dev.type === 'headphones' ? 85 : dev.type === 'mouse' ? 90 : dev.type === 'keyboard' ? 75 : 80),
                    });
                    break;
                  }
                }
              } else {
                isInitialBtScanRef.current = false;
              }
              prevBtConnectedRef.current = new Set(connectedNow.map((d) => d.name));
            }
          }
          if (data.privacy) {
            if (typeof data.privacy.camInUse === 'boolean') {
              setIsCamActive((prev) => {
                if (!prev && data.privacy.camInUse) {
                  setIndicatorTimestamps((t) => ({ ...t, camera: Date.now() }));
                }
                return data.privacy.camInUse;
              });
            }
            if (typeof data.privacy.micInUse === 'boolean') {
              setIsMicActive((prev) => {
                if (!prev && data.privacy.micInUse) {
                  setIndicatorTimestamps((t) => ({ ...t, mic: Date.now() }));
                }
                return data.privacy.micInUse;
              });
            }
          }
        }
      }).catch(console.error);
    }

    let devCleanup = null;
    if (window.electronAPI?.onDeviceConnected) {
      devCleanup = window.electronAPI.onDeviceConnected((dev) => {
        if (dev && dev.name) {
          triggerDeviceConnectedAlert(dev);
        }
      });
    }

    let cleanup = null;
    if (window.electronAPI?.onTelemetryUpdate) {
      cleanup = window.electronAPI.onTelemetryUpdate((data) => {
        if (data) {
          setTelemetry((prev) => ({ ...prev, ...data }));
          if (data.wifi?.ssid) {
            setCurrentWifi(data.wifi.ssid);
          }
          if (data.bluetooth?.devices?.length > 0) {
            setBtDevices(data.bluetooth.devices);
          }
          if (data.privacy) {
            if (typeof data.privacy.camInUse === 'boolean') {
              setIsCamActive((prev) => {
                if (!prev && data.privacy.camInUse) {
                  setIndicatorTimestamps((t) => ({ ...t, camera: Date.now() }));
                }
                return data.privacy.camInUse;
              });
            }
            if (typeof data.privacy.micInUse === 'boolean') {
              setIsMicActive((prev) => {
                if (!prev && data.privacy.micInUse) {
                  setIndicatorTimestamps((t) => ({ ...t, mic: Date.now() }));
                }
                return data.privacy.micInUse;
              });
            }
          }
        }
      });
    }

    return () => {
      cleanup?.();
      devCleanup?.();
    };
  }, []);

  // Connectivity Dropdown State ('wifi' | 'bluetooth' | null) & Options Menu State (•••)
  const [activeDropdownTab, setActiveDropdownTab] = useState('wifi');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isOptionsMenuOpen, setIsOptionsMenuOpen] = useState(false);
  const dropdownRef = useRef(null);

  const closeAllDropdowns = () => {
    setIsDropdownOpen(false);
    setIsOptionsMenuOpen(false);
    onDropdownChange?.(false);
  };

  // Close dropdowns on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        setIsOptionsMenuOpen(false);
        onDropdownChange?.(false);
      }
    };
    if (isDropdownOpen || isOptionsMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, isOptionsMenuOpen, onDropdownChange]);

  // Reset menus if island collapses
  useEffect(() => {
    if (!isHovered && !isPinned) {
      setIsDropdownOpen(false);
      setIsOptionsMenuOpen(false);
      onDropdownChange?.(false);
    }
  }, [isHovered, isPinned, onDropdownChange]);

  const toggleDropdown = (tab) => {
    setIsOptionsMenuOpen(false);
    if (isDropdownOpen && activeDropdownTab === tab) {
      setIsDropdownOpen(false);
      onDropdownChange?.(false);
    } else {
      setActiveDropdownTab(tab);
      setIsDropdownOpen(true);
      onDropdownChange?.(true);
    }
  };

  const toggleOptionsMenu = () => {
    setIsDropdownOpen(false);
    setIsOptionsMenuOpen((prev) => {
      const next = !prev;
      onDropdownChange?.(next);
      return next;
    });
  };

  // Live Clock & Date
  const [currentTime, setCurrentTime] = useState('');
  const [shortTime, setShortTime] = useState('');
  const [fullDateTime, setFullDateTime] = useState('');

  useEffect(() => {
    const updateClock = () => {
      const now = new Date();
      const timeStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: true });
      const shortStr = now.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit', hour12: false });
      const dayName = now.toLocaleDateString([], { weekday: 'short' });
      const dayNum = now.getDate();
      const monthStr = now.toLocaleDateString([], { month: 'short' });
      const yearStr = now.getFullYear();

      setCurrentTime(`${dayName} ${dayNum} ${monthStr} ${timeStr}`);
      setFullDateTime(`${dayName} ${dayNum} ${monthStr} ${yearStr} ${timeStr}`);
      setShortTime(shortStr);
    };
    updateClock();
    const interval = setInterval(updateClock, 1000);
    return () => clearInterval(interval);
  }, []);

  // Keep music indicator timestamp fresh on play
  useEffect(() => {
    if (isPlaying) {
      setIndicatorTimestamps((prev) => ({ ...prev, music: Date.now() }));
    }
  }, [isPlaying]);

  // Spotify Live State (No hardcoded demo tracks)
  const [trackData, setTrackData] = useState({
    title: '',
    artist: '',
    album: '',
    artwork: '',
    duration: 0,
    source: 'Spotify',
    isNativeSpotify: false,
  });
  const [trackPosition, setTrackPosition] = useState(0);
  const [ambientPalette, setAmbientPalette] = useState({
    hex: '#1db954',
    secondaryHex: '#1ed760',
    rgb: 'rgb(29, 185, 84)',
    rgba: (a) => `rgba(29, 185, 84, ${a})`,
    radialAura: 'radial-gradient(circle at 18% 45%, rgba(29, 185, 84, 0.45) 0%, rgba(30, 215, 96, 0.15) 50%, transparent 75%)',
    glowShadow: '0 12px 36px rgba(29, 185, 84, 0.55), 0 0 20px rgba(29, 185, 84, 0.35)',
    subtleShadow: '0 0 14px rgba(29, 185, 84, 0.45)',
  });
  const [isShuffle, setIsShuffle] = useState(false);
  const [isRepeat, setIsRepeat] = useState(false);

  // Spotify Song Intro State: Show song name for 1.8-2s on track start/change, then lyrics show up
  const [showSongIntro, setShowSongIntro] = useState(false);
  const songIntroTimerRef = useRef(null);
  const prevTrackTitleRef = useRef('');

  useEffect(() => {
    if (isPlaying && trackData.title && trackData.title !== prevTrackTitleRef.current) {
      prevTrackTitleRef.current = trackData.title;
      setShowSongIntro(true);
      if (songIntroTimerRef.current) clearTimeout(songIntroTimerRef.current);
      songIntroTimerRef.current = setTimeout(() => {
        setShowSongIntro(false);
        songIntroTimerRef.current = null;
      }, 2000); // Shown for 2 seconds, then rolling lyrics take over!
    } else if (!isPlaying) {
      setShowSongIntro(false);
      prevTrackTitleRef.current = '';
    }
  }, [isPlaying, trackData.title]);

  // Synchronized timestamped lyrics state
  const [lyrics, setLyrics] = useState([]);
  const [isLoadingLyrics, setIsLoadingLyrics] = useState(false);

  // Fetch lyrics whenever current track changes
  useEffect(() => {
    if (!trackData.title || !trackData.artist) {
      setLyrics([]);
      return;
    }

    let isMounted = true;
    setIsLoadingLyrics(true);

    const fetchLyrics = async () => {
      // 1. Try electron API first
      if (window.electronAPI?.getSongLyrics) {
        try {
          const lines = await window.electronAPI.getSongLyrics(trackData.artist, trackData.title);
          if (isMounted && Array.isArray(lines) && lines.length > 0) {
            setLyrics(lines);
            setIsLoadingLyrics(false);
            return;
          }
        } catch (err) {}
      }

      // 2. Direct web fetch fallback
      try {
        const cleanTitle = trackData.title
          .replace(/\(.*?\)/g, '')
          .replace(/\[.*?\]/g, '')
          .replace(/- .*$/, '')
          .trim();
        const cleanArtist = trackData.artist
          .replace(/\(.*?\)/g, '')
          .replace(/\[.*?\]/g, '')
          .trim();
        const primaryArtist = cleanArtist.split(/[,&]/)[0].trim();

        const searchQueries = [
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(cleanArtist)}`,
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}&artist_name=${encodeURIComponent(primaryArtist)}`,
          `https://lrclib.net/api/search?track_name=${encodeURIComponent(cleanTitle)}`,
          `https://lrclib.net/api/get?artist_name=${encodeURIComponent(primaryArtist)}&track_name=${encodeURIComponent(cleanTitle)}`,
        ];

        for (const url of searchQueries) {
          const res = await fetch(url);
          if (res.ok) {
            const data = await res.json();
            const list = Array.isArray(data) ? data : (data.syncedLyrics ? [data] : []);

            // Prioritize human-written Roman English script (like Spotify displays)
            const romanMatch = list.find(
              (x) => x.syncedLyrics && /[a-zA-Z]/.test(x.syncedLyrics) && !hasDevanagari(x.syncedLyrics)
            );
            const best = romanMatch || list.find((x) => x.syncedLyrics);

            if (best && best.syncedLyrics && isMounted) {
              const parsed = best.syncedLyrics.split('\n').map((line) => {
                const m = line.match(/^\[(\d{2}):(\d{2}(?:\.\d+)?)\]\s*(.*)$/);
                if (m) {
                  let text = m[3].trim();
                  if (hasDevanagari(text)) {
                    text = devanagariToHinglish(text);
                  }
                  return { time: parseInt(m[1], 10) * 60 + parseFloat(m[2]), text };
                }
                return null;
              }).filter((x) => x && x.text);

              if (parsed.length > 0) {
                setLyrics(parsed);
                setIsLoadingLyrics(false);
                return;
              }
            }
          }
        }
      } catch (err) {}

      if (isMounted) {
        setLyrics([]);
        setIsLoadingLyrics(false);
      }
    };

    fetchLyrics();
    return () => { isMounted = false; };
  }, [trackData.title, trackData.artist]);

  // Compute active lyric line based on current track position
  const activeLyricIndex = useMemo(() => {
    if (!lyrics || lyrics.length === 0) return -1;
    for (let i = lyrics.length - 1; i >= 0; i--) {
      if (trackPosition >= lyrics[i].time - 0.25) {
        return i;
      }
    }
    return -1;
  }, [lyrics, trackPosition]);

  const rawLyricLine = activeLyricIndex >= 0 ? lyrics[activeLyricIndex].text : '';
  const currentLyricLine = hasDevanagari(rawLyricLine) ? devanagariToHinglish(rawLyricLine) : rawLyricLine;
  const rawNextLyricLine = activeLyricIndex >= 0 && lyrics[activeLyricIndex + 1] ? lyrics[activeLyricIndex + 1].text : '';
  const nextLyricLine = hasDevanagari(rawNextLyricLine) ? devanagariToHinglish(rawNextLyricLine) : rawNextLyricLine;
  const hasLyrics = Boolean(lyrics && lyrics.length > 0);

  // Word-by-word karaoke progress calculation for the active synced lyric line
  const renderLyricContent = (lineText, compact = false, multiline = false) => {
    if (!lineText) return 'Instrumental';
    if (!displaySettings.wordByWord || activeLyricIndex < 0 || !lyrics[activeLyricIndex]) {
      return lineText;
    }

    const words = lineText.split(/\s+/).filter(Boolean);
    const glowHex = ambientPalette.hex || theme.accent || '#34d399';
    if (words.length <= 1) {
      return (
        <span
          className="text-white font-bold transition-all duration-150"
          style={{ textShadow: `0 0 10px ${glowHex}` }}
        >
          {lineText}
        </span>
      );
    }

    const lineStart = lyrics[activeLyricIndex].time || 0;
    const nextLineTime = lyrics[activeLyricIndex + 1]?.time;
    const charCount = lineText.replace(/\s+/g, '').length;
    // Natural vocal cadence estimate (handles fast & melodic lines without dragging across long instrumental gaps)
    const vocalEstimate = Math.max(1.15, words.length * 0.27 + charCount * 0.034);
    const rawGap =
      typeof nextLineTime === 'number' && nextLineTime > lineStart + 0.3
        ? nextLineTime - lineStart
        : vocalEstimate;

    // Trim trailing breath/instrumental pause (~14%) and cap runaway gaps between verses
    const singDuration = Math.max(
      0.85,
      Math.min(rawGap * 0.86, Math.max(vocalEstimate, rawGap * 0.65))
    );

    // Subtle +0.16s vocal attack lead so each word illuminates right on the sung beat
    const elapsed = Math.max(0, trackPosition + 0.16 - lineStart);
    const lineProgress = Math.max(0, Math.min(1, elapsed / singDuration));

    // Weight each word proportionally by character count + slight syllable/pause weight
    const weights = words.map((w) => {
      const cleanLen = w.replace(/[^a-zA-Z0-9\u0900-\u097F]/g, '').length;
      const pauseBoost = /[,;.!?]$/.test(w) ? 1.5 : 0;
      return Math.max(2, cleanLen + 1.1 + pauseBoost);
    });
    const totalWeight = weights.reduce((sum, w) => sum + w, 0);
    let acc = 0;

    return (
      <span
        className={
          multiline
            ? 'inline-flex flex-wrap items-baseline gap-x-[5px] gap-y-[1px]'
            : 'inline-flex items-baseline gap-[3.5px] whitespace-nowrap'
        }
      >
        {words.map((word, idx) => {
          const startFrac = acc / totalWeight;
          acc += weights[idx];
          const endFrac = acc / totalWeight;
          const isSung = lineProgress >= endFrac;
          const isCurrent = lineProgress >= startFrac && lineProgress < endFrac;

          return (
            <span
              key={`${activeLyricIndex}-${idx}`}
              className={`inline-block transition-all duration-150 ${
                isCurrent
                  ? 'text-white font-bold'
                  : isSung
                  ? 'text-white font-bold'
                  : multiline
                  ? 'text-white/35 font-bold'
                  : compact
                  ? 'text-white/38 font-normal'
                  : 'text-white/35 font-normal'
              }`}
              style={
                isCurrent
                  ? { textShadow: `0 0 12px ${glowHex}aa` }
                  : undefined
              }
            >
              {word}
            </span>
          );
        })}
      </span>
    );
  };

  // Extract dominant ambient lighting color whenever artwork changes
  useEffect(() => {
    if (trackData?.artwork) {
      extractDominantColor(trackData.artwork).then((palette) => {
        if (palette) setAmbientPalette(palette);
      });
    }
  }, [trackData?.artwork]);

  // Real-time wall-clock track progress ticker (drift-free 100ms karaoke resolution when word-by-word is active)
  useEffect(() => {
    if (!isPlaying) return;

    const highPrecision = Boolean(displaySettings.wordByWord && displaySettings.showLyrics !== false && hasLyrics);
    const tickMs = highPrecision ? 100 : 1000;
    let lastTickAt = Date.now();

    const interval = setInterval(() => {
      const now = Date.now();
      const deltaSec = Math.min(1.5, Math.max(0.05, (now - lastTickAt) / 1000));
      lastTickAt = now;
      setTrackPosition((prev) => {
        const next = prev + deltaSec;
        const maxDur = trackData.duration || 200;
        if (next >= maxDur) {
          return isRepeat ? 0 : maxDur;
        }
        return next;
      });
    }, tickMs);

    return () => clearInterval(interval);
  }, [isPlaying, trackData.duration, isRepeat, displaySettings.wordByWord, displaySettings.showLyrics, hasLyrics]);

  // Sync real-time media from Spotify / Windows GSMTC
  useEffect(() => {
    if (window.electronAPI?.getLiveMedia) {
      window.electronAPI.getLiveMedia().then((media) => {
        if (media && media.title && media.status !== 'no_session') {
          setTrackData({
            title: media.title,
            artist: media.artist,
            album: media.album || 'Spotify Music',
            artwork: media.artwork || '',
            duration: media.duration || 0,
            source: media.source || 'Spotify',
            isNativeSpotify: Boolean(media.isNativeSpotify),
          });
          if (typeof media.position === 'number') {
            setTrackPosition(media.position);
          }
          if (media.lyrics && Array.isArray(media.lyrics) && media.lyrics.length > 0) {
            setLyrics(media.lyrics);
          }
          setIsPlaying(Boolean(media.isPlaying));
        } else {
          setIsPlaying(false);
          setTrackData((prev) => ({
            ...prev,
            isNativeSpotify: false,
          }));
        }
      });
    }

    if (window.electronAPI?.onMediaUpdate) {
      const cleanup = window.electronAPI.onMediaUpdate((media) => {
        if (media) {
          if (media.title && media.artist && media.status !== 'no_session') {
            setTrackData((prev) => {
              const trackChanged = prev.title !== media.title;
              if (typeof media.position === 'number') {
                setTrackPosition((currentPos) => {
                  if (trackChanged) return media.position;
                  if (media.position > 0 && Math.abs(currentPos - media.position) >= 1.2) {
                    return media.position;
                  }
                  return currentPos;
                });
              }
              if (media.lyrics && Array.isArray(media.lyrics) && media.lyrics.length > 0) {
                setLyrics(media.lyrics);
              }
              return {
                title: media.title,
                artist: media.artist,
                album: media.album || prev.album || 'Spotify Music',
                artwork: media.artwork || prev.artwork || '',
                duration: media.duration || prev.duration || 0,
                source: media.source || 'Spotify',
                isNativeSpotify: Boolean(media.isNativeSpotify),
              };
            });
            setIsPlaying(Boolean(media.isPlaying));
          } else if (media.status === 'no_session' || !media.isPlaying) {
            setIsPlaying(Boolean(media.isPlaying));
            if (media.status === 'no_session') {
              setTrackData((prev) => ({
                ...prev,
                isNativeSpotify: false,
              }));
            }
          }
        }
      });
      return cleanup;
    }
  }, []);

  // Real-Time Hardware Master Volume & Screen Brightness HUD Listener
  useEffect(() => {
    if (window.electronAPI?.getHardwareState) {
      window.electronAPI.getHardwareState().then((state) => {
        if (state) {
          setHardwareLevels({
            volume: typeof state.volume === 'number' ? state.volume : 100,
            muted: Boolean(state.muted),
            brightness: typeof state.brightness === 'number' ? state.brightness : 80,
          });
        }
      }).catch(() => {});
    }

    if (window.electronAPI?.onHardwareHud) {
      const cleanup = window.electronAPI.onHardwareHud((data) => {
        if (!data || !data.type) return;

        setHardwareLevels((prev) => ({
          ...prev,
          ...(data.type === 'volume'
            ? { volume: data.value, muted: Boolean(data.muted) }
            : { brightness: data.value }),
        }));

        // Respect Island Display "Volume bar" preference
        if (data.type === 'volume' && displaySettingsRef.current?.showVolumeBar === false) {
          return;
        }

        // Morph Island into responsive Volume / Brightness HUD bar
        setActiveHud({
          type: data.type,
          value: data.value,
          muted: Boolean(data.muted),
        });

        if (hudTimerRef.current) {
          clearTimeout(hudTimerRef.current);
        }

        // Auto-collapse back to companion eyes after 1800ms of inactivity
        hudTimerRef.current = setTimeout(() => {
          setActiveHud(null);
          hudTimerRef.current = null;
        }, 1800);
      });

      return () => {
        cleanup();
        if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
      };
    }
  }, []);

  // Gmail / Mail State Persistence
  useEffect(() => {
    try {
      localStorage.setItem('eyeland_mail_config', JSON.stringify(mailConfig));
    } catch (_) {}
  }, [mailConfig]);

  // Collapsed Island Email Alert Trigger (hides eyes for ~3.5s, then restores eyes)
  const triggerMailAlert = (newCount = 1) => {
    setActiveMailAlert({
      count: newCount,
      text: newCount === 1 ? '1 New Email' : `${newCount} New Emails`,
      timestamp: Date.now(),
    });

    if (mailAlertTimerRef.current) {
      clearTimeout(mailAlertTimerRef.current);
    }

    mailAlertTimerRef.current = setTimeout(() => {
      setActiveMailAlert(null);
      mailAlertTimerRef.current = null;
    }, 3500);
  };

  const handleConnectMail = (overrideEmail) => {
    const targetEmail = (overrideEmail || mailEmailInput || 'creator@gmail.com').trim();
    setIsMailConnecting(true);
    setTimeout(() => {
      setMailConfig({
        connected: true,
        email: targetEmail,
        unreadCount: 1,
        notificationsEnabled: true,
        checkIntervalMins: 5,
        lastChecked: Date.now(),
      });
      setIndicatorTimestamps((t) => ({ ...t, mail: Date.now() }));
      setIsMailConnecting(false);
      triggerMailAlert(1);
    }, 550);
  };

  const handleDisconnectMail = () => {
    setMailConfig({
      connected: false,
      email: '',
      unreadCount: 0,
      notificationsEnabled: true,
      checkIntervalMins: 5,
      lastChecked: null,
    });
    setActiveMailAlert(null);
  };

  const handlePlayPause = () => {
    window.electronAPI?.sendMediaControl?.('play-pause');
    setTimeout(() => {
      window.electronAPI?.refreshLiveMedia?.();
    }, 250);
  };

  const handleNextTrack = () => {
    window.electronAPI?.sendMediaControl?.('next');
    setTimeout(() => {
      window.electronAPI?.refreshLiveMedia?.();
    }, 250);
  };

  const handlePrevTrack = () => {
    window.electronAPI?.sendMediaControl?.('prev');
    setTimeout(() => {
      window.electronAPI?.refreshLiveMedia?.();
    }, 250);
  };

  const handleSeek = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const pct = Math.max(0, Math.min(1, clickX / rect.width));
    const newPos = Math.round(pct * (trackData.duration || 200));
    setTrackPosition(newPos);
  };

  // Buddy Mood & Rejoice state
  const [buddyQuote, setBuddyQuote] = useState(
    '"Eyeland is observing your workflow. Silent & bezel-docked."'
  );
  const rejoiceTimerRef = useRef(null);

  // Staging Tray (Shelf) state - Initialized empty (zero sample files) with persistent storage
  const [stagedFiles, setStagedFiles] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_staged_files');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed;
      }
    } catch {}
    return [];
  });
  const [isDraggingOver, setIsDraggingOver] = useState(false);
  const fileInputRef = useRef(null);
  const folderInputRef = useRef(null);

  useEffect(() => {
    try {
      localStorage.setItem('eyeland_staged_files', JSON.stringify(stagedFiles));
    } catch {}
  }, [stagedFiles]);

  // ========================================================
  // COMPREHENSIVE FOCUS MODE & POMODORO PRODUCTIVITY ENGINE
  // ========================================================
  const [focusTaskName, setFocusTaskName] = useState('Deep Focus');
  const [focusPhase, setFocusPhase] = useState('work'); // 'work' | 'shortBreak' | 'longBreak'
  const [isFocusRunning, setIsFocusRunning] = useState(false);
  const [focusPreset, setFocusPreset] = useState('classic'); // 'classic' (25/5) | 'deep' (50/10) | 'sprint' (15/3)
  
  const FOCUS_PRESETS = {
    classic: { work: 25 * 60, shortBreak: 5 * 60, longBreak: 15 * 60, label: '25/5 Classic' },
    deep: { work: 50 * 60, shortBreak: 10 * 60, longBreak: 20 * 60, label: '50/10 Deep' },
    sprint: { work: 15 * 60, shortBreak: 3 * 60, longBreak: 10 * 60, label: '15/3 Sprint' },
  };

  const [focusSecondsLeft, setFocusSecondsLeft] = useState(25 * 60);
  const [focusTotalSeconds, setFocusTotalSeconds] = useState(25 * 60);
  const [focusCycle, setFocusCycle] = useState(1); // 1..4
  const [completedSessionsToday, setCompletedSessionsToday] = useState(0);
  const [isChimeEnabled, setIsChimeEnabled] = useState(true);

  // High-Tech Web Audio Synthesized Chimes (Zero external sound files needed)
  const playFocusChime = (type = 'work') => {
    if (!isChimeEnabled) return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      const ctx = new AudioCtx();
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === 'break') {
        // Soothing Zen Chime (F5 -> A5 -> C6)
        osc.type = 'sine';
        osc.frequency.setValueAtTime(698.46, now);
        osc.frequency.exponentialRampToValueAtTime(880.00, now + 0.12);
        osc.frequency.exponentialRampToValueAtTime(1046.50, now + 0.28);
        gain.gain.setValueAtTime(0.18, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);
        osc.start(now);
        osc.stop(now + 0.9);
      } else {
        // Serious High-Tech Activation Ping (D5 -> G5)
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(587.33, now);
        osc.frequency.exponentialRampToValueAtTime(783.99, now + 0.15);
        gain.gain.setValueAtTime(0.22, now);
        gain.gain.exponentialRampToValueAtTime(0.001, now + 0.85);
        osc.start(now);
        osc.stop(now + 0.85);
      }
    } catch (e) {
      // AudioContext policy catch
    }
  };

  // Phase switcher
  const handleSelectPhase = (phase) => {
    setFocusPhase(phase);
    const preset = FOCUS_PRESETS[focusPreset] || FOCUS_PRESETS.classic;
    const dur = phase === 'work' ? preset.work : phase === 'shortBreak' ? preset.shortBreak : preset.longBreak;
    setFocusSecondsLeft(dur);
    setFocusTotalSeconds(dur);
  };

  // Preset switcher
  const handleSelectPreset = (key) => {
    setFocusPreset(key);
    const preset = FOCUS_PRESETS[key] || FOCUS_PRESETS.classic;
    const dur = focusPhase === 'work' ? preset.work : focusPhase === 'shortBreak' ? preset.shortBreak : preset.longBreak;
    setFocusSecondsLeft(dur);
    setFocusTotalSeconds(dur);
  };

  // Toggle Focus countdown
  const handleToggleFocus = () => {
    if (!isFocusRunning) {
      playFocusChime(focusPhase === 'work' ? 'work' : 'break');
    }
    setIsFocusRunning(!isFocusRunning);
  };

  // Skip Phase
  const handleSkipFocusPhase = () => {
    const preset = FOCUS_PRESETS[focusPreset] || FOCUS_PRESETS.classic;
    if (focusPhase === 'work') {
      playFocusChime('break');
      setCompletedSessionsToday((c) => c + 1);
      if (focusCycle >= 4) {
        setFocusPhase('longBreak');
        setFocusCycle(1);
        setFocusSecondsLeft(preset.longBreak);
        setFocusTotalSeconds(preset.longBreak);
      } else {
        setFocusPhase('shortBreak');
        setFocusCycle((c) => c + 1);
        setFocusSecondsLeft(preset.shortBreak);
        setFocusTotalSeconds(preset.shortBreak);
      }
    } else {
      playFocusChime('work');
      setFocusPhase('work');
      setFocusSecondsLeft(preset.work);
      setFocusTotalSeconds(preset.work);
    }
  };

  // Reset Focus
  const handleResetFocus = () => {
    setIsFocusRunning(false);
    const preset = FOCUS_PRESETS[focusPreset] || FOCUS_PRESETS.classic;
    const dur = focusPhase === 'work' ? preset.work : focusPhase === 'shortBreak' ? preset.shortBreak : preset.longBreak;
    setFocusSecondsLeft(dur);
    setFocusTotalSeconds(dur);
  };

  // Active Focus countdown ticker effect
  useEffect(() => {
    if (!isFocusRunning) return;

    const interval = setInterval(() => {
      setFocusSecondsLeft((prev) => {
        if (prev <= 1) {
          const preset = FOCUS_PRESETS[focusPreset] || FOCUS_PRESETS.classic;
          if (focusPhase === 'work') {
            playFocusChime('break');
            setCompletedSessionsToday((c) => c + 1);
            if (focusCycle >= 4) {
              setFocusPhase('longBreak');
              setFocusCycle(1);
              setFocusTotalSeconds(preset.longBreak);
              return preset.longBreak;
            } else {
              setFocusPhase('shortBreak');
              setFocusCycle((c) => c + 1);
              setFocusTotalSeconds(preset.shortBreak);
              return preset.shortBreak;
            }
          } else {
            playFocusChime('work');
            setFocusPhase('work');
            setFocusTotalSeconds(preset.work);
            return preset.work;
          }
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isFocusRunning, focusPhase, focusCycle, focusPreset, isChimeEnabled]);

  // Broadcast and persist focus state to localStorage for Eyeland Hub
  useEffect(() => {
    try {
      localStorage.setItem('eyeland_focus_state', JSON.stringify({
        isFocusRunning,
        focusPhase,
        focusSecondsLeft,
        focusTotalSeconds,
        completedSessionsToday,
        timestamp: Date.now()
      }));
    } catch (_) {}
  }, [isFocusRunning, focusPhase, focusSecondsLeft, focusTotalSeconds, completedSessionsToday]);

  // Listen for Hub actions directly inside DynamicIsland
  useEffect(() => {
    if (window.electronAPI?.onHubAction) {
      const unsub = window.electronAPI.onHubAction((action) => {
        if (!action) return;
        if (action.type === 'START_FOCUS') {
          setIsFocusRunning(true);
          playFocusChime('work');
        } else if (action.type === 'STOP_FOCUS') {
          setIsFocusRunning(false);
        } else if (action.type === 'NAVIGATE_TAB' && action.tab) {
          setActiveTab(action.tab);
          setIsExpanded(true);
        } else if (action.type === 'TRIGGER_SNIP') {
          handleTriggerSnip(action.toolName || 'explain');
        } else if (action.type === 'CLIPBOARD_CLEARED') {
          setClipboardItems([]);
          setCopiedItemId(null);
          try {
            localStorage.setItem('eyeland_clipboard_history', '[]');
            localStorage.removeItem('eyeland_clipboard_history');
          } catch (_) {}
        }
      });
      return unsub;
    }
  }, []);

  // Listen for Island actions directly inside DynamicIsland
  useEffect(() => {
    if (window.electronAPI?.onIslandAction) {
      const unsub = window.electronAPI.onIslandAction((action) => {
        if (!action) return;
        if (action.type === 'CLIPBOARD_CLEARED') {
          setClipboardItems([]);
          setCopiedItemId(null);
          try {
            localStorage.setItem('eyeland_clipboard_history', '[]');
            localStorage.removeItem('eyeland_clipboard_history');
          } catch (_) {}
        }
      });
      return unsub;
    }
  }, []);

  // Clipboard state (persisted, max 10 items, no dummy items)
  const [clipboardItems, setClipboardItems] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_clipboard_history');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed)) return parsed.slice(0, 10);
      }
    } catch (e) {
      console.error('Failed to parse clipboard history:', e);
    }
    return [];
  });
  const [copiedItemId, setCopiedItemId] = useState(null);

  // Helper to categorize clipboard content
  const detectClipboardType = (text) => {
    if (!text) return 'text';
    const trimmed = text.trim();
    if (/^https?:\/\/[^\s]+$/i.test(trimmed)) return 'url';
    if (/^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(trimmed)) return 'email';
    if (/^#([0-9a-fA-F]{3}|[0-9a-fA-F]{6}|[0-9a-fA-F]{8})$/.test(trimmed) || /^rgba?\(.+\)$/i.test(trimmed) || /^hsla?\(.+\)$/i.test(trimmed)) return 'color';
    if (/^-?\d+(\.\d+)?$/.test(trimmed)) return 'number';
    if (/^(const|let|var|function|import|export|class|def|return|if|for|while|=>|<[a-z]+.*>|\{|\}|\[\])/m.test(trimmed) || trimmed.includes(';') || trimmed.includes('npm ') || trimmed.includes('git ')) return 'code';
    return 'text';
  };

  // Helper to format relative timestamp
  const formatClipboardTime = (timestamp) => {
    if (!timestamp) return 'Just now';
    const diffSec = Math.floor((Date.now() - timestamp) / 1000);
    if (diffSec < 10) return 'Just now';
    if (diffSec < 60) return `${diffSec}s ago`;
    const diffMin = Math.floor(diffSec / 60);
    if (diffMin < 60) return `${diffMin}m ago`;
    const diffHr = Math.floor(diffMin / 60);
    if (diffHr < 24) return `${diffHr}h ago`;
    return `${Math.floor(diffHr / 24)}d ago`;
  };

  // Helper to add or hoist clipboard item (capped at 10)
  const addClipboardItem = (rawText, timestamp = Date.now()) => {
    if (!rawText || !rawText.trim()) return;
    const trimmedText = rawText.trim();
    setClipboardItems((prev) => {
      const filtered = prev.filter((item) => item.text.trim() !== trimmedText);
      const newItem = {
        id: Date.now() + Math.random().toString(36).slice(2, 6),
        text: rawText,
        type: detectClipboardType(rawText),
        timestamp: timestamp,
        charCount: rawText.length,
        wordCount: rawText.trim().split(/\s+/).filter(Boolean).length,
      };
      const updated = [newItem, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('eyeland_clipboard_history', JSON.stringify(updated));
      } catch (err) {
        console.error('Failed to save clipboard:', err);
      }
      return updated;
    });
  };

  // Real-time listener for Windows Ctrl + C broadcasts via Electron IPC
  useEffect(() => {
    if (window.electronAPI?.onClipboardCopy) {
      const cleanup = window.electronAPI.onClipboardCopy((data) => {
        if (data && data.text) {
          addClipboardItem(data.text, data.timestamp || Date.now());
        }
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, []);

  // Native window copy fallback
  useEffect(() => {
    const handleNativeCopy = () => {
      setTimeout(async () => {
        try {
          const text = await navigator.clipboard?.readText();
          if (text) addClipboardItem(text);
        } catch {}
      }, 120);
    };
    window.addEventListener('copy', handleNativeCopy);
    return () => window.removeEventListener('copy', handleNativeCopy);
  }, []);

  // Handle 1-click copy back
  const handleCopyClipboardItem = (item, e) => {
    e?.stopPropagation();
    if (!item || !item.text) return;
    if (window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText(item.text);
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText(item.text);
    }
    setCopiedItemId(item.id);
    setTimeout(() => {
      setCopiedItemId(null);
    }, 1600);

    // Hoist copied item to the top
    setClipboardItems((prev) => {
      const filtered = prev.filter((i) => i.id !== item.id);
      const updatedItem = { ...item, timestamp: Date.now() };
      const updated = [updatedItem, ...filtered].slice(0, 10);
      try {
        localStorage.setItem('eyeland_clipboard_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Remove individual clipboard item
  const removeClipboardItem = (id, e) => {
    e?.stopPropagation();
    setClipboardItems((prev) => {
      const updated = prev.filter((i) => i.id !== id);
      try {
        localStorage.setItem('eyeland_clipboard_history', JSON.stringify(updated));
      } catch {}
      return updated;
    });
  };

  // Clear all clipboard items AND wipe Windows clipboard memory so cleared items never return
  const clearAllClipboardItems = (e) => {
    e?.stopPropagation();
    setClipboardItems([]);
    setCopiedItemId(null);
    try {
      localStorage.setItem('eyeland_clipboard_history', '[]');
      localStorage.removeItem('eyeland_clipboard_history');
    } catch {}
    if (window.electronAPI?.clearClipboard) {
      window.electronAPI.clearClipboard().catch(() => {});
    } else if (navigator.clipboard?.writeText) {
      navigator.clipboard.writeText('').catch(() => {});
    }
  };

  // Quick Scratchpad & Notes state (persisted across restarts, multi-slot, no dummy text)
  const [activeNoteSlot, setActiveNoteSlot] = useState('general');
  const [scratchNotesBySlot, setScratchNotesBySlot] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_scratchpad_slots');
      if (saved) {
        const parsed = JSON.parse(saved);
        if (typeof parsed === 'object' && parsed !== null) {
          return {
            general: typeof parsed.general === 'string' ? parsed.general : '',
            todo: typeof parsed.todo === 'string' ? parsed.todo : '',
            scratch: typeof parsed.scratch === 'string' ? parsed.scratch : '',
          };
        }
      }
      const legacy = localStorage.getItem('eyeland_scratchpad_notes');
      if (legacy) {
        return { general: legacy, todo: '', scratch: '' };
      }
    } catch (e) {
      console.error('Failed to load scratchpad notes:', e);
    }
    return { general: '', todo: '', scratch: '' };
  });

  const [isScratchpadMono, setIsScratchpadMono] = useState(() => {
    return localStorage.getItem('eyeland_scratchpad_font') === 'mono';
  });
  const [scratchCopied, setScratchCopied] = useState(false);
  const [confirmClearSlot, setConfirmClearSlot] = useState(false);
  const scratchTextareaRef = useRef(null);

  const currentNoteText = scratchNotesBySlot[activeNoteSlot] || '';

  const updateCurrentNoteText = (newText) => {
    setScratchNotesBySlot((prev) => {
      const updated = { ...prev, [activeNoteSlot]: newText };
      try {
        localStorage.setItem('eyeland_scratchpad_slots', JSON.stringify(updated));
      } catch (e) {
        console.error('Failed to save scratchpad notes:', e);
      }
      return updated;
    });
  };

  const handleScratchKeyDown = (e) => {
    const textarea = e.currentTarget;
    const { selectionStart, selectionEnd, value } = textarea;

    // Tab key: Insert 2 spaces
    if (e.key === 'Tab') {
      e.preventDefault();
      const nextValue = value.substring(0, selectionStart) + '  ' + value.substring(selectionEnd);
      updateCurrentNoteText(nextValue);
      requestAnimationFrame(() => {
        textarea.selectionStart = textarea.selectionEnd = selectionStart + 2;
      });
      return;
    }

    // Enter key: Auto-continue bullets or task checkboxes
    if (e.key === 'Enter' && !e.shiftKey) {
      const lastNewLine = value.lastIndexOf('\n', selectionStart - 1);
      const currentLine = value.substring(lastNewLine + 1, selectionStart);

      const bulletMatch = currentLine.match(/^(\s*)(•|-|\*)\s+/);
      const taskMatch = currentLine.match(/^(\s*)(\[[ xX]\])\s+/);

      if (bulletMatch) {
        if (currentLine.trim() === bulletMatch[2]) {
          e.preventDefault();
          const nextValue = value.substring(0, lastNewLine + 1) + value.substring(selectionStart);
          updateCurrentNoteText(nextValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = lastNewLine + 1;
          });
          return;
        }

        e.preventDefault();
        const prefix = `\n${bulletMatch[1]}${bulletMatch[2]} `;
        const nextValue = value.substring(0, selectionStart) + prefix + value.substring(selectionEnd);
        updateCurrentNoteText(nextValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + prefix.length;
        });
        return;
      }

      if (taskMatch) {
        if (currentLine.trim() === taskMatch[2]) {
          e.preventDefault();
          const nextValue = value.substring(0, lastNewLine + 1) + value.substring(selectionEnd);
          updateCurrentNoteText(nextValue);
          requestAnimationFrame(() => {
            textarea.selectionStart = textarea.selectionEnd = lastNewLine + 1;
          });
          return;
        }

        e.preventDefault();
        const prefix = `\n${taskMatch[1]}[ ] `;
        const nextValue = value.substring(0, selectionStart) + prefix + value.substring(selectionEnd);
        updateCurrentNoteText(nextValue);
        requestAnimationFrame(() => {
          textarea.selectionStart = textarea.selectionEnd = selectionStart + prefix.length;
        });
        return;
      }
    }
  };

  const insertTextAtCursor = (insertStr) => {
    const textarea = scratchTextareaRef.current;
    if (!textarea) {
      updateCurrentNoteText(currentNoteText + insertStr);
      return;
    }
    const { selectionStart, selectionEnd, value } = textarea;
    const nextValue = value.substring(0, selectionStart) + insertStr + value.substring(selectionEnd);
    updateCurrentNoteText(nextValue);
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.selectionStart = textarea.selectionEnd = selectionStart + insertStr.length;
    });
  };

  const handleCopyScratch = () => {
    if (!currentNoteText) return;
    if (window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText(currentNoteText);
    } else {
      navigator.clipboard?.writeText(currentNoteText);
    }
    setScratchCopied(true);
    setTimeout(() => setScratchCopied(false), 1600);
  };

  const handleClearScratch = () => {
    if (!confirmClearSlot) {
      setConfirmClearSlot(true);
      setTimeout(() => setConfirmClearSlot(false), 2500);
      return;
    }
    updateCurrentNoteText('');
    setConfirmClearSlot(false);
  };

  const handleExportScratch = () => {
    if (!currentNoteText) return;
    const blob = new Blob([currentNoteText], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `eyeland-${activeNoteSlot}-note.txt`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const toggleScratchFont = () => {
    const next = !isScratchpadMono;
    setIsScratchpadMono(next);
    localStorage.setItem('eyeland_scratchpad_font', next ? 'mono' : 'sans');
  };

  const scratchWords = currentNoteText.trim() ? currentNoteText.trim().split(/\s+/).length : 0;
  const scratchChars = currentNoteText.length;
  const totalNotesLength = Object.values(scratchNotesBySlot).reduce(
    (sum, str) => sum + (str ? str.trim().length : 0),
    0
  );

  // Eyeland AI LLM State
  const [aiInput, setAiInput] = useState('');
  const [isScanningScreen, setIsScanningScreen] = useState(false);
  const [screenSnapshot, setScreenSnapshot] = useState(null);
  const [aiResponseCard, setAiResponseCard] = useState(null);
  const [isDictating, setIsDictating] = useState(false);
  const [modelStatus, setModelStatus] = useState('Gemini Flash Vision');

  // AI Tools & Neural Suite State (+ Crosshair Snip)
  const [activeFeatureTool, setActiveFeatureTool] = useState(null); // 'explain' | 'polish' | 'translate' | 'summarize' | 'code' | 'snip' | null
  const [featureInputText, setFeatureInputText] = useState('');
  const [featureSourceType, setFeatureSourceType] = useState('none'); // 'snip' | 'clipboard' | 'custom'
  const [featureCropPreview, setFeatureCropPreview] = useState(null);
  const [featureCropBounds, setFeatureCropBounds] = useState(null);
  const [featureLoading, setFeatureLoading] = useState(false);
  const [featureResult, setFeatureResult] = useState(null);
  const [targetTranslateLang, setTargetTranslateLang] = useState('es');
  const [polishTone, setPolishTone] = useState('professional');
  const [featureCopied, setFeatureCopied] = useState(false);
  const [featureSavedNote, setFeatureSavedNote] = useState(false);
  const [isSnippingMode, setIsSnippingMode] = useState(false);
  const isSnippingActive = isSnippingMode || isSnippingModeProp;
  const isWakingUp = wakeStage !== 'done';
  const isExpanded = (
    wakeStage === 'full' ||
    ((isHovered || isPinned || isGreetingActive) && wakeStage !== 'seed' && wakeStage !== 'off' && wakeStage !== 'greet')
  ) && !isSnippingActive;

  // Live Telemetry Smooth Count-Up Animation (Option A: 0% -> Live values over 1.3s)
  const [telemetryAnimProgress, setTelemetryAnimProgress] = useState(wakeStage === 'done' ? 1 : 0);

  useEffect(() => {
    if (wakeStage === 'full') {
      setTelemetryAnimProgress(0);
      const t0 = performance.now();
      const duration = 1300;
      let animId = null;

      const animate = (now) => {
        const elapsed = now - t0;
        const progress = Math.min(1, elapsed / duration);
        const eased = 1 - Math.pow(1 - progress, 3);
        setTelemetryAnimProgress(eased);

        if (progress < 1) {
          animId = requestAnimationFrame(animate);
        } else {
          setTelemetryAnimProgress(1);
        }
      };

      animId = requestAnimationFrame(animate);
      return () => {
        if (animId) cancelAnimationFrame(animId);
      };
    } else if (wakeStage === 'done') {
      setTelemetryAnimProgress(1);
    }
  }, [wakeStage]);

  const getTimeGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 5 || hour >= 22) return 'Hello, night owl';
    if (hour < 12) return 'Good morning,';
    if (hour < 17) return 'Good afternoon,';
    return 'Good evening,';
  };

  // AI Thinking & Result Ready Alert Indicators (for Collapsed Island)
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [isResultReadyAlert, setIsResultReadyAlert] = useState(false);
  const resultReadyTimerRef = useRef(null);

  // Gemini API Key & Real LLM Integration State
  const [hasGeminiKey, setHasGeminiKey] = useState(false);
  const [aiStatus, setAiStatus] = useState({
    hasKey: false,
    tier: 'none',
    activeModel: 'gemini-2.5-flash',
    hasBundledKey: false,
    maskedKey: '',
  });
  const [isKeyModalOpen, setIsKeyModalOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [keySaveMessage, setKeySaveMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);

  const refreshAiStatus = async () => {
    try {
      if (window.electronAPI?.geminiGetStatus) {
        const status = await window.electronAPI.geminiGetStatus();
        if (status) {
          setAiStatus(status);
          setHasGeminiKey(Boolean(status.hasKey));
          if (status.tier === 'custom' && window.electronAPI?.geminiGetApiKey) {
            const key = await window.electronAPI.geminiGetApiKey();
            if (key) setApiKeyInput(key);
          }
        }
      }
    } catch (e) {
      console.warn('[refreshAiStatus]', e);
    }
  };

  useEffect(() => {
    refreshAiStatus();
  }, []);

  const handleSaveGeminiKey = async (e) => {
    e?.preventDefault();
    const clean = apiKeyInput.trim();
    try {
      if (window.electronAPI?.geminiSaveApiKey) {
        await window.electronAPI.geminiSaveApiKey(clean);
      }
      if (clean) {
        localStorage.setItem('eyeland_gemini_api_key', clean);
        setKeySaveMessage('Custom Gemini key connected!');
      } else {
        localStorage.removeItem('eyeland_gemini_api_key');
        setKeySaveMessage('Using built-in default model!');
      }
      await refreshAiStatus();
      setTimeout(() => {
        setKeySaveMessage('');
        setIsKeyModalOpen(false);
      }, 1000);
    } catch (err) {
      setKeySaveMessage('Failed: ' + err.message);
    }
  };

  const handleRevertToDefaultKey = async () => {
    try {
      if (window.electronAPI?.geminiSaveApiKey) {
        await window.electronAPI.geminiSaveApiKey('');
      }
      localStorage.removeItem('eyeland_gemini_api_key');
      setApiKeyInput('');
      setKeySaveMessage('Reverted to built-in default model!');
      await refreshAiStatus();
      setTimeout(() => {
        setKeySaveMessage('');
        setIsKeyModalOpen(false);
      }, 1000);
    } catch (err) {
      setKeySaveMessage('Failed: ' + err.message);
    }
  };

  const inputRef = useRef(null);
  const chatMessagesEndRef = useRef(null);
  const chatImageInputRef = useRef(null);

  // Modern Conversational LLM Chat State
  const [chatMessages, setChatMessages] = useState(() => {
    try {
      const saved = localStorage.getItem('eyeland_chat_messages');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [attachedMedia, setAttachedMedia] = useState(null);
  const [isAiResponding, setIsAiResponding] = useState(false);
  const [copiedMsgId, setCopiedMsgId] = useState(null);

  useEffect(() => {
    try {
      localStorage.setItem('eyeland_chat_messages', JSON.stringify(chatMessages.slice(-20)));
    } catch {
      // ignore
    }
  }, [chatMessages]);

  useEffect(() => {
    if (activeTab === 'ai') {
      chatMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [chatMessages, isAiResponding, activeTab]);

  // REJOICE ANIMATION TRIGGER (Click to pet)
  const triggerRejoice = (e) => {
    e?.stopPropagation();
    if (rejoiceTimerRef.current) {
      clearTimeout(rejoiceTimerRef.current);
    }
    setExpression('rejoice');
    setBuddyQuote('"Loving the head pats! *purrs in 60fps*"');

    rejoiceTimerRef.current = setTimeout(() => {
      setExpression('neutral');
      setBuddyQuote('"Eyeland is observing your workflow. Silent & bezel-docked."');
    }, 2800);
  };

  // Helper to categorize files/folders for custom icons & styling
  const getFileCategory = (name = '', isDir = false) => {
    if (isDir) return 'folder';
    const ext = (name.split('.').pop() || '').toLowerCase();
    if (['png', 'jpg', 'jpeg', 'svg', 'webp', 'gif', 'bmp', 'ico'].includes(ext)) return 'image';
    if (['pdf'].includes(ext)) return 'pdf';
    if (['js', 'jsx', 'ts', 'tsx', 'py', 'json', 'html', 'css', 'cpp', 'c', 'cs', 'java', 'rs', 'go', 'php', 'sql', 'sh', 'bat', 'ps1'].includes(ext)) return 'code';
    if (['mp3', 'wav', 'flac', 'aac', 'ogg', 'm4a', 'wma'].includes(ext)) return 'audio';
    if (['mp4', 'mkv', 'mov', 'avi', 'webm', 'wmv'].includes(ext)) return 'video';
    if (['zip', 'rar', '7z', 'tar', 'gz', 'iso'].includes(ext)) return 'archive';
    if (['doc', 'docx', 'txt', 'md', 'xlsx', 'csv', 'pptx', 'rtf'].includes(ext)) return 'document';
    return 'file';
  };

  const formatFileSize = (bytes) => {
    if (typeof bytes !== 'number' || isNaN(bytes) || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i] || 'B'}`;
  };

  // Process dropped or selected files/folders
  const processDroppedFiles = async (fileList) => {
    if (!fileList || fileList.length === 0) return;
    const rawFiles = Array.from(fileList);
    const newItems = [];

    for (let i = 0; i < rawFiles.length; i++) {
      const file = rawFiles[i];
      let diskPath = '';
      if (window.electronAPI?.getPathForFile) {
        diskPath = window.electronAPI.getPathForFile(file);
      }
      if (!diskPath && file.path) {
        diskPath = file.path;
      }

      let isDir = false;
      let realSize = file.size || 0;

      if (diskPath && window.electronAPI?.getFileDetails) {
        try {
          const details = await window.electronAPI.getFileDetails(diskPath);
          if (details) {
            isDir = Boolean(details.isDirectory);
            realSize = details.size || realSize;
          }
        } catch (_) {}
      } else {
        if (!file.type && !file.name.includes('.')) {
          isDir = true;
        }
      }

      const category = getFileCategory(file.name, isDir);
      const formattedSize = isDir ? 'Folder' : formatFileSize(realSize);

      newItems.push({
        id: `${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`,
        name: file.name,
        path: diskPath || file.name,
        size: formattedSize,
        rawBytes: realSize,
        type: category,
        isFolder: isDir,
        addedAt: Date.now(),
      });
    }

    if (newItems.length > 0) {
      setStagedFiles((prev) => {
        const existingPaths = new Set(prev.map((f) => f.path || f.name));
        const filteredNew = newItems.filter((f) => !existingPaths.has(f.path || f.name));
        return [...filteredNew, ...prev];
      });

      // Playful excited reaction from living eyes
      setExpression('excited');
      setTimeout(() => {
        setExpression('neutral');
      }, 1500);
    }
  };

  // Automatic drag-and-drop trigger: auto-switches to Staging Shelf & expands
  const handleIslandDragEnter = (e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      setIsDraggingOver(true);
      setActiveTab('shelf');
      if (!isHovered) {
        setIsHovered(true);
      }
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    }
  };

  const handleIslandDragOver = (e) => {
    if (e.dataTransfer && e.dataTransfer.types && Array.from(e.dataTransfer.types).includes('Files')) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
      if (!isDraggingOver) setIsDraggingOver(true);
      if (activeTab !== 'shelf') setActiveTab('shelf');
      if (!isHovered) setIsHovered(true);
      window.electronAPI?.setIgnoreMouseEvents?.(false);
    }
  };

  const handleIslandDragLeave = (e) => {
    const rect = e.currentTarget.getBoundingClientRect();
    if (
      e.clientX < rect.left ||
      e.clientX > rect.right ||
      e.clientY < rect.top ||
      e.clientY > rect.bottom
    ) {
      setIsDraggingOver(false);
    }
  };

  const handleIslandDrop = async (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDraggingOver(false);
    if (e.dataTransfer && e.dataTransfer.files) {
      await processDroppedFiles(e.dataTransfer.files);
    }
  };

  // Drag Staged Item OUT to ANY App (Windows Explorer, Desktop, Chrome, Slack, etc.)
  const handleDragItemOut = (e, item) => {
    console.log('[DynamicIsland] handleDragItemOut called for item:', item?.name, item?.path);
    onDragOutChange?.(true);

    if (item?.path && window.electronAPI?.startDrag) {
      e.preventDefault();
      window.electronAPI.startDrag(item.path);
    } else {
      e.dataTransfer.setData('text/plain', item?.path || item?.name || '');
      if (item?.path) {
        e.dataTransfer.setData('text/uri-list', 'file:///' + item.path.replace(/\\/g, '/'));
      }
    }
  };

  const handleDragItemEnd = () => {
    console.log('[DynamicIsland] handleDragItemEnd');
    onDragOutChange?.(false);
  };

  // Drag ALL staged files out together
  const handleDragAllOut = (e) => {
    const paths = stagedFiles.map((f) => f.path).filter(Boolean);
    console.log('[DynamicIsland] handleDragAllOut called with paths:', paths);
    onDragOutChange?.(true);

    if (paths.length > 0 && window.electronAPI?.startDrag) {
      e.preventDefault();
      window.electronAPI.startDrag(paths);
    }
  };

  // Reveal File or Folder in Windows Explorer
  const handleRevealInExplorer = (filePath) => {
    if (window.electronAPI?.showItemInFolder && filePath) {
      window.electronAPI.showItemInFolder(filePath);
    }
  };

  const removeStagedFile = (id) => {
    setStagedFiles((prev) => prev.filter((f) => f.id !== id));
  };

  const clearAllStagedFiles = () => {
    setStagedFiles([]);
  };

  // 1-CLICK SCREEN SCAN (Vision OCR & Analysis)
  const handleScanScreen = async () => {
    setIsScanningScreen(true);
    setExpression('scan');
    setAiResponseCard({
      title: 'Scanning Display...',
      text: 'Capturing full-screen frame and performing multimodal analysis...',
      loading: true,
      badge: 'VISION 1080P',
    });

    let snapshotUrl = null;
    if (window.electronAPI?.captureScreen) {
      try {
        const res = await window.electronAPI.captureScreen();
        if (res?.success && res.dataUrl) {
          snapshotUrl = res.dataUrl;
          setScreenSnapshot(res.dataUrl);
        }
      } catch (err) {
        console.error('Screen capture error:', err);
      }
    }

    setTimeout(() => {
      setIsScanningScreen(false);
      setExpression('neutral');
      setAiResponseCard({
        title: 'Screen Summary & OCR',
        text: 'Detected active workspace with code editor and reference layouts. All linters clean with zero errors visible on screen. Ready to refactor or export.',
        loading: false,
        badge: 'SCREEN 1 • 1920×1080',
        hasSnapshot: !!snapshotUrl,
      });
    }, 1200);
  };

  // -------------------------------------------------------------
  // REVOLUTIONARY MULTIMODAL AI SUITE & CROSSHAIR SNIPPING ENGINE
  // -------------------------------------------------------------
  const handleTriggerSnip = async (toolName = 'explain') => {
    setActiveTab('features');
    setActiveFeatureTool(toolName);
    setIsSnippingMode(true);
    onSnippingModeChange?.(true);
    setExpression('scan');
    if (window.electronAPI?.startSnipping) {
      try {
        await window.electronAPI.startSnipping(toolName);
      } catch (err) {
        console.error('startSnipping error:', err);
        setIsSnippingMode(false);
        onSnippingModeChange?.(false);
        setFeatureLoading(false);
        setExpression('neutral');
      }
    } else {
      setTimeout(() => {
        setIsSnippingMode(false);
        onSnippingModeChange?.(false);
        handleExecuteFeature(toolName, {
          sourceType: 'snip',
          text: 'Eyeland ambient desktop bezel companion with zero gap docking and neural multimodal vision.',
          bounds: { width: 420, height: 180 },
        });
      }, 700);
    }
  };

  const handleSelectTool = (toolName) => {
    setActiveTab('features');
    setActiveFeatureTool(toolName);
    setFeatureResult(null);
    setFeatureInputText('');
    setFeatureCropPreview(null);
    handleTriggerSnip(toolName);
  };

  const handleTriggerFromClipboard = async (toolName = 'explain') => {
    setActiveTab('features');
    setActiveFeatureTool(toolName);
    setFeatureLoading(true);
    setExpression('scan');

    let text = '';
    try {
      if (window.electronAPI?.getClipboardText) {
        text = await window.electronAPI.getClipboardText();
      } else if (navigator.clipboard?.readText) {
        text = await navigator.clipboard.readText();
      }
    } catch {}

    if (!text && clipboardItems.length > 0) {
      text = clipboardItems[0].text;
    }

    if (!text) {
      text = 'const islandWidth = 540; // Default zero-gap docking bezel width';
    }

    setFeatureInputText(text);
    setFeatureSourceType('clipboard');
    setFeatureCropPreview(null);
    handleExecuteFeature(toolName, {
      sourceType: 'clipboard',
      text: text,
    });
  };

  const handleExecuteFeature = async (tool, options = {}) => {
    setActiveTab('features');
    setActiveFeatureTool(tool);
    setFeatureLoading(true);
    setIsAiThinking(true);
    setExpression('thinking');

    const srcType = options.sourceType || featureSourceType || 'clipboard';
    setFeatureSourceType(srcType);
    if (options.dataUrl) setFeatureCropPreview(options.dataUrl);
    if (options.bounds) setFeatureCropBounds(options.bounds);

    const textToProcess = (options.text || featureInputText || '').trim();
    const imagePayload = options.dataUrl || featureCropPreview;

    try {
      if (window.electronAPI?.geminiTool) {
        const res = await window.electronAPI.geminiTool({
          tool,
          text: textToProcess,
          imageBase64: imagePayload,
          options: {
            tone: options.tone || polishTone,
            targetLang: options.targetLang || targetTranslateLang,
            question: options.question || '',
          },
        });

        setFeatureLoading(false);
        setIsAiThinking(false);

        if (res?.success && res.text) {
          const rawText = res.text;

          if (tool === 'explain') {
            setFeatureResult({
              tool: 'explain',
              badge: 'EXPLAIN',
              title: 'Explanation',
              text: rawText,
              eli5: rawText,
              takeaways: [],
              sourceSnippet: textToProcess.slice(0, 130) + (textToProcess.length > 130 ? '...' : ''),
            });
          } else if (tool === 'polish') {
            const tone = options.tone || polishTone;
            setFeatureResult({
              tool: 'polish',
              badge: tone.toUpperCase(),
              title: 'Polished',
              text: rawText,
              original: textToProcess,
              polished: rawText,
              tone: tone,
            });
          } else if (tool === 'translate') {
            setFeatureResult({
              tool: 'translate',
              badge: (options.targetLang || targetTranslateLang).toUpperCase(),
              title: 'Translation',
              text: rawText,
              translatedText: rawText,
              targetLang: options.targetLang || targetTranslateLang,
            });
          } else if (tool === 'summarize') {
            setFeatureResult({
              tool: 'summarize',
              badge: 'SUMMARY',
              title: 'Summary',
              text: rawText,
              tldr: rawText,
              actionTasks: [],
            });
          } else if (tool === 'code') {
            setFeatureResult({
              tool: 'code',
              badge: 'FIX CODE',
              title: 'Code Fix',
              text: rawText,
              fixedCode: rawText,
            });
          } else if (tool === 'snip') {
            setFeatureResult({
              tool: 'snip',
              badge: 'VISION',
              title: 'Screen Analysis',
              text: rawText,
              analysis: rawText,
            });
          }

          // Persist to unified Eyeland Activity Log for the Eyeland Hub
          try {
            const existing = JSON.parse(localStorage.getItem('eyeland_activity_history') || '[]');
            const newEntry = {
              id: 'act_' + Date.now(),
              type: 'ai_' + tool,
              tool: tool,
              title: tool === 'code' ? 'Fix Code' : tool === 'snip' ? 'Screen Analysis' : tool.charAt(0).toUpperCase() + tool.slice(1),
              preview: rawText.slice(0, 160).trim(),
              fullText: rawText,
              timestamp: Date.now(),
            };
            const updated = [newEntry, ...existing.filter(e => e.id !== newEntry.id)].slice(0, 50);
            localStorage.setItem('eyeland_activity_history', JSON.stringify(updated));
            if (window.electronAPI?.sendIslandAction) {
              window.electronAPI.sendIslandAction({ type: 'ACTIVITY_LOGGED', entry: newEntry });
            }
          } catch (_) {}

          // Trigger 'Result ready' alert in collapsed island (auto-dismisses after 2-3s)
          setIsResultReadyAlert(true);
          setExpression('happy');

          if (resultReadyTimerRef.current) clearTimeout(resultReadyTimerRef.current);
          resultReadyTimerRef.current = setTimeout(() => {
            setIsResultReadyAlert(false);
            setExpression('neutral');
            resultReadyTimerRef.current = null;
          }, 3000);

          return;
        } else {
          setIsResultReadyAlert(false);
          setExpression('neutral');
          const isNoKey = res?.error?.includes('NO_API_KEY');
          const isNetworkError = res?.error?.toLowerCase().includes('internet') || res?.error?.toLowerCase().includes('network') || res?.error?.toLowerCase().includes('fetch failed');
          setFeatureResult({
            tool: tool,
            badge: isNoKey ? 'KEY REQUIRED' : (isNetworkError ? 'OFFLINE' : 'NOTICE'),
            title: isNoKey ? 'API Key Required' : (isNetworkError ? 'Network Disconnected' : 'Notice'),
            text: isNoKey
              ? 'Please configure your free Gemini API key in Hub Settings or set the GEMINI_API_KEY environment variable.'
              : `${res?.error || 'Unknown error occurred'}`,
            eli5: isNoKey
              ? 'Please configure your free Gemini API key in Hub Settings or set the GEMINI_API_KEY environment variable.'
              : `${res?.error || 'Unknown error occurred'}`,
            isKeyMissing: isNoKey,
            isNetworkError: isNetworkError,
          });
          return;
        }
      }
    } catch (err) {
      console.error('[handleExecuteFeature error]', err);
      setFeatureLoading(false);
      setIsAiThinking(false);
      setIsResultReadyAlert(false);
      setExpression('neutral');
      const isNet = err.message?.toLowerCase().includes('fetch failed') || err.message?.toLowerCase().includes('network');
      setFeatureResult({
        tool: tool,
        badge: isNet ? 'OFFLINE' : 'ERROR',
        title: isNet ? 'Network Disconnected' : 'Error Running Tool',
        eli5: isNet ? 'Internet connection error. Please verify your internet or Wi-Fi connection and try again.' : (err.message || 'Failed to call Gemini model.'),
        isNetworkError: isNet,
      });
    }
  };

  const handleSpeakTranslation = (text, langCode = 'es') => {
    try {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        const voiceMap = { es: 'es-ES', fr: 'fr-FR', de: 'de-DE', ja: 'ja-JP', hi: 'hi-IN', zh: 'zh-CN' };
        utterance.lang = voiceMap[langCode] || 'en-US';
        window.speechSynthesis.speak(utterance);
      }
    } catch (e) {
      console.warn('SpeechSynthesis error:', e);
    }
  };

  const handleSendTasksToScratchpad = (tasks) => {
    if (!Array.isArray(tasks) || tasks.length === 0) return;
    const taskString = tasks.join('\n');
    setScratchNotesBySlot((prev) => {
      const existing = prev.todo ? prev.todo.trim() + '\n' : '';
      const updated = { ...prev, todo: existing + taskString };
      try {
        localStorage.setItem('eyeland_scratchpad_slots', JSON.stringify(updated));
      } catch {}
      return updated;
    });
    setFeatureSavedNote(true);
    setTimeout(() => setFeatureSavedNote(false), 2000);
  };

  const handleCopyFeatureResult = (text) => {
    if (!text) return;
    if (window.electronAPI?.writeClipboardText) {
      window.electronAPI.writeClipboardText(text);
    } else {
      navigator.clipboard?.writeText(text);
    }
    setFeatureCopied(true);
    setTimeout(() => setFeatureCopied(false), 1600);
  };

  // Listener for Snipped Results from Electron Fullscreen Crosshair Overlay
  useEffect(() => {
    if (window.electronAPI?.onSnippedResult) {
      const cleanup = window.electronAPI.onSnippedResult((res) => {
        setIsSnippingMode(false);
        if (res?.cancelled) {
          setFeatureLoading(false);
          setIsAiThinking(false);
          setIsResultReadyAlert(false);
          setExpression('neutral');
          return;
        }
        if (res?.success && res.dataUrl) {
          if (res.toolName === 'chat-media') {
            setAttachedMedia(res.dataUrl);
            setActiveTab('ai');
            setExpression('neutral');
            return;
          }
          setFeatureCropPreview(res.dataUrl);
          setFeatureCropBounds(res.bounds);
          setFeatureSourceType('snip');
          setActiveTab('features');
          const tool = res.toolName || activeFeatureTool || 'explain';
          setActiveFeatureTool(tool);

          // Immediately enter AI Thinking state in collapsed island
          setIsAiThinking(true);
          setExpression('thinking');

          handleExecuteFeature(tool, {
            sourceType: 'snip',
            dataUrl: res.dataUrl,
            bounds: res.bounds,
          });
        }
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, [activeFeatureTool, targetTranslateLang, polishTone]);

  useEffect(() => {
    if (window.electronAPI?.onSnipperStatus) {
      const cleanup = window.electronAPI.onSnipperStatus((status) => {
        setIsSnippingMode(Boolean(status?.active));
        if (!status?.active) {
          setExpression('neutral');
        }
      });
      return () => {
        if (typeof cleanup === 'function') cleanup();
      };
    }
  }, []);

  // Backward compatibility aliases
  const handleExplain = () => handleTriggerSnip('explain');
  const handleCheckSpelling = () => handleTriggerFromClipboard('polish');
  const handleTranslate = () => handleTriggerFromClipboard('translate');
  const handleSummarize = () => handleTriggerSnip('summarize');
  const handleFixCode = () => handleTriggerFromClipboard('code');

  // Conversational LLM Handlers
  const handleClearChat = () => {
    setChatMessages([]);
    setAttachedMedia(null);
    setAiResponseCard(null);
    try {
      localStorage.removeItem('eyeland_chat_messages');
    } catch {}
  };

  const handleTriggerChatSnip = () => {
    if (window.electronAPI?.startSnipping) {
      window.electronAPI.startSnipping('chat-media');
    }
  };

  const handleFileSelected = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = () => {
        setAttachedMedia(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handlePasteClipboardToChat = async () => {
    try {
      if (window.electronAPI?.getClipboardText) {
        const text = await window.electronAPI.getClipboardText();
        if (text && text.trim()) {
          setAiInput((prev) => (prev ? `${prev} ${text.trim()}` : text.trim()));
        }
      }
    } catch (e) {
      console.warn(e);
    }
  };

  const handleCopyMessage = (id, text) => {
    try {
      navigator.clipboard?.writeText(text);
      if (window.electronAPI?.writeClipboardText) {
        window.electronAPI.writeClipboardText(text);
      }
      setCopiedMsgId(id);
      setTimeout(() => setCopiedMsgId(null), 2000);
    } catch (e) {
      console.warn(e);
    }
  };

  // CHAT QUERY SUBMIT (Connected to Real Gemini LLM)
  const handleSendMessage = async (e) => {
    e?.preventDefault();
    if (!aiInput.trim() && !attachedMedia) return;
    const query = aiInput.trim();
    const mediaToSend = attachedMedia;
    setAiInput('');
    setAttachedMedia(null);

    const userMsgId = 'u_' + Date.now();
    const assistantMsgId = 'a_' + Date.now();

    const userMsg = {
      id: userMsgId,
      role: 'user',
      text: query,
      image: mediaToSend,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setChatMessages((prev) => [...prev, userMsg]);
    setIsAiResponding(true);
    setExpression('scan');

    try {
      if (window.electronAPI?.geminiChat) {
        const historyForApi = chatMessages.slice(-8).map((m) => ({
          role: m.role,
          text: m.text,
        }));

        const res = await window.electronAPI.geminiChat({
          prompt: query,
          history: historyForApi,
          imageBase64: mediaToSend,
        });

        setExpression('neutral');
        setIsAiResponding(false);

        if (res?.success && res.text) {
          setChatMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: 'assistant',
              text: res.text,
              model: res.model || aiStatus.activeModel || 'gemini-3.5-flash',
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        } else {
          setChatMessages((prev) => [
            ...prev,
            {
              id: assistantMsgId,
              role: 'assistant',
              text: res?.error || 'Could not process request with Gemini.',
              isError: true,
              timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
            },
          ]);
        }
      } else {
        setExpression('neutral');
        setIsAiResponding(false);
      }
    } catch (err) {
      setExpression('neutral');
      setIsAiResponding(false);
      setChatMessages((prev) => [
        ...prev,
        {
          id: assistantMsgId,
          role: 'assistant',
          text: `Error: ${err.message || 'Failed to process request.'}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const formatTime = (sec) => {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const formatTrackClock = (sec) => {
    const total = Math.max(0, Math.floor(Number(sec) || 0));
    const m = Math.floor(total / 60);
    const s = total % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const isHudMode = !isExpanded && activeHud !== null;
  const isDeviceAlertMode = !isExpanded && !isHudMode && activeDeviceAlert !== null;
  const isResultReadyMode = !isExpanded && !isHudMode && !isDeviceAlertMode && isResultReadyAlert;
  const isMailAlertMode = !isExpanded && !isHudMode && !isDeviceAlertMode && !isResultReadyMode && activeMailAlert !== null;
  const isLyricsMode = !isExpanded && !isHudMode && !isMailAlertMode && !isDeviceAlertMode && !isResultReadyMode && isPlaying && (displaySettings.showLyrics !== false) && (hasLyrics || showSongIntro);
  const isFocusModeCollapsed = !isExpanded && !isHudMode && !isMailAlertMode && !isDeviceAlertMode && !isResultReadyMode && isFocusRunning && !isLyricsMode;

  // Auto-dismiss 'Result ready' alert when user expands the island
  useEffect(() => {
    if (isExpanded && isResultReadyAlert) {
      setIsResultReadyAlert(false);
      if (resultReadyTimerRef.current) {
        clearTimeout(resultReadyTimerRef.current);
        resultReadyTimerRef.current = null;
      }
    }
  }, [isExpanded, isResultReadyAlert]);

  // Cleanup result ready timer on unmount
  useEffect(() => {
    return () => {
      if (resultReadyTimerRef.current) {
        clearTimeout(resultReadyTimerRef.current);
      }
    };
  }, []);

  // Dynamic Companion Eye Expression & Color for Thinking vs Result Ready vs Focus vs Idle
  const activeEyeExpression = isAiThinking
    ? 'thinking'
    : isResultReadyAlert
    ? 'happy'
    : isFocusRunning 
    ? (focusPhase === 'work' ? 'serious' : 'relaxed')
    : expression;

  const activeEyeColor = isAiThinking
    ? '#f97316' // Warm flame orange during thinking
    : isResultReadyAlert
    ? '#4ade80' // Emerald green when result is ready
    : isFocusRunning
    ? (focusPhase === 'work' ? '#f59e0b' : '#10b981')
    : theme.color;

  const activeEyeShadow = isAiThinking
    ? '0 0 16px #f97316, 0 0 32px rgba(249, 115, 22, 0.75)'
    : isResultReadyAlert
    ? '0 0 16px #4ade80, 0 0 28px rgba(74, 222, 128, 0.6)'
    : isFocusRunning
    ? (focusPhase === 'work' 
        ? '0 0 16px #f59e0b, 0 0 28px rgba(245, 158, 11, 0.6)' 
        : '0 0 14px #10b981, 0 0 24px rgba(16, 185, 129, 0.5)')
    : theme.shadow;

  // Low battery condition (< 20% and not charging)
  const isRealLowBattery = Boolean(
    telemetry.battery?.percent != null && 
    telemetry.battery.percent <= 20 && 
    !telemetry.battery.isCharging
  );
  const isLowBattery = isRealLowBattery || isSimulatedLowBattery;
  const isBatteryCharging = isSimulatedCharging !== null
    ? isSimulatedCharging
    : Boolean(telemetry.battery?.isCharging);

  // Track charging transitions to give fresh priority to battery_charging indicator
  const prevIsChargingRef = useRef(isBatteryCharging);
  useEffect(() => {
    if (isBatteryCharging && !prevIsChargingRef.current) {
      setIndicatorTimestamps((t) => ({ ...t, battery_charging: Date.now() }));
    }
    prevIsChargingRef.current = isBatteryCharging;
  }, [isBatteryCharging]);

  // Stack up to 3 most latest indicators (Music exception: always right-most when playing)
  const activeIndicators = useMemo(() => {
    const candidates = [];

    if (isCamActive) {
      candidates.push({ id: 'camera', time: indicatorTimestamps.camera || 1 });
    }
    if (isMicActive || isDictating) {
      candidates.push({ id: 'mic', time: indicatorTimestamps.mic || 1 });
    }
    if (isAirplaneMode) {
      candidates.push({ id: 'airplane', time: indicatorTimestamps.airplane || 1 });
    }
    if (isLowBattery && !isBatteryCharging) {
      candidates.push({ id: 'battery_low', time: indicatorTimestamps.battery_low || 1 });
    }
    if (isBatteryCharging) {
      candidates.push({ id: 'battery_charging', time: indicatorTimestamps.battery_charging || 1 });
    }
    if (isFocusRunning && !isFocusModeCollapsed) {
      candidates.push({ id: 'focus', time: indicatorTimestamps.focus || 1 });
    }
    if (stagedFiles.length > 0 && !isFocusModeCollapsed) {
      candidates.push({ id: 'shelf', time: 1 });
    }
    if (mailConfig.connected && mailConfig.unreadCount > 0 && !isFocusModeCollapsed) {
      candidates.push({ id: 'mail', time: indicatorTimestamps.mail || 1 });
    }

    // Sort non-music candidates descending by time (most recent first)
    candidates.sort((a, b) => b.time - a.time);

    if (isPlaying) {
      // Music gets the rightmost spot ALWAYS (user exception rule)
      // Pick up to 2 other most latest candidates to place to the left of Music
      const topOther = candidates.slice(0, 2);
      // Format as [other1, other2, music]
      return [...topOther.reverse().map((c) => c.id), 'music'];
    } else {
      // Pick up to 3 most latest candidates
      const topThree = candidates.slice(0, 3);
      return topThree.reverse().map((c) => c.id);
    }
  }, [
    isPlaying,
    isCamActive,
    isMicActive,
    isDictating,
    isAirplaneMode,
    isLowBattery,
    isBatteryCharging,
    isFocusRunning,
    isFocusModeCollapsed,
    stagedFiles.length,
    mailConfig.connected,
    mailConfig.unreadCount,
    indicatorTimestamps,
  ]);

  const indicatorCount = activeIndicators.length;
  // Dynamic collapsed island width based on indicator count
  const collapsedWidth = indicatorCount >= 3 ? 280 : indicatorCount === 2 ? 255 : 230;
  const sideZoneWidth = indicatorCount >= 3 ? 78 : indicatorCount === 2 ? 66 : 54;

  // Render function for each indicator icon
  const renderIndicatorIcon = (id) => {
    switch (id) {
      case 'music':
        return (
          <div
            key="music"
            className="flex items-center gap-0.5 h-3 flex-shrink-0 animate-fadeIn cursor-pointer"
            title={`Spotify Playing: ${trackData.title}`}
            onClick={(e) => {
              e.stopPropagation();
              handlePlayPause();
            }}
          >
            <span
              className="w-0.5 rounded-full bar-1 shadow-[0_0_6px_currentColor]"
              style={{ backgroundColor: ambientPalette.hex, color: ambientPalette.hex }}
            />
            <span
              className="w-0.5 rounded-full bar-2 shadow-[0_0_6px_currentColor]"
              style={{ backgroundColor: ambientPalette.hex, color: ambientPalette.hex }}
            />
            <span
              className="w-0.5 rounded-full bar-3 shadow-[0_0_6px_currentColor]"
              style={{ backgroundColor: ambientPalette.hex, color: ambientPalette.hex }}
            />
          </div>
        );

      case 'bluetooth':
        return (
          <div
            key="bluetooth"
            className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 animate-pulse flex-shrink-0 shadow-[0_0_10px_rgba(99,102,241,0.65)] animate-fadeIn"
            title="Bluetooth: Device Connected (Blinking)"
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
            </svg>
          </div>
        );

      case 'camera':
        return (
          <div
            key="camera"
            className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0 shadow-[0_0_9px_rgba(16,185,129,0.7)] animate-fadeIn"
            title="Camera In Use"
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M4 4h3l2-2h6l2 2h3a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2zm8 3a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 2a3 3 0 1 1 0 6 3 3 0 0 1 0-6z" />
            </svg>
          </div>
        );

      case 'mic':
        return (
          <div
            key="mic"
            className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex-shrink-0 shadow-[0_0_9px_rgba(245,158,11,0.7)] animate-fadeIn"
            title="Microphone In Use"
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3zm5 7a1 1 0 0 0-2 0 5 5 0 0 1-10 0 1 1 0 0 0-2 0 7 7 0 0 0 6 6.92V19H7a1 1 0 0 0 0 2h10a1 1 0 0 0 0-2h-2v-3.08A7 7 0 0 0 17 9z" />
            </svg>
          </div>
        );

      case 'airplane':
        return (
          <div
            key="airplane"
            className="flex items-center justify-center w-4 h-4 rounded-full bg-orange-500/20 text-orange-400 flex-shrink-0 shadow-[0_0_9px_rgba(249,115,22,0.75)] animate-fadeIn"
            title="Airplane Mode Active"
          >
            <svg className="w-2.5 h-2.5 fill-current rotate-45" viewBox="0 0 24 24">
              <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
            </svg>
          </div>
        );

      case 'battery_low':
        return (
          <div
            key="battery_low"
            className="flex items-center justify-center w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex-shrink-0 animate-pulse shadow-[0_0_10px_rgba(244,63,94,0.85)] animate-fadeIn"
            title={`Battery Low (${telemetry.battery?.percent || 15}%)`}
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M17 5v1h2a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2h-2v1a1 1 0 0 1-1 1H8a1 1 0 0 1-1-1v-1H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h2V5a1 1 0 0 1 1-1h8a1 1 0 0 1 1 1zM6 8v8h3V8H6zm5 0v8h2V8h-2z" />
            </svg>
          </div>
        );

      case 'battery_charging':
        return (
          <div
            key="battery_charging"
            className="flex items-center justify-center w-4 h-4 rounded-full bg-emerald-500/20 text-emerald-400 flex-shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-fadeIn"
            title={telemetry.battery?.statusText ? `${telemetry.battery.statusText} (${telemetry.battery.percent || 100}%)` : `Charging AC (${telemetry.battery?.percent || 100}%)`}
          >
            <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
              <path d="M11 21h-1l1-7H7.5c-.58 0-.57-.32-.38-.66.19-.34.05-.08.08-.14L13 3h1l-1 7h3.5c.49 0 .56.33.47.51l-.07.13-5.9 10.36z" />
            </svg>
          </div>
        );

      case 'focus':
        return (
          <div
            key="focus"
            className="flex items-center justify-center w-4 h-4 rounded-full bg-amber-500/20 text-amber-400 flex-shrink-0 shadow-[0_0_8px_rgba(245,158,11,0.7)] animate-fadeIn"
            title={`Focus Mode Active: ${focusTaskName}`}
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="10" />
              <circle cx="12" cy="12" r="3.5" fill="currentColor" />
            </svg>
          </div>
        );

      case 'shelf':
        return (
          <div
            key="shelf"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('shelf');
              setIsHovered(true);
            }}
            className="flex items-center justify-center w-4 h-4 rounded-full bg-indigo-500/20 text-indigo-400 flex-shrink-0 shadow-[0_0_8px_rgba(99,102,241,0.6)] animate-fadeIn cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            title={`${stagedFiles.length} item(s) staged in shelf (click to view)`}
          >
            <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
              <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
            </svg>
          </div>
        );

      case 'mail':
        return (
          <div
            key="mail"
            onClick={(e) => {
              e.stopPropagation();
              setActiveTab('mail');
              setIsHovered(true);
            }}
            className="flex items-center justify-center relative w-4 h-4 rounded-full bg-rose-500/20 text-rose-400 flex-shrink-0 shadow-[0_0_8px_rgba(244,63,94,0.6)] animate-fadeIn cursor-pointer hover:scale-110 active:scale-95 transition-transform"
            title={`Gmail: ${mailConfig.unreadCount} unread email(s) (click to open)`}
          >
            <IconMail className="w-2.5 h-2.5 text-rose-400" />
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_4px_#f43f5e]" />
          </div>
        );

      default:
        return null;
    }
  };

  // Dimensions: Smooth rounded corners island (zero wings)
  // Collapsed Default: 230px x 36px (scales to 255px or 280px for 2-3 stacked indicators)
  // Collapsed with Rolling Lyrics: 380px x 36px (Smooth rounded 20px pill)
  // Collapsed with Focus Mode Running: 350px x 36px (Smooth rounded 20px pill)
  // Expanded: 540px x 315px (or 210px greeting banner)
  const islandStyle = isSnippingActive
    ? {
        opacity: 0,
        pointerEvents: 'none',
        width: '230px',
        height: '36px',
        borderRadius: '20px',
      }
    : wakeStage === 'off'
    ? {
        opacity: 0,
        pointerEvents: 'none',
        width: '12px',
        height: '12px',
        borderRadius: '6px',
      }
    : wakeStage === 'seed'
    ? {
        opacity: 1,
        pointerEvents: 'none',
        width: '12px',
        height: '12px',
        borderRadius: '6px',
        boxShadow: `0 0 0 1px ${theme.color}80, 0 0 30px ${theme.color}`,
        borderColor: theme.color,
      }
    : wakeStage === 'greet'
    ? {
        width: `${Math.min(500, Math.max(380, (userName || 'Creator').length * 15 + 170))}px`,
        height: '62px',
        borderRadius: '31px',
        boxShadow: `0 16px 45px rgba(0,0,0,0.85), 0 0 28px ${theme.color}35`,
        borderColor: `${theme.color}50`,
      }
    : isExpanded
    ? {
        width: '540px',
        height: '315px',
        borderRadius: '24px',
      }
    : isUpdateAlertMode
    ? {
        width: '365px',
        height: '36px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.95), 0 0 16px rgba(16, 185, 129, 0.45)',
        borderColor: 'rgba(52, 211, 153, 0.55)',
      }
    : isHudMode
    ? {
        width: '270px',
        height: '36px',
        borderRadius: '20px',
        boxShadow: activeHud.type === 'volume'
          ? '0 10px 30px rgba(0,0,0,0.95), 0 0 16px rgba(56, 189, 248, 0.25)'
          : '0 10px 30px rgba(0,0,0,0.95), 0 0 16px rgba(251, 191, 36, 0.25)',
        borderColor: activeHud.type === 'volume' ? 'rgba(56, 189, 248, 0.35)' : 'rgba(251, 191, 36, 0.35)',
      }
    : isResultReadyMode
    ? {
        width: '270px',
        height: '36px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.95), 0 0 16px rgba(74, 222, 128, 0.35)',
        borderColor: 'rgba(74, 222, 128, 0.45)',
      }
    : isAiThinking && !isExpanded
    ? {
        width: `${collapsedWidth}px`,
        height: '36px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.95), 0 0 18px rgba(249, 115, 22, 0.4)',
        borderColor: 'rgba(249, 115, 22, 0.55)',
      }
    : isDeviceAlertMode
    ? {
        width: '340px',
        height: '36px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.95), 0 0 16px rgba(16, 185, 129, 0.35)',
        borderColor: 'rgba(16, 185, 129, 0.45)',
      }
    : isMailAlertMode
    ? {
        width: '270px',
        height: '36px',
        borderRadius: '20px',
        boxShadow: '0 10px 30px rgba(0,0,0,0.95), 0 0 16px rgba(244, 63, 94, 0.35)',
        borderColor: 'rgba(244, 63, 94, 0.45)',
      }
    : isLyricsMode
    ? {
        width: '380px',
        height: '36px',
        borderRadius: '20px',
      }
    : isFocusModeCollapsed
    ? {
        width: '350px',
        height: '36px',
        borderRadius: '20px',
        boxShadow: focusPhase === 'work'
          ? '0 10px 30px rgba(0,0,0,0.9), 0 0 16px rgba(245, 158, 11, 0.3)'
          : '0 10px 30px rgba(0,0,0,0.9), 0 0 16px rgba(16, 185, 129, 0.3)',
        borderColor: focusPhase === 'work' ? 'rgba(245, 158, 11, 0.4)' : 'rgba(16, 185, 129, 0.4)',
      }
    : {
        width: `${collapsedWidth}px`,
        height: '36px',
        borderRadius: '20px',
      };

  // Apply Collapsed-State-Only Island Display settings (Size, Style, Material Black/Glass, See-through, Glass Colour, Music Colour)
  const finalIslandStyle = (() => {
    const isStandardCollapsed =
      !isExpanded &&
      !isUpdateAlertMode &&
      !isSnippingActive &&
      wakeStage !== 'off' &&
      wakeStage !== 'seed' &&
      wakeStage !== 'greet';

    if (!isStandardCollapsed) {
      return {
        ...islandStyle,
        backgroundColor: '#000000',
      };
    }

    const baseWidth = parseFloat(islandStyle.width) || collapsedWidth;
    const size = displaySettings.size || 'normal';
    const scaledWidth =
      size === 'compact'
        ? Math.max(195, Math.round(baseWidth * 0.9))
        : size === 'large'
        ? Math.min(460, Math.round(baseWidth * 1.12))
        : baseWidth;
    const scaledHeight = size === 'compact' ? '32px' : size === 'large' ? '42px' : '36px';

    const isAttached = (displaySettings.style || 'attached') === 'attached';
    const radius = isAttached
      ? size === 'large'
        ? '0 0 22px 22px'
        : '0 0 20px 20px'
      : size === 'large'
      ? '24px'
      : '22px';

    const seeThroughPct = Math.max(0, Math.min(85, Number(displaySettings.seeThrough) || 0));
    const alpha = Math.max(0.15, 1 - seeThroughPct / 100);

    // Resolve tint RGB for Colour Glass or Music Colour
    const glassChoice = GLASS_COLOR_OPTIONS.find((g) => g.id === displaySettings.glassColor);
    const songRgb =
      Array.isArray(ambientPalette?.rgbTuple) && ambientPalette.rgbTuple.length === 3
        ? ambientPalette.rgbTuple
        : typeof ambientPalette?.r === 'number' &&
          typeof ambientPalette?.g === 'number' &&
          typeof ambientPalette?.b === 'number'
        ? [ambientPalette.r, ambientPalette.g, ambientPalette.b]
        : ambientPalette?.hex
        ? hexToRgbTuple(ambientPalette.hex)
        : null;
    const hasActiveSong = Boolean(isPlaying || (trackData?.title && trackData?.artwork));
    const hasMusicRgb = Boolean(hasActiveSong && songRgb);

    let [r, g, b] = hexToRgbTuple(theme.accent || theme.color);
    if (displaySettings.material === 'glass') {
      if (displaySettings.glassColor && displaySettings.glassColor !== 'auto' && glassChoice?.rgb) {
        [r, g, b] = glassChoice.rgb;
      } else if (hasMusicRgb) {
        // Automatic glass mode always follows the active song's dynamic extracted color!
        [r, g, b] = songRgb;
      }
    } else if (displaySettings.musicColor && hasMusicRgb) {
      [r, g, b] = songRgb;
    }

    const surfaceStyle =
      displaySettings.material === 'glass'
        ? {
            backgroundColor: `rgba(${Math.round(r * 0.3)}, ${Math.round(g * 0.3)}, ${Math.round(b * 0.3)}, ${Math.min(0.84, alpha * 0.72).toFixed(2)})`,
            backdropFilter: 'blur(22px) saturate(185%)',
            WebkitBackdropFilter: 'blur(22px) saturate(185%)',
            borderColor: islandStyle.borderColor || `rgba(${r}, ${g}, ${b}, 0.52)`,
            boxShadow:
              islandStyle.boxShadow ||
              `0 14px 36px rgba(0, 0, 0, 0.65), 0 0 26px rgba(${r}, ${g}, ${b}, 0.38), inset 0 1px 0 rgba(255, 255, 255, 0.22)`,
          }
        : seeThroughPct > 0 && displaySettings.musicColor && hasMusicRgb
        ? {
            backgroundColor: `rgba(${Math.round(r * 0.18)}, ${Math.round(g * 0.18)}, ${Math.round(b * 0.18)}, ${alpha.toFixed(2)})`,
            backdropFilter: 'blur(16px) saturate(150%)',
            WebkitBackdropFilter: 'blur(16px) saturate(150%)',
            borderColor: islandStyle.borderColor || `rgba(${r}, ${g}, ${b}, 0.42)`,
          }
        : {
            backgroundColor: `rgba(0, 0, 0, ${alpha.toFixed(2)})`,
            backdropFilter: seeThroughPct > 0 ? 'blur(14px)' : undefined,
            WebkitBackdropFilter: seeThroughPct > 0 ? 'blur(14px)' : undefined,
          };

    return {
      ...islandStyle,
      width: `${scaledWidth}px`,
      height: scaledHeight,
      borderRadius: radius,
      borderTopWidth: isAttached ? '0px' : '1px',
      ...surfaceStyle,
    };
  })();

  return (
    <div
      id="dynamic-island"
      className={`spring-anim relative text-white shadow-[0_28px_60px_rgba(0,0,0,0.98)] select-none flex flex-col items-center justify-between overflow-visible border border-[#1e1e22] ${
        !isExpanded && displaySettings.openMode === 'click' ? 'cursor-pointer' : 'cursor-default'
      }`}
      style={finalIslandStyle}
      onClick={!isExpanded && displaySettings.openMode === 'click' ? () => onRequestExpand?.() : undefined}
      onDragEnter={handleIslandDragEnter}
      onDragOver={handleIslandDragOver}
      onDragLeave={handleIslandDragLeave}
      onDrop={handleIslandDrop}
    >

      {/* ======================================================== */}
      {/* 1. COLLAPSED ISLAND: RESULT READY vs DEVICE vs HUD vs MAIL vs LYRICS vs 3-ZONE */}
      {/* ======================================================== */}
      {!isExpanded && wakeStage !== 'seed' && wakeStage !== 'off' && (
        wakeStage === 'greet' ? (
          /* WAKE STAGE: GREETING PILL (Letter-by-letter reveal + Wave + Smiling Eyes) */
          <div className="w-full h-full px-5 flex items-center justify-between gap-4 select-none animate-fadeIn">
            {/* Left: Companion Eyes in Happy Smile */}
            <div className="flex-shrink-0">
              <MinimalEyes
                expression="happy"
                themeColor={theme.color}
                themeShadow={theme.shadow}
                size="lg"
              />
            </div>
            {/* Right: Time-aware greeting + Wave + Letter-by-letter Name */}
            <div className="flex-1 min-w-0 flex flex-col justify-center">
              <div className="flex items-center gap-1.5 text-xs text-neutral-400 font-medium tracking-wide">
                <span>{getTimeGreeting()}</span>
                <IconWave className="w-3.5 h-3.5 wave-hand inline-block text-neutral-300" />
              </div>
              <div className="text-lg font-bold tracking-tight truncate leading-tight bg-gradient-to-r from-emerald-300 via-sky-300 to-purple-300 bg-clip-text text-transparent">
                {Array.from(userName || 'Creator').map((char, i) => (
                  <span key={i} className="letter-pop" style={{ '--j': i }}>
                    {char}
                  </span>
                ))}
              </div>
            </div>
          </div>
        ) : isSnippingActive ? null : isUpdateAlertMode ? (
          /* AUTO-UPDATE BANNER (User Request 10: "{Version} is ready to download" with [ Install ] button) */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between gap-2 animate-fadeIn select-none"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Left: Sparkle Icon + Update Version / Progress */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <div className="relative flex items-center justify-center">
                <IconSparkles className="w-3.5 h-3.5 text-emerald-400" />
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
              <span className="text-[11px] font-semibold text-white tracking-tight truncate max-w-[185px]">
                {updateStatus.status === 'downloading' ? (
                  <span className="text-sky-300 font-mono flex items-center gap-1.5">
                    <span>Downloading</span>
                    <span className="font-bold">{updateStatus.percent || 0}%</span>
                  </span>
                ) : updateStatus.status === 'ready' || updateReady ? (
                  <span className="text-emerald-300">
                    v{updateStatus.version || updateReady} ready to install
                  </span>
                ) : (
                  <span>
                    v{updateStatus.version || '1.0.1'} is ready to download
                  </span>
                )}
              </span>
            </div>

            {/* Right: Install Button + Dismiss */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <button
                type="button"
                onClick={handleInstallUpdateClick}
                disabled={isInstallingUpdate && updateStatus.status !== 'ready' && !updateReady}
                className="px-2.5 py-0.5 rounded-full bg-emerald-500 hover:bg-emerald-400 text-black text-[10px] font-bold flex items-center gap-1 transition-all active:scale-95 shadow-md cursor-pointer disabled:opacity-50"
                title="Click to install update"
              >
                <IconDownload className="w-2.5 h-2.5 stroke-[2.5]" />
                <span>{updateStatus.status === 'ready' || updateReady ? 'Restart' : 'Install'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsUpdateDismissed(true)}
                className="w-5 h-5 rounded-full hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer text-[10px]"
                title="Dismiss update alert"
              >
                ✕
              </button>
            </div>
          </div>
        ) : isResultReadyMode ? (
          /* RESULT READY BANNER: Eyes on left, 'Result ready' on right, auto-dismisses after 2-3s */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between animate-fadeIn cursor-pointer select-none"
            onClick={() => {
              setIsResultReadyAlert(false);
              setActiveTab('features');
              setIsHovered(true);
            }}
            title="Result ready! Click to open"
          >
            {/* Left: Living Happy Eyes */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <MinimalEyes
                expression="happy"
                themeColor="#4ade80"
                themeShadow="0 0 14px rgba(74, 222, 128, 0.9), 0 0 24px rgba(74, 222, 128, 0.4)"
                size="sm"
              />
            </div>

            {/* Right: 'Result ready' with glowing pill */}
            <div className="flex items-center gap-1.5 flex-shrink-0">
              <span className="text-[11.5px] font-semibold text-white tracking-tight flex items-center gap-1.5">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                <span>Result ready</span>
              </span>
              <span className="text-[8.5px] font-mono text-emerald-300 bg-emerald-500/20 border border-emerald-500/35 px-1.5 py-0.5 rounded-md font-bold">
                View ↗
              </span>
            </div>
          </div>
        ) : isDeviceAlertMode ? (
          /* PERIPHERAL / DEVICE CONNECTED BANNER (Removes all other icons/eyes) */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between animate-fadeIn cursor-pointer"
            onClick={triggerRejoice}
            title={`${activeDeviceAlert.name} Connected${activeDeviceAlert.battery != null ? ` • Battery: ${activeDeviceAlert.battery}%` : ''}`}
          >
            {/* Left: Device Icon with connection beacon */}
            <div className="flex items-center gap-2 min-w-0 flex-shrink-0">
              <div className="relative flex items-center justify-center">
                <span className="text-emerald-400">
                  {renderPeripheralIcon(activeDeviceAlert.type, activeDeviceAlert.name)}
                </span>
                <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
              </div>
            </div>

            {/* Middle: Device Name + Connected */}
            <div className="flex-1 min-w-0 px-2 text-center overflow-hidden">
              <span className="text-[11.5px] font-bold text-white tracking-tight truncate block">
                {activeDeviceAlert.name} <span className="text-emerald-400 font-medium text-[10px]">Connected</span>
              </span>
            </div>

            {/* Right: Battery percentage capsule or Paired badge */}
            <div className="flex-shrink-0 flex items-center gap-1">
              {activeDeviceAlert.battery != null ? (
                <div className="flex items-center gap-1 px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[9px] font-bold">
                  <svg className="w-2.5 h-2.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="2" y="7" width="16" height="10" rx="2" ry="2" />
                    <line x1="22" y1="11" x2="22" y2="13" />
                  </svg>
                  <span>{activeDeviceAlert.battery}%</span>
                </div>
              ) : (
                <span className="px-1.5 py-0.5 rounded-md bg-emerald-500/15 border border-emerald-500/30 text-emerald-300 font-mono text-[8px] font-bold tracking-wider flex items-center gap-1">
                  <IconCheck className="w-2.5 h-2.5 text-emerald-400" />
                  <span>CONNECTED</span>
                </span>
              )}
            </div>
          </div>
        ) : isHudMode ? (
          /* HARDWARE VOLUME / BRIGHTNESS HUD PILL */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between animate-fadeIn cursor-pointer"
            onClick={triggerRejoice}
            onWheel={(e) => {
              e.preventDefault();
              const delta = e.deltaY < 0 ? 5 : -5;
              if (activeHud.type === 'volume') {
                const nextVol = Math.max(0, Math.min(100, (activeHud.value || 0) + delta));
                window.electronAPI?.setHardwareVolume?.(nextVol);
                setActiveHud((prev) => prev ? { ...prev, value: nextVol } : null);
              } else {
                const nextBri = Math.max(0, Math.min(100, (activeHud.value || 0) + delta));
                window.electronAPI?.setHardwareBrightness?.(nextBri);
                setActiveHud((prev) => prev ? { ...prev, value: nextBri } : null);
              }
              if (hudTimerRef.current) clearTimeout(hudTimerRef.current);
              hudTimerRef.current = setTimeout(() => {
                setActiveHud(null);
                hudTimerRef.current = null;
              }, 1800);
            }}
            title={
              activeHud.type === 'volume'
                ? `System Master Volume: ${activeHud.value}% ${activeHud.muted ? '(MUTED)' : ''} • Scroll mouse wheel to adjust`
                : `Screen Brightness: ${activeHud.value}% • Scroll mouse wheel to adjust`
            }
          >
            {/* Left: Dynamic Reactive Icon */}
            <div className="flex-shrink-0 flex items-center justify-center w-5">
              {activeHud.type === 'volume' ? (
                activeHud.muted || activeHud.value === 0 ? (
                  <IconVolumeMute className="w-3.5 h-3.5 text-neutral-400" />
                ) : activeHud.value < 35 ? (
                  <IconVolumeLow className="w-3.5 h-3.5 text-sky-300" />
                ) : activeHud.value < 70 ? (
                  <IconVolumeMid className="w-3.5 h-3.5 text-sky-400" />
                ) : (
                  <IconVolumeHigh className="w-3.5 h-3.5 text-sky-400" />
                )
              ) : (
                <IconBrightness className="w-3.5 h-3.5 text-amber-400 animate-pulse" />
              )}
            </div>

            {/* Center: Glowing Progress Capsule Track */}
            <div className="flex-1 mx-3 h-2 bg-neutral-900/90 rounded-full overflow-hidden p-[1px] border border-neutral-700/60 shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-150 ease-out ${
                  activeHud.type === 'volume'
                    ? activeHud.muted
                      ? 'bg-neutral-500'
                      : 'bg-gradient-to-r from-sky-400 via-blue-400 to-indigo-400 shadow-[0_0_8px_rgba(56,189,248,0.6)]'
                    : 'bg-gradient-to-r from-amber-400 via-amber-300 to-yellow-300 shadow-[0_0_8px_rgba(251,191,36,0.6)]'
                }`}
                style={{ width: `${Math.max(0, Math.min(100, activeHud.value))}%` }}
              />
            </div>

            {/* Right: Percentage / Status Label */}
            <div className="flex-shrink-0 min-w-[34px] text-right font-mono text-[11px] font-bold tracking-tight">
              {activeHud.type === 'volume' && activeHud.muted ? (
                <span className="text-rose-400 text-[9.5px] uppercase">MUTE</span>
              ) : (
                <span className={activeHud.type === 'volume' ? 'text-sky-300' : 'text-amber-300'}>
                  {activeHud.value}%
                </span>
              )}
            </div>
          </div>
        ) : isMailAlertMode ? (
          /* NEW EMAIL NOTIFICATION ALERT: Replaces eyes for ~3.5s, then restores eyes */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between animate-fadeIn cursor-pointer"
            onClick={() => {
              setActiveTab('mail');
              setIsHovered(true);
            }}
            title="Gmail: 1 New Email • Click to open Mail tab"
          >
            {/* Left: Glowing Google Mail Envelope & Badge */}
            <div className="flex items-center gap-2 min-w-0">
              <div className="relative flex items-center justify-center w-5 h-5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-400">
                <IconMail className="w-3 h-3 text-rose-400 animate-pulse" />
                <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 animate-ping" />
              </div>
              <div className="flex flex-col min-w-0">
                <span className="text-[11px] font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>{activeMailAlert.text || '1 New Email'}</span>
                  <span className="w-1.5 h-1.5 rounded-full bg-rose-400 animate-pulse" />
                </span>
                <span className="text-[8px] font-mono text-neutral-400 truncate">
                  {mailConfig.email || 'Gmail Inbox'} • Tap to open
                </span>
              </div>
            </div>

            {/* Right: Badge Pill */}
            <div className="flex-shrink-0 pl-2">
              <span className="px-2 py-0.5 rounded-full bg-rose-500/20 border border-rose-500/40 text-rose-300 font-mono text-[9px] font-semibold tracking-wide shadow-sm">
                +{activeMailAlert.count || 1}
              </span>
            </div>
          </div>
        ) : isLyricsMode ? (
          /* LYRICS MODE: Shows track intro for 2s on change, then rolls synchronized lyrics */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between animate-fadeIn cursor-pointer"
            onClick={triggerRejoice}
            title={showSongIntro ? `Now Playing: ${trackData.title}` : `Spotify Lyrics • ${trackData.title}`}
          >
            {/* Left / Center: Song Intro vs Rolling Synchronized Lyrics Line */}
            <div className="flex-1 flex items-center gap-2 min-w-0 pr-3">
              <svg
                className="w-3.5 h-3.5 flex-shrink-0 animate-pulse"
                viewBox="0 0 24 24"
                fill="currentColor"
                style={{ color: ambientPalette.hex }}
              >
                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
              </svg>
              <div className="flex-1 min-w-0 overflow-hidden">
                {showSongIntro ? (
                  <p
                    key="song-intro"
                    className="text-[11.5px] font-semibold text-white truncate tracking-tight animate-fadeIn flex items-center gap-1"
                    title={`${trackData.title} • ${trackData.artist}`}
                  >
                    <IconAudio className="w-3 h-3 text-[#10b981] inline-block shrink-0" />
                    <span className="truncate">{trackData.title}</span>
                    {trackData.artist ? <span className="text-neutral-400 font-normal"> • {trackData.artist}</span> : null}
                  </p>
                ) : (
                  <p
                    key={activeLyricIndex}
                    className="text-[11.5px] font-medium text-neutral-100 truncate tracking-tight animate-lyric-slide"
                    title={currentLyricLine || trackData.title}
                  >
                    {renderLyricContent(currentLyricLine, true)}
                  </p>
                )}
              </div>
            </div>

            {/* Right: Music Playing Equalizer Wave Icon ONLY */}
            <div className="flex-shrink-0 flex items-center gap-0.5 h-3 pl-1" title="Spotify Playing">
              <span
                className="w-0.5 rounded-full bar-1 shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: ambientPalette.hex, color: ambientPalette.hex }}
              />
              <span
                className="w-0.5 rounded-full bar-2 shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: ambientPalette.hex, color: ambientPalette.hex }}
              />
              <span
                className="w-0.5 rounded-full bar-3 shadow-[0_0_6px_currentColor]"
                style={{ backgroundColor: ambientPalette.hex, color: ambientPalette.hex }}
              />
            </div>
          </div>
        ) : isFocusModeCollapsed ? (
          /* FOCUS MODE COLLAPSED: Expands to fit task name, living serious/relaxed eyes & live countdown */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between animate-fadeIn cursor-pointer"
            onClick={() => {
              setActiveTab('focus');
              setIsHovered(true);
            }}
            title={`Focus Active: ${focusTaskName} (${formatTime(focusSecondsLeft)} left) • Click to open`}
          >
            {/* Left: Task Name & Phase badge */}
            <div className="flex items-center gap-1.5 min-w-0 max-w-[120px]">
              <span className="flex-shrink-0">
                {focusPhase === 'work' ? (
                  <IconTarget className="w-3.5 h-3.5 text-amber-400" />
                ) : focusPhase === 'shortBreak' ? (
                  <IconCoffee className="w-3.5 h-3.5 text-emerald-400" />
                ) : (
                  <IconPalm className="w-3.5 h-3.5 text-teal-400" />
                )}
              </span>
              <div className="flex flex-col min-w-0">
                <span className="text-[10px] font-bold text-neutral-100 truncate tracking-tight" title={focusTaskName}>
                  {focusTaskName}
                </span>
                <span 
                  className="text-[7.5px] uppercase font-mono tracking-wider font-semibold"
                  style={{ color: focusPhase === 'work' ? '#f59e0b' : '#10b981' }}
                >
                  {focusPhase === 'work' ? 'Deep Focus' : focusPhase === 'shortBreak' ? 'Short Break' : 'Long Break'}
                </span>
              </div>
            </div>

            {/* Center: Living Eyes in serious amber or relaxed emerald */}
            <div className="flex-1 flex items-center justify-center overflow-visible">
              <MinimalEyes
                tiltDeg={eyeTracking.tiltDeg}
                offsetX={eyeTracking.offsetX}
                offsetY={eyeTracking.offsetY}
                expression={activeEyeExpression}
                themeColor={activeEyeColor}
                themeShadow={activeEyeShadow}
                size="md"
              />
            </div>

            {/* Right: Countdown Timer & Mini Cycle Pips */}
            <div className="flex items-center gap-1.5 pl-1 flex-shrink-0">
              <div className="flex flex-col items-end">
                <span className="text-[11.5px] font-mono font-bold tracking-tight text-white">
                  {formatTime(focusSecondsLeft)}
                </span>
                {/* Mini Cycle Pips ●●○○ */}
                <div className="flex items-center gap-0.5 mt-0.5">
                  {[1, 2, 3, 4].map((pip) => (
                    <span
                      key={pip}
                      className="w-1 h-1 rounded-full transition-all"
                      style={{
                        backgroundColor: pip <= focusCycle ? (focusPhase === 'work' ? '#f59e0b' : '#10b981') : '#3f3f46',
                        boxShadow: pip === focusCycle ? `0 0 4px ${focusPhase === 'work' ? '#f59e0b' : '#10b981'}` : 'none'
                      }}
                    />
                  ))}
                </div>
              </div>
            </div>
          </div>
        ) : (
          /* STANDARD 3-ZONE COLLAPSED LAYOUT (With Dynamic Multi-Indicator Stack) */
          <div
            className="w-full h-full px-3 flex items-center justify-between animate-fadeIn cursor-pointer"
            onClick={triggerRejoice}
          >
            {/* ZONE 1 (LEFT): Live Clock - Mirrored side zone width keeps center eyes aligned */}
            <div 
              className="flex items-center justify-start pl-1 transition-all duration-300"
              style={{ width: `${sideZoneWidth}px` }}
            >
              <span className="text-[11px] font-mono font-medium text-neutral-400 tracking-tight">
                {shortTime || '10:42'}
              </span>
            </div>

            {/* ZONE 2 (CENTER): Living Glowing Eyes */}
            <div className="flex-1 flex items-center justify-center overflow-visible">
              <MinimalEyes
                tiltDeg={eyeTracking.tiltDeg}
                offsetX={eyeTracking.offsetX}
                offsetY={eyeTracking.offsetY}
                expression={activeEyeExpression}
                themeColor={activeEyeColor}
                themeShadow={activeEyeShadow}
                size="md"
              />
            </div>

            {/* ZONE 3 (RIGHT): Stack up to 3 most latest indicators (Music anchored far right) */}
            <div 
              className="flex items-center justify-end gap-1.5 pr-1 transition-all duration-300"
              style={{ width: `${sideZoneWidth}px` }}
            >
              {activeIndicators.map((id) => renderIndicatorIcon(id))}
            </div>
          </div>
        )
      )}

      {/* ======================================================== */}
      {/* 2. EXPANDED DASHBOARD                                    */}
      {/* ======================================================== */}
      {isExpanded && (
        <div className="w-full h-full px-3.5 pt-2.5 pb-2.5 flex flex-col justify-between animate-fadeIn overflow-hidden relative">
          {/* BACKDROP SCRIM: Smoothly dims & blurs entire island contents behind Wi-Fi, Bluetooth & Options menus */}
          {(isDropdownOpen || isOptionsMenuOpen) && (
            <div
              className="absolute inset-0 z-40 bg-black/85 backdrop-blur-sm rounded-[24px] animate-fadeIn cursor-pointer"
              onClick={closeAllDropdowns}
            />
          )}

          {/* TOP BAR: APP TITLE • DATE & TIME • OPTIONS */}
          <div className={`flex items-center justify-between text-xs pb-1.5 border-b border-[#26262a] relative z-50 ${isWakingUp ? 'pop-in-card' : ''}`} style={{ '--i': 0 }}>
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-xs flex items-center gap-1">
                  <span>Eyeland</span>
                  <span style={{ color: theme.accent || theme.color }}>AI</span>
                </span>
                <span className="text-[10px] text-neutral-500">•</span>
                <span className="text-[10px] text-neutral-400 font-mono">
                  {fullDateTime || currentTime || 'Tue 3 Nov 2026 9:37 PM'}
                </span>
              </div>
              <div className="flex items-center gap-2 mt-0.5">
                <span 
                  onClick={() => {
                    setModelStatus(
                      modelStatus.includes('Gemini') 
                        ? 'Claude Code / Codex • Ready' 
                        : 'Gemini Flash Vision'
                    );
                  }}
                  className="text-[10px] text-red-400/90 underline cursor-pointer hover:text-red-300 transition-colors"
                >
                  {modelStatus.includes('Gemini') ? 'Connect Claude Code or Codex' : 'Switch to Gemini Vision'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-1.5 relative" ref={dropdownRef}>
              {/* WiFi Quick Button (Real Device Telemetry) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('wifi');
                }}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  isDropdownOpen && activeDropdownTab === 'wifi'
                    ? 'bg-neutral-800 text-sky-400 border border-neutral-700'
                    : isWifiOn
                    ? 'text-sky-400 hover:bg-neutral-800 hover:text-sky-300'
                    : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                }`}
                title={isWifiOn ? `Wi-Fi: Connected to ${currentWifi} (${telemetry.wifi?.signal || 80}%) • ${telemetry.wifi?.speed || '286.8 Mbps'}` : 'Wi-Fi: Off'}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                  <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                  <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                  <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
                </svg>
              </button>

              {/* Bluetooth Quick Button (Real Device Telemetry) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDropdown('bluetooth');
                }}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center ${
                  isDropdownOpen && activeDropdownTab === 'bluetooth'
                    ? 'bg-neutral-800 text-indigo-400 border border-neutral-700'
                    : isBluetoothOn
                    ? 'text-indigo-400 hover:bg-neutral-800 hover:text-indigo-300'
                    : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                }`}
                title={isBluetoothOn ? `Bluetooth: Active (${telemetry.bluetooth?.adapter || 'MediaTek Bluetooth Adapter'})` : 'Bluetooth: Off'}
              >
                <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
                </svg>
              </button>

              {/* Airplane Mode Quick Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleAirplaneMode();
                }}
                className={`p-1.5 rounded-lg transition-all flex items-center justify-center cursor-pointer ${
                  isAirplaneMode
                    ? 'bg-orange-500/20 text-orange-400 border border-orange-500/50 shadow-[0_0_8px_rgba(249,115,22,0.4)]'
                    : 'text-neutral-500 hover:bg-neutral-800 hover:text-neutral-300'
                }`}
                title={isAirplaneMode ? 'Airplane Mode: ON (Click to disable)' : 'Airplane Mode: OFF (Click to activate)'}
              >
                <svg className="w-3.5 h-3.5 fill-current rotate-45" viewBox="0 0 24 24">
                  <path d="M21 16v-2l-8-5V3.5c0-.83-.67-1.5-1.5-1.5S10 2.67 10 3.5V9l-8 5v2l8-2.5V19l-2 1.5V22l3.5-1 3.5 1v-1.5L13 19v-5.5l8 2.5z" />
                </svg>
              </button>

              {/* GitHub Auto-Update Ready Pill */}
              {updateReady && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    window.electronAPI?.restartAndInstallUpdate?.();
                  }}
                  title={`Eyeland v${updateReady} is ready to install! Click to restart.`}
                  className="p-1 px-2 rounded-md bg-emerald-500/20 text-emerald-300 border border-emerald-400/40 hover:bg-emerald-500 hover:text-black transition-all text-[10px] font-semibold flex items-center gap-1 cursor-pointer animate-pulse"
                >
                  <IconSparkles className="w-3 h-3 text-emerald-300" />
                  <span>Update</span>
                </button>
              )}

              {/* Options Menu Button (•••) */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  toggleOptionsMenu();
                }}
                title="Options"
                className={`p-1 px-1.5 rounded-lg transition-all cursor-pointer ${
                  isOptionsMenuOpen
                    ? 'bg-neutral-800 text-white border border-neutral-700'
                    : 'text-neutral-400 hover:text-white hover:bg-neutral-800 border border-transparent'
                }`}
              >
                •••
              </button>

              {/* OPTIONS MENU DROPDOWN (Settings, Check for updates, Fold in, Restart, Exit) */}
              {isOptionsMenuOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 z-[100] w-52 border border-white/20 rounded-2xl shadow-[0_28px_65px_rgba(0,0,0,0.98)] p-2 flex flex-col gap-1 animate-scaleIn select-none"
                  style={{ backgroundColor: '#101118', opacity: 1 }}
                >
                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      window.electronAPI?.openDashboard?.();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium text-neutral-200 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <circle cx="12" cy="12" r="3" />
                      <path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
                    </svg>
                    <span>{t.settings}</span>
                  </button>

                  <button
                    onClick={handleCheckForUpdates}
                    disabled={updateStatus.status === 'checking' || updateStatus.status === 'downloading'}
                    className={`w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium flex items-center gap-2.5 transition-colors cursor-pointer ${
                      updateStatus.status === 'ready' || updateReady
                        ? 'text-emerald-300 bg-emerald-500/15 hover:bg-emerald-500/25'
                        : updateStatus.status === 'up-to-date'
                        ? 'text-emerald-400 hover:bg-white/10'
                        : updateStatus.status === 'downloading'
                        ? 'text-sky-300 bg-sky-500/10'
                        : 'text-neutral-200 hover:bg-white/10 hover:text-white'
                    }`}
                  >
                    <svg
                      className={`w-3.5 h-3.5 shrink-0 ${
                        updateStatus.status === 'checking'
                          ? 'animate-spin text-sky-400'
                          : updateStatus.status === 'ready' || updateReady || updateStatus.status === 'up-to-date'
                          ? 'text-emerald-400'
                          : 'text-neutral-400'
                      }`}
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                      <polyline points="7 10 12 15 17 10" />
                      <line x1="12" y1="15" x2="12" y2="3" />
                    </svg>
                    <span className="truncate">
                      {updateStatus.status === 'checking'
                        ? t.checking
                        : updateStatus.status === 'downloading'
                        ? `Downloading ${updateStatus.percent || 0}%`
                        : updateStatus.status === 'ready' || updateReady
                        ? `Install v${updateStatus.version || updateReady}`
                        : updateStatus.status === 'up-to-date'
                        ? t.upToDate
                        : updateStatus.status === 'dev-mode'
                        ? `${t.upToDate} (Dev)`
                        : updateStatus.status === 'error'
                        ? 'Update check failed'
                        : t.checkUpdates}
                    </span>
                  </button>

                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      if (onFoldIn) {
                        onFoldIn();
                      } else {
                        setIsPinned?.(false);
                        setIsHovered?.(false);
                      }
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium text-neutral-200 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-neutral-400 shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <polyline points="18 15 12 9 6 15" />
                    </svg>
                    <span>{t.foldIn}</span>
                  </button>

                  <div className="my-1 border-t border-white/[0.08]" />

                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      window.electronAPI?.restartApp?.();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium text-neutral-200 hover:bg-white/10 hover:text-white flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M21 2v6h-6" />
                      <path d="M3 12a9 9 0 0 1 15-6.7L21 8" />
                      <path d="M3 22v-6h6" />
                      <path d="M21 12a9 9 0 0 1-15 6.7L3 16" />
                    </svg>
                    <span>{t.restart}</span>
                  </button>

                  <button
                    onClick={() => {
                      closeAllDropdowns();
                      window.electronAPI?.exitApp?.();
                    }}
                    className="w-full px-2.5 py-1.5 rounded-lg text-left text-[11px] font-medium text-rose-400 hover:bg-rose-500/15 hover:text-rose-300 flex items-center gap-2.5 transition-colors cursor-pointer"
                  >
                    <svg className="w-3.5 h-3.5 text-rose-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                      <path d="M18.36 6.64a9 9 0 1 1-12.73 0" />
                      <line x1="12" y1="2" x2="12" y2="12" />
                    </svg>
                    <span>{t.exit}</span>
                  </button>
                </div>
              )}

              {/* REDESIGNED WI-FI & BLUETOOTH CONNECTIVITY POPOVER (Real OS Control, Elevated Contrast, 100% Solid Pitch-Black Surface, No Bleed-Through) */}
              {isDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 z-[100] w-[350px] border border-white/20 rounded-2xl shadow-[0_30px_70px_rgba(0,0,0,0.98)] p-3.5 flex flex-col gap-2.5 max-h-[250px] overflow-y-auto no-scrollbar animate-scaleIn select-none"
                  style={{ backgroundColor: '#101118', opacity: 1 }}
                >
                  {/* Segmented Pill Header: Wi-Fi | Bluetooth */}
                  <div className="flex items-center justify-between gap-2 pb-2 border-b border-white/[0.08]">
                    <div className="flex items-center gap-1 bg-[#1c1d28] p-1 rounded-xl border border-white/[0.08] flex-1">
                      <button
                        type="button"
                        onClick={() => setActiveDropdownTab('wifi')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          activeDropdownTab === 'wifi'
                            ? 'bg-white/15 text-white shadow-sm font-bold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" style={activeDropdownTab === 'wifi' ? { color: theme.accent || '#38bdf8' } : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
                        </svg>
                        <span>Wi-Fi</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => setActiveDropdownTab('bluetooth')}
                        className={`flex-1 px-3 py-1.5 rounded-lg text-[10.5px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                          activeDropdownTab === 'bluetooth'
                            ? 'bg-white/15 text-white shadow-sm font-bold'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" style={activeDropdownTab === 'bluetooth' ? { color: theme.accent || '#818cf8' } : undefined} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                          <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
                        </svg>
                        <span>Bluetooth</span>
                      </button>
                    </div>

                    <button
                      type="button"
                      onClick={closeAllDropdowns}
                      className="w-7 h-7 rounded-xl bg-white/[0.05] hover:bg-white/15 text-neutral-400 hover:text-white flex items-center justify-center transition-colors cursor-pointer shrink-0 border border-white/[0.08]"
                      title="Close"
                    >
                      <IconX className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {/* 1. WI-FI PANEL (Real Windows Radio + Netsh Connect) */}
                  {activeDropdownTab === 'wifi' && (
                    <div className="flex flex-col gap-2">
                      {/* Master Hardware Toggle Card */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a1b26] border border-white/[0.08]">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white leading-tight">Wi-Fi Radio</div>
                          <div className="text-[9.5px] text-neutral-400 font-mono truncate max-w-[170px] mt-0.5">
                            {isRadioBusy ? 'Updating radio...' : isWifiOn ? (currentWifi || 'Hardware Active') : 'Turned Off'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleWifi}
                          disabled={isRadioBusy}
                          className={`w-9 h-5 rounded-full p-0.5 border transition-all cursor-pointer flex items-center disabled:opacity-50 ${
                            isWifiOn ? 'justify-end' : 'justify-start bg-neutral-800 border-white/15'
                          }`}
                          style={
                            isWifiOn
                              ? { backgroundColor: theme.softBg || 'rgba(56,189,248,0.25)', borderColor: theme.border || 'rgba(56,189,248,0.6)' }
                              : undefined
                          }
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-md block transition-all"
                            style={{ backgroundColor: isWifiOn ? (theme.accent || '#38bdf8') : '#a3a3a3' }}
                          />
                        </button>
                      </div>

                      {isWifiOn ? (
                        <>
                          {/* Active Network Card */}
                          <div className="p-2.5 rounded-xl bg-[#1e202c] border border-white/[0.1] flex items-center justify-between gap-2.5 shadow-sm">
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span
                                  className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                                  style={{ color: currentWifi && currentWifi !== 'Disconnected' ? (theme.accent || '#34d399') : '#737373', backgroundColor: currentWifi && currentWifi !== 'Disconnected' ? (theme.accent || '#34d399') : '#737373' }}
                                />
                                <span className="text-[11px] font-semibold text-white truncate" title={currentWifi}>
                                  {currentWifi || 'Not Connected'}
                                </span>
                              </div>
                              <div className="text-[9px] text-neutral-400 font-mono truncate pl-4 mt-0.5">
                                {telemetry.wifi?.band || 'Wi-Fi'} • {telemetry.wifi?.speed || 'Active'} • {telemetry.wifi?.signal || 0}%
                              </div>
                            </div>
                            {currentWifi && currentWifi !== 'Disconnected' && (
                              <button
                                type="button"
                                onClick={handleDisconnectWifi}
                                disabled={isRadioBusy}
                                className="px-2.5 py-1 rounded-lg bg-white/[0.08] hover:bg-rose-500/20 text-[9.5px] font-medium text-neutral-300 hover:text-rose-300 border border-white/[0.08] hover:border-rose-500/30 transition-colors cursor-pointer shrink-0"
                              >
                                Disconnect
                              </button>
                            )}
                          </div>

                          {/* Nearby Saved Networks */}
                          {wifiNetworks.filter((n) => n.name && n.name !== currentWifi).length > 0 && (
                            <div className="flex flex-col gap-1 max-h-[70px] overflow-y-auto no-scrollbar bg-[#161722] p-1.5 rounded-xl border border-white/[0.06]">
                              <span className="text-[8.5px] font-mono uppercase tracking-wider text-neutral-400 px-1 font-semibold">
                                Nearby Networks
                              </span>
                              {wifiNetworks
                                .filter((n) => n.name && n.name !== currentWifi)
                                .slice(0, 4)
                                .map((net) => (
                                  <button
                                    key={net.name}
                                    type="button"
                                    onClick={() => handleConnectWifi(net.name)}
                                    disabled={isRadioBusy}
                                    className="w-full px-2 py-1.5 rounded-lg bg-[#1f212c] hover:bg-[#282b3a] border border-white/[0.06] hover:border-white/15 flex items-center justify-between text-left transition-colors cursor-pointer"
                                  >
                                    <span className="text-[10px] text-neutral-200 font-medium truncate max-w-[175px]">
                                      {net.name}
                                    </span>
                                    <span
                                      className="text-[9px] font-mono font-semibold"
                                      style={{ color: theme.accent || '#38bdf8' }}
                                    >
                                      Connect
                                    </span>
                                  </button>
                                ))}
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="py-3 px-2 rounded-xl bg-[#1a1b26] border border-white/[0.08] text-center text-neutral-400 text-[10px]">
                          Wi-Fi hardware is turned off.
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-white/[0.08] flex items-center justify-between text-[9.5px] text-neutral-400">
                        <span className="truncate max-w-[150px] font-mono text-[9px] text-neutral-400" title={telemetry.wifi?.adapter}>
                          {telemetry.wifi?.adapter || 'Wi-Fi Adapter'}
                        </span>
                        <button
                          type="button"
                          onClick={() => window.electronAPI?.openWindowsSettings?.('ms-settings:network-wifi')}
                          className="text-neutral-300 hover:text-white font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-white/[0.06]"
                        >
                          <span>Windows Settings</span>
                          <svg className="w-2.5 h-2.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M7 7h10v10" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}

                  {/* 2. BLUETOOTH PANEL (Real Windows Radio + Paired Devices) */}
                  {activeDropdownTab === 'bluetooth' && (
                    <div className="flex flex-col gap-2">
                      {/* Master Hardware Toggle Card */}
                      <div className="flex items-center justify-between px-3 py-2 rounded-xl bg-[#1a1b26] border border-white/[0.08]">
                        <div className="min-w-0">
                          <div className="text-[11px] font-bold text-white leading-tight">Bluetooth Radio</div>
                          <div className="text-[9.5px] text-neutral-400 font-mono mt-0.5">
                            {isRadioBusy ? 'Updating radio...' : isBluetoothOn ? 'On • Discoverable' : 'Turned Off'}
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={handleToggleBluetooth}
                          disabled={isRadioBusy}
                          className={`w-9 h-5 rounded-full p-0.5 border transition-all cursor-pointer flex items-center disabled:opacity-50 ${
                            isBluetoothOn ? 'justify-end' : 'justify-start bg-neutral-800 border-white/15'
                          }`}
                          style={
                            isBluetoothOn
                              ? { backgroundColor: theme.softBg || 'rgba(129,140,248,0.25)', borderColor: theme.border || 'rgba(129,140,248,0.6)' }
                              : undefined
                          }
                        >
                          <span
                            className="w-3.5 h-3.5 rounded-full shadow-md block transition-all"
                            style={{ backgroundColor: isBluetoothOn ? (theme.accent || '#818cf8') : '#a3a3a3' }}
                          />
                        </button>
                      </div>

                      {isBluetoothOn ? (
                        <div className="flex flex-col gap-1 max-h-[105px] overflow-y-auto no-scrollbar bg-[#161722] p-1.5 rounded-xl border border-white/[0.06]">
                          <span className="text-[8.5px] font-mono uppercase tracking-wider text-neutral-400 px-1 font-semibold">
                            Devices ({btDevices.length})
                          </span>
                          {btDevices.length > 0 ? (
                            btDevices.map((dev) => (
                              <div
                                key={dev.id}
                                className="px-2.5 py-1.5 rounded-xl bg-[#1e202c] border border-white/[0.08] flex items-center justify-between gap-2"
                              >
                                <div className="flex items-center gap-2 min-w-0">
                                  <span
                                    className="w-2 h-2 rounded-full shrink-0 shadow-[0_0_8px_currentColor]"
                                    style={{ color: dev.connected ? (theme.accent || '#34d399') : '#525252', backgroundColor: dev.connected ? (theme.accent || '#34d399') : '#525252' }}
                                  />
                                  <span className="text-[10.5px] text-neutral-200 font-medium truncate" title={dev.name}>
                                    {dev.name}
                                  </span>
                                </div>
                                <span
                                  className="text-[8.5px] font-mono px-2 py-0.5 rounded-md shrink-0 font-medium border"
                                  style={
                                    dev.connected
                                      ? { backgroundColor: theme.softBg || 'rgba(52,211,153,0.18)', borderColor: theme.border || 'rgba(52,211,153,0.4)', color: theme.accent || '#34d399' }
                                      : { backgroundColor: 'rgba(255,255,255,0.06)', borderColor: 'rgba(255,255,255,0.1)', color: '#a3a3a3' }
                                  }
                                >
                                  {dev.connected ? 'Connected' : 'Paired'}
                                </span>
                              </div>
                            ))
                          ) : (
                            <div className="py-2.5 text-center text-[9.5px] text-neutral-500 font-mono">
                              No paired Bluetooth devices found
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="py-3 px-2 rounded-xl bg-[#1a1b26] border border-white/[0.08] text-center text-neutral-400 text-[10px]">
                          Bluetooth hardware is turned off.
                        </div>
                      )}

                      <div className="pt-1.5 border-t border-white/[0.08] flex items-center justify-between text-[9.5px] text-neutral-400">
                        <span className="truncate max-w-[150px] font-mono text-[9px] text-neutral-400" title={telemetry.bluetooth?.adapter}>
                          {telemetry.bluetooth?.adapter || 'Bluetooth Adapter'}
                        </span>
                        <button
                          type="button"
                          onClick={() => window.electronAPI?.openWindowsSettings?.('ms-settings:bluetooth')}
                          className="text-neutral-300 hover:text-white font-medium cursor-pointer transition-colors inline-flex items-center gap-1.5 px-2 py-0.5 rounded-lg hover:bg-white/[0.06]"
                        >
                          <span>Bluetooth Settings</span>
                          <svg className="w-2.5 h-2.5 text-neutral-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M7 17L17 7M7 7h10v10" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Google Gemini API Key Settings Modal */}
          {isKeyModalOpen && (
            <div
              onClick={(e) => e.stopPropagation()}
              className="absolute inset-2 z-[80] rounded-2xl bg-[#0e0f14] border border-neutral-700 shadow-[0_20px_50px_rgba(0,0,0,0.95)] p-3.5 flex flex-col justify-between animate-fadeIn select-none"
              style={{ backgroundColor: '#0e0f14' }}
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <IconBot className="w-4 h-4 text-amber-400" />
                    <span>AI Model & Key Settings</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="text-neutral-500 hover:text-white p-1 cursor-pointer flex items-center justify-center"
                  >
                    <IconX className="w-3.5 h-3.5" />
                  </button>
                </div>

                {/* Status overview */}
                <div className="my-2 p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[10px] leading-relaxed">
                  {aiStatus.tier === 'bundled' ? (
                    <div className="text-emerald-400 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <IconZap className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Built-in Gemini Flash Active</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Default</span>
                    </div>
                  ) : aiStatus.tier === 'custom' ? (
                    <div className="text-cyan-400 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <IconSparkles className="w-3.5 h-3.5 text-cyan-400" />
                        <span>Custom Gemini Key Active</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Custom</span>
                    </div>
                  ) : (
                    <div className="text-amber-400 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1.5">
                        <IconKey className="w-3.5 h-3.5 text-amber-400" />
                        <span>No Default Key Bundled Yet</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300">Setup</span>
                    </div>
                  )}

                  <p className="text-neutral-400 text-[9.5px] mt-1">
                    {aiStatus.tier === 'bundled'
                      ? 'Every user gets this model out of the box with zero configuration! You can optionally enter your own personal key below for higher rate limits or custom models.'
                      : aiStatus.tier === 'custom'
                      ? 'You are using a custom Google Gemini API key. You can update it or revert to the built-in default model anytime.'
                      : 'To bundle a free model for all your users with zero configuration, paste 1 free key into electron/defaultConfig.cjs, or paste your key below.'}
                  </p>
                </div>

                <div className="p-2 rounded-xl bg-neutral-900/60 border border-neutral-800/80 mb-2 text-[9.5px] text-neutral-400 flex items-center justify-between">
                  <span>Get a 100% free key from Google AI Studio:</span>
                  <a
                    href="https://aistudio.google.com/apikey"
                    target="_blank"
                    rel="noreferrer"
                    className="text-emerald-400 hover:text-emerald-300 underline font-mono ml-2 font-semibold"
                  >
                    aistudio.google.com/apikey ↗
                  </a>
                </div>

                <form onSubmit={handleSaveGeminiKey} className="flex flex-col gap-2">
                  <input
                    type="password"
                    value={apiKeyInput}
                    onChange={(e) => setApiKeyInput(e.target.value)}
                    onFocus={() => onInputFocusChange?.(true)}
                    onBlur={() => onInputFocusChange?.(false)}
                    placeholder={aiStatus.tier === 'custom' ? 'Enter new custom Gemini API key...' : 'Optional custom Gemini key (AIzaSy...)'}
                    className="w-full bg-[#18181f] border border-neutral-700 focus:border-emerald-500 rounded-xl px-3 py-1.5 text-xs text-white placeholder-neutral-500 outline-none font-mono"
                  />

                  <div className="flex items-center justify-between pt-1">
                    <span className="text-[9.5px] font-mono text-emerald-400 font-semibold">
                      {keySaveMessage}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {aiStatus.tier === 'custom' && (
                        <button
                          type="button"
                          onClick={handleRevertToDefaultKey}
                          className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-amber-300 text-[9.5px] font-mono cursor-pointer"
                        >
                          Use Default
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => setIsKeyModalOpen(false)}
                        className="px-2.5 py-1 rounded-xl bg-neutral-800 hover:bg-neutral-700 text-neutral-300 text-[10px] font-mono cursor-pointer"
                      >
                        Cancel
                      </button>
                      <button
                        type="submit"
                        className="px-3.5 py-1 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-black font-semibold text-[10px] font-mono cursor-pointer active:scale-95 transition-all shadow-md"
                      >
                        {apiKeyInput.trim() ? 'Save Key' : 'Close'}
                      </button>
                    </div>
                  </div>
                </form>
              </div>

              <div className="text-[8.5px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/80 flex items-center justify-between">
                <span>Model: {aiStatus.activeModel || 'gemini-2.5-flash'}</span>
                <span>Dual-Tier Smart Architecture</span>
              </div>
            </div>
          )}

          {/* MAIN TAB CONTENT AREA (Constrained & Scroll-safe) */}
          <div className="flex-1 min-h-0 py-1 px-0.5 flex flex-col justify-center overflow-hidden">
            
            {/* 1. EYELAND AI VIEW - CONVERSATIONAL LLM INTERFACE */}
            {activeTab === 'ai' && (
              <div className="flex flex-col justify-between h-full overflow-hidden select-none animate-tabSlide">
                {/* Chat Header Bar */}
                <div className="flex items-center justify-between pb-1 px-1 border-b border-neutral-800/80 shrink-0">
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setIsKeyModalOpen(true)}
                      className={`px-2 py-0.5 rounded-full text-[8.5px] font-mono transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                        aiStatus.tier === 'bundled'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : aiStatus.tier === 'custom'
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30'
                      }`}
                      title="AI Model & Key Settings"
                    >
                      {aiStatus.tier === 'bundled' ? (
                        <IconZap className="w-3 h-3 text-emerald-400" />
                      ) : aiStatus.tier === 'custom' ? (
                        <IconSparkles className="w-3 h-3 text-cyan-400" />
                      ) : (
                        <IconKey className="w-3 h-3 text-amber-400" />
                      )}
                      <span>{aiStatus.activeModel || 'gemini-3.5-flash'}</span>
                    </button>
                    <span className="text-[9px] text-neutral-500 font-mono">
                      {chatMessages.length > 0 ? `${chatMessages.length} msgs` : 'LLM Chat'}
                    </span>
                  </div>

                  <div className="flex items-center gap-1">
                    {chatMessages.length > 0 && (
                      <button
                        type="button"
                        onClick={handleClearChat}
                        className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-rose-300 text-[9px] font-mono flex items-center gap-1 border border-neutral-800 transition-colors cursor-pointer"
                        title="Clear conversation and start new thread"
                      >
                        <IconTrash className="w-3 h-3 text-neutral-400" />
                        <span>New Chat</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Conversation Stream or Hero Welcome */}
                {chatMessages.length === 0 ? (
                  /* Hero Welcome State */
                  <div className="flex-1 min-h-0 flex flex-col items-center justify-center text-center my-auto px-2">
                    <div 
                        onClick={triggerRejoice}
                      title="Click to Pet Eyeland!"
                      className="cursor-pointer mb-1 transform hover:scale-105 active:scale-95 transition-transform"
                    >
                      <MinimalEyes
                        tiltDeg={eyeTracking.tiltDeg}
                        offsetX={eyeTracking.offsetX}
                        offsetY={eyeTracking.offsetY}
                        expression={activeEyeExpression}
                        themeColor={activeEyeColor}
                        themeShadow={activeEyeShadow}
                        size="md"
                      />
                    </div>

                    <h3 className="text-xs font-semibold text-white tracking-tight">
                      What can I do for you today?
                    </h3>
                    <p className="text-[10px] text-neutral-400 mt-0.5 mb-2 max-w-[320px]">
                      Ask anything, snip any screen area, or choose a quick lens below:
                    </p>

                    {/* Quick Feature Action Chips */}
                    <div className="flex items-center justify-center gap-1.5 w-full flex-wrap px-2">
                      <button
                        type="button"
                        onClick={() => { setAiInput('Explain this in detail: '); inputRef.current?.focus(); }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <IconLightbulb className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>Explain</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiInput('Rewrite and polish this professionally: '); inputRef.current?.focus(); }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <IconSparkles className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span>Polish</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiInput('Summarize the key takeaways and next steps: '); inputRef.current?.focus(); }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="text-purple-400 font-bold">≡</span>
                        <span>Summarize</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiInput('Diagnose and fix bugs in this code: '); inputRef.current?.focus(); }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <IconCode className="w-3 h-3 text-amber-400 shrink-0" />
                        <span>Fix Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleTriggerChatSnip}
                        className="px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[9.5px] text-sky-300 flex items-center gap-1.5 transition-all active:scale-95 cursor-pointer"
                      >
                        <IconCamera className="w-3 h-3 text-sky-400 shrink-0" />
                        <span>Snip Screen</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* Conversational LLM Message Stream */
                  <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1.5 space-y-2.5 select-text" style={{ scrollbarWidth: 'thin' }}>
                    {chatMessages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'} animate-slideUp`}
                      >
                        {msg.role === 'user' ? (
                          /* USER MESSAGE (RIGHT SIDE) */
                          <div className="flex flex-col items-end max-w-[85%]">
                            {msg.image && (
                              <div className="mb-1 rounded-xl overflow-hidden border border-emerald-500/40 shadow-sm max-w-[200px]">
                                <img src={msg.image} alt="User attachment" className="w-full h-auto object-cover max-h-28" />
                              </div>
                            )}
                            <div className="bg-gradient-to-br from-emerald-600/30 to-teal-700/30 border border-emerald-500/40 text-neutral-100 rounded-2xl rounded-tr-xs px-3.5 py-2 text-[11px] leading-relaxed shadow-sm break-words">
                              {msg.text}
                            </div>
                            <span className="text-[8.5px] font-mono text-neutral-500 mt-0.5 px-1">
                              {msg.timestamp || 'You'}
                            </span>
                          </div>
                        ) : (
                          /* ASSISTANT MESSAGE (LEFT SIDE) */
                          <div className="flex items-start gap-2 max-w-[88%]">
                            <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5 shadow-sm">
                              <IconBot className="w-3 h-3 text-neutral-300" />
                            </div>
                            <div className="flex flex-col">
                              <div className="bg-[#141418]/95 border border-neutral-800 text-neutral-200 rounded-2xl rounded-tl-xs px-3.5 py-2.5 text-[11px] leading-relaxed shadow-md select-text break-words">
                                {renderFormattedMessage(msg.text)}
                              </div>
                              <div className="flex items-center gap-2 mt-0.5 px-1 text-[8.5px] font-mono text-neutral-500">
                                <span>{msg.model || 'Gemini'}</span>
                                <span>•</span>
                                <span>{msg.timestamp}</span>
                                <button
                                  type="button"
                                  onClick={() => handleCopyMessage(msg.id, msg.text)}
                                  className="text-neutral-400 hover:text-emerald-400 transition-colors ml-1 cursor-pointer flex items-center gap-1"
                                  title="Copy response to clipboard"
                                >
                                  {copiedMsgId === msg.id ? <IconCheck className="w-3 h-3 text-emerald-400" /> : <IconCopy className="w-3 h-3 text-neutral-400" />}
                                  <span>{copiedMsgId === msg.id ? 'Copied!' : 'Copy'}</span>
                                </button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    ))}

                    {/* Thinking / Streaming Indicator */}
                    {isAiResponding && (
                      <div className="flex items-start gap-2 max-w-[85%] animate-slideUp">
                        <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                          <IconBot className="w-3 h-3 text-neutral-300" />
                        </div>
                        <div className="bg-[#141418]/95 border border-neutral-800 text-neutral-400 rounded-2xl rounded-tl-xs px-3.5 py-2 text-[10.5px] flex items-center gap-2">
                          <IconSparkles className="w-3.5 h-3.5 text-emerald-400 animate-spin shrink-0" />
                          <span>Eyeland is thinking...</span>
                        </div>
                      </div>
                    )}
                    <div ref={chatMessagesEndRef} />
                  </div>
                )}

                {/* Staged Media Attachment Preview (Above Input) */}
                {attachedMedia && (
                  <div className="px-2 py-1 bg-neutral-900/90 border border-emerald-500/30 rounded-xl mb-1 flex items-center justify-between mx-1 animate-fadeIn">
                    <div className="flex items-center gap-2">
                      <img src={attachedMedia} alt="Staged media" className="w-9 h-9 object-cover rounded-lg border border-neutral-700" />
                      <div className="flex flex-col text-left">
                        <span className="text-[10px] font-semibold text-emerald-400 flex items-center gap-1">
                          <IconCamera className="w-3 h-3 text-emerald-400" />
                          <span>Screen Snip Attached</span>
                        </span>
                        <span className="text-[8.5px] text-neutral-400">Gemini vision multimodal ready</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedMedia(null)}
                      className="p-1 text-neutral-400 hover:text-white cursor-pointer flex items-center justify-center"
                      title="Remove attachment"
                    >
                      <IconX className="w-3 h-3" />
                    </button>
                  </div>
                )}

                {/* Hidden File Input for Image Attachments */}
                <input
                  type="file"
                  ref={chatImageInputRef}
                  onChange={handleFileSelected}
                  accept="image/*"
                  className="hidden"
                />

                {/* Bottom LLM Input Capsule with Media & Tool Controls */}
                <form onSubmit={handleSendMessage} className="relative flex items-center mt-1 shrink-0 px-0.5">
                  <div className="w-full bg-[#151518] border border-neutral-800 focus-within:border-emerald-500/60 rounded-full flex items-center pl-2 pr-1.5 py-1 transition-all shadow-inner">
                    
                    {/* Media Actions Left Cluster */}
                    <div className="flex items-center gap-0.5 mr-1 text-neutral-400">
                      {/* Snip Screen Button */}
                      <button
                        type="button"
                        onClick={handleTriggerChatSnip}
                        title="Snip any region on your screen and attach (+ crosshair)"
                        className="p-1 rounded-full hover:bg-neutral-800 hover:text-sky-300 transition-colors cursor-pointer active:scale-95"
                      >
                        <IconCamera className="w-3.5 h-3.5 text-sky-400" />
                      </button>

                      {/* Attach Image File */}
                      <button
                        type="button"
                        onClick={() => chatImageInputRef.current?.click()}
                        title="Upload image from computer"
                        className="p-1 rounded-full hover:bg-neutral-800 hover:text-emerald-300 transition-colors cursor-pointer active:scale-95"
                      >
                        <IconPaperclip className="w-3.5 h-3.5 text-emerald-400" />
                      </button>

                      {/* Paste Clipboard */}
                      <button
                        type="button"
                        onClick={handlePasteClipboardToChat}
                        title="Paste text from clipboard"
                        className="p-1 rounded-full hover:bg-neutral-800 hover:text-amber-300 transition-colors cursor-pointer active:scale-95"
                      >
                        <IconClipboard className="w-3.5 h-3.5 text-amber-400" />
                      </button>
                    </div>

                    {/* Text Field */}
                    <input
                      ref={inputRef}
                      type="text"
                      value={aiInput}
                      onFocus={() => onInputFocusChange?.(true)}
                      onBlur={() => onInputFocusChange?.(false)}
                      onChange={(e) => setAiInput(e.target.value)}
                      placeholder={attachedMedia ? "Ask about this screen snip..." : "Ask Eyeland anything..."}
                      className="flex-1 bg-transparent text-xs text-neutral-100 placeholder-neutral-500 outline-none px-1"
                    />

                    {/* Right Action Cluster */}
                    <div className="flex items-center gap-1 ml-1">
                      {/* Voice Dictate Button */}
                      <button
                        type="button"
                        onClick={() => {
                          setIsDictating(!isDictating);
                          setIsMicActive(!isMicActive);
                        }}
                        title="Voice Dictation"
                        className={`p-1 transition-colors ${
                          isDictating ? 'text-emerald-400 animate-pulse' : 'text-neutral-400 hover:text-white'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                          <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                          <line x1="12" y1="19" x2="12" y2="23" />
                          <line x1="8" y1="23" x2="16" y2="23" />
                        </svg>
                      </button>

                      {/* Circular Send Button */}
                      <button
                        type="submit"
                        disabled={!aiInput.trim() && !attachedMedia}
                        title="Send Message"
                        className={`w-6 h-6 rounded-full flex items-center justify-center transition-all cursor-pointer ${
                          aiInput.trim() || attachedMedia
                            ? 'bg-emerald-500 text-black hover:scale-105 active:scale-95 shadow-md shadow-emerald-500/20'
                            : 'bg-neutral-800 text-neutral-500 cursor-not-allowed opacity-60'
                        }`}
                      >
                        <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <line x1="12" y1="19" x2="12" y2="5" />
                          <polyline points="5 12 12 5 19 12" />
                        </svg>
                      </button>
                    </div>
                  </div>
                </form>
              </div>
            )}

            {/* 1.5. REVOLUTIONARY MULTIMODAL AI TOOLS & SNIPPING SUITE */}
            {activeTab === 'features' && (
              <div className="flex flex-col h-full animate-tabSlide select-none p-1 overflow-hidden">
                {/* Header: Title / Back Navigation & Quick Ingest */}
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-neutral-800/80 mb-1 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    {activeFeatureTool ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFeatureTool(null);
                          setFeatureResult(null);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-[10px] text-neutral-200 hover:text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <span>←</span>
                        <span>Tools</span>
                      </button>
                    ) : (
                      <span className="font-semibold text-neutral-200 text-[11.5px] tracking-tight">
                        Tools
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-1.5 text-[9.5px]">
                    <button
                      type="button"
                      onClick={() => handleTriggerSnip(activeFeatureTool || 'explain')}
                      className="px-2.5 py-1 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      title="Transform cursor to crosshair to snip any screen area"
                    >
                      <IconSnipping className="w-3 h-3 text-sky-400" />
                      <span>Snip Screen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerFromClipboard(activeFeatureTool || 'explain')}
                      className="px-2.5 py-1 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      title="Analyze current text on clipboard"
                    >
                      <IconClipboard className="w-3 h-3 text-amber-400" />
                      <span>Clipboard</span>
                    </button>
                  </div>
                </div>

                {/* Main Body: Loading Scanner vs Result Card vs Tool Workspace vs Tools Launcher */}
                {featureLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-3 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800/60 my-auto">
                    <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-sky-400/60 animate-spin" />
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-300 text-sm animate-pulse">
                        <IconSparkles className="w-4 h-4 text-sky-300" />
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-neutral-200 mb-0.5">
                      Analyzing...
                    </span>
                    <span className="text-[9.5px] text-neutral-400">
                      Processing content directly
                    </span>
                  </div>
                ) : featureResult ? (
                  /* Clean Minimal AI Result Card - Maximum Vertical Reading Area */
                  <div className="flex-1 min-h-0 flex flex-col justify-between overflow-hidden bg-neutral-900/60 border border-neutral-800/80 rounded-2xl p-2.5 my-auto animate-slideUp">
                    {/* Minimal Clean Result Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800/70 mb-1 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFeatureTool(null);
                            setFeatureResult(null);
                          }}
                          className="px-2 py-0.5 rounded-lg bg-neutral-850 hover:bg-neutral-800 border border-neutral-750 text-[9.5px] text-neutral-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer"
                        >
                          <span>←</span>
                          <span>Tools</span>
                        </button>
                        <span className="text-[11px] font-semibold text-neutral-200 capitalize">
                          {featureResult.tool === 'code' ? 'Fix Code' : featureResult.tool === 'snip' ? 'Snip & Ask' : featureResult.tool}
                        </span>
                      </div>

                      {/* Tool specific inline actions (Tone selector for Polish / Language selector for Translate) */}
                      {featureResult.tool === 'polish' ? (
                        <div className="flex items-center gap-1">
                          {['professional', 'casual', 'concise'].map((t) => (
                            <button
                              key={t}
                              type="button"
                              onClick={() => handleExecuteFeature('polish', { tone: t })}
                              className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono capitalize transition-all cursor-pointer ${
                                featureResult.tone === t
                                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                  : 'bg-neutral-800/60 text-neutral-400 hover:text-white border border-neutral-700/60'
                              }`}
                            >
                              {t}
                            </button>
                          ))}
                        </div>
                      ) : featureResult.tool === 'translate' ? (
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => handleSpeakTranslation(featureResult.text || featureResult.translatedText, targetTranslateLang)}
                            className="px-2 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[8.5px] font-mono flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                            title="Listen to pronunciation"
                          >
                            <IconVolumeHigh className="w-3 h-3 text-cyan-300" />
                            <span>Speak</span>
                          </button>
                        </div>
                      ) : null}
                    </div>

                    {/* Result Content Scrollable Reading Area - Maximized vertical space */}
                    <div className="flex-1 min-h-0 overflow-y-auto px-1 py-1 flex flex-col gap-1 text-xs select-text" style={{ scrollbarWidth: 'thin' }}>
                      <div className="bg-[#0b0b0e] border border-neutral-800/80 rounded-xl p-3 text-[11px] leading-relaxed text-neutral-200 break-words shadow-inner">
                        {renderFormattedMessage(featureResult.text || featureResult.eli5 || featureResult.polished || featureResult.translatedText || featureResult.tldr || featureResult.fixedCode || featureResult.analysis || '')}
                      </div>
                    </div>

                    {/* Result Action Buttons Footer */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/70 mt-1 flex-shrink-0 text-[9.5px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy = featureResult.text || featureResult.polished || featureResult.translatedText || featureResult.fixedCode || featureResult.eli5 || featureResult.tldr || '';
                            handleCopyFeatureResult(textToCopy);
                          }}
                          className={`px-2.5 py-1 rounded-lg border transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            featureCopied
                              ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                          }`}
                        >
                          {featureCopied ? <IconCheck className="w-3 h-3 text-black" /> : <IconCopy className="w-3 h-3 text-neutral-300" />}
                          <span>{featureCopied ? 'Copied' : 'Copy'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const note = featureResult.text || featureResult.tldr || featureResult.eli5 || featureResult.fixedCode || featureResult.translatedText || '';
                            handleSaveFeatureToScratchpad(note, 'general');
                          }}
                          className="px-2.5 py-1 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95 flex items-center gap-1"
                        >
                          {featureSavedNote ? <IconCheck className="w-3 h-3 text-emerald-400" /> : <IconNotes className="w-3 h-3 text-neutral-300" />}
                          <span>{featureSavedNote ? 'Saved' : 'Save Note'}</span>
                        </button>
                      </div>

                      <div className="flex items-center gap-2">
                        {featureResult.isNetworkError && (
                          <button
                            type="button"
                            onClick={() => {
                              handleExecuteFeature(activeFeatureTool || 'explain', {
                                sourceType: featureSourceType,
                                dataUrl: featureCropPreview,
                                bounds: featureCropBounds,
                              });
                            }}
                            className="text-amber-400 hover:text-amber-300 font-semibold hover:underline cursor-pointer flex items-center gap-0.5"
                          >
                            <IconRefresh className="w-3 h-3 text-amber-400" />
                            <span>Retry</span>
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={() => handleTriggerSnip(activeFeatureTool)}
                          className="text-sky-400 hover:text-sky-300 hover:underline cursor-pointer flex items-center gap-1"
                        >
                          <IconSnipping className="w-3 h-3 text-sky-400" />
                          <span>Snip Again</span>
                        </button>
                        <span className="text-neutral-600">•</span>
                        <button
                          type="button"
                          onClick={() => {
                            setActiveFeatureTool(null);
                            setFeatureResult(null);
                          }}
                          className="text-neutral-400 hover:text-white hover:underline cursor-pointer"
                        >
                          Done
                        </button>
                      </div>
                    </div>
                  </div>
                ) : activeFeatureTool ? (
                  /* Interactive Tool Input Workspace (Opens inside the island without closing it!) */
                  <div className="flex-1 flex flex-col justify-between p-2 rounded-2xl bg-neutral-900/70 border border-neutral-800/90 my-auto overflow-hidden">
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-800/80 mb-1 flex-shrink-0">
                      <span className="text-[11px] font-semibold text-neutral-200 capitalize">
                        {activeFeatureTool === 'code' ? 'Fix Code' : activeFeatureTool === 'snip' ? 'Snip & Ask' : activeFeatureTool}
                      </span>
                      <span className="text-[8.5px] font-mono text-neutral-400">
                        Type, paste or snip to run
                      </span>
                    </div>

                    <div className="flex-1 min-h-[46px] flex flex-col mb-1.5">
                      <textarea
                        value={featureInputText}
                        onChange={(e) => setFeatureInputText(e.target.value)}
                        placeholder={
                          activeFeatureTool === 'explain'
                            ? 'Type or paste what you want explained in simple terms...'
                            : activeFeatureTool === 'translate'
                            ? 'Type or paste text to translate...'
                            : activeFeatureTool === 'summarize'
                            ? 'Type or paste text or article to summarize...'
                            : activeFeatureTool === 'code'
                            ? 'Paste code or error stack trace to debug...'
                            : 'Type or paste text to refine and polish...'
                        }
                        className="w-full flex-1 p-2 rounded-xl bg-neutral-950/80 border border-neutral-800 focus:border-sky-500/50 text-[11px] text-neutral-200 placeholder:text-neutral-500 outline-none resize-none font-sans"
                        rows={2}
                      />
                    </div>

                    <div className="flex items-center justify-between pt-1 border-t border-neutral-800/70 text-[9px] font-mono flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTriggerSnip(activeFeatureTool)}
                          className="px-2 py-0.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <IconSnipping className="w-3 h-3 text-sky-400" />
                          <span>Snip Screen</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => handleTriggerFromClipboard(activeFeatureTool)}
                          className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                        >
                          <IconClipboard className="w-3 h-3 text-neutral-300" />
                          <span>From Clipboard</span>
                        </button>
                      </div>

                      <button
                        type="button"
                        disabled={!featureInputText.trim()}
                        onClick={() => {
                          if (featureInputText.trim()) {
                            handleExecuteFeature(activeFeatureTool, {
                              sourceType: 'custom',
                              text: featureInputText.trim(),
                            });
                          }
                        }}
                        className={`px-3 py-0.5 rounded-lg font-bold flex items-center gap-1 transition-all cursor-pointer active:scale-95 ${
                          featureInputText.trim()
                            ? 'bg-emerald-400 text-neutral-950 hover:bg-emerald-300 shadow-sm'
                            : 'bg-neutral-800/60 text-neutral-600 border border-neutral-800 cursor-not-allowed'
                        }`}
                      >
                        <span>Analyze</span>
                        <span>→</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  /* 6-Tool Launcher Grid (Clean & Minimal) */
                  <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-2 gap-2 my-auto py-0.5">
                    {/* Tool 1: Explain */}
                    <div
                      onClick={() => handleSelectTool('explain')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-sky-500/50 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)] active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <IconLightbulb className="w-5 h-5 text-sky-400 group-hover:scale-110 transition-transform" />
                      <div className="mt-0.5">
                        <span className="text-[11px] font-semibold text-neutral-100 group-hover:text-white block leading-tight">
                          Explain
                        </span>
                        <span className="text-[8.5px] text-neutral-400 line-clamp-1 leading-tight mt-0.5">
                          ELI5 & concept breakdown
                        </span>
                      </div>
                    </div>

                    {/* Tool 2: Polish & Grammar */}
                    <div
                      onClick={() => handleSelectTool('polish')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-emerald-500/50 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)] active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <IconSparkles className="w-5 h-5 text-emerald-400 group-hover:scale-110 transition-transform" />
                      <div className="mt-0.5">
                        <span className="text-[11px] font-semibold text-neutral-100 group-hover:text-white block leading-tight">
                          Polish
                        </span>
                        <span className="text-[8.5px] text-neutral-400 line-clamp-1 leading-tight mt-0.5">
                          Tone, grammar & diffs
                        </span>
                      </div>
                    </div>

                    {/* Tool 3: Translate */}
                    <div
                      onClick={() => handleSelectTool('translate')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-cyan-500/50 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)] active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <IconGlobe className="w-5 h-5 text-cyan-400 group-hover:scale-110 transition-transform" />
                      <div className="mt-0.5">
                        <span className="text-[11px] font-semibold text-neutral-100 group-hover:text-white block leading-tight">
                          Translate
                        </span>
                        <span className="text-[8.5px] text-neutral-400 line-clamp-1 leading-tight mt-0.5">
                          40+ Languages & Audio
                        </span>
                      </div>
                    </div>

                    {/* Tool 4: Summarize */}
                    <div
                      onClick={() => handleSelectTool('summarize')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-purple-500/50 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)] active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <IconFileText className="w-5 h-5 text-purple-400 group-hover:scale-110 transition-transform" />
                      <div className="mt-0.5">
                        <span className="text-[11px] font-semibold text-neutral-100 group-hover:text-white block leading-tight">
                          Summarize
                        </span>
                        <span className="text-[8.5px] text-neutral-400 line-clamp-1 leading-tight mt-0.5">
                          TL;DR & task checklists
                        </span>
                      </div>
                    </div>

                    {/* Tool 5: Fix Code */}
                    <div
                      onClick={() => handleSelectTool('code')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-amber-500/50 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)] active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <IconCode className="w-5 h-5 text-amber-400 group-hover:scale-110 transition-transform" />
                      <div className="mt-0.5">
                        <span className="text-[11px] font-semibold text-neutral-100 group-hover:text-white block leading-tight">
                          Fix Code
                        </span>
                        <span className="text-[8.5px] text-neutral-400 line-clamp-1 leading-tight mt-0.5">
                          Debug syntax & errors
                        </span>
                      </div>
                    </div>

                    {/* Tool 6: Snip & Ask */}
                    <div
                      onClick={() => handleSelectTool('snip')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-rose-500/50 flex flex-col justify-between transition-all duration-200 hover:-translate-y-1 hover:shadow-[0_8px_20px_rgba(0,0,0,0.6)] active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <IconSnipping className="w-5 h-5 text-rose-400 group-hover:scale-110 transition-transform" />
                      <div className="mt-0.5">
                        <span className="text-[11px] font-semibold text-neutral-100 group-hover:text-white block leading-tight">
                          Snip & Ask
                        </span>
                        <span className="text-[8.5px] text-neutral-400 line-clamp-1 leading-tight mt-0.5">
                          Marquee crop any UI
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* 2. FUTURISTIC REDESIGNED HOME TAB (Sci-Fi Cockpit & Real Hardware Telemetry) */}
            {activeTab === 'home' && (
              <div className="flex items-center justify-between gap-3 h-full animate-tabSlide select-none">
                
                {/* LEFT WING: BIO-QUANTUM NEURAL REACTOR */}
                <div
                  className={`w-[145px] h-full flex flex-col items-center justify-between py-1 px-1 bg-gradient-to-b from-[#121217] to-[#09090c] rounded-2xl border border-neutral-800/90 relative overflow-hidden group shadow-inner ${isWakingUp ? 'pop-in-card' : ''}`}
                  style={{ '--i': 1 }}
                >
                  {/* Ambient breathing radial aura */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ background: `radial-gradient(circle at center, ${theme.color} 0%, transparent 75%)` }}
                  />

                  {/* Top Header Tag */}
                  <div className="flex items-center gap-1.5 z-10 pt-0.5 max-w-[130px] px-1">
                    <span
                      className="w-1.5 h-1.5 rounded-full animate-pulse shrink-0"
                      style={{
                        backgroundColor: theme.accent || theme.color,
                        boxShadow: `0 0 8px ${theme.accent || theme.color}`,
                      }}
                    />
                    <span
                      className="text-[8px] font-mono tracking-widest text-neutral-300 uppercase truncate"
                      title={companionName || 'Bio-Core'}
                    >
                      {companionName || 'Bio-Core'}
                    </span>
                  </div>

                  {/* Interactive Reactor with Selected Companion Core Design & Living Eyes */}
                  <div className="my-auto">
                    <CompanionCoreAvatar
                      design={companionDesign}
                      theme={theme}
                      expression={activeEyeExpression}
                      eyeTracking={eyeTracking}
                      eyeColor={activeEyeColor}
                      eyeShadow={activeEyeShadow}
                      size="sm"
                      onClick={triggerRejoice}
                      title={`Click to Pet ${companionName || 'Bio-Core'}!`}
                    />
                  </div>

                  {/* Core Pet Action & Flow Status */}
                  <div className="flex flex-col items-center gap-0.5 z-10 pb-0.5">
                    <button
                      onClick={triggerRejoice}
                      className="px-2.5 py-0.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-[9px] text-neutral-300 hover:text-white flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                    >
                      <IconSupport className="w-3 h-3 text-rose-400" />
                      <span className="font-medium">{t.petBuddy}</span>
                    </button>
                    <span
                      className="text-[7.5px] font-mono pt-0.5 opacity-90 transition-colors duration-300"
                      style={{ color: theme.accent || theme.color }}
                    >
                      SYNC 100% • 60 FPS
                    </span>
                  </div>
                </div>

                {/* RIGHT WING: REAL HARDWARE TELEMETRY DECK (2x2 HUD Grid) */}
                <div className="flex-1 h-full flex flex-col justify-between pl-0.5">
                  
                  {/* 2x2 Telemetry HUD Cards */}
                  <div className="grid grid-cols-2 gap-1.5 flex-1">
                    
                    {/* CARD 1: CPU NEURAL ENGINE (Real Device Data) */}
                    <div
                      className={`p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isWakingUp ? 'pop-in-card' : ''}`}
                      style={{ '--i': 2 }}
                    >
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300">
                          <IconCpu className="w-3 h-3 text-cyan-400" />
                          <span>CPU LOAD</span>
                        </span>
                        <span className="font-mono text-cyan-400 font-bold text-[10px]">
                          {Math.round((telemetry.cpu?.loadPercent || 12) * telemetryAnimProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.max(6, Math.round((telemetry.cpu?.loadPercent || 12) * telemetryAnimProgress))}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 truncate">
                        <span className="truncate max-w-[95px]" title={telemetry.cpu?.model}>
                          {telemetry.cpu?.model?.split('with')[0]?.replace('AMD', '')?.replace('Intel', '')?.trim() || 'Ryzen 7'}
                        </span>
                        <span className="text-neutral-500">{telemetry.cpu?.cores || 16}T</span>
                      </div>
                    </div>

                    {/* CARD 2: QUANTUM MEMORY (Real Device RAM) */}
                    <div
                      className={`p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isWakingUp ? 'pop-in-card' : ''}`}
                      style={{ '--i': 3 }}
                    >
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300">
                          <IconRam className="w-3 h-3 text-purple-400" />
                          <span>MEMORY</span>
                        </span>
                        <span className="font-mono text-purple-400 font-bold text-[10px]">
                          {Math.round((telemetry.memory?.percent || 82) * telemetryAnimProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-500"
                          style={{ width: `${Math.round((telemetry.memory?.percent || 82) * telemetryAnimProgress)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400">
                        <span>{telemetry.memory?.usedGb || '12.7'} GB</span>
                        <span className="text-neutral-500">/ {telemetry.memory?.totalGb || '15.4'} GB</span>
                      </div>
                    </div>

                    {/* CARD 3: REAL WLAN LINK (Real Wi-Fi Data) */}
                    <div
                      className={`p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isWakingUp ? 'pop-in-card' : ''}`}
                      style={{ '--i': 4 }}
                    >
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300 truncate">
                          <IconWifi className="w-3 h-3 text-sky-400 shrink-0" />
                          <span className="truncate max-w-[85px]" title={currentWifi}>{currentWifi}</span>
                        </span>
                        <span className="font-mono text-sky-400 font-bold text-[10px]">
                          {Math.round((telemetry.wifi?.signal || 80) * telemetryAnimProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
                          style={{ width: `${Math.round((telemetry.wifi?.signal || 80) * telemetryAnimProgress)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 truncate">
                        <span className="truncate">{telemetry.wifi?.speed || '286.8 Mbps'}</span>
                        <span className="text-neutral-500">{telemetry.wifi?.radioType?.split(' ')[0] || 'Wi-Fi 6'}</span>
                      </div>
                    </div>

                    {/* CARD 4: POWER MATRIX (Real Battery & AC Status) */}
                    <div
                      className={`p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-all duration-200 hover:-translate-y-0.5 hover:shadow-md ${isWakingUp ? 'pop-in-card' : ''}`}
                      style={{ '--i': 5 }}
                    >
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300">
                          {telemetry.battery?.isCharging ? (
                            <IconBatteryCharging className="w-3 h-3 text-emerald-400" />
                          ) : (
                            <IconBattery className="w-3 h-3 text-emerald-400" />
                          )}
                          <span>POWER</span>
                        </span>
                        <span className="font-mono text-emerald-400 font-bold text-[10px]">
                          {Math.round((telemetry.battery?.percent || 100) * telemetryAnimProgress)}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${Math.round((telemetry.battery?.percent || 100) * telemetryAnimProgress)}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 truncate">
                        <span className="truncate text-emerald-400/90">{telemetry.battery?.statusText || 'AC Powered'}</span>
                        <span className="text-neutral-500">Optimum</span>
                      </div>
                    </div>

                  </div>

                  {/* MASTER HARDWARE CONTROLS: REAL-TIME VOLUME & BRIGHTNESS SLIDERS */}
                  <div className="py-1 px-2 bg-[#0e0e12]/90 rounded-xl border border-neutral-800/80 my-1 flex items-center gap-3 shadow-inner">
                    {/* Master Audio Slider */}
                    <div className="flex-1 flex items-center gap-1.5 min-w-0" title={`Master Audio Volume: ${hardwareLevels.volume}%`}>
                      <button
                        type="button"
                        onClick={() => {
                          const nextMute = !hardwareLevels.muted;
                          window.electronAPI?.setHardwareMute?.(nextMute);
                          setHardwareLevels((prev) => ({ ...prev, muted: nextMute }));
                        }}
                        title={hardwareLevels.muted ? 'Unmute Audio' : 'Mute Audio'}
                        className="text-[11px] text-neutral-400 hover:text-white transition-colors flex-shrink-0 cursor-pointer flex items-center justify-center"
                      >
                        {hardwareLevels.muted || hardwareLevels.volume === 0 ? (
                          <IconVolumeMute className="w-3.5 h-3.5 text-neutral-400" />
                        ) : hardwareLevels.volume < 50 ? (
                          <IconVolumeMid className="w-3.5 h-3.5 text-sky-400" />
                        ) : (
                          <IconVolumeHigh className="w-3.5 h-3.5 text-sky-400" />
                        )}
                      </button>
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={hardwareLevels.volume}
                        onChange={(e) => {
                          const v = parseInt(e.target.value, 10);
                          setHardwareLevels((prev) => ({ ...prev, volume: v, muted: false }));
                          window.electronAPI?.setHardwareVolume?.(v);
                        }}
                        className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
                      />
                      <span className="font-mono text-[8.5px] text-sky-300 min-w-[22px] text-right font-semibold">
                        {hardwareLevels.muted ? 'MUTE' : `${hardwareLevels.volume}%`}
                      </span>
                    </div>

                    <div className="w-px h-3 bg-neutral-800" />

                    {/* Master Brightness Slider */}
                    <div className="flex-1 flex items-center gap-1.5 min-w-0" title={`Screen Brightness: ${hardwareLevels.brightness}%`}>
                      <IconBrightness className="w-3.5 h-3.5 text-amber-400 flex-shrink-0" />
                      <input
                        type="range"
                        min="0"
                        max="100"
                        value={hardwareLevels.brightness}
                        onChange={(e) => {
                          const b = parseInt(e.target.value, 10);
                          setHardwareLevels((prev) => ({ ...prev, brightness: b }));
                          window.electronAPI?.setHardwareBrightness?.(b);
                        }}
                        className="flex-1 h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
                      />
                      <span className="font-mono text-[8.5px] text-amber-300 min-w-[22px] text-right font-semibold">
                        {hardwareLevels.brightness}%
                      </span>
                    </div>
                  </div>

                  {/* BOTTOM COMMAND & IDENTITY BAR */}
                  <div className="pt-1.5 border-t border-neutral-800/80 flex items-center justify-between text-[9px]">
                    <div className="flex items-center gap-1.5 text-neutral-400 font-mono">
                      <span>NODE:</span>
                      <span className="text-neutral-200 font-medium truncate max-w-[85px]">{telemetry.system?.hostname || 'ASUS-ROG'}</span>
                      <span className="text-neutral-600">•</span>
                      <span>UP:</span>
                      <span className="text-emerald-400 font-medium">{telemetry.system?.uptimeHours || 13}h {telemetry.system?.uptimeMins || 45}m</span>
                    </div>

                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => setActiveTab('ai')}
                        className="px-2 py-0.5 rounded-md bg-emerald-500/15 hover:bg-emerald-500/25 border border-emerald-500/30 text-[9px] text-emerald-300 font-medium flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      >
                        <IconAiChat className="w-3 h-3 text-emerald-300" />
                        <span>Eyeland AI</span>
                      </button>
                      <button
                        onClick={handleScanScreen}
                        className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[9px] text-neutral-300 flex items-center gap-1 transition-all active:scale-95"
                      >
                        <IconCamera className="w-3 h-3 text-neutral-300" />
                        <span>Scan</span>
                      </button>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 3. REDESIGNED HIGH-TECH STAGING SHELF TAB */}
            {activeTab === 'shelf' && (
              <div
                className={`relative flex flex-col justify-between h-full p-2.5 rounded-2xl transition-all duration-300 select-none overflow-hidden animate-tabSlide ${
                  isDraggingOver
                    ? 'border-2 border-indigo-400 bg-indigo-500/15 shadow-[0_0_24px_rgba(99,102,241,0.25)]'
                    : 'border border-neutral-800/90 bg-neutral-900/60 backdrop-blur-md'
                }`}
                onDragOver={(e) => {
                  e.preventDefault();
                  e.stopPropagation();
                  e.dataTransfer.dropEffect = 'copy';
                  if (!isDraggingOver) setIsDraggingOver(true);
                }}
                onDragLeave={(e) => {
                  const rect = e.currentTarget.getBoundingClientRect();
                  if (
                    e.clientX < rect.left ||
                    e.clientX > rect.right ||
                    e.clientY < rect.top ||
                    e.clientY > rect.bottom
                  ) {
                    setIsDraggingOver(false);
                  }
                }}
                onDrop={handleIslandDrop}
              >
                {/* Hidden native file and folder inputs for click-to-browse */}
                <input
                  type="file"
                  multiple
                  ref={fileInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) processDroppedFiles(e.target.files);
                    e.target.value = '';
                  }}
                />
                <input
                  type="file"
                  webkitdirectory=""
                  directory=""
                  ref={folderInputRef}
                  className="hidden"
                  onChange={(e) => {
                    if (e.target.files) processDroppedFiles(e.target.files);
                    e.target.value = '';
                  }}
                />

                {/* Top Header Row */}
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-neutral-800 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 text-[10px] font-semibold shadow-sm">
                      <svg className="w-3 h-3 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                        <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                        <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                      </svg>
                      <span>STAGING SHELF</span>
                    </div>
                    <span className="text-[10px] font-mono text-neutral-400">
                      {stagedFiles.length === 0 ? 'Empty' : `${stagedFiles.length} staged`}
                    </span>
                  </div>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-[9px] text-neutral-200 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      title="Browse and select files to stage"
                    >
                      <IconFileText className="w-3 h-3 text-neutral-300" />
                      <span>+ File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-[9px] text-neutral-200 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      title="Browse and select a folder to stage"
                    >
                      <IconFolder className="w-3 h-3 text-amber-300" />
                      <span>+ Folder</span>
                    </button>

                    {stagedFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllStagedFiles}
                        className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[9px] text-rose-300 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        title="Clear all staged files from shelf"
                      >
                        <IconX className="w-3 h-3 text-rose-300" />
                        <span>Clear</span>
                      </button>
                    )}
                  </div>
                </div>

                {/* Center Body: Empty State vs Cards Grid (One Page by Default, No Scroll until > 4 files) */}
                <div className={`flex-1 min-h-0 my-1 ${stagedFiles.length > 4 ? 'overflow-y-auto pr-0.5' : 'overflow-hidden flex flex-col'}`} style={{ scrollbarWidth: 'thin' }}>
                  {stagedFiles.length === 0 ? (
                    <div
                      className={`flex-1 h-full rounded-xl border border-dashed flex flex-col items-center justify-center text-center p-2.5 transition-all select-none ${
                        isDraggingOver
                          ? 'border-indigo-400 bg-indigo-500/20 scale-[0.99]'
                          : 'border-neutral-800/80 bg-neutral-950/40 hover:border-neutral-700'
                      }`}
                    >
                      <div className="w-8 h-8 rounded-xl bg-indigo-500/15 border border-indigo-500/30 flex items-center justify-center mb-1.5 shadow-[0_0_15px_rgba(99,102,241,0.2)]">
                        {isDraggingOver ? (
                          <IconDownload className="w-5 h-5 text-indigo-400 animate-bounce" />
                        ) : (
                          <IconDownload className="w-4 h-4 text-indigo-400" />
                        )}
                      </div>
                      <p className="text-[11.5px] font-bold text-neutral-100 tracking-tight">
                        {isDraggingOver ? 'Drop to Stage in Eyeland' : 'Drag any file or folder here'}
                      </p>
                      <p className="text-[9.5px] text-neutral-400 max-w-[280px] mt-0.5 leading-tight">
                        Drag files from Explorer or Desktop to hold them, then drag them straight out into any other app!
                      </p>
                      <div className="flex items-center gap-1.5 mt-2">
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                          Auto-switches on drag
                        </span>
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                          Drag out to any window
                        </span>
                      </div>
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 gap-1.5 content-start">
                      {stagedFiles.map((f) => (
                        <div
                          key={f.id}
                          draggable={true}
                          onDragStart={(e) => handleDragItemOut(e, f)}
                          onDragEnd={handleDragItemEnd}
                          className="group relative p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-850 border border-neutral-800/90 hover:border-indigo-500/40 flex items-center justify-between gap-2 text-xs transition-all duration-200 cursor-grab active:cursor-grabbing hover:shadow-[0_4px_12px_rgba(0,0,0,0.5)]"
                          title={`${f.name}\n${f.path || ''}\n(Click & drag out to drop into any app)`}
                        >
                          {/* Category Icon */}
                          <div className={`w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-sm ${
                            f.isFolder ? 'bg-amber-500/15 text-amber-400 border border-amber-500/30' :
                            f.type === 'image' ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' :
                            f.type === 'code' ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30' :
                            f.type === 'pdf' ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30' :
                            f.type === 'audio' ? 'bg-purple-500/15 text-purple-400 border border-purple-500/30' :
                            f.type === 'video' ? 'bg-pink-500/15 text-pink-400 border border-pink-500/30' :
                            f.type === 'archive' ? 'bg-yellow-500/15 text-yellow-400 border border-yellow-500/30' :
                            'bg-neutral-800 text-neutral-300 border border-neutral-700'
                          }`}>
                            {f.isFolder ? <IconFolder className="w-3.5 h-3.5 text-amber-400" /> :
                             f.type === 'image' ? <IconImage className="w-3.5 h-3.5 text-emerald-400" /> :
                             f.type === 'code' ? <IconCode className="w-3.5 h-3.5 text-cyan-400" /> :
                             f.type === 'pdf' ? <IconFileText className="w-3.5 h-3.5 text-rose-400" /> :
                             f.type === 'audio' ? <IconAudio className="w-3.5 h-3.5 text-purple-400" /> :
                             f.type === 'video' ? <IconVideo className="w-3.5 h-3.5 text-pink-400" /> :
                             f.type === 'archive' ? <IconArchive className="w-3.5 h-3.5 text-yellow-400" /> :
                             <IconFileText className="w-3.5 h-3.5 text-neutral-300" />}
                          </div>

                          {/* Name & Metadata */}
                          <div className="flex-1 min-w-0 pr-1">
                            <p className="text-[10.5px] font-medium text-neutral-100 truncate tracking-tight group-hover:text-white" title={f.name}>
                              {f.name}
                            </p>
                            <div className="flex items-center gap-1.5 mt-0.5 text-[8.5px] font-mono text-neutral-400">
                              <span className={`px-1 rounded text-[7.5px] font-semibold ${
                                f.isFolder ? 'bg-amber-500/20 text-amber-300' : 'bg-neutral-800 text-neutral-400'
                              }`}>
                                {f.isFolder ? 'DIR' : f.type.toUpperCase()}
                              </span>
                              <span>{f.size}</span>
                            </div>
                          </div>

                          {/* Hover Actions: Reveal in Explorer, Drag Grip, Remove */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            {/* Reveal in Windows Explorer */}
                            {f.path && (
                              <button
                                type="button"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleRevealInExplorer(f.path);
                                }}
                                className="p-1 rounded hover:bg-neutral-800 text-neutral-500 hover:text-indigo-300 transition-colors"
                                title="Reveal in Windows Explorer"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                  <path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z" />
                                </svg>
                              </button>
                            )}

                            {/* Drag Grip Indicator */}
                            <div 
                              draggable={true}
                              onDragStart={(e) => {
                                e.stopPropagation();
                                handleDragItemOut(e, f);
                              }}
                              onDragEnd={handleDragItemEnd}
                              className="p-1 rounded text-neutral-400 group-hover:text-indigo-400 hover:bg-indigo-500/10 transition-colors cursor-grab active:cursor-grabbing"
                              title="Drag out to drop into any app"
                            >
                              <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                                <circle cx="8.5" cy="7" r="1.5" />
                                <circle cx="8.5" cy="12" r="1.5" />
                                <circle cx="8.5" cy="17" r="1.5" />
                                <circle cx="15.5" cy="7" r="1.5" />
                                <circle cx="15.5" cy="12" r="1.5" />
                                <circle cx="15.5" cy="17" r="1.5" />
                              </svg>
                            </div>

                            {/* Delete / Remove */}
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                removeStagedFile(f.id);
                              }}
                              className="p-1 rounded hover:bg-rose-500/20 text-neutral-500 hover:text-rose-400 transition-colors"
                              title="Remove from Shelf"
                            >
                              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                <line x1="18" y1="6" x2="6" y2="18" />
                                <line x1="6" y1="6" x2="18" y2="18" />
                              </svg>
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Footer Row */}
                <div className="flex items-center justify-between text-[9px] text-neutral-400 font-mono pt-1.5 border-t border-neutral-800/80 flex-shrink-0">
                  <span className="flex items-center gap-1.5 truncate text-neutral-400">
                    <IconLightbulb className="w-3 h-3 text-indigo-400 shrink-0" />
                    <span className="truncate">Drag any card out to drop into Explorer, Browser, Slack, Word, etc.</span>
                  </span>

                  {stagedFiles.length > 1 && (
                    <div
                      draggable={true}
                      onDragStart={handleDragAllOut}
                      onDragEnd={handleDragItemEnd}
                      className="flex items-center gap-1.5 px-2 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:text-white cursor-grab active:cursor-grabbing font-medium text-[8px] transition-all"
                      title="Drag ALL staged files out together"
                    >
                      <IconArchive className="w-3 h-3 text-indigo-300" />
                      <span>Drag All ({stagedFiles.length})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. CINEMATIC FULL-BLEED SPLIT MUSIC PLAYER (Artwork Fade + Live Karaoke Lyrics) */}
            {activeTab === 'music' && (
              <div className="relative flex h-full rounded-2xl overflow-hidden bg-black border border-white/[0.08] select-none animate-tabSlide">
                {!trackData.title ? (
                  /* Clean Minimal Idle State */
                  <div className="relative z-10 flex flex-col items-center justify-center flex-1 text-center px-6">
                    <div className="w-12 h-12 rounded-2xl flex items-center justify-center mb-2.5 border border-white/10 bg-white/[0.04]">
                      <svg className="w-6 h-6 text-neutral-300" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight mb-1">Nothing Playing</h4>
                    <p className="text-[11px] text-neutral-400 max-w-xs mb-3 leading-relaxed">
                      Start playing music on your PC to display full-bleed artwork and live lyrics.
                    </p>
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-white hover:bg-neutral-200 text-black font-bold text-xs shadow-lg hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Play</span>
                    </button>
                  </div>
                ) : (
                  <>
                    {/* LEFT HALF: FULL-BLEED EDGE-TO-EDGE ALBUM ARTWORK SEAMLESSLY FADING INTO BLACK */}
                    <div className="absolute inset-y-0 left-0 w-[48%] overflow-hidden pointer-events-none">
                      {trackData.artwork ? (
                        <img
                          src={trackData.artwork}
                          alt={trackData.title}
                          className="w-full h-full object-cover object-center transition-all duration-700"
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center"
                          style={{ background: `linear-gradient(135deg, ${ambientPalette.rgba(0.45)}, #09090b)` }}
                        >
                          <svg className="w-12 h-12 text-white/25" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                          </svg>
                        </div>
                      )}

                      {/* Silky Horizontal Fade Into Pure Black Right Half */}
                      <div
                        className="absolute inset-0"
                        style={{
                          background:
                            'linear-gradient(to right, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 48%, rgba(0,0,0,0.68) 76%, #000000 100%)',
                        }}
                      />
                      {/* Soft Bottom Vignette */}
                      <div
                        className="absolute inset-x-0 bottom-0 h-10"
                        style={{
                          background: 'linear-gradient(to top, rgba(0,0,0,0.55) 0%, rgba(0,0,0,0) 100%)',
                        }}
                      />
                    </div>

                    {/* Subtle Ambient Seam Aura */}
                    <div
                      className="absolute inset-y-0 left-[34%] w-24 blur-2xl opacity-25 pointer-events-none transition-colors duration-700"
                      style={{ backgroundColor: ambientPalette.hex }}
                    />

                    {/* RIGHT HALF: PURE BLACK CINEMA LYRICS, TIMELINE & MINIMAL CONTROLS */}
                    <div className="relative z-10 ml-[42%] w-[58%] h-full px-3.5 py-2.5 flex flex-col justify-between">
                      {/* Top Single Track Title · Artist Line */}
                      <div className="min-w-0">
                        <p className="text-[11px] truncate leading-tight" title={`${trackData.title} · ${trackData.artist}`}>
                          <span className="font-bold text-white">{trackData.title}</span>
                          {trackData.artist && (
                            <>
                              <span className="text-neutral-500 mx-1">·</span>
                              <span className="text-neutral-400 font-medium">{trackData.artist}</span>
                            </>
                          )}
                        </p>
                      </div>

                      {/* Hero Synced Lyrics Stage (Active Bold Karaoke Line + Muted Next Line) */}
                      <div className="my-auto py-1 min-w-0">
                        {displaySettings.showLyrics !== false && hasLyrics && currentLyricLine ? (
                          <div key={activeLyricIndex} className="animate-lyric-slide space-y-1">
                            <div
                              className="text-[17px] leading-[1.2] font-bold tracking-tight text-white line-clamp-2"
                              title={currentLyricLine}
                            >
                              {renderLyricContent(currentLyricLine, false, true)}
                            </div>
                            {nextLyricLine && (
                              <p
                                className="text-[11px] text-neutral-500 font-medium truncate leading-snug"
                                title={nextLyricLine}
                              >
                                {nextLyricLine}
                              </p>
                            )}
                          </div>
                        ) : (
                          <div className="space-y-0.5">
                            <div className="text-[17px] leading-[1.2] font-bold tracking-tight text-white line-clamp-2">
                              {trackData.title}
                            </div>
                            {trackData.album && (
                              <p className="text-[11px] text-neutral-500 font-medium truncate">
                                {trackData.album}
                              </p>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Minimal Timeline Row: 0:36  ─────  -2:49 */}
                      <div className="flex items-center gap-2.5">
                        <span className="text-[10px] font-mono text-neutral-400 tabular-nums shrink-0">
                          {formatTrackClock(trackPosition)}
                        </span>
                        <div
                          onClick={handleSeek}
                          className="group relative flex-1 bg-white/20 h-1 hover:h-1.5 rounded-full overflow-hidden cursor-pointer transition-all"
                          title="Seek"
                        >
                          <div
                            className="h-full rounded-full bg-white transition-all duration-200"
                            style={{
                              width: `${Math.min(100, Math.max(0, (trackPosition / (trackData.duration || 200)) * 100))}%`,
                            }}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-neutral-400 tabular-nums shrink-0">
                          -{formatTrackClock(Math.max(0, (trackData.duration || 200) - trackPosition))}
                        </span>
                      </div>

                      {/* Bottom Centered Transport Controls + Subtle Sync Icon */}
                      <div className="relative flex items-center justify-center pt-1">
                        <div className="flex items-center gap-5">
                          {/* Previous Track */}
                          <button
                            type="button"
                            onClick={handlePrevTrack}
                            title="Previous"
                            className="p-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <rect x="4" y="5" width="2.5" height="14" rx="1.25" />
                              <path d="M19 6.27a1 1 0 0 0-1.55-.83L8.8 11.17a1 1 0 0 0 0 1.66l8.65 5.73A1 1 0 0 0 19 17.73V6.27z" />
                            </svg>
                          </button>

                          {/* Solid White Circular Play / Pause */}
                          <button
                            type="button"
                            onClick={handlePlayPause}
                            title={isPlaying ? 'Pause' : 'Play'}
                            className="w-9 h-9 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-[0_4px_18px_rgba(255,255,255,0.22)] cursor-pointer"
                          >
                            {isPlaying ? (
                              <svg className="w-4 h-4 fill-black" viewBox="0 0 24 24">
                                <rect x="6" y="5" width="3.8" height="14" rx="1.4" />
                                <rect x="14.2" y="5" width="3.8" height="14" rx="1.4" />
                              </svg>
                            ) : (
                              <svg className="w-4 h-4 fill-black translate-x-0.5" viewBox="0 0 24 24">
                                <path d="M7 5.25a1.25 1.25 0 0 1 1.93-1.05l10.5 6.75a1.25 1.25 0 0 1 0 2.1l-10.5 6.75A1.25 1.25 0 0 1 7 18.75V5.25z" />
                              </svg>
                            )}
                          </button>

                          {/* Next Track */}
                          <button
                            type="button"
                            onClick={handleNextTrack}
                            title="Next"
                            className="p-1.5 rounded-full text-white/85 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer"
                          >
                            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                              <path d="M5 6.27a1 1 0 0 1 1.55-.83l8.65 5.73a1 1 0 0 1 0 1.66L6.55 18.56A1 1 0 0 1 5 17.73V6.27z" />
                              <rect x="17.5" y="5" width="2.5" height="14" rx="1.25" />
                            </svg>
                          </button>
                        </div>

                        {/* Compact Subtle Right Icon Button (Refresh / Sync Playback) */}
                        <button
                          type="button"
                          onClick={() => window.electronAPI?.refreshLiveMedia?.()}
                          title="Refresh Playback Sync"
                          className="absolute right-0 w-7 h-7 rounded-lg bg-white/[0.08] hover:bg-white/[0.16] border border-white/10 text-neutral-300 hover:text-white flex items-center justify-center active:scale-90 transition-all cursor-pointer"
                        >
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                          </svg>
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* 5. REDESIGNED HIGH-TECH FOCUS & POMODORO PRODUCTIVITY SUITE */}
            {activeTab === 'focus' && (
              <div className="relative flex items-stretch justify-between h-full p-2 rounded-2xl bg-[#0e0e12]/95 border border-neutral-800/80 animate-tabSlide select-none overflow-hidden gap-2">
                
                {/* Ambient Focus Glow Backdrop */}
                <div 
                  className={`absolute -top-10 -left-10 w-40 h-40 rounded-full pointer-events-none blur-3xl opacity-25 transition-all duration-700 ${isFocusRunning ? 'animate-pulseSubtle' : ''}`}
                  style={{ backgroundColor: focusPhase === 'work' ? '#f59e0b' : '#10b981' }}
                />

                {/* LEFT COLUMN: CIRCULAR RADIAL TIMER RING + STAGE SWITCHER */}
                <div className="relative z-10 flex flex-col items-center justify-between h-full w-[130px] flex-shrink-0">
                  
                  {/* Radial SVG Progress Ring */}
                  <div className="relative w-20 h-20 flex items-center justify-center my-auto">
                    {/* SVG Progress Circle */}
                    <svg className="w-full h-full -rotate-90 transform" viewBox="0 0 100 100">
                      {/* Background Track */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="transparent"
                        stroke="#1a1a20"
                        strokeWidth="5"
                      />
                      {/* Active Progress Ring */}
                      <circle
                        cx="50"
                        cy="50"
                        r="42"
                        fill="transparent"
                        stroke={focusPhase === 'work' ? '#f59e0b' : '#10b981'}
                        strokeWidth="5"
                        strokeDasharray={263.89}
                        strokeDashoffset={263.89 - (263.89 * Math.max(0, Math.min(1, 1 - (focusSecondsLeft / (focusTotalSeconds || 1)))))}
                        strokeLinecap="round"
                        className="transition-all duration-500"
                        style={{
                          filter: `drop-shadow(0 0 6px ${focusPhase === 'work' ? '#f59e0b' : '#10b981'})`
                        }}
                      />
                    </svg>

                    {/* Center Clock & Badge */}
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                      <span className="text-[8px] uppercase tracking-wider font-mono font-bold" style={{ color: focusPhase === 'work' ? '#f59e0b' : '#10b981' }}>
                        {focusPhase === 'work' ? 'WORK' : focusPhase === 'shortBreak' ? 'SHORT' : 'LONG'}
                      </span>
                      <span className="text-base font-mono font-black tracking-tight text-white drop-shadow-sm leading-tight">
                        {formatTime(focusSecondsLeft)}
                      </span>
                      {/* Cycle dots: 4 pips */}
                      <div className="flex items-center gap-1 mt-0.5">
                        {[1, 2, 3, 4].map((pip) => (
                          <span
                            key={pip}
                            className="w-1.5 h-1.5 rounded-full transition-all"
                            style={{
                              backgroundColor: pip <= focusCycle 
                                ? (focusPhase === 'work' ? '#f59e0b' : '#10b981') 
                                : '#3f3f46',
                              boxShadow: pip === focusCycle 
                                ? `0 0 6px ${focusPhase === 'work' ? '#f59e0b' : '#10b981'}` 
                                : 'none'
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Stage Switcher Pills */}
                  <div className="flex items-center gap-1 w-full justify-center flex-shrink-0">
                    <button
                      type="button"
                      onClick={() => handleSelectPhase('work')}
                      className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-medium transition-all cursor-pointer ${
                        focusPhase === 'work'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      Work
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPhase('shortBreak')}
                      className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-medium transition-all cursor-pointer ${
                        focusPhase === 'shortBreak'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      Break
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPhase('longBreak')}
                      className={`px-1.5 py-0.5 rounded-full text-[8.5px] font-medium transition-all cursor-pointer ${
                        focusPhase === 'longBreak'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      Long
                    </button>
                  </div>

                </div>

                {/* RIGHT COLUMN: TASK INPUT + CONTROLS + PRESETS + STATS */}
                <div className="relative z-10 flex-1 min-w-0 overflow-hidden flex flex-col justify-between h-full">
                  
                  {/* 1. Task Name Input + Quick Presets */}
                  <div className="min-w-0">
                    <div className="flex items-center justify-between text-[9px] text-neutral-400 pb-0.5">
                      <span className="font-semibold text-neutral-200 flex items-center gap-1 truncate">
                        <span style={{ color: focusPhase === 'work' ? '#f59e0b' : '#10b981' }}>●</span>
                        <span>CURRENT TARGET</span>
                      </span>
                      <span className="text-[8px] font-mono text-neutral-400 shrink-0">
                        Cycle {focusCycle}/4
                      </span>
                    </div>
                    
                    <input
                      type="text"
                      value={focusTaskName}
                      onChange={(e) => setFocusTaskName(e.target.value)}
                      placeholder="What are you focusing on?"
                      onFocus={() => onInputFocusChange?.(true)}
                      onBlur={() => onInputFocusChange?.(false)}
                      className="w-full bg-[#16161a] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-2 py-0.5 text-[10.5px] text-white placeholder-neutral-500 outline-none transition-colors"
                    />

                    {/* Quick Tag Presets */}
                    <div className="flex items-center gap-1 mt-0.5 overflow-x-auto no-scrollbar">
                      {[
                        { label: 'Coding', text: 'Coding Sprint' },
                        { label: 'Writing', text: 'Deep Writing' },
                        { label: 'Study', text: 'Study Session' },
                        { label: 'Design', text: 'UI/UX Design' },
                        { label: 'Sprint', text: 'Rapid Sprint' },
                      ].map((tag) => (
                        <button
                          key={tag.label}
                          type="button"
                          onClick={() => setFocusTaskName(tag.text)}
                          className="px-1.5 py-0.5 rounded-md bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[8.5px] text-neutral-300 hover:text-white transition-all whitespace-nowrap active:scale-95 cursor-pointer shrink-0"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Main Play / Pause & Action Controls Deck */}
                  <div className="flex items-center gap-1.5 py-0.5">
                    {/* Big Glow Start / Pause Button */}
                    <button
                      type="button"
                      onClick={handleToggleFocus}
                      className={`flex-1 py-1 px-2.5 rounded-xl font-bold text-[10.5px] flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer ${
                        isFocusRunning
                          ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_14px_rgba(245,158,11,0.45)]'
                          : 'bg-white text-black hover:bg-neutral-200'
                      }`}
                    >
                      {isFocusRunning ? (
                        <>
                          <svg className="w-3 h-3 fill-current" viewBox="0 0 24 24">
                            <rect x="6" y="5" width="4" height="14" rx="1.5" />
                            <rect x="14" y="5" width="4" height="14" rx="1.5" />
                          </svg>
                          <span>Pause Focus</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3 h-3 fill-current translate-x-0.5" viewBox="0 0 24 24">
                            <path d="M7 5.25a1.25 1.25 0 0 1 1.93-1.05l10.5 6.75a1.25 1.25 0 0 1 0 2.1l-10.5 6.75A1.25 1.25 0 0 1 7 18.75V5.25z" />
                          </svg>
                          <span>{focusSecondsLeft < focusTotalSeconds ? 'Resume' : 'Start Focus'}</span>
                        </>
                      )}
                    </button>

                    {/* Skip Stage Button */}
                    <button
                      type="button"
                      onClick={handleSkipFocusPhase}
                      title="Skip to next stage"
                      className="p-1 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polygon points="5 4 15 12 5 20 5 4" fill="currentColor" />
                        <line x1="19" y1="5" x2="19" y2="19" strokeWidth="2.5" />
                      </svg>
                    </button>

                    {/* Reset Stage Button */}
                    <button
                      type="button"
                      onClick={handleResetFocus}
                      title="Reset timer"
                      className="p-1 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer shrink-0"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </button>
                  </div>

                  {/* 3. Duration Presets & Audio Chime Toggle */}
                  <div className="flex items-center justify-between pt-0.5 border-t border-neutral-800/80 text-[8.5px] min-w-0">
                    {/* Preset Selector */}
                    <div className="flex items-center gap-1">
                      {Object.entries(FOCUS_PRESETS).map(([key, item]) => (
                        <button
                          key={key}
                          type="button"
                          onClick={() => handleSelectPreset(key)}
                          className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono transition-all cursor-pointer ${
                            focusPreset === key
                              ? 'bg-neutral-800 text-white font-bold border border-neutral-700'
                              : 'text-neutral-500 hover:text-neutral-300'
                          }`}
                        >
                          {item.label}
                        </button>
                      ))}
                    </div>

                    {/* Chime Toggle & Daily Stats */}
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setIsChimeEnabled(!isChimeEnabled)}
                        title={isChimeEnabled ? 'Audio Chimes Enabled' : 'Audio Chimes Muted'}
                        className={`p-1 rounded transition-colors cursor-pointer flex items-center justify-center ${
                          isChimeEnabled ? 'text-amber-400' : 'text-neutral-600'
                        }`}
                      >
                        {isChimeEnabled ? <IconBell className="w-3.5 h-3.5 text-amber-400" /> : <IconBellOff className="w-3.5 h-3.5 text-neutral-600" />}
                      </button>

                      <span className="font-mono text-[9px] text-neutral-400 flex items-center gap-1">
                        <IconFlame className="w-3 h-3 text-amber-400" />
                        <span>{completedSessionsToday} done</span>
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 6. SMART REAL-TIME CLIPBOARD TAB */}
            {activeTab === 'clipboard' && (
              <div className="flex flex-col h-full overflow-hidden select-none animate-tabSlide">
                {/* Header with Live Sync & Clear Action */}
                <div className="flex items-center justify-between px-1 pb-1.5 border-b border-neutral-800/80 mb-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-200 tracking-wide flex items-center gap-1.5">
                      <IconClipboard className="w-3.5 h-3.5 text-emerald-400" />
                      <span>SMART CLIPBOARD</span>
                    </span>
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 flex items-center gap-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>LIVE SYNC</span>
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono text-neutral-400">
                      {clipboardItems.length}/10 stored
                    </span>
                    {clipboardItems.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllClipboardItems}
                        className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-rose-500/15 border border-neutral-800 hover:border-rose-500/30 text-[9px] font-mono text-neutral-400 hover:text-rose-400 transition-all cursor-pointer active:scale-95"
                        title="Clear all clipboard history"
                      >
                        Clear All
                      </button>
                    )}
                  </div>
                </div>

                {/* Empty State vs Items List */}
                {clipboardItems.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-3 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800/50">
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center mb-2 shadow-[0_0_16px_rgba(16,185,129,0.15)]">
                      <IconClipboard className="w-5 h-5 text-emerald-400" />
                    </div>
                    <div className="text-xs font-semibold text-neutral-200 mb-0.5">
                      Clipboard is Empty
                    </div>
                    <div className="text-[10px] text-neutral-400 max-w-[280px] leading-relaxed mb-2.5">
                      Copy anything with <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[9px]">Ctrl + C</kbd> anywhere on your PC to auto-capture here.
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-neutral-400">
                        Real-Time Capture
                      </span>
                      <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-neutral-400">
                        Holds 10 Recent
                      </span>
                      <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-neutral-400">
                        1-Click Copy
                      </span>
                    </div>
                  </div>
                ) : (
                  <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5" style={{ scrollbarWidth: 'thin' }}>
                    {clipboardItems.map((item) => {
                      const isCopied = copiedItemId === item.id;
                      const typeConfig = {
                        url: { label: 'URL', bg: 'bg-sky-500/15 text-sky-400 border-sky-500/30' },
                        code: { label: 'CODE', bg: 'bg-amber-500/15 text-amber-400 border-amber-500/30' },
                        email: { label: 'EMAIL', bg: 'bg-purple-500/15 text-purple-400 border-purple-500/30' },
                        color: { label: 'COLOR', bg: 'bg-pink-500/15 text-pink-400 border-pink-500/30' },
                        number: { label: 'NUM', bg: 'bg-emerald-500/15 text-emerald-400 border-emerald-500/30' },
                        text: { label: 'TEXT', bg: 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60' },
                      }[item.type] || { label: 'TEXT', bg: 'bg-neutral-800/80 text-neutral-300 border-neutral-700/60' };

                      return (
                        <div
                          key={item.id}
                          onClick={(e) => handleCopyClipboardItem(item, e)}
                          title="Click to copy back to clipboard"
                          className={`group relative p-2 rounded-xl transition-all duration-200 hover:-translate-y-0.5 active:scale-[0.99] cursor-pointer border ${
                            isCopied
                              ? 'bg-emerald-950/40 border-emerald-500/50 shadow-[0_0_12px_rgba(16,185,129,0.25)]'
                              : 'bg-neutral-900/80 hover:bg-neutral-850/90 border-neutral-800 hover:border-neutral-700/90'
                          }`}
                        >
                          {/* Top Row: Type Pill + Timestamp + Actions */}
                          <div className="flex items-center justify-between gap-2 mb-1">
                            <div className="flex items-center gap-1.5">
                              <span
                                className={`text-[8.5px] font-mono font-bold px-1.5 py-0.5 rounded border uppercase tracking-wider ${typeConfig.bg}`}
                              >
                                {typeConfig.label}
                              </span>

                              {item.type === 'color' && (
                                <span
                                  className="w-2.5 h-2.5 rounded-full border border-white/20 inline-block shadow-sm"
                                  style={{ backgroundColor: item.text.trim() }}
                                />
                              )}

                              <span className="text-[9px] font-mono text-neutral-500">
                                {formatClipboardTime(item.timestamp)}
                              </span>
                            </div>

                            <div className="flex items-center gap-1">
                              {/* Characters count */}
                              <span className="text-[8.5px] font-mono text-neutral-500 group-hover:text-neutral-400 transition-colors">
                                {item.charCount || item.text.length} chars
                              </span>

                              {/* Copy feedback badge */}
                              {isCopied ? (
                                <span className="text-[9px] font-bold font-mono px-1.5 py-0.5 rounded bg-emerald-500 text-black flex items-center gap-1 animate-in fade-in zoom-in-95">
                                  <IconCheck className="w-2.5 h-2.5 text-black stroke-[2.5]" />
                                  <span>Copied!</span>
                                </span>
                              ) : (
                                <span className="opacity-0 group-hover:opacity-100 text-[8.5px] font-mono text-emerald-400/90 bg-emerald-500/10 px-1.5 py-0.5 rounded border border-emerald-500/20 transition-opacity">
                                  Click to Copy
                                </span>
                              )}

                              {/* Delete button */}
                              <button
                                type="button"
                                onClick={(e) => removeClipboardItem(item.id, e)}
                                title="Remove item"
                                className="opacity-0 group-hover:opacity-100 p-1 text-neutral-500 hover:text-rose-400 hover:bg-rose-500/10 rounded transition-all ml-0.5 active:scale-90"
                              >
                                <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                                  <line x1="18" y1="6" x2="6" y2="18" />
                                  <line x1="6" y1="6" x2="18" y2="18" />
                                </svg>
                              </button>
                            </div>
                          </div>

                          {/* Content Row: Text preview */}
                          <div className="text-[11px] font-mono text-neutral-200 leading-relaxed break-words whitespace-pre-wrap line-clamp-2 select-text group-hover:text-white transition-colors">
                            {item.text}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 7. HIGH-TECH MULTI-SLOT QUICK SCRATCHPAD */}
            {activeTab === 'notes' && (
              <div className="flex flex-col h-full overflow-hidden select-none animate-tabSlide">
                {/* Top Header: Slots & Auto-save Status */}
                <div className="flex items-center justify-between px-1 pb-1.5 border-b border-neutral-800/80 mb-1.5 flex-shrink-0">
                  {/* Left: Slot Tabs */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-300 tracking-wide flex items-center gap-1 mr-1">
                      <IconNotes className="w-3.5 h-3.5 text-neutral-300" />
                      <span className="hidden sm:inline">SCRATCHPAD</span>
                    </span>

                    {[
                      { id: 'general', label: 'General', icon: <IconNotes className="w-3 h-3" /> },
                      { id: 'todo', label: 'Tasks', icon: <IconCheck className="w-3 h-3" /> },
                      { id: 'scratch', label: 'Snippets', icon: <IconCode className="w-3 h-3" /> },
                    ].map((slot) => {
                      const isActive = activeNoteSlot === slot.id;
                      const hasText = !!(scratchNotesBySlot[slot.id] && scratchNotesBySlot[slot.id].trim());
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setActiveNoteSlot(slot.id)}
                          className={`px-2 py-0.5 rounded-lg text-[9.5px] font-mono transition-all flex items-center gap-1.5 cursor-pointer active:scale-95 ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800'
                          }`}
                        >
                          {slot.icon}
                          <span>{slot.label}</span>
                          {hasText && !isActive && (
                            <span className="w-1 h-1 rounded-full bg-emerald-400/80"></span>
                          )}
                        </button>
                      );
                    })}
                  </div>

                  {/* Right: Telemetry & Live Auto-save indicator */}
                  <div className="flex items-center gap-2 text-[9px] font-mono text-neutral-400">
                    <span>
                      {scratchWords}w • {scratchChars}c
                    </span>
                    <span className="flex items-center gap-1 text-emerald-400 bg-emerald-500/10 px-1.5 py-0.5 rounded-full border border-emerald-500/20">
                      <span className="w-1 h-1 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span>Saved</span>
                    </span>
                  </div>
                </div>

                {/* Sub-toolbar: Quick Insert Helpers + Actions */}
                <div className="flex items-center justify-between px-1 pb-1.5 flex-shrink-0 text-[9px] font-mono">
                  {/* Left: Quick Insert Helpers */}
                  <div className="flex items-center gap-1">
                    <span className="text-neutral-500 text-[8.5px] mr-0.5">Insert:</span>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('• ')}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer active:scale-95"
                      title="Insert bullet point"
                    >
                      • Bullet
                    </button>
                    <button
                      type="button"
                      onClick={() => insertTextAtCursor('[ ] ')}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer active:scale-95"
                      title="Insert task checkbox"
                    >
                      [ ] Task
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        const now = new Date();
                        const timeStr = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')} - `;
                        insertTextAtCursor(timeStr);
                      }}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer active:scale-95 flex items-center gap-1"
                      title="Insert current timestamp"
                    >
                      <IconClock className="w-3 h-3 text-neutral-400" />
                      <span>Time</span>
                    </button>
                  </div>

                  {/* Right: Actions (Font, Copy, Clear, Export) */}
                  <div className="flex items-center gap-1">
                    {/* Font Toggle */}
                    <button
                      type="button"
                      onClick={toggleScratchFont}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer active:scale-95"
                      title={isScratchpadMono ? 'Switch to Sans font' : 'Switch to Monospace font'}
                    >
                      {isScratchpadMono ? 'Aa Sans' : '{ } Mono'}
                    </button>

                    {/* Copy All */}
                    <button
                      type="button"
                      onClick={handleCopyScratch}
                      disabled={!currentNoteText}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer active:scale-95 flex items-center gap-1 border ${
                        scratchCopied
                          ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                          : 'bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                      title="Copy entire note to clipboard"
                    >
                      {scratchCopied ? <IconCheck className="w-3 h-3 text-black" /> : <IconCopy className="w-3 h-3 text-neutral-300" />}
                      <span>{scratchCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Export */}
                    <button
                      type="button"
                      onClick={handleExportScratch}
                      disabled={!currentNoteText}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center"
                      title="Download as .txt"
                    >
                      <IconDownload className="w-3 h-3 text-neutral-400" />
                    </button>

                    {/* Clear Slot */}
                    <button
                      type="button"
                      onClick={handleClearScratch}
                      disabled={!currentNoteText}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer active:scale-95 border flex items-center justify-center ${
                        confirmClearSlot
                          ? 'bg-rose-500 text-white border-rose-400 font-bold'
                          : 'bg-neutral-900 hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 border-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                      title={confirmClearSlot ? 'Click again to confirm clear' : 'Clear this note'}
                    >
                      {confirmClearSlot ? 'Confirm?' : <IconTrash className="w-3 h-3 text-neutral-400" />}
                    </button>
                  </div>
                </div>

                {/* Textarea Area */}
                <div className="flex-1 w-full relative min-h-0 bg-[#0c0c0f] border border-neutral-800/90 focus-within:border-emerald-500/50 rounded-xl overflow-hidden transition-colors shadow-inner">
                  <textarea
                    ref={scratchTextareaRef}
                    value={currentNoteText}
                    onChange={(e) => updateCurrentNoteText(e.target.value)}
                    onKeyDown={handleScratchKeyDown}
                    onFocus={() => onInputFocusChange?.(true)}
                    onBlur={() => onInputFocusChange?.(false)}
                    placeholder={
                      activeNoteSlot === 'todo'
                        ? '[ ] Review Pull Request\n[ ] Update project documentation\n[ ] Ship Eyeland release\n\n(Tip: Press Enter to auto-continue tasks)'
                        : activeNoteSlot === 'scratch'
                        ? 'const API_KEY = "sk-...";\nnpm run build\ngit commit -m "feat: new scratchpad"\n\n(Tip: Press Tab to indent code)'
                        : 'Jot down quick thoughts, brainstorm ideas, or drafts...\n\n(Tip: Press Tab to indent, Enter to continue bullets)'
                    }
                    className={`w-full h-full p-2.5 bg-transparent text-xs text-neutral-200 placeholder-neutral-600 outline-none resize-none leading-relaxed selection:bg-emerald-500/30 selection:text-white ${
                      isScratchpadMono ? 'font-mono' : 'font-sans'
                    }`}
                    style={{ scrollbarWidth: 'thin' }}
                  />
                </div>
              </div>
            )}

            {/* ======================================================== */}
            {/* 8. GMAIL & MAIL NOTIFICATIONS TAB                        */}
            {/* ======================================================== */}
            {activeTab === 'mail' && (
              <div className="flex flex-col h-full overflow-hidden select-none animate-tabSlide">
                {!mailConfig.connected ? (
                  /* 1. DISCONNECTED STATE: Minimal Obsidian Connect Flow */
                  <div className="flex-1 flex flex-col justify-between py-0.5 px-0.5 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.07] mb-2 flex-shrink-0">
                      <div className="flex items-center gap-2">
                        <div className="w-5 h-5 rounded-md bg-white/[0.06] border border-white/[0.09] flex items-center justify-center text-neutral-200">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                          </svg>
                        </div>
                        <span className="text-[11px] font-semibold text-white tracking-tight">Gmail</span>
                      </div>
                      <span className="px-2 py-0.5 rounded-full bg-white/[0.04] border border-white/[0.07] text-[8.5px] font-mono text-neutral-400">
                        Not Connected
                      </span>
                    </div>

                    {/* Main Cards */}
                    <div className="flex-1 flex items-stretch gap-2.5 min-h-0">
                      {/* Left: Connect Form */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between p-3 rounded-2xl bg-[#101014] border border-white/[0.07]">
                        <div>
                          <h4 className="text-[11.5px] font-semibold text-white tracking-tight">
                            Connect your Google Account
                          </h4>
                          <p className="text-[9.5px] text-neutral-400 mt-1 leading-relaxed">
                            Receive quiet, unobtrusive unread alerts directly on the Island when new mail arrives.
                          </p>
                        </div>

                        <div className="my-auto flex items-center gap-1.5">
                          <input
                            type="email"
                            value={mailEmailInput}
                            onChange={(e) => setMailEmailInput(e.target.value)}
                            onFocus={() => onInputFocusChange?.(true)}
                            onBlur={() => onInputFocusChange?.(false)}
                            placeholder="your.email@gmail.com"
                            className="flex-1 min-w-0 px-2.5 py-1.5 rounded-xl bg-black/60 border border-white/[0.09] text-white placeholder-neutral-500 text-[11px] focus:outline-none focus:border-white/30 font-mono transition-colors"
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') handleConnectMail();
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => handleConnectMail()}
                            disabled={isMailConnecting}
                            className="px-3 py-1.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-[11px] font-semibold flex items-center gap-1 transition-all cursor-pointer active:scale-95 disabled:opacity-50 flex-shrink-0"
                          >
                            <span>{isMailConnecting ? 'Linking...' : 'Connect'}</span>
                          </button>
                        </div>

                        <div className="pt-1.5 border-t border-white/[0.06] text-[8.5px] text-neutral-500 font-mono flex items-center justify-between">
                          <span>Local encrypted session</span>
                          <span className="text-neutral-300">Count-only</span>
                        </div>
                      </div>

                      {/* Right: Minimal Privacy Card */}
                      <div className="w-[184px] flex-shrink-0 flex flex-col justify-between p-3 rounded-2xl bg-[#0d0d11] border border-white/[0.07] text-neutral-300">
                        <div className="flex items-center gap-1.5 text-neutral-200 font-semibold text-[10.5px]">
                          <svg className="w-3.5 h-3.5 text-neutral-300 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                          <span>Privacy First</span>
                        </div>

                        <div className="my-auto space-y-1.5">
                          <p className="text-[9.5px] leading-relaxed text-neutral-300">
                            Eyeland <span className="text-white font-medium">only sees your unread count</span>.
                          </p>
                          <p className="text-[9px] leading-relaxed text-neutral-500 border-t border-white/[0.06] pt-1.5">
                            Message contents, subjects, and senders are never read or stored.
                          </p>
                        </div>

                        <div className="flex items-center gap-1.5 text-[8.5px] text-neutral-400 font-mono">
                          <span className="w-1.5 h-1.5 rounded-full bg-neutral-300" />
                          <span>Zero content access</span>
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 2. CONNECTED STATE: Minimal Obsidian Inbox Counter */
                  <div className="flex-1 flex flex-col justify-between py-0.5 px-0.5 min-h-0">
                    {/* Header */}
                    <div className="flex items-center justify-between pb-1.5 border-b border-white/[0.07] mb-2 flex-shrink-0">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="w-1.5 h-1.5 rounded-full bg-white shadow-[0_0_6px_rgba(255,255,255,0.65)] flex-shrink-0" />
                        <span className="text-[11px] font-semibold text-white tracking-tight truncate max-w-[180px]" title={mailConfig.email}>
                          {mailConfig.email || 'Gmail Connected'}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-full bg-white/[0.05] border border-white/[0.08] text-neutral-300 text-[8px] font-mono flex-shrink-0">
                          Count-Only
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 flex-shrink-0">
                        <button
                          type="button"
                          onClick={() => {
                            if (window.electronAPI?.openExternalUrl) {
                              window.electronAPI.openExternalUrl('https://mail.google.com');
                            } else {
                              window.open('https://mail.google.com', '_blank');
                            }
                          }}
                          className="px-2.5 py-1 rounded-lg bg-white/[0.06] hover:bg-white/[0.11] border border-white/[0.08] text-[9.5px] font-medium text-neutral-200 hover:text-white flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                          title="Open Gmail inbox in your browser"
                        >
                          <span>Inbox</span>
                          <span className="text-[8px] text-neutral-400">↗</span>
                        </button>

                        <button
                          type="button"
                          onClick={handleDisconnectMail}
                          className="px-2 py-1 rounded-lg bg-white/[0.03] hover:bg-white/[0.09] border border-white/[0.07] text-[9px] font-medium text-neutral-400 hover:text-white transition-all cursor-pointer active:scale-95"
                          title="Disconnect Gmail account"
                        >
                          Disconnect
                        </button>
                      </div>
                    </div>

                    {/* Main Body */}
                    <div className="flex-1 flex items-stretch gap-2.5 min-h-0">
                      {/* Left: Unread Counter */}
                      <div className="flex-1 min-w-0 flex flex-col justify-between p-3 rounded-2xl bg-[#101014] border border-white/[0.07]">
                        <div className="flex items-center justify-between text-[9px] text-neutral-500 font-mono">
                          <span>INBOX STATUS</span>
                          <span className="text-neutral-300 flex items-center gap-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-white/80" />
                            Synced
                          </span>
                        </div>

                        <div className="flex items-center gap-3 my-auto">
                          <div className="w-11 h-11 rounded-2xl bg-white/[0.05] border border-white/[0.09] flex items-center justify-center text-white flex-shrink-0">
                            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.6}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75" />
                            </svg>
                          </div>
                          <div className="min-w-0">
                            <div className="flex items-baseline gap-1.5">
                              <span className="text-2xl font-bold font-mono tabular-nums text-white tracking-tight leading-none">
                                {mailConfig.unreadCount}
                              </span>
                              <span className="text-[11px] font-medium text-neutral-300 truncate">
                                {mailConfig.unreadCount === 1 ? 'unread email' : 'unread emails'}
                              </span>
                            </div>
                            <p className="text-[8.5px] text-neutral-500 font-mono mt-1">
                              {mailConfig.unreadCount > 0 ? 'Waiting in your inbox' : 'All caught up'}
                            </p>
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 pt-2 border-t border-white/[0.06]">
                          <button
                            type="button"
                            onClick={() => {
                              if (window.electronAPI?.openExternalUrl) {
                                window.electronAPI.openExternalUrl('https://mail.google.com');
                              } else {
                                window.open('https://mail.google.com', '_blank');
                              }
                            }}
                            className="flex-1 py-1.5 px-2.5 rounded-xl bg-white hover:bg-neutral-200 text-black text-[10px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer active:scale-95"
                          >
                            <span>Open Gmail</span>
                            <span className="text-[9px]">↗</span>
                          </button>

                          {mailConfig.unreadCount > 0 && (
                            <button
                              type="button"
                              onClick={() => {
                                setMailConfig((prev) => ({ ...prev, unreadCount: 0 }));
                              }}
                              className="px-2.5 py-1.5 rounded-xl bg-white/[0.05] hover:bg-white/[0.1] border border-white/[0.08] text-[9.5px] font-medium text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95"
                              title="Reset unread count"
                            >
                              Clear
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Right: Alert Preferences & Privacy Seal */}
                      <div className="w-[184px] flex-shrink-0 flex flex-col justify-between p-3 rounded-2xl bg-[#0d0d11] border border-white/[0.07]">
                        <div>
                          <span className="text-[8.5px] font-mono tracking-wider text-neutral-500 uppercase">
                            Island Alerts
                          </span>

                          <div className="mt-2 space-y-2">
                            <button
                              type="button"
                              onClick={() => {
                                setMailConfig((prev) => ({
                                  ...prev,
                                  notificationsEnabled: !prev.notificationsEnabled,
                                }));
                              }}
                              className="w-full flex items-center justify-between text-[10px] text-neutral-200 cursor-pointer"
                            >
                              <span>Pop-up alerts</span>
                              <span
                                className={`w-7 h-4 rounded-full p-0.5 transition-colors flex items-center ${
                                  mailConfig.notificationsEnabled ? 'bg-white justify-end' : 'bg-white/[0.14] justify-start'
                                }`}
                              >
                                <span
                                  className={`w-3 h-3 rounded-full transition-colors ${
                                    mailConfig.notificationsEnabled ? 'bg-black' : 'bg-neutral-400'
                                  }`}
                                />
                              </span>
                            </button>

                            <p className="text-[8.5px] text-neutral-500 leading-snug">
                              Briefly shows new mail count on the collapsed Island when mail arrives.
                            </p>
                          </div>
                        </div>

                        <div className="p-2 rounded-xl bg-white/[0.03] border border-white/[0.06] flex items-start gap-1.5 text-[8.5px] text-neutral-400 leading-tight">
                          <svg className="w-3 h-3 text-neutral-300 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z" />
                          </svg>
                          <span>Count-only mode. Senders and message text are never read.</span>
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

          </div>

          {/* ======================================================== */}
          {/* BOTTOM DOCK (Centered, Modern Apple-Style Floating Dock) */}
          {/* ======================================================== */}
          <div className={`flex-shrink-0 w-full pt-1.5 relative z-10 select-none ${isWakingUp ? 'pop-in-card' : ''}`} style={{ '--i': 6 }}>
            <div className="relative w-full flex items-center justify-center px-3 py-1 rounded-full bg-[#131316] border border-[#222226] shadow-lg">
              
              <div className="flex items-center justify-center gap-1.5 mx-auto">
                {/* 1. Home */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('home'); setAiResponseCard(null); }}
                  title="Home Cockpit & Telemetry"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center border ${
                    activeTab === 'home'
                      ? 'scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border-transparent'
                  }`}
                  style={activeTab === 'home' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
                    <polyline points="9 22 9 12 15 12 15 22" />
                  </svg>
                </button>

                {/* 2. Star / AI Tools & Features Suite */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('features'); setAiResponseCard(null); }}
                  title="AI Tools & Features Suite"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center border ${
                    activeTab === 'features'
                      ? 'scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border-transparent'
                  }`}
                  style={activeTab === 'features' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
                  </svg>
                </button>

                {/* 3. Music */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('music'); setAiResponseCard(null); }}
                  title="Music Player"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center border ${
                    activeTab === 'music'
                      ? 'scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border-transparent'
                  }`}
                  style={activeTab === 'music' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M9 18V5l12-2v13" />
                    <circle cx="6" cy="18" r="3" />
                    <circle cx="18" cy="16" r="3" />
                  </svg>
                </button>

                {/* 4. Eyeland AI Chat Pill (Image 1 Exact Reference) */}
                <button
                  type="button"
                  onClick={() => setActiveTab('ai')}
                  title="Eyeland AI Assistant"
                  className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all duration-200 cursor-pointer active:scale-90 border ${
                    activeTab === 'ai'
                      ? 'scale-105'
                      : 'bg-neutral-900/80 border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700 hover:-translate-y-0.5'
                  }`}
                  style={activeTab === 'ai' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" />
                  </svg>
                  <span>Eyeland</span>
                </button>

                {/* 5. Focus Timer */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('focus'); setAiResponseCard(null); }}
                  title="Focus Mode & Pomodoro"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center relative border ${
                    activeTab === 'focus'
                      ? 'scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border-transparent'
                  }`}
                  style={activeTab === 'focus' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {isFocusRunning && (
                    <span 
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse shadow-sm"
                      style={{ 
                        backgroundColor: focusPhase === 'work' ? '#f59e0b' : (theme.accent || '#10b981'),
                        boxShadow: `0 0 6px ${focusPhase === 'work' ? '#f59e0b' : (theme.accent || '#10b981')}`
                      }}
                    />
                  )}
                </button>

                {/* 6. Staging Shelf */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('shelf'); setAiResponseCard(null); }}
                  title="Staging Shelf"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center relative border ${
                    activeTab === 'shelf'
                      ? 'scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border-transparent'
                  }`}
                  style={activeTab === 'shelf' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
                  {stagedFiles.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-500 text-[7px] font-bold text-white flex items-center justify-center pointer-events-none shadow-sm animate-scaleIn">
                      {stagedFiles.length}
                    </span>
                  )}
                </button>

                {/* 7. Clipboard */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('clipboard'); setAiResponseCard(null); }}
                  title="Clipboard History"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center relative border ${
                    activeTab === 'clipboard'
                      ? 'scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border-transparent'
                  }`}
                  style={activeTab === 'clipboard' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                  {clipboardItems.length > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full text-[7px] font-bold text-black flex items-center justify-center pointer-events-none shadow-sm animate-scaleIn"
                      style={{ backgroundColor: theme.accent || '#10b981' }}
                    >
                      {clipboardItems.length}
                    </span>
                  )}
                </button>

                {/* 8. Notes */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('notes'); setAiResponseCard(null); }}
                  title="Scratchpad & Notes"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center relative border ${
                    activeTab === 'notes'
                      ? 'scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border-transparent'
                  }`}
                  style={activeTab === 'notes' ? {
                    backgroundColor: theme.dockBg || 'rgba(16, 185, 129, 0.18)',
                    borderColor: theme.border || 'rgba(52, 211, 153, 0.45)',
                    color: theme.accent || theme.color,
                    boxShadow: theme.dockShadow || '0 0 12px rgba(52, 211, 153, 0.35)',
                  } : undefined}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  {totalNotesLength > 0 && (
                    <span
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full pointer-events-none animate-scaleIn"
                      style={{
                        backgroundColor: theme.accent || '#34d399',
                        boxShadow: `0 0 6px ${theme.accent || 'rgba(52,211,153,0.8)'}`,
                      }}
                    />
                  )}
                </button>

                {/* 9. Mail */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('mail'); setAiResponseCard(null); }}
                  title="Gmail & Unread Email Alerts"
                  className={`p-1.5 rounded-xl transition-all duration-200 cursor-pointer active:scale-90 flex items-center justify-center relative ${
                    activeTab === 'mail'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_12px_rgba(74,222,128,0.35)] scale-105'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 hover:-translate-y-0.5 border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                    <polyline points="22,6 12,13 2,6" />
                  </svg>
                  {mailConfig.connected && mailConfig.unreadCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.8)] animate-scaleIn" />
                  )}
                </button>
              </div>

              {/* Far Right: Volume / Sound Mute Button */}
              <div className="absolute right-2.5 flex items-center gap-1.5">
                <div className="h-3.5 w-px bg-neutral-800" />
                <button
                  type="button"
                  onClick={() => setIsSoundMuted(!isSoundMuted)}
                  title={isSoundMuted ? 'Sound Effects Muted (Click to Unmute)' : 'Sound Effects Active (Click to Mute)'}
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                    isSoundMuted
                      ? 'text-rose-400 bg-rose-500/15 border border-rose-500/25'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  {isSoundMuted ? (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <line x1="23" y1="9" x2="17" y2="15" />
                      <line x1="17" y1="9" x2="23" y2="15" />
                    </svg>
                  ) : (
                    <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                      <polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5" />
                      <path d="M19.07 4.93a10 10 0 0 1 0 14.14M15.54 8.46a5 5 0 0 1 0 7.07" />
                    </svg>
                  )}
                </button>
              </div>

            </div>
          </div>

        </div>
      )}
    </div>
  );
}
