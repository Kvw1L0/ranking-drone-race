'use client';

import React, { useState } from 'react';
import { Flag, Shield, KeyRound, AlertCircle, Users } from 'lucide-react';
import { sounds } from '../../lib/soundEffects';
import { TEAMS_LIST } from '../../lib/firebaseRaceEngine';

export default function PinLogin({ onLoginSuccess, isConnecting }) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleVerify = async (selectedPin) => {
    const pinToVerify = selectedPin || pin;
    if (!pinToVerify || String(pinToVerify).trim() === '') {
      setError('Por favor ingresa o selecciona el número de tu equipo');
      return;
    }

    setIsLoading(true);
    setError('');
    sounds.playSelect();

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:4000/api';
      const res = await fetch(`${apiUrl}/teams/verify-pin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pin: pinToVerify })
      });

      const data = await res.json();
      if (data.success) {
        onLoginSuccess(data.data, pinToVerify);
      } else {
        const num = parseInt(pinToVerify);
        const teamObj = TEAMS_LIST.find(t => t.id === num);
        if (teamObj) {
          onLoginSuccess(teamObj, pinToVerify);
        } else {
          setError(data.message || 'PIN inválido. Elige entre el 1 y el 10.');
        }
      }
    } catch (err) {
      // Fallback con datos directos de TEAMS_LIST
      const num = parseInt(pinToVerify);
      const teamObj = TEAMS_LIST.find(t => t.id === num);
      if (teamObj) {
        onLoginSuccess(teamObj, pinToVerify);
      } else {
        setError('Error al verificar PIN de equipo.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md w-full mx-auto bg-f1-card p-6 md:p-8 rounded-2xl border border-f1-border shadow-2xl relative">
      {/* Header del Login */}
      <div className="text-center mb-8">
        <div className="w-16 h-16 bg-f1-red/10 border border-f1-red/30 rounded-2xl flex items-center justify-center mx-auto mb-4 text-f1-red shadow-lg shadow-f1-red/10">
          <Flag className="w-8 h-8" />
        </div>
        <h2 className="text-2xl font-black text-white tracking-tight uppercase italic">
          Terminal <span className="text-f1-red">de Pits</span>
        </h2>
        <p className="text-xs text-slate-400 mt-1 font-mono">
          INGRESO EXCLUSIVO POR NÚMERO DE EQUIPO
        </p>
      </div>

      {error && (
        <div className="mb-6 p-3.5 bg-red-500/10 border border-red-500/30 rounded-xl flex items-center gap-3 text-red-400 text-xs font-mono">
          <AlertCircle className="w-4 h-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Botones de Selección Rápida 1 al 10 */}
      <div className="mb-6">
        <label className="block text-xs font-mono text-slate-400 uppercase mb-3 flex items-center gap-1.5">
          <Users className="w-3.5 h-3.5 text-f1-cyan" />
          <span>Selecciona tu Escudería (Equipos 1 - 10):</span>
        </label>
        <div className="grid grid-cols-5 gap-2.5">
          {TEAMS_LIST.map((team) => (
            <button
              key={team.id}
              type="button"
              onClick={() => {
                setPin(String(team.id));
                handleVerify(String(team.id));
              }}
              disabled={isLoading}
              className={`py-3 rounded-xl font-mono text-sm font-bold transition-all flex flex-col items-center justify-center border relative overflow-hidden ${
                pin === String(team.id)
                  ? 'bg-f1-red border-f1-red text-white shadow-lg shadow-f1-red/30 scale-105'
                  : 'bg-f1-dark/80 border-f1-border text-slate-300 hover:border-slate-400 hover:bg-f1-cardHover'
              }`}
            >
              <div
                className="w-2 h-2 rounded-full mb-1"
                style={{ backgroundColor: team.color }}
              />
              <span>{team.shortName}</span>
              <span className="text-[9px] font-sans font-normal opacity-70 truncate max-w-[55px]">
                {team.name.split('-')[1]?.trim() || team.name}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Input manual alternativo */}
      <form
        onSubmit={(e) => {
          e.preventDefault();
          handleVerify(pin);
        }}
        className="space-y-4 pt-4 border-t border-f1-border/60"
      >
        <div>
          <label className="block text-xs font-mono text-slate-400 uppercase mb-2 flex items-center gap-1.5">
            <KeyRound className="w-3.5 h-3.5 text-f1-cyan" />
            <span>O escribe tu PIN de Equipo:</span>
          </label>
          <input
            type="number"
            min="1"
            max="10"
            value={pin}
            onChange={(e) => setPin(e.target.value)}
            placeholder="Ej: 1 al 10"
            className="w-full bg-f1-dark border border-f1-border focus:border-f1-cyan rounded-xl px-4 py-3 text-center text-lg font-mono font-bold text-white placeholder-slate-600 focus:outline-none focus:ring-1 focus:ring-f1-cyan transition-all"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading || !pin}
          className="w-full bg-gradient-to-r from-f1-red to-red-600 hover:from-red-600 hover:to-red-700 disabled:opacity-40 text-white font-mono font-bold py-3.5 px-6 rounded-xl transition-all shadow-lg shadow-f1-red/20 active:scale-[0.98] uppercase tracking-wider text-sm flex items-center justify-center gap-2"
        >
          {isLoading ? (
            <span className="animate-pulse">SINCRONIZANDO TELEMETRÍA...</span>
          ) : (
            <span>CONECTAR TERMINAL PITS</span>
          )}
        </button>
      </form>

      {/* Nota de privacidad estricta */}
      <div className="mt-6 text-center">
        <p className="text-[11px] text-slate-500 font-mono">
          🔒 Acceso anónimo corporativo. No se solicitan datos personales ni números telefónicos.
        </p>
      </div>
    </div>
  );
}
