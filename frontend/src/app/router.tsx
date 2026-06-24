import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminRoute, AdvisorRoute, ClientRoute, ProtectedRoute } from '../components/routes/RouteGuards';

const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const AdvisorDashboardPage = lazy(() =>
  import('../pages/AdvisorDashboardPage').then((module) => ({ default: module.AdvisorDashboardPage })),
);
const AdvisorClientsPage = lazy(() =>
  import('../pages/AdvisorClientsPage').then((module) => ({ default: module.AdvisorClientsPage })),
);
const AdvisorClientDetailPage = lazy(() =>
  import('../pages/AdvisorClientDetailPage').then((module) => ({ default: module.AdvisorClientDetailPage })),
);
const WidgetLibraryPage = lazy(() =>
  import('../pages/WidgetLibraryPage').then((module) => ({ default: module.WidgetLibraryPage })),
);
const WidgetConfigurationPage = lazy(() =>
  import('../pages/WidgetConfigurationPage').then((module) => ({ default: module.WidgetConfigurationPage })),
);
const ClientDashboardPage = lazy(() =>
  import('../pages/ClientDashboardPage').then((module) => ({ default: module.ClientDashboardPage })),
);
const AdminDashboardPage = lazy(() =>
  import('../pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })),
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
    children: [
      { index: true, element: <Navigate to="/advisor/dashboard" replace /> },
      {
        element: <ProtectedRoute />,
        children: [
          {
            element: <AppLayout />,
            children: [
              {
                element: <AdvisorRoute />,
                children: [
                  { path: 'advisor/dashboard', element: routeElement(AdvisorDashboardPage) },
                  { path: 'advisor/clients', element: routeElement(AdvisorClientsPage) },
                  { path: 'advisor/clients/:clientId', element: routeElement(AdvisorClientDetailPage) },
                  { path: 'advisor/widgets', element: routeElement(WidgetLibraryPage) },
                  { path: 'advisor/widgets/configure', element: routeElement(WidgetConfigurationPage) },
                ],
              },
              {
                element: <ClientRoute />,
                children: [{ path: 'client/dashboard', element: routeElement(ClientDashboardPage) }],
              },
              {
                element: <AdminRoute />,
                children: [{ path: 'admin/dashboard', element: routeElement(AdminDashboardPage) }],
              },
            ],
          },
        ],
      },
    ],
  },
  {
    path: '*',
    element: routeElement(NotFoundPage),
  },
]);
