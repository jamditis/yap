const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, dialog, shell, globalShortcut, clipboard } = require('electron');
const path = require('path');
const { spawn, exec } = require('child_process');

// Play system notification sounds
function playSound(type) {
    // Windows system sounds - using actual file names from C:\Windows\Media
    const sounds = {
        start: 'Windows Hardware Insert',    // Recording started
        stop: 'Windows Hardware Remove',     // Recording stopped
        success: 'Windows Notify',           // Success
        error: 'Windows Critical Stop'       // Error
    };
    const soundName = sounds[type] || 'notify';
    const soundPath = `C:\\Windows\\Media\\${soundName}.wav`;

    // Use PowerShell to play sound asynchronously
    exec(`powershell -c "(New-Object Media.SoundPlayer '${soundPath}').Play()"`, { windowsHide: true }, (err) => {
        if (err) console.error('[Yap] Sound error:', err.message);
    });
}

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }

let mainWindow;
let tray; // Re-declare tray
let isQuitting = false;
let pythonServerProcess;

let parakeetServerReady = false;

function startPythonServer() {
  let scriptPath;
  let cwd;
  if (app.isPackaged) {
    scriptPath = path.join(process.resourcesPath, 'local_server', 'server.py');
    cwd = path.join(process.resourcesPath, 'local_server');
  } else {
    scriptPath = path.join(__dirname, '../local_server/server.py');
    cwd = path.join(__dirname, '../local_server');
  }

  console.log("[Parakeet] Starting server at:", scriptPath);
  console.log("[Parakeet] Working directory:", cwd);

  // Check if file exists first
  const fs = require('fs');
  if (!fs.existsSync(scriptPath)) {
    console.error("[Parakeet] server.py not found at:", scriptPath);
    return;
  }

  try {
    pythonServerProcess = spawn('python', [scriptPath], {
      cwd: cwd,
      env: { ...process.env },
      shell: true  // Helps find python on Windows PATH
    });

    pythonServerProcess.stdout.on('data', (data) => {
      const msg = data.toString();
      console.log(`[Parakeet]: ${msg}`);
      if (msg.includes('Uvicorn running') || msg.includes('Started server')) {
        parakeetServerReady = true;
        console.log("[Parakeet] Server is ready!");
      }
    });

    pythonServerProcess.stderr.on('data', (data) => {
      const msg = data.toString();
      // Uvicorn logs to stderr by default, so check for startup messages
      if (msg.includes('Uvicorn running') || msg.includes('Started server')) {
        parakeetServerReady = true;
        console.log("[Parakeet] Server is ready!");
      }
      console.error(`[Parakeet Err]: ${msg}`);
    });

    pythonServerProcess.on('error', (err) => {
      console.error("[Parakeet] Failed to start:", err.message);
      if (err.message.includes('ENOENT')) {
        console.error("[Parakeet] Python not found. Make sure Python is in your PATH.");
      }
    });

    pythonServerProcess.on('exit', (code, signal) => {
      console.log(`[Parakeet] Process exited with code ${code}, signal ${signal}`);
      parakeetServerReady = false;
    });
  } catch (err) {
    console.error("[Parakeet] Spawn error:", err);
  }
}

function killPythonServer() {
  if (pythonServerProcess) {
    pythonServerProcess.kill();
    pythonServerProcess = null;
  }
}

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  // Determine icon path for both dev and production
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'assets', 'yap.ico') 
    : path.join(__dirname, '../assets', 'yap.ico');

  mainWindow = new BrowserWindow({
    width: 400,
    height: 600,
    x: width - 420,
    y: 50,
    frame: true,
    transparent: false,
    backgroundColor: '#0c0c0c',
    alwaysOnTop: true,
    resizable: true,
    show: false,  // Start hidden
    skipTaskbar: true,
    icon: iconPath,
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  // Use loadURL for dev server, loadFile for production (handles MIME types correctly)
  if (process.env.ELECTRON_START_URL) {
    mainWindow.loadURL(process.env.ELECTRON_START_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }

  // Start minimized to tray - don't show window on launch
  // Window stays hidden until user presses Alt+H to show settings
  mainWindow.once('ready-to-show', () => {
    // Don't show - stay in tray only
    console.log('[Yap] Ready - running in system tray. Press Alt+S to record, Alt+H to show window.');
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

let isCurrentlyRecording = false;

function updateTrayStatus(recording) {
    isCurrentlyRecording = recording;
    if (tray) {
        tray.setToolTip(recording ? 'Yap - Recording...' : 'Yap Voice Assistant');
    }
}

function registerShortcuts() {
    // Alt+S: Toggle recording (works from any window, stays hidden)
    globalShortcut.register('Alt+S', () => {
        if (mainWindow) {
            mainWindow.webContents.send('toggle-listening');
            // Don't show window - stay in tray mode
            console.log('[Yap] Alt+S pressed - toggling recording');
        }
    });

    // Alt+H: Show/hide settings window
    globalShortcut.register('Alt+H', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) {
                mainWindow.hide();
                console.log('[Yap] Window hidden');
            } else {
                mainWindow.show();
                mainWindow.focus();
                console.log('[Yap] Window shown');
            }
        }
    });
}

function createTray() {
  // Try PNG first for tray (better cross-platform), fall back to ICO
  const pngPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'yap.png')
    : path.join(__dirname, '../assets', 'yap.png');
  const icoPath = app.isPackaged
    ? path.join(process.resourcesPath, 'assets', 'yap.ico')
    : path.join(__dirname, '../assets', 'yap.ico');

  let icon = nativeImage.createFromPath(pngPath);
  if (icon.isEmpty()) {
      console.log("PNG not found, trying ICO:", pngPath);
      icon = nativeImage.createFromPath(icoPath);
  }
  if (icon.isEmpty()) {
      console.error("Failed to load tray icon from both paths");
      icon = nativeImage.createEmpty();
  } else {
      // Resize for tray - Windows tray icons should be 16x16 or 32x32
      icon = icon.resize({ width: 16, height: 16 });
  }

  tray = new Tray(icon);
  tray.setToolTip('Yap Voice Assistant');
  
  const contextMenu = Menu.buildFromTemplate([
    { label: 'Show Yap', click: () => mainWindow.show() },
    { type: 'separator' },
    { label: 'Quit', click: () => { isQuitting = true; app.quit(); } }
  ]);
  
  tray.setContextMenu(contextMenu);
  tray.on('click', () => {
      mainWindow.isVisible() ? mainWindow.hide() : mainWindow.show();
  });
}


app.whenReady().then(() => {
  createWindow();
  createTray(); 
  registerShortcuts();
  startPythonServer(); 

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('will-quit', () => {
    killPythonServer(); 
    globalShortcut.unregisterAll();
});

// --- IPC HANDLERS ---

// Update tray status when recording state changes
ipcMain.on('recording-status', (event, isRecording) => {
    updateTrayStatus(isRecording);
    playSound(isRecording ? 'start' : 'stop');
    console.log(`[Yap] Recording: ${isRecording}`);
});

// Play a sound from renderer
ipcMain.on('play-sound', (event, type) => {
    playSound(type);
});

// Copy text to clipboard only (for manual paste with right-click)
ipcMain.handle('copy-text', async (event, text) => {
    try {
        clipboard.writeText(text);
        console.log('[Yap] Text copied to clipboard');
        return { success: true };
    } catch (error) {
        console.error("Copy failed:", error);
        return { success: false, error: error.message };
    }
});

// Windows Speech Recognition - runs PowerShell script for local dictation
ipcMain.handle('windows-speech-recognize', async (event, timeoutSeconds = 10) => {
    return new Promise((resolve) => {
        const scriptPath = app.isPackaged
            ? path.join(process.resourcesPath, 'local_server', 'windows_speech.ps1')
            : path.join(__dirname, '../local_server/windows_speech.ps1');

        console.log('[Yap] Starting Windows Speech Recognition...');
        playSound('start');

        const ps = spawn('powershell', [
            '-ExecutionPolicy', 'Bypass',
            '-File', scriptPath,
            '-TimeoutSeconds', timeoutSeconds.toString()
        ], { windowsHide: true });

        let output = '';
        let error = '';

        ps.stdout.on('data', (data) => {
            output += data.toString();
        });

        ps.stderr.on('data', (data) => {
            error += data.toString();
        });

        ps.on('close', (code) => {
            playSound('stop');
            const text = output.trim();
            if (text) {
                console.log('[Yap] Windows Speech result:', text);
                resolve({ success: true, text });
            } else if (error) {
                console.error('[Yap] Windows Speech error:', error);
                resolve({ success: false, error });
            } else {
                resolve({ success: true, text: '' });
            }
        });

        ps.on('error', (err) => {
            console.error('[Yap] Windows Speech spawn error:', err);
            playSound('error');
            resolve({ success: false, error: err.message });
        });
    });
});

// Copy text to clipboard and notify - user right-clicks to paste in Claude Code
// (Auto right-click doesn't work well because Claude Code copies selection on right-click)
ipcMain.handle('paste-text', async (event, text) => {
  try {
    clipboard.writeText(text);
    console.log('[Yap] Text ready in clipboard:', text.substring(0, 50) + '...');
    // User will right-click to paste in Claude Code
    return { success: true };
  } catch (error) {
    console.error("Clipboard write failed:", error);
    return { success: false, error: error.message };
  }
}); 