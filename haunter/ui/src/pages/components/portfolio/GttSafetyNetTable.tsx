import { createSignal } from 'solid-js';
import { Table, Column } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { StockSummary } from '../../../hooks/usePortfolioSimulation';

interface GttSafetyNetTableProps {
  stockBreakdown: StockSummary[];
}

export function GttSafetyNetTable(props: GttSafetyNetTableProps) {
  const [multiplier, setMultiplier] = createSignal(1.5);

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 2
    }).format(value);
  };

  const filteredData = () => props.stockBreakdown.filter(s => s.actualInvested !== undefined && s.atr14 !== undefined && s.atr14 > 0);

  const handleDeploy = (symbol: string) => {
    alert(`Mock: Deploying OCO GTT for ${symbol} to Kite! This feature will be integrated with the backend API in the future.`);
  };

  const columns: Column<StockSummary>[] = [
    {
      header: 'Symbol',
      accessor: 'symbol',
      cell: (row) => <Text variant="code" class="font-bold text-primary">{row.symbol.replace('.NS', '')}</Text>,
    },
    {
      header: 'Current Price',
      align: 'right',
      cell: (row) => {
        const price = (row.actualValue || 0) / (row.actualQty || 1);
        return <span class="font-medium text-on-surface">{formatCurrency(price)}</span>;
      },
      sortValue: (row) => (row.actualValue || 0) / (row.actualQty || 1)
    },
    {
      header: '14-Day ATR',
      align: 'right',
      cell: (row) => <span class="text-on-surface-variant">{formatCurrency(row.atr14 || 0)}</span>,
      sortValue: (row) => row.atr14 || 0
    },
    {
      header: 'Suggested Stop Loss',
      align: 'right',
      cell: (row) => {
        const price = (row.actualValue || 0) / (row.actualQty || 1);
        const sl = price - ((row.atr14 || 0) * multiplier());
        return <span class="font-bold text-amber-500">{formatCurrency(sl)}</span>;
      },
      sortValue: (row) => {
        const price = (row.actualValue || 0) / (row.actualQty || 1);
        return price - ((row.atr14 || 0) * multiplier());
      }
    },
    {
      header: 'SL Distance (%)',
      align: 'right',
      cell: (row) => {
        const price = (row.actualValue || 0) / (row.actualQty || 1);
        const dist = (((row.atr14 || 0) * multiplier()) / price) * 100;
        return <span class="text-on-surface-variant">-{dist.toFixed(2)}%</span>;
      },
      sortValue: (row) => {
        const price = (row.actualValue || 0) / (row.actualQty || 1);
        return (((row.atr14 || 0) * multiplier()) / price) * 100;
      }
    },
    {
      header: 'Action',
      align: 'right',
      cell: (row) => (
        <button 
          onClick={() => handleDeploy(row.symbol)}
          class="text-xs bg-primary text-on-primary px-3 py-1.5 rounded font-medium hover:bg-primary-container hover:text-on-primary-container transition-colors"
        >
          Deploy to Kite
        </button>
      ),
    }
  ];

  return (
    <div class="mt-8">
      <div class="flex items-center justify-between mb-4">
        <div class="flex items-center gap-2">
          <h2 class="text-lg font-bold text-on-surface">GTT Safety Net Calculator</h2>
          <span class="text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-full">Risk Management</span>
        </div>
        <div class="flex items-center gap-4 bg-surface-container-high px-4 py-2 rounded-lg border border-outline">
          <label class="text-sm text-on-surface-variant font-medium">
            ATR Multiplier: <span class="text-on-surface font-bold">{multiplier().toFixed(1)}x</span>
          </label>
          <input 
            type="range" 
            min="1.0" 
            max="3.0" 
            step="0.1" 
            value={multiplier()} 
            onInput={(e) => setMultiplier(parseFloat(e.currentTarget.value))}
            class="accent-primary"
          />
        </div>
      </div>
      
      <div class="text-sm text-on-surface-variant mb-4 bg-surface-container-low p-4 rounded-lg border border-outline">
        <p>This tool calculates dynamic Trailing Stop Losses based on the 14-day Average True Range (ATR) of your holdings. Instead of arbitrary percentages, this adjusts your stops based on each asset's natural volatility to prevent being "whipsawed" out of normal market noise.</p>
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
