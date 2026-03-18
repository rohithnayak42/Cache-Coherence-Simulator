import React, { useRef, useEffect, useCallback } from 'react';

/**
 * Premium 3D Animated Background
 * A canvas-based neural network / glowing particle field.
 * Supports both Dark (Deep Navy) and Light (Soft Cyan) themes.
 */
const VisualBackground = ({ isBwMode }) => {
  const canvasRef = useRef(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const themeRef = useRef(isBwMode);
  const rafPendingRef = useRef(false);

  // Keep themeRef in sync without re-creating the canvas animation
  useEffect(() => {
    themeRef.current = isBwMode;
  }, [isBwMode]);

  // Throttle via RAF so the mouse handler fires at most once per frame
  const handleMouseMove = useCallback((e) => {
    if (rafPendingRef.current) return;
    rafPendingRef.current = true;
    requestAnimationFrame(() => {
      mouseRef.current = { x: e.clientX, y: e.clientY };
      rafPendingRef.current = false;
    });
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // --- Node configuration ---
    const NODE_COUNT = Math.min(Math.floor((width * height) / 10000), 120);
    const CONNECTION_DIST = 180;
    const PARALLAX_STRENGTH = 0.018;

    // Build nodes
    const nodes = Array.from({ length: NODE_COUNT }, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.25,
      vy: (Math.random() - 0.5) * 0.25,
      r: Math.random() * 2.5 + 1,
      pulse: Math.random() * Math.PI * 2, // phase offset
    }));

    let frameId;
    let t = 0;

    const draw = () => {
      t += 0.008;
      const bw = themeRef.current;

      // --- Theme palette ---
      const BG_GRADIENT = bw
        ? ['#eff6ff', '#e0f2fe', '#dbeafe']
        : ['#020617', '#0f172a', '#1e293b'];

      const NODE_COLOR_A = bw ? 'rgba(37,99,235,' : 'rgba(96,165,250,';
      const NODE_COLOR_B = bw ? 'rgba(14,165,233,' : 'rgba(167,139,250,';
      const LINE_COLOR   = bw ? 'rgba(37,99,235,'  : 'rgba(99,102,241,';
      const GLOW_COLOR   = bw ? 'rgba(14,165,233,0.12)' : 'rgba(99,102,241,0.15)';
      const VIGNETTE_BG  = bw
        ? 'rgba(239,246,255,'
        : 'rgba(2,6,23,';

      // --- 1. Draw rich layered background ---
      const grad = ctx.createRadialGradient(
        width * 0.3, height * 0.3, 0,
        width * 0.5, height * 0.5, Math.max(width, height) * 0.8
      );
      grad.addColorStop(0,   BG_GRADIENT[0]);
      grad.addColorStop(0.5, BG_GRADIENT[1]);
      grad.addColorStop(1,   BG_GRADIENT[2]);
      ctx.fillStyle = grad;
      ctx.fillRect(0, 0, width, height);

      // --- 2. Animated floating accent glow (orbiting blob) ---
      const blobX = width * 0.5 + Math.sin(t * 0.4) * width * 0.25;
      const blobY = height * 0.4 + Math.cos(t * 0.3) * height * 0.2;
      const blobGrad = ctx.createRadialGradient(blobX, blobY, 0, blobX, blobY, width * 0.4);
      blobGrad.addColorStop(0, GLOW_COLOR);
      blobGrad.addColorStop(1, 'transparent');
      ctx.fillStyle = blobGrad;
      ctx.fillRect(0, 0, width, height);

      // Second blob (opposite phase)
      const blob2X = width * 0.6 + Math.cos(t * 0.35) * width * 0.2;
      const blob2Y = height * 0.6 + Math.sin(t * 0.45) * height * 0.15;
      const blob2Grad = ctx.createRadialGradient(blob2X, blob2Y, 0, blob2X, blob2Y, width * 0.3);
      blob2Grad.addColorStop(0, bw ? 'rgba(124,58,237,0.06)' : 'rgba(56,189,248,0.1)');
      blob2Grad.addColorStop(1, 'transparent');
      ctx.fillStyle = blob2Grad;
      ctx.fillRect(0, 0, width, height);

      // --- 3. Mouse parallax offset ---
      const offX = (mouseRef.current.x - width  / 2) * PARALLAX_STRENGTH;
      const offY = (mouseRef.current.y - height / 2) * PARALLAX_STRENGTH;

      // --- 4. Update and draw nodes + connections ---
      nodes.forEach((n) => {
        n.x += n.vx;
        n.y += n.vy;
        if (n.x < 0 || n.x > width)  n.vx *= -1;
        if (n.y < 0 || n.y > height) n.vy *= -1;
        n.pulse += 0.02;
      });

      // Draw connection lines first (behind nodes)
      for (let i = 0; i < nodes.length; i++) {
        for (let j = i + 1; j < nodes.length; j++) {
          const a = nodes[i];
          const b = nodes[j];
          const dx = (a.x + offX) - (b.x + offX);
          const dy = (a.y + offY) - (b.y + offY);
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < CONNECTION_DIST) {
            const alpha = (1 - dist / CONNECTION_DIST) * 0.35;
            ctx.beginPath();
            ctx.moveTo(a.x + offX, a.y + offY);
            ctx.lineTo(b.x + offX, b.y + offY);
            ctx.strokeStyle = `${LINE_COLOR}${alpha})`;
            ctx.lineWidth = 0.6;
            ctx.stroke();
          }
        }
      }

      // Draw glowing nodes
      nodes.forEach((n, i) => {
        const pulse = 0.6 + 0.4 * Math.sin(n.pulse);
        const colorStr = i % 3 === 0 ? NODE_COLOR_A : NODE_COLOR_B;
        const nx = n.x + offX;
        const ny = n.y + offY;
        const r = n.r * pulse;

        // Outer glow halo
        const glowGrad = ctx.createRadialGradient(nx, ny, 0, nx, ny, r * 5);
        glowGrad.addColorStop(0, `${colorStr}${0.3 * pulse})`);
        glowGrad.addColorStop(1, `${colorStr}0)`);
        ctx.beginPath();
        ctx.arc(nx, ny, r * 5, 0, Math.PI * 2);
        ctx.fillStyle = glowGrad;
        ctx.fill();

        // Core dot
        ctx.beginPath();
        ctx.arc(nx, ny, r, 0, Math.PI * 2);
        ctx.fillStyle = `${colorStr}${0.7 + 0.3 * pulse})`;
        ctx.shadowBlur = 12;
        ctx.shadowColor = `${colorStr}0.8)`;
        ctx.fill();
        ctx.shadowBlur = 0;
      });

      // --- 5. Vignette overlay (darkens / lightens edges for depth) ---
      const vig = ctx.createRadialGradient(
        width / 2, height / 2, height * 0.3,
        width / 2, height / 2, Math.max(width, height) * 0.85
      );
      vig.addColorStop(0, 'transparent');
      vig.addColorStop(1, `${VIGNETTE_BG}0.55)`);
      ctx.fillStyle = vig;
      ctx.fillRect(0, 0, width, height);

      frameId = requestAnimationFrame(draw);
    };

    draw();

    const onResize = () => {
      width = canvas.width  = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };
    window.addEventListener('resize', onResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', onResize);
    };
  }, []); // ← runs once; theme reads from themeRef to avoid recreating

  return (
    <>
      {/* Full-screen canvas layer */}
      <canvas
        ref={canvasRef}
        onMouseMove={handleMouseMove}
        className="fixed inset-0 w-full h-full z-0 pointer-events-auto"
        style={{ display: 'block' }}
      />
      {/* Glassmorphism/readability overlay */}
      <div
        className="fixed inset-0 z-[1] pointer-events-none transition-colors duration-1000"
        style={{
          background: isBwMode
            ? 'rgba(239,246,255,0.15)'
            : 'rgba(2,6,23,0.2)',
          backdropFilter: 'blur(0.5px)',
        }}
      />
    </>
  );
};

export default VisualBackground;
