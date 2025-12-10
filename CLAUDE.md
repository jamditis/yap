# Yap Voice Assistant - Claude Code Context

## Project Overview
Yap is an Electron-based desktop voice assistant for developers. It captures voice input, transcribes it using Google Gemini or local NVIDIA Parakeet model, and optionally converts natural language into CLI commands.

## Tech Stack
- **Framework**: Electron + React 19 (TypeScript)
- **Build**: Vite 6.2
- **AI**: Google Gemini API (`@google/genai`), NVIDIA Parakeet TDT 0.6B (local)
- **Audio**: MediaRecorder API (WebM format)
- **Styling**: Tailwind CSS v3 (PostCSS build)

## Directory Structure
```
yap/
├── electron/
│   ├── main.cjs          # Electron main process
│   └── preload.cjs       # Context bridge for IPC
├── components/
│   └── DictationInterface.tsx  # Main UI component
├── services/
│   └── geminiLiveService.ts    # Transcription service (Gemini + Parakeet)
├── utils/
│   └── audioUtils.ts     # Audio helpers
├── local_server/
│   ├── server.py         # FastAPI server for Parakeet model
│   └── requirements.txt  # Python dependencies
├── assets/
│   ├── yap.ico           # Windows icon (32x32)
│   └── yap.png           # PNG icon (used for tray)
├── dist/                 # Vite build output
├── types.ts              # TypeScript interfaces
├── index.html            # Entry HTML
├── index.tsx             # React entry
├── index.css             # Tailwind CSS entry
├── tailwind.config.js    # Tailwind configuration
├── postcss.config.js     # PostCSS configuration
├── vite.config.ts        # Vite configuration
└── package.json          # Node dependencies
```

## Quick Start

### 1. Install Dependencies
```bash
npm install
```

### 2. Configure Environment
Edit `.env.local` and add your Gemini API key:
```
GEMINI_API_KEY=your_actual_key_here
```
Get your key from: https://aistudio.google.com/app/apikey

### 3. Run in Development
```bash
npm run electron:dev
```

### 4. Build for Production
```bash
npm run electron:build
```
This creates `dist/Yap Setup 1.0.0.exe`

## Key Files

### `electron/main.cjs`
- Creates BrowserWindow with `alwaysOnTop` and `skipTaskbar`
- Loads from `http://localhost:8001` in dev, `file://dist/index.html` in production
- Spawns Python server for Parakeet local model (lazy loading)
- Global shortcuts: `Alt+S` (toggle listening), `Alt+H` (show/hide)
- IPC handler for paste-text (uses PowerShell SendKeys)

### `components/DictationInterface.tsx`
- Main UI: mic button, settings, transcript history
- Uses MediaRecorder to capture audio as WebM blobs
- Sends audio to `GeminiLiveService.transcribeAudio()`
- Modes: RAW (verbatim) vs DEV_CHAT (AI converts to CLI commands)

### `services/geminiLiveService.ts`
- Handles both Gemini API and local Parakeet transcription
- Parakeet: POST to `http://localhost:8002/transcribe`
- Gemini: Uses `@google/genai` with audio as base64 inline data

### `local_server/server.py`
- FastAPI server on port 8002
- Lazy-loads NVIDIA Parakeet TDT model on first request
- Converts WebM to WAV (16kHz mono) using pydub
- Requires: Python 3.10+, CUDA GPU recommended, ffmpeg

## Using Parakeet (Local Model)

### Prerequisites
1. Python 3.10+ installed and in PATH
2. NVIDIA GPU with CUDA (recommended, CPU works but slow)
3. FFmpeg installed and in PATH

### Setup
```bash
cd local_server
pip install -r requirements.txt
```

### Test Manually
```bash
python server.py
# In another terminal:
curl http://localhost:8002/health
```

## Scripts
```bash
npm run dev              # Vite dev server on port 8001
npm run electron:dev     # Dev with Electron wrapper
npm run build            # Build for production
npm run electron:build   # Build + package with electron-builder
```

## Keyboard Shortcuts
- `Alt+S` - Toggle voice recording
- `Alt+H` - Show/hide window

## UI Modes
- **AUTO-COPY**: Automatically copy transcription to clipboard
- **PASTE**: Simulate Shift+Insert + Enter to paste into active terminal
- **AGENT MODE**: AI converts natural speech to CLI commands

## Windows-Specific Notes
- Uses PowerShell `SendKeys` for paste simulation
- Tray icon uses resized PNG (16x16)
- NSIS installer created by electron-builder
- Single instance lock prevents multiple windows

## Architecture Notes
- Window hides on close (runs in tray), quit via tray menu
- Audio recording: MediaRecorder -> WebM Blob -> Base64 (Gemini) or FormData (Parakeet)
- Cost estimation based on audio duration (32 tokens/sec for Gemini Flash)
- Tailwind CSS built via PostCSS into bundled CSS

## Troubleshooting

### Blank Window / ERR_FILE_NOT_FOUND
- Run `npm run build` before `npm run electron:build`
- Check dist/index.html has relative paths (`./assets/...`)

### Tray Icon Not Visible
- Icon is resized to 16x16 automatically
- Check console for path errors

### Parakeet Connection Refused
- Check Python is in PATH: `python --version`
- Check server logs in Electron console
- Install dependencies: `pip install -r local_server/requirements.txt`
- Install FFmpeg for audio conversion

### Microphone Not Working
- Allow microphone access in Windows Privacy settings
- Check browser/Electron has microphone permissions
