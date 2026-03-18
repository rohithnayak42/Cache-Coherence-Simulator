import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, Share2, AlertTriangle, CheckCircle, MonitorDown, AlertOctagon, Zap, ShieldAlert } from 'lucide-react';

const ProblemDescriptionScreen = ({ onNext, onBack }) => {
  const [step, setStep] = useState(0);
  const [isBwMode, setIsBwMode] = useState(document.body.classList.contains('theme-bw'));

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsBwMode(document.body.classList.contains('theme-bw'));
        }
      });
    });
    observer.observe(document.body, { attributes: true });
    return () => observer.disconnect();
  }, []);

  const nextStep = () => {
    if (step < 5) setStep(step + 1);
  };

  const prevStep = () => {
    if (step > 0) setStep(step - 1);
  };

  const resetFlow = () => setStep(0);

  // Define step descriptions
  const stepConfigs = [
    {
      title: "Initial State",
      description: "Both Cores have an empty cache. Main Memory holds the value X = 10.",
      actionLabel: "Read from Core A"
    },
    {
      title: "Core A Reads",
      description: "Core A reads variable X from Main Memory. Core A's L1 Cache now stores X = 10.",
      actionLabel: "Modify via Core A"
    },
    {
      title: "Core A Modifies",
      description: "Core A updates X to 15 in its private cache. The line is now marked as 'Dirty'. Memory still holds 10.",
      actionLabel: "Read from Core B"
    },
    {
      title: "Core B Reads (Error!)",
      description: "Core B attempts to read X from Main Memory. It receives the old, stale value 10 because Core A hasn't written back.",
      actionLabel: "Resolve via Protocol"
    },
    {
      title: "Coherence Restored",
      description: "A Cache Coherence Protocol (like MSI or MESI) forces Core A to write back to memory or directly to Core B. Data is synchronized.",
      actionLabel: "Select a Protocol"
    }
  ];

  // Helper classes depending on Theme mode
  const surfaceClass = isBwMode ? "bg-[#050505] border-white/20" : "bg-surface/60 border-white/10";
  const primaryText = isBwMode ? "text-white" : "text-primary";
  const errorBadgeClass = isBwMode ? "bg-white text-black" : "bg-rose-500 text-white";
  const errorTextClass = isBwMode ? "text-white font-bold" : "text-rose-400 font-bold";
  const highlightClass = isBwMode ? "text-white font-bold underline" : "text-emerald-400 font-bold";

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-8 relative">
      
      {/* Top Navigation */}
      <div className="w-full flex justify-between items-center mb-6 px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back</span>
        </button>

        <AnimatePresence>
          <motion.button
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            whileHover="hover"
            whileTap="tap"
            transition={{ duration: 0.4 }}
            onClick={onNext}
            title="Skip demo and go directly to protocol simulation"
            className={`group flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-sm transition-all duration-300 shadow-lg ${
              isBwMode 
                ? 'bg-white text-black hover:bg-gray-200 shadow-white/10' 
                : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-600 animate-shine text-white shadow-[0_0_20px_rgba(59,130,246,0.5)] border border-blue-400/30'
            }`}
          >
            <motion.span 
              variants={{
                hover: { scale: 1.05 },
                tap: { scale: 0.95 }
              }}
            >
              Skip to Protocol
            </motion.span>
            <motion.span
              variants={{
                hover: { x: 4 },
                initial: { x: 0 }
              }}
              transition={{ type: "spring", stiffness: 400, damping: 10 }}
            >
              <ArrowRight className="w-4 h-4" />
            </motion.span>
          </motion.button>
        </AnimatePresence>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center mb-6"
      >
        <h2 className={`text-3xl lg:text-4xl font-extrabold mb-3 tracking-tight ${isBwMode ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-blue-300 to-indigo-400'}`}>
          Simulation Flow: The Coherence Problem
        </h2>
        <p className="text-lg text-slate-400 max-w-2xl mx-auto">
          Follow the step-by-step example below to understand how data inconsistencies occur in multiprocessor systems.
        </p>
      </motion.div>

      {/* Main 3D Visualization Area */}
      <motion.div 
        className={`w-full max-w-5xl rounded-2xl p-6 md:p-10 mb-8 relative flex items-center justify-center min-h-[400px] shadow-3d ${surfaceClass}`}
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.4 }}
      >
        <div className="flex flex-col items-center w-full gap-12 relative z-10">
          
          {/* Animated SVG Arcs for Data Flow */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none z-0" style={{ overflow: 'visible' }}>
            <AnimatePresence>
               {step === 1 && (
                 <motion.path
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ pathLength: 1, opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.8, ease: "easeInOut" }}
                   d="M 50% 25% Q 30% 50% 25% 75%"
                   fill="transparent"
                   stroke={isBwMode ? "#ffffff" : "#3b82f6"}
                   strokeWidth="3"
                   strokeDasharray="8 4"
                   className={!isBwMode ? "drop-shadow-[0_0_8px_rgba(59,130,246,0.8)]" : ""}
                 />
               )}
               {step === 3 && (
                 <motion.path
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ stroke: isBwMode ? "#ffffff" : "#f43f5e", pathLength: 1, opacity: 1 }}
                   exit={{ opacity: 0 }}
                   transition={{ duration: 0.8, ease: "easeInOut" }}
                   d="M 50% 25% Q 70% 50% 75% 75%"
                   fill="transparent"
                   strokeWidth="3"
                   strokeDasharray="8 4"
                   className={!isBwMode ? "drop-shadow-[0_0_8px_rgba(244,63,94,0.8)]" : ""}
                 />
               )}
               {step >= 4 && (
                 <motion.path
                   initial={{ pathLength: 0, opacity: 0 }}
                   animate={{ stroke: isBwMode ? "#ffffff" : "#10b981", pathLength: 1, opacity: 1 }}
                   transition={{ duration: 0.8, ease: "easeInOut" }}
                   d="M 25% 75% Q 50% 85% 75% 75%"
                   fill="transparent"
                   strokeWidth="3"
                   strokeDasharray="6 6"
                   className={!isBwMode ? "drop-shadow-[0_0_8px_rgba(16,185,129,0.8)]" : ""}
                 />
               )}
            </AnimatePresence>
          </svg>

          {/* Main Memory Node */}
          <motion.div 
            animate={{ y: step === 4 ? [-5, 5, 0] : 0 }}
            className={`w-72 p-4 rounded-xl flex flex-col items-center justify-center relative z-10 shadow-3d ${isBwMode ? 'bg-[#1a1a1a] border-2 border-[#444]' : 'bg-slate-800 border-2 border-slate-600'}`}
          >
            <div className={`absolute -top-4 px-3 py-1 rounded bg-black border ${isBwMode ? 'border-white text-white' : 'border-slate-500 text-slate-300'} text-xs font-bold uppercase tracking-wider`}>
              Main Memory
            </div>
            
            <div className={`mt-2 w-full px-4 py-3 rounded-lg font-mono text-center transition-colors duration-500 ${step >= 4 ? (isBwMode ? 'bg-white text-black font-bold' : 'bg-emerald-900/50 text-emerald-400 border border-emerald-500/50') : 'bg-black/50 text-slate-300'}`}>
              Address X = {step >= 4 ? '15' : '10'}
            </div>
            {step === 3 && (
               <div className="absolute -right-32 top-1/2 -translate-y-1/2 px-3 py-1 bg-red-500/20 border border-red-500 text-red-400 text-xs font-bold rounded animate-pulse">
                 Stale!
               </div>
            )}
            {step >= 4 && (
               <div className={`absolute -right-36 top-1/2 -translate-y-1/2 px-3 py-1 text-xs font-bold rounded ${isBwMode ? 'bg-white text-black' : 'bg-emerald-500/20 border border-emerald-500 text-emerald-400'}`}>
                 Updated!
               </div>
            )}
          </motion.div>

          {/* Processors Container */}
          <div className="flex w-full justify-around mt-4">
            
            {/* Core A */}
            <div className="flex flex-col items-center relative z-10 w-[40%] max-w-[240px]">
              <motion.div 
                className={`w-full p-4 rounded-xl flex flex-col items-center shadow-3d transition-colors duration-500 ${
                  isBwMode 
                    ? `border-2 ${step >= 1 ? 'border-white' : 'border-[#333]'} bg-[#1a1a1a]`
                    : `border-2 ${step >= 1 ? 'border-primary/80 bg-slate-800' : 'border-slate-700 bg-slate-800'}`
                }`}
                animate={step === 1 || step === 2 ? { y: -5 } : { y: 0 }}
              >
                <span className={`font-bold mb-3 flex items-center gap-2 ${step >= 1 ? (isBwMode ? 'text-white' : 'text-primary') : 'text-slate-400'}`}>
                  <Share2 size={18} /> Core A
                </span>
                
                <div className={`w-full p-3 rounded text-center font-mono text-sm transition-all duration-300 ${step >= 1 ? 'bg-black/60' : 'bg-black/30'}`}>
                   {step === 0 && <span className="text-slate-600">Empty</span>}
                   {step === 1 && <span className={isBwMode ? "text-white" : "text-blue-300"}>X: 10</span>}
                   {step >= 2 && (
                     <span>
                       X: <span className="line-through opacity-50 mr-1">10</span> 
                       <span className={highlightClass}>15</span>
                     </span>
                   )}
                </div>

                {/* Dirty Label */}
                <AnimatePresence>
                  {step >= 2 && step < 4 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className={`absolute -top-3 -right-3 text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1 shadow-lg pointer-events-none z-20 ${errorBadgeClass}`}
                    >
                      <AlertTriangle className="w-3 h-3" /> Dirty
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

            {/* Core B */}
            <div className="flex flex-col items-center relative z-10 w-[40%] max-w-[240px]">
              <motion.div 
                className={`w-full p-4 rounded-xl flex flex-col items-center shadow-3d transition-colors duration-500 ${
                  isBwMode 
                    ? `border-2 ${step === 3 ? 'border-white bg-[#000000]' : (step >= 4 ? 'border-white bg-[#1a1a1a]' : 'border-[#333] bg-[#1a1a1a]')}`
                    : `border-2 ${step === 3 ? 'border-rose-500/80 bg-rose-950/40' : (step >= 4 ? 'border-emerald-500/50 bg-slate-800' : 'border-slate-700 bg-slate-800')}`
                }`}
                animate={step === 3 ? { x: [-5, 5, -5, 5, 0] } : { x: 0 }}
                transition={{ duration: 0.4 }}
              >
                <span className={`font-bold mb-3 flex items-center gap-2 ${
                  isBwMode 
                    ? (step === 3 ? 'text-white underline' : (step >= 4 ? 'text-white' : 'text-slate-500'))
                    : (step === 3 ? 'text-rose-400' : (step >= 4 ? 'text-emerald-400' : 'text-slate-400'))
                }`}>
                  <MonitorDown size={18} /> Core B
                </span>
                
                <div className="w-full bg-black/50 p-3 rounded text-center font-mono text-sm">
                   {step < 3 && <span className="text-slate-600">Empty</span>}
                   {step === 3 && <span className={errorTextClass}>X: 10</span>}
                   {step >= 4 && <span className={highlightClass}>X: 15</span>}
                </div>

                {/* Stale Alert */}
                <AnimatePresence>
                  {step === 3 && (
                    <motion.div 
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0 }}
                      className={`absolute -bottom-4 right-1/2 translate-x-1/2 text-xs font-bold px-3 py-1.5 rounded flex items-center gap-1 shadow-lg pointer-events-none whitespace-nowrap z-20 ${errorBadgeClass}`}
                    >
                      <AlertTriangle className="w-4 h-4" /> Stale Data!
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>

          </div>
        </div>
      </motion.div>

      {/* Control Flow UI */}
      <div className={`w-full max-w-4xl p-6 rounded-xl mb-8 flex flex-col md:flex-row items-center justify-between gap-6 shadow-3d ${surfaceClass}`}>
        
        <div className="flex-1 flex flex-col">
          <div className="flex items-center gap-3 mb-2">
            <span className={`text-xs font-bold px-2 py-1 rounded ${isBwMode ? 'bg-white text-black' : 'bg-primary/20 text-primary border border-primary/30'}`}>
              Step {step + 1} of 5
            </span>
            <h3 className="text-xl font-bold text-white">{stepConfigs[step].title}</h3>
          </div>
          <p className="text-slate-400 text-sm leading-relaxed min-h-[40px]">
            {stepConfigs[step].description}
          </p>
        </div>

        <div className="flex flex-wrap sm:flex-nowrap items-center justify-center gap-3 shrink-0">
          
          <button
            onClick={prevStep}
            disabled={step === 0}
            className={`px-4 py-2 text-sm font-semibold rounded-lg transition-colors border ${
              step === 0 
               ? 'opacity-50 cursor-not-allowed border-transparent text-slate-500' 
               : (isBwMode ? 'border-white text-white hover:bg-white hover:text-black' : 'border-white/10 text-white hover:bg-white/10')
            }`}
          >
            Previous
          </button>
          
          <button
            onClick={step === 4 ? onNext : nextStep}
            className={`flex items-center gap-2 px-6 py-3 font-bold rounded-lg transition-all duration-300 shadow-3d ${
              isBwMode 
               ? 'bg-white text-black hover:bg-gray-200' 
               : 'bg-primary text-white hover:bg-blue-600'
            }`}
          >
            {step === 4 ? (
              <>
                Select Protocol <ArrowRight className="w-4 h-4" />
              </>
            ) : (
              <>
                {stepConfigs[step].actionLabel} <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>

      {/* Educational Error Explanation Section */}
      <AnimatePresence>
        {step >= 2 && (
          <motion.div
            initial={{ opacity: 0, height: 0, scale: 0.95 }}
            animate={{ opacity: 1, height: 'auto', scale: 1 }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className={`w-full max-w-5xl rounded-2xl mb-8 overflow-hidden shadow-3d border ${
              isBwMode ? 'bg-[#111] border-white/40' : 'bg-red-950/20 border-rose-500/30'
            }`}
          >
            {/* Header */}
            <div className={`p-4 border-b flex items-center gap-3 ${
              isBwMode ? 'bg-white text-black border-white/20' : 'bg-rose-500/10 border-rose-500/20'
            }`}>
               <AlertOctagon className={`w-6 h-6 ${isBwMode ? 'text-black' : 'text-rose-500'}`} />
               <h3 className={`text-xl font-bold tracking-wide ${isBwMode ? 'text-black' : 'text-rose-400'}`}>
                 Cache Coherence Error Explained
               </h3>
            </div>
            
            {/* Content Grid */}
            <div className="p-6 md:p-8 grid md:grid-cols-2 gap-8">
              
              {/* Left Column */}
              <div className="space-y-6">
                <div>
                  <h4 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isBwMode ? 'text-white' : 'text-slate-200'}`}>
                    <AlertTriangle className={`w-5 h-5 ${isBwMode ? 'text-white' : 'text-rose-400'}`} />
                    What is the Error?
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    A cache coherence error occurs when multiple processors have <strong>inconsistent copies of the same memory data</strong>. As you can see above, Core A updated the value of X to 15, but Core B is completely unaware and continues to use the old, <strong>stale value</strong> of 10.
                  </p>
                </div>
                
                <div>
                  <h4 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isBwMode ? 'text-white' : 'text-slate-200'}`}>
                    <Zap className={`w-5 h-5 ${isBwMode ? 'text-white' : 'text-amber-400'}`} />
                    How It Occurs
                  </h4>
                  <ol className="text-sm text-slate-400 list-decimal list-inside space-y-1">
                    <li>Core A reads data from Main Memory.</li>
                    <li>Core A modifies the value locally in its private L1 Cache.</li>
                    <li>Core B reads the same data from Main Memory.</li>
                    <li><span className={isBwMode ? "font-bold text-white underline" : "text-rose-400 font-bold"}>Core B receives stale data</span>, causing inconsistency.</li>
                  </ol>
                </div>
              </div>

              {/* Right Column */}
              <div className="space-y-6">
                <div>
                  <h4 className={`text-lg font-bold mb-2 flex items-center gap-2 ${isBwMode ? 'text-white' : 'text-slate-200'}`}>
                    <ShieldAlert className={`w-5 h-5 ${isBwMode ? 'text-white' : 'text-rose-400'}`} />
                    Why This is a Problem (Risks)
                  </h4>
                  <ul className="text-sm text-slate-400 list-disc list-inside space-y-1">
                    <li><strong>Incorrect Program Execution:</strong> Logic based on stale data fails.</li>
                    <li><strong>System Instability:</strong> Threads crash due to out-of-sync states.</li>
                    <li><strong>Silent Failures:</strong> These bugs are notoriously difficult to track down and debug in parallel systems.</li>
                  </ul>
                </div>

                <div className={`p-4 rounded-xl border ${isBwMode ? 'bg-[#222] border-[#444]' : 'bg-black/30 border-white/5'}`}>
                  <h4 className={`text-md font-bold mb-2 flex items-center gap-2 ${isBwMode ? 'text-white' : 'text-emerald-400'}`}>
                    <CheckCircle className="w-5 h-5" />
                    Why It Must Be Solved
                  </h4>
                  <p className="text-sm text-slate-400 leading-relaxed">
                    A multi-core system must ensure all processors see the exact same data to maintain correctness. This simulator demonstrates how hardware protocols (like <strong>MSI, MESI, and MOESI</strong>) automatically solve this problem by snooping the bus and updating or invalidating caches instantly.
                  </p>
                </div>
              </div>

            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {step === 4 && (
        <motion.button
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          onClick={resetFlow}
          className="mt-6 text-sm text-slate-500 hover:text-white underline transition-colors"
        >
          Restart Flow
        </motion.button>
      )}
    </div>
  );
};

export default ProblemDescriptionScreen;
