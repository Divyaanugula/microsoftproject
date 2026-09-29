import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Bot, CheckCircle, XCircle, ArrowLeft, Loader2, Sparkles, AlertTriangle, Clock, Tag } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/incidents';

const IncidentDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [incident, setIncident] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [loading, setLoading] = useState(true);
  const [analyzing, setAnalyzing] = useState(false);
  const [feedbackSent, setFeedbackSent] = useState(false);
  const [toast, setToast] = useState(null);

  useEffect(() => {
    const fetchIncident = async () => {
      try {
        const res = await fetch(`${API_BASE}/${id}`);
        if (!res.ok) throw new Error('Incident not found');
        const data = await res.json();
        setIncident(data);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchIncident();
  }, [id]);

  const handleAnalyze = async () => {
    setAnalyzing(true);
    try {
      const res = await fetch(`${API_BASE}/${id}/analyze`, { method: 'POST' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || 'Analysis failed');
      }
      const data = await res.json();
      setAnalysis(data);
    } catch (err) {
      setToast({ type: 'error', message: `Analysis failed: ${err.message}` });
      setTimeout(() => setToast(null), 4000);
    } finally {
      setAnalyzing(false);
    }
  };

  const handleFeedback = async (success) => {
    try {
      const res = await fetch(`${API_BASE}/${id}/feedback`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ success })
      });
      const data = await res.json();
      setIncident(prev => ({ ...prev, status: data.status }));
      setFeedbackSent(true);
      setToast({
        type: 'success',
        message: success
          ? 'Marked as resolved! Post-mortem generated.'
          : 'Marked as failed. Keep investigating.'
      });
      setTimeout(() => setToast(null), 4000);
    } catch (err) {
      setToast({ type: 'error', message: 'Failed to submit feedback' });
      setTimeout(() => setToast(null), 4000);
    }
  };

  if (loading) {
    return (
      <div className="loading-spinner">
        <div className="spinner"></div>
        <span className="loading-text">Loading incident details...</span>
      </div>
    );
  }

  if (!incident) {
    return (
      <div className="empty-state">
        <AlertTriangle size={48} />
        <h3>Incident Not Found</h3>
        <p>The incident {id} could not be found.</p>
        <button className="btn btn-primary" style={{ marginTop: '16px' }} onClick={() => navigate('/')}>
          <ArrowLeft size={16} /> Go to Dashboard
        </button>
      </div>
    );
  }

  return (
    <div className="incident-details">
      <button
        className="btn btn-ghost"
        style={{ marginBottom: '20px', padding: '7px 14px' }}
        onClick={() => navigate(-1)}
      >
        <ArrowLeft size={16} /> Back
      </button>

      <div className="page-header">
        <div>
          <h1>{incident.title}</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Tag size={13} /> {id}
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
              <Clock size={13} /> {incident.time}
            </span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
          <span className={`badge badge-${incident.severity.toLowerCase()}`}>{incident.severity}</span>
          <span className={`badge badge-${incident.status.toLowerCase()}`}>{incident.status}</span>
        </div>
      </div>

      <div className="details-grid">
        <div className="main-panel">
          {/* Description */}
          <div className="card" style={{ padding: '24px', marginBottom: '20px' }}>
            <h2 className="section-title">Incident Description</h2>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: '1.8' }}>
              {incident.description}
            </p>
          </div>

          {/* AI Analysis */}
          {!analysis && !analyzing && (
            <div className="card" style={{ padding: '32px', textAlign: 'center' }}>
              <Sparkles size={36} color="var(--accent-purple)" style={{ marginBottom: '12px', opacity: 0.7 }} />
              <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>AI Analysis Available</h3>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '20px', maxWidth: '400px', margin: '0 auto 20px' }}>
                Use Groq AI to analyze this incident, identify root causes, and get suggested solutions.
              </p>
              <button className="btn btn-primary" onClick={handleAnalyze}>
                <Bot size={16} /> Analyze with AI
              </button>
            </div>
          )}

          {analyzing && (
            <div className="ai-box" style={{ textAlign: 'center', padding: '48px' }}>
              <div className="spinner" style={{ margin: '0 auto 16px' }}></div>
              <p className="loading-text">AI is analyzing the incident...</p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                This may take a few seconds
              </p>
            </div>
          )}

          {analysis && (
            <div className="ai-box">
              {/* Action buttons header in AI box */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
                <h2 className="section-title" style={{ color: 'var(--accent-blue)', margin: 0 }}>
                  <Bot size={22} /> AI Analysis
                </h2>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '11px', padding: '4px 10px' }}
                  onClick={() => {
                    const text = `OpsEcho Incident Analysis: ${incident.title}\n\nSummary:\n${analysis.summary}\n\nRoot Causes:\n${analysis.root_causes.map(c => `- ${c}`).join('\n')}\n\nSuggested Solutions:\n${analysis.suggested_solutions.map(s => `- ${s}`).join('\n')}`;
                    navigator.clipboard.writeText(text);
                    setToast({ type: 'success', message: 'Analysis copied to clipboard!' });
                    setTimeout(() => setToast(null), 3000);
                  }}
                >
                  Copy Analysis
                </button>
              </div>

              <p style={{ marginBottom: '20px', lineHeight: '1.7', color: 'var(--text-primary)' }}>{analysis.summary}</p>

              <h4 style={{ color: 'var(--accent-danger)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <AlertTriangle size={14} /> Root Causes
              </h4>
              <ul style={{ paddingLeft: '20px', marginBottom: '20px' }}>
                {analysis.root_causes.map((cause, i) => (
                  <li key={i} style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {cause}
                  </li>
                ))}
              </ul>

              <h4 style={{ color: 'var(--accent-success)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <CheckCircle size={14} /> Suggested Solutions
              </h4>
              <ol style={{ paddingLeft: '20px', marginBottom: '24px' }}>
                {analysis.suggested_solutions.map((sol, i) => (
                  <li key={i} style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)' }}>
                    {sol}
                  </li>
                ))}
              </ol>

              {/* Feedback section */}
              {incident.status === 'Active' && !feedbackSent && (
                <div style={{
                  marginTop: '28px',
                  borderTop: '1px solid rgba(59, 130, 246, 0.15)',
                  paddingTop: '24px'
                }}>
                  <h4 style={{ color: 'var(--text-primary)', marginBottom: '12px' }}>
                    Did this help resolve the incident?
                  </h4>
                  <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
                    <button className="btn btn-success" onClick={() => handleFeedback(true)}>
                      <CheckCircle size={16} /> Mark Resolved & Generate Post-Mortem
                    </button>
                    <button className="btn btn-danger" onClick={() => handleFeedback(false)}>
                      <XCircle size={16} /> Needs More Investigation
                    </button>
                  </div>
                </div>
              )}

              {(feedbackSent || incident.status === 'Resolved') && (
                <div style={{
                  marginTop: '28px',
                  borderTop: '1px solid rgba(16, 185, 129, 0.2)',
                  paddingTop: '24px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  flexWrap: 'wrap',
                  gap: '12px',
                  background: 'rgba(16, 185, 129, 0.05)',
                  padding: '16px 20px',
                  borderRadius: '10px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                    <CheckCircle size={22} color="var(--accent-success)" />
                    <div>
                      <div style={{ color: 'var(--accent-success)', fontWeight: 600, fontSize: '14px' }}>
                        Incident Resolved
                      </div>
                      <div style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                        Post-mortem report is available.
                      </div>
                    </div>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                      className="btn btn-primary"
                      style={{ fontSize: '12px', padding: '7px 14px' }}
                      onClick={() => navigate('/post-mortem')}
                    >
                      View Post-Mortem Report &rarr;
                    </button>
                    <button
                      className="btn btn-ghost"
                      style={{ fontSize: '12px', padding: '7px 14px' }}
                      onClick={async () => {
                        try {
                          const res = await fetch(`${API_BASE}/${id}/reopen`, { method: 'POST' });
                          const data = await res.json();
                          setIncident(prev => ({ ...prev, status: data.status }));
                          setFeedbackSent(false);
                          setToast({ type: 'success', message: 'Incident reopened' });
                          setTimeout(() => setToast(null), 3000);
                        } catch (e) {
                          setToast({ type: 'error', message: 'Failed to reopen incident' });
                          setTimeout(() => setToast(null), 3000);
                        }
                      }}
                    >
                      Reopen
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Side Panel */}
        <div className="side-panel">
          <div className="card" style={{ padding: '24px' }}>
            <h2 className="section-title">Incident Info</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Severity
                </p>
                <span className={`badge badge-${incident.severity.toLowerCase()}`}>
                  {incident.severity}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Status
                </p>
                <span className={`badge badge-${incident.status.toLowerCase()}`}>
                  {incident.status}
                </span>
              </div>
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: '4px' }}>
                  Reported
                </p>
                <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{incident.time}</p>
              </div>
            </div>
          </div>

          <div className="card" style={{ padding: '24px', marginTop: '16px' }}>
            <h2 className="section-title">Similar Past Incidents</h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '14px' }}>
                <h4 style={{ fontSize: '13px', marginBottom: '4px' }}>INC-0892: DB Timeout during sale</h4>
                <p style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600 }}>
                  ✓ Resolved by: Restarting pods
                </p>
              </div>
              <div>
                <h4 style={{ fontSize: '13px', marginBottom: '4px' }}>INC-0741: Postgres unreachable</h4>
                <p style={{ fontSize: '11px', color: 'var(--accent-danger)', fontWeight: 600 }}>
                  ✗ Failed: Increased connections
                </p>
                <p style={{ fontSize: '11px', color: 'var(--accent-success)', fontWeight: 600, marginTop: '4px' }}>
                  ✓ Resolved: Upgrading instance
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default IncidentDetails;
