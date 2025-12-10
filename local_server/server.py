import os
import sys
import io
import tempfile

# Flush output immediately so Electron can see logs
sys.stdout.reconfigure(line_buffering=True)
sys.stderr.reconfigure(line_buffering=True)

print("[Parakeet] Starting initialization...", flush=True)

try:
    import uvicorn
    from fastapi import FastAPI, UploadFile, File
    from fastapi.middleware.cors import CORSMiddleware
    print("[Parakeet] Core imports successful", flush=True)
except ImportError as e:
    print(f"[Parakeet] Missing dependency: {e}", flush=True)
    print("[Parakeet] Run: pip install fastapi uvicorn python-multipart", flush=True)
    sys.exit(1)

try:
    from pydub import AudioSegment
    print("[Parakeet] pydub import successful", flush=True)
except ImportError as e:
    print(f"[Parakeet] Missing pydub: {e}", flush=True)
    print("[Parakeet] Run: pip install pydub", flush=True)
    print("[Parakeet] Also ensure ffmpeg is installed and in PATH", flush=True)
    sys.exit(1)

app = FastAPI()

# Enable CORS for Electron app
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configuration
MODEL_NAME = "nvidia/parakeet-tdt-0.6b-v2"
HOST = "127.0.0.1"
PORT = 8002

# Model will be loaded lazily on first request to speed up startup
asr_model = None
device = None

def load_model():
    global asr_model, device
    if asr_model is not None:
        return True

    print(f"[Parakeet] Loading Model: {MODEL_NAME}...", flush=True)

    try:
        import torch
        import nemo.collections.asr as nemo_asr

        device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
        print(f"[Parakeet] Running on: {device}", flush=True)

        asr_model = nemo_asr.models.ASRModel.from_pretrained(model_name=MODEL_NAME)
        asr_model = asr_model.to(device)
        asr_model.freeze()
        print("[Parakeet] Model loaded successfully!", flush=True)
        return True
    except ImportError as e:
        print(f"[Parakeet] Missing NeMo/torch: {e}", flush=True)
        print("[Parakeet] Run: pip install nemo_toolkit[asr] torch torchaudio", flush=True)
        return False
    except Exception as e:
        print(f"[Parakeet] Error loading model: {e}", flush=True)
        return False

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    # Lazy load model on first transcription request
    if not load_model():
        return {"error": "Model not loaded. Check server logs for details."}

    try:
        audio_data = await file.read()

        # Use tempfile for safer cross-platform temp file handling
        with tempfile.NamedTemporaryFile(suffix='.wav', delete=False) as tmp:
            temp_filename = tmp.name

        # Convert WebM (from browser) to WAV
        audio = AudioSegment.from_file(io.BytesIO(audio_data))
        audio = audio.set_frame_rate(16000).set_channels(1)
        audio.export(temp_filename, format="wav")

        # Transcribe
        transcript = asr_model.transcribe(paths2audio_files=[temp_filename])[0]

        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return {"text": transcript}

    except Exception as e:
        print(f"[Parakeet] Transcription error: {e}", flush=True)
        return {"error": str(e)}

@app.get("/")
def health():
    return {
        "status": "ok",
        "model": MODEL_NAME,
        "model_loaded": asr_model is not None
    }

@app.get("/health")
def health_check():
    return {"status": "ok"}

if __name__ == "__main__":
    print(f"[Parakeet] Starting server on http://{HOST}:{PORT}", flush=True)
    print("[Parakeet] Model will be loaded on first transcription request", flush=True)
    uvicorn.run(app, host=HOST, port=PORT, log_level="info")
