const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electron', {
  pasteText: (text) => ipcRenderer.invoke('paste-text', text),
  copyText: (text) => ipcRenderer.invoke('copy-text', text),
  windowsSpeechRecognize: (timeout) => ipcRenderer.invoke('windows-speech-recognize', timeout),
  setRecordingStatus: (isRecording) => ipcRenderer.send('recording-status', isRecording),
  playSound: (type) => ipcRenderer.send('play-sound', type), // 'start', 'stop', 'success', 'error'
  resizeWindow: (dims) => ipcRenderer.send('resize-window', dims),
  setIgnoreMouseEvents: (ignore, options) => ipcRenderer.send('set-ignore-mouse-events', ignore, options),
  onToggleListening: (callback) => ipcRenderer.on('toggle-listening', () => callback())
});
