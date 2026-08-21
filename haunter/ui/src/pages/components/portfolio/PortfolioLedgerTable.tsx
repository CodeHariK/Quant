import { Table, Column } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { StockSummary } from '../../../hooks/usePortfolioSimulation';
import { useNavigate } from '@solidjs/router';

interface PortfolioLedgerTableProps {
  stockBreakdown: StockSummary[];
  isKite: boolean;
  onRemoveStock: (symbol: string, e: Event) => void;
  isAddingStock: boolean;
  setIsAddingStock: (val: boolean) => void;
  handleAddStock: (e: Event) => void;
  newSymbol: string;
  setNewSymbol: (val: string) => void;
  newQty: number;
  setNewQty: (val: number) => void;
  newSip: number;
  setNewSip: (val: number) => void;
}

export function PortfolioLedgerTable(props: PortfolioLedgerTableProps) {
  const navigate = useNavigate();

  const totalPortfolioValue = () => props.stockBreakdown.reduce((sum, s) => sum + s.currentValue, 0);

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
      aggregate: (data: StockSummary[]) => {
        const totalReturn = data.reduce((sum, row) => sum + row.lumpsumReturn, 0);
        const isPositive = totalReturn >= 0;
        
        return (
          <span class={`font-bold ${isPositive ? 'text-secondary-container' : 'text-critical-red'}`}>
            {isPositive ? '+' : ''}{totalReturn.toFixed(2)}%
          </span>
        );
      }
    },
    ...(props.isKite ? [] : [{
      header: '',
      align: 'right' as const,
      cell: (row: StockSummary) => (
        <button
          onClick={(e) => props.onRemoveStock(row.symbol, e)}
          class="text-muted-gray hover:text-critical-red transition-colors opacity-0 group-hover:opacity-100"
          title="Remove"
        >
          ✕
        </button>
      ),
    }])
  ];

  return (
    <div class="mt-6 flex flex-col gap-4">
      <div class="flex justify-between items-end">
        <Text variant='h3'>Holding Breakdown & Contributions</Text>
        {!props.isKite && (
          <button
            onClick={() => props.setIsAddingStock(!props.isAddingStock)}
            class="text-xs bg-primary text-on-primary px-3 py-1.5 rounded hover:bg-primary-container hover:text-on-primary-container transition-colors font-medium"
          >
            {props.isAddingStock ? 'Cancel' : '+ Add Stock'}
          </button>
        )}
      </div>

      {props.isAddingStock && !props.isKite && (
        <form onSubmit={props.handleAddStock} class="p-4 border border-outline rounded-lg bg-surface-container-high flex flex-wrap gap-4 items-end">
          <div class="flex flex-col gap-1 min-w-[200px] flex-1">
            <label class="text-xs text-muted-gray">Symbol</label>
            <input type="text" required placeholder="e.g. RELIANCE.NS" value={props.newSymbol} onInput={e => props.setNewSymbol(e.currentTarget.value)} class="bg-surface text-on-surface border border-outline rounded px-3 py-2 text-sm outline-none focus:border-primary" />
          </div>
          <div class="flex gap-4 flex-1">
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-xs text-muted-gray">Start Qty</label>
              <input type="number" min="0" step="0.01" value={props.newQty} onInput={e => props.setNewQty(parseFloat(e.currentTarget.value) || 0)} class="bg-surface text-on-surface border border-outline rounded px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
            <div class="flex flex-col gap-1 flex-1">
              <label class="text-xs text-muted-gray">SIP/Mo (₹)</label>
              <input type="number" min="0" value={props.newSip} onInput={e => props.setNewSip(parseFloat(e.currentTarget.value) || 0)} class="bg-surface text-on-surface border border-outline rounded px-3 py-2 text-sm outline-none focus:border-primary" />
            </div>
          </div>
          <button type="submit" class="text-sm bg-on-surface text-surface px-6 py-2 rounded font-medium hover:bg-outline-variant transition-colors h-[38px]">Save Holding</button>
        </form>
      )}

      <Table
        columns={columns}
        data={props.stockBreakdown}
        showSummary={true}
        rowClass={() => 'group'}
        onRowClick={(row) => navigate(`/ticker?symbol=${encodeURIComponent(row.symbol)}`)}
      />
    </div>
  );
}
