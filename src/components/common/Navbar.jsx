import React from 'react';
import { Menu, Play, Plus, User, ShieldCheck } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

export default function Navbar({ onToggleSidebar, title = 'Dashboard' }) {
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
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

        {/* Demo Mode / University Project indicator */}
        <div className="demo-indicator hide-on-mobile" title="Data is saved safely in your browser Local Storage">
          <ShieldCheck size={14} className="text-emerald-400" />
          <span>Local Storage Active</span>
        </div>

        {/* User profile link */}
        <Link to="/profile" className="navbar-user-btn" title="View Profile">
          <div className="navbar-avatar">
            {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
          </div>
          <span className="navbar-user-name hide-on-mobile">
            {user?.name ? user.name.split(' ')[0] : 'User'}
          </span>
        </Link>
      </div>
    </header>
  );
}
