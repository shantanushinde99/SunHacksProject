import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { getUserProfile, updateFullName } from '../lib/userProfileService';
import { getRecentSessions } from '../lib/sessionService';
import { getMostStruggledTopics, getOverallStruggleStats } from '../lib/topicStruggleService';
import './Profile.css';

const Profile = ({ onBack }) => {
  const { user } = useAuth();
  const [profile, setProfile] = useState(null);
  const [fullName, setFullName] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');
  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [struggledTopics, setStruggledTopics] = useState([]);
  const [overallStats, setOverallStats] = useState(null);

  const displayEmail = user?.email || '';

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const prof = await getUserProfile();
        setProfile(prof);
        setFullName(prof?.full_name || '');
        const sessionsRes = await getRecentSessions(50); // get a larger sample
        setSessions(sessionsRes.sessions || []);
        const { topics } = await getMostStruggledTopics(10);
        const overall = await getOverallStruggleStats();
        setStruggledTopics(topics || []);
        setOverallStats(overall.success ? overall.stats : null);
      } catch (e) {
        console.error('Profile load error', e);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  const totals = useMemo(() => {
    const totalSessions = sessions.length;
    const byType = sessions.reduce((acc, s) => {
      acc[s.session_type] = (acc[s.session_type] || 0) + 1;
      return acc;
    }, {});
    const completed = sessions.filter(s => s.status === 'completed');
    const avgScore = completed.length
      ? Math.round(completed.reduce((sum, s) => sum + (Number(s.final_score) || 0), 0) / completed.length)
      : 0;
    return { totalSessions, byType, avgScore, completedCount: completed.length };
  }, [sessions]);

  const handleSave = async (e) => {
    e.preventDefault();
    if (!user) return;
    setSaving(true);
    setSaveMessage('');
    try {
      const updated = await updateFullName(fullName.trim());
      setProfile(updated);
      setSaveMessage('Saved!');
    } catch (e) {
      setSaveMessage(e.message || 'Save failed');
    } finally {
      setSaving(false);
      setTimeout(() => setSaveMessage(''), 2000);
    }
  };

  return (
    <div className="profile-container">
      <header className="profile-header">
        <button className="back-button" onClick={onBack}>← Back</button>
        <h1>My Profile</h1>
      </header>

      {loading ? (
        <div className="loading">
          <div className="loading-spinner"></div>
          <p>Loading profile...</p>
        </div>
      ) : (
        <div className="profile-content">
          <section className="card">
            <h2>Account</h2>
            <form onSubmit={handleSave} className="profile-form">
              <div className="form-row">
                <label>Email</label>
                <input type="text" value={displayEmail} readOnly />
              </div>
              <div className="form-row">
                <label>Full name</label>
                <input
                  type="text"
                  placeholder="Enter your full name"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
              <div className="form-actions">
                <button type="submit" className="save-button" disabled={saving}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
                {saveMessage && <span className="save-message">{saveMessage}</span>}
              </div>
            </form>
          </section>

          <section className="card">
            <h2>Overview</h2>
            <div className="metrics-grid">
              <div className="metric">
                <div className="metric-label">Total sessions</div>
                <div className="metric-value">{totals.totalSessions}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Completed</div>
                <div className="metric-value">{totals.completedCount}</div>
              </div>
              <div className="metric">
                <div className="metric-label">Avg final score</div>
                <div className="metric-value">{totals.avgScore}%</div>
              </div>
              <div className="metric">
                <div className="metric-label">Fast / Depth</div>
                <div className="metric-value">{(totals.byType.fast||0)} / {(totals.byType.depth||0)}</div>
              </div>
            </div>
          </section>

          <section className="card">
            <h2>Weak concept areas</h2>
            {struggledTopics.length === 0 ? (
              <p>No struggled topics recorded yet.</p>
            ) : (
              <ul className="topics-list">
                {struggledTopics.map(t => (
                  <li key={t.id || t.topic_name}>
                    <span className="topic-name">{t.topic_name}</span>
                    <span className="topic-metric">{t.struggle_count}/{t.total_attempts} struggled</span>
                  </li>
                ))}
              </ul>
            )}
          </section>

          <section className="card">
            <h2>Recent sessions</h2>
            {sessions.length === 0 ? (
              <p>No sessions yet.</p>
            ) : (
              <div className="sessions-table">
                <div className="sessions-row sessions-head">
                  <div>Topic</div>
                  <div>Type</div>
                  <div>Status</div>
                  <div>Flashcards</div>
                  <div>Score</div>
                  <div>Date</div>
                </div>
                {sessions.slice(0, 10).map(s => (
                  <div key={s.id} className="sessions-row">
                    <div>{s.topic}</div>
                    <div>{s.session_type}</div>
                    <div>{s.status}</div>
                    <div>{s.studied_flashcards}/{s.total_flashcards}</div>
                    <div>{s.final_score ? `${s.final_score}%` : '-'}</div>
                    <div>{new Date(s.created_at).toLocaleDateString()}</div>
                  </div>
                ))}
              </div>
            )}
          </section>
        </div>
      )}
    </div>
  );
};

export default Profile;

