import React, { useState, useEffect } from 'react';
import {
  Users,
  Search,
  Trash2,
  Eye,
  AlertTriangle,
  ShieldCheck,
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Calendar,
  Ruler,
  Weight
} from 'lucide-react';
import {
  getUsers,
  deleteUserAccount,
  getRuns,
  getWorkouts,
  getMeals
} from '../../services/storageService';
import { useToast } from '../../context/ToastContext';
import Modal from '../../components/common/Modal';
import { calculateBMI, formatFriendlyDate, formatDuration } from '../../utils/calculations';

export default function AdminUsers() {
  const { showToast } = useToast();
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // User detail inspection modal
  const [inspectModalOpen, setInspectModalOpen] = useState(false);
  const [inspectedUser, setInspectedUser] = useState(null);
  const [userStats, setUserStats] = useState({ runs: [], workouts: [], meals: [] });

  const loadUsers = () => {
    // Exclude administrators from standard user deletion list
    const all = getUsers();
    setUsers(all.filter((u) => u.role !== 'admin'));
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Filtered by search
  const filteredUsers = users.filter((u) => {
    const q = searchQuery.toLowerCase().trim();
    if (!q) return true;
    return (
      (u.name && u.name.toLowerCase().includes(q)) ||
      (u.email && u.email.toLowerCase().includes(q)) ||
      (u.fitnessGoal && u.fitnessGoal.toLowerCase().includes(q))
    );
  });

  // Open Inspection Modal
  const handleInspect = (user) => {
    setInspectedUser(user);
    const runs = getRuns(user.id);
    const workouts = getWorkouts(user.id);
    const meals = getMeals(user.id);
    setUserStats({ runs, workouts, meals });
    setInspectModalOpen(true);
  };

  // Open Delete Confirmation Modal
  const handlePromptDelete = (user) => {
    setUserToDelete(user);
    setDeleteModalOpen(true);
  };

  // Confirm and Execute User Deletion
  const handleConfirmDelete = () => {
    if (!userToDelete) return;

    try {
      deleteUserAccount(userToDelete.id);
      showToast(`User account for "${userToDelete.name}" and all associated fitness records deleted.`, 'info');
      setDeleteModalOpen(false);
      setUserToDelete(null);
      loadUsers();
    } catch (err) {
      showToast(err.message || 'Failed to delete user.', 'error');
    }
  };

  return (
    <div className="admin-users-page">
      {/* Header */}
      <div className="admin-banner-card">
        <div className="admin-banner-content">
          <div className="admin-badge-pill">
            <Users size={16} className="text-amber-400" />
            <span>ATHLETE REPOSITORY</span>
          </div>
          <h2 className="admin-title">User Account Management</h2>
          <p className="admin-subtitle">
            Search registered users, inspect personal activity metrics, and manage partition lifecycle.
          </p>
        </div>

        {/* Search input */}
        <div className="admin-search-wrap">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input admin-search-input"
            placeholder="Search by name, email, or fitness goal..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* Users Table / Cards */}
      <div className="admin-card mt-4">
        <div className="admin-card-header">
          <div>
            <h3 className="admin-card-title">Registered Athletes ({filteredUsers.length})</h3>
            <p className="admin-card-sub">Data isolated per unique user ID in Local Storage</p>
          </div>
        </div>

        {filteredUsers.length === 0 ? (
          <div className="p-8 text-center text-slate-400">
            No athlete accounts found matching your search.
          </div>
        ) : (
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Athlete</th>
                  <th>Biometrics</th>
                  <th>Fitness Objective</th>
                  <th>Level</th>
                  <th>Activity Count</th>
                  <th>Registered</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const runsCount = getRuns(u.id).length;
                  const workoutsCount = getWorkouts(u.id).length;
                  const mealsCount = getMeals(u.id).length;
                  const totalActivities = runsCount + workoutsCount + mealsCount;
                  const bmi = calculateBMI(u.weight, u.height);

                  return (
                    <tr key={u.id}>
                      <td>
                        <div className="table-user-cell">
                          <div className="admin-user-avatar">
                            {u.name ? u.name.charAt(0).toUpperCase() : 'U'}
                          </div>
                          <div>
                            <span className="table-user-name">{u.name}</span>
                            <span className="table-user-email">{u.email}</span>
                          </div>
                        </div>
                      </td>

                      <td>
                        <div className="table-bio-cell">
                          <span>{u.age} yrs • {u.gender}</span>
                          <span className="table-sub-bio">
                            {u.height} cm | {u.weight} kg (BMI {bmi.bmi})
                          </span>
                        </div>
                      </td>

                      <td>
                        <span className="goal-table-pill">{u.fitnessGoal || 'Improve Fitness'}</span>
                      </td>

                      <td>
                        <span className="level-table-pill">{u.fitnessLevel || 'Beginner'}</span>
                      </td>

                      <td>
                        <div className="activity-mini-counts">
                          <span title="Runs" className="text-emerald-400 font-semibold">{runsCount}R</span>
                          <span>•</span>
                          <span title="Workouts" className="text-purple-400 font-semibold">{workoutsCount}W</span>
                          <span>•</span>
                          <span title="Meals" className="text-cyan-400 font-semibold">{mealsCount}M</span>
                        </div>
                      </td>

                      <td>
                        <span className="table-date">
                          {new Date(u.registeredAt || Date.now()).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="table-actions-row">
                          <button
                            onClick={() => handleInspect(u)}
                            className="btn btn-secondary btn-sm"
                            title="Inspect user records"
                          >
                            <Eye size={15} />
                            <span>Inspect</span>
                          </button>
                          <button
                            onClick={() => handlePromptDelete(u)}
                            className="btn-icon-danger"
                            title="Delete user account"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Inspect User Modal */}
      <Modal
        isOpen={inspectModalOpen}
        onClose={() => setInspectModalOpen(false)}
        title={`Athlete Profile: ${inspectedUser?.name || 'User'}`}
        maxWidth="750px"
      >
        {inspectedUser && (
          <div className="inspect-modal-body">
            {/* Header info */}
            <div className="inspect-user-summary">
              <div className="inspect-user-avatar">
                {inspectedUser.name ? inspectedUser.name.charAt(0).toUpperCase() : 'U'}
              </div>
              <div className="inspect-user-details">
                <h4>{inspectedUser.name}</h4>
                <p className="text-slate-300 text-sm">{inspectedUser.email}</p>
                <div className="inspect-metrics-pills">
                  <span>Age: {inspectedUser.age}</span>
                  <span>Height: {inspectedUser.height} cm</span>
                  <span>Weight: {inspectedUser.weight} kg</span>
                  <span>Goal: {inspectedUser.fitnessGoal}</span>
                </div>
              </div>
            </div>

            {/* Activities Tab Summary */}
            <div className="inspect-activities-breakdown">
              <h5 className="inspect-sub-heading">Personal Activity Records in Local Storage:</h5>
              
              <div className="inspect-stats-grid">
                <div className="inspect-stat-card">
                  <Flame size={18} className="text-emerald-400" />
                  <div>
                    <span className="stat-number">{userStats.runs.length}</span>
                    <span className="stat-desc">GPS Runs</span>
                  </div>
                </div>
                <div className="inspect-stat-card">
                  <Dumbbell size={18} className="text-purple-400" />
                  <div>
                    <span className="stat-number">{userStats.workouts.length}</span>
                    <span className="stat-desc">Workouts</span>
                  </div>
                </div>
                <div className="inspect-stat-card">
                  <UtensilsCrossed size={18} className="text-cyan-400" />
                  <div>
                    <span className="stat-number">{userStats.meals.length}</span>
                    <span className="stat-desc">Meals Logged</span>
                  </div>
                </div>
              </div>

              {/* Recent runs preview */}
              {userStats.runs.length > 0 && (
                <div className="inspect-list-wrap">
                  <h6 className="inspect-list-title">Recent GPS Runs:</h6>
                  <ul className="inspect-mini-list">
                    {userStats.runs.slice(0, 3).map((r) => (
                      <li key={r.id}>
                        <span>{r.title} ({r.distance} km)</span>
                        <span className="text-slate-400">{formatDuration(r.duration)} • {r.calories} kcal</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recent workouts preview */}
              {userStats.workouts.length > 0 && (
                <div className="inspect-list-wrap">
                  <h6 className="inspect-list-title">Recent Workouts:</h6>
                  <ul className="inspect-mini-list">
                    {userStats.workouts.slice(0, 3).map((w) => (
                      <li key={w.id}>
                        <span>{w.name} ({w.category})</span>
                        <span className="text-slate-400">{w.duration} mins • {w.calories} kcal</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            <div className="modal-actions">
              <button
                type="button"
                onClick={() => setInspectModalOpen(false)}
                className="btn btn-primary"
              >
                Close Inspector
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete User Confirmation Modal */}
      <Modal
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        title="Confirm User Account Deletion"
        maxWidth="500px"
      >
        <div className="delete-modal-content">
          <div className="delete-warning-icon-wrap">
            <AlertTriangle size={36} className="text-red-400" />
          </div>

          <p className="delete-warning-title">
            Are you sure you want to permanently delete the account for{' '}
            <strong>{userToDelete?.name}</strong> ({userToDelete?.email})?
          </p>

          <p className="delete-warning-body">
            This will permanently erase the user account and cascade deletion of all their isolated running routes, workout logs, nutrition history, and fitness goals from Local Storage.
          </p>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setDeleteModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={handleConfirmDelete}
              className="btn btn-danger"
            >
              <Trash2 size={16} />
              <span>Permanently Delete User</span>
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
