import { createSignal, createEffect } from 'solid-js';

export type Theme = 'light' | 'dark';

const getInitialTheme = (): Theme => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('alpha_arena_theme') as Theme;
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
      return 'dark';
    }
  }
  return 'light';
};

const [theme, setTheme] = createSignal<Theme>(getInitialTheme());

export function useTheme() {
  createEffect(
    () => theme(),
    (currentTheme) => {
      if (typeof window !== 'undefined') {
        localStorage.setItem('alpha_arena_theme', currentTheme);
        if (currentTheme === 'dark') {
          document.documentElement.classList.add('dark');
        } else {
          document.documentElement.classList.remove('dark');
        }
      }
    }
  );

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return { theme, toggleTheme, setTheme };
}
