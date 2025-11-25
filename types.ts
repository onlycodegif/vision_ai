export interface LogEntry {
  timestamp: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'SYSTEM';
  message: string;
  module: 'AUDIO' | 'VIDEO' | 'BRAIN' | 'CORE';
}

export interface SystemMetrics {
  cpuUsage: number;
  memoryUsage: number;
  latency: number;
  fps: number;
  confidence: number;
}

export enum SystemState {
  IDLE = 'IDLE',
  INITIALIZING = 'INITIALIZING',
  RUNNING = 'RUNNING',
  ERROR = 'ERROR',
}
