import { useState, useRef, useEffect } from 'react';
import { CRAFTZ_MAX, CRAFTZ_REGEN_MS } from '../constants';

export interface UseCraftzReturn {
  craftz: number;
  craftzRef: React.MutableRefObject<number>;
  setCraftz: React.Dispatch<React.SetStateAction<number>>;
}

export function useCraftz(): UseCraftzReturn {
  const [craftz, setCraftz] = useState(CRAFTZ_MAX);
  const craftzRef = useRef(CRAFTZ_MAX);
  const lastRegenRef = useRef(Date.now());

  useEffect(() => {
    const interval = setInterval(() => {
      const now = Date.now();
      const elapsed = now - lastRegenRef.current;
      const add = Math.floor(elapsed / CRAFTZ_REGEN_MS);
      if (add > 0) {
        lastRegenRef.current = now - (elapsed % CRAFTZ_REGEN_MS);
        setCraftz((prev) => {
          const next = Math.min(CRAFTZ_MAX, prev + add);
          craftzRef.current = next;
          return next;
        });
      }
    }, 500);
    return () => clearInterval(interval);
  }, []);

  return { craftz, craftzRef, setCraftz };
}
