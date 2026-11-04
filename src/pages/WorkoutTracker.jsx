import React, { useState, useEffect } from 'react';
import {
  Dumbbell,
  Plus,
  Trash2,
  Clock,
  Flame,
  Calendar,
  Filter,
  CheckCircle2,
  ListFilter,
  Sparkles,
  Layers,
  ChevronDown
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { getWorkouts, saveWorkout, deleteWorkout } from '../services/storageService';
import {
  estimateWorkoutCalories,
  getLocalDateString,
  formatFriendlyDate
} from '../utils/calculations';
import Modal from '../components/common/Modal';
import EmptyState from '../components/common/EmptyState';

const WORKOUT_CATEGORIES = [
  'Strength Training',
  'Cardio',
  'Running',
  'Cycling',
  'Walking',
  'Bodyweight Training',
  'HIIT',
  'Other'
];

const PRESET_EXERCISES = [
  { name: 'Barbell Bench Press', category: 'Strength Training', defaultSets: 3, defaultReps: 10, defaultWeight: 60 },
  { name: 'Barbell Back Squats', category: 'Strength Training', defaultSets: 4, defaultReps: 8, defaultWeight: 80 },
  { name: 'Deadlifts', category: 'Strength Training', defaultSets: 3, defaultReps: 6, defaultWeight: 90 },
  { name: 'Overhead Shoulder Press', category: 'Strength Training', defaultSets: 3, defaultReps: 10, defaultWeight: 40 },
  { name: 'Push-ups', category: 'Bodyweight Training', defaultSets: 3, defaultReps: 15, defaultWeight: 0 },
  { name: 'Pull-ups', category: 'Bodyweight Training', defaultSets: 3, defaultReps: 8, defaultWeight: 0 },
  { name: 'Walking Lunges', category: 'Strength Training', defaultSets: 3, defaultReps: 12, defaultWeight: 14 },
  { name: 'Plank Hold (seconds)', category: 'Bodyweight Training', defaultSets: 3, defaultReps: 60, defaultWeight: 0 },
  { name: 'Dumbbell Bicep Curls', category: 'Strength Training', defaultSets: 3, defaultReps: 12, defaultWeight: 12 },
  { name: 'Indoor Treadmill Run', category: 'Cardio', defaultSets: 1, defaultReps: 1, defaultWeight: 0 },
  { name: 'Stationary Cycling', category: 'Cycling', defaultSets: 1, defaultReps: 1, defaultWeight: 0 },
  { name: 'HIIT Tabata Circuit', category: 'HIIT', defaultSets: 4, defaultReps: 8, defaultWeight: 0 }
];

export default function WorkoutTracker() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [workouts, setWorkouts] = useState([]);
  const [filterCategory, setFilterCategory] = useState('All');
  const [modalOpen, setModalOpen] = useState(false);

  // Form State
  const [form, setForm] = useState({
    name: 'Upper Body Strength',
    category: 'Strength Training',
    duration: 45,
    calories: 250,
    date: getLocalDateString(new Date()),
    notes: '',
    exercises: [
      { name: 'Barbell Bench Press', sets: 3, reps: 10, weight: 60 }
    ]
  });

  const loadWorkouts = () => {
    if (user?.id) {
      setWorkouts(getWorkouts(user.id));
    }
  };

  useEffect(() => {
    loadWorkouts();
  }, [user]);

  // Recalculate estimated calories when category or duration changes
  const handleCategoryOrDurationChange = (category, duration) => {
    const userWeight = user?.weight || 70;
    const est = estimateWorkoutCalories(category, duration, userWeight);
    setForm((prev) => ({
      ...prev,
      category,
      duration,
      calories: est
    }));
  };

  // Add exercise to form
  const handleAddExerciseToForm = (preset = null) => {
    const newEx = preset
      ? { name: preset.name, sets: preset.defaultSets, reps: preset.defaultReps, weight: preset.defaultWeight }
      : { name: '', sets: 3, reps: 10, weight: 0 };

    setForm((prev) => ({
      ...prev,
      exercises: [...prev.exercises, newEx]
    }));
  };

  // Update exercise field
  const handleUpdateExercise = (index, field, value) => {
    setForm((prev) => {
      const updated = [...prev.exercises];
      updated[index] = { ...updated[index], [field]: value };
      return { ...prev, exercises: updated };
    });
  };

  // Remove exercise from form
  const handleRemoveExercise = (index) => {
    setForm((prev) => ({
      ...prev,
      exercises: prev.exercises.filter((_, i) => i !== index)
    }));
  };

  // Open Modal with clean form
  const handleOpenModal = () => {
    const userWeight = user?.weight || 70;
    const defaultDuration = 45;
    const defaultCat = 'Strength Training';
    setForm({
      name: 'Full Body Workout',
      category: defaultCat,
      duration: defaultDuration,
      calories: estimateWorkoutCalories(defaultCat, defaultDuration, userWeight),
      date: getLocalDateString(new Date()),
      notes: '',
      exercises: [
        { name: 'Barbell Bench Press', sets: 3, reps: 10, weight: 60 }
      ]
    });
    setModalOpen(true);
  };

  // Save Workout
  const handleSubmitWorkout = (e) => {
    e.preventDefault();
    if (!form.name.trim()) {
      showToast('Please provide a workout name.', 'error');
      return;
    }
    if (!form.duration || Number(form.duration) <= 0) {
      showToast('Please provide a valid duration.', 'error');
      return;
    }

    const cleanedExercises = form.exercises
      .filter((ex) => ex.name.trim().length > 0)
      .map((ex) => ({
        name: ex.name.trim(),
        sets: Number(ex.sets) || 1,
        reps: Number(ex.reps) || 1,
        weight: Number(ex.weight) || 0
      }));

    saveWorkout(user.id, {
      name: form.name.trim(),
      category: form.category,
      duration: Number(form.duration),
      calories: Number(form.calories) || 0,
      date: form.date || getLocalDateString(new Date()),
      notes: form.notes.trim(),
      exercises: cleanedExercises
    });

    loadWorkouts();
    setModalOpen(false);
    showToast(`Workout "${form.name}" logged successfully!`, 'success');
  };

  // Delete Workout
  const handleDelete = (id) => {
    if (window.confirm('Delete this workout record?')) {
      deleteWorkout(user.id, id);
      loadWorkouts();
      showToast('Workout record removed.', 'info');
    }
  };

  // Filtered workouts list
  const filteredWorkouts = workouts.filter((w) => {
    if (filterCategory === 'All') return true;
    return w.category === filterCategory;
  });

  // Calculate totals
  const totalMinutes = workouts.reduce((acc, w) => acc + (Number(w.duration) || 0), 0);
  const totalCals = workouts.reduce((acc, w) => acc + (Number(w.calories) || 0), 0);

  return (
    <div className="workout-tracker-page">
      {/* Top Banner */}
      <div className="workout-header-card">
        <div className="workout-title-group">
          <div className="workout-tag">
            <Dumbbell size={16} className="text-purple-400" />
            <span>EXERCISE & STRENGTH REPOSITORY</span>
          </div>
          <h2 className="workout-page-title">Workout Tracker</h2>
          <p className="workout-page-desc">
            Record training sessions, log exercise sets, weights, and reps, and track calories burned.
          </p>
        </div>

        <button onClick={handleOpenModal} className="btn btn-primary btn-lg">
          <Plus size={18} />
          <span>Record Workout</span>
        </button>
      </div>

      {/* Metrics Row */}
      <div className="workout-metrics-row">
        <div className="wo-metric-card">
          <span className="wo-metric-label">TOTAL SESSIONS</span>
          <span className="wo-metric-val text-purple-400">{workouts.length}</span>
          <span className="wo-metric-sub">Workouts completed</span>
        </div>
        <div className="wo-metric-card">
          <span className="wo-metric-label">TOTAL TRAINING TIME</span>
          <span className="wo-metric-val text-cyan-400">{Math.floor(totalMinutes / 60)}h {totalMinutes % 60}m</span>
          <span className="wo-metric-sub">{totalMinutes} minutes active</span>
        </div>
        <div className="wo-metric-card">
          <span className="wo-metric-label">CALORIES BURNED</span>
          <span className="wo-metric-val text-amber-400">{totalCals.toLocaleString()}</span>
          <span className="wo-metric-sub">Estimated kcal</span>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="workout-filter-bar">
        <div className="filter-title">
          <Filter size={16} className="text-slate-400" />
          <span>Filter Category:</span>
        </div>
        <div className="filter-pills-wrap">
          {['All', ...WORKOUT_CATEGORIES].map((cat) => (
            <button
              key={cat}
              className={`filter-pill ${filterCategory === cat ? 'filter-pill-active' : ''}`}
              onClick={() => setFilterCategory(cat)}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Workouts History List */}
      <div className="workouts-list-section">
        <div className="section-header">
          <h3 className="section-title">
            Workout History ({filteredWorkouts.length})
          </h3>
        </div>

        {filteredWorkouts.length === 0 ? (
          <EmptyState
            icon={Dumbbell}
            title={filterCategory === 'All' ? 'No workouts logged yet' : `No ${filterCategory} workouts found`}
            description="Hit the 'Record Workout' button above to log your exercise routines, sets, reps, and weights."
            actionLabel="Log Workout"
            onAction={handleOpenModal}
          />
        ) : (
          <div className="workout-cards-grid">
            {filteredWorkouts.map((wo) => (
              <div key={wo.id} className="workout-card">
                <div className="workout-card-header">
                  <div>
                    <h4 className="workout-card-title">{wo.name}</h4>
                    <span className="workout-card-date">{formatFriendlyDate(wo.date)}</span>
                  </div>
                  <span className="workout-category-badge">{wo.category}</span>
                </div>

                <div className="workout-card-meta">
                  <div className="meta-stat">
                    <Clock size={15} className="text-cyan-400" />
                    <span>{wo.duration} mins</span>
                  </div>
                  <div className="meta-stat">
                    <Flame size={15} className="text-amber-400" />
                    <span>{wo.calories} kcal</span>
                  </div>
                </div>

                {wo.exercises && wo.exercises.length > 0 && (
                  <div className="workout-exercises-box">
                    <div className="exercises-box-header">
                      <Layers size={13} />
                      <span>Exercises ({wo.exercises.length}):</span>
                    </div>
                    <ul className="exercises-box-list">
                      {wo.exercises.map((ex, i) => (
                        <li key={i} className="exercise-item-line">
                          <span className="ex-name">{ex.name}</span>
                          <span className="ex-reps">
                            {ex.sets} sets × {ex.reps} reps {ex.weight > 0 ? `@ ${ex.weight} kg` : ''}
                          </span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {wo.notes && (
                  <p className="workout-notes-quote">"{wo.notes}"</p>
                )}

                <div className="workout-card-footer">
                  <span className="text-xs text-slate-400">Recorded in FitTrack DB</span>
                  <button
                    onClick={() => handleDelete(wo.id)}
                    className="btn-icon-danger"
                    title="Delete workout"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Record Workout Modal */}
      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title="Record Fitness Workout"
        maxWidth="680px"
      >
        <form onSubmit={handleSubmitWorkout} className="modal-form">
          <div className="form-group">
            <label className="form-label">Workout / Session Name *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Legs & Abs Power Session"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input form-select"
                value={form.category}
                onChange={(e) => handleCategoryOrDurationChange(e.target.value, form.duration)}
              >
                {WORKOUT_CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>
            <div className="form-group">
              <label className="form-label">Workout Date *</label>
              <input
                type="date"
                className="form-input"
                value={form.date}
                onChange={(e) => setForm({ ...form, date: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Duration (minutes) *</label>
              <input
                type="number"
                min="1"
                max="600"
                className="form-input"
                value={form.duration}
                onChange={(e) => handleCategoryOrDurationChange(form.category, Number(e.target.value))}
                required
              />
            </div>
            <div className="form-group">
              <label className="form-label">Calories Burned (kcal)</label>
              <input
                type="number"
                min="0"
                max="5000"
                className="form-input"
                value={form.calories}
                onChange={(e) => setForm({ ...form, calories: Number(e.target.value) })}
              />
            </div>
          </div>

          {/* Exercise Builder & Presets */}
          <div className="exercise-builder-section">
            <div className="builder-header">
              <label className="form-label mb-0">Exercises & Sets</label>
              <button
                type="button"
                onClick={() => handleAddExerciseToForm()}
                className="btn btn-secondary btn-sm"
              >
                <Plus size={14} /> Add Exercise
              </button>
            </div>

            {/* Quick Presets Dropdown / Buttons */}
            <div className="exercise-presets-row">
              <span className="text-xs text-slate-400">Add preset:</span>
              {PRESET_EXERCISES.slice(0, 5).map((p) => (
                <button
                  key={p.name}
                  type="button"
                  className="preset-pill-btn"
                  onClick={() => handleAddExerciseToForm(p)}
                >
                  + {p.name.split(' ')[0]}
                </button>
              ))}
            </div>

            <div className="exercises-inputs-stack">
              {form.exercises.map((ex, idx) => (
                <div key={idx} className="exercise-form-row">
                  <div className="ex-input-name">
                    <input
                      type="text"
                      className="form-input"
                      placeholder="Exercise name"
                      value={ex.name}
                      onChange={(e) => handleUpdateExercise(idx, 'name', e.target.value)}
                    />
                  </div>
                  <div className="ex-input-num">
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="Sets"
                      value={ex.sets}
                      onChange={(e) => handleUpdateExercise(idx, 'sets', e.target.value)}
                      title="Sets"
                    />
                    <span className="input-affix">sets</span>
                  </div>
                  <div className="ex-input-num">
                    <input
                      type="number"
                      min="1"
                      className="form-input"
                      placeholder="Reps"
                      value={ex.reps}
                      onChange={(e) => handleUpdateExercise(idx, 'reps', e.target.value)}
                      title="Reps"
                    />
                    <span className="input-affix">reps</span>
                  </div>
                  <div className="ex-input-num">
                    <input
                      type="number"
                      step="0.5"
                      min="0"
                      className="form-input"
                      placeholder="Weight"
                      value={ex.weight}
                      onChange={(e) => handleUpdateExercise(idx, 'weight', e.target.value)}
                      title="Weight (kg)"
                    />
                    <span className="input-affix">kg</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleRemoveExercise(idx)}
                    className="btn-icon-danger ex-remove-btn"
                    title="Remove exercise"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Notes (Optional)</label>
            <textarea
              className="form-input form-textarea"
              rows="2"
              placeholder="Good intensity, focused on slow eccentric reps..."
              value={form.notes}
              onChange={(e) => setForm({ ...form, notes: e.target.value })}
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={16} />
              <span>Save Workout</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
