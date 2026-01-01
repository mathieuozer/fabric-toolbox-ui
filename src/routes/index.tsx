import { lazy, Suspense } from 'react';
import { createBrowserRouter } from 'react-router-dom';
import { DashboardShell } from '@/components/layout/DashboardShell';
import { HomePage } from '@/components/pages/HomePage';
import { SettingsPage } from '@/components/pages/SettingsPage';
import { NotFoundPage } from '@/components/pages/NotFoundPage';
import { Skeleton } from '@/components/ui/skeleton';

// Lazy-loaded tool modules
const DataFactoryMigrationModule = lazy(
  () => import('@/modules/data-factory-migration')
);

// Loading fallback component
function ModuleLoader() {
  return (
    <div className="space-y-4 p-4">
      <Skeleton className="h-8 w-64" />
      <Skeleton className="h-4 w-96" />
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 mt-8">
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
        <Skeleton className="h-32" />
      </div>
    </div>
  );
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <DashboardShell />,
    children: [
      // Home/Overview
      { index: true, element: <HomePage /> },
      { path: 'home', element: <HomePage /> },

      // Settings
      { path: 'settings', element: <SettingsPage /> },

      // Tool Modules (lazy-loaded)
      {
        path: 'tools/data-factory-migration/*',
        element: (
          <Suspense fallback={<ModuleLoader />}>
            <DataFactoryMigrationModule />
          </Suspense>
        ),
      },

      // 404
      { path: '*', element: <NotFoundPage /> },
    ],
  },
]);
