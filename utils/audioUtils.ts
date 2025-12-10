export function base64ToFloat32Array(base64: string): Float32Array {
  const binaryString = atob(base64);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const float32 = new Float32Array(dataInt16.length);
  
  for (let i = 0; i < dataInt16.length; i++) {
    float32[i] = dataInt16[i] / 32768.0;
  }
  return float32;
}

export function float32ArrayToBase64(data: Float32Array): string {
  const l = data.length;
  const int16 = new Int16Array(l);
  for (let i = 0; i < l; i++) {
    // Clamp values to [-1, 1] before converting
    const s = Math.max(-1, Math.min(1, data[i]));
    int16[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  
  let binary = '';
  const bytes = new Uint8Array(int16.buffer);
  const len = bytes.byteLength;
  for (let i = 0; i < len; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function createAudioContexts(sampleRateIn: number = 16000, sampleRateOut: number = 24000) {
  const inputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: sampleRateIn,
  });
  const outputAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)({
    sampleRate: sampleRateOut,
  });
  
  return { inputAudioContext, outputAudioContext };
}

export async function decodeAudioData(
    data: Uint8Array,
    ctx: AudioContext,
    sampleRate: number,
    numChannels: number,
  ): Promise<AudioBuffer> {
    const dataInt16 = new Int16Array(data.buffer);
    const frameCount = dataInt16.length / numChannels;
    const buffer = ctx.createBuffer(numChannels, frameCount, sampleRate);
  
    for (let channel = 0; channel < numChannels; channel++) {
      const channelData = buffer.getChannelData(channel);
      for (let i = 0; i < frameCount; i++) {
        channelData[i] = dataInt16[i * numChannels + channel] / 32768.0;
      }
    }
    return buffer;
  }

  export function decodeBase64ToBytes(base64: string): Uint8Array {
    const binaryString = atob(base64);
    const len = binaryString.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes;
  }

  export async function getMicrophones(): Promise<MediaDeviceInfo[]> {
    try {
        await navigator.mediaDevices.getUserMedia({ audio: true }); // Request permission first
        const devices = await navigator.mediaDevices.enumerateDevices();
        return devices.filter(device => device.kind === 'audioinput');
    } catch (e) {
        console.error("Error fetching microphones:", e);
        return [];
    }
  }

  export function blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64String = (reader.result as string).split(',')[1]; // Remove data:audio/webm;base64, prefix
        resolve(base64String);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }