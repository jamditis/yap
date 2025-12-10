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

      // Stricter Agent Prompt
      const isAgent = mode === DictationMode.DEV_CHAT;
      const prompt = isAgent 
        ? `Listen to this audio. 
           Rules:
           1. If the audio is silent, background noise, or unintelligible, output NOTHING (empty string).
           2. If it contains a request for a terminal command, output ONLY the code (e.g., 'git status').
           3. If it is general speech, transcribe it textually.
           4. Do NOT add markdown blocks.`
        : `Transcribe this audio exactly as spoken. If silent/noise, return empty string.`;

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
      
      // Calculate Cost
      const seconds = durationMs / 1000;
      let costPerSec = 0;
      if (modelName.includes('flash')) costPerSec = 0.00002; // ~$0.07/hour
      if (modelName.includes('pro')) costPerSec = 0.002;   // ~$7.00/hour
      
      const estimatedCost = (seconds * costPerSec).toFixed(6);

      return { text, cost: `$${estimatedCost}` };

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
              throw new Error("Local server error (ensure server.py is running on port 8002)");
          }

          const data = await res.json();
          if (data.error) throw new Error(data.error);
          return data.text || "";
      } catch (e: any) {
          throw new Error("Local Parakeet Error: " + e.message);
      }
  }
}