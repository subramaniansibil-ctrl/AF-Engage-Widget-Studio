import { Moon, Sun } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { setTheme } from '../../features/ui/uiSlice';

export function ThemeToggle() {
  const dispatch = useAppDispatch();
  const theme = useAppSelector((state) => state.ui.theme);
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={() => dispatch(setTheme(isDark ? 'light' : 'dark'))}
      className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 text-ink/70 transition hover:bg-ink/5 hover:text-ink dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
      aria-label={isDark ? 'Use light mode' : 'Use dark mode'}
    >
      {isDark ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
    </button>
  );
}
