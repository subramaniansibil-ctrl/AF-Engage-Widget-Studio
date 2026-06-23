import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';

const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const AdvisorDashboardPage = lazy(() =>
  import('../pages/AdvisorDashboardPage').then((module) => ({ default: module.AdvisorDashboardPage })),
);
const ClientDashboardPage = lazy(() =>
  import('../pages/ClientDashboardPage').then((module) => ({ default: module.ClientDashboardPage })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);

function routeElement(Page: ComponentType) {
  return (
    <Suspense fallback={<p className="text-sm text-ink/60">Loading workspace...</p>}>
      <Page />
    </Suspense>
  );
}

export const router = createBrowserRouter([
  {
    path: '/login',
    element: routeElement(LoginPage),
  },
  {
    path: '/',
    element: <AppLayout />,
    children: [
      { index: true, element: <Navigate to="/advisor/dashboard" replace /> },
      { path: 'advisor/dashboard', element: routeElement(AdvisorDashboardPage) },
      { path: 'client/dashboard', element: routeElement(ClientDashboardPage) },
    ],
  },
  {
    path: '*',
    element: routeElement(NotFoundPage),
  },
]);
