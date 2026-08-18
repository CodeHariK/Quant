import { Accessor } from 'solid-js';
import { Text } from '../../../primitives/Text';

export interface TickerFinancialStatsProps {
  stockInfo: Accessor<any>;
}

export function TickerFinancialStats(props: TickerFinancialStatsProps) {
  return (
    <> {/* Categorized & Grouped Financial Statistics */}
      {Boolean(props.stockInfo()) && (() => {
        const info = props.stockInfo() || {};

        const ignoredKeys = new Set([
          'symbol', 'shortname', 'longname', 'sector', 'industry', 'fulltimeemployees',
          'city', 'country', 'phone', 'address1', 'address2', 'zip',
          'companyofficers', 'quotetype', 'exchange', 'financialcurrency', 'enterprisevalue'
        ]);

        const categories: { title: string; keys: string[] }[] = [
          {
            title: '📊 VALUATION & KEY RATIOS',
            keys: [
              'marketCap', 'currentPrice', 'trailingPE', 'forwardPE',
              'pegRatio', 'priceToBook', 'bookValue', 'priceToSalesTrailing12Months',
              'enterpriseToRevenue', 'enterpriseToEbitda', 'trailingEps', 'forwardEps'
            ],
          },
          {
            title: '💼 FINANCIAL HEALTH & SOLVENCY',
            keys: [
              'totalCash', 'totalDebt', 'debtToEquity', 'totalCashPerShare',
              'quickRatio', 'currentRatio', 'freeCashflow', 'operatingCashflow'
            ],
          },
          {
            title: '📈 OPERATING PERFORMANCE & MARGINS',
            keys: [
              'ebitda', 'totalRevenue', 'grossProfits', 'netIncomeToCommon', 'revenuePerShare',
              'profitMargins', 'operatingMargins', 'grossMargins', 'ebitdaMargins',
              'revenueGrowth', 'earningsGrowth', 'earningsQuarterlyGrowth', 'returnOnAssets', 'returnOnEquity'
            ],
          },
          {
            title: '📉 MARKET PRICE & TRADING VOLUME',
            keys: [
              'previousClose', 'open', 'dayLow', 'dayHigh', 'fiftyTwoWeekLow', 'fiftyTwoWeekHigh',
              'fiftyDayAverage', 'twoHundredDayAverage', '52WeekChange', 'volume',
              'averageVolume', 'averageVolume10days', 'beta', 'floatShares', 'sharesOutstanding'
            ],
          },
          {
            title: '🎯 ANALYST TARGETS & RECOMMENDATIONS',
            keys: [
              'targetMeanPrice', 'targetHighPrice', 'targetLowPrice', 'targetMedianPrice',
              'recommendationKey', 'recommendationMean', 'numberOfAnalystOpinions'
            ],
          },
        ];

        // Track used keys to render any remaining items in an "OTHER METRICS" group
        const usedKeys = new Set<string>();
        categories.forEach((cat) => cat.keys.forEach((k) => usedKeys.add(k.toLowerCase())));

        const remainingKeys = Object.keys(info).filter(
          (k) => !ignoredKeys.has(k.toLowerCase()) && !usedKeys.has(k.toLowerCase())
        );

        if (remainingKeys.length > 0) {
          categories.push({
            title: '📋 OTHER STATISTICS & PERIOD EPOCHS',
            keys: remainingKeys,
          });
        }

        const renderValue = (val: any) => {
          if (val === null || val === undefined) return <Text variant="muted">null</Text>;
          if (typeof val === 'object') return <pre class="font-mono text-xs bg-surface-container-low p-2 overflow-x-auto">{JSON.stringify(val, null, 2)}</pre>;
          if (typeof val === 'number') return <Text status="success">{val.toLocaleString()}</Text>;
          if (typeof val === 'boolean') return <Text status="accent">{val ? 'TRUE' : 'FALSE'}</Text>;
          return <Text variant="code">{String(val)}</Text>;
        };

        return (
          <div class="space-y-6 mb-8">
            {categories.map((cat) => {
              const items = cat.keys
                .map((k) => {
                  const actualKey = Object.keys(info).find((x) => x.toLowerCase() === k.toLowerCase());
                  return actualKey ? [actualKey, info[actualKey]] : null;
                })
                .filter((x): x is [string, any] => x !== null && x[1] !== undefined);

              if (items.length === 0) return null;


              return (
                <section class="border border-outline-variant overflow-hidden">
                  <div class="border-b border-outline-variant px-4 py-3 bg-surface-container-low flex justify-between items-center text-xs font-bold uppercase tracking-wide">
                    <Text variant="h3" class="text-xs">{cat.title}</Text>
                    <Text variant="muted">{items.length} METRICS</Text>
                  </div>

                  <div class="divide-y divide-outline-variant">
                    {items.map(([key, val]) => (
                      <div class="px-6 py-3 flex flex-col md:flex-row md:items-center justify-between gap-2 hover:bg-surface-container-low transition-colors">
                        <Text variant="label" class="md:w-1/3">{key}</Text>
                        <div class="md:w-2/3 text-sm text-right md:text-left">{renderValue(val)}</div>
                      </div>
                    ))}
                  </div>
                </section>
              );
            })}
          </div>
        );
      })()}
    </>
  );
}