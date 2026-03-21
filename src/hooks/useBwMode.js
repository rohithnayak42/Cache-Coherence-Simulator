import { useState, useEffect } from 'react';

// Shared BW-mode detection
const getIsBwMode = () => document.body.classList.contains('theme-bw');

const bwListeners = new Set();
let sharedObserver = null;

const initObserver = () => {
  if (typeof window !== 'undefined' && !sharedObserver) {
    sharedObserver = new MutationObserver(() => {
      const val = getIsBwMode();
      bwListeners.forEach(cb => cb(val));
    });
    sharedObserver.observe(document.body, { attributes: true, attributeFilter: ['class'] });
  }
};

export const useBwMode = () => {
  const [isBwMode, setIsBwMode] = useState(getIsBwMode);

  useEffect(() => {
    initObserver();
    bwListeners.add(setIsBwMode);
    
    return () => {
      bwListeners.delete(setIsBwMode);
    };
  }, []);

  return isBwMode;
};
