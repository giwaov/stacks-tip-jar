import { useRef, useCallback } from 'react';
export function useThrottle<T extends (...args: any[]) => any>(fn: T, delay: number) {
  const last = useRef(Date.now());
  return useCallback((...args: any[]) => { if (Date.now() - last.current >= delay) { fn(...args); last.current = Date.now(); } }, [fn, delay]);
}