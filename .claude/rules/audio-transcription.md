# Audio & Transcription Rules

## Supported Models
1. **Gemini 2.0/2.5 Flash** - Cloud API, supports Agent mode
2. **Parakeet (Local/GPU)** - NVIDIA GPU required, FastAPI server on port 8002
3. **Windows Speech (Local/CPU)** - Built-in Windows SAPI, PowerShell script

## Audio Recording
- Use MediaRecorder API with `audio/webm` MIME type
- AudioContext + AnalyserNode for real-time visualization
- Clean up streams and contexts in `recorder.onstop`

## Transcription Flow
```
Recording → Blob → Base64 (Gemini) or FormData (Parakeet) → API → Result
```

## Agent Mode (Gemini only)
- Converts natural language to CLI commands
- System prompt in `geminiLiveService.ts`
- Local models don't support instruction-following, force RAW mode

## Cost Calculation
- Gemini: ~32 tokens/sec of audio
- Local models: $0.00

## Error Handling
- Show toast notifications for user-facing errors
- Log detailed errors to console with `[Yap]` prefix
- Play sound feedback: start, stop, success, error
