import React, { Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { AuthGuard } from './components/auth/AuthGuard';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import { LoadingSpinner } from './components/shared/LoadingSpinner';

const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const AssetLibrary = React.lazy(() => import('./pages/AssetLibrary'));
const AssetDetail = React.lazy(() => import('./pages/AssetDetail'));
const Violations = React.lazy(() => import('./pages/Violations'));
const ViolationDetail = React.lazy(() => import('./pages/ViolationDetail'));
const Alerts = React.lazy(() => import('./pages/Alerts'));
const Analytics = React.lazy(() => import('./pages/Analytics'));
const Settings = React.lazy(() => import('./pages/Settings'));
const Takedowns = React.lazy(() => import('./pages/Takedowns'));
const ScheduledScans = React.lazy(() => import('./pages/ScheduledScans'));
const ActivityLog = React.lazy(() => import('./pages/ActivityLog'));
const ShieldAI = React.lazy(() => import('./pages/ShieldAI'));
const GlobalMap = React.lazy(() => import('./pages/GlobalMap'));
const Pricing = React.lazy(() => import('./pages/Pricing'));
const TeamManagement = React.lazy(() => import('./pages/TeamManagement'));
const ApiKeys = React.lazy(() => import('./pages/ApiKeys'));
const Reports = React.lazy(() => import('./pages/Reports'));

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});

const PageLoader = () => (
  <div className="flex items-center justify-center min-h-screen bg-black">
    <LoadingSpinner size="lg" text="Loading module..." />
  </div>
);

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster theme="dark" position="top-right" richColors closeButton />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
            <Suspense fallback={<PageLoader />}>
              <Routes>
                <Route path="/login" element={<Login />} />
                <Route element={<AuthGuard><AppShell /></AuthGuard>}>
                  <Route index element={<Dashboard />} />
                  <Route path="assets" element={<AssetLibrary />} />
                  <Route path="assets/:id" element={<AssetDetail />} />
                  <Route path="violations" element={<Violations />} />
                  <Route path="violations/:id" element={<ViolationDetail />} />
                  <Route path="alerts" element={<Alerts />} />
                  <Route path="takedowns" element={<Takedowns />} />
                  <Route path="scans" element={<ScheduledScans />} />
                  <Route path="analytics" element={<Analytics />} />
                  <Route path="shield-ai" element={<ShieldAI />} />
                  <Route path="activity" element={<ActivityLog />} />
                  <Route path="global-map" element={<GlobalMap />} />
                  <Route path="pricing" element={<Pricing />} />
                  <Route path="team" element={<TeamManagement />} />
                  <Route path="api-keys" element={<ApiKeys />} />
                  <Route path="reports" element={<Reports />} />
                  <Route path="settings" element={<Settings />} />
                </Route>
                <Route path="*" element={<Navigate to="/" replace />} />
              </Routes>
            </Suspense>
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
