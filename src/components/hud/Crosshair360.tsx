import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useCameraStore } from '../../store/useCameraStore';
import type { SphereAction } from '../../types';

const COLOR_MAP: Record<string, string> = {
  green: '#00ff88',
  blue: '#00d4ff',
  red: '#ff2d55',
  yellow: '#ffd60a',
};

const ACTION_DESCS: Record<string, string> = {
  left: 'SWIPE LEFT (←)',
  right: 'SWIPE RIGHT (→)',
  hold: 'HOLD 2 SECONDS (Space)',
  inhibit: 'INHIBIT — DO NOT TOUCH (✕)',
};

import { soundFx } from '../../utils/audio';

export const Crosshair360: React.FC = () => {
  const activeSpheres = useGameStore((s) => s.activeSpheres);
  const rules = useGameStore((s) => s.rules);
  const registerInput = useGameStore((s) => s.registerInput);
  const focusedSphereId = useCameraStore((s) => s.focusedSphereId);
  const prevFocusedRef = React.useRef<string | null>(null);

  const focusedSphere = activeSpheres.find((s) => s.id === focusedSphereId);
  const isLocked = !!focusedSphere;
  const sphereCol = focusedSphere ? COLOR_MAP[focusedSphere.color] || '#00d4ff' : '#00d4ff';
  const targetAction = focusedSphere ? rules[focusedSphere.color] : null;

  // Sound chime when crosshair locks onto a new sphere
  React.useEffect(() => {
    if (focusedSphereId && focusedSphereId !== prevFocusedRef.current) {
      soundFx.playTargetLock();
    }
    prevFocusedRef.current = focusedSphereId;
  }, [focusedSphereId]);

  const triggerAction = (action: SphereAction) => {
    if (!focusedSphere) return;
    if (focusedSphere.color === 'red') {
      soundFx.playError();
    } else {
      soundFx.playSuccess();
    }
    registerInput({
      sphereId: focusedSphere.id,
      action,
      reactionTime: Date.now() - focusedSphere.spawnTime,
      driftMagnitude: 0,
    });
  };

  return (
    <div className="absolute inset-0 pointer-events-none flex items-center justify-center z-10 select-none">
      {/* Central reticle container */}
      <div className="relative flex flex-col items-center">
        {/* Reticle shape */}
        <div
          className={`relative w-12 h-12 flex items-center justify-center transition-all duration-200 ${
            isLocked ? 'scale-125' : 'scale-100 opacity-60'
          }`}
        >
          {/* Corner brackets */}
          <div
            className="absolute top-0 left-0 w-3 h-3 border-t-2 border-l-2 transition-colors"
            style={{ borderColor: isLocked ? sphereCol : 'rgba(0,212,255,0.7)' }}
          />
          <div
            className="absolute top-0 right-0 w-3 h-3 border-t-2 border-r-2 transition-colors"
            style={{ borderColor: isLocked ? sphereCol : 'rgba(0,212,255,0.7)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-3 h-3 border-b-2 border-l-2 transition-colors"
            style={{ borderColor: isLocked ? sphereCol : 'rgba(0,212,255,0.7)' }}
          />
          <div
            className="absolute bottom-0 right-0 w-3 h-3 border-b-2 border-r-2 transition-colors"
            style={{ borderColor: isLocked ? sphereCol : 'rgba(0,212,255,0.7)' }}
          />

          {/* Center aiming dot */}
          <div
            className="w-1.5 h-1.5 rounded-full transition-transform"
            style={{
              backgroundColor: isLocked ? sphereCol : '#00d4ff',
              boxShadow: isLocked ? `0 0 12px ${sphereCol}` : '0 0 6px #00d4ff',
            }}
          />
        </div>

        {/* Lock-on target banner & action cues */}
        {isLocked && focusedSphere && (
          <div className="mt-4 flex flex-col items-center gap-2 animate-fade-in pointer-events-auto">
            <div
              className="glass px-3.5 py-1.5 rounded-full border text-center shadow-lg flex items-center gap-2"
              style={{ borderColor: `${sphereCol}88`, backgroundColor: 'rgba(5,10,20,0.85)' }}
            >
              <span className="w-2 h-2 rounded-full animate-ping" style={{ backgroundColor: sphereCol }} />
              <span className="font-display text-xs font-bold uppercase tracking-wider" style={{ color: sphereCol }}>
                {focusedSphere.color} LOCKED
              </span>
              <span className="text-[11px] font-mono text-slate-300">
                {ACTION_DESCS[targetAction || '']}
              </span>
            </div>

            {/* Quick action buttons for centered target */}
            {focusedSphere.color !== 'red' && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => triggerAction('left')}
                  className="glass px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20 transition-all pointer-events-auto active:scale-95 shadow-md"
                >
                  ← Left
                </button>
                <button
                  onClick={() => triggerAction('hold')}
                  className="glass px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-yellow-400 hover:bg-yellow-500/20 transition-all pointer-events-auto active:scale-95 shadow-md"
                >
                  ⏸ Hold
                </button>
                <button
                  onClick={() => triggerAction('right')}
                  className="glass px-3 py-1.5 rounded-lg text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20 transition-all pointer-events-auto active:scale-95 shadow-md"
                >
                  Right →
                </button>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
