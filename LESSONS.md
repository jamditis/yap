# Lessons Learned - Yap Voice Assistant

> Last updated: 2024-12-10

## Project Summary
Yap is an Electron-based voice assistant for developers, designed to enable voice-to-text dictation for CLI tools like Claude Code.

## What Worked

### Technical Wins
- **Gemini API for transcription** - Fast, accurate, cost-effective (~$0.001 per 10 seconds)
- **Global hotkeys via Electron** - `globalShortcut` API is reliable and works system-wide
- **Audio visualization** - Real-time waveform feedback using Web Audio API AnalyserNode gives users confidence the mic is working
- **Headless tray mode** - App runs silently in background, activates on hotkey
- **Multiple transcription backends** - Gemini (cloud), Parakeet (local GPU), Windows Speech (local CPU) gives flexibility

### UX Wins
- **Sound feedback** - Windows system sounds for start/stop/success/error provide non-visual confirmation
- **Keyboard-first design** - Alt+S (record), Alt+H (show/hide) keeps hands on keyboard
- **Toast notifications** - Brief, non-intrusive status messages

### Architecture Wins
- **React + Vite + Tailwind** - Fast dev iteration, hot reload works well with Electron
- **Separation of concerns** - `geminiLiveService.ts` handles all transcription logic, UI is decoupled

## What Didn't Work

### Critical Failures
- **Cannot send keystrokes to elevated windows** - The core use case (paste into Claude Code running in admin terminal) is blocked by Windows UAC. Non-elevated processes cannot send input to elevated windows.
- **Right-click paste workflow** - Too much friction. User has to manually paste after transcription completes.
- **Window focus required** - Can't inject text into Claude Code without switching windows

### Technical Debt
- **Electron bundle size** - ~150MB for a simple voice tool is excessive
- **Python server dependency** - Parakeet requires separate Python environment and CUDA setup
- **`@ts-ignore` proliferation** - Electron window bridge typing is messy

### UX Issues
- **Settings UI rarely needed** - Built a full settings panel but users just want hotkey → speak → done
- **History panel unnecessary** - Transcription history adds UI complexity with little value for the core use case
- **Model selection friction** - Most users will pick one model and never change it

## Key Insights

### The Real Problem
The goal was never "build a transcription tool" - it was **"talk to Claude Code hands-free."** Yap solves the wrong problem. It transcribes well but can't deliver the text where it needs to go.

### Windows Elevation is the Blocker
Any solution must either:
1. Run elevated (same privilege as target window)
2. Use UI Automation APIs (work across elevation boundaries)
3. Embed the terminal (control the whole environment)
4. Avoid native Windows terminals entirely (VS Code integrated terminal)

### Simpler Would Be Better
A 50-line Python script that records, transcribes, and copies to clipboard would deliver 90% of the value with 5% of the complexity. The Electron app is overbuilt.

## Recommendations for Future Work

### If Continuing Yap
- Strip out UI, make it truly headless
- Run as elevated process to match admin terminals
- Use `pywinauto` or Windows UI Automation for cross-elevation input
- Consider making it a Windows service

### If Starting Fresh
- **VS Code Extension** - Claude Code works great in VS Code's integrated terminal, which doesn't have elevation issues
- **Custom Terminal App** - Electron + xterm.js + node-pty to embed a real terminal with voice built in
- **Ghost Layer** - Invisible automation daemon that proxies commands to any terminal window

### Tech Stack Recommendations
- Keep Gemini API - it's fast and cheap
- Keep global hotkeys via Electron or pynput
- Ditch the UI - just tray icon and hotkeys
- Consider Python for simpler deployment (single exe via PyInstaller)

## Artifacts Worth Keeping

| File | Why |
|------|-----|
| `services/geminiLiveService.ts` | Clean transcription logic, reusable |
| `electron/main.cjs` | Global shortcut and tray patterns |
| `local_server/server.py` | Parakeet integration if GPU transcription needed |

## Related Projects
- New project TBD: "Ghost Layer" terminal automation daemon
- New project TBD: VS Code voice extension

---

*This document captures lessons for future reference. Update it when new insights emerge.*
