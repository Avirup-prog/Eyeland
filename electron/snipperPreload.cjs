const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('snipperAPI', {
  onInit: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('init-snipper', handler);
    return () => ipcRenderer.removeListener('init-snipper', handler);
  },
  onBackgroundUpdate: (callback) => {
    const handler = (event, data) => callback(data);
    ipcRenderer.on('set-background', handler);
    return () => ipcRenderer.removeListener('set-background', handler);
  },
  finishSnipping: (result) => {
    ipcRenderer.send('snipper-complete', result);
  },
  cancelSnipping: () => {
    ipcRenderer.send('snipper-cancel');
  },
});
