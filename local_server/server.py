import os
import io
import uvicorn
from fastapi import FastAPI, UploadFile, File
from pydub import AudioSegment
import nemo.collections.asr as nemo_asr
import torch

app = FastAPI()

# Configuration
MODEL_NAME = "nvidia/parakeet-tdt-0.6b-v2"
HOST = "127.0.0.1"
PORT = 8002

print(f"Loading Model: {MODEL_NAME}...")
# Check for GPU
device = torch.device("cuda" if torch.cuda.is_available() else "cpu")
print(f"Running on: {device}")

try:
    # Load the model
    asr_model = nemo_asr.models.ASRModel.from_pretrained(model_name=MODEL_NAME)
    asr_model = asr_model.to(device)
    asr_model.freeze() # Inference mode
    print("Model loaded successfully!")
except Exception as e:
    print(f"Error loading model: {e}")
    print("Ensure you have 'nemo_toolkit[asr]' installed.")
    exit(1)

@app.post("/transcribe")
async def transcribe(file: UploadFile = File(...)):
    try:
        # 1. Read Audio Data
        audio_data = await file.read()
        
        # 2. Convert to WAV (NeMo expects wav files usually, or paths)
        # We'll save to a temp file because NeMo transcribe accepts paths
        temp_filename = "temp_audio.wav"
        
        # Convert WebM (from browser) to WAV
        audio = AudioSegment.from_file(io.BytesIO(audio_data))
        audio = audio.set_frame_rate(16000).set_channels(1) # NeMo defaults
        audio.export(temp_filename, format="wav")

        # 3. Transcribe
        # NeMo's transcribe method expects a list of file paths
        transcript = asr_model.transcribe(paths2audio_files=[temp_filename])[0]
        
        # Cleanup
        if os.path.exists(temp_filename):
            os.remove(temp_filename)

        return {"text": transcript}

    except Exception as e:
        print(f"Transcription error: {e}")
        return {"error": str(e)}

@app.get("/")
def health():
    return {"status": "ok", "model": MODEL_NAME}

if __name__ == "__main__":
    print(f"Starting Parakeet Server on http://{HOST}:{PORT}")
    uvicorn.run(app, host=HOST, port=PORT)
