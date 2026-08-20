import { createMemo, Show } from 'solid-js';

interface CorrelationMatrixTableProps {
  activeStocks: string[];
  normalizedCurves: Record<string, { time: string, value: number }[]>;
}

export function CorrelationMatrixTable(props: CorrelationMatrixTableProps) {
  // Calculate the NxN matrix when opened
  const matrixData = createMemo(() => {
    if (props.activeStocks.length === 0) return null;

    const symbols = props.activeStocks;
    const n = symbols.length;
    const matrix: number[][] = Array(n).fill(0).map(() => Array(n).fill(0));

    // Pre-extract arrays
    const curveArrays = symbols.map(sym => props.normalizedCurves[sym] || []);

    for (let i = 0; i < n; i++) {
      for (let j = i; j < n; j++) {
        if (i === j) {
          matrix[i][j] = 1;
        } else {
          const data1 = curveArrays[i];
          const data2 = curveArrays[j];
          
          if (!data1.length || !data2.length) {
            matrix[i][j] = 0;
            matrix[j][i] = 0;
            continue;
          }

          let sum1 = 0, sum2 = 0, sum1Sq = 0, sum2Sq = 0, pSum = 0;
          const len = Math.min(data1.length, data2.length);
          
          if (len === 0) {
            matrix[i][j] = 0;
            matrix[j][i] = 0;
            continue;
          }

          for (let k = 0; k < len; k++) {
            const v1 = data1[k].value;
            const v2 = data2[k].value;
            sum1 += v1;
            sum2 += v2;
            sum1Sq += v1 * v1;
            sum2Sq += v2 * v2;
            pSum += v1 * v2;
          }

          const num = pSum - (sum1 * sum2 / len);
          const den = Math.sqrt((sum1Sq - (sum1 * sum1) / len) * (sum2Sq - (sum2 * sum2) / len));
          const corr = den === 0 ? 0 : num / den;

          matrix[i][j] = corr;
          matrix[j][i] = corr; // symmetric
        }
      }
    }

    return { symbols, matrix };
  });

  // Helper to get background color for correlation
  // +1 = strong blue (hsl 210)
  // 0 = dark surface / neutral
  // -1 = strong green (hsl 120) or orange/red. Let's use green for hedging.
  const getCellColor = (corr: number) => {
    if (corr > 0) {
      // 0 to +1 maps to increasing opacity of blue
      return `rgba(59, 130, 246, ${corr * 0.8})`; 
    } else {
      // 0 to -1 maps to increasing opacity of green
      return `rgba(34, 197, 94, ${Math.abs(corr) * 0.8})`;
    }
  };

  const getTextColor = (corr: number) => {
    return Math.abs(corr) > 0.5 ? '#ffffff' : '';
  };

  return (
    <div class="bg-surface-container rounded-2xl flex flex-col border border-outline overflow-hidden mt-6">
      {/* Header */}
      <div class="p-4 border-b border-outline flex justify-between items-center bg-surface-container-low shrink-0">
        <div>
          <h2 class="text-lg font-bold text-on-surface">Trend Correlation Matrix</h2>
          <div class="text-xs text-on-surface-variant mt-1">Pearson correlation of normalized asset curves.</div>
        </div>
      </div>

          {/* Matrix Content */}
          <div class="overflow-auto flex-1 bg-surface-container-lowest p-4 relative">
            <Show when={matrixData()} fallback={<div class="text-center p-8 text-on-surface-variant">Calculating...</div>}>
              {(data) => (
                <table class="w-full border-collapse text-xs">
                  <thead>
                    <tr>
                      <th class="sticky top-0 left-0 z-20 bg-surface-container-lowest p-2 border-b border-r border-outline min-w-[120px]"></th>
                      {data().symbols.map(sym => (
                        <th class="sticky top-0 z-10 bg-surface-container-lowest p-2 border-b border-outline text-on-surface font-medium whitespace-nowrap min-w-[60px]"
                            title={sym}
                        >
                          {sym.replace('.NS', '').substring(0, 6)}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {data().matrix.map((row, i) => (
                      <tr>
                        <th class="sticky left-0 z-10 bg-surface-container-lowest p-2 border-r border-outline text-left text-on-surface font-medium whitespace-nowrap">
                          {data().symbols[i].replace('.NS', '')}
                        </th>
                        {row.map((corr, j) => (
                          <td 
                            class="p-2 text-center border border-outline/30 font-mono"
                            style={{ 
                              "background-color": getCellColor(corr),
                              "color": getTextColor(corr)
                            }}
                            title={`${data().symbols[i]} vs ${data().symbols[j]}: ${corr.toFixed(3)}`}
                          >
                            {corr.toFixed(2)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </Show>
          </div>
          
          <div class="p-3 border-t border-outline bg-surface-container-low text-xs flex justify-end items-center gap-4 text-on-surface-variant shrink-0">
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-blue-500 opacity-80"></div>
              <span>Highly Correlated (+1.0)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-surface-variant"></div>
              <span>Uncorrelated (0.0)</span>
            </div>
            <div class="flex items-center gap-2">
              <div class="w-3 h-3 rounded bg-green-500 opacity-80"></div>
              <span>Inversely Correlated (-1.0)</span>
            </div>
          </div>
    </div>
  );
}
