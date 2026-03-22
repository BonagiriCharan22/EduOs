import React, { useState, useEffect } from 'react';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { api } from './api';
import './index.css';

const App = () => {
  const [page, setPage] = useState('setup');
  const [userId, setUserId] = useState(localStorage.getItem('userId') || null);
  const [name, setName] = useState('');
  const [topics, setTopics] = useState('');
  const [examDate, setExamDate] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (userId && page === 'setup') setPage('dashboard');
  }, [userId]);

  const handleSetup = async () => {
    setLoading(true);
    setError('');
    try {
      const topicList = topics.split(',').map((t) => t.trim());
      const res = await api.post('/user/init', { name, topics: topicList, examDate });
      localStorage.setItem('userId', res.userId);
      localStorage.setItem('examDate', examDate);
      setUserId(res.userId);
      setPage('dashboard');
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  };

  const handleLogout = () => {
    localStorage.removeItem('userId');
    localStorage.removeItem('examDate');
    setUserId(null);
    setPage('setup');
  };

  if (!userId) {
    return (
      <div className="setup-page">
        <div className="setup-card">
          <h1>Welcome to EduOS</h1>
          <p className="subtitle">Adaptive Learning Intelligence Platform</p>
          <div className="form-group">
            <label>Name</label>
            <input type="text" placeholder="Your name" value={name} onChange={(e) => setName(e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label>Topics to Study</label>
            <input type="text" placeholder="e.g., Arrays, Recursion, DP (comma-separated)" value={topics} onChange={(e) => setTopics(e.target.value)} className="input" />
          </div>
          <div className="form-group">
            <label>Exam Date</label>
            <input type="date" value={examDate} onChange={(e) => setExamDate(e.target.value)} className="input" />
          </div>
          {error && <div className="error-msg">{error}</div>}
          <button onClick={handleSetup} disabled={loading || !name || !topics || !examDate} className="btn-primary">
            {loading ? 'Creating Profile...' : 'Start Learning'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="app-container">
      <nav className="navbar">
        <div className="nav-brand">EduOS</div>
        <div className="nav-links">
          <button className={`nav-btn ${page === 'dashboard' ? 'active' : ''}`} onClick={() => setPage('dashboard')}>
            Dashboard
          </button>
          <button className={`nav-btn ${page === 'planner' ? 'active' : ''}`} onClick={() => setPage('planner')}>
            Planner
          </button>
          <button className={`nav-btn ${page === 'tutor' ? 'active' : ''}`} onClick={() => setPage('tutor')}>
            Tutor
          </button>
          <button className="nav-btn logout" onClick={handleLogout}>
            Logout
          </button>
        </div>
      </nav>

      <div className="page-container">
        {page === 'dashboard' && <DashboardPage userId={userId} />}
        {page === 'planner' && <PlannerPage userId={userId} />}
        {page === 'tutor' && <TutorPage userId={userId} />}
      </div>
    </div>
  );
};

const DashboardPage = ({ userId }) => {
  const [dashboard, setDashboard] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, [userId]);

  const fetchDashboard = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/dashboard/${userId}`);
      setDashboard(data);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading...</div>;
  if (!dashboard) return <div className="loading">No data</div>;

  return (
    <div className="dashboard-page">
      <div className="page-header">
        <h1>Dashboard</h1>
        <button onClick={fetchDashboard} className="btn-secondary">Refresh</button>
      </div>

      <div className="cards-grid">
        <div className="stat-card">
          <div className="stat-label">Overall Accuracy</div>
          <div className="stat-value" style={{ color: dashboard.accuracy > 70 ? '#10b981' : '#f59e0b' }}>
            {dashboard.accuracy}%
          </div>
          <div className="stat-subtitle">{dashboard.totalSessions} sessions</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Risk Level</div>
          <div className="stat-value">{dashboard.risk.level}</div>
          <div className="stat-subtitle">{dashboard.risk.message}</div>
        </div>

        <div className="stat-card">
          <div className="stat-label">Weak Topics</div>
          <div className="topics-list">
            {dashboard.weakTopics.length > 0 ? (
              dashboard.weakTopics.map((t, i) => <span key={i} className="topic-badge">{t}</span>)
            ) : (
              <span style={{ color: '#10b981' }}>All strong! 🎉</span>
            )}
          </div>
        </div>
      </div>

      {dashboard.topicBreakdown && dashboard.topicBreakdown.length > 0 && (
        <div className="charts-section">
          <div className="chart-container">
            <h3>Accuracy by Topic</h3>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboard.topicBreakdown}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="topic" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="accuracy" fill="#3b82f6" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}

      <SessionForm userId={userId} onSubmit={fetchDashboard} />
    </div>
  );
};

const SessionForm = ({ userId, onSubmit }) => {
  const [form, setForm] = useState({ topic: '', questionsAttempted: '', correct: '', timeSpent: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!form.topic || !form.questionsAttempted || !form.correct || !form.timeSpent) {
      alert('Fill all fields');
      return;
    }

    setSubmitting(true);
    try {
      await api.post('/session/add', {
        userId,
        topic: form.topic,
        accuracy: parseInt(form.correct) / parseInt(form.questionsAttempted),
        timeSpent: parseInt(form.timeSpent) * 60,
        questionsAttempted: parseInt(form.questionsAttempted),
        correct: parseInt(form.correct),
      });
      setForm({ topic: '', questionsAttempted: '', correct: '', timeSpent: '' });
      onSubmit();
      alert('Session recorded!');
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setSubmitting(false);
  };

  return (
    <div className="session-form-container">
      <h3>Record Learning Session</h3>
      <div className="form-row">
        <div className="form-group">
          <label>Topic</label>
          <input type="text" placeholder="Arrays" value={form.topic} onChange={(e) => setForm({...form, topic: e.target.value})} className="input" />
        </div>
        <div className="form-group">
          <label>Questions Attempted</label>
          <input type="number" placeholder="10" value={form.questionsAttempted} onChange={(e) => setForm({...form, questionsAttempted: e.target.value})} className="input" />
        </div>
        <div className="form-group">
          <label>Correct Answers</label>
          <input type="number" placeholder="8" value={form.correct} onChange={(e) => setForm({...form, correct: e.target.value})} className="input" />
        </div>
        <div className="form-group">
          <label>Time (minutes)</label>
          <input type="number" placeholder="30" value={form.timeSpent} onChange={(e) => setForm({...form, timeSpent: e.target.value})} className="input" />
        </div>
      </div>
      <button onClick={handleSubmit} disabled={submitting} className="btn-primary">
        {submitting ? 'Recording...' : 'Record Session'}
      </button>
    </div>
  );
};

const PlannerPage = ({ userId }) => {
  const [plan, setPlan] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPlan();
  }, [userId]);

  const fetchPlan = async () => {
    setLoading(true);
    try {
      const data = await api.get(`/planner/${userId}`);
      setPlan(data);
    } catch (err) {
      console.error('Error:', err);
    }
    setLoading(false);
  };

  if (loading) return <div className="loading">Loading plan...</div>;
  if (!plan || !plan.dailyPlan) return <div className="loading">No plan available. Record sessions first!</div>;

  return (
    <div className="planner-page">
      <div className="page-header">
        <h1>7-Day Study Plan</h1>
        <button onClick={fetchPlan} className="btn-secondary">Regenerate</button>
      </div>

      {plan.topicPriorities && (
        <div className="priorities-section">
          <h3>Priority Topics</h3>
          <div className="priority-list">
            {plan.topicPriorities.map((topic, i) => (
              <div key={i} className="priority-item">
                <div className="priority-rank">{i + 1}</div>
                <div className="priority-details">
                  <div className="priority-name">{topic.topic}</div>
                  <div className="priority-stats">Accuracy: {Math.round(topic.accuracy * 100)}%</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="daily-plan-section">
        <h3>Daily Schedule</h3>
        <div className="daily-plan-grid">
          {plan.dailyPlan.map((day, i) => (
            <div key={i} className="daily-card">
              <div className="daily-header">
                <div className="daily-day">Day {day.day}</div>
              </div>
              <div className="daily-topics">
                {day.topics.map((t, idx) => (
                  <div key={idx} className="daily-topic">
                    <div className="topic-name">{t.topic}</div>
                    <div className="topic-time">⏱️ {Math.round(t.minTime)} min</div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TutorPage = ({ userId }) => {
  const [topic, setTopic] = useState('');
  const [question, setQuestion] = useState('');
  const [response, setResponse] = useState('');
  const [loading, setLoading] = useState(false);

  const handleAsk = async () => {
    if (!topic || !question) {
      alert('Fill topic and question');
      return;
    }

    setLoading(true);
    try {
      const data = await api.post('/tutor', { userId, topic, question });
      setResponse(data.response);
    } catch (err) {
      alert('Error: ' + err.message);
    }
    setLoading(false);
  };

  return (
    <div className="tutor-page">
      <div className="page-header">
        <h1>AI Tutor</h1>
      </div>

      <div className="tutor-input-section">
        <div className="form-group">
          <label>Topic</label>
          <input type="text" placeholder="Arrays" value={topic} onChange={(e) => setTopic(e.target.value)} className="input" />
        </div>
        <div className="form-group">
          <label>Question</label>
          <textarea placeholder="Ask..." value={question} onChange={(e) => setQuestion(e.target.value)} className="textarea" rows="4" />
        </div>
        <button onClick={handleAsk} disabled={loading} className="btn-primary">
          {loading ? 'Thinking...' : 'Ask AI Tutor'}
        </button>
      </div>

      {response && (
        <div className="tutor-response">
          <h3>Response</h3>
          <div className="response-content">{response}</div>
        </div>
      )}
    </div>
  );
};

export default App;
