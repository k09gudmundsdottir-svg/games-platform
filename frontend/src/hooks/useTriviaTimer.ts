import { useState, useRef, useCallback, useEffect } from "react";

export function useTriviaTimer(initialSeconds: number, onExpire: () => void) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const startTimeRef = useRef<number>(0);
  const totalRef = useRef(initialSeconds);
  const rafRef = useRef<number>(0);
  const onExpireRef = useRef(onExpire);
  onExpireRef.current = onExpire;

  const tick = useCallback(() => {
    const elapsed = (Date.now() - startTimeRef.current) / 1000;
    const remaining = Math.max(0, totalRef.current - elapsed);
    setTimeLeft(remaining);
    if (remaining <= 0) {
      setIsRunning(false);
      onExpireRef.current();
    } else {
      rafRef.current = requestAnimationFrame(tick);
    }
  }, []);

  const start = useCallback(() => {
    startTimeRef.current = Date.now();
    setIsRunning(true);
    rafRef.current = requestAnimationFrame(tick);
  }, [tick]);

  const pause = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    totalRef.current = timeLeft;
    setIsRunning(false);
  }, [timeLeft]);

  const reset = useCallback((newTime?: number) => {
    cancelAnimationFrame(rafRef.current);
    const t = newTime ?? initialSeconds;
    totalRef.current = t;
    setTimeLeft(t);
    setIsRunning(false);
  }, [initialSeconds]);

  useEffect(() => () => cancelAnimationFrame(rafRef.current), []);

  return {
    timeLeft,
    isRunning,
    start,
    pause,
    reset,
    percentRemaining: timeLeft / initialSeconds,
  };
}
