import { Table, Column } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { StockSummary } from '../../../hooks/usePortfolioSimulation';
import { useNavigate } from '@solidjs/router';

interface PortfolioLedgerTableProps {
  stockBreakdown: StockSummary[];
}

export function PortfolioLedgerTable(props: PortfolioLedgerTableProps) {
  const navigate = useNavigate();

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0,
    }).format(value);
  };

  const calculateReturn = (current: number, invested: number) => {
    if (invested === 0) return 0;
    return ((current - invested) / invested) * 100;
  };

  const columns: Column<StockSummary>[] = [
    {
      header: 'Symbol',
      accessor: 'symbol',
      cell: (row) => <Text variant="code" class="font-bold text-primary">{row.symbol}</Text>,
      aggregate: 'count',
    },
    {
      header: 'Start Qty',
      align: 'right',
      cell: (row) => <span class="text-on-surface-variant">{row.initialQuantity.toFixed(2)}</span>,
      sortValue: (row) => row.initialQuantity,
    },
    {
      header: 'SIP / Month',
      align: 'right',
      cell: (row) => <span class="text-on-surface-variant">{formatCurrency(row.sipAmount)}</span>,
      sortValue: (row) => row.sipAmount,
      aggregate: 'sum',
      aggregateFormatter: formatCurrency,
    },
    {
      header: 'Total Invested',
      align: 'right',
      cell: (row) => <span>{formatCurrency(row.totalInvested)}</span>,
      sortValue: (row) => row.totalInvested,
      aggregate: 'sum',
      aggregateFormatter: formatCurrency,
    },
    {
      header: 'Current Value',
      align: 'right',
      cell: (row) => <span class="font-medium text-on-surface">{formatCurrency(row.currentValue)}</span>,
      sortValue: (row) => row.currentValue,
      aggregate: 'sum',
      aggregateFormatter: formatCurrency,
    },
    {
      header: 'Current Qty',
      align: 'right',
      cell: (row) => <span class="text-on-surface-variant">{row.currentQty.toFixed(2)}</span>,
      sortValue: (row) => row.currentQty,
    },
    {
      header: 'Absolute Return',
      align: 'right',
      cell: (row) => {
        const absReturn = calculateReturn(row.currentValue, row.totalInvested);
        const isPositive = absReturn >= 0;
        return (
          <span class={`font-medium ${isPositive ? 'text-secondary-container' : 'text-critical-red'}`}>
            {isPositive ? '+' : ''}{absReturn.toFixed(2)}%
          </span>
        );
      },
      sortValue: (row) => calculateReturn(row.currentValue, row.totalInvested),
      aggregate: (data: StockSummary[]) => {
        const totalInvested = data.reduce((sum, row) => sum + row.totalInvested, 0);
        const totalCurrent = data.reduce((sum, row) => sum + row.currentValue, 0);
        const absReturn = calculateReturn(totalCurrent, totalInvested);
        const isPositive = absReturn >= 0;
        return (
          <span class={`font-bold ${isPositive ? 'text-secondary-container' : 'text-critical-red'}`}>
            {isPositive ? '+' : ''}{absReturn.toFixed(2)}%
          </span>
        );
      }
    },
    {
      header: 'Period Return',
      align: 'right',
      cell: (row) => {
        const isPositive = row.lumpsumReturn >= 0;
        return (
          <span class={`font-medium ${isPositive ? 'text-secondary-container' : 'text-critical-red'}`}>
            {isPositive ? '+' : ''}{row.lumpsumReturn.toFixed(2)}%
          </span>
        );
      },
      sortValue: (row) => row.lumpsumReturn,
    },
  ];

  return (
    <div class="mt-6 flex flex-col gap-0">
      <Text variant='h3'>Holding Breakdown & Contributions</Text>
      <Table
        columns={columns}
        data={props.stockBreakdown}
        showSummary={true}
        onRowClick={(row) => navigate(`/ticker?symbol=${encodeURIComponent(row.symbol)}`)}
      />
    </div>
  );
}
