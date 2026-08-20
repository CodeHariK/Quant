import { createSignal, createEffect } from 'solid-js';

export type Timeframe = '1y' | '5y' | '10y' | 'max';

const getInitialTimeframe = (): Timeframe => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('haunter_timeframe') as Timeframe;
    if (saved && ['1y', '5y', '10y', 'max'].includes(saved)) {
      return saved;
    }
  }
  return 'max';
};

const [timeframe, setTimeframe] = createSignal<Timeframe>(getInitialTimeframe());

export function useAppStore() {
  createEffect(
    () => timeframe(),
    (tf) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('haunter_timeframe', tf);
      }
    }
  );

  return { timeframe, setTimeframe };
}
