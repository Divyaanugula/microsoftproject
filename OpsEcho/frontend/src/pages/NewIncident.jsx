import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Send, ArrowLeft, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/incidents';

const NewIncident = () => {
  const navigate = useNavigate();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [severity, setSeverity] = useState('Medium');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    try {
      const res = await fetch(API_BASE, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title, description, severity })
      });

      if (!res.ok) throw new Error('Failed to create incident');
      const data = await res.json();
      navigate(`/incidents/${data.id}`);
    } catch (err) {
      setError(err.message);
      setSubmitting(false);
    }
  };

  return (
    <div className="new-incident">
      <div className="page-header">
        <div>
          <h1>Report New Incident</h1>
          <p>Provide details about the incident for AI-powered analysis.</p>
        </div>
      </div>

      <div className="card" style={{ maxWidth: '720px', padding: '32px' }}>
        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: '10px',
            padding: '12px 16px',
            marginBottom: '24px',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
            fontSize: '13px',
            color: '#fca5a5'
          }}>
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="form-group">
            <label>Incident Title</label>
            <input
              type="text"
              className="form-control"
              placeholder="e.g. Database Connection Timeout"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label>Severity Level</label>
            <select
              className="form-control"
              value={severity}
              onChange={(e) => setSeverity(e.target.value)}
            >
              <option value="High">🔴 High — Critical impact, immediate action required</option>
              <option value="Medium">🟡 Medium — Moderate impact, action needed soon</option>
              <option value="Low">🟢 Low — Minor impact, can be scheduled</option>
            </select>
          </div>

          <div className="form-group">
            <label>Detailed Description</label>
            <textarea
              className="form-control"
              rows="6"
              placeholder="Describe what is failing, error codes, impacted services, recent changes..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            ></textarea>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '32px' }}>
            <button type="submit" className="btn btn-primary" disabled={submitting}>
              <Send size={16} />
              {submitting ? 'Submitting...' : 'Submit & Analyze'}
            </button>
            <button
              type="button"
              className="btn btn-ghost"
              onClick={() => navigate('/')}
              disabled={submitting}
            >
              <ArrowLeft size={16} />
              Cancel
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NewIncident;
