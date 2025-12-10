export interface DictationState {
  isListening: boolean;
  isConnected: boolean;
  error: string | null;
  transcripts: TranscriptItem[];
  mode: DictationMode;
}

export enum DictationMode {
  RAW = 'RAW',
  DEV_CHAT = 'DEV_CHAT' // Optimized for talking to CLI agents
}

export type CliWrapperType = 'NONE' | 'CLAUDE' | 'GEMINI' | 'GIT';

export interface TranscriptItem {
  id: string;
  text: string;
  originalText: string; 
  source: 'user' | 'model';
  timestamp: number;
  isFinal: boolean;
  model?: string;
  cost?: string; // Estimated cost string
}

export interface AudioConfig {
  sampleRate: number;
}
