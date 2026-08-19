import { useLocation } from '@solidjs/router';
import { useTheme } from '../../store/themeStore';

export function TopNavBar() {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const navItems = [
    { label: 'LEADERBOARD', path: '/leaderboard' },
    { label: 'TRADEBOOK', path: '/tradebook' },
    { label: 'PORTFOLIOS', path: '/portfolios' },
  ];

  return (
    <header class="bg-surface border-b border-primary w-full px-8 h-16 flex justify-between items-center sticky top-0 z-50">
      <div class="flex items-center gap-8">
        <a href="/" class="font-headline-md text-headline-md font-bold uppercase tracking-tighter text-primary">
          Haunter
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
          onClick={toggleTheme} title="Toggle Dark / Light Theme"
        >
          <span class="material-symbols-outlined text-[16px]">{theme() === 'dark' ? 'light_mode' : 'dark_mode'}</span>
        </button>
      </div>
    </header>
  );
}
