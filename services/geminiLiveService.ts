import { GoogleGenAI } from "@google/genai";
import { DictationMode } from "../types";
import { blobToBase64 } from "../utils/audioUtils";

export interface TranscribeResult {
    text: string;
    cost: string;
}

export class GeminiLiveService {
  private ai: GoogleGenAI;

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
  }

  public async transcribeAudio(
    audioInput: Blob | string, 
    modelName: string = 'gemini-2.0-flash', 
    mode: DictationMode,
    durationMs: number = 0
  ): Promise<TranscribeResult> {
    
    // --- Local Parakeet Path ---
    if (modelName === 'parakeet-local') {
        if (typeof audioInput === 'string') {
            throw new Error("Local model requires Blob input, not Base64");
        }
        const text = await this.transcribeLocal(audioInput);
        return { text, cost: "$0.00 (Local)" };
    }

    // --- Windows Speech Path (handled in renderer via IPC) ---
    if (modelName === 'windows-speech') {
        // This is handled differently - the renderer calls the main process
        // which runs the PowerShell script. This path shouldn't be reached.
        throw new Error("Windows Speech should be handled via IPC, not here");
    }

    // --- Gemini API Path ---
    try {
      let base64Audio = '';
      if (audioInput instanceof Blob) {
          base64Audio = await blobToBase64(audioInput);
      } else {
          base64Audio = audioInput;
      }

      // Agent mode converts natural language to CLI commands
      const isAgent = mode === DictationMode.DEV_CHAT;
      const prompt = isAgent
        ? `You are a CLI command translator. Your ONLY job is to convert spoken natural language into executable terminal/command prompt commands.

CRITICAL RULES:
1. Output ONLY the raw command - no explanations, no markdown, no backticks, no quotes around the output
2. Convert natural speech into the appropriate CLI command
3. If the speech is unclear, silence, or not command-related, output an empty string

EXAMPLES:
- "git status" → git status
- "show me the git status" → git status
- "list all files" → ls -la
- "list files in the current directory" → dir
- "make a new folder called test" → mkdir test
- "run the dev server" → npm run dev
- "install lodash" → npm install lodash
- "show running processes" → ps aux
- "what's my current directory" → pwd
- "go to the desktop folder" → cd ~/Desktop
- "run python script called main" → python main.py
- "build the project" → npm run build
- "start docker compose" → docker-compose up
- "check disk space" → df -h
- "hello there" → (empty - not a command)
- (silence) → (empty)

Now convert this audio to a CLI command:`
        : `Transcribe this audio exactly as spoken. If the audio contains only silence or background noise, return an empty string.`;

      const response = await this.ai.models.generateContent({
        model: modelName,
        contents: [
          {
            role: 'user',
            parts: [
              { text: prompt },
              { inlineData: { mimeType: 'audio/webm', data: base64Audio } }
            ]
          }
        ]
      });

      const text = response.text?.trim() || "";
      
      // Calculate Cost (Audio)
      const seconds = durationMs / 1000;
      let estimatedCost = "0.00";

      if (modelName.includes('flash')) {
          // Verified: 32 tokens/sec, $2.10 per 1M audio tokens
          const tokens = seconds * 32;
          const cost = (tokens / 1000000) * 2.10;
          estimatedCost = "$" + cost.toFixed(6);
      } else {
          estimatedCost = "Calculated";
      }

      return { text, cost: estimatedCost };

    } catch (error: any) {
      console.error("Transcription Error:", error);
      throw new Error(error.message || "Failed to transcribe audio.");
    }
  }

  private async transcribeLocal(blob: Blob): Promise<string> {
      try {
          const formData = new FormData();
          formData.append('file', blob, 'audio.webm');

          const res = await fetch('http://localhost:8002/transcribe', {
              method: 'POST',
              body: formData
          });

          if (!res.ok) {
              const errorText = await res.text();
              throw new Error(`Local server returned status ${res.status}: ${errorText || 'Unknown error'}. Ensure server.py is running on port 8002 and model is loaded.`);
          }

          const data = await res.json();
          if (data.error) throw new Error(data.error);
          return data.text || "";
      } catch (e: any) {
          throw new Error("Local Parakeet Error: " + e.message + ". Check server console for details.");
      }
  }
}