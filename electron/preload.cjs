const { contextBridge, ipcRenderer, webUtils } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  onGlobalCursor: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('global-cursor', handler);
    return () => ipcRenderer.removeListener('global-cursor', handler);
  },
  setIgnoreMouseEvents: (ignore) => {
    ipcRenderer.send('set-ignore-mouse-events', ignore);
  },
  captureScreen: () => ipcRenderer.invoke('capture-screen'),
  getUserInfo: () => ipcRenderer.invoke('get-user-info'),
  getSystemTelemetry: () => ipcRenderer.invoke('get-system-telemetry'),
  getWifiData: () => ipcRenderer.invoke('get-wifi-data'),
  getBluetoothData: () => ipcRenderer.invoke('get-bluetooth-data'),
  getLiveMedia: () => ipcRenderer.invoke('get-live-media'),
  refreshLiveMedia: () => ipcRenderer.invoke('refresh-live-media'),
  sendMediaControl: (action) => ipcRenderer.invoke('send-media-control', action),
  searchTrackMetadata: (query) => ipcRenderer.invoke('search-track-metadata', query),
  getSongLyrics: (artist, title) => ipcRenderer.invoke('get-song-lyrics', { artist, title }),
  onMediaUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('media-update', handler);
    return () => ipcRenderer.removeListener('media-update', handler);
  },
  onTelemetryUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('telemetry-update', handler);
    return () => ipcRenderer.removeListener('telemetry-update', handler);
  },

  // Native File Staging Shelf APIs (Drag In, Drag Out, Show in Explorer)
  getPathForFile: (file) => {
    try {
      if (webUtils && typeof webUtils.getPathForFile === 'function') {
        const p = webUtils.getPathForFile(file);
        if (p) return p;
      }
      return file?.path || '';
    } catch (err) {
      console.warn('[preload getPathForFile]', err);
      return file?.path || '';
    }
  },
  startDrag: (target) => {
    ipcRenderer.send('start-drag', target);
  },
  showItemInFolder: (filePath) => ipcRenderer.invoke('show-item-in-folder', filePath),
  openPath: (filePath) => ipcRenderer.invoke('open-path', filePath),
  getFileDetails: (filePath) => ipcRenderer.invoke('get-file-details', filePath),

  // Real-Time System Clipboard APIs
  onClipboardCopy: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('clipboard-copy', handler);
    return () => ipcRenderer.removeListener('clipboard-copy', handler);
  },
  writeClipboardText: (text) => ipcRenderer.invoke('write-clipboard-text', text),
  getClipboardText: () => ipcRenderer.invoke('get-clipboard-text'),

  // Screen Snipping Tool APIs (+ Crosshair overlay)
  startSnipping: (toolName) => ipcRenderer.invoke('start-snipping', toolName),
  onSnippedResult: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('snipped-result', handler);
    return () => ipcRenderer.removeListener('snipped-result', handler);
  },

  // Gemini Real LLM APIs
  geminiChat: (params) => ipcRenderer.invoke('gemini-chat', params),
  geminiTool: (params) => ipcRenderer.invoke('gemini-tool', params),
  geminiGetApiKey: () => ipcRenderer.invoke('gemini-get-api-key'),
  geminiGetStatus: () => ipcRenderer.invoke('gemini-get-status'),
  geminiSaveApiKey: (key) => ipcRenderer.invoke('gemini-save-api-key', key),

  // Windows Dashboard Application Window APIs
  openDashboard: () => ipcRenderer.send('open-dashboard'),
  minimizeDashboard: () => ipcRenderer.send('minimize-dashboard'),
  maximizeDashboard: () => ipcRenderer.send('maximize-dashboard'),
  closeDashboard: () => ipcRenderer.send('close-dashboard'),
  isDashboardMaximized: () => ipcRenderer.invoke('is-dashboard-maximized'),

  // Real-Time Hardware Volume & Screen Brightness HUD APIs
  onHardwareHud: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('hardware-hud', handler);
    return () => ipcRenderer.removeListener('hardware-hud', handler);
  },
  getHardwareState: () => ipcRenderer.invoke('get-hardware-state'),
  setHardwareVolume: (val) => ipcRenderer.invoke('set-hardware-volume', val),
  setHardwareMute: (muted) => ipcRenderer.invoke('set-hardware-mute', muted),
  setHardwareBrightness: (val) => ipcRenderer.invoke('set-hardware-brightness', val),

  platform: process.platform,
});
