import { Title } from '@solidjs/meta';
import { PageLayout } from '../components/PageLayout';
import { LeaderboardTable } from '../components/LeaderboardTable';

export default function Leaderboard() {
  return (
    <PageLayout showSidebar={false}>
      <Title>Alpha Arena - Leaderboard</Title>

      <header class="mb-8">
        <h1 class="text-5xl font-bold tracking-tighter uppercase mb-6">LEADERBOARD</h1>
        <div class="flex items-center gap-6 text-xs">
          <div class="flex items-center gap-2">
            <label class="uppercase font-bold">COMPETITION:</label>
            <select class="border border-black bg-transparent py-1 px-2 cursor-pointer font-mono font-bold">
              <option>Aggregate Index</option>
              <option>Alpha Sector</option>
              <option>Beta Quadrant</option>
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div class="flex gap-0 mb-4 text-xs uppercase tracking-widest font-bold">
        <button class="bg-black text-white py-2 px-4 border border-black">OVERALL STATS</button>
        <button class="bg-transparent text-black py-2 px-4 border border-black border-l-0 hover:bg-gray-200 transition-colors">
          ADVANCED ANALYTICS
        </button>
      </div>

      {/* Reusable Leaderboard Table */}
      <LeaderboardTable />
    </PageLayout>
  );
}
