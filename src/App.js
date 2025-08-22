import React, { useState } from 'react';
import './App.css';
import { AuthProvider, useAuth } from './context/AuthContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import DepthLearningSession from './components/DepthLearningSession';
import FastLearningSession from './components/FastLearningSession';

// Loading component
const Loading = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Loading...</p>
  </div>
);

// Main App Content
const AppContent = () => {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('dashboard');
  const [learningData, setLearningData] = useState(null);

  if (loading) {
    return <Loading />;
  }

  if (!user) {
    return <Auth />;
  }

  const handleStartLearning = (data) => {
    setLearningData(data);
    setCurrentView('learning');
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
    setLearningData(null);
  };

  if (currentView === 'learning' && learningData) {
    if (learningData.type === 'fast') {
      return (
        <FastLearningSession
          topic={learningData.topic || 'Uploaded Content'}
          onBack={handleBackToDashboard}
        />
      );
    } else if (learningData.type === 'depth') {
      return (
        <DepthLearningSession
          topic={learningData.topic || 'Uploaded Content'}
          onBack={handleBackToDashboard}
        />
      );
    }
  }

  return <Dashboard onStartLearning={handleStartLearning} />;
};

function App() {
  return (
    <AuthProvider>
      <div className="App">
        <AppContent />
      </div>
    </AuthProvider>
  );
}

export default App;
