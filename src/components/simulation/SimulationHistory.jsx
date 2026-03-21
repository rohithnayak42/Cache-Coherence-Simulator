import React from 'react';
import { motion } from 'framer-motion';
import { History, Clock, X, Database, Activity } from 'lucide-react';
import { useBwMode } from '../../hooks/useBwMode';

const getBadgeClasses = (type, value, isBwMode) => {
  if (type === 'STATE') {
    if (isBwMode) {
      if (value === 'M') return 'bg-[#0f172a] text-white border-[#0f172a]';
      if (value === 'I') return 'bg-gray-100 text-[#94a3b8] border-[#e2e8f0]';
      return 'bg-white text-[#0f172a] border border-[#cbd5f5]';
    }
    const STATE_BADGE = {
      M: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
      O: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
      E: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
      S: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
      I: 'bg-slate-700/40 text-slate-500 border-slate-700',
    };
    return STATE_BADGE[value] || STATE_BADGE['I'];
  }
  
  if (type === 'OP') {
    if (isBwMode) {
      return value === 'READ' ? 'bg-[#eff6ff] text-[#2563eb] border-[#bfdbfe]' : 'bg-[#fffbeb] text-[#d97706] border-[#fde68a]';
    }
    const OP_BADGE = {
      READ:  'bg-blue-500/15 text-blue-400',
      WRITE: 'bg-amber-500/15 text-amber-400',
    };
    return OP_BADGE[value] || 'bg-slate-700 text-slate-300';
  }
  
  if (type === 'RESULT') {
    if (isBwMode) {
      return value === 'HIT' ? 'bg-[#f0fdf4] text-[#16a34a] border-[#bbf7d0]' : 'bg-[#fef2f2] text-[#dc2626] border-[#fecaca]';
    }
    const RESULT_BADGE = {
      HIT:  'bg-emerald-500/15 text-emerald-400',
      MISS: 'bg-rose-500/15 text-rose-400',
    };
    return RESULT_BADGE[value] || 'bg-slate-700 text-slate-300';
  }
};

/**
 * SimulationHistory — fully client-side history panel.
 * Receives `history` prop: array of snapshots from useSimulation.
 */
export const SimulationHistory = ({ isOpen, onClose, history = [], onClearHistory }) => {
  const isBwMode = useBwMode();

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className={`absolute inset-0 backdrop-blur-sm ${isBwMode ? 'bg-slate-900/40' : 'bg-black/60'}`}
      />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className={`relative w-full max-w-2xl border rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh] ${
          isBwMode ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-slate-900 border-white/10'
        }`}
      >
        {/* Header */}
        <div className={`px-6 py-4 border-b flex items-center justify-between shrink-0 ${isBwMode ? 'bg-white border-[#e2e8f0]' : 'bg-white/5 border-white/5'}`}>
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${isBwMode ? 'bg-[#eff6ff]' : 'bg-blue-500/20'}`}>
              <History className={`w-5 h-5 ${isBwMode ? 'text-[#2563eb]' : 'text-blue-400'}`} />
            </div>
            <div>
              <h3 className={`font-bold tracking-wide ${isBwMode ? 'text-[#0f172a]' : 'text-white'}`}>Simulation History</h3>
              <p className={`text-xs ${isBwMode ? 'text-[#475569]' : 'text-slate-500'}`}>{history.length} operation{history.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {history.length > 0 && (
              <button
                onClick={() => {
                  if (window.confirm("Are you sure you want to clear history?")) {
                    onClearHistory?.();
                  }
                }}
                className={`px-3 py-1.5 text-xs font-bold rounded-lg transition-colors active:scale-95 border ${isBwMode ? 'text-[#ef4444] bg-white hover:bg-[#ef4444] hover:text-white border-[#ef4444]' : 'text-red-400 bg-red-500/10 hover:bg-red-500/20 border-red-500/30'}`}
              >
                Clear History
              </button>
            )}
            <button
              onClick={onClose}
              className={`p-2 rounded-full transition-colors ${isBwMode ? 'text-[#475569] hover:text-[#0f172a] hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-white/10'}`}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
              <Database className="w-12 h-12 text-slate-500" />
              <p className="text-slate-500 text-sm">No history yet. Perform operations to see snapshots here.</p>
            </div>
          ) : (
            history.map((snap, index) => (
              <div
                key={snap.id}
                className={`p-4 rounded-xl transition-all duration-200 border ${
                  isBwMode 
                    ? index % 2 === 0 ? 'bg-white border-[#e2e8f0]' : 'bg-[#f8fafc] border-[#e2e8f0]'
                    : 'bg-white/4 border-white/5 hover:border-blue-500/20'
                }`}
              >
                {/* Row 1: step, time, op, result, state */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className={`font-mono text-xs font-bold ${isBwMode ? 'text-[#475569]' : 'text-slate-500'}`}>T{snap.step}</span>
                  <span className={`${isBwMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>·</span>
                  <span className={`flex items-center gap-1 text-xs ${isBwMode ? 'text-[#475569]' : 'text-slate-500'}`}>
                    <Clock className="w-3 h-3" />{snap.time}
                  </span>
                  <span className={`${isBwMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>·</span>
                  <span className={`font-bold text-xs ${isBwMode ? 'text-[#0f172a]' : 'text-white'}`}>{snap.processor}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold border ${getBadgeClasses('OP', snap.operation, isBwMode)}`}>
                    {snap.operation}
                  </span>
                  <span className={`font-mono text-xs px-1.5 py-0.5 rounded ${isBwMode ? 'text-[#2563eb] bg-[#eff6ff]' : 'text-blue-300 bg-blue-500/10'}`}>{snap.address}</span>
                  {snap.result && (
                    <span className={`text-xs px-2 py-0.5 rounded border font-bold ${getBadgeClasses('RESULT', snap.result, isBwMode)}`}>
                      {snap.result}
                    </span>
                  )}
                  {snap.state && (
                    <span className={`text-xs px-2 py-0.5 rounded border font-bold ${getBadgeClasses('STATE', snap.state, isBwMode)}`}>
                      {snap.state}
                    </span>
                  )}
                </div>

                {/* Row 2: Cache states across all processors */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {snap.processors.map(p => {
                    const entries = Object.entries(p.cache).filter(([, line]) => line.state !== 'I');
                    return (
                      <div key={p.id} className={`flex items-center gap-1 border rounded-lg px-2 py-1 ${isBwMode ? 'bg-white border-[#e2e8f0]' : 'bg-black/40 border-white/5'}`}>
                        <span className={`text-xs font-bold mr-1 ${isBwMode ? 'text-[#22c55e]' : 'text-emerald-400'}`}>{p.id}</span>
                        {entries.length === 0 ? (
                          <span className={`text-xs italic ${isBwMode ? 'text-[#94a3b8]' : 'text-slate-600'}`}>empty</span>
                        ) : (
                          entries.map(([addr, line]) => (
                            <span key={addr} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${getBadgeClasses('STATE', line.state, isBwMode)}`}>
                              {addr}:{line.state}
                            </span>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Row 3: Metrics at this point */}
                <div className={`flex flex-wrap gap-3 text-[10px] font-mono ${isBwMode ? 'text-[#475569]' : 'text-slate-500'}`}>
                  <span>Hits: <span className={`font-bold ${isBwMode ? 'text-[#22c55e]' : 'text-emerald-400'}`}>{snap.stats.hits}</span></span>
                  <span>Misses: <span className={`font-bold ${isBwMode ? 'text-[#ef4444]' : 'text-rose-400'}`}>{snap.stats.misses}</span></span>
                  <span>Bus: <span className={`font-bold ${isBwMode ? 'text-[#f59e0b]' : 'text-amber-400'}`}>{snap.stats.busTraffic}</span></span>
                  <span>Transitions: <span className={`font-bold ${isBwMode ? 'text-[#3b82f6]' : 'text-blue-400'}`}>{snap.stats.transitions}</span></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className={`px-6 py-3 border-t flex items-center justify-between shrink-0 ${isBwMode ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-black/20 border-white/5'}`}>
          <div className={`flex items-center gap-2 text-xs ${isBwMode ? 'text-[#475569]' : 'text-slate-500'}`}>
            <Activity className="w-3 h-3" />
            {history.length} snapshot{history.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className={`text-[10px] font-black uppercase tracking-widest transition-colors ${isBwMode ? 'text-[#475569] hover:text-[#0f172a]' : 'text-slate-400 hover:text-white'}`}
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
