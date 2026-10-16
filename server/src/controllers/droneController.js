import { droneDb } from '../config/droneDatabase.js';

let ioInstance = null;

export const setDroneIoInstance = (io) => {
  ioInstance = io;
};

// Emitir actualización a todos los clientes conectados
export const broadcastDroneUpdate = (eventType = 'drone:state_update', payload = null) => {
  if (ioInstance) {
    const fullState = droneDb.getFullState();
    ioInstance.emit('drone:state_update', fullState);
    if (eventType !== 'drone:state_update' && payload) {
      ioInstance.emit(eventType, payload);
    }
  }
};

export const droneController = {
  // Obtener estado completo
  getState: (req, res) => {
    try {
      const state = droneDb.getFullState();
      res.json({ success: true, data: state });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- PILOTOS ---
  getPilots: (req, res) => {
    res.json({ success: true, data: droneDb.getPilots() });
  },

  createPilot: (req, res) => {
    try {
      const { name, callsign, dorsal, team } = req.body;
      if (!name || !name.trim()) {
        return res.status(400).json({ success: false, message: 'El nombre del piloto es requerido' });
      }
      const pilot = droneDb.addPilot({ name, callsign, dorsal, team });
      broadcastDroneUpdate('drone:pilot_added', { pilot });
      res.status(201).json({ success: true, data: pilot });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  updatePilot: (req, res) => {
    try {
      const { id } = req.params;
      const updated = droneDb.updatePilot(id, req.body);
      if (!updated) {
        return res.status(404).json({ success: false, message: 'Piloto no encontrado' });
      }
      broadcastDroneUpdate('drone:pilot_updated', { pilot: updated });
      res.json({ success: true, data: updated });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  deletePilot: (req, res) => {
    try {
      const { id } = req.params;
      const deleted = droneDb.deletePilot(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Piloto no encontrado' });
      }
      broadcastDroneUpdate('drone:pilot_deleted', { id });
      res.json({ success: true, message: 'Piloto eliminado correctamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- PISTAS ---
  getTracks: (req, res) => {
    res.json({ success: true, data: droneDb.getTracks() });
  },

  createTrack: (req, res) => {
    try {
      const { name, code, color, description } = req.body;
      if (!name) return res.status(400).json({ success: false, message: 'El nombre de la pista es requerido' });
      const track = droneDb.addTrack({ name, code, color, description });
      broadcastDroneUpdate();
      res.status(201).json({ success: true, data: track });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  // --- REGISTRO DE TIEMPOS (RUNS) ---
  recordRun: (req, res) => {
    try {
      const { pilotId, trackId, timeSeconds, recordedBy, notes } = req.body;
      if (!pilotId || !trackId || timeSeconds === undefined) {
        return res.status(400).json({ success: false, message: 'Faltan campos obligatorios (pilotId, trackId, timeSeconds)' });
      }

      const run = droneDb.recordRun({ pilotId, trackId, timeSeconds, recordedBy, notes });

      // Notificación especial para pantalla gigante
      broadcastDroneUpdate('drone:new_time_alert', {
        pilotName: run.pilotName,
        pilotCallsign: run.pilotCallsign,
        pilotDorsal: run.pilotDorsal,
        trackName: run.trackName,
        trackCode: run.trackCode,
        timeSeconds: run.timeSeconds,
        timestamp: run.timestamp
      });

      res.status(201).json({ success: true, data: run });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  unlockRetry: (req, res) => {
    try {
      const { pilotId, trackId, reason } = req.body;
      if (!pilotId || !trackId) {
        return res.status(400).json({ success: false, message: 'Falta pilotId o trackId' });
      }

      const updatedRun = droneDb.unlockRetry(pilotId, trackId, reason);
      broadcastDroneUpdate('drone:retry_unlocked', { pilotId, trackId, reason });
      res.json({ success: true, message: 'Reintento desbloqueado exitosamente', data: updatedRun });
    } catch (error) {
      res.status(400).json({ success: false, message: error.message });
    }
  },

  deleteRun: (req, res) => {
    try {
      const { id } = req.params;
      const deleted = droneDb.deleteRun(id);
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Tiempo no encontrado' });
      }
      broadcastDroneUpdate();
      res.json({ success: true, message: 'Tiempo eliminado' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  resetTournament: (req, res) => {
    try {
      const { clearPilots } = req.body || {};
      droneDb.resetTournament(clearPilots === true);
      broadcastDroneUpdate('drone:tournament_reset', { clearPilots });
      res.json({ success: true, message: 'Torneo reiniciado correctamente' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  },

  preloadDemo: (req, res) => {
    try {
      droneDb.preloadDemoData();
      broadcastDroneUpdate('drone:demo_loaded');
      res.json({ success: true, message: 'Datos de demostración cargados' });
    } catch (error) {
      res.status(500).json({ success: false, message: error.message });
    }
  }
};
