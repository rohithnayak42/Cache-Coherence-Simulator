import { useState } from 'react';

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

  // Adjust state when protocol or count changes (React-approved pattern for derived/reset state)
  const isSyncNeeded = protocolType !== lastSync.protocol || processorCount !== lastSync.count;
  
  if (isSyncNeeded) {
    setLastSync({ protocol: protocolType, count: processorCount });
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

  const addLog = (msg) => {
    setLogs((prev) => [...prev, { id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), message: msg }]);
  };

  const logStat = (type) => {
    setStats(prev => ({ ...prev, [type]: prev[type] + 1 }));
  };

  const getProcessorCache = (processorId) => activeProcessors.find(p => p.id === processorId).cache;

  const updateMemory = (address, value) => {
    setMemory(prev => ({ ...prev, [address]: value }));
    addLog(`Memory modified manually -> Addr: ${address}, Val: ${value}`);
  };

  // --- MSI PROTOCOL LOGIC ---
  const handleMSIRead = (processorId, address) => {
    let currentCache = getProcessorCache(processorId);
    let line = currentCache[address];
    
    if (line && (line.state === 'M' || line.state === 'S')) {
      logStat('hits');
      addLog(`${processorId} local read hit on ${address} (State: ${line.state})`);
      return;
    }

    logStat('misses');
    addLog(`${processorId} local read miss on ${address}. Broadcasting BusRd.`);
    setBusMessage({ sender: processorId, type: 'BusRd', address, data: null });
    logStat('busTraffic');

    let updatedProcessors = [...processors];
    let dataSuppliedByCache = false;
    let suppliedData = memory[address];

    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) return p;
      let pCache = { ...p.cache };
      let pLine = pCache[address];
      if (pLine && pLine.state === 'M') {
          addLog(`${p.id} snooped BusRd for ${address}. Flushing modified data to memory and downgrading to S.`);
          suppliedData = pLine.data;
          dataSuppliedByCache = true;
          pLine.state = 'S';
          logStat('transitions');
          setMemory(prev => ({...prev, [address]: pLine.data}));
      } else if (pLine && pLine.state === 'S') {
          addLog(`${p.id} snooped BusRd for ${address}. Remains in S.`);
      }
      return { ...p, cache: pCache };
    });

    addLog(`${processorId} receives data ${dataSuppliedByCache ? 'from cache' : 'from memory'}. State -> S.`);
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) {
        let pCache = { ...p.cache };
        pCache[address] = { state: 'S', data: suppliedData };
        logStat('transitions');
        return { ...p, cache: pCache };
      }
      return p;
    });
    setProcessors(updatedProcessors);
  };

  const handleMSIWrite = (processorId, address, value) => {
    let currentCache = getProcessorCache(processorId);
    let line = currentCache[address];

    if (line && line.state === 'M') {
      logStat('hits');
      addLog(`${processorId} local write hit on ${address}. Updates value. State -> M.`);
      let updatedProcessors = processors.map(p => {
        if (p.id === processorId) {
          let pCache = { ...p.cache };
          pCache[address] = { state: 'M', data: value };
          return { ...p, cache: pCache };
        }
        return p;
      });
      setProcessors(updatedProcessors);
      return;
    }

    if (line && line.state === 'S') {
        logStat('hits');
        addLog(`${processorId} local write hit on ${address} (State S). Broadcasting BusUpgr.`);
        setBusMessage({ sender: processorId, type: 'BusUpgr', address, data: null });
    } else {
        logStat('misses');
        addLog(`${processorId} local write miss on ${address}. Broadcasting BusRdX.`);
        setBusMessage({ sender: processorId, type: 'BusRdX', address, data: null });
    }
    logStat('busTraffic');

    let updatedProcessors = [...processors];
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) return p;
      let pCache = { ...p.cache };
      let pLine = pCache[address];
      if (pLine) {
        if (pLine.state === 'M') {
           addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Flushing & Invalidating.`);
           setMemory(prev => ({...prev, [address]: pLine.data}));
           pLine.state = 'I';
           logStat('transitions');
        } else if (pLine.state === 'S') {
           addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Invalidating.`);
           pLine.state = 'I';
           logStat('transitions');
        }
      }
      return { ...p, cache: pCache };
    });

    addLog(`${processorId} completes write on ${address}. State -> M.`);
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) {
        let pCache = { ...p.cache };
        pCache[address] = { state: 'M', data: value };
        logStat('transitions');
        return { ...p, cache: pCache };
      }
      return p;
    });
    setProcessors(updatedProcessors);
  };

  // --- MESI PROTOCOL LOGIC ---
  const handleMESIRead = (processorId, address) => {
    let currentCache = getProcessorCache(processorId);
    let line = currentCache[address];
    if (line && (line.state === 'M' || line.state === 'E' || line.state === 'S')) {
      logStat('hits');
      addLog(`${processorId} local read hit on ${address} (State: ${line.state})`);
      return;
    }
    logStat('misses');
    addLog(`${processorId} local read miss on ${address}. Broadcasting BusRd.`);
    setBusMessage({ sender: processorId, type: 'BusRd', address, data: null });
    logStat('busTraffic');
    let updatedProcessors = [...processors];
    let isShared = false;
    let suppliedData = memory[address];
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) return p;
      let pCache = { ...p.cache };
      let pLine = pCache[address];
      if (pLine && pLine.state !== 'I') {
        isShared = true;
        if (pLine.state === 'M') {
          addLog(`${p.id} snooped BusRd for ${address}. Flushing modified data & transitioning to S.`);
          suppliedData = pLine.data;
          pLine.state = 'S';
          logStat('transitions');
          setMemory(prev => ({...prev, [address]: pLine.data}));
        } else if (pLine.state === 'E') {
          addLog(`${p.id} snooped BusRd for ${address}. Transitioning to S.`);
          pLine.state = 'S';
          logStat('transitions');
          suppliedData = pLine.data;
        }
      }
      return { ...p, cache: pCache };
    });
    let newState = isShared ? 'S' : 'E';
    addLog(`${processorId} receives data. Shared line asserted: ${isShared}. State -> ${newState}.`);
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) {
        let pCache = { ...p.cache };
        pCache[address] = { state: newState, data: suppliedData };
        logStat('transitions');
        return { ...p, cache: pCache };
      }
      return p;
    });
    setProcessors(updatedProcessors);
  };

  const handleMESIWrite = (processorId, address, value) => {
    let currentCache = getProcessorCache(processorId);
    let line = currentCache[address];
    if (line && (line.state === 'M' || line.state === 'E')) {
      logStat('hits');
      let oldState = line.state;
      addLog(`${processorId} local write hit on ${address} (State ${oldState}). State -> M. (No Bus Traffic)`);
      let updatedProcessors = processors.map(p => {
        if (p.id === processorId) {
          let pCache = { ...p.cache };
          pCache[address] = { state: 'M', data: value };
          if (oldState !== 'M') logStat('transitions');
          return { ...p, cache: pCache };
        }
        return p;
      });
      setProcessors(updatedProcessors);
      return;
    }
    if (line && line.state === 'S') {
        logStat('hits');
        addLog(`${processorId} local write hit on ${address} (State S). Broadcasting BusUpgr.`);
        setBusMessage({ sender: processorId, type: 'BusUpgr', address, data: null });
    } else {
        logStat('misses');
        addLog(`${processorId} local write miss on ${address}. Broadcasting BusRdX.`);
        setBusMessage({ sender: processorId, type: 'BusRdX', address, data: null });
    }
    logStat('busTraffic');
    let updatedProcessors = [...processors];
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) return p;
      let pCache = { ...p.cache };
      let pLine = pCache[address];
      if (pLine && pLine.state !== 'I') {
        if (pLine.state === 'M') {
           addLog(`${p.id} snooped BusRdX for ${address}. Flushing & Invalidating.`);
           setMemory(prev => ({...prev, [address]: pLine.data}));
        } else {
           addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Invalidating.`);
        }
        pLine.state = 'I';
        logStat('transitions');
      }
      return { ...p, cache: pCache };
    });
    addLog(`${processorId} completes write on ${address}. State -> M.`);
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) {
        let pCache = { ...p.cache };
        pCache[address] = { state: 'M', data: value };
        logStat('transitions');
        return { ...p, cache: pCache };
      }
      return p;
    });
    setProcessors(updatedProcessors);
  };

  // --- MOESI PROTOCOL LOGIC ---
  const handleMOESIRead = (processorId, address) => {
    let currentCache = getProcessorCache(processorId);
    let line = currentCache[address];
    if (line && (line.state === 'M' || line.state === 'O' || line.state === 'E' || line.state === 'S')) {
      logStat('hits');
      addLog(`${processorId} local read hit on ${address} (State: ${line.state})`);
      return;
    }
    logStat('misses');
    addLog(`${processorId} local read miss on ${address}. Broadcasting BusRd.`);
    setBusMessage({ sender: processorId, type: 'BusRd', address, data: null });
    logStat('busTraffic');
    let updatedProcessors = [...processors];
    let isShared = false;
    let suppliedData = memory[address];
    let dataFromCache = false;
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) return p;
      let pCache = { ...p.cache };
      let pLine = pCache[address];
      if (pLine && pLine.state !== 'I') {
        isShared = true;
        if (pLine.state === 'M') {
          addLog(`${p.id} snooped BusRd for ${address}. Transitioning to O. Providing data to bus.`);
          suppliedData = pLine.data;
          pLine.state = 'O';
          dataFromCache = true;
          logStat('transitions');
        } else if (pLine.state === 'O') {
          addLog(`${p.id} snooped BusRd for ${address}. Remains in O. Providing data to bus.`);
          suppliedData = pLine.data;
          dataFromCache = true;
        } else if (pLine.state === 'E') {
          addLog(`${p.id} snooped BusRd for ${address}. Transitioning to S.`);
          pLine.state = 'S';
          logStat('transitions');
        }
      }
      return { ...p, cache: pCache };
    });
    let newState = isShared ? 'S' : 'E';
    addLog(`${processorId} receives data ${dataFromCache ? 'from cache' : 'from memory'}. State -> ${newState}.`);
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) {
        let pCache = { ...p.cache };
        pCache[address] = { state: newState, data: suppliedData };
        logStat('transitions');
        return { ...p, cache: pCache };
      }
      return p;
    });
    setProcessors(updatedProcessors);
  };

  const handleMOESIWrite = (processorId, address, value) => {
    let currentCache = getProcessorCache(processorId);
    let line = currentCache[address];
    if (line && (line.state === 'M' || line.state === 'E')) {
      logStat('hits');
      let oldState = line.state;
      addLog(`${processorId} local write hit on ${address} (State ${oldState}). State -> M. (No Bus Traffic)`);
      let updatedProcessors = processors.map(p => {
        if (p.id === processorId) {
          let pCache = { ...p.cache };
          pCache[address] = { state: 'M', data: value };
          if (oldState !== 'M') logStat('transitions');
          return { ...p, cache: pCache };
        }
        return p;
      });
      setProcessors(updatedProcessors);
      return;
    }
    if (line && (line.state === 'S' || line.state === 'O')) {
        logStat('hits');
        addLog(`${processorId} local write hit on ${address} (State ${line.state}). Broadcasting BusUpgr.`);
        setBusMessage({ sender: processorId, type: 'BusUpgr', address, data: null });
    } else {
        logStat('misses');
        addLog(`${processorId} local write miss on ${address}. Broadcasting BusRdX.`);
        setBusMessage({ sender: processorId, type: 'BusRdX', address, data: null });
    }
    logStat('busTraffic');
    let updatedProcessors = [...processors];
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) return p;
      let pCache = { ...p.cache };
      let pLine = pCache[address];
      if (pLine && pLine.state !== 'I') {
        if (pLine.state === 'M' || pLine.state === 'O') {
           addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Flushing to memory & Invalidating.`);
           setMemory(prev => ({...prev, [address]: pLine.data}));
        } else {
           addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Invalidating.`);
        }
        pLine.state = 'I';
        logStat('transitions');
      }
      return { ...p, cache: pCache };
    });
    addLog(`${processorId} completes write on ${address}. State -> M.`);
    updatedProcessors = updatedProcessors.map(p => {
      if (p.id === processorId) {
        let pCache = { ...p.cache };
        pCache[address] = { state: 'M', data: value };
        logStat('transitions');
        return { ...p, cache: pCache };
      }
      return p;
    });
    setProcessors(updatedProcessors);
  };

  const executeOperation = (processorId, operationType, address, value = null) => {
    setBusMessage(null);
    setTimeout(() => {
        if (protocolType === 'MSI') {
          if (operationType === 'READ') handleMSIRead(processorId, address);
          else if (operationType === 'WRITE') handleMSIWrite(processorId, address, parseInt(value, 10));
        } else if (protocolType === 'MESI') {
          if (operationType === 'READ') handleMESIRead(processorId, address);
          else if (operationType === 'WRITE') handleMESIWrite(processorId, address, parseInt(value, 10));
        } else if (protocolType === 'MOESI') {
          if (operationType === 'READ') handleMOESIRead(processorId, address);
          else if (operationType === 'WRITE') handleMOESIWrite(processorId, address, parseInt(value, 10));
        }
    }, 50);
  };

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

  const resetSimulation = () => {
    setMemory(INITIAL_MEMORY);
    setProcessors(getInitialProcessors(processorCount));
    setLogs([]);
    setBusMessage(null);
    setStats({ hits: 0, misses: 0, busTraffic: 0, transitions: 0 });
    addLog('Simulation reset.');
  };

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
