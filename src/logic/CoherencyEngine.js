export default class CoherencyEngine {
    constructor(processorCount = 3) {
        this.processorCount = processorCount;
        this.reset();
    }

    reset() {
        this.memory = {
            '0x00': 10,
            '0x01': 5,
            '0x02': 0,
            '0x03': 0,
        };
        this.processors = Array.from({ length: this.processorCount }, (_, i) => ({
            id: `P${i + 1}`,
            cache: {}
        }));
        this.logs = [];
        this.stats = { hits: 0, misses: 0, busTraffic: 0, transitions: 0 };
        this.busMessage = null;
    }

    addLog(msg) {
        this.logs.push({ id: Date.now() + Math.random(), time: new Date().toLocaleTimeString(), message: msg });
    }

    logStat(type) {
        this.stats[type]++;
    }

    getProcessor(processorId) {
        return this.processors.find(p => p.id === processorId);
    }

    updateProcessorCache(processorId, address, lineData) {
        const p = this.getProcessor(processorId);
        if (p) p.cache[address] = lineData;
    }

    // Returns a summary object for the calling UI, but also maintains all deep state inside the engine
    execute(protocol, processorId, operationType, address, value = null) {
        this.busMessage = null;
        this.logs = []; // Clear logs for just this operation, or keep appending? 
        // Wait, useSimulation retains all logs. 
        // It's better to clear engine.logs each run and let useSimulation append them, 
        // OR let engine accumulate all logs and useSimulation just reads them. 
        // For accurate tracking, useSimulation should just take engine.logs. 
        // Actually, if we clear them, we must manage it carefully. Let engine.logs accumulate!
        // So we do NOT clear this.logs here.
        
        let resultAction = 'None';
        let resultStatus = '';
        let finalState = '';

        if (protocol === 'MSI') {
            if (operationType === 'READ') resultStatus = this.handleMSIRead(processorId, address);
            else if (operationType === 'WRITE') resultStatus = this.handleMSIWrite(processorId, address, parseInt(value, 10));
        } else if (protocol === 'MESI') {
            if (operationType === 'READ') resultStatus = this.handleMESIRead(processorId, address);
            else if (operationType === 'WRITE') resultStatus = this.handleMESIWrite(processorId, address, parseInt(value, 10));
        } else if (protocol === 'MOESI') {
            if (operationType === 'READ') resultStatus = this.handleMOESIRead(processorId, address);
            else if (operationType === 'WRITE') resultStatus = this.handleMOESIWrite(processorId, address, parseInt(value, 10));
        }

        if (this.busMessage) resultAction = this.busMessage.type;
        const finalCache = this.getProcessor(processorId).cache[address];
        if (finalCache) finalState = finalCache.state;

        return {
            processor: processorId,
            operation: operationType,
            address: address,
            result: resultStatus,
            action: resultAction,
            protocol: protocol,
            state: finalState,
            // also return refs to updated internal state for ease of UI sync
            memorySnapshot: { ...this.memory },
            processorsSnapshot: JSON.parse(JSON.stringify(this.processors)),
            logsSnapshot: [...this.logs],
            statsSnapshot: { ...this.stats },
            busMessageSnapshot: this.busMessage ? { ...this.busMessage } : null
        };
    }

    // --- MSI PROTOCOL ---
    handleMSIRead(processorId, address) {
        let pCache = this.getProcessor(processorId).cache;
        let line = pCache[address];
        
        if (line && (line.state === 'M' || line.state === 'S')) {
            this.logStat('hits');
            this.addLog(`${processorId} local read hit on ${address} (State: ${line.state})`);
            return 'HIT';
        }

        this.logStat('misses');
        this.addLog(`${processorId} local read miss on ${address}. Broadcasting BusRd.`);
        this.busMessage = { sender: processorId, type: 'BusRd', address, data: null };
        this.logStat('busTraffic');

        let dataSuppliedByCache = false;
        let suppliedData = this.memory[address];

        this.processors.forEach(p => {
            if (p.id === processorId) return;
            let pLine = p.cache[address];
            if (pLine && pLine.state === 'M') {
                this.addLog(`${p.id} snooped BusRd for ${address}. Flushing modified data to memory and downgrading to S.`);
                suppliedData = pLine.data;
                dataSuppliedByCache = true;
                pLine.state = 'S';
                this.logStat('transitions');
                this.memory[address] = pLine.data;
            } else if (pLine && pLine.state === 'S') {
                this.addLog(`${p.id} snooped BusRd for ${address}. Remains in S.`);
            }
        });

        this.addLog(`${processorId} receives data ${dataSuppliedByCache ? 'from cache' : 'from memory'}. State -> S.`);
        this.updateProcessorCache(processorId, address, { state: 'S', data: suppliedData });
        this.logStat('transitions');
        return 'MISS';
    }

    handleMSIWrite(processorId, address, value) {
        let pCache = this.getProcessor(processorId).cache;
        let line = pCache[address];

        if (line && line.state === 'M') {
            this.logStat('hits');
            this.addLog(`${processorId} local write hit on ${address}. Updates value. State -> M.`);
            this.updateProcessorCache(processorId, address, { state: 'M', data: value });
            return 'HIT';
        }

        if (line && line.state === 'S') {
            this.logStat('hits');
            this.addLog(`${processorId} local write hit on ${address} (State S). Broadcasting BusUpgr.`);
            this.busMessage = { sender: processorId, type: 'BusUpgr', address, data: null };
        } else {
            this.logStat('misses');
            this.addLog(`${processorId} local write miss on ${address}. Broadcasting BusRdX.`);
            this.busMessage = { sender: processorId, type: 'BusRdX', address, data: null };
        }
        this.logStat('busTraffic');

        this.processors.forEach(p => {
            if (p.id === processorId) return;
            let pLine = p.cache[address];
            if (pLine) {
                if (pLine.state === 'M') {
                    this.addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Flushing & Invalidating.`);
                    this.memory[address] = pLine.data;
                    pLine.state = 'I';
                    this.logStat('transitions');
                } else if (pLine.state === 'S') {
                    this.addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Invalidating.`);
                    pLine.state = 'I';
                    this.logStat('transitions');
                }
            }
        });

        this.addLog(`${processorId} completes write on ${address}. State -> M.`);
        this.updateProcessorCache(processorId, address, { state: 'M', data: value });
        this.logStat('transitions');
        return line ? 'HIT' : 'MISS';
    }

    // --- MESI PROTOCOL ---
    handleMESIRead(processorId, address) {
        let pCache = this.getProcessor(processorId).cache;
        let line = pCache[address];
        if (line && (line.state === 'M' || line.state === 'E' || line.state === 'S')) {
            this.logStat('hits');
            this.addLog(`${processorId} local read hit on ${address} (State: ${line.state})`);
            return 'HIT';
        }
        this.logStat('misses');
        this.addLog(`${processorId} local read miss on ${address}. Broadcasting BusRd.`);
        this.busMessage = { sender: processorId, type: 'BusRd', address, data: null };
        this.logStat('busTraffic');
        
        let isShared = false;
        let suppliedData = this.memory[address];
        
        this.processors.forEach(p => {
            if (p.id === processorId) return;
            let pLine = p.cache[address];
            if (pLine && pLine.state !== 'I') {
                isShared = true;
                if (pLine.state === 'M') {
                    this.addLog(`${p.id} snooped BusRd for ${address}. Flushing modified data & transitioning to S.`);
                    suppliedData = pLine.data;
                    pLine.state = 'S';
                    this.logStat('transitions');
                    this.memory[address] = pLine.data;
                } else if (pLine.state === 'E') {
                    this.addLog(`${p.id} snooped BusRd for ${address}. Transitioning to S.`);
                    pLine.state = 'S';
                    this.logStat('transitions');
                    suppliedData = pLine.data;
                }
            }
        });
        
        let newState = isShared ? 'S' : 'E';
        this.addLog(`${processorId} receives data. Shared line asserted: ${isShared}. State -> ${newState}.`);
        this.updateProcessorCache(processorId, address, { state: newState, data: suppliedData });
        this.logStat('transitions');
        return 'MISS';
    }

    handleMESIWrite(processorId, address, value) {
        let pCache = this.getProcessor(processorId).cache;
        let line = pCache[address];
        if (line && (line.state === 'M' || line.state === 'E')) {
            this.logStat('hits');
            let oldState = line.state;
            this.addLog(`${processorId} local write hit on ${address} (State ${oldState}). State -> M. (No Bus Traffic)`);
            this.updateProcessorCache(processorId, address, { state: 'M', data: value });
            if (oldState !== 'M') this.logStat('transitions');
            return 'HIT';
        }
        if (line && line.state === 'S') {
            this.logStat('hits');
            this.addLog(`${processorId} local write hit on ${address} (State S). Broadcasting BusUpgr.`);
            this.busMessage = { sender: processorId, type: 'BusUpgr', address, data: null };
        } else {
            this.logStat('misses');
            this.addLog(`${processorId} local write miss on ${address}. Broadcasting BusRdX.`);
            this.busMessage = { sender: processorId, type: 'BusRdX', address, data: null };
        }
        this.logStat('busTraffic');
        
        this.processors.forEach(p => {
            if (p.id === processorId) return;
            let pLine = p.cache[address];
            if (pLine && pLine.state !== 'I') {
                if (pLine.state === 'M') {
                    this.addLog(`${p.id} snooped BusRdX for ${address}. Flushing & Invalidating.`);
                    this.memory[address] = pLine.data;
                } else {
                    this.addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Invalidating.`);
                }
                pLine.state = 'I';
                this.logStat('transitions');
            }
        });
        
        this.addLog(`${processorId} completes write on ${address}. State -> M.`);
        this.updateProcessorCache(processorId, address, { state: 'M', data: value });
        this.logStat('transitions');
        return line ? 'HIT' : 'MISS';
    }

    // --- MOESI PROTOCOL ---
    handleMOESIRead(processorId, address) {
        let pCache = this.getProcessor(processorId).cache;
        let line = pCache[address];
        if (line && (line.state === 'M' || line.state === 'O' || line.state === 'E' || line.state === 'S')) {
            this.logStat('hits');
            this.addLog(`${processorId} local read hit on ${address} (State: ${line.state})`);
            return 'HIT';
        }
        this.logStat('misses');
        this.addLog(`${processorId} local read miss on ${address}. Broadcasting BusRd.`);
        this.busMessage = { sender: processorId, type: 'BusRd', address, data: null };
        this.logStat('busTraffic');
        
        let isShared = false;
        let suppliedData = this.memory[address];
        let dataFromCache = false;
        
        this.processors.forEach(p => {
            if (p.id === processorId) return;
            let pLine = p.cache[address];
            if (pLine && pLine.state !== 'I') {
                isShared = true;
                if (pLine.state === 'M') {
                    this.addLog(`${p.id} snooped BusRd for ${address}. Transitioning to O. Providing data to bus.`);
                    suppliedData = pLine.data;
                    pLine.state = 'O';
                    dataFromCache = true;
                    this.logStat('transitions');
                } else if (pLine.state === 'O') {
                    this.addLog(`${p.id} snooped BusRd for ${address}. Remains in O. Providing data to bus.`);
                    suppliedData = pLine.data;
                    dataFromCache = true;
                } else if (pLine.state === 'E') {
                    this.addLog(`${p.id} snooped BusRd for ${address}. Transitioning to S.`);
                    pLine.state = 'S';
                    this.logStat('transitions');
                }
            }
        });
        
        let newState = isShared ? 'S' : 'E';
        this.addLog(`${processorId} receives data ${dataFromCache ? 'from cache' : 'from memory'}. State -> ${newState}.`);
        this.updateProcessorCache(processorId, address, { state: newState, data: suppliedData });
        this.logStat('transitions');
        return 'MISS';
    }

    handleMOESIWrite(processorId, address, value) {
        let pCache = this.getProcessor(processorId).cache;
        let line = pCache[address];
        if (line && (line.state === 'M' || line.state === 'E')) {
            this.logStat('hits');
            let oldState = line.state;
            this.addLog(`${processorId} local write hit on ${address} (State ${oldState}). State -> M. (No Bus Traffic)`);
            this.updateProcessorCache(processorId, address, { state: 'M', data: value });
            if (oldState !== 'M') this.logStat('transitions');
            return 'HIT';
        }
        if (line && (line.state === 'S' || line.state === 'O')) {
            this.logStat('hits');
            this.addLog(`${processorId} local write hit on ${address} (State ${line.state}). Broadcasting BusUpgr.`);
            this.busMessage = { sender: processorId, type: 'BusUpgr', address, data: null };
        } else {
            this.logStat('misses');
            this.addLog(`${processorId} local write miss on ${address}. Broadcasting BusRdX.`);
            this.busMessage = { sender: processorId, type: 'BusRdX', address, data: null };
        }
        this.logStat('busTraffic');
        
        this.processors.forEach(p => {
            if (p.id === processorId) return;
            let pLine = p.cache[address];
            if (pLine && pLine.state !== 'I') {
                if (pLine.state === 'M' || pLine.state === 'O') {
                    this.addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Flushing to memory & Invalidating.`);
                    this.memory[address] = pLine.data;
                } else {
                    this.addLog(`${p.id} snooped BusRdX/BusUpgr for ${address}. Invalidating.`);
                }
                pLine.state = 'I';
                this.logStat('transitions');
            }
        });
        
        this.addLog(`${processorId} completes write on ${address}. State -> M.`);
        this.updateProcessorCache(processorId, address, { state: 'M', data: value });
        this.logStat('transitions');
        return line ? 'HIT' : 'MISS';
    }
}
