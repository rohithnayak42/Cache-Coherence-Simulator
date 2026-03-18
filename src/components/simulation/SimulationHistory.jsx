import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { History, Cloud, Clock, Database, ChevronRight, AlertCircle, Loader2 } from 'lucide-react';

export const SimulationHistory = ({ isOpen, onClose }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchHistory = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/simulation/history');
      if (!response.ok) throw new Error('Failed to fetch history');
      const data = await response.json();
      setHistory(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) fetchHistory();
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
      />
      
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        exit={{ scale: 0.9, opacity: 0, y: 20 }}
        className="relative w-full max-w-2xl bg-slate-900 border border-white/10 rounded-2xl overflow-hidden glass-panel shadow-2xl"
      >
        {/* Header */}
        <div className="px-6 py-4 border-b border-white/5 flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 rounded-lg">
              <History className="w-5 h-5 text-blue-400" />
            </div>
            <div>
              <h3 className="font-bold text-white tracking-wide">Simulation History</h3>
              <p className="text-[10px] text-slate-500 uppercase tracking-widest font-bold">Neon PostgreSQL Cloud Records</p>
            </div>
          </div>
          <button 
            onClick={onClose}
            className="p-2 hover:bg-white/10 rounded-full transition-colors text-slate-400 hover:text-white"
          >
            <ChevronRight className="w-5 h-5 rotate-90" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <Loader2 className="w-8 h-8 text-blue-400 animate-spin" />
              <p className="text-slate-400 text-sm animate-pulse">Fetching records from Neon DB...</p>
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
              <AlertCircle className="w-10 h-10 text-red-400 opacity-50" />
              <p className="text-red-400 text-sm">{error}</p>
              <button 
                onClick={fetchHistory}
                className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-lg text-xs transition-colors"
              >
                Try Again
              </button>
            </div>
          ) : history.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-3 opacity-40">
              <Database className="w-12 h-12 text-slate-500" />
              <p className="text-slate-500 text-sm">No simulation records found.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {history.map((record) => (
                <div 
                  key={record.id}
                  className="group p-4 bg-white/5 border border-white/5 hover:border-blue-500/30 rounded-xl transition-all duration-300"
                >
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2">
                        <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 text-[10px] font-black rounded uppercase tracking-tighter">
                          {record.protocol}
                        </span>
                        <span className="text-xs text-white font-bold">{record.processor_count} Cores</span>
                      </div>
                      <p className="text-[10px] text-slate-500 font-mono flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(record.created_at).toLocaleString()}
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-4 text-right">
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Hit Rate</p>
                        <p className="text-sm font-black text-cyan-400">{record.hit_rate}%</p>
                      </div>
                      <div className="space-y-0.5">
                        <p className="text-[10px] text-slate-500 uppercase tracking-widest font-black">Bus Traffic</p>
                        <p className="text-sm font-black text-white">{record.bus_traffic}</p>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-black/20 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-2 opacity-30">
            <Cloud className="w-4 h-4 text-slate-400" />
            <span className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Neon PostgreSQL Cloud</span>
          </div>
          <button 
            onClick={fetchHistory}
            className="text-[10px] font-black text-blue-400 hover:text-blue-300 uppercase tracking-widest transition-colors"
          >
            Refresh List
          </button>
        </div>
      </motion.div>
    </div>
  );
};
