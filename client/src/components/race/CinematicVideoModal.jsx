'use client';

import React, { useState, useEffect, useRef } from 'react';
import { FastForward, Volume2, VolumeX, Activity } from 'lucide-react';

export default function CinematicVideoModal({
  videoUrl = '/videos/f1-race-action.mp4',
  sectorIndex = 1,
  totalSectors = 10,
  onFinish
}) {
  const [secondsLeft, setSecondsLeft] = useState(8);
  const [isMuted, setIsMuted] = useState(true);
  const videoRef = useRef(null);

  useEffect(() => {
    // Intentar reproducir el video apenas se monta el componente
    if (videoRef.current) {
      videoRef.current.play().catch((err) => {
        console.log('Autoplay handled:', err);
      });
    }

    const timer = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          if (onFinish) onFinish();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [onFinish]);

  return (
    <div className="fixed inset-0 z-50 bg-black flex flex-col items-center justify-center select-none overflow-hidden animate-fade-in">
      {/* Reproductor de Video Real MP4 con fuentes múltiples */}
      <video
        ref={videoRef}
        autoPlay
        playsInline
        muted={isMuted}
        onEnded={onFinish}
        className="w-full h-full object-cover opacity-95 absolute inset-0"
      >
        <source src={videoUrl} type="video/mp4" />
        <source src="/videos/f1-race-action.mp4" type="video/mp4" />
      </video>

      {/* Overlay Cinemático */}
      <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-black/70 pointer-events-none" />

      {/* Header Superior con HUD */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex items-center gap-3">
          <div className="px-3.5 py-1.5 rounded-xl bg-f1-red text-white font-mono font-black text-xs uppercase flex items-center gap-1.5 shadow-lg shadow-f1-red/40 animate-pulse">
            <span className="w-2.5 h-2.5 rounded-full bg-white animate-ping" />
            <span>LIVE ON-BOARD BATTLE • SECTOR {sectorIndex} / {totalSectors}</span>
          </div>
        </div>

        {/* Botones de Control de Audio y Salto */}
        <div className="flex items-center gap-3">
          <button
            onClick={() => {
              const nextMuted = !isMuted;
              setIsMuted(nextMuted);
              if (videoRef.current) {
                videoRef.current.muted = nextMuted;
              }
            }}
            className="p-2.5 rounded-xl bg-black/60 backdrop-blur-md border border-white/20 text-white hover:bg-white/20 transition-all cursor-pointer"
            title={isMuted ? 'Activar sonido del video' : 'Silenciar video'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-red-400" /> : <Volume2 className="w-4 h-4 text-f1-green" />}
          </button>

          <button
            onClick={onFinish}
            className="px-5 py-2.5 rounded-xl bg-white hover:bg-slate-200 text-black font-mono font-black text-xs uppercase flex items-center gap-2 shadow-2xl hover:scale-105 active:scale-95 transition-all cursor-pointer"
          >
            <span>SALTAR CINEMÁTICA ({secondsLeft}s)</span>
            <FastForward className="w-4 h-4 fill-black" />
          </button>
        </div>
      </div>

      {/* Barra de Progreso Inferior */}
      <div className="absolute bottom-6 left-6 right-6 flex items-center justify-between gap-4 z-20 font-mono text-xs text-slate-300">
        <span className="bg-black/60 px-3 py-1 rounded-lg backdrop-blur-md">
          DISPUTA DE POSICIONES EN PISTA...
        </span>
        <div className="w-48 h-2 bg-white/20 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-f1-cyan to-f1-red transition-all duration-1000 ease-linear"
            style={{ width: `${((8 - secondsLeft) / 8) * 100}%` }}
          />
        </div>
      </div>
    </div>
  );
}
