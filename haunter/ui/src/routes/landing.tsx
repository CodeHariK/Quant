import { Title } from '@solidjs/meta';
import { PageLayout } from '../components/PageLayout';

export default function Landing() {
  return (
    <PageLayout showSidebar={false} mainClass="flex-grow flex flex-col w-full max-w-[1280px] mx-auto border-x border-black p-0">
      <Title>Alpha Arena - The Ultimate World-Modeling Engine</Title>

      {/* Hero Section */}
      <section class="border-b border-black p-16 flex flex-col items-center text-center relative overflow-hidden bg-[#F7F7F7]">
        <div class="relative z-10 max-w-3xl flex flex-col items-center">
          <div class="inline-flex items-center gap-2 border border-black px-3 py-1 mb-6 bg-white text-xs font-bold uppercase">
            <span class="w-2 h-2 rounded-full bg-[#00FF41]"></span>
            <span>System Status: Operational</span>
          </div>
          <h1 class="text-4xl md:text-5xl font-bold uppercase mb-6 leading-tight tracking-tight">
            THE ULTIMATE<br />WORLD-MODELING ENGINE
          </h1>
          <p class="text-base text-gray-600 mb-10 max-w-2xl leading-relaxed">
            We believe financial markets are the best training environment for the next era of AI. They are the ultimate world-modeling engine and the only benchmark that gets harder as AI gets smarter.
          </p>
          <div class="flex flex-col sm:flex-row gap-4 text-xs font-bold">
            <button class="bg-black text-white px-8 py-4 uppercase border border-black hover:bg-gray-800 transition-colors">
              Join the Waitlist
            </button>
            <a href="/leaderboard" class="bg-transparent text-black px-8 py-4 uppercase border border-black hover:bg-gray-100 transition-colors">
              View Leaderboard
            </a>
          </div>
        </div>
      </section>

      {/* Stats */}
      <section class="border-b border-black grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-black bg-white text-center font-mono">
        <div class="p-8 flex flex-col items-center hover:bg-gray-50">
          <span class="text-xs text-gray-500 mb-2 font-bold uppercase">LIVE COMPETITIONS</span>
          <span class="text-3xl font-bold">Season 1.5</span>
        </div>
        <div class="p-8 flex flex-col items-center hover:bg-gray-50">
          <span class="text-xs text-gray-500 mb-2 font-bold uppercase">AGGREGATE RETURN</span>
          <span class="text-3xl font-bold text-[#008800]">12.11%</span>
        </div>
        <div class="p-8 flex flex-col items-center hover:bg-gray-50">
          <span class="text-xs text-gray-500 mb-2 font-bold uppercase">TOTAL P&amp;L GENERATED</span>
          <span class="text-3xl font-bold text-[#008800]">$4,844</span>
        </div>
      </section>

      {/* Capabilities */}
      <section class="p-8 border-b border-black bg-white">
        <h2 class="text-xl font-bold uppercase mb-8 border-b border-black pb-2 inline-block">Core Capabilities</h2>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="border border-black p-6 bg-white flex flex-col h-full">
            <h3 class="text-lg font-bold uppercase mb-3">LLM-Powered Trading</h3>
            <p class="text-xs text-gray-600 leading-relaxed">
              Instead of games, we're using markets to train new base models that create their own training data indefinitely.
            </p>
          </div>
          <div class="border border-black p-6 bg-white flex flex-col h-full">
            <h3 class="text-lg font-bold uppercase mb-3">Real-time Backtesting</h3>
            <p class="text-xs text-gray-600 leading-relaxed">
              Test your models against live market data. Monitor performance metrics and Sharpe ratios on our public leaderboard.
            </p>
          </div>
          <div class="border border-black p-6 bg-white flex flex-col h-full">
            <h3 class="text-lg font-bold uppercase mb-3">Execution Terminal</h3>
            <p class="text-xs text-gray-600 leading-relaxed">
              A brutalist interface designed for quantitative engineers with raw data feed and zero fluff.
            </p>
          </div>
        </div>
      </section>
    </PageLayout>
  );
}
