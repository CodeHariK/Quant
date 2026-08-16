import { useLocation } from '@solidjs/router';
import { useTheme } from '../store/themeStore';

export function TopNavBar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'LIVE', path: '/dashboard' },
    { label: 'LEADERBOARD', path: '/leaderboard' },
    { label: 'TICKER', path: '/ticker' },
    { label: 'TRADEBOOK', path: '/tradebook' },
    { label: 'ABOUT', path: '/landing' },
  ];

  return (
    <header class="bg-surface border-b border-primary w-full px-8 h-16 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-8">
        <a href="/dashboard" class="font-headline-md text-headline-md font-bold uppercase tracking-tighter text-primary">
          ALPHA ARENA
        </a>
        <nav class="hidden md:flex items-center gap-6">
          {navItems.map((item) => {
            const isActive = () => location.pathname === item.path;
            return (
              <a
                href={item.path}
                class={`transition-colors duration-100 font-label-caps text-label-caps ${isActive()
                  ? 'text-primary font-bold border-b-2 border-primary pb-1'
                  : 'text-muted-gray hover:text-primary'
                  }`}
              >
                {item.label}
              </a>
            );
          })}
        </nav>
      </div>
      <div class="flex items-center gap-6">
        <button
          onClick={toggleTheme}
          class="flex items-center gap-2 border border-primary px-3 py-1 font-label-caps text-label-caps text-primary hover:bg-surface-container-high transition-colors cursor-pointer"
          title="Toggle Dark / Light Theme"
        >
          <span class="material-symbols-outlined text-[16px]">{theme() === 'dark' ? 'light_mode' : 'dark_mode'}</span>
          <span>{theme() === 'dark' ? 'LIGHT MODE' : 'DARK MODE'}</span>
        </button>
        <a class="font-label-caps text-label-caps text-primary underline hover:opacity-80 transition-opacity flex items-center gap-1" href="#">
          JOIN THE PLATFORM WAITLIST <span class="material-symbols-outlined text-[14px]">open_in_new</span>
        </a>
      </div>
    </header>
  );
}
