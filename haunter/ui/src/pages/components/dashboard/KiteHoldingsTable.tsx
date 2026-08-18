import { Accessor } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Table } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { KitePortfolioReport } from '../../../api/stockApi';

export interface KiteHoldingsTableProps {
  kiteReport: Accessor<KitePortfolioReport | null>;
}

export function KiteHoldingsTable(props: KiteHoldingsTableProps) {
  return (
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
            cell: (r) => <Text variant="code" class="font-bold">{r.tradingsymbol}</Text>,
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
            cell: (r) => <Text variant="code">{r.quantity}</Text>,
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
        ]}
        data={props.kiteReport()!.holdings}
        showSummary
      />
    </Card>
  );
}
