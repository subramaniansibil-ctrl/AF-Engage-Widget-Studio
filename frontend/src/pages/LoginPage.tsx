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
    <main className="grid min-h-screen bg-mist text-ink dark:bg-ink dark:text-white lg:grid-cols-[1.05fr_0.95fr]">
      <section className="hidden min-h-screen bg-[radial-gradient(circle_at_20%_20%,rgba(90,127,113,0.24),transparent_35%),linear-gradient(135deg,#17212f,#26384a)] px-10 py-10 text-white lg:flex lg:flex-col lg:justify-between">
        <div>
          <p className="text-sm font-semibold text-sage">AF Engage</p>
          <h1 className="mt-2 text-4xl font-bold">Widget Studio</h1>
        </div>
        <div className="max-w-xl">
          <p className="text-sm uppercase text-white/55">Hackathon demo workspace</p>
          <h2 className="mt-4 text-5xl font-bold leading-tight">Personalized financial journeys, assembled in minutes.</h2>
          <p className="mt-5 text-base leading-7 text-white/70">
            Advisors configure reusable simulation widgets, publish client dashboards, and track engagement from one polished portal.
          </p>
        </div>
        <div className="grid grid-cols-3 gap-3 text-sm text-white/70">
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">Advisor portal</span>
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">Client widgets</span>
          <span className="rounded-md border border-white/10 bg-white/5 px-3 py-2">Postgres ready</span>
        </div>
      </section>
      <section className="grid min-h-screen place-items-center px-6 py-10">
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-8 shadow-panel dark:border-white/10 dark:bg-white/5"
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.24 }}
      >
        <p className="text-sm font-semibold text-sage">AF Engage</p>
        <h1 className="mt-2 text-3xl font-bold">Sign in</h1>
        <p className="mt-3 text-sm leading-6 text-ink/65">
          Use a mock account to enter the advisor, client, or admin workspace.
        </p>

        <div className="mt-6 space-y-4">
          <label className="block">
            <span className="text-sm font-medium text-ink/75">Email</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-white/15 dark:bg-white/10"
              autoComplete="email"
              required
            />
          </label>
          <label className="block">
            <span className="text-sm font-medium text-ink/75">Password</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              className="mt-2 w-full rounded-md border border-ink/15 bg-white px-3 py-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20 dark:border-white/15 dark:bg-white/10"
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
          className="mt-6 w-full py-3"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </Button>

        <div className="mt-6 rounded-md bg-ink/5 p-3 text-xs leading-5 text-ink/65 dark:bg-white/10 dark:text-white/65">
          <p>advisor@afengage.com / password123</p>
          <p>client@afengage.com / password123</p>
          <p>admin@afengage.com / password123</p>
        </div>
      </motion.form>
      </section>
    </main>
  );
}
