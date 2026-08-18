import { Modal } from '../../../primitives/Modal';
import { Table } from '../../../primitives/Table';
import { Text } from '../../../primitives/Text';
import type { TradebookRecord } from '../../../api/stockApi';

export interface TradeBreakdownModalProps {
  selectedSymbol: string | null;
  onClose: () => void;
  symbolTrades: TradebookRecord[];
}

export function TradeBreakdownModal(props: TradeBreakdownModalProps) {
  return (
    <Modal
      isOpen={Boolean(props.selectedSymbol)}
      onClose={props.onClose}
      title={`Historical Trade Breakdown: ${props.selectedSymbol || ''}`}
    >
      <div class="space-y-4">
        <Text variant="muted">
          Showing all execution tranches parsed from your uploaded Zerodha Console Tradebook.
        </Text>

        {props.symbolTrades.length === 0 ? (
          <div class="p-4 border border-outline-variant bg-surface-container-low text-center">
            <Text variant="code" class="block mb-1">NO TRADEBOOK RECORDS FOR {props.selectedSymbol}</Text>
            <Text variant="muted" class="text-xs">
              Upload your Zerodha Console CSV in the Tradebook page to link full multi-year purchase tranches.
            </Text>
          </div>
        ) : (
          <Table
            columns={[
              {
                header: 'DATE & TIME',
                cell: (t) => <Text variant="muted">{new Date(t.tradeDate).toLocaleString()}</Text>,
                className: 'p-2 text-xs',
              },
              {
                header: 'TYPE',
                cell: (t) => (
                  <Text status={t.transactionType === 'BUY' ? 'success' : 'error'}>
                    {t.transactionType}
                  </Text>
                ),
                className: 'p-2 text-xs',
              },
              {
                header: 'QTY',
                cell: (t) => <Text variant="code">{t.quantity}</Text>,
                className: 'p-2 text-xs',
                aggregate: 'sum',
              },
              {
                header: 'PRICE',
                cell: (t) => <Text variant="code">₹{t.price.toFixed(2)}</Text>,
                className: 'p-2 text-xs',
                aggregate: 'avg',
                aggregateFormatter: (v) => `₹${v.toFixed(2)}`,
              },
              {
                header: 'TOTAL VALUE',
                cell: (t) => <Text variant="code">₹{(t.quantity * t.price).toFixed(2)}</Text>,
                className: 'p-2 text-xs',
                aggregate: 'sum',
                aggregateFormatter: (v) => `₹${v.toFixed(2)}`,
              },
            ]}
            data={props.symbolTrades}
            showSummary
          />
        )}
      </div>
    </Modal>
  );
}
