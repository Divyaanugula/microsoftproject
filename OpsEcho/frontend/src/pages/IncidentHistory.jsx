import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, ArrowUpRight, Plus, Download, CheckCircle2, RotateCcw, Trash2, X, AlertTriangle } from 'lucide-react';

const API_BASE = 'http://localhost:8000/api/incidents';

const IncidentHistory = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [severityFilter, setSeverityFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [toast, setToast] = useState(null);
  const [actionLoading, setActionLoading] = useState(null);

  const showToast = (type, message) => {
    setToast({ type, message });
    setTimeout(() => setToast(null), 3500);
  };

  const fetchIncidents = async () => {
    try {
      const res = await fetch(API_BASE);
      const data = await res.json();
      setIncidents(data);
    } catch (err) {
      console.error('Failed to fetch incidents:', err);
      showToast('error', 'Failed to load incidents from server');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchIncidents();
  }, []);

  const handleToggleStatus = async (inc) => {
    const isResolving = inc.status === 'Active';
    const endpoint = isResolving ? `${API_BASE}/${inc.id}/resolve` : `${API_BASE}/${inc.id}/reopen`;
    setActionLoading(inc.id);

    try {
      const res = await fetch(endpoint, { method: 'POST' });
      if (!res.ok) throw new Error('Status update failed');
      const data = await res.json();
      setIncidents(prev =>
        prev.map(i => (i.id === inc.id ? { ...i, status: data.status } : i))
      );
      showToast('success', `${inc.id} marked as ${data.status}`);
    } catch (err) {
      showToast('error', `Failed to update ${inc.id}: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const handleDelete = async (id, title) => {
    if (!window.confirm(`Are you sure you want to delete incident "${title}" (${id})?`)) return;
    setActionLoading(id);

    try {
      const res = await fetch(`${API_BASE}/${id}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Delete failed');
      setIncidents(prev => prev.filter(i => i.id !== id));
      showToast('success', `Incident ${id} deleted`);
    } catch (err) {
      showToast('error', `Failed to delete ${id}: ${err.message}`);
    } finally {
      setActionLoading(null);
    }
  };

  const exportCSV = () => {
    if (filtered.length === 0) {
      showToast('error', 'No incidents to export');
      return;
    }
    const headers = ['ID', 'Title', 'Severity', 'Status', 'Reported', 'Description'];
    const rows = filtered.map(i => [
      i.id,
      `"${(i.title || '').replace(/"/g, '""')}"`,
      i.severity,
      i.status,
      `"${i.time}"`,
      `"${(i.description || '').replace(/"/g, '""')}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `OpsEcho_Incidents_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast('success', `Exported ${filtered.length} incidents to CSV`);
  };

  const filtered = incidents
    .filter(inc => {
      const matchesStatus =
        filter === 'all' ||
        (filter === 'active' && inc.status === 'Active') ||
        (filter === 'resolved' && inc.status === 'Resolved');
      
      const matchesSeverity =
        severityFilter === 'all' ||
        inc.severity.toLowerCase() === severityFilter.toLowerCase();

      const matchesSearch =
        !search ||
        inc.title.toLowerCase().includes(search.toLowerCase()) ||
        inc.id.toLowerCase().includes(search.toLowerCase()) ||
        (inc.description && inc.description.toLowerCase().includes(search.toLowerCase()));

      return matchesStatus && matchesSeverity && matchesSearch;
    })
    .sort((a, b) => {
      if (sortBy === 'severity') {
        const order = { High: 3, Medium: 2, Low: 1 };
        return (order[b.severity] || 0) - (order[a.severity] || 0);
      }
      return 0; // Default order is newest first from API
    });

  const totalCount = incidents.length;
  const activeCount = incidents.filter(i => i.status === 'Active').length;
  const resolvedCount = incidents.filter(i => i.status === 'Resolved').length;

  return (
    <div>
      <div className="page-header">
        <div>
          <h1>Incident History</h1>
          <p>
            Showing {filtered.length} of {totalCount} incidents &bull;{' '}
            <span style={{ color: 'var(--accent-danger)' }}>{activeCount} active</span> &bull;{' '}
            <span style={{ color: 'var(--accent-success)' }}>{resolvedCount} resolved</span>
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={exportCSV} title="Export filtered incidents to CSV">
            <Download size={15} /> Export CSV
          </button>
          <Link to="/new-incident" className="btn btn-primary">
            <Plus size={16} /> Report Incident
          </Link>
        </div>
      </div>

      {/* Search & Filters Bar */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
        {/* Search */}
        <div style={{ position: 'relative', flex: '1', minWidth: '240px', maxWidth: '380px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }} />
          <input
            type="text"
            className="form-control"
            placeholder="Search title, ID, or description..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ paddingLeft: '36px', paddingRight: search ? '32px' : '14px' }}
          />
          {search && (
            <button
              onClick={() => setSearch('')}
              style={{
                position: 'absolute',
                right: '10px',
                top: '50%',
                transform: 'translateY(-50%)',
                background: 'transparent',
                border: 'none',
                color: 'var(--text-muted)',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center'
              }}
            >
              <X size={14} />
            </button>
          )}
        </div>

        {/* Status Filter */}
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {[
            { id: 'all', label: 'All Status' },
            { id: 'active', label: 'Active' },
            { id: 'resolved', label: 'Resolved' }
          ].map(f => (
            <button
              key={f.id}
              className={`filter-btn ${filter === f.id ? 'active' : ''}`}
              onClick={() => setFilter(f.id)}
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* Severity Filter */}
        <div className="filter-bar" style={{ marginBottom: 0 }}>
          {[
            { id: 'all', label: 'All Severity' },
            { id: 'high', label: 'High' },
            { id: 'medium', label: 'Medium' },
            { id: 'low', label: 'Low' }
          ].map(s => (
            <button
              key={s.id}
              className={`filter-btn ${severityFilter === s.id ? 'active' : ''}`}
              onClick={() => setSeverityFilter(s.id)}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Sort Selector */}
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="form-control"
          style={{ width: 'auto', padding: '7px 12px', fontSize: '12px' }}
        >
          <option value="newest">Sort: Recent First</option>
          <option value="severity">Sort: Highest Severity</option>
        </select>
      </div>

      {/* Table */}
      <div className="card">
        {loading ? (
          <div className="loading-spinner">
            <div className="spinner"></div>
            <span className="loading-text">Loading incidents...</span>
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state" style={{ padding: '48px' }}>
            <Filter size={36} />
            <h3>No incidents found</h3>
            <p>Try adjusting your search query or filter selection.</p>
            {(search || filter !== 'all' || severityFilter !== 'all') && (
              <button
                className="btn btn-ghost"
                style={{ marginTop: '12px' }}
                onClick={() => {
                  setSearch('');
                  setFilter('all');
                  setSeverityFilter('all');
                }}
              >
                Clear Filters
              </button>
            )}
          </div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Title</th>
                <th>Severity</th>
                <th>Status</th>
                <th>Reported</th>
                <th style={{ textAlign: 'right' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(inc => {
                const isWorking = actionLoading === inc.id;
                return (
                  <tr key={inc.id}>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px', fontWeight: 600 }}>
                      <Link to={`/incidents/${inc.id}`} style={{ color: 'inherit', textDecoration: 'none' }}>
                        {inc.id}
                      </Link>
                    </td>
                    <td>
                      <Link
                        to={`/incidents/${inc.id}`}
                        style={{
                          fontWeight: 500,
                          color: 'var(--text-primary)',
                          textDecoration: 'none',
                          display: 'block'
                        }}
                      >
                        {inc.title}
                      </Link>
                      {inc.description && (
                        <div
                          style={{
                            fontSize: '11px',
                            color: 'var(--text-muted)',
                            marginTop: '2px',
                            maxWidth: '440px',
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis'
                          }}
                        >
                          {inc.description}
                        </div>
                      )}
                    </td>
                    <td>
                      <span className={`badge badge-${inc.severity.toLowerCase()}`}>
                        {inc.severity}
                      </span>
                    </td>
                    <td>
                      <span className={`badge badge-${inc.status.toLowerCase()}`}>
                        {inc.status}
                      </span>
                    </td>
                    <td style={{ color: 'var(--text-muted)', fontSize: '12px', whiteSpace: 'nowrap' }}>
                      {inc.time}
                    </td>
                    <td>
                      <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end', alignItems: 'center' }}>
                        {/* Quick resolve / reopen toggle */}
                        <button
                          className={`btn ${inc.status === 'Active' ? 'btn-ghost' : 'btn-ghost'}`}
                          style={{
                            padding: '4px 8px',
                            fontSize: '11px',
                            color: inc.status === 'Active' ? 'var(--accent-success)' : 'var(--text-muted)'
                          }}
                          onClick={() => handleToggleStatus(inc)}
                          disabled={isWorking}
                          title={inc.status === 'Active' ? 'Mark as Resolved' : 'Reopen Incident'}
                        >
                          {inc.status === 'Active' ? (
                            <>
                              <CheckCircle2 size={13} /> Resolve
                            </>
                          ) : (
                            <>
                              <RotateCcw size={13} /> Reopen
                            </>
                          )}
                        </button>

                        {/* View Details */}
                        <Link
                          to={`/incidents/${inc.id}`}
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '11px' }}
                          title="View Details & AI Analysis"
                        >
                          View <ArrowUpRight size={13} />
                        </Link>

                        {/* Delete */}
                        <button
                          className="btn btn-ghost"
                          style={{ padding: '4px 8px', fontSize: '11px', color: 'var(--accent-danger)' }}
                          onClick={() => handleDelete(inc.id, inc.title)}
                          disabled={isWorking}
                          title="Delete Incident"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Floating Toast Notification */}
      {toast && (
        <div className={`toast toast-${toast.type}`}>
          {toast.type === 'success' ? <CheckCircle2 size={16} /> : <AlertTriangle size={16} />}
          {toast.message}
        </div>
      )}
    </div>
  );
};

export default IncidentHistory;
