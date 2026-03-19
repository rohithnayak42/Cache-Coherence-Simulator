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
  const flushMemory = useCallback((address = null) => {
    if (!engineRef.current) return;
    
    // Only flush if protocol is MOESI, or if you want it universally available
    // But user specifically asked for MOESI BUG FIX.
    const didFlush = address 
       ? engineRef.current.flushToMemory(address)
       : engineRef.current.flushAllToMemory();

    if (didFlush) {
       // Pull the updated state from engine into React state
       setMemory({ ...engineRef.current.memory });
       setProcessors(JSON.parse(JSON.stringify(engineRef.current.processors)));
       setStats({ ...engineRef.current.stats });
       
       const newLogItems = engineRef.current.logs
         .slice(logs.length) // Wait, engine accumulates logs. Better to just map all or diff.
         // Actually, engineRef.current.logs is the full array.
         // Since we only appended, we can just grab the latest.
         .map(l => ({ id: l.id, time: l.time, message: l.message }));
         
       // Since the engine appends to the end of its internal array, we just need to re-sync
       // But `useSimulation` normally manages `logs` by prepending `newLogs.reverse()`.
       // Let's just do a clean sync of the latest logs. We'll find what was added since last sync.
       const engineLogCount = engineRef.current.logs.length;
       const localLogCount = logs.length;
       if (engineLogCount > localLogCount) {
           const newlyAdded = engineRef.current.logs.slice(localLogCount).map(l => ({ 
               id: l.id, time: l.time, message: l.message 
           }));
           setLogs(prev => [...newlyAdded.reverse(), ...prev]);
       }
    }
  }, [logs.length]);

  /* ─────────────────────── resetSimulation ──────────────────── */
  const resetSimulation = useCallback(() => {
    if (protocolType === 'MOESI') {
        engineRef.current.flushAllToMemory();
    }
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

  /* ─────────────────────── saveSimulation ───────────────────── */
  // Saves full simulation state as a JSON file download (fully client-side)
  const saveSimulation = useCallback((currentStats, currentLogs, currentMemory, currentProcs, currentGraph) => {
    // Call flushToMemory before saving if MOESI
    if (protocolType === 'MOESI') {
        engineRef.current.flushAllToMemory();
        // Update local references used for payload
        currentMemory = { ...engineRef.current.memory };
        currentProcs = JSON.parse(JSON.stringify(engineRef.current.processors));
        currentStats = { ...engineRef.current.stats };
        currentLogs = engineRef.current.logs.map(l => ({ id: l.id, time: l.time, message: l.message })).reverse();
    }

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
  };
};
