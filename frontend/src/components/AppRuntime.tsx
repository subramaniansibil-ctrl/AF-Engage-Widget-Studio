import { useEffect } from 'react';
import { useAppSelector } from '../app/hooks';
import { ToastViewport } from './ui/ToastViewport';

export function AppRuntime() {
  const theme = useAppSelector((state) => state.ui.theme);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return <ToastViewport />;
}
