import { NavLink, Outlet, useNavigate } from 'react-router-dom';
import { Boxes, ChartNoAxesCombined, FileClock, LogOut, Menu, Sparkles, UserCog, UsersRound, X } from 'lucide-react';
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
  { to: '/advisor/analytics', label: 'Analytics', icon: ChartNoAxesCombined, roles: ['ADVISOR'] },
  { to: '/advisor/client-management', label: 'Clients', icon: UsersRound, roles: ['ADVISOR'] },
  { to: '/admin/analytics', label: 'Dashboard', icon: ChartNoAxesCombined, roles: ['ADMIN'] },
  { to: '/advisor/widgets', label: 'Widgets', icon: Boxes, roles: ['ADVISOR', 'ADMIN'] },
  { to: '/client/dashboard', label: 'Overview', icon: UsersRound, roles: ['CLIENT'] },
  { to: '/admin/audit-logs', label: 'Audit Log', icon: FileClock, roles: ['ADMIN'] },
  { to: '/admin/clients', label: 'Clients', icon: UsersRound, roles: ['ADMIN'] },
  { to: '/admin/advisors', label: 'Advisor Management', icon: UserCog, roles: ['ADMIN'] },
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
        {mobileSidebarOpen && (
          <button
            type="button"
            className="fixed inset-0 z-[35] bg-ink/55 backdrop-blur-[2px] lg:hidden print:hidden"
            onClick={() => dispatch(setMobileSidebarOpen(false))}
            aria-label="Close navigation"
          />
        )}
        <aside
          className={[
            'fixed inset-y-0 left-0 z-40 w-[264px] border-r border-white/10 bg-[linear-gradient(180deg,#041c2c_0%,#06263d_54%,#063846_100%)] p-3 text-white shadow-[18px_0_45px_rgba(6,38,61,0.14)] transition duration-300',
            mobileSidebarOpen ? 'block' : 'hidden',
            'lg:block print:hidden',
          ].join(' ')}
        >
          <div className="flex h-full flex-col rounded-xl border border-white/10 bg-white/[0.035] p-3.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] backdrop-blur-2xl">
            <div className="mb-7 flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.055] p-3">
              <div className="grid h-10 w-10 shrink-0 place-items-center rounded-[10px] bg-sage text-sm font-black text-ink shadow-[0_10px_28px_rgba(0,167,111,0.28)]">
                AF
              </div>
              <div className="min-w-0">
                <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-sage">Alexforbes</p>
                <h1 className="truncate text-sm font-bold tracking-normal">Widget Studio</h1>
              </div>
              <button
                type="button"
                onClick={() => dispatch(setMobileSidebarOpen(false))}
                className="ml-auto inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-white/15 bg-white/[0.07] text-white/75 transition hover:bg-white/[0.14] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/50 lg:hidden"
                aria-label="Close navigation menu"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="mb-2 flex items-center justify-between px-2">
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-white/38">Workspace</p>
              <Sparkles className="h-3.5 w-3.5 text-gold" aria-hidden="true" />
            </div>

            <nav className="flex flex-col gap-1.5 overflow-y-auto">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                return (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) =>
                      [
                        'group relative flex min-h-11 items-center gap-3 rounded-[10px] px-2.5 py-2 text-sm font-semibold transition duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sage/45',
                        isActive
                          ? 'bg-white/[0.115] text-white shadow-[0_12px_30px_rgba(0,0,0,0.14),inset_0_1px_0_rgba(255,255,255,0.10)]'
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
                            'grid h-8 w-8 shrink-0 place-items-center rounded-lg border transition',
                            isActive
                              ? 'border-sage/35 bg-sage/18 text-sage'
                              : 'border-white/10 bg-white/[0.04] text-white/54 group-hover:border-white/16 group-hover:text-white',
                          ].join(' ')}
                        >
                          <Icon aria-hidden="true" className="h-4 w-4" />
                        </span>
                        <span className="truncate">{item.label}</span>
                      </>
                    )}
                  </NavLink>
                );
              })}
            </nav>

            <div className="mt-auto space-y-2 pt-4">
              <div className="rounded-xl border border-white/10 bg-white/[0.055] p-3">
                <div className="flex items-center gap-2.5">
                  <div className="grid h-9 w-9 shrink-0 place-items-center rounded-[10px] bg-sage/20 text-xs font-bold text-sage ring-1 ring-sage/25">
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
        <div className="flex min-w-0 flex-col lg:pl-[264px] print:pl-0">
          <header className="sticky top-0 z-30 border-b border-ink/[0.07] bg-white/80 px-4 py-3 shadow-[0_4px_18px_rgba(6,38,61,0.04)] backdrop-blur-2xl dark:border-white/10 dark:bg-ink/80 sm:px-6 print:hidden">
            <div className="mx-auto flex max-w-[1600px] flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => dispatch(setMobileSidebarOpen(!mobileSidebarOpen))}
                  className="inline-flex h-10 w-10 items-center justify-center rounded-[10px] border border-ink/10 bg-white text-ink shadow-sm transition hover:border-sage/25 hover:bg-sage/5 dark:border-white/10 dark:bg-white/5 dark:text-white lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-sage">{user?.role ?? 'Workspace'}</p>
                  <p className="text-sm font-bold">{user?.name ?? 'AF Engage Widget Studio'}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <ThemeToggle />
                <button
                  type="button"
                  onClick={handleLogout}
                  disabled={isLoggingOut}
                  className="inline-flex h-10 items-center gap-2 rounded-[10px] border border-ink/10 bg-white px-3 text-xs font-bold text-ink/70 shadow-sm transition hover:border-ink/20 hover:text-ink disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/10 dark:bg-white/5 dark:text-white/70 dark:hover:bg-white/10 dark:hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  <span>Logout</span>
                </button>
              </div>
            </div>
          </header>
          <motion.main
            className="mx-auto w-full max-w-[1600px] min-w-0 flex-1 p-4 sm:p-6 lg:p-8"
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
