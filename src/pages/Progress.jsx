import React, { useState, useEffect, useMemo } from 'react';
import {
  Weight,
  Target,
  Plus,
  Trash2,
  CheckCircle2,
  Award,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
  Minus
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
  Bar
} from 'recharts';
import confetti from 'canvas-confetti';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import {
  getWeights,
  saveWeight,
  getRuns,
  getWorkouts,
  getGoals,
  saveGoal,
  deleteGoal
} from '../services/storageService';
import {
  calculateBMI,
  getLocalDateString
} from '../utils/calculations';
import Modal from '../components/common/Modal';

function formatShortDay(dateObj) {
  return dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

function getDateDaysAgo(daysAgo) {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d;
}

function TrendBadge({ delta, unit, lowerIsBetter = false, emptyText = 'No prior data' }) {
  if (delta === null || delta === undefined || Number.isNaN(delta)) {
    return (
      <span className="trend-pill neutral">
        <Minus size={13} />
        <span>{emptyText}</span>
      </span>
    );
  }

  if (Math.abs(delta) < 0.05) {
    return (
      <span className="trend-pill neutral">
        <Minus size={13} />
        <span>No change</span>
      </span>
    );
  }

  const isUp = delta > 0;
  const isGood = lowerIsBetter ? !isUp : isUp;
  const sign = isUp ? '+' : '';
  const formatted = Number.isInteger(delta) ? delta : delta.toFixed(1);

  return (
    <span className={`trend-pill ${isGood ? 'positive' : 'negative'}`}>
      {isUp ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
      <span>{`${sign}${formatted} ${unit} vs prev`}</span>
    </span>
  );
}

export default function Progress() {
  const { user } = useAuth();
  const { showToast } = useToast();

  const [weights, setWeights] = useState([]);
  const [runs, setRuns] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [goals, setGoals] = useState([]);
  const [timeframe, setTimeframe] = useState('weekly'); // 'weekly' | 'monthly'

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

  const periodDays = timeframe === 'weekly' ? 7 : 30;

  // 1. Weight Chart & Period Comparison
  const weightMetrics = useMemo(() => {
    const startCurrent = getLocalDateString(getDateDaysAgo(periodDays - 1));
    const startPrev = getLocalDateString(getDateDaysAgo(periodDays * 2 - 1));

    const currentEntries = weights.filter((w) => w.date >= startCurrent);
    const prevEntries = weights.filter((w) => w.date >= startPrev && w.date < startCurrent);

    const chartData = (currentEntries.length > 0 ? currentEntries : weights.slice(-periodDays)).map((w) => ({
      label: formatShortDay(new Date(`${w.date}T00:00:00`)),
      weight: Number(w.weight)
    }));

    const latest = weights.length > 0 ? Number(weights[weights.length - 1].weight) : (user?.weight || null);
    let delta = null;
    if (currentEntries.length > 0 && prevEntries.length > 0) {
      const avgCurr = currentEntries.reduce((s, w) => s + Number(w.weight), 0) / currentEntries.length;
      const avgPrev = prevEntries.reduce((s, w) => s + Number(w.weight), 0) / prevEntries.length;
      delta = avgCurr - avgPrev;
    } else if (weights.length >= 2) {
      delta = Number(weights[weights.length - 1].weight) - Number(weights[weights.length - 2].weight);
    }

    return { chartData, latest, delta };
  }, [weights, periodDays, user]);

  // 2. Running Distance Chart & Period Comparison
  const runningMetrics = useMemo(() => {
    const buckets = [];
    if (timeframe === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = getDateDaysAgo(i);
        const key = getLocalDateString(d);
        const dayKm = runs
          .filter((r) => r.date === key)
          .reduce((sum, r) => sum + (Number(r.distance) || 0), 0);
        buckets.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          distance: parseFloat(dayKm.toFixed(2))
        });
      }
    } else {
      // 4 weekly buckets covering the last 28 days
      for (let w = 3; w >= 0; w--) {
        const start = getLocalDateString(getDateDaysAgo(w * 7 + 6));
        const end = getLocalDateString(getDateDaysAgo(w * 7));
        const weekKm = runs
          .filter((r) => r.date >= start && r.date <= end)
          .reduce((sum, r) => sum + (Number(r.distance) || 0), 0);
        buckets.push({
          label: formatShortDay(getDateDaysAgo(w * 7 + 6)),
          distance: parseFloat(weekKm.toFixed(2))
        });
      }
    }

    const currStart = getLocalDateString(getDateDaysAgo(periodDays - 1));
    const prevStart = getLocalDateString(getDateDaysAgo(periodDays * 2 - 1));

    const currentTotal = runs
      .filter((r) => r.date >= currStart)
      .reduce((sum, r) => sum + (Number(r.distance) || 0), 0);
    const prevTotal = runs
      .filter((r) => r.date >= prevStart && r.date < currStart)
      .reduce((sum, r) => sum + (Number(r.distance) || 0), 0);

    const latestRunKm = runs.length > 0 ? Number(runs[0].distance) || 0 : 0;
    const delta = prevTotal > 0 || currentTotal > 0 ? currentTotal - prevTotal : null;

    return {
      chartData: buckets,
      currentTotal: parseFloat(currentTotal.toFixed(1)),
      latestRunKm: parseFloat(latestRunKm.toFixed(1)),
      delta
    };
  }, [runs, timeframe, periodDays]);

  // 3. Workout Activity Chart & Period Comparison
  const workoutMetrics = useMemo(() => {
    const buckets = [];
    if (timeframe === 'weekly') {
      for (let i = 6; i >= 0; i--) {
        const d = getDateDaysAgo(i);
        const key = getLocalDateString(d);
        const dayMins = workouts
          .filter((w) => w.date === key)
          .reduce((sum, w) => sum + (Number(w.duration) || 0), 0);
        buckets.push({
          label: d.toLocaleDateString('en-US', { weekday: 'short' }),
          minutes: Math.round(dayMins)
        });
      }
    } else {
      for (let w = 3; w >= 0; w--) {
        const start = getLocalDateString(getDateDaysAgo(w * 7 + 6));
        const end = getLocalDateString(getDateDaysAgo(w * 7));
        const weekMins = workouts
          .filter((wk) => wk.date >= start && wk.date <= end)
          .reduce((sum, wk) => sum + (Number(wk.duration) || 0), 0);
        buckets.push({
          label: formatShortDay(getDateDaysAgo(w * 7 + 6)),
          minutes: Math.round(weekMins)
        });
      }
    }

    const currStart = getLocalDateString(getDateDaysAgo(periodDays - 1));
    const prevStart = getLocalDateString(getDateDaysAgo(periodDays * 2 - 1));

    const currentSessions = workouts.filter((w) => w.date >= currStart);
    const prevSessions = workouts.filter((w) => w.date >= prevStart && w.date < currStart);

    const currentMins = currentSessions.reduce((sum, w) => sum + (Number(w.duration) || 0), 0);
    const prevMins = prevSessions.reduce((sum, w) => sum + (Number(w.duration) || 0), 0);

    const latestDuration = workouts.length > 0 ? Number(workouts[0].duration) || 0 : 0;
    const delta = prevMins > 0 || currentMins > 0 ? currentMins - prevMins : null;

    return {
      chartData: buckets,
      currentCount: currentSessions.length,
      currentMins,
      latestDuration,
      delta
    };
  }, [workouts, timeframe, periodDays]);

  // Recalculate dynamic goal progress based on real records
  const processedGoals = goals.map((goal) => {
    let current = Number(goal.currentValue) || 0;

    if (goal.category === 'Running' && goal.unit.includes('km')) {
      const totalKm = runs.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
      current = parseFloat(totalKm.toFixed(1));
    } else if (goal.category === 'Workout') {
      current = workouts.length;
    } else if (goal.category === 'Weight') {
      const latestW = weights.length > 0 ? weights[weights.length - 1].weight : (user?.weight || 70);
      current = latestW;
    }

    const target = Number(goal.targetValue) || 1;
    let percent = 0;

    if (goal.category === 'Weight') {
      const initial = user?.weight || 75;
      if (initial > target) {
        percent = Math.min(100, Math.max(0, Math.round(((initial - current) / (initial - target)) * 100)));
      } else {
        percent = current >= target ? 100 : Math.round((current / target) * 100);
      }
    } else {
      percent = Math.min(100, Math.round((current / target) * 100));
    }

    return { ...goal, calculatedCurrent: current, percent };
  });

  const handleSaveWeight = (e) => {
    e.preventDefault();
    const wt = parseFloat(newWeight);
    if (!wt || wt < 20 || wt > 300) {
      showToast('Please enter a valid weight (20 to 300 kg).', 'error');
      return;
    }

    saveWeight(user.id, { date: weightDate, weight: wt });
    loadData();
    setWeightModalOpen(false);
    showToast(`Logged body weight: ${wt} kg on ${weightDate}`, 'success');
  };

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

    confetti({ particleCount: 50, spread: 60, origin: { y: 0.7 } });
    showToast('New fitness goal established!', 'success');
  };

  const handleDeleteGoal = (id) => {
    if (window.confirm('Remove this goal?')) {
      deleteGoal(user.id, id);
      loadData();
      showToast('Goal removed.', 'info');
    }
  };

  const latestWeight = weights.length > 0 ? weights[weights.length - 1].weight : (user?.weight || 70);
  const bmiInfo = calculateBMI(latestWeight, user?.height || 170);

  return (
    <div className="clean-page">
      {/* Header & Weekly / Monthly Filter */}
      <div className="clean-header-bar">
        <div>
          <h2 className="clean-page-title">Progress &amp; Trends</h2>
          <p className="clean-page-subtitle">
            Clear breakdown of your weight, running distance, and workout activity.
          </p>
        </div>

        <div className="flex items-center gap-2" style={{ flexWrap: 'wrap' }}>
          <div className="segmented-toggle" role="group" aria-label="Timeframe filter">
            <button
              type="button"
              className={`segmented-btn ${timeframe === 'weekly' ? 'active' : ''}`}
              onClick={() => setTimeframe('weekly')}
            >
              Weekly
            </button>
            <button
              type="button"
              className={`segmented-btn ${timeframe === 'monthly' ? 'active' : ''}`}
              onClick={() => setTimeframe('monthly')}
            >
              Monthly
            </button>
          </div>

          <button onClick={() => setWeightModalOpen(true)} className="btn btn-secondary btn-sm">
            <Weight size={15} />
            <span>Log Weight</span>
          </button>
          <button onClick={() => setGoalModalOpen(true)} className="btn btn-primary btn-sm">
            <Target size={15} />
            <span>New Goal</span>
          </button>
        </div>
      </div>

      {/* Three Separate, Clearly Labelled Charts */}
      <section className="progress-charts-stack">
        {/* Chart 1: Body Weight */}
        <div className="clean-card">
          <div className="progress-chart-header">
            <div>
              <h3 className="dash-card-title">Body Weight (kg)</h3>
              <div className="progress-latest-value">
                {weightMetrics.latest !== null ? weightMetrics.latest : '--'}
                <span className="progress-latest-unit">kg latest</span>
              </div>
            </div>
            <TrendBadge
              delta={weightMetrics.delta}
              unit="kg"
              lowerIsBetter={true}
              emptyText="Log 2+ weights"
            />
          </div>

          {weightMetrics.chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <LineChart data={weightMetrics.chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis
                  stroke="#64748b"
                  fontSize={11}
                  tickLine={false}
                  axisLine={false}
                  tickCount={4}
                  domain={['dataMin - 1', 'dataMax + 1']}
                  unit=" kg"
                />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${val} kg`, 'Weight']}
                />
                <Line
                  type="monotone"
                  dataKey="weight"
                  stroke="#06b6d4"
                  strokeWidth={2.5}
                  dot={{ fill: '#06b6d4', r: 4 }}
                  activeDot={{ r: 6 }}
                />
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty-msg">No weight entries yet. Click &ldquo;Log Weight&rdquo; to start tracking.</div>
          )}

          <p className="chart-explanation">
            Current BMI is <strong>{bmiInfo.bmi}</strong> ({bmiInfo.category}).{' '}
            {weightMetrics.delta === null
              ? 'Log weight regularly to track trends between periods.'
              : weightMetrics.delta < 0
                ? `Down ${Math.abs(weightMetrics.delta).toFixed(1)} kg compared with the previous period.`
                : `Up ${weightMetrics.delta.toFixed(1)} kg compared with the previous period.`}
          </p>
        </div>

        {/* Chart 2: Running Distance */}
        <div className="clean-card">
          <div className="progress-chart-header">
            <div>
              <h3 className="dash-card-title">Running Distance (km)</h3>
              <div className="progress-latest-value">
                {runningMetrics.latestRunKm}
                <span className="progress-latest-unit">km latest run</span>
              </div>
            </div>
            <TrendBadge delta={runningMetrics.delta} unit="km" />
          </div>

          {runs.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={runningMetrics.chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickCount={4} unit=" km" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${val} km`, 'Distance']}
                />
                <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty-msg">No runs recorded yet. Start a GPS run to see your distance chart.</div>
          )}

          <p className="chart-explanation">
            Total of <strong>{runningMetrics.currentTotal} km</strong> logged in the selected{' '}
            {timeframe === 'weekly' ? '7-day' : '30-day'} window.
          </p>
        </div>

        {/* Chart 3: Workout Activity */}
        <div className="clean-card">
          <div className="progress-chart-header">
            <div>
              <h3 className="dash-card-title">Workout Activity (mins)</h3>
              <div className="progress-latest-value">
                {workoutMetrics.latestDuration}
                <span className="progress-latest-unit">mins latest</span>
              </div>
            </div>
            <TrendBadge delta={workoutMetrics.delta} unit="mins" />
          </div>

          {workouts.length > 0 ? (
            <ResponsiveContainer width="100%" height={210}>
              <BarChart data={workoutMetrics.chartData} margin={{ top: 8, right: 8, left: -16, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                <XAxis dataKey="label" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickCount={4} unit="m" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${val} mins`, 'Duration']}
                />
                <Bar dataKey="minutes" fill="#8b5cf6" radius={[4, 4, 0, 0]} maxBarSize={36} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <div className="chart-empty-msg">No gym or strength workouts logged yet.</div>
          )}

          <p className="chart-explanation">
            Completed <strong>{workoutMetrics.currentCount}</strong> session
            {workoutMetrics.currentCount === 1 ? '' : 's'} ({workoutMetrics.currentMins} mins total) this{' '}
            {timeframe === 'weekly' ? 'week' : 'month'}.
          </p>
        </div>
      </section>

      {/* Goal Milestones Section */}
      <section className="clean-section">
        <div className="clean-section-head">
          <div>
            <h3 className="clean-section-title">Fitness Goals ({processedGoals.length})</h3>
            <p className="clean-page-subtitle">Calculated automatically from your logged activities.</p>
          </div>
          <button onClick={() => setGoalModalOpen(true)} className="btn btn-secondary btn-sm">
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
                  <span>Goal achieved!</span>
                </div>
              ) : g.deadline ? (
                <span className="goal-deadline-text">Target Date: {g.deadline}</span>
              ) : null}
            </div>
          ))}
        </div>
      </section>

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
