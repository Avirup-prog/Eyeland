const { app, BrowserWindow, screen, ipcMain, desktopCapturer, shell, nativeImage, clipboard } = require('electron');
const path = require('path');
const os = require('os');
const fs = require('fs');
const http = require('http');

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

let mainWindow;
let snipperWindow = null;
let cursorPollInterval = null;
let telemetryInterval = null;
let privacyPollInterval = null;
let mediaPollInterval = null;
let clipboardPollInterval = null;
let lastClipboardText = '';
let lastPrivacyState = { micInUse: false, camInUse: false };

async function startSnippingSession(toolName = 'explain') {
  if (snipperWindow && !snipperWindow.isDestroyed()) {
    snipperWindow.focus();
    return { success: true };
  }

  const primaryDisplay = screen.getPrimaryDisplay();
  const { width, height } = primaryDisplay.bounds;
  const scaleFactor = primaryDisplay.scaleFactor || 1;

  if (mainWindow && !mainWindow.isDestroyed()) {
    mainWindow.hide();
  }

  // Allow OS window manager to cleanly render behind the island
  await new Promise((resolve) => setTimeout(resolve, 80));

  let screenDataUrl = null;
  try {
    const sources = await desktopCapturer.getSources({
      types: ['screen'],
      thumbnailSize: {
        width: Math.round(width * scaleFactor),
        height: Math.round(height * scaleFactor),
      },
    });
    if (sources.length > 0) {
      screenDataUrl = sources[0].thumbnail.toDataURL();
    }
  } catch (err) {
    console.error('[main.cjs startSnippingSession] Screen capture error:', err);
  }

  snipperWindow = new BrowserWindow({
    x: primaryDisplay.bounds.x,
    y: primaryDisplay.bounds.y,
    width: width,
    height: height,
    frame: false,
    transparent: true,
    alwaysOnTop: true,
    skipTaskbar: true,
    fullscreen: true,
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

  snipperWindow.setAlwaysOnTop(true, 'screen-saver');

  const snipperHtmlPath = path.join(__dirname, 'snipper.html');
  snipperWindow.loadFile(snipperHtmlPath);

  snipperWindow.webContents.once('did-finish-load', () => {
    if (snipperWindow && !snipperWindow.isDestroyed()) {
      snipperWindow.webContents.send('init-snipper', {
        screenDataUrl,
        toolName,
        width,
        height,
        scaleFactor,
      });
    }
  });

  snipperWindow.on('closed', () => {
    snipperWindow = null;
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
    }
  });

  return { success: true };
}

async function broadcastLiveMedia() {
  if (!mainWindow || mainWindow.isDestroyed()) return;
  try {
    const media = await getLiveMedia();
    if (media && !mainWindow.isDestroyed()) {
      mainWindow.webContents.send('media-update', media);
    }
  } catch (err) {
    // ignore
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

  const distPath = path.join(__dirname, '../dist/index.html');

  if (app.isPackaged) {
    mainWindow.loadFile(distPath);
  } else {
    // Fast 150ms probe to check if Vite dev server is running
    const probeReq = http.get('http://127.0.0.1:5173', (res) => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadURL('http://localhost:5173');
      }
    });

    probeReq.on('error', () => {
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile(distPath);
      }
    });

    probeReq.setTimeout(150, () => {
      probeReq.destroy();
      if (mainWindow && !mainWindow.isDestroyed()) {
        mainWindow.loadFile(distPath);
      }
    });
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

  // Global cursor tracking (polled at 33fps for smooth gaze with low CPU)
  cursorPollInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isCrashed()) return;
    const cursorPos = screen.getCursorScreenPoint();
    const bounds = mainWindow.getBounds();

    mainWindow.webContents.send('global-cursor', {
      cursorX: cursorPos.x,
      cursorY: cursorPos.y,
      windowX: bounds.x,
      windowY: bounds.y,
      windowWidth: bounds.width,
      windowHeight: bounds.height,
    });
  }, 30);

  // Periodic System Hardware Telemetry broadcast (every 3 seconds)
  telemetryInterval = setInterval(async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const telemetry = await getFullTelemetry();
      mainWindow.webContents.send('telemetry-update', telemetry);
    } catch (err) {
      // ignore
    }
  }, 3000);

  // Fast Real-Time Privacy Monitor (Microphone & Camera, sub-second reactivity)
  privacyPollInterval = setInterval(async () => {
    if (!mainWindow || mainWindow.isDestroyed()) return;
    try {
      const privacy = await getCameraAndMicUsage();
      if (
        privacy.micInUse !== lastPrivacyState.micInUse ||
        privacy.camInUse !== lastPrivacyState.camInUse
      ) {
        lastPrivacyState = privacy;
        mainWindow.webContents.send('telemetry-update', { privacy });
      }
    } catch (_) {}
  }, 1000);

  // Initialize clipboard tracking baseline
  try {
    lastClipboardText = clipboard.readText() || '';
  } catch (_) {}

  // Real-Time System Clipboard Monitor (detects Ctrl+C anywhere across Windows OS)
  clipboardPollInterval = setInterval(() => {
    if (!mainWindow || mainWindow.isDestroyed() || mainWindow.webContents.isCrashed()) return;
    try {
      const currentText = clipboard.readText();
      if (typeof currentText === 'string' && currentText.trim().length > 0 && currentText !== lastClipboardText) {
        lastClipboardText = currentText;
        mainWindow.webContents.send('clipboard-copy', {
          text: currentText,
          timestamp: Date.now(),
        });
      }
    } catch (_) {}
  }, 500);

  // Real-Time Spotify Media Listener (Sub-20ms updates streamed from persistent daemon)
  const unsubscribeMedia = onMediaChange((media) => {
    if (mainWindow && !mainWindow.isDestroyed() && media) {
      mainWindow.webContents.send('media-update', media);
    }
  });

  // Real-Time Hardware Volume & Screen Brightness HUD Listener
  const unsubscribeHardware = onHardwareHud((hudData) => {
    if (mainWindow && !mainWindow.isDestroyed() && hudData) {
      mainWindow.webContents.send('hardware-hud', hudData);
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

  ipcMain.on('snipper-complete', (event, result) => {
    if (snipperWindow && !snipperWindow.isDestroyed()) {
      snipperWindow.destroy();
      snipperWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('snipped-result', {
        success: true,
        dataUrl: result.dataUrl,
        bounds: result.bounds,
        toolName: result.toolName,
      });
    }
  });

  ipcMain.on('snipper-cancel', () => {
    if (snipperWindow && !snipperWindow.isDestroyed()) {
      snipperWindow.destroy();
      snipperWindow = null;
    }
    if (mainWindow && !mainWindow.isDestroyed()) {
      mainWindow.show();
      mainWindow.focus();
      mainWindow.webContents.send('snipped-result', {
        cancelled: true,
      });
    }
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
    return geminiService.saveApiKey(key);
  });

  // Eyeland Hub Window Manager & IPC Handlers
  let dashboardWindow = null;

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

  mainWindow.on('closed', () => {
    if (cursorPollInterval) clearInterval(cursorPollInterval);
    if (telemetryInterval) clearInterval(telemetryInterval);
    if (privacyPollInterval) clearInterval(privacyPollInterval);
    if (clipboardPollInterval) clearInterval(clipboardPollInterval);
    if (unsubscribeMedia) unsubscribeMedia();
    if (unsubscribeHardware) unsubscribeHardware();
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  // Automatically start Eyeland when user logs in / boots PC
  try {
    app.setLoginItemSettings({
      openAtLogin: true,
      path: process.execPath,
      args: ['--autostart'],
    });
  } catch (err) {
    console.warn('LoginItemSettings could not be updated:', err);
  }

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
