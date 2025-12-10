# Yap - User Manual

**Yap** is a minimalist, voice-controlled AI assistant designed for developers. It floats on your screen, listens to your voice, and types smart commands directly into your terminal or editor.

---

## 🚀 Getting Started

1.  **Launch Yap**: After installation, Yap appears as a **floating widget** (usually top-right).
2.  **Tray Icon**: A small icon appears in your system tray (bottom-right on Windows).
    *   *Note: If invisible in v1.0, right-click the blank space in the tray overflow area to find it.*

## 🎙️ Core Controls

| Action | Interaction | Shortcut |
| :--- | :--- | :--- |
| **Start/Stop Listening** | Click the **Microphone Icon** on the widget. | `Alt + S` |
| **Expand Settings** | Hover over the widget, wait for the **Expand (Arrows)** icon to appear top-right, and click it. | *None* |
| **Ghost Mode** | Click the **Minimize (-)** icon bottom-right (when hovered). The widget becomes transparent and click-through. | `Alt + H` |
| **Screenshot** | Click "Screenshot" in Settings. | `Alt + P` |
| **Clear History** | Click the **Trash Can** icon in Settings. | `Alt + X` |
| **Copy Last Command** | Click "Copy" next to a transcript. | `Alt + C` |

---

## 🧠 Modes & Features

Open the **Settings Dashboard** (Expand the widget) to configure these:

### 1. Terminal Mode (The "Paster")
*   **Status:** Toggle button in Settings (`TERMINAL MODE: ON/OFF`).
*   **Behavior:**
    *   **ON:** When the AI generates a command, it **automatically types** it into your currently focused window (e.g., VS Code, PowerShell, Terminal).
    *   **OFF:** Commands are copied to your clipboard only.
*   **Usage:**
    1.  Click the Mic (or `Alt + S`).
    2.  **Click/Focus your target window** (e.g., click inside your Terminal).
    3.  Speak your request (e.g., "Git commit all changes with message 'update'").
    4.  Yap will type `git commit -am "update"` and hit Enter for you.

### 2. Wrappers
Use "Wrappers" to prefix your voice commands automatically:
*   **NONE:** Raw text (e.g., "list files" -> "list files").
*   **GIT:** Prefixes `git` (e.g., "status" -> `git status`).
*   **CLAUDE:** Formats for CLI CLIs (e.g., `claude "how do I..."`).
*   **GEMINI:** Formats for Gemini CLIs.

### 3. Ghost Mode
*   **What is it?** Makes the widget semi-transparent and **lets you click through it**. Great for keeping it on screen without blocking your work.
*   **How to interact?** Hover your mouse over the widget area to "wake it up" and make it clickable again.

---

## 🔧 Troubleshooting

*   **"I can't click the widget!"**
    *   You might be in Ghost Mode. Move your mouse firmly over the center of the widget to wake it.
    *   If stuck, use `Alt + H` to toggle Ghost Mode off.
*   **"It's typing into the wrong window!"**
    *   Ensure you click/focus the window you want *after* starting dictation but *before* you stop speaking. Yap sends keystrokes to the *active* window.
*   **"Tray Icon is invisible"**
    *   This is a known issue in v1.0.0. An update is coming to fix the missing icon asset.
    *   You can still right-click the "blank" spot in the tray to Quit.

---

## 🛑 Quitting
*   **Method 1:** Right-click the Tray Icon -> **Quit**.
*   **Method 2:** Closing the window usually minimizes it to the tray. Use the Tray menu to fully exit.
