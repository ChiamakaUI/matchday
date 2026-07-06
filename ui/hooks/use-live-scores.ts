import { useEffect, useCallback, useRef, useState } from 'react';
import type { LiveScoreEvent } from '@/types';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

/**
 * Connects to the server's SSE endpoint for live score updates.
 * Returns the latest score events and a connection status.
 */
export function useLiveScores(onScoreUpdate?: (event: LiveScoreEvent) => void) {
  const [connected, setConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<LiveScoreEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const callbackRef = useRef(onScoreUpdate);
  callbackRef.current = onScoreUpdate;

  useEffect(() => {
    const es = new EventSource(`${API_URL}/live/scores`);
    eventSourceRef.current = es;

    es.addEventListener('connected', () => {
      setConnected(true);
    });

    es.addEventListener('score', (e) => {
      try {
        const data = JSON.parse(e.data) as LiveScoreEvent;
        setLastEvent(data);
        callbackRef.current?.(data);
      } catch {
        // Skip malformed events
      }
    });

    es.onerror = () => {
      setConnected(false);
    };

    return () => {
      es.close();
      eventSourceRef.current = null;
      setConnected(false);
    };
  }, []);

  const disconnect = useCallback(() => {
    eventSourceRef.current?.close();
    eventSourceRef.current = null;
    setConnected(false);
  }, []);

  return { connected, lastEvent, disconnect };
}
