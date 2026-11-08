import React, { useState, useRef, useEffect, useMemo } from 'react';
import MinimalEyes from './MinimalEyes.jsx';
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
  const parts = content.split(/(```[\s\S]*?```)/g);

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
              <span>📋</span>
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

export default function DynamicIsland({
  theme,
  setThemeKey,
  themes,
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
}) {
  const [activeTab, setActiveTab] = useState('ai');

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
      devices: [
        { id: 1, name: 'WH-CH520', type: 'headphones', connected: false, status: 'Paired' },
        { id: 2, name: 'Airdopes 311 Pro', type: 'headphones', connected: false, status: 'Paired' },
        { id: 3, name: "Smokin' Buds", type: 'headphones', connected: false, status: 'Paired' },
        { id: 4, name: 'SpinBot Ranger HX300', type: 'gamepad', connected: false, status: 'Paired' },
        { id: 5, name: 'Immortal 100', type: 'headphones', connected: false, status: 'Paired' },
        { id: 6, name: 'trüke BTG Neo', type: 'headphones', connected: false, status: 'Paired' },
        { id: 7, name: 'trüke Buds Q1', type: 'headphones', connected: false, status: 'Paired' },
      ],
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
  const [currentWifi, setCurrentWifi] = useState('GJBC-MCA(LAPTOP-ONLY)');
  const [wifiNetworks, setWifiNetworks] = useState([
    { name: 'GJBC-MCA(LAPTOP-ONLY)', connected: true, signal: 4, secure: true, speed: '286.8 Mbps' },
  ]);

  const [isBluetoothOn, setIsBluetoothOn] = useState(true);
  const [btDevices, setBtDevices] = useState([
    { id: 1, name: 'WH-CH520', type: 'headphones', connected: false, status: 'Paired' },
    { id: 2, name: 'Airdopes 311 Pro', type: 'headphones', connected: false, status: 'Paired' },
    { id: 3, name: "Smokin' Buds", type: 'headphones', connected: false, status: 'Paired' },
    { id: 4, name: 'SpinBot Ranger HX300', type: 'gamepad', connected: false, status: 'Paired' },
    { id: 5, name: 'Immortal 100', type: 'headphones', connected: false, status: 'Paired' },
    { id: 6, name: 'trüke BTG Neo', type: 'headphones', connected: false, status: 'Paired' },
    { id: 7, name: 'trüke Buds Q1', type: 'headphones', connected: false, status: 'Paired' },
  ]);

  // ========================================================
  // DYNAMIC MULTI-INDICATOR SYSTEM (Max 3 stacked, Music exception)
  // ========================================================
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMicActive, setIsMicActive] = useState(false);
  const [isCamActive, setIsCamActive] = useState(false);
  const [isAirplaneMode, setIsAirplaneMode] = useState(false);
  const [isBtIndicatorActive, setIsBtIndicatorActive] = useState(false);
  const [isSimulatedLowBattery, setIsSimulatedLowBattery] = useState(false);
  const [isSimulatedCharging, setIsSimulatedCharging] = useState(null);
  const [isSoundMuted, setIsSoundMuted] = useState(false);
  const btTimerRef = useRef(null);
  const prevBtConnectedRef = useRef(new Set());

  const [indicatorTimestamps, setIndicatorTimestamps] = useState({
    music: Date.now(),
    bluetooth: 0,
    camera: 0,
    mic: 0,
    airplane: 0,
    battery_low: 0,
    battery_charging: Date.now(),
    focus: 0,
  });

  const triggerBluetoothIndicator = () => {
    setIsBtIndicatorActive(true);
    setIndicatorTimestamps((prev) => ({ ...prev, bluetooth: Date.now() }));
    if (btTimerRef.current) clearTimeout(btTimerRef.current);
    btTimerRef.current = setTimeout(() => {
      setIsBtIndicatorActive(false);
    }, 5000); // Blinks for 5 seconds and smoothly vanishes
  };

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

  const toggleAirplaneMode = () => {
    setIsAirplaneMode((prev) => {
      const next = !prev;
      if (next) setIndicatorTimestamps((t) => ({ ...t, airplane: Date.now() }));
      return next;
    });
  };

  const toggleLowBatterySim = () => {
    setIsSimulatedLowBattery((prev) => {
      const next = !prev;
      if (next) setIndicatorTimestamps((t) => ({ ...t, battery_low: Date.now() }));
      return next;
    });
  };

  const toggleChargingSim = () => {
    setIsSimulatedCharging((prev) => {
      const current = prev !== null ? prev : Boolean(telemetry.battery?.isCharging);
      const next = !current;
      if (next) setIndicatorTimestamps((t) => ({ ...t, battery_charging: Date.now() }));
      return next;
    });
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
              const connectedNow = data.bluetooth.devices.filter((d) => d.connected).map((d) => d.name);
              const newlyConnected = connectedNow.some((name) => !prevBtConnectedRef.current.has(name));
              if (newlyConnected) {
                triggerBluetoothIndicator();
              }
              prevBtConnectedRef.current = new Set(connectedNow);
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

    if (window.electronAPI?.onTelemetryUpdate) {
      const cleanup = window.electronAPI.onTelemetryUpdate((data) => {
        if (data) {
          setTelemetry((prev) => ({ ...prev, ...data }));
          if (data.wifi?.ssid) {
            setCurrentWifi(data.wifi.ssid);
          }
          if (data.bluetooth?.devices?.length > 0) {
            setBtDevices(data.bluetooth.devices);
            const connectedNow = data.bluetooth.devices.filter((d) => d.connected).map((d) => d.name);
            const newlyConnected = connectedNow.some((name) => !prevBtConnectedRef.current.has(name));
            if (newlyConnected) {
              triggerBluetoothIndicator();
            }
            prevBtConnectedRef.current = new Set(connectedNow);
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
      return () => cleanup?.();
    }
  }, []);

  // Connectivity Dropdown State ('wifi' | 'bluetooth' | null)
  const [activeDropdownTab, setActiveDropdownTab] = useState('wifi');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target)) {
        setIsDropdownOpen(false);
        onDropdownChange?.(false);
      }
    };
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen, onDropdownChange]);

  const toggleDropdown = (tab) => {
    if (isDropdownOpen && activeDropdownTab === tab) {
      setIsDropdownOpen(false);
      onDropdownChange?.(false);
    } else {
      setActiveDropdownTab(tab);
      setIsDropdownOpen(true);
      onDropdownChange?.(true);
    }
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
  const hasLyrics = Boolean(lyrics && lyrics.length > 0);

  // Extract dominant ambient lighting color whenever artwork changes
  useEffect(() => {
    if (trackData?.artwork) {
      extractDominantColor(trackData.artwork).then((palette) => {
        if (palette) setAmbientPalette(palette);
      });
    }
  }, [trackData?.artwork]);

  // Real-time track progress ticker while Spotify is actively playing
  useEffect(() => {
    if (!isPlaying) return;

    // Smooth 1s ticker running so timeline progresses smoothly between GSMTC ticks
    const interval = setInterval(() => {
      setTrackPosition((prev) => {
        if (prev >= (trackData.duration || 200)) {
          return isRepeat ? 0 : prev;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isPlaying, trackData.duration, isRepeat]);

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

  // Clear all clipboard items
  const clearAllClipboardItems = (e) => {
    e?.stopPropagation();
    setClipboardItems([]);
    try {
      localStorage.removeItem('eyeland_clipboard_history');
    } catch {}
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
  const [modelStatus, setModelStatus] = useState('Gemini 2.5 Flash Vision');

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
        setKeySaveMessage('✓ Custom Gemini key connected!');
      } else {
        localStorage.removeItem('eyeland_gemini_api_key');
        setKeySaveMessage('✓ Using built-in default model!');
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
      setKeySaveMessage('✓ Reverted to built-in default model!');
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
    setBuddyQuote('"Loving the head pats! *purrs in 60fps* ❤️"');

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
    setFeatureLoading(true);
    setExpression('scan');
    if (window.electronAPI?.startSnipping) {
      try {
        await window.electronAPI.startSnipping(toolName);
      } catch (err) {
        console.error('startSnipping error:', err);
        setFeatureLoading(false);
        setExpression('neutral');
      }
    } else {
      setTimeout(() => {
        handleExecuteFeature(toolName, {
          sourceType: 'snip',
          text: 'Eyeland ambient desktop bezel companion with zero gap docking and neural multimodal vision.',
          bounds: { width: 420, height: 180 },
        });
      }, 700);
    }
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
    setExpression('scan');

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
        setExpression('neutral');

        if (res?.success && res.text) {
          const rawText = res.text;

          if (tool === 'explain') {
            setFeatureResult({
              tool: 'explain',
              badge: `${res.model?.toUpperCase() || 'GEMINI'} • EXPLAIN`,
              title: 'Contextual Breakdown',
              eli5: rawText,
              takeaways: [],
              sourceSnippet: textToProcess.slice(0, 130) + (textToProcess.length > 130 ? '...' : ''),
            });
          } else if (tool === 'polish') {
            const tone = options.tone || polishTone;
            setFeatureResult({
              tool: 'polish',
              badge: `${res.model?.toUpperCase() || 'GEMINI'} • ${tone.toUpperCase()}`,
              title: 'Grammar & Tone Refinement',
              original: textToProcess,
              polished: rawText,
              tone: tone,
            });
          } else if (tool === 'translate') {
            setFeatureResult({
              tool: 'translate',
              badge: `${res.model?.toUpperCase() || 'GEMINI'} • TRANSLATE`,
              title: `Translation Output`,
              translatedText: rawText,
              targetLang: options.targetLang || targetTranslateLang,
            });
          } else if (tool === 'summarize') {
            setFeatureResult({
              tool: 'summarize',
              badge: `${res.model?.toUpperCase() || 'GEMINI'} • SUMMARY`,
              title: 'Executive Digest',
              tldr: rawText,
              actionTasks: [],
            });
          } else if (tool === 'code') {
            setFeatureResult({
              tool: 'code',
              badge: `${res.model?.toUpperCase() || 'GEMINI'} • DEBUGGER`,
              title: 'Code Analysis & Fix',
              fixedCode: rawText,
            });
          } else if (tool === 'snip') {
            setFeatureResult({
              tool: 'snip',
              badge: `${res.model?.toUpperCase() || 'GEMINI'} • VISION`,
              title: 'Screen Analysis',
              analysis: rawText,
            });
          }
          return;
        } else {
          const isNoKey = res?.error?.includes('NO_API_KEY');
          setFeatureResult({
            tool: tool,
            badge: isNoKey ? 'KEY REQUIRED' : 'ERROR',
            title: isNoKey ? 'Gemini API Key Required' : 'Inference Notice',
            eli5: isNoKey
              ? 'Please configure your free Gemini API key to run real-time AI reasoning with Gemini. Click "Set Gemini API Key" above.'
              : `Gemini Error: ${res?.error || 'Unknown error occurred'}`,
            isKeyMissing: isNoKey,
          });
          return;
        }
      }
    } catch (err) {
      console.error('[handleExecuteFeature error]', err);
      setFeatureLoading(false);
      setExpression('neutral');
      setFeatureResult({
        tool: tool,
        badge: 'ERROR',
        title: 'Error Running Tool',
        eli5: err.message || 'Failed to call Gemini model.',
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
        if (res?.cancelled) {
          setFeatureLoading(false);
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
              text: `⚠️ ${res?.error || 'Could not process request with Gemini.'}`,
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
          text: `⚠️ Error: ${err.message || 'Failed to process request.'}`,
          isError: true,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        },
      ]);
    }
  };

  const isExpanded = isHovered || isPinned || isGreetingActive;

  const formatTime = (sec) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  };

  const isLyricsMode = !isExpanded && isPlaying && hasLyrics;
  const isFocusModeCollapsed = !isExpanded && isFocusRunning && !isLyricsMode;

  // Dynamic Companion Eye Expression & Color for Focus Mode vs Idle
  const activeEyeExpression = isFocusRunning 
    ? (focusPhase === 'work' ? 'serious' : 'relaxed')
    : expression;

  const activeEyeColor = isFocusRunning
    ? (focusPhase === 'work' ? '#f59e0b' : '#10b981')
    : theme.color;

  const activeEyeShadow = isFocusRunning
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

    if (isBtIndicatorActive) {
      candidates.push({ id: 'bluetooth', time: indicatorTimestamps.bluetooth || 1 });
    }
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
    isBtIndicatorActive,
    isCamActive,
    isMicActive,
    isDictating,
    isAirplaneMode,
    isLowBattery,
    isBatteryCharging,
    isFocusRunning,
    isFocusModeCollapsed,
    stagedFiles.length,
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

      default:
        return null;
    }
  };

  // Dimensions: Smooth rounded corners island (zero wings)
  // Collapsed Default: 230px x 36px (scales to 255px or 280px for 2-3 stacked indicators)
  // Collapsed with Rolling Lyrics: 380px x 36px (Smooth rounded 20px pill)
  // Collapsed with Focus Mode Running: 350px x 36px (Smooth rounded 20px pill)
  // Expanded: 540px x 315px (or 210px greeting banner)
  const islandStyle = isExpanded
    ? {
        width: '540px',
        height: isGreetingActive && !isHovered && !isPinned ? '210px' : '315px',
        borderRadius: '24px',
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

  return (
    <div
      id="dynamic-island"
      className="spring-anim relative bg-black text-white shadow-[0_28px_60px_rgba(0,0,0,0.98)] select-none flex flex-col items-center justify-between overflow-visible border border-[#1e1e22] cursor-default"
      style={islandStyle}
      onDragEnter={handleIslandDragEnter}
      onDragOver={handleIslandDragOver}
      onDragLeave={handleIslandDragLeave}
      onDrop={handleIslandDrop}
    >

      {/* ======================================================== */}
      {/* 1. COLLAPSED ISLAND: LYRICS vs FOCUS vs STANDARD 3-ZONE  */}
      {/* ======================================================== */}
      {!isExpanded && (
        isLyricsMode ? (
          /* LYRICS MODE: Expands to fit rolling lyrics, hides eyes, shows only lyrics + music playing icon */
          <div
            className="w-full h-full px-3.5 flex items-center justify-between animate-fadeIn cursor-pointer"
            onClick={triggerRejoice}
            title={`Spotify Lyrics • ${trackData.title}`}
          >
            {/* Left / Center: Rolling Synchronized Lyrics Line */}
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
                <p
                  key={activeLyricIndex}
                  className="text-[11.5px] font-medium text-neutral-100 truncate tracking-tight animate-lyric-slide"
                  title={currentLyricLine || trackData.title}
                >
                  {currentLyricLine || '♪ Instrumental ♪'}
                </p>
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
              <span className="text-xs flex-shrink-0">
                {focusPhase === 'work' ? '🎯' : focusPhase === 'shortBreak' ? '☕' : '🌴'}
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
      {/* 2. EXPANDED DASHBOARD / GREETING BANNER                  */}
      {/* ======================================================== */}
      {isExpanded && (
        <div className="w-full h-full px-3.5 pt-2.5 pb-2.5 flex flex-col justify-between animate-fadeIn overflow-hidden">
          {isGreetingActive && !isHovered && !isPinned ? (
            /* STARTUP / BOOT-UP GREETING HERO BANNER */
            <div className="flex-1 flex flex-col justify-between py-1 text-center animate-fadeIn select-none">
              {/* Greeting Top Bar */}
              <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#26262a]">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-white tracking-wide text-xs flex items-center gap-1">
                    <span>Eyeland</span>
                    <span style={{ color: theme.color }}>AI</span>
                  </span>
                  <span className="text-[10px] text-neutral-500">•</span>
                  <span className="text-[10px] text-neutral-400 font-mono">
                    Startup Greeting
                  </span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={onTriggerGreeting}
                    title="Change Greeting (Shuffle)"
                    className="p-1 px-2.5 rounded-full text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  >
                    🎲 Shuffle
                  </button>
                  <button
                    onClick={onDismissGreeting}
                    className="p-1 px-2.5 rounded-full text-[10px] bg-neutral-900 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                  >
                    Dismiss ✕
                  </button>
                </div>
              </div>

              {/* Center Hero: Glowing Greeting Eyes & Personalized Message */}
              <div className="my-auto flex flex-col items-center justify-center py-2">
                <div className="mb-2.5">
                  <MinimalEyes
                    expression="greeting"
                    themeColor={theme.color}
                    themeShadow={theme.shadow}
                    size="lg"
                  />
                </div>
                <h2 className="text-base font-bold text-white tracking-tight flex items-center gap-1.5">
                  <span>{greeting?.headline || `Good morning, ${greeting?.userName || 'Friend'}! ✨`}</span>
                </h2>
                <p className="text-xs text-neutral-300 mt-1 max-w-md">
                  {greeting?.subtext || 'What are we up to today?'}
                </p>

                {/* Quick Action Pills */}
                <div className="flex items-center justify-center gap-2 mt-4 flex-wrap">
                  <button
                    onClick={() => {
                      onDismissGreeting?.();
                      setActiveTab('ai');
                    }}
                    className="px-3.5 py-1.5 rounded-full bg-[#0e3b24] hover:bg-[#155333] border border-[#1b6b3e] text-xs text-[#4ade80] font-medium flex items-center gap-1.5 shadow-[0_0_12px_rgba(74,222,128,0.25)] active:scale-95 transition-all"
                  >
                    <span>💬</span>
                    <span>Ask Eyeland AI</span>
                  </button>
                  <button
                    onClick={() => {
                      onDismissGreeting?.();
                      setActiveTab('focus');
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#18181b] hover:bg-[#232328] border border-[#2b2b32] text-xs text-neutral-200 flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>⏱️</span>
                    <span>Focus Timer</span>
                  </button>
                  <button
                    onClick={() => {
                      onDismissGreeting?.();
                      handleScanScreen();
                    }}
                    className="px-3 py-1.5 rounded-full bg-[#18181b] hover:bg-[#232328] border border-[#2b2b32] text-xs text-neutral-200 flex items-center gap-1.5 active:scale-95 transition-all"
                  >
                    <span>📸</span>
                    <span>Scan Screen</span>
                  </button>
                </div>
              </div>

              <div className="text-[9px] text-neutral-500 font-mono">
                Auto-collapsing soon • Hover or click to explore dashboard
              </div>
            </div>
          ) : (
            <>
              {/* TOP BAR: APP TITLE • DATE & TIME • OPTIONS */}
          <div className="flex items-center justify-between text-xs pb-1.5 border-b border-[#26262a] relative z-50">
            <div className="flex flex-col">
              <div className="flex items-center gap-2">
                <span className="font-bold text-white tracking-wide text-xs flex items-center gap-1">
                  <span>Eyeland</span>
                  <span style={{ color: theme.color }}>AI</span>
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
                        : 'Gemini 2.5 Flash Vision'
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

              {/* Replay Startup Greeting Button */}
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  onTriggerGreeting?.();
                }}
                title="Test Boot Greeting (Rotate Messages)"
                className="p-1 px-1.5 rounded-md text-neutral-400 hover:text-amber-300 hover:bg-neutral-800 transition-colors text-xs"
              >
                👋
              </button>

              {/* Options Menu Button (•••) */}
              <button
                onClick={() => {
                  const keys = Object.keys(themes);
                  const nextIndex = (keys.indexOf(theme.name) + 1) % keys.length;
                  setThemeKey(keys[nextIndex]);
                }}
                title="Theme & Options"
                className="p-1 px-1.5 rounded-md text-neutral-400 hover:text-white hover:bg-neutral-800 transition-colors"
              >
                •••
              </button>

              {/* CONNECTIVITY & SENSOR DROPDOWN POPOVER (Compact, opaque, contained) */}
              {isDropdownOpen && (
                <div
                  onClick={(e) => e.stopPropagation()}
                  className="absolute right-0 top-8 z-50 w-72 bg-[#161618] border border-neutral-700 rounded-xl shadow-[0_18px_40px_rgba(0,0,0,0.95)] p-2.5 flex flex-col gap-2 max-h-[210px] overflow-y-auto animate-fadeIn select-none"
                  style={{ scrollbarWidth: 'thin' }}
                >
                  {/* Tab Selector Header */}
                  <div className="flex items-center justify-between pb-1.5 border-b border-neutral-800">
                    <div className="flex items-center gap-1 bg-neutral-900 p-0.5 rounded-lg border border-neutral-800">
                      <button
                        onClick={() => setActiveDropdownTab('wifi')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
                          activeDropdownTab === 'wifi'
                            ? 'bg-neutral-800 text-sky-400 shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <path d="M5 12.55a11 11 0 0 1 14.08 0" />
                          <path d="M1.42 9a16 16 0 0 1 21.16 0" />
                          <path d="M8.53 16.11a6 6 0 0 1 6.95 0" />
                          <line x1="12" y1="20" x2="12.01" y2="20" strokeWidth="2.5" />
                        </svg>
                        <span>Wi-Fi</span>
                      </button>

                      <button
                        onClick={() => setActiveDropdownTab('bluetooth')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
                          activeDropdownTab === 'bluetooth'
                            ? 'bg-neutral-800 text-indigo-400 shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                          <polyline points="6.5 6.5 17.5 17.5 12 23 12 1 17.5 6.5 6.5 17.5" />
                        </svg>
                        <span>Bluetooth</span>
                      </button>

                      <button
                        onClick={() => setActiveDropdownTab('sensors')}
                        className={`px-2 py-0.5 rounded text-[10px] font-medium flex items-center gap-1 transition-all ${
                          activeDropdownTab === 'sensors'
                            ? 'bg-neutral-800 text-amber-400 shadow-sm'
                            : 'text-neutral-400 hover:text-neutral-200'
                        }`}
                      >
                        <span>⚡</span>
                        <span>Sensors</span>
                      </button>
                    </div>

                    <button
                      onClick={() => {
                        setIsDropdownOpen(false);
                        onDropdownChange?.(false);
                      }}
                      className="text-neutral-500 hover:text-white p-0.5 text-xs"
                    >
                      ✕
                    </button>
                  </div>

                  {/* 1. WI-FI TAB CONTENT (Real Device Data) */}
                  {activeDropdownTab === 'wifi' && (
                    <div className="flex flex-col gap-1.5">
                      {/* Wi-Fi Switch Toggle */}
                      <div className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-neutral-200">Wi-Fi</span>
                          <span className="text-[9px] text-neutral-400 font-mono truncate max-w-[100px]" title={currentWifi}>
                            {isWifiOn ? currentWifi : 'Off'}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsWifiOn(!isWifiOn)}
                          className={`w-7 h-4 rounded-full transition-colors p-0.5 flex items-center ${
                            isWifiOn ? 'bg-sky-500 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-white shadow-sm block" />
                        </button>
                      </div>

                      {isWifiOn ? (
                        <>
                          {/* Connected Network (Real Data) */}
                          <div className="p-1.5 px-2 rounded-lg bg-neutral-900 border border-neutral-800 flex items-center justify-between">
                            <div className="flex items-center gap-1.5 truncate">
                              <span className="text-sky-400 text-xs">📶</span>
                              <div className="flex flex-col truncate">
                                <span className="text-[10px] font-medium text-neutral-100 flex items-center gap-1 truncate">
                                  <span className="truncate max-w-[90px]" title={currentWifi}>{currentWifi}</span>
                                  <span className="text-[8px] px-1 rounded bg-sky-500/20 text-sky-300 font-mono">Connected</span>
                                </span>
                                <span className="text-[8px] text-neutral-400 font-mono truncate">
                                  {telemetry.wifi?.band || '2.4 GHz'} • {telemetry.wifi?.speed || '286.8 Mbps'} • {telemetry.wifi?.signal || 80}%
                                </span>
                              </div>
                            </div>
                            <button
                              onClick={() => setCurrentWifi(currentWifi === 'Disconnected' ? (telemetry.wifi?.ssid || 'Connected Network') : 'Disconnected')}
                              className="text-[8px] text-neutral-400 hover:text-rose-400 px-1 py-0.5 rounded bg-neutral-800 transition-colors ml-1"
                            >
                              {currentWifi === 'Disconnected' ? 'Connect' : 'Disconnect'}
                            </button>
                          </div>

                          {/* Available Networks List (Real Data) */}
                          <div className="flex flex-col gap-1 pt-0.5">
                            <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-semibold">Visible Networks</span>
                            {wifiNetworks.filter(n => n.name !== currentWifi).length > 0 ? (
                              wifiNetworks.filter(n => n.name !== currentWifi).slice(0, 3).map(net => (
                                <div
                                  key={net.name}
                                  onClick={() => setCurrentWifi(net.name)}
                                  className="p-1 px-1.5 rounded bg-neutral-900/60 hover:bg-neutral-800 flex items-center justify-between text-xs cursor-pointer transition-colors"
                                >
                                  <div className="flex items-center gap-1.5 truncate">
                                    <span className="text-neutral-400 text-[10px]">📶</span>
                                    <span className="text-[10px] text-neutral-300 font-medium truncate max-w-[120px]">{net.name}</span>
                                  </div>
                                  <span className="text-[8px] font-mono text-sky-400">Join</span>
                                </div>
                              ))
                            ) : (
                              <div className="text-[9px] text-neutral-500 font-mono py-1 px-1">
                                {currentWifi !== 'Disconnected' ? 'Primary active network connected' : 'Scanning...'}
                              </div>
                            )}
                          </div>
                        </>
                      ) : (
                        <div className="py-2 text-center text-neutral-500 text-[10px]">
                          Wi-Fi is currently turned off.
                        </div>
                      )}

                      <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-[8px] text-neutral-400">
                        <span className="truncate max-w-[140px]" title={telemetry.wifi?.adapter}>
                          {telemetry.wifi?.adapter || 'MediaTek Wi-Fi 6'}
                        </span>
                        <span className="hover:text-sky-400 cursor-pointer">
                          Network Settings ↗
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 2. BLUETOOTH TAB CONTENT (Real Device Data) */}
                  {activeDropdownTab === 'bluetooth' && (
                    <div className="flex flex-col gap-1.5">
                      {/* Bluetooth Switch Toggle */}
                      <div className="flex items-center justify-between py-0.5">
                        <div className="flex items-center gap-1.5">
                          <span className="text-[11px] font-semibold text-neutral-200">Bluetooth</span>
                          <span className="text-[9px] text-neutral-400 font-mono">
                            {isBluetoothOn ? 'Active' : 'Off'}
                          </span>
                        </div>
                        <button
                          onClick={() => setIsBluetoothOn(!isBluetoothOn)}
                          className={`w-7 h-4 rounded-full transition-colors p-0.5 flex items-center ${
                            isBluetoothOn ? 'bg-indigo-500 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-white shadow-sm block" />
                        </button>
                      </div>

                      {isBluetoothOn ? (
                        <>
                          {/* Connected & Paired Devices (Real User Devices) */}
                          <div className="flex flex-col gap-1 max-h-[90px] overflow-y-auto pr-0.5" style={{ scrollbarWidth: 'thin' }}>
                            <span className="text-[8px] uppercase tracking-wider text-neutral-500 font-semibold">Paired Devices ({btDevices.length})</span>
                            {btDevices.map(dev => (
                              <div
                                key={dev.id}
                                className="p-1 px-1.5 rounded bg-neutral-900/60 hover:bg-neutral-800 flex items-center justify-between text-xs transition-colors"
                              >
                                <div className="flex items-center gap-1.5 truncate">
                                  <span className="text-xs">
                                    {dev.type === 'headphones' ? '🎧' : dev.type === 'keyboard' ? '⌨️' : dev.type === 'mouse' ? '🖱️' : dev.type === 'gamepad' ? '🎮' : '📶'}
                                  </span>
                                  <span className="text-[10px] text-neutral-200 font-medium truncate max-w-[110px]" title={dev.name}>{dev.name}</span>
                                </div>

                                <div className="flex items-center gap-1">
                                  <span className={`text-[8px] font-mono px-1 rounded ${dev.connected ? 'bg-emerald-500/20 text-emerald-400' : 'bg-neutral-800 text-neutral-400'}`}>
                                    {dev.connected ? 'Active' : 'Paired'}
                                  </span>
                                  <button
                                    onClick={() => {
                                      setBtDevices(prev => prev.map(d => {
                                        if (d.id === dev.id) {
                                          const nextConn = !d.connected;
                                          if (nextConn) triggerBluetoothIndicator();
                                          return { ...d, connected: nextConn };
                                        }
                                        return d;
                                      }));
                                    }}
                                    className={`text-[8px] px-1 py-0.2 rounded transition-colors ${
                                      dev.connected
                                        ? 'bg-neutral-800 text-neutral-400 hover:text-rose-400'
                                        : 'bg-indigo-500/20 text-indigo-300 hover:bg-indigo-500/30'
                                    }`}
                                  >
                                    {dev.connected ? '✕' : 'Connect'}
                                  </button>
                                </div>
                              </div>
                            ))}
                          </div>

                          {/* Quick Ping Test Button */}
                          <button
                            onClick={triggerBluetoothIndicator}
                            className="w-full mt-0.5 py-1 rounded-lg bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-[9px] text-indigo-300 font-medium flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
                          >
                            <span>⚡</span>
                            <span>Simulate Device Connect (5s Blink)</span>
                          </button>
                        </>
                      ) : (
                        <div className="py-2 text-center text-neutral-500 text-[10px]">
                          Bluetooth is currently turned off.
                        </div>
                      )}

                      <div className="pt-1 border-t border-neutral-800 flex items-center justify-between text-[8px] text-neutral-400">
                        <span className="truncate max-w-[140px]" title={telemetry.bluetooth?.adapter}>
                          {telemetry.bluetooth?.adapter || 'MediaTek Bluetooth'}
                        </span>
                        <span className="hover:text-indigo-400 cursor-pointer">
                          Bluetooth Settings ↗
                        </span>
                      </div>
                    </div>
                  )}

                  {/* 3. SENSORS & INDICATORS TAB CONTENT */}
                  {activeDropdownTab === 'sensors' && (
                    <div className="flex flex-col gap-1.5 animate-fadeIn">
                      <div className="flex items-center justify-between pb-1 border-b border-neutral-800 text-[9px] text-neutral-400 font-mono">
                        <span>ISLAND SENSORS</span>
                        <span className="text-amber-400 font-bold">{activeIndicators.length}/3 STACKED</span>
                      </div>

                      {/* Camera In Use */}
                      <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-emerald-400 text-xs">📷</span>
                          <span className="text-[10px] text-neutral-200 font-medium">Camera In Use</span>
                        </div>
                        <button
                          onClick={toggleCameraIndicator}
                          className={`w-7 h-4 rounded-full transition-colors p-0.5 flex items-center ${
                            isCamActive ? 'bg-emerald-500 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-white shadow-sm block" />
                        </button>
                      </div>

                      {/* Microphone In Use */}
                      <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-amber-400 text-xs">🎙️</span>
                          <span className="text-[10px] text-neutral-200 font-medium">Microphone In Use</span>
                        </div>
                        <button
                          onClick={toggleMicIndicator}
                          className={`w-7 h-4 rounded-full transition-colors p-0.5 flex items-center ${
                            isMicActive ? 'bg-amber-500 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-white shadow-sm block" />
                        </button>
                      </div>

                      {/* Airplane Mode */}
                      <div className="flex items-center justify-between py-1 px-1.5 rounded-lg bg-neutral-900/70 border border-neutral-800">
                        <div className="flex items-center gap-1.5">
                          <span className="text-orange-400 text-xs">✈️</span>
                          <span className="text-[10px] text-neutral-200 font-medium">Airplane Mode</span>
                        </div>
                        <button
                          onClick={toggleAirplaneMode}
                          className={`w-7 h-4 rounded-full transition-colors p-0.5 flex items-center ${
                            isAirplaneMode ? 'bg-orange-500 justify-end' : 'bg-neutral-800 justify-start'
                          }`}
                        >
                          <span className="w-3 h-3 rounded-full bg-white shadow-sm block" />
                        </button>
                      </div>

                      {/* Quick Testing Actions */}
                      <div className="grid grid-cols-2 gap-1 pt-0.5">
                        <button
                          onClick={triggerBluetoothIndicator}
                          className="px-2 py-1 rounded bg-indigo-500/15 hover:bg-indigo-500/25 border border-indigo-500/30 text-[9px] text-indigo-300 font-medium flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm"
                          title="Blinks Bluetooth Icon for 5s and vanishes"
                        >
                          <span>📶</span>
                          <span>Ping BT (5s)</span>
                        </button>

                        <button
                          onClick={toggleLowBatterySim}
                          className={`px-2 py-1 rounded border text-[9px] font-medium flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm ${
                            isLowBattery
                              ? 'bg-rose-500/20 border-rose-500/50 text-rose-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title="Toggle Low Battery Warning (<20%)"
                        >
                          <span>🪫</span>
                          <span>{isLowBattery ? 'Low Batt ON' : 'Test Batt Low'}</span>
                        </button>

                        <button
                          onClick={toggleChargingSim}
                          className={`col-span-2 px-2 py-1 rounded border text-[9px] font-medium flex items-center justify-center gap-1 active:scale-95 transition-all shadow-sm ${
                            isBatteryCharging
                              ? 'bg-emerald-500/20 border-emerald-500/50 text-emerald-300'
                              : 'bg-neutral-900 border-neutral-800 text-neutral-400 hover:text-white'
                          }`}
                          title="Toggle AC Power / Battery Charging Indicator"
                        >
                          <span>⚡</span>
                          <span>{isBatteryCharging ? 'AC Charging: ACTIVE' : 'AC Charging: OFF (Test)'}</span>
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
              className="absolute inset-2 z-50 rounded-2xl bg-[#111116]/98 backdrop-blur-xl border border-neutral-700 shadow-[0_20px_50px_rgba(0,0,0,0.9)] p-3.5 flex flex-col justify-between animate-fadeIn select-none"
            >
              <div>
                <div className="flex items-center justify-between pb-2 border-b border-neutral-800">
                  <span className="text-xs font-bold text-neutral-200 flex items-center gap-1.5">
                    <span className="text-amber-400">🤖</span>
                    <span>AI Model & Key Settings</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setIsKeyModalOpen(false)}
                    className="text-neutral-500 hover:text-white text-xs p-1 cursor-pointer"
                  >
                    ✕
                  </button>
                </div>

                {/* Status overview */}
                <div className="my-2 p-2 rounded-xl bg-neutral-900/90 border border-neutral-800 text-[10px] leading-relaxed">
                  {aiStatus.tier === 'bundled' ? (
                    <div className="text-emerald-400 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <span>⚡</span>
                        <span>Built-in Gemini 2.5 Flash Active</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-300">Default</span>
                    </div>
                  ) : aiStatus.tier === 'custom' ? (
                    <div className="text-cyan-400 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <span>✨</span>
                        <span>Custom Gemini Key Active</span>
                      </span>
                      <span className="text-[9px] px-1.5 py-0.5 rounded bg-cyan-500/20 text-cyan-300">Custom</span>
                    </div>
                  ) : (
                    <div className="text-amber-400 flex items-center justify-between">
                      <span className="font-semibold flex items-center gap-1">
                        <span>⚠️</span>
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
              <div className="flex flex-col justify-between h-full overflow-hidden select-none">
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
                      <span>{aiStatus.tier === 'bundled' ? '⚡' : aiStatus.tier === 'custom' ? '✨' : '🔑'}</span>
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
                        <span>🗑️</span>
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
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="text-sky-400 font-bold">💡</span>
                        <span>Explain</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiInput('Rewrite and polish this professionally: '); inputRef.current?.focus(); }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="text-emerald-400 font-bold">✨</span>
                        <span>Polish</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiInput('Summarize the key takeaways and next steps: '); inputRef.current?.focus(); }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="text-purple-400 font-bold">≡</span>
                        <span>Summarize</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => { setAiInput('Diagnose and fix bugs in this code: '); inputRef.current?.focus(); }}
                        className="px-2.5 py-1 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9.5px] text-neutral-200 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="text-amber-400 font-bold">🛠️</span>
                        <span>Fix Code</span>
                      </button>
                      <button
                        type="button"
                        onClick={handleTriggerChatSnip}
                        className="px-2.5 py-1 rounded-full bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-[9.5px] text-sky-300 flex items-center gap-1 transition-all active:scale-95 cursor-pointer"
                      >
                        <span className="text-sky-400 font-bold">📸</span>
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
                        className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}
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
                              <span className="text-[10px]">🤖</span>
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
                                  className="text-neutral-400 hover:text-emerald-400 transition-colors ml-1 cursor-pointer flex items-center gap-0.5"
                                  title="Copy response to clipboard"
                                >
                                  <span>{copiedMsgId === msg.id ? '✓' : '📋'}</span>
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
                      <div className="flex items-start gap-2 max-w-[85%] animate-pulse">
                        <div className="w-5 h-5 rounded-full bg-neutral-900 border border-neutral-700 flex items-center justify-center shrink-0 mt-0.5">
                          <span className="text-[10px]">🤖</span>
                        </div>
                        <div className="bg-[#141418]/95 border border-neutral-800 text-neutral-400 rounded-2xl rounded-tl-xs px-3.5 py-2 text-[10.5px] flex items-center gap-2">
                          <span className="text-emerald-400 animate-spin">✦</span>
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
                          <span>📸</span>
                          <span>Screen Snip Attached</span>
                        </span>
                        <span className="text-[8.5px] text-neutral-400">Gemini vision multimodal ready</span>
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => setAttachedMedia(null)}
                      className="p-1 text-neutral-400 hover:text-white text-xs cursor-pointer"
                      title="Remove attachment"
                    >
                      ✕
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
                        <span className="text-xs">📸</span>
                      </button>

                      {/* Attach Image File */}
                      <button
                        type="button"
                        onClick={() => chatImageInputRef.current?.click()}
                        title="Upload image from computer"
                        className="p-1 rounded-full hover:bg-neutral-800 hover:text-emerald-300 transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="text-xs">📎</span>
                      </button>

                      {/* Paste Clipboard */}
                      <button
                        type="button"
                        onClick={handlePasteClipboardToChat}
                        title="Paste text from clipboard"
                        className="p-1 rounded-full hover:bg-neutral-800 hover:text-amber-300 transition-colors cursor-pointer active:scale-95"
                      >
                        <span className="text-xs">📋</span>
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
              <div className="flex flex-col h-full animate-fadeIn select-none p-1 overflow-hidden">
                {/* Header: Title / Back Navigation & Quick Ingest Triggers */}
                <div className="flex items-center justify-between text-xs pb-1.5 border-b border-neutral-800/80 mb-1 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    {activeFeatureTool ? (
                      <button
                        type="button"
                        onClick={() => {
                          setActiveFeatureTool(null);
                          setFeatureResult(null);
                        }}
                        className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-[9.5px] font-mono text-emerald-400 hover:text-white flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                      >
                        <span>←</span>
                        <span>All Tools</span>
                      </button>
                    ) : (
                      <span className="font-semibold text-neutral-200 flex items-center gap-1.5 text-[11px]">
                        <span className="text-amber-400">✱</span>
                        <span>AI NEURAL SUITE</span>
                      </span>
                    )}

                    <button
                      type="button"
                      onClick={() => setIsKeyModalOpen(true)}
                      className={`text-[8.5px] font-mono px-2 py-0.5 rounded-full border transition-all cursor-pointer active:scale-95 flex items-center gap-1 ${
                        aiStatus.tier === 'bundled'
                          ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 hover:bg-emerald-500/25'
                          : aiStatus.tier === 'custom'
                          ? 'bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 hover:bg-cyan-500/25'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/40 hover:bg-amber-500/30 animate-pulse'
                      }`}
                      title="Click to view AI Model settings"
                    >
                      <span>{aiStatus.tier === 'bundled' ? '⚡' : aiStatus.tier === 'custom' ? '✨' : '🔑'}</span>
                      <span>
                        {aiStatus.tier === 'bundled'
                          ? 'Built-in Gemini'
                          : aiStatus.tier === 'custom'
                          ? 'Custom Gemini Pro'
                          : 'Set Gemini Key'}
                      </span>
                    </button>
                  </div>

                  <div className="flex items-center gap-1.5 text-[9px] font-mono">
                    <button
                      type="button"
                      onClick={() => handleTriggerSnip(activeFeatureTool || 'explain')}
                      className="px-2 py-0.5 rounded-lg bg-sky-500/15 hover:bg-sky-500/25 border border-sky-500/30 text-sky-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer active:scale-95 shadow-sm"
                      title="Transform cursor to + crosshair to snip any region on your display"
                    >
                      <span className="text-sky-400 font-bold">+</span>
                      <span>Snip Screen</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleTriggerFromClipboard(activeFeatureTool || 'explain')}
                      className="px-2 py-0.5 rounded-lg bg-neutral-900 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white flex items-center gap-1 transition-all cursor-pointer active:scale-95"
                      title="Analyze current text on clipboard"
                    >
                      <span>📋</span>
                      <span className="hidden sm:inline">From</span>
                      <span>Clipboard</span>
                    </button>
                  </div>
                </div>

                {/* Main Body: Loading Scanner vs Result Card vs Tools Launcher */}
                {featureLoading ? (
                  <div className="flex-1 flex flex-col items-center justify-center p-3 text-center rounded-2xl bg-neutral-900/40 border border-neutral-800/60 my-auto">
                    <div className="relative w-12 h-12 flex items-center justify-center mb-2">
                      <div className="absolute inset-0 rounded-full border-2 border-dashed border-sky-400/60 animate-spin" />
                      <div className="w-8 h-8 rounded-full bg-sky-500/20 flex items-center justify-center text-sky-300 text-sm animate-pulse">
                        ✦
                      </div>
                    </div>
                    <span className="text-xs font-semibold text-neutral-200 mb-0.5">
                      Neural Multimodal Scan...
                    </span>
                    <span className="text-[9px] font-mono text-neutral-400">
                      Analyzing selection with Gemini Flash Vision
                    </span>
                  </div>
                ) : featureResult ? (
                  /* Active Tool Result Card */
                  <div className="flex-1 flex flex-col justify-between overflow-hidden bg-neutral-900/70 border border-neutral-800/90 rounded-2xl p-2.5 my-auto">
                    {/* Result Header */}
                    <div className="flex items-center justify-between pb-1 border-b border-neutral-800/80 mb-1 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <span className="text-[11px] font-bold text-neutral-200">
                          {featureResult.title}
                        </span>
                        <span className="text-[8px] font-mono px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                          {featureResult.badge}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 text-[8.5px] font-mono text-neutral-500">
                        {featureCropPreview ? (
                          <span className="flex items-center gap-1 text-sky-400">
                            <span>✂️</span>
                            <span>Cropped Region</span>
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-neutral-400">
                            <span>📋</span>
                            <span>Clipboard Ingest</span>
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Result Content Scrollable Area */}
                    <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-1.5 text-xs select-text" style={{ scrollbarWidth: 'thin' }}>
                      {/* 1. EXPLAIN */}
                      {featureResult.tool === 'explain' && (
                        <div className="flex flex-col gap-1.5">
                          <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-neutral-200 leading-relaxed text-[11px]">
                            <span className="font-bold text-amber-400 block mb-0.5">💡 In Plain English (ELI5):</span>
                            {featureResult.eli5}
                          </div>
                          <div className="flex flex-col gap-1 px-1">
                            <span className="text-[9px] font-mono text-neutral-400 uppercase tracking-wider font-semibold">Key Takeaways:</span>
                            {featureResult.takeaways?.map((pt, i) => (
                              <div key={i} className="flex items-start gap-1.5 text-[10px] text-neutral-300">
                                <span className="text-emerald-400">✓</span>
                                <span>{pt}</span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* 2. POLISH */}
                      {featureResult.tool === 'polish' && (
                        <div className="flex flex-col gap-1.5">
                          {/* Tone Selector Pills */}
                          <div className="flex items-center gap-1 flex-shrink-0">
                            <span className="text-[8.5px] font-mono text-neutral-500 mr-1">Tone:</span>
                            {['professional', 'casual', 'concise'].map((t) => (
                              <button
                                key={t}
                                type="button"
                                onClick={() => handleExecuteFeature('polish', { tone: t })}
                                className={`px-2 py-0.5 rounded text-[9px] font-mono capitalize transition-all cursor-pointer ${
                                  featureResult.tone === t
                                    ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 font-bold'
                                    : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-neutral-700'
                                }`}
                              >
                                {t}
                              </button>
                            ))}
                          </div>

                          {/* Polished Box */}
                          <div className="p-2 rounded-xl bg-emerald-500/10 border border-emerald-500/25 text-neutral-100 font-sans leading-relaxed text-[11.5px]">
                            {featureResult.polished}
                          </div>
                        </div>
                      )}

                      {/* 3. TRANSLATE */}
                      {featureResult.tool === 'translate' && (
                        <div className="flex flex-col gap-1.5">
                          {/* Target Lang Switcher */}
                          <div className="flex items-center gap-1 flex-shrink-0 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                            <span className="text-[8.5px] font-mono text-neutral-500 mr-0.5">To:</span>
                            {[
                              { code: 'es', label: 'Spanish' },
                              { code: 'fr', label: 'French' },
                              { code: 'de', label: 'German' },
                              { code: 'ja', label: 'Japanese' },
                              { code: 'hi', label: 'Hindi' },
                              { code: 'zh', label: 'Chinese' },
                            ].map((l) => (
                              <button
                                key={l.code}
                                type="button"
                                onClick={() => {
                                  setTargetTranslateLang(l.code);
                                  handleExecuteFeature('translate', { targetLang: l.code });
                                }}
                                className={`px-1.5 py-0.5 rounded text-[8.5px] font-mono transition-all cursor-pointer ${
                                  featureResult.targetLang?.toLowerCase() === l.label.toLowerCase()
                                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 font-bold'
                                    : 'bg-neutral-800/80 text-neutral-400 hover:text-white border border-neutral-700'
                                }`}
                              >
                                {l.label}
                              </button>
                            ))}
                          </div>

                          <div className="p-2 rounded-xl bg-cyan-500/10 border border-cyan-500/20 text-neutral-100 leading-relaxed text-[11.5px]">
                            <div className="flex items-center justify-between mb-1">
                              <span className="text-[9px] font-mono text-cyan-400 font-semibold">{featureResult.targetLang} Translation:</span>
                              <button
                                type="button"
                                onClick={() => handleSpeakTranslation(featureResult.translatedText, targetTranslateLang)}
                                className="px-1.5 py-0.5 rounded bg-cyan-500/20 hover:bg-cyan-500/30 text-cyan-300 text-[8.5px] font-mono flex items-center gap-1 cursor-pointer transition-all active:scale-95"
                                title="Listen to pronunciation"
                              >
                                <span>🔊</span>
                                <span>Speak</span>
                              </button>
                            </div>
                            <div className="font-medium text-white mb-1">{featureResult.translatedText}</div>
                            {featureResult.phonetic && (
                              <div className="text-[9.5px] font-mono text-neutral-400 italic">
                                Pronunciation: {featureResult.phonetic}
                              </div>
                            )}
                          </div>
                        </div>
                      )}

                      {/* 4. SUMMARIZE */}
                      {featureResult.tool === 'summarize' && (
                        <div className="flex flex-col gap-1.5">
                          <div className="p-2 rounded-xl bg-purple-500/10 border border-purple-500/20 text-neutral-200 leading-relaxed text-[11px]">
                            <span className="font-bold text-purple-400 block mb-0.5">⚡ Executive TL;DR:</span>
                            {featureResult.tldr}
                          </div>

                          {featureResult.actionTasks && (
                            <div className="p-1.5 rounded-xl bg-neutral-900/90 border border-neutral-800 flex flex-col gap-1">
                              <div className="flex items-center justify-between text-[8.5px] font-mono text-neutral-400">
                                <span>ACTION TASKS EXTRACTED:</span>
                                <button
                                  type="button"
                                  onClick={() => handleSendTasksToScratchpad(featureResult.actionTasks)}
                                  className="text-emerald-400 hover:text-emerald-300 underline cursor-pointer"
                                >
                                  {featureSavedNote ? '✓ Sent to Tasks!' : 'Send to Scratchpad Tasks →'}
                                </button>
                              </div>
                              {featureResult.actionTasks.map((t, idx) => (
                                <div key={idx} className="text-[9.5px] font-mono text-neutral-300 flex items-center gap-1">
                                  <span>{t}</span>
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* 5. FIX CODE */}
                      {featureResult.tool === 'code' && (
                        <div className="flex flex-col gap-1.5">
                          <div className="p-1.5 rounded-xl bg-rose-500/10 border border-rose-500/25 text-rose-300 text-[10px] font-mono leading-tight">
                            <span className="font-bold block text-rose-400">Bug Identified:</span>
                            {featureResult.rootCause}
                          </div>

                          <div className="p-2 rounded-xl bg-[#0b0b0e] border border-neutral-800 font-mono text-[10px] text-emerald-400 leading-relaxed overflow-x-auto whitespace-pre">
                            {featureResult.fixedCode}
                          </div>
                        </div>
                      )}

                      {/* 6. SNIP & ASK */}
                      {featureResult.tool === 'snip' && (
                        <div className="flex flex-col gap-1.5">
                          {featureCropPreview && (
                            <div className="flex items-center gap-2 p-1 bg-black/40 rounded-lg border border-neutral-800">
                              <img
                                src={featureCropPreview}
                                alt="Crop preview"
                                className="w-24 h-12 object-contain rounded border border-neutral-700"
                              />
                              <div className="text-[9px] font-mono text-neutral-400">
                                <div>Selection captured</div>
                                <div className="text-emerald-400">High-DPI OCR Complete</div>
                              </div>
                            </div>
                          )}
                          <div className="p-2 rounded-xl bg-neutral-900 border border-neutral-800 text-[11px] text-neutral-200">
                            {featureResult.analysis}
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Result Action Buttons Footer */}
                    <div className="flex items-center justify-between pt-1.5 border-t border-neutral-800/80 mt-1 flex-shrink-0 text-[9px] font-mono">
                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            const textToCopy =
                              featureResult.polished ||
                              featureResult.translatedText ||
                              featureResult.fixedCode ||
                              featureResult.eli5 ||
                              featureResult.tldr ||
                              '';
                            handleCopyFeatureResult(textToCopy);
                          }}
                          className={`px-2 py-0.5 rounded-lg border transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                            featureCopied
                              ? 'bg-emerald-500 text-black border-emerald-400 font-bold'
                              : 'bg-neutral-800 hover:bg-neutral-700 text-neutral-200 border-neutral-700'
                          }`}
                        >
                          <span>{featureCopied ? '✓' : '📋'}</span>
                          <span>{featureCopied ? 'Copied!' : 'Copy Result'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => {
                            const note =
                              featureResult.tldr ||
                              featureResult.eli5 ||
                              featureResult.fixedCode ||
                              featureResult.translatedText ||
                              '';
                            handleSaveFeatureToScratchpad(note, 'general');
                          }}
                          className="px-2 py-0.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-neutral-300 hover:text-white transition-all cursor-pointer active:scale-95"
                        >
                          {featureSavedNote ? '✓ Saved!' : '📝 Save Note'}
                        </button>
                      </div>

                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => handleTriggerSnip(activeFeatureTool)}
                          className="text-sky-400 hover:text-sky-300 hover:underline cursor-pointer"
                        >
                          + Snip Again
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
                          Close
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  /* 6-Tool Launcher Grid (Fitted Perfectly with Zero Overflow) */
                  <div className="flex-1 min-h-0 grid grid-cols-3 grid-rows-2 gap-2 my-auto py-0.5">
                    {/* Tool 1: Explain */}
                    <div
                      onClick={() => handleTriggerSnip('explain')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-sky-500/50 flex flex-col justify-between transition-all active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm group-hover:scale-110 transition-transform">💡</span>
                        <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded-full bg-sky-500/15 text-sky-400 border border-sky-500/30 font-semibold">
                          SNIP
                        </span>
                      </div>
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
                      onClick={() => handleTriggerFromClipboard('polish')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-emerald-500/50 flex flex-col justify-between transition-all active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm group-hover:scale-110 transition-transform">✨</span>
                        <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 font-semibold">
                          CLIPBOARD
                        </span>
                      </div>
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
                      onClick={() => handleTriggerSnip('translate')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-cyan-500/50 flex flex-col justify-between transition-all active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm group-hover:scale-110 transition-transform">🌐</span>
                        <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded-full bg-cyan-500/15 text-cyan-400 border border-cyan-500/30 font-semibold">
                          SNIP
                        </span>
                      </div>
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
                      onClick={() => handleTriggerSnip('summarize')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-purple-500/50 flex flex-col justify-between transition-all active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm group-hover:scale-110 transition-transform">≡</span>
                        <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded-full bg-purple-500/15 text-purple-400 border border-purple-500/30 font-semibold">
                          SNIP
                        </span>
                      </div>
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
                      onClick={() => handleTriggerFromClipboard('code')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-amber-500/50 flex flex-col justify-between transition-all active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm group-hover:scale-110 transition-transform">🛠️</span>
                        <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded-full bg-amber-500/15 text-amber-400 border border-amber-500/30 font-semibold">
                          CLIPBOARD
                        </span>
                      </div>
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
                      onClick={() => handleTriggerSnip('snip')}
                      className="px-2.5 py-2 rounded-xl bg-[#111116] hover:bg-[#181822] border border-neutral-800/90 hover:border-rose-500/50 flex flex-col justify-between transition-all active:scale-95 group shadow-sm cursor-pointer select-none"
                    >
                      <div className="flex items-center justify-between">
                        <span className="text-sm group-hover:scale-110 transition-transform">✂️</span>
                        <span className="text-[7.5px] font-mono px-1.5 py-0.5 rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 font-semibold">
                          VISION
                        </span>
                      </div>
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
              <div className="flex items-center justify-between gap-3 h-full animate-fadeIn select-none">
                
                {/* LEFT WING: BIO-QUANTUM NEURAL REACTOR */}
                <div className="w-[145px] h-full flex flex-col items-center justify-between py-1 px-1 bg-gradient-to-b from-[#121217] to-[#09090c] rounded-2xl border border-neutral-800/90 relative overflow-hidden group shadow-inner">
                  {/* Ambient breathing radial aura */}
                  <div
                    className="absolute inset-0 pointer-events-none opacity-20"
                    style={{ background: `radial-gradient(circle at center, ${theme.color} 0%, transparent 75%)` }}
                  />

                  {/* Top Header Tag */}
                  <div className="flex items-center gap-1.5 z-10 pt-0.5">
                    <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_#34d399]" />
                    <span className="text-[8px] font-mono tracking-widest text-neutral-400 uppercase">BIO-CORE</span>
                  </div>

                  {/* Interactive Reactor with Orbital Cyber Rings & Living Eyes */}
                  <div
                    onClick={triggerRejoice}
                    title="Click to Pet Eyeland Neural Core!"
                    className="relative w-20 h-20 flex items-center justify-center cursor-pointer my-auto transform hover:scale-105 active:scale-95 transition-all"
                  >
                    {/* Ambient Core Breathing Glow */}
                    <div
                      className="absolute w-14 h-14 rounded-full blur-md opacity-30 pointer-events-none radar-breath"
                      style={{ backgroundColor: theme.color }}
                    />
                    
                    {/* Outer Rotating Cyber Ring */}
                    <svg className="absolute inset-0 w-full h-full cyber-orbit pointer-events-none opacity-40 text-emerald-400" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="46" fill="none" stroke="currentColor" strokeWidth="1.2" strokeDasharray="8 8 20 6" />
                      <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.8" strokeDasharray="4 6 12 6" />
                    </svg>

                    {/* Counter-rotating Inner Ring */}
                    <svg className="absolute inset-0 w-full h-full cyber-orbit-fast pointer-events-none opacity-30 text-cyan-400" viewBox="0 0 100 100">
                      <circle cx="50" cy="50" r="43" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="6 14 6 14" />
                    </svg>

                    {/* Centered Living Pearl Eyes */}
                    <div className="relative z-10 pointer-events-none">
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
                  </div>

                  {/* Core Pet Action & Flow Status */}
                  <div className="flex flex-col items-center gap-0.5 z-10 pb-0.5">
                    <button
                      onClick={triggerRejoice}
                      className="px-2.5 py-0.5 rounded-full bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-700/80 text-[9px] text-neutral-300 hover:text-white flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                    >
                      <span>❤️</span>
                      <span className="font-medium">Pet Buddy</span>
                    </button>
                    <span className="text-[7.5px] font-mono text-emerald-400/90 pt-0.5">SYNC 100% • 60 FPS</span>
                  </div>
                </div>

                {/* RIGHT WING: REAL HARDWARE TELEMETRY DECK (2x2 HUD Grid) */}
                <div className="flex-1 h-full flex flex-col justify-between pl-0.5">
                  
                  {/* 2x2 Telemetry HUD Cards */}
                  <div className="grid grid-cols-2 gap-1.5 flex-1">
                    
                    {/* CARD 1: CPU NEURAL ENGINE (Real Device Data) */}
                    <div className="p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-colors shadow-sm">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300">
                          <span className="text-cyan-400">⚡</span>
                          <span>CPU LOAD</span>
                        </span>
                        <span className="font-mono text-cyan-400 font-bold text-[10px]">
                          {telemetry.cpu?.loadPercent || 12}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-500"
                          style={{ width: `${Math.max(6, telemetry.cpu?.loadPercent || 12)}%` }}
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
                    <div className="p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-colors shadow-sm">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300">
                          <span className="text-purple-400">🧠</span>
                          <span>MEMORY</span>
                        </span>
                        <span className="font-mono text-purple-400 font-bold text-[10px]">
                          {telemetry.memory?.percent || 82}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-purple-500 to-pink-400 transition-all duration-500"
                          style={{ width: `${telemetry.memory?.percent || 82}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400">
                        <span>{telemetry.memory?.usedGb || '12.7'} GB</span>
                        <span className="text-neutral-500">/ {telemetry.memory?.totalGb || '15.4'} GB</span>
                      </div>
                    </div>

                    {/* CARD 3: REAL WLAN LINK (Real Wi-Fi Data) */}
                    <div className="p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-colors shadow-sm">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300 truncate">
                          <span className="text-sky-400">📶</span>
                          <span className="truncate max-w-[85px]" title={currentWifi}>{currentWifi}</span>
                        </span>
                        <span className="font-mono text-sky-400 font-bold text-[10px]">
                          {telemetry.wifi?.signal || 80}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-sky-400 to-blue-500 transition-all duration-500"
                          style={{ width: `${telemetry.wifi?.signal || 80}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 truncate">
                        <span className="truncate">{telemetry.wifi?.speed || '286.8 Mbps'}</span>
                        <span className="text-neutral-500">{telemetry.wifi?.radioType?.split(' ')[0] || 'Wi-Fi 6'}</span>
                      </div>
                    </div>

                    {/* CARD 4: POWER MATRIX (Real Battery & AC Status) */}
                    <div className="p-2 rounded-xl bg-[#111115]/90 border border-neutral-800/80 hover:border-neutral-700/80 flex flex-col justify-between transition-colors shadow-sm">
                      <div className="flex items-center justify-between text-[9px]">
                        <span className="flex items-center gap-1 font-semibold text-neutral-300">
                          <span className="text-emerald-400">{telemetry.battery?.isCharging ? '⚡' : '🔋'}</span>
                          <span>POWER</span>
                        </span>
                        <span className="font-mono text-emerald-400 font-bold text-[10px]">
                          {telemetry.battery?.percent || 100}%
                        </span>
                      </div>
                      <div className="w-full bg-neutral-850 h-1.5 rounded-full my-1 overflow-hidden">
                        <div
                          className="h-full rounded-full bg-gradient-to-r from-emerald-500 to-teal-400 transition-all duration-500"
                          style={{ width: `${telemetry.battery?.percent || 100}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[8px] font-mono text-neutral-400 truncate">
                        <span className="truncate text-emerald-400/90">{telemetry.battery?.statusText || 'AC Powered'}</span>
                        <span className="text-neutral-500">Optimum</span>
                      </div>
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
                        <span>💬</span>
                        <span>Eyeland AI</span>
                      </button>
                      <button
                        onClick={handleScanScreen}
                        className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 text-[9px] text-neutral-300 flex items-center gap-1 transition-all active:scale-95"
                      >
                        <span>📸</span>
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
                className={`relative flex flex-col justify-between h-full p-2.5 rounded-2xl transition-all duration-300 select-none overflow-hidden ${
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
                      <span>📄</span>
                      <span>+ File</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => folderInputRef.current?.click()}
                      className="px-2 py-0.5 rounded-md bg-neutral-800 hover:bg-neutral-700 border border-neutral-700 hover:border-neutral-600 text-[9px] text-neutral-200 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                      title="Browse and select a folder to stage"
                    >
                      <span>📁</span>
                      <span>+ Folder</span>
                    </button>

                    {stagedFiles.length > 0 && (
                      <button
                        type="button"
                        onClick={clearAllStagedFiles}
                        className="px-2 py-0.5 rounded-md bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-[9px] text-rose-300 flex items-center gap-1 transition-all active:scale-95 shadow-sm"
                        title="Clear all staged files from shelf"
                      >
                        <span>✕</span>
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
                          <span className="text-lg animate-bounce">📥</span>
                        ) : (
                          <svg className="w-4 h-4 text-indigo-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                            <polyline points="7 10 12 15 17 10" />
                            <line x1="12" y1="15" x2="12" y2="3" />
                          </svg>
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
                          ⚡ Auto-switches on drag
                        </span>
                        <span className="text-[8px] px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-300 font-mono">
                          🖱️ Drag out to any window
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
                            {f.isFolder ? '📁' :
                             f.type === 'image' ? '🖼️' :
                             f.type === 'code' ? '💻' :
                             f.type === 'pdf' ? '📄' :
                             f.type === 'audio' ? '🎵' :
                             f.type === 'video' ? '🎬' :
                             f.type === 'archive' ? '📦' : '📝'}
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
                  <span className="flex items-center gap-1 truncate text-neutral-400">
                    <span className="text-indigo-400">💡</span>
                    <span className="truncate">Drag any card out to drop into Explorer, Browser, Slack, Word, etc.</span>
                  </span>

                  {stagedFiles.length > 1 && (
                    <div
                      draggable={true}
                      onDragStart={handleDragAllOut}
                      onDragEnd={handleDragItemEnd}
                      className="flex items-center gap-1 px-1.5 py-0.5 rounded bg-indigo-500/15 border border-indigo-500/30 text-indigo-300 hover:text-white cursor-grab active:cursor-grabbing font-medium text-[8px] transition-all"
                      title="Drag ALL staged files out together"
                    >
                      <span>📦</span>
                      <span>Drag All ({stagedFiles.length})</span>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* 4. FUTURISTIC SPOTIFY MUSIC TAB WITH DYNAMIC AMBIENT LIGHTING */}
            {activeTab === 'music' && (
              <div 
                className="relative flex flex-col justify-between h-full p-2.5 rounded-2xl overflow-hidden transition-all duration-700 select-none border border-white/10"
                style={{ background: ambientPalette.radialAura }}
              >
                {/* Ambient Breathing Backdrop Light */}
                <div 
                  className="absolute -top-10 -left-10 w-44 h-44 rounded-full pointer-events-none blur-3xl ambient-aura-pulse"
                  style={{ backgroundColor: ambientPalette.rgba(0.3) }}
                />

                {/* Top Status & Controls Bar */}
                <div className="relative z-10 flex items-center justify-between text-xs pb-1 border-b border-white/10 flex-shrink-0">
                  <div className="flex items-center gap-1.5">
                    {/* Spotify Logo Pill */}
                    <div className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-[#1db954]/20 border border-[#1db954]/40 text-[#1ed760] font-semibold text-[9px] shadow-[0_0_8px_rgba(29,185,84,0.3)]">
                      <svg className="w-2.5 h-2.5 fill-current" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.218.358-.684.472-1.042.254-2.857-1.745-6.455-2.14-10.692-1.17-.41.094-.822-.164-.916-.574-.094-.41.164-.822.574-.916 4.636-1.06 8.604-.61 11.822 1.364.358.218.472.684.254 1.042zm1.466-3.262c-.274.446-.856.59-1.302.316-3.27-2.01-8.256-2.592-12.124-1.418-.502.152-1.036-.134-1.188-.636-.152-.502.134-1.036.636-1.188 4.418-1.34 9.914-.686 13.662 1.624.446.274.59.856.316 1.302zm.126-3.41c-3.922-2.328-10.384-2.542-14.134-1.404-.6.182-1.242-.162-1.424-.762-.182-.6.162-1.242.762-1.424 4.31-1.308 11.442-1.054 15.946 1.62.54.32.716 1.024.396 1.564-.32.54-1.024.716-1.564.396z"/>
                      </svg>
                      <span>{trackData.isNativeSpotify ? 'SPOTIFY DESKTOP' : 'SPOTIFY'}</span>
                    </div>

                    {trackData.isNativeSpotify ? (
                      <span className="flex items-center gap-1 text-[8px] font-mono text-emerald-400 font-semibold px-1.5 py-0.2 rounded-full bg-emerald-500/10 border border-emerald-500/20">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                        <span>LIVE SYNC</span>
                      </span>
                    ) : (
                      <span className="text-[8.5px] font-mono text-neutral-400">
                        {trackData.source || 'Spotify PC'}
                      </span>
                    )}

                    {/* Ambient Palette Indicator Pill */}
                    <div 
                      className="px-1.5 py-0.2 rounded-full text-[7.5px] font-mono flex items-center gap-1 border"
                      style={{ 
                        borderColor: `${ambientPalette.hex}50`, 
                        backgroundColor: `${ambientPalette.hex}20`,
                        color: ambientPalette.hex 
                      }}
                      title="Dynamic Ambient Poster Hue"
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: ambientPalette.hex }} />
                      <span>{ambientPalette.hex.toUpperCase()}</span>
                    </div>
                  </div>

                  <div className="flex items-center gap-1.5">
                    {/* Live Sync / Refresh Spotify Status Button */}
                    <button
                      type="button"
                      onClick={() => {
                        window.electronAPI?.refreshLiveMedia?.();
                      }}
                      title="Sync with Spotify"
                      className="flex items-center gap-1 px-2.5 py-1 rounded-full text-[9px] font-medium bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-emerald-500/50 text-neutral-300 hover:text-emerald-400 transition-all cursor-pointer active:scale-95 shadow-sm"
                    >
                      <svg className="w-2.5 h-2.5 text-emerald-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                        <path d="M21.5 2v6h-6M21.34 15.57a10 10 0 1 1-.57-8.38l5.67-5.67" />
                      </svg>
                      <span>Sync</span>
                    </button>
                  </div>
                </div>

                {!trackData.title ? (
                  /* Spotify Idle / No Track Playing View */
                  <div className="relative z-10 flex flex-col items-center justify-center flex-1 my-auto text-center py-6 px-4">
                    <div 
                      className="w-14 h-14 rounded-2xl flex items-center justify-center mb-2.5 shadow-[0_0_24px_rgba(29,185,84,0.25)] border"
                      style={{ 
                        backgroundColor: 'rgba(29, 185, 84, 0.15)',
                        borderColor: 'rgba(29, 185, 84, 0.35)'
                      }}
                    >
                      <svg className="w-8 h-8 fill-[#1ed760]" viewBox="0 0 24 24">
                        <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.218.358-.684.472-1.042.254-2.857-1.745-6.455-2.14-10.692-1.17-.41.094-.822-.164-.916-.574-.094-.41.164-.822.574-.916 4.636-1.06 8.604-.61 11.822 1.364.358.218.472.684.254 1.042zm1.466-3.262c-.274.446-.856.59-1.302.316-3.27-2.01-8.256-2.592-12.124-1.418-.502.152-1.036-.134-1.188-.636-.152-.502.134-1.036.636-1.188 4.418-1.34 9.914-.686 13.662 1.624.446.274.59.856.316 1.302zm.126-3.41c-3.922-2.328-10.384-2.542-14.134-1.404-.6.182-1.242-.162-1.424-.762-.182-.6.162-1.242.762-1.424 4.31-1.308 11.442-1.054 15.946 1.62.54.32.716 1.024.396 1.564-.32.54-1.024.716-1.564.396z"/>
                      </svg>
                    </div>
                    <h4 className="text-sm font-bold text-white tracking-tight mb-1">Spotify Idle</h4>
                    <p className="text-[11px] text-neutral-400 max-w-xs mb-3.5 leading-relaxed">
                      Play any song on Spotify to view live album art, track timeline, and synchronized lyrics.
                    </p>
                    <button
                      type="button"
                      onClick={handlePlayPause}
                      className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#1db954] hover:bg-[#1ed760] text-black font-bold text-xs shadow-[0_0_15px_rgba(29,185,84,0.4)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                        <polygon points="5 3 19 12 5 21 5 3" />
                      </svg>
                      <span>Resume Spotify</span>
                    </button>
                  </div>
                ) : (
                  /* Main Player Row: Poster with Ambient Glow + Track Telemetry HUD */
                  <div className="relative z-10 flex items-center justify-between gap-3.5 my-auto py-0.5 flex-1 min-h-0">
                    
                    {/* Left: 3D Poster Art with Rotating Vinyl & Ambient Backlight */}
                    <div className="relative flex-shrink-0 w-22 h-22 sm:w-24 sm:h-24 flex items-center justify-center">
                      
                      {/* Deep Ambient Backlight Casting Dynamic Color */}
                      <div 
                        className="absolute inset-0 rounded-2xl pointer-events-none transition-all duration-700"
                        style={{ 
                          backgroundColor: ambientPalette.hex,
                          boxShadow: ambientPalette.glowShadow,
                          filter: 'blur(14px)',
                          opacity: isPlaying ? 0.85 : 0.4
                        }}
                      />

                      {/* Interactive Spinning Black Vinyl Record (Peeking out to the right) */}
                      <div 
                        className={`absolute right-0 w-20 h-20 sm:w-22 sm:h-22 rounded-full bg-[#0a0a0c] border border-neutral-800 flex items-center justify-center shadow-2xl transition-transform duration-500 pointer-events-none ${
                          isPlaying ? 'vinyl-rotating translate-x-3' : 'translate-x-1'
                        }`}
                        style={{
                          backgroundImage: 'radial-gradient(circle, #0a0a0c 35%, #16161a 36%, #0a0a0c 38%, #16161a 40%, #0a0a0c 43%, #16161a 46%, #0a0a0c 49%, #16161a 52%, #0a0a0c 56%, #16161a 60%, #0a0a0c 64%, #18181d 72%, #09090b 100%)'
                        }}
                      >
                        {/* Center Record Label matching ambient poster color */}
                        <div 
                          className="w-6 h-6 rounded-full flex items-center justify-center border border-white/20 shadow-inner"
                          style={{ backgroundColor: ambientPalette.hex }}
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-black border border-white/40" />
                        </div>
                      </div>

                      {/* High-Resolution Album Cover Poster Frame */}
                      <div className="relative z-10 w-20 h-20 sm:w-22 sm:h-22 rounded-xl overflow-hidden border border-white/20 shadow-2xl bg-neutral-900 group">
                        {trackData.artwork ? (
                          <img 
                            src={trackData.artwork} 
                            alt={trackData.title}
                            className="w-full h-full object-cover transform group-hover:scale-105 transition-transform duration-500"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-neutral-800 text-neutral-500">
                            <svg className="w-8 h-8 fill-current" viewBox="0 0 24 24">
                              <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.494 17.306c-.218.358-.684.472-1.042.254-2.857-1.745-6.455-2.14-10.692-1.17-.41.094-.822-.164-.916-.574-.094-.41.164-.822.574-.916 4.636-1.06 8.604-.61 11.822 1.364.358.218.472.684.254 1.042zm1.466-3.262c-.274.446-.856.59-1.302.316-3.27-2.01-8.256-2.592-12.124-1.418-.502.152-1.036-.134-1.188-.636-.152-.502.134-1.036.636-1.188 4.418-1.34 9.914-.686 13.662 1.624.446.274.59.856.316 1.302zm.126-3.41c-3.922-2.328-10.384-2.542-14.134-1.404-.6.182-1.242-.162-1.424-.762-.182-.6.162-1.242.762-1.424 4.31-1.308 11.442-1.054 15.946 1.62.54.32.716 1.024.396 1.564-.32.54-1.024.716-1.564.396z"/>
                            </svg>
                          </div>
                        )}
                        {/* Glossy reflective sheen */}
                        <div className="absolute inset-0 bg-gradient-to-tr from-black/40 via-transparent to-white/20 pointer-events-none" />
                      </div>
                    </div>

                    {/* Right: Track HUD, Live Audio Spectrum & Controls */}
                    <div className="flex-1 min-w-0 flex flex-col justify-between h-full pl-0.5">
                      
                      {/* Track Title & Artist */}
                      <div className="flex items-start justify-between gap-1">
                        <div className="min-w-0 flex-1">
                          <h4 className="text-xs sm:text-sm font-bold text-white tracking-tight truncate drop-shadow-sm" title={trackData.title}>
                            {trackData.title}
                          </h4>
                          <p className="text-[10px] text-neutral-300 font-medium truncate mt-0.5 flex items-center gap-1">
                            <span>{trackData.artist}</span>
                            <span className="text-neutral-500">•</span>
                            <span className="text-neutral-400 truncate max-w-[120px]">{trackData.album}</span>
                          </p>
                          {/* Live Synchronized Rolling Lyric Subtitle */}
                          {hasLyrics && currentLyricLine && (
                            <div 
                              key={activeLyricIndex} 
                              className="mt-1 flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-black/40 border border-white/10 max-w-full animate-lyric-slide"
                            >
                              <svg className="w-2.5 h-2.5 flex-shrink-0" viewBox="0 0 24 24" fill="currentColor" style={{ color: ambientPalette.hex }}>
                                <path d="M12 3v10.55c-.59-.34-1.27-.55-2-.55-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4V7h4V3h-6z" />
                              </svg>
                              <span className="text-[9.5px] font-medium text-neutral-200 truncate" title={currentLyricLine}>
                                {currentLyricLine}
                              </span>
                            </div>
                          )}
                        </div>

                        {/* 5-Bar Live Dancing Equalizer Visualizer */}
                        <div className="flex items-end gap-0.5 h-4 flex-shrink-0 pl-1" title="Ambient Spectrum">
                          <span 
                            className={`w-0.5 rounded-full transition-all ${isPlaying ? 'eq-bar-1' : 'h-1'}`} 
                            style={{ backgroundColor: ambientPalette.hex, boxShadow: `0 0 6px ${ambientPalette.hex}` }} 
                          />
                          <span 
                            className={`w-0.5 rounded-full transition-all ${isPlaying ? 'eq-bar-2' : 'h-1.5'}`} 
                            style={{ backgroundColor: ambientPalette.hex, boxShadow: `0 0 6px ${ambientPalette.hex}` }} 
                          />
                          <span 
                            className={`w-0.5 rounded-full transition-all ${isPlaying ? 'eq-bar-3' : 'h-1'}`} 
                            style={{ backgroundColor: ambientPalette.hex, boxShadow: `0 0 6px ${ambientPalette.hex}` }} 
                          />
                          <span 
                            className={`w-0.5 rounded-full transition-all ${isPlaying ? 'eq-bar-4' : 'h-2'}`} 
                            style={{ backgroundColor: ambientPalette.hex, boxShadow: `0 0 6px ${ambientPalette.hex}` }} 
                          />
                          <span 
                            className={`w-0.5 rounded-full transition-all ${isPlaying ? 'eq-bar-5' : 'h-1'}`} 
                            style={{ backgroundColor: ambientPalette.hex, boxShadow: `0 0 6px ${ambientPalette.hex}` }} 
                          />
                        </div>
                      </div>

                      {/* Progress Bar with Interactive Click-to-Seek */}
                      <div className="mt-1 mb-0.5">
                        <div 
                          onClick={handleSeek}
                          className="group relative w-full bg-neutral-800/80 hover:bg-neutral-700/80 h-1.5 rounded-full overflow-hidden cursor-pointer transition-all"
                          title="Click to Seek Track"
                        >
                          <div 
                            className="h-full rounded-full transition-all duration-300 relative"
                            style={{ 
                              width: `${Math.min(100, Math.max(0, (trackPosition / (trackData.duration || 200)) * 100))}%`,
                              backgroundColor: ambientPalette.hex,
                              boxShadow: `0 0 10px ${ambientPalette.hex}`
                            }}
                          />
                        </div>

                        {/* Time Indicators */}
                        <div className="flex items-center justify-between text-[8.5px] font-mono text-neutral-400 mt-0.5">
                          <span>{formatTime(trackPosition)}</span>
                          <span className="text-[7.5px] text-neutral-500 uppercase tracking-wider font-semibold">
                            {isPlaying ? 'Streaming HD' : 'Paused'}
                          </span>
                          <span>{formatTime(trackData.duration || 200)}</span>
                        </div>
                      </div>

                      {/* Playback Controls Deck */}
                      <div className="flex items-center justify-between pt-1 px-1">
                        
                        {/* Shuffle Button */}
                        <button
                          type="button"
                          onClick={() => setIsShuffle(!isShuffle)}
                          title={isShuffle ? 'Shuffle Active' : 'Shuffle Off'}
                          className="relative p-1.5 rounded-full hover:bg-white/10 active:scale-90 transition-all cursor-pointer group"
                          style={{ color: isShuffle ? ambientPalette.hex : '#9ca3af' }}
                        >
                          <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="16 3 21 3 21 8" />
                            <line x1="4" y1="20" x2="21" y2="3" />
                            <polyline points="21 16 21 21 16 21" />
                            <line x1="15" y1="15" x2="21" y2="21" />
                            <line x1="4" y1="4" x2="9" y2="9" />
                          </svg>
                          {isShuffle && (
                            <span 
                              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{ backgroundColor: ambientPalette.hex, boxShadow: `0 0 4px ${ambientPalette.hex}` }}
                            />
                          )}
                        </button>

                        {/* Prev Track */}
                        <button
                          type="button"
                          onClick={handlePrevTrack}
                          title="Previous Track"
                          className="p-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer group"
                        >
                          <svg className="w-4 h-4 transition-transform group-hover:-translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <rect x="4" y="5" width="2.5" height="14" rx="1.25" />
                            <path d="M19 6.27a1 1 0 0 0-1.55-.83L8.8 11.17a1 1 0 0 0 0 1.66l8.65 5.73A1 1 0 0 0 19 17.73V6.27z" />
                          </svg>
                        </button>

                        {/* Main Play / Pause Button with Ambient Halo */}
                        <button
                          type="button"
                          onClick={handlePlayPause}
                          title={isPlaying ? 'Pause' : 'Play'}
                          className="w-8 h-8 rounded-full bg-white text-black flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-xl cursor-pointer relative group"
                          style={{
                            boxShadow: isPlaying 
                              ? `0 0 18px ${ambientPalette.hex}95, 0 0 6px ${ambientPalette.hex}, 0 2px 8px rgba(0,0,0,0.6)` 
                              : '0 2px 10px rgba(0,0,0,0.5)'
                          }}
                        >
                          {isPlaying ? (
                            <svg className="w-3.5 h-3.5 fill-neutral-900 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                              <rect x="6" y="5" width="3.5" height="14" rx="1.5" />
                              <rect x="14.5" y="5" width="3.5" height="14" rx="1.5" />
                            </svg>
                          ) : (
                            <svg className="w-3.5 h-3.5 fill-neutral-900 translate-x-0.5 transition-transform group-hover:scale-110" viewBox="0 0 24 24">
                              <path d="M7 5.25a1.25 1.25 0 0 1 1.93-1.05l10.5 6.75a1.25 1.25 0 0 1 0 2.1l-10.5 6.75A1.25 1.25 0 0 1 7 18.75V5.25z" />
                            </svg>
                          )}
                        </button>

                        {/* Next Track */}
                        <button
                          type="button"
                          onClick={handleNextTrack}
                          title="Next Track"
                          className="p-1.5 rounded-full text-neutral-300 hover:text-white hover:bg-white/10 active:scale-90 transition-all cursor-pointer group"
                        >
                          <svg className="w-4 h-4 transition-transform group-hover:translate-x-0.5" viewBox="0 0 24 24" fill="currentColor">
                            <path d="M5 6.27a1 1 0 0 1 1.55-.83l8.65 5.73a1 1 0 0 1 0 1.66L6.55 18.56A1 1 0 0 1 5 17.73V6.27z" />
                            <rect x="17.5" y="5" width="2.5" height="14" rx="1.25" />
                          </svg>
                        </button>

                        {/* Repeat Button */}
                        <button
                          type="button"
                          onClick={() => setIsRepeat(!isRepeat)}
                          title={isRepeat ? 'Repeat Active' : 'Repeat Off'}
                          className="relative p-1.5 rounded-full hover:bg-white/10 active:scale-90 transition-all cursor-pointer group"
                          style={{ color: isRepeat ? ambientPalette.hex : '#9ca3af' }}
                        >
                          <svg className="w-3.5 h-3.5 transition-transform group-hover:scale-110" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="17 1 21 5 17 9" />
                            <path d="M3 11V9a4 4 0 0 1 4-4h14" />
                            <polyline points="7 23 3 19 7 15" />
                            <path d="M21 13v2a4 4 0 0 1-4 4H3" />
                          </svg>
                          {isRepeat && (
                            <span 
                              className="absolute -bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                              style={{ backgroundColor: ambientPalette.hex, boxShadow: `0 0 4px ${ambientPalette.hex}` }}
                            />
                          )}
                        </button>

                      </div>

                    </div>

                  </div>
                )}

              </div>
            )}

            {/* 5. REDESIGNED HIGH-TECH FOCUS & POMODORO PRODUCTIVITY SUITE */}
            {activeTab === 'focus' && (
              <div className="relative flex items-center justify-between h-full p-2.5 rounded-2xl bg-[#0e0e12]/95 border border-neutral-800/80 animate-fadeIn select-none overflow-hidden gap-3.5">
                
                {/* Ambient Focus Glow Backdrop */}
                <div 
                  className="absolute -top-10 -left-10 w-44 h-44 rounded-full pointer-events-none blur-3xl opacity-30 transition-all duration-700"
                  style={{ backgroundColor: focusPhase === 'work' ? '#f59e0b' : '#10b981' }}
                />

                {/* LEFT COLUMN: CIRCULAR RADIAL TIMER RING + STAGE SWITCHER */}
                <div className="flex flex-col items-center justify-between h-full w-[165px] flex-shrink-0 py-0.5">
                  
                  {/* Radial SVG Progress Ring */}
                  <div className="relative w-28 h-28 flex items-center justify-center">
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
                      <span className="text-[10px] text-neutral-400 font-medium flex items-center gap-1">
                        <span>{focusPhase === 'work' ? '🎯' : focusPhase === 'shortBreak' ? '☕' : '🌴'}</span>
                        <span className="text-[9px] uppercase tracking-wider font-mono font-bold" style={{ color: focusPhase === 'work' ? '#f59e0b' : '#10b981' }}>
                          {focusPhase === 'work' ? 'WORK' : focusPhase === 'shortBreak' ? 'SHORT' : 'LONG'}
                        </span>
                      </span>
                      <span className="text-xl font-mono font-black tracking-tight text-white drop-shadow-sm mt-0.5">
                        {formatTime(focusSecondsLeft)}
                      </span>
                      {/* Cycle dots: 4 pips */}
                      <div className="flex items-center gap-1 mt-1">
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
                  <div className="flex items-center gap-1 w-full justify-center pt-1">
                    <button
                      type="button"
                      onClick={() => handleSelectPhase('work')}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all ${
                        focusPhase === 'work'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/50 shadow-[0_0_8px_rgba(245,158,11,0.25)]'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      🎯 Work
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPhase('shortBreak')}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all ${
                        focusPhase === 'shortBreak'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/50 shadow-[0_0_8px_rgba(16,185,129,0.25)]'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      ☕ Break
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSelectPhase('longBreak')}
                      className={`px-2 py-0.5 rounded-full text-[9px] font-medium transition-all ${
                        focusPhase === 'longBreak'
                          ? 'bg-teal-500/20 text-teal-300 border border-teal-500/50 shadow-[0_0_8px_rgba(20,184,166,0.25)]'
                          : 'bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-800'
                      }`}
                    >
                      🌴 Long
                    </button>
                  </div>

                </div>

                {/* RIGHT COLUMN: TASK INPUT + CONTROLS + PRESETS + STATS */}
                <div className="flex-1 flex flex-col justify-between h-full pl-1">
                  
                  {/* 1. Task Name Input + Quick Presets */}
                  <div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 pb-1">
                      <span className="font-semibold text-neutral-200 flex items-center gap-1">
                        <span style={{ color: focusPhase === 'work' ? '#f59e0b' : '#10b981' }}>●</span>
                        <span>CURRENT TARGET</span>
                      </span>
                      <span className="text-[9px] font-mono text-neutral-400">
                        Cycle {focusCycle} of 4
                      </span>
                    </div>
                    
                    <input
                      type="text"
                      value={focusTaskName}
                      onChange={(e) => setFocusTaskName(e.target.value)}
                      placeholder="What are you focusing on?"
                      onFocus={() => onInputFocusChange?.(true)}
                      onBlur={() => onInputFocusChange?.(false)}
                      className="w-full bg-[#16161a] border border-neutral-800 focus:border-amber-500/60 rounded-xl px-2.5 py-1 text-xs text-white placeholder-neutral-500 outline-none transition-colors"
                    />

                    {/* Quick Tag Presets */}
                    <div className="flex items-center gap-1.5 mt-1.5 overflow-x-auto pb-0.5" style={{ scrollbarWidth: 'none' }}>
                      {[
                        { label: '💻 Coding', text: 'Coding Sprint' },
                        { label: '📝 Writing', text: 'Deep Writing' },
                        { label: '📚 Study', text: 'Study Session' },
                        { label: '🎨 Design', text: 'UI/UX Design' },
                        { label: '⚡ Sprint', text: 'Rapid Sprint' },
                      ].map((tag) => (
                        <button
                          key={tag.label}
                          type="button"
                          onClick={() => setFocusTaskName(tag.text)}
                          className="px-2 py-0.5 rounded-md bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 hover:border-neutral-700 text-[9px] text-neutral-300 hover:text-white transition-all whitespace-nowrap active:scale-95 cursor-pointer"
                        >
                          {tag.label}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* 2. Main Play / Pause & Action Controls Deck */}
                  <div className="flex items-center gap-2 py-1">
                    {/* Big Glow Start / Pause Button */}
                    <button
                      type="button"
                      onClick={handleToggleFocus}
                      className={`flex-1 py-1.5 px-3 rounded-xl font-bold text-xs flex items-center justify-center gap-1.5 transition-all active:scale-95 shadow-md cursor-pointer ${
                        isFocusRunning
                          ? 'bg-amber-500 text-black hover:bg-amber-400 shadow-[0_0_18px_rgba(245,158,11,0.5)]'
                          : 'bg-white text-black hover:bg-neutral-200 shadow-[0_0_15px_rgba(255,255,255,0.4)]'
                      }`}
                    >
                      {isFocusRunning ? (
                        <>
                          <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                            <rect x="6" y="5" width="4" height="14" rx="1.5" />
                            <rect x="14" y="5" width="4" height="14" rx="1.5" />
                          </svg>
                          <span>Pause Focus</span>
                        </>
                      ) : (
                        <>
                          <svg className="w-3.5 h-3.5 fill-current translate-x-0.5" viewBox="0 0 24 24">
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
                      className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
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
                      className="p-2 rounded-xl bg-neutral-900/90 hover:bg-neutral-800 border border-neutral-800 text-neutral-300 hover:text-white transition-all active:scale-95 cursor-pointer"
                    >
                      <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
                        <polyline points="1 4 1 10 7 10" />
                        <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
                      </svg>
                    </button>
                  </div>

                  {/* 3. Duration Presets & Audio Chime Toggle */}
                  <div className="flex items-center justify-between pt-1 border-t border-neutral-800/80 text-[9px]">
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
                        className={`p-1 rounded text-[10px] transition-colors cursor-pointer ${
                          isChimeEnabled ? 'text-amber-400' : 'text-neutral-600'
                        }`}
                      >
                        {isChimeEnabled ? '🔔' : '🔕'}
                      </button>

                      <span className="font-mono text-[9px] text-neutral-400 flex items-center gap-1">
                        <span className="text-amber-400">🔥</span>
                        <span>{completedSessionsToday} done</span>
                      </span>
                    </div>
                  </div>

                </div>

              </div>
            )}

            {/* 6. SMART REAL-TIME CLIPBOARD TAB */}
            {activeTab === 'clipboard' && (
              <div className="flex flex-col h-full overflow-hidden select-none">
                {/* Header with Live Sync & Clear Action */}
                <div className="flex items-center justify-between px-1 pb-1.5 border-b border-neutral-800/80 mb-2 flex-shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] font-bold text-neutral-200 tracking-wide flex items-center gap-1.5">
                      <span className="text-emerald-400">📋</span>
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
                    <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-emerald-500/20 to-teal-500/10 border border-emerald-500/30 flex items-center justify-center text-lg mb-2 shadow-[0_0_16px_rgba(16,185,129,0.15)]">
                      📋
                    </div>
                    <div className="text-xs font-semibold text-neutral-200 mb-0.5">
                      Clipboard is Empty
                    </div>
                    <div className="text-[10px] text-neutral-400 max-w-[280px] leading-relaxed mb-2.5">
                      Copy anything with <kbd className="px-1.5 py-0.5 rounded bg-neutral-800 border border-neutral-700 text-neutral-300 font-mono text-[9px]">Ctrl + C</kbd> anywhere on your PC to auto-capture here.
                    </div>
                    <div className="flex flex-wrap items-center justify-center gap-1.5">
                      <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-neutral-400">
                        ⚡ Real-Time Capture
                      </span>
                      <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-neutral-400">
                        🔟 Holds 10 Recent
                      </span>
                      <span className="text-[8.5px] font-mono px-2 py-0.5 rounded-md bg-neutral-900/90 border border-neutral-800 text-neutral-400">
                        👆 1-Click Copy
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
                          className={`group relative p-2 rounded-xl transition-all duration-200 cursor-pointer border ${
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
                                  ✓ Copied!
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
              <div className="flex flex-col h-full overflow-hidden select-none">
                {/* Top Header: Slots & Auto-save Status */}
                <div className="flex items-center justify-between px-1 pb-1.5 border-b border-neutral-800/80 mb-1.5 flex-shrink-0">
                  {/* Left: Slot Tabs */}
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold text-neutral-300 tracking-wide flex items-center gap-1 mr-1">
                      <span>📝</span>
                      <span className="hidden sm:inline">SCRATCHPAD</span>
                    </span>

                    {[
                      { id: 'general', label: 'General', icon: '📝' },
                      { id: 'todo', label: 'Tasks', icon: '🎯' },
                      { id: 'scratch', label: 'Snippets', icon: '💡' },
                    ].map((slot) => {
                      const isActive = activeNoteSlot === slot.id;
                      const hasText = !!(scratchNotesBySlot[slot.id] && scratchNotesBySlot[slot.id].trim());
                      return (
                        <button
                          key={slot.id}
                          type="button"
                          onClick={() => setActiveNoteSlot(slot.id)}
                          className={`px-2 py-0.5 rounded-lg text-[9.5px] font-mono transition-all flex items-center gap-1 cursor-pointer active:scale-95 ${
                            isActive
                              ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/40 font-bold shadow-[0_0_8px_rgba(16,185,129,0.2)]'
                              : 'bg-neutral-900/80 text-neutral-400 hover:text-white border border-neutral-800'
                          }`}
                        >
                          <span>{slot.icon}</span>
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
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-300 hover:text-white border border-neutral-800 transition-colors cursor-pointer active:scale-95"
                      title="Insert current timestamp"
                    >
                      🕒 Time
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
                      <span>{scratchCopied ? '✓' : '📋'}</span>
                      <span>{scratchCopied ? 'Copied' : 'Copy'}</span>
                    </button>

                    {/* Export */}
                    <button
                      type="button"
                      onClick={handleExportScratch}
                      disabled={!currentNoteText}
                      className="px-1.5 py-0.5 rounded bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white border border-neutral-800 transition-colors cursor-pointer active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
                      title="Download as .txt"
                    >
                      📥
                    </button>

                    {/* Clear Slot */}
                    <button
                      type="button"
                      onClick={handleClearScratch}
                      disabled={!currentNoteText}
                      className={`px-1.5 py-0.5 rounded transition-all cursor-pointer active:scale-95 border ${
                        confirmClearSlot
                          ? 'bg-rose-500 text-white border-rose-400 font-bold'
                          : 'bg-neutral-900 hover:bg-rose-500/15 text-neutral-400 hover:text-rose-400 border-neutral-800 disabled:opacity-40 disabled:cursor-not-allowed'
                      }`}
                      title={confirmClearSlot ? 'Click again to confirm clear' : 'Clear this note'}
                    >
                      {confirmClearSlot ? 'Confirm?' : '🗑️'}
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

          </div>

          {/* ======================================================== */}
          {/* BOTTOM DOCK (Zero Jitter, Perfectly Sized & Clickable)   */}
          {/* ======================================================== */}
          <div className="flex-shrink-0 w-full pt-1.5 relative z-10 select-none">
            <div className="w-full flex items-center justify-between px-3 py-1 rounded-full bg-[#131316] border border-[#222226] shadow-lg">
              
              <div className="flex items-center justify-between flex-1 pr-2 gap-1">
                {/* 1. Home */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('home'); setAiResponseCard(null); }}
                  title="Home Cockpit & Telemetry"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                    activeTab === 'home'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
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
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                    activeTab === 'features'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
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
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center ${
                    activeTab === 'music'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
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
                  className={`px-3 py-1 rounded-full flex items-center gap-1.5 text-xs font-medium transition-all cursor-pointer active:scale-95 ${
                    activeTab === 'ai'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'bg-neutral-900/80 border border-neutral-800 text-neutral-400 hover:text-white hover:border-neutral-700'
                  }`}
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
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center relative ${
                    activeTab === 'focus'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <circle cx="12" cy="12" r="10" />
                    <polyline points="12 6 12 12 16 14" />
                  </svg>
                  {isFocusRunning && (
                    <span 
                      className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full animate-pulse shadow-sm"
                      style={{ 
                        backgroundColor: focusPhase === 'work' ? '#f59e0b' : '#10b981',
                        boxShadow: `0 0 6px ${focusPhase === 'work' ? '#f59e0b' : '#10b981'}`
                      }}
                    />
                  )}
                </button>

                {/* 6. Staging Shelf */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('shelf'); setAiResponseCard(null); }}
                  title="Staging Shelf"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center relative ${
                    activeTab === 'shelf'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <polyline points="22 12 16 12 14 15 10 15 8 12 2 12" />
                    <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z" />
                  </svg>
                  {stagedFiles.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-indigo-500 text-[7px] font-bold text-white flex items-center justify-center pointer-events-none shadow-sm">
                      {stagedFiles.length}
                    </span>
                  )}
                </button>

                {/* 7. Clipboard */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('clipboard'); setAiResponseCard(null); }}
                  title="Clipboard History"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center relative ${
                    activeTab === 'clipboard'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2" />
                    <rect x="8" y="2" width="8" height="4" rx="1" ry="1" />
                  </svg>
                  {clipboardItems.length > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-500 text-[7px] font-bold text-black flex items-center justify-center pointer-events-none shadow-sm">
                      {clipboardItems.length}
                    </span>
                  )}
                </button>

                {/* 8. Notes */}
                <button
                  type="button"
                  onClick={() => { setActiveTab('notes'); setAiResponseCard(null); }}
                  title="Scratchpad & Notes"
                  className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 flex items-center justify-center relative ${
                    activeTab === 'notes'
                      ? 'bg-[#0e3b24] border border-[#1b6b3e] text-[#4ade80] shadow-[0_0_10px_rgba(74,222,128,0.3)]'
                      : 'text-neutral-400 hover:text-white hover:bg-neutral-800/60 border border-transparent'
                  }`}
                >
                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                    <polyline points="14 2 14 8 20 8" />
                    <line x1="16" y1="13" x2="8" y2="13" />
                    <line x1="16" y1="17" x2="8" y2="17" />
                  </svg>
                  {totalNotesLength > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_rgba(52,211,153,0.8)] pointer-events-none" />
                  )}
                </button>
              </div>

              {/* Vertical Divider */}
              <div className="h-4 w-px bg-neutral-800/90 flex-shrink-0" />

              {/* Far Right: Volume / Sound Mute Button */}
              <button
                type="button"
                onClick={() => setIsSoundMuted(!isSoundMuted)}
                title={isSoundMuted ? 'Sound Effects Muted (Click to Unmute)' : 'Sound Effects Active (Click to Mute)'}
                className={`p-1.5 rounded-xl transition-all cursor-pointer active:scale-95 ml-1.5 flex items-center justify-center ${
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
          </>
          )}

        </div>
      )}
    </div>
  );
}
