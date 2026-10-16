'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { io } from 'socket.io-client';
import { isFirebaseConfigured } from '../lib/firebase';
import { droneFirebaseEngine } from '../lib/droneFirebaseEngine';
import { DEFAULT_TRACKS, DEMO_PILOTS, calculateRankings } from '../lib/droneEngine';

const DroneContext = createContext(null);

const SOCKET_SERVER_URL = process.env.NEXT_PUBLIC_SOCKET_URL || 'http://localhost:4000';
const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000';

export function DroneProvider({ children }) {
  const [socket, setSocket] = useState(null);
  const [isConnected, setIsConnected] = useState(false);
  const [isCloudFirebase, setIsCloudFirebase] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [newTimeAlert, setNewTimeAlert] = useState(null);

  const [droneState, setDroneState] = useState({
    pilots: DEMO_PILOTS,
    tracks: DEFAULT_TRACKS,
    runs: [],
    rankings: calculateRankings(DEMO_PILOTS, DEFAULT_TRACKS, [])
  });

  // 1. Conexión y suscripción en tiempo real (Cloud Firebase o Socket Local)
  useEffect(() => {
    // A) MODO NUBE: GOOGLE FIREBASE REALTIME DATABASE (Vercel & Móviles)
    if (isFirebaseConfigured()) {
      console.log('🛸 Conectando telemetría de drones a Google Firebase Cloud...');
      setIsCloudFirebase(true);
      setIsConnected(true);
      setIsLoading(false);

      const unsubFirebase = droneFirebaseEngine.onDroneStateChange((cloudState) => {
        if (cloudState) {
          setDroneState(prev => ({
            ...prev,
            pilots: cloudState.pilots || [],
            tracks: cloudState.tracks || DEFAULT_TRACKS,
            runs: cloudState.runs || [],
            rankings: cloudState.rankings || calculateRankings(cloudState.pilots, cloudState.tracks, cloudState.runs)
          }));

          if (cloudState.lastAlert) {
            setNewTimeAlert(cloudState.lastAlert);
            setTimeout(() => {
              setNewTimeAlert(curr => (curr?.timestamp === cloudState.lastAlert?.timestamp ? null : curr));
            }, 6000);
          }
        }
      });

      return () => {
        if (unsubFirebase) unsubFirebase();
      };
    }

    // B) MODO LOCAL: SOCKET.IO + REST BACKEND
    console.log('⚡ Conectando a Servidor Local Socket.io:', SOCKET_SERVER_URL);

    const fetchLocalState = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/drone/state`);
        if (res.ok) {
          const json = await res.json();
          if (json.success && json.data) {
            setDroneState(json.data);
          }
        }
      } catch (err) {
        console.warn('Nota: Backend local no detectado aún:', err.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchLocalState();

    const newSocket = io(SOCKET_SERVER_URL, {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 15,
      reconnectionDelay: 1500
    });

    newSocket.on('connect', () => {
      console.log('🟢 Conectado a WebSocket local:', newSocket.id);
      setIsConnected(true);
      newSocket.emit('drone:request_sync');
    });

    newSocket.on('disconnect', () => {
      setIsConnected(false);
    });

    newSocket.on('drone:state_update', (fullState) => {
      if (fullState) setDroneState(fullState);
    });

    newSocket.on('drone:new_time_alert', (alert) => {
      setNewTimeAlert(alert);
      setTimeout(() => {
        setNewTimeAlert(curr => (curr?.timestamp === alert.timestamp ? null : curr));
      }, 6000);
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, []);

  // 2. Acciones del Sistema (Híbridas: Cloud Firebase o Local Backend)

  // Subir tiempo
  const submitRun = async ({ pilotId, trackId, timeSeconds, recordedBy = 'Monitor', notes = '' }) => {
    if (isCloudFirebase) {
      return await droneFirebaseEngine.submitRun({ pilotId, trackId, timeSeconds, recordedBy, notes });
    }

    if (socket && socket.connected) {
      return new Promise((resolve, reject) => {
        socket.emit('drone:submit_run', { pilotId, trackId, timeSeconds, recordedBy, notes }, (response) => {
          if (response?.success) resolve(response.data);
          else reject(new Error(response?.message || 'Error al registrar tiempo'));
        });
      });
    }

    // Fallback REST
    const res = await fetch(`${API_BASE_URL}/api/drone/runs`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilotId, trackId, timeSeconds, recordedBy, notes })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al registrar tiempo');
    return json.data;
  };

  // Desbloquear reintento
  const unlockRetry = async ({ pilotId, trackId, reason = 'Falla técnica autorizada' }) => {
    if (isCloudFirebase) {
      return await droneFirebaseEngine.unlockRetry(pilotId, trackId, reason);
    }

    if (socket && socket.connected) {
      return new Promise((resolve, reject) => {
        socket.emit('drone:unlock_retry', { pilotId, trackId, reason }, (response) => {
          if (response?.success) resolve(response.data);
          else reject(new Error(response?.message || 'Error al desbloquear'));
        });
      });
    }

    const res = await fetch(`${API_BASE_URL}/api/drone/runs/unlock-retry`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pilotId, trackId, reason })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al desbloquear');
    return json.data;
  };

  // Crear piloto
  const createPilot = async (pilotData) => {
    if (isCloudFirebase) {
      return await droneFirebaseEngine.createPilot(pilotData);
    }

    const res = await fetch(`${API_BASE_URL}/api/drone/pilots`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(pilotData)
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al crear piloto');
    return json.data;
  };

  // Eliminar piloto
  const deletePilot = async (pilotId) => {
    if (isCloudFirebase) {
      return await droneFirebaseEngine.deletePilot(pilotId);
    }

    const res = await fetch(`${API_BASE_URL}/api/drone/pilots/${pilotId}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al eliminar');
    return true;
  };

  // Eliminar run
  const deleteRun = async (runId) => {
    if (isCloudFirebase) {
      return await droneFirebaseEngine.deleteRun(runId);
    }

    const res = await fetch(`${API_BASE_URL}/api/drone/runs/${runId}`, {
      method: 'DELETE'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al eliminar tiempo');
    return true;
  };

  // Reiniciar torneo
  const resetTournament = async (clearPilots = false) => {
    if (isCloudFirebase) {
      return await droneFirebaseEngine.resetTournament(clearPilots);
    }

    const res = await fetch(`${API_BASE_URL}/api/drone/reset`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clearPilots })
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al reiniciar');
    return true;
  };

  // Cargar demo
  const preloadDemo = async () => {
    if (isCloudFirebase) {
      return await droneFirebaseEngine.preloadDemo();
    }

    const res = await fetch(`${API_BASE_URL}/api/drone/preload-demo`, {
      method: 'POST'
    });
    const json = await res.json();
    if (!json.success) throw new Error(json.message || 'Error al cargar demo');
    return true;
  };

  return (
    <DroneContext.Provider value={{
      socket,
      isConnected,
      isCloudFirebase,
      isLoading,
      droneState,
      newTimeAlert,
      clearAlert: () => setNewTimeAlert(null),
      submitRun,
      unlockRetry,
      createPilot,
      deletePilot,
      deleteRun,
      resetTournament,
      preloadDemo
    }}>
      {children}
    </DroneContext.Provider>
  );
}

export function useDrone() {
  const context = useContext(DroneContext);
  if (!context) {
    throw new Error('useDrone debe usarse dentro de un DroneProvider');
  }
  return context;
}
