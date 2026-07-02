import { lazy, Suspense, type ComponentType } from 'react';
import { createBrowserRouter, Navigate } from 'react-router-dom';
import { AppLayout } from '../components/layout/AppLayout';
import { AdminRoute, AdvisorRoute, ClientRoute, ProtectedRoute } from '../components/routes/RouteGuards';
import { DashboardSkeleton } from '../components/ui/Skeleton';

const LoginPage = lazy(() =>
  import('../pages/LoginPage').then((module) => ({ default: module.LoginPage })),
);
const AdvisorDashboardPage = lazy(() =>
  import('../pages/AdvisorDashboardPage').then((module) => ({ default: module.AdvisorDashboardPage })),
);
const AdvisorClientDetailPage = lazy(() =>
  import('../pages/AdvisorClientDetailPage').then((module) => ({ default: module.AdvisorClientDetailPage })),
);
const WidgetLibraryPage = lazy(() =>
  import('../pages/WidgetLibraryPage').then((module) => ({ default: module.WidgetLibraryPage })),
);
const WidgetDetailPage = lazy(() =>
  import('../pages/WidgetDetailPage').then((module) => ({ default: module.WidgetDetailPage })),
);
const WidgetConfigurationPage = lazy(() =>
  import('../pages/WidgetConfigurationPage').then((module) => ({ default: module.WidgetConfigurationPage })),
);
const AdvisorAnalyticsPage = lazy(() =>
  import('../pages/AdvisorAnalyticsPage').then((module) => ({ default: module.AdvisorAnalyticsPage })),
);
const ClientDashboardPage = lazy(() =>
  import('../pages/ClientDashboardPage').then((module) => ({ default: module.ClientDashboardPage })),
);
const ClientWidgetDetailPage = lazy(() =>
  import('../pages/ClientWidgetDetailPage').then((module) => ({ default: module.ClientWidgetDetailPage })),
);
const AdminDashboardPage = lazy(() =>
  import('../pages/AdminDashboardPage').then((module) => ({ default: module.AdminDashboardPage })),
);
const AdminAnalyticsPage = lazy(() =>
  import('../pages/AdminAnalyticsPage').then((module) => ({ default: module.AdminAnalyticsPage })),
);
const AdminAuditPage = lazy(() =>
  import('../pages/AdminAuditPage').then((module) => ({ default: module.AdminAuditPage })),
);
const AdminClientsPage = lazy(() =>
  import('../pages/AdminClientsPage').then((module) => ({ default: module.AdminClientsPage })),
);
const AdminAdvisorsPage = lazy(() =>
  import('../pages/AdminAdvisorsPage').then((module) => ({ default: module.AdminAdvisorsPage })),
);
const NotFoundPage = lazy(() =>
  import('../pages/NotFoundPage').then((module) => ({ default: module.NotFoundPage })),
);

function routeElement(Page: ComponentType) {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
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
                  { path: 'advisor/clients', element: <Navigate to="/advisor/client-management" replace /> },
                  { path: 'advisor/client-management', element: routeElement(AdminClientsPage) },
                  { path: 'advisor/clients/:clientId', element: routeElement(AdvisorClientDetailPage) },
                  { path: 'advisor/widgets', element: routeElement(WidgetLibraryPage) },
                  { path: 'advisor/widgets/:widgetId', element: routeElement(WidgetDetailPage) },
                  { path: 'advisor/widgets/configure', element: routeElement(WidgetConfigurationPage) },
                  { path: 'advisor/analytics', element: routeElement(AdvisorAnalyticsPage) },
                ],
              },
              {
                element: <ClientRoute />,
                children: [
                  { path: 'client/dashboard', element: routeElement(ClientDashboardPage) },
                  { path: 'client/widgets', element: <Navigate to="/client/dashboard" replace /> },
                  { path: 'client/widgets/:widgetId', element: routeElement(ClientWidgetDetailPage) },
                ],
              },
              {
                element: <AdminRoute />,
                children: [
                  { path: 'admin/dashboard', element: routeElement(AdminDashboardPage) },
                  { path: 'admin/analytics', element: routeElement(AdminAnalyticsPage) },
                  { path: 'admin/audit-logs', element: routeElement(AdminAuditPage) },
                  { path: 'admin/clients', element: routeElement(AdminClientsPage) },
                  { path: 'admin/clients/:clientId', element: routeElement(AdvisorClientDetailPage) },
                  { path: 'admin/advisors', element: routeElement(AdminAdvisorsPage) },
                ],
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
