import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import LandingPage from './pages/LandingPage';
import RegisterPage from './pages/RegisterPage';

import LoginPage from './pages/LoginPage';
import CandidateDashboard from './pages/CandidateDashboard';
import ProximityAnalyzer from './pages/ProximityAnalyzer';
import Scheduler from './pages/Scheduler';
import ProfileSettings from './pages/ProfileSettings';
import { Toaster } from 'sonner';

function App() {
  return (
    <Router>
      <Toaster position="top-right" richColors />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/dashboard" element={<CandidateDashboard />} />
        <Route path="/proximity-analyzer" element={<ProximityAnalyzer />} />
        <Route path="/scheduler" element={<Scheduler />} />
        <Route path="/profile-settings" element={<ProfileSettings />} />
      </Routes>
    </Router>
  );
}

export default App;

