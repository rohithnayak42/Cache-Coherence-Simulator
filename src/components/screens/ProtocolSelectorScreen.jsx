import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { ArrowLeft, Play, ShieldAlert, Key, Activity } from 'lucide-react';

const protocols = [
  {
    id: 'MSI',
    name: 'MSI Protocol',
    icon: ShieldAlert,
    color: 'text-amber-400',
    bwColorClass: 'text-white border-white',
    bg: 'bg-amber-400/10',
    border: 'border-amber-400/30',
    hoverShadow: 'shadow-[0_20px_40px_rgba(251,191,36,0.2)]',
    description: 'The fundamental cache coherence protocol. Stands for Modified, Shared, and Invalid states.',
    states: [
      { name: 'M (Modified)', desc: 'Cache line is the only valid copy and is dirty (modified).' },
      { name: 'S (Shared)', desc: 'Cache line is one of potentially matching copies, and is clean.' },
      { name: 'I (Invalid)', desc: 'Cache line is invalid and cannot be read.' }
    ]
  },
  {
    id: 'MESI',
    name: 'MESI Protocol',
    icon: Key,
    color: 'text-emerald-400',
    bwColorClass: 'text-white border-white',
    bg: 'bg-emerald-400/10',
    border: 'border-emerald-400/30',
    hoverShadow: 'shadow-[0_20px_40px_rgba(52,211,153,0.2)]',
    description: 'Also known as the Illinois protocol. Adds an Exclusive state to reduce unnecessary write-invalidate bus traffic.',
    states: [
      { name: 'M (Modified)', desc: 'Exclusive, dirty copy of data.' },
      { name: 'E (Exclusive)', desc: 'Exclusive, clean copy. Saves traffic on writes.' },
      { name: 'S (Shared)', desc: 'Shared, clean copy of data.' },
      { name: 'I (Invalid)', desc: 'Cache line is invalid.' }
    ]
  },
  {
    id: 'MOESI',
    name: 'MOESI Protocol',
    icon: Activity,
    color: 'text-purple-400',
    bwColorClass: 'text-white border-white',
    bg: 'bg-purple-400/10',
    border: 'border-purple-400/30',
    hoverShadow: 'shadow-[0_20px_40px_rgba(167,139,250,0.2)]',
    description: 'Extends MESI by adding an Owned state, allowing dirty sharing of data to reduce writebacks to main memory.',
    states: [
      { name: 'M (Modified)', desc: 'Exclusive, dirty copy.' },
      { name: 'O (Owned)', desc: 'Shared, dirty copy. Writes back to memory.' },
      { name: 'E (Exclusive)', desc: 'Exclusive, clean copy.' },
      { name: 'S (Shared)', desc: 'Shared, clean copy. Memory is NOT up to date.' },
      { name: 'I (Invalid)', desc: 'Cache line is invalid.' }
    ]
  }
];

// Helper to draw an animated interconnected grid
const AnimatedBackgroundGrid = ({ isBwMode }) => {
  if (isBwMode) return null; // Keep B&W mode strictly clean without distractions
  
  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none opacity-30">
      {/* Perspective Grid */}
      <div 
        className="absolute inset-0 w-full h-[200%] -top-[50%] left-0"
        style={{
          backgroundSize: '80px 80px',
          backgroundImage: 'linear-gradient(to right, rgba(59, 130, 246, 0.1) 1px, transparent 1px), linear-gradient(to bottom, rgba(59, 130, 246, 0.1) 1px, transparent 1px)',
          transform: 'perspective(500px) rotateX(60deg) translateY(-100px) translateZ(-200px)',
          animation: 'gridMove 20s linear infinite'
        }}
      />
      
      {/* Floating Particles/Nodes */}
      <motion.div
        className="absolute w-3 h-3 bg-blue-400 rounded-full blur-[2px] shadow-[0_0_10px_#3b82f6]"
        animate={{ y: [0, -100, 0], x: [0, 50, 0], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 8, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '20%', left: '15%' }}
      />
      <motion.div
        className="absolute w-2 h-2 bg-emerald-400 rounded-full blur-[1px] shadow-[0_0_10px_#34d399]"
        animate={{ y: [0, -80, 0], x: [0, -40, 0], opacity: [0.3, 0.8, 0.3] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '60%', right: '20%' }}
      />
      <motion.div
        className="absolute w-4 h-4 bg-purple-400 rounded-full blur-[3px] shadow-[0_0_15px_#a855f7]"
        animate={{ y: [0, 120, 0], x: [0, -60, 0], opacity: [0.2, 0.6, 0.2] }}
        transition={{ duration: 15, repeat: Infinity, ease: "easeInOut" }}
        style={{ top: '30%', right: '35%' }}
      />
      
      <style>{`
        @keyframes gridMove {
          0% { transform: perspective(500px) rotateX(60deg) translateY(0) translateZ(-200px); }
          100% { transform: perspective(500px) rotateX(60deg) translateY(80px) translateZ(-200px); }
        }
      `}</style>
    </div>
  );
};

const ProtocolSelectorScreen = ({ onSelect, onBack }) => {
  const [hoveredProtocol, setHoveredProtocol] = useState(null);
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

  return (
    <div className="w-full h-full flex flex-col items-center justify-start py-8 relative">
      
      <AnimatedBackgroundGrid isBwMode={isBwMode} />

      {/* Top Navigation */}
      <div className="w-full relative z-20 flex justify-start mb-4 px-4">
        <button
          onClick={onBack}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="font-medium text-sm">Back to Explanation</span>
        </button>
      </div>

      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="w-full text-center mb-10 relative z-20"
      >
        <h2 className={`text-4xl lg:text-5xl font-extrabold mb-4 tracking-tight drop-shadow-lg ${isBwMode ? 'text-white' : 'text-transparent bg-clip-text bg-gradient-to-r from-slate-200 to-slate-400'}`}>
          Select a Protocol
        </h2>
        <p className={`text-lg max-w-2xl mx-auto ${isBwMode ? 'text-slate-300' : 'text-slate-400'}`}>
          Choose an architecture to simulate. MSI is great for basics, while MESI and MOESI represent real-world optimizations.
        </p>
      </motion.div>

      {/* Cards Row Container */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 w-full max-w-7xl px-4 mb-10 relative z-20 flex-grow content-center">
        {protocols.map((protocol, idx) => {
          
          const isHovered = hoveredProtocol === protocol.id;
          
          return (
            <motion.div
              key={protocol.id}
              initial={{ opacity: 0, y: 50, rotateX: 10 }}
              animate={{ opacity: 1, y: 0, rotateX: 0 }}
              transition={{ duration: 0.6, delay: 0.2 + idx * 0.1, type: "spring", stiffness: 100 }}
              onMouseEnter={() => setHoveredProtocol(protocol.id)}
              onMouseLeave={() => setHoveredProtocol(null)}
              className={`
                relative flex flex-col rounded-3xl border transition-all duration-500 cursor-pointer overflow-hidden shadow-3d
                ${isBwMode 
                  ? (isHovered ? 'bg-[#111] border-white -translate-y-3' : 'bg-[#050505] border-[#333]')
                  : (isHovered ? `bg-surface/90 border-${protocol.color.split('-')[1]}-500/50 -translate-y-3 ${protocol.hoverShadow}` : 'bg-surface/60 border-white/5')
                }
                backdrop-blur-md
              `}
              onClick={() => onSelect(protocol.id)}
            >
              {/* Internal padding container */}
              <div className="p-8 flex-grow flex flex-col relative z-10">
                <div className="flex items-start justify-between mb-6">
                  <div className="flex items-center gap-4">
                    <div className={`p-4 rounded-xl transition-colors duration-300 ${isBwMode ? (isHovered ? 'bg-white text-black' : 'border border-[#444] text-white') : `${protocol.bg} border ${protocol.border}`}`}>
                      <protocol.icon className={`w-8 h-8 ${isBwMode ? '' : protocol.color}`} />
                    </div>
                    <div>
                      <h3 className="text-3xl font-extrabold text-white tracking-tight">{protocol.name}</h3>
                      <p className={`text-xs font-bold tracking-widest uppercase mt-1 ${isBwMode ? 'text-slate-400' : protocol.color}`}>
                        Status Model
                      </p>
                    </div>
                  </div>
                </div>

                <p className={`text-sm md:text-base leading-relaxed mb-8 flex-grow ${isBwMode ? 'text-slate-300' : 'text-slate-400'}`}>
                  {protocol.description}
                </p>

                <div className="space-y-2 mb-8 flex-grow">
                  {protocol.states.map((state, sIdx) => (
                    <div key={sIdx} className={`flex flex-col gap-1 p-3 rounded-xl transition-colors duration-300 ${isBwMode ? 'bg-[#1a1a1a] border border-[#333]' : 'bg-black/40 border border-white/5'}`}>
                      <span className="font-bold text-white text-sm">{state.name}</span>
                      <span className="text-xs text-slate-500 leading-snug">{state.desc}</span>
                    </div>
                  ))}
                </div>

                <button 
                  className={`
                    mt-auto flex w-full items-center justify-center gap-2 py-4 rounded-xl font-bold transition-all duration-300 transform active:scale-95
                    ${isBwMode
                      ? (isHovered ? 'bg-white text-black' : 'bg-[#222] text-white hover:bg-[#333]')
                      : (isHovered ? `bg-primary text-white shadow-lg` : 'bg-white/5 text-slate-300 hover:bg-white/10')
                    }
                  `}
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelect(protocol.id);
                  }}
                >
                  Launch Simulator
                  <Play className={`w-5 h-5 ml-1 ${isHovered && !isBwMode ? 'animate-pulse' : ''}`} />
                </button>
              </div>
              
              {/* 3D Background Glowing Artifact on Hover (Color Mode Only) */}
              {!isBwMode && (
                <div 
                  className={`absolute -bottom-24 -right-24 w-64 h-64 rounded-full blur-[100px] pointer-events-none transition-opacity duration-700 ease-out z-0 
                  ${protocol.bg.replace('/10', '/30')} 
                  ${isHovered ? 'opacity-100 scale-150' : 'opacity-0 scale-100'}`} 
                />
              )}
            </motion.div>
          );
        })}
      </div>

    </div>
  );
};

export default ProtocolSelectorScreen;
