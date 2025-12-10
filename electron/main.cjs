const { app, BrowserWindow, ipcMain, screen, Tray, Menu, nativeImage, dialog, shell, globalShortcut, clipboard } = require('electron');
const path = require('path');
const { spawn } = require('child_process');

const gotTheLock = app.requestSingleInstanceLock();
if (!gotTheLock) { app.quit(); }

let mainWindow;
let tray; // Re-declare tray
let isQuitting = false;
let pythonServerProcess;

function startPythonServer() {
  let scriptPath;
  if (app.isPackaged) {
    scriptPath = path.join(process.resourcesPath, 'local_server', 'server.py');
  } else {
    scriptPath = path.join(__dirname, '../local_server/server.py');
  }

  console.log("Starting Python Server at:", scriptPath);
  
  pythonServerProcess = spawn('python', [scriptPath]);

  pythonServerProcess.stdout.on('data', (data) => {
    console.log(`[Parakeet]: ${data}`);
  });

  pythonServerProcess.stderr.on('data', (data) => {
    console.error(`[Parakeet Err]: ${data}`);
  });
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

  const startUrl = process.env.ELECTRON_START_URL || `file://${path.join(__dirname, '../dist/index.html')}`;
  mainWindow.loadURL(startUrl);

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
  const iconPath = app.isPackaged 
    ? path.join(process.resourcesPath, 'assets', 'yap.ico') 
    : path.join(__dirname, '../assets', 'yap.ico');

  let icon = nativeImage.createFromPath(iconPath);
  if (icon.isEmpty()) {
      console.error("Failed to load tray icon from", iconPath);
      // Fallback to empty or a generic one if you have it
      icon = nativeImage.createEmpty(); 
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