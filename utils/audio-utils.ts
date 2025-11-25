import { Blob } from '@google/genai';

// Convert Float32 audio from AudioContext to Int16 PCM for Gemini
export function float32To16BitPCM(float32Arr: Float32Array): Int16Array {
  const int16Arr = new Int16Array(float32Arr.length);
  for (let i = 0; i < float32Arr.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Arr[i]));
    int16Arr[i] = s < 0 ? s * 0x8000 : s * 0x7FFF;
  }
  return int16Arr;
}

// Create a blob payload for Gemini Live API
export function createAudioBlob(data: Float32Array, sampleRate: number): Blob {
  const int16 = float32To16BitPCM(data);
  const base64 = btoa(
    String.fromCharCode(...new Uint8Array(int16.buffer))
  );
  return {
    data: base64,
    mimeType: `audio/pcm;rate=${sampleRate}`,
  };
}

// Decode raw PCM base64 string from Gemini into an AudioBuffer
export function decodeAudioData(
  base64String: string,
  ctx: AudioContext,
  sampleRate: number = 24000
): AudioBuffer {
  const binaryString = atob(base64String);
  const len = binaryString.length;
  const bytes = new Uint8Array(len);
  for (let i = 0; i < len; i++) {
    bytes[i] = binaryString.charCodeAt(i);
  }
  
  const dataInt16 = new Int16Array(bytes.buffer);
  const buffer = ctx.createBuffer(1, dataInt16.length, sampleRate);
  const channelData = buffer.getChannelData(0);
  
  for (let i = 0; i < dataInt16.length; i++) {
    channelData[i] = dataInt16[i] / 32768.0;
  }
  
  return buffer;
}

export async function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      const base64 = result.split(',')[1];
      resolve(base64);
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob as any);
  });
}
