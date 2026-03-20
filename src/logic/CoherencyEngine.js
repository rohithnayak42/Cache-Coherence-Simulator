export default class CoherencyEngine {
    constructor(processorCount = 3) {
        this.processorCount = processorCount;
        this.reset();
    }

    reset() {
        // Pre-populate known addresses so Memory panel is never blank
        this.memory = { '0x00': 0, '0x01': 0, '0x02': 0, '0x03': 0 };
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

    /**
     * Ensures an address exists in memory. If a processor writes to an address
     * that was never previously loaded from memory, we default its memory value
     * to 0 rather than leaving it undefined.
     */
    ensureMemoryAddress(address) {
        if (this.memory[address] === undefined) {
            this.memory[address] = 0;
        }
    }

    execute(protocol, processorId, operationType, address, value = null) {
        this.busMessage = null;
        // Engine accumulates logs; caller must NOT clear them externally.
        // They are read out and cleared per-call via logsSnapshot below.
        const logsBefore = this.logs.length;

        let resultStatus = '';

        if (protocol === 'MSI') {
            if (operationType === 'READ') resultStatus = this.handleMSIRead(processorId, address);
            else if (operationType === 'WRITE') resultStatus = this.handleMSIWrite(processorId, address, Number(value));
        } else if (protocol === 'MESI') {
            if (operationType === 'READ') resultStatus = this.handleMESIRead(processorId, address);
            else if (operationType === 'WRITE') resultStatus = this.handleMESIWrite(processorId, address, Number(value));
        } else if (protocol === 'MOESI') {
            resultStatus = this.handleMOESI(processorId, operationType, address, value);
        }

        const finalCache = this.getProcessor(processorId)?.cache[address];
        const finalState = finalCache ? finalCache.state : '';

        // Only return the NEW logs added in this operation
        const newLogs = this.logs.slice(logsBefore);

        return {
            processor: processorId,
            operation: operationType,
            address,
            result: resultStatus,
            protocol,
            state: finalState,
            memorySnapshot: { ...this.memory },
            processorsSnapshot: JSON.parse(JSON.stringify(this.processors)),
            newLogs,
            statsSnapshot: { ...this.stats },
            busMessageSnapshot: this.busMessage ? { ...this.busMessage } : null
        };
    }

    // ─────────────────────────────────────────────────────────────
    // MSI PROTOCOL — Strict write-back, N-core support
    // Cache line format: { value, state }
    // ─────────────────────────────────────────────────────────────

    handleMSIRead(processorId, address) {
        this.ensureMemoryAddress(address);
        const proc    = this.getProcessor(processorId);
        const line    = proc.cache[address];

        // ── STEP 1: CACHE HIT (state is M or S, not I) ──
        if (line && line.state !== 'I') {
            this.logStat('hits');
            this.addLog(`[${processorId}] READ ${address} → HIT (${line.state}) → value=${line.value}`);
            return 'HIT';
        }

        // ── STEP 2: CACHE MISS ──
        this.logStat('misses');
        this.logStat('busTraffic');
        this.addLog(`[${processorId}] READ ${address} → MISS → Broadcasting BusRd`);
        this.busMessage = { sender: processorId, type: 'BusRd', address };

        // ── STEP 3: CHECK IF ANY CORE HAS STATE M (write-back needed) ──
        const ownerM = this.processors.find(p =>
            p.id !== processorId &&
            p.cache[address] &&
            p.cache[address].state === 'M'
        );

        if (ownerM) {
            // Write-back: dirty data from M owner → memory
            this.memory[address] = ownerM.cache[address].data;
            // M owner transitions → S (keeps data, now clean)
            ownerM.cache[address].state = 'S';
            this.logStat('transitions');
            this.addLog(`[${ownerM.id}] Snooped BusRd ${address} → Write-back to memory (data=${this.memory[address]}) → State M→S`);

            // Requesting core gets fresh data from memory → S
            this.logStat('transitions');
            this.addLog(`[${processorId}] READ ${address} → Loaded from write-back → State I→S`);
            proc.cache[address] = { data: this.memory[address], state: 'S' };
            return 'MISS';
        }

        // ── STEP 4: CHECK IF ANY CORE HAS STATE S ──
        const sharedExists = this.processors.some(p =>
            p.id !== processorId &&
            p.cache[address] &&
            p.cache[address].state === 'S'
        );

        if (sharedExists) {
            this.processors.forEach(p => {
                if (p.id === processorId) return;
                if (p.cache[address] && p.cache[address].state === 'S') {
                    this.addLog(`[${p.id}] Snooped BusRd ${address} → Remains S`);
                }
            });
            this.logStat('transitions');
            this.addLog(`[${processorId}] READ ${address} → MISS → Shared exists → Loaded from memory → S`);
            proc.cache[address] = { data: this.memory[address], state: 'S' };
            return 'MISS';
        }

        // ── STEP 5: NO ONE HAS DATA — load directly from memory ──
        this.logStat('transitions');
        this.addLog(`[${processorId}] READ ${address} → MISS → Loaded from memory (data=${this.memory[address]}) → S`);
        proc.cache[address] = { data: this.memory[address], state: 'S' };
        return 'MISS';
    }

    handleMSIWrite(processorId, address, value) {
        this.ensureMemoryAddress(address);
        const proc = this.getProcessor(processorId);
        const line = proc.cache[address];

        // ── CASE 1: Already Modified → SILENT HIT (no bus, per pseudocode) ──
        if (line && line.state === 'M') {
            this.logStat('hits');
            line.data = value;   // silent update, no bus traffic
            this.addLog(`[${processorId}] WRITE ${address}=${value} → HIT (M) → Silent update (no bus)`);
            return 'HIT';
        }

        // ── CASE 2: State S → upgrade via BusUpgr ──
        if (line && line.state === 'S') {
            this.logStat('hits');
            this.busMessage = { sender: processorId, type: 'BusUpgr', address };
            this.addLog(`[${processorId}] WRITE ${address}=${value} → HIT (S) → BusUpgr`);
        } else {
            // ── CASE 3: State I or no entry → BusRdX (read-exclusive) ──
            this.logStat('misses');
            this.busMessage = { sender: processorId, type: 'BusRdX', address };
            this.addLog(`[${processorId}] WRITE ${address}=${value} → MISS (I) → BusRdX`);
        }

        // S/I writes always generate bus traffic + transition
        this.logStat('busTraffic');
        this.logStat('transitions');

        // ── STEP 1: INVALIDATE ALL OTHER CORES ──
        // Mark state='I', keep entry visible in UI
        // Memory is NOT updated (write-back policy)
        this.processors.forEach(p => {
            if (p.id === processorId) return;
            const pLine = p.cache[address];
            if (pLine) {
                const prev = pLine.state;
                pLine.state = 'I';
                this.addLog(`[${p.id}] Snooped ${this.busMessage.type} ${address} → State ${prev}→I`);
            }
        });

        // ── STEP 2: SET CURRENT CORE → M ──
        proc.cache[address] = { data: value, state: 'M' };

        // ── STEP 3: DO NOT UPDATE MEMORY (write-back policy) ──
        this.addLog(`[${processorId}] WRITE ${address}=${value} → State →M | Memory stale (${this.memory[address]})`);
        return line && line.state !== 'I' ? 'HIT' : 'MISS';
    }

    // ─────────────────────────────────────────────
    // MESI PROTOCOL
    // ─────────────────────────────────────────────
    handleMESIRead(processorId, address) {
        this.ensureMemoryAddress(address);
        const proc = this.getProcessor(processorId);
        const localLine = proc.cache[address] || { state: 'I', data: 0 };

        // ✅ HIT (S, E, M)
        if (localLine.state !== 'I') {
            this.logStat('hits');
            this.addLog(`[${processorId}] READ ${address} → HIT (${localLine.state})`);
            return 'HIT';
        }

        // ❌ MISS
        this.logStat('misses');
        this.logStat('busTraffic');
        this.addLog(`[${processorId}] READ ${address} → MISS → Broadcasting BusRd`);
        this.busMessage = { sender: processorId, type: 'BusRd', address };

        const otherProcessors = this.processors.filter(p => p.id !== processorId);

        // 🔥 CHECK IF ANY CORE HAS M (CRITICAL)
        const ownerM = otherProcessors.find(p => p.cache[address] && p.cache[address].state === 'M');

        if (ownerM) {
            // 🔥 WRITE-BACK
            this.memory[address] = ownerM.cache[address].data;
            ownerM.cache[address].state = 'S';
            this.logStat('transitions');
            this.addLog(`[${ownerM.id}] Snooped BusRd ${address} → Write-back to memory → State M→S`);

            localLine.state = 'S';
            localLine.data = this.memory[address];
            proc.cache[address] = localLine;
            this.logStat('transitions');
            this.addLog(`[${processorId}] READ ${address} → Loaded from Dirty Owner → State I→S`);
            return 'MISS';
        }

        // 🔥 CHECK IF ANY CORE HAS E
        const ownerE = otherProcessors.find(p => p.cache[address] && p.cache[address].state === 'E');

        if (ownerE) {
            ownerE.cache[address].state = 'S';
            this.logStat('transitions');
            this.addLog(`[${ownerE.id}] Snooped BusRd ${address} → State E→S`);

            localLine.state = 'S';
            localLine.data = ownerE.cache[address].data;
            proc.cache[address] = localLine;
            this.logStat('transitions');
            this.addLog(`[${processorId}] READ ${address} → Loaded from Exclusive → State I→S`);
            return 'MISS';
        }

        // 🔥 CHECK IF ANY CORE HAS S
        const sharedExists = otherProcessors.some(p => p.cache[address] && p.cache[address].state === 'S');

        if (sharedExists) {
            localLine.state = 'S';
            localLine.data = this.memory[address];
            proc.cache[address] = localLine;
            this.logStat('transitions');
            this.addLog(`[${processorId}] READ ${address} → Loaded from Shared → State I→S`);
            return 'MISS';
        }

        // 🔥 NO ONE HAS DATA → EXCLUSIVE
        localLine.state = 'E';
        localLine.data = this.memory[address];
        proc.cache[address] = localLine;
        this.logStat('transitions');
        this.addLog(`[${processorId}] READ ${address} → MISS → No one has data → State I→E`);
        return 'MISS';
    }

    handleMESIWrite(processorId, address, value) {
        this.ensureMemoryAddress(address);
        const proc = this.getProcessor(processorId);
        const localLine = proc.cache[address] || { state: 'I', data: 0 };

        // ✅ CASE 1: Already Modified → HIT
        if (localLine.state === 'M') {
            this.logStat('hits');
            localLine.data = value;
            this.addLog(`[${processorId}] WRITE ${address}=${value} → HIT (M) → Silent update`);
            return 'HIT';
        }

        // ✅ CASE 2: Exclusive → direct upgrade (no invalidate)
        if (localLine.state === 'E') {
            this.logStat('hits');
            localLine.state = 'M';
            localLine.data = value;
            this.logStat('transitions');
            this.addLog(`[${processorId}] WRITE ${address}=${value} → HIT (E) → Silent upgrade to M`);
            return 'HIT';
        }

        const otherProcessors = this.processors.filter(p => p.id !== processorId);

        // 🔥 CASE 3: Shared → invalidate others (BusUpgr)
        if (localLine.state === 'S') {
            this.logStat('hits');
            this.logStat('busTraffic');
            this.busMessage = { sender: processorId, type: 'BusUpgr', address };
            this.addLog(`[${processorId}] WRITE ${address}=${value} → HIT (S) → Broadcasting BusUpgr`);

            otherProcessors.forEach(p => {
                if (p.cache[address]) {
                    const prevState = p.cache[address].state;
                    p.cache[address].state = 'I';
                    this.addLog(`[${p.id}] Snooped BusUpgr ${address} → State ${prevState}→I`);
                }
            });

            localLine.state = 'M';
            localLine.data = value;
            this.logStat('transitions');
            return 'HIT';
        }

        // 🔥 CASE 4: Invalid → BusRdX
        if (localLine.state === 'I') {
            this.logStat('misses');
            this.logStat('busTraffic');
            this.busMessage = { sender: processorId, type: 'BusRdX', address };
            this.addLog(`[${processorId}] WRITE ${address}=${value} → MISS (I) → Broadcasting BusRdX`);

            otherProcessors.forEach(p => {
                const pLine = p.cache[address];
                if (pLine) {
                    const prevState = pLine.state;
                    if (prevState === 'M') {
                        // Flush dirty data if invalidating an M owner
                        this.memory[address] = pLine.data;
                        this.addLog(`[${p.id}] Snooped BusRdX ${address} → Flush to Memory & Invalidate → State M→I`);
                    } else {
                        this.addLog(`[${p.id}] Snooped BusRdX ${address} → Invalidate → State ${prevState}→I`);
                    }
                    pLine.state = 'I';
                    this.logStat('transitions');
                }
            });

            localLine.state = 'M';
            localLine.data = value;
            this.logStat('transitions');
            return 'MISS';
        }
    }

    get cache() {
        // Build an object mapping processorId to its cache dictionary
        const c = {};
        this.processors.forEach(p => {
            c[p.id] = p.cache;
        });
        return c;
    }

    _handleMOESI(processor, operation, address, log, otherCopies) {
        const localLine = this.cache[processor][address];

        // =========================
        // 🔷 READ OPERATION (BusRd)
        // =========================
        if (operation === "READ") {

            // ✅ HIT (M, O, E, S)
            if (localLine.state !== "I") {
                log.action = "NONE";
                return;
            }

            log.action = "BUS_READ";

            // 🔥 STEP 1: CHECK FOR MODIFIED (M)
            let ownerM = otherCopies.find(p =>
                this.cache[p][address]?.state === "M"
            );

            if (ownerM) {
                // ❌ NO WRITE BACK (MOESI RULE)

                // M → O (ONLY ONE OWNER)
                this.cache[ownerM][address].state = "O";

                // Requester → S
                localLine.state = "S";

                // Transfer latest data
                localLine.data = this.cache[ownerM][address].data;

                log.action = "CACHE_TO_CACHE (M→O, S)";
                return;
            }

            // 🔥 STEP 2: CHECK FOR OWNER (O)
            let ownerO = otherCopies.find(p =>
                this.cache[p][address]?.state === "O"
            );

            if (ownerO) {
                // Owner stays O
                localLine.state = "S";

                // Get data from owner
                localLine.data = this.cache[ownerO][address].data;

                log.action = "CACHE_TO_CACHE (O supplies)";
                return;
            }

            // 🔥 STEP 3: CHECK FOR EXCLUSIVE (E)
            let ownerE = otherCopies.find(p =>
                this.cache[p][address]?.state === "E"
            );

            if (ownerE) {
                // E → S
                this.cache[ownerE][address].state = "S";

                localLine.state = "S";
                localLine.data = this.cache[ownerE][address].data;

                log.action = "E→S SHARING";
                return;
            }

            // 🔥 STEP 4: CHECK FOR SHARED (S)
            let sharedCopies = otherCopies.filter(p =>
                this.cache[p][address]?.state === "S"
            );

            if (sharedCopies.length > 0) {
                localLine.state = "S";
                localLine.data = this.cache[sharedCopies[0]][address].data;
                log.action = "SHARED_READ";
                return;
            }

            // 🔥 STEP 5: NO ONE HAS → EXCLUSIVE
            localLine.state = "E";
            log.action = "BUS_READ_EXCLUSIVE";
        }

        // =========================
        // 🔷 WRITE OPERATION
        // =========================
        else if (operation === "WRITE") {

            // ✅ CASE 1: M → HIT
            if (localLine.state === "M") {
                log.action = "NONE";
                return;
            }

            // ✅ CASE 2: E → M (no bus)
            if (localLine.state === "E") {
                localLine.state = "M";
                log.action = "SILENT_UPGRADE";
                return;
            }

            // 🔥 CASE 3: S OR O → invalidate ALL others
            if (localLine.state === "S" || localLine.state === "O") {
                log.action = "BUS_UPGRADE";

                otherCopies.forEach(p => {
                    if (this.cache[p][address]) {
                        this.cache[p][address].state = "I";
                    }
                });

                localLine.state = "M";
                return;
            }

            // 🔥 CASE 4: I → BusRdX
            if (localLine.state === "I") {
                log.action = "BUS_READ_EXCLUSIVE";

                otherCopies.forEach(p => {
                    if (this.cache[p][address]) {
                        this.cache[p][address].state = "I";
                    }
                });

                localLine.state = "M";
                return;
            }
        }
    }

    handleMOESI(processorId, operationType, address, value) {
        this.ensureMemoryAddress(address);
        const proc = this.getProcessor(processorId);
        
        // Ensure local line exists for user's code to reference without throwing
        if (!proc.cache[address]) {
            proc.cache[address] = { state: 'I', data: this.memory[address] || 0 };
        }

        const logObj = { action: "" };
        const otherCopies = this.processors.filter(p => p.id !== processorId).map(p => p.id);

        // Store initial states for transition counting
        const stateBefore = {};
        Object.keys(this.cache).forEach(p => {
            stateBefore[p] = this.cache[p][address] ? this.cache[p][address].state : 'I';
        });

        // 1 & 2. CACHE HIT / MISS logic dynamically
        if (stateBefore[processorId] !== 'I') {
            this.logStat('hits');
        } else {
            this.logStat('misses');
        }

        // Call the user's implementation
        this._handleMOESI(processorId, operationType, address, logObj, otherCopies);

        // Post-process the effects
        if (operationType === 'WRITE') {
            proc.cache[address].data = value;
        }

        // 4. TRANSITIONS: dynamically log any state changes for any processor
        Object.keys(this.cache).forEach(p => {
            const finalState = this.cache[p][address] ? this.cache[p][address].state : 'I';
            if (stateBefore[p] !== finalState) {
                this.logStat('transitions');
            }
        });

        const action = logObj.action;
        
        // Map log.action back to our simulator's UI messages
        if (action === "NONE" || action === "SILENT_UPGRADE") {
            this.addLog(`[${processorId}] ${operationType} ${address} → ${action === "NONE" ? "HIT" : action} (${proc.cache[address].state})`);
            return 'HIT';
        } else {
            // 3. BUS TRAFFIC dynamically
            this.logStat('busTraffic');
            
            // Reconstruct a plausible Bus message
            let busType = action;
            if (action.includes("UPGRADE")) busType = 'BusUpgr';
            else if (action.includes("EXCLUSIVE") && operationType === 'WRITE') busType = 'BusRdX';
            else if (action.includes("READ")) busType = 'BusRd';

            this.busMessage = { sender: processorId, type: busType, address };
            this.addLog(`[${processorId}] ${operationType} ${address} → ACTION: ${action}`);
            
            // Log global invalidations if it was an upgrade or read exclusive
            if (action === "BUS_UPGRADE" || (action === "BUS_READ_EXCLUSIVE" && operationType === "WRITE")) {
                this.addLog(`[*] Other caches invalidated for ${address}`);
            }

            // Update memory for read if reading from memory (no owners)
            if (operationType === "READ" && action === "BUS_READ_EXCLUSIVE") {
                proc.cache[address].data = this.memory[address];
            }

            return 'MISS';
        }
    }
}
