# Testing & Development Rules

## Development Commands
```bash
npm run dev           # Vite dev server only (port 8001)
npm run electron:dev  # Full Electron + Vite
npm run build         # Production build
npm run electron:build # Build + package installer
```

## Testing Checklist
Before committing changes:
1. Run `npm run build` - verify no TypeScript/build errors
2. Test with `npm run electron:dev`
3. Verify global shortcuts work (Alt+S, Alt+H)
4. Test each transcription model if audio code changed
5. Check tray icon and context menu

## Common Issues
- **Blank window**: Run `npm run build` before `npm run electron:build`
- **MIME errors**: Use `loadFile()` not `loadURL()` in production
- **Tray icon missing**: Check PNG path, resize to 16x16
- **Parakeet fails**: Verify Python in PATH, FFmpeg installed

## Debug Tips
- DevTools: Right-click window or add `mainWindow.webContents.openDevTools()`
- Main process logs: Check terminal running electron
- Renderer logs: DevTools console
