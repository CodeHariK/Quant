import { Title } from '@solidjs/meta';
import { createSignal, createEffect, For } from 'solid-js';
import { PageLayout } from '../components/PageLayout';
import { Card } from '../components/Card';
import { Table, Column } from '../components/Table';
import { FilledButton, OutlineButton } from '../components/FormControls';
import { Text } from '../components/Text';
import { uploadTradebookCSV, fetchTradebookRecords, type TradebookRecord } from '../api/stockApi';

export default function Tradebook() {
  const [records, setRecords] = createSignal<TradebookRecord[]>([]);
  const [availableYears, setAvailableYears] = createSignal<number[]>([]);
  const [selectedYear, setSelectedYear] = createSignal<number | 'ALL'>('ALL');
  const [loading, setLoading] = createSignal<boolean>(false);
  const [uploading, setUploading] = createSignal<boolean>(false);
  const [statusMsg, setStatusMsg] = createSignal<string | null>(null);
  const [errorMsg, setErrorMsg] = createSignal<string | null>(null);
  let fileInputRef: HTMLInputElement | undefined;

  const loadTradebook = (year?: number) => {
    setLoading(true);
    setErrorMsg(null);
    fetchTradebookRecords(year)
      .then((res) => {
        setRecords(res.records || []);
        if (res.availableYears && res.availableYears.length > 0) {
          setAvailableYears(res.availableYears);
        }
        setLoading(false);
      })
      .catch((err) => {
        setErrorMsg(err.message);
        setLoading(false);
      });
  };

  createEffect(
    () => selectedYear(),
    (yrVal) => {
      const yr = yrVal === 'ALL' ? undefined : (yrVal as number);
      loadTradebook(yr);
    }
  );

  const handleFileUpload = (e: Event) => {
    const target = e.target as HTMLInputElement;
    if (!target.files || target.files.length === 0) return;

    const file = target.files[0];
    setUploading(true);
    setStatusMsg(null);
    setErrorMsg(null);

    uploadTradebookCSV(file)
      .then((res) => {
        setStatusMsg(`Successfully imported ${res.importedCount} historical trades from Zerodha Console CSV!`);
        setUploading(false);
        const yr = selectedYear() === 'ALL' ? undefined : (selectedYear() as number);
        loadTradebook(yr);
      })
      .catch((err) => {
        setErrorMsg(`Upload failed: ${err.message}`);
        setUploading(false);
      });
  };

  const columns: Column<TradebookRecord>[] = [
    {
      header: 'DATE & TIME',
      cell: (r) => <Text variant="muted">{new Date(r.tradeDate).toLocaleString()}</Text>,
      className: 'p-3',
      sortValue: (r) => new Date(r.tradeDate).getTime(),
    },
    {
      header: 'YEAR',
      cell: (r) => <Text variant="code" class="font-bold">{r.year}</Text>,
      className: 'p-3',
      sortValue: (r) => r.year,
      aggregate: 'count',
    },
    {
      header: 'SYMBOL',
      cell: (r) => <Text variant="code" class="font-bold">{r.symbol}</Text>,
      className: 'p-3',
      sortValue: (r) => r.symbol,
    },
    {
      header: 'TYPE',
      cell: (r) => (
        <Text variant={r.transactionType === 'BUY' ? 'success' : 'error'}>
          {r.transactionType}
        </Text>
      ),
      className: 'p-3',
      sortValue: (r) => r.transactionType,
    },
    {
      header: 'QUANTITY',
      cell: (r) => <Text variant="code">{r.quantity.toLocaleString()}</Text>,
      className: 'p-3',
      sortValue: (r) => r.quantity,
      aggregate: 'sum',
      aggregateFormatter: (v) => v.toLocaleString(),
    },
    {
      header: 'EXECUTION PRICE',
      cell: (r) => <Text variant="code">₹{r.price.toFixed(2)}</Text>,
      className: 'p-3',
      sortValue: (r) => r.price,
      aggregate: 'avg',
      aggregateFormatter: (v) => `₹${v.toFixed(2)}`,
    },
    {
      header: 'TRADE ID',
      cell: (r) => <Text variant="muted">{r.tradeId || '—'}</Text>,
      className: 'p-3',
    },
    {
      header: 'SEGMENT',
      cell: (r) => <Text variant="code">{r.segment || r.exchange || 'EQ'}</Text>,
      className: 'p-3',
    },
  ];

  return (
    <PageLayout showSidebar={false} mainClass="flex-grow p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      <Title>Alpha Arena - Historical Tradebook Ledger</Title>

      {/* Header Bar */}
      <header class="border border-black bg-white p-6 relative">
        <div class="absolute top-0 left-0 w-full h-1 bg-black"></div>
        <div class="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <Text variant="h1" class="block">HISTORICAL TRADEBOOK LEDGER</Text>
            <Text variant="muted" class="mt-1 block">
              Multi-year historical trade breakdown per year. Parsed from Zerodha Console CSV exports and stored in BoltDB.
            </Text>
          </div>

          <div class="flex items-center gap-3">
            <input
              type="file"
              accept=".csv"
              ref={fileInputRef}
              onChange={handleFileUpload}
              class="hidden"
            />
            <FilledButton onClick={() => fileInputRef?.click()} loading={uploading()}>
              📁 UPLOAD TRADEBOOK CSV ↗
            </FilledButton>
          </div>
        </div>
      </header>

      {statusMsg() && <Text variant="success" class="block p-3 border border-green-500 bg-green-50">{statusMsg()}</Text>}
      {errorMsg() && <Text variant="error" class="block p-3 border border-red-500 bg-red-50">{errorMsg()}</Text>}

      {/* Year Filter Tabs */}
      <div class="flex flex-wrap items-center justify-between gap-4 border-b border-black pb-4">
        <div class="flex flex-wrap items-center gap-2">
          <Text variant="label" class="mr-2">FILTER BY YEAR:</Text>
          <OutlineButton
            size="sm"
            onClick={() => setSelectedYear('ALL')}
            class={selectedYear() === 'ALL' ? 'bg-black text-white dark:bg-white dark:text-black font-bold' : ''}
          >
            ALL YEARS ({records().length})
          </OutlineButton>
          <For each={availableYears()}>
            {(yr) => (
              <OutlineButton
                size="sm"
                onClick={() => setSelectedYear(yr)}
                class={selectedYear() === yr ? 'bg-black text-white dark:bg-white dark:text-black font-bold' : ''}
              >
                {yr}
              </OutlineButton>
            )}
          </For>
        </div>

        <Text variant="muted">
          Showing {records().length} trade records {selectedYear() !== 'ALL' ? `for ${selectedYear()}` : 'across all years'}
        </Text>
      </div>

      {/* Interactive Sortable Tradebook Table with Summary Aggregates */}
      <Card containerClass="border border-black bg-white p-6">
        {loading() ? (
          <Text variant="muted" class="animate-pulse p-4 block text-center">Loading tradebook records from BoltDB...</Text>
        ) : records().length === 0 ? (
          <div class="text-center py-12">
            <Text variant="h3" class="mb-2 block">NO TRADEBOOK RECORDS FOUND</Text>
            <Text variant="muted" class="mb-6 block">
              Upload your Zerodha Console Tradebook CSV file above to display your multi-year historical trade breakdown per year.
            </Text>
            <OutlineButton onClick={() => fileInputRef?.click()}>
              📁 UPLOAD TRADEBOOK CSV
            </OutlineButton>
          </div>
        ) : (
          <Table
            columns={columns}
            data={records()}
            showSummary
          />
        )}
      </Card>
    </PageLayout>
  );
}
