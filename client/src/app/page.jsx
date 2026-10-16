'use client';

import React from 'react';
import Link from 'next/link';
import { useDrone } from '../context/DroneContext';
import {
  Timer,
  Tv,
  ShieldCheck,
  Zap,
  Flag,
  Trophy,
  Users,
  Clock,
  ArrowRight,
  Radio,
  Sparkles
} from 'lucide-react';

export default function HomePage() {
  const { isConnected, droneState, preloadDemo } = useDrone();
  const { pilots = [], tracks = [], runs = [] } = droneState || {};

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col justify-between p-6 md:p-12 relative overflow-hidden font-sans">
      {/* Glows de fondo temáticos */}
      <div className="absolute -top-32 -left-32 w-96 h-96 bg-cyan-500/15 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute -bottom-32 -right-32 w-96 h-96 bg-amber-500/15 rounded-full blur-3xl pointer-events-none" />

      {/* Header */}
      <header className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 border-b border-slate-800 pb-6 relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 bg-cyan-500 rounded-2xl flex items-center justify-center shadow-lg shadow-cyan-500/30 text-slate-950 font-black">
            <Flag className="w-6 h-6" />
          </div>
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white uppercase italic">
              Torneo de Carreras <span className="text-cyan-400">de Drones</span>
            </h1>
            <p className="text-xs md:text-sm text-slate-400">
              Sistema de Cronometraje Oficial, Telemetría y Live Leaderboard
            </p>
          </div>
        </div>

        {/* Badge de conexión */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 bg-slate-900 px-4 py-2 rounded-full border border-slate-800">
            <span className={`w-2.5 h-2.5 rounded-full ${isConnected ? 'bg-emerald-400 animate-pulse' : 'bg-rose-500'}`} />
            <span className="text-xs font-mono font-medium text-slate-300">
              {isConnected ? 'TELEMETRÍA EN VIVO' : 'CONECTANDO AL SERVIDOR...'}
            </span>
          </div>
        </div>
      </header>

      {/* Hero & Selector de Vistas Principales */}
      <main className="my-auto py-10 relative z-10 max-w-6xl mx-auto w-full">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-slate-900 border border-slate-800 text-xs font-mono text-cyan-400 mb-3 shadow-inner">
            <Zap className="w-3.5 h-3.5" />
            <span>ESTACIÓN DE EVENTO • CLASIFICACIÓN POR PUNTOS (OPCIÓN B)</span>
          </div>
          <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight mb-3">
            Plataforma de Operación de Carrera
          </h2>
          <p className="text-slate-400 max-w-2xl mx-auto text-sm md:text-base leading-relaxed">
            Los monitores ingresan los tiempos en cada pista con cronómetro digital integrado, mientras la pantalla gigante proyecta el ranking en vivo con actualización instantánea.
          </p>

          {/* Métricas rápidas del evento */}
          <div className="flex flex-wrap items-center justify-center gap-4 mt-6">
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono">
              Pilotos Registrados: <strong className="text-cyan-400 text-sm">{pilots.length}</strong>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono">
              Pistas Activas: <strong className="text-amber-400 text-sm">{tracks.length}</strong>
            </div>
            <div className="bg-slate-900/80 border border-slate-800 px-4 py-2 rounded-xl text-xs font-mono">
              Tiempos Subidos: <strong className="text-emerald-400 text-sm">{runs.length}</strong>
            </div>
          </div>
        </div>

        {/* 3 Cartas de Vistas Principales */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 md:gap-8">
          {/* VISTA 1: ESTACIÓN DEL MONITOR */}
          <Link
            href="/monitor"
            className="group relative bg-slate-900 hover:bg-slate-850 p-8 rounded-3xl border border-slate-800 hover:border-cyan-500/60 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-cyan-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-cyan-500/5 rounded-bl-full pointer-events-none group-hover:bg-cyan-500/10 transition-colors" />
            <div>
              <div className="w-14 h-14 rounded-2xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center mb-6 text-cyan-400 group-hover:scale-110 transition-transform">
                <Timer className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-cyan-400 font-semibold">
                VISTA A • TABLETS / JUECES
              </span>
              <h3 className="text-xl font-bold text-white mt-1 mb-3 group-hover:text-cyan-300 transition-colors">
                Estación del Monitor
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Selecciona la pista, busca al corredor o regístralo al vuelo. Cronómetro digital integrado, validación estricta de 1 intento por pista y botón para desbloquear reintentos por fallos técnicos.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 group-hover:text-white">
              <span className="font-bold">ABRIR TERMINAL DE PISTA</span>
              <ArrowRight className="w-4 h-4 text-cyan-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* VISTA 2: PANTALLA GIGANTE / LEADERBOARD */}
          <Link
            href="/leaderboard"
            className="group relative bg-slate-900 hover:bg-slate-850 p-8 rounded-3xl border border-slate-800 hover:border-amber-500/60 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-amber-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-amber-500/5 rounded-bl-full pointer-events-none group-hover:bg-amber-500/10 transition-colors" />
            <div>
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mb-6 text-amber-400 group-hover:scale-110 transition-transform">
                <Tv className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-amber-400 font-semibold">
                VISTA B • PANTALLA GIGANTE / 4K
              </span>
              <h3 className="text-xl font-bold text-white mt-1 mb-3 group-hover:text-amber-300 transition-colors">
                Live Leaderboard
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Clasificación general por puntos (Opción B) y rankings individuales por pista. Muestra pistas pendientes para cada piloto, récords de vuelta, auto-rotación automática y alertas de telemetría en vivo.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 group-hover:text-white">
              <span className="font-bold">PROYECTAR RANKING EN VIVO</span>
              <ArrowRight className="w-4 h-4 text-amber-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>

          {/* VISTA 3: PANEL DE ADMINISTRACIÓN */}
          <Link
            href="/admin/drones"
            className="group relative bg-slate-900 hover:bg-slate-850 p-8 rounded-3xl border border-slate-800 hover:border-emerald-500/60 transition-all duration-300 flex flex-col justify-between hover:shadow-2xl hover:shadow-emerald-500/10 hover:-translate-y-1"
          >
            <div className="absolute top-0 right-0 w-28 h-28 bg-emerald-500/5 rounded-bl-full pointer-events-none group-hover:bg-emerald-500/10 transition-colors" />
            <div>
              <div className="w-14 h-14 rounded-xl bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mb-6 text-emerald-400 group-hover:scale-110 transition-transform">
                <ShieldCheck className="w-7 h-7" />
              </div>
              <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-semibold">
                VISTA C • DIRECCIÓN DE CARRERA
              </span>
              <h3 className="text-xl font-bold text-white mt-1 mb-3 group-hover:text-emerald-300 transition-colors">
                Panel de Control & Pilotos
              </h3>
              <p className="text-sm text-slate-400 leading-relaxed">
                Gestión de corredores y escuderías, auditoría de tiempos subidos, desbloqueo centralizado de reintentos, carga de datos de prueba y exportación de resultados a CSV.
              </p>
            </div>
            <div className="mt-8 pt-4 border-t border-slate-800 flex items-center justify-between text-xs font-mono text-slate-400 group-hover:text-white">
              <span className="font-bold">ACCEDER AL ADMIN</span>
              <ArrowRight className="w-4 h-4 text-emerald-400 group-hover:translate-x-1 transition-transform" />
            </div>
          </Link>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-800/80 pt-6 flex flex-col md:flex-row justify-between items-center gap-4 text-xs font-mono text-slate-500 relative z-10 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-3">
          <span>TORNEO DE DRONES VELTIS</span>
          <span>•</span>
          <span>PERSISTENCIA ATÓMICA EN BASE DE DATOS + WEBSOCKETS EN TIEMPO REAL</span>
        </div>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={preloadDemo}
            className="text-cyan-400 hover:text-cyan-300 underline"
          >
            Cargar Pilotos de Prueba
          </button>
          <span>•</span>
          <Link href="/admin" className="text-slate-400 hover:text-white">
            Simulación F1 NetSuite →
          </Link>
        </div>
      </footer>
    </div>
  );
}
