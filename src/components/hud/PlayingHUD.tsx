import { useEffect, useRef, useState } from 'react';
import { useGameStore } from '../../store/useGameStore';
import { useSettingsStore } from '../../store/useSettingsStore';
import { useCameraStore } from '../../store/useCameraStore';
import type { GameMode, SphereColor, SphereAction } from '../../types';
import { MODES } from './modes';
import { DiffPips, RulesLegend } from './shared';
import { AIInsightsPanel } from './AIInsightsPanel';
import { Radar360 } from './Radar360';
import { OffscreenPointers } from './OffscreenPointers';
import { Crosshair360 } from './Crosshair360';
import { NavigationControls360 } from './NavigationControls360';
import { soundFx } from '../../utils/audio';

export function PlayingHUD() {
  const {
    mode, metrics, adaptive, timeLeft, totalDuration, fatigue, paused,
    ruleSwitchAlert, endSession, tick, pauseSession, resumeSession,
    spawnSphere, registerInhibition, registerMiss,
    triggerRuleSwitch,
  } = useGameStore();

  const { patientComfortArc, autoAimAssist } = useSettingsStore();

  const spawnTimer    = useRef<ReturnType<typeof setTimeout> | null>(null);
  const switchTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const gameReadyRef  = useRef(false);
  const prevDifficultyRef = useRef<string | null>(null);
  const [countdown, setCountdown] = useState<number | null>(3);
  const [difficultyChangePulse, setDifficultyChangePulse] = useState(false);

  // Session countdown
  useEffect(() => {
    const id = setInterval(() => tick(100), 100);
    return () => clearInterval(id);
  }, [tick]);

  // 3-2-1-GO! countdown before spheres spawn
  useEffect(() => {
    const timers: ReturnType<typeof setTimeout>[] = [];
    timers.push(setTimeout(() => setCountdown(2), 900));
    timers.push(setTimeout(() => setCountdown(1), 1800));
    timers.push(setTimeout(() => setCountdown(0), 2700));
    timers.push(setTimeout(() => { setCountdown(null); gameReadyRef.current = true; }, 3400));
    return () => timers.forEach(clearTimeout);
  }, []);

  // Keyboard controls: ArrowLeft, ArrowRight, Space
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      const gs = useGameStore.getState();
      if (gs.phase !== 'playing' || gs.paused) return;
      if (!gameReadyRef.current) return;
      const { activeSpheres, rules, registerInput } = useGameStore.getState();
      const focusedSphereId = useCameraStore.getState().focusedSphereId;

      let action: SphereAction | null = null;
      if (e.key === 'ArrowLeft')  action = 'left';
      if (e.key === 'ArrowRight') action = 'right';
      if (e.key === ' ')          action = 'hold';
      if (!action) return;
      e.preventDefault();

      // Prioritize the sphere currently locked in the 360 crosshair
      let target = activeSpheres.find(
        (s) => s.id === focusedSphereId && !s.isDistractor && s.color !== 'red' && rules[s.color] === action
      );

      // If no centered sphere matches, fallback to oldest active sphere
      if (!target) {
        target = activeSpheres.find(
          (s) => !s.isDistractor && s.color !== 'red' && rules[s.color] === action
        );
      }

      if (target) {
        soundFx.playSuccess();
        registerInput({
          sphereId: target.id,
          action,
          reactionTime: Date.now() - target.spawnTime,
          driftMagnitude: 0,
        });
      }
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, []);

  // Auto-Aim Assist effect for motor rehabilitation patients
  useEffect(() => {
    if (!autoAimAssist) return;
    const interval = setInterval(() => {
      const gs = useGameStore.getState();
      if (gs.phase !== 'playing' || gs.paused) return;
      const target = gs.activeSpheres.find((s) => !s.isDistractor && s.color !== 'red');
      if (target && Date.now() - target.spawnTime > 1200) {
        const az = target.azimuth ?? Math.atan2(target.position[0], -target.position[2]);
        useCameraStore.getState().snapTo(az, target.elevation || 0);
      }
    }, 1100);
    return () => clearInterval(interval);
  }, [autoAimAssist]);

  // 360-degree sphere position generator with Patient Comfort Arc support
  const generate360Position = (currentYaw: number, index: number, totalCount: number) => {
    const distance = 6.2 + Math.random() * 0.4;
    const isComfort = patientComfortArc;

    let azimuth: number;
    let elevation: number;

    if (isComfort) {
      // Patient Comfort Arc: Spans a gentle frontal 120° field (currentYaw +/- 60°)
      // Prevents extreme neck twisting or dizziness for patients with mobility limitations
      const halfArc = 1.05; // ~60 degrees
      azimuth = currentYaw + (Math.random() - 0.5) * halfArc * 2;
      elevation = -0.10 + Math.random() * 0.22; // gentle eye-level range
    } else {
      // Full 360-degree spatial field
      elevation = -0.18 + Math.random() * 0.38;
      if (totalCount === 1) {
        if (Math.random() < 0.45) {
          azimuth = currentYaw + (Math.random() - 0.5) * 1.1;
        } else {
          azimuth = Math.random() * Math.PI * 2;
        }
      } else {
        const sector = (2 * Math.PI / totalCount) * index;
        azimuth = currentYaw + sector + (Math.random() - 0.5) * 0.5;
      }
    }

    azimuth = (azimuth % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);

    const x = distance * Math.cos(elevation) * Math.sin(azimuth);
    const y = distance * Math.sin(elevation);
    const z = -distance * Math.cos(elevation) * Math.cos(azimuth);

    const orbitSpeed = (Math.random() > 0.5 ? 1 : -1) * (0.16 + Math.random() * 0.14);

    return {
      position: [x, y, z] as [number, number, number],
      azimuth,
      elevation,
      distance,
      orbitSpeed,
    };
  };

  // Sphere spawn loop
  useEffect(() => {
    const WEIGHTS: Record<GameMode, number[]> = {
      'micro-reach':          [0.28, 0.28, 0.22, 0.22],
      'rule-switch':          [0.26, 0.26, 0.24, 0.24],
      'inhibition-conflict':  [0.22, 0.22, 0.38, 0.18],
      'micro-trajectory':     [0.30, 0.30, 0.18, 0.22],
      'dual-task':            [0.25, 0.25, 0.28, 0.22],
      'reflex-gate':          [0.28, 0.28, 0.22, 0.22],
      'geometric-draw':       [0.28, 0.28, 0.22, 0.22],
    };

    const pickColor = (): SphereColor => {
      const colors: SphereColor[] = ['green', 'blue', 'red', 'yellow'];
      const w = WEIGHTS[mode];
      const r = Math.random();
      let acc = 0;
      for (let i = 0; i < colors.length; i++) {
        acc += w[i];
        if (r < acc) return colors[i];
      }
      return colors[0];
    };

    const spawn = () => {
      const state = useGameStore.getState();
      if (state.phase !== 'playing') return;
      if (state.paused) { spawnTimer.current = setTimeout(spawn, 400); return; }
      if (!gameReadyRef.current) { spawnTimer.current = setTimeout(spawn, 300); return; }
      const isConflict = mode === 'inhibition-conflict';
      const count = isConflict ? Math.floor(Math.random() * 2) + 2 : 1;

      const playerYaw = useCameraStore.getState().yaw;

      for (let i = 0; i < count; i++) {
        const id    = Math.random().toString(36).slice(2, 11);
        const color = pickColor();
        const isDistractor = isConflict && color !== 'red' && Math.random() < 0.25;

        const { position, azimuth, elevation, distance, orbitSpeed } = generate360Position(playerYaw, i, count);

        spawnSphere({
          id,
          color,
          position,
          azimuth,
          elevation,
          distance,
          orbitSpeed: mode === 'micro-trajectory' ? orbitSpeed : undefined,
          spawnTime: Date.now(),
          isDistractor,
        });

        // Acoustic chime on target spawn
        soundFx.playSpawn();

        // Auto-remove after lifetime
        const currentAdaptive = useGameStore.getState().adaptive;
        const lifetime = (color === 'red' ? 2400 : 3400) / currentAdaptive.objectSpeed;
        setTimeout(() => {
          const state = useGameStore.getState();
          const still = state.activeSpheres.find((s) => s.id === id);
          if (!still) return;
          if (color === 'red' || still.isDistractor) registerInhibition(id);
          else registerMiss(id);
        }, lifetime);
      }

      const jitter = 0.8 + Math.random() * 0.5;
      spawnTimer.current = setTimeout(spawn, useGameStore.getState().adaptive.spawnDelay * jitter);
    };

    spawnTimer.current = setTimeout(spawn, 1000);
    return () => { if (spawnTimer.current) clearTimeout(spawnTimer.current); };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  // Rule-switching (modes 2, 5)
  useEffect(() => {
    if (mode !== 'rule-switch' && mode !== 'dual-task') return;

    const schedule = () => {
      const delay = (7000 + Math.random() * 9000) / Math.max(0.3, adaptive.cognitiveLoad);
      switchTimer.current = setTimeout(() => {
        if (useGameStore.getState().paused) { schedule(); return; }
        triggerRuleSwitch();
        soundFx.playRuleSwitch();
        schedule();
      }, delay);
    };

    const first = setTimeout(schedule, 12000);
    return () => {
      clearTimeout(first);
      if (switchTimer.current) clearTimeout(switchTimer.current);
    };
  }, [mode]); // eslint-disable-line react-hooks/exhaustive-deps

  const mins = Math.floor(timeLeft / 60);
  const secs = Math.floor(timeLeft % 60);
  const timeStr = `${mins}:${secs.toString().padStart(2, '0')}`;
  const pct = Math.round((timeLeft / totalDuration) * 100);

  const totalR  = metrics.totalReactions;
  const accuracy = totalR > 0 ? Math.round((metrics.correctReactions / totalR) * 100) : 100;
  const avgRT    = metrics.reactionTimes.length
    ? Math.round(metrics.reactionTimes.slice(-5).reduce((a, b) => a + b, 0) /
        metrics.reactionTimes.slice(-5).length)
    : 0;

  const modeMeta = MODES.find((m) => m.id === mode)!;
  const diffLevel = Math.round(adaptive.cognitiveLoad * 5);
  const microReachDifficulty = Math.max(1, Math.min(5, Math.round((adaptive.objectSpeed / 2.2) * 5)));

  useEffect(() => {
    if (mode !== 'micro-reach') return;

    const signature = `${adaptive.objectSpeed.toFixed(2)}|${adaptive.spawnDelay}|${adaptive.cognitiveLoad.toFixed(2)}`;
    const previousSignature = prevDifficultyRef.current;
    prevDifficultyRef.current = signature;
    if (previousSignature && previousSignature !== signature) {
      setDifficultyChangePulse(true);
      const timer = window.setTimeout(() => setDifficultyChangePulse(false), 900);
      return () => window.clearTimeout(timer);
    }
  }, [adaptive, mode]);

  // Execute action from Patient Action Triggers
  const executePatientAction = (action: SphereAction) => {
    const gs = useGameStore.getState();
    if (gs.phase !== 'playing' || gs.paused) return;
    const focusedSphereId = useCameraStore.getState().focusedSphereId;

    let target = gs.activeSpheres.find(
      (s) => s.id === focusedSphereId && !s.isDistractor && s.color !== 'red' && gs.rules[s.color] === action
    );

    if (!target) {
      target = gs.activeSpheres.find(
        (s) => !s.isDistractor && s.color !== 'red' && gs.rules[s.color] === action
      );
    }

    if (target) {
      soundFx.playSuccess();
      gs.registerInput({
        sphereId: target.id,
        action,
        reactionTime: Date.now() - target.spawnTime,
        driftMagnitude: 0,
      });
    }
  };

  const hasActiveNonRed = useGameStore((s) =>
    s.activeSpheres.some((sp) => !sp.isDistractor && sp.color !== 'red')
  );

  return (
    <div className="absolute inset-0 z-10 pointer-events-none">
      {/* ── 360 Crosshair & Reticle Target Lock ── */}
      <Crosshair360 />

      {/* ── 360 Directional Offscreen Chevrons ── */}
      <OffscreenPointers />

      {/* ── Top bar ── */}
      <div className="absolute top-0 left-0 right-0 flex items-center justify-between px-5 py-3">
        <div className="glass px-4 py-2.5 flex items-center gap-4">
          <span className="font-display text-xs tracking-widest" style={{ color: modeMeta.color }}>
            {modeMeta.icon} {modeMeta.label}
          </span>
          <span className="w-px h-4 bg-white/10" />
          <DiffPips n={diffLevel} color={modeMeta.color} />
          {mode === 'micro-reach' && (
            <span
              className={`px-2 py-1 rounded-full text-[10px] uppercase tracking-[0.2em] font-display border transition-all ${
                difficultyChangePulse
                  ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 scale-105 shadow-[0_0_20px_rgba(34,211,238,0.5)]'
                  : 'bg-slate-900/60 border-slate-700 text-slate-300'
              }`}
            >
              Level {microReachDifficulty}
            </span>
          )}
        </div>

        {/* Timer */}
        <div className="glass px-5 py-2.5 flex flex-col items-center">
          <span
            className={`font-display text-lg font-bold tabular-nums ${timeLeft < 15 ? 'animate-glow-pulse' : ''}`}
            style={{ color: timeLeft < 15 ? '#ff2d55' : '#e2e8f0' }}
          >
            {timeStr}
          </span>
          <div className="w-full mt-1 metric-track" style={{ width: 80 }}>
            <div
              className="metric-fill"
              style={{
                width: `${pct}%`,
                background:
                  timeLeft < 15
                    ? 'linear-gradient(90deg,#ff2d5588,#ff2d55)'
                    : 'linear-gradient(90deg,#00d4ff44,#00d4ff)',
              }}
            />
          </div>
        </div>

        {/* Pause / Stop */}
        <div className="flex items-center gap-2">
          <button
            className="pointer-events-auto glass px-4 py-2.5 flex items-center gap-2
                       text-slate-400 hover:text-white hover:border-white/20 transition-all
                       text-xs font-display tracking-widest uppercase"
            onClick={() => (paused ? resumeSession() : pauseSession())}
            aria-label={paused ? 'Resume session' : 'Pause session'}
          >
            <span className="text-base leading-none">{paused ? '▶' : '❚❚'}</span> {paused ? 'Resume' : 'Pause'}
          </button>
          <button
            className="pointer-events-auto glass px-4 py-2.5 flex items-center gap-2
                       text-slate-400 hover:text-white hover:border-white/20 transition-all
                       text-xs font-display tracking-widest uppercase"
            onClick={endSession}
          >
            <span className="text-base leading-none">■</span> Stop
          </button>
        </div>
      </div>

      {/* ── 360 Spatial Radar (Top Right) ── */}
      <div className="absolute top-18 right-5">
        <Radar360 />
      </div>

      {/* ── AI patient-state + RL action insight (Top Left) ── */}
      <AIInsightsPanel />

      {/* ── Rules Panel (Stacked on Left under AI panel, no bottom overlap) ── */}
      <div className="absolute top-52 left-5 glass px-4 py-3 animate-fade-up max-w-[210px] pointer-events-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-display">
          {mode === 'rule-switch' || mode === 'dual-task' ? '⚡ Active Rules' : 'Target Rules'}
        </p>
        <RulesLegend compact />
      </div>

      {/* ── Live Metrics (Stacked on Right under Radar, no bottom overlap) ── */}
      <div className="absolute top-54 right-5 glass px-4 py-3 min-w-[150px] animate-fade-up pointer-events-auto">
        <p className="text-[10px] uppercase tracking-widest text-slate-500 mb-2 font-display">
          Session Metrics
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Accuracy</span>
            <span
              className="font-mono font-bold"
              style={{ color: accuracy >= 80 ? '#00ff88' : accuracy >= 60 ? '#ffd60a' : '#ff2d55' }}
            >
              {accuracy}%
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Avg RT</span>
            <span
              className="font-mono font-bold"
              style={{ color: avgRT > 0 && avgRT < 450 ? '#00ff88' : avgRT < 750 ? '#ffd60a' : '#ff2d55' }}
            >
              {avgRT > 0 ? `${avgRT}ms` : '—'}
            </span>
          </div>
          <div className="flex justify-between items-center text-xs">
            <span className="text-[11px] text-slate-400 uppercase tracking-wider">Reactions</span>
            <span className="font-mono font-bold text-slate-300">{totalR}</span>
          </div>
          {fatigue > 0.5 && (
            <div className="mt-1 pt-1 border-t border-white/5 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-yellow-400 animate-pulse" />
              <span className="text-[10px] text-yellow-400 uppercase tracking-wider">Fatigue detected</span>
            </div>
          )}
        </div>
      </div>

      {/* ── Difficulty Status Pill (Top Center) ── */}
      {mode === 'micro-reach' && (
        <div
          className={`absolute top-20 left-1/2 -translate-x-1/2 z-20 px-4 py-1.5 rounded-full border text-[10px] uppercase tracking-[0.2em] font-display transition-all duration-300 ${
            difficultyChangePulse
              ? 'bg-cyan-500/20 border-cyan-400 text-cyan-200 shadow-[0_0_24px_rgba(34,211,238,0.35)]'
              : 'bg-slate-900/60 border-slate-700 text-slate-300 opacity-85'
          }`}
        >
          Difficulty {difficultyChangePulse ? 'Adaptive Shift' : 'Calibrated'} · Speed {adaptive.objectSpeed.toFixed(2)} · Delay {Math.round(adaptive.spawnDelay)}ms
        </div>
      )}

      {/* ── Accessible Patient Direct Action Bar (Above Navigation Dock) ── */}
      {hasActiveNonRed && (
        <div className="absolute bottom-20 left-1/2 -translate-x-1/2 flex items-center gap-3 pointer-events-auto z-20 animate-fade-in select-none">
          <button
            onClick={() => executePatientAction('left')}
            className="glass px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all shadow-lg flex items-center gap-2 border border-slate-700/60"
            title="Execute Swipe Left (Keyboard ←)"
          >
            <span className="text-cyan-400 text-sm">←</span> SWIPE LEFT
          </button>
          <button
            onClick={() => executePatientAction('hold')}
            className="glass px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-yellow-400 hover:bg-yellow-500/20 active:scale-95 transition-all shadow-lg flex items-center gap-2 border border-slate-700/60"
            title="Execute Hold (Spacebar)"
          >
            <span className="text-yellow-400 text-sm">⏸</span> HOLD (2s)
          </button>
          <button
            onClick={() => executePatientAction('right')}
            className="glass px-5 py-2.5 rounded-xl text-xs font-mono font-bold text-slate-200 hover:text-white hover:border-cyan-400 hover:bg-cyan-500/20 active:scale-95 transition-all shadow-lg flex items-center gap-2 border border-slate-700/60"
            title="Execute Swipe Right (Keyboard →)"
          >
            SWIPE RIGHT <span className="text-cyan-400 text-sm">→</span>
          </button>
        </div>
      )}

      {/* ── 360 Navigation Controls & Turn Bar (Bottom Center) ── */}
      <NavigationControls360 />

      {/* ── Break prompt — appears once fatigue is pronounced ── */}
      {fatigue > 0.72 && !paused && (
        <div
          className="absolute top-24 left-1/2 -translate-x-1/2 glass px-5 py-3 flex items-center gap-4 pointer-events-auto animate-fade-up z-30"
          style={{ borderColor: 'rgba(255,214,10,0.4)' }}
        >
          <span className="text-[12px] text-yellow-300 uppercase tracking-widest">
            Reaction times are slowing — consider a short break
          </span>
          <button
            className="btn-primary"
            style={{ padding: '8px 20px', fontSize: '0.62rem' }}
            onClick={pauseSession}
          >
            Pause
          </button>
        </div>
      )}

      {/* ── Paused overlay ── */}
      {paused && (
        <div
          className="absolute inset-0 flex items-center justify-center z-30 pointer-events-auto"
          style={{ background: 'rgba(3,4,10,0.72)' }}
        >
          <div className="glass-panel p-8 text-center animate-fade-up">
            <p className="font-display text-xl font-bold uppercase tracking-widest text-white mb-2">Paused</p>
            <p className="text-[12px] text-slate-400 mb-6">Timer and scoring are frozen. Take your time.</p>
            <div className="flex gap-3 justify-center">
              <button className="btn-primary" onClick={resumeSession}>Resume</button>
              <button
                className="btn-primary"
                style={{ color: '#94a3b8', borderColor: 'rgba(148,163,184,0.3)', background: 'rgba(148,163,184,0.05)' }}
                onClick={endSession}
              >
                End Session
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Countdown overlay ── */}
      {countdown !== null && (
        <div className="absolute inset-0 flex items-center justify-center z-30 pointer-events-none">
          <span
            key={countdown}
            className="font-display font-black animate-fade-up"
            style={{
              fontSize: countdown === 0 ? '5rem' : '8rem',
              color: countdown === 0 ? '#00ff88' : '#00d4ff',
              textShadow: '0 0 40px currentColor, 0 0 80px currentColor',
              letterSpacing: '0.05em',
            }}
          >
            {countdown === 0 ? 'GO!' : countdown}
          </span>
        </div>
      )}

      {/* ── Rule-switch alert (top-center) ── */}
      {ruleSwitchAlert && (
        <div
          className="absolute top-20 left-1/2 animate-rule-flash z-20 pointer-events-none"
          style={{ transform: 'translateX(-50%)' }}
        >
          <div
            className="glass px-6 py-3 border flex flex-col items-center gap-2"
            style={{
              borderColor: 'rgba(255,45,85,0.5)',
              boxShadow: '0 0 30px rgba(255,45,85,0.2)',
            }}
          >
            <span className="font-display text-xs tracking-widest uppercase" style={{ color: '#ff2d55' }}>
              ⚡ Rules Changed
            </span>
            <RulesLegend compact />
          </div>
        </div>
      )}
    </div>
  );
}
