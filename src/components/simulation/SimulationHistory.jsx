import React from 'react';
import { motion } from 'framer-motion';
import { History, Clock, X, Database, Activity } from 'lucide-react';

const STATE_BADGE = {
  M: 'bg-rose-500/20 text-rose-400 border-rose-500/40',
  O: 'bg-purple-500/20 text-purple-400 border-purple-500/40',
  E: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40',
  S: 'bg-blue-500/20 text-blue-400 border-blue-500/40',
  I: 'bg-slate-700/40 text-slate-500 border-slate-700',
};

const OP_BADGE = {
  READ:  'bg-blue-500/15 text-blue-400',
  WRITE: 'bg-amber-500/15 text-amber-400',
};

const RESULT_BADGE = {
  HIT:  'bg-emerald-500/15 text-emerald-400',
  MISS: 'bg-rose-500/15 text-rose-400',
};

/**
 * SimulationHistory — fully client-side history panel.
 * Receives `history` prop: array of snapshots from useSimulation.
 */
export const SimulationHistory = ({ isOpen, onClose, history = [] }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />

      {/* Panel */}
      <motion.div
        initial={{ scale: 0.92, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.92, opacity: 0, y: 20 }}
        transition={{ type: 'spring', stiffness: 300, damping: 30 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden shadow-2xl flex flex-col max-h-[80vh]"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5 shrink-0">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-wide">Simulation History</h3>
              <p className="text-xs text-slate-500">{history.length} operation{history.length !== 1 ? 's' : ''} recorded</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 space-y-3 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
          {history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
              <Database className="w-12 h-12 text-slate-500" />
              <p className="text-slate-500 text-sm">No history yet. Perform operations to see snapshots here.</p>
            </div>
          ) : (
            history.map((snap) => (
              <div
                key={snap.id}
                className="p-4 bg-white/4 border border-white/5 hover:border-blue-500/20 rounded-xl transition-all duration-200"
              >
                {/* Row 1: step, time, op, result, state */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  <span className="font-mono text-xs text-slate-500 font-bold">T{snap.step}</span>
                  <span className="text-slate-600">·</span>
                  <span className="flex items-center gap-1 text-xs text-slate-500">
                    <Clock className="w-3 h-3" />{snap.time}
                  </span>
                  <span className="text-slate-600">·</span>
                  <span className="font-bold text-white text-xs">{snap.processor}</span>
                  <span className={`text-xs px-2 py-0.5 rounded font-bold ${OP_BADGE[snap.operation] || 'bg-slate-700 text-slate-300'}`}>
                    {snap.operation}
                  </span>
                  <span className="font-mono text-xs text-blue-300 bg-blue-500/10 px-1.5 py-0.5 rounded">{snap.address}</span>
                  {snap.result && (
                    <span className={`text-xs px-2 py-0.5 rounded font-bold ${RESULT_BADGE[snap.result] || 'bg-slate-700 text-slate-300'}`}>
                      {snap.result}
                    </span>
                  )}
                  {snap.state && (
                    <span className={`text-xs px-2 py-0.5 rounded border font-bold ${STATE_BADGE[snap.state] || STATE_BADGE['I']}`}>
                      {snap.state}
                    </span>
                  )}
                </div>

                {/* Row 2: Cache states across all processors */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {snap.processors.map(p => {
                    const entries = Object.entries(p.cache).filter(([, line]) => line.state !== 'I');
                    return (
                      <div key={p.id} className="flex items-center gap-1 bg-black/40 border border-white/5 rounded-lg px-2 py-1">
                        <span className="text-xs text-emerald-400 font-bold mr-1">{p.id}</span>
                        {entries.length === 0 ? (
                          <span className="text-xs text-slate-600 italic">empty</span>
                        ) : (
                          entries.map(([addr, line]) => (
                            <span key={addr} className={`text-[10px] px-1.5 py-0.5 rounded border font-mono font-bold ${STATE_BADGE[line.state] || STATE_BADGE['I']}`}>
                              {addr}:{line.state}
                            </span>
                          ))
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Row 3: Metrics at this point */}
                <div className="flex flex-wrap gap-3 text-[10px] font-mono text-slate-500">
                  <span>Hits: <span className="text-emerald-400 font-bold">{snap.stats.hits}</span></span>
                  <span>Misses: <span className="text-rose-400 font-bold">{snap.stats.misses}</span></span>
                  <span>Bus: <span className="text-amber-400 font-bold">{snap.stats.busTraffic}</span></span>
                  <span>Transitions: <span className="text-blue-400 font-bold">{snap.stats.transitions}</span></span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-black/20 border-t border-white/5 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2 text-slate-500 text-xs">
            <Activity className="w-3 h-3" />
            {history.length} snapshot{history.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className="text-[10px] font-black text-slate-400 hover:text-white uppercase tracking-widest transition-colors"
          >
            Close
          </button>
        </div>
      </motion.div>
    </div>
  );
};
