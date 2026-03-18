import { useState, useRef, useCallback } from 'react';
import CoherencyEngine from '../logic/CoherencyEngine';

const INITIAL_MEMORY = {
  '0x00': 10,
  '0x01': 5,
  '0x02': 0,
  '0x03': 0,
};

const getInitialProcessors = (count) => {
  return Array.from({ length: count }, (_, i) => ({
    id: `P${i + 1}`,
    cache: {}
  }));
};

export const useSimulation = (protocolType, processorCount = 3) => {
  const [memory, setMemory] = useState(INITIAL_MEMORY);
  const [processors, setProcessors] = useState(() => getInitialProcessors(processorCount));
  const [logs, setLogs] = useState([]);
  const [busMessage, setBusMessage] = useState(null); 
  const [stats, setStats] = useState({ hits: 0, misses: 0, busTraffic: 0, transitions: 0 });

  const [lastSync, setLastSync] = useState({ protocol: protocolType, count: processorCount });
  const engineRef = useRef(new CoherencyEngine(processorCount));

  // Adjust state when protocol or count changes (React-approved pattern for derived/reset state)
  const isSyncNeeded = protocolType !== lastSync.protocol || processorCount !== lastSync.count;
  
  if (isSyncNeeded) {
    setLastSync({ protocol: protocolType, count: processorCount });
    engineRef.current = new CoherencyEngine(processorCount);
    setMemory(INITIAL_MEMORY);
    setProcessors(getInitialProcessors(processorCount));
    setLogs([]);
    setBusMessage(null);
    setStats({ hits: 0, misses: 0, busTraffic: 0, transitions: 0 });
  }

  // To avoid 1-frame lag where UI has new count but hook has old processors
  const activeProcessors = isSyncNeeded ? getInitialProcessors(processorCount) : processors;
  const activeStats = isSyncNeeded ? { hits: 0, misses: 0, busTraffic: 0, transitions: 0 } : stats;
  const activeMemory = isSyncNeeded ? INITIAL_MEMORY : memory;

  const addLog = useCallback((msg) => {
    const logItem = { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), message: msg };
    setLogs((prev) => [...prev, logItem]);
    if (engineRef.current) engineRef.current.logs.push(logItem);
  }, []);

  const updateMemory = useCallback((address, value) => {
    if (engineRef.current) engineRef.current.memory[address] = value;
    setMemory(prev => ({ ...prev, [address]: value }));
    addLog(`Memory modified manually -> Addr: ${address}, Val: ${value}`);
  }, [addLog]);

  const executeOperation = useCallback((processorId, operationType, address, value = null) => {
    setBusMessage(null);
    setTimeout(() => {
        const engineResult = engineRef.current.execute(protocolType, processorId, operationType, address, value);
        setMemory(engineResult.memorySnapshot);
        setProcessors(engineResult.processorsSnapshot);
        setStats(engineResult.statsSnapshot);
        setBusMessage(engineResult.busMessageSnapshot);
        setLogs([...engineResult.logsSnapshot]);
    }, 50);
  }, [protocolType]);

  const saveSimulation = async () => {
    try {
      const response = await fetch('/api/simulation/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          protocol: protocolType,
          processor_count: processorCount,
          hit_rate: activeStats.hits + activeStats.misses > 0 
            ? ((activeStats.hits / (activeStats.hits + activeStats.misses)) * 100).toFixed(2)
            : 0,
          bus_traffic: activeStats.busTraffic,
          events_count: logs.length
        })
      });
      if (!response.ok) throw new Error('Save failed');
      addLog('Simulation results saved to cloud database.');
      return await response.json();
    } catch (err) {
      console.error('Error saving simulation:', err);
      addLog('Error: Failed to save results to database.');
    }
  };

  const resetSimulation = useCallback(() => {
    engineRef.current.reset();
    setMemory(INITIAL_MEMORY);
    setProcessors(getInitialProcessors(processorCount));
    setLogs([]);
    setBusMessage(null);
    setStats({ hits: 0, misses: 0, busTraffic: 0, transitions: 0 });
    addLog('Simulation reset.');
  }, [processorCount, addLog]);

  return {
    memory: activeMemory,
    processors: activeProcessors,
    logs,
    busMessage,
    stats: activeStats,
    executeOperation,
    resetSimulation,
    updateMemory,
    saveSimulation
  };
};
