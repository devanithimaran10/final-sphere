import React from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useCameraStore, normalizeAngle } from '../../store/useCameraStore';
import { ChevronLeft, ChevronRight, RotateCcw } from 'lucide-react';

const COLOR_MAP: Record<string, string> = {
  green: '#00ff88',
  blue: '#00d4ff',
  red: '#ff2d55',
  yellow: '#ffd60a',
};

const ACTION_ICONS: Record<string, string> = {
  left: '←',
  right: '→',
  hold: '⏸',
  inhibit: '✕',
};

export const OffscreenPointers: React.FC = () => {
  const activeSpheres = useGameStore((s) => s.activeSpheres);
  const rules = useGameStore((s) => s.rules);
  const yaw = useCameraStore((s) => s.yaw);
  const snapTo = useCameraStore((s) => s.snapTo);

  // Filter spheres that are outside the camera's FOV cone (~36 degrees half-angle)
  const offscreenSpheres = activeSpheres.filter((s) => {
    const azimuth = s.azimuth ?? Math.atan2(s.position[0], -s.position[2]);
    const relAngle = normalizeAngle(azimuth - yaw);
    return Math.abs(relAngle) > 0.62; // > 35.5 degrees
  });

  if (offscreenSpheres.length === 0) return null;

  return (
    <div className="absolute inset-0 pointer-events-none z-20">
      {offscreenSpheres.map((sphere) => {
        const azimuth = sphere.azimuth ?? Math.atan2(sphere.position[0], -sphere.position[2]);
        const relAngle = normalizeAngle(azimuth - yaw);
        const isRight = relAngle > 0;
        const isBehind = Math.abs(relAngle) > 2.2; // > 126 degrees
        const sphereCol = COLOR_MAP[sphere.color] || '#00d4ff';
        const action = rules[sphere.color];
        const actionIcon = ACTION_ICONS[action] || '';

        return (
          <div
            key={sphere.id}
            className={`absolute top-1/2 -translate-y-1/2 flex items-center pointer-events-auto cursor-pointer animate-pulse transition-all ${
              isRight ? 'right-4' : 'left-4'
            }`}
            onClick={() => snapTo(azimuth, sphere.elevation || 0)}
            title={`Click to turn towards ${sphere.color.toUpperCase()} target`}
          >
            {!isRight && (
              <div
                className="glass px-3 py-2 rounded-xl flex items-center gap-2 border shadow-lg hover:scale-105 transition-transform"
                style={{ borderColor: `${sphereCol}66` }}
              >
                {isBehind ? (
                  <RotateCcw size={16} style={{ color: sphereCol }} />
                ) : (
                  <ChevronLeft size={18} style={{ color: sphereCol }} />
                )}
                <span className="font-display font-bold text-xs uppercase" style={{ color: sphereCol }}>
                  {sphere.color}
                </span>
                <span className="text-[11px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">
                  {actionIcon}
                </span>
              </div>
            )}

            {isRight && (
              <div
                className="glass px-3 py-2 rounded-xl flex items-center gap-2 border shadow-lg hover:scale-105 transition-transform"
                style={{ borderColor: `${sphereCol}66` }}
              >
                <span className="text-[11px] font-mono bg-white/10 px-1.5 py-0.5 rounded text-white">
                  {actionIcon}
                </span>
                <span className="font-display font-bold text-xs uppercase" style={{ color: sphereCol }}>
                  {sphere.color}
                </span>
                {isBehind ? (
                  <RotateCcw size={16} style={{ color: sphereCol }} />
                ) : (
                  <ChevronRight size={18} style={{ color: sphereCol }} />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
};
