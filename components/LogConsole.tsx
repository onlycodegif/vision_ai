import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface LogConsoleProps {
  logs: LogEntry[];
}

export const LogConsole: React.FC<LogConsoleProps> = ({ logs }) => {
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'INFO': return 'text-blue-400';
      case 'WARN': return 'text-yellow-400';
      case 'ERROR': return 'text-red-500';
      case 'SYSTEM': return 'text-green-500';
      default: return 'text-gray-400';
    }
  };

  return (
    <div className="h-full flex flex-col bg-black/50 rounded-lg p-2 font-mono text-xs overflow-hidden border border-slate-700">
      <div className="flex items-center justify-between border-b border-slate-700 pb-1 mb-2">
        <span className="text-slate-400 uppercase tracking-widest">System Logs</span>
        <div className="flex space-x-1">
            <span className="w-2 h-2 rounded-full bg-red-500"></span>
            <span className="w-2 h-2 rounded-full bg-yellow-500"></span>
            <span className="w-2 h-2 rounded-full bg-green-500"></span>
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-hide space-y-1">
        {logs.length === 0 && <div className="text-slate-600 italic">Waiting for system initialization...</div>}
        {logs.slice().reverse().map((log, i) => (
          <div key={i} className="flex space-x-2 border-l-2 border-slate-800 pl-2 hover:border-vision-accent hover:bg-slate-900/50 transition-colors">
            <span className="text-slate-500 shrink-0">[{log.timestamp}]</span>
            <span className={`${getLevelColor(log.level)} font-bold shrink-0 w-12`}>{log.level}</span>
            <span className="text-vision-accent shrink-0 w-16">[{log.module}]</span>
            <span className="text-slate-300 break-all">{log.message}</span>
          </div>
        ))}
        <div ref={endRef} />
      </div>
    </div>
  );
};
