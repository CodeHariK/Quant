import { Accessor, Setter } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Text } from '../../../primitives/Text';
import { Chip } from '../../../primitives/Chip';
import { OutlineButton } from '../../../primitives/FormControls';
import type { FullValuationReport } from '../../../types/events';

export interface TickerTrendRadarProps {
  fullReport: Accessor<FullValuationReport | null>;
  selectedSymbol: Accessor<string>;
  stockInfo: Accessor<any>;
  setActiveModal: Setter<'sharpe' | 'sortino' | 'volatility' | 'drawdown' | 'dcf' | 'watchlist' | 'peg' | 'earningsYield' | null>;
}

export function TickerTrendRadar(props: TickerTrendRadarProps) {
  return (
    <> {/* 🎯 INTRINSIC VALUATION & BUY/SELL ZONE RADAR HERO SECTION */}
      {props.fullReport() && (
        <Card>
          <div class="flex justify-between items-center mb-4 border-b border-outline-variant dark:border-zinc-800 pb-3">
            <div>
              <Text variant="h2">🎯 QUANTITATIVE TREND & PRICE DEVIATION RADAR</Text>
              <Text variant="muted">1-Year Recency-Weighted Trend Price Baseline & Trend Deviation Radar</Text>
            </div>
            <OutlineButton
              onClick={() => props.setActiveModal('dcf')}
              class="text-xs font-mono font-bold"
            >
              ℹ️ HOW TREND BASELINE IS CALCULATED
            </OutlineButton>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-5 gap-4 items-center">
            {/* Valuation Status Badge */}
            <Card>
              <Text variant="label">TREND STATUS</Text>
              <Chip
                label={props.fullReport()?.valuationStatus?.replace('_', ' ') || 'EVALUATING'}
                color={
                  (props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0) >= 10
                    ? 'success'
                    : (props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0) <= -10
                      ? 'error'
                      : 'info'
                }
                class="text-sm py-1 px-3 font-bold border-none"
              />
              <Text variant="muted">
                {(props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0) >= 0
                  ? `${(props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0).toFixed(1)}% Below Trend Baseline`
                  : `${Math.abs(props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0).toFixed(1)}% Above Trend Baseline`}
              </Text>
            </Card>

            {/* Fair Value vs Market Price */}
            <Card>
              <Text variant="label">WEIGHTED TREND BASELINE</Text>
              <Text variant="h1" class="text-emerald-600 dark:text-emerald-400 font-bold block">
                {props.selectedSymbol().endsWith('.NS') || props.selectedSymbol().endsWith('.BO') || props.stockInfo()?.currency === 'INR' ? '₹' : '$'}
                {(props.fullReport()?.weightedTrendPrice ?? props.fullReport()?.intrinsicValue ?? 0).toFixed(2)}
              </Text>
              <Text variant="muted">
                Current Price:
                {props.selectedSymbol().endsWith('.NS') || props.selectedSymbol().endsWith('.BO') || props.stockInfo()?.currency === 'INR' ? '₹' : '$'}
                {(props.fullReport()?.currentPrice ?? 0).toFixed(2)}
              </Text>
            </Card>

            {/* NEXT MONTH PRICE FORECAST */}
            <Card>
              <Text variant="label">
                NEXT MONTH FORECAST 🔮 ({(props.fullReport()?.monthlyGrowthPerc ?? 0) >= 0 ? '+' : ''}{(props.fullReport()?.monthlyGrowthPerc ?? 0).toFixed(2)}%)
              </Text>
              <Text variant="h1" class="text-blue-600">
                {props.selectedSymbol().endsWith('.NS') || props.selectedSymbol().endsWith('.BO') || props.stockInfo()?.currency === 'INR' ? '₹' : '$'}
                {(props.fullReport()?.nextMonthForecast ?? 0).toFixed(2)}
              </Text>
              <Text variant="muted">
                Range (±{(props.fullReport()?.monthlyVolPerc ?? 10).toFixed(1)}% Vol):
                {props.selectedSymbol().endsWith('.NS') || props.selectedSymbol().endsWith('.BO') || props.stockInfo()?.currency === 'INR' ? '₹' : '$'}
                {(props.fullReport()?.nextMonthMin ?? 0).toFixed(0)} - {(props.fullReport()?.nextMonthMax ?? 0).toFixed(0)}
              </Text>
            </Card>

            {/* Price to Trend Deviation */}
            <Card>
              <Text variant="label">TREND DEVIATION</Text>
              <Text
                status={
                  (props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0) >= 5
                    ? 'success'
                    : (props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0) >= 0
                      ? 'accent' : 'error'}
              >
                {(props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0) >= 0 ? '+' : ''}
                {(props.fullReport()?.priceToTrendDeviation ?? props.fullReport()?.marginOfSafety ?? 0).toFixed(1)}%
              </Text>
              <Text variant="muted">Baseline Band: ±10.0%</Text>
            </Card>

            {/* Recommendation Decision */}
            <Card>
              <Text variant="label">SIGNAL</Text>
              <Text variant="h1" status='success'>
                {props.fullReport()?.buySellZone?.replace('_', ' ') || 'HOLD'}
              </Text>
              <Text variant="muted" class="text-[10px] uppercase font-mono text-gray-400 block mt-1">Quant Momentum Signal</Text>
            </Card>
          </div>
        </Card>
      )}
    </>
  );
}