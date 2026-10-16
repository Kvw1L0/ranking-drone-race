// Configuración por defecto
export const DEFAULT_TRACKS = [
  { id: 'track-1', name: 'Pista 1: Slalom de Precisión', code: 'P1', color: '#00e5ff', description: 'Circuito de giros cerrados y puertas consecutivas', active: true, order: 1 },
  { id: 'track-2', name: 'Pista 2: Drag Sprint', code: 'P2', color: '#ff9100', description: 'Recta de alta velocidad con frenado en zona delimitada', active: true, order: 2 },
  { id: 'track-3', name: 'Pista 3: Circuito Técnico de Aros', code: 'P3', color: '#00e676', description: 'Túnel de aros con elevación y split-s vertical', active: true, order: 3 }
];

export const DEFAULT_POINTS_SYSTEM = [25, 18, 15, 12, 10, 8, 6, 4, 2, 1];

export const DEMO_PILOTS = [
  { id: 'plt-1', name: 'Lucas "Viper" Morales', callsign: 'VIPER', dorsal: '07', team: 'Veltis Aero', registeredAt: new Date().toISOString() },
  { id: 'plt-2', name: 'Camila "Apex" Soto', callsign: 'APEX', dorsal: '14', team: 'Skyline FPV', registeredAt: new Date().toISOString() },
  { id: 'plt-3', name: 'Matías "Ghost" Herrera', callsign: 'GHOST', dorsal: '23', team: 'Rotor Strike', registeredAt: new Date().toISOString() },
  { id: 'plt-4', name: 'Valentina "Nova" Vega', callsign: 'NOVA', dorsal: '44', team: 'Quantum Drones', registeredAt: new Date().toISOString() },
  { id: 'plt-5', name: 'Diego "Blaze" Castro', callsign: 'BLAZE', dorsal: '55', team: 'Veltis Aero', registeredAt: new Date().toISOString() },
  { id: 'plt-6', name: 'Sofía "Falcon" Riquelme', callsign: 'FALCON', dorsal: '88', team: 'Aero Dynamics', registeredAt: new Date().toISOString() }
];

// Motor de cálculo puro para clasificaciones (Opción B)
export function calculateRankings(pilots = [], tracks = DEFAULT_TRACKS, runs = [], pointsTable = DEFAULT_POINTS_SYSTEM) {
  const activeTracks = (tracks || []).filter(t => t.active !== false).sort((a, b) => a.order - b.order);
  const runsList = runs || [];
  const pilotsList = pilots || [];

  // 1. Ranking por pista individual
  const byTrack = {};

  activeTracks.forEach(track => {
    const trackRuns = runsList.filter(r => r.trackId === track.id && r.status === 'COMPLETED');

    const pilotBestRunMap = new Map();
    trackRuns.forEach(run => {
      const existing = pilotBestRunMap.get(run.pilotId);
      if (!existing || run.timeSeconds < existing.timeSeconds) {
        pilotBestRunMap.set(run.pilotId, run);
      }
    });

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

    const completedPilotIds = new Set(sortedCompleted.map(r => r.pilotId));

    const pendingPilots = pilotsList
      .filter(p => !completedPilotIds.has(p.id))
      .map(p => {
        const prevRuns = runsList.filter(r => r.pilotId === p.id && r.trackId === track.id);
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
      totalPilotsCount: pilotsList.length,
      rankings: completedRanked,
      pending: pendingPilots
    };
  });

  // 2. Ranking Global
  const globalPilots = pilotsList.map(pilot => {
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
      globalStatus = 'COMPLETED';
    } else if (completedTracksCount > 0) {
      globalStatus = 'IN_PROGRESS';
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
