import { Accessor, createSignal, createEffect, For } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Table } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import { Chip } from '../../../primitives/Chip';
import { TradeBreakdownModal } from './TradeBreakdownModal';
import { fetchTradebookRecords, type KitePortfolioReport, type TradebookRecord } from '../../../api/stockApi';

export interface KiteHoldingsTableProps {
  kiteReport: Accessor<KitePortfolioReport | null>;
}

export function KiteHoldingsTable(props: KiteHoldingsTableProps) {
  const [tradebook, setTradebook] = createSignal<TradebookRecord[]>([]);
  const [selectedSymbol, setSelectedSymbol] = createSignal<string | null>(null);

  createEffect(
    () => true,
    () => {
      fetchTradebookRecords()
        .then((res) => setTradebook(res.records || []))
        .catch(() => { });
    }
  );

  const totalValue = () => props.kiteReport()?.holdings.reduce((acc, item) => acc + (item.quantity * item.lastPrice), 0) || 0;

  const symbolTrades = () => {
    const sym = selectedSymbol();
    if (!sym) return [];
    return tradebook().filter(
      (t) => t.symbol.toUpperCase() === sym.toUpperCase()
    );
  };

  return (
    <>
      <Card
        containerClass="border border-outline-variant bg-surface p-6"
        headerClass="flex justify-between items-center mb-4 border-b border-outline-variant pb-3"
        title={`Zerodha Equity Holdings (${props.kiteReport()!.holdings.length} Assets)`}
        titleClass="font-headline-md text-headline-md uppercase font-bold text-on-surface"
      >
        <Table
          columns={[
            {
              header: 'SYMBOL',
              cell: (r) => (
                <div class="flex items-center gap-2">
                  <Text variant="code" class="font-bold">{r.tradingsymbol}</Text>
                  <button onClick={() => setSelectedSymbol(r.tradingsymbol)}
                    title="View Tradebook Breakdown">🍭</button>
                </div>
              ),
              className: 'p-3',
              aggregate: 'count',
            },
            {
              header: 'EXCHANGE',
              cell: (r) => <Text variant="code">{r.exchange}</Text>,
              className: 'p-3',
            },
            {
              header: 'QTY',
              cell: (r) => (
                <div class="flex items-center gap-1.5">
                  <Text variant="code" class="font-bold">{r.quantity}</Text>
                  {r.t1Quantity && r.t1Quantity > 0 ? (
                    <Chip label={`T1: +${r.t1Quantity}`} color="warning" class="text-[9px] py-0 px-1 font-mono" />
                  ) : null}
                  {r.dayQuantity && r.dayQuantity > 0 ? (
                    <Chip label={`DAY: +${r.dayQuantity}`} color="info" class="text-[9px] py-0 px-1 font-mono" />
                  ) : null}
                </div>
              ),
              className: 'p-3',
              sortValue: (r) => r.quantity,
              aggregate: 'sum',
            },
            {
              header: 'AVG PRICE',
              cell: (r) => <Text variant="code">₹{r.averagePrice.toFixed(2)}</Text>,
              className: 'p-3',
              sortValue: (r) => r.averagePrice,
              aggregate: 'avg',
              aggregateFormatter: (v) => `₹${v.toFixed(2)}`,
            },
            {
              header: 'LAST PRICE',
              cell: (r) => <Text variant="code">₹{r.lastPrice.toFixed(2)}</Text>,
              className: 'p-3',
              sortValue: (r) => r.lastPrice,
            },
            {
              header: 'TOTAL VALUE',
              cell: (r) => <Text variant="code" class="font-bold">₹{(r.quantity * r.lastPrice).toFixed(2)}</Text>,
              className: 'p-3',
              sortValue: (r) => r.quantity * r.lastPrice,
              aggregate: 'sum',
              aggregateFormatter: (v) => `₹${v.toFixed(2)}`,
            },
            {
              header: 'TOTAL %',
              cell: (r) => {
                const tot = totalValue();
                const perc = tot > 0 ? ((r.quantity * r.lastPrice) / tot) * 100 : 0;
                return <Text variant="code">{perc.toFixed(2)}%</Text>;
              },
              className: 'p-3',
              sortValue: (r) => {
                const tot = totalValue();
                return tot > 0 ? ((r.quantity * r.lastPrice) / tot) * 100 : 0;
              },
              aggregate: 'sum',
              aggregateFormatter: () => '100.00%',
            },
            {
              header: 'P&L (INR)',
              cell: (r) => (
                <Text status={r.pnl >= 0 ? 'success' : 'error'}>
                  {r.pnl >= 0 ? `+₹${r.pnl.toFixed(2)}` : `-₹${Math.abs(r.pnl).toFixed(2)}`}
                </Text>
              ),
              align: 'right',
              className: 'p-3 text-right',
              sortValue: (r) => r.pnl,
              aggregate: 'sum',
              aggregateFormatter: (v) => (v >= 0 ? `+₹${v.toFixed(2)}` : `-₹${Math.abs(v).toFixed(2)}`),
            },
            {
              header: 'P&L (%)',
              cell: (r) => {
                const pnlPerc = r.averagePrice > 0 ? ((r.lastPrice - r.averagePrice) / r.averagePrice) * 100 : 0;
                return (
                  <Text status={pnlPerc >= 0 ? 'success' : 'error'}>
                    {pnlPerc >= 0 ? `+${pnlPerc.toFixed(2)}%` : `${pnlPerc.toFixed(2)}%`}
                  </Text>
                );
              },
              align: 'right',
              className: 'p-3 text-right',
              sortValue: (r) => (r.averagePrice > 0 ? ((r.lastPrice - r.averagePrice) / r.averagePrice) * 100 : 0),
            },
          ]}
          data={props.kiteReport()!.holdings}
          showSummary
        />
      </Card>

      <TradeBreakdownModal
        selectedSymbol={selectedSymbol()}
        onClose={() => setSelectedSymbol(null)}
        symbolTrades={symbolTrades()}
      />
    </>
  );
}
