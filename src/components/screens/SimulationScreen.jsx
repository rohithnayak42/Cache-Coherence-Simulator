import React, { useRef, useEffect, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessorNode } from '../simulation/ProcessorNode';
import { MainMemoryView } from '../simulation/MainMemoryView';
import { DynamicGraph } from '../simulation/DynamicGraph';
import { SimulationHistory } from '../simulation/SimulationHistory';
import { ControlPanel } from '../simulation/ControlPanel';
import { useSimulation } from '../../hooks/useSimulation';
import { useBwMode } from '../../hooks/useBwMode';
import {
  ArrowLeft, RotateCcw, AlertCircle, BarChart3,
  Info, Activity, Save, History as HistoryIcon, CheckCircle2, Database
} from 'lucide-react';

const SimulationScreen = ({ protocol, onBack }) => {
  const isBwMode = useBwMode();
  const logsContainerRef = useRef(null);
  const [showHistory, setShowHistory]   = useState(false);
  const [saveSuccess, setSaveSuccess]   = useState(false);
  const [processorCount, setProcessorCount] = useState(3);
  const [resetCount, setResetCount]     = useState(0); // increments on each reset → remounts ProcessorNode

  const {
    memory,
    processors,
    logs,
    busMessage,
    stats,
    graphData,
    history,
    executeOperation,
    resetSimulation,
    updateMemory,
    saveSimulation,
    clearHistory,
    flushMemory,
  } = useSimulation(protocol, processorCount);

  /* ─── Check for dirty lines in MOESI ─── */
  const hasDirtyLines = protocol === 'MOESI' && processors.some(p => 
    Object.values(p.cache).some(line => line.state === 'M' || line.state === 'O')
  );

  /* ─── Auto-scroll event log to top (newest messages) ─── */
  useEffect(() => {
    if (logsContainerRef.current) {
      logsContainerRef.current.scrollTop = 0;
    }
  }, [logs]);

  /* ─── Save as JSON ─── */
  const handleSave = useCallback(() => {
    const ok = saveSimulation(stats, logs, memory, processors, graphData);
    if (ok) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  }, [saveSimulation, stats, logs, memory, processors, graphData]);

  /* ─── Reset ─── */
  const handleReset = useCallback(() => {
    resetSimulation();
    setResetCount(c => c + 1); // causes ProcessorNode to remount → inputs clear
  }, [resetSimulation]);

  /* ─── Core count switching ─── */
  const handleCoreChange = useCallback((count) => {
    setProcessorCount(count);
  }, []);

  /* ─── SVG path for bus-transfer animation ─── */
  const getTransferPath = () => {
    if (!busMessage || !processors.length) return '';
    const targetIndex = processors.findIndex(p => p.id === busMessage.sender);
    if (targetIndex === -1) return '';
    const total = processors.length;
    let endXPercent = 50;
    if (total > 1) endXPercent = 10 + (targetIndex / (total - 1)) * 80;
    return `M 50% 12% Q 50% 50% ${endXPercent}% 85%`;
  };

  return (
    <>
      <div className="w-full min-h-screen bg-background flex flex-col pt-8 pb-16 px-4 md:px-8 xl:px-16 overflow-y-auto">

        {/* ── Header ── */}
        <div className={`flex flex-col gap-6 mb-8 shrink-0 border p-6 rounded-2xl relative z-20 w-full max-w-[1400px] mx-auto transition-all duration-300 ${isBwMode ? 'bg-white border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'bg-surface/80 border-white/10 shadow-lg'}`}>

          {/* Protocol badge */}
          <div className="flex justify-center">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className={`px-8 py-3 rounded-2xl flex items-center justify-center gap-4 transition-all duration-300 w-full sm:w-auto ${isBwMode ? 'bg-[#eff6ff] border border-[#bfdbfe] shadow-[0_4px_12px_rgba(37,99,235,0.1)]' : 'bg-primary/20 border border-primary/40 shadow-[0_0_25px_rgba(59,130,246,0.25)]'}`}
            >
              <span className="w-4 h-4 rounded-full bg-primary animate-pulse shadow-[0_0_15px_#3b82f6]" />
              <span className={`font-extrabold tracking-[0.2em] text-xl md:text-2xl ${isBwMode ? 'text-[#2563eb]' : 'text-white'}`}>{protocol} MODE</span>
            </motion.div>
          </div>

          {/* Controls row */}
          <ControlPanel
            onBack={onBack}
            processorCount={processorCount}
            onCoreChange={handleCoreChange}
            historyCount={history.length}
            onShowHistory={() => setShowHistory(true)}
            hasDirtyLines={hasDirtyLines}
            onFlushMemory={flushMemory}
            onSave={handleSave}
            saveSuccess={saveSuccess}
            onReset={handleReset}
          />
        </div>

        <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-10">

          {/* ── Simulation Area (Memory + Bus + Processors) ── */}
          <div className={`w-full flex flex-col relative border rounded-3xl p-4 sm:p-6 lg:p-10 shadow-2xl overflow-hidden min-h-[500px] lg:min-h-[700px] transition-all duration-300 ${isBwMode ? 'bg-white border-[#e2e8f0]' : 'bg-surface/40 border-white/5'}`}>

            {/* SVG bus transfer arc */}
            <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
              <AnimatePresence>
                {busMessage && (
                  <>
                    <motion.path
                      key={`path-${busMessage.type}-${busMessage.address}`}
                      initial={{ pathLength: 0, opacity: 0 }}
                      animate={{ pathLength: 1, opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.7, ease: 'easeInOut' }}
                      d={getTransferPath()}
                      fill="transparent"
                      stroke="#3b82f6"
                      strokeWidth="4"
                      strokeDasharray="12 8"
                      className="drop-shadow-[0_0_15px_rgba(59,130,246,0.9)]"
                    />
                    <motion.circle
                      r="6"
                      fill="#60a5fa"
                      className="drop-shadow-[0_0_20px_#60a5fa]"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <animateMotion dur="0.7s" repeatCount="1" path={getTransferPath()} fill="freeze" />
                    </motion.circle>
                  </>
                )}
              </AnimatePresence>
            </svg>

            {/* Main Memory */}
            <div className="w-full mb-8 relative flex justify-center z-10">
              <MainMemoryView
                memory={memory}
                busMessage={busMessage}
                updateMemory={(addr, val) => updateMemory(addr, val)}
              />
            </div>

            {/* Bus Message Banner */}
            <div className="w-full flex justify-center z-20 h-16 mb-4 relative">
              <AnimatePresence mode="wait">
                {busMessage && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.8 }}
                    key={`${busMessage.type}-${busMessage.address}-${Date.now()}`}
                    className="px-4 sm:px-8 py-3 bg-indigo-600/95 backdrop-blur-md border border-indigo-400 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.5)] flex flex-col sm:flex-row text-center sm:text-left items-center gap-2 sm:gap-4"
                  >
                    <div className="p-1.5 bg-indigo-500/50 rounded-full">
                      <AlertCircle className="w-5 h-5 text-white" />
                    </div>
                    <div className="text-lg">
                      <span className="text-indigo-200 font-mono mr-2">[{busMessage.sender}]</span>
                      Transmitting <span className="text-amber-300 mx-1">{busMessage.type}</span>
                      for <span className="text-emerald-300 font-mono ml-1">{busMessage.address}</span>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>

            {/* Processors Layout */}
            <div className="w-full flex flex-col gap-6 sm:gap-8 mt-auto relative z-10 items-center">
              {/* Row 1 (Up to 4 cores) */}
              <div className={`w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-${Math.min(processors.length, 4)} gap-4 sm:gap-6 lg:gap-8 items-end`}>
                {processors.slice(0, 4).map((p) => (
                  <ProcessorNode
                    key={`${p.id}-${resetCount}`}
                    processor={p}
                    protocol={protocol}
                    isActive={!!(busMessage && busMessage.sender === p.id)}
                    busMessage={busMessage}
                    onExecute={(pid, op, addr, val) => executeOperation(pid, op, addr, val)}
                  />
                ))}
              </div>

              {/* Row 2 (Remaining cores: 5 to 8) */}
              {processors.length > 4 && (
                <div className="w-full flex flex-wrap justify-center gap-4 sm:gap-6 lg:gap-8 items-end">
                  {processors.slice(4).map((p) => (
                    <div 
                      key={`${p.id}-${resetCount}`} 
                      className="w-full md:w-[calc(50%-0.75rem)] lg:w-[calc(25%-1.5rem)]"
                    >
                      <ProcessorNode
                        processor={p}
                        protocol={protocol}
                        isActive={!!(busMessage && busMessage.sender === p.id)}
                        busMessage={busMessage}
                        onExecute={(pid, op, addr, val) => executeOperation(pid, op, addr, val)}
                      />
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* ── Bottom Panel ── */}
          <div className="w-full flex flex-col gap-8">

            {/* Live Graph */}
            <div className={`w-full border rounded-3xl p-4 sm:p-6 lg:p-8 flex flex-col shrink-0 transition-all duration-300 h-[400px] ${isBwMode ? 'bg-white border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'bg-surface/80 border-white/10 shadow-xl'}`}>
              <div className={`flex items-center gap-3 mb-6 font-bold text-2xl shrink-0 ${isBwMode ? 'text-[#0f172a]' : 'text-white'}`}>
                <Activity className={`w-7 h-7 ${isBwMode ? 'text-[#22c55e]' : 'text-emerald-400'}`} /> Live Simulation Graph
              </div>
              <div className="w-full flex-1 relative overflow-visible min-h-0">
                <DynamicGraph graphData={graphData} />
              </div>
            </div>

            {/* System Metrics */}
            <div className={`w-full border rounded-3xl p-4 sm:p-6 lg:p-8 transition-all duration-300 ${isBwMode ? 'bg-white border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'bg-surface/80 border-white/10 shadow-xl'}`}>
              <div className={`flex items-center gap-3 mb-6 font-bold text-2xl ${isBwMode ? 'text-[#0f172a]' : 'text-white'}`}>
                <BarChart3 className={`w-7 h-7 ${isBwMode ? 'text-[#2563eb]' : 'text-primary'}`} /> System Metrics
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { label: 'Cache Hits',   value: stats.hits,        color: isBwMode ? 'text-[#22c55e]' : 'text-emerald-400', glow: isBwMode ? 'transparent' : 'rgba(16,185,129,0.4)' },
                  { label: 'Cache Misses', value: stats.misses,      color: isBwMode ? 'text-[#ef4444]' : 'text-rose-400',    glow: isBwMode ? 'transparent' : 'rgba(244,63,94,0.4)' },
                  { label: 'Bus Traffic',  value: stats.busTraffic,  color: isBwMode ? 'text-[#f59e0b]' : 'text-amber-400',   glow: isBwMode ? 'transparent' : 'rgba(251,191,36,0.4)' },
                  { label: 'Transitions',  value: stats.transitions, color: isBwMode ? 'text-[#3b82f6]' : 'text-blue-400',    glow: isBwMode ? 'transparent' : 'rgba(59,130,246,0.4)' },
                ].map(({ label, value, color, glow }) => (
                  <div key={label} className={`p-4 sm:p-6 rounded-2xl border flex flex-col items-center justify-center text-center transition-colors ${isBwMode ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-black/40 border-white/5'}`}>
                    <div className={`text-sm mb-2 font-bold uppercase tracking-widest ${isBwMode ? 'text-[#475569]' : 'text-slate-400'}`}>{label}</div>
                    <motion.div
                      key={value}
                      initial={{ scale: 1.2, opacity: 0.5 }}
                      animate={{ scale: 1, opacity: 1 }}
                      className={`text-5xl font-mono font-extrabold ${color}`}
                      style={{ filter: `drop-shadow(0 0 12px ${glow})` }}
                    >
                      {value}
                    </motion.div>
                  </div>
                ))}
              </div>
            </div>

            {/* Event Log */}
            <div className={`w-full border rounded-3xl flex flex-col overflow-hidden h-[420px] transition-all duration-300 ${isBwMode ? 'bg-white border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.05)]' : 'bg-surface/80 border-white/10 shadow-xl'}`}>
              <div className={`flex flex-col sm:flex-row items-center justify-between gap-4 p-4 sm:p-6 border-b shrink-0 ${isBwMode ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-black/20 border-white/10'}`}>
                <div className={`flex items-center gap-3 font-bold text-xl sm:text-2xl ${isBwMode ? 'text-[#0f172a]' : 'text-white'}`}>
                  <Info className={`w-6 h-6 sm:w-7 sm:h-7 ${isBwMode ? 'text-[#2563eb]' : 'text-secondary'}`} /> Event Log
                </div>
                <span className={`text-xs sm:text-sm font-mono px-3 py-1.5 rounded-lg border ${isBwMode ? 'bg-white text-[#475569] border-[#cbd5f5]' : 'bg-black/40 text-slate-400 border-white/5'}`}>
                  {logs.length} events recorded
                </span>
              </div>

              <div
                ref={logsContainerRef}
                className={`flex-grow overflow-y-auto p-4 sm:p-6 space-y-3 font-mono text-sm scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent ${isBwMode ? 'bg-white' : 'bg-black/10'}`}
              >
                {logs.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                    <AlertCircle className="w-10 h-10 mb-4 opacity-40" />
                    No events recorded yet. Perform a Read or Write to begin.
                  </div>
                ) : (
                  <AnimatePresence initial={false}>
                    {logs.map((log, index) => (
                      <motion.div
                        layout
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        key={log.id}
                        className={`p-3 rounded-xl border break-words flex flex-row items-start transition-colors gap-3 ${
                          isBwMode ? (index % 2 === 0 ? 'bg-white border-[#e2e8f0] hover:bg-[#f8fafc]' : 'bg-[#f8fafc] border-[#e2e8f0] hover:bg-white') 
                                   : 'bg-black/50 border-white/5 hover:bg-black/70'
                        }`}
                      >
                        <span className={`text-xs font-bold shrink-0 mt-0.5 ${isBwMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>[{log.time}]</span>
                        <span className={`leading-relaxed ${isBwMode ? 'text-[#0f172a]' : 'text-slate-200'}`}>
                          {log.message.split(/(\[P\d+\]|→|HIT|MISS|0x[0-9a-fA-F]+|Bus\w+|State\s+\w+|State\s+\w+→\w+)/).map((part, i) => {
                            if (/^\[P\d+\]$/.test(part))               return <span key={i} className="text-emerald-400 font-extrabold">{part}</span>;
                            if (/^0x[0-9a-fA-F]+$/i.test(part))        return <span key={i} className="text-blue-400 font-bold bg-blue-500/10 px-1 rounded">{part}</span>;
                            if (part === 'HIT')                         return <span key={i} className="text-emerald-400 font-bold">HIT</span>;
                            if (part === 'MISS')                        return <span key={i} className="text-rose-400 font-bold">MISS</span>;
                            if (part === '→')                           return <span key={i} className="text-slate-500 mx-0.5">→</span>;
                            if (/^Bus\w+$/.test(part))                  return <span key={i} className="text-amber-400 font-bold">{part}</span>;
                            if (/^State/.test(part))                    return <span key={i} className="text-purple-400 font-semibold">{part}</span>;
                            return part;
                          })}
                        </span>
                      </motion.div>
                    ))}
                  </AnimatePresence>
                )}
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* History Modal */}
      <SimulationHistory
        isOpen={showHistory}
        onClose={() => setShowHistory(false)}
        history={history}
        onClearHistory={clearHistory}
      />
    </>
  );
};

export default SimulationScreen;
