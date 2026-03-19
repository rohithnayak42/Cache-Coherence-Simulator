import React, { memo } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid
} from 'recharts';
import { useState, useEffect } from 'react';

// ─── shared BW-mode detection (reuse pattern from other components) ───
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

// Custom tooltip
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="bg-slate-900 border border-white/15 rounded-xl p-3 shadow-2xl text-xs font-mono">
      <p className="text-slate-400 mb-2 font-bold">{label}</p>
      {payload.map((entry) => (
        <div key={entry.dataKey} className="flex items-center gap-2 mb-1">
          <span className="w-2 h-2 rounded-full" style={{ background: entry.color }} />
          <span className="text-slate-300 capitalize">{entry.dataKey}:</span>
          <span className="font-bold" style={{ color: entry.color }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

/**
 * DynamicGraph — receives real graphData from the simulation hook.
 * Starts completely empty; each operation appends one data point.
 * Props:
 *   graphData: Array<{ name, hits, misses, traffic, transitions }>
 */
export const DynamicGraph = memo(({ graphData = [] }) => {
  const isBwMode = useBwMode();

  const hitColor        = isBwMode ? '#ffffff' : '#10b981';
  const missColor       = isBwMode ? '#a3a3a3' : '#f43f5e';
  const trafficColor    = isBwMode ? '#525252' : '#f59e0b';
  const transitionColor = isBwMode ? '#888888' : '#818cf8';
  const gridColor       = isBwMode ? '#333' : 'rgba(255,255,255,0.04)';
  const axisColor       = isBwMode ? '#666' : '#475569';

  if (graphData.length === 0) {
    return (
      <div className={`w-full h-full min-h-[300px] flex flex-col items-center justify-center rounded-xl border
        ${isBwMode ? 'bg-[#111] border-[#333]' : 'bg-black/40 border-white/5'}`}>
        <svg className="w-12 h-12 mb-3 opacity-20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M3 17l4-8 4 5 4-3 4 6" />
        </svg>
        <p className="text-slate-500 text-sm italic">No data yet — perform a Read or Write to see live graph</p>
      </div>
    );
  }

  return (
    <div className={`w-full h-full min-h-[300px] p-2 rounded-xl border ${isBwMode ? 'bg-[#111] border-[#333]' : 'bg-black/40 border-white/5'}`}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={graphData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
          <defs>
            {[
              ['colorHits',        hitColor],
              ['colorMisses',      missColor],
              ['colorTraffic',     trafficColor],
              ['colorTransitions', transitionColor],
            ].map(([id, color]) => (
              <linearGradient key={id} id={id} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%"  stopColor={color} stopOpacity={0.6} />
                <stop offset="95%" stopColor={color} stopOpacity={0} />
              </linearGradient>
            ))}
          </defs>

          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} vertical={false} />
          <XAxis
            dataKey="name"
            stroke={axisColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            interval="preserveStartEnd"
          />
          <YAxis
            stroke={axisColor}
            fontSize={10}
            tickLine={false}
            axisLine={false}
            allowDecimals={false}
            width={30}
          />
          <Tooltip content={<CustomTooltip />} />
          <Legend
            wrapperStyle={{ fontSize: '10px', paddingTop: '8px', color: axisColor }}
            formatter={(value) => <span style={{ color: axisColor, textTransform: 'capitalize' }}>{value}</span>}
          />

          <Area type="monotone" dataKey="hits"        stroke={hitColor}        fill="url(#colorHits)"        strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="misses"      stroke={missColor}       fill="url(#colorMisses)"      strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="traffic"     stroke={trafficColor}    fill="url(#colorTraffic)"     strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
          <Area type="monotone" dataKey="transitions" stroke={transitionColor} fill="url(#colorTransitions)" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
});

DynamicGraph.displayName = 'DynamicGraph';
