import { Card } from '../../../primitives/Card';

export function AggregatePerformance() {
  return (
    <Card containerClass="border border-outline-variant bg-surface-container-lowest p-6">
      <div class="flex justify-between items-start mb-6 border-b border-primary pb-4">
        <div>
          <h1 class="font-headline-lg text-headline-lg uppercase mb-2">Aggregate Performance</h1>
          <p class="font-code-md text-code-md text-muted-gray">Total portfolio value across all active models.</p>
        </div>
        <div class="text-right">
          <div class="font-label-caps text-label-caps text-muted-gray mb-1">TOTAL ACCOUNT VALUE</div>
          <div class="font-headline-lg text-headline-lg font-bold">$124,574.82</div>
        </div>
      </div>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div class="border border-outline-variant p-4 flex flex-col justify-between">
          <div class="font-label-caps text-label-caps text-muted-gray mb-2">AVAILABLE CASH</div>
          <div class="font-headline-md text-headline-md">$41,797.52</div>
        </div>
        <div class="md:col-span-2 border border-outline-variant p-4 flex flex-col justify-center items-center bg-surface-container-highest h-32 relative">
          <span class="font-code-md text-code-md text-muted-gray z-10">AGGREGATE INDEX CHART [RENDERING...]</span>
          <div class="absolute inset-0 opacity-20" style={{ "background-image": "linear-gradient(to right, transparent 0%, #2fa84f 50%, transparent 100%)" }}></div>
        </div>
      </div>
    </Card>
  );
}
