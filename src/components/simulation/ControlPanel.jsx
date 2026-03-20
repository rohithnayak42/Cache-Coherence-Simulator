import React from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Save, 
  History as HistoryIcon, 
  CheckCircle2, 
  Database 
} from 'lucide-react';

export const ControlPanel = ({
  onBack,
  processorCount,
  onCoreChange,
  historyCount,
  onShowHistory,
  hasDirtyLines,
  onFlushMemory,
  onSave,
  saveSuccess,
  onReset
}) => {
  return (
    <div className="flex flex-col gap-6 border-t border-white/5 pt-5 w-full">
      {/* Top Row: Protocol on Left, Actions on Right */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Left: Change Protocol */}
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-white/5 transition-colors font-medium text-lg shrink-0"
        >
          <ArrowLeft className="w-5 h-5" /> Change Protocol
        </button>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onShowHistory}
            className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 text-slate-300 rounded-xl transition-all border border-white/5 text-sm font-bold"
          >
            <HistoryIcon className="w-4 h-4" /> History
            {historyCount > 0 && (
              <span className="ml-1 bg-blue-500/30 text-blue-300 text-[10px] font-black px-1.5 py-0.5 rounded-full">
                {historyCount}
              </span>
            )}
          </button>

          {hasDirtyLines && (
            <button
              onClick={() => {
                if (window.confirm("Do you want to update main memory?")) {
                  onFlushMemory();
                }
              }}
              className="flex items-center gap-2 px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 rounded-xl transition-all border border-emerald-500/30 text-sm font-bold animate-pulse"
            >
              <Database className="w-4 h-4" /> Update Main Memory
            </button>
          )}

          <button
            onClick={onSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border text-sm font-bold ${
              saveSuccess
                ? 'bg-green-500/20 border-green-500/50 text-green-400'
                : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400'
            }`}
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Saved!' : 'Save'}
          </button>

          <button
            onClick={onReset}
            className="flex items-center gap-2 px-4 py-2 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-xl transition-all border border-red-500/30 text-sm font-bold"
          >
            <RotateCcw className="w-4 h-4" /> Reset Simulation
          </button>
        </div>
      </div>

      {/* Bottom Row: Core Selection */}
      <div className="flex justify-center w-full">
        <div className="flex flex-wrap justify-center bg-black/40 p-1 rounded-xl border border-white/5 shadow-inner">
          {[2, 3, 4, 5, 6, 7, 8].map((count) => (
            <button
              key={count}
              onClick={() => onCoreChange(count)}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-all m-0.5 ${
                processorCount === count
                  ? 'bg-blue-500 text-white shadow-md shadow-blue-500/30'
                  : 'text-slate-400 hover:text-white hover:bg-white/10'
              }`}
            >
              {count} Cores
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
