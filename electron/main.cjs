const { app, BrowserWindow, screen, ipcMain, desktopCapturer, shell, nativeImage, clipboard } = require('electron');
const { exec, execFile } = require('child_process');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');
const dns = require('dns');

// Enforce single instance to prevent orphan background processes & lock contention
const gotSingleInstanceLock = app.requestSingleInstanceLock();
if (!gotSingleInstanceLock) {
  app.quit();
  process.exit(0);
}

// Force IPv4-first DNS resolution to eliminate Windows IPv6 'fetch failed' errors
try {
  if (dns && dns.setDefaultResultOrder) {
    dns.setDefaultResultOrder('ipv4first');
  }
} catch (_) {}

// Disable hardware acceleration to eliminate Windows GPU host crashes on transparent overlays
app.disableHardwareAcceleration();

// Set clean, explicit user data directory to avoid space-in-path and cache locking issues
try {
  const cleanUserData = path.join(app.getPath('appData'), 'eyeland-runtime');
  if (!fs.existsSync(cleanUserData)) {
    fs.mkdirSync(cleanUserData, { recursive: true });
  }
  app.setPath('userData', cleanUserData);
} catch (e) {
  // ignore
}

const { getWifiData, getBluetoothData, getBatteryData, getCameraAndMicUsage, getFullTelemetry } = require('./systemInfo.cjs');
const { getLiveMedia, onMediaChange, sendMediaControl, searchTrackMetadata, getSongLyrics, stopMediaDaemon } = require('./mediaService.cjs');
const { onHardwareHud, setVolume, setMute, setBrightness, getHardwareState, stopHardwareDaemon } = require('./hardwareService.cjs');
const geminiService = require('./geminiService.cjs');
const { autoUpdater } = require('electron-updater');

let mainWindow;
let dashboardWindow = null;
let snipperWindow = null;
let cursorPollInterval = null;
let telemetryInterval = null;
let privacyPollInterval = null;
let mediaPollInterval = null;
let clipboardPollInterval = null;
let gameModePollInterval = null;
let isHiddenByGameMode = false;
let lastClipboardText = '';
let lastClearedClipboardText = '';
let lastPrivacyState = { micInUse: false, camInUse: false };

const crypto = require('crypto');

const DEFAULT_GENERAL_SETTINGS = {
  language: 'en',
  speed: 'fast',
  performance: 'smooth',
  gameMode: false,
  startWithWindows: true,
  anonymousStats: true,
};
let generalSettings = { ...DEFAULT_GENERAL_SETTINGS };

function getGeneralSettingsPath() {
  return path.join(app.getPath('userData'), 'general_settings.json');
}

function loadGeneralSettings() {
  try {
    const filePath = getGeneralSettingsPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8').trim();
      if (raw) {
        generalSettings = { ...DEFAULT_GENERAL_SETTINGS, ...JSON.parse(raw) };
      }
    }
  } catch (err) {
    console.warn('[main] loadGeneralSettings error:', err.message);
  }
  return generalSettings;
}

function applyLoginItemSetting() {
  try {
    app.setLoginItemSettings({
      openAtLogin: Boolean(generalSettings.startWithWindows),
      path: process.execPath,
      args: ['--autostart'],
    });
  } catch (err) {
    console.warn('LoginItemSettings could not be updated:', err);
  }
}

function saveGeneralSettingsToDisk(next) {
  const merged = { ...DEFAULT_GENERAL_SETTINGS, ...generalSettings, ...(next || {}) };
  if (merged.anonymousStats) {
    if (!merged.anonymousId) {
      merged.anonymousId = crypto.randomUUID ? crypto.randomUUID() : crypto.randomBytes(16).toString('hex');
    }
  } else {
    delete merged.anonymousId;
  }
  generalSettings = merged;
  try {
    fs.writeFileSync(getGeneralSettingsPath(), JSON.stringify(generalSettings, null, 2), 'utf8');
  } catch (err) {
    console.warn('[main] saveGeneralSettings error:', err.message);
  }
  applyLoginItemSetting();
  return generalSettings;
}

const DEFAULT_ISLAND_DISPLAY = {
  size: 'normal',
  style: 'attached',
  material: 'black',
  seeThrough: 0,
  glassColor: 'auto',
  musicColor: true,
  openMode: 'hover',
  screenId: 'main',
  showLyrics: true,
  wordByWord: false,
  showVolumeBar: true,
};
let islandDisplaySettings = { ...DEFAULT_ISLAND_DISPLAY };

function getIslandDisplayPath() {
  return path.join(app.getPath('userData'), 'island_display.json');
}

function loadIslandDisplaySettings() {
  try {
    const filePath = getIslandDisplayPath();
    if (fs.existsSync(filePath)) {
      const raw = fs.readFileSync(filePath, 'utf8').trim();
      if (raw) {
        islandDisplaySettings = { ...DEFAULT_ISLAND_DISPLAY, ...JSON.parse(raw) };
      }
    }
  } catch (err) {
    console.warn('[main] loadIslandDisplaySettings error:', err.message);
  }
  return islandDisplaySettings;
}

function saveIslandDisplaySettingsToDisk(next) {
  islandDisplaySettings = { ...DEFAULT_ISLAND_DISPLAY, ...islandDisplaySettings, ...(next || {}) };
  try {
    fs.writeFileSync(getIslandDisplayPath(), JSON.stringify(islandDisplaySettings, null, 2), 'utf8');
  } catch (err) {
    console.warn('[main] saveIslandDisplaySettings error:', err.message);
  }
  return islandDisplaySettings;
}

function getDisplaysList() {
  const primary = screen.getPrimaryDisplay();
  const displays = screen.getAllDisplays();
  return displays.map((d, idx) => ({
    id: String(d.id),
    index: idx + 1,
    isPrimary: d.id === primary.id,
    width: d.bounds.width,
    height: d.bounds.height,
    label: `Screen ${idx + 1}${d.id === primary.id ? ' (main)' : ''} • ${d.bounds.width}×${d.bounds.height}`,
  }));
}

function positionIslandOnDisplay(screenId = 'main') {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  const primary = screen.getPrimaryDisplay();
  const displays = screen.getAllDisplays();
  const target =
    screenId && screenId !== 'main'
      ? displays.find((d) => String(d.id) === String(screenId)) || primary
      : primary;
  const windowWidth = 580;
  const windowHeight = 360;
  const x = Math.round(target.bounds.x + (target.bounds.width - windowWidth) / 2);
  const y = target.bounds.y;
  mainWindow.setBounds({ x, y, width: windowWidth, height: windowHeight });
}

function resolveFullscreenBinary() {
  const normalPath = path.join(__dirname, 'fullscreenCheck.exe');
  const unpackedPath = normalPath.replace('app.asar', 'app.asar.unpacked');
  if (fs.existsSync(unpackedPath)) return unpackedPath;
  return normalPath;
}
let snipperActiveDisplay = null;

// Universal Broadcast Helper (Sends IPC events to Island and Hub windows simultaneously)
function broadcast(channel, data) {
  if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isCrashed()) {
    try { mainWindow.webContents.send(channel, data); } catch (_) {}
  }
  if (dashboardWindow && !dashboardWindow.isDestroyed() && !dashboardWindow.webContents.isCrashed()) {
    try { dashboardWindow.webContents.send(channel, data); } catch (_) {}
  }
}

// Multi-Display Source Resolver for desktopCapturer on Windows
function getSourceForDisplay(sources, display) {
  if (!sources || sources.length === 0) return null;
  if (sources.length === 1) return sources[0];

  const allDisplays = screen.getAllDisplays();
  const displayIndex = allDisplays.findIndex((d) => d.id === display.id);

  if (displayIndex >= 0) {
    const byId = sources.find((s) => s.id === `screen:${displayIndex}:0` || s.name === `Screen ${displayIndex + 1}`);
    if (byId) return byId;
    if (sources[displayIndex]) return sources[displayIndex];
  }

  const byDisplayId = sources.find((s) => s.display_id && String(s.display_id) === String(display.id));
  if (byDisplayId) return byDisplayId;

  return sources[0];
}

async function startSnippingSession(toolName = 'explain') {
  if (snipperWindow && !snipperWindow.isDestroyed()) {
    snipperWindow.focus();
    return { success: true };
  }

  // 1. Target the EXACT display where the user's cursor is currently active
  const cursorPoint = screen.getCursorScreenPoint();
  const targetDisplay = screen.getDisplayNearestPoint(cursorPoint);
  snipperActiveDisplay = targetDisplay;

  const { x, y, width, height } = targetDisplay.bounds;
  const scaleFactor = targetDisplay.scaleFactor || 1;

  // Notify the Dynamic Island that snipping mode is active and hide mainWindow
  // so the user's entire screen is 100% uncovered and visible with zero obstruction
  broadcast('snipper-status', { active: true, toolName });
  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }

  // 2. Open snipperWindow IMMEDIATELY with top priority
  snipperWindow = new BrowserWindow({
    x: x,
    y: y,
    width: width,
    height: height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreen: false,
    resizable: false,
    movable: false,
    enableLargerThanScreen: true,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'snipperPreload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  snipperWindow.setAlwaysOnTop(true, 'screen-saver', 2);
  snipperWindow.setBounds({ x, y, width, height });

  const snipperHtmlPath = path.join(__dirname, 'snipper.html');
  snipperWindow.loadFile(snipperHtmlPath);

  snipperWindow.webContents.once('did-finish-load', () => {
    if (snipperWindow && !snipperWindow.isDestroyed()) {
      snipperWindow.show();
      snipperWindow.focus();
      snipperWindow.webContents.send('init-snipper', {
        toolName,
        width,
        height,
        scaleFactor,
      });
    }
  });

  snipperWindow.on('closed', () => {
    snipperWindow = null;
    broadcast('snipper-status', { active: false });
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (!mainWindow.isVisible()) {
        mainWindow.show();
      }
      mainWindow.focus();
    }
  });

  return { success: true };
}

async function broadcastLiveMedia() {
  try {
    const media = await getLiveMedia();
    if (media) {
      broadcast('media-update', media);
    }
  } catch (err) {
    // ignore
  }
}

// Universal PnP Peripheral Scanner (Wired USB mice, keyboards, webcams, audio, controllers, and Bluetooth)
let lastKnownPeripherals = new Set();
let missingPeripheralCounts = new Map();
let baselineScanCount = 0;
const appLaunchTimestamp = Date.now();
let isPeripheralScanRunning = false;

function scanAllPeripherals() {
  return new Promise((resolve) => {
    const normalPath = path.join(__dirname, 'getPeripherals.ps1');
    const unpackedPath = normalPath.replace('app.asar', 'app.asar.unpacked');
    const psPath = fs.existsSync(unpackedPath) ? unpackedPath : normalPath;

    execFile('powershell.exe', ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psPath], { timeout: 10000, windowsHide: true }, (err, stdout) => {
      if (err || !stdout || !stdout.trim()) return resolve(null);
      try {
        const raw = JSON.parse(stdout.trim());
        const arr = Array.isArray(raw) ? raw : [raw];
        const result = [];
        const seenNames = new Set();
        const seenVids = new Set();

        // Pass 1: Extract branded / named peripherals
        for (const item of arr) {
          const name = (item.FriendlyName || '').trim().replace(/tr.ke/i, 'trüke');
          const pnpClass = (item.Class || '').toLowerCase();
          const instanceId = (item.InstanceId || '').toUpperCase();
          if (!name) continue;

          const vidMatch = instanceId.match(/VID_[0-9A-F]{4}&PID_[0-9A-F]{4}/i);
          const vidKey = vidMatch ? vidMatch[0].toUpperCase() : null;

          if (/^HID[- ](compliant|keyboard|vendor-defined|system|consumer|device)/i.test(name)) continue;

          let type = 'peripheral';
          if (pnpClass === 'mouse' || /mouse|cobra|deathadder|viper|basilisk|g502|g305|g_pro|rival/i.test(name)) type = 'mouse';
          else if (pnpClass === 'keyboard' || /keyboard|keychron|huntsman|blackwidow|apex/i.test(name)) type = 'keyboard';
          else if (/buds|airpod|headphone|wh-|ear|audio|airdopes|immortal|neo|btg|tws|soundcore/i.test(name) || pnpClass === 'media') type = 'headphones';
          else if (/gamepad|ranger|controller|joystick|xbox|dualsense/i.test(name)) type = 'gamepad';
          else if (/camera|webcam/i.test(name) || pnpClass === 'camera' || pnpClass === 'image') type = 'camera';
          else if (/speaker/i.test(name)) type = 'speaker';
          else if (/disk|drive|usb|flash|sandisk|cruzer|kingston/i.test(name) || pnpClass === 'diskdrive') type = 'usb';
          else if (pnpClass === 'bluetooth') type = 'bluetooth';

          if (!seenNames.has(name)) {
            seenNames.add(name);
            if (vidKey) seenVids.add(vidKey);
            result.push({
              name,
              type,
              battery: type === 'headphones' ? 85 : null,
              id: instanceId,
            });
          }
        }

        // Pass 2: Fallback for generic USB peripherals not claimed by branded names
        for (const item of arr) {
          const name = (item.FriendlyName || '').trim();
          const pnpClass = (item.Class || '').toLowerCase();
          const instanceId = (item.InstanceId || '').toUpperCase();
          if (!name) continue;

          const vidMatch = instanceId.match(/VID_[0-9A-F]{4}&PID_[0-9A-F]{4}/i);
          const vidKey = vidMatch ? vidMatch[0].toUpperCase() : null;
          if (vidKey && seenVids.has(vidKey)) continue;

          if ((pnpClass === 'mouse' || /mouse/i.test(name)) && vidKey) {
            const devName = 'Wired Mouse';
            if (!seenNames.has(devName)) {
              seenNames.add(devName);
              seenVids.add(vidKey);
              result.push({ name: devName, type: 'mouse', battery: null, id: instanceId });
            }
          } else if ((pnpClass === 'keyboard' || /keyboard/i.test(name)) && vidKey) {
            const devName = 'Wired Keyboard';
            if (!seenNames.has(devName)) {
              seenNames.add(devName);
              seenVids.add(vidKey);
              result.push({ name: devName, type: 'keyboard', battery: null, id: instanceId });
            }
          } else if ((pnpClass === 'diskdrive' || /disk|drive|flash|storage/i.test(name)) && vidKey) {
            const devName = 'USB Drive';
            if (!seenNames.has(devName)) {
              seenNames.add(devName);
              seenVids.add(vidKey);
              result.push({ name: devName, type: 'usb', battery: null, id: instanceId });
            }
          }
        }

        resolve(result);
      } catch (_) {
        resolve(null);
      }
    });
  });
}

async function checkPeripheralConnections() {
  if (isPeripheralScanRunning || !mainWindow || mainWindow.isDestroyed()) return;
  isPeripheralScanRunning = true;
  try {
    const devices = await scanAllPeripherals();
    // Skip failed / timed-out scans completely so baseline is NEVER wiped!
    if (!Array.isArray(devices)) return;

    const currentDeviceMap = new Map();
    for (const d of devices) {
      currentDeviceMap.set(d.name, d);
    }

    const inStartupQuietWindow = baselineScanCount < 2 || Date.now() - appLaunchTimestamp < 12000;

    if (inStartupQuietWindow) {
      baselineScanCount++;
      for (const name of currentDeviceMap.keys()) {
        lastKnownPeripherals.add(name);
        missingPeripheralCounts.delete(name);
      }
      if (baselineScanCount === 1) {
        console.log('[main.cjs] Initial peripheral baseline established:', Array.from(lastKnownPeripherals));
      }
      return;
    }

    // Alert ONLY for genuinely newly plugged/connected devices not in baseline
    for (const [name, dev] of currentDeviceMap.entries()) {
      missingPeripheralCounts.delete(name);
      if (!lastKnownPeripherals.has(name)) {
        lastKnownPeripherals.add(name);
        console.log('[main.cjs] Device Connected Alert:', dev.name, dev.type);
        broadcast('device-connected', {
          name: dev.name,
          type: dev.type,
          battery: dev.battery,
        });
      }
    }

    // Require 2 consecutive missing scans before removing a device (prevents flaky PnP reconnect spam)
    for (const knownName of Array.from(lastKnownPeripherals)) {
      if (!currentDeviceMap.has(knownName)) {
        const misses = (missingPeripheralCounts.get(knownName) || 0) + 1;
        if (misses >= 2) {
          lastKnownPeripherals.delete(knownName);
          missingPeripheralCounts.delete(knownName);
        } else {
          missingPeripheralCounts.set(knownName, misses);
        }
      }
    }
  } catch (err) {
    console.warn('[checkPeripheralConnections] Error:', err.message);
  } finally {
    isPeripheralScanRunning = false;
  }
}

function createWindow() {
  const primaryDisplay = screen.getPrimaryDisplay();
  const { width: screenWidth } = primaryDisplay.workAreaSize;

  const windowWidth = 580;
  const windowHeight = 360;
  const windowX = Math.round((screenWidth - windowWidth) / 2);

  mainWindow = new BrowserWindow({
    width: windowWidth,
    height: windowHeight,
    x: windowX,
    y: 0, // Flush zero-gap docking with top screen bezel
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    hasShadow: false,
    skipTaskbar: true,
    resizable: false,
    focusable: true,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Always keep above normal apps
  mainWindow.setAlwaysOnTop(true, 'screen-saver');

  // Real-time Win32 hardware device arrival & removal listener (0x0219 = WM_DEVICECHANGE)
  let deviceChangeDebounce = null;
  mainWindow.hookWindowMessage(0x0219, (wParam, lParam) => {
    if (deviceChangeDebounce) clearTimeout(deviceChangeDebounce);
    deviceChangeDebounce = setTimeout(() => {
      checkPeripheralConnections();
      deviceChangeDebounce = null;
    }, 400);
  });

  const distPath = path.join(__dirname, '../dist/index.html');

  if (app.isPackaged) {
    mainWindow.loadFile(distPath);
  } else {
    // In dev mode, always load the live Vite dev server with retry
    const devUrl = 'http://localhost:5173';
    let retries = 15;
    const loadDev = () => {
      if (!mainWindow || mainWindow.isDestroyed()) return;
      mainWindow.loadURL(devUrl).catch(() => {
        if (retries > 0) {
          retries--;
          setTimeout(loadDev, 300);
        } else if (mainWindow && !mainWindow.isDestroyed()) {
          mainWindow.loadFile(distPath);
        }
      });
    };
    loadDev();
  }

  // Diagnostics: Catch renderer console output and load failures
  mainWindow.webContents.on('console-message', (event, level, message, line, sourceId) => {
    console.log(`[Renderer] [${level}] ${message} at ${sourceId}:${line}`);
  });

  mainWindow.webContents.on('render-process-gone', (event, details) => {
    console.error(`[Process Gone]`, details);
    if (cursorPollInterval) clearInterval(cursorPollInterval);
    if (telemetryInterval) clearInterval(telemetryInterval);
    if (privacyPollInterval) clearInterval(privacyPollInterval);
    if (clipboardPollInterval) clearInterval(clipboardPollInterval);
  });

  mainWindow.webContents.on('did-fail-load', (event, errorCode, errorDescription) => {
    console.error(`[Load Error] ${errorCode}: ${errorDescription}`);
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.loadFile(distPath);
    }
  });

  // Load persisted general & display settings before starting dynamic timers
  loadGeneralSettings();
  loadIslandDisplaySettings();
  positionIslandOnDisplay(islandDisplaySettings.screenId);

  // Global cursor tracking & system telemetry (dynamically scaled by Performance profile)
  let lastCursorX = -9999;
  let lastCursorY = -9999;

  const getPerfTimings = (perf) => {
    switch (perf) {
      case 'light':
        return { cursorMs: 65, telemetryMs: 5000 };
      case 'automatic':
        return { cursorMs: 25, telemetryMs: 3000 };
      case 'max':
        return { cursorMs: 8, telemetryMs: 1500 };
      case 'smooth':
      default:
        return { cursorMs: 16, telemetryMs: 2200 };
    }
  };

  const applyPerformanceTimers = () => {
    if (cursorPollInterval) clearInterval(cursorPollInterval);
    if (telemetryInterval) clearInterval(telemetryInterval);

    const { cursorMs, telemetryMs } = getPerfTimings(generalSettings.performance);

    cursorPollInterval = setInterval(() => {
      if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isCrashed() || isHiddenByGameMode) return;
      const cursorPos = screen.getCursorScreenPoint();

      // Skip IPC message & React re-render cycle if the mouse has not moved
      if (cursorPos.x === lastCursorX && cursorPos.y === lastCursorY) return;
      lastCursorX = cursorPos.x;
      lastCursorY = cursorPos.y;

      const bounds = mainWindow.getBounds();

      mainWindow.webContents.send('global-cursor', {
        cursorX: cursorPos.x,
        cursorY: cursorPos.y,
        windowX: bounds.x,
        windowY: bounds.y,
        windowWidth: bounds.width,
        windowHeight: bounds.height,
      });
    }, cursorMs);

    telemetryInterval = setInterval(async () => {
      if ((!mainWindow || mainWindow.isDestroyed()) && (!dashboardWindow || dashboardWindow.isDestroyed())) return;
      try {
        const telemetry = await getFullTelemetry();
        broadcast('telemetry-update', telemetry);

        // Periodic safety check for peripheral connections (supplements Win32 WM_DEVICECHANGE)
        checkPeripheralConnections();
      } catch (err) {
        // ignore
      }
    }, telemetryMs);
  };

  // Real Windows Game Mode watcher (hides Island during fullscreen games/videos, restores afterwards)
  let gameModeCheckInFlight = false;
  const applyGameModeWatcher = () => {
    if (gameModePollInterval) {
      clearInterval(gameModePollInterval);
      gameModePollInterval = null;
    }

    if (!generalSettings.gameMode) {
      if (isHiddenByGameMode && mainWindow && !mainWindow.isDestroyed()) {
        isHiddenByGameMode = false;
        mainWindow.showInactive();
      }
      return;
    }

    const fsBin = resolveFullscreenBinary();
    if (!fs.existsSync(fsBin)) return;

    gameModePollInterval = setInterval(() => {
      if (gameModeCheckInFlight || !mainWindow || mainWindow.isDestroyed() || snipperWindow) return;
      gameModeCheckInFlight = true;
      execFile(fsBin, [String(process.pid)], { windowsHide: true, timeout: 1200 }, (err, stdout) => {
        gameModeCheckInFlight = false;
        if (err || !mainWindow || mainWindow.isDestroyed()) return;
        const isFullscreen = String(stdout || '').trim() === '1';
        if (isFullscreen && !isHiddenByGameMode) {
          isHiddenByGameMode = true;
          mainWindow.hide();
        } else if (!isFullscreen && isHiddenByGameMode) {
          isHiddenByGameMode = false;
          mainWindow.showInactive();
        }
      });
    }, 1500);
  };

  applyPerformanceTimers();
  applyGameModeWatcher();

  // Fast Real-Time Privacy Monitor (Microphone & Camera, sub-second reactivity)
  privacyPollInterval = setInterval(async () => {
    if ((!mainWindow || mainWindow.isDestroyed()) && (!dashboardWindow || dashboardWindow.isDestroyed())) return;
    try {
      const privacy = await getCameraAndMicUsage();
      if (
        privacy.micInUse !== lastPrivacyState.micInUse ||
        privacy.camInUse !== lastPrivacyState.camInUse
      ) {
        lastPrivacyState = privacy;
        broadcast('telemetry-update', { privacy });
      }
    } catch (_) {}
  }, 1000);

  // Initialize clipboard tracking baseline
  try {
    lastClipboardText = clipboard.readText() || '';
  } catch (_) {}

  // Real-Time System Clipboard Monitor (detects Ctrl+C anywhere across Windows OS)
  clipboardPollInterval = setInterval(() => {
    if ((!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isCrashed()) &&
        (!dashboardWindow || dashboardWindow.isDestroyed() || dashboardWindow.webContents.isCrashed())) return;
    try {
      const currentText = clipboard.readText();
      if (
        typeof currentText === 'string' &&
        currentText.trim().length > 0 &&
        currentText !== lastClipboardText &&
        currentText !== lastClearedClipboardText
      ) {
        lastClearedClipboardText = '';
        lastClipboardText = currentText;
        broadcast('clipboard-copy', {
          text: currentText,
          timestamp: Date.now(),
        });
      }
    } catch (_) {}
  }, 500);

  // Real-Time Spotify Media Listener (Sub-20ms updates streamed from persistent daemon)
  const unsubscribeMedia = onMediaChange((media) => {
    if (media) {
      broadcast('media-update', media);
    }
  });

  // Prime initial peripheral baseline
  checkPeripheralConnections();

  // Real-Time Hardware Volume & Screen Brightness HUD Listener
  const unsubscribeHardware = onHardwareHud((hudData) => {
    if (hudData) {
      broadcast('hardware-hud', hudData);
    }
  });

  // Hardware Audio & Brightness Control IPC Handlers
  ipcMain.handle('get-hardware-state', () => {
    try {
      return getHardwareState();
    } catch {
      return { volume: 100, muted: false, brightness: 80, initialized: false };
    }
  });

  ipcMain.handle('set-hardware-volume', (event, val) => {
    return setVolume(val);
  });

  ipcMain.handle('set-hardware-mute', (event, muted) => {
    return setMute(muted);
  });

  ipcMain.handle('set-hardware-brightness', (event, val) => {
    return setBrightness(val);
  });

  // Dynamic click-through passthrough for transparent background areas
  ipcMain.on('set-ignore-mouse-events', (event, ignore) => {
    const win = BrowserWindow.fromWebContents(event.sender);
    if (win && !win.isDestroyed()) {
      win.setIgnoreMouseEvents(ignore, { forward: true });
    }
  });

  // Native Full-Screen Vision Capture for Eyeland AI
  ipcMain.handle('capture-screen', async () => {
    try {
      const sources = await desktopCapturer.getSources({
        types: ['screen'],
        thumbnailSize: { width: 1920, height: 1080 },
      });
      if (sources.length > 0) {
        return {
          success: true,
          dataUrl: sources[0].thumbnail.toDataURL(),
          name: sources[0].name,
        };
      }
      return { success: false, error: 'No screen source found' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Precision Screen Snipping Tool Handlers (+ Crosshair overlay)
  ipcMain.handle('start-snipping', async (event, toolName) => {
    try {
      return await startSnippingSession(toolName);
    } catch (err) {
      console.error('start-snipping error:', err);
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.show();
      }
      return { success: false, error: err.message };
    }
  });

  ipcMain.on('snipper-complete', async (event, result) => {
    if (snipperWindow && !snipperWindow.isDestroyed()) {
      snipperWindow.destroy();
      snipperWindow = null;
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('snipper-status', { active: false });
    }

    let finalDataUrl = result?.dataUrl;

    // If dataUrl is missing or empty, crop directly from desktopCapturer thumbnail
    if ((!finalDataUrl || finalDataUrl.length < 500) && result?.bounds && snipperActiveDisplay) {
      try {
        const bounds = result.bounds;
        const scale = snipperActiveDisplay.scaleFactor || 1;
        const targetX = Math.max(0, Math.round(bounds.x * scale));
        const targetY = Math.max(0, Math.round(bounds.y * scale));
        const targetW = Math.max(1, Math.round(bounds.width * scale));
        const targetH = Math.max(1, Math.round(bounds.height * scale));

        const sources = await desktopCapturer.getSources({
          types: ['screen'],
          thumbnailSize: {
            width: Math.round(snipperActiveDisplay.bounds.width * scale),
            height: Math.round(snipperActiveDisplay.bounds.height * scale),
          },
        });
        if (sources.length > 0) {
          const targetSource = getSourceForDisplay(sources, snipperActiveDisplay);
          if (targetSource && !targetSource.thumbnail.isEmpty()) {
            const cropped = targetSource.thumbnail.crop({ x: targetX, y: targetY, width: targetW, height: targetH });
            if (!cropped.isEmpty()) {
              finalDataUrl = cropped.toDataURL();
            }
          }
        }
      } catch (err) {
        console.warn('[main.cjs] Snipper fallback crop failed:', err.message);
      }
    }

    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.focus();
    }
    broadcast('snipped-result', {
      success: true,
      dataUrl: finalDataUrl,
      bounds: result?.bounds,
      toolName: result?.toolName,
    });
  });

  ipcMain.on('snipper-cancel', () => {
    if (snipperWindow && !snipperWindow.isDestroyed()) {
      snipperWindow.destroy();
      snipperWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
    broadcast('snipper-status', { active: false });
    broadcast('snipped-result', {
      cancelled: true,
    });
  });

  // Native User Profile Information for Personalized Startup Greeting
  ipcMain.handle('get-user-info', () => {
    try {
      const userInfo = os.userInfo();
      return {
        username: userInfo.username || process.env.USERNAME || process.env.USER || 'Creator',
        homedir: userInfo.homedir || '',
      };
    } catch {
      return { username: process.env.USERNAME || process.env.USER || 'Creator' };
    }
  });

  // Real System Hardware & Network Telemetry Handlers
  ipcMain.handle('get-system-telemetry', async () => {
    try {
      return await getFullTelemetry();
    } catch (err) {
      console.error('get-system-telemetry error:', err);
      return null;
    }
  });

  ipcMain.handle('get-wifi-data', async () => {
    try {
      return await getWifiData();
    } catch (err) {
      console.error('get-wifi-data error:', err);
      return null;
    }
  });

  ipcMain.handle('get-bluetooth-data', async () => {
    try {
      return await getBluetoothData();
    } catch (err) {
      console.error('get-bluetooth-data error:', err);
      return null;
    }
  });

  // Real Windows Radio Control (Wi-Fi, Bluetooth & Airplane Mode via WinRT)
  const runRadioControl = (args) =>
    new Promise((resolve) => {
      const normalPath = path.join(__dirname, 'radioControl.ps1');
      const unpackedPath = normalPath.replace('app.asar', 'app.asar.unpacked');
      const psPath = fs.existsSync(unpackedPath) ? unpackedPath : normalPath;
      execFile(
        'powershell.exe',
        ['-NoProfile', '-ExecutionPolicy', 'Bypass', '-File', psPath, ...args],
        { timeout: 10000, windowsHide: true },
        (err, stdout) => {
          if (err || !stdout) return resolve({ success: false, error: err?.message || 'Radio command failed' });
          try {
            resolve(JSON.parse(stdout.trim()));
          } catch (_) {
            resolve({ success: false, error: 'Invalid radio response' });
          }
        }
      );
    });

  ipcMain.handle('get-radio-state', async () => {
    return await runRadioControl(['-Action', 'status']);
  });

  ipcMain.handle('set-radio-state', async (event, { target = 'wifi', state = 'on' } = {}) => {
    const cleanTarget = ['wifi', 'bluetooth', 'all'].includes(target) ? target : 'wifi';
    const cleanState = state === 'off' ? 'off' : 'on';
    const res = await runRadioControl(['-Action', 'set', '-Target', cleanTarget, '-State', cleanState]);
    // Immediately refresh telemetry after radio state changes
    try {
      const telemetry = await getFullTelemetry();
      broadcast('telemetry-update', telemetry);
    } catch (_) {}
    return res;
  });

  ipcMain.handle('connect-wifi-network', async (event, ssid) => {
    const cleanSsid = String(ssid || '').replace(/["`$;|&<>]/g, '').trim();
    if (!cleanSsid) return { success: false, error: 'Invalid SSID' };
    return new Promise((resolve) => {
      execFile('netsh', ['wlan', 'connect', `name=${cleanSsid}`], { timeout: 8000, windowsHide: true }, async (err, stdout) => {
        if (err) return resolve({ success: false, error: (stdout || err.message || '').trim() });
        setTimeout(async () => {
          try {
            const telemetry = await getFullTelemetry();
            broadcast('telemetry-update', telemetry);
          } catch (_) {}
        }, 1200);
        resolve({ success: true, message: (stdout || '').trim() });
      });
    });
  });

  ipcMain.handle('disconnect-wifi', async () => {
    return new Promise((resolve) => {
      execFile('netsh', ['wlan', 'disconnect'], { timeout: 6000, windowsHide: true }, async (err) => {
        if (err) return resolve({ success: false, error: err.message });
        setTimeout(async () => {
          try {
            const telemetry = await getFullTelemetry();
            broadcast('telemetry-update', telemetry);
          } catch (_) {}
        }, 600);
        resolve({ success: true });
      });
    });
  });

  ipcMain.handle('open-windows-settings', async (event, uri) => {
    const allowed = ['ms-settings:network-wifi', 'ms-settings:bluetooth', 'ms-settings:network-airplanemode'];
    if (!allowed.includes(uri)) return false;
    try {
      await shell.openExternal(uri);
      return true;
    } catch (_) {
      return false;
    }
  });

  // Real Spotify / Windows Media Handlers
  ipcMain.handle('get-live-media', async () => {
    try {
      return await getLiveMedia();
    } catch (err) {
      console.error('get-live-media error:', err);
      return { isPlaying: false, status: 'error' };
    }
  });

  ipcMain.handle('send-media-control', async (event, action) => {
    try {
      return await sendMediaControl(action);
    } catch (err) {
      console.error('send-media-control error:', err);
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('search-track-metadata', async (event, query) => {
    try {
      return await searchTrackMetadata(query);
    } catch (err) {
      console.error('search-track-metadata error:', err);
      return null;
    }
  });

  ipcMain.handle('get-song-lyrics', async (event, { artist, title }) => {
    try {
      return await getSongLyrics(artist, title);
    } catch (err) {
      console.error('get-song-lyrics error:', err);
      return [];
    }
  });

  ipcMain.handle('refresh-live-media', async () => {
    try {
      const media = await getLiveMedia();
      if (media && mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.send('media-update', media);
      }
      return media;
    } catch (err) {
      return null;
    }
  });

  // Native File Staging Shelf Handlers (Drag Out to any app & Explorer Integration)
  ipcMain.on('start-drag', (event, target) => {
    try {
      let filePath = '';
      if (typeof target === 'string') {
        filePath = path.resolve(target);
      } else if (Array.isArray(target) && target.length > 0) {
        filePath = path.resolve(target[0]);
      }

      console.log('[main.cjs start-drag] Target:', filePath, 'Exists?', fs.existsSync(filePath));

      if (filePath && fs.existsSync(filePath)) {
        const iconPath = path.join(__dirname, 'drag-icon.png');
        let icon = nativeImage.createFromPath(iconPath);
        if (icon.isEmpty()) {
          const buf = Buffer.alloc(32 * 32 * 4, 180);
          icon = nativeImage.createFromBitmap(buf, { width: 32, height: 32 });
        }

        event.sender.startDrag({
          file: filePath,
          icon: icon,
        });
        console.log('[main.cjs start-drag] event.sender.startDrag successfully dispatched!');
      } else {
        console.warn('[main.cjs start-drag] File does not exist on disk:', filePath);
      }
    } catch (err) {
      console.error('[main.cjs start-drag] Error:', err);
    }
  });

  ipcMain.handle('show-item-in-folder', async (event, fullPath) => {
    try {
      if (typeof fullPath === 'string' && fs.existsSync(fullPath)) {
        shell.showItemInFolder(fullPath);
        return { success: true };
      }
      return { success: false, error: 'Path does not exist on disk' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('open-path', async (event, fullPath) => {
    try {
      if (typeof fullPath === 'string' && fs.existsSync(fullPath)) {
        await shell.openPath(fullPath);
        return { success: true };
      }
      return { success: false, error: 'Path does not exist on disk' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('open-external-url', async (event, url) => {
    try {
      if (typeof url === 'string' && (url.startsWith('https://') || url.startsWith('http://'))) {
        await shell.openExternal(url);
        return { success: true };
      }
      return { success: false, error: 'Invalid URL' };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle('get-file-details', async (event, fullPath) => {
    try {
      if (!fullPath || !fs.existsSync(fullPath)) return null;
      const stat = fs.statSync(fullPath);
      return {
        isDirectory: stat.isDirectory(),
        size: stat.size,
        exists: true,
      };
    } catch {
      return null;
    }
  });

  ipcMain.handle('write-clipboard-text', (event, text) => {
    try {
      if (typeof text === 'string') {
        lastClipboardText = text;
        clipboard.writeText(text);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  });

  ipcMain.handle('get-clipboard-text', () => {
    try {
      return clipboard.readText();
    } catch {
      return '';
    }
  });

  ipcMain.handle('clear-clipboard', () => {
    try {
      lastClearedClipboardText = clipboard.readText() || '';
      clipboard.writeText('');
      clipboard.clear();
      lastClipboardText = '';
      broadcast('island-action', { type: 'CLIPBOARD_CLEARED' });
      return true;
    } catch {
      return false;
    }
  });

  // Gemini Real LLM Inference Handlers
  ipcMain.handle('gemini-chat', async (event, params) => {
    return await geminiService.chat(params || {});
  });

  ipcMain.handle('gemini-tool', async (event, params) => {
    return await geminiService.executeTool(params || {});
  });

  ipcMain.handle('gemini-get-api-key', () => {
    return geminiService.getStoredApiKey();
  });

  ipcMain.handle('gemini-get-status', () => {
    return geminiService.getAiStatus();
  });

  ipcMain.handle('gemini-save-api-key', (event, key) => {
    const res = geminiService.saveApiKey(key);
    if (res?.success) {
      broadcast('island-action', { type: 'AI_STATUS_UPDATED', status: geminiService.getAiStatus() });
    }
    return res;
  });

  ipcMain.handle('gemini-save-model', (event, modelId) => {
    const res = geminiService.saveModel(modelId);
    if (res?.success) {
      broadcast('island-action', { type: 'AI_STATUS_UPDATED', status: geminiService.getAiStatus() });
    }
    return res;
  });

  ipcMain.handle('gemini-test-connection', async (event, params) => {
    return await geminiService.testConnection(params || {});
  });

  // Founding Beta Tester Registration (Persisted in userData + optional central webhook)
  const getBetaTesterFilePath = () => path.join(app.getPath('userData'), 'beta_tester.json');

  ipcMain.handle('get-beta-tester', () => {
    try {
      const filePath = getBetaTesterFilePath();
      if (fs.existsSync(filePath)) {
        const raw = fs.readFileSync(filePath, 'utf8').trim();
        if (raw) return JSON.parse(raw);
      }
    } catch (err) {
      console.warn('[main] get-beta-tester read error:', err.message);
    }
    return null;
  });

  ipcMain.handle('register-beta-tester', async (event, emailRaw) => {
    const email = String(emailRaw || '').trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
    if (!emailRegex.test(email)) {
      return { success: false, error: 'Please enter a valid email address.' };
    }

    const record = {
      email,
      registeredAt: Date.now(),
      appVersion: app.getVersion(),
      tier: 'first-user-beta',
      syncedRemote: false,
    };

    // Optional central collection webhook if configured in defaultConfig.cjs
    try {
      const defaultConfig = require('./defaultConfig.cjs');
      const endpoint = (defaultConfig?.BETA_REGISTER_ENDPOINT || '').trim();
      if (endpoint && typeof fetch === 'function') {
        const resp = await fetch(endpoint, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
          body: JSON.stringify({
            email: record.email,
            registeredAt: new Date(record.registeredAt).toISOString(),
            appVersion: record.appVersion,
            platform: process.platform,
            source: 'eyeland-hub-account',
          }),
        });
        if (resp.ok) record.syncedRemote = true;
      }
    } catch (err) {
      console.warn('[main] Beta webhook sync skipped:', err.message);
    }

    try {
      fs.writeFileSync(getBetaTesterFilePath(), JSON.stringify(record, null, 2), 'utf8');
      return { success: true, data: record };
    } catch (err) {
      return { success: false, error: err.message || 'Could not save beta registration.' };
    }
  });

  // General Settings IPC (Language, Speed, Performance, Game Mode)
  ipcMain.handle('get-general-settings', () => {
    return loadGeneralSettings();
  });

  ipcMain.handle('save-general-settings', (event, nextSettings) => {
    const saved = saveGeneralSettingsToDisk(nextSettings);
    applyPerformanceTimers();
    applyGameModeWatcher();
    broadcast('hub-action', { type: 'GENERAL_SETTINGS_UPDATED', settings: saved });
    broadcast('island-action', { type: 'GENERAL_SETTINGS_UPDATED', settings: saved });
    return { success: true, settings: saved };
  });

  // Island Display Settings & Multi-Monitor IPC
  ipcMain.handle('get-displays', () => {
    return getDisplaysList();
  });

  ipcMain.handle('get-island-display', () => {
    return loadIslandDisplaySettings();
  });

  ipcMain.handle('save-island-display', (event, nextDisplay) => {
    const saved = saveIslandDisplaySettingsToDisk(nextDisplay);
    positionIslandOnDisplay(saved.screenId);
    broadcast('hub-action', { type: 'ISLAND_DISPLAY_UPDATED', settings: saved });
    broadcast('island-action', { type: 'ISLAND_DISPLAY_UPDATED', settings: saved });
    return { success: true, settings: saved };
  });

  // Eyeland Hub Window Manager & IPC Handlers
  function createDashboardWindow() {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      if (dashboardWindow.isMinimized()) dashboardWindow.restore();
      dashboardWindow.show();
      dashboardWindow.focus();
      return;
    }

    dashboardWindow = new BrowserWindow({
      width: 1040,
      height: 680,
      minWidth: 840,
      minHeight: 560,
      frame: false,
      transparent: true,
      backgroundColor: '#00000000',
      title: 'Eyeland Hub',
      icon: path.join(__dirname, 'drag-icon.png'),
      webPreferences: {
        preload: path.join(__dirname, 'preload.cjs'),
        nodeIntegration: false,
        contextIsolation: true,
      },
    });

    const isDev = !app.isPackaged && process.env.NODE_ENV !== 'production';
    if (isDev) {
      dashboardWindow.loadURL('http://localhost:5173/?view=dashboard');
    } else {
      dashboardWindow.loadFile(distPath, { query: { view: 'dashboard' }, hash: 'dashboard' });
    }

    dashboardWindow.on('closed', () => {
      dashboardWindow = null;
    });
  }

  ipcMain.on('open-dashboard', () => {
    createDashboardWindow();
  });

  ipcMain.on('minimize-dashboard', () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.minimize();
    }
  });

  ipcMain.on('maximize-dashboard', () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      if (dashboardWindow.isMaximized()) {
        dashboardWindow.unmaximize();
      } else {
        dashboardWindow.maximize();
      }
    }
  });

  ipcMain.on('close-dashboard', () => {
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.close();
    }
  });

  ipcMain.handle('is-dashboard-maximized', () => {
    return dashboardWindow && !dashboardWindow.isDestroyed() ? dashboardWindow.isMaximized() : false;
  });

  // Hub <-> Island Cross-Window IPC Bridge
  ipcMain.on('hub-action', (event, action) => {
    if (mainWindow && !mainWindow.isDestroyed() && !mainWindow.webContents.isCrashed()) {
      try { mainWindow.webContents.send('hub-action', action); } catch (_) {}
    }
  });

  ipcMain.on('island-action', (event, action) => {
    if (dashboardWindow && !dashboardWindow.isDestroyed() && !dashboardWindow.webContents.isCrashed()) {
      try { dashboardWindow.webContents.send('island-action', action); } catch (_) {}
    }
  });

  // Auto-Updater Configuration (GitHub Releases via electron-updater)
  let isInstallRequested = false;
  let isUpdateDownloaded = false;

  try {
    autoUpdater.autoDownload = false;
    autoUpdater.autoInstallOnAppQuit = true;
    autoUpdater.allowPrerelease = false;

    autoUpdater.on('checking-for-update', () => {
      console.log('[autoUpdater] Checking for updates on GitHub Releases...');
      broadcast('update-status', { status: 'checking' });
    });

    autoUpdater.on('update-available', (info) => {
      console.log('[autoUpdater] Update available:', info.version);
      isUpdateDownloaded = false;
      broadcast('update-status', { status: 'available', version: info.version });
      broadcast('island-action', { type: 'UPDATE_AVAILABLE', version: info.version });
    });

    autoUpdater.on('update-not-available', (info) => {
      console.log('[autoUpdater] Eyeland is up to date.');
      broadcast('update-status', { status: 'up-to-date', version: info?.version });
    });

    autoUpdater.on('error', (err) => {
      console.warn('[autoUpdater] Error checking updates:', err?.message || err);
      broadcast('update-status', { status: 'error', message: err?.message });
    });

    autoUpdater.on('download-progress', (progressObj) => {
      broadcast('update-status', {
        status: 'downloading',
        percent: Math.round(progressObj.percent),
        bytesPerSecond: progressObj.bytesPerSecond,
        transferred: progressObj.transferred,
        total: progressObj.total,
      });
    });

    autoUpdater.on('update-downloaded', (info) => {
      console.log('[autoUpdater] Update downloaded successfully:', info.version);
      isUpdateDownloaded = true;
      broadcast('update-status', { status: 'ready', version: info.version });
      broadcast('island-action', { type: 'UPDATE_READY', version: info.version });
      if (isInstallRequested) {
        setTimeout(() => {
          try {
            autoUpdater.quitAndInstall(false, true);
          } catch (e) {
            console.error('[autoUpdater] quitAndInstall error:', e);
          }
        }, 500);
      }
    });
  } catch (err) {
    console.warn('[autoUpdater] Init error:', err.message);
  }

  ipcMain.handle('check-for-updates', async () => {
    if (!app.isPackaged) {
      return { status: 'dev-mode', message: 'Updates checked only in packaged production build.' };
    }
    try {
      const res = await autoUpdater.checkForUpdates();
      return { status: 'success', updateInfo: res?.updateInfo };
    } catch (err) {
      return { status: 'error', message: err?.message };
    }
  });

  ipcMain.on('download-and-install-update', async () => {
    isInstallRequested = true;
    if (isUpdateDownloaded) {
      try {
        autoUpdater.quitAndInstall(false, true);
      } catch (err) {
        console.error('[autoUpdater] quitAndInstall error:', err);
      }
      return;
    }
    try {
      broadcast('update-status', { status: 'downloading', percent: 0 });
      await autoUpdater.downloadUpdate();
    } catch (err) {
      console.warn('[autoUpdater] downloadUpdate error:', err);
      broadcast('update-status', { status: 'error', message: err?.message });
    }
  });

  ipcMain.on('restart-and-install-update', () => {
    try {
      autoUpdater.quitAndInstall(false, true);
    } catch (err) {
      console.error('[autoUpdater] quitAndInstall error:', err);
    }
  });

  // Simulated update triggers for testing the collapsed island update flow
  ipcMain.on('simulate-update-test', (event, version = '1.0.1') => {
    console.log('[autoUpdater] Simulating update for testing:', version);
    isUpdateDownloaded = false;
    isInstallRequested = false;
    broadcast('update-status', { status: 'available', version });
    broadcast('island-action', { type: 'UPDATE_AVAILABLE', version });
  });

  ipcMain.on('simulate-download-and-install', (event, version = '1.0.1') => {
    console.log('[autoUpdater] Simulating download and install for:', version);
    let pct = 0;
    broadcast('update-status', { status: 'downloading', percent: 0, version });
    const iv = setInterval(() => {
      pct += 25;
      if (pct >= 100) {
        clearInterval(iv);
        isUpdateDownloaded = true;
        broadcast('update-status', { status: 'ready', version });
        broadcast('island-action', { type: 'UPDATE_READY', version });
      } else {
        broadcast('update-status', { status: 'downloading', percent: pct, version });
      }
    }, 600);
  });

  ipcMain.on('restart-app', () => {
    if (app.isPackaged) {
      stopMediaDaemon();
      stopHardwareDaemon();
      app.relaunch();
      app.exit(0);
    } else {
      // In dev mode (concurrently -k), reload windows cleanly so Vite stays alive
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.webContents.reloadIgnoringCache();
      }
      if (dashboardWindow && !dashboardWindow.isDestroyed()) {
        dashboardWindow.webContents.reloadIgnoringCache();
      }
    }
  });

  ipcMain.on('exit-app', () => {
    stopMediaDaemon();
    stopHardwareDaemon();
    if (dashboardWindow && !dashboardWindow.isDestroyed()) {
      dashboardWindow.destroy();
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.destroy();
    }
    app.quit();
  });

  mainWindow.on('closed', () => {
    if (cursorPollInterval) clearInterval(cursorPollInterval);
    if (telemetryInterval) clearInterval(telemetryInterval);
    if (privacyPollInterval) clearInterval(privacyPollInterval);
    if (clipboardPollInterval) clearInterval(clipboardPollInterval);
    if (gameModePollInterval) clearInterval(gameModePollInterval);
    if (unsubscribeMedia) unsubscribeMedia();
    if (unsubscribeHardware) unsubscribeHardware();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Sync Windows auto-start login item with user's General preference
  applyLoginItemSetting();

  // Check for updates on startup (production packaged only)
  if (app.isPackaged) {
    setTimeout(() => {
      autoUpdater.checkForUpdatesAndNotify().catch((e) => console.warn('[autoUpdater] Startup check:', e.message));
    }, 6000);
  }
  app.on('second-instance', () => {
    if (mainWindow && !mainWindow.isDestroyed()) {
      if (mainWindow.isMinimized()) mainWindow.restore();
      mainWindow.focus();
      mainWindow.show();
    }
  });
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('before-quit', () => {
  stopMediaDaemon();
  stopHardwareDaemon();
});

app.on('window-all-closed', () => {
  stopMediaDaemon();
  stopHardwareDaemon();
  if (process.platform !== 'darwin') app.quit();
});
