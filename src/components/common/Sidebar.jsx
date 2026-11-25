import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Flame, ScanBarcode, UtensilsCrossed,
  Dumbbell, TrendingUp, User, LogOut, Sparkles,
  BookOpen, Calendar
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

  const navGroups = [
    {
      title: 'MAIN',
      links: [
        { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
        { to: '/running', label: 'Running Tracker', icon: Flame },
        { to: '/workouts', label: 'Workouts', icon: Dumbbell },
      ]
    },
    {
      title: 'NUTRITION',
      links: [
        { to: '/scanner', label: 'Food Scanner', icon: ScanBarcode },
        { to: '/nutrition', label: 'Nutrition Diary', icon: UtensilsCrossed },
      ]
    },
    {
      title: 'ANALYTICS',
      links: [
        { to: '/progress', label: 'Progress', icon: TrendingUp },
        { to: '/calendar', label: 'Activity Calendar', icon: Calendar },
        { to: '/exercises', label: 'Exercise Library', icon: BookOpen },
      ]
    },
    {
      title: 'ACCOUNT',
      links: [
        { to: '/profile', label: 'My Profile', icon: User },
      ]
    }
  ];

  return (
    <>
      {isOpen && (
        <div className="sidebar-backdrop mobile-only" onClick={onClose} aria-hidden="true" />
      )}

      <aside className={`app-sidebar ${isOpen ? 'sidebar-open' : ''}`}>
        <div className="sidebar-header">
          <div className="brand-logo-wrap">
            <div className="brand-icon">
              <Sparkles size={22} style={{ color: '#B7F34A' }} />
            </div>
            <div className="brand-text">
              <span className="brand-name">FitTrack</span>
              <span className="brand-sub">FITNESS COMPANION</span>
            </div>
          </div>
        </div>

        <nav className="sidebar-nav">
          {navGroups.map((group) => (
            <div key={group.title} className="nav-group">
              <div className="nav-group-title">{group.title}</div>
              <ul className="nav-list">
                {group.links.map((link) => {
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
            </div>
          ))}
        </nav>

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
