import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type TextScale = 'normal' | 'large' | 'xlarge';
export const SESSION_LENGTHS = [60, 90, 120, 150] as const;
export type SessionLength = typeof SESSION_LENGTHS[number];

interface SettingsStore {
  textScale: TextScale;
  highContrast: boolean;
  reducedMotion: boolean;
  relaxedPace: boolean;
  clarityMode: boolean;
  sessionLength: SessionLength;
  tapToSelect: boolean;
  soundEnabled: boolean;
  patientComfortArc: boolean; // Limits spawn to comfortable frontal arc (avoids neck strain/vertigo)
  autoAimAssist: boolean;     // Automatically centers view on new targets after delay
  largeHitboxes: boolean;     // Increases target size for motor tremor or fine motor difficulty

  setTextScale: (scale: TextScale) => void;
  toggleHighContrast: () => void;
  toggleReducedMotion: () => void;
  toggleRelaxedPace: () => void;
  toggleClarityMode: () => void;
  setSessionLength: (n: SessionLength) => void;
  toggleTapToSelect: () => void;
  toggleSoundEnabled: () => void;
  togglePatientComfortArc: () => void;
  toggleAutoAimAssist: () => void;
  toggleLargeHitboxes: () => void;
}

export const useSettingsStore = create<SettingsStore>()(
  persist(
    (set) => ({
      textScale: 'normal',
      highContrast: false,
      reducedMotion: false,
      relaxedPace: false,
      clarityMode: false,
      sessionLength: 90,
      tapToSelect: false,
      soundEnabled: true,
      patientComfortArc: true,
      autoAimAssist: false,
      largeHitboxes: true,

      setTextScale: (textScale) => set({ textScale }),
      toggleHighContrast: () => set((s) => ({ highContrast: !s.highContrast })),
      toggleReducedMotion: () => set((s) => ({ reducedMotion: !s.reducedMotion })),
      toggleRelaxedPace: () => set((s) => ({ relaxedPace: !s.relaxedPace })),
      toggleClarityMode: () => set((s) => ({ clarityMode: !s.clarityMode })),
      setSessionLength: (sessionLength) => set({ sessionLength }),
      toggleTapToSelect: () => set((s) => ({ tapToSelect: !s.tapToSelect })),
      toggleSoundEnabled: () => set((s) => ({ soundEnabled: !s.soundEnabled })),
      togglePatientComfortArc: () => set((s) => ({ patientComfortArc: !s.patientComfortArc })),
      toggleAutoAimAssist: () => set((s) => ({ autoAimAssist: !s.autoAimAssist })),
      toggleLargeHitboxes: () => set((s) => ({ largeHitboxes: !s.largeHitboxes })),
    }),
    { name: 'neuro-adapt-settings' }
  )
);
