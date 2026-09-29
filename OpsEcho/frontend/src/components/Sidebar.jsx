import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, History, FileText, Database, Settings, Activity } from 'lucide-react';

const Sidebar = () => {
  const location = useLocation();

  const isActive = (path) => {
    if (path === '/') return location.pathname === '/';
    return location.pathname.startsWith(path);
  };

  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <div className="logo-icon">
          <Activity size={20} color="#fff" />
        </div>
        <div>
          OpsEcho
          <span>Incident Intelligence</span>
        </div>
      </div>

      <nav className="sidebar-nav">
        <div className="nav-section-label">Overview</div>
        <Link to="/" className={`nav-item ${isActive('/') ? 'active' : ''}`}>
          <LayoutDashboard size={18} />
          Dashboard
        </Link>
        <Link to="/new-incident" className={`nav-item ${isActive('/new-incident') ? 'active' : ''}`}>
          <PlusCircle size={18} />
          New Incident
        </Link>

        <div className="nav-section-label">Intelligence</div>
        <Link to="/history" className={`nav-item ${isActive('/history') ? 'active' : ''}`}>
          <History size={18} />
          Incident History
        </Link>
        <Link to="/post-mortem" className={`nav-item ${isActive('/post-mortem') ? 'active' : ''}`}>
          <FileText size={18} />
          Post-Mortem Reports
        </Link>
        <Link to="/memory" className={`nav-item ${isActive('/memory') ? 'active' : ''}`}>
          <Database size={18} />
          Memory & Learnings
        </Link>
      </nav>

      <div className="sidebar-footer">
        <Link to="/settings" className={`nav-item ${isActive('/settings') ? 'active' : ''}`}>
          <Settings size={18} />
          Settings
        </Link>
      </div>
    </aside>
  );
};

export default Sidebar;
