import React from 'react';
import { 
  ArrowLeft, 
  RotateCcw, 
  Save, 
  History as HistoryIcon, 
  CheckCircle2, 
  Database 
} from 'lucide-react';
import { useBwMode } from '../../hooks/useBwMode';

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
  const isBwMode = useBwMode();

  return (
    <div className="flex flex-col gap-6 border-t border-white/5 pt-5 w-full">
      {/* Top Row: Protocol on Left, Actions on Right */}
      <div className="flex flex-wrap items-center justify-between gap-4 w-full">
        {/* Left: Change Protocol */}
        <button
          onClick={onBack}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl transition-colors font-medium text-lg shrink-0 ${isBwMode ? 'text-[#475569] hover:text-[#0f172a] hover:bg-black/5' : 'text-slate-400 hover:text-white hover:bg-white/5'}`}
        >
          <ArrowLeft className="w-5 h-5" /> Change Protocol
        </button>

        {/* Right: Action buttons */}
        <div className="flex flex-wrap items-center justify-end gap-2">
          <button
            onClick={onShowHistory}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border text-sm font-bold active:scale-95 ${isBwMode ? 'bg-white text-[#475569] border-[#e2e8f0] hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.1)] hover:text-[#0f172a]' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/5'}`}
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
              className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border text-sm font-bold animate-pulse active:scale-95 ${isBwMode ? 'bg-[#22c55e] text-white border-[#22c55e] hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(34,197,94,0.2)]' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/30'}`}
            >
              <Database className="w-4 h-4" /> Update Main Memory
            </button>
          )}

          <button
            onClick={onSave}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border text-sm font-bold active:scale-95 ${
              saveSuccess
                ? (isBwMode ? 'bg-[#22c55e] border-[#22c55e] text-white' : 'bg-green-500/20 border-green-500/50 text-green-400')
                : (isBwMode ? 'bg-[#2563eb] text-white hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(37,99,235,0.2)] border-[#2563eb]' : 'bg-blue-500/10 hover:bg-blue-500/20 border-blue-500/30 text-blue-400')
            }`}
          >
            {saveSuccess ? <CheckCircle2 className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saveSuccess ? 'Saved!' : 'Save'}
          </button>

          <button
            onClick={onReset}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl transition-all border text-sm font-bold active:scale-95 ${isBwMode ? 'bg-[#ef4444] text-white border-[#ef4444] hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(239,68,68,0.2)]' : 'bg-red-500/10 hover:bg-red-500/20 text-red-400 border-red-500/30'}`}
          >
            <RotateCcw className="w-4 h-4" /> Reset Simulation
          </button>
        </div>
      </div>

      {/* Bottom Row: Core Selection */}
      <div className="flex justify-center w-full">
        <div className={`flex flex-wrap justify-center p-1 rounded-xl border shadow-inner ${isBwMode ? 'bg-[#f1f5f9] border-[#e2e8f0]' : 'bg-black/40 border-white/5'}`}>
          {[2, 3, 4, 5, 6, 7, 8].map((count) => (
            <button
              key={count}
              onClick={() => onCoreChange(count)}
              className={`px-4 py-2 font-bold text-sm rounded-lg transition-all m-0.5 ${
                processorCount === count
                  ? (isBwMode ? 'bg-[#2563eb] text-white shadow-md shadow-[#2563eb]/30' : 'bg-blue-500 text-white shadow-md shadow-blue-500/30')
                  : (isBwMode ? 'text-[#475569] hover:text-[#0f172a] hover:bg-black/5' : 'text-slate-400 hover:text-white hover:bg-white/10')
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
