import { useEffect, useState } from 'preact/hooks';

type Theme = 'light' | 'dark';

export default function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>('light');

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

  function toggle() {
    const next: Theme = theme === 'dark' ? 'light' : 'dark';
    setTheme(next);
    document.documentElement.dataset.theme = next;
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage can be blocked; the toggle still works for this page view */
    }
  }

  return (
    <button
      type="button"
      role="switch"
      aria-checked={theme === 'dark'}
      aria-label="Dark mode"
      class="theme-switch"
      onClick={toggle}
    >
      <span class="theme-track" aria-hidden="true">
        <span class="theme-knob" />
      </span>
    </button>
  );
}
