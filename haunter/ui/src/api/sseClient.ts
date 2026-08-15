import { createSignal, onCleanup } from 'solid-js';
import type { EventType, SSEEvent } from '../types/events';

export interface UseSSEReturn<T> {
  data: () => T | null;
  error: () => Error | null;
  isConnected: () => boolean;
}

const DEFAULT_SSE_URL = 'http://localhost:8080/api/stream';

export function createSSEStream<T>(eventType: EventType, streamUrl = DEFAULT_SSE_URL): UseSSEReturn<T> {
  const [data, setData] = createSignal<T | null>(null);
  const [error, setError] = createSignal<Error | null>(null);
  const [isConnected, setIsConnected] = createSignal<boolean>(false);

  if (typeof window !== 'undefined') {
    const eventSource = new EventSource(streamUrl);

    eventSource.onopen = () => {
      setIsConnected(true);
      setError(null);
    };

    eventSource.onerror = (err) => {
      setIsConnected(false);
      setError(new Error('SSE Stream disconnected. Reconnecting...'));
    };

    eventSource.addEventListener(eventType, (event: MessageEvent) => {
      try {
        const parsed: T = JSON.parse(event.data);
        setData(() => parsed);
      } catch (e) {
        setError(e as Error);
      }
    });

    onCleanup(() => {
      eventSource.close();
      setIsConnected(false);
    });
  }

  return { data, error, isConnected };
}
