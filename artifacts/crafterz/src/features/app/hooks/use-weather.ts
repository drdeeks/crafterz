import { useState, useEffect, useCallback } from 'react';

export interface WeatherEvent {
  id: string;
  name: string;
  icon: string;
  description: string;
  effectType: string;
  effectValue: number;
  colorHint: string;
}

export interface UseWeatherReturn {
  currentEvent: WeatherEvent | null;
  secondsRemaining: number;
  endsAt: number;
}

export function useWeather(): UseWeatherReturn {
  const [currentEvent, setCurrentEvent] = useState<WeatherEvent | null>(null);
  const [secondsRemaining, setSecondsRemaining] = useState(0);
  const [endsAt, setEndsAt] = useState(0);

  const fetchWeather = useCallback(async () => {
    try {
      const res = await fetch('/api/weather/current');
      if (!res.ok) return;
      const data = await res.json() as { ok: boolean; event?: WeatherEvent; secondsRemaining?: number; endsAt?: number };
      if (data.ok) {
        setCurrentEvent(data.event ?? null);
        setSecondsRemaining(data.secondsRemaining ?? 0);
        setEndsAt(data.endsAt ?? 0);
      }
    } catch {
      // silent
    }
  }, []);

  useEffect(() => {
    void fetchWeather();
    const interval = setInterval(() => void fetchWeather(), 60_000);
    return () => clearInterval(interval);
  }, [fetchWeather]);

  useEffect(() => {
    if (!currentEvent || secondsRemaining <= 0) return;
    const tick = setInterval(() => {
      setSecondsRemaining((s) => Math.max(0, s - 1));
    }, 1_000);
    return () => clearInterval(tick);
  }, [currentEvent, secondsRemaining]);

  return { currentEvent, secondsRemaining, endsAt };
}
