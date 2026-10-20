import { useRef, useState, useEffect, useCallback } from 'react';
import { useFrame, type ThreeEvent } from '@react-three/fiber';
import { Float, MeshDistortMaterial, Text, Billboard } from '@react-three/drei';
import * as THREE from 'three';
import { useGameStore } from '../store/useGameStore';
import { useCameraStore } from '../store/useCameraStore';
import { useSettingsStore } from '../store/useSettingsStore';
import { soundFx } from '../utils/audio';
import type { ActiveSphere } from '../types';

const HEX: Record<string, string> = {
  green:  '#00ff88',
  blue:   '#00d4ff',
  red:    '#ff2d55',
  yellow: '#ffd60a',
};

interface Props { sphere: ActiveSphere }

export default function Sphere({ sphere }: Props) {
  const groupRef  = useRef<THREE.Group>(null);
  const meshRef   = useRef<THREE.Mesh>(null);
  const ringRef   = useRef<THREE.Mesh>(null);
  const lockRingRef = useRef<THREE.Mesh>(null);
  const [hovered, setHovered] = useState(false);
  const [flash,   setFlash]   = useState<'success' | 'error' | null>(null);

  const dragStart   = useRef<{ x: number; y: number } | null>(null);
  const dragPointerId = useRef<number | null>(null);
  const dragCaptureTarget = useRef<Element | null>(null);
  const holdTimer   = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inhibitTimer= useRef<ReturnType<typeof setTimeout> | null>(null);

  const { registerInput, registerInhibition, adaptive, rules, mode } = useGameStore();
  const focusedSphereId = useCameraStore((s) => s.focusedSphereId);
  const largeHitboxes = useSettingsStore((s) => s.largeHitboxes);
  const isTargetLocked = focusedSphereId === sphere.id;

  const col = HEX[sphere.color];
  const HINT: Record<string, string> = { left: '←', right: '→', hold: '⏸', inhibit: '✕' };
  const hint = HINT[rules[sphere.color]];

  // Red spheres: auto-register inhibition after timeout
  useEffect(() => {
    if (sphere.color !== 'red') return;
    inhibitTimer.current = setTimeout(() => {
      registerInhibition(sphere.id);
    }, 2200 / adaptive.objectSpeed);
    return () => { if (inhibitTimer.current) clearTimeout(inhibitTimer.current); };
  }, [sphere.id, sphere.color, adaptive.objectSpeed, registerInhibition]);

  const triggerFlash = (type: 'success' | 'error') => {
    setFlash(type);
    setTimeout(() => setFlash(null), 380);
  };

  const handlePointerDown = useCallback((e: ThreeEvent<PointerEvent>) => {
    if (e.button !== 0) return;
    e.stopPropagation();

    // Touching red = inhibition error
    if (sphere.color === 'red') {
      if (inhibitTimer.current) clearTimeout(inhibitTimer.current);
      triggerFlash('error');
      soundFx.playError();
      registerInput({
        sphereId: sphere.id,
        action: 'left', // any non-inhibit
        reactionTime: Date.now() - sphere.spawnTime,
        driftMagnitude: 0,
      });
      return;
    }

    const pointerId = e.pointerId;
    const captureTarget = e.nativeEvent.target;
    if (captureTarget instanceof Element) {
      captureTarget.setPointerCapture(pointerId);
      dragCaptureTarget.current = captureTarget;
    }
    dragPointerId.current = pointerId;
    dragStart.current = { x: e.clientX, y: e.clientY };

    const finish = () => {
      if (dragPointerId.current !== pointerId) return;
      if (dragCaptureTarget.current?.hasPointerCapture(pointerId)) {
        dragCaptureTarget.current.releasePointerCapture(pointerId);
      }
      dragCaptureTarget.current = null;
      dragPointerId.current = null;
      dragStart.current = null;
      if (holdTimer.current) clearTimeout(holdTimer.current);
      window.removeEventListener('pointermove', onMove);
      window.removeEventListener('pointerup', onEnd);
      window.removeEventListener('pointercancel', onEnd);
    };

    const onMove = (event: PointerEvent) => {
      if (event.pointerId !== pointerId || !dragStart.current) return;
      if (sphere.color === 'yellow') return;
      const dx = event.clientX - dragStart.current.x;
      if (Math.abs(dx) < 18) return;

      const action = dx < 0 ? 'left' : 'right';
      const drift = Math.abs(event.clientY - dragStart.current.y) / window.innerHeight;
      triggerFlash('success');
      soundFx.playSuccess();
      registerInput({
        sphereId: sphere.id,
        action,
        reactionTime: Date.now() - sphere.spawnTime,
        driftMagnitude: drift * 2,
      });
      finish();
    };

    const onEnd = (event: PointerEvent) => {
      if (event.pointerId === pointerId) finish();
    };

    window.addEventListener('pointermove', onMove);
    window.addEventListener('pointerup', onEnd);
    window.addEventListener('pointercancel', onEnd);

    // Yellow: hold for 2 s
    if (sphere.color === 'yellow') {
      holdTimer.current = setTimeout(() => {
        triggerFlash('success');
        soundFx.playSuccess();
        registerInput({
          sphereId: sphere.id,
          action: 'hold',
          reactionTime: Date.now() - sphere.spawnTime,
          driftMagnitude: 0,
        });
        finish();
      }, 2000);
    }
  }, [sphere, registerInput]);

  // Animate position along 3D trajectory (if moving) + scale + ring rotation
  useFrame((state) => {
    // 3D trajectory orbit in 360 space
    if (groupRef.current && (sphere.orbitSpeed || mode === 'micro-trajectory')) {
      const elapsed = (Date.now() - sphere.spawnTime) / 1000;
      const speed = sphere.orbitSpeed ?? 0.22 * adaptive.objectSpeed;
      const curAzimuth = (sphere.azimuth ?? 0) + speed * elapsed;
      const elev = sphere.elevation ?? 0;
      const dist = sphere.distance ?? 6.5;
      groupRef.current.position.set(
        dist * Math.cos(elev) * Math.sin(curAzimuth),
        dist * Math.sin(elev),
        -dist * Math.cos(elev) * Math.cos(curAzimuth)
      );
    }

    if (!meshRef.current) return;
    const scaleMul = largeHitboxes ? 1.25 : 1.0;
    const base = adaptive.targetSize * 0.72 * scaleMul;
    const target = isTargetLocked ? base * 1.25 : hovered ? base * 1.15 : base;
    meshRef.current.scale.lerp(new THREE.Vector3(target, target, target), 0.15);

    if (ringRef.current) {
      ringRef.current.rotation.z += 0.012;
      const rt = flash === 'success' ? 0.95 : flash === 'error' ? 0.6 : isTargetLocked ? 0.9 : hovered ? 0.75 : 0.4;
      (ringRef.current.material as THREE.MeshStandardMaterial).opacity =
        THREE.MathUtils.lerp(
          (ringRef.current.material as THREE.MeshStandardMaterial).opacity,
          rt,
          0.15
        );
    }

    if (lockRingRef.current) {
      lockRingRef.current.rotation.z -= 0.02;
      const targetOp = isTargetLocked ? 0.85 : 0;
      (lockRingRef.current.material as THREE.MeshStandardMaterial).opacity =
        THREE.MathUtils.lerp(
          (lockRingRef.current.material as THREE.MeshStandardMaterial).opacity,
          targetOp,
          0.2
        );
    }

    // Subtle breathing wobble
    meshRef.current.rotation.y = Math.sin(state.clock.elapsedTime * 0.8 + sphere.spawnTime) * 0.15;
  });

  const emissiveInt = flash === 'success' ? 4.0 : flash === 'error' ? 0.2 : isTargetLocked ? 2.6 : hovered ? 2.0 : 1.1;
  const distort     = isTargetLocked ? 0.35 : hovered ? 0.3 : 0.12;

  return (
    <Float speed={1.2 * adaptive.objectSpeed} rotationIntensity={0.12} floatIntensity={0.5}>
      <group ref={groupRef} position={sphere.position}>
        {/* Glow point light */}
        <pointLight
          color={col}
          intensity={isTargetLocked ? 7 : hovered ? 5 : 3}
          distance={8}
          decay={2}
        />

        {/* Main sphere mesh */}
        <mesh
          ref={meshRef}
          onPointerDown={handlePointerDown}
          onPointerEnter={() => setHovered(true)}
          onPointerLeave={() => setHovered(false)}
        >
          <sphereGeometry args={[1, 64, 64]} />
          <MeshDistortMaterial
            color={col}
            emissive={col}
            emissiveIntensity={emissiveInt}
            distort={distort}
            speed={isTargetLocked ? 4 : hovered ? 3.5 : 1.6}
            roughness={0.06}
            metalness={0.28}
          />
        </mesh>

        {/* Outer orbital ring */}
        <mesh ref={ringRef} rotation={[Math.PI / 2.4, 0.3, 0]}>
          <torusGeometry args={[0.95, 0.022, 12, 80]} />
          <meshStandardMaterial
            color={col}
            emissive={col}
            emissiveIntensity={isTargetLocked ? 2.2 : 1.3}
            transparent
            opacity={0.4}
          />
        </mesh>

        {/* Lock-on reticle ring when targeted in 360 space */}
        <mesh ref={lockRingRef} rotation={[0, 0, 0]}>
          <torusGeometry args={[1.25, 0.018, 8, 48]} />
          <meshStandardMaterial
            color="#00d4ff"
            emissive="#00d4ff"
            emissiveIntensity={2.5}
            transparent
            opacity={0}
          />
        </mesh>

        {/* Distractor marker – faint red X overlay */}
        {sphere.isDistractor && (
          <mesh position={[0, 0, 0.7]}>
            <ringGeometry args={[0.24, 0.3, 4]} />
            <meshBasicMaterial color="#ff2d55" transparent opacity={0.65} />
          </mesh>
        )}

        {/* Action hint — billboarded so it always faces player from any 360 angle */}
        <Billboard>
          <Text
            position={[0, 0, 0.85]}
            fontSize={0.38}
            color={col}
            anchorX="center"
            anchorY="middle"
            outlineWidth={0.04}
            outlineColor="#000000"
          >
            {hint}
          </Text>
        </Billboard>
      </group>
    </Float>
  );
}
