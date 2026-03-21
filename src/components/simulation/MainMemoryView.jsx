import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Database, Zap, Cpu, Edit2, Check } from 'lucide-react';
import { useBwMode } from '../../hooks/useBwMode';

export const MainMemoryView = ({ memory, busMessage, updateMemory }) => {
  const isBwMode = useBwMode();
  const [editingAddr, setEditingAddr] = useState(null);
  const [editValue, setEditValue] = useState("");

  const handleEditClick = (address, currentValue) => {
    setEditingAddr(address);
    setEditValue(currentValue.toString());
  };

  const handleSave = (address) => {
    if (editValue.trim() !== '') {
      updateMemory(address, parseInt(editValue, 10));
    }
    setEditingAddr(null);
  };

  const handleKeyDown = (e, address) => {
    if (e.key === 'Enter') {
      handleSave(address);
    } else if (e.key === 'Escape') {
      setEditingAddr(null);
    }
  };

  return (
    <div className="flex flex-col items-center w-full">
      <div className={`w-full max-w-lg border rounded-3xl p-6 relative z-10 transition-all duration-300
        ${isBwMode ? 'bg-white border-[#e2e8f0] shadow-[0_4px_12px_rgba(0,0,0,0.05)] hover:-translate-y-[1px] hover:shadow-[0_6px_14px_rgba(0,0,0,0.1)] transition-all duration-250 ease-in-out' : 'bg-surface/80 border-slate-600 shadow-[0_0_40px_rgba(0,0,0,0.6)]'}
      `}>
        <div className={`flex items-center justify-center gap-3 mb-6 p-3 rounded-2xl border ${isBwMode ? 'bg-[#f8fafc] border-[#e2e8f0]' : 'bg-black/40 border-white/5'}`}>
          <div className="flex items-center gap-3">
             <Database className={`w-6 h-6 shrink-0 ${isBwMode ? 'text-[#2563eb]' : 'text-slate-400'}`} />
             <h3 className={`text-xl font-extrabold tracking-widest uppercase whitespace-nowrap ${isBwMode ? 'text-[#0f172a]' : 'text-white'}`}>
               SHARED MAIN MEMORY
             </h3>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {Object.entries(memory).map(([address, value]) => {
            const isActive = busMessage && busMessage.address === address;
            const isEditing = editingAddr === address;
            
            return (
              <motion.div
                key={address}
                animate={isActive ? { scale: 1.05, borderColor: isBwMode ? '#fff' : 'rgba(59,130,246,0.8)' } : { scale: 1, borderColor: isBwMode ? '#333' : 'rgba(255,255,255,0.1)' }}
                className={`
                  flex items-center justify-between p-3 rounded-xl border font-mono transition-colors relative overflow-hidden group
                  ${isBwMode 
                    ? (isActive ? 'bg-white border-[#2563eb] text-[#0f172a] shadow-[0_0_0_1px_rgba(37,99,235,0.2)]' : 'bg-[#f8fafc] text-[#475569] border-[#e2e8f0]')
                    : (isActive ? 'bg-primary/20 text-white shadow-[0_0_15px_rgba(59,130,246,0.5)] border-primary' : 'bg-black/40 text-slate-300 border-white/10')
                  }
                `}
              >
                <div className="flex items-center gap-2">
                  <span className={`text-xs ${isBwMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>Addr</span>
                  <span className="font-bold">{address}</span>
                </div>
                
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-1 sm:gap-2">
                  <span className={`text-xs ${isBwMode ? 'text-[#94a3b8]' : 'text-slate-500'}`}>Val</span>
                  
                  {isEditing ? (
                    <div className="flex items-center gap-1">
                      <input 
                        type="number"
                        value={editValue}
                        onChange={(e) => setEditValue(e.target.value)}
                        onKeyDown={(e) => handleKeyDown(e, address)}
                        onBlur={() => handleSave(address)}
                        className={`w-14 text-center text-sm font-bold border rounded outline-none px-1 py-0.5
                           ${isBwMode ? 'bg-[#f9fafb] text-[#0f172a] border-[#cbd5f5] focus:border-[#2563eb] focus:shadow-[0_0_0_2px_rgba(37,99,235,0.2)]' : 'bg-black/60 text-white border-primary/50 focus:border-primary'}
                        `}
                      />
                      <button onMouseDown={() => handleSave(address)} className={`hover:text-emerald-300 ${isBwMode ? 'text-[#22c55e]' : 'text-emerald-400'}`}>
                         <Check className="w-4 h-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={`font-bold transition-all ${
                        isBwMode ? 'text-[#0f172a]' : (isActive ? 'text-emerald-400 drop-shadow-[0_0_5px_rgba(16,185,129,0.8)]' : 'text-slate-300')
                      }`}>
                        {value}
                      </span>
                      <button 
                        onClick={() => handleEditClick(address, value)}
                        className={`opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded hover:bg-black/5
                           ${isBwMode ? 'text-[#94a3b8] hover:text-[#0f172a]' : 'text-slate-500 hover:text-white'}
                        `}
                      >
                         <Edit2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  )}
                </div>
                
                {/* Visual pulse for targeted memory block */}
                <AnimatePresence>
                  {isActive && !isBwMode && (
                     <motion.div
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1.2 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        className="absolute inset-0 border-2 border-primary rounded-xl pointer-events-none"
                        transition={{ repeat: Infinity, duration: 1, repeatType: 'reverse' }}
                     />
                  )}
                </AnimatePresence>
              </motion.div>
            );
          })}
        </div>
      </div>
      
      {/* Bus physical representation */}
      <div className={`w-full max-w-lg h-8 border-x border-b rounded-b-xl flex items-center justify-center -mt-2 opacity-50 relative z-0
        ${isBwMode ? 'bg-white border-[#e2e8f0]' : 'bg-slate-800 border-slate-600/50'}
      `}>
        <div className={`w-[80%] h-[3px] rounded-full ${isBwMode ? 'bg-[#cbd5f5]' : 'bg-primary/50'}`} />
      </div>
    </div>
  );
};
