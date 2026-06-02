import { useState, useEffect, useCallback, useRef } from 'react';
import { fetchFeed, type ServerFeedEvent } from '../runtime-api';

const POLL_INTERVAL_MS = 15_000;

export function useFeed(active: boolean) {
  const [events, setEvents] = useState<ServerFeedEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const mountedRef = useRef(false);

  const refresh = useCallback(async () => {
    try {
      const data = await fetchFeed(40);
      if (mountedRef.current) setEvents(data);
    } catch {
      // network error — keep stale data
    } finally {
      if (mountedRef.current) setLoading(false);
    }
  }, []);

  useEffect(() => {
    mountedRef.current = true;
    return () => { mountedRef.current = false; };
  }, []);

  useEffect(() => {
    if (!active) return;
    setLoading(true);
    void refresh();
    const id = setInterval(() => void refresh(), POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [active, refresh]);

  return { events, loading, refresh };
}
