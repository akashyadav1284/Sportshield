import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'sonner';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './hooks/useAuth';
import { AuthGuard } from './components/auth/AuthGuard';
import { AppShell } from './components/layout/AppShell';
import { ErrorBoundary } from './components/shared/ErrorBoundary';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import AssetLibrary from './pages/AssetLibrary';
import AssetDetail from './pages/AssetDetail';
import Violations from './pages/Violations';
import ViolationDetail from './pages/ViolationDetail';
import Alerts from './pages/Alerts';
import Analytics from './pages/Analytics';
import Settings from './pages/Settings';
import Takedowns from './pages/Takedowns';
import ScheduledScans from './pages/ScheduledScans';
import ActivityLog from './pages/ActivityLog';
import ShieldAI from './pages/ShieldAI';
import GlobalMap from './pages/GlobalMap';
import Pricing from './pages/Pricing';
import TeamManagement from './pages/TeamManagement';
import ApiKeys from './pages/ApiKeys';
import Reports from './pages/Reports';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: { staleTime: 30000, retry: 1, refetchOnWindowFocus: false },
  },
});

export default function App() {
  return (
    <ErrorBoundary>
      <Toaster theme="dark" position="top-right" richColors closeButton />
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <AuthProvider>
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
          </AuthProvider>
        </BrowserRouter>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}
