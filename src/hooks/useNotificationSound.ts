import { useEffect, useRef, useCallback } from 'react';

type SoundType = 'order_ready' | 'new_order' | 'urgent' | 'reservation' | 'delivery';

// Sound frequencies and patterns for different notification types
const soundPatterns: Record<SoundType, { frequencies: number[]; durations: number[]; volume: number }> = {
  order_ready: {
    frequencies: [880, 1100, 880], // Pleasant ding-dong-ding
    durations: [150, 150, 200],
    volume: 0.4,
  },
  new_order: {
    frequencies: [660, 880], // Two-tone alert
    durations: [200, 300],
    volume: 0.5,
  },
  urgent: {
    frequencies: [1000, 800, 1000, 800], // Urgent repeating pattern
    durations: [100, 100, 100, 100],
    volume: 0.6,
  },
  reservation: {
    frequencies: [523, 659, 784], // Ascending chime
    durations: [150, 150, 200],
    volume: 0.3,
  },
  delivery: {
    frequencies: [440, 550, 660], // Delivery bell
    durations: [100, 100, 200],
    volume: 0.4,
  },
};

export const useNotificationSound = () => {
  const audioContextRef = useRef<AudioContext | null>(null);
  const isEnabledRef = useRef(true);

  // Initialize AudioContext on first interaction
  const initAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    return audioContextRef.current;
  }, []);

  const playTone = useCallback((frequency: number, duration: number, volume: number, startTime: number) => {
    const ctx = initAudioContext();
    if (!ctx || ctx.state === 'suspended') {
      ctx?.resume();
    }

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = 'sine';

    // Envelope for smooth sound
    const now = ctx.currentTime + startTime;
    gainNode.gain.setValueAtTime(0, now);
    gainNode.gain.linearRampToValueAtTime(volume, now + 0.02);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + duration / 1000);

    oscillator.start(now);
    oscillator.stop(now + duration / 1000);
  }, [initAudioContext]);

  const playSound = useCallback((type: SoundType) => {
    if (!isEnabledRef.current) return;

    const pattern = soundPatterns[type];
    if (!pattern) return;

    let startTime = 0;
    pattern.frequencies.forEach((freq, index) => {
      playTone(freq, pattern.durations[index], pattern.volume, startTime);
      startTime += pattern.durations[index] / 1000;
    });
  }, [playTone]);

  const playOrderReady = useCallback(() => playSound('order_ready'), [playSound]);
  const playNewOrder = useCallback(() => playSound('new_order'), [playSound]);
  const playUrgent = useCallback(() => playSound('urgent'), [playSound]);
  const playReservation = useCallback(() => playSound('reservation'), [playSound]);
  const playDelivery = useCallback(() => playSound('delivery'), [playSound]);

  const setEnabled = useCallback((enabled: boolean) => {
    isEnabledRef.current = enabled;
  }, []);

  const isEnabled = useCallback(() => isEnabledRef.current, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      const ctx = audioContextRef.current;
      if (ctx && ctx.state !== 'closed') {
        void ctx.close();
      }
    };
  }, []);

  return {
    playSound,
    playOrderReady,
    playNewOrder,
    playUrgent,
    playReservation,
    playDelivery,
    setEnabled,
    isEnabled,
    initAudioContext,
  };
};

export default useNotificationSound;
