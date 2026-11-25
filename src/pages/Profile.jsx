import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  User,
  Mail,
  Calendar,
  Ruler,
  Weight,
  Target,
  Activity,
  Save,
  ShieldCheck,
  Download,
  Sparkles,
  CheckCircle2,
  Camera,
  Trophy,
  Plus,
  Trash2,
  Award
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getRuns,
  getWorkouts,
  getMeals,
  getWeights,
  getGoals,
  saveGoal,
  deleteGoal
} from '../services/storageService';
import { calculateBMI, formatDuration } from '../utils/calculations';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();
  const fileInputRef = useRef(null);

  const [form, setForm] = useState({
    name: user?.name || '',
    age: user?.age || '',
    gender: user?.gender || 'Male',
    height: user?.height || '',
    weight: user?.weight || '',
    fitnessLevel: user?.fitnessLevel || 'Beginner',
    fitnessGoal: user?.fitnessGoal || 'Improve Fitness',
    dailyCalorieTarget: user?.dailyCalorieTarget || 2200
  });

  const [saving, setSaving] = useState(false);
  const [runs, setRuns] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [newGoal, setNewGoal] = useState({ title: '', category: 'Running', targetValue: '', unit: 'km' });

  useEffect(() => {
    if (!user?.id) return;
    setRuns(getRuns(user.id));
    setWorkouts(getWorkouts(user.id));
    setGoals(getGoals(user.id));
  }, [user]);

  const personalRecords = useMemo(() => {
    const longestRun = runs.reduce((max, r) => Math.max(max, Number(r.distance) || 0), 0);
    const totalDistance = runs.reduce((s, r) => s + (Number(r.distance) || 0), 0);
    const longestDuration = runs.reduce((max, r) => Math.max(max, Number(r.duration) || 0), 0);
    const totalCaloriesBurned = [
      ...runs.map((r) => Number(r.calories) || 0),
      ...workouts.map((w) => Number(w.calories) || 0)
    ].reduce((s, c) => s + c, 0);

    return {
      longestRun: longestRun.toFixed(1),
      totalDistance: totalDistance.toFixed(1),
      longestDuration: longestDuration ? formatDuration(longestDuration) : '--',
      totalWorkouts: workouts.length,
      totalCaloriesBurned
    };
  }, [runs, workouts]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAvatarUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'error');
      return;
    }
    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be smaller than 2 MB.', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      try {
        updateProfile({ avatar: reader.result });
        showToast('Profile picture updated!', 'success');
      } catch (err) {
        showToast(err.message || 'Could not save profile picture.', 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Name is required.', 'error');
      return;
    }

    setSaving(true);
    try {
      updateProfile({
        name: form.name.trim(),
        age: Number(form.age) || user.age,
        gender: form.gender,
        height: Number(form.height) || user.height,
        weight: Number(form.weight) || user.weight,
        fitnessLevel: form.fitnessLevel,
        fitnessGoal: form.fitnessGoal,
        dailyCalorieTarget: Number(form.dailyCalorieTarget) || 2200
      });
      showToast('Profile information successfully saved to Local Storage!', 'success');
    } catch (err) {
      showToast(err.message || 'Failed to update profile.', 'error');
    } finally {
      setSaving(false);
    }
  };

  const handleAddGoal = (e) => {
    e.preventDefault();
    if (!newGoal.title.trim() || !newGoal.targetValue || Number(newGoal.targetValue) <= 0) {
      showToast('Please enter a valid goal title and target value.', 'error');
      return;
    }
    saveGoal(user.id, {
      title: newGoal.title.trim(),
      category: newGoal.category,
      targetValue: Number(newGoal.targetValue),
      unit: newGoal.unit
    });
    setGoals(getGoals(user.id));
    setNewGoal({ title: '', category: 'Running', targetValue: '', unit: 'km' });
    showToast('Fitness goal added!', 'success');
  };

  const handleDeleteGoal = (goalId) => {
    deleteGoal(user.id, goalId);
    setGoals(getGoals(user.id));
    showToast('Goal removed.', 'info');
  };

  // Export personal fitness data as a JSON file
  const handleExportData = () => {
    if (!user) return;
    const exportBundle = {
      userProfile: user,
      runs: getRuns(user.id),
      workouts: getWorkouts(user.id),
      meals: getMeals(user.id),
      weights: getWeights(user.id),
      goals: getGoals(user.id),
      exportedAt: new Date().toISOString()
    };

    const blob = new Blob([JSON.stringify(exportBundle, null, 2)], {
      type: 'application/json'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `fittrack_export_${user.name.replace(/\s+/g, '_')}_${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('Fitness data package downloaded successfully!', 'info');
  };

  const bmi = calculateBMI(form.weight || user?.weight, form.height || user?.height);

  return (
    <div className="profile-page">
      {/* Profile Header Card */}
      <div className="profile-header-card">
        <div className="profile-avatar-wrap">
          <div className="profile-avatar-large">
            {user?.avatar ? (
              <img src={user.avatar} alt={user.name} className="avatar-img" />
            ) : (
              user?.name ? user.name.charAt(0).toUpperCase() : 'U'
            )}
          </div>
          <button
            type="button"
            className="profile-avatar-upload-btn"
            onClick={() => fileInputRef.current?.click()}
            title="Upload profile picture"
          >
            <Camera size={14} />
          </button>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={handleAvatarUpload}
            style={{ display: 'none' }}
          />
        </div>

        <div className="profile-header-info">
          <div className="profile-tag">
            <Sparkles size={14} className="text-lime-400" />
            <span>ATHLETE PROFILE</span>
          </div>
          <h2 className="profile-display-name">{user?.name}</h2>
          <p className="profile-display-email">{user?.email}</p>
          <div className="profile-chips-row">
            <span className="profile-chip">Goal: {user?.fitnessGoal}</span>
            <span className="profile-chip">Level: {user?.fitnessLevel}</span>
            <span className="profile-chip">BMI: {bmi.bmi} ({bmi.category})</span>
          </div>
        </div>

        <button
          onClick={handleExportData}
          className="btn btn-secondary btn-export-profile"
          title="Download a JSON backup of your records"
        >
          <Download size={16} />
          <span>Export Fitness Data</span>
        </button>
      </div>

      {/* Personal Records Strip */}
      <div className="profile-records-grid">
        <div className="profile-record-card">
          <Trophy size={20} style={{ color: '#B7F34A' }} />
          <div>
            <span className="profile-record-val">{personalRecords.longestRun} km</span>
            <span className="profile-record-lbl">Longest Run</span>
          </div>
        </div>
        <div className="profile-record-card">
          <Activity size={20} style={{ color: '#36C99A' }} />
          <div>
            <span className="profile-record-val">{personalRecords.totalDistance} km</span>
            <span className="profile-record-lbl">Total Distance</span>
          </div>
        </div>
        <div className="profile-record-card">
          <Award size={20} style={{ color: '#F3A64A' }} />
          <div>
            <span className="profile-record-val">{personalRecords.longestDuration}</span>
            <span className="profile-record-lbl">Longest Session</span>
          </div>
        </div>
        <div className="profile-record-card">
          <Sparkles size={20} style={{ color: '#8b5cf6' }} />
          <div>
            <span className="profile-record-val">{personalRecords.totalWorkouts}</span>
            <span className="profile-record-lbl">Workouts Logged</span>
          </div>
        </div>
      </div>

      {/* Profile Edit Form & Goals */}
      <div className="profile-content-grid">
        <div className="profile-form-card">
          <div className="form-card-header">
            <h3 className="section-title">Personal Information &amp; Biometrics</h3>
            <p className="section-subtitle">Keep your physical metrics accurate for calorie &amp; BMI computations</p>
          </div>

          <form onSubmit={handleSubmit} className="profile-form">
            <div className="form-row-two">
              <div className="form-group">
                <label className="form-label">Full Name *</label>
                <div className="input-with-icon">
                  <User size={18} className="input-icon" />
                  <input
                    type="text"
                    name="name"
                    className="form-input"
                    value={form.name}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Email Address (Read-Only ID)</label>
                <div className="input-with-icon">
                  <Mail size={18} className="input-icon" />
                  <input
                    type="email"
                    className="form-input form-input-disabled"
                    value={user?.email || ''}
                    disabled
                  />
                </div>
              </div>
            </div>

            <div className="form-row-three">
              <div className="form-group">
                <label className="form-label">Age (years)</label>
                <div className="input-with-icon">
                  <Calendar size={18} className="input-icon" />
                  <input
                    type="number"
                    name="age"
                    min="10"
                    max="120"
                    className="form-input"
                    value={form.age}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Gender</label>
                <select
                  name="gender"
                  className="form-input form-select"
                  value={form.gender}
                  onChange={handleChange}
                >
                  <option value="Male">Male</option>
                  <option value="Female">Female</option>
                  <option value="Non-binary">Non-binary</option>
                  <option value="Prefer not to say">Prefer not to say</option>
                </select>
              </div>

              <div className="form-group">
                <label className="form-label">Height (cm)</label>
                <div className="input-with-icon">
                  <Ruler size={18} className="input-icon" />
                  <input
                    type="number"
                    name="height"
                    min="50"
                    max="260"
                    className="form-input"
                    value={form.height}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="form-row-three">
              <div className="form-group">
                <label className="form-label">Current Weight (kg)</label>
                <div className="input-with-icon">
                  <Weight size={18} className="input-icon" />
                  <input
                    type="number"
                    step="0.1"
                    name="weight"
                    min="20"
                    max="300"
                    className="form-input"
                    value={form.weight}
                    onChange={handleChange}
                  />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fitness Level</label>
                <div className="input-with-icon">
                  <Activity size={18} className="input-icon" />
                  <select
                    name="fitnessLevel"
                    className="form-input form-select"
                    value={form.fitnessLevel}
                    onChange={handleChange}
                  >
                    <option value="Beginner">Beginner</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Highly Active">Highly Active</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Fitness Objective</label>
                <div className="input-with-icon">
                  <Target size={18} className="input-icon" />
                  <select
                    name="fitnessGoal"
                    className="form-input form-select"
                    value={form.fitnessGoal}
                    onChange={handleChange}
                  >
                    <option value="Weight Loss">Weight Loss</option>
                    <option value="Improve Fitness">Improve Fitness</option>
                    <option value="Improve Running">Improve Running</option>
                    <option value="Weight Gain">Weight Gain</option>
                    <option value="Maintain Fitness">Maintain Fitness</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Daily Calorie Target (kcal)</label>
              <input
                type="number"
                name="dailyCalorieTarget"
                min="800"
                max="6000"
                className="form-input"
                value={form.dailyCalorieTarget}
                onChange={handleChange}
              />
            </div>

            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={saving}
            >
              <Save size={18} />
              <span>{saving ? 'Saving Changes...' : 'Save Profile Changes'}</span>
            </button>
          </form>
        </div>

        {/* Side Column: Fitness Goals Management + Architecture Note */}
        <div className="profile-side-col">
          <div className="profile-side-card">
            <h4 className="section-title" style={{ marginBottom: '0.75rem' }}>Fitness Goals</h4>
            <form onSubmit={handleAddGoal} className="profile-goal-form">
              <input
                type="text"
                className="form-input"
                placeholder="Goal title (e.g. Run 20 km)"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
              />
              <div className="profile-goal-row">
                <select
                  className="form-input form-select"
                  value={newGoal.category}
                  onChange={(e) => {
                    const cat = e.target.value;
                    const unit = cat === 'Running' ? 'km' : cat === 'Weight' ? 'kg' : 'sessions';
                    setNewGoal({ ...newGoal, category: cat, unit });
                  }}
                >
                  <option value="Running">Running</option>
                  <option value="Workout">Workout</option>
                  <option value="Weight">Weight</option>
                </select>
                <input
                  type="number"
                  step="0.1"
                  className="form-input"
                  placeholder="Target"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({ ...newGoal, targetValue: e.target.value })}
                />
                <button type="submit" className="btn btn-primary" aria-label="Add goal">
                  <Plus size={16} />
                </button>
              </div>
            </form>

            <div className="profile-goals-list">
              {goals.length === 0 ? (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>No goals added yet.</p>
              ) : (
                goals.map((g) => (
                  <div key={g.id} className="profile-goal-item">
                    <div>
                      <div className="profile-goal-title">{g.title}</div>
                      <div className="profile-goal-meta">
                        {g.category} · Target: {g.targetValue} {g.unit}
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteGoal(g.id)}
                      className="btn-icon-danger"
                      title="Delete goal"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>

          <div className="profile-side-card">
            <div className="security-notice-box">
              <div className="notice-icon-row">
                <ShieldCheck size={22} className="text-emerald-400" />
                <h4 className="notice-title">Local Storage Persistence</h4>
              </div>
              <p className="notice-body">
                All profile metrics, workouts, runs, and goals are stored client-side in your browser&apos;s <strong>LocalStorage</strong> and isolated per user ID.
              </p>
              <ul className="notice-bullets">
                <li><CheckCircle2 size={14} className="text-emerald-400" /> User-specific data isolation</li>
                <li><CheckCircle2 size={14} className="text-emerald-400" /> SessionStorage login lifecycle</li>
                <li><CheckCircle2 size={14} className="text-emerald-400" /> JSON export backup anytime</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
