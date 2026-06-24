import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, ChartNoAxesCombined, ClipboardList, LayoutDashboard, LogOut, Menu, Shield, UserRound, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useGetStatusQuery, useLogoutMutation } from '../../features/api/apiSlice';
import { logout, type Role } from '../../features/auth/authSlice';
import { NotificationMenu } from './NotificationMenu';
import { ThemeToggle } from '../ui/ThemeToggle';
import { setMobileSidebarOpen } from '../../features/ui/uiSlice';

interface NavItem {
  to: string;
  label: string;
  icon: typeof UsersRound;
  roles: Role[];
}

const navItems: NavItem[] = [
  { to: '/advisor/dashboard', label: 'Dashboard', icon: LayoutDashboard, roles: ['ADVISOR', 'ADMIN'] },
  { to: '/advisor/clients', label: 'Clients', icon: UsersRound, roles: ['ADVISOR', 'ADMIN'] },
  { to: '/advisor/widgets', label: 'Widgets', icon: Boxes, roles: ['ADVISOR', 'ADMIN'] },
  { to: '/advisor/analytics', label: 'Analytics', icon: ChartNoAxesCombined, roles: ['ADVISOR', 'ADMIN'] },
  { to: '/client/dashboard', label: 'Overview', icon: UserRound, roles: ['CLIENT', 'ADMIN'] },
  { to: '/client/widgets', label: 'My widgets', icon: ClipboardList, roles: ['CLIENT', 'ADMIN'] },
  { to: '/admin/dashboard', label: 'Admin', icon: Shield, roles: ['ADMIN'] },
];

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, role } = useAppSelector((state) => state.auth);
  const { mobileSidebarOpen } = useAppSelector((state) => state.ui);
  const { data: status } = useGetStatusQuery();
  const [logoutRequest, { isLoading: isLoggingOut }] = useLogoutMutation();

  const visibleNavItems = navItems.filter((item) => role && item.roles.includes(role));

  async function handleLogout() {
    try {
      await logoutRequest().unwrap();
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="min-h-screen bg-mist text-ink dark:bg-ink dark:text-white">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside
          className={[
            'border-b border-ink/10 bg-white px-5 py-5 transition dark:border-white/10 dark:bg-ink',
            mobileSidebarOpen ? 'block' : 'hidden',
            'lg:block lg:border-b-0 lg:border-r',
          ].join(' ')}
        >
          <div className="mb-8">
            <p className="text-sm font-semibold text-sage">AF Engage</p>
            <h1 className="mt-1 text-xl font-bold">Widget Studio</h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {visibleNavItems.map((item) => {
              const Icon = item.icon;
              return (
                <NavLink
                  key={item.to}
                  to={item.to}
                  className={({ isActive }) =>
                    [
                      'flex items-center gap-3 rounded-md px-3 py-2.5 text-sm font-medium transition',
                      isActive
                        ? 'bg-ink text-white'
                        : 'text-ink/70 hover:bg-ink/5 hover:text-ink',
                    ].join(' ')
                  }
                  onClick={() => dispatch(setMobileSidebarOpen(false))}
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="border-b border-ink/10 bg-white px-6 py-4 dark:border-white/10 dark:bg-ink">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => dispatch(setMobileSidebarOpen(!mobileSidebarOpen))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 text-ink dark:border-white/10 dark:text-white lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm text-ink/60">{user?.role ?? 'Workspace'}</p>
                  <p className="font-semibold">{user?.name ?? 'AF Engage Widget Studio'}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <NotificationMenu />
                <ThemeToggle />
                <div className="hidden rounded-md border border-ink/10 px-3 py-2 text-sm text-ink/70 dark:border-white/10 dark:text-white/70 sm:block">
                  API {status?.environment ?? 'checking'}
                </div>
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex items-center gap-2 rounded-md border border-ink/10 px-3 py-2 text-sm font-medium text-ink/70 transition hover:bg-ink/5 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </header>
          <motion.main
            className="min-w-0 flex-1 p-6"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.24 }}
          >
            <Outlet />
          </motion.main>
        </div>
      </div>
    </div>
  );
}
