import { database, isFirebaseConfigured } from './firebase';
import { ref, set, get, onValue } from 'firebase/database';
import { DEFAULT_TRACKS, DEMO_PILOTS, calculateRankings } from './droneEngine';

class DroneFirebaseEngine {
  constructor() {
    this.db = database;
    this.rootPath = 'drone_championship';
  }

  // Escuchar todos los cambios en tiempo real
  onDroneStateChange(callback) {
    if (!this.db && typeof window !== 'undefined' && isFirebaseConfigured()) {
      // Reintentar tomar instancia de la base de datos
      this.db = database;
    }

    if (!this.db) {
      console.warn('Firebase RTDB no disponible en este entorno.');
      return () => {};
    }

    const championshipRef = ref(this.db, this.rootPath);
    return onValue(championshipRef, (snapshot) => {
      const data = snapshot.val() || {};

      let pilots = [];
      if (data.pilots) {
        pilots = Array.isArray(data.pilots) ? data.pilots : Object.values(data.pilots);
      } else {
        // Inicializar por defecto
        pilots = DEMO_PILOTS;
        this.setInitialData();
      }

      let tracks = [];
      if (data.tracks) {
        tracks = Array.isArray(data.tracks) ? data.tracks : Object.values(data.tracks);
      } else {
        tracks = DEFAULT_TRACKS;
      }

      let runs = [];
      if (data.runs) {
        runs = Array.isArray(data.runs) ? data.runs : Object.values(data.runs);
      }

      const rankings = calculateRankings(pilots, tracks, runs);

      callback({
        pilots,
        tracks,
        runs,
        rankings,
        lastAlert: data.lastAlert || null
      });
    });
  }

  async setInitialData() {
    if (!this.db) return;
    try {
      const pilotsMap = {};
      DEMO_PILOTS.forEach(p => { pilotsMap[p.id] = p; });
      const tracksMap = {};
      DEFAULT_TRACKS.forEach(t => { tracksMap[t.id] = t; });

      await set(ref(this.db, `${this.rootPath}/pilots`), pilotsMap);
      await set(ref(this.db, `${this.rootPath}/tracks`), tracksMap);
    } catch (e) {
      console.error('Error al setear datos iniciales de drones en Firebase:', e);
    }
  }

  async submitRun({ pilotId, trackId, timeSeconds, recordedBy = 'Monitor', notes = '' }) {
    if (!this.db) throw new Error('Base de datos no inicializada');

    // Obtener datos actuales
    const snap = await get(ref(this.db, this.rootPath));
    const data = snap.val() || {};

    const pilotsMap = data.pilots || {};
    const pilot = pilotsMap[pilotId] || Object.values(pilotsMap).find(p => p.id === pilotId);
    if (!pilot) throw new Error('Piloto no encontrado en Firebase');

    const tracksMap = data.tracks || {};
    const track = tracksMap[trackId] || Object.values(tracksMap).find(t => t.id === trackId);
    if (!track) throw new Error('Pista no encontrada en Firebase');

    const runsMap = data.runs || {};
    const existingRuns = Object.values(runsMap).filter(r => r.pilotId === pilotId && r.trackId === trackId);
    const lastRun = existingRuns.length > 0 ? existingRuns[existingRuns.length - 1] : null;

    if (lastRun && !lastRun.isUnlockedForRetry && lastRun.status === 'COMPLETED') {
      throw new Error(`El piloto ya tiene un intento oficial registrado (${lastRun.timeSeconds}s). Requiere desbloqueo.`);
    }

    const attemptNumber = existingRuns.length + 1;
    const runId = `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;

    // Si había un intento previo desbloqueado, apagar la bandera
    if (lastRun && lastRun.isUnlockedForRetry) {
      await set(ref(this.db, `${this.rootPath}/runs/${lastRun.id}/isUnlockedForRetry`), false);
    }

    const newRun = {
      id: runId,
      pilotId: pilot.id,
      pilotName: pilot.name,
      pilotCallsign: pilot.callsign || '',
      pilotDorsal: pilot.dorsal || '',
      pilotTeam: pilot.team || 'Independiente',
      trackId: track.id,
      trackName: track.name,
      trackCode: track.code || 'P',
      timeSeconds: parseFloat(parseFloat(timeSeconds).toFixed(2)),
      status: 'COMPLETED',
      attemptNumber,
      isUnlockedForRetry: false,
      timestamp: new Date().toISOString(),
      recordedBy,
      notes
    };

    // Guardar run
    await set(ref(this.db, `${this.rootPath}/runs/${runId}`), newRun);

    // Guardar alerta para la pantalla gigante
    await set(ref(this.db, `${this.rootPath}/lastAlert`), {
      pilotName: newRun.pilotName,
      pilotCallsign: newRun.pilotCallsign,
      pilotDorsal: newRun.pilotDorsal,
      trackName: newRun.trackName,
      trackCode: newRun.trackCode,
      timeSeconds: newRun.timeSeconds,
      timestamp: newRun.timestamp
    });

    return newRun;
  }

  async unlockRetry(pilotId, trackId, reason = 'Falla técnica autorizada') {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const snap = await get(ref(this.db, `${this.rootPath}/runs`));
    const runsMap = snap.val() || {};
    const runsList = Object.values(runsMap).filter(r => r.pilotId === pilotId && r.trackId === trackId);

    if (runsList.length === 0) {
      throw new Error('El piloto no tiene intentos en esta pista para desbloquear');
    }

    const lastRun = runsList[runsList.length - 1];
    await set(ref(this.db, `${this.rootPath}/runs/${lastRun.id}/isUnlockedForRetry`), true);
    await set(ref(this.db, `${this.rootPath}/runs/${lastRun.id}/unlockReason`), reason);
    return true;
  }

  async createPilot({ name, callsign, dorsal, team }) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const pilotId = `plt-${Date.now()}`;
    const newPilot = {
      id: pilotId,
      name: name.trim(),
      callsign: (callsign || '').trim().toUpperCase(),
      dorsal: (dorsal || '').trim(),
      team: (team || 'Independiente').trim(),
      registeredAt: new Date().toISOString()
    };
    await set(ref(this.db, `${this.rootPath}/pilots/${pilotId}`), newPilot);
    return newPilot;
  }

  async deletePilot(pilotId) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    await set(ref(this.db, `${this.rootPath}/pilots/${pilotId}`), null);
    // Eliminar también sus runs
    const snap = await get(ref(this.db, `${this.rootPath}/runs`));
    const runsMap = snap.val() || {};
    for (const [key, run] of Object.entries(runsMap)) {
      if (run.pilotId === pilotId) {
        await set(ref(this.db, `${this.rootPath}/runs/${key}`), null);
      }
    }
    return true;
  }

  async deleteRun(runId) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    await set(ref(this.db, `${this.rootPath}/runs/${runId}`), null);
    return true;
  }

  async resetTournament(clearPilots = false) {
    if (!this.db) throw new Error('Base de datos no inicializada');
    await set(ref(this.db, `${this.rootPath}/runs`), null);
    await set(ref(this.db, `${this.rootPath}/lastAlert`), null);
    if (clearPilots) {
      await set(ref(this.db, `${this.rootPath}/pilots`), null);
    }
    return true;
  }

  async preloadDemo() {
    if (!this.db) throw new Error('Base de datos no inicializada');
    const pilotsMap = {};
    DEMO_PILOTS.forEach(p => { pilotsMap[p.id] = p; });
    const tracksMap = {};
    DEFAULT_TRACKS.forEach(t => { tracksMap[t.id] = t; });

    await set(ref(this.db, `${this.rootPath}/pilots`), pilotsMap);
    await set(ref(this.db, `${this.rootPath}/tracks`), tracksMap);

    // Cargar runs demo
    const demoRuns = [
      { id: 'run-demo-1', pilotId: 'plt-1', pilotName: 'Lucas "Viper" Morales', pilotCallsign: 'VIPER', pilotDorsal: '07', pilotTeam: 'Veltis Aero', trackId: 'track-1', trackName: 'Pista 1: Slalom de Precisión', trackCode: 'P1', timeSeconds: 78.45, status: 'COMPLETED', attemptNumber: 1, isUnlockedForRetry: false, timestamp: new Date(Date.now() - 3600000).toISOString(), recordedBy: 'Monitor P1' },
      { id: 'run-demo-2', pilotId: 'plt-2', pilotName: 'Camila "Apex" Soto', pilotCallsign: 'APEX', pilotDorsal: '14', pilotTeam: 'Skyline FPV', trackId: 'track-1', trackName: 'Pista 1: Slalom de Precisión', trackCode: 'P1', timeSeconds: 76.12, status: 'COMPLETED', attemptNumber: 1, isUnlockedForRetry: false, timestamp: new Date(Date.now() - 3000000).toISOString(), recordedBy: 'Monitor P1' },
      { id: 'run-demo-3', pilotId: 'plt-3', pilotName: 'Matías "Ghost" Herrera', pilotCallsign: 'GHOST', pilotDorsal: '23', pilotTeam: 'Rotor Strike', trackId: 'track-1', trackName: 'Pista 1: Slalom de Precisión', trackCode: 'P1', timeSeconds: 83.20, status: 'COMPLETED', attemptNumber: 1, isUnlockedForRetry: false, timestamp: new Date(Date.now() - 2500000).toISOString(), recordedBy: 'Monitor P1' },
      { id: 'run-demo-4', pilotId: 'plt-1', pilotName: 'Lucas "Viper" Morales', pilotCallsign: 'VIPER', pilotDorsal: '07', pilotTeam: 'Veltis Aero', trackId: 'track-2', trackName: 'Pista 2: Drag Sprint', trackCode: 'P2', timeSeconds: 42.10, status: 'COMPLETED', attemptNumber: 1, isUnlockedForRetry: false, timestamp: new Date(Date.now() - 2000000).toISOString(), recordedBy: 'Monitor P2' },
      { id: 'run-demo-5', pilotId: 'plt-2', pilotName: 'Camila "Apex" Soto', pilotCallsign: 'APEX', pilotDorsal: '14', pilotTeam: 'Skyline FPV', trackId: 'track-2', trackName: 'Pista 2: Drag Sprint', trackCode: 'P2', timeSeconds: 43.85, status: 'COMPLETED', attemptNumber: 1, isUnlockedForRetry: false, timestamp: new Date(Date.now() - 1500000).toISOString(), recordedBy: 'Monitor P2' }
    ];

    const runsMap = {};
    demoRuns.forEach(r => { runsMap[r.id] = r; });
    await set(ref(this.db, `${this.rootPath}/runs`), runsMap);
    return true;
  }
}

export const droneFirebaseEngine = new DroneFirebaseEngine();
