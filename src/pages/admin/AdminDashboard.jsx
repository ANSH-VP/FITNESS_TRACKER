import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Users,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  ShieldCheck,
  Activity,
  ArrowRight,
  Database,
  BarChart3,
  Calendar,
  Sparkles
} from 'lucide-react';
import { getAdminStats } from '../../services/storageService';
import StatCard from '../../components/common/StatCard';
import { formatFriendlyDate } from '../../utils/calculations';

export default function AdminDashboard() {
  const [stats, setStats] = useState(null);

  const loadStats = () => {
    setStats(getAdminStats());
  };

  useEffect(() => {
    loadStats();
    window.addEventListener('fittrack_admin_refresh', loadStats);
    return () => window.removeEventListener('fittrack_admin_refresh', loadStats);
  }, []);

  if (!stats) return null;

  return (
    <div className="admin-dashboard-page">
      {/* Admin Hero Banner */}
      <div className="admin-banner-card">
        <div className="admin-banner-content">
          <div className="admin-badge-pill">
            <ShieldCheck size={16} className="text-amber-400" />
            <span>CENTRAL SYSTEM ADMINISTRATION</span>
          </div>
          <h2 className="admin-title">FitTrack System Overview</h2>
          <p className="admin-subtitle">
            Global metrics, registered athlete accounts, and system-wide activity telemetries across all user data partitions.
          </p>
        </div>

        <div className="admin-quick-links">
          <Link to="/admin/users" className="btn btn-secondary">
            <Users size={16} />
            <span>Manage Users</span>
          </Link>
          <Link to="/admin/activities" className="btn btn-outline">
            <Activity size={16} />
            <span>View All Activities</span>
          </Link>
        </div>
      </div>

      {/* Aggregate Application Statistics Grid */}
      <div className="admin-stats-grid">
        <StatCard
          title="Registered Athletes"
          value={stats.totalUsers}
          unit="users"
          icon={Users}
          accent="amber"
          subtitle="Non-admin user accounts"
        />
        <StatCard
          title="GPS Running Sessions"
          value={stats.totalRuns}
          unit="runs"
          icon={Flame}
          accent="emerald"
          subtitle={`${stats.totalDistanceKm} total kilometers`}
        />
        <StatCard
          title="Workouts Recorded"
          value={stats.totalWorkouts}
          unit="sessions"
          icon={Dumbbell}
          accent="purple"
          subtitle="Strength, cardio & HIIT"
        />
        <StatCard
          title="Food Entries Logged"
          value={stats.totalMeals}
          unit="meals"
          icon={UtensilsCrossed}
          accent="cyan"
          subtitle="Open Food Facts logs"
        />
      </div>

      {/* Two Column Layout: Recent Users & Global Activity Stream */}
      <div className="admin-two-cols">
        {/* Column 1: Registered Athletes */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Registered Athletes</h3>
              <p className="admin-card-sub">Recently onboarded user profiles</p>
            </div>
            <Link to="/admin/users" className="admin-view-all">
              Manage All <ArrowRight size={14} />
            </Link>
          </div>

          <div className="admin-users-list">
            {stats.users.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">No regular users registered yet.</p>
            ) : (
              stats.users.slice(0, 5).map((u) => (
                <div key={u.id} className="admin-user-row">
                  <div className="admin-user-avatar">
                    {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                  </div>
                  <div className="admin-user-info">
                    <span className="admin-user-name">{u.name}</span>
                    <span className="admin-user-email">{u.email}</span>
                  </div>
                  <div className="admin-user-meta">
                    <span className="admin-goal-pill">{u.fitnessGoal || 'FitTrack'}</span>
                    <span className="admin-joined-date">
                      {new Date(u.registeredAt || Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Column 2: System Activity Feed */}
        <div className="admin-card">
          <div className="admin-card-header">
            <div>
              <h3 className="admin-card-title">Live Activity Stream</h3>
              <p className="admin-card-sub">Recent activities across all athlete partitions</p>
            </div>
            <Link to="/admin/activities" className="admin-view-all">
              View Log <ArrowRight size={14} />
            </Link>
          </div>

          <div className="admin-activity-stream">
            {stats.recentActivities.length === 0 ? (
              <p className="text-sm text-slate-400 p-4">No activities logged across the system yet.</p>
            ) : (
              stats.recentActivities.slice(0, 7).map((act) => (
                <div key={act.id} className="admin-activity-row">
                  <div className={`activity-pill-icon icon-${act.type}`}>
                    {act.type === 'run' && <Flame size={15} />}
                    {act.type === 'workout' && <Dumbbell size={15} />}
                    {act.type === 'meal' && <UtensilsCrossed size={15} />}
                  </div>
                  <div className="admin-act-details">
                    <span className="admin-act-title">{act.title}</span>
                    <span className="admin-act-user">
                      by <strong>{act.userName}</strong> ({act.details})
                    </span>
                  </div>
                  <span className="admin-act-time">
                    {formatFriendlyDate(act.date)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
