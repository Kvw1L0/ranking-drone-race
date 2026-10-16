'use client';

import React, { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import { useDrone } from '../../context/DroneContext';
import {
  Timer,
  Play,
  Square,
  RotateCcw,
  CheckCircle2,
  AlertTriangle,
  Lock,
  Unlock,
  UserPlus,
  Send,
  Search,
  Radio,
  Tv,
  Trash2,
  Clock,
  ArrowLeft,
  ChevronDown
} from 'lucide-react';

export default function MonitorPage() {
  const {
    droneState,
    submitRun,
    unlockRetry,
    createPilot,
    deleteRun,
    isConnected
  } = useDrone();

  const { tracks, pilots, runs } = droneState;

  // Selección de pista activa
  const [selectedTrackId, setSelectedTrackId] = useState('');
  const [monitorName, setMonitorName] = useState('');

  // Piloto seleccionado y búsqueda
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedPilotId, setSelectedPilotId] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  // Modal para crear nuevo piloto rápido
  const [isNewPilotModalOpen, setIsNewPilotModalOpen] = useState(false);
  const [newPilotName, setNewPilotName] = useState('');
  const [newPilotCallsign, setNewPilotCallsign] = useState('');
  const [newPilotDorsal, setNewPilotDorsal] = useState('');
  const [newPilotTeam, setNewPilotTeam] = useState('');
  const [isCreatingPilot, setIsCreatingPilot] = useState(false);

  // Modal para desbloquear reintento
  const [isUnlockModalOpen, setIsUnlockModalOpen] = useState(false);
  const [unlockReason, setUnlockReason] = useState('Falla técnica o caída de drone');
  const [isUnlocking, setIsUnlocking] = useState(false);

  // Cronómetro digital integrado
  const [isStopwatchRunning, setIsStopwatchRunning] = useState(false);
  const [stopwatchTimeMs, setStopwatchTimeMs] = useState(0);
  const stopwatchIntervalRef = useRef(null);

  // Input de tiempo manual
  const [timeInput, setTimeInput] = useState('');
  const [notesInput, setNotesInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState(null);
  const [errorMessage, setErrorMessage] = useState(null);

  // Inicializar pista y monitor desde localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedTrack = localStorage.getItem('drone_monitor_track');
      const savedName = localStorage.getItem('drone_monitor_name') || 'Monitor Pista';
      if (savedTrack) setSelectedTrackId(savedTrack);
      setMonitorName(savedName);
    }
  }, []);

  // Si no hay pista seleccionada y hay pistas disponibles, seleccionar la primera
  useEffect(() => {
    if (!selectedTrackId && tracks.length > 0) {
      setSelectedTrackId(tracks[0].id);
    }
  }, [tracks, selectedTrackId]);

  const handleTrackChange = (trackId) => {
    setSelectedTrackId(trackId);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drone_monitor_track', trackId);
    }
    // Limpiar formulario al cambiar de pista
    setTimeInput('');
    setSuccessMessage(null);
    setErrorMessage(null);
  };

  const handleMonitorNameChange = (name) => {
    setMonitorName(name);
    if (typeof window !== 'undefined') {
      localStorage.setItem('drone_monitor_name', name);
    }
  };

  // Cronómetro digital logic
  useEffect(() => {
    if (isStopwatchRunning) {
      const startTime = Date.now() - stopwatchTimeMs;
      stopwatchIntervalRef.current = setInterval(() => {
        setStopwatchTimeMs(Date.now() - startTime);
      }, 10);
    } else {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    }
    return () => {
      if (stopwatchIntervalRef.current) clearInterval(stopwatchIntervalRef.current);
    };
  }, [isStopwatchRunning]);

  const formatStopwatch = (ms) => {
    const totalSec = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSec / 60);
    const seconds = totalSec % 60;
    const hundredths = Math.floor((ms % 1000) / 10);
    return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}.${String(hundredths).padStart(2, '0')}`;
  };

  const handleStartStopwatch = () => setIsStopwatchRunning(true);
  const handleStopStopwatch = () => {
    setIsStopwatchRunning(false);
    // Asignar automáticamente los segundos con 2 decimales al input de tiempo
    const secondsValue = (stopwatchTimeMs / 1000).toFixed(2);
    setTimeInput(secondsValue);
  };
  const handleResetStopwatch = () => {
    setIsStopwatchRunning(false);
    setStopwatchTimeMs(0);
  };
  const handleUseStopwatchTime = () => {
    const secondsValue = (stopwatchTimeMs / 1000).toFixed(2);
    setTimeInput(secondsValue);
  };

  // Pista activa
  const currentTrack = useMemo(() => {
    return tracks.find(t => t.id === selectedTrackId) || tracks[0] || null;
  }, [tracks, selectedTrackId]);

  // Piloto activo
  const selectedPilot = useMemo(() => {
    return pilots.find(p => p.id === selectedPilotId) || null;
  }, [pilots, selectedPilotId]);

  // Historial de intentos del piloto en esta pista
  const pilotRunsOnCurrentTrack = useMemo(() => {
    if (!selectedPilotId || !selectedTrackId) return [];
    return runs.filter(r => r.pilotId === selectedPilotId && r.trackId === selectedTrackId);
  }, [runs, selectedPilotId, selectedTrackId]);

  const lastRunOnTrack = useMemo(() => {
    if (pilotRunsOnCurrentTrack.length === 0) return null;
    return pilotRunsOnCurrentTrack[pilotRunsOnCurrentTrack.length - 1];
  }, [pilotRunsOnCurrentTrack]);

  // Determinar si el piloto está bloqueado por tener ya un intento realizado
  const isBlockedBySingleAttempt = useMemo(() => {
    if (!lastRunOnTrack) return false;
    // Si ya completó y NO está desbloqueado para reintento:
    return lastRunOnTrack.status === 'COMPLETED' && !lastRunOnTrack.isUnlockedForRetry;
  }, [lastRunOnTrack]);

  const isRetryUnlocked = useMemo(() => {
    return lastRunOnTrack && lastRunOnTrack.isUnlockedForRetry;
  }, [lastRunOnTrack]);

  // Filtrado de pilotos para el buscador/dropdown
  const filteredPilots = useMemo(() => {
    if (!searchQuery.trim()) return pilots;
    const q = searchQuery.toLowerCase();
    return pilots.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.callsign && p.callsign.toLowerCase().includes(q)) ||
      (p.dorsal && p.dorsal.toLowerCase().includes(q)) ||
      (p.team && p.team.toLowerCase().includes(q))
    );
  }, [pilots, searchQuery]);

  // Últimos registros en esta pista (historial en vivo de la estación)
  const recentRunsInThisTrack = useMemo(() => {
    if (!selectedTrackId) return [];
    return runs
      .filter(r => r.trackId === selectedTrackId)
      .slice(-6)
      .reverse();
  }, [runs, selectedTrackId]);

  // Enviar tiempo
  const handleSubmitTime = async (e) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    if (!selectedPilotId) {
      setErrorMessage('Por favor selecciona un piloto de la lista.');
      return;
    }
    if (!selectedTrackId) {
      setErrorMessage('Por favor selecciona la pista correspondiente.');
      return;
    }
    if (!timeInput || isNaN(parseFloat(timeInput)) || parseFloat(timeInput) <= 0) {
      setErrorMessage('Ingresa un tiempo válido en segundos (ej: 83.45).');
      return;
    }

    if (isBlockedBySingleAttempt) {
      setErrorMessage(`El piloto ya cuenta con un tiempo oficial registrado (${lastRunOnTrack.timeSeconds}s). Debes desbloquear el reintento para ingresar otro tiempo.`);
      return;
    }

    setIsSubmitting(true);
    try {
      const recorded = await submitRun({
        pilotId: selectedPilotId,
        trackId: selectedTrackId,
        timeSeconds: parseFloat(timeInput),
        recordedBy: monitorName || 'Monitor de Pista',
        notes: notesInput
      });

      setSuccessMessage(`¡Tiempo registrado con éxito! ${selectedPilot.name}: ${recorded.timeSeconds}s. Actualizado en la pantalla gigante.`);
      setTimeInput('');
      setNotesInput('');
      handleResetStopwatch();
      setSelectedPilotId('');
      setSearchQuery('');
    } catch (err) {
      setErrorMessage(err.message || 'Error al guardar el tiempo.');
    } finally {
      setIsSubmitting(false);
    }
  };

  // Desbloquear reintento
  const handleUnlockRetry = async () => {
    if (!selectedPilotId || !selectedTrackId) return;
    setIsUnlocking(true);
    try {
      await unlockRetry({
        pilotId: selectedPilotId,
        trackId: selectedTrackId,
        reason: unlockReason
      });
      setIsUnlockModalOpen(false);
      setSuccessMessage(`Reintento habilitado para ${selectedPilot.name}. Ahora puedes registrar su nuevo tiempo.`);
    } catch (err) {
      setErrorMessage(err.message || 'Error al desbloquear reintento.');
    } finally {
      setIsUnlocking(false);
    }
  };

  // Crear nuevo piloto al vuelo
  const handleCreateNewPilot = async (e) => {
    e.preventDefault();
    if (!newPilotName.trim()) return;

    setIsCreatingPilot(true);
    try {
      const created = await createPilot({
        name: newPilotName,
        callsign: newPilotCallsign,
        dorsal: newPilotDorsal || String(pilots.length + 1).padStart(2, '0'),
        team: newPilotTeam || 'Independiente'
      });

      setSelectedPilotId(created.id);
      setSearchQuery(created.name);
      setIsNewPilotModalOpen(false);
      setNewPilotName('');
      setNewPilotCallsign('');
      setNewPilotDorsal('');
      setNewPilotTeam('');
      setSuccessMessage(`Piloto "${created.name}" registrado e inmediatamente seleccionado.`);
    } catch (err) {
      setErrorMessage(err.message || 'Error al crear piloto');
    } finally {
      setIsCreatingPilot(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col">
      {/* Barra de cabecera */}
      <header className="bg-slate-900/90 border-b border-slate-800 sticky top-0 z-40 backdrop-blur-md px-4 py-3">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Volver al menú principal"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <div className="flex items-center gap-2">
                <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-pulse" />
                <h1 className="text-lg md:text-xl font-black uppercase tracking-wide text-white">
                  Estación de Pista • Monitor
                </h1>
              </div>
              <p className="text-xs text-slate-400">
                Ingreso oficial de telemetría y cronometraje en vivo
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {/* Monitor Name Input */}
            <div className="hidden sm:flex items-center gap-2 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
              <span className="text-xs text-slate-400 font-mono">Juez:</span>
              <input
                type="text"
                value={monitorName}
                onChange={(e) => handleMonitorNameChange(e.target.value)}
                placeholder="Nombre del Monitor"
                className="bg-transparent text-xs text-cyan-300 font-semibold focus:outline-none w-32"
              />
            </div>

            {/* Enlace rápido a pantalla gigante */}
            <Link
              href="/leaderboard"
              target="_blank"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono font-semibold transition-colors"
            >
              <Tv className="w-4 h-4" />
              <span>Ver Pantalla Gigante</span>
            </Link>

            {/* Badge de conexión */}
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700 text-[11px] font-mono">
              <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400' : 'bg-rose-500'}`} />
              <span className="text-slate-300">{isConnected ? 'Sincronizado' : 'Conectando'}</span>
            </div>
          </div>
        </div>
      </header>

      {/* Contenido principal */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col gap-6">
        {/* Selector de Pista */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl">
          <label className="text-xs font-mono uppercase tracking-wider text-slate-400 mb-2.5 block">
            1. Selecciona la Pista que estás monitoreando:
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {tracks.map(t => {
              const isSelected = t.id === selectedTrackId;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => handleTrackChange(t.id)}
                  style={{
                    borderColor: isSelected ? t.color || '#00e5ff' : undefined,
                    boxShadow: isSelected ? `0 0 15px -3px ${(t.color || '#00e5ff')}40` : undefined
                  }}
                  className={`text-left p-4 rounded-xl border transition-all duration-200 flex flex-col justify-between ${
                    isSelected
                      ? 'bg-slate-800/90 text-white font-bold ring-1 ring-cyan-400'
                      : 'bg-slate-950/60 border-slate-800 hover:border-slate-700 text-slate-300'
                  }`}
                >
                  <div className="flex items-center justify-between mb-1">
                    <span
                      className="text-xs font-mono px-2 py-0.5 rounded font-black uppercase"
                      style={{
                        backgroundColor: `${t.color || '#00e5ff'}25`,
                        color: t.color || '#00e5ff'
                      }}
                    >
                      {t.code || 'PISTA'}
                    </span>
                    {isSelected && (
                      <span className="w-2.5 h-2.5 rounded-full bg-cyan-400 animate-ping" />
                    )}
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">{t.name}</h3>
                  <p className="text-xs text-slate-400 mt-1 line-clamp-1">{t.description || 'Pista de carrera'}</p>
                </button>
              );
            })}
          </div>
        </section>

        {/* Mensajes de notificación */}
        {successMessage && (
          <div className="bg-emerald-950/80 border border-emerald-500/50 p-4 rounded-xl flex items-start gap-3 text-emerald-200 animate-fadeIn">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{successMessage}</div>
            <button
              onClick={() => setSuccessMessage(null)}
              className="text-xs text-emerald-400 hover:text-emerald-200 underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {errorMessage && (
          <div className="bg-rose-950/80 border border-rose-500/50 p-4 rounded-xl flex items-start gap-3 text-rose-200 animate-fadeIn">
            <AlertTriangle className="w-5 h-5 text-rose-400 shrink-0 mt-0.5" />
            <div className="flex-1 text-sm font-medium">{errorMessage}</div>
            <button
              onClick={() => setErrorMessage(null)}
              className="text-xs text-rose-400 hover:text-rose-200 underline"
            >
              Cerrar
            </button>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
          {/* COLUMNA IZQUIERDA: Búsqueda de Piloto y Formulario de Tiempo (7 columnas) */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            {/* 2. Búsqueda y Selección de Piloto */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                  <span>2. Corredor en Pista</span>
                  <span className="text-cyan-400 font-bold">• Requerido</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsNewPilotModalOpen(true)}
                  className="flex items-center gap-1.5 text-xs text-cyan-400 hover:text-cyan-300 font-mono bg-cyan-950/40 hover:bg-cyan-950/80 border border-cyan-800/60 px-2.5 py-1 rounded-lg transition-colors"
                >
                  <UserPlus className="w-3.5 h-3.5" />
                  <span>+ Registrar Nuevo Piloto</span>
                </button>
              </div>

              {/* Selector / Autocomplete */}
              <div className="relative">
                <div className="flex items-center bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2.5 focus-within:border-cyan-400 transition-colors">
                  <Search className="w-4 h-4 text-slate-400 mr-2.5 shrink-0" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => {
                      setSearchQuery(e.target.value);
                      setIsDropdownOpen(true);
                      // Si borra el input, deseleccionar
                      if (!e.target.value) setSelectedPilotId('');
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    placeholder="Escribe el nombre, apodo o dorsal del piloto..."
                    className="bg-transparent w-full text-sm text-white placeholder-slate-500 focus:outline-none font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                    className="text-slate-400 hover:text-white ml-2"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </button>
                </div>

                {/* Dropdown flotante */}
                {isDropdownOpen && (
                  <div className="absolute top-full left-0 right-0 mt-2 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl max-h-64 overflow-y-auto z-30 divide-y divide-slate-800/60">
                    {filteredPilots.length === 0 ? (
                      <div className="p-4 text-center text-xs text-slate-400">
                        No se encontró ningún piloto con ese nombre.{' '}
                        <button
                          type="button"
                          onClick={() => {
                            setNewPilotName(searchQuery);
                            setIsDropdownOpen(false);
                            setIsNewPilotModalOpen(true);
                          }}
                          className="text-cyan-400 underline font-semibold ml-1"
                        >
                          Crear a "{searchQuery}" ahora
                        </button>
                      </div>
                    ) : (
                      filteredPilots.map((p) => {
                        // Revisar si ya corrió en esta pista
                        const pilotRuns = runs.filter(r => r.pilotId === p.id && r.trackId === selectedTrackId);
                        const lastRun = pilotRuns.length > 0 ? pilotRuns[pilotRuns.length - 1] : null;
                        const hasCompleted = lastRun && lastRun.status === 'COMPLETED';
                        const isRetry = lastRun && lastRun.isUnlockedForRetry;

                        return (
                          <button
                            key={p.id}
                            type="button"
                            onClick={() => {
                              setSelectedPilotId(p.id);
                              setSearchQuery(p.name);
                              setIsDropdownOpen(false);
                            }}
                            className={`w-full text-left px-4 py-3 hover:bg-slate-800 transition-colors flex items-center justify-between ${
                              selectedPilotId === p.id ? 'bg-cyan-950/40 text-cyan-200' : 'text-slate-200'
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
                                #{p.dorsal || '00'}
                              </span>
                              <div>
                                <div className="font-semibold text-sm flex items-center gap-2">
                                  <span>{p.name}</span>
                                  {p.callsign && (
                                    <span className="text-[11px] font-mono text-slate-400 italic">
                                      "{p.callsign}"
                                    </span>
                                  )}
                                </div>
                                <div className="text-xs text-slate-400">
                                  {p.team || 'Independiente'}
                                </div>
                              </div>
                            </div>

                            {/* Badge de estado en esta pista */}
                            <div>
                              {isRetry ? (
                                <span className="text-[11px] font-mono font-bold text-amber-400 bg-amber-950/60 border border-amber-600/60 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Unlock className="w-3 h-3" /> Reintento
                                </span>
                              ) : hasCompleted ? (
                                <span className="text-[11px] font-mono font-bold text-slate-300 bg-slate-800 px-2 py-0.5 rounded-full flex items-center gap-1">
                                  <Lock className="w-3 h-3 text-slate-400" /> {lastRun.timeSeconds}s
                                </span>
                              ) : (
                                <span className="text-[11px] font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                  Pendiente
                                </span>
                              )}
                            </div>
                          </button>
                        );
                      })
                    )}
                  </div>
                )}
              </div>

              {/* Ficha del piloto seleccionado con regla de 1 intento */}
              {selectedPilot && (
                <div className="mt-4 p-4 rounded-xl bg-slate-950/80 border border-slate-800">
                  <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-800/80 pb-3 mb-3">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center font-mono font-black text-cyan-400 text-sm">
                        #{selectedPilot.dorsal || '00'}
                      </div>
                      <div>
                        <h4 className="text-base font-bold text-white leading-tight">
                          {selectedPilot.name}
                        </h4>
                        <p className="text-xs text-slate-400 font-mono">
                          Escudería: {selectedPilot.team || 'Independiente'} • Callsign: {selectedPilot.callsign || 'N/A'}
                        </p>
                      </div>
                    </div>

                    {/* Estado del intento */}
                    <div>
                      {isRetryUnlocked ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-950/80 border border-amber-500/60 text-amber-300 text-xs font-mono font-bold">
                          <Unlock className="w-3.5 h-3.5 text-amber-400" />
                          <span>REINTENTO HABILITADO</span>
                        </div>
                      ) : isBlockedBySingleAttempt ? (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-950/80 border border-rose-500/60 text-rose-300 text-xs font-mono font-bold">
                          <Lock className="w-3.5 h-3.5 text-rose-400" />
                          <span>INTENTO COMPLETADO ({lastRunOnTrack.timeSeconds}s)</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/60 text-emerald-300 text-xs font-mono font-bold">
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                          <span>LISTO PARA CORRER (INTENTO 1)</span>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Advertencia y botón de desbloqueo si ya corrió */}
                  {isBlockedBySingleAttempt && (
                    <div className="bg-rose-950/30 border border-rose-900/60 rounded-xl p-3 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                      <div className="text-xs text-rose-300/90 leading-relaxed">
                        <strong className="text-rose-200">Regla Oficial:</strong> Solo 1 intento por pista por defecto.
                        Si el corredor tuvo un accidente, fallo técnico de radio/batería o reinicio justificado, puedes desbloquear un segundo intento.
                      </div>
                      <button
                        type="button"
                        onClick={() => setIsUnlockModalOpen(true)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-300 border border-amber-500/40 text-xs font-mono font-bold transition-colors"
                      >
                        <Unlock className="w-4 h-4" />
                        <span>Desbloquear Reintento</span>
                      </button>
                    </div>
                  )}

                  {isRetryUnlocked && (
                    <div className="text-xs text-amber-300 bg-amber-950/30 border border-amber-900/50 p-2.5 rounded-lg flex items-center gap-2">
                      <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" />
                      <span>
                        Reintento autorizado: {lastRunOnTrack.unlockReason || 'Falla técnica'}. El nuevo tiempo quedará registrado como el intento #{lastRunOnTrack.attemptNumber + 1}.
                      </span>
                    </div>
                  )}
                </div>
              )}
            </section>

            {/* 3. Formulario de Tiempo Manual & Notas */}
            <form onSubmit={handleSubmitTime} className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
              <label className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-2">
                <span>3. Ingreso del Tiempo Oficial</span>
                <span className="text-cyan-400 font-bold">• Segundos & Milésimas</span>
              </label>

              <div className="flex flex-col sm:flex-row items-center gap-3">
                <div className="relative w-full">
                  <input
                    type="number"
                    step="0.01"
                    min="1"
                    max="999"
                    value={timeInput}
                    onChange={(e) => setTimeInput(e.target.value)}
                    placeholder="Ej: 83.45"
                    disabled={isBlockedBySingleAttempt}
                    className={`w-full bg-slate-950 border text-2xl font-mono font-bold px-4 py-3 rounded-xl focus:outline-none transition-colors ${
                      isBlockedBySingleAttempt
                        ? 'border-slate-800 text-slate-600 cursor-not-allowed'
                        : 'border-slate-700 text-cyan-300 focus:border-cyan-400'
                    }`}
                  />
                  <span className="absolute right-4 top-1/2 -translate-y-1/2 font-mono text-sm text-slate-500 font-bold">
                    SEGUNDOS
                  </span>
                </div>

                {/* Previsualización en formato Minutos:Segundos */}
                {timeInput && !isNaN(parseFloat(timeInput)) && parseFloat(timeInput) > 0 && (
                  <div className="shrink-0 bg-slate-950 px-3.5 py-3 rounded-xl border border-slate-800 text-xs font-mono text-slate-400">
                    Formato:{' '}
                    <span className="text-white font-bold">
                      {Math.floor(parseFloat(timeInput) / 60)}m {(parseFloat(timeInput) % 60).toFixed(2)}s
                    </span>
                  </div>
                )}
              </div>

              {/* Notas u observaciones */}
              <div>
                <input
                  type="text"
                  value={notesInput}
                  onChange={(e) => setNotesInput(e.target.value)}
                  placeholder="Observaciones opcionales (ej: Vuelo limpio, penalización +2s, corte de puerta)"
                  disabled={isBlockedBySingleAttempt}
                  className="w-full bg-slate-950 border border-slate-800 text-xs text-slate-300 placeholder-slate-600 px-3.5 py-2 rounded-xl focus:outline-none focus:border-slate-700"
                />
              </div>

              {/* Botón de Enviar Tiempo */}
              <button
                type="submit"
                disabled={isSubmitting || isBlockedBySingleAttempt || !selectedPilotId || !timeInput}
                className={`w-full py-4 px-6 rounded-xl font-mono font-bold text-sm uppercase tracking-wider flex items-center justify-center gap-2 transition-all duration-200 shadow-lg ${
                  isBlockedBySingleAttempt
                    ? 'bg-slate-800 text-slate-500 cursor-not-allowed border border-slate-700'
                    : !selectedPilotId || !timeInput
                    ? 'bg-slate-800 text-slate-400 cursor-not-allowed border border-slate-700'
                    : 'bg-cyan-500 hover:bg-cyan-400 text-slate-950 shadow-cyan-500/25 hover:shadow-cyan-400/40 active:scale-[0.99]'
                }`}
              >
                <Send className="w-5 h-5" />
                <span>
                  {isSubmitting
                    ? 'Subiendo a Pantalla Gigante...'
                    : 'Registrar y Subir a Pantalla Gigante'}
                </span>
              </button>
            </form>
          </div>

          {/* COLUMNA DERECHA: Cronómetro Digital Integrado & Historial Reciente (5 columnas) */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            {/* Cronómetro Digital */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col items-center">
              <div className="w-full flex items-center justify-between mb-3 text-xs font-mono uppercase tracking-wider text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Timer className="w-4 h-4 text-cyan-400" />
                  Cronómetro Digital
                </span>
                <span className="text-[11px] text-slate-500">Milisegundos</span>
              </div>

              {/* Pantalla grande del cronómetro */}
              <div className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl py-6 px-4 text-center my-2 shadow-inner">
                <span className="text-4xl md:text-5xl font-mono font-black text-cyan-400 tracking-wider">
                  {formatStopwatch(stopwatchTimeMs)}
                </span>
                <div className="text-[11px] font-mono text-slate-500 mt-1">
                  {(stopwatchTimeMs / 1000).toFixed(2)} segundos netos
                </div>
              </div>

              {/* Controles del Cronómetro */}
              <div className="w-full grid grid-cols-3 gap-2 mt-2">
                {!isStopwatchRunning ? (
                  <button
                    type="button"
                    onClick={handleStartStopwatch}
                    className="col-span-2 py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-emerald-900/30 transition-colors"
                  >
                    <Play className="w-4 h-4 fill-white" />
                    <span>Iniciar</span>
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={handleStopStopwatch}
                    className="col-span-2 py-3 px-4 rounded-xl bg-rose-600 hover:bg-rose-500 text-white font-mono font-bold text-sm flex items-center justify-center gap-1.5 shadow-md shadow-rose-900/30 animate-pulse transition-colors"
                  >
                    <Square className="w-4 h-4 fill-white" />
                    <span>Parar y Fijar</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleResetStopwatch}
                  className="py-3 px-4 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 font-mono text-xs flex items-center justify-center gap-1 transition-colors"
                >
                  <RotateCcw className="w-4 h-4" />
                  <span>Reiniciar</span>
                </button>
              </div>

              {/* Botón para volcar tiempo al input si fue pausado */}
              {stopwatchTimeMs > 0 && !isStopwatchRunning && (
                <button
                  type="button"
                  onClick={handleUseStopwatchTime}
                  className="w-full mt-2.5 py-2 px-3 rounded-lg bg-cyan-950/80 hover:bg-cyan-900 text-cyan-300 border border-cyan-700/60 text-xs font-mono font-semibold transition-colors flex items-center justify-center gap-1.5"
                >
                  <span>Copiar {(stopwatchTimeMs / 1000).toFixed(2)}s al campo de tiempo</span>
                </button>
              )}
            </section>

            {/* Historial en Vivo de esta Estación */}
            <section className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex-1 flex flex-col">
              <div className="flex items-center justify-between mb-3">
                <h3 className="text-xs font-mono uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
                  <Clock className="w-4 h-4 text-cyan-400" />
                  Últimos Tiempos en {currentTrack?.code || 'esta Pista'}
                </h3>
                <span className="text-[11px] font-mono text-slate-500">
                  {recentRunsInThisTrack.length} registros
                </span>
              </div>

              {recentRunsInThisTrack.length === 0 ? (
                <div className="flex-1 flex flex-col items-center justify-center text-center p-6 text-slate-500 border border-dashed border-slate-800 rounded-xl">
                  <Radio className="w-8 h-8 mb-2 opacity-40 text-cyan-400" />
                  <p className="text-xs">Aún no se han registrado tiempos en esta pista.</p>
                </div>
              ) : (
                <div className="space-y-2 flex-1 overflow-y-auto max-h-72 pr-1">
                  {recentRunsInThisTrack.map((run) => (
                    <div
                      key={run.id}
                      className="p-2.5 rounded-xl bg-slate-950 border border-slate-800/80 flex items-center justify-between hover:border-slate-700 transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-cyan-400">
                          #{run.pilotDorsal || '00'}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white leading-tight">
                            {run.pilotName}
                          </div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            Intento #{run.attemptNumber} • {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className="text-sm font-mono font-black text-cyan-300">
                          {run.timeSeconds}s
                        </span>
                        <button
                          type="button"
                          onClick={() => {
                            if (confirm(`¿Eliminar el tiempo de ${run.timeSeconds}s para ${run.pilotName}?`)) {
                              deleteRun(run.id);
                            }
                          }}
                          className="text-slate-600 hover:text-rose-400 p-1 transition-colors"
                          title="Eliminar por error de tipeo"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        </div>
      </main>

      {/* MODAL: Registrar Nuevo Piloto al Vuelo */}
      {isNewPilotModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-bold text-white mb-1 flex items-center gap-2">
              <UserPlus className="w-5 h-5 text-cyan-400" />
              Registrar Piloto en Pista
            </h3>
            <p className="text-xs text-slate-400 mb-4">
              Ingresa los datos para agregarlo de inmediato al campeonato.
            </p>

            <form onSubmit={handleCreateNewPilot} className="space-y-3">
              <div>
                <label className="text-xs font-mono text-slate-300 mb-1 block">Nombre y Apellido *</label>
                <input
                  type="text"
                  required
                  value={newPilotName}
                  onChange={(e) => setNewPilotName(e.target.value)}
                  placeholder="Ej: Marcelo Ríos"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 mb-1 block">Apodo / Callsign</label>
                  <input
                    type="text"
                    value={newPilotCallsign}
                    onChange={(e) => setNewPilotCallsign(e.target.value)}
                    placeholder="Ej: STORM"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white uppercase focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="text-xs font-mono text-slate-300 mb-1 block">Número / Dorsal</label>
                  <input
                    type="text"
                    value={newPilotDorsal}
                    onChange={(e) => setNewPilotDorsal(e.target.value)}
                    placeholder="Ej: 09"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-mono text-slate-300 mb-1 block">Escudería / Club</label>
                <input
                  type="text"
                  value={newPilotTeam}
                  onChange={(e) => setNewPilotTeam(e.target.value)}
                  placeholder="Ej: Drone Squad Chile"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsNewPilotModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isCreatingPilot || !newPilotName.trim()}
                  className="px-5 py-2 rounded-lg bg-cyan-500 hover:bg-cyan-400 text-slate-950 text-xs font-mono font-bold transition-colors"
                >
                  {isCreatingPilot ? 'Guardando...' : 'Guardar y Seleccionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: Desbloquear Reintento */}
      {isUnlockModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-600/50 rounded-2xl max-w-md w-full p-6 shadow-2xl animate-scaleUp">
            <h3 className="text-lg font-bold text-amber-300 mb-1 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-400" />
              Desbloquear Reintento en Pista
            </h3>
            <p className="text-xs text-slate-300 mb-4 leading-relaxed">
              ¿Deseas autorizar un nuevo intento para <strong className="text-white">{selectedPilot?.name}</strong> en <strong className="text-cyan-400">{currentTrack?.name}</strong>?
            </p>

            <div className="space-y-3 mb-5">
              <label className="text-xs font-mono text-slate-400 block">Motivo del reintento:</label>
              <select
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              >
                <option value="Falla técnica o corte de video">Falla técnica o corte de señal FPV</option>
                <option value="Colisión externa o descalificación técnica">Colisión externa / Obstrucción</option>
                <option value="Interferencia de radiofrecuencia">Interferencia de radiofrecuencia</option>
                <option value="Falla de dron / Batería defectuosa">Falla de dron / Batería defectuosa</option>
                <option value="Reinicio oficial autorizado por dirección de carrera">Reinicio autorizado por Dirección</option>
              </select>
            </div>

            <div className="flex items-center justify-end gap-2 border-t border-slate-800 pt-4">
              <button
                type="button"
                onClick={() => setIsUnlockModalOpen(false)}
                className="px-4 py-2 rounded-lg bg-slate-800 hover:bg-slate-700 text-xs font-mono text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleUnlockRetry}
                disabled={isUnlocking}
                className="px-5 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold transition-colors"
              >
                {isUnlocking ? 'Desbloqueando...' : 'Confirmar y Desbloquear'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
