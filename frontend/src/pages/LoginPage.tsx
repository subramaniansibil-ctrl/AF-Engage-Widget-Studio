import { FormEvent, useState } from 'react';
import { motion } from 'framer-motion';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { useAppDispatch, useAppSelector } from '../app/hooks';
import { dashboardForRole } from '../components/routes/RouteGuards';
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
      navigate(
        canRoleAccessPath(response.user.role, from) ? from! : dashboardForRole(response.user.role),
        { replace: true },
      );
    } catch {
      setErrorMessage('Invalid email or password.');
    }
  }

  return (
    <main className="grid min-h-screen place-items-center bg-mist px-6 text-ink">
      <motion.form
        onSubmit={handleSubmit}
        className="w-full max-w-md rounded-lg border border-ink/10 bg-white p-8 shadow-panel"
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
              className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
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
              className="mt-2 w-full rounded-md border border-ink/15 px-3 py-3 text-sm outline-none transition focus:border-sage focus:ring-2 focus:ring-sage/20"
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

        <button
          type="submit"
          disabled={isLoading}
          className="mt-6 w-full rounded-md bg-ink px-4 py-3 text-sm font-semibold text-white transition hover:bg-ink/90 disabled:cursor-not-allowed disabled:bg-ink/50"
        >
          {isLoading ? 'Signing in...' : 'Sign in'}
        </button>

        <div className="mt-6 rounded-md bg-ink/5 p-3 text-xs leading-5 text-ink/65">
          <p>advisor@afengage.com / password123</p>
          <p>client@afengage.com / password123</p>
          <p>admin@afengage.com / password123</p>
        </div>
      </motion.form>
    </main>
  );
}
