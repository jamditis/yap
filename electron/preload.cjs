const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  pasteText: (text) => ipcRenderer.invoke('paste-text', text),
  resizeWindow: (dims) => ipcRenderer.send('resize-window', dims),
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  onToggleListening: (callback) => ipcRenderer.on('toggle-listening', () => callback())
});
