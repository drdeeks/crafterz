import { useState, useCallback } from 'react';
import { newId } from '../helpers';

export interface PointToast {
  id: string;
  message: string;
  pts: number;
  color: string;
}

export interface UsePointToastsReturn {
  pointToasts: PointToast[];
  awardPoints: (pts: number, label: string, color?: string) => void;
}

export function usePointToasts(
  setPoints: (updater: (prev: number) => number) => void,
): UsePointToastsReturn {
  const [pointToasts, setPointToasts] = useState<PointToast[]>([]);

  const awardPoints = useCallback(
    (pts: number, label: string, color = '#f59e0b') => {
      setPoints((p) => p + pts);
      const id = newId();
      setPointToasts((prev) => [...prev, { id, message: label, pts, color }]);
      setTimeout(() => setPointToasts((prev) => prev.filter((t) => t.id !== id)), 2000);
    },
    [setPoints],
  );

  return { pointToasts, awardPoints };
}
