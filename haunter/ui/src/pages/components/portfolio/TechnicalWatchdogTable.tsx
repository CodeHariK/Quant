import { Table, Column } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { StockSummary } from '../../../hooks/usePortfolioSimulation';

interface TechnicalWatchdogTableProps {
  stockBreakdown: StockSummary[];
}

export function TechnicalWatchdogTable(props: TechnicalWatchdogTableProps) {

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  const filteredData = () => props.stockBreakdown.filter(s => s.technicalAnalysis !== undefined);

  const getRsiColor = (rsi: number) => {
    if (rsi >= 70) return 'text-critical-red font-bold';
    if (rsi <= 30) return 'text-positive-green font-bold';
    return 'text-on-surface-variant';
  };

  const getTrendBadge = (trend: string) => {
    const isBull = trend.includes('BULL');
    return (
      <span class={`px-2 py-0.5 rounded text-[11px] font-bold ${isBull ? 'bg-positive-green/20 text-positive-green' : 'bg-critical-red/20 text-critical-red'}`}>
        {trend}
      </span>
    );
  };

  const columns: Column<StockSummary>[] = [
    {
      header: 'Symbol',
      accessor: 'symbol',
      cell: (row) => <Text variant="code" class="font-bold text-primary">{row.symbol.replace('.NS', '')}</Text>,
    },
    {
      header: 'Price',
      align: 'right',
      cell: (row) => {
        const price = row.technicalAnalysis?.latestPrice || 0;
        return <span class="font-medium text-on-surface">{formatCurrency(price)}</span>;
      },
      sortValue: (row) => row.technicalAnalysis?.latestPrice || 0
    },
    {
      header: 'RSI (14)',
      align: 'right',
      cell: (row) => {
        const rsi = row.technicalAnalysis?.rsi14 || 0;
        return <span class={getRsiColor(rsi)}>{rsi.toFixed(1)}</span>;
      },
      sortValue: (row) => row.technicalAnalysis?.rsi14 || 0
    },
    {
      header: 'MACD (Signal)',
      align: 'right',
      cell: (row) => {
        const ta = row.technicalAnalysis;
        if (!ta) return <span>-</span>;
        
        const isBullishCross = ta.macd > ta.macdSignal;
        
        return (
          <div class="flex flex-col items-end gap-1">
            <span class="text-xs font-medium text-on-surface">
              {ta.macd.toFixed(2)} ({ta.macdSignal.toFixed(2)})
            </span>
            <span class={`text-[10px] px-1.5 py-0.5 rounded ${isBullishCross ? 'bg-positive-green/10 text-positive-green' : 'bg-critical-red/10 text-critical-red'}`}>
              {isBullishCross ? 'BULL CROSS' : 'BEAR CROSS'}
            </span>
          </div>
        );
      },
      sortValue: (row) => row.technicalAnalysis?.macd || 0
    },
    {
      header: 'Bollinger Warnings',
      cell: (row) => {
        const warnings = row.technicalAnalysis?.warnings || [];
        const bbWarnings = warnings.filter(w => w.includes('Bollinger'));
        
        if (bbWarnings.length === 0) {
          return <span class="text-xs text-muted-gray italic">No warnings</span>;
        }

        return (
          <div class="flex flex-col gap-1">
            {bbWarnings.map(w => {
              const isUpper = w.includes('Upper');
              return (
                <span class={`text-[11px] px-2 py-0.5 rounded w-fit ${isUpper ? 'bg-critical-red/20 text-critical-red' : 'bg-positive-green/20 text-positive-green'}`}>
                  {isUpper ? '+2σ OVERBOUGHT' : '-2σ OVERSOLD'}
                </span>
              );
            })}
          </div>
        );
      }
    },
    {
      header: 'EMA Trend Status',
      align: 'right',
      cell: (row) => getTrendBadge(row.technicalAnalysis?.trendStatus || 'UNKNOWN')
    }
  ];

  return (
    <div class="mt-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-lg font-bold text-on-surface">Technical Watchdog</h2>
        <span class="text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-full">cinar/indicator TA Engine</span>
      </div>
      
      <div class="border border-outline rounded-xl overflow-hidden bg-surface-container-low">
        <Table 
          data={filteredData()} 
          columns={columns} 
        />
      </div>
    </div>
  );
}
