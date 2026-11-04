import React from 'react';
import { Menu, ShieldCheck, Database, RefreshCw } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminNavbar({ onToggleSidebar, title = 'Administration' }) {
  const { user } = useAuth();
  const { showToast } = useToast();

  const handleRefresh = () => {
    showToast('Admin data refreshed from local storage.', 'info');
    window.dispatchEvent(new Event('fittrack_admin_refresh'));
  };

  return (
    <header className="app-navbar admin-navbar">
      <div className="navbar-left">
        <button
          onClick={onToggleSidebar}
          className="mobile-menu-btn"
          aria-label="Toggle navigation menu"
        >
          <Menu size={22} />
        </button>
        <div className="admin-title-wrap">
          <h1 className="navbar-page-title">{title}</h1>
          <span className="admin-status-badge">SUPERUSER ACCESS</span>
        </div>
      </div>

      <div className="navbar-right">
        <button
          onClick={handleRefresh}
          className="admin-refresh-btn"
          title="Refresh application data"
        >
          <RefreshCw size={15} />
          <span className="hide-on-mobile">Sync Data</span>
        </button>

        <div className="admin-storage-info hide-on-mobile">
          <Database size={15} className="text-amber-400" />
          <span>Storage: LocalStorage DB</span>
        </div>

        <div className="admin-user-pill">
          <ShieldCheck size={16} className="text-amber-400" />
          <span>admin@fittrack.app</span>
        </div>
      </div>
    </header>
  );
}
