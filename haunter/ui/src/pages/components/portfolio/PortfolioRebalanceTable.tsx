import { Table, Column } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { StockSummary } from '../../../hooks/usePortfolioSimulation';

interface PortfolioRebalanceTableProps {
  stockBreakdown: StockSummary[];
}

export function PortfolioRebalanceTable(props: PortfolioRebalanceTableProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(value);
  };

  const totalPortfolioValue = () => {
    const firstActual = props.stockBreakdown.length > 0 ? props.stockBreakdown[0].actualPortfolioValue : undefined;
    return firstActual ?? props.stockBreakdown.reduce((sum, s) => sum + s.currentValue, 0);
  };

  const filteredData = () => props.stockBreakdown.filter(s => s.actualInvested !== undefined);

  const columns: Column<StockSummary>[] = [
    {
      header: 'Symbol',
      accessor: 'symbol',
      cell: (row) => <Text variant="code" class="font-bold text-primary">{row.symbol.replace('.NS', '')}</Text>,
      aggregate: 'count'
    },
    {
      header: 'Current Qty',
      align: 'right',
      cell: (row) => <span class="text-on-surface-variant">{(row.actualQty || 0).toFixed(2)}</span>,
      sortValue: (row) => row.actualQty || 0
    },
    {
      header: 'Total Invested',
      align: 'right',
      cell: (row) => <span class="text-on-surface-variant">{formatCurrency(row.actualInvested || 0)}</span>,
      sortValue: (row) => row.actualInvested || 0,
      aggregate: 'sum',
      aggregateFormatter: formatCurrency
    },
    {
      header: 'Current Value',
      align: 'right',
      cell: (row) => <span class="font-medium text-on-surface">{formatCurrency(row.actualValue || 0)}</span>,
      sortValue: (row) => row.actualValue || 0,
      aggregate: 'sum',
      aggregateFormatter: formatCurrency
    },
    {
      header: 'Target Weight',
      align: 'right',
      cell: (row) => <span class="text-on-surface-variant">{row.targetWeight ? (row.targetWeight * 100).toFixed(2) + '%' : '-'}</span>,
      sortValue: (row) => row.targetWeight || 0
    },
    {
      header: 'Target Investment',
      align: 'right',
      cell: (row) => {
        if (!row.targetWeight) return <span class="text-on-surface-variant">-</span>;
        const target = row.targetWeight * totalPortfolioValue();
        return <span class="font-medium text-on-surface">{formatCurrency(target)}</span>;
      },
      sortValue: (row) => (row.targetWeight || 0) * totalPortfolioValue(),
      aggregate: (data) => {
        const total = data.reduce((sum, row) => sum + ((row.targetWeight || 0) * totalPortfolioValue()), 0);
        return formatCurrency(total);
      }
    },
    {
      header: 'Rebalance Action',
      align: 'right',
      cell: (row) => {
        if (!row.targetWeight) return <span class="text-on-surface-variant">-</span>;
        const target = row.targetWeight * totalPortfolioValue();
        const diff = (row.actualValue || 0) - target;
        return (
          <span class={`font-bold ${diff > 0 ? 'text-amber-500' : 'text-primary'}`}>
            {diff > 0 ? 'SELL ' : 'BUY '}{formatCurrency(Math.abs(diff))}
          </span>
        );
      },
      sortValue: (row) => {
        if (!row.targetWeight) return 0;
        return (row.actualValue || 0) - (row.targetWeight * totalPortfolioValue());
      }
    }
  ];

  return (
    <div class="mt-8">
      <div class="flex items-center gap-2 mb-4">
        <h2 class="text-lg font-bold text-on-surface">Target Portfolio Rebalancing</h2>
        <span class="text-xs text-on-surface-variant bg-surface-variant px-2 py-0.5 rounded-full">Actual Holdings</span>
      </div>
      <Table 
        data={filteredData()} 
        columns={columns} 
      />
    </div>
  );
}
