import { PageLayout } from '../pages/components/PageLayout';
import { LeaderboardTable } from '../pages/components/LeaderboardTable';
import { Text } from '../primitives/Text';

export default function Leaderboard() {
  return (
    <PageLayout title="Leaderboard">

      <header class="mb-8">
        <Text variant="h1" class="text-5xl tracking-tighter mb-6 block">LEADERBOARD</Text>
        <div class="flex items-center gap-6 text-xs">
          <div class="flex items-center gap-2">
            <Text variant="label" class="text-on-surface">COMPETITION:</Text>
            <select class="border border-outline-variant bg-transparent text-on-surface py-1 px-2 cursor-pointer font-mono font-bold">
              <option>Aggregate Index</option>
              <option>Alpha Sector</option>
              <option>Beta Quadrant</option>
            </select>
          </div>
        </div>
      </header>

      {/* Tabs */}
      <div class="flex gap-0 mb-4 text-xs uppercase tracking-widest font-bold">
        <button class="bg-inverse-surface text-inverse-on-surface py-2 px-4 border border-outline-variant">OVERALL STATS</button>
        <button class="bg-transparent text-on-surface py-2 px-4 border border-outline-variant border-l-0 hover:bg-surface-container-highest transition-colors">
          ADVANCED ANALYTICS
        </button>
      </div>

      {/* Reusable Leaderboard Table */}
      <LeaderboardTable />
    </PageLayout>
  );
}
