import { useState, useEffect } from 'react';
import { Database, Lightbulb, Tag, Calendar, BookOpen, Plus, Trash2, Search, X, Check, Copy } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/incidents';

const Memory = () => {
  const [learnings, setLearnings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState('All');
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newCategory, setNewCategory] = useState('Infrastructure');
  const [newInsight, setNewInsight] = useState('');
  const [newIncidentId, setNewIncidentId] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3000);
  };

  const fetchLearnings = async () => {
    try {
      const res = await fetch(`${API_BASE}/learnings`);
      const data = await res.json();
      setLearnings(data);
    } catch (err) {
      console.error('Failed to fetch learnings:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLearnings();
  }, []);

  const handleAddLearning = async (e) => {
    e.preventDefault();
    if (!newInsight.trim()) return;
    setSubmitting(true);

    try {
      const res = await fetch(`${API_BASE}/learnings`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          category: newCategory,
          insight: newInsight.trim(),
          incident_id: newIncidentId.trim() || 'GENERAL'
        })
      });

      if (!res.ok) throw new Error('Failed to save learning');
      const item = await res.json();
      setLearnings(prev => [item, ...prev]);
      setShowAddModal(false);
      setNewInsight('');
      setNewIncidentId('');
      showToast('success', 'New operational learning recorded!');
    } catch (err) {
      showToast('error', err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Delete this operational learning?')) return;
    try {
      const res = await fetch(`${API_BASE}/learnings/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setLearnings(prev => prev.filter(l => l.id !== id));
      showToast('success', 'Learning deleted');
    } catch (err) {
      showToast('error', err.message);
    }
  };

  const categoryColors = {
    'Memory Management': { bg: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', border: 'rgba(239, 68, 68, 0.2)' },
    'CI/CD': { bg: 'rgba(59, 130, 246, 0.1)', color: '#93c5fd', border: 'rgba(59, 130, 246, 0.2)' },
    'Performance': { bg: 'rgba(245, 158, 11, 0.1)', color: '#fcd34d', border: 'rgba(245, 158, 11, 0.2)' },
    'Security': { bg: 'rgba(139, 92, 246, 0.1)', color: '#c4b5fd', border: 'rgba(139, 92, 246, 0.2)' },
    'Infrastructure': { bg: 'rgba(16, 185, 129, 0.1)', color: '#6ee7b7', border: 'rgba(16, 185, 129, 0.2)' },
  };

  const getCategoryStyle = (category) => {
    return categoryColors[category] || { bg: 'var(--accent-blue-glow)', color: 'var(--accent-blue)', border: 'rgba(59, 130, 246, 0.2)' };
  };

  const categories = ['All', 'Memory Management', 'CI/CD', 'Performance', 'Infrastructure', 'Security'];

  const filtered = learnings.filter(item => {
    const matchCat = activeCategory === 'All' || item.category === activeCategory;
    const matchSearch = !search ||
      item.insight.toLowerCase().includes(search.toLowerCase()) ||
      item.category.toLowerCase().includes(search.toLowerCase()) ||
      item.incident_id.toLowerCase().includes(search.toLowerCase());
    return matchCat && matchSearch;
  });

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Memory & Learnings</h1>
          <p>Knowledge base built from resolved incidents. Your team's operational intelligence.</p>
        </div>
        <button className="btn btn-primary" onClick={() => setShowAddModal(true)}>
          <Plus size={16} /> Add Insight
        </button>
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '24px' }}>
        <div className="stat-card">
          <div className="stat-icon purple"><Database size={20} /></div>
          <div className="stat-content">
            <h3>Total Learnings</h3>
            <p>{loading ? '—' : learnings.length}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><BookOpen size={20} /></div>
          <div className="stat-content">
            <h3>Categories</h3>
            <p>{loading ? '—' : new Set(learnings.map(l => l.category)).size}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><Lightbulb size={20} /></div>
          <div className="stat-content">
            <h3>Active Insights</h3>
            <p>{loading ? '—' : filtered.length}</p>
          </div>
        </div>
      </div>

      {/* Search and Filters */}
      <div style={{ display: 'flex', gap: '14px', marginBottom: '20px', flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '220px', maxWidth: '360px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search insights..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px' }}
          />
        </div>
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {categories.map(cat => (
            <button
              key={cat}
              className={`filter-btn ${activeCategory === cat ? 'active' : ''}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="loading-spinner">
          <div className="spinner"></div>
          <span className="loading-text">Loading knowledge base...</span>
        </div>
      ) : filtered.length === 0 ? (
        <div className="card empty-state">
          <Database size={48} />
          <h3>No learnings found</h3>
          <p>Try adjusting your search filter or add a new operational learning.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {filtered.map(learning => {
            const catStyle = getCategoryStyle(learning.category);
            return (
              <div key={learning.id} className="learning-card">
                <div className="learning-icon">
                  <Lightbulb size={18} />
                </div>
                <div className="learning-content" style={{ flex: 1 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '6px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px',
                        padding: '3px 10px',
                        borderRadius: '12px',
                        background: catStyle.bg,
                        color: catStyle.color,
                        border: `1px solid ${catStyle.border}`,
                        fontWeight: 600
                      }}>
                        {learning.category}
                      </span>
                      <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>
                        {learning.id}
                      </span>
                    </div>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '3px 8px', fontSize: '11px' }}
                        title="Copy Insight"
                        onClick={() => {
                          navigator.clipboard.writeText(learning.insight);
                          showToast('success', 'Insight copied to clipboard!');
                        }}
                      >
                        <Copy size={12} />
                      </button>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '3px 8px', fontSize: '11px', color: 'var(--accent-danger)' }}
                        title="Delete Learning"
                        onClick={() => handleDelete(learning.id)}
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>
                  <p style={{ fontSize: '14px', lineHeight: '1.6', color: 'var(--text-primary)', margin: '6px 0 10px' }}>
                    {learning.insight}
                  </p>
                  <div className="learning-meta">
                    <span><Tag size={11} /> {learning.incident_id}</span>
                    <span><Calendar size={11} /> {learning.created_at}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Add Insight Modal */}
      {showAddModal && (
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0,0,0,0.7)',
          backdropFilter: 'blur(4px)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '16px'
        }}>
          <div className="card" style={{ width: '100%', maxWidth: '520px', padding: '28px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ fontSize: '18px', fontWeight: 600, margin: 0 }}>Add Operational Learning</h2>
              <button
                onClick={() => setShowAddModal(false)}
                style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}
              >
                <X size={18} />
              </button>
            </div>

            <form onSubmit={handleAddLearning}>
              <div className="form-group">
                <label>Category</label>
                <select
                  className="form-control"
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                >
                  <option value="Infrastructure">Infrastructure</option>
                  <option value="Memory Management">Memory Management</option>
                  <option value="Performance">Performance</option>
                  <option value="CI/CD">CI/CD</option>
                  <option value="Security">Security</option>
                  <option value="Database">Database</option>
                </select>
              </div>

              <div className="form-group">
                <label>Related Incident ID (Optional)</label>
                <input
                  type="text"
                  className="form-control"
                  placeholder="e.g. INC-001 (or leave blank)"
                  value={newIncidentId}
                  onChange={(e) => setNewIncidentId(e.target.value)}
                />
              </div>

              <div className="form-group">
                <label>Key Insight / Rule of Thumb</label>
                <textarea
                  className="form-control"
                  rows="4"
                  placeholder="e.g. Always set aggressive TCP keepalive timeouts on pooled Redis connections..."
                  value={newInsight}
                  onChange={(e) => setNewInsight(e.target.value)}
                  required
                ></textarea>
              </div>

              <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '24px' }}>
                <button
                  type="button"
                  className="btn btn-ghost"
                  onClick={() => setShowAddModal(false)}
                  disabled={submitting}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary" disabled={submitting}>
                  {submitting ? 'Saving...' : 'Save Learning'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Floating Toast */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <Check size={16} /> : <X size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default Memory;
