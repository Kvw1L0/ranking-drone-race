'use client';

import React, { useState, useMemo } from 'react';
import Link from 'next/link';
import { useDrone } from '../../../context/DroneContext';
import {
  Users,
  Flag,
  Clock,
  Unlock,
  Trash2,
  Plus,
  RefreshCw,
  Download,
  AlertTriangle,
  CheckCircle2,
  Tv,
  Smartphone,
  ArrowLeft,
  Search,
  Sparkles,
  ShieldAlert
} from 'lucide-react';

export default function AdminDronesPage() {
  const {
    droneState,
    createPilot,
    deletePilot,
    unlockRetry,
    deleteRun,
    resetTournament,
    preloadDemo,
    refreshState
  } = useDrone();

  const { pilots = [], tracks = [], runs = [], rankings } = droneState;

  // Tabs internas del admin
  const [activeTab, setActiveTab] = useState('pilots'); // 'pilots' | 'runs' | 'tracks'

  // Formulario nuevo piloto
  const [name, setName] = useState('');
  const [callsign, setCallsign] = useState('');
  const [dorsal, setDorsal] = useState('');
  const [team, setTeam] = useState('');
  const [isSubmittingPilot, setIsSubmittingPilot] = useState(false);

  // Filtros de búsqueda
  const [pilotFilter, setPilotFilter] = useState('');
  const [runFilterPilot, setRunFilterPilot] = useState('');
  const [runFilterTrack, setRunFilterTrack] = useState('');

  // Modales
  const [unlockTarget, setUnlockTarget] = useState(null); // { pilotId, trackId, pilotName, trackName }
  const [unlockReason, setUnlockReason] = useState('Falla técnica autorizada por Dirección');

  // Notificaciones
  const [feedback, setFeedback] = useState(null);

  // Filtrado de pilotos
  const filteredPilots = useMemo(() => {
    if (!pilotFilter.trim()) return pilots;
    const q = pilotFilter.toLowerCase();
    return pilots.filter(p =>
      p.name.toLowerCase().includes(q) ||
      (p.callsign && p.callsign.toLowerCase().includes(q)) ||
      (p.dorsal && p.dorsal.toLowerCase().includes(q)) ||
      (p.team && p.team.toLowerCase().includes(q))
    );
  }, [pilots, pilotFilter]);

  // Filtrado de runs
  const filteredRuns = useMemo(() => {
    return runs.filter(r => {
      const matchPilot = !runFilterPilot || r.pilotId === runFilterPilot;
      const matchTrack = !runFilterTrack || r.trackId === runFilterTrack;
      return matchPilot && matchTrack;
    }).slice().reverse();
  }, [runs, runFilterPilot, runFilterTrack]);

  // Crear piloto
  const handleAddPilot = async (e) => {
    e.preventDefault();
    if (!name.trim()) return;
    setIsSubmittingPilot(true);
    try {
      const newDorsal = dorsal.trim() || String(pilots.length + 1).padStart(2, '0');
      await createPilot({ name, callsign, dorsal: newDorsal, team });
      setName('');
      setCallsign('');
      setDorsal('');
      setTeam('');
      setFeedback({ type: 'success', text: `Piloto "${name}" registrado exitosamente.` });
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al agregar piloto' });
    } finally {
      setIsSubmittingPilot(false);
    }
  };

  // Desbloquear reintento
  const handleConfirmUnlock = async () => {
    if (!unlockTarget) return;
    try {
      await unlockRetry({
        pilotId: unlockTarget.pilotId,
        trackId: unlockTarget.trackId,
        reason: unlockReason
      });
      setFeedback({
        type: 'success',
        text: `Reintento desbloqueado para ${unlockTarget.pilotName} en ${unlockTarget.trackName}.`
      });
      setUnlockTarget(null);
    } catch (err) {
      setFeedback({ type: 'error', text: err.message || 'Error al desbloquear reintento' });
    }
  };

  // Cargar demo
  const handlePreloadDemo = async () => {
    if (confirm('¿Cargar pilotos y carreras de demostración para probar el sistema?')) {
      try {
        await preloadDemo();
        setFeedback({ type: 'success', text: 'Datos de prueba cargados correctamente.' });
      } catch (err) {
        setFeedback({ type: 'error', text: err.message || 'Error al cargar demo' });
      }
    }
  };

  // Reiniciar torneo
  const handleResetTournament = async (clearPilots = false) => {
    const msg = clearPilots
      ? '¿Estás completamente seguro de BORRAR TODO (todos los pilotos y todos los tiempos)?'
      : '¿Estás seguro de reiniciar los tiempos de carrera (se conservarán los pilotos registrados)?';
    if (confirm(msg)) {
      try {
        await resetTournament(clearPilots);
        setFeedback({ type: 'success', text: 'Torneo reiniciado exitosamente.' });
      } catch (err) {
        setFeedback({ type: 'error', text: err.message || 'Error al reiniciar torneo' });
      }
    }
  };

  // Exportar a CSV
  const handleExportCSV = () => {
    if (!rankings || !rankings.global || rankings.global.length === 0) {
      alert('No hay clasificaciones disponibles para exportar.');
      return;
    }

    let csv = 'Posicion,Dorsal,Piloto,Callsign,Escuderia,Puntos_Totales,Tiempo_Total_Seg,Pistas_Completadas,Estado_General\n';

    rankings.global.forEach(p => {
      csv += `${p.position},"${p.pilotDorsal || ''}","${p.pilotName}","${p.pilotCallsign || ''}","${p.pilotTeam || ''}",${p.totalPoints},${p.totalTime},"${p.completedTracksCount}/${p.totalTracksCount}","${p.globalStatus}"\n`;
    });

    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `ranking_drones_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans">
      {/* Header Admin */}
      <header className="bg-slate-900 border-b border-slate-800 px-6 py-4 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <Link
              href="/"
              className="p-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <div>
              <h1 className="text-xl font-black uppercase text-white flex items-center gap-2">
                <span>Dirección de Carrera • Panel Admin</span>
                <span className="text-xs font-mono px-2 py-0.5 rounded bg-cyan-950 border border-cyan-800 text-cyan-400">
                  DRONES
                </span>
              </h1>
              <p className="text-xs text-slate-400">Gestión de pilotos, pistas, auditoría de tiempos y desbloqueos</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <Link
              href="/monitor"
              className="px-3.5 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Smartphone className="w-4 h-4 text-cyan-400" />
              <span>Estación Monitor</span>
            </Link>
            <Link
              href="/leaderboard"
              target="_blank"
              className="px-3.5 py-1.5 rounded-xl bg-cyan-500/10 hover:bg-cyan-500/20 text-cyan-400 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 transition-colors"
            >
              <Tv className="w-4 h-4" />
              <span>Ver Pantalla Gigante</span>
            </Link>
          </div>
        </div>
      </header>

      {/* Feedback banner */}
      {feedback && (
        <div className="max-w-6xl mx-auto w-full px-4 pt-4">
          <div
            className={`p-3.5 rounded-xl flex items-center justify-between gap-3 text-xs font-medium ${
              feedback.type === 'success'
                ? 'bg-emerald-950/80 border border-emerald-500/40 text-emerald-200'
                : 'bg-rose-950/80 border border-rose-500/40 text-rose-200'
            }`}
          >
            <span>{feedback.text}</span>
            <button onClick={() => setFeedback(null)} className="underline ml-2">Cerrar</button>
          </div>
        </div>
      )}

      {/* Contenido Principal */}
      <main className="max-w-6xl mx-auto w-full p-4 md:p-6 flex-1 flex flex-col gap-6">
        {/* Barra de Acciones Globales */}
        <section className="bg-slate-900 border border-slate-800 rounded-2xl p-4 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setActiveTab('pilots')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'pilots'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Users className="w-4 h-4" />
              <span>Pilotos ({pilots.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('runs')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'runs'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Clock className="w-4 h-4" />
              <span>Tiempos Oficiales ({runs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('tracks')}
              className={`px-4 py-2 rounded-xl text-xs font-mono font-bold uppercase transition-colors flex items-center gap-2 ${
                activeTab === 'tracks'
                  ? 'bg-cyan-500 text-slate-950'
                  : 'bg-slate-800 text-slate-300 hover:text-white'
              }`}
            >
              <Flag className="w-4 h-4" />
              <span>Pistas ({tracks.length})</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleExportCSV}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-mono flex items-center gap-1.5 transition-colors border border-slate-700"
              title="Descargar ranking en Excel/CSV"
            >
              <Download className="w-4 h-4" />
              <span>Exportar CSV</span>
            </button>
            <button
              type="button"
              onClick={handlePreloadDemo}
              className="px-3 py-2 rounded-xl bg-cyan-950/60 hover:bg-cyan-900 border border-cyan-800/60 text-cyan-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Cargar pilotos y carreras de prueba con 1 click"
            >
              <Sparkles className="w-4 h-4 text-cyan-400" />
              <span>Cargar Datos Demo</span>
            </button>
            <button
              type="button"
              onClick={() => handleResetTournament(false)}
              className="px-3 py-2 rounded-xl bg-rose-950/50 hover:bg-rose-900/80 border border-rose-800/60 text-rose-300 text-xs font-mono flex items-center gap-1.5 transition-colors"
              title="Borrar todos los tiempos y empezar de cero"
            >
              <RefreshCw className="w-4 h-4" />
              <span>Reiniciar Tiempos</span>
            </button>
          </div>
        </section>

        {/* ========================================================================= */}
        {/* PESTAÑA 1: GESTIÓN DE PILOTOS */}
        {/* ========================================================================= */}
        {activeTab === 'pilots' && (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
            {/* Formulario de registro (4 columnas) */}
            <div className="lg:col-span-4 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <h2 className="text-base font-bold text-white mb-1 flex items-center gap-2">
                <Plus className="w-5 h-5 text-cyan-400" />
                Registrar Nuevo Piloto
              </h2>
              <p className="text-xs text-slate-400 mb-4">
                El piloto estará disponible inmediatamente en las estaciones de monitores.
              </p>

              <form onSubmit={handleAddPilot} className="space-y-3">
                <div>
                  <label className="text-xs font-mono text-slate-300 mb-1 block">Nombre y Apellido *</label>
                  <input
                    type="text"
                    required
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Ej: Nicolás Massú"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-mono text-slate-300 mb-1 block">Callsign / Apodo</label>
                    <input
                      type="text"
                      value={callsign}
                      onChange={(e) => setCallsign(e.target.value)}
                      placeholder="Ej: GLADIATOR"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white uppercase focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-mono text-slate-300 mb-1 block">Dorsal / N°</label>
                    <input
                      type="text"
                      value={dorsal}
                      onChange={(e) => setDorsal(e.target.value)}
                      placeholder="Ej: 99"
                      className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                    />
                  </div>
                </div>

                <div>
                  <label className="text-xs font-mono text-slate-300 mb-1 block">Escudería / Club</label>
                  <input
                    type="text"
                    value={team}
                    onChange={(e) => setTeam(e.target.value)}
                    placeholder="Ej: Skyline FPV"
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3 py-2.5 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <button
                  type="submit"
                  disabled={isSubmittingPilot || !name.trim()}
                  className="w-full mt-2 py-3 px-4 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-mono font-bold text-xs uppercase tracking-wider transition-colors shadow-lg shadow-cyan-500/20"
                >
                  {isSubmittingPilot ? 'Guardando...' : '+ Registrar Piloto'}
                </button>
              </form>
            </div>

            {/* Lista de pilotos (8 columnas) */}
            <div className="lg:col-span-8 bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-4">
                <div className="relative w-full sm:w-72">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={pilotFilter}
                    onChange={(e) => setPilotFilter(e.target.value)}
                    placeholder="Buscar piloto..."
                    className="w-full bg-slate-950 border border-slate-700 rounded-xl pl-9 pr-3 py-2 text-xs text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <span className="text-xs font-mono text-slate-400">
                  Mostrando {filteredPilots.length} de {pilots.length}
                </span>
              </div>

              {filteredPilots.length === 0 ? (
                <div className="flex-1 flex items-center justify-center p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                  No se encontraron pilotos con ese filtro.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                        <th className="p-3 w-16">DORSAL</th>
                        <th className="p-3">NOMBRE</th>
                        <th className="p-3">CALLSIGN</th>
                        <th className="p-3">ESCUDERÍA</th>
                        <th className="p-3 text-center">CARRERAS</th>
                        <th className="p-3 text-right">ACCIONES</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-sans">
                      {filteredPilots.map((p) => {
                        const pilotRunsCount = runs.filter(r => r.pilotId === p.id).length;

                        return (
                          <tr key={p.id} className="hover:bg-slate-800/40 transition-colors">
                            <td className="p-3 font-mono font-bold text-cyan-400">
                              #{p.dorsal || '00'}
                            </td>
                            <td className="p-3 font-semibold text-white">
                              {p.name}
                            </td>
                            <td className="p-3 font-mono text-slate-400">
                              {p.callsign ? `"${p.callsign}"` : '--'}
                            </td>
                            <td className="p-3 text-slate-400">
                              {p.team || 'Independiente'}
                            </td>
                            <td className="p-3 text-center font-mono">
                              <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300">
                                {pilotRunsCount} / {tracks.length}
                              </span>
                            </td>
                            <td className="p-3 text-right">
                              <button
                                type="button"
                                onClick={() => {
                                  if (confirm(`¿Eliminar al piloto "${p.name}" y todos sus tiempos asociados?`)) {
                                    deletePilot(p.id);
                                  }
                                }}
                                className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                                title="Eliminar piloto"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 2: AUDITORÍA DE TIEMPOS Y DESBLOQUEO DE REINTENTOS */}
        {/* ========================================================================= */}
        {activeTab === 'runs' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2">
                  <Clock className="w-5 h-5 text-cyan-400" />
                  Registro Oficial de Tiempos
                </h2>
                <p className="text-xs text-slate-400">
                  Auditoría completa de cronometrajes y gestión de reintentos autorizados.
                </p>
              </div>

              {/* Filtros */}
              <div className="flex flex-wrap items-center gap-2">
                <select
                  value={runFilterTrack}
                  onChange={(e) => setRunFilterTrack(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="">Todas las pistas</option>
                  {tracks.map(t => (
                    <option key={t.id} value={t.id}>{t.name}</option>
                  ))}
                </select>

                <select
                  value={runFilterPilot}
                  onChange={(e) => setRunFilterPilot(e.target.value)}
                  className="bg-slate-950 border border-slate-700 text-xs text-slate-300 rounded-xl px-3 py-2 focus:outline-none"
                >
                  <option value="">Todos los pilotos</option>
                  {pilots.map(p => (
                    <option key={p.id} value={p.id}>{p.name} (#{p.dorsal})</option>
                  ))}
                </select>
              </div>
            </div>

            {filteredRuns.length === 0 ? (
              <div className="p-12 text-center text-slate-500 font-mono text-xs border border-dashed border-slate-800 rounded-xl">
                No hay tiempos registrados que coincidan con los filtros.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="bg-slate-950 border-b border-slate-800 text-[11px] font-mono uppercase text-slate-400">
                      <th className="p-3">HORA</th>
                      <th className="p-3">PISTA</th>
                      <th className="p-3">PILOTO</th>
                      <th className="p-3 text-center">TIEMPO</th>
                      <th className="p-3 text-center">INTENTO</th>
                      <th className="p-3">REGISTRADO POR</th>
                      <th className="p-3">ESTADO REINTENTO</th>
                      <th className="p-3 text-right">ACCIONES</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-sans">
                    {filteredRuns.map((run) => (
                      <tr key={run.id} className="hover:bg-slate-800/40 transition-colors">
                        <td className="p-3 font-mono text-slate-400">
                          {new Date(run.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                        </td>
                        <td className="p-3 font-mono font-bold text-cyan-400">
                          {run.trackCode || run.trackName}
                        </td>
                        <td className="p-3 font-semibold text-white">
                          {run.pilotName} <span className="text-slate-400 font-mono text-[11px]">#{run.pilotDorsal}</span>
                        </td>
                        <td className="p-3 text-center font-mono font-black text-cyan-300 text-sm">
                          {run.timeSeconds}s
                        </td>
                        <td className="p-3 text-center font-mono text-slate-400">
                          #{run.attemptNumber}
                        </td>
                        <td className="p-3 text-slate-400">
                          {run.recordedBy || 'Monitor'}
                        </td>
                        <td className="p-3">
                          {run.isUnlockedForRetry ? (
                            <span className="text-[10px] font-mono text-amber-400 bg-amber-950/80 border border-amber-600/60 px-2 py-0.5 rounded-full font-bold">
                              Reintento Desbloqueado
                            </span>
                          ) : (
                            <span className="text-[10px] font-mono text-slate-400 bg-slate-800 px-2 py-0.5 rounded-full">
                              Oficial (Bloqueado)
                            </span>
                          )}
                        </td>
                        <td className="p-3 text-right">
                          <div className="flex items-center justify-end gap-2">
                            {/* Botón para desbloquear reintento si no lo está */}
                            {!run.isUnlockedForRetry && (
                              <button
                                type="button"
                                onClick={() => setUnlockTarget({
                                  pilotId: run.pilotId,
                                  trackId: run.trackId,
                                  pilotName: run.pilotName,
                                  trackName: run.trackName
                                })}
                                className="px-2 py-1 rounded bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[11px] font-mono flex items-center gap-1 transition-colors"
                                title="Autorizar reintento para este piloto"
                              >
                                <Unlock className="w-3 h-3" />
                                <span>Desbloquear</span>
                              </button>
                            )}

                            {/* Botón para eliminar registro erróneo */}
                            <button
                              type="button"
                              onClick={() => {
                                if (confirm(`¿Eliminar el registro de ${run.timeSeconds}s para ${run.pilotName}?`)) {
                                  deleteRun(run.id);
                                }
                              }}
                              className="text-slate-500 hover:text-rose-400 p-1 transition-colors"
                              title="Eliminar registro"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ========================================================================= */}
        {/* PESTAÑA 3: PISTAS Y CONFIGURACIÓN */}
        {/* ========================================================================= */}
        {activeTab === 'tracks' && (
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl flex flex-col gap-4">
            <div>
              <h2 className="text-base font-bold text-white flex items-center gap-2">
                <Flag className="w-5 h-5 text-cyan-400" />
                Pistas y Pruebas Activas
              </h2>
              <p className="text-xs text-slate-400">
                Cada pista genera su propio ranking individual y suma puntos al ranking global.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {tracks.map((t) => (
                <div
                  key={t.id}
                  className="p-5 rounded-2xl bg-slate-950 border border-slate-800 flex flex-col justify-between"
                  style={{ borderLeftColor: t.color || '#00e5ff', borderLeftWidth: '4px' }}
                >
                  <div>
                    <span
                      className="text-xs font-mono font-bold px-2 py-0.5 rounded"
                      style={{
                        backgroundColor: `${t.color || '#00e5ff'}25`,
                        color: t.color || '#00e5ff'
                      }}
                    >
                      {t.code}
                    </span>
                    <h3 className="text-base font-bold text-white mt-2">{t.name}</h3>
                    <p className="text-xs text-slate-400 mt-1">{t.description || 'Pista de carreras'}</p>
                  </div>
                  <div className="mt-4 pt-3 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400">
                    <span>Estado: Activa</span>
                    <span className="text-cyan-400 font-bold">1 Intento (con desbloqueo)</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {/* Modal Desbloqueo de Reintento */}
      {unlockTarget && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-amber-600/50 rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="text-lg font-bold text-amber-300 mb-1 flex items-center gap-2">
              <Unlock className="w-5 h-5 text-amber-400" />
              Autorizar Reintento
            </h3>
            <p className="text-xs text-slate-300 mb-4">
              ¿Deseas permitir un nuevo intento para <strong className="text-white">{unlockTarget.pilotName}</strong> en <strong className="text-cyan-400">{unlockTarget.trackName}</strong>?
            </p>

            <div className="space-y-2 mb-4">
              <label className="text-xs font-mono text-slate-400 block">Motivo oficial:</label>
              <input
                type="text"
                value={unlockReason}
                onChange={(e) => setUnlockReason(e.target.value)}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-amber-400"
              />
            </div>

            <div className="flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setUnlockTarget(null)}
                className="px-4 py-2 rounded-lg bg-slate-800 text-xs font-mono text-slate-300"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmUnlock}
                className="px-4 py-2 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-mono font-bold"
              >
                Confirmar Desbloqueo
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
