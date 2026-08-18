import { Accessor } from 'solid-js';
import { Text } from '../../../primitives/Text';
import { FilledButton, OutlineButton } from '../../../primitives/FormControls';

export interface TickerHeaderProps {
  selectedSymbol: Accessor<string>;
  stockInfo: Accessor<any>;
  loading: Accessor<boolean>;
  loadStockReport: (sym: string, force: boolean) => void;
}

export function TickerHeader(props: TickerHeaderProps) {
  return (
    <> {/* Model & Stock Header */}
      <header class="border p-6 relative mb-8">
        <div class="absolute top-0 left-0 w-full h-1 bg-green-600"></div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <div class="flex items-center gap-3 mb-2 text-xs">
              <span class="w-3 h-3 bg-[#2fa84f] inline-block border border-outline-variant"></span>
              <Text variant="label">VALUATION ENGINE: YFINANCE (FULL RAW DATA)</Text>
              <Text variant="code" class="border border-outline-variant px-2 py-0.5 ml-2 font-bold">{props.stockInfo()?.symbol || props.selectedSymbol()}</Text>
            </div>
            <Text variant="h1" class="block">{props.stockInfo()?.longName || props.selectedSymbol()}</Text>
            <Text variant="muted" class="mt-2 block">
              SECTOR: {props.stockInfo()?.sector || 'N/A'} | INDUSTRY: {props.stockInfo()?.industry || 'N/A'}
            </Text>
          </div>
          <div class="flex gap-2 text-xs font-bold">
            <FilledButton
              onClick={() => props.loadStockReport(props.selectedSymbol(), true)}
              loading={props.loading()}
            >
              FORCE REFRESH 🔄
            </FilledButton>
            <OutlineButton>EXPORT VALUATION</OutlineButton>
          </div>
        </div>
      </header>
    </>
  );
}