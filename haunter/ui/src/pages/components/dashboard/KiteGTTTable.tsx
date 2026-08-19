import { createSignal, createEffect, Show, For } from 'solid-js';
import { fetchKiteGTTs, type KiteGTT } from '../../../api/stockApi';

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
          <div class="overflow-x-auto">
            <table class="w-full text-left text-xs font-mono border-collapse">
              <thead>
                <tr class="border-b border-outline-variant text-muted bg-surface-variant/50">
                  <th class="py-2.5 px-3">Symbol</th>
                  <th class="py-2.5 px-3">Type</th>
                  <th class="py-2.5 px-3">Status</th>
                  <th class="py-2.5 px-3">Trigger Price</th>
                  <th class="py-2.5 px-3">Last Price</th>
                  <th class="py-2.5 px-3">Qty</th>
                  <th class="py-2.5 px-3 font-semibold text-foreground">Trigger Value (Qty × Trigger)</th>
                  <th class="py-2.5 px-3 text-right">Created At</th>
                </tr>
              </thead>
              <tbody>
                <For each={gtts()}>
                  {(gtt) => {
                    const totalVal = getGTTTotalValue(gtt);
                    return (
                      <tr class="border-b border-outline-variant/40 hover:bg-surface-variant/30 transition-colors">
                        <td class="py-2.5 px-3 font-bold text-foreground">
                          {gtt.condition?.tradingsymbol || 'N/A'}
                          <span class="text-[10px] text-muted block font-normal">{gtt.condition?.exchange || 'NSE'}</span>
                        </td>
                        <td class="py-2.5 px-3 uppercase font-semibold">
                          <span class="px-1.5 py-0.5 rounded text-[10px] bg-primary/10 text-primary border border-primary/20">
                            {gtt.type}
                          </span>
                        </td>
                        <td class="py-2.5 px-3">
                          <span 
                            class={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                              gtt.status === 'active' 
                                ? 'bg-green-500/10 text-green-600 border border-green-500/30' 
                                : 'bg-yellow-500/10 text-yellow-600 border border-yellow-500/30'
                            }`}
                          >
                            {gtt.status}
                          </span>
                        </td>
                        <td class="py-2.5 px-3 font-semibold text-foreground">
                          {gtt.condition?.trigger_values ? `₹${gtt.condition.trigger_values.join(', ')}` : 'N/A'}
                        </td>
                        <td class="py-2.5 px-3 text-muted">
                          ₹{gtt.condition?.last_price ? gtt.condition.last_price.toFixed(2) : '-'}
                        </td>
                        <td class="py-2.5 px-3">
                          <For each={gtt.orders}>
                            {(ord) => (
                              <div class="text-[11px] leading-tight font-semibold">
                                <span class={`font-bold ${ord.transaction_type === 'buy' ? 'text-green-600' : 'text-red-600'}`}>
                                  {ord.transaction_type.toUpperCase()}
                                </span>{' '}
                                {ord.quantity}
                              </div>
                            )}
                          </For>
                        </td>
                        <td class="py-2.5 px-3 font-bold text-foreground">
                          {totalVal > 0 ? `₹${totalVal.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : '-'}
                        </td>
                        <td class="py-2.5 px-3 text-right text-muted text-[11px]">
                          {gtt.created_at ? new Date(gtt.created_at).toLocaleDateString() : '-'}
                        </td>
                      </tr>
                    );
                  }}
                </For>
              </tbody>
            </table>
          </div>
        </Show>
      </Show>
    </div>
  );
}
