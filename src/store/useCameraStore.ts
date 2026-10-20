import { create } from 'zustand';

export function normalizeAngle(angle: number): number {
  let a = angle % (2 * Math.PI);
  if (a > Math.PI) a -= 2 * Math.PI;
  if (a < -Math.PI) a += 2 * Math.PI;
  return a;
}

interface CameraStore {
  yaw: number;
  pitch: number;
  targetYaw: number;
  targetPitch: number;
  freeLook: boolean;
  gyroActive: boolean;
  focusedSphereId: string | null;

  rotateBy: (deltaYaw: number, deltaPitch: number) => void;
  snapTo: (targetYaw: number, targetPitch?: number) => void;
  snapToRelative: (deltaYaw: number) => void;
  lookAtSphere: (azimuth: number, elevation?: number) => void;
  setFreeLook: (enabled: boolean) => void;
  setGyroActive: (enabled: boolean) => void;
  setFocusedSphereId: (id: string | null) => void;
  updateSmoothed: (yaw: number, pitch: number) => void;
  reset: () => void;
}

export const useCameraStore = create<CameraStore>((set, get) => ({
  yaw: 0,
  pitch: 0,
  targetYaw: 0,
  targetPitch: 0,
  freeLook: false,
  gyroActive: false,
  focusedSphereId: null,

  rotateBy: (deltaYaw, deltaPitch) => {
    const { targetYaw, targetPitch } = get();
    // Clamped to +/- 0.45 rad (~25 deg) for stable, vertigo-free patient comfort
    const newPitch = Math.max(-0.45, Math.min(0.45, targetPitch + deltaPitch));
    set({
      targetYaw: targetYaw + deltaYaw,
      targetPitch: newPitch,
    });
  },

  snapTo: (newTargetYaw, newTargetPitch) => {
    const { targetYaw, targetPitch } = get();
    // Use shortest angular difference so camera doesn't spin wildly
    const diff = normalizeAngle(newTargetYaw - targetYaw);
    set({
      targetYaw: targetYaw + diff,
      targetPitch: newTargetPitch !== undefined ? newTargetPitch : targetPitch,
    });
  },

  snapToRelative: (deltaYaw) => {
    const { targetYaw } = get();
    set({ targetYaw: targetYaw + deltaYaw });
  },

  lookAtSphere: (azimuth, elevation = 0) => {
    get().snapTo(azimuth, elevation);
  },

  setFreeLook: (freeLook) => set({ freeLook }),
  setGyroActive: (gyroActive) => set({ gyroActive }),
  setFocusedSphereId: (focusedSphereId) => set({ focusedSphereId }),

  updateSmoothed: (yaw, pitch) => set({ yaw, pitch }),

  reset: () =>
    set({
      yaw: 0,
      pitch: 0,
      targetYaw: 0,
      targetPitch: 0,
      freeLook: false,
      gyroActive: false,
      focusedSphereId: null,
    }),
}));
