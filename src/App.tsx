import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ThemeProvider } from './context/ThemeContext';
import LandingPage from './pages/LandingPage';
import AuthPage from './pages/AuthPage';
import Dashboard from './pages/Dashboard';
import AnalysisResults from './pages/AnalysisResults';
import ChatPage from './pages/ChatPage';
import History from './pages/History';
import ProfileSettings from './pages/ProfileSettings';
import './App.css';

function App() {
  return (
    <ThemeProvider>
      <Router>
        <div className="min-h-screen bg-gray-900">
          <Routes>
            <Route path="/" element={<LandingPage />} />
            <Route path="/auth" element={<AuthPage />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/analysis" element={<AnalysisResults />} />
            <Route path="/chat" element={<ChatPage />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile" element={<ProfileSettings />} />
          </Routes>
        </div>
      </Router>
    </ThemeProvider>
  );
}

export default App;