import type { JSX } from '@solidjs/web';
import { createSignal, createMemo  } from 'solid-js';
import { Text, TextStatus } from './Text';

export type AggregateType = 'sum' | 'avg' | 'count' | ((data: any[]) => JSX.Element);

export interface Column<T> {
  header: string;
  accessor?: keyof T;
  cell?: (row: T) => JSX.Element;
  align?: 'left' | 'center' | 'right';
  className?: string;
  headerClassName?: string;
  sortable?: boolean;
  sortValue?: (row: T) => number | string;
  aggregate?: AggregateType;
  aggregateFormatter?: (value: number) => string;
  status?: (row: T) => TextStatus | undefined;
}

export interface TableProps<T> {
  columns: Column<T>[];
  data: T[];
  containerClass?: string;
  tableClass?: string;
  headerClass?: string;
  rowClass?: (row: T, index: number) => string;
  showSummary?: boolean;
}

export function Table<T extends Record<string, any>>(props: TableProps<T>) {
  const [sortKey, setSortKey] = createSignal<string | null>(null);
  const [sortOrder, setSortOrder] = createSignal<'asc' | 'desc'>('asc');

  const handleHeaderClick = (col: Column<T>) => {
    if (col.sortable === false) return;
    const key = String(col.accessor || col.header);
    if (sortKey() === key) {
      if (sortOrder() === 'asc') {
        setSortOrder('desc');
      } else {
        setSortKey(null);
        setSortOrder('asc');
      }
    } else {
      setSortKey(key);
      setSortOrder('asc');
    }
  };

  const sortedData = createMemo(() => {
    const data = [...props.data];
    const key = sortKey();
    if (!key) return data;

    const col = props.columns.find((c) => String(c.accessor || c.header) === key);
    if (!col) return data;

    return data.sort((a, b) => {
      let valA: any = col.sortValue ? col.sortValue(a) : col.accessor ? a[col.accessor] : a[col.header];
      let valB: any = col.sortValue ? col.sortValue(b) : col.accessor ? b[col.accessor] : b[col.header];

      if (typeof valA === 'string' && !isNaN(Number(valA.replace(/[^0-9.-]+/g, '')))) {
        valA = Number(valA.replace(/[^0-9.-]+/g, ''));
      }
      if (typeof valB === 'string' && !isNaN(Number(valB.replace(/[^0-9.-]+/g, '')))) {
        valB = Number(valB.replace(/[^0-9.-]+/g, ''));
      }

      if (valA === valB) return 0;
      if (valA === undefined || valA === null) return 1;
      if (valB === undefined || valB === null) return -1;

      const result = valA < valB ? -1 : 1;
      return sortOrder() === 'asc' ? result : -result;
    });
  });

  const renderAggregateCell = (col: Column<T>, idx: number) => {
    if (!col.aggregate) {
      if (idx === 0) return <Text variant="label" class="font-bold">SUMMARY</Text>;
      return '—';
    }

    if (typeof col.aggregate === 'function') {
      return col.aggregate(props.data);
    }

    const numericValues = props.data
      .map((row) => {
        const val = col.sortValue ? col.sortValue(row) : col.accessor ? row[col.accessor] : undefined;
        if (typeof val === 'number') return val;
        if (typeof val === 'string') {
          const num = Number(String(val).replace(/[^0-9.-]+/g, ''));
          return isNaN(num) ? undefined : num;
        }
        return undefined;
      })
      .filter((v): v is number => v !== undefined);

    if (numericValues.length === 0) return '—';

    if (col.aggregate === 'count') {
      return <Text variant="code" class="font-bold">{numericValues.length}</Text>;
    }

    const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
    const result = col.aggregate === 'avg' ? sum / numericValues.length : sum;
    const formatted = col.aggregateFormatter ? col.aggregateFormatter(result) : result.toLocaleString(undefined, { maximumFractionDigits: 2 });
    const isNeg = result < 0;

    return (
      <Text status={isNeg ? 'error' : 'success'} class="font-bold">
        {col.aggregate === 'avg' ? `AVG: ${formatted}` : formatted}
      </Text>
    );
  };

  const hasSummaryRow = createMemo(() => props.showSummary || props.columns.some((c) => c.aggregate !== undefined));

  return (
    <div class={props.containerClass || "w-full overflow-x-auto border border-outline-variant"}>
      <table class={props.tableClass || "w-full text-left border-collapse text-xs whitespace-nowrap"}>
        <thead class={props.headerClass || "uppercase border-b border-outline-variant font-bold"}>
          <tr>
            {props.columns.map((col) => {
              const key = String(col.accessor || col.header);
              const isSorted = sortKey() === key;
              const isSortable = col.sortable !== false;

              return (
                <th
                  onClick={() => handleHeaderClick(col)}
                  class={`${col.headerClassName || 'p-3 border-r border-outline-variant'} ${isSortable ? 'cursor-pointer select-none hover:bg-surface-container-highest transition-colors' : ''
                    } ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'}`}
                >
                  <div class={`inline-flex items-center gap-1.5 ${col.align === 'right' ? 'justify-end w-full' : col.align === 'center' ? 'justify-center w-full' : ''}`}>
                    <Text variant="label">{col.header}</Text>
                    {isSortable && (
                      <span class="text-[10px] font-mono text-muted-gray">
                        {isSorted ? (sortOrder() === 'asc' ? '▲' : '▼') : '↕'}
                      </span>
                    )}
                  </div>
                </th>
              );
            })}
          </tr>
        </thead>
        <tbody class="divide-y divide-outline-variant">
          {sortedData().map((row, idx) => (
            <tr class={props.rowClass ? props.rowClass(row, idx) : "border-b border-outline-variant hover:bg-surface-container-high transition-colors"}>
              {props.columns.map((col) => (
                <td
                  class={`${col.className || 'p-3 border-r border-outline-variant'} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                >
                  {col.cell ? (
                    col.cell(row)
                  ) : col.accessor ? (
                    <Text status={col.status ? col.status(row) : undefined}>{String(row[col.accessor] ?? '')}</Text>
                  ) : (
                    ''
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
        {hasSummaryRow() && (
          <tfoot class="bg-surface-container-low border-t-2 border-outline-variant font-bold uppercase">
            <tr>
              {props.columns.map((col, idx) => (
                <td
                  class={`${col.className || 'p-3 border-r border-outline-variant'} ${col.align === 'center' ? 'text-center' : col.align === 'right' ? 'text-right' : 'text-left'
                    }`}
                >
                  {renderAggregateCell(col, idx)}
                </td>
              ))}
            </tr>
          </tfoot>
        )}
      </table>
    </div>
  );
}
