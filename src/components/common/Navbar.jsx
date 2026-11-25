import React, { useState, useEffect } from 'react';
import { Menu, Play, Plus, Bell, Sun, Moon } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationPanel, { useNotifications } from './NotificationPanel';

export default function Navbar({ onToggleSidebar, title = 'Dashboard' }) {
  const { user } = useAuth();
  const [notifOpen, setNotifOpen] = useState(false);
  const [theme, setTheme] = useState(() => localStorage.getItem('fittrack_theme') || 'dark');
  const { notifications, unreadCount, markRead, markAllRead, dismiss } = useNotifications(user);

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('fittrack_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'));
  };

  return (
    <>
      <header className="app-navbar">
        <div className="navbar-left">
          <button
            onClick={onToggleSidebar}
            className="mobile-menu-btn"
            aria-label="Toggle navigation menu"
          >
            <Menu size={22} />
          </button>
          <h1 className="navbar-page-title">{title}</h1>
        </div>

        <div className="navbar-right">
          {/* Quick action buttons */}
          <Link to="/running" className="nav-action-btn btn-run-quick">
            <Play size={15} fill="currentColor" />
            <span className="hide-on-mobile">Start Run</span>
          </Link>

          <Link to="/nutrition" className="nav-action-btn btn-food-quick">
            <Plus size={15} />
            <span className="hide-on-mobile">Add Meal</span>
          </Link>

          {/* Theme toggle */}
          <button
            type="button"
            onClick={toggleTheme}
            className="nav-icon-btn"
            title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            aria-label="Toggle color theme"
          >
            {theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />}
          </button>

          {/* Notifications Bell */}
          <button
            type="button"
            onClick={() => setNotifOpen(true)}
            className="nav-icon-btn nav-notif-btn"
            title="Notifications"
            aria-label="Open notifications"
          >
            <Bell size={18} />
            {unreadCount > 0 && <span className="nav-notif-badge">{unreadCount}</span>}
          </button>

          {/* User profile link */}
          <Link to="/profile" className="navbar-user-btn" title="View Profile">
            <div className="navbar-avatar">
              {user?.avatar ? (
                <img src={user.avatar} alt={user.name} className="avatar-img" />
              ) : (
                user?.name ? user.name.charAt(0).toUpperCase() : 'U'
              )}
            </div>
            <span className="navbar-user-name hide-on-mobile">
              {user?.name ? user.name.split(' ')[0] : 'User'}
            </span>
          </Link>
        </div>
      </header>

      <NotificationPanel
        isOpen={notifOpen}
        onClose={() => setNotifOpen(false)}
        notifications={notifications}
        onMarkRead={markRead}
        onMarkAllRead={markAllRead}
        onDismiss={dismiss}
      />
    </>
  );
}
