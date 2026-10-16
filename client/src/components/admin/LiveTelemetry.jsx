'use client';

import React from 'react';
import { Activity, Zap, CheckCircle2, Clock, Wifi, AlertTriangle } from 'lucide-react';

export default function LiveTelemetry({ connectedTeams = {}, submissions = {}, teamsList = [] }) {
  const activeCount = Object.keys(connectedTeams).length;
  const submittedCount = Object.keys(submissions).length;

  return (
    <div className="bg-f1-card p-6 rounded-2xl border border-f1-border">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-white uppercase italic flex items-center gap-2">
            <Activity className="w-5 h-5 text-f1-cyan" />
            <span>Telemetría de los 10 Equipos en Tiempo Real</span>
          </h3>
          <p className="text-xs text-slate-400 font-mono">
            MONITOR DE CONEXIÓN DE TABLETS, ESTADO DE RESPUESTA Y TIEMPOS OFICIALES
          </p>
        </div>
        <div className="flex items-center gap-2 font-mono text-xs">
          <div className="px-3 py-1 bg-f1-dark rounded-lg border border-f1-border text-slate-300">
            CONECTADOS: <span className="text-f1-cyan font-bold">{activeCount}</span> / 10
          </div>
          <div className="px-3 py-1 bg-f1-dark rounded-lg border border-f1-border text-slate-300">
            ENVIADOS: <span className="text-f1-green font-bold">{submittedCount}</span> / 10
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {teamsList.map((team) => {
          const presence = connectedTeams[team.id];
          const submission = submissions[team.id] || (presence?.status === 'SUBMITTED' ? presence : null);
          const isOnline = !!presence;
          const status = presence?.status || (submission ? 'SUBMITTED' : 'OFFLINE');

          let statusBadge = (
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-500 border border-slate-700">
              DESCONECTADO
            </span>
          );

          if (status === 'SUBMITTED') {
            statusBadge = (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-f1-green/20 text-f1-green border border-f1-green/40 flex items-center gap-1 font-bold">
                <CheckCircle2 className="w-3 h-3" /> ENVIADO
              </span>
            );
          } else if (status === 'ANSWERING') {
            statusBadge = (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-f1-yellow/20 text-f1-yellow border border-f1-yellow/40 flex items-center gap-1 animate-pulse font-bold">
                <Clock className="w-3 h-3" /> RESPONDIENDO
              </span>
            );
          } else if (isOnline || status === 'CONNECTED') {
            statusBadge = (
              <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-f1-cyan/20 text-f1-cyan border border-f1-cyan/40 flex items-center gap-1 font-bold">
                <Wifi className="w-3 h-3 text-f1-cyan" /> LISTO EN PITS
              </span>
            );
          }

          return (
            <div
              key={team.id}
              className={`p-4 rounded-xl border transition-all ${
                status === 'SUBMITTED'
                  ? 'bg-f1-dark/95 border-f1-green/50 shadow-md shadow-f1-green/5'
                  : isOnline
                  ? 'bg-f1-dark/80 border-f1-cyan/40 shadow-sm'
                  : 'bg-f1-dark/30 border-f1-border/30 opacity-60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 mb-2">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: team.color || '#E10600' }}
                  />
                  <span className="font-mono text-xs font-bold text-white">
                    {team.shortName || `EQ ${team.id}`}
                  </span>
                </div>
                {statusBadge}
              </div>

              <div className="text-xs font-bold text-slate-200 truncate mb-3">
                {team.name}
              </div>

              <div className="pt-2 border-t border-f1-border/50 text-[11px] font-mono space-y-1">
                <div className="flex justify-between text-slate-400">
                  <span>TIEMPO:</span>
                  <span className="text-white font-bold">
                    {submission?.durationFormatted || submission?.durationSeconds ? `${submission.durationSeconds || submission.durationFormatted}` : '--'}
                  </span>
                </div>
                <div className="flex justify-between text-slate-400">
                  <span>PUNTAJE:</span>
                  <span className={submission?.score ? 'text-yellow-400 font-bold' : 'text-slate-500'}>
                    {submission?.score !== undefined ? `${submission.score} pts` : '--'}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
