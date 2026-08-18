import { Accessor, Setter } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Text } from '../../../primitives/Text';
import { Chip } from '../../../primitives/Chip';
import type { FullValuationReport } from '../../../types/events';

export interface TickerValuationRatiosProps {
  fullReport: Accessor<FullValuationReport | null>;
  setActiveModal: Setter<'sharpe' | 'sortino' | 'volatility' | 'drawdown' | 'dcf' | 'watchlist' | 'peg' | 'earningsYield' | null>;
}

export function TickerValuationRatios(props: TickerValuationRatiosProps) {
  return (
    <> {/* Valuation Ratios Grid: PEG Ratio & Earnings Yield */}
      {props.fullReport() && (
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-8">
          {/* PEG Ratio Card */}
          <Card containerClass="border p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">PEG RATIO (P/E to Growth)</Text>
                <button
                  onClick={() => props.setActiveModal('peg')}
                  class="text-[11px] font-mono text-outline hover:text-on-surface underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text
                status={(props.fullReport()?.pegRatio ?? 0) > 0 && (props.fullReport()?.pegRatio ?? 0) <= 1.0 ? 'success' : (props.fullReport()?.pegRatio ?? 0) <= 2.0 ? 'accent' : 'error'}
                class="text-2xl font-bold block"
              >
                {(props.fullReport()?.pegRatio ?? 0) > 0 ? (props.fullReport()?.pegRatio ?? 0).toFixed(2) : 'N/A'}
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">Bench: &lt;1.0 Cheap | &gt;2.0 Expensive</Text>
              <Chip
                label={
                  (props.fullReport()?.pegRatio ?? 0) > 0 && (props.fullReport()?.pegRatio ?? 0) <= 1.0
                    ? 'CHEAP (< 1.0)'
                    : (props.fullReport()?.pegRatio ?? 0) <= 2.0 && (props.fullReport()?.pegRatio ?? 0) > 0
                      ? 'FAIR (1.0 - 2.0)'
                      : 'EXPENSIVE (> 2.0)'
                }
                color={
                  (props.fullReport()?.pegRatio ?? 0) > 0 && (props.fullReport()?.pegRatio ?? 0) <= 1.0
                    ? 'success'
                    : (props.fullReport()?.pegRatio ?? 0) <= 2.0 && (props.fullReport()?.pegRatio ?? 0) > 0
                      ? 'info'
                      : 'error'
                }
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Earnings Yield Card */}
          <Card containerClass="border p-4 relative flex flex-col justify-between">
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">EARNINGS YIELD %</Text>
                <button
                  onClick={() => props.setActiveModal('earningsYield')}
                  class="text-[11px] font-mono text-outline hover:text-on-surface underline cursor-pointer"
                >
                  ℹ️ FORMULA
                </button>
              </div>
              <Text
                variant={(props.fullReport()?.earningsYield ?? 0) >= 7.0 ? 'success' : 'error'}
                class="text-2xl font-bold block"
              >
                {(props.fullReport()?.earningsYield ?? 0).toFixed(2)}%
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between border-t border-gray-100 pt-2">
              <Text variant="muted" class="text-[10px]">Risk-Free Benchmark: 7.0% RBI Rate</Text>
              <Chip
                label={
                  (props.fullReport()?.earningsYield ?? 0) >= 7.0
                    ? 'BEATS RISK-FREE (>= 7%)'
                    : 'BELOW RISK-FREE (< 7%)'
                }
                color={(props.fullReport()?.earningsYield ?? 0) >= 7.0 ? 'success' : 'error'}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}