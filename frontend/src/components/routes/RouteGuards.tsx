import { Navigate, Outlet, useLocation } from 'react-router-dom';
import { useAppSelector } from '../../app/hooks';
import type { Role } from '../../features/auth/authSlice';

interface RoleRouteProps {
  allowedRoles: Role[];
}

function dashboardForRole(role?: Role) {
  switch (role) {
    case 'ADVISOR':
      return '/advisor/analytics';
    case 'CLIENT':
      return '/client/dashboard';
    case 'ADMIN':
      return '/admin/analytics';
    default:
      return '/login';
  }
}

export function ProtectedRoute() {
  const { isAuthenticated } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return <Outlet />;
}

export function RoleRoute({ allowedRoles }: RoleRouteProps) {
  const { isAuthenticated, role } = useAppSelector((state) => state.auth);
  const location = useLocation();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (!role || !allowedRoles.includes(role)) {
    return <Navigate to={dashboardForRole(role)} replace />;
  }

  return <Outlet />;
}

export function AdvisorRoute() {
  return <RoleRoute allowedRoles={['ADVISOR', 'ADMIN']} />;
}

export function ClientRoute() {
  return <RoleRoute allowedRoles={['CLIENT', 'ADMIN']} />;
}

export function AdminRoute() {
  return <RoleRoute allowedRoles={['ADMIN']} />;
}

export { dashboardForRole };
