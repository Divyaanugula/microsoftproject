import { useState } from 'react';
import { Settings as SettingsIcon, Key, Bell, Brain, Globe, Shield } from 'lucide-react';

const SettingsPage = () => {
  const [aiEnabled, setAiEnabled] = useState(true);
  const [autoAnalysis, setAutoAnalysis] = useState(false);
  const [notifications, setNotifications] = useState(true);
  const [autoPostMortem, setAutoPostMortem] = useState(true);

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Settings</h1>
          <p>Configure OpsEcho to match your workflow.</p>
        </div>
      </div>

      <div style={{ maxWidth: '720px' }}>
        {/* AI Configuration */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="settings-section">
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Brain size={20} color="var(--accent-purple)" />
              AI Configuration
            </h2>
            <div className="settings-row">
              <div className="setting-info">
                <h4>AI Analysis</h4>
                <p>Enable Groq AI-powered incident analysis</p>
              </div>
              <button
                className={`toggle ${aiEnabled ? 'active' : ''}`}
                onClick={() => setAiEnabled(!aiEnabled)}
              />
            </div>
            <div className="settings-row">
              <div className="setting-info">
                <h4>Auto-Analyze on Create</h4>
                <p>Automatically run AI analysis when a new incident is reported</p>
              </div>
              <button
                className={`toggle ${autoAnalysis ? 'active' : ''}`}
                onClick={() => setAutoAnalysis(!autoAnalysis)}
              />
            </div>
            <div className="settings-row">
              <div className="setting-info">
                <h4>Auto Post-Mortem</h4>
                <p>Automatically generate post-mortem reports on resolution</p>
              </div>
              <button
                className={`toggle ${autoPostMortem ? 'active' : ''}`}
                onClick={() => setAutoPostMortem(!autoPostMortem)}
              />
            </div>
          </div>
        </div>

        {/* API Key */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="settings-section" style={{ marginBottom: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Key size={20} color="var(--accent-warning)" />
              API Keys
            </h2>
            <div className="settings-row">
              <div className="setting-info" style={{ flex: 1 }}>
                <h4>Groq API Key</h4>
                <p>Used for AI-powered incident analysis</p>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <input
                  type="password"
                  className="form-control"
                  style={{ width: '240px' }}
                  placeholder="gsk_..."
                  defaultValue="configured-in-backend"
                  disabled
                />
              </div>
            </div>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '8px' }}>
              API key is configured via the backend .env file for security.
            </p>
          </div>
        </div>

        {/* Notifications */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="settings-section" style={{ marginBottom: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Bell size={20} color="var(--accent-blue)" />
              Notifications
            </h2>
            <div className="settings-row">
              <div className="setting-info">
                <h4>Browser Notifications</h4>
                <p>Get notified about new incidents and resolution updates</p>
              </div>
              <button
                className={`toggle ${notifications ? 'active' : ''}`}
                onClick={() => setNotifications(!notifications)}
              />
            </div>
          </div>
        </div>

        {/* System & Connection Status */}
        <div className="card" style={{ padding: '24px', marginBottom: '16px' }}>
          <div className="settings-section" style={{ marginBottom: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Shield size={20} color="var(--accent-success)" />
              System Diagnostics
            </h2>
            <div style={{ marginTop: '12px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>Backend Service API</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>http://localhost:8000</div>
                </div>
                <button
                  className="btn btn-ghost"
                  style={{ fontSize: '12px', padding: '4px 12px' }}
                  onClick={async () => {
                    try {
                      const start = performance.now();
                      const res = await fetch('http://localhost:8000/api/health');
                      const latency = Math.round(performance.now() - start);
                      if (res.ok) {
                        alert(`Backend is connected and healthy! Latency: ${latency}ms`);
                      } else {
                        alert(`Backend returned status ${res.status}`);
                      }
                    } catch (e) {
                      alert(`Cannot connect to backend: ${e.message}`);
                    }
                  }}
                >
                  Test Connection
                </button>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px' }}>
                <div>
                  <div style={{ fontSize: '13px', fontWeight: 500 }}>AI Inference Engine</div>
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Groq LLaMA 3.3 / OpsEcho Intelligent Fallback</div>
                </div>
                <span className="badge badge-resolved" style={{ fontSize: '11px' }}>
                  Operational
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* About */}
        <div className="card" style={{ padding: '24px' }}>
          <div className="settings-section" style={{ marginBottom: 0 }}>
            <h2 style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <Globe size={20} color="var(--accent-cyan)" />
              About
            </h2>
            <div style={{ marginTop: '12px' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>
                <strong style={{ color: 'var(--text-primary)' }}>OpsEcho</strong> v1.0.0
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '8px' }}>
                AI-powered incident post-mortem and on-call management platform.
                Built with React, FastAPI, and Groq AI.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SettingsPage;
