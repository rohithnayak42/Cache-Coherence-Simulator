import React, { useState, useEffect } from 'react';
import { Cpu, Moon, Sun } from 'lucide-react';

const MainLayout = ({ children, isFullScreen = false, hideShell = false, isBwMode, onThemeToggle }) => {

  return (
    <div className="min-h-screen flex flex-col w-full relative overflow-hidden bg-background text-slate-200 transition-colors duration-500">
      {/* Abstract Background Elements (Hidden in B&W Mode) */}
      {!isBwMode && (
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none transition-opacity duration-500">
          <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-primary/20 blur-[120px]" />
          <div className="absolute bottom-[-10%] right-[-10%] w-[50%] h-[50%] rounded-full bg-secondary/15 blur-[150px]" />
        </div>
      )}

      {!hideShell && (
        <header className="w-full z-10 px-8 py-4 flex items-center justify-between border-b border-white/5 glass-panel select-none">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/20 rounded-lg border border-primary/30 transition-colors duration-500">
              <Cpu className="text-primary w-6 h-6 transition-colors duration-500" />
            </div>
            <div>
              <h1 className={`font-bold text-xl tracking-wide ${isBwMode ? 'text-white' : 'bg-clip-text text-transparent bg-gradient-to-r from-blue-400 to-indigo-400'}`}>
                CoherenceSim
              </h1>
              <p className="text-xs text-slate-400 font-medium transition-colors">Multiprocessor Cache Simulator</p>
            </div>
          </div>
          
          <div className="flex items-center gap-6 text-sm font-medium">
            <button 
              onClick={onThemeToggle}
              className="p-2 rounded-full bg-white/5 border border-white/10 hover:bg-white/10 transition-all duration-300 text-slate-300 hover:text-white flex items-center gap-2"
              title={isBwMode ? "Switch to Dark Mode" : "Switch to Light Mode"}
            >
              {isBwMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span className="hidden sm:inline text-xs">{isBwMode ? 'Light Mode' : 'Dark Mode'}</span>
            </button>
          </div>
        </header>
      )}

      <main className={`flex-grow z-10 flex flex-col relative ${hideShell ? 'w-full h-full p-0' : isFullScreen ? 'w-full h-full p-0' : 'w-full max-w-7xl mx-auto p-4 md:p-8'}`}>
        {children}
      </main>

      <footer className={`w-full z-10 py-4 text-center text-[10px] uppercase tracking-[0.2em] text-slate-500/50 transition-colors duration-500 ${hideShell ? 'absolute bottom-0 border-none bg-transparent' : 'border-t border-white/5 bg-background/50 backdrop-blur-md'}`}>
        Cache Coherence Simulator
      </footer>
    </div>
  );
};

export default MainLayout;
