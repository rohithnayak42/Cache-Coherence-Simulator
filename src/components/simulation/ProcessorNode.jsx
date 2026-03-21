import React, { useState, useEffect, useCallback, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Cpu, HardDrive, Activity, RefreshCw, Edit2, Check } from 'lucide-react';

import { useBwMode } from '../../hooks/useBwMode';

const STATE_COLORS = {
  'M': 'bg-rose-500 text-white border-rose-600',
  'O': 'bg-purple-500 text-white border-purple-600',
  'E': 'bg-emerald-500 text-white border-emerald-600',
  'S': 'bg-blue-500 text-white border-blue-600',
  'I': 'bg-slate-700 text-slate-400 border-slate-800 line-through opacity-70',
};

const PROTOCOL_STATES = {
  MSI: ['M', 'S', 'I'],
  MESI: ['M', 'E', 'S', 'I'],
  MOESI: ['M', 'O', 'E', 'S', 'I']
};

export const ProcessorNode = memo(({ processor, protocol, isActive, onExecute, busMessage }) => {
  const [addrInput, setAddrInput] = useState('0x00');
  const [valueInput, setValueInput] = useState('');
  const [addrError, setAddrError] = useState('');
  const [valueError, setValueError] = useState('');
  const isBwMode = useBwMode();
  
  // Inline cache editing state
  const [editingAddr, setEditingAddr] = useState(null);
  const [cacheEditValue, setCacheEditValue] = useState("");

  const isValidAddress = (addr) => {
    if (!addr.trim()) return false;
    if (/^0x[0-9a-fA-F]+$/i.test(addr.trim())) return true;
    if (/^\d+$/.test(addr.trim())) return true;
    return false;
  };

  const handleRead = useCallback(() => {
    let valid = true;
    if (!isValidAddress(addrInput)) {
      setAddrError('Enter a valid hex (0x..) or decimal address');
      valid = false;
    } else {
      setAddrError('');
    }
    if (!valid) return;
    onExecute(processor.id, 'READ', addrInput.trim());
  }, [onExecute, processor.id, addrInput]);

  const handleWrite = useCallback(() => {
    let valid = true;
    if (!isValidAddress(addrInput)) {
      setAddrError('Enter a valid hex (0x..) or decimal address');
      valid = false;
    } else {
      setAddrError('');
    }
    if (valueInput.trim() === '') {
      setValueError('Value is required for Write');
      valid = false;
    } else if (isNaN(Number(valueInput.trim()))) {
      setValueError('Value must be a number');
      valid = false;
    } else {
      setValueError('');
    }
    if (!valid) return;
    onExecute(processor.id, 'WRITE', addrInput.trim(), Number(valueInput.trim()));
  }, [onExecute, processor.id, addrInput, valueInput]);

  const startInlineEdit = (addr, currentValue) => {
    setEditingAddr(addr);
    setCacheEditValue(currentValue.toString());
  };

  const saveInlineEdit = (addr) => {
    if (cacheEditValue.trim() !== '') {
      onExecute(processor.id, 'WRITE', addr, parseInt(cacheEditValue, 10));
    }
    setEditingAddr(null);
  };

  const handleInlineKeyDown = (e, addr) => {
    if (e.key === 'Enter') saveInlineEdit(addr);
    else if (e.key === 'Escape') setEditingAddr(null);
  };

  const isTargeted = busMessage && busMessage.sender !== processor.id && processor.cache[busMessage.address];

  // Colors based on theme
  const surfaceClass = isBwMode 
    ? (isActive ? 'bg-white border-blue-500' : (isTargeted ? 'bg-white border-amber-500' : 'bg-white border-[#e2e8f0]')) 
    : (isActive ? 'bg-surface/90 border-blue-500/80' : (isTargeted ? 'bg-surface/90 border-amber-500/50' : 'bg-surface/90 border-white/10'));

  const shadowClass = isBwMode 
    ? (isActive ? 'shadow-[0_0_15px_rgba(37,99,235,0.2)]' : (isTargeted ? 'shadow-[0_0_15px_rgba(245,158,11,0.2)]' : 'shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-1 hover:shadow-[0_6px_14px_rgba(0,0,0,0.1)] transition-all duration-250 ease-in-out')) 
    : (isActive ? 'shadow-[0_0_30px_rgba(59,130,246,0.6)]' : (isTargeted ? 'shadow-[0_10px_30px_rgba(251,191,36,0.15)]' : 'shadow-xl'));

  const busLineColor = isBwMode
    ? (isActive ? 'bg-blue-600' : isTargeted ? 'bg-amber-500' : 'bg-[#e2e8f0]')
    : (isActive ? 'bg-primary shadow-[0_0_10px_rgba(59,130,246,0.8)]' : isTargeted ? 'bg-amber-400 shadow-[0_0_10px_rgba(251,191,36,0.8)]' : 'bg-slate-700');

  const textColor = isBwMode ? 'text-[#0f172a]' : (isActive ? 'text-primary' : 'text-slate-400');
  
  const getStateBadgeClass = (state) => {
    if (isBwMode) {
      if (state === 'I') return 'bg-gray-100 text-[#94a3b8] line-through';
      if (state === 'M') return 'bg-[#0f172a] text-white font-extrabold';
      return 'bg-white text-[#0f172a] border border-[#e2e8f0]';
    }
    return STATE_COLORS[state] || STATE_COLORS['I'];
  };

  return (
    <div className="flex flex-col items-center flex-1 z-10 w-full min-w-0">
      {/* Connection up to bus */}
      <div className={`w-[3px] h-16 transition-colors duration-300 ${busLineColor}`} />
      
      <motion.div 
        animate={{ y: isActive ? -10 : 0 }}
        className={`w-full rounded-2xl p-5 relative overflow-hidden transition-all duration-300 border-2 ${surfaceClass} ${shadowClass}`}
      >
        {/* Header */}
        <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-3">
          <div className="flex items-center gap-2">
            <Cpu className={`w-5 h-5 ${textColor}`} />
            <h4 className={`font-bold text-lg ${isBwMode ? 'text-[#0f172a]' : 'text-white'}`}>{processor.id}</h4>
          </div>
          {isActive && (
             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isBwMode ? 'bg-[#f8fafc] text-[#2563eb] border border-[#2563eb]' : 'text-primary bg-primary/20'}`}>
               <Activity className="w-3 h-3" /> ACTIVE
             </motion.div>
          )}
          {isTargeted && (
             <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} className={`flex items-center gap-1 text-xs font-bold px-2 py-1 rounded-full ${isBwMode ? 'bg-[#f8fafc] text-[#f59e0b] border border-[#e2e8f0]' : 'text-amber-400 bg-amber-400/20'}`}>
               <RefreshCw className="w-3 h-3 animate-spin duration-3000" /> SNOOPING
             </motion.div>
          )}
        </div>

        {/* L1 Cache Visualization */}
        <div className="mb-6 min-h-[140px]">
          <div className="flex items-center gap-2 text-xs font-bold text-slate-400 mb-2 uppercase tracking-wider">
            <HardDrive className="w-3 h-3" /> L1 Cache
          </div>
          <div className="space-y-2">
            {Object.keys(processor.cache).length === 0 ? (
              <div className="p-3 bg-black/30 rounded border border-white/5 text-center text-sm text-slate-500 italic">Cache Empty</div>
            ) : (
              Object.entries(processor.cache).map(([addr, line]) => {
                const isLineActive = busMessage?.address === addr;
                return (
                  <motion.div 
                    key={addr}
                    layoutId={`cache-${processor.id}-${addr}`}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0, scale: isLineActive ? 1.02 : 1 }}
                    className={`flex items-center justify-between p-2 rounded border font-mono text-sm transition-all group
                      ${isBwMode 
                        ? (isLineActive ? 'bg-white border-[#2563eb] shadow-[0_0_0_1px_rgba(37,99,235,0.2)]' : 'bg-white border-[#e2e8f0]') 
                        : (isLineActive ? (isTargeted ? 'border-amber-500/50 bg-amber-500/10' : 'border-primary/50 bg-primary/10') : 'bg-black/40 border-white/5')
                      }
                    `}
                  >
                    <span className={`${isBwMode ? 'text-[#475569]' : 'text-slate-400'}`}>{addr}</span>
                    
                    {editingAddr === addr ? (
                       <div className="flex items-center gap-1">
                          <input 
                            type="number"
                            value={cacheEditValue}
                            onChange={(e) => setCacheEditValue(e.target.value)}
                            onKeyDown={(e) => handleInlineKeyDown(e, addr)}
                            onBlur={() => saveInlineEdit(addr)}
                              className={`w-12 text-center text-sm font-bold border rounded px-1 py-0.5 outline-none
                               ${isBwMode ? 'bg-[#f9fafb] text-[#0f172a] border-[#cbd5f5] focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.2)]' : 'bg-black text-white border-primary/50 focus:border-primary'}`}
                             autoFocus
                          />
                          <button onMouseDown={() => saveInlineEdit(addr)} className={`${isBwMode ? 'text-[#22c55e]' : 'text-emerald-400'}`}>
                             <Check className="w-3.5 h-3.5" />
                          </button>
                       </div>
                    ) : (
                       <div className="flex items-center gap-2">
                         <span className={`font-bold transition-all ${isBwMode ? 'text-[#0f172a]' : (isLineActive && !isTargeted ? 'text-primary drop-shadow-[0_0_5px_rgba(59,130,246,0.8)]' : 'text-white')}`}>
                           {line.data ?? line.value}
                         </span>
                         <button 
                             onClick={() => startInlineEdit(addr, line.data ?? line.value)}
                             className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded hover:bg-black/5
                                ${isBwMode ? 'text-[#94a3b8] hover:text-[#0f172a]' : 'text-slate-500 hover:text-white'}`}
                             title="Edit Cache Line"
                           >
                            <Edit2 className="w-3 h-3" />
                         </button>
                       </div>
                    )}

                    <span className={`px-2 py-0.5 rounded text-xs font-bold border ${getStateBadgeClass(line.state)}`}>
                      {line.state}
                    </span>
                  </motion.div>
                );
              })
            )}
          </div>
        </div>

        {/* Action Controls */}
        <div className={`p-4 rounded-xl border ${isBwMode ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-black/30 border-white/5'}`}>
          {/* Address Input */}
          <div className="mb-2">
            <label className={`block text-xs font-semibold mb-1 uppercase tracking-wider ${isBwMode ? 'text-[#475569]' : 'text-slate-400'}`}>Address</label>
            <input
              type="text"
              value={addrInput}
              onChange={(e) => { setAddrInput(e.target.value); setAddrError(''); }}
              placeholder="e.g. 0x00 or 16"
              className={`w-full rounded-lg px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-colors
                ${addrError
                  ? (isBwMode ? 'border border-[#ef4444] bg-[#f9fafb] text-[#0f172a] focus:ring-[#ef4444]' : 'border border-red-500/70 bg-surface text-white focus:ring-red-500/50')
                  : (isBwMode ? 'bg-[#f9fafb] text-[#0f172a] border border-[#cbd5f5] focus:border-[#2563eb] focus:ring focus:ring-[rgba(37,99,235,0.2)]' : 'bg-surface border border-white/10 text-white focus:ring-primary/50')
                }`}
            />
            {addrError && (
              <p className="text-xs text-red-400 mt-1 leading-tight">{addrError}</p>
            )}
          </div>

          {/* Value Input */}
          <div className="mb-3">
            <label className={`block text-xs font-semibold mb-1 uppercase tracking-wider ${isBwMode ? 'text-[#475569]' : 'text-slate-400'}`}>Value <span className={`normal-case font-normal ${isBwMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>(Write only)</span></label>
            <input
              type="text"
              value={valueInput}
              onChange={(e) => { setValueInput(e.target.value); setValueError(''); }}
              placeholder="e.g. 42"
              className={`w-full rounded-lg px-3 py-2 text-sm font-mono tracking-wider focus:outline-none focus:ring-2 transition-colors
                ${valueError
                  ? (isBwMode ? 'border border-[#ef4444] bg-[#f9fafb] text-[#0f172a] focus:ring-[#ef4444]' : 'border border-red-500/70 bg-surface text-white focus:ring-red-500/50')
                  : (isBwMode ? 'bg-[#f9fafb] text-[#0f172a] border border-[#cbd5f5] focus:border-[#2563eb] focus:ring focus:ring-[rgba(37,99,235,0.2)]' : 'bg-surface border border-white/10 text-white focus:ring-primary/50')
                }`}
            />
            {valueError && (
              <p className="text-xs text-red-400 mt-1 leading-tight">{valueError}</p>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button 
              onClick={handleRead}
              className={`flex-1 font-semibold py-2 rounded-lg text-sm transition-all duration-250 flex items-center justify-center gap-1 active:scale-95
                ${isBwMode ? 'bg-[#f8fafc] text-[#0f172a] hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.1)] border border-[#e2e8f0]' : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white hover:border-blue-400/50'}`}
            >
              Read
            </button>
            <button 
              onClick={handleWrite}
              className={`flex-1 font-semibold py-2 rounded-lg text-sm transition-all duration-250 flex items-center justify-center gap-1 active:scale-95
                ${isBwMode ? 'bg-[#2563eb] text-white hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(37,99,235,0.3)] border border-[#2563eb]' : 'bg-primary hover:bg-blue-500 text-white shadow-lg shadow-primary/20'}`}
            >
              Write
            </button>
          </div>
        </div>

      </motion.div>
    </div>
  );
});

ProcessorNode.displayName = 'ProcessorNode';
