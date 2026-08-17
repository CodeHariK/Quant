import { Title } from '@solidjs/meta';
import { PageLayout } from '../components/PageLayout';
import { Card } from '../components/Card';
import { FilledButton, OutlineButton } from '../components/FormControls';
import { Text } from '../components/Text';

export default function Landing() {
  return (
    <PageLayout showSidebar={false} mainClass="flex-grow flex flex-col w-full max-w-[1280px] mx-auto border-x border-black p-0">
      <Title>Alpha Arena - The Ultimate World-Modeling Engine</Title>

      {/* Hero Section */}
      <section class="border-b border-black p-16 flex flex-col items-center text-center relative overflow-hidden bg-surface-container-high dark:bg-[#121414]">
        <div class="relative z-10 max-w-3xl flex flex-col items-center">
          <div class="inline-flex items-center gap-2 border border-black px-3 py-1 mb-6 bg-white dark:bg-[#181a1a]">
            <span class="w-2 h-2 rounded-full bg-[#2fa84f]"></span>
            <Text variant="label" class="text-black dark:text-white">System Status: Operational</Text>
          </div>
          <Text variant="h1" class="mb-6 leading-tight">
            THE ULTIMATE<br />WORLD-MODELING ENGINE
          </Text>
          <Text variant="body" class="mb-10 max-w-2xl text-base">
            We believe financial markets are the best training environment for the next era of AI. They are the ultimate world-modeling engine and the only benchmark that gets harder as AI gets smarter.
          </Text>
          <div class="flex flex-col sm:flex-row gap-4 text-xs font-bold">
            <FilledButton size="lg">
              Join the Waitlist
            </FilledButton>
            <a href="/leaderboard">
              <OutlineButton size="lg" class="w-full">
                View Leaderboard
              </OutlineButton>
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section class="border-b border-black grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black bg-white dark:bg-[#0e1010] text-center font-mono">
        <div class="p-8 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-[#181a1a]">
          <Text variant="label" class="mb-2">LIVE COMPETITIONS</Text>
          <Text variant="h2">Season 1.5</Text>
        </div>
        <div class="p-8 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-[#181a1a]">
          <Text variant="label" class="mb-2">AGGREGATE RETURN</Text>
          <Text variant="success" class="text-3xl">12.11%</Text>
        </div>
        <div class="p-8 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-[#181a1a]">
          <Text variant="label" class="mb-2">TOTAL P&amp;L GENERATED</Text>
          <Text variant="success" class="text-3xl">$4,844</Text>
        </div>
      </section>

      {/* Capabilities / About Cards */}
      <section class="p-8 border-b border-black bg-white dark:bg-[#090a0a]">
        <Text variant="h2" class="mb-8 border-b border-black pb-2 inline-block">Core Capabilities</Text>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            containerClass="border border-black p-6 bg-white dark:bg-[#121414] flex flex-col h-full"
            title="LLM-Powered Trading"
            titleClass="text-lg font-bold uppercase mb-3 text-black dark:text-white"
          >
            <Text variant="body-sm">
              Instead of games, we're using markets to train new base models that create their own training data indefinitely.
            </Text>
          </Card>

          <Card
            containerClass="border border-black p-6 bg-white dark:bg-[#121414] flex flex-col h-full"
            title="Real-time Backtesting"
            titleClass="text-lg font-bold uppercase mb-3 text-black dark:text-white"
          >
            <Text variant="body-sm">
              Test your models against live market data. Monitor performance metrics and Sharpe ratios on our public leaderboard.
            </Text>
          </Card>

          <Card
            containerClass="border border-black p-6 bg-white dark:bg-[#121414] flex flex-col h-full"
            title="Execution Terminal"
            titleClass="text-lg font-bold uppercase mb-3 text-black dark:text-white"
          >
            <Text variant="body-sm">
              A brutalist interface designed for quantitative engineers with raw data feed and zero fluff.
            </Text>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
}
