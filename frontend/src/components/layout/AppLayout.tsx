import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, ChartNoAxesCombined, FileClock, LayoutDashboard, LogOut, Menu, Sparkles, UserCog, UserRound, UsersRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useAppDispatch, useAppSelector } from '../../app/hooks';
import { useLogoutMutation } from '../../features/api/apiSlice';
import { logout, type Role } from '../../features/auth/authSlice';
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
  { to: '/advisor/client-management', label: 'Clients', icon: UsersRound, roles: ['ADVISOR'] },
  { to: '/advisor/widgets', label: 'Widgets', icon: Boxes, roles: ['ADVISOR', 'ADMIN'] },
  { to: '/advisor/analytics', label: 'Analytics', icon: ChartNoAxesCombined, roles: ['ADVISOR', 'ADMIN'] },
  { to: '/client/dashboard', label: 'Overview', icon: UserRound, roles: ['CLIENT', 'ADMIN'] },
  { to: '/admin/dashboard', label: 'Audit Logs', icon: FileClock, roles: ['ADMIN'] },
  { to: '/admin/clients', label: 'Clients', icon: UsersRound, roles: ['ADMIN'] },
  { to: '/admin/advisors', label: 'Advisors', icon: UserCog, roles: ['ADMIN'] },
];

export function AppLayout() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const { user, role } = useAppSelector((state) => state.auth);
  const { mobileSidebarOpen } = useAppSelector((state) => state.ui);
  const [logoutRequest, { isLoading: isLoggingOut }] = useLogoutMutation();

  const visibleNavItems = navItems.filter((item) => role && item.roles.includes(role));
  const userInitials = (user?.name ?? 'AF')
    .split(' ')
    .map((part) => part.charAt(0))
    .join('')
    .slice(0, 2)
    .toUpperCase();

  async function handleLogout() {
    try {
      await logoutRequest().unwrap();
    } finally {
      dispatch(logout());
      navigate('/login', { replace: true });
    }
  }

  return (
    <div className="af-page-shell min-h-screen text-ink dark:text-white">
      <div className="min-h-screen">
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 w-[248px] border-r border-white/15 bg-[linear-gradient(180deg,#03111f_0%,#071f35_54%,#063342_100%)] p-3 text-white shadow-[22px_0_70px_rgba(7,31,53,0.18)] transition',
            mobileSidebarOpen ? 'block' : 'hidden',
            'lg:block print:hidden',
          ].join(' ')}
        >
          <div className="flex h-full flex-col rounded-lg border border-white/10 bg-white/[0.045] p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.10)] backdrop-blur-2xl">
            <div className="mb-5 flex items-center gap-3 rounded-md border border-white/10 bg-white/[0.06] p-2.5">
              <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md bg-sage text-sm font-black text-ink shadow-[0_10px_28px_rgba(0,168,120,0.28)]">
                AF
              </div>
              <div className="min-w-0">
                <p className="text-[11px] font-bold uppercase text-sage">AF Engage</p>
                <h1 className="truncate text-sm font-bold tracking-normal">Widget Studio</h1>
              </div>
            </div>

            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[10px] font-bold uppercase text-white/38">Workspace</p>
              <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            </div>

            <nav className="flex gap-1.5 overflow-x-auto lg:flex-col lg:overflow-visible">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'group relative flex min-h-10 items-center gap-2.5 rounded-md px-2 py-1.5 text-sm font-medium transition duration-200',
                        isActive
                          ? 'bg-white/[0.12] text-white shadow-[0_12px_34px_rgba(0,0,0,0.16),inset_0_1px_0_rgba(255,255,255,0.10)]'
                          : 'text-white/62 hover:bg-white/[0.075] hover:text-white',
                      ].join(' ')
                    }
                    onClick={() => dispatch(setMobileSidebarOpen(false))}
                  >
                    {({ isActive }) => (
                      <>
                        <span
                          className={[
                            'absolute left-0 top-2 h-6 w-0.5 rounded-r-full transition',
                            isActive ? 'bg-sage opacity-100' : 'bg-transparent opacity-0',
                          ].join(' ')}
                        />
                        <span
                          className={[
                            'grid h-7 w-7 shrink-0 place-items-center rounded-md border transition',
                            isActive
                              ? 'border-sage/35 bg-sage/18 text-sage'
                              : 'border-white/10 bg-white/[0.04] text-white/54 group-hover:border-white/16 group-hover:text-white',
                          ].join(' ')}
                        >
                          <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto space-y-2 pt-4">
              <div className="rounded-md border border-white/10 bg-white/[0.06] p-2.5">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-8 w-8 shrink-0 place-items-center rounded-md bg-white/12 text-xs font-bold text-white">
                    {userInitials}
                  </div>
                  <div className="min-w-0">
                    <p className="truncate text-xs font-semibold">{user?.name ?? 'Workspace user'}</p>
                    <p className="text-[11px] font-medium uppercase text-white/42">{user?.role ?? 'Signed out'}</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </aside>
        <div className="flex min-w-0 flex-col lg:pl-[248px] print:pl-0">
          <header className="border-b border-white/45 bg-white/45 px-4 py-3 shadow-sm backdrop-blur-2xl dark:border-white/10 dark:bg-white/5 sm:px-5 print:hidden">
            <div className="flex flex-wrap items-center justify-between gap-2.5">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => dispatch(setMobileSidebarOpen(!mobileSidebarOpen))}
                  className="inline-flex h-9 w-9 items-center justify-center rounded-md border border-ink/10 bg-white/35 text-ink backdrop-blur transition hover:bg-white/65 dark:border-white/10 dark:text-white lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-xs font-medium uppercase text-ink/50">{user?.role ?? 'Workspace'}</p>
                  <p className="text-sm font-semibold">{user?.name ?? 'AF Engage Widget Studio'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex h-9 items-center gap-1.5 rounded-md border border-ink/10 bg-white/35 px-2.5 text-xs font-semibold text-ink/70 backdrop-blur transition hover:bg-white/65 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </header>
          <motion.main
            className="min-w-0 flex-1 p-4 sm:p-5"
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
