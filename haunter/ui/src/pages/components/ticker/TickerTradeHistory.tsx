import { Accessor } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Table } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';

export interface TickerTradeHistoryProps {
  selectedSymbol: Accessor<string>;
}

export function TickerTradeHistory(props: TickerTradeHistoryProps) {
  return (
    <> {/* Trade History Table */}
      <section class="border  overflow-hidden">
        <div class="border-b border-outline-variant p-3 bg-surface-container-low flex justify-between items-center text-xs">
          <Text variant="h3" class="text-xs">RECENT EXECUTION LOG</Text>
          <Text variant="muted">Showing last 5 trades</Text>
        </div>
        <Table
          columns={[
            {
              header: 'TIMESTAMP',
              cell: (row) => <Text variant="muted">{row.timestamp}</Text>,
              className: 'p-3',
            },
            {
              header: 'SYMBOL',
              cell: (row) => <Text variant="code" class="font-bold">{row.symbol}</Text>,
              className: 'p-3',
            },
            {
              header: 'TYPE',
              cell: (row) => <Text status={row.type === 'LONG' ? 'success' : 'error'}>{row.type}</Text>,
              className: 'p-3',
            },
            {
              header: 'ENTRY',
              cell: (row) => <Text variant="code">{row.entry}</Text>,
              className: 'p-3',
            },
            {
              header: 'EXIT',
              cell: (row) => <Text variant="code">{row.exit}</Text>,
              className: 'p-3',
            },
            {
              header: 'P&L',
              cell: (row) => <Text status="success" class="text-right block">{row.pnl}</Text>,
              align: 'right',
              className: 'p-3 text-right',
            },
          ]}
          data={[
            { timestamp: '2024-05-12 14:32:01', symbol: props.selectedSymbol(), type: 'LONG', entry: '$890.45', exit: '$912.30', pnl: '+$4,560.00' },
            { timestamp: '2024-05-12 11:15:44', symbol: props.selectedSymbol(), type: 'SHORT', entry: '$175.20', exit: '$170.10', pnl: '+$2,140.00' },
          ]}
        />
      </section>
    </>
  );
}