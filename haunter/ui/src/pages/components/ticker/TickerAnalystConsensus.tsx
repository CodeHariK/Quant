import { Accessor } from 'solid-js';
import type { FullValuationReport } from '../../../types/events';

export interface TickerAnalystConsensusProps {
  fullReport: Accessor<FullValuationReport | null>;
}

export function TickerAnalystConsensus(props: TickerAnalystConsensusProps) {
  return (
    <>
      {props.fullReport()?.recommendations && (() => {
        const rec = props.fullReport()?.recommendations as any;
        const trend = Array.isArray(rec?.trend) && rec.trend.length > 0 ? rec.trend[0] : (rec?.trend ?? rec);

        const strongBuy = trend?.strongBuy ?? trend?.StrongBuy ?? 0;
        const buy = trend?.buy ?? trend?.Buy ?? 0;
        const hold = trend?.hold ?? trend?.Hold ?? 0;
        const sell = trend?.sell ?? trend?.Sell ?? 0;
        const strongSell = trend?.strongSell ?? trend?.StrongSell ?? 0;

        return (
          <div class="inline-flex items-center gap-1.5 text-[10px] font-bold uppercase bg-surface-container-high border border-outline-variant rounded p-1 ml-3" title="Analyst Consensus (Current Month)">
            {(strongBuy > 0) && (
              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-emerald-500/10 text-green-400">
                <span>Buy</span>
                <span class="text-[11px]">{strongBuy}</span>
              </div>
            )}
            {(buy > 0) && (
              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-green-500/10 text-green-600">
                <span>Buy</span>
                <span class="text-[11px]">{buy}</span>
              </div>
            )}
            {(hold > 0) && (
              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-blue-500/10 text-blue-600">
                <span>Hold</span>
                <span class="text-[11px]">{hold}</span>
              </div>
            )}
            {(sell > 0) && (
              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-orange-500/10 text-orange-600">
                <span>Sell</span>
                <span class="text-[11px]">{sell}</span>
              </div>
            )}
            {(strongSell > 0) && (
              <div class="flex items-center gap-1 px-1.5 py-0.5 rounded bg-red-500/10 text-red-600">
                <span>Str Sell</span>
                <span class="text-[11px]">{strongSell}</span>
              </div>
            )}
          </div>
        );
      })()}
    </>
  );
}