import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  ShieldAlert,
  Users,
  Activity,
  LogOut,
  Database,
  BarChart3
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function AdminSidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('Administrator logged out.', 'info');
    navigate('/');
  };

  const adminLinks = [
    { to: '/admin/dashboard', label: 'Admin Dashboard', icon: BarChart3 },
    { to: '/admin/users', label: 'User Management', icon: Users },
    { to: '/admin/activities', label: 'Activity Logs', icon: Activity }
  ];

  return (
    <>
      {isOpen && (
        <div
          className="sidebar-backdrop mobile-only"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`admin-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header admin-header-badge">
          <div className="brand-logo-wrap">
            <div className="admin-brand-icon">
              <ShieldAlert size={22} className="text-amber-400" />
            </div>
            <div className="brand-text">
              <span className="brand-name">FitTrack</span>
              <span className="admin-badge-tag">ADMIN CONSOLE</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-title">ADMINISTRATION</div>
          <ul className="nav-list">
            {adminLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `admin-nav-link ${isActive ? 'admin-nav-link-active' : ''}`
                    }
                  >
                    <Icon size={19} className="nav-icon" />
                    <span className="nav-label">{link.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </nav>

        <div className="sidebar-footer admin-footer">
          <div className="admin-profile-pill">
            <div className="admin-avatar">A</div>
            <div className="user-info-text">
              <span className="user-name-title">System Admin</span>
              <span className="admin-role-label">Root Administrator</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="admin-logout-btn"
            title="Log out from Admin Console"
          >
            <LogOut size={18} />
            <span>Admin Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
