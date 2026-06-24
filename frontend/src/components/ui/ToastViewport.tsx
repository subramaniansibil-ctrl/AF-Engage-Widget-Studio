import { X } from 'lucide-react';
import { useEffect } from 'react';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { dismissToast } from '../../features/ui/uiSlice';

const styles = {
  success: 'border-sage/30 bg-sage/10 text-sage dark:bg-sage/20',
  error: 'border-coral/30 bg-coral/10 text-coral dark:bg-coral/20',
  info: 'border-ink/10 bg-white text-ink dark:border-white/10 dark:bg-white/10 dark:text-white',
};

export function ToastViewport() {
  const dispatch = useAppDispatch();
  const toasts = useAppSelector((state) => state.ui.toasts);

  useEffect(() => {
    const timers = toasts.map((toast) => window.setTimeout(() => dispatch(dismissToast(toast.id)), 4200));
    return () => timers.forEach(window.clearTimeout);
  }, [dispatch, toasts]);

  return (
    <div className="fixed right-4 top-4 z-50 w-[min(380px,calc(100vw-2rem))] space-y-3">
      {toasts.map((toast) => (
        <div key={toast.id} className={['rounded-lg border p-4 shadow-panel backdrop-blur', styles[toast.variant]].join(' ')}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-semibold">{toast.title}</p>
              {toast.description && <p className="mt-1 text-sm opacity-75">{toast.description}</p>}
            </div>
            <button
              type="button"
              onClick={() => dispatch(dismissToast(toast.id))}
              className="rounded-md p-1 opacity-70 transition hover:bg-black/5 hover:opacity-100 dark:hover:bg-white/10"
              aria-label="Dismiss notification"
            >
              <X className="h-4 w-4" />
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}
