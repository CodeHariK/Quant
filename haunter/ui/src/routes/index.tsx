import { Title } from '@solidjs/meta';

export default function Home() {
  return (
    <div class="p-12 text-center font-mono bg-white text-black min-h-screen flex flex-col items-center justify-center">
      <Title>Alpha Arena by NOF1.AI</Title>
      <h1 class="text-3xl font-bold uppercase tracking-tighter mb-4">Alpha Arena Platform</h1>
      <p class="text-xs text-gray-500 mb-8 max-w-md">Select a view from below to explore extracted pages from stitch_nof1:</p>
      
      <div class="grid grid-cols-2 md:grid-cols-5 gap-4 w-full max-w-3xl text-xs font-bold">
        <a href="/dashboard" class="border border-black p-4 bg-gray-50 hover:bg-black hover:text-white transition-colors">
          📊 DASHBOARD
        </a>
        <a href="/leaderboard" class="border border-black p-4 bg-gray-50 hover:bg-black hover:text-white transition-colors">
          🏆 LEADERBOARD
        </a>
        <a href="/terminal" class="border border-black p-4 bg-gray-50 hover:bg-black hover:text-white transition-colors">
          💻 TERMINAL
        </a>
        <a href="/backtest" class="border border-black p-4 bg-gray-50 hover:bg-black hover:text-white transition-colors">
          📈 BACKTEST
        </a>
        <a href="/model-detail" class="border border-black p-4 bg-gray-50 hover:bg-black hover:text-white transition-colors">
          🧠 MODEL DETAIL
        </a>
      </div>
    </div>
  );
}
