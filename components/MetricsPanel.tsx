import React, { useEffect, useState } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, LineChart, Line, CartesianGrid } from 'recharts';
import { SystemMetrics } from '../types';

interface MetricsPanelProps {
  metrics: SystemMetrics;
}

export const MetricsPanel: React.FC<MetricsPanelProps> = ({ metrics }) => {
  const [data, setData] = useState<any[]>([]);

  useEffect(() => {
    setData(prev => {
      const newData = [...prev, { time: new Date().toLocaleTimeString(), ...metrics }];
      if (newData.length > 20) newData.shift();
      return newData;
    });
  }, [metrics]);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 h-full">
      {/* CPU & Memory Utilization */}
      <div className="bg-vision-panel border border-vision-accent/20 rounded-lg p-3 flex flex-col">
        <h3 className="text-xs font-mono text-vision-accent mb-2 uppercase tracking-wider">Resource Utilization</h3>
        <div className="flex-1 w-full min-h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 100]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#3b82f6', fontSize: '12px' }} 
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Area type="monotone" dataKey="cpuUsage" stackId="1" stroke="#ef4444" fill="#ef4444" fillOpacity={0.2} name="CPU %" />
              <Area type="monotone" dataKey="memoryUsage" stackId="2" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.2} name="MEM (MB)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-slate-400">
            <span>CPU: {metrics.cpuUsage.toFixed(1)}%</span>
            <span>MEM: {metrics.memoryUsage.toFixed(0)} MB</span>
        </div>
      </div>

      {/* Latency & Confidence */}
      <div className="bg-vision-panel border border-vision-accent/20 rounded-lg p-3 flex flex-col">
        <h3 className="text-xs font-mono text-vision-success mb-2 uppercase tracking-wider">Perception Metrics</h3>
        <div className="flex-1 w-full min-h-[100px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data}>
              <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
              <XAxis dataKey="time" hide />
              <YAxis hide domain={[0, 1]} />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1e293b', borderColor: '#10b981', fontSize: '12px' }} 
                itemStyle={{ color: '#e2e8f0' }}
              />
              <Line type="step" dataKey="confidence" stroke="#10b981" strokeWidth={2} dot={false} name="Confidence" />
            </LineChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-between mt-2 text-xs font-mono text-slate-400">
            <span>Latency: {metrics.latency.toFixed(0)} ms</span>
            <span>Conf: {(metrics.confidence * 100).toFixed(1)}%</span>
        </div>
      </div>
    </div>
  );
};
