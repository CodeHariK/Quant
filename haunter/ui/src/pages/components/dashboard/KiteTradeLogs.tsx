import { Accessor } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Table } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { KitePortfolioReport } from '../../../api/stockApi';

export interface KiteTradeLogsProps {
  kiteReport: Accessor<KitePortfolioReport | null>;
}

export function KiteTradeLogs(props: KiteTradeLogsProps) {
  return (
    <Card
      containerClass="border border-outline-variant bg-surface p-6"
      headerClass="flex justify-between items-center mb-4 border-b border-outline-variant pb-3"
      title="Executed Trade Logs & Timestamps (KiteConnect)"
      titleClass="font-headline-md text-headline-md uppercase font-bold text-on-surface"
    >
      <Table
        columns={[
          {
            header: 'DATE & TIMESTAMP',
            cell: (r) => <Text variant="muted">{new Date(r.tradeTimestamp).toLocaleString()}</Text>,
            className: 'p-3',
          },
          {
            header: 'SYMBOL',
            cell: (r) => <Text variant="code" class="font-bold">{r.tradingsymbol}</Text>,
            className: 'p-3',
          },
          {
            header: 'TYPE',
            cell: (r) => (
              <Text status={r.transactionType === 'BUY' ? 'success' : 'error'}>
                {r.transactionType}
              </Text>
            ),
            className: 'p-3',
          },
          {
            header: 'QTY',
            cell: (r) => <Text variant="code">{r.quantity}</Text>,
            className: 'p-3',
          },
          {
            header: 'AVG EXECUTION PRICE',
            cell: (r) => <Text variant="code">₹{r.averagePrice.toFixed(2)}</Text>,
            className: 'p-3',
          },
          {
            header: 'ORDER ID',
            cell: (r) => <Text variant="muted">{r.orderId}</Text>,
            className: 'p-3',
          },
        ]}
        data={props.kiteReport()!.tradeHistory}
      />
    </Card>
  );
}
