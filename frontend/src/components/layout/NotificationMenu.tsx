import { Bell } from 'lucide-react';
import { useState } from 'react';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from '../../features/analytics/analyticsApi';
import { EmptyState } from '../ui/EmptyState';

export function NotificationMenu() {
  const [isOpen, setIsOpen] = useState(false);
  const { data: notifications = [] } = useGetNotificationsQuery();
  const [markRead, { isLoading }] = useMarkNotificationReadMutation();
  const unreadCount = notifications.filter((notification) => !notification.read).length;

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setIsOpen((current) => !current)}
        className="relative inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 bg-white/35 text-ink/70 backdrop-blur transition hover:bg-white/65 hover:text-ink dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-4 min-w-4 place-items-center rounded-full bg-coral px-1 text-[10px] font-bold leading-none text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="af-glass absolute right-0 z-20 mt-2 w-[min(340px,calc(100vw-2rem))] rounded-md p-2.5">
          <div className="mb-2 flex items-center justify-between gap-3 px-1">
            <p className="text-sm font-semibold">Notifications</p>
            <p className="text-xs text-ink/50">{unreadCount} unread</p>
          </div>
          <div className="max-h-80 space-y-1.5 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markRead(notification.id)}
                disabled={notification.read || isLoading}
                className={[
                  'w-full rounded-md border p-2.5 text-left transition',
                  notification.read
                    ? 'border-ink/10 bg-white/50 text-ink/60 dark:text-white/60'
                    : 'border-sage/30 bg-sage/10 text-ink hover:bg-sage/15 dark:text-white',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sage" />}
                </div>
                <p className="mt-1 text-xs leading-5 text-ink/65 dark:text-white/65">{notification.message}</p>
                <p className="mt-1.5 text-[11px] text-ink/45">{new Date(notification.createdAt).toLocaleString()}</p>
              </button>
            ))}
            {!notifications.length && (
              <EmptyState title="No notifications" description="New client and dashboard events will appear here." />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
