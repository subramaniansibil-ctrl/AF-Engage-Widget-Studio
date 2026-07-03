import { FormEvent, useState } from 'react';
import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import { motion } from 'framer-motion';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { dashboardForRole } from '../components/routes/RouteGuards';
import { Button } from '../components/ui/Button';
import { addToast } from '../features/ui/uiSlice';
import { useLoginMutation } from '../features/api/apiSlice';
import { login, type Role } from '../features/auth/authSlice';

function canRoleAccessPath(role: Role, path?: string) {
  if (!path || path === '/login') {
    return false;
  }
  if (path.startsWith('/advisor')) {
    return role === 'ADVISOR' || role === 'ADMIN';
  }
  if (path.startsWith('/client')) {
    return role === 'CLIENT' || role === 'ADMIN';
  }
  if (path.startsWith('/admin')) {
    return role === 'ADMIN';
  }
  return false;
}

function loginErrorMessage(error: unknown) {
  const queryError = error as FetchBaseQueryError;
  if (queryError?.status === 'FETCH_ERROR' || queryError?.status === 'TIMEOUT_ERROR') {
    return 'Unable to reach the API. Please make sure the backend is running.';
  }
  return 'Invalid email or password.';
}

export function LoginPage() {
  const dispatch = useAppDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);
  const [loginRequest, { isLoading }] = useLoginMutation();
  const [email, setEmail] = useState('advisor@afengage.com');
  const [password, setPassword] = useState('password123');
  const [errorMessage, setErrorMessage] = useState('');

  const from = typeof location.state === 'object' && location.state !== null && 'from' in location.state
    ? String(location.state.from)
    : undefined;

  if (isAuthenticated) {
    return <Navigate to={dashboardForRole(role)} replace />;
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setErrorMessage('');

    try {
      const response = await loginRequest({ email, password }).unwrap();
      dispatch(login(response));
      dispatch(addToast({
        title: 'Signed in',
        description: `Welcome back, ${response.user.name}.`,
        variant: 'success',
      }));
      navigate(
        canRoleAccessPath(response.user.role, from) ? from! : dashboardForRole(response.user.role),
        { replace: true },
      );
    } catch (error) {
      setErrorMessage(loginErrorMessage(error));
      dispatch(addToast({
        title: 'Login failed',
        description: loginErrorMessage(error),
        variant: 'error',
      }));
    }
  }

  return (
    <main className="af-page-shell grid min-h-screen text-ink dark:text-white lg:grid-cols-[1.08fr_0.92fr]">
      <section className="relative hidden min-h-screen overflow-hidden bg-[radial-gradient(circle_at_16%_16%,rgba(0,167,111,0.28),transparent_34%),radial-gradient(circle_at_88%_4%,rgba(0,111,132,0.34),transparent_34%),linear-gradient(145deg,#041c2c,#06263d_54%,#064754)] px-12 py-12 text-white lg:flex lg:flex-col lg:justify-between xl:px-16 xl:py-14">
        <div className="pointer-events-none absolute -bottom-32 -right-28 h-[420px] w-[420px] rounded-full border border-white/10" />
        <div className="pointer-events-none absolute -bottom-16 -right-12 h-[260px] w-[260px] rounded-full border border-sage/20" />
        <div>
          <div className="flex items-center gap-3">
            <span className="grid h-11 w-11 place-items-center rounded-xl bg-sage text-sm font-black text-ink shadow-[0_12px_30px_rgba(0,167,111,0.28)]">AF</span>
            <div>
              <p className="text-[10px] font-extrabold uppercase tracking-[0.14em] text-sage">Alexforbes</p>
              <h1 className="text-lg font-bold">Widget Studio</h1>
            </div>
          </div>
        </div>
        <div className="relative z-10 max-w-2xl pb-10">
          <p className="text-xs font-bold uppercase tracking-[0.16em] text-sage">Financial engagement platform</p>
          <h2 className="mt-5 text-5xl font-extrabold leading-[1.08] tracking-[-0.035em] xl:text-6xl">Personalized financial journeys, assembled in minutes.</h2>
          <p className="mt-6 max-w-xl text-base leading-8 text-white/68">
            Advisors configure reusable simulation widgets, publish client dashboards, and track engagement from one polished portal.
          </p>
        </div>
      </section>
      <section className="grid min-h-screen place-items-center px-5 py-10 sm:px-8 lg:px-12">
      <motion.form
        onSubmit={handleSubmit}
        className="af-glass w-full max-w-[460px] rounded-2xl p-7 sm:p-10"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <div className="mb-8 flex items-center gap-3 lg:hidden">
          <span className="grid h-10 w-10 place-items-center rounded-[10px] bg-sage text-xs font-black text-ink">AF</span>
          <div><p className="text-[10px] font-extrabold uppercase tracking-[0.12em] text-sage">Alexforbes</p><p className="text-sm font-bold">Widget Studio</p></div>
        </div>
        <p className="text-xs font-extrabold uppercase tracking-[0.12em] text-sage">Secure workspace</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-[-0.025em] sm:text-4xl">Welcome back</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          Use a mock account to enter the advisor, client, or admin workspace.
        </p>

        <div className="mt-8 space-y-5">
          <label className="block">
            <span className="text-sm font-bold text-ink/75">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="af-focus-ring mt-2 w-full border border-ink/15 bg-white px-4 py-3.5 text-sm shadow-sm dark:border-white/15 dark:bg-white/10"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-bold text-ink/75">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="af-focus-ring mt-2 w-full border border-ink/15 bg-white px-4 py-3.5 text-sm shadow-sm dark:border-white/15 dark:bg-white/10"
              autoComplete="current-password"
              required
            />
          </label>
        </div>

        {errorMessage && (
          <p className="mt-4 rounded-md border border-coral/30 bg-coral/10 px-3 py-2 text-sm text-coral">
            {errorMessage}
          </p>
        )}

        <Button
          type="submit"
          disabled={isLoading}
          className="mt-7 w-full py-3.5"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

      </motion.form>
      </section>
    </main>
  );
}
