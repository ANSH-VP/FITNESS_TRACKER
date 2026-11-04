import React, { useState } from 'react';
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
  AlertCircle,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getRuns,
  getWorkouts,
  getMeals,
  getWeights,
  getGoals
} from '../services/storageService';
import { calculateBMI } from '../utils/calculations';

export default function Profile() {
  const { user, updateProfile } = useAuth();
  const { showToast } = useToast();

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

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
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
        <div className="profile-avatar-large">
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
        <div className="profile-header-info">
          <div className="profile-tag">
            <Sparkles size={14} className="text-emerald-400" />
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

      {/* Profile Edit Form */}
      <div className="profile-content-grid">
        <div className="profile-form-card">
          <div className="form-card-header">
            <h3 className="section-title">Personal Information & Biometrics</h3>
            <p className="section-subtitle">Keep your physical metrics accurate for calorie & BMI computations</p>
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

        {/* Security & Academic Project Disclaimer */}
        <div className="profile-side-card">
          <div className="security-notice-box">
            <div className="notice-icon-row">
              <ShieldCheck size={22} className="text-emerald-400" />
              <h4 className="notice-title">University Demonstration Architecture</h4>
            </div>
            <p className="notice-body">
              This application was developed as a university second-year project. All authentication, credentials, and fitness records are persisted client-side in browser <strong>LocalStorage</strong> and isolated per user ID.
            </p>
            <ul className="notice-bullets">
              <li><CheckCircle2 size={14} className="text-emerald-400" /> User-specific data isolation</li>
              <li><CheckCircle2 size={14} className="text-emerald-400" /> Safe SessionStorage login lifecycle</li>
              <li><CheckCircle2 size={14} className="text-emerald-400" /> Offline data resilience</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
