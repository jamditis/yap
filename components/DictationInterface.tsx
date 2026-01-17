import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { DictationMode, TranscriptItem, CliWrapperType } from '../types';
import { GeminiLiveService } from '../services/geminiLiveService';
import { blobToBase64, getMicrophones } from '../utils/audioUtils';

// Audio visualizer component
const AudioWaveform: React.FC<{ audioLevel: number; isRecording: boolean }> = ({ audioLevel, isRecording }) => {
  const bars = 12;
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex items-center justify-center gap-[2px]" style={{ transform: 'rotate(-90deg)' }}>
        {Array.from({ length: bars }).map((_, i) => {
          const angle = (i / bars) * Math.PI;
          const heightMultiplier = Math.sin(angle) * 0.5 + 0.5;
          const targetHeight = isRecording ? Math.max(4, audioLevel * heightMultiplier * 28) : 4;
          return (
            <div
              key={i}
              className="w-[3px] rounded-full transition-all duration-75"
              style={{
                height: `${targetHeight}px`,
                backgroundColor: isRecording ? `rgba(0, 255, 65, ${0.4 + audioLevel * 0.6})` : 'rgba(0, 255, 65, 0.2)',
              }}
            />
          );
        })}
      </div>
    </div>
  );
};

// --- Icons ---
const MicIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-8 h-8">
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 18.75a6 6 0 006-6v-1.5m-6 7.5a6 6 0 01-6-6v-1.5m6 7.5v3.75m-3.75 0h7.5M12 1.5a3 3 0 013 3v4.5a3 3 0 01-6 0v-4.5a3 3 0 013-3z" />
  </svg>
);
const StopIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" fill="currentColor" viewBox="0 0 24 24" className="w-8 h-8">
    <rect x="6" y="6" width="12" height="12" rx="2" />
  </svg>
);
const TrashIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12 .562c.34-.059.68-.114 1.022-.165m0 0a48.11 48.11 0 013.478-.397m7.5 0v-.916c0-1.18-.91-2.164-2.09-2.201a51.964 51.964 0 00-3.32 0c-1.18.037-2.09 1.022-2.09 2.201v.916m7.5 0a48.667 48.667 0 00-7.5 0" />
    </svg>
);
const SpinnerIcon = () => (
    <svg className="animate-spin h-5 w-5 text-terminal-green" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);
const HelpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9.879 7.519c1.171-1.025 3.071-1.025 4.242 0 1.172 1.025 1.172 2.687 0 3.712-.203.179-.43.326-.67.442-.745.361-1.45.999-1.45 1.827v.75M21 12a9 9 0 11-18 0 9 9 0 0118 0zm-9 5.25h.008v.008H12v-.008z" />
    </svg>
);
const CloseIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
        <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
    </svg>
);

// Tooltip component
const Tooltip: React.FC<{ text: string; children: React.ReactNode; position?: 'top' | 'bottom' }> = ({ text, children, position = 'top' }) => {
    const [show, setShow] = useState(false);
    return (
        <div className="relative inline-flex" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
            {children}
            {show && (
                <div className={`absolute z-50 px-2 py-1 text-[10px] font-medium text-white bg-gray-900 border border-gray-700 rounded shadow-lg whitespace-nowrap ${
                    position === 'top' ? 'bottom-full mb-2 left-1/2 -translate-x-1/2' : 'top-full mt-2 left-1/2 -translate-x-1/2'
                }`}>
                    {text}
                    <div className={`absolute w-2 h-2 bg-gray-900 border-gray-700 transform rotate-45 left-1/2 -translate-x-1/2 ${
                        position === 'top' ? 'top-full -mt-1 border-r border-b' : 'bottom-full -mb-1 border-l border-t'
                    }`} />
                </div>
            )}
        </div>
    );
};

// Help Modal component
const HelpModal: React.FC<{ isOpen: boolean; onClose: () => void }> = ({ isOpen, onClose }) => {
    if (!isOpen) return null;
    return (
        <div className="fixed inset-0 bg-black/80 z-50 flex items-center justify-center p-4" onClick={onClose}>
            <div className="bg-[#0c0c0c] border border-gray-700 rounded-lg max-w-md w-full max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
                <div className="flex justify-between items-center p-4 border-b border-gray-800 sticky top-0 bg-[#0c0c0c]">
                    <h2 className="text-lg font-bold text-terminal-green">Yap User Guide</h2>
                    <button onClick={onClose} className="p-1 hover:bg-gray-800 rounded text-gray-400 hover:text-white">
                        <CloseIcon />
                    </button>
                </div>
                <div className="p-4 space-y-4 text-sm text-gray-300">
                    <section>
                        <h3 className="text-terminal-green font-bold mb-2">Keyboard Shortcuts</h3>
                        <div className="space-y-1 text-xs">
                            <div className="flex justify-between"><span className="text-gray-400">Start/Stop Recording</span><kbd className="bg-gray-800 px-2 py-0.5 rounded">Alt+S</kbd></div>
                            <div className="flex justify-between"><span className="text-gray-400">Show/Hide Window</span><kbd className="bg-gray-800 px-2 py-0.5 rounded">Alt+H</kbd></div>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-terminal-green font-bold mb-2">Basic Workflow</h3>
                        <ol className="list-decimal list-inside space-y-1 text-xs text-gray-400">
                            <li>Focus your terminal (Claude Code, PowerShell, etc.)</li>
                            <li>Press <kbd className="bg-gray-800 px-1 rounded">Alt+S</kbd> to start recording</li>
                            <li>Speak your command or text</li>
                            <li>Press <kbd className="bg-gray-800 px-1 rounded">Alt+S</kbd> again to stop</li>
                            <li>Right-click in your terminal to paste</li>
                        </ol>
                    </section>
                    <section>
                        <h3 className="text-terminal-green font-bold mb-2">Transcription Models</h3>
                        <div className="space-y-2 text-xs">
                            <div><span className="text-blue-400 font-bold">Gemini 2.0/2.5 Flash</span> <span className="text-gray-500">- Cloud-based, high quality, supports Agent mode</span></div>
                            <div><span className="text-yellow-400 font-bold">Parakeet</span> <span className="text-gray-500">- Local NVIDIA GPU, free, requires setup</span></div>
                            <div><span className="text-green-400 font-bold">Windows Speech</span> <span className="text-gray-500">- Built-in, no setup, works offline</span></div>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-terminal-green font-bold mb-2">Mode Settings</h3>
                        <div className="space-y-2 text-xs">
                            <div><span className="text-terminal-green font-bold">AUTO-COPY</span> <span className="text-gray-500">- Automatically copy transcription to clipboard</span></div>
                            <div><span className="text-blue-400 font-bold">PASTE</span> <span className="text-gray-500">- Enable clipboard integration for terminal paste</span></div>
                            <div><span className="text-purple-400 font-bold">AGENT MODE</span> <span className="text-gray-500">- Convert natural speech to CLI commands (Gemini only)</span></div>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-terminal-green font-bold mb-2">Agent Mode Examples</h3>
                        <div className="space-y-1 text-xs font-mono bg-gray-900 p-2 rounded">
                            <div><span className="text-gray-500">"show git status"</span> <span className="text-terminal-green">git status</span></div>
                            <div><span className="text-gray-500">"list all files"</span> <span className="text-terminal-green">ls -la</span></div>
                            <div><span className="text-gray-500">"make folder called test"</span> <span className="text-terminal-green">mkdir test</span></div>
                            <div><span className="text-gray-500">"install lodash"</span> <span className="text-terminal-green">npm install lodash</span></div>
                        </div>
                    </section>
                    <section>
                        <h3 className="text-terminal-green font-bold mb-2">Troubleshooting</h3>
                        <div className="space-y-1 text-xs text-gray-400">
                            <div><span className="text-white">No transcription?</span> Check API key in .env.local</div>
                            <div><span className="text-white">Paste not working?</span> Right-click to paste in Claude Code</div>
                            <div><span className="text-white">Parakeet errors?</span> Check Python + CUDA + FFmpeg installed</div>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
};

export const DictationInterface: React.FC = () => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [mode, setMode] = useState<DictationMode>(DictationMode.DEV_CHAT);
  const [transcripts, setTranscripts] = useState<TranscriptItem[]>([]);
  const [error, setError] = useState<string | null>(null);
  
  const [autoCopy, setAutoCopy] = useState(true);
  const [terminalMode, setTerminalMode] = useState(false);
  const [cliWrapper, setCliWrapper] = useState<CliWrapperType>('NONE');
  const [selectedMic, setSelectedMic] = useState<string>('');
  const [mics, setMics] = useState<MediaDeviceInfo[]>([]);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-2.0-flash');
  
  const [toast, setToast] = useState<{msg: string, type: 'info' | 'error' | 'success'} | null>(null);
  const [lastCopiedId, setLastCopiedId] = useState<string | null>(null);
  const [audioLevel, setAudioLevel] = useState(0);
  const [showHelp, setShowHelp] = useState(false);

  const serviceRef = useRef<GeminiLiveService | null>(null);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const startTimeRef = useRef<number>(0);
  const isRecordingRef = useRef(isRecording);
  const selectedModelRef = useRef(selectedModel);
  const modeRef = useRef(mode);
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number>(0);
  const speechRecognitionRef = useRef<any>(null);
  const [liveTranscript, setLiveTranscript] = useState<string>('');

  useEffect(() => { isRecordingRef.current = isRecording; }, [isRecording]);
  useEffect(() => { selectedModelRef.current = selectedModel; }, [selectedModel]);
  useEffect(() => { modeRef.current = mode; }, [mode]);

  useEffect(() => {
    serviceRef.current = new GeminiLiveService();
    getMicrophones().then(devices => {
        setMics(devices);
        if (devices.length > 0) setSelectedMic(devices[0].deviceId);
    });
    // @ts-ignore
    if (window.electron) setTerminalMode(true);
  }, []);

  useEffect(() => {
      // @ts-ignore
      if (window.electron && window.electron.onToggleListening) {
          // @ts-ignore
          window.electron.onToggleListening(() => {
              toggleRecording();
          });
      }
  }, [selectedMic]); 

  const showToast = (msg: string, type: 'info' | 'error' | 'success' = 'info') => {
      setToast({ msg, type });
      setTimeout(() => setToast(null), 3000);
  };

  const wrapText = useCallback((text: string, wrapper: CliWrapperType): string => {
      const clean = text.trim();
      switch(wrapper) {
          case 'CLAUDE': return `claude "${clean}"`;
          case 'GEMINI': return `gemini "${clean}"`; 
          case 'GIT': return `git ${clean}`; 
          default: return clean;
      }
  }, []);

  const handleCopy = useCallback(async (text: string, id?: string) => {
    if (!text) return;
    // @ts-ignore
    if (window.electron && terminalMode) {
        try {
            // @ts-ignore
            const result = await window.electron.pasteText(text);
            if (id) setLastCopiedId(id);
            if (result?.success) {
                // @ts-ignore
                window.electron.playSound?.('success');
                showToast("Ready - right-click to paste", 'success');
            } else {
                // @ts-ignore
                window.electron.playSound?.('error');
                showToast("Paste failed", 'error');
            }
        } catch (e) {
            // @ts-ignore
            window.electron.playSound?.('error');
            showToast("Paste error", 'error');
        }
        return;
    }
    navigator.clipboard.writeText(text).then(() => {
        if (id) setLastCopiedId(id);
        setTimeout(() => setLastCopiedId(null), 1000);
        showToast("Copied to Clipboard", 'success');
    });
  }, [terminalMode]);

  // Web Speech API for live local transcription
  const startWebSpeechRecognition = async () => {
      const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      if (!SpeechRecognition) {
          showToast("Speech recognition not supported in this environment", 'error');
          // @ts-ignore
          window.electron?.playSound?.('error');
          console.error('[Yap] SpeechRecognition API not available');
          return;
      }
      console.log('[Yap] Starting Web Speech recognition...');

      // Get mic stream for audio visualization
      const stream = await navigator.mediaDevices.getUserMedia({
          audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined }
      });

      // Set up audio analyzer for visualization
      audioContextRef.current = new AudioContext();
      analyserRef.current = audioContextRef.current.createAnalyser();
      analyserRef.current.fftSize = 256;
      const source = audioContextRef.current.createMediaStreamSource(stream);
      source.connect(analyserRef.current);

      const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
      const updateLevel = () => {
          if (analyserRef.current && isRecordingRef.current) {
              analyserRef.current.getByteFrequencyData(dataArray);
              const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
              setAudioLevel(average / 255);
              animationFrameRef.current = requestAnimationFrame(updateLevel);
          }
      };
      updateLevel();

      const recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';

      let finalTranscript = '';

      recognition.onresult = (event: any) => {
          let interimTranscript = '';
          for (let i = event.resultIndex; i < event.results.length; i++) {
              const transcript = event.results[i][0].transcript;
              if (event.results[i].isFinal) {
                  finalTranscript += transcript + ' ';
              } else {
                  interimTranscript = transcript;
              }
          }
          setLiveTranscript(finalTranscript + interimTranscript);
      };

      recognition.onend = () => {
          // Clean up
          stream.getTracks().forEach(t => t.stop());
          cancelAnimationFrame(animationFrameRef.current);
          if (audioContextRef.current) {
              audioContextRef.current.close();
              audioContextRef.current = null;
          }
          setAudioLevel(0);
          setIsRecording(false);
          setIsProcessing(false);

          const text = finalTranscript.trim();
          if (text) {
              const newItem: TranscriptItem = {
                  id: Date.now().toString(),
                  text: text,
                  originalText: text,
                  source: 'model',
                  timestamp: Date.now(),
                  isFinal: true,
                  model: 'web-speech',
                  cost: '$0.00 (Local)'
              };
              setTranscripts(prev => [newItem, ...prev].slice(0, 30));

              if (autoCopy) {
                  const formatted = wrapText(text, cliWrapper);
                  handleCopy(formatted, newItem.id);
              }
          }
          setLiveTranscript('');
      };

      recognition.onerror = (event: any) => {
          console.error('Speech recognition error:', event.error);
          if (event.error !== 'no-speech') {
              showToast(`Speech error: ${event.error}`, 'error');
          }
      };

      speechRecognitionRef.current = recognition;
      // Store stream reference for cleanup
      (recognition as any)._stream = stream;
      recognition.start();
      setIsRecording(true);
      // @ts-ignore - Notify main process for tray status
      if (window.electron?.setRecordingStatus) window.electron.setRecordingStatus(true);
      setLiveTranscript('');
      showToast("Listening (Live)...", 'info');
  };

  const stopWebSpeechRecognition = () => {
      if (speechRecognitionRef.current) {
          speechRecognitionRef.current.stop();
          speechRecognitionRef.current = null;
      }
  };

  // Windows Speech Recognition - truly local, no internet required
  const startWindowsSpeechRecognition = async () => {
      // @ts-ignore
      if (!window.electron?.windowsSpeechRecognize) {
          showToast("Windows Speech not available", 'error');
          return;
      }

      setIsRecording(true);
      // @ts-ignore
      if (window.electron?.setRecordingStatus) window.electron.setRecordingStatus(true);
      showToast("Listening (Windows Speech)...", 'info');

      try {
          // @ts-ignore - Call main process to run PowerShell speech recognition
          const result = await window.electron.windowsSpeechRecognize(10); // 10 second timeout

          setIsRecording(false);
          // @ts-ignore
          if (window.electron?.setRecordingStatus) window.electron.setRecordingStatus(false);

          if (result.success && result.text) {
              const newItem: TranscriptItem = {
                  id: Date.now().toString(),
                  text: result.text,
                  originalText: result.text,
                  source: 'model',
                  timestamp: Date.now(),
                  isFinal: true,
                  model: 'windows-speech',
                  cost: '$0.00 (Local)'
              };
              setTranscripts(prev => [newItem, ...prev].slice(0, 30));

              if (autoCopy) {
                  const formatted = wrapText(result.text, cliWrapper);
                  handleCopy(formatted, newItem.id);
              }
          } else if (result.error) {
              showToast(`Speech error: ${result.error}`, 'error');
          } else {
              showToast("No speech detected", 'info');
          }
      } catch (e: any) {
          setIsRecording(false);
          // @ts-ignore
          if (window.electron?.setRecordingStatus) window.electron.setRecordingStatus(false);
          showToast(`Error: ${e.message}`, 'error');
      }
  };

  const startRecording = async () => {
      // Use Web Speech API for local model (deprecated - requires internet)
      if (selectedModel === 'web-speech') {
          await startWebSpeechRecognition();
          return;
      }

      // Use Windows Speech Recognition (truly local, no internet)
      if (selectedModel === 'windows-speech') {
          await startWindowsSpeechRecognition();
          return;
      }

      try {
          const stream = await navigator.mediaDevices.getUserMedia({
              audio: { deviceId: selectedMic ? { exact: selectedMic } : undefined }
          });

          // Set up audio analyzer for visualization
          audioContextRef.current = new AudioContext();
          analyserRef.current = audioContextRef.current.createAnalyser();
          analyserRef.current.fftSize = 256;
          const source = audioContextRef.current.createMediaStreamSource(stream);
          source.connect(analyserRef.current);

          // Start analyzing audio levels
          const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
          const updateLevel = () => {
              if (analyserRef.current && isRecordingRef.current) {
                  analyserRef.current.getByteFrequencyData(dataArray);
                  const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
                  setAudioLevel(average / 255); // Normalize to 0-1
                  animationFrameRef.current = requestAnimationFrame(updateLevel);
              }
          };
          updateLevel();

          const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });
          mediaRecorderRef.current = recorder;
          chunksRef.current = [];
          startTimeRef.current = Date.now();

          recorder.ondataavailable = (e) => {
              if (e.data.size > 0) chunksRef.current.push(e.data);
          };

          recorder.onstop = async () => {
              stream.getTracks().forEach(t => t.stop());
              // Clean up audio analyzer
              cancelAnimationFrame(animationFrameRef.current);
              if (audioContextRef.current) {
                  audioContextRef.current.close();
                  audioContextRef.current = null;
              }
              setAudioLevel(0);

              const blob = new Blob(chunksRef.current, { type: 'audio/webm' });
              const duration = Date.now() - startTimeRef.current;
              await processAudio(blob, duration);
          };

          recorder.start();
          setIsRecording(true);
          // @ts-ignore - Notify main process for tray status
          if (window.electron?.setRecordingStatus) window.electron.setRecordingStatus(true);
          showToast("Listening...", 'info');
          setError(null);
      } catch (e: any) {
          console.error(e);
          setError("Mic Error: " + e.message);
          showToast("Mic Error", 'error');
      }
  };

  const stopRecording = () => {
      // @ts-ignore - Notify main process for tray status
      if (window.electron?.setRecordingStatus) window.electron.setRecordingStatus(false);

      // Handle Web Speech API
      if (speechRecognitionRef.current) {
          stopWebSpeechRecognition();
          return;
      }
      // Handle MediaRecorder (Gemini models)
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
          setIsProcessing(true);
      }
  };

  const toggleRecording = () => {
      if (isRecordingRef.current) stopRecording();
      else startRecording();
  };

  const processAudio = async (blob: Blob, durationMs: number) => {
      try {
          const currentModel = selectedModelRef.current;
          const currentMode = modeRef.current;

          // Web Speech is handled separately via its own recognition.onend
          if (currentModel === 'web-speech') {
              console.log('[Yap] Skipping processAudio for web-speech model');
              setIsProcessing(false);
              return;
          }

          console.log('[Yap] Processing audio with model:', currentModel);

          // Pass durationMs to service to calculate cost
          const result = await serviceRef.current?.transcribeAudio(blob, currentModel, currentMode, durationMs);
          
          setIsProcessing(false);

          if (result && result.text) {
              const newItem: TranscriptItem = {
                  id: Date.now().toString(),
                  text: result.text,
                  originalText: result.text,
                  source: 'model',
                  timestamp: Date.now(),
                  isFinal: true,
                  model: currentModel,
                  cost: result.cost
              };
              
              setTranscripts(prev => [newItem, ...prev].slice(0, 30)); 
              
              if (autoCopy) {
                  const formatted = wrapText(result.text, cliWrapper);
                  handleCopy(formatted, newItem.id);
              }
          } else {
              showToast("No speech detected", 'info');
          }

      } catch (e: any) {
          setIsProcessing(false);
          setError(e.message);
          showToast("Transcription Failed", 'error');
      }
  };

  return (
    <div className="h-screen w-full bg-[#0c0c0c] text-gray-200 flex flex-col p-4 overflow-hidden relative">
        {toast && (
            <div className={`absolute top-4 left-1/2 -translate-x-1/2 px-4 py-2 rounded shadow-lg z-50 text-xs font-bold animate-in fade-in slide-in-from-top-2 duration-200 ${
                toast.type === 'error' ? 'bg-red-900 text-white' : 
                toast.type === 'success' ? 'bg-terminal-green text-black' : 
                'bg-gray-800 text-white'
            }`}>
                {toast.msg}
            </div>
        )}

        <HelpModal isOpen={showHelp} onClose={() => setShowHelp(false)} />

        <div className="flex justify-between items-center mb-4 border-b border-gray-800 pb-4">
            <h1 className="text-xl font-mono font-bold text-terminal-green tracking-tighter">YAP v1.2</h1>
            <div className="flex gap-2">
                <Tooltip text="User Guide">
                    <button onClick={() => setShowHelp(true)} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-terminal-green transition-colors">
                        <HelpIcon/>
                    </button>
                </Tooltip>
                <Tooltip text="Clear History">
                    <button onClick={() => setTranscripts([])} className="p-2 hover:bg-gray-800 rounded text-gray-400 hover:text-red-500 transition-colors">
                        <TrashIcon/>
                    </button>
                </Tooltip>
            </div>
        </div>

        <div className="flex flex-col items-center justify-center min-h-[140px] mb-4">
            <div className="relative">
                {/* Outer pulsing ring when recording with audio */}
                {isRecording && (
                    <div
                        className="absolute inset-[-8px] rounded-full border-2 border-terminal-green/30 animate-ping"
                        style={{ opacity: audioLevel * 0.5 }}
                    />
                )}
                {/* Audio level ring */}
                {isRecording && (
                    <div
                        className="absolute inset-[-4px] rounded-full border-2 transition-all duration-75"
                        style={{
                            borderColor: `rgba(0, 255, 65, ${0.2 + audioLevel * 0.6})`,
                            transform: `scale(${1 + audioLevel * 0.15})`,
                        }}
                    />
                )}
                <button
                    onClick={toggleRecording}
                    disabled={isProcessing}
                    className={`relative w-20 h-20 rounded-full flex items-center justify-center transition-all duration-200 ${
                        isProcessing ? 'bg-gray-800 border-4 border-gray-700 cursor-wait' :
                        isRecording
                        ? 'bg-terminal-green/10 text-terminal-green border-4 border-terminal-green shadow-[0_0_30px_rgba(0,255,65,0.4)]'
                        : 'bg-terminal-green/10 text-terminal-green border-4 border-terminal-green shadow-[0_0_15px_rgba(0,255,65,0.2)] hover:scale-105'
                    }`}
                    style={isRecording ? { transform: `scale(${1 + audioLevel * 0.08})` } : undefined}
                >
                    {isRecording && <AudioWaveform audioLevel={audioLevel} isRecording={isRecording} />}
                    <span className="relative z-10">
                        {isProcessing ? <SpinnerIcon /> : isRecording ? <StopIcon /> : <MicIcon />}
                    </span>
                </button>
            </div>
            <div className="mt-3 text-xs font-mono text-gray-500 uppercase tracking-widest">
                {isProcessing ? "TRANSCRIBING..." : isRecording ? "RECORDING..." : "READY (Alt+S)"}
            </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="flex flex-col">
                <label className="text-[10px] text-gray-500 font-bold mb-1">MICROPHONE</label>
                <select 
                    value={selectedMic} 
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="bg-gray-900 border border-gray-800 text-xs rounded p-2 text-gray-300 focus:border-terminal-green focus:outline-none"
                >
                    {mics.map(m => (
                        <option key={m.deviceId} value={m.deviceId}>{m.label || `Mic ${m.deviceId.slice(0,4)}...`}</option>
                    ))}
                    {mics.length === 0 && <option value="">Default (System)</option>}
                </select>
            </div>

            {/* Model Select */}
            <div className="flex flex-col">
                <label className="text-[10px] text-gray-500 font-bold mb-1">MODEL</label>
                <select
                    value={selectedModel}
                    onChange={(e) => {
                        setSelectedModel(e.target.value);
                        // Force RAW mode for local models since they can't do instruction-following
                        if ((e.target.value === 'parakeet-local' || e.target.value === 'windows-speech') && mode === DictationMode.DEV_CHAT) {
                            setMode(DictationMode.RAW);
                            showToast("Local models only support RAW mode", 'info');
                        }
                    }}
                    className="bg-gray-900 border border-gray-800 text-xs rounded p-2 text-gray-300 focus:border-terminal-green focus:outline-none"
                >
                    <option value="gemini-2.0-flash">Gemini 2.0 Flash</option>
                    <option value="gemini-2.5-flash">Gemini 2.5 Flash</option>
                    <option value="parakeet-local">Parakeet (Local/GPU)</option>
                    <option value="windows-speech">Windows Speech (Local/CPU)</option>
                </select>
            </div>
        </div>

        <div className="flex gap-2 mb-4">
             <Tooltip text="Auto-copy transcription to clipboard" position="bottom">
                 <button onClick={() => setAutoCopy(!autoCopy)}
                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-colors ${autoCopy ? 'border-terminal-green text-terminal-green bg-terminal-green/5' : 'border-gray-800 text-gray-600'}`}>
                    AUTO-COPY: {autoCopy ? 'ON' : 'OFF'}
                 </button>
             </Tooltip>
             <Tooltip text="Enable clipboard for terminal paste" position="bottom">
                 <button onClick={() => setTerminalMode(!terminalMode)}
                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-colors ${terminalMode ? 'border-blue-500 text-blue-400 bg-blue-500/10' : 'border-gray-800 text-gray-600'}`}>
                    PASTE: {terminalMode ? 'ON' : 'OFF'}
                 </button>
             </Tooltip>
             <Tooltip text={mode === DictationMode.DEV_CHAT ? "Convert speech to CLI commands" : "Transcribe speech verbatim"} position="bottom">
                 <button
                    onClick={() => {
                        if (selectedModel === 'parakeet-local' || selectedModel === 'windows-speech') {
                            showToast("Agent mode requires Gemini", 'info');
                            return;
                        }
                        setMode(mode === DictationMode.RAW ? DictationMode.DEV_CHAT : DictationMode.RAW);
                    }}
                    className={`flex-1 py-2 text-[10px] font-bold border rounded transition-colors ${
                        (selectedModel === 'parakeet-local' || selectedModel === 'windows-speech')
                            ? 'border-gray-800 text-gray-700 cursor-not-allowed'
                            : mode === DictationMode.DEV_CHAT
                            ? 'border-purple-500 text-purple-400 bg-purple-500/10'
                            : 'border-gray-800 text-gray-600'
                    }`}
                    disabled={selectedModel === 'parakeet-local' || selectedModel === 'windows-speech'}
                 >
                    {mode === DictationMode.DEV_CHAT ? 'AGENT MODE' : 'RAW MODE'}
                 </button>
             </Tooltip>
        </div>

        {/* Live transcript preview for Web Speech */}
        {liveTranscript && (
            <div className="mb-3 p-3 bg-terminal-green/5 border border-terminal-green/30 rounded-lg animate-pulse">
                <div className="text-[10px] text-terminal-green font-bold mb-1">LIVE TRANSCRIPTION</div>
                <div className="text-sm text-gray-300 font-mono">{liveTranscript}</div>
            </div>
        )}

        <div className="flex-1 overflow-y-auto bg-black border border-gray-800 rounded-lg p-3 font-mono text-xs space-y-3 shadow-inner">
            {transcripts.length === 0 && !liveTranscript && <div className="text-center text-gray-700 mt-10 italic">History is empty.</div>}
            {transcripts.map((t, i) => (
                <div key={t.id} className="flex flex-col items-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                    <div className="w-full bg-gray-900/80 p-3 rounded border border-gray-800 hover:border-gray-600 transition-colors group relative">
                        <div className="flex justify-between items-center mb-1 border-b border-gray-800/50 pb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-terminal-green font-bold">
                                    {new Date(t.timestamp).toLocaleTimeString()}
                                </span>
                                <span className="text-[9px] text-gray-500 bg-gray-800 px-1 rounded">
                                    {t.model}
                                </span>
                                <span className="text-[9px] text-gray-500">
                                    {t.cost}
                                </span>
                            </div>
                            <div className="flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button 
                                    onClick={() => handleCopy(wrapText(t.text, cliWrapper), t.id)}
                                    className="text-[9px] bg-gray-700 hover:bg-gray-600 px-2 py-0.5 rounded text-white"
                                >
                                    COPY
                                </button>
                            </div>
                        </div>
                        <span className="text-gray-300 whitespace-pre-wrap leading-relaxed block selection:bg-terminal-green selection:text-black pt-1">
                            {t.source === 'model' ? wrapText(t.text, cliWrapper) : t.text}
                        </span>
                    </div>
                </div>
            ))}
        </div>
    </div>
  );
};