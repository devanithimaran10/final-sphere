import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useCameraStore, normalizeAngle } from '../../store/useCameraStore';

const COLOR_MAP: Record<string, string> = {
  green: '#00ff88',
  blue: '#00d4ff',
  red: '#ff2d55',
  yellow: '#ffd60a',
};

export const Radar360: React.FC = () => {
  const activeSpheres = useGameStore((s) => s.activeSpheres);
  const yaw = useCameraStore((s) => s.yaw);
  const snapTo = useCameraStore((s) => s.snapTo);
  const focusedSphereId = useCameraStore((s) => s.focusedSphereId);

  const radius = 52; // radar radius in px
  const center = 60; // center offset in px

  return (
    <div className="relative flex flex-col items-center pointer-events-auto select-none">
      <div
        className="relative w-[120px] h-[120px] rounded-full border border-cyan-500/30 glass shadow-[0_0_25px_rgba(0,212,255,0.15)] overflow-hidden cursor-crosshair group"
        title="360° Spatial Radar — Click blip to orient"
      >
        {/* Radar concentric distance rings */}
        <div className="absolute inset-[15px] rounded-full border border-cyan-500/15" />
        <div className="absolute inset-[30px] rounded-full border border-cyan-500/20" />

        {/* Crosshair grid lines */}
        <div className="absolute top-0 bottom-0 left-1/2 w-px bg-cyan-500/20 -translate-x-1/2" />
        <div className="absolute left-0 right-0 top-1/2 h-px bg-cyan-500/20 -translate-y-1/2" />

        {/* 60° FOV View Cone facing UP (forward line of sight) */}
        <div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
          style={{
            width: radius * 2,
            height: radius * 2,
            background:
              'conic-gradient(from 150deg at 50% 50%, rgba(0, 212, 255, 0.16) 0deg, rgba(0, 212, 255, 0.03) 60deg, transparent 60deg)',
            transform: 'rotate(-30deg)',
          }}
        />

        {/* Cardinal Direction labels */}
        <span className="absolute top-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-cyan-400 font-bold">N</span>
        <span className="absolute right-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500">E</span>
        <span className="absolute bottom-1 left-1/2 -translate-x-1/2 text-[9px] font-mono text-slate-500">S</span>
        <span className="absolute left-1 top-1/2 -translate-y-1/2 text-[9px] font-mono text-slate-500">W</span>

        {/* Center player blip */}
        <div className="absolute top-1/2 left-1/2 w-2 h-2 rounded-full bg-cyan-400 -translate-x-1/2 -translate-y-1/2 shadow-[0_0_8px_#00d4ff]" />

        {/* Sphere blips */}
        {activeSpheres.map((sphere) => {
          // Compute sphere azimuth from coordinates if not explicitly stored
          const azimuth = sphere.azimuth ?? Math.atan2(sphere.position[0], -sphere.position[2]);
          const relAngle = normalizeAngle(azimuth - yaw);

          // Radar coordinates (relAngle = 0 is UP / -Y)
          const distNorm = Math.min(1, (sphere.distance ?? 6.5) / 7.5);
          const r = radius * 0.78 * distNorm;
          const x = center + r * Math.sin(relAngle);
          const y = center - r * Math.cos(relAngle);

          const isFocused = focusedSphereId === sphere.id;
          const sphereCol = COLOR_MAP[sphere.color] || '#00d4ff';

          return (
            <button
              key={sphere.id}
              onClick={(e) => {
                e.stopPropagation();
                snapTo(azimuth, sphere.elevation || 0);
              }}
              className={`absolute w-3 h-3 -translate-x-1/2 -translate-y-1/2 rounded-full transition-transform hover:scale-150 ${
                isFocused ? 'ring-2 ring-white scale-125' : ''
              }`}
              style={{
                left: `${x}px`,
                top: `${y}px`,
                backgroundColor: sphereCol,
                boxShadow: `0 0 10px ${sphereCol}`,
              }}
              title={`Target: ${sphere.color.toUpperCase()} (Click to aim)`}
            />
          );
        })}
      </div>
      <span className="text-[10px] font-mono uppercase tracking-widest text-cyan-400/80 mt-1">
        360° Radar
      </span>
    </div>
  );
};
