import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DRONE_DB_FILE = path.join(__dirname, '../data/droneDb.json');

// Pistas por defecto
export const DEFAULT_TRACKS = [
  { id: 'track-1', name: 'Pista 1: Slalom de Precisión', code: 'P1', color: '#00e5ff', description: 'Circuito de giros cerrados y puertas consecutivas', active: true, order: 1 },
  { id: 'track-2', name: 'Pista 2: Drag Sprint', code: 'P2', color: '#ff9100', description: 'Recta de alta velocidad con frenado en zona delimitada', active: true, order: 2 },
  { id: 'track-3', name: 'Pista 3: Circuito Técnico de Aros', code: 'P3', color: '#00e676', description: 'Túnel de aros con elevación y split-s vertical', active: true, order: 3 }
];

// Sistema de puntos estilo FIA/F1 para cada pista
export const DEFAULT_POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

// Pilotos de demostración
export const DEMO_PILOTS = [
  { id: 'plt-1', name: 'Lucas "Viper" Morales', callsign: 'VIPER', dorsal: '07', team: 'Veltis Aero', registeredAt: new Date().toISOString() },
  { id: 'plt-2', name: 'Camila "Apex" Soto', callsign: 'APEX', dorsal: '14', team: 'Skyline FPV', registeredAt: new Date().toISOString() },
  { id: 'plt-3', name: 'Matías "Ghost" Herrera', callsign: 'GHOST', dorsal: '23', team: 'Rotor Strike', registeredAt: new Date().toISOString() },
  { id: 'plt-4', name: 'Valentina "Nova" Vega', callsign: 'NOVA', dorsal: '44', team: 'Quantum Drones', registeredAt: new Date().toISOString() },
  { id: 'plt-5', name: 'Diego "Blaze" Castro', callsign: 'BLAZE', dorsal: '55', team: 'Veltis Aero', registeredAt: new Date().toISOString() },
  { id: 'plt-6', name: 'Sofía "Falcon" Riquelme', callsign: 'FALCON', dorsal: '88', team: 'Aero Dynamics', registeredAt: new Date().toISOString() }
];

class DroneDatabase {
  constructor() {
    this.data = {
      pilots: [],
      tracks: DEFAULT_TRACKS,
      runs: [],
      settings: {
        pointsSystem: DEFAULT_POINTS_SYSTEM,
        eventName: 'Torneo de Carreras de Drones Veltis'
      }
    };
    this.init();
  }

  init() {
    try {
      const dataDir = path.dirname(DRONE_DB_FILE);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }

      if (fs.existsSync(DRONE_DB_FILE)) {
        const raw = fs.readFileSync(DRONE_DB_FILE, 'utf-8');
        const parsed = JSON.parse(raw);
        this.data = {
          pilots: parsed.pilots || [],
          tracks: parsed.tracks && parsed.tracks.length > 0 ? parsed.tracks : DEFAULT_TRACKS,
          runs: parsed.runs || [],
          settings: parsed.settings || { pointsSystem: DEFAULT_POINTS_SYSTEM, eventName: 'Torneo de Carreras de Drones Veltis' }
        };
        // Si no hay pilotos, cargar demo por defecto para que no inicie vacía
        if (this.data.pilots.length === 0) {
          this.data.pilots = DEMO_PILOTS;
          this.save();
        }
      } else {
        this.data.pilots = DEMO_PILOTS;
        this.data.tracks = DEFAULT_TRACKS;
        this.data.runs = [];
        this.save();
      }
    } catch (error) {
      console.error('Error al inicializar la base de datos de drones:', error);
      this.data.pilots = DEMO_PILOTS;
      this.data.tracks = DEFAULT_TRACKS;
      this.data.runs = [];
    }
  }

  save() {
    try {
      fs.writeFileSync(DRONE_DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (error) {
      console.error('Error al guardar datos de drones en disco:', error);
    }
  }

  // --- PILOTOS ---
  getPilots() {
    return this.data.pilots;
  }

  getPilotById(id) {
    return this.data.pilots.find(p => p.id === id);
  }

  addPilot(pilotData) {
    const newPilot = {
      id: pilotData.id || `plt-${Date.now()}`,
      name: (pilotData.name || '').trim(),
      callsign: (pilotData.callsign || '').trim().toUpperCase(),
      dorsal: (pilotData.dorsal || '').trim(),
      team: (pilotData.team || 'Independiente').trim(),
      registeredAt: new Date().toISOString()
    };
    this.data.pilots.push(newPilot);
    this.save();
    return newPilot;
  }

  updatePilot(id, pilotData) {
    const index = this.data.pilots.findIndex(p => p.id === id);
    if (index === -1) return null;
    this.data.pilots[index] = {
      ...this.data.pilots[index],
      ...pilotData,
      id
    };
    this.save();
    return this.data.pilots[index];
  }

  deletePilot(id) {
    const index = this.data.pilots.findIndex(p => p.id === id);
    if (index === -1) return false;
    this.data.pilots.splice(index, 1);
    // Eliminar también sus tiempos asociados
    this.data.runs = this.data.runs.filter(r => r.pilotId !== id);
    this.save();
    return true;
  }

  // --- PISTAS ---
  getTracks() {
    return this.data.tracks.filter(t => t.active !== false);
  }

  getAllTracks() {
    return this.data.tracks;
  }

  getTrackById(id) {
    return this.data.tracks.find(t => t.id === id);
  }

  addTrack(trackData) {
    const newTrack = {
      id: trackData.id || `track-${Date.now()}`,
      name: trackData.name,
      code: trackData.code || `P${this.data.tracks.length + 1}`,
      color: trackData.color || '#00e5ff',
      description: trackData.description || '',
      order: trackData.order || this.data.tracks.length + 1,
      active: true
    };
    this.data.tracks.push(newTrack);
    this.save();
    return newTrack;
  }

  updateTrack(id, trackData) {
    const index = this.data.tracks.findIndex(t => t.id === id);
    if (index === -1) return null;
    this.data.tracks[index] = { ...this.data.tracks[index], ...trackData, id };
    this.save();
    return this.data.tracks[index];
  }

  // --- REGISTRO DE TIEMPOS (RUNS) ---
  getRuns() {
    return this.data.runs;
  }

  getRunsByPilot(pilotId) {
    return this.data.runs.filter(r => r.pilotId === pilotId);
  }

  getRunsByTrack(trackId) {
    return this.data.runs.filter(r => r.trackId === trackId);
  }

  // Obtener el intento actual de un piloto en una pista
  getPilotRunForTrack(pilotId, trackId) {
    const runs = this.data.runs.filter(r => r.pilotId === pilotId && r.trackId === trackId);
    if (runs.length === 0) return null;
    // Retornar el último intento registrado
    return runs[runs.length - 1];
  }

  // Registrar un tiempo para un piloto en una pista
  recordRun({ pilotId, trackId, timeSeconds, recordedBy = 'Monitor', notes = '' }) {
    const pilot = this.getPilotById(pilotId);
    if (!pilot) throw new Error('Piloto no encontrado');

    const track = this.getTrackById(trackId);
    if (!track) throw new Error('Pista no encontrada');

    const timeNum = parseFloat(timeSeconds);
    if (isNaN(timeNum) || timeNum <= 0) {
      throw new Error('El tiempo debe ser un número positivo de segundos válido');
    }

    // Comprobar intentos previos en esta pista
    const previousRuns = this.data.runs.filter(r => r.pilotId === pilotId && r.trackId === trackId);
    const lastRun = previousRuns.length > 0 ? previousRuns[previousRuns.length - 1] : null;

    // Si ya existe un intento y no está desbloqueado explícitamente para reintento:
    if (lastRun && !lastRun.isUnlockedForRetry && lastRun.status === 'COMPLETED') {
      throw new Error(`El piloto ${pilot.name} ya tiene un intento oficial registrado (${lastRun.timeSeconds}s) en esta pista. Se requiere desbloqueo de reintento.`);
    }

    const attemptNumber = previousRuns.length + 1;

    // Si el intento previo estaba desbloqueado, marcamos que ya se consumió
    if (lastRun && lastRun.isUnlockedForRetry) {
      lastRun.isUnlockedForRetry = false;
    }

    const newRun = {
      id: `run-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      pilotId: pilot.id,
      pilotName: pilot.name,
      pilotCallsign: pilot.callsign,
      pilotDorsal: pilot.dorsal,
      pilotTeam: pilot.team,
      trackId: track.id,
      trackName: track.name,
      trackCode: track.code,
      timeSeconds: parseFloat(timeNum.toFixed(2)),
      status: 'COMPLETED',
      attemptNumber,
      isUnlockedForRetry: false,
      timestamp: new Date().toISOString(),
      recordedBy,
      notes
    };

    this.data.runs.push(newRun);
    this.save();
    return newRun;
  }

  // Desbloquear un reintento para un piloto en una pista específica
  unlockRetry(pilotId, trackId, reason = 'Falla técnica o reinicio autorizado') {
    const runs = this.data.runs.filter(r => r.pilotId === pilotId && r.trackId === trackId);
    if (runs.length === 0) {
      throw new Error('El piloto aún no tiene intentos en esta pista para desbloquear');
    }

    const lastRun = runs[runs.length - 1];
    lastRun.isUnlockedForRetry = true;
    lastRun.unlockReason = reason;
    lastRun.unlockedAt = new Date().toISOString();
    this.save();
    return lastRun;
  }

  // Eliminar un tiempo (en caso de error del monitor)
  deleteRun(runId) {
    const index = this.data.runs.findIndex(r => r.id === runId);
    if (index === -1) return false;
    this.data.runs.splice(index, 1);
    this.save();
    return true;
  }

  // Reiniciar todas las carreras (limpiar tiempos pero conservar pilotos y pistas)
  resetTournament(clearPilots = false) {
    this.data.runs = [];
    if (clearPilots) {
      this.data.pilots = [];
    }
    this.save();
    return true;
  }

  // Cargar datos de demostración
  preloadDemoData() {
    this.data.pilots = [...DEMO_PILOTS];
    this.data.tracks = [...DEFAULT_TRACKS];
    this.data.runs = [
      // Pista 1 tiempos
      {
        id: 'run-demo-1',
        pilotId: 'plt-1',
        pilotName: 'Lucas "Viper" Morales',
        pilotCallsign: 'VIPER',
        pilotDorsal: '07',
        pilotTeam: 'Veltis Aero',
        trackId: 'track-1',
        trackName: 'Pista 1: Slalom de Precisión',
        trackCode: 'P1',
        timeSeconds: 78.45,
        status: 'COMPLETED',
        attemptNumber: 1,
        isUnlockedForRetry: false,
        timestamp: new Date(Date.now() - 3600000).toISOString(),
        recordedBy: 'Monitor P1'
      },
      {
        id: 'run-demo-2',
        pilotId: 'plt-2',
        pilotName: 'Camila "Apex" Soto',
        pilotCallsign: 'APEX',
        pilotDorsal: '14',
        pilotTeam: 'Skyline FPV',
        trackId: 'track-1',
        trackName: 'Pista 1: Slalom de Precisión',
        trackCode: 'P1',
        timeSeconds: 76.12,
        status: 'COMPLETED',
        attemptNumber: 1,
        isUnlockedForRetry: false,
        timestamp: new Date(Date.now() - 3000000).toISOString(),
        recordedBy: 'Monitor P1'
      },
      {
        id: 'run-demo-3',
        pilotId: 'plt-3',
        pilotName: 'Matías "Ghost" Herrera',
        pilotCallsign: 'GHOST',
        pilotDorsal: '23',
        pilotTeam: 'Rotor Strike',
        trackId: 'track-1',
        trackName: 'Pista 1: Slalom de Precisión',
        trackCode: 'P1',
        timeSeconds: 83.20,
        status: 'COMPLETED',
        attemptNumber: 1,
        isUnlockedForRetry: false,
        timestamp: new Date(Date.now() - 2500000).toISOString(),
        recordedBy: 'Monitor P1'
      },
      // Pista 2 tiempos
      {
        id: 'run-demo-4',
        pilotId: 'plt-1',
        pilotName: 'Lucas "Viper" Morales',
        pilotCallsign: 'VIPER',
        pilotDorsal: '07',
        pilotTeam: 'Veltis Aero',
        trackId: 'track-2',
        trackName: 'Pista 2: Drag Sprint',
        trackCode: 'P2',
        timeSeconds: 42.10,
        status: 'COMPLETED',
        attemptNumber: 1,
        isUnlockedForRetry: false,
        timestamp: new Date(Date.now() - 2000000).toISOString(),
        recordedBy: 'Monitor P2'
      },
      {
        id: 'run-demo-5',
        pilotId: 'plt-2',
        pilotName: 'Camila "Apex" Soto',
        pilotCallsign: 'APEX',
        pilotDorsal: '14',
        pilotTeam: 'Skyline FPV',
        trackId: 'track-2',
        trackName: 'Pista 2: Drag Sprint',
        trackCode: 'P2',
        timeSeconds: 43.85,
        status: 'COMPLETED',
        attemptNumber: 1,
        isUnlockedForRetry: false,
        timestamp: new Date(Date.now() - 1500000).toISOString(),
        recordedBy: 'Monitor P2'
      },
      {
        id: 'run-demo-6',
        pilotId: 'plt-4',
        pilotName: 'Valentina "Nova" Vega',
        pilotCallsign: 'NOVA',
        pilotDorsal: '44',
        pilotTeam: 'Quantum Drones',
        trackId: 'track-2',
        trackName: 'Pista 2: Drag Sprint',
        trackCode: 'P2',
        timeSeconds: 41.50,
        status: 'COMPLETED',
        attemptNumber: 1,
        isUnlockedForRetry: false,
        timestamp: new Date(Date.now() - 1000000).toISOString(),
        recordedBy: 'Monitor P2'
      }
    ];
    this.save();
    return true;
  }

  // --- MOTOR DE CÁLCULO DE RANKINGS (OPCIÓN B) ---
  calculateRankings() {
    const activeTracks = this.getTracks().sort((a, b) => a.order - b.order);
    const pilots = this.getPilots();
    const runs = this.getRuns();
    const pointsTable = this.data.settings?.pointsSystem || DEFAULT_POINTS_SYSTEM;

    // 1. RANKING POR CADA PISTA INDIVIDUAL
    const byTrack = {};

    activeTracks.forEach(track => {
      // Filtrar todas las carreras completadas de esta pista
      const trackRuns = runs.filter(r => r.trackId === track.id && r.status === 'COMPLETED');

      // Si un piloto tiene múltiples intentos (por reintento desbloqueado), nos quedamos con el último o mejor tiempo
      // La regla estándar es que el nuevo intento oficial reemplaza o se toma el mejor tiempo.
      const pilotBestRunMap = new Map();

      trackRuns.forEach(run => {
        const existing = pilotBestRunMap.get(run.pilotId);
        if (!existing || run.timeSeconds < existing.timeSeconds) {
          pilotBestRunMap.set(run.pilotId, run);
        }
      });

      // Ordenar por tiempo ascendente (menor tiempo = 1er lugar)
      const sortedCompleted = Array.from(pilotBestRunMap.values()).sort((a, b) => a.timeSeconds - b.timeSeconds);

      const bestTime = sortedCompleted.length > 0 ? sortedCompleted[0].timeSeconds : null;

      const completedRanked = sortedCompleted.map((run, index) => {
        const position = index + 1;
        const points = position <= pointsTable.length ? pointsTable[position - 1] : 0;
        const deltaWithLeader = bestTime !== null ? +(run.timeSeconds - bestTime).toFixed(2) : 0;

        return {
          position,
          runId: run.id,
          pilotId: run.pilotId,
          pilotName: run.pilotName,
          pilotCallsign: run.pilotCallsign,
          pilotDorsal: run.pilotDorsal,
          pilotTeam: run.pilotTeam,
          timeSeconds: run.timeSeconds,
          points,
          deltaWithLeader,
          attemptNumber: run.attemptNumber,
          timestamp: run.timestamp,
          status: 'COMPLETED'
        };
      });

      // Identificar pilotos pendientes en esta pista
      const completedPilotIds = new Set(sortedCompleted.map(r => r.pilotId));

      const pendingPilots = pilots
        .filter(p => !completedPilotIds.has(p.id))
        .map(p => {
          // Revisar si tiene algún intento previo desbloqueado para reintento
          const prevRuns = runs.filter(r => r.pilotId === p.id && r.trackId === track.id);
          const hasRetryUnlocked = prevRuns.some(r => r.isUnlockedForRetry);

          return {
            pilotId: p.id,
            pilotName: p.name,
            pilotCallsign: p.callsign,
            pilotDorsal: p.dorsal,
            pilotTeam: p.team,
            status: hasRetryUnlocked ? 'RETRY_UNLOCKED' : 'PENDING',
            hasRetryUnlocked
          };
        });

      byTrack[track.id] = {
        trackId: track.id,
        trackName: track.name,
        trackCode: track.code,
        trackColor: track.color,
        bestTime,
        completedCount: completedRanked.length,
        totalPilotsCount: pilots.length,
        rankings: completedRanked,
        pending: pendingPilots
      };
    });

    // 2. RANKING GLOBAL POR PUNTOS
    const globalPilots = pilots.map(pilot => {
      let totalPoints = 0;
      let totalTime = 0;
      const trackBreakdown = {};
      const completedTracksList = [];
      const pendingTracksList = [];

      activeTracks.forEach(track => {
        const trackData = byTrack[track.id];
        const runInTrack = trackData?.rankings.find(r => r.pilotId === pilot.id);

        if (runInTrack) {
          totalPoints += runInTrack.points;
          totalTime += runInTrack.timeSeconds;
          completedTracksList.push({
            trackId: track.id,
            trackName: track.name,
            trackCode: track.code,
            timeSeconds: runInTrack.timeSeconds,
            position: runInTrack.position,
            points: runInTrack.points
          });
          trackBreakdown[track.id] = {
            status: 'COMPLETED',
            timeSeconds: runInTrack.timeSeconds,
            position: runInTrack.position,
            points: runInTrack.points
          };
        } else {
          pendingTracksList.push({
            trackId: track.id,
            trackName: track.name,
            trackCode: track.code
          });
          trackBreakdown[track.id] = {
            status: 'PENDING',
            timeSeconds: null,
            position: null,
            points: 0
          };
        }
      });

      const totalTracksCount = activeTracks.length;
      const completedTracksCount = completedTracksList.length;

      let globalStatus = 'PENDING';
      if (completedTracksCount === totalTracksCount && totalTracksCount > 0) {
        globalStatus = 'COMPLETED'; // Completó todas las pistas
      } else if (completedTracksCount > 0) {
        globalStatus = 'IN_PROGRESS'; // Ha corrido en algunas, faltan otras
      }

      return {
        pilotId: pilot.id,
        pilotName: pilot.name,
        pilotCallsign: pilot.callsign,
        pilotDorsal: pilot.dorsal,
        pilotTeam: pilot.team,
        totalPoints,
        totalTime: +(totalTime.toFixed(2)),
        completedTracksCount,
        totalTracksCount,
        globalStatus,
        completedTracksList,
        pendingTracksList,
        trackBreakdown
      };
    });

    // Ordenar clasificación general:
    // 1° Mayor puntaje total
    // 2° En caso de empate en puntos, menor tiempo total acumulado
    // 3° Si ambos tienen 0 puntos, más pistas completadas
    globalPilots.sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) {
        return b.totalPoints - a.totalPoints;
      }
      if (a.completedTracksCount !== b.completedTracksCount) {
        return b.completedTracksCount - a.completedTracksCount;
      }
      return a.totalTime - b.totalTime;
    });

    const globalRanked = globalPilots.map((p, index) => ({
      position: index + 1,
      ...p
    }));

    return {
      activeTracks,
      byTrack,
      global: globalRanked,
      generatedAt: new Date().toISOString()
    };
  }

  // Obtener estado completo unificado para el frontend
  getFullState() {
    return {
      pilots: this.getPilots(),
      tracks: this.getTracks(),
      runs: this.getRuns(),
      rankings: this.calculateRankings()
    };
  }
}

export const droneDb = new DroneDatabase();
