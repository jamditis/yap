# Electron Development Rules

## Architecture
- Main process code lives in `electron/main.cjs` (CommonJS required)
- Preload script at `electron/preload.cjs` exposes IPC bridge
- Renderer process is React app in `components/`, `services/`

## IPC Communication
- Use `ipcMain.handle()` for async operations (returns Promise)
- Use `ipcMain.on()` for fire-and-forget events
- Preload exposes methods via `contextBridge.exposeInMainWorld('electron', {...})`
- Renderer accesses via `window.electron.methodName()`

## Common Patterns
```javascript
// Main process (main.cjs)
ipcMain.handle('action-name', async (event, args) => {
    return { success: true, data: result };
});

// Preload (preload.cjs)
contextBridge.exposeInMainWorld('electron', {
    actionName: (args) => ipcRenderer.invoke('action-name', args)
});

// Renderer (React)
// @ts-ignore
const result = await window.electron.actionName(args);
```

## Build Notes
- Dev: `npm run electron:dev` loads from Vite dev server
- Prod: `npm run electron:build` uses `loadFile()` for correct MIME types
- Assets must be in `extraResources` in package.json for production
