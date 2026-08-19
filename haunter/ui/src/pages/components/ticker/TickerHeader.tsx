import { Accessor } from 'solid-js';
import { Text } from '../../../primitives/Text';
import { FilledButton, OutlineButton } from '../../../primitives/FormControls';
import { formatRelativeTime } from '../../../utils/formatters';
import type { FullValuationReport } from '../../../types/events';
import { TickerAnalystConsensus } from './TickerAnalystConsensus';

export interface TickerHeaderProps {
  selectedSymbol: Accessor<string>;
  stockInfo: Accessor<any>;
  fullReport: Accessor<FullValuationReport | null>;
  loading: Accessor<boolean>;
  loadStockReport: (sym: string, force: boolean) => void;
}

export function TickerHeader(props: TickerHeaderProps) {
  const formattedFetchedAt = () => {
    const fetchedAt = props.fullReport()?.fetchedAt;
    if (!fetchedAt) return null;
    return formatRelativeTime(fetchedAt);
  };

  return (
    <> {/* Model & Stock Header */}
      <header class="relative mb-8 bg-surface">
        <div class="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
          <div>
            <Text variant="h1" class="flex items-center">
              {props.stockInfo()?.longName || props.selectedSymbol()}
              <Text variant="code" class="px-2">{props.stockInfo()?.symbol || props.selectedSymbol()}</Text>
              <TickerAnalystConsensus fullReport={props.fullReport} />
            </Text>
            <Text variant="muted" class="mt-2 block">
              SECTOR: {props.stockInfo()?.sector || 'N/A'} | INDUSTRY: {props.stockInfo()?.industry || 'N/A'}
            </Text>
          </div>
          <div class="flex gap-2 text-xs font-bold">
            <FilledButton
              onClick={() => props.loadStockReport(props.selectedSymbol(), true)}
              loading={props.loading()}
            >
              REFRESH {formattedFetchedAt()}
            </FilledButton>
            <OutlineButton>EXPORT VALUATION</OutlineButton>
          </div>
        </div>
      </header>
    </>
  );
}