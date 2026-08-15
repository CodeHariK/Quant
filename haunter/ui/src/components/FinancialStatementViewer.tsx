import { createSignal } from 'solid-js';
import { Card } from './Card';
import { FilledButton, OutlineButton } from './FormControls';
import type { FinancialStatementItem } from '../types/events';

export interface FinancialStatementViewerProps {
  title: string;
  data?: FinancialStatementItem[];
  allowChart?: boolean;
}

export function FinancialStatementViewer(props: FinancialStatementViewerProps) {
  const allowChart = () => props.allowChart !== false;
  const [viewMode, setViewMode] = createSignal<'table' | 'chart'>('table');

  if (!props.data || props.data.length === 0) {
    return null;
  }

  // Sort statement items chronologically by period (e.g. 2021-03-31, 2022-03-31, 2023-03-31)
  const periods = props.data.map((item) => item.period).sort();
  const periodDataMap = new Map<string, Record<string, number>>();
  props.data.forEach((item) => periodDataMap.set(item.period, item.values || {}));

  // Collect all unique line item metric keys across periods
  const allMetricKeys = Array.from(
    new Set(props.data.flatMap((item) => Object.keys(item.values || {})))
  ).sort();

  const [selectedMetric, setSelectedMetric] = createSignal<string>(allMetricKeys[0] || '');

  // Helper to format currency/numbers
  const formatNumber = (val?: number) => {
    if (val === undefined || val === null || isNaN(val)) return '—';
    if (Math.abs(val) >= 1e9) return `$${(val / 1e9).toFixed(2)}B`;
    if (Math.abs(val) >= 1e6) return `$${(val / 1e6).toFixed(2)}M`;
    return val.toLocaleString();
  };

  return (
    <Card containerClass="border border-black bg-white p-6 mb-8">
      {/* Header with Statement Title and Table/Chart Toggle */}
      <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 border-b border-gray-200 pb-4">
        <div>
          <h2 class="font-headline-md text-headline-md uppercase font-bold text-black dark:text-white flex items-center gap-2">
            <span>📑 {props.title}</span>
            <span class="text-xs font-mono font-normal text-muted-gray border border-gray-300 dark:border-zinc-700 px-2 py-0.5">
              {periods.length} FISCAL YEARS
            </span>
          </h2>
          <p class="font-code-md text-code-md text-muted-gray mt-1">
            Complete annual line items with multi-year comparison view.
          </p>
        </div>

        {allowChart() && (
          <div class="flex items-center gap-2">
            {viewMode() === 'table' ? (
              <FilledButton size="sm" onClick={() => setViewMode('table')}>
                📊 TABLE VIEW
              </FilledButton>
            ) : (
              <OutlineButton size="sm" onClick={() => setViewMode('table')}>
                📊 TABLE VIEW
              </OutlineButton>
            )}

            {viewMode() === 'chart' ? (
              <FilledButton size="sm" onClick={() => setViewMode('chart')}>
                📈 TREND GRAPH
              </FilledButton>
            ) : (
              <OutlineButton size="sm" onClick={() => setViewMode('chart')}>
                📈 TREND GRAPH
              </OutlineButton>
            )}
          </div>
        )}
      </div>

      {/* View Mode 1: Multi-Year Comparison Table */}
      {viewMode() === 'table' && (
        <div class="overflow-x-auto border border-black dark:border-zinc-800">
          <table class="w-full text-left text-xs font-mono border-collapse">
            <thead>
              <tr class="bg-gray-100 dark:bg-zinc-800 border-b border-black text-black dark:text-white">
                <th class="p-3 font-bold uppercase tracking-wider min-w-[240px]">LINE ITEM METRIC</th>
                {periods.map((p) => (
                  <th class="p-3 font-bold text-right tracking-wider min-w-[120px] border-l border-gray-200 dark:border-zinc-700">
                    {p}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-zinc-800">
              {allMetricKeys.map((metric) => (
                <tr class="hover:bg-gray-50 dark:hover:bg-zinc-800/50 transition-colors">
                  <td class="p-3 font-bold text-black dark:text-white">{metric}</td>
                  {periods.map((p) => {
                    const val = periodDataMap.get(p)?.[metric];
                    const isNeg = val !== undefined && val < 0;
                    return (
                      <td class={`p-3 text-right border-l border-gray-200 dark:border-zinc-700 font-mono ${isNeg ? 'text-critical-red font-bold' : 'text-terminal-green font-bold'}`}>
                        {formatNumber(val)}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* View Mode 2: Metric Trend Bar Chart */}
      {viewMode() === 'chart' && (
        <div class="flex flex-col gap-6">
          <div class="flex items-center gap-3">
            <label class="font-label-caps text-label-caps text-muted-gray uppercase font-bold">SELECT METRIC TO PLOT:</label>
            <select
              value={selectedMetric()}
              onChange={(e) => setSelectedMetric(e.currentTarget.value)}
              class="border border-black dark:border-zinc-700 bg-white dark:bg-zinc-900 p-2 font-code-md text-code-md uppercase max-w-md"
            >
              {allMetricKeys.map((m) => (
                <option value={m}>{m}</option>
              ))}
            </select>
          </div>

          <div class="border border-black dark:border-zinc-800 p-6 bg-gray-50 dark:bg-zinc-900 flex flex-col items-center">
            <h3 class="font-bold text-sm uppercase mb-4 text-black dark:text-white">
              {selectedMetric()} 5-YEAR HISTORICAL TREND
            </h3>

            {/* Custom Interactive Bar Chart SVG */}
            {(() => {
              const metricVals = periods.map((p) => periodDataMap.get(p)?.[selectedMetric()] || 0);
              const maxVal = Math.max(...metricVals.map((v) => Math.abs(v)), 1);

              return (
                <div class="w-full max-w-2xl h-64 flex items-end justify-around border-b border-l border-black dark:border-zinc-700 pt-8 pb-2 px-4 gap-4">
                  {periods.map((p, i) => {
                    const val = metricVals[i];
                    const heightPerc = Math.max(10, Math.min(100, (Math.abs(val) / maxVal) * 100));
                    const isPositive = val >= 0;

                    return (
                      <div class="flex flex-col items-center flex-1 h-full justify-end group relative">
                        {/* Hover Tooltip */}
                        <div class="opacity-0 group-hover:opacity-100 transition-opacity bg-black text-white text-[10px] p-1.5 font-mono rounded mb-2 absolute -top-8 z-10 whitespace-nowrap">
                          {p}: {formatNumber(val)}
                        </div>

                        {/* Bar */}
                        <div
                          style={{ height: `${heightPerc}%` }}
                          class={`w-full max-w-[48px] border border-black transition-all ${
                            isPositive ? 'bg-terminal-green/80 hover:bg-terminal-green' : 'bg-critical-red/80 hover:bg-critical-red'
                          }`}
                        ></div>

                        {/* Year Label */}
                        <span class="font-mono text-xs font-bold text-black dark:text-white mt-2">{p.substring(0, 4)}</span>
                      </div>
                    );
                  })}
                </div>
              );
            })()}
          </div>
        </div>
      )}
    </Card>
  );
}
