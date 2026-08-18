import { Accessor } from 'solid-js';
import { Card } from '../../../primitives/Card';
import { Text } from '../../../primitives/Text';
import type { FullValuationReport } from '../../../types/events';

export interface TickerAnalystConsensusProps {
  fullReport: Accessor<FullValuationReport | null>;
}

export function TickerAnalystConsensus(props: TickerAnalystConsensusProps) {
  return (
    <> {/* Wall Street Analyst Consensus Recommendations Banner */}
      {props.fullReport()?.recommendations && (() => {
        const rec = props.fullReport()?.recommendations as any;
        const trend = Array.isArray(rec?.trend) && rec.trend.length > 0 ? rec.trend[0] : (rec?.trend ?? rec);
        return (
          <Card>
            <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-2 mb-3">
              <Text variant="label">🏛️ WALL STREET ANALYST CONSENSUS RATINGS (CURRENT MONTH)</Text>
              <Text variant="muted">Source: Yahoo Finance Analyst Consensus</Text>
            </div>

            <div class="grid grid-cols-2 md:grid-cols-5 gap-3">
              <Card>
                <Text variant="label" class="text-emerald-500">STRONG BUY</Text>
                <Text variant="h1" class="text-emerald-600">
                  {trend?.strongBuy ?? trend?.StrongBuy ?? 0}
                </Text>
              </Card>

              <Card>
                <Text variant="label" class="text-green-500">BUY</Text>
                <Text variant="h1" class="text-green-600">
                  {trend?.buy ?? trend?.Buy ?? 0}
                </Text>
              </Card>

              <Card>
                <Text variant="label" class="text-blue-500">HOLD</Text>
                <Text variant="h1" class="text-blue-600">
                  {trend?.hold ?? trend?.Hold ?? 0}
                </Text>
              </Card>

              <Card>
                <Text variant="label" class="text-orange-500">SELL</Text>
                <Text variant="h1" class="text-orange-600">
                  {trend?.sell ?? trend?.Sell ?? 0}
                </Text>
              </Card>

              <Card>
                <Text variant="label" class="text-red-500">STRONG SELL</Text>
                <Text variant="h1" class="text-red-600">
                  {trend?.strongSell ?? trend?.StrongSell ?? 0}
                </Text>
              </Card>
            </div>
          </Card>
        );
      })()}
    </>
  );
}