import { useEffect, useState } from 'preact/hooks';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

  function apply(next: Theme) {
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage can be blocked; the toggle still works for this page view */
    }
  }

  useEffect(() => {
    let stored: Theme | null = null;
    try {
      const raw = localStorage.getItem('theme');
      stored = raw === 'dark' || raw === 'light' ? raw : null;
    } catch {
      stored = null;
    }
    const initial: Theme =
      stored ?? (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
    setTheme(initial);
    document.documentElement.dataset.theme = initial;
  }, []);

  return (
    <button
      type="button"
      onClick={() => {
        const next: Theme = theme === 'dark' ? 'light' : 'dark';
        setTheme(next);
        apply(next);
      }}
      aria-label="Switch colour theme"
    >
      {theme === 'dark' ? 'light' : 'dark'}
    </button>
  );
}
