import { useState, useRef, useCallback } from 'react';
import CoherencyEngine from '../logic/CoherencyEngine';

// Default memory — 4 addresses pre-populated at 0, always visible in UI
const DEFAULT_MEMORY = { '0x00': 0, '0x01': 0, '0x02': 0, '0x03': 0 };

const makeDefaultMemory = () => ({ ...DEFAULT_MEMORY });

const getInitialProcessors = (count) =>
  Array.from({ length: count }, (_, i) => ({ id: `P${i + 1}`, cache: {} }));

const EMPTY_STATS = () => ({ hits: 0, misses: 0, busTraffic: 0, transitions: 0 });

export const useSimulation = (protocolType, processorCount = 3) => {
  const [memory, setMemory]       = useState(makeDefaultMemory);
  const [processors, setProcessors] = useState(() => getInitialProcessors(processorCount));
  const [logs, setLogs]           = useState([]);
  const [busMessage, setBusMessage] = useState(null);
  const [stats, setStats]         = useState(EMPTY_STATS);
  // graphData: array of { name, hits, misses, traffic, transitions }
  const [graphData, setGraphData] = useState([]);
  // history: array of snapshots taken after each operation
  const [history, setHistory]     = useState([]);

  // Track when protocol or core count changes → full reset
  const [lastSync, setLastSync] = useState({ protocol: protocolType, count: processorCount });
  const engineRef = useRef(new CoherencyEngine(processorCount));
  const stepCountRef = useRef(0); // monotonic counter for graph x-axis labels

  const isSyncNeeded = protocolType !== lastSync.protocol || processorCount !== lastSync.count;

  if (isSyncNeeded) {
    // Synchronously reset everything so this render is already clean
    setLastSync({ protocol: protocolType, count: processorCount });
    engineRef.current = new CoherencyEngine(processorCount);
    setMemory(makeDefaultMemory());
    setProcessors(getInitialProcessors(processorCount));
    setLogs([]);
    setBusMessage(null);
    setStats(EMPTY_STATS());
    setGraphData([]);
    setHistory([]);
    stepCountRef.current = 0;
  }

  // Guard: single source of truth for transient isSyncNeeded frame
  const activeProcessors = isSyncNeeded ? getInitialProcessors(processorCount) : processors;
  const activeStats      = isSyncNeeded ? EMPTY_STATS()         : stats;
  const activeMemory     = isSyncNeeded ? makeDefaultMemory()   : memory;
  const activeGraphData  = isSyncNeeded ? []                    : graphData;
  const activeHistory    = isSyncNeeded ? []                    : history;

  /* ─────────────────────── updateMemory ─────────────────────── */
  const updateMemory = useCallback((address, value) => {
    if (engineRef.current) engineRef.current.memory[address] = value;
    setMemory(prev => ({ ...prev, [address]: value }));
    const logItem = {
      id: Date.now() + Math.random(),
      time: new Date().toLocaleTimeString(),
      message: `[Manual] Memory ${address} overridden → ${value}`
    };
    setLogs(prev => [logItem, ...prev]);
  }, []);

  /* ─────────────────────── executeOperation ─────────────────── */
  const executeOperation = useCallback((processorId, operationType, address, value = null) => {
    setBusMessage(null);

    setTimeout(() => {
      const result = engineRef.current.execute(protocolType, processorId, operationType, address, value);

      // Build timestamped log items from the new logs emitted this operation
      const newLogItems = result.newLogs.map(l => ({
        id: l.id,
        time: l.time,
        message: l.message
      }));

      setMemory(result.memorySnapshot);
      setProcessors(result.processorsSnapshot);
      setStats(result.statsSnapshot);
      setBusMessage(result.busMessageSnapshot);

      // Prepend new logs (newest first)
      setLogs(prev => [...newLogItems.reverse(), ...prev]);

      // Append graph data point
      const step = ++stepCountRef.current;
      const point = {
        name: `T${step}`,
        hits: result.statsSnapshot.hits,
        misses: result.statsSnapshot.misses,
        traffic: result.statsSnapshot.busTraffic,
        transitions: result.statsSnapshot.transitions,
      };
      setGraphData(prev => {
        const next = [...prev, point];
        return next.length > 30 ? next.slice(next.length - 30) : next;
      });

      // Save history snapshot
      const snapshot = {
        id: Date.now(),
        step,
        time: new Date().toLocaleTimeString(),
        operation: operationType,
        processor: processorId,
        address,
        result: result.result,
        state: result.state,
        memory: result.memorySnapshot,
        processors: result.processorsSnapshot,
        stats: result.statsSnapshot,
      };
      setHistory(prev => [snapshot, ...prev]);
    }, 50);
  }, [protocolType]);

  /* ─────────────────────── flushMemory ────────────────────── */
  const flushMemory = useCallback(() => {
    if (protocolType !== 'MOESI') return;
    
    let isFlushed = false;
    const newLogs = [];

    // Use engineRef to synchronously mutate the engine's internal state
    if (engineRef.current) {
      engineRef.current.processors.forEach(p => {
        Object.keys(p.cache).forEach(addr => {
          const line = p.cache[addr];
          if (line && (line.state === 'M' || line.state === 'O')) {
            const oldState = line.state;
            
            // 1. Update memory
            engineRef.current.memory[addr] = line.data;
            
            // 2. Change state
            line.state = 'S';
            
            isFlushed = true;
            
            // 3. Log
            const logItem = {
              id: Date.now() + Math.random(),
              time: new Date().toLocaleTimeString(),
              message: `[Manual Flush] Memory ${addr} updated from ${p.id} (${oldState}→S). Data=${line.data}`
            };
            newLogs.push(logItem);
            engineRef.current.logs.push(logItem); // Keep engine logs strictly in sync
            
            // Update transitions stat for completeness, though it's optional here
            engineRef.current.stats.transitions++;
          }
        });
      });
      
      if (isFlushed) {
        // Apply engine state cleanly back to React state
        setMemory({ ...engineRef.current.memory });
        setProcessors(JSON.parse(JSON.stringify(engineRef.current.processors)));
        setStats({ ...engineRef.current.stats });
        setLogs(prev => [...newLogs.reverse(), ...prev]);
        setBusMessage(null); // Clear bus message smoothly
      }
    }
  }, [protocolType]);

  /* ─────────────────────── resetSimulation ──────────────────── */
  const resetSimulation = useCallback(() => {
    engineRef.current.reset();
    stepCountRef.current = 0;
    setMemory(makeDefaultMemory());
    setProcessors(getInitialProcessors(processorCount));
    setLogs([]);
    setBusMessage(null);
    setStats(EMPTY_STATS());
    setGraphData([]);
    setHistory([]);
  }, [processorCount]);

  /* ─────────────────────── clearHistory ─────────────────────── */
  const clearHistory = useCallback(() => {
    setHistory([]);
    setLogs([]);
  }, []);

  /* ─────────────────────── saveSimulation ───────────────────── */
  // Saves full simulation state as a JSON file download (fully client-side)
  const saveSimulation = useCallback((currentStats, currentLogs, currentMemory, currentProcs, currentGraph) => {
    const payload = {
      protocol: protocolType,
      processorCount,
      exportedAt: new Date().toISOString(),
      stats: currentStats,
      memory: currentMemory,
      processors: currentProcs,
      graphData: currentGraph,
      eventLog: currentLogs,
    };

    const blob = new Blob([JSON.stringify(payload, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `cache-sim-${protocolType}-${new Date().toISOString().slice(0, 19).replace(/:/g, '-')}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    return true;
  }, [protocolType, processorCount]);

  return {
    memory: activeMemory,
    processors: activeProcessors,
    logs,
    busMessage,
    stats: activeStats,
    graphData: activeGraphData,
    history: activeHistory,
    executeOperation,
    resetSimulation,
    updateMemory,
    saveSimulation,
    flushMemory,
    clearHistory,
  };
};
