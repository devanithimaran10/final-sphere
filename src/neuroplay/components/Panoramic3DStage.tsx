import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, Grid } from '@react-three/drei';
import * as THREE from 'three';
import {
  Compass,
  Maximize2,
  Minimize2,
  RotateCcw,
  Sparkles as SparklesIcon,
  ChevronLeft,
  Activity,
  Play,
  Pause,
} from 'lucide-react';
import type { DifficultyLevel, GameId } from '../types';
import { DOMAIN_LABEL, GAME_META } from '../types';
import { DifficultyDots } from './GameFrame';
import { fatigueBand } from '../engine/fatigueEngine';

import wordBg from '../../assets/word_recall_bg.jpg';
import patternBg from '../../assets/pattern_recall_bg.jpg';
import sceneBg from '../../assets/scene_memory_bg.jpg';
import focusBg from '../../assets/focus_finder_bg.jpg';
import sequenceBg from '../../assets/sequence_master_bg.jpg';
import ruleBg from '../../assets/rule_switch_bg.jpg';
import quickBg from '../../assets/quick_response_bg.jpg';

export const GAME_360_CONFIG: Record<GameId, { bg: string; color: string; label: string }> = {
  'word-recall': { bg: wordBg, color: '#2dd4bf', label: 'Verbal Memory' },
  'pattern-recall': { bg: patternBg, color: '#818cf8', label: 'Visual Memory' },
  'scene-memory': { bg: sceneBg, color: '#ec4899', label: 'Object Memory' },
  'focus-finder': { bg: focusBg, color: '#38bdf8', label: 'Selective Attention' },
  'sequence-master': { bg: sequenceBg, color: '#a855f7', label: 'Working Memory' },
  'rule-switch': { bg: ruleBg, color: '#eab308', label: 'Cognitive Flexibility' },
  'quick-response': { bg: quickBg, color: '#ef4444', label: 'Processing Speed' },
};

function getCardinal(deg: number): string {
  const dirs = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
  const index = Math.round((((deg % 360) + 360) % 360) / 45) % 8;
  return dirs[index];
}

// 360° Interior Sky Sphere textured with the game's high-res environment image
function SkyPanoramaSphere({ textureUrl, themeColor }: { textureUrl: string; themeColor: string }) {
  const [texture, setTexture] = useState<THREE.Texture | null>(null);

  useEffect(() => {
    let active = true;
    const loader = new THREE.TextureLoader();
    loader.load(textureUrl, (tex) => {
      if (!active) return;
      tex.wrapS = THREE.RepeatWrapping;
      tex.wrapT = THREE.ClampToEdgeWrapping;
      tex.repeat.set(2, 1);
      tex.colorSpace = THREE.SRGBColorSpace;
      tex.needsUpdate = true;
      setTexture(tex);
    });
    return () => {
      active = false;
    };
  }, [textureUrl]);

  return (
    <group>
      {texture && (
        <mesh scale={[-1, 1, 1]}>
          <sphereGeometry args={[95, 48, 32]} />
          <meshBasicMaterial map={texture} side={THREE.BackSide} />
        </mesh>
      )}

      {/* Atmospheric color tint dome */}
      <mesh scale={[-1, 1, 1]}>
        <sphereGeometry args={[92, 32, 24]} />
        <meshBasicMaterial
          color={themeColor}
          transparent
          opacity={0.09}
          side={THREE.BackSide}
        />
      </mesh>
    </group>
  );
}

// 4-point orbiting ambient mood lights for 360-degree depth
function Ambient360Lights({ themeColor }: { themeColor: string }) {
  const lNorth = useRef<THREE.PointLight>(null);
  const lEast = useRef<THREE.PointLight>(null);
  const lSouth = useRef<THREE.PointLight>(null);
  const lWest = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const r = 12;

    if (lNorth.current) {
      lNorth.current.position.set(Math.sin(t * 0.2) * r, Math.cos(t * 0.25) * 3 + 1, -Math.cos(t * 0.2) * r);
    }
    if (lEast.current) {
      lEast.current.position.set(Math.cos(t * 0.18) * r, Math.sin(t * 0.22) * 3 + 1, Math.sin(t * 0.18) * r);
    }
    if (lSouth.current) {
      lSouth.current.position.set(-Math.sin(t * 0.22) * r, Math.cos(t * 0.2) * 3 + 1, Math.cos(t * 0.22) * r);
    }
    if (lWest.current) {
      lWest.current.position.set(-Math.cos(t * 0.24) * r, Math.sin(t * 0.28) * 3 + 1, -Math.sin(t * 0.24) * r);
    }
  });

  return (
    <>
      <pointLight ref={lNorth} color={themeColor} intensity={0.65} distance={24} decay={2} />
      <pointLight ref={lEast} color="#38bdf8" intensity={0.5} distance={24} decay={2} />
      <pointLight ref={lSouth} color="#a855f7" intensity={0.45} distance={24} decay={2} />
      <pointLight ref={lWest} color="#fbbf24" intensity={0.4} distance={24} decay={2} />
    </>
  );
}

// 360-degree holographic floor platform with cardinal markers
function ArenaPlatformDeck({ themeColor }: { themeColor: string }) {
  return (
    <group position={[0, -2.8, 0]}>
      {/* Outer observation ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[4.2, 4.4, 64]} />
        <meshBasicMaterial color={themeColor} transparent opacity={0.45} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner cyber platform ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.8, 1.95, 48]} />
        <meshBasicMaterial color="#38bdf8" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Cardinal direction floor markers (0° N, 90° E, 180° S, 270° W) */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.sin(angle) * 4.3, 0.02, -Math.cos(angle) * 4.3]}
          rotation={[-Math.PI / 2, 0, -angle]}
        >
          <planeGeometry args={[0.35, 0.1]} />
          <meshBasicMaterial color={themeColor} transparent opacity={0.9} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Infinite floor grid extending into space */}
      <Grid
        args={[60, 60]}
        position={[0, -0.05, 0]}
        cellSize={1.4}
        cellThickness={0.35}
        cellColor="#06121f"
        sectionSize={5.6}
        sectionThickness={0.7}
        sectionColor={themeColor}
        fadeDistance={34}
        fadeStrength={1.7}
        followCamera={false}
        infiniteGrid
      />
    </group>
  );
}

// Camera rig that smoothly tracks yaw and pitch, with continuous 360° support
function Camera360Rig({
  yawRef,
  pitchRef,
  autoOrbit,
  onHeadingChange,
}: {
  yawRef: React.MutableRefObject<number>;
  pitchRef: React.MutableRefObject<number>;
  autoOrbit: boolean;
  onHeadingChange: (deg: number, pitchDeg: number) => void;
}) {
  const { camera } = useThree();
  const curYaw = useRef(yawRef.current);
  const curPitch = useRef(pitchRef.current);
  const lastDeg = useRef(-1);

  useFrame((_, delta) => {
    if (autoOrbit) {
      yawRef.current += delta * 0.08;
    }

    const lerpRate = Math.min(1, delta * 12);
    curYaw.current = THREE.MathUtils.lerp(curYaw.current, yawRef.current, lerpRate);
    curPitch.current = THREE.MathUtils.lerp(curPitch.current, pitchRef.current, lerpRate);

    camera.rotation.order = 'YXZ';
    camera.rotation.y = -curYaw.current;
    camera.rotation.x = curPitch.current;
    camera.rotation.z = 0;
    camera.position.set(0, 0, 0);

    const deg = Math.round((((curYaw.current * 180 / Math.PI) % 360) + 360) % 360);
    const pDeg = Math.round(curPitch.current * 180 / Math.PI);
    if (deg !== lastDeg.current) {
      lastDeg.current = deg;
      onHeadingChange(deg, pDeg);
    }
  });

  return null;
}

export interface Panoramic3DStageProps {
  gameId: GameId;
  difficulty: DifficultyLevel;
  trialCount: number;
  fatigueLevel: number;
  phase: 'intro' | 'countdown' | 'playing' | 'results';
  onExit: () => void;
  onEndEarly?: () => void;
  children: ReactNode;
}

export function Panoramic3DStage({
  gameId,
  difficulty,
  trialCount,
  fatigueLevel,
  phase,
  onExit,
  onEndEarly,
  children,
}: Panoramic3DStageProps) {
  const meta = GAME_META[gameId];
  const config = GAME_360_CONFIG[gameId] ?? { bg: wordBg, color: '#2dd4bf', label: 'Cognitive' };

  const yawRef = useRef(0);
  const pitchRef = useRef(0);
  const [headingDeg, setHeadingDeg] = useState(0);
  const [pitchDeg, setPitchDeg] = useState(0);
  const [autoOrbit, setAutoOrbit] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const isDraggingRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);

  // Fullscreen change listener
  useEffect(() => {
    const onFsChange = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', onFsChange);
    return () => document.removeEventListener('fullscreenchange', onFsChange);
  }, []);

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
    } else {
      document.exitFullscreen().catch(() => {});
    }
  };

  // Keyboard navigation for 360 turning
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'ArrowLeft' || e.key === 'a' || e.key === 'A') {
        yawRef.current -= 0.06;
      } else if (e.key === 'ArrowRight' || e.key === 'd' || e.key === 'D') {
        yawRef.current += 0.06;
      } else if (e.key === 'ArrowUp' || e.key === 'w' || e.key === 'W') {
        pitchRef.current = Math.min(0.55, pitchRef.current + 0.04);
      } else if (e.key === 'ArrowDown' || e.key === 's' || e.key === 'S') {
        pitchRef.current = Math.max(-0.55, pitchRef.current - 0.04);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Pointer drag on stage background
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    const target = e.target as HTMLElement;
    // Don't intercept clicks on interactive buttons, cards, or inputs
    if (target.closest('button, a, input, select, [role="button"], .np-interactive')) return;

    isDraggingRef.current = true;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
    (e.currentTarget as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDraggingRef.current || !lastPointerRef.current) return;
    const dx = e.clientX - lastPointerRef.current.x;
    const dy = e.clientY - lastPointerRef.current.y;
    lastPointerRef.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.0035;
    yawRef.current += dx * sensitivity;
    pitchRef.current = Math.max(-0.55, Math.min(0.55, pitchRef.current + dy * sensitivity));
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDraggingRef.current = false;
    lastPointerRef.current = null;
    try {
      (e.currentTarget as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const snapYaw = (deltaRad: number) => {
    yawRef.current += deltaRad;
  };

  const resetView = () => {
    yawRef.current = 0;
    pitchRef.current = 0;
  };

  // Dynamic parallax tilt for the foreground 3D game stage
  const foregroundTransform = useMemo(() => {
    const tiltX = pitchDeg * 0.35;
    const tiltY = -Math.sin(yawRef.current) * 10;
    return `perspective(1200px) rotateX(${tiltX.toFixed(2)}deg) rotateY(${tiltY.toFixed(2)}deg)`;
  }, [pitchDeg]);

  return (
    <div
      className="fixed inset-0 w-screen h-screen z-50 bg-[#02050e] overflow-hidden select-none touch-none flex flex-col"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      {/* ── 3D THREE.JS 360° CANVAS BACKGROUND ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <Canvas
          camera={{ position: [0, 0, 0], fov: 68, near: 0.1, far: 500 }}
          gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          style={{ width: '100%', height: '100%' }}
        >
          {/* 360 Camera Tracking Rig */}
          <Camera360Rig
            yawRef={yawRef}
            pitchRef={pitchRef}
            autoOrbit={autoOrbit}
            onHeadingChange={(deg, p) => {
              setHeadingDeg(deg);
              setPitchDeg(p);
            }}
          />

          {/* Lighting */}
          <ambientLight intensity={0.12} />
          <hemisphereLight args={['#0c1b33', '#000000', 0.25]} />
          <Ambient360Lights themeColor={config.color} />

          {/* 360 Sky Sphere with Game-Specific Image */}
          <SkyPanoramaSphere textureUrl={config.bg} themeColor={config.color} />

          {/* 360 Celestial Starfield */}
          <Stars radius={85} depth={30} count={3200} factor={4} fade speed={0.7} saturation={0.2} />

          {/* 360 Orbiting Floating Sparkles in theme color */}
          <Sparkles
            count={90}
            scale={[45, 24, 45]}
            size={2.2}
            speed={0.25}
            color={config.color}
            opacity={0.35}
          />
          <Sparkles
            count={50}
            scale={[40, 20, 40]}
            size={1.6}
            speed={0.15}
            color="#ffffff"
            opacity={0.25}
          />

          {/* 360 Holographic Platform & Cardinal Floor Markers */}
          <ArenaPlatformDeck themeColor={config.color} />
        </Canvas>
      </div>

      {/* Subtle vignette border gradient to frame the 360 scene */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background: 'radial-gradient(circle at center, transparent 45%, rgba(2, 5, 14, 0.6) 100%)',
        }}
      />

      {/* ── TOP FLOATING 360° CYBER HUD ── */}
      <header className="relative z-30 pointer-events-auto px-4 py-3 flex items-center justify-between gap-3 border-b border-white/10 bg-slate-950/70 backdrop-blur-xl shadow-2xl">
        {/* Left: Exit button & Game info */}
        <div className="flex items-center gap-3">
          <button
            onClick={onExit}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-300 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all shadow-md"
            title="Exit game to dashboard"
          >
            <ChevronLeft size={16} />
            <span>Exit Game</span>
          </button>

          <div className="hidden sm:flex flex-col">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full animate-pulse" style={{ background: config.color }} />
              <span className="text-sm font-bold text-slate-100 tracking-wide font-orbitron">{meta.name}</span>
            </div>
            <span className="text-[11px] uppercase tracking-wider text-teal-400 font-semibold font-mono">
              {DOMAIN_LABEL[meta.domain]}
            </span>
          </div>
        </div>

        {/* Center: 360° Panoramic Compass Widget */}
        <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/60 border border-cyan-500/30 text-xs font-mono shadow-[0_0_15px_rgba(0,212,255,0.15)]">
          <Compass size={14} className="text-cyan-400 animate-spin" style={{ animationDuration: '14s' }} />
          <span className="text-slate-400 font-semibold hidden md:inline">360° VIEW:</span>
          <span className="text-cyan-300 font-bold tracking-wider">
            {headingDeg.toString().padStart(3, '0')}° {getCardinal(headingDeg)}
          </span>

          {/* Quick preset buttons */}
          <div className="flex items-center gap-1 ml-2 border-l border-white/10 pl-2">
            <button
              onClick={() => snapYaw(-Math.PI / 4)}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-white/10"
              title="Turn 45° Left"
            >
              ↶ 45°
            </button>
            <button
              onClick={resetView}
              className="px-1.5 py-0.5 rounded text-[10px] text-cyan-400 hover:text-cyan-200 hover:bg-cyan-500/20"
              title="Snap to 0° Front"
            >
              0° Front
            </button>
            <button
              onClick={() => snapYaw(Math.PI / 4)}
              className="px-1.5 py-0.5 rounded text-[10px] text-slate-400 hover:text-white hover:bg-white/10"
              title="Turn 45° Right"
            >
              45° ↷
            </button>
            <button
              onClick={() => snapYaw(Math.PI)}
              className="px-1.5 py-0.5 rounded text-[10px] text-purple-400 hover:text-purple-200 hover:bg-purple-500/20"
              title="Turn 180° Rear"
            >
              180°
            </button>
          </div>
        </div>

        {/* Right: Controls, Stats, Fullscreen toggle */}
        <div className="flex items-center gap-2">
          {/* Auto-Orbit 360° Toggle */}
          <button
            onClick={() => setAutoOrbit((o) => !o)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-xl text-xs font-mono transition-all ${
              autoOrbit
                ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_12px_rgba(0,212,255,0.2)]'
                : 'text-slate-400 hover:text-white bg-white/5 border border-white/10'
            }`}
            title={autoOrbit ? 'Auto-Orbit 360 Active (Click to Pause)' : 'Enable Continuous 360° Auto-Orbit'}
          >
            {autoOrbit ? <Pause size={12} /> : <Play size={12} />}
            <span className="hidden lg:inline">{autoOrbit ? 'Orbit ON' : 'Orbit OFF'}</span>
          </button>

          {/* Reset Camera View button */}
          <button
            onClick={resetView}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 active:scale-95 transition-all"
            title="Reset 360° Camera View"
          >
            <RotateCcw size={14} />
          </button>

          {/* Fullscreen Toggle */}
          <button
            onClick={toggleFullscreen}
            className={`p-1.5 rounded-xl transition-all ${
              isFullscreen
                ? 'bg-teal-500/20 text-teal-300 border border-teal-500/40'
                : 'text-slate-400 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10'
            }`}
            title={isFullscreen ? 'Exit Fullscreen' : 'Enter Fullscreen (3D Fullscreen Experience)'}
          >
            {isFullscreen ? <Minimize2 size={14} /> : <Maximize2 size={14} />}
          </button>

          {/* Game Status Badges */}
          {phase === 'playing' && (
            <div className="hidden sm:flex items-center gap-3 border-l border-white/10 pl-3 text-xs font-mono text-slate-300">
              <span className="flex items-center gap-1.5">
                <span className="text-slate-400">LVL</span>
                <DifficultyDots level={difficulty} />
              </span>
              <span className="text-slate-400">
                TRIAL: <strong className="text-slate-100">{trialCount}</strong>
              </span>
              {fatigueLevel >= 35 && (
                <span className={`flex items-center gap-1 ${fatigueLevel >= 65 ? 'text-amber-400' : 'text-slate-400'}`}>
                  <Activity size={12} />
                  {fatigueBand(fatigueLevel)}
                </span>
              )}
              {onEndEarly && (
                <button
                  onClick={onEndEarly}
                  className="px-2 py-1 rounded-lg text-[11px] text-amber-400 hover:text-amber-200 bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 transition-all ml-1"
                >
                  End Session
                </button>
              )}
            </div>
          )}
        </div>
      </header>

      {/* ── CENTER FOREGROUND 3D GAME STAGE ── */}
      <main className="relative z-10 flex-1 w-full h-full flex flex-col items-center justify-center pointer-events-none p-4 md:p-8 overflow-y-auto">
        <div
          className="w-full max-w-4xl flex items-center justify-center transition-transform duration-100 ease-out"
          style={{
            transform: foregroundTransform,
            transformStyle: 'preserve-3d',
          }}
        >
          <div className="w-full pointer-events-auto">
            {children}
          </div>
        </div>
      </main>

      {/* ── BOTTOM SUBTLE 360 HINT ── */}
      <footer className="relative z-20 pointer-events-none pb-2 text-center">
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-black/40 border border-white/5 text-[11px] font-mono text-slate-400 backdrop-blur-md">
          <SparklesIcon size={12} className="text-cyan-400" />
          <span>Drag screen to rotate 360° · A/D to turn · Fullscreen 3D active</span>
        </span>
      </footer>
    </div>
  );
}
