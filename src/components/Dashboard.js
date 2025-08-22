import React, { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getRecentSessions, getSessionResumeData } from '../lib/sessionService';
import TopicInput from './TopicInput';
import FileUpload from './FileUpload';
import SessionTypeSelector from './SessionTypeSelector';
import './Dashboard.css';

const Dashboard = ({ onStartLearning }) => {
  const { user, signOut } = useAuth();
  const [inputMethod, setInputMethod] = useState('topic'); // 'topic' or 'files'
  const [sessionType, setSessionType] = useState('fast'); // 'fast' or 'depth'
  const [currentStep, setCurrentStep] = useState('input-method'); // 'input-method', 'session-type', 'ready'
  const [recentSessions, setRecentSessions] = useState([]);
  const [loadingSessions, setLoadingSessions] = useState(true);

  // Handle topic submission
  const handleTopicSubmit = (topic) => {
    console.log('Topic submitted:', topic);
    setCurrentStep('session-type');
    // Store the topic for later use
    window.selectedTopic = topic;
  };

  // Handle files submission
  const handleFilesSubmit = (filesData) => {
    console.log('Files submitted:', filesData);
    setCurrentStep('session-type');
    // Store the files data for later use
    window.selectedFiles = filesData;
  };

  // Handle session type selection
  const handleSessionTypeChange = (type) => {
    setSessionType(type);
  };

  // Handle starting the learning session
  const handleStartLearning = () => {
    if (inputMethod === 'topic' && window.selectedTopic) {
      onStartLearning && onStartLearning({
        type: sessionType,
        topic: window.selectedTopic
      });
    } else if (inputMethod === 'files' && window.selectedFiles) {
      onStartLearning && onStartLearning({
        type: sessionType,
        files: window.selectedFiles
      });
    }
  };

  // Handle going back to input method selection
  const handleBackToInputMethod = () => {
    setCurrentStep('input-method');
    setInputMethod('topic');
    window.selectedTopic = null;
    window.selectedFiles = null;
  };

  // Load recent sessions
  const loadRecentSessions = async () => {
    try {
      setLoadingSessions(true);
      const result = await getRecentSessions(3);
      if (result.success) {
        setRecentSessions(result.sessions);
      } else {
        console.error('Failed to load recent sessions:', result.error);
      }
    } catch (error) {
      console.error('Error loading recent sessions:', error);
    } finally {
      setLoadingSessions(false);
    }
  };

  // Handle continuing a session
  const handleContinueSession = async (sessionId) => {
    try {
      console.log('Continuing session:', sessionId);
      const result = await getSessionResumeData(sessionId);

      if (result.success) {
        const resumeData = result.resumeData;
        console.log('Resume data:', resumeData);

        // Navigate to appropriate learning session with resume data
        onStartLearning && onStartLearning({
          type: resumeData.sessionType,
          topic: resumeData.topic,
          resumeData: resumeData
        });
      } else {
        console.error('Failed to get resume data:', result.error);
        // Could show a toast notification here
        alert('Failed to continue session. Please try again.');
      }
    } catch (error) {
      console.error('Error continuing session:', error);
      alert('Failed to continue session. Please try again.');
    }
  };

  // Load recent sessions when component mounts
  useEffect(() => {
    if (user) {
      loadRecentSessions();
    }
  }, [user]);

  return (
    <div className="dashboard-container">
      <header className="dashboard-header">
        <h1 className="dashboard-title">Study Genie</h1>
        <div className="user-info">
          <span className="user-email">{user?.email}</span>
          <button 
            onClick={signOut}
            className="signout-button"
          >
            Sign Out
          </button>
        </div>
      </header>
      
      <main className="dashboard-main">
        {currentStep === 'input-method' && (
          <>
            <div className="welcome-section">
              <h2>Welcome to your learning journey!</h2>
              <p>Choose how you'd like to start learning today.</p>
            </div>

            <div className="input-method-selection">
              <div className="method-selector">
                <button
                  className={`method-option ${inputMethod === 'topic' ? 'selected' : ''}`}
                  onClick={() => setInputMethod('topic')}
                >
                  <span className="method-icon">📝</span>
                  <span className="method-text">Enter Topic</span>
                </button>
                <button
                  className={`method-option ${inputMethod === 'files' ? 'selected' : ''}`}
                  onClick={() => setInputMethod('files')}
                >
                  <span className="method-icon">📁</span>
                  <span className="method-text">Upload Files</span>
                </button>
              </div>

              <div className="selected-method-content">
                {inputMethod === 'topic' && (
                  <TopicInput onTopicSubmit={handleTopicSubmit} />
                )}
                {inputMethod === 'files' && (
                  <FileUpload onFilesSubmit={handleFilesSubmit} />
                )}
              </div>
            </div>
          </>
        )}

        {currentStep === 'session-type' && (
          <>
            <div className="step-header">
              <button className="back-button" onClick={handleBackToInputMethod}>
                ← Back to Input Selection
              </button>
              <h2>Choose Your Learning Style</h2>
            </div>

            <SessionTypeSelector
              selectedType={sessionType}
              onTypeChange={handleSessionTypeChange}
            />

            <div className="start-session-section">
              <button
                className="start-session-button"
                onClick={handleStartLearning}
                disabled={!sessionType}
              >
                Start {sessionType === 'fast' ? 'Fast' : 'Depth'} Learning Session
              </button>
            </div>
          </>
        )}

        <div className="recent-sessions">
          <h3>Recent Learning Sessions</h3>
          <div className="sessions-grid">
            {loadingSessions ? (
              <div className="session-card">
                <h4>Loading sessions...</h4>
                <p>Please wait while we fetch your recent sessions.</p>
              </div>
            ) : recentSessions.length > 0 ? (
              recentSessions.map((session) => (
                <div key={session.id} className="session-card">
                  <div className="session-header">
                    <h4>{session.topic}</h4>
                    <span className={`session-type ${session.session_type}`}>
                      {session.session_type === 'fast' ? '⚡ Fast' : '🎯 Depth'}
                    </span>
                  </div>
                  <div className="session-stats">
                    <div className="stat">
                      <span className="stat-label">Flashcards:</span>
                      <span className="stat-value">
                        {session.studied_flashcards}/{session.total_flashcards}
                      </span>
                    </div>
                    {session.total_questions > 0 && (
                      <div className="stat">
                        <span className="stat-label">Score:</span>
                        <span className="stat-value">
                          {session.final_score ? `${session.final_score}%` : 'In Progress'}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="session-meta">
                    <span className={`session-status ${session.status}`}>
                      {session.status === 'completed' ? '✅ Completed' :
                       session.status === 'in_progress' ? '🔄 In Progress' : '❌ Abandoned'}
                    </span>
                    <span className="session-date">
                      {new Date(session.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Continue button for in-progress sessions */}
                  {session.status === 'in_progress' && (
                    <div className="session-actions">
                      <button
                        className="continue-session-button"
                        onClick={() => handleContinueSession(session.id)}
                      >
                        <span className="continue-icon">▶️</span>
                        Continue Session
                      </button>
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="session-card">
                <h4>No sessions yet</h4>
                <p>Start your first learning session above!</p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
