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

    // --- Gemini API Path ---
    try {
      let base64Audio = '';
      if (audioInput instanceof Blob) {
          base64Audio = await blobToBase64(audioInput);
      } else {
          base64Audio = audioInput;
      }

      // Stricter Agent Prompt (now the stable gemini-pro)
      const isAgent = mode === DictationMode.DEV_CHAT;
      const prompt = isAgent 
        ? `Given the following audio, determine if it represents a clear, actionable command for a developer's CLI.
           Rules:
           1. If the audio is clearly an actionable command (e.g., "git status", "run tests", "deploy app"), output ONLY the command as plain text. Do NOT add any conversational filler, markdown formatting like backticks, or explanations.
           2. If the audio is general speech, background noise, silence, or not a clear command, output NOTHING (an empty string).
           3. Aim for brevity and directness.
           Example 1: Audio "Git status" -> Output "git status"
           Example 2: Audio "Please tell me what the status of the repository is" -> Output "git status"
           Example 3: Audio "Hello there" -> Output "" (empty string)
           Example 4: Audio of silence -> Output "" (empty string)
           `
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