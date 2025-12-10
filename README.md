# Yap - Voice Assistant for Developers

<p align="center">
  <img src="assets/yap.png" alt="Yap Logo" width="128" height="128">
</p>

<p align="center">
  <strong>Voice-to-text dictation tool that runs in your system tray</strong><br>
  Perfect for hands-free coding with Claude Code, Gemini CLI, or any terminal.
</p>

<p align="center">
  <a href="https://github.com/jamditis/yap/releases/latest">
    <img src="https://img.shields.io/github/v/release/jamditis/yap?style=for-the-badge" alt="Latest Release">
  </a>
</p>

---

## Download

**[⬇️ Download Latest Release](https://github.com/jamditis/yap/releases/latest)**

---

## Features

- **Headless tray mode** - Runs silently in system tray, always ready
- **Global hotkeys** - `Alt+S` to record from any window, `Alt+H` to show settings
- **Multiple transcription engines:**
  - **Gemini 2.0/2.5 Flash** - Cloud-based, high quality, supports Agent mode
  - **Parakeet** - Local NVIDIA GPU transcription, free, high quality
  - **Windows Speech** - Built-in Windows engine, no setup required
- **Agent mode** - Converts natural speech to CLI commands (e.g., "show git status" → `git status`)
- **Audio visualization** - Real-time waveform on mic button
- **Sound notifications** - Audio feedback for recording start/stop/success/error

---

## User Guide

### Installation

1. Download `Yap Setup 1.0.0.exe` from the [releases page](https://github.com/jamditis/yap/releases/latest)
2. Run the installer
3. Yap starts automatically and appears in your system tray

### First-Time Setup

#### Option 1: Gemini (Recommended - Best Quality)

1. Get a free API key at [Google AI Studio](https://aistudio.google.com/app/apikey)
2. Press `Alt+H` to open Yap settings
3. The app looks for `GEMINI_API_KEY` in your environment or `.env.local` file
4. Create `.env.local` in the app directory:
   ```
   GEMINI_API_KEY=your_api_key_here
   ```

#### Option 2: Parakeet (Local - NVIDIA GPU)

Requires:
- NVIDIA GPU with CUDA support
- Python 3.10+
- NeMo toolkit: `pip install nemo_toolkit[asr] torch torchaudio pydub`
- FFmpeg installed and in PATH

The Parakeet server starts automatically with Yap.

#### Option 3: Windows Speech (Local - No Setup)

Just select "Windows Speech (Local/CPU)" in the model dropdown. Uses Windows' built-in speech recognition - works offline with no configuration.

### Basic Usage

| Action | Hotkey |
|--------|--------|
| Start/Stop Recording | `Alt+S` |
| Show/Hide Settings | `Alt+H` |

**Workflow:**
1. Focus your terminal (Claude Code, PowerShell, etc.)
2. Press `Alt+S` - hear the start sound
3. Speak your command or text
4. Press `Alt+S` again - hear the stop sound
5. Wait for transcription (you'll hear success/error sound)
6. Right-click in your terminal to paste

### Transcription Modes

#### RAW Mode (Default)
Transcribes exactly what you say. Use for:
- Dictating text, comments, documentation
- Any verbatim transcription

#### Agent Mode (Gemini only)
Converts natural language to CLI commands:
- "show me the git status" → `git status`
- "list all files" → `ls -la`
- "make a new folder called test" → `mkdir test`
- "install lodash" → `npm install lodash`

### Settings

| Setting | Description |
|---------|-------------|
| **Microphone** | Select input device |
| **Model** | Choose transcription engine |
| **Auto-Copy** | Automatically copy results to clipboard |
| **Paste Mode** | Enable for terminal paste workflow |
| **Agent Mode** | Convert speech to CLI commands (Gemini only) |

---

## Development

### Prerequisites

- Node.js 18+
- npm

### Setup

```bash
git clone https://github.com/jamditis/yap.git
cd yap
npm install
```

### Environment Variables

Create `.env.local`:
```
GEMINI_API_KEY=your_api_key_here
```

### Run in Development

```bash
npm run electron:dev
```

### Build for Production

```bash
npm run electron:build
```

Output: `dist/Yap Setup 1.0.0.exe`

---

## Troubleshooting

### No transcription with Gemini
- Check your API key is correct in `.env.local`
- Verify you have internet connection
- Check console for error messages (`Alt+H` → DevTools)

### Parakeet not working
- Ensure NVIDIA GPU drivers are installed
- Check Python version: `python --version` (needs 3.10+)
- Verify NeMo: `python -c "import nemo.collections.asr"`
- Check server: `curl http://localhost:8002/health`

### Windows Speech not transcribing
- Check microphone permissions in Windows Settings
- Try speaking louder/clearer
- Default timeout is 10 seconds

### Paste not working in Claude Code
- Yap copies to clipboard - you need to right-click to paste
- Claude Code doesn't support Ctrl+V, only right-click paste

---

## Tech Stack

- **Electron** - Desktop app framework
- **React 19** - UI
- **Vite** - Build tool
- **Tailwind CSS** - Styling
- **Google Gemini API** - Cloud transcription
- **NVIDIA Parakeet** - Local GPU transcription
- **Windows SAPI** - Local CPU transcription

---

## License

MIT

---

## Contributing

Issues and PRs welcome! Please open an issue first to discuss major changes.

---

<p align="center">
  Made with ❤️ for developers who prefer talking to typing
</p>
