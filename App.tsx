import React, { useState } from 'react';
import { useVisionSystem } from './hooks/useVisionSystem.ts';
import { MetricsPanel } from './components/MetricsPanel.tsx';
import { LogConsole } from './components/LogConsole.tsx';
import { SystemState } from './types.ts';
import { Activity, Cpu, Eye, Mic, Power, Terminal, Video } from 'lucide-react';

const App: React.FC = () => {
  const { 
    state, 
    logs, 
    metrics, 
    volume, 
    isSpeaking, 
    videoRef, 
    connect, 
    disconnect 
  } = useVisionSystem();

  const [showDebug, setShowDebug] = useState(true);

  return (
    <div className="min-h-screen bg-vision-dark text-slate-200 font-sans selection:bg-vision-accent selection:text-white flex flex-col">
      {/* Header */}
      <header className="h-16 border-b border-slate-800 bg-vision-dark/90 backdrop-blur flex items-center justify-between px-6 sticky top-0 z-50">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-vision-accent to-purple-600 flex items-center justify-center shadow-lg shadow-vision-accent/20">
            <Eye className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-white">VISION AI</h1>
            <p className="text-[10px] text-slate-400 font-mono uppercase tracking-widest">Interactive Perception System</p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
           <div className={`flex items-center gap-2 px-3 py-1 rounded-full border ${state === SystemState.RUNNING ? 'border-green-500/30 bg-green-500/10' : 'border-slate-700 bg-slate-800'}`}>
              <div className={`w-2 h-2 rounded-full ${state === SystemState.RUNNING ? 'bg-green-500 animate-pulse' : 'bg-slate-500'}`} />
              <span className="text-xs font-mono font-medium text-slate-300">{state}</span>
           </div>
           
           <button 
             onClick={state === SystemState.RUNNING ? disconnect : connect}
             className={`flex items-center gap-2 px-4 py-2 rounded font-medium text-sm transition-all duration-200 ${
               state === SystemState.RUNNING 
                 ? 'bg-red-500/10 text-red-400 hover:bg-red-500/20 border border-red-500/50' 
                 : 'bg-vision-accent text-white hover:bg-blue-600 shadow-lg shadow-blue-500/25'
             }`}
           >
             <Power className="w-4 h-4" />
             {state === SystemState.RUNNING ? 'TERMINATE SYSTEM' : 'INITIALIZE SYSTEM'}
           </button>
        </div>
      </header>

      {/* Main Content Grid */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 overflow-hidden max-h-[calc(100vh-4rem)]">
        
        {/* Left Column: Visual Perception (Video Feed) */}
        <div className="lg:col-span-8 flex flex-col gap-4 min-h-[400px]">
          <div className="relative flex-1 bg-black rounded-xl overflow-hidden border border-slate-800 shadow-2xl group">
            {/* Video Element */}
            <video 
              ref={videoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover opacity-80" 
            />
            
            {/* Overlay UI: "Scanning" aesthetic */}
            {state === SystemState.RUNNING && (
              <>
                <div className="absolute inset-0 pointer-events-none">
                  <div className="scan-line" />
                  <div className="absolute top-4 left-4 flex gap-2">
                    <span className="px-2 py-1 bg-red-500/20 text-red-500 text-xs font-mono border border-red-500/50 rounded">REC</span>
                    <span className="px-2 py-1 bg-blue-500/20 text-blue-400 text-xs font-mono border border-blue-500/50 rounded">AI_VISION_MOD_V2</span>
                  </div>
                </div>
              </>
            )}

            {state === SystemState.IDLE && (
              <div className="absolute inset-0 flex items-center justify-center flex-col gap-4 text-slate-500">
                <Video className="w-16 h-16 opacity-20" />
                <p className="font-mono text-sm uppercase tracking-widest">System Offline</p>
              </div>
            )}
          </div>

          {/* Audio Visualizer Bar */}
          <div className="h-16 bg-vision-panel rounded-lg border border-slate-700 p-4 flex items-center gap-4">
             <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center shrink-0">
               <Mic className={`w-5 h-5 ${state === SystemState.RUNNING ? 'text-vision-accent' : 'text-slate-600'}`} />
             </div>
             <div className="flex-1 flex items-center gap-1 h-8">
                {Array.from({ length: 40 }).map((_, i) => {
                  // Simple visualizer logic based on volume
                  const isActive = state === SystemState.RUNNING && i < (volume / 100) * 40;
                  const isOutput = isSpeaking && Math.random() > 0.5; // Simulate output wave
                  return (
                    <div 
                      key={i} 
                      className={`flex-1 rounded-full transition-all duration-75 ${
                        isOutput ? 'bg-green-400 h-6' : 
                        isActive ? 'bg-vision-accent h-4' : 'bg-slate-700 h-1'
                      }`} 
                    />
                  );
                })}
             </div>
             <div className="w-24 text-right">
                <span className={`text-xs font-mono ${isSpeaking ? 'text-green-400 animate-pulse' : 'text-slate-500'}`}>
                  {isSpeaking ? 'SPEAKING...' : state === SystemState.RUNNING ? 'LISTENING' : 'OFFLINE'}
                </span>
             </div>
          </div>
        </div>

        {/* Right Column: System Internals */}
        <div className="lg:col-span-4 flex flex-col gap-4 h-full min-h-[400px]">
          
          {/* Performance Modules */}
          <div className="flex-1 bg-vision-dark/50 flex flex-col gap-4">
             <div className="flex items-center justify-between">
                <h2 className="flex items-center gap-2 text-sm font-bold text-slate-300">
                  <Activity className="w-4 h-4 text-vision-accent" />
                  SYSTEM METRICS
                </h2>
                <button 
                  onClick={() => setShowDebug(!showDebug)} 
                  className="text-[10px] text-slate-500 hover:text-white uppercase"
                >
                  {showDebug ? 'Hide' : 'Show'} Details
                </button>
             </div>
             
             {showDebug && (
               <div className="h-48">
                  <MetricsPanel metrics={metrics} />
               </div>
             )}
          </div>

          {/* Terminal / Logs */}
          <div className="flex-[2] flex flex-col min-h-0">
             <div className="flex items-center gap-2 mb-2 text-sm font-bold text-slate-300">
                <Terminal className="w-4 h-4 text-vision-warning" />
                EXECUTION LOGS
             </div>
             <LogConsole logs={logs} />
          </div>

          {/* System Info Footer */}
          <div className="bg-slate-800/50 rounded p-3 text-[10px] font-mono text-slate-500 space-y-1">
             <div className="flex justify-between">
                <span>ARCH:</span>
                <span className="text-slate-300">WEB-REACT-GEMINI-LIVE</span>
             </div>
             <div className="flex justify-between">
                <span>MODEL:</span>
                <span className="text-slate-300">gemini-2.5-flash-native-audio</span>
             </div>
             <div className="flex justify-between">
                <span>MODULES:</span>
                <span className="text-slate-300">AUDIO_IN, VIDEO_IN, TTS, LLM</span>
             </div>
          </div>

        </div>
      </main>
    </div>
  );
};

export default App;