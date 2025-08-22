import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import FileProcessor from './FileProcessor';
import './Dashboard.css';

const Dashboard = ({ onStartLearning }) => {
  const { user, signOut } = useAuth();
  const [topic, setTopic] = useState('');
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [attachedLinks, setAttachedLinks] = useState([]);
  const [showAttachDropdown, setShowAttachDropdown] = useState(false);
  const [linkInput, setLinkInput] = useState('');
  const [filesToProcess, setFilesToProcess] = useState([]);
  const [showFileProcessor, setShowFileProcessor] = useState(false);

  // Handle file uploads
  const handleFileUpload = (event) => {
    const files = Array.from(event.target.files);
    console.log('Files uploaded:', files);

    // Separate files that need processing (PDFs and images) from regular files
    const processableFiles = files.filter(file =>
      file.type === 'application/pdf' || file.type.startsWith('image/')
    );
    const regularFiles = files.filter(file =>
      file.type !== 'application/pdf' && !file.type.startsWith('image/')
    );

    // Add regular files to uploaded files immediately
    if (regularFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...regularFiles]);
    }

    // Set processable files for processing
    if (processableFiles.length > 0) {
      setFilesToProcess(processableFiles);
      setShowFileProcessor(true);
      console.log(`${processableFiles.length} files queued for text extraction`);
    }

    setShowAttachDropdown(false);
  };

  // Handle link submission
  const handleLinkSubmit = () => {
    if (linkInput.trim()) {
      console.log('Link added:', linkInput);
      setAttachedLinks(prev => [...prev, linkInput.trim()]);
      setLinkInput('');
      setShowAttachDropdown(false);
    }
  };

  // Handle file processing completion
  const handleFileProcessingComplete = (results) => {
    console.log('File processing completed:', results);

    // Add successfully processed files to uploaded files
    const processedFiles = results.results.filter(r => r.success);
    if (processedFiles.length > 0) {
      setUploadedFiles(prev => [...prev, ...processedFiles]);
    }

    // Clear the files to process
    setFilesToProcess([]);
    setShowFileProcessor(false);
  };

  // Handle file processing errors
  const handleFileProcessingError = (errors) => {
    console.error('File processing errors:', errors);
    // You could show a toast notification or error message here
  };

  // Handle main submission (topic + attachments)
  const handleMainSubmit = () => {
    const hasContent = topic.trim() || uploadedFiles.length > 0 || attachedLinks.length > 0;

    if (hasContent) {
      console.log('Submission:', {
        topic: topic.trim(),
        files: uploadedFiles,
        links: attachedLinks
      });

      // If only topic is provided, use existing learning flow
      if (topic.trim() && uploadedFiles.length === 0 && attachedLinks.length === 0) {
        onStartLearning && onStartLearning(topic);
      }
    }
  };

  // Remove attached file
  const removeFile = (index) => {
    setUploadedFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Remove attached link
  const removeLink = (index) => {
    setAttachedLinks(prev => prev.filter((_, i) => i !== index));
  };

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
        <div className="welcome-section">
          <h2>Welcome to your learning journey!</h2>
          <p>Start by entering a topic or attach your learning materials.</p>
        </div>
        
        <div className="main-input-section">
          <div className="input-card">
            <h3>What would you like to learn today?</h3>
            
            {/* Attached Files Display */}
            {(uploadedFiles.length > 0 || attachedLinks.length > 0) && (
              <div className="attachments-display">
                {uploadedFiles.map((file, index) => (
                  <div key={`file-${index}`} className="attachment-item">
                    <span className="attachment-icon">
                      {file.fileName ? '📄' : (file.type === 'application/pdf' ? '📄' : '🖼️')}
                    </span>
                    <span className="attachment-name">
                      {file.fileName || file.name}
                      {file.processingMethod && (
                        <span className="processing-badge">{file.processingMethod}</span>
                      )}
                    </span>
                    <button
                      onClick={() => removeFile(index)}
                      className="remove-attachment"
                    >
                      ✕
                    </button>
                  </div>
                ))}
                {attachedLinks.map((link, index) => (
                  <div key={`link-${index}`} className="attachment-item">
                    <span className="attachment-icon">🔗</span>
                    <span className="attachment-name">{link}</span>
                    <button
                      onClick={() => removeLink(index)}
                      className="remove-attachment"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}

            <div className="input-container">
              <div className="main-input-group">
                <div className="attach-container">
                  <button
                    className="attach-button"
                    onClick={() => setShowAttachDropdown(!showAttachDropdown)}
                    title="Attach files or links"
                  >
                    Attach
                  </button>

                  {showAttachDropdown && (
                    <div className="attach-dropdown">
                      <div className="dropdown-item">
                        <input
                          type="file"
                          id="images-upload"
                          multiple
                          accept=".jpg,.jpeg,.png,.gif,.bmp,.webp"
                          onChange={handleFileUpload}
                          className="hidden-file-input"
                        />
                        <label htmlFor="images-upload" className="dropdown-label">
                          Images
                        </label>
                      </div>

                      <div className="dropdown-item">
                        <input
                          type="file"
                          id="documents-upload"
                          multiple
                          accept=".pdf,.doc,.docx,.txt"
                          onChange={handleFileUpload}
                          className="hidden-file-input"
                        />
                        <label htmlFor="documents-upload" className="dropdown-label">
                          Documents
                        </label>
                      </div>

                      <div className="dropdown-item link-item">
                        <div className="link-input-container">
                          <input
                            type="url"
                            placeholder="Paste a link..."
                            className="link-dropdown-input"
                            value={linkInput}
                            onChange={(e) => setLinkInput(e.target.value)}
                            onKeyDown={(e) => e.key === 'Enter' && handleLinkSubmit()}
                          />
                          <button
                            onClick={handleLinkSubmit}
                            className="link-submit-button"
                            disabled={!linkInput.trim()}
                          >
                            Add
                          </button>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <input
                  type="text"
                  placeholder="Enter a topic or question..."
                  className="main-input"
                  value={topic}
                  onChange={(e) => setTopic(e.target.value)}
                />

                <button
                  className="submit-button"
                  onClick={handleMainSubmit}
                  disabled={!topic.trim() && uploadedFiles.length === 0 && attachedLinks.length === 0}
                >
                  ➤
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* File Processing Component */}
        {showFileProcessor && filesToProcess.length > 0 && (
          <FileProcessor
            files={filesToProcess}
            onComplete={handleFileProcessingComplete}
            onError={handleFileProcessingError}
          />
        )}

        <div className="recent-sessions">
          <h3>Recent Learning Sessions</h3>
          <div className="sessions-grid">
            <div className="session-card">
              <h4>No sessions yet</h4>
              <p>Start your first learning session above!</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;
