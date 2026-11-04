import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  Flame,
  ScanBarcode,
  UtensilsCrossed,
  Dumbbell,
  TrendingUp,
  User,
  LogOut,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../context/ToastContext';

export default function Sidebar({ isOpen, onClose }) {
  const { user, logout } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    showToast('You have been logged out safely.', 'info');
    navigate('/');
  };

  const navLinks = [
    { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { to: '/running', label: 'Running Tracker', icon: Flame },
    { to: '/scanner', label: 'Food Scanner', icon: ScanBarcode },
    { to: '/nutrition', label: 'Nutrition Diary', icon: UtensilsCrossed },
    { to: '/workouts', label: 'Workouts', icon: Dumbbell },
    { to: '/progress', label: 'Progress Tracking', icon: TrendingUp },
    { to: '/profile', label: 'My Profile', icon: User }
  ];

  return (
    <>
      {/* Backdrop for mobile */}
      {isOpen && (
        <div
          className="sidebar-backdrop mobile-only"
          onClick={onClose}
          aria-hidden="true"
        />
      )}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo-wrap">
            <div className="brand-icon">
              <Sparkles size={22} className="text-emerald-400" />
            </div>
            <div className="brand-text">
              <span className="brand-name">FitTrack</span>
              <span className="brand-sub">FITNESS COMPANION</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          <div className="nav-group-title">MAIN MENU</div>
          <ul className="nav-list">
            {navLinks.map((link) => {
              const Icon = link.icon;
              return (
                <li key={link.to}>
                  <NavLink
                    to={link.to}
                    onClick={onClose}
                    className={({ isActive }) =>
                      `nav-link ${isActive ? 'nav-link-active' : ''}`
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

        {/* User Mini Profile & Logout */}
        <div className="sidebar-footer">
          <div className="user-profile-badge">
            <div className="user-avatar">
              {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div className="user-info-text">
              <span className="user-name-title">{user?.name || 'Athlete'}</span>
              <span className="user-badge-role">{user?.fitnessGoal || 'FitTrack'}</span>
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="sidebar-logout-btn"
            title="Log out of FitTrack"
          >
            <LogOut size={18} />
            <span>Logout</span>
          </button>
        </div>
      </aside>
    </>
  );
}
