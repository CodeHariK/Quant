import { createSignal, createEffect, Show, For } from 'solid-js';
import { fetchKiteGTTs, type KiteGTT } from '../../../api/stockApi';
import { Table, Column } from '../../../primitives/Table';
import { Badge } from '../../../primitives/Badge';

export function KiteGTTTable() {
  const [gtts, setGtts] = createSignal<KiteGTT[]>([]);
  const [loading, setLoading] = createSignal<boolean>(true);
  const [error, setError] = createSignal<string | null>(null);
  const [refreshing, setRefreshing] = createSignal<boolean>(false);

  const loadGTTs = async () => {
    try {
      setError(null);
      const data = await fetchKiteGTTs();
      setGtts(data.gtts || []);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch GTT orders');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  createEffect(
    () => true,
    () => {
      loadGTTs();
    }
  );

  const handleRefresh = () => {
    setRefreshing(true);
    loadGTTs();
  };

  const getGTTTotalValue = (gtt: KiteGTT) => {
    const triggerPrice = gtt.condition?.trigger_values?.[0] || 0;
    const totalQty = gtt.orders?.reduce((acc, ord) => acc + (ord.quantity || 0), 0) || 0;
    return triggerPrice * totalQty;
  };

  const columns: Column<KiteGTT>[] = [
    {
      header: 'Symbol',
      cell: (row) => (
        <div>
          <span class="font-bold text-foreground">{row.condition?.tradingsymbol || 'N/A'}</span>
          <span class="text-[10px] text-muted block font-normal">{row.condition?.exchange || 'NSE'}</span>
        </div>
      ),
      sortValue: (row) => row.condition?.tradingsymbol || '',
    },
    {
      header: 'Type',
      cell: (row) => <Badge label={row.type} variant="primary" />,
      sortValue: (row) => row.type,
    },
    {
      header: 'Status',
      cell: (row) => (
        <Badge
          label={row.status}
          variant={row.status === 'active' ? 'success' : 'warning'}
        />
      ),
      sortValue: (row) => row.status,
    },
    {
      header: 'Trigger Price',
      cell: (row) => <span class="font-semibold text-foreground">{row.condition?.trigger_values ? `₹${row.condition.trigger_values.join(', ')}` : 'N/A'}</span>,
      sortValue: (row) => row.condition?.trigger_values?.[0] || 0,
    },
    {
      header: 'Last Price',
      cell: (row) => <span class="text-muted">₹{row.condition?.last_price ? row.condition.last_price.toFixed(2) : '-'}</span>,
      sortValue: (row) => row.condition?.last_price || 0,
    },
    {
      header: 'Qty',
      cell: (row) => (
        <div class="flex flex-col gap-0.5">
          <For each={row.orders}>
            {(ord) => (
              <div class="text-[11px] leading-tight font-semibold">
                <span class={ord.transaction_type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                  {ord.transaction_type.toUpperCase()}
                </span>{' '}
                {ord.quantity}
              </div>
            )}
          </For>
        </div>
      ),
    },
    {
      header: 'Trigger Value',
      cell: (row) => {
        const totalVal = getGTTTotalValue(row);
        return <span class="font-bold text-foreground">{totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}</span>;
      },
      sortValue: (row) => getGTTTotalValue(row),
    },
    {
      header: 'Created At',
      align: 'right',
      cell: (row) => <span class="text-muted text-[11px]">{row.created_at ? new Date(row.created_at).toLocaleDateString() : '-'}</span>,
      sortValue: (row) => row.created_at ? new Date(row.created_at).getTime() : 0,
    },
  ];

  return (
    <div class="w-full bg-surface border border-outline-variant rounded-lg p-4 mb-6 shadow-sm">
      <div class="flex items-center justify-between mb-4">
        <div>
          <h2 class="text-lg font-bold text-foreground flex items-center gap-2">
            <span>🎯</span> Active & Pending GTT Orders
          </h2>
          <p class="text-xs text-muted">Good Till Triggered orders fetched directly from Zerodha Kite</p>
        </div>

        <button
          onClick={handleRefresh}
          disabled={refreshing()}
          class="px-3 py-1.5 text-xs font-semibold rounded bg-surface-variant text-foreground border border-outline hover:bg-outline-variant transition-colors flex items-center gap-1.5 disabled:opacity-50"
        >
          <span class={refreshing() ? 'animate-spin' : ''}>🔄</span>
          <span>{refreshing() ? 'Fetching...' : 'Refresh GTTs'}</span>
        </button>
      </div>

      <Show when={loading()}>
        <div class="py-8 text-center text-sm text-muted animate-pulse">
          Loading Zerodha GTT orders...
        </div>
      </Show>

      <Show when={error()}>
        <div class="p-3 bg-red-500/10 border border-red-500/30 text-red-600 rounded text-xs">
          Unable to fetch GTT orders: {error()}
        </div>
      </Show>

      <Show when={!loading() && !error()}>
        <Show
          when={gtts().length > 0}
          fallback={
            <div class="py-8 text-center text-xs text-muted bg-surface-variant/30 rounded border border-dashed border-outline-variant">
              No active or pending GTT orders found on your Zerodha account.
            </div>
          }
        >
          <Table
            columns={columns}
            data={gtts()}
          />
        </Show>
      </Show>
    </div>
  );
}
