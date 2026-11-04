import React, { useState, useEffect } from 'react';
import {
  TrendingUp,
  Weight,
  Ruler,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Flame,
  Dumbbell,
  Award,
  Sparkles,
  Calendar,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getWeights,
  saveWeight,
  deleteWeight,
  getRuns,
  getWorkouts,
  getGoals,
  saveGoal,
  updateGoal,
  deleteGoal
} from '../services/storageService';
import {
  calculateBMI,
  getLocalDateString,
  formatFriendlyDate
} from '../utils/calculations';
import Modal from '../components/common/Modal';
import StatCard from '../components/common/StatCard';

const PIE_COLORS = ['#10b981', '#06b6d4', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];

export default function Progress() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [weights, setWeights] = useState([]);
  const [runs, setRuns] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);

  // Weight Log Modal
  const [weightModalOpen, setWeightModalOpen] = useState(false);
  const [newWeight, setNewWeight] = useState(user?.weight || '');
  const [weightDate, setWeightDate] = useState(getLocalDateString(new Date()));

  // Goal Modal
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalForm, setGoalForm] = useState({
    title: '',
    category: 'Running',
    targetValue: '',
    unit: 'km',
    deadline: ''
  });

  const loadData = () => {
    if (!user?.id) return;
    setWeights(getWeights(user.id));
    setRuns(getRuns(user.id));
    setWorkouts(getWorkouts(user.id));
    setGoals(getGoals(user.id));
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Recalculate dynamic goal progress based on real records
  const processedGoals = goals.map((goal) => {
    let current = Number(goal.currentValue) || 0;

    if (goal.category === 'Running' && goal.unit.includes('km')) {
      const totalKm = runs.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
      current = parseFloat(totalKm.toFixed(1));
    } else if (goal.category === 'Workout') {
      current = workouts.length;
    } else if (goal.category === 'Weight') {
      const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : (user?.weight || 70);
      current = latestWeight;
    }

    const target = Number(goal.targetValue) || 1;
    let percent = 0;

    if (goal.category === 'Weight') {
      // For weight loss: closer to target is better
      const initial = user?.weight || 75;
      if (initial > target) {
        percent = Math.min(100, Math.max(0, Math.round(((initial - current) / (initial - target)) * 100)));
      } else {
        percent = current >= target ? 100 : Math.round((current / target) * 100);
      }
    } else {
      percent = Math.min(100, Math.round((current / target) * 100));
    }

    return {
      ...goal,
      calculatedCurrent: current,
      percent
    };
  });

  // Handle Weight Log Submit
  const handleSaveWeight = (e) => {
    e.preventDefault();
    const wt = parseFloat(newWeight);
    if (!wt || wt < 20 || wt > 300) {
      showToast('Please enter a valid weight (20 to 300 kg).', 'error');
      return;
    }

    saveWeight(user.id, {
      date: weightDate,
      weight: wt
    });

    loadData();
    setWeightModalOpen(false);
    showToast(`Logged body weight: ${wt} kg on ${weightDate}`, 'success');
  };

  // Handle Goal Submit
  const handleSaveGoal = (e) => {
    e.preventDefault();
    if (!goalForm.title.trim() || !goalForm.targetValue) {
      showToast('Please provide a goal title and target value.', 'error');
      return;
    }

    saveGoal(user.id, {
      title: goalForm.title.trim(),
      category: goalForm.category,
      targetValue: Number(goalForm.targetValue),
      unit: goalForm.unit,
      deadline: goalForm.deadline || ''
    });

    loadData();
    setGoalModalOpen(false);
    setGoalForm({
      title: '',
      category: 'Running',
      targetValue: '',
      unit: 'km',
      deadline: ''
    });

    confetti({
      particleCount: 50,
      spread: 60,
      origin: { y: 0.7 }
    });

    showToast('New fitness goal established! You got this.', 'success');
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Remove this goal?')) {
      deleteGoal(user.id, id);
      loadData();
      showToast('Goal removed.', 'info');
    }
  };

  // BMI Metrics
  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : (user?.weight || 70);
  const bmiInfo = calculateBMI(latestWeight, user?.height || 170);

  // Chart data: Weight History
  const weightChartData = weights.map((w) => ({
    date: formatFriendlyDate(w.date),
    weight: w.weight
  }));

  // Chart data: Running Distance by date
  const runChartData = runs.slice(0, 10).reverse().map((r) => ({
    date: formatFriendlyDate(r.date),
    distance: r.distance,
    pace: r.pace
  }));

  // Chart data: Workout Categories breakdown
  const workoutCategoriesMap = {};
  workouts.forEach((w) => {
    workoutCategoriesMap[w.category] = (workoutCategoriesMap[w.category] || 0) + 1;
  });
  const workoutPieData = Object.keys(workoutCategoriesMap).map((cat) => ({
    name: cat,
    value: workoutCategoriesMap[cat]
  }));

  return (
    <div className="progress-page">
      {/* Top Banner */}
      <div className="progress-header-card">
        <div className="progress-title-group">
          <div className="progress-tag">
            <TrendingUp size={16} className="text-emerald-400" />
            <span>METRIC PROGRESSION & GOALS</span>
          </div>
          <h2 className="progress-page-title">Fitness Progress HUD</h2>
          <p className="progress-page-desc">
            Monitor weight transformation, running pace progression, exercise distribution, and personal milestones.
          </p>
        </div>

        <div className="progress-header-btns">
          <button
            onClick={() => setWeightModalOpen(true)}
            className="btn btn-secondary"
          >
            <Weight size={16} />
            <span>Log Weight</span>
          </button>
          <button
            onClick={() => setGoalModalOpen(true)}
            className="btn btn-primary"
          >
            <Target size={16} />
            <span>Set New Goal</span>
          </button>
        </div>
      </div>

      {/* Overview Metric Cards Row */}
      <div className="progress-stats-grid">
        <StatCard
          title="Current Body Weight"
          value={latestWeight}
          unit="kg"
          icon={Weight}
          accent="cyan"
          subtitle={`Height: ${user?.height || 170} cm`}
        />
        <StatCard
          title="Body Mass Index (BMI)"
          value={bmiInfo.bmi}
          unit=""
          icon={Activity}
          accent="emerald"
          subtitle={bmiInfo.category}
        />
        <StatCard
          title="Total Running Distance"
          value={runs.reduce((acc, r) => acc + (Number(r.distance) || 0), 0).toFixed(1)}
          unit="km"
          icon={Flame}
          accent="amber"
          subtitle={`${runs.length} recorded runs`}
        />
        <StatCard
          title="Total Gym Sessions"
          value={workouts.length}
          unit="sessions"
          icon={Dumbbell}
          accent="purple"
          subtitle="Logged strength & cardio"
        />
      </div>

      {/* BMI Guidance Box */}
      <div className="bmi-advisory-card">
        <div className="bmi-advisory-left">
          <span className="bmi-badge" style={{ backgroundColor: `${bmiInfo.color}20`, color: bmiInfo.color }}>
            {bmiInfo.category} (BMI {bmiInfo.bmi})
          </span>
          <p className="bmi-advice-text">{bmiInfo.advice}</p>
        </div>
        <div className="bmi-scale-bar">
          <div className="bmi-scale-segment seg-under">Underweight &lt;18.5</div>
          <div className="bmi-scale-segment seg-normal">Normal 18.5-24.9</div>
          <div className="bmi-scale-segment seg-over">Overweight 25-29.9</div>
          <div className="bmi-scale-segment seg-obese">Obese 30+</div>
        </div>
      </div>

      {/* Weight History & Running Progress Charts */}
      <div className="progress-charts-grid">
        {/* Weight Evolution Chart */}
        <div className="progress-chart-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Body Weight Evolution</h3>
              <p className="dash-card-subtitle">Tracking change over time</p>
            </div>
            <button
              onClick={() => setWeightModalOpen(true)}
              className="dash-link"
            >
              + Add Entry
            </button>
          </div>

          <div className="chart-render-area">
            {weightChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={weightChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} domain={['dataMin - 1', 'dataMax + 1']} unit="kg" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val) => [`${val} kg`, 'Weight']}
                  />
                  <Line type="monotone" dataKey="weight" stroke="#06b6d4" strokeWidth={3} dot={{ fill: '#06b6d4', r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-msg">No weight data logged yet. Click '+ Add Entry' to record your weight.</div>
            )}
          </div>
        </div>

        {/* Running Progression Chart */}
        <div className="progress-chart-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Running Distance History</h3>
              <p className="dash-card-subtitle">Kilometers per running session</p>
            </div>
          </div>

          <div className="chart-render-area">
            {runChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={runChartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                  <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit=" km" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val) => [`${val} km`, 'Distance']}
                  />
                  <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="chart-empty-msg">No running records yet. Start tracking your runs on the GPS map!</div>
            )}
          </div>
        </div>
      </div>

      {/* Goal Milestones Section */}
      <div className="goals-section">
        <div className="dash-card-header mb-4">
          <div>
            <h3 className="dash-card-title">Fitness Goals & Milestones ({processedGoals.length})</h3>
            <p className="dash-card-subtitle">Real-time progress calculated from your personal saved records</p>
          </div>
          <button onClick={() => setGoalModalOpen(true)} className="btn btn-primary btn-sm">
            <Plus size={15} />
            <span>Add Goal</span>
          </button>
        </div>

        <div className="goals-grid">
          {processedGoals.map((g) => (
            <div key={g.id} className="goal-card">
              <div className="goal-card-header">
                <div className="goal-icon-wrap">
                  <Target size={18} className="text-emerald-400" />
                </div>
                <div className="goal-title-wrap">
                  <h4 className="goal-title">{g.title}</h4>
                  <span className="goal-category-tag">{g.category}</span>
                </div>
                <button
                  onClick={() => handleDeleteGoal(g.id)}
                  className="btn-icon-danger ml-auto"
                  title="Delete goal"
                >
                  <Trash2 size={15} />
                </button>
              </div>

              <div className="goal-progress-stats">
                <span className="goal-numbers">
                  <strong>{g.calculatedCurrent}</strong> / {g.targetValue} {g.unit}
                </span>
                <span className="goal-percent-badge">{g.percent}%</span>
              </div>

              <div className="progress-track">
                <div
                  className={`progress-fill ${g.percent >= 100 ? 'fill-emerald' : 'fill-cyan'}`}
                  style={{ width: `${g.percent}%` }}
                ></div>
              </div>

              {g.percent >= 100 ? (
                <div className="goal-completed-banner">
                  <Award size={15} className="text-emerald-400" />
                  <span>Goal Achieved! Outstanding work.</span>
                </div>
              ) : g.deadline ? (
                <span className="goal-deadline-text">Target Deadline: {g.deadline}</span>
              ) : null}
            </div>
          ))}
        </div>
      </div>

      {/* Weight Modal */}
      <Modal
        isOpen={weightModalOpen}
        onClose={() => setWeightModalOpen(false)}
        title="Log Body Weight"
      >
        <form onSubmit={handleSaveWeight} className="modal-form">
          <div className="form-group">
            <label className="form-label">Weight (kg) *</label>
            <input
              type="number"
              step="0.1"
              min="20"
              max="300"
              className="form-input"
              placeholder="e.g. 71.5"
              value={newWeight}
              onChange={(e) => setNewWeight(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Date *</label>
            <input
              type="date"
              className="form-input"
              value={weightDate}
              onChange={(e) => setWeightDate(e.target.value)}
              required
            />
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setWeightModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <CheckCircle2 size={16} />
              <span>Save Weight</span>
            </button>
          </div>
        </form>
      </Modal>

      {/* Goal Modal */}
      <Modal
        isOpen={goalModalOpen}
        onClose={() => setGoalModalOpen(false)}
        title="Create New Fitness Goal"
      >
        <form onSubmit={handleSaveGoal} className="modal-form">
          <div className="form-group">
            <label className="form-label">Goal Title *</label>
            <input
              type="text"
              className="form-input"
              placeholder="e.g. Run 10 km Total, Target Weight 70 kg..."
              value={goalForm.title}
              onChange={(e) => setGoalForm({ ...goalForm, title: e.target.value })}
              required
            />
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Category</label>
              <select
                className="form-input form-select"
                value={goalForm.category}
                onChange={(e) => {
                  const cat = e.target.value;
                  const unit = cat === 'Running' ? 'km' : cat === 'Weight' ? 'kg' : 'sessions';
                  setGoalForm({ ...goalForm, category: cat, unit });
                }}
              >
                <option value="Running">Running</option>
                <option value="Workout">Workout Sessions</option>
                <option value="Weight">Target Weight</option>
                <option value="Nutrition">Nutrition</option>
              </select>
            </div>

            <div className="form-group">
              <label className="form-label">Target Value *</label>
              <input
                type="number"
                step="0.1"
                min="0.1"
                className="form-input"
                placeholder="e.g. 10"
                value={goalForm.targetValue}
                onChange={(e) => setGoalForm({ ...goalForm, targetValue: e.target.value })}
                required
              />
            </div>
          </div>

          <div className="form-row-two">
            <div className="form-group">
              <label className="form-label">Unit</label>
              <input
                type="text"
                className="form-input"
                value={goalForm.unit}
                onChange={(e) => setGoalForm({ ...goalForm, unit: e.target.value })}
                placeholder="km, kg, sessions"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label">Target Date (Optional)</label>
              <input
                type="date"
                className="form-input"
                value={goalForm.deadline}
                onChange={(e) => setGoalForm({ ...goalForm, deadline: e.target.value })}
              />
            </div>
          </div>

          <div className="modal-actions">
            <button
              type="button"
              onClick={() => setGoalModalOpen(false)}
              className="btn btn-secondary"
            >
              Cancel
            </button>
            <button type="submit" className="btn btn-primary">
              <Sparkles size={16} />
              <span>Create Goal</span>
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
