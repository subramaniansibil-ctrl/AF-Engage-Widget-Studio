import { Bell } from 'lucide-react';
import { useState } from 'react';
import {
  useGetNotificationsQuery,
  useMarkNotificationReadMutation,
} from '../../features/analytics/analyticsApi';

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
        className="relative inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 text-ink/70 transition hover:bg-ink/5 hover:text-ink"
        aria-label="Notifications"
      >
        <Bell className="h-4 w-4" />
        {unreadCount > 0 && (
          <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-coral px-1 text-xs font-bold text-white">
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div className="absolute right-0 z-20 mt-2 w-[min(360px,calc(100vw-2rem))] rounded-lg border border-ink/10 bg-white p-3 shadow-panel">
          <div className="mb-2 flex items-center justify-between gap-3">
            <p className="font-semibold">Notifications</p>
            <p className="text-xs text-ink/50">{unreadCount} unread</p>
          </div>
          <div className="max-h-96 space-y-2 overflow-y-auto">
            {notifications.map((notification) => (
              <button
                key={notification.id}
                type="button"
                onClick={() => markRead(notification.id)}
                disabled={notification.read || isLoading}
                className={[
                  'w-full rounded-md border p-3 text-left transition',
                  notification.read
                    ? 'border-ink/10 bg-white text-ink/60'
                    : 'border-sage/25 bg-sage/10 text-ink hover:bg-sage/15',
                ].join(' ')}
              >
                <div className="flex items-start justify-between gap-3">
                  <p className="text-sm font-semibold">{notification.title}</p>
                  {!notification.read && <span className="mt-1 h-2 w-2 shrink-0 rounded-full bg-sage" />}
                </div>
                <p className="mt-1 text-xs leading-5">{notification.message}</p>
                <p className="mt-2 text-xs text-ink/45">{new Date(notification.createdAt).toLocaleString()}</p>
              </button>
            ))}
            {!notifications.length && (
              <p className="rounded-md border border-dashed border-ink/15 p-4 text-sm text-ink/60">
                No notifications yet.
              </p>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
