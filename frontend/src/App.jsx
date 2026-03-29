import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import SignupPage from './pages/SignupPage';
import ProtectedRoute from './components/layout/ProtectedRoute';
import AppLayout from './components/layout/AppLayout';
import BrandAnalysisPage from './pages/BrandAnalysisPage';
import ContentPlanPage from './pages/ContentPlanPage';
import PublishingQueuePage from './pages/PublishingQueuePage';
import SettingsPage from './pages/SettingsPage';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/signup" element={<SignupPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<AppLayout />}>
            <Route path="/brand-analysis" element={<BrandAnalysisPage />} />
            <Route path="/content-plan" element={<ContentPlanPage />} />
            <Route path="/publishing-queue" element={<PublishingQueuePage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>

        <Route path="*" element={<Navigate to="/brand-analysis" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
