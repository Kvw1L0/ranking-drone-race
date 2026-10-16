'use client';

import React, { useState, useEffect, useMemo, useRef } from 'react';
import Link from 'next/link';
import { useDrone } from '../../context/DroneContext';
import {
  Trophy,
  Flag,
  Clock,
  Radio,
  Maximize2,
  Minimize2,
  RefreshCw,
  Zap,
  ArrowLeft,
  AlertCircle,
  CheckCircle,
  Play,
  Pause,
  Award,
  ChevronRight
} from 'lucide-react';

export default function LeaderboardPage() {
  const { droneState, isConnected, newTimeAlert, clearAlert } = useDrone();
  const { rankings, tracks, pilots, runs } = droneState;
  const { global: globalRankings = [], byTrack = {}, activeTracks = [] } = rankings || {};

  // Pestaña activa: 'global' o trackId
  const [activeTab, setActiveTab] = useState('global');

  // Modo auto-rotación para pantalla gigante
  const [autoRotate, setAutoRotate] = useState(true);
  const [rotateProgress, setRotateProgress] = useState(0);
  const ROTATE_INTERVAL_SEC = 15;

  // Pantalla completa
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Reloj en vivo
  const [currentTime, setCurrentTime] = useState('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
    };
    updateTime();
    const interval = setInterval(updateTime, 1000);
    return () => clearInterval(interval);
  }, []);

  // Lista de todas las pestañas para el carrusel
  const allTabs = useMemo(() => {
    return ['global', ...activeTracks.map(t => t.id)];
  }, [activeTracks]);

  // Manejo de Auto-Rotación
  useEffect(() => {
    if (!autoRotate || allTabs.length <= 1) return;

    setRotateProgress(0);
    const tickIntervalMs = 100;
    const totalTicks = (ROTATE_INTERVAL_SEC * 1000) / tickIntervalMs;
    let currentTick = 0;

    const interval = setInterval(() => {
      currentTick += 1;
      setRotateProgress((currentTick / totalTicks) * 100);

      if (currentTick >= totalTicks) {
        currentTick = 0;
        setActiveTab(current => {
          const currentIndex = allTabs.indexOf(current);
          const nextIndex = (currentIndex + 1) % allTabs.length;
          return allTabs[nextIndex];
        });
      }
    }, tickIntervalMs);

    return () => clearInterval(interval);
  }, [autoRotate, allTabs]);

  // Toggle Pantalla Completa
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(err => console.log(err));
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  // Top 3 del ranking global para el podio
  const top3Global = useMemo(() => {
    return globalRankings.slice(0, 3);
  }, [globalRankings]);

  // Datos de la pista seleccionada (si la pestaña es una pista)
  const currentTrackData = useMemo(() => {
    if (activeTab === 'global') return null;
    return byTrack[activeTab] || null;
  }, [activeTab, byTrack]);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans select-none overflow-x-hidden">
      {/* Banner / Alerta Emergente de Nuevo Tiempo en Vivo */}
      {newTimeAlert && (
        <div className="fixed top-5 left-1/2 -translate-x-1/2 z-50 max-w-xl w-[90%] bg-gradient-to-r from-cyan-900/95 via-slate-900/95 to-cyan-900/95 border-2 border-cyan-400 rounded-2xl p-4 shadow-[0_0_40px_rgba(0,229,255,0.4)] backdrop-blur-md animate-bounce flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-cyan-400/20 border border-cyan-400 flex items-center justify-center text-cyan-300">
              <Zap className="w-6 h-6 animate-pulse" />
            </div>
            <div>
              <span className="text-[11px] font-mono font-bold uppercase tracking-wider text-cyan-400 flex items-center gap-1">
                <span>⚡ TELEMETRÍA EN VIVO</span>
                <span>•</span>
                <span>{newTimeAlert.trackName}</span>
              </span>
              <h4 className="text-base font-black text-white">
                {newTimeAlert.pilotName}{' '}
                {newTimeAlert.pilotDorsal && <span className="text-cyan-400">#{newTimeAlert.pilotDorsal}</span>}
              </h4>
              <p className="text-xs font-mono text-slate-300">
                Nuevo Tiempo Oficial:{' '}
                <strong className="text-cyan-300 text-sm font-black">{newTimeAlert.timeSeconds}s</strong>
              </p>
            </div>
          </div>
          <button
            onClick={clearAlert}
            className="text-xs text-slate-400 hover:text-white px-2 py-1"
          >
            ✕
          </button>
        </div>
      )}

      {/* HEADER DE PANTALLA GIGANTE */}
      <header className="bg-slate-900/90 border-b border-slate-800 px-6 py-4 sticky top-0 z-40 backdrop-blur-md">
        <div className="max-w-[1800px] mx-auto flex flex-wrap items-center justify-between gap-4">
          {/* Logo y Título del Evento */}
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
              title="Volver al menú"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>

            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-cyan-500/10 border-2 border-cyan-400 flex items-center justify-center text-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.25)]">
                <Flag className="w-6 h-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-500/40 text-cyan-400 font-bold tracking-widest">
                    LIVE LEADERBOARD
                  </span>
                  <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400">
                    <span className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-400 animate-ping' : 'bg-rose-500'}`} />
                    <span>{isConnected ? 'SYNC ONLINE' : 'OFFLINE'}</span>
                  </div>
                </div>
                <h1 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white flex items-center gap-2">
                  <span>Carreras de Drones</span>
                  <span className="text-cyan-400 italic">Veltis</span>
                </h1>
              </div>
            </div>
          </div>

          {/* Reloj Grande y Controles de Pantalla */}
          <div className="flex items-center gap-4">
            {/* Reloj del Evento */}
            <div className="bg-slate-950 border border-slate-800 px-4 py-2 rounded-xl flex items-center gap-2">
              <Clock className="w-4 h-4 text-cyan-400" />
              <span className="font-mono text-lg font-bold text-white tracking-widest">
                {currentTime || '--:--:--'}
              </span>
            </div>

            {/* Toggle Auto-Rotación */}
            <button
              type="button"
              onClick={() => setAutoRotate(!autoRotate)}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-xl border text-xs font-mono font-bold transition-all ${
                autoRotate
                  ? 'bg-cyan-500/10 border-cyan-500/50 text-cyan-300'
                  : 'bg-slate-800 border-slate-700 text-slate-400'
              }`}
              title="Alternar rotación automática de rankings para proyector"
            >
              {autoRotate ? <Play className="w-3.5 h-3.5 fill-cyan-400" /> : <Pause className="w-3.5 h-3.5" />}
              <span>Auto-Rotación {autoRotate ? 'ON' : 'OFF'}</span>
            </button>

            {/* Pantalla Completa */}
            <button
              type="button"
              onClick={toggleFullscreen}
              className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-colors"
              title="Pantalla Completa"
            >
              {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Barra de progreso de rotación automática */}
        {autoRotate && (
          <div className="w-full bg-slate-800/40 h-1 mt-3 rounded-full overflow-hidden">
            <div
              className="h-full bg-cyan-400 transition-all duration-100 ease-linear shadow-[0_0_8px_#00e5ff]"
              style={{ width: `${rotateProgress}%` }}
            />
          </div>
        )}

        {/* PESTAÑAS SELECTORAS (GLOBAL + CADA PISTA) */}
        <div className="max-w-[1800px] mx-auto flex items-center gap-2 mt-4 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => { setActiveTab('global'); setRotateProgress(0); }}
            className={`px-5 py-2.5 rounded-xl font-mono text-xs md:text-sm font-black uppercase tracking-wider flex items-center gap-2 border transition-all ${
              activeTab === 'global'
                ? 'bg-cyan-500 text-slate-950 border-cyan-400 shadow-[0_0_20px_rgba(0,229,255,0.4)]'
                : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
            }`}
          >
            <Trophy className="w-4 h-4" />
            <span>Clasificación General (Puntos)</span>
          </button>

          {activeTracks.map((track) => {
            const isTabActive = activeTab === track.id;
            return (
              <button
                key={track.id}
                type="button"
                onClick={() => { setActiveTab(track.id); setRotateProgress(0); }}
                style={{
                  borderColor: isTabActive ? track.color || '#00e5ff' : undefined,
                  boxShadow: isTabActive ? `0 0 15px -2px ${(track.color || '#00e5ff')}50` : undefined
                }}
                className={`px-4 py-2.5 rounded-xl font-mono text-xs md:text-sm font-bold uppercase tracking-wider flex items-center gap-2 border transition-all ${
                  isTabActive
                    ? 'bg-slate-800 text-white'
                    : 'bg-slate-900 border-slate-800 text-slate-400 hover:text-white hover:border-slate-700'
                }`}
              >
                <span
                  className="w-2 h-2 rounded-full"
                  style={{ backgroundColor: track.color || '#00e5ff' }}
                />
                <span>{track.name}</span>
              </button>
            );
          })}
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="max-w-[1800px] mx-auto w-full p-4 md:p-8 flex-1 flex flex-col gap-8">
        {/* ========================================================================= */}
        {/* VISTA 1: CLASIFICACIÓN GENERAL (GLOBAL) */}
        {/* ========================================================================= */}
        {activeTab === 'global' && (
          <div className="flex flex-col gap-8">
            {/* Tarjetas del Podio (Top 3) */}
            {top3Global.length > 0 && (
              <section className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* 2do Lugar (Izquierda en podio deportivo) */}
                {top3Global[1] && (
                  <div className="order-2 md:order-1 bg-slate-900/70 border border-slate-700/60 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-slate-400/5 rounded-bl-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-black uppercase text-slate-400 bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                        2° PUESTO • PLATA
                      </span>
                      <span className="font-mono text-sm font-bold text-slate-300">
                        #{top3Global[1].pilotDorsal || '00'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{top3Global[1].pilotName}</h3>
                      <p className="text-xs text-slate-400 font-mono">{top3Global[1].pilotTeam || 'Independiente'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">Puntaje Total:</span>
                      <span className="text-2xl font-mono font-black text-slate-200">
                        {top3Global[1].totalPoints} <span className="text-xs text-slate-500 font-normal">pts</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 1er Lugar (Centro, más destacado) */}
                {top3Global[0] && (
                  <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-slate-900 to-slate-900 border-2 border-amber-400/60 rounded-2xl p-6 flex flex-col justify-between shadow-[0_0_30px_rgba(251,191,36,0.15)] relative overflow-hidden -translate-y-1">
                    <div className="absolute top-0 right-0 w-28 h-28 bg-amber-400/10 rounded-bl-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-black uppercase text-amber-300 bg-amber-950/80 px-3 py-1 rounded-full border border-amber-500/50 flex items-center gap-1.5 shadow-sm">
                        <Trophy className="w-3.5 h-3.5 text-amber-400" />
                        1° LÍDER DEL CAMPEONATO • ORO
                      </span>
                      <span className="font-mono text-base font-black text-amber-400">
                        #{top3Global[0].pilotDorsal || '00'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-2xl font-black text-white">{top3Global[0].pilotName}</h3>
                      <p className="text-xs text-amber-300/80 font-mono">{top3Global[0].pilotTeam || 'Independiente'}</p>
                    </div>
                    <div className="mt-5 pt-3 border-t border-amber-500/20 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-300">Puntos Totales:</span>
                      <span className="text-3xl font-mono font-black text-amber-400">
                        {top3Global[0].totalPoints} <span className="text-sm text-slate-400 font-normal">pts</span>
                      </span>
                    </div>
                  </div>
                )}

                {/* 3er Lugar (Derecha) */}
                {top3Global[2] && (
                  <div className="order-3 bg-slate-900/70 border border-amber-800/40 rounded-2xl p-5 flex flex-col justify-between relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-amber-700/5 rounded-bl-full pointer-events-none" />
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-mono text-xs font-black uppercase text-amber-600 bg-amber-950/40 px-3 py-1 rounded-full border border-amber-700/40">
                        3° PUESTO • BRONCE
                      </span>
                      <span className="font-mono text-sm font-bold text-amber-500">
                        #{top3Global[2].pilotDorsal || '00'}
                      </span>
                    </div>
                    <div>
                      <h3 className="text-xl font-black text-white">{top3Global[2].pilotName}</h3>
                      <p className="text-xs text-slate-400 font-mono">{top3Global[2].pilotTeam || 'Independiente'}</p>
                    </div>
                    <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between">
                      <span className="text-xs font-mono text-slate-400">Puntaje Total:</span>
                      <span className="text-2xl font-mono font-black text-amber-500">
                        {top3Global[2].totalPoints} <span className="text-xs text-slate-500 font-normal">pts</span>
                      </span>
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* Tabla General Completa */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-5 border-b border-slate-800 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h2 className="text-lg md:text-xl font-black uppercase tracking-wide text-white flex items-center gap-2">
                    <Award className="w-5 h-5 text-cyan-400" />
                    <span>Tabla General Oficial • Opción B (Puntos Acumulados)</span>
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">
                    1°: 25 pts • 2°: 18 pts • 3°: 15 pts • 4°: 12 pts • 5°: 10 pts • 6°: 8 pts • 7°: 6 pts • 8°: 4 pts • 9°: 2 pts • 10°: 1 pt
                  </p>
                </div>

                <div className="text-xs font-mono text-slate-400 bg-slate-950 px-3 py-1.5 rounded-xl border border-slate-800">
                  Total Pilotos: <span className="text-white font-bold">{globalRankings.length}</span> • Pistas Activas: <span className="text-cyan-400 font-bold">{activeTracks.length}</span>
                </div>
              </div>

              {globalRankings.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-mono text-sm">
                  No hay pilotos registrados aún en el torneo.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                        <th className="py-4 px-4 text-center w-16">POS</th>
                        <th className="py-4 px-4 w-20">DORSAL</th>
                        <th className="py-4 px-6 min-w-[220px]">PILOTO & ESCUDERÍA</th>
                        {activeTracks.map(t => (
                          <th key={t.id} className="py-4 px-4 text-center min-w-[140px]">
                            <div className="flex items-center justify-center gap-1.5">
                              <span className="w-2 h-2 rounded-full" style={{ backgroundColor: t.color || '#00e5ff' }} />
                              <span>{t.code || t.name}</span>
                            </div>
                          </th>
                        ))}
                        <th className="py-4 px-4 text-center min-w-[120px]">T. TOTAL</th>
                        <th className="py-4 px-6 text-center min-w-[130px]">PUNTOS</th>
                        <th className="py-4 px-6 min-w-[200px]">ESTADO GENERAL</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {globalRankings.map((pilot) => {
                        const isFirst = pilot.position === 1 && pilot.totalPoints > 0;
                        const isSecond = pilot.position === 2 && pilot.totalPoints > 0;
                        const isThird = pilot.position === 3 && pilot.totalPoints > 0;

                        return (
                          <tr
                            key={pilot.pilotId}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isFirst
                                ? 'bg-amber-500/5 font-semibold'
                                : ''
                            }`}
                          >
                            {/* Posición */}
                            <td className="py-4 px-4 text-center">
                              <div className="flex items-center justify-center">
                                {isFirst ? (
                                  <span className="w-8 h-8 rounded-full bg-amber-400 text-slate-950 font-black font-mono flex items-center justify-center shadow-lg shadow-amber-400/30 text-sm">
                                    1°
                                  </span>
                                ) : isSecond ? (
                                  <span className="w-8 h-8 rounded-full bg-slate-300 text-slate-950 font-black font-mono flex items-center justify-center text-sm">
                                    2°
                                  </span>
                                ) : isThird ? (
                                  <span className="w-8 h-8 rounded-full bg-amber-700 text-amber-100 font-black font-mono flex items-center justify-center text-sm">
                                    3°
                                  </span>
                                ) : (
                                  <span className="font-mono text-sm text-slate-400 font-bold">
                                    {pilot.position}°
                                  </span>
                                )}
                              </div>
                            </td>

                            {/* Dorsal */}
                            <td className="py-4 px-4 font-mono">
                              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-400">
                                #{pilot.pilotDorsal || '00'}
                              </span>
                            </td>

                            {/* Piloto */}
                            <td className="py-4 px-6">
                              <div className="font-bold text-base text-white flex items-center gap-2">
                                <span>{pilot.pilotName}</span>
                                {pilot.pilotCallsign && (
                                  <span className="text-[11px] font-mono text-slate-400 font-normal italic">
                                    "{pilot.pilotCallsign}"
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                {pilot.pilotTeam || 'Independiente'}
                              </div>
                            </td>

                            {/* Columnas de cada pista */}
                            {activeTracks.map(t => {
                              const trackInfo = pilot.trackBreakdown[t.id];
                              const isCompleted = trackInfo && trackInfo.status === 'COMPLETED';

                              return (
                                <td key={t.id} className="py-4 px-4 text-center">
                                  {isCompleted ? (
                                    <div className="flex flex-col items-center justify-center gap-0.5">
                                      <span className="font-mono text-sm font-bold text-white">
                                        {trackInfo.timeSeconds}s
                                      </span>
                                      <span
                                        className="text-[10px] font-mono px-2 py-0.5 rounded-full font-black uppercase"
                                        style={{
                                          backgroundColor: `${t.color || '#00e5ff'}20`,
                                          color: t.color || '#00e5ff',
                                          border: `1px solid ${t.color || '#00e5ff'}40`
                                        }}
                                      >
                                        +{trackInfo.points} pts ({trackInfo.position}°)
                                      </span>
                                    </div>
                                  ) : (
                                    <div className="flex items-center justify-center">
                                      <span className="text-[11px] font-mono text-amber-400/90 bg-amber-950/40 border border-amber-800/40 px-2 py-0.5 rounded-full flex items-center gap-1">
                                        <Clock className="w-3 h-3 text-amber-400" />
                                        <span>Pendiente</span>
                                      </span>
                                    </div>
                                  )}
                                </td>
                              );
                            })}

                            {/* Tiempo Total */}
                            <td className="py-4 px-4 text-center font-mono text-sm text-slate-300 font-medium">
                              {pilot.totalTime > 0 ? `${pilot.totalTime}s` : '--'}
                            </td>

                            {/* Puntos Totales (Destacado) */}
                            <td className="py-4 px-6 text-center">
                              <span className="font-mono text-xl md:text-2xl font-black text-cyan-300">
                                {pilot.totalPoints}
                              </span>
                              <span className="text-[10px] text-slate-500 font-mono ml-1">pts</span>
                            </td>

                            {/* Estado General (Completado / Pendiente con detalle) */}
                            <td className="py-4 px-6">
                              {pilot.globalStatus === 'COMPLETED' ? (
                                <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-mono font-bold">
                                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                                  <span>COMPLETADO ({pilot.completedTracksCount}/{pilot.totalTracksCount})</span>
                                </div>
                              ) : (
                                <div className="flex flex-col gap-1">
                                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-amber-950/60 border border-amber-600/50 text-amber-300 text-xs font-mono font-semibold w-max">
                                    <Clock className="w-3 h-3 text-amber-400" />
                                    <span>EN CURSO ({pilot.completedTracksCount}/{pilot.totalTracksCount})</span>
                                  </div>
                                  {pilot.pendingTracksList.length > 0 && (
                                    <span className="text-[11px] font-mono text-slate-400">
                                      Falta:{' '}
                                      <span className="text-amber-300/90 font-medium">
                                        {pilot.pendingTracksList.map(p => p.trackCode || p.trackName).join(', ')}
                                      </span>
                                    </span>
                                  )}
                                </div>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>
          </div>
        )}

        {/* ========================================================================= */}
        {/* VISTA 2: RANKING ESPECÍFICO POR PISTA */}
        {/* ========================================================================= */}
        {activeTab !== 'global' && currentTrackData && (
          <div className="flex flex-col gap-6">
            {/* Cabecera de la Pista */}
            <div
              className="rounded-3xl p-6 border shadow-2xl flex flex-wrap items-center justify-between gap-4"
              style={{
                backgroundColor: '#0f172a',
                borderColor: currentTrackData.trackColor || '#00e5ff',
                boxShadow: `0 0 30px -5px ${(currentTrackData.trackColor || '#00e5ff')}25`
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center font-mono font-black text-xl"
                  style={{
                    backgroundColor: `${currentTrackData.trackColor || '#00e5ff'}25`,
                    color: currentTrackData.trackColor || '#00e5ff',
                    border: `2px solid ${currentTrackData.trackColor || '#00e5ff'}`
                  }}
                >
                  {currentTrackData.trackCode || 'P'}
                </div>
                <div>
                  <span className="text-xs font-mono uppercase tracking-widest text-slate-400">
                    Clasificación de Pista
                  </span>
                  <h2 className="text-2xl md:text-3xl font-black text-white">
                    {currentTrackData.trackName}
                  </h2>
                </div>
              </div>

              {/* Récord / Mejor Vuelta de la Pista */}
              <div className="bg-slate-950/80 border border-slate-800 px-5 py-3 rounded-2xl flex items-center gap-4">
                <div>
                  <div className="text-[11px] font-mono uppercase text-slate-400 flex items-center gap-1">
                    <Zap className="w-3.5 h-3.5 text-cyan-400" />
                    <span>RÉCORD DE LA PISTA</span>
                  </div>
                  <div className="text-xl md:text-2xl font-mono font-black text-cyan-300">
                    {currentTrackData.bestTime ? `${currentTrackData.bestTime}s` : 'Sin registro'}
                  </div>
                </div>
                <div className="h-8 w-px bg-slate-800" />
                <div className="text-xs font-mono text-slate-400">
                  <span>Completados:</span>{' '}
                  <strong className="text-white">{currentTrackData.completedCount}</strong> / {currentTrackData.totalPilotsCount}
                </div>
              </div>
            </div>

            {/* Tabla de Pilotos Clasificados en esta Pista */}
            <section className="bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden">
              <div className="p-4 px-6 border-b border-slate-800 flex items-center justify-between">
                <h3 className="text-sm font-mono uppercase font-bold text-slate-300 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  <span>Tiempos Registrados en {currentTrackData.trackCode || 'esta Pista'}</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">Ordenados por menor tiempo</span>
              </div>

              {currentTrackData.rankings.length === 0 ? (
                <div className="p-12 text-center text-slate-500 font-mono text-sm">
                  Ningún piloto ha completado esta pista todavía.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="bg-slate-950/80 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400 tracking-wider">
                        <th className="py-4 px-4 text-center w-16">POS</th>
                        <th className="py-4 px-4 w-20">DORSAL</th>
                        <th className="py-4 px-6">PILOTO</th>
                        <th className="py-4 px-6 text-center">TIEMPO OFICIAL</th>
                        <th className="py-4 px-6 text-center">DIFERENCIA (GAP)</th>
                        <th className="py-4 px-6 text-center">PUNTOS ASIGNADOS</th>
                        <th className="py-4 px-4 text-center">INTENTO</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {currentTrackData.rankings.map((run) => {
                        const isWinner = run.position === 1;

                        return (
                          <tr
                            key={run.pilotId}
                            className={`hover:bg-slate-800/40 transition-colors ${
                              isWinner ? 'bg-cyan-500/5 font-semibold' : ''
                            }`}
                          >
                            <td className="py-4 px-4 text-center font-mono">
                              {isWinner ? (
                                <span className="w-7 h-7 mx-auto rounded-full bg-cyan-400 text-slate-950 font-black flex items-center justify-center text-xs shadow-md shadow-cyan-400/30">
                                  1°
                                </span>
                              ) : (
                                <span className="text-sm text-slate-400 font-bold">{run.position}°</span>
                              )}
                            </td>

                            <td className="py-4 px-4 font-mono">
                              <span className="px-2 py-1 rounded bg-slate-800 border border-slate-700 text-xs font-bold text-cyan-400">
                                #{run.pilotDorsal || '00'}
                              </span>
                            </td>

                            <td className="py-4 px-6">
                              <div className="font-bold text-base text-white flex items-center gap-2">
                                <span>{run.pilotName}</span>
                                {run.pilotCallsign && (
                                  <span className="text-xs font-mono text-slate-400 font-normal italic">
                                    "{run.pilotCallsign}"
                                  </span>
                                )}
                              </div>
                              <div className="text-xs text-slate-400 font-mono">
                                {run.pilotTeam || 'Independiente'}
                              </div>
                            </td>

                            <td className="py-4 px-6 text-center font-mono text-xl font-black text-cyan-300">
                              {run.timeSeconds}s
                            </td>

                            <td className="py-4 px-6 text-center font-mono text-xs text-slate-400">
                              {isWinner ? (
                                <span className="text-emerald-400 font-bold">LÍDER</span>
                              ) : (
                                <span>+{run.deltaWithLeader}s</span>
                              )}
                            </td>

                            <td className="py-4 px-6 text-center">
                              <span className="font-mono text-base font-bold text-white bg-slate-800 px-3 py-1 rounded-full border border-slate-700">
                                +{run.points} pts
                              </span>
                            </td>

                            <td className="py-4 px-4 text-center font-mono text-xs text-slate-500">
                              #{run.attemptNumber}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </section>

            {/* SECCIÓN DE PILOTOS PENDIENTES EN ESTA PISTA */}
            <section className="bg-slate-900/60 border border-slate-800 rounded-3xl p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-mono uppercase font-bold text-amber-400 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-amber-400" />
                  <span>Pilotos Pendientes en {currentTrackData.trackName}</span>
                </h3>
                <span className="text-xs font-mono text-slate-500">
                  {currentTrackData.pending.length} pilotos por correr
                </span>
              </div>

              {currentTrackData.pending.length === 0 ? (
                <div className="text-xs font-mono text-emerald-400 bg-emerald-950/40 border border-emerald-800/40 p-3 rounded-xl">
                  🎉 ¡Todos los pilotos registrados ya completaron esta pista!
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                  {currentTrackData.pending.map((pilot) => (
                    <div
                      key={pilot.pilotId}
                      className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 flex items-center justify-between"
                    >
                      <div className="flex items-center gap-2.5">
                        <span className="text-xs font-mono font-bold px-1.5 py-0.5 rounded bg-slate-800 text-slate-400">
                          #{pilot.pilotDorsal || '00'}
                        </span>
                        <div>
                          <div className="text-xs font-bold text-white">{pilot.pilotName}</div>
                          <div className="text-[10px] text-slate-500 font-mono">{pilot.pilotTeam || 'Independiente'}</div>
                        </div>
                      </div>

                      {pilot.hasRetryUnlocked ? (
                        <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-600/60 px-2 py-0.5 rounded-full font-bold">
                          Reintento
                        </span>
                      ) : (
                        <span className="text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800 px-2 py-0.5 rounded-full">
                          Pendiente
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </section>
          </div>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-slate-800/80 px-6 py-4 bg-slate-900/60 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs font-mono text-slate-500">
        <div className="flex items-center gap-3">
          <span>SISTEMA DE TELEMETRÍA DRONE RACING LEAGUE</span>
          <span>•</span>
          <span>SINCRONIZACIÓN AUTOMÁTICA EN TIEMPO REAL</span>
        </div>
        <div className="flex items-center gap-4">
          <Link href="/monitor" className="text-cyan-400 hover:underline">
            Ir a Estación del Monitor →
          </Link>
          <Link href="/admin/drones" className="text-slate-400 hover:text-white">
            Panel Admin
          </Link>
        </div>
      </footer>
    </div>
  );
}
