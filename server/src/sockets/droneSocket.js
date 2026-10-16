import { droneDb } from '../config/droneDatabase.js';
import { setDroneIoInstance, broadcastDroneUpdate } from '../controllers/droneController.js';

export function setupDroneSockets(io) {
  setDroneIoInstance(io);

  io.on('connection', (socket) => {
    // Cuando cualquier cliente (pantalla gigante o monitor) se conecta, enviamos el estado completo
    socket.emit('drone:state_update', droneDb.getFullState());

    // Monitor se suscribe a una pista en particular (opcional para feedback específico)
    socket.on('drone:join_track_station', ({ trackId, monitorName }) => {
      socket.join(`track_${trackId}`);
      socket.monitorName = monitorName;
      socket.currentTrackId = trackId;
    });

    // Registrar tiempo desde WebSocket directo
    socket.on('drone:submit_run', ({ pilotId, trackId, timeSeconds, recordedBy, notes }, callback) => {
      try {
        const run = droneDb.recordRun({
          pilotId,
          trackId,
          timeSeconds,
          recordedBy: recordedBy || socket.monitorName || 'Monitor',
          notes
        });

        // Emitir alerta sonora y visual a todos
        broadcastDroneUpdate('drone:new_time_alert', {
          pilotName: run.pilotName,
          pilotCallsign: run.pilotCallsign,
          pilotDorsal: run.pilotDorsal,
          trackName: run.trackName,
          trackCode: run.trackCode,
          timeSeconds: run.timeSeconds,
          timestamp: run.timestamp
        });

        if (callback) callback({ success: true, data: run });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Desbloquear reintento desde WebSocket
    socket.on('drone:unlock_retry', ({ pilotId, trackId, reason }, callback) => {
      try {
        const updatedRun = droneDb.unlockRetry(pilotId, trackId, reason);
        broadcastDroneUpdate('drone:retry_unlocked', { pilotId, trackId, reason });
        if (callback) callback({ success: true, data: updatedRun });
      } catch (error) {
        if (callback) callback({ success: false, message: error.message });
      }
    });

    // Solicitar sincronización manual
    socket.on('drone:request_sync', () => {
      socket.emit('drone:state_update', droneDb.getFullState());
    });
  });
}
