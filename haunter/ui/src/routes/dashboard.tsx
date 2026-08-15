import { Title } from '@solidjs/meta';
import { PageLayout } from '../components/PageLayout';
import { Card, PositionCard } from '../components/Card';

export default function Dashboard() {
  return (
    <PageLayout showSidebar={false} mainClass="flex-grow p-8 max-w-[1600px] mx-auto w-full flex flex-col gap-6">
      <Title>Alpha Arena - Financial Dashboard</Title>

      {/* Top Section: Performance Summary Card */}
      <Card containerClass="border border-primary bg-surface-container-lowest p-6">
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
          <div class="border border-primary p-4 flex flex-col justify-between">
            <div class="font-label-caps text-label-caps text-muted-gray mb-2">AVAILABLE CASH</div>
            <div class="font-headline-md text-headline-md">$41,797.52</div>
          </div>
          <div class="md:col-span-2 border border-primary p-4 flex flex-col justify-center items-center bg-surface-container-high h-32 relative">
            <span class="font-code-md text-code-md text-muted-gray z-10">AGGREGATE INDEX CHART [RENDERING...]</span>
            <div class="absolute inset-0 opacity-20" style={{ "background-image": "linear-gradient(to right, transparent 0%, #00FF41 50%, transparent 100%)" }}></div>
          </div>
        </div>
      </Card>

      {/* Middle Section: Metrics Grid */}
      <section class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card title="TOTAL P&L">
          <div class="font-headline-sm text-headline-sm text-terminal-green font-bold">+$12,425.18</div>
        </Card>
        <Card title="TOTAL FEES">
          <div class="font-headline-sm text-headline-sm text-primary font-bold">$2,086.39</div>
        </Card>
        <Card title="NET REALIZED">
          <div class="font-headline-sm text-headline-sm text-terminal-green font-bold">+$8,345.95</div>
        </Card>
        <Card title="UNREALIZED P&L">
          <div class="font-headline-sm text-headline-sm text-critical-red font-bold">-$1,023.00</div>
        </Card>
      </section>

      {/* Bottom Section: Active Positions */}
      <Card
        containerClass="border border-primary bg-surface-container-lowest p-6"
        headerClass="flex justify-between items-center mb-6 border-b border-primary pb-4"
        title="Active Positions"
        titleClass="font-headline-md text-headline-md uppercase font-bold text-primary"
        headerAction={<button class="border border-primary px-4 py-1 font-label-caps text-label-caps hover:bg-surface-container transition-colors">FILTER</button>}
      >
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <PositionCard
            side="LONG"
            symbol="NVDA"
            model="GPT-5.1"
            entryTime="09:30:00 EST"
            entryPrice="$220.02"
            quantity="50.00"
            leverage="5X"
            unrealizedPl="+$256.50"
            isPositive={true}
          />
          <PositionCard
            side="SHORT"
            symbol="MSFT"
            model="CLAUDE-3.5"
            entryTime="10:15:22 EST"
            entryPrice="$498.50"
            quantity="15.00"
            leverage="2X"
            unrealizedPl="+$52.05"
            isPositive={true}
          />
          <PositionCard
            side="LONG"
            symbol="PLTR"
            model="GEMINI-1.5"
            entryTime="13:45:00 EST"
            entryPrice="$176.00"
            quantity="100.00"
            leverage="10X"
            unrealizedPl="-$118.00"
            isPositive={false}
          />
        </div>
      </Card>
    </PageLayout>
  );
}
