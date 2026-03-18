import React, { useRef, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ProcessorNode } from '../simulation/ProcessorNode';
import { MainMemoryView } from '../simulation/MainMemoryView';
import { DynamicGraph } from '../simulation/DynamicGraph';
import { SimulationHistory } from '../simulation/SimulationHistory';
import { useSimulation } from '../../hooks/useSimulation';
import { ArrowLeft, RotateCcw, AlertCircle, BarChart3, Info, Activity, Save, History as HistoryIcon, Cloud } from 'lucide-react';

const SimulationScreen = ({ protocol, onBack }) => {
  const logsContainerRef = useRef(null);
  const [showHistory, setShowHistory] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [hasRunDemo, setHasRunDemo] = useState(false);
  const [isManualMode, setIsManualMode] = useState(false);
  const [processorCount, setProcessorCount] = useState(3);

  const { 
    memory, 
    processors, 
    logs, 
    busMessage,
    stats,
    executeOperation, 
    resetSimulation, 
    updateMemory,
    saveSimulation
  } = useSimulation(protocol, processorCount);

  const handleSave = async () => {
    setIsSaving(true);
    const result = await saveSimulation();
    setIsSaving(false);
    if (result) {
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  // Auto-Scroll Logs inside its container
  useEffect(() => {
    if (logsContainerRef.current) {
      // Only scroll the internal container, don't jump the main window
      logsContainerRef.current.scrollTop = logsContainerRef.current.scrollHeight;
    }
  }, [logs]);

  // Default Demo Simulation (Auto Run)
  useEffect(() => {
    if (!hasRunDemo && processors.length > 0 && !isManualMode) {
      setHasRunDemo(true);
      
      const runDemo = async () => {
        // Wait for entrance animations to finish
        await new Promise(r => setTimeout(r, 1200));
        if (isManualMode) return;
        
        // P1 Reads 0x00 (Cache Miss)
        if (processors[0]) executeOperation(processors[0].id, 'READ', '0x00');
        
        // P2 Writes to 0x00 (BusRdX / Invalidation)
        await new Promise(r => setTimeout(r, 2200));
        if (isManualMode) return;
        if (processors[1]) executeOperation(processors[1].id, 'WRITE', '0x00', 42);
        
        // P3 Reads 0x00 (Cache Miss / Snoop)
        await new Promise(r => setTimeout(r, 2200));
        if (isManualMode) return;
        if (processors[2]) executeOperation(processors[2].id, 'READ', '0x00');

        // P4 Activity if exists
        await new Promise(r => setTimeout(r, 2200));
        if (isManualMode) return;
        if (processors[3]) executeOperation(processors[3].id, 'WRITE', '0x01', 99);
      };
      
      runDemo();
    }
  }, [hasRunDemo, processors, executeOperation, isManualMode]);

  // Helper function to calculate SVG curved path for Data Transfers
  const getTransferPath = () => {
    if (!busMessage || !processors.length) return "";
    
    // Find the index of the processor receiving/sending the message
    const targetIndex = processors.findIndex(p => p.id === busMessage.sender);
    if (targetIndex === -1) return "";

    // Start near bottom center of Memory
    const startX = "50%";
    const startY = "12%"; 
    const endY = "85%";

    // Dynamically calculate the X percentage target for the processor column
    // Example for 3 Processors: 0 -> 10%, 1 -> 50%, 2 -> 90%
    const totalProcessors = processors.length;
    let endXPercent = 50; // Default center
    
    if (totalProcessors > 1) {
       endXPercent = 10 + (targetIndex / (totalProcessors - 1)) * 80;
    }
    
    // Draw a curved line from memory down to the dynamically calculated processor slot
    return `M ${startX} ${startY} Q 50% 50% ${endXPercent}% ${endY}`;
  };

  return (
    <>
      <div className="w-full min-h-screen bg-background flex flex-col pt-8 pb-16 px-4 md:px-8 xl:px-16 overflow-y-auto">
      {/* --- TOP SECTION: Header --- */}
      <div className="flex items-center justify-between mb-8 shrink-0 bg-surface/80 border border-white/10 p-5 rounded-2xl shadow-lg relative z-20 w-full max-w-[1400px] mx-auto">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-lg"
        >
          <ArrowLeft className="w-5 h-5" />
          Change Protocol
        </button>

        <div className="flex items-center gap-6">
          <div className="px-6 py-2.5 bg-primary/20 border border-primary/30 rounded-xl flex items-center gap-3 shadow-[0_0_20px_rgba(59,130,246,0.2)]">
            <span className="w-3 h-3 rounded-full bg-primary animate-pulse shadow-[0_0_12px_#3b82f6]" />
            <span className="font-extrabold text-white tracking-widest text-lg">{protocol} MODE</span>
          </div>
          <div className="flex bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
            {[2, 3, 4].map((count) => (
               <button
                 key={count}
                 onClick={() => {
                   setProcessorCount(count);
                   setHasRunDemo(false);
                   setIsManualMode(true);
                 }}
                 className={`px-4 py-2 font-bold text-sm rounded-lg transition-all ${
                   processorCount === count 
                     ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30' 
                     : 'text-slate-400 hover:text-white hover:bg-white/10'
                 }`}
               >
                 {count} Cores
               </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowHistory(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-white/5 text-sm font-bold"
            >
              <HistoryIcon className="w-4 h-4" />
              History
            </button>
            <button
              onClick={handleSave}
              disabled={isSaving}
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border text-sm font-bold ${
                saveSuccess 
                  ? 'bg-green-500/20 border-green-500/50 text-green-400' 
                  : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400'
              }`}
            >
              {isSaving ? (
                <Activity className="w-4 h-4 animate-spin" />
              ) : saveSuccess ? (
                <Cloud className="w-4 h-4" />
              ) : (
                <Save className="w-4 h-4" />
              )}
              {isSaving ? 'Saving...' : saveSuccess ? 'Saved!' : 'Save Result'}
            </button>
            <button
              onClick={() => { 
                setHasRunDemo(false); 
                setIsManualMode(false);
                resetSimulation(); 
              }}
              className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/30 text-sm font-bold"
            >
              <RotateCcw className="w-4 h-4" />
              Reset Simulation
            </button>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[1400px] mx-auto flex flex-col gap-10">
        
        {/* --- MIDDLE SECTION: Main Simulation Area (Memory + Processors) --- */}
        <div className="w-full flex flex-col relative bg-surface/40 border border-white/5 rounded-3xl p-10 shadow-2xl overflow-hidden min-h-[700px]">
          
          {/* Animated 3D Arc Overlay for Data Transfers */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
            <AnimatePresence>
               {busMessage && (
                 <>
                   <motion.path
                     initial={{ pathLength: 0, opacity: 0 }}
                     animate={{ pathLength: 1, opacity: 1 }}
                     exit={{ opacity: 0 }}
                     transition={{ duration: 0.8, ease: "easeInOut" }}
                     d={getTransferPath()}
                     fill="transparent"
                     stroke="#3b82f6"
                     strokeWidth="4"
                     strokeDasharray="12 8"
                     className="drop-shadow-[0_0_15px_rgba(59,130,246,0.9)]"
                   />
                   {/* Glowing Data Packet animating exactly along the path */}
                   <motion.circle
                     r="6"
                     fill="#60a5fa"
                     className="drop-shadow-[0_0_20px_#60a5fa]"
                     initial={{ opacity: 0 }}
                     animate={{ opacity: 1 }}
                     exit={{ opacity: 0 }}
                   >
                     <animateMotion 
                        dur="0.8s" 
                        repeatCount="1" 
                        path={getTransferPath()} 
                        fill="freeze"
                     />
                   </motion.circle>
                 </>
               )}
            </AnimatePresence>
          </svg>

          {/* Main Memory (Top Center) */}
          <div className="w-full mb-8 relative flex justify-center z-10">
             <MainMemoryView 
               memory={memory} 
               busMessage={busMessage} 
               updateMemory={(addr, val) => {
                 setIsManualMode(true);
                 updateMemory(addr, val);
               }} 
             />
          </div>

          {/* Animated Bus Message Overlay (Status / Transmission Indicator) */}
          <div className="w-full flex justify-center z-20 h-16 mb-4 relative">
             <AnimatePresence mode="wait">
               {busMessage && (
                 <motion.div
                   initial={{ opacity: 0, scale: 0.9 }}
                   animate={{ opacity: 1, scale: 1 }}
                   exit={{ opacity: 0, scale: 0.8 }}
                   key={busMessage.type + Date.now()}
                   className="px-8 py-3 bg-indigo-600/95 backdrop-blur-md border border-indigo-400 text-white font-bold rounded-2xl shadow-[0_10px_30px_rgba(79,70,229,0.5)] flex items-center gap-4"
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



          {/* Processors Grid (Dynamically sizing to match active core count) */}
          <div className={`w-full grid grid-cols-1 lg:grid-cols-${processorCount} gap-6 lg:gap-8 mt-auto relative z-10 items-end`}>
            {processors.map((p) => (
              <ProcessorNode 
                key={p.id} 
                processor={p} 
                protocol={protocol}
                isActive={busMessage && busMessage.sender === p.id}
                busMessage={busMessage}
                onExecute={(pid, op, addr, val) => {
                  setIsManualMode(true);
                  executeOperation(pid, op, addr, val);
                }}
              />
            ))}
          </div>
        </div>

        {/* --- BOTTOM SECTION: Stats, Logs (Stacked Vertically) --- */}
        <div className="w-full flex flex-col gap-8">
           
           {/* Row 1: Real-Time Dynamic Graph */}
           <div className="w-full bg-surface/80 border border-white/10 rounded-3xl p-8 shadow-xl h-[400px] flex flex-col shrink-0">
             <div className="flex items-center gap-3 mb-6 text-white font-bold text-2xl shrink-0">
               <Activity className="w-7 h-7 text-emerald-400" /> Live Simulation Graph
             </div>
             <div className="w-full h-full relative overflow-visible">
                <DynamicGraph key={`${protocol}-${processorCount}-${isManualMode}`} stats={stats} />
             </div>
           </div>

           {/* Row 2: Real-time Stats Grid */}
           <div className="w-full bg-surface/80 border border-white/10 rounded-3xl p-8 shadow-xl">
             <div className="flex items-center gap-3 mb-6 text-white font-bold text-2xl">
               <BarChart3 className="w-7 h-7 text-primary" /> System Metrics
             </div>
             
             <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                 <div className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-widest">Cache Hits</div>
                 <div className="text-5xl font-mono text-emerald-400 font-extrabold drop-shadow-[0_0_12px_rgba(16,185,129,0.4)]">{stats.hits}</div>
               </div>
               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                 <div className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-widest">Cache Misses</div>
                 <div className="text-5xl font-mono text-rose-400 font-extrabold drop-shadow-[0_0_12px_rgba(244,63,94,0.4)]">{stats.misses}</div>
               </div>
               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                 <div className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-widest">Bus Traffic</div>
                 <div className="text-5xl font-mono text-amber-400 font-extrabold drop-shadow-[0_0_12px_rgba(251,191,36,0.4)]">{stats.busTraffic}</div>
               </div>
               <div className="bg-black/40 p-6 rounded-2xl border border-white/5 flex flex-col items-center justify-center">
                 <div className="text-sm text-slate-400 mb-2 font-bold uppercase tracking-widest">Transitions</div>
                 <div className="text-5xl font-mono text-blue-400 font-extrabold drop-shadow-[0_0_12px_rgba(59,130,246,0.4)]">{stats.transitions}</div>
               </div>
             </div>
           </div>

           {/* Row 3: Event Log Array */}
           <div className="w-full bg-surface/80 border border-white/10 rounded-3xl flex flex-col shadow-xl overflow-hidden h-[400px]">
             <div className="flex items-center justify-between p-6 border-b border-white/10 bg-black/20">
               <div className="flex items-center gap-3 text-white font-bold text-2xl">
                 <Info className="w-7 h-7 text-secondary" /> Event Log
               </div>
               <span className="text-sm font-mono text-slate-400 bg-black/40 px-3 py-1.5 rounded-lg border border-white/5">
                 {logs.length} events recorded
               </span>
             </div>
             
             <div 
               ref={logsContainerRef}
               className="flex-grow overflow-y-auto p-6 space-y-4 font-mono text-base scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent bg-black/10"
             >
               {logs.length === 0 ? (
                 <div className="h-full flex flex-col items-center justify-center text-slate-500 italic">
                   <AlertCircle className="w-10 h-10 mb-4 opacity-50" />
                   Silence on the bus. No events recorded yet.
                 </div>
               ) : (
                 logs.map((log) => (
                   <motion.div 
                     initial={{ opacity: 0, x: 20 }}
                     animate={{ opacity: 1, x: 0 }}
                     key={log.id} 
                     className="bg-black/50 p-4 rounded-xl border border-white/5 break-words flex flex-row items-center hover:bg-black/70 transition-colors"
                   >
                     <span className="text-sm text-slate-500 mr-4 font-bold shrink-0">[{log.time}]</span>
                     <span className="text-slate-200">
                        {log.message.split(/([A-Z]\d+|0x\d{2}|[M|E|S|O|I]|Bus[A-Za-z]+)/).map((part, i) => {
                          if (part.match(/^P\d+$/)) return <span key={i} className="text-emerald-400 font-extrabold">{part}</span>;
                          if (part.match(/^0x\d{2}$/)) return <span key={i} className="text-blue-400 font-bold bg-blue-500/10 px-1 rounded">{part}</span>;
                          if (part.match(/^[MESOI]$/)) return <span key={i} className="text-rose-400 font-extrabold">{part}</span>;
                          if (part.match(/^Bus/)) return <span key={i} className="text-amber-400 font-bold border-b border-amber-400/50 pb-0.5">{part}</span>;
                          return part;
                        })}
                     </span>
                   </motion.div>
                 ))
               )}
             </div>
           </div>

        </div>
      </div>
    </div>

      <SimulationHistory isOpen={showHistory} onClose={() => setShowHistory(false)} />
    </>
  );
};

export default SimulationScreen;
