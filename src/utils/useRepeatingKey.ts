import { useRef, useCallback, useEffect } from 'react';
import { Vibration } from 'react-native';
import { androidTvService } from '../services/AndroidTvService';

interface RepeatOptions {
  initialDelayMs?: number;
  intervalMs?: number;
  vibrateMs?: number;
  disabled?: boolean;
  onRepeat?: () => void;
}

export function useRepeatingKey() {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const isHeldRef = useRef(false);

  useEffect(() => {
    return () => {
      isHeldRef.current = false;
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  const startRepeating = useCallback(
    (keyCode: number, options: RepeatOptions = {}) => {
      if (options.disabled) return;

      const {
        initialDelayMs = 340,
        intervalMs = 100,
        vibrateMs = 10,
        onRepeat,
      } = options;

      // Clear any previous timers
      if (timeoutRef.current) clearTimeout(timeoutRef.current);
      if (intervalRef.current) clearInterval(intervalRef.current);

      isHeldRef.current = true;

      // 1. Immediate trigger on touch down
      try {
        Vibration.vibrate(20);
      } catch {}
      androidTvService.sendKey(keyCode, 'SHORT');
      onRepeat?.();

      // 2. Start repeating after initialDelayMs if still held
      timeoutRef.current = setTimeout(() => {
        if (!isHeldRef.current) return;

        intervalRef.current = setInterval(() => {
          if (!isHeldRef.current) {
            if (intervalRef.current) clearInterval(intervalRef.current);
            return;
          }

          try {
            Vibration.vibrate(vibrateMs);
          } catch {}

          androidTvService.sendKey(keyCode, 'SHORT');
          onRepeat?.();
        }, intervalMs);
      }, initialDelayMs);
    },
    []
  );

  const stopRepeating = useCallback(() => {
    isHeldRef.current = false;
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  }, []);

  return { startRepeating, stopRepeating };
}
