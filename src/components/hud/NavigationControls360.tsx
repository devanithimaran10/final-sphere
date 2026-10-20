import React, { useEffect, useState } from 'react';
import { useCameraStore, normalizeAngle } from '../../store/useCameraStore';
import { useGameStore } from '../../store/useGameStore';
import { RotateCcw, Target, Eye, Smartphone, Compass, Volume2, VolumeX, Shield, Wand2 } from 'lucide-react';
import { useSettingsStore } from '../../store/useSettingsStore';

export const NavigationControls360: React.FC = () => {
  const {
    yaw,
    snapTo,
    snapToRelative,
    freeLook,
    setFreeLook,
    gyroActive,
    setGyroActive,
    rotateBy,
  } = useCameraStore();
  const activeSpheres = useGameStore((s) => s.activeSpheres);
  const {
    soundEnabled,
    toggleSoundEnabled,
    patientComfortArc,
    togglePatientComfortArc,
    autoAimAssist,
    toggleAutoAimAssist,
  } = useSettingsStore();
  const [hasGyroSupport, setHasGyroSupport] = useState(false);

  // Check for device orientation sensor
  useEffect(() => {
    if (typeof window !== 'undefined' && 'DeviceOrientationEvent' in window) {
      setHasGyroSupport(true);
    }
  }, []);

  // Keyboard navigation for turning: A/D or Q/E to rotate yaw, W/S to tilt pitch
  useEffect(() => {
    let keyTimer: number | null = null;
    const pressedKeys = new Set<string>();

    const updateLoop = () => {
      let deltaYaw = 0;
      let deltaPitch = 0;

      if (pressedKeys.has('a') || pressedKeys.has('A') || pressedKeys.has('q') || pressedKeys.has('Q')) {
        deltaYaw -= 0.038;
      }
      if (pressedKeys.has('d') || pressedKeys.has('D') || pressedKeys.has('e') || pressedKeys.has('E')) {
        deltaYaw += 0.038;
      }
      if (pressedKeys.has('w') || pressedKeys.has('W')) {
        deltaPitch += 0.025;
      }
      if (pressedKeys.has('s') || pressedKeys.has('S')) {
        deltaPitch -= 0.025;
      }

      if (deltaYaw !== 0 || deltaPitch !== 0) {
        rotateBy(deltaYaw, deltaPitch);
      }

      keyTimer = requestAnimationFrame(updateLoop);
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement)?.tagName === 'INPUT') return;
      if (['a', 'd', 'q', 'e', 'w', 's'].includes(e.key.toLowerCase())) {
        pressedKeys.add(e.key.toLowerCase());
      }
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      pressedKeys.delete(e.key.toLowerCase());
    };

    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);
    keyTimer = requestAnimationFrame(updateLoop);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
      if (keyTimer) cancelAnimationFrame(keyTimer);
    };
  }, [rotateBy]);

  // Target next nearest sphere in 360 space
  const targetNextSphere = () => {
    if (activeSpheres.length === 0) return;

    let bestSphere = activeSpheres[0];
    let minDiff = Infinity;

    for (const sphere of activeSpheres) {
      const azimuth = sphere.azimuth ?? Math.atan2(sphere.position[0], -sphere.position[2]);
      const diff = Math.abs(normalizeAngle(azimuth - yaw));
      if (diff > 0.25 && diff < minDiff) {
        minDiff = diff;
        bestSphere = sphere;
      }
    }

    const az = bestSphere.azimuth ?? Math.atan2(bestSphere.position[0], -bestSphere.position[2]);
    snapTo(az, bestSphere.elevation || 0);
  };

  // Toggle Pointer Lock (Free Look)
  const togglePointerLock = () => {
    if (!freeLook) {
      document.body.requestPointerLock?.();
      setFreeLook(true);
    } else {
      document.exitPointerLock?.();
      setFreeLook(false);
    }
  };

  // Handle pointerlock change
  useEffect(() => {
    const onLockChange = () => {
      setFreeLook(!!document.pointerLockElement);
    };
    document.addEventListener('pointerlockchange', onLockChange);
    return () => document.removeEventListener('pointerlockchange', onLockChange);
  }, [setFreeLook]);

  // Toggle Gyroscope (Mobile)
  const toggleGyro = async () => {
    if (!gyroActive) {
      const doe = (window as unknown as { DeviceOrientationEvent?: { requestPermission?: () => Promise<string> } }).DeviceOrientationEvent;
      if (typeof doe?.requestPermission === 'function') {
        try {
          const response = await doe.requestPermission();
          if (response !== 'granted') return;
        } catch {
          return;
        }
      }

      const handleOrientation = (e: DeviceOrientationEvent) => {
        if (e.alpha !== null && e.beta !== null) {
          const gyroYaw = (e.alpha * Math.PI) / 180;
          const gyroPitch = ((e.beta - 45) * Math.PI) / 180;
          snapTo(gyroYaw, Math.max(-0.6, Math.min(0.6, gyroPitch)));
        }
      };

      window.addEventListener('deviceorientation', handleOrientation);
      setGyroActive(true);
    } else {
      setGyroActive(false);
    }
  };

  const headingDeg = Math.round(((yaw % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI)) * (180 / Math.PI));

  return (
    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 pointer-events-auto z-20 select-none">
      {/* 360 Quick-Turn and Navigation Action Bar */}
      <div className="glass px-3.5 py-2 rounded-2xl flex items-center gap-2 border border-slate-700/60 shadow-2xl bg-slate-900/90 backdrop-blur-md">
        {/* Turn Left 90° */}
        <button
          onClick={() => snapToRelative(-Math.PI / 2)}
          className="px-2 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1"
          title="Turn 90° Left (A / Q)"
        >
          <span>↶</span> 90°
        </button>

        {/* Turn 180° Behind */}
        <button
          onClick={() => snapToRelative(Math.PI)}
          className="px-2 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1"
          title="Turn 180° Behind"
        >
          <RotateCcw size={12} /> 180°
        </button>

        {/* Target Next Sphere */}
        <button
          onClick={targetNextSphere}
          className="px-3 py-1.5 rounded-xl text-xs font-display uppercase tracking-wider font-bold text-cyan-300 bg-cyan-500/20 hover:bg-cyan-500/30 border border-cyan-500/40 active:scale-95 transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(0,212,255,0.2)]"
          title="Snap camera to next active target"
        >
          <Target size={14} className="text-cyan-400" /> Target Next
        </button>

        {/* Turn Right 90° */}
        <button
          onClick={() => snapToRelative(Math.PI / 2)}
          className="px-2 py-1.5 rounded-xl text-xs font-mono font-bold text-slate-300 hover:text-white hover:bg-white/10 active:scale-95 transition-all flex items-center gap-1"
          title="Turn 90° Right (D / E)"
        >
          90° <span>↷</span>
        </button>

        <span className="w-px h-5 bg-white/15 mx-0.5" />

        {/* Patient Comfort Arc Mode Toggle */}
        <button
          onClick={togglePatientComfortArc}
          className={`px-2 py-1.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
            patientComfortArc
              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={
            patientComfortArc
              ? 'Patient Comfort Arc Active (Targets stay in frontal 130° view)'
              : 'Full 360° Mode (Targets spawn all around)'
          }
        >
          <Shield size={12} className={patientComfortArc ? 'text-emerald-400' : ''} />
          {patientComfortArc ? 'Comfort Arc' : 'Full 360°'}
        </button>

        {/* Auto-Aim Assist Toggle */}
        <button
          onClick={toggleAutoAimAssist}
          className={`px-2 py-1.5 rounded-xl text-[11px] font-mono font-bold flex items-center gap-1 transition-all ${
            autoAimAssist
              ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={autoAimAssist ? 'Auto-Aim Assist ON (Gently centers targets for motor help)' : 'Auto-Aim Assist OFF'}
        >
          <Wand2 size={12} className={autoAimAssist ? 'text-cyan-400' : ''} />
          Auto-Aim
        </button>

        {/* Audio Mute/Unmute */}
        <button
          onClick={toggleSoundEnabled}
          className={`p-1.5 rounded-xl transition-all ${
            soundEnabled
              ? 'text-cyan-300 hover:bg-white/10'
              : 'text-slate-500 hover:text-slate-300 hover:bg-white/10'
          }`}
          title={soundEnabled ? 'Audio Feedback ON' : 'Audio Muted'}
        >
          {soundEnabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        </button>

        <span className="w-px h-5 bg-white/15 mx-0.5" />

        {/* Heading degrees readout */}
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-black/40 text-[11px] font-mono text-cyan-400">
          <Compass size={13} />
          <span>{headingDeg.toString().padStart(3, '0')}°</span>
        </div>

        {/* Free Look (Pointer Lock) toggle */}
        <button
          onClick={togglePointerLock}
          className={`p-1.5 rounded-xl transition-all ${
            freeLook
              ? 'bg-cyan-500 text-black shadow-[0_0_15px_#00d4ff]'
              : 'text-slate-400 hover:text-white hover:bg-white/10'
          }`}
          title={freeLook ? 'Free Look Active (Press ESC to exit)' : 'Enable Free Look (Mouse Aim)'}
        >
          <Eye size={15} />
        </button>

        {/* Gyro toggle on mobile/supported devices */}
        {hasGyroSupport && (
          <button
            onClick={toggleGyro}
            className={`p-1.5 rounded-xl transition-all ${
              gyroActive
                ? 'bg-purple-500 text-white shadow-[0_0_15px_#a855f7]'
                : 'text-slate-400 hover:text-white hover:bg-white/10'
            }`}
            title={gyroActive ? 'Gyroscope Active' : 'Enable Mobile Gyroscope 360 Look'}
          >
            <Smartphone size={15} />
          </button>
        )}
      </div>

      {/* Helpful keyboard hint */}
      <span className="text-[10px] font-mono text-slate-500 tracking-wider">
        Drag screen to look 360° • A/D or Q/E to turn • Large targets & Audio active
      </span>
    </div>
  );
};
