# Yap - Voice-to-CLI Developer Assistant

## Project Overview
**Yap** is a developer productivity tool that acts as a bridge between voice dictation and the command line interface (CLI). It runs as a floating, draggable widget in the browser.

**Core Functionality:**
*   **Voice Command:** Uses the Web Speech API to capture audio and transcribe it to text.
*   **Intelligent Refinement:** Sends raw transcripts to the **Gemini API (gemini-2.5-flash)** to convert natural language into precise CLI commands (e.g., "list files" -> `ls -la`).
*   **Wrappers:** Supports prefixing commands for specific tools (e.g., `git`, `claude`, `gemini`).
*   **Screen Capture:** Built-in ability to take screenshots and copy them to the clipboard.
*   **UI:** A "widget" style interface that can be minimized (Ghost Mode) or expanded for settings and logs.

## Tech Stack
*   **Framework:** React 19 (TypeScript)
*   **Build Tool:** Vite
*   **AI:** Google Gemini API (`@google/genai`)
*   **Speech:** Native Web Speech API (`SpeechRecognition`)
*   **Styling:** Tailwind CSS (inferred from utility classes)

## Setup & Running

### Prerequisites
*   Node.js installed.
*   A Google Gemini API Key.

### Installation
1.  Install dependencies:
    ```bash
    npm install
    ```
2.  Configure Environment:
    *   Create a `.env.local` file in the root.
    *   Add your API key:
        ```
        GEMINI_API_KEY=your_actual_key_here
        ```
    *   *Note: `vite.config.ts` maps this to `process.env.API_KEY` for use in the app.*

### Commands
*   **Start Dev Server:**
    ```bash
    npm run dev
    ```
    (Runs on `http://localhost:3000` by default)
*   **Build for Production:**
    ```bash
    npm run build
    ```
*   **Preview Build:**
    ```bash
    npm run preview
    ```

## Architecture & Key Components

### Directory Structure
*   `components/`: UI components.
    *   `DictationInterface.tsx`: The main component containing the entire UI logic (widget, dashboard, state management).
*   `services/`: Business logic and API integrations.
    *   `geminiLiveService.ts`: Handles the `SpeechRecognition` lifecycle and calls the Gemini API to "refine" text.
*   `utils/`: Helper functions.
    *   `audioUtils.ts`: Audio context management.

### Data Flow
1.  **User speaks** -> `SpeechRecognition` (Browser) captures audio.
2.  **Raw Text** -> `GeminiLiveService` receives interim and final results.
3.  **Refinement** -> If in "Agent Mode" (`DEV_CHAT`), text is sent to `gemini-2.5-flash` with a system prompt to format it as a CLI command.
4.  **UI Update** -> `DictationInterface` updates the transcript log.
5.  **Clipboard** -> If "Auto-Copy" is on, the final command is written to the system clipboard.

## Development Conventions
*   **State Management:** Local React state (`useState`, `useRef`) is used heavily within `DictationInterface.tsx`.
*   **Styling:** Utility classes are used directly in JSX (Tailwind-style).
*   **Icons:** SVG icons are defined as inline components within the file where they are used (see `DictationInterface.tsx`).
*   **Type Safety:** Interfaces are defined in `types.ts` (e.g., `DictationMode`, `TranscriptItem`).
