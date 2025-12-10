const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, dialog, shell, globalShortcut, clipboard } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

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
    alwaysOnTop: true, // Restored "always on top"
    resizable: true, 
    show: false, 
    skipTaskbar: true, // Restored "skip taskbar"
    icon: iconPath, // Set window icon
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

  mainWindow.once('ready-to-show', () => {
    mainWindow.show();
  });

  mainWindow.on('close', (event) => {
    if (!isQuitting) {
      event.preventDefault();
      mainWindow.hide();
    }
    return false;
  });
}

function registerShortcuts() {
    globalShortcut.register('Alt+S', () => {
        if (mainWindow) {
            mainWindow.webContents.send('toggle-listening');
            mainWindow.show(); 
        }
    });

    globalShortcut.register('Alt+H', () => {
        if (mainWindow) {
            if (mainWindow.isVisible()) mainWindow.hide();
            else mainWindow.show();
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
ipcMain.handle('paste-text', async (event, text) => {
  try {
    clipboard.writeText(text); // Use Native Electron Clipboard
    
    // Shift+Insert (+{INSERT}) works in terminals. 
    const psCommand = `
      Add-Type -AssemblyName System.Windows.Forms
      [System.Windows.Forms.SendKeys]::SendWait('+{INSERT}')
      Start-Sleep -Milliseconds 50
      [System.Windows.Forms.SendKeys]::SendWait('{ENTER}')
    `;
    spawn('powershell', ['-Command', psCommand]);
    return { success: true };
  } catch (error) {
    console.error("Paste failed:", error);
    return { success: false, error: error.message };
  }
}); 