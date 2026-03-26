'use client';

import { useWebHaptics } from 'web-haptics/react';

export type AppHapticFeedback =
  | 'selection'
  | 'light'
  | 'medium'
  | 'success'
  | 'warning'
  | 'error';

type AppHapticPattern = {
  pattern: Array<{
    duration: number;
    delay?: number;
    intensity?: number;
  }>;
};

const APP_HAPTIC_PATTERNS: Record<AppHapticFeedback, AppHapticPattern> = {
  selection: {
    pattern: [{ duration: 14, intensity: 0.55 }],
  },
  light: {
    pattern: [{ duration: 22, intensity: 0.7 }],
  },
  medium: {
    pattern: [{ duration: 32, intensity: 1 }],
  },
  success: {
    pattern: [
      { duration: 34, intensity: 0.8 },
      { delay: 48, duration: 48, intensity: 1 },
    ],
  },
  warning: {
    pattern: [
      { duration: 48, intensity: 0.95 },
      { delay: 72, duration: 42, intensity: 0.8 },
    ],
  },
  error: {
    pattern: [
      { duration: 36, intensity: 1 },
      { delay: 38, duration: 36, intensity: 1 },
      { delay: 38, duration: 36, intensity: 1 },
    ],
  },
};

export function useAppHaptics() {
  const { trigger, isSupported } = useWebHaptics();

  const fire = (feedback: AppHapticFeedback = 'medium') => {
    void trigger(APP_HAPTIC_PATTERNS[feedback]);
  };

  return {
    fire,
    isSupported,
    selection: () => fire('selection'),
    light: () => fire('light'),
    medium: () => fire('medium'),
    success: () => fire('success'),
    warning: () => fire('warning'),
    error: () => fire('error'),
  };
}
