import { NavLink, Outlet } from 'react-router-dom';
import { LayoutDashboard, Menu, UserRound } from 'lucide-react';
import { motion } from 'framer-motion';
import { useGetStatusQuery } from '../../features/api/apiSlice';

const navItems = [
  { to: '/advisor/dashboard', label: 'Advisor', icon: LayoutDashboard },
  { to: '/client/dashboard', label: 'Client', icon: UserRound },
];

export function AppLayout() {
  const { data: status } = useGetStatusQuery();

  return (
    <div className="min-h-screen bg-mist text-ink">
      <div className="grid min-h-screen lg:grid-cols-[260px_1fr]">
        <aside className="border-b border-ink/10 bg-white px-5 py-5 lg:border-b-0 lg:border-r">
          <div className="mb-8">
            <p className="text-sm font-semibold text-sage">AF Engage</p>
            <h1 className="mt-1 text-xl font-bold">Widget Studio</h1>
          </div>
          <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
            {navItems.map((item) => {
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
                >
                  <Icon aria-hidden="true" className="h-4 w-4 shrink-0" />
                  <span>{item.label}</span>
                </NavLink>
              );
            })}
          </nav>
        </aside>
        <div className="flex min-w-0 flex-col">
          <header className="border-b border-ink/10 bg-white px-6 py-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <button
                  type="button"
                  className="inline-flex h-10 w-10 items-center justify-center rounded-md border border-ink/10 text-ink lg:hidden"
                  aria-label="Open navigation"
                >
                  <Menu className="h-5 w-5" />
                </button>
                <div>
                  <p className="text-sm text-ink/60">Application shell</p>
                  <p className="font-semibold">AF Engage Widget Studio</p>
                </div>
              </div>
              <div className="rounded-md border border-ink/10 px-3 py-2 text-sm text-ink/70">
                API {status?.environment ?? 'checking'}
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
