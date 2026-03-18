import React, { useState, useEffect, useCallback, memo } from 'react';
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';

// Shared observer reuse (same pattern as ProcessorNode)
const getIsBwMode = () => document.body.classList.contains('theme-bw');
const bwListeners = new Set();
const sharedObserver = new MutationObserver(() => {
  const val = getIsBwMode();
  bwListeners.forEach(cb => cb(val));
});
sharedObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
const useBwMode = () => {
  const [isBwMode, setIsBwMode] = useState(getIsBwMode);
  useEffect(() => {
    bwListeners.add(setIsBwMode);
    return () => bwListeners.delete(setIsBwMode);
  }, []);
  return isBwMode;
};

export const DynamicGraph = memo(({ stats }) => {
  const [data, setData] = useState([
    { name: 'T0', hits: 0, misses: 1, traffic: 0 },
    { name: 'T1', hits: 1, misses: 2, traffic: 1 },
    { name: 'T2', hits: 2, misses: 1, traffic: 2 },
    { name: 'T3', hits: 3, misses: 0, traffic: 3 },
    { name: 'T4', hits: 2, misses: 1, traffic: 2 },
    { name: 'T5', hits: 4, misses: 0, traffic: 3 },
    { name: 'T6', hits: 3, misses: 1, traffic: 4 },
    { name: 'T7', hits: 5, misses: 0, traffic: 5 }
  ]);
  const isBwMode = useBwMode();

  useEffect(() => {
    setData((prevData) => {
      const newPoint = { 
        name: `T+${prevData.length}`, 
        hits: stats.hits, 
        misses: stats.misses, 
        traffic: stats.busTraffic 
      };
      const newData = [...prevData, newPoint];
      return newData.length > 15 ? newData.slice(newData.length - 15) : newData;
    });
  }, [stats.hits, stats.misses, stats.busTraffic]);

  const hitColor = isBwMode ? '#ffffff' : '#10b981'; // emerald-500
  const missColor = isBwMode ? '#a3a3a3' : '#f43f5e'; // rose-500
  const trafficColor = isBwMode ? '#525252' : '#f59e0b'; // amber-500

  return (
    <div className={`w-full h-full min-h-[300px] p-2 rounded-xl border ${isBwMode ? 'bg-[#111] border-[#333]' : 'bg-black/40 border-white/5'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <defs>
            <linearGradient id="colorHits" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={hitColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={hitColor} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorMisses" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={missColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={missColor} stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorTraffic" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor={trafficColor} stopOpacity={0.8}/>
              <stop offset="95%" stopColor={trafficColor} stopOpacity={0}/>
            </linearGradient>
          </defs>
          <XAxis dataKey="name" stroke={isBwMode ? '#666' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
          <YAxis stroke={isBwMode ? '#666' : '#475569'} fontSize={10} tickLine={false} axisLine={false} />
          <Tooltip 
            contentStyle={{ 
              backgroundColor: isBwMode ? '#000' : '#1e293b', 
              borderColor: isBwMode ? '#333' : '#334155',
              color: '#fff',
              fontSize: '12px',
              borderRadius: '8px'
            }} 
          />
          <Area type="monotone" dataKey="hits" stroke={hitColor} fillOpacity={1} fill="url(#colorHits)" />
          <Area type="monotone" dataKey="misses" stroke={missColor} fillOpacity={1} fill="url(#colorMisses)" />
          <Area type="monotone" dataKey="traffic" stroke={trafficColor} fillOpacity={1} fill="url(#colorTraffic)" />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

DynamicGraph.displayName = 'DynamicGraph';
