import React, { useState, useEffect } from 'react';
import {
  Activity,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Search,
  Filter,
  Calendar,
  User,
  ShieldCheck
} from 'lucide-react';
import { getAdminStats } from '../../services/storageService';
import { formatFriendlyDate } from '../../utils/calculations';

export default function AdminActivities() {
  const [activities, setActivities] = useState([]);
  const [typeFilter, setTypeFilter] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const loadActivities = () => {
    const stats = getAdminStats();
    setActivities(stats.recentActivities);
  };

  useEffect(() => {
    loadActivities();
  }, []);

  const filtered = activities.filter((act) => {
    const matchesType = typeFilter === 'All' || act.type === typeFilter.toLowerCase();
    const q = searchQuery.toLowerCase().trim();
    if (!q) return matchesType;

    const matchesSearch =
      (act.title && act.title.toLowerCase().includes(q)) ||
      (act.userName && act.userName.toLowerCase().includes(q)) ||
      (act.userEmail && act.userEmail.toLowerCase().includes(q)) ||
      (act.details && act.details.toLowerCase().includes(q));

    return matchesType && matchesSearch;
  });

  return (
    <div className="admin-activities-page">
      {/* Banner */}
      <div className="admin-banner-card">
        <div className="admin-banner-content">
          <div className="admin-badge-pill">
            <Activity size={16} className="text-amber-400" />
            <span>GLOBAL AUDIT LOG</span>
          </div>
          <h2 className="admin-title">Application Activity Logs</h2>
          <p className="admin-subtitle">
            Chronological audit of GPS runs, strength workouts, and food diary entries logged across the system.
          </p>
        </div>

        <div className="admin-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input admin-search-input"
            placeholder="Search activities, athletes, or notes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Filter Tabs */}
      <div className="admin-activity-filters">
        <div className="filter-title">
          <Filter size={16} className="text-slate-400" />
          <span>Activity Filter:</span>
        </div>
        <div className="filter-pills-wrap">
          {['All', 'Run', 'Workout', 'Meal'].map((tab) => (
            <button
              key={tab}
              className={`filter-pill ${typeFilter === tab ? 'filter-pill-active' : ''}`}
              onClick={() => setTypeFilter(tab)}
            >
              {tab === 'All' ? 'All Activities' : `${tab}s`}
            </button>
          ))}
        </div>
      </div>

      {/* Activity Table */}
      <div className="admin-card mt-3">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Activity Audit Trail ({filtered.length})</h3>
            <p className="admin-card-sub">Recorded across all athlete data partitions</p>
          </div>
        </div>

        {filtered.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No activity records match your current filter criteria.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Activity Description</th>
                  <th>Athlete</th>
                  <th>Telemetry & Metrics</th>
                  <th>Date Logged</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((act) => (
                  <tr key={act.id}>
                    <td>
                      <span className={`activity-type-pill pill-${act.type}`}>
                        {act.type === 'run' && <Flame size={14} />}
                        {act.type === 'workout' && <Dumbbell size={14} />}
                        {act.type === 'meal' && <UtensilsCrossed size={14} />}
                        <span>{act.type.toUpperCase()}</span>
                      </span>
                    </td>

                    <td>
                      <span className="act-table-title font-medium text-slate-100">
                        {act.title}
                      </span>
                    </td>

                    <td>
                      <div className="table-user-cell">
                        <div className="admin-user-avatar sm">
                          {act.userName ? act.userName.charAt(0).toUpperCase() : 'U'}
                        </div>
                        <div>
                          <span className="table-user-name text-sm">{act.userName}</span>
                          <span className="table-user-email text-xs">{act.userEmail}</span>
                        </div>
                      </div>
                    </td>

                    <td>
                      <span className="text-slate-300 text-sm font-mono">{act.details}</span>
                    </td>

                    <td>
                      <span className="table-date text-sm">
                        {formatFriendlyDate(act.date)}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
