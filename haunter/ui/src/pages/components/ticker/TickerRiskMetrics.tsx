import { Accessor, Setter } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Text } from '../../../primitives/Text';
import { Chip, ChipColor } from '../../../primitives/Chip';
import type { FullValuationReport } from '../../../types/events';

export interface TickerRiskMetricsProps {
  fullReport: Accessor<FullValuationReport | null>;
  setActiveModal: Setter<'sharpe' | 'sortino' | 'volatility' | 'drawdown' | 'dcf' | 'watchlist' | 'peg' | 'earningsYield' | null>;
  getSharpeGrade: (val: number) => { grade: string; color: ChipColor };
  getSortinoGrade: (val: number) => { grade: string; color: ChipColor };
  getVolGrade: (val: number) => { grade: string; color: ChipColor };
  getDrawdownGrade: (val: number) => { grade: string; color: ChipColor };
}

export function TickerRiskMetrics(props: TickerRiskMetricsProps) {
  return (
    <> {/* Quant Risk & Volatility Metrics Header Grid with Colored Grade Badges & Formula Info Modals */}
      {props.fullReport() && (
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Sharpe Ratio Card */}
          <Card>

            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">SHARPE RATIO (5Y)</Text>
                <button
                  onClick={() => props.setActiveModal('sharpe')}
                  class="text-[11px] font-mono text-outline hover:text-on-surface underline cursor-pointer"
                >
                  FORMULA
                </button>
              </div>
              <Text status={
                (props.fullReport()?.sharpeRatio ?? 0) >= 1
                  ? 'success'
                  : (props.fullReport()?.sharpeRatio ?? 0) >= 0 ? 'accent' : 'error'}
                class="text-2xl font-bold block"
              >
                {(props.fullReport()?.sharpeRatio ?? 0).toFixed(2)}
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <Text variant="muted">Rf: 7.0% RBI</Text>
              <Chip
                label={`GRADE: ${props.getSharpeGrade(props.fullReport()?.sharpeRatio ?? 0).grade}`}
                color={props.getSharpeGrade(props.fullReport()?.sharpeRatio ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Sortino Ratio Card */}
          <Card>
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">SORTINO RATIO (5Y)</Text>
                <button
                  onClick={() => props.setActiveModal('sortino')}
                  class="text-[11px] font-mono text-outline hover:text-on-surface underline cursor-pointer"
                >
                  FORMULA
                </button>
              </div>
              <Text status={
                (props.fullReport()?.sortinoRatio ?? 0) >= 1.5
                  ? 'success'
                  : (props.fullReport()?.sortinoRatio ?? 0) >= 0 ? 'accent' : 'error'}
                class="text-2xl font-bold block"
              >
                {!isFinite(props.fullReport()?.sortinoRatio ?? 0)
                  ? '∞ (PERFECT)'
                  : (props.fullReport()?.sortinoRatio ?? 0).toFixed(2)}
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <Text variant="muted" class="text-[10px]">Downside Vol Only</Text>
              <Chip
                label={`GRADE: ${props.getSortinoGrade(props.fullReport()?.sortinoRatio ?? 0).grade}`}
                color={props.getSortinoGrade(props.fullReport()?.sortinoRatio ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Annual Volatility Card */}
          <Card>
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">ANNUAL VOLATILITY</Text>
                <button
                  onClick={() => props.setActiveModal('volatility')}
                  class="text-[11px] font-mono text-outline hover:text-on-surface underline cursor-pointer"
                >
                  FORMULA
                </button>
              </div>
              <Text variant="code" class="text-2xl font-bold block">
                {(props.fullReport()?.annualizedVolatility ?? 0).toFixed(2)}%
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <Text variant="muted" class="text-[10px]">252 Days Std Dev</Text>
              <Chip
                label={props.getVolGrade(props.fullReport()?.annualizedVolatility ?? 0).grade}
                color={props.getVolGrade(props.fullReport()?.annualizedVolatility ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>

          {/* Max 5Y Drawdown Card */}
          <Card>
            <div>
              <div class="flex justify-between items-start mb-2">
                <Text variant="label">MAX 5Y DRAWDOWN</Text>
                <button
                  onClick={() => props.setActiveModal('drawdown')}
                  class="text-[11px] font-mono text-outline hover:text-on-surface underline cursor-pointer"
                >
                  FORMULA
                </button>
              </div>
              <Text status="error" class="text-2xl font-bold block">
                -{(props.fullReport()?.maxDrawdown ?? 0).toFixed(2)}%
              </Text>
            </div>
            <div class="mt-3 flex items-center justify-between">
              <Text variant="muted" class="text-[10px]">Peak to Trough</Text>
              <Chip
                label={props.getDrawdownGrade(props.fullReport()?.maxDrawdown ?? 0).grade}
                color={props.getDrawdownGrade(props.fullReport()?.maxDrawdown ?? 0).color}
                class="text-[10px] py-0.5 px-2"
              />
            </div>
          </Card>
        </div>
      )}
    </>
  );
}