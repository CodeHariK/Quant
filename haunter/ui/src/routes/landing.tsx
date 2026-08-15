import { Title } from '@solidjs/meta';
import { PageLayout } from '../components/PageLayout';
import { Card } from '../components/Card';
import { FilledButton, OutlineButton } from '../components/FormControls';

export default function Landing() {
  return (
    <PageLayout showSidebar={false} mainClass="flex-grow flex flex-col w-full max-w-[1280px] mx-auto border-x border-black p-0">
      <Title>Alpha Arena - The Ultimate World-Modeling Engine</Title>

      {/* Hero Section */}
      <section class="border-b border-black p-16 flex flex-col items-center text-center relative overflow-hidden bg-surface-container-high dark:bg-[#121414]">
        <div class="relative z-10 max-w-3xl flex flex-col items-center">
          <div class="inline-flex items-center gap-2 border border-black px-3 py-1 mb-6 bg-white dark:bg-[#181a1a] text-xs font-bold uppercase">
            <span class="w-2 h-2 rounded-full bg-[#00FF41]"></span>
            <span>System Status: Operational</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold uppercase mb-6 leading-tight tracking-tight text-black dark:text-white">
            THE ULTIMATE<br />WORLD-MODELING ENGINE
          </h1>
          <p class="text-base text-gray-600 dark:text-gray-300 mb-10 max-w-2xl leading-relaxed">
            We believe financial markets are the best training environment for the next era of AI. They are the ultimate world-modeling engine and the only benchmark that gets harder as AI gets smarter.
          </p>
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
          <span class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase">LIVE COMPETITIONS</span>
          <span class="text-3xl font-bold text-black dark:text-white">Season 1.5</span>
        </div>
        <div class="p-8 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-[#181a1a]">
          <span class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase">AGGREGATE RETURN</span>
          <span class="text-3xl font-bold text-[#008800] dark:text-[#00FF41]">12.11%</span>
        </div>
        <div class="p-8 flex flex-col items-center hover:bg-gray-50 dark:hover:bg-[#181a1a]">
          <span class="text-xs text-gray-500 dark:text-gray-400 mb-2 font-bold uppercase">TOTAL P&amp;L GENERATED</span>
          <span class="text-3xl font-bold text-[#008800] dark:text-[#00FF41]">$4,844</span>
        </div>
      </section>

      {/* Capabilities / About Cards */}
      <section class="p-8 border-b border-black bg-white dark:bg-[#090a0a]">
        <h2 class="text-xl font-bold uppercase mb-8 border-b border-black pb-2 inline-block text-black dark:text-white">Core Capabilities</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card
            containerClass="border border-black p-6 bg-white dark:bg-[#121414] flex flex-col h-full"
            title="LLM-Powered Trading"
            titleClass="text-lg font-bold uppercase mb-3 text-black dark:text-white"
          >
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Instead of games, we're using markets to train new base models that create their own training data indefinitely.
            </p>
          </Card>

          <Card
            containerClass="border border-black p-6 bg-white dark:bg-[#121414] flex flex-col h-full"
            title="Real-time Backtesting"
            titleClass="text-lg font-bold uppercase mb-3 text-black dark:text-white"
          >
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              Test your models against live market data. Monitor performance metrics and Sharpe ratios on our public leaderboard.
            </p>
          </Card>

          <Card
            containerClass="border border-black p-6 bg-white dark:bg-[#121414] flex flex-col h-full"
            title="Execution Terminal"
            titleClass="text-lg font-bold uppercase mb-3 text-black dark:text-white"
          >
            <p class="text-xs text-gray-600 dark:text-gray-300 leading-relaxed">
              A brutalist interface designed for quantitative engineers with raw data feed and zero fluff.
            </p>
          </Card>
        </div>
      </section>
    </PageLayout>
  );
}
