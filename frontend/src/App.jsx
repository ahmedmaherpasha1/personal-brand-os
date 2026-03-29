import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import OnboardingPage from './pages/OnboardingPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import OnboardingGuard from './components/layout/OnboardingGuard';
import AppLayout from './components/layout/AppLayout';
import BrandAnalysisPage from './pages/BrandAnalysisPage';
import ContentPlanPage from './pages/ContentPlanPage';
import PublishingQueuePage from './pages/PublishingQueuePage';
import SettingsPage from './pages/SettingsPage';
import { ToastProvider } from './components/ui/Toast';
import ErrorBoundary from './components/ui/ErrorBoundary';

export default function App() {
  return (
    <BrowserRouter>
    <ErrorBoundary>
    <ToastProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        {/* Onboarding: protected but outside AppLayout (full-page experience) */}
        <Route element={<ProtectedRoute />}>
          <Route path="/onboarding" element={<OnboardingPage />} />
        </Route>

        {/* Dashboard: protected + onboarding guard + AppLayout */}
        <Route element={<ProtectedRoute />}>
          <Route element={<OnboardingGuard />}>
            <Route element={<AppLayout />}>
              <Route path="/brand-analysis" element={<BrandAnalysisPage />} />
              <Route path="/content-plan" element={<ContentPlanPage />} />
              <Route path="/publishing-queue" element={<PublishingQueuePage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/brand-analysis" replace />} />
      </Routes>
    </ToastProvider>
    </ErrorBoundary>
    </BrowserRouter>
  );
}
