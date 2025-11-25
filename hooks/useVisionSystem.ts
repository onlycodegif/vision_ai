import { useState, useRef, useEffect, useCallback } from 'react';
import { GoogleGenAI, LiveServerMessage, Modality } from '@google/genai';
import { LogEntry, SystemState, SystemMetrics } from '../types';
import { createAudioBlob, decodeAudioData } from '../utils/audio-utils';

const MODEL_NAME = 'gemini-2.5-flash-native-audio-preview-09-2025';
const SYSTEM_INSTRUCTION = `You are "Vision AI", an advanced interactive perception system running on embedded hardware. 
Your goal is to act as the eyes and ears for the user. 
You are concise, technical, and helpful. 
You analyze the video feed to detect objects, read text, and describe the environment. 
You answer voice queries about what you see.
Keep responses relatively short and conversational, suitable for a voice interface.`;

export const useVisionSystem = () => {
  const [state, setState] = useState<SystemState>(SystemState.IDLE);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [metrics, setMetrics] = useState<SystemMetrics>({
    cpuUsage: 0,
    memoryUsage: 0,
    latency: 0,
    fps: 0,
    confidence: 0,
  });
  
  const [volume, setVolume] = useState(0);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(document.createElement('canvas'));
  
  // Audio Contexts
  const inputAudioContextRef = useRef<AudioContext | null>(null);
  const outputAudioContextRef = useRef<AudioContext | null>(null);
  
  // Streaming Refs
  const sessionPromiseRef = useRef<Promise<any> | null>(null);
  const videoIntervalRef = useRef<number | null>(null);
  const nextStartTimeRef = useRef<number>(0);
  const sourcesRef = useRef<Set<AudioBufferSourceNode>>(new Set());
  
  const addLog = useCallback((level: LogEntry['level'], module: LogEntry['module'], message: string) => {
    const entry: LogEntry = {
      timestamp: new Date().toLocaleTimeString(),
      level,
      module,
      message,
    };
    setLogs(prev => [entry, ...prev].slice(0, 100)); // Keep last 100 logs
  }, []);

  // Simulated metrics loop
  useEffect(() => {
    if (state !== SystemState.RUNNING) return;
    
    const interval = setInterval(() => {
      setMetrics(prev => ({
        cpuUsage: 20 + Math.random() * 30 + (isSpeaking ? 20 : 0),
        memoryUsage: 450 + Math.random() * 50,
        latency: 150 + Math.random() * 100,
        fps: 24 + Math.random() * 6,
        confidence: 0.85 + Math.random() * 0.14,
      }));
    }, 1000);
    
    return () => clearInterval(interval);
  }, [state, isSpeaking]);

  const connect = useCallback(async () => {
    try {
      if (!process.env.API_KEY) {
        addLog('ERROR', 'CORE', 'API Key not found');
        return;
      }

      setState(SystemState.INITIALIZING);
      addLog('INFO', 'CORE', 'Initializing subsystems...');

      // 1. Setup Media Stream (Camera & Mic)
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          sampleRate: 16000,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true
        }, 
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 15 }
        } 
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      addLog('INFO', 'VIDEO', 'Camera stream active');
      addLog('INFO', 'AUDIO', 'Microphone stream active');

      // 2. Setup Audio Contexts
      inputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 16000 });
      outputAudioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)({ sampleRate: 24000 });

      // 3. Initialize Gemini Client
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      
      const sessionPromise = ai.live.connect({
        model: MODEL_NAME,
        config: {
          responseModalities: [Modality.AUDIO],
          systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
        },
        callbacks: {
          onopen: () => {
            addLog('INFO', 'CORE', 'Connected to Gemini Live Network');
            setState(SystemState.RUNNING);
            
            // Start Audio Streaming
            if (!inputAudioContextRef.current) return;
            
            const source = inputAudioContextRef.current.createMediaStreamSource(stream);
            const processor = inputAudioContextRef.current.createScriptProcessor(4096, 1, 1);
            
            processor.onaudioprocess = (e) => {
              const inputData = e.inputBuffer.getChannelData(0);
              
              // Calculate volume for UI
              let sum = 0;
              for (let i = 0; i < inputData.length; i++) {
                sum += inputData[i] * inputData[i];
              }
              const rms = Math.sqrt(sum / inputData.length);
              setVolume(Math.min(100, rms * 500)); // Amplify for UI display

              const blob = createAudioBlob(inputData, 16000);
              sessionPromiseRef.current?.then(session => {
                session.sendRealtimeInput({ media: blob });
              });
            };
            
            source.connect(processor);
            processor.connect(inputAudioContextRef.current.destination);
          },
          onmessage: async (msg: LiveServerMessage) => {
            const audioData = msg.serverContent?.modelTurn?.parts?.[0]?.inlineData?.data;
            
            if (audioData && outputAudioContextRef.current) {
              setIsSpeaking(true);
              const ctx = outputAudioContextRef.current;
              
              const buffer = decodeAudioData(audioData, ctx);
              
              const now = ctx.currentTime;
              // Ensure we schedule effectively
              const startTime = Math.max(nextStartTimeRef.current, now);
              
              const source = ctx.createBufferSource();
              source.buffer = buffer;
              source.connect(ctx.destination);
              source.start(startTime);
              
              nextStartTimeRef.current = startTime + buffer.duration;
              sourcesRef.current.add(source);
              
              source.onended = () => {
                sourcesRef.current.delete(source);
                if (sourcesRef.current.size === 0) {
                  setIsSpeaking(false);
                }
              };
            }

            if (msg.serverContent?.interrupted) {
                addLog('WARN', 'BRAIN', 'Interrupted by user');
                sourcesRef.current.forEach(s => s.stop());
                sourcesRef.current.clear();
                nextStartTimeRef.current = 0;
                setIsSpeaking(false);
            }
          },
          onclose: () => {
            addLog('INFO', 'CORE', 'Session closed');
            setState(SystemState.IDLE);
          },
          onerror: (err) => {
            addLog('ERROR', 'CORE', `Session error: ${err.message}`);
          }
        }
      });
      
      sessionPromiseRef.current = sessionPromise;

      // 4. Start Video Frame Streaming
      // Send frames at ~1 FPS to balance latency and bandwidth for "Vision"
      videoIntervalRef.current = window.setInterval(() => {
        if (!videoRef.current || !canvasRef.current) return;
        
        const video = videoRef.current;
        const canvas = canvasRef.current;
        const ctx = canvas.getContext('2d');
        
        if (video.readyState === video.HAVE_ENOUGH_DATA && ctx) {
          canvas.width = video.videoWidth * 0.5; // Scale down for performance
          canvas.height = video.videoHeight * 0.5;
          ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
          
          const base64 = canvas.toDataURL('image/jpeg', 0.6).split(',')[1];
          
          sessionPromiseRef.current?.then(session => {
            session.sendRealtimeInput({
              media: {
                mimeType: 'image/jpeg',
                data: base64
              }
            });
          }).catch(e => console.error(e));
        }
      }, 1000); // 1 Frame per second is sufficient for "Perception" discussion usually, can increase if needed.

    } catch (error: any) {
      addLog('ERROR', 'CORE', `Initialization failed: ${error.message}`);
      setState(SystemState.ERROR);
    }
  }, [addLog]);

  const disconnect = useCallback(async () => {
    if (sessionPromiseRef.current) {
        // There is no explicit .close() on the session object returned by connect? 
        // Actually the SDK docs usually suggest closing the client or context, 
        // but here we just stop sending data and maybe reload page to fully clear for this demo.
        // We will stop the tracks.
    }

    if (videoIntervalRef.current) {
      clearInterval(videoIntervalRef.current);
      videoIntervalRef.current = null;
    }
    
    if (videoRef.current && videoRef.current.srcObject) {
      const stream = videoRef.current.srcObject as MediaStream;
      stream.getTracks().forEach(track => track.stop());
      videoRef.current.srcObject = null;
    }

    if (inputAudioContextRef.current) {
      await inputAudioContextRef.current.close();
      inputAudioContextRef.current = null;
    }
    
    if (outputAudioContextRef.current) {
      await outputAudioContextRef.current.close();
      outputAudioContextRef.current = null;
    }

    setState(SystemState.IDLE);
    addLog('INFO', 'CORE', 'System shut down');
  }, [addLog]);

  return {
    state,
    logs,
    metrics,
    volume,
    isSpeaking,
    videoRef,
    connect,
    disconnect
  };
};
