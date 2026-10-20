import { useRef, useEffect } from 'react';
import { Canvas, useFrame, useThree } from '@react-three/fiber';
import { Stars, Sparkles, Grid } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { useCameraStore } from '../store/useCameraStore';
import Sphere from './Sphere';

// 4-point 360-degree ambient mood lights orbiting the arena
function Ambient360Lights() {
  const lNorth = useRef<THREE.PointLight>(null);
  const lEast  = useRef<THREE.PointLight>(null);
  const lSouth = useRef<THREE.PointLight>(null);
  const lWest  = useRef<THREE.PointLight>(null);

  useFrame(({ clock }) => {
    const t = clock.elapsedTime;
    const r = 9;

    if (lNorth.current) {
      lNorth.current.position.set(Math.sin(t * 0.25) * r, Math.cos(t * 0.3) * 2 + 1, -Math.cos(t * 0.25) * r);
    }
    if (lEast.current) {
      lEast.current.position.set(Math.cos(t * 0.22) * r, Math.sin(t * 0.28) * 2 + 1, Math.sin(t * 0.22) * r);
    }
    if (lSouth.current) {
      lSouth.current.position.set(-Math.sin(t * 0.2) * r, Math.cos(t * 0.24) * 2 + 1, Math.cos(t * 0.2) * r);
    }
    if (lWest.current) {
      lWest.current.position.set(-Math.cos(t * 0.26) * r, Math.sin(t * 0.32) * 2 + 1, -Math.sin(t * 0.26) * r);
    }
  });

  return (
    <>
      <pointLight ref={lNorth} color="#00d4ff" intensity={0.45} distance={20} decay={2} />
      <pointLight ref={lEast}  color="#7b2fff" intensity={0.4} distance={20} decay={2} />
      <pointLight ref={lSouth} color="#ff2d55" intensity={0.35} distance={20} decay={2} />
      <pointLight ref={lWest}  color="#ffd60a" intensity={0.4} distance={20} decay={2} />
    </>
  );
}

// 360-degree holographic arena platform & deck geometry
function ArenaPlatform() {
  return (
    <group position={[0, -2.6, 0]}>
      {/* Outer observation deck ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[3.8, 4.0, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.35} side={THREE.DoubleSide} />
      </mesh>

      {/* Inner cyber platform ring */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[1.6, 1.75, 48]} />
        <meshBasicMaterial color="#7b2fff" transparent opacity={0.4} side={THREE.DoubleSide} />
      </mesh>

      {/* Cardinal orientation markers on floor (0°, 90°, 180°, 270°) */}
      {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, i) => (
        <mesh
          key={i}
          position={[Math.sin(angle) * 3.9, 0.02, -Math.cos(angle) * 3.9]}
          rotation={[-Math.PI / 2, 0, -angle]}
        >
          <planeGeometry args={[0.3, 0.08]} />
          <meshBasicMaterial color="#00ff88" transparent opacity={0.8} side={THREE.DoubleSide} />
        </mesh>
      ))}

      {/* Floor grid extending into deep space */}
      <Grid
        args={[60, 60]}
        position={[0, -0.05, 0]}
        cellSize={1.5}
        cellThickness={0.4}
        cellColor="#0a2030"
        sectionSize={6}
        sectionThickness={0.8}
        sectionColor="#00d4ff"
        fadeDistance={32}
        fadeStrength={1.8}
        followCamera={false}
        infiniteGrid
      />
    </group>
  );
}

// Overhead celestial ceiling ring for vertical depth
function CelestialRing() {
  return (
    <group position={[0, 4.5, 0]} rotation={[Math.PI / 2, 0, 0]}>
      <mesh>
        <ringGeometry args={[5.6, 5.75, 64]} />
        <meshBasicMaterial color="#00d4ff" transparent opacity={0.25} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
}

// 360 camera rig: controls smooth rotation, menu panorama, and line-of-sight target locking
function CameraRig() {
  const { camera } = useThree();
  const phase = useGameStore((s) => s.phase);
  const activeSpheres = useGameStore((s) => s.activeSpheres);

  const targetYaw = useCameraStore((s) => s.targetYaw);
  const targetPitch = useCameraStore((s) => s.targetPitch);
  const updateSmoothed = useCameraStore((s) => s.updateSmoothed);
  const rotateBy = useCameraStore((s) => s.rotateBy);
  const setFocusedSphereId = useCameraStore((s) => s.setFocusedSphereId);

  const curYawRef = useRef(0);
  const curPitchRef = useRef(0);

  useFrame((state, delta) => {
    // 1. In menu phase: gentle cinematic 360 panoramic rotation
    if (phase === 'menu') {
      rotateBy(delta * 0.12, Math.sin(state.clock.elapsedTime * 0.4) * 0.0003);
    }

    // 2. Smoothly lerp towards target yaw and pitch
    const lerpRate = Math.min(1, delta * 14);
    curYawRef.current = THREE.MathUtils.lerp(curYawRef.current, targetYaw, lerpRate);
    curPitchRef.current = THREE.MathUtils.lerp(curPitchRef.current, targetPitch, lerpRate);
    updateSmoothed(curYawRef.current, curPitchRef.current);

    // 3. Apply to Three.js camera (order: YXZ)
    camera.rotation.order = 'YXZ';
    camera.rotation.y = -curYawRef.current;
    camera.rotation.x = curPitchRef.current;
    camera.rotation.z = 0;
    camera.position.set(0, 0, 0);

    // 4. Compute camera forward vector for crosshair targeting
    const forward = new THREE.Vector3(
      Math.cos(curPitchRef.current) * Math.sin(curYawRef.current),
      Math.sin(curPitchRef.current),
      -Math.cos(curPitchRef.current) * Math.cos(curYawRef.current)
    ).normalize();

    // 5. Test which active sphere is centered in line of sight (cone ~16 degrees)
    let bestSphereId: string | null = null;
    let maxDot = 0.96; // cos(16 deg) ~= 0.961

    for (const s of activeSpheres) {
      const sVec = new THREE.Vector3(...s.position).normalize();
      const dot = forward.dot(sVec);
      if (dot > maxDot) {
        maxDot = dot;
        bestSphereId = s.id;
      }
    }

    setFocusedSphereId(bestSphereId);
  });

  return null;
}

function SceneContent() {
  const activeSpheres = useGameStore((s) => s.activeSpheres);

  return (
    <>
      {/* 360 Camera Rig */}
      <CameraRig />

      {/* Lighting */}
      <ambientLight intensity={0.08} />
      <hemisphereLight args={['#0a1628', '#000000', 0.2]} />
      <Ambient360Lights />

      {/* 360 Deep Celestial Starfield */}
      <Stars radius={160} depth={80} count={5500} factor={4} saturation={0.15} fade speed={0.7} />

      {/* Floating 360 cosmic dust particles */}
      <Sparkles count={120} scale={[36, 24, 36]} size={1.8} speed={0.2} color="#00d4ff" opacity={0.25} />
      <Sparkles count={80} scale={[36, 24, 36]} size={1.5} speed={0.15} color="#7b2fff" opacity={0.2} />

      {/* 360 Arena Geometry */}
      <ArenaPlatform />
      <CelestialRing />

      {/* 360 Active Spheres */}
      {activeSpheres.map((s) => (
        <Sphere key={s.id} sphere={s} />
      ))}
    </>
  );
}

export default function Scene() {
  const rotateBy = useCameraStore((s) => s.rotateBy);
  const freeLook = useCameraStore((s) => s.freeLook);
  const isDragging = useRef(false);
  const lastPointer = useRef<{ x: number; y: number } | null>(null);

  // Drag-to-look handlers on background canvas
  const handlePointerDown = (e: React.PointerEvent) => {
    if (e.button !== 0) return;
    isDragging.current = true;
    lastPointer.current = { x: e.clientX, y: e.clientY };
    (e.target as HTMLElement).setPointerCapture?.(e.pointerId);
  };

  const handlePointerMove = (e: React.PointerEvent) => {
    if (!isDragging.current || !lastPointer.current) return;
    const dx = e.clientX - lastPointer.current.x;
    const dy = e.clientY - lastPointer.current.y;
    lastPointer.current = { x: e.clientX, y: e.clientY };

    const sensitivity = 0.0035;
    rotateBy(dx * sensitivity, dy * sensitivity);
  };

  const handlePointerUp = (e: React.PointerEvent) => {
    isDragging.current = false;
    lastPointer.current = null;
    try {
      (e.target as HTMLElement).releasePointerCapture?.(e.pointerId);
    } catch {
      // Ignored if capture already lost
    }
  };

  // Pointer lock (free look) mousemove listener
  useEffect(() => {
    if (!freeLook) return;

    const handleMouseMove = (e: MouseEvent) => {
      const sensitivity = 0.003;
      rotateBy(e.movementX * sensitivity, e.movementY * sensitivity);
    };

    document.addEventListener('mousemove', handleMouseMove);
    return () => document.removeEventListener('mousemove', handleMouseMove);
  }, [freeLook, rotateBy]);

  return (
    <div
      className="absolute inset-0 w-full h-full z-0 touch-none select-none"
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
    >
      <Canvas
        camera={{ position: [0, 0, 0], fov: 65, near: 0.1, far: 500 }}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        style={{ background: '#020308', width: '100%', height: '100%' }}
      >
        <SceneContent />
      </Canvas>
    </div>
  );
}
