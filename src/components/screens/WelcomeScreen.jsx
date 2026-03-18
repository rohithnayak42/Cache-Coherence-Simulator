import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'framer-motion';

// --- HIGH-END FUTURISTIC 3D BACKGROUND ---
const Background3D = ({ isBwMode }) => {
  const canvasRef = useRef(null);
  const colorsRef = useRef({
    bg: isBwMode ? '#f8fafc' : '#020617',
    grid: isBwMode ? 'rgba(71, 85, 105, 0.05)' : 'rgba(56, 189, 248, 0.03)',
    node1: isBwMode ? '#0ea5e9' : '#22d3ee',
    node2: isBwMode ? '#2563eb' : '#3b82f6',
    line: isBwMode ? 'rgba(14, 165, 233, ' : 'rgba(34, 211, 238, '
  });

  useEffect(() => {
    colorsRef.current = {
      bg: isBwMode ? '#f8fafc' : '#020617',
      grid: isBwMode ? 'rgba(71, 85, 105, 0.05)' : 'rgba(56, 189, 248, 0.03)',
      node1: isBwMode ? '#0ea5e9' : '#22d3ee',
      node2: isBwMode ? '#2563eb' : '#3b82f6',
      line: isBwMode ? 'rgba(14, 165, 233, ' : 'rgba(34, 211, 238, '
    };
  }, [isBwMode]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    let width = canvas.width = window.innerWidth;
    let height = canvas.height = window.innerHeight;

    // Node & Particle Settings
    const nodes = [];
    const nodeCount = Math.min(Math.floor((width * height) / 8000), 150);
    const connectionDist = 200;

    // Create Nodes
    for (let i = 0; i < nodeCount; i++) {
      nodes.push({
        x: Math.random() * width,
        y: Math.random() * height,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        r: Math.random() * 2 + 1,
        type: i % 3 === 0 ? 'node1' : 'node2'
      });
    }

    // Grid Settings
    const gridSize = 80;
    
    let frameId;

    const draw = () => {
      const colors = colorsRef.current;
      ctx.fillStyle = colors.bg;
      ctx.fillRect(0, 0, width, height);

      // 1. Draw Subtle Grid
      ctx.strokeStyle = colors.grid;
      ctx.lineWidth = 1;
      for (let x = 0; x < width; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
      }
      for (let y = 0; y < height; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(width, y);
        ctx.stroke();
      }

      // 2. Draw & Update Nodes
      nodes.forEach((node, i) => {
        node.x += node.vx;
        node.y += node.vy;

        // Bounce
        if (node.x < 0 || node.x > width) node.vx *= -1;
        if (node.y < 0 || node.y > height) node.vy *= -1;

        // Draw Node
        const color = colors[node.type];
        ctx.beginPath();
        ctx.arc(node.x, node.y, node.r, 0, Math.PI * 2);
        ctx.shadowBlur = isBwMode ? 5 : 10;
        ctx.shadowColor = color;
        ctx.fillStyle = color;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Connections
        for (let j = i + 1; j < nodes.length; j++) {
          const n2 = nodes[j];
          const dx = node.x - n2.x;
          const dy = node.y - n2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);

          if (dist < connectionDist) {
            ctx.beginPath();
            ctx.moveTo(node.x, node.y);
            ctx.lineTo(n2.x, n2.y);
            // Dynamic opacity based on distance
            const alpha = (1 - dist / connectionDist) * 0.2;
            ctx.strokeStyle = `${colors.line}${alpha})`;
            ctx.lineWidth = 0.5;
            ctx.stroke();
          }
        }
      });

      frameId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      window.removeEventListener('resize', onResize);
      cancelAnimationFrame(frameId);
    };
  }, []); // Run once, but it uses colorsRef

  return (
    <div className={`absolute inset-0 z-0 overflow-hidden transition-colors duration-1000 ${isBwMode ? 'bg-slate-50' : 'bg-[#020617]'}`}>
      {/* Perspective Overlay for Parallax feel */}
      <div className={`absolute inset-0 bg-gradient-to-tr transition-opacity duration-1000 ${isBwMode ? 'from-white via-transparent to-white opacity-40' : 'from-[#020617] via-transparent to-[#020617] opacity-60'} z-10`} />
      <div className={`absolute inset-0 transition-opacity duration-1000 ${isBwMode ? 'bg-[radial-gradient(circle_at_50%_50%,rgba(14,165,233,0.05)_0%,transparent_70%)]' : 'bg-[radial-gradient(circle_at_50%_50%,rgba(34,211,238,0.1)_0%,transparent_70%)]'} z-10`} />
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-70" />
    </div>
  );
};

const WelcomeScreen = ({ onNext, isBwMode }) => {
  return (
    <div className={`w-full h-screen flex flex-col items-center justify-center relative overflow-hidden transition-colors duration-1000 selection:bg-cyan-500/30 ${isBwMode ? 'bg-slate-50' : 'bg-black'}`}>
      
      <Background3D isBwMode={isBwMode} />

      <div className="z-20 flex flex-col items-center text-center px-6">
        
        {/* Subtitle - Tiny & Subtle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: isBwMode ? 0.8 : 0.5, y: 0 }}
          transition={{ duration: 1, delay: 0.2 }}
          className={`${isBwMode ? 'text-slate-600' : 'text-cyan-400'} font-black title-font tracking-[0.4em] text-[10px] md:text-xs mb-4 uppercase`}
        >
          Elite Architecture Visualization
        </motion.p>

        {/* Main Title - Massive & Neon */}
        <motion.div
           initial={{ opacity: 0, scale: 0.95 }}
           animate={{ opacity: 1, scale: 1 }}
           transition={{ duration: 1, ease: "easeOut" }}
           className="flex flex-col items-center mb-16 select-none"
        >
          <h1 className="flex flex-col font-black leading-[0.9]">
            <span className={`${isBwMode ? 'text-slate-900' : 'text-white'} text-6xl md:text-8xl lg:text-[130px] tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.05)]`}>
              CACHE
            </span>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 via-blue-500 to-indigo-600 text-6xl md:text-8xl lg:text-[130px] tracking-tight py-2 drop-shadow-[0_0_30px_rgba(34,211,238,0.5)]">
              COHERENCY
            </span>
            <span className={`${isBwMode ? 'text-slate-900' : 'text-white'} text-6xl md:text-8xl lg:text-[130px] tracking-tight drop-shadow-[0_0_15px_rgba(0,0,0,0.05)]`}>
              SIMULATOR
            </span>
          </h1>
        </motion.div>

        {/* Premium Action Button */}
        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8, delay: 0.8 }}
        >
          <button
            onClick={onNext}
            className="group relative px-14 py-5 font-black text-lg tracking-[0.2em] rounded-full transition-all duration-500"
          >
            {/* Neon Border/Glow Container */}
            <div className={`absolute inset-0 rounded-full border transition-colors ${isBwMode ? 'border-blue-600/30 group-hover:border-blue-600' : 'border-cyan-500/30 group-hover:border-cyan-400'}`} />
            <div className={`absolute inset-0 rounded-full blur-xl opacity-0 group-hover:opacity-100 transition-opacity ${isBwMode ? 'bg-blue-600/10' : 'bg-cyan-500/5'}`} />
            
            {/* Button Surface */}
            <div className={`absolute inset-0 rounded-full backdrop-blur-md overflow-hidden transition-colors ${isBwMode ? 'bg-white/80 shadow-lg' : 'bg-gradient-to-r from-cyan-900/20 to-blue-900/20'}`}>
               <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-[100%] group-hover:animate-[shimmer_2s_infinite]" />
            </div>

            <span className={`relative z-10 transition-colors duration-300 drop-shadow-[0_0_8px_rgba(34,211,238,0.3)] ${isBwMode ? 'text-blue-700 group-hover:text-blue-900' : 'text-cyan-300 group-hover:text-white'}`}>
              LAUNCH SIMULATION
            </span>
          </button>
        </motion.div>

      </div>

      {/* Aesthetic Tech Overlays (Corners) */}
      <div className={`absolute top-8 left-8 w-24 h-24 border-t border-l z-20 pointer-events-none ${isBwMode ? 'border-slate-200' : 'border-white/5'}`} />
      <div className={`absolute top-8 right-8 w-24 h-24 border-t border-r z-20 pointer-events-none ${isBwMode ? 'border-slate-200' : 'border-white/5'}`} />
      <div className={`absolute bottom-8 left-8 w-24 h-24 border-b border-l z-20 pointer-events-none ${isBwMode ? 'border-slate-200' : 'border-white/5'}`} />
      <div className={`absolute bottom-8 right-8 w-24 h-24 border-b border-r z-20 pointer-events-none ${isBwMode ? 'border-slate-200' : 'border-white/5'}`} />

    </div>
  );
};

export default WelcomeScreen;

