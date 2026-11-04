import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  User,
  Mail,
  Lock,
  Calendar,
  Ruler,
  Weight,
  Target,
  Activity,
  UserPlus,
  AlertCircle,
  Sparkles
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { validateRegistrationForm } from '../utils/validation';

export default function Register() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
    age: '',
    gender: 'Male',
    height: '',
    weight: '',
    fitnessLevel: 'Beginner',
    fitnessGoal: 'Improve Fitness',
    dailyCalorieTarget: 2000
  });

  const [errors, setErrors] = useState({});
  const [generalError, setGeneralError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const { register } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: '' }));
    }
    setGeneralError('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setGeneralError('');

    const validation = validateRegistrationForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      return;
    }

    setSubmitting(true);
    try {
      const newUser = register(formData);
      showToast(`Welcome to FitTrack, ${newUser.name}! Your journey begins today.`, 'success');
      navigate('/dashboard', { replace: true });
    } catch (err) {
      setGeneralError(err.message || 'Registration failed. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="auth-page register-page-wrap">
      <div className="auth-card register-card">
        <div className="auth-header">
          <Link to="/" className="brand-logo-wrap center-brand">
            <div className="brand-icon">
              <Sparkles size={22} className="text-emerald-400" />
            </div>
            <span className="brand-name">FitTrack</span>
          </Link>
          <h2 className="auth-title">Create Your Fitness Account</h2>
          <p className="auth-subtitle">
            Set up your personal athlete profile to calculate BMI, track runs, and log nutrition
          </p>
        </div>

        {generalError && (
          <div className="auth-alert-error" role="alert">
            <AlertCircle size={18} />
            <span>{generalError}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="register-grid-form">
          {/* Section: Account Credentials */}
          <div className="form-section-title">Account Credentials</div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-name">Full Name *</label>
            <div className="input-with-icon">
              <User size={18} className="input-icon" />
              <input
                id="reg-name"
                name="name"
                type="text"
                className={`form-input ${errors.name ? 'input-error' : ''}`}
                placeholder="e.g. Jordan Smith"
                value={formData.name}
                onChange={handleChange}
                required
              />
            </div>
            {errors.name && <span className="field-error-msg">{errors.name}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-email">Email Address *</label>
            <div className="input-with-icon">
              <Mail size={18} className="input-icon" />
              <input
                id="reg-email"
                name="email"
                type="email"
                className={`form-input ${errors.email ? 'input-error' : ''}`}
                placeholder="jordan@example.com"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </div>
            {errors.email && <span className="field-error-msg">{errors.email}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-password">Password *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="reg-password"
                name="password"
                type="password"
                className={`form-input ${errors.password ? 'input-error' : ''}`}
                placeholder="Min. 6 characters"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </div>
            {errors.password && <span className="field-error-msg">{errors.password}</span>}
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="reg-confirm">Confirm Password *</label>
            <div className="input-with-icon">
              <Lock size={18} className="input-icon" />
              <input
                id="reg-confirm"
                name="confirmPassword"
                type="password"
                className={`form-input ${errors.confirmPassword ? 'input-error' : ''}`}
                placeholder="Repeat password"
                value={formData.confirmPassword}
                onChange={handleChange}
                required
              />
            </div>
            {errors.confirmPassword && (
              <span className="field-error-msg">{errors.confirmPassword}</span>
            )}
          </div>

          {/* Section: Physical Profile */}
          <div className="form-section-title">Physical Metrics</div>

          <div className="form-row-three">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-age">Age (yrs) *</label>
              <div className="input-with-icon">
                <Calendar size={18} className="input-icon" />
                <input
                  id="reg-age"
                  name="age"
                  type="number"
                  min="10"
                  max="120"
                  className={`form-input ${errors.age ? 'input-error' : ''}`}
                  placeholder="22"
                  value={formData.age}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.age && <span className="field-error-msg">{errors.age}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-gender">Gender</label>
              <select
                id="reg-gender"
                name="gender"
                className="form-input form-select"
                value={formData.gender}
                onChange={handleChange}
              >
                <option value="Male">Male</option>
                <option value="Female">Female</option>
                <option value="Non-binary">Non-binary</option>
                <option value="Prefer not to say">Prefer not to say</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-height">Height (cm) *</label>
              <div className="input-with-icon">
                <Ruler size={18} className="input-icon" />
                <input
                  id="reg-height"
                  name="height"
                  type="number"
                  min="50"
                  max="260"
                  className={`form-input ${errors.height ? 'input-error' : ''}`}
                  placeholder="175"
                  value={formData.height}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.height && <span className="field-error-msg">{errors.height}</span>}
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label" htmlFor="reg-weight">Current Weight (kg) *</label>
              <div className="input-with-icon">
                <Weight size={18} className="input-icon" />
                <input
                  id="reg-weight"
                  name="weight"
                  type="number"
                  step="0.1"
                  min="20"
                  max="300"
                  className={`form-input ${errors.weight ? 'input-error' : ''}`}
                  placeholder="70.5"
                  value={formData.weight}
                  onChange={handleChange}
                  required
                />
              </div>
              {errors.weight && <span className="field-error-msg">{errors.weight}</span>}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="reg-level">Activity Level</label>
              <div className="input-with-icon">
                <Activity size={18} className="input-icon" />
                <select
                  id="reg-level"
                  name="fitnessLevel"
                  className="form-input form-select"
                  value={formData.fitnessLevel}
                  onChange={handleChange}
                >
                  <option value="Beginner">Beginner (1-2 days/week)</option>
                  <option value="Moderate">Moderate (3-4 days/week)</option>
                  <option value="Highly Active">Highly Active (5+ days/week)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Section: Fitness Objective */}
          <div className="form-group">
            <label className="form-label" htmlFor="reg-goal">Fitness Objective</label>
            <div className="input-with-icon">
              <Target size={18} className="input-icon" />
              <select
                id="reg-goal"
                name="fitnessGoal"
                className="form-input form-select"
                value={formData.fitnessGoal}
                onChange={handleChange}
              >
                <option value="Weight Loss">Weight Loss</option>
                <option value="Improve Fitness">Improve Fitness</option>
                <option value="Improve Running">Improve Running</option>
                <option value="Weight Gain">Weight Gain (Muscle Building)</option>
                <option value="Maintain Fitness">Maintain Fitness</option>
              </select>
            </div>
          </div>

          <button
            type="submit"
            className="btn btn-primary btn-block btn-register-submit"
            disabled={submitting}
          >
            <UserPlus size={18} />
            <span>{submitting ? 'Creating Athlete Profile...' : 'Complete Registration & Enter FitTrack'}</span>
          </button>
        </form>

        <div className="auth-footer">
          <span>Already registered?</span>{' '}
          <Link to="/login" className="auth-link">
            Log In Here
          </Link>
        </div>
      </div>
    </div>
  );
}
