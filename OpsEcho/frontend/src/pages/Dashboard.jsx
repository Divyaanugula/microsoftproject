import { useState, useEffect, useRef } from 'react';
import { Link } from 'react-router-dom';
import { Bell, CheckCircle2, CircleDot, Brain, Plus, Check, ArrowRight, TrendingUp, Zap, RefreshCw, Activity, Clock, AlertOctagon } from 'lucide-react';
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const API_BASE = 'http://localhost:8000/api/incidents';

const chartData = [
  { name: 'Mon', Total: 4, Resolved: 3 },
  { name: 'Tue', Total: 3, Resolved: 2 },
  { name: 'Wed', Total: 2, Resolved: 2 },
  { name: 'Thu', Total: 5, Resolved: 4 },
  { name: 'Fri', Total: 3, Resolved: 3 },
  { name: 'Sat', Total: 4, Resolved: 4 },
  { name: 'Sun', Total: 6, Resolved: 5 },
];

// Animated number counter hook
const AnimatedNumber = ({ value, duration = 800 }) => {
  const [display, setDisplay] = useState(0);
  const startRef = useRef(0);
  const startTimeRef = useRef(null);
  useEffect(() => {
    if (value === null || value === undefined) return;
    const target = parseFloat(value);
    const startVal = startRef.current;
    startTimeRef.current = null;
    const step = (ts) => {
      if (!startTimeRef.current) startTimeRef.current = ts;
      const progress = Math.min((ts - startTimeRef.current) / duration, 1);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(startVal + (target - startVal) * eased));
      if (progress < 1) requestAnimationFrame(step);
      else startRef.current = target;
    };
    requestAnimationFrame(step);
  }, [value, duration]);
  return <>{display}</>;
};

const Dashboard = () => {
  const [stats, setStats] = useState(null);
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);

  const fetchData = async (silent = false) => {
    if (!silent) setLoading(true);
    else setRefreshing(true);
    try {
      const [statsRes, incidentsRes] = await Promise.all([
        fetch(`${API_BASE}/stats`),
        fetch(API_BASE),
      ]);
      setStats(await statsRes.json());
      setIncidents(await incidentsRes.json());
      setLastUpdated(new Date());
    } catch (err) {
      console.error('Failed to fetch dashboard data:', err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchData();
    const interval = setInterval(() => fetchData(true), 30000);
    return () => clearInterval(interval);
  }, []);

  const activeIncidents = incidents.filter(i => i.status === 'Active');
  const recentIncidents = incidents.slice(0, 5);
  const pieData = stats
    ? [
        { name: 'Active', value: stats.active, color: '#3b82f6' },
        { name: 'Resolved', value: stats.resolved, color: '#10b981' },
      ]
    : [];

  return (
    <div className="dashboard">
      <div className="page-header">
        <div>
          <h1>Dashboard</h1>
          <p style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            Monitor incidents, get AI insights, and learn from past experiences.
            {lastUpdated && (
              <span style={{ fontSize: '11px', color: 'var(--text-muted)', marginLeft: '6px', display: 'flex', alignItems: 'center', gap: '3px' }}>
                <Clock size={11} />
                Updated {lastUpdated.toLocaleTimeString()}
              </span>
            )}
          </p>
        </div>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button className="btn btn-ghost" onClick={() => fetchData(true)} disabled={refreshing} style={{ padding: '9px 14px' }}>
            <RefreshCw size={15} style={{ animation: refreshing ? 'spin 0.8s linear infinite' : 'none' }} />
            {refreshing ? 'Refreshing...' : 'Refresh'}
          </button>
          <Link to="/new-incident" className="btn btn-primary" style={{ padding: '10px 18px' }}>
            <Plus size={18} /> Report Incident
          </Link>
        </div>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon red"><Bell size={22} /></div>
          <div className="stat-content">
            <h3>Total Incidents</h3>
            <p>{loading ? '—' : <AnimatedNumber value={stats?.total || 0} />}<span className="up">↑ 2 this week</span></p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon green"><CheckCircle2 size={22} /></div>
          <div className="stat-content">
            <h3>Resolved</h3>
            <p>{loading ? '—' : <AnimatedNumber value={stats?.resolved || 0} />}<span className="down">{stats?.resolution_rate || 0}% rate</span></p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon orange"><CircleDot size={22} /></div>
          <div className="stat-content">
            <h3>Active Now</h3>
            <p>{loading ? '—' : <AnimatedNumber value={stats?.active || 0} />}<span className="neutral">Needs attention</span></p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon purple"><Brain size={22} /></div>
          <div className="stat-content">
            <h3>Avg. Resolution</h3>
            <p>{loading ? '—' : <><AnimatedNumber value={stats?.avg_resolution_hours || 0} />h</>}<span className="down">↓ 40% faster</span></p>
          </div>
        </div>
      </div>

      <div className="dashboard-layout">
        {/* Trend Chart */}
        <div className="card">
          <div className="card-title">
            <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <TrendingUp size={16} color="var(--accent-blue)" /> Incident Trends
            </span>
            <select style={{ background: 'var(--bg-surface)', color: 'var(--text-secondary)', border: '1px solid var(--border-color)', padding: '5px 10px', borderRadius: '6px', fontSize: '11px', fontFamily: 'inherit' }}>
              <option>Last 7 days</option>
            </select>
          </div>
          <div style={{ height: '195px', marginTop: '12px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="gradBlue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradGreen" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                <XAxis dataKey="name" stroke="#5a6a80" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#5a6a80" fontSize={11} tickLine={false} axisLine={false} />
                <Tooltip contentStyle={{ backgroundColor: '#1e293b', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', fontSize: '12px', boxShadow: '0 8px 32px rgba(0,0,0,0.4)' }} />
                <Area type="monotone" dataKey="Total" stroke="#3b82f6" strokeWidth={2} fill="url(#gradBlue)" dot={{ r: 3, fill: '#3b82f6' }} />
                <Area type="monotone" dataKey="Resolved" stroke="#10b981" strokeWidth={2} fill="url(#gradGreen)" dot={{ r: 3, fill: '#10b981' }} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <div style={{ display: 'flex', gap: '20px', marginTop: '10px', justifyContent: 'center' }}>
            {[{ color: '#3b82f6', label: 'Total' }, { color: '#10b981', label: 'Resolved' }].map(l => (
              <span key={l.label} style={{ fontSize: '11px', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '6px' }}>
                <span style={{ width: '12px', height: '2px', background: l.color, display: 'inline-block', borderRadius: '1px' }}></span>
                {l.label}
              </span>
            ))}
          </div>
        </div>

        {/* Recent Incidents */}
        <div className="card">
          <div className="card-title">
            Recent Incidents
            <Link to="/history" style={{ fontSize: '12px', color: 'var(--accent-blue)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px' }}>
              View All <ArrowRight size={14} />
            </Link>
          </div>
          {loading ? (
            <div className="loading-spinner" style={{ padding: '24px' }}>
              <div className="spinner"></div>
              <span className="loading-text">Loading incidents...</span>
            </div>
          ) : (
            <table className="table">
              <thead>
                <tr><th>ID</th><th>Title</th><th>Severity</th><th>Status</th></tr>
              </thead>
              <tbody>
                {recentIncidents.map(inc => (
                  <tr key={inc.id}>
                    <td><Link to={`/incidents/${inc.id}`} style={{ color: 'var(--text-muted)', textDecoration: 'none', fontSize: '12px' }}>{inc.id}</Link></td>
                    <td><Link to={`/incidents/${inc.id}`}>{inc.title}</Link></td>
                    <td><span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span></td>
                    <td><span className={`badge badge-${inc.status.toLowerCase()}`}>{inc.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Right column */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Active Alerts panel */}
          {!loading && activeIncidents.length > 0 && (
            <div className="card" style={{ borderColor: 'rgba(239,68,68,0.2)', background: 'linear-gradient(135deg,rgba(239,68,68,0.05),rgba(245,158,11,0.03))' }}>
              <div className="card-title" style={{ color: '#fca5a5' }}>
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <AlertOctagon size={16} color="#ef4444" /> Active Alerts
                </span>
                <span style={{ fontSize: '11px', background: 'rgba(239,68,68,0.15)', color: '#fca5a5', padding: '2px 8px', borderRadius: '10px', border: '1px solid rgba(239,68,68,0.2)' }}>
                  {activeIncidents.length} open
                </span>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {activeIncidents.slice(0, 4).map(inc => (
                  <div key={inc.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 12px', background: 'rgba(0,0,0,0.2)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                    <Link to={`/incidents/${inc.id}`} style={{ textDecoration: 'none', flex: 1, marginRight: '10px' }}>
                      <div style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-primary)', marginBottom: '2px' }}>{inc.title}</div>
                      <div style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{inc.id} &bull; {inc.time}</div>
                    </Link>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span className={`badge badge-${inc.severity.toLowerCase()}`}>{inc.severity}</span>
                      <button
                        className="btn btn-ghost"
                        style={{ padding: '4px 6px', color: 'var(--accent-success)' }}
                        title="Quick Resolve"
                        onClick={async (e) => {
                          e.stopPropagation();
                          try {
                            await fetch(`${API_BASE}/${inc.id}/resolve`, { method: 'POST' });
                            fetchData(true);
                          } catch (err) {
                            console.error(err);
                          }
                        }}
                      >
                        <Check size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Donut chart */}
          {!loading && stats && (
            <div className="card">
              <div className="card-title">
                <span style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <Activity size={16} color="var(--accent-purple)" /> Status Overview
                </span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                <div style={{ width: '90px', height: '90px', flexShrink: 0 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={pieData} cx="50%" cy="50%" innerRadius={26} outerRadius={42} paddingAngle={3} dataKey="value" strokeWidth={0}>
                        {pieData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                      </Pie>
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div style={{ flex: 1 }}>
                  {pieData.map(entry => (
                    <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '12px', color: 'var(--text-secondary)' }}>
                        <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: entry.color, flexShrink: 0 }}></span>
                        {entry.name}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'white' }}>{entry.value}</span>
                    </div>
                  ))}
                  <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>{stats.resolution_rate}% resolution rate</div>
                </div>
              </div>
            </div>
          )}

          {/* AI features */}
          <div className="card">
            <div style={{ display: 'flex', gap: '14px', marginBottom: '16px' }}>
              <div className="stat-icon purple" style={{ width: '40px', height: '40px', borderRadius: '10px' }}><Zap size={18} /></div>
              <div>
                <h3 style={{ fontSize: '14px', fontWeight: 600, color: 'white' }}>AI-Powered Intelligence</h3>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '3px' }}>Analyze, learn, and resolve faster.</p>
              </div>
            </div>
            <ul className="ai-feature-list">
              <li><Check size={15} /> Root cause analysis with Groq AI</li>
              <li><Check size={15} /> Solution suggestions from past data</li>
              <li><Check size={15} /> Auto-generated post-mortem reports</li>
              <li><Check size={15} /> Track resolution success rates</li>
              <li><Check size={15} /> Build organizational knowledge base</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;

