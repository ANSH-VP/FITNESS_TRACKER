import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Dumbbell,
  UtensilsCrossed,
  Timer,
  Activity,
  Play,
  ScanBarcode,
  Plus,
  TrendingUp,
  Target,
  Award,
  Calendar,
  ChevronRight,
  Sparkles
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  CartesianGrid
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import {
  getRuns,
  getWorkouts,
  getMeals,
  getGoals
} from '../services/storageService';
import {
  formatDuration,
  getLocalDateString,
  formatFriendlyDate
} from '../utils/calculations';
import StatCard from '../components/common/StatCard';
import EmptyState from '../components/common/EmptyState';

export default function Dashboard() {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [goals, setGoals] = useState([]);

  useEffect(() => {
    if (!user) return;
    setRuns(getRuns(user.id));
    setWorkouts(getWorkouts(user.id));
    setMeals(getMeals(user.id));
    setGoals(getGoals(user.id));
  }, [user]);

  const todayStr = getLocalDateString(new Date());

  // Calculations for Today
  const todayMeals = meals.filter((m) => m.date === todayStr);
  const todayCaloriesConsumed = todayMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const dailyCalorieTarget = user?.dailyCalorieTarget || 2200;
  const caloriePercent = Math.min(100, Math.round((todayCaloriesConsumed / dailyCalorieTarget) * 100));

  const todayRuns = runs.filter((r) => r.date === todayStr);
  const todayRunKm = todayRuns.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
  const todayRunCals = todayRuns.reduce((acc, r) => acc + (Number(r.calories) || 0), 0);

  const todayWorkouts = workouts.filter((w) => w.date === todayStr);
  const todayWorkoutCals = todayWorkouts.reduce((acc, w) => acc + (Number(w.calories) || 0), 0);
  const todayTotalCalsBurned = todayRunCals + todayWorkoutCals;

  // Lifetime Totals
  const totalDistanceKm = runs.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
  const totalRunSeconds = runs.reduce((acc, r) => acc + (Number(r.duration) || 0), 0);
  const totalRunSessions = runs.length;
  const totalWorkoutSessions = workouts.length;
  const totalBurnedCalories =
    runs.reduce((acc, r) => acc + (Number(r.calories) || 0), 0) +
    workouts.reduce((acc, w) => acc + (Number(w.calories) || 0), 0);

  // Generate 7-day trend chart data for running distance & calories
  const last7DaysData = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateString(d);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayRuns = runs.filter((r) => r.date === dateKey);
    const dayDistance = dayRuns.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);

    const dayMeals = meals.filter((m) => m.date === dateKey);
    const dayCals = dayMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);

    last7DaysData.push({
      date: dateKey,
      day: dayLabel,
      distance: parseFloat(dayDistance.toFixed(2)),
      calories: dayCals,
      target: dailyCalorieTarget
    });
  }

  const hasAnyData = runs.length > 0 || workouts.length > 0 || meals.length > 0;

  return (
    <div className="dashboard-page">
      {/* Welcome Banner */}
      <section className="dashboard-welcome-banner">
        <div className="banner-text">
          <div className="welcome-tag">
            <Sparkles size={14} className="text-emerald-400" />
            <span>ATHLETE DASHBOARD</span>
          </div>
          <h2 className="welcome-heading">
            Welcome back, <span className="highlight-text">{user?.name || 'Athlete'}</span>!
          </h2>
          <p className="welcome-subtext">
            Current Objective:{' '}
            <strong className="text-emerald-400">{user?.fitnessGoal || 'Improve Fitness'}</strong>
            {' '}• Let’s crush today’s physical targets.
          </p>
        </div>

        <div className="banner-date-badge">
          <Calendar size={16} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric', year: 'numeric' })}</span>
        </div>
      </section>

      {/* Quick Action Bar */}
      <section className="quick-actions-bar">
        <Link to="/running" className="action-pill pill-run">
          <div className="pill-icon-wrap"><Play size={16} fill="currentColor" /></div>
          <span>Start GPS Run</span>
        </Link>
        <Link to="/scanner" className="action-pill pill-scanner">
          <div className="pill-icon-wrap"><ScanBarcode size={16} /></div>
          <span>Scan Food Barcode</span>
        </Link>
        <Link to="/nutrition" className="action-pill pill-meal">
          <div className="pill-icon-wrap"><Plus size={16} /></div>
          <span>Log Daily Meal</span>
        </Link>
        <Link to="/workouts" className="action-pill pill-workout">
          <div className="pill-icon-wrap"><Dumbbell size={16} /></div>
          <span>Record Workout</span>
        </Link>
        <Link to="/progress" className="action-pill pill-progress">
          <div className="pill-icon-wrap"><TrendingUp size={16} /></div>
          <span>View Progress</span>
        </Link>
      </section>

      {/* Stats Cards Row */}
      <section className="stat-cards-grid">
        <StatCard
          title="Total Running Distance"
          value={totalDistanceKm.toFixed(1)}
          unit="km"
          icon={Flame}
          accent="emerald"
          subtitle={`${totalRunSessions} total running session${totalRunSessions === 1 ? '' : 's'}`}
        />
        <StatCard
          title="Total Running Time"
          value={formatDuration(totalRunSeconds)}
          unit=""
          icon={Timer}
          accent="cyan"
          subtitle="Hours, minutes & seconds logged"
        />
        <StatCard
          title="Calories Burned"
          value={totalBurnedCalories.toLocaleString()}
          unit="kcal"
          icon={Activity}
          accent="amber"
          subtitle={`Today: ${todayTotalCalsBurned} kcal burned`}
        />
        <StatCard
          title="Workout Sessions"
          value={totalWorkoutSessions}
          unit="sessions"
          icon={Dumbbell}
          accent="purple"
          subtitle={`Today: ${todayWorkouts.length} workout completed`}
        />
      </section>

      {/* Today's Daily Summary Ring & Macro Progress */}
      <section className="dashboard-grid-two">
        {/* Card 1: Today's Nutrition & Calorie Budget */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Today's Calorie Balance</h3>
              <p className="dash-card-subtitle">Intake vs. Daily Target ({dailyCalorieTarget} kcal)</p>
            </div>
            <Link to="/nutrition" className="dash-link">
              Diary <ChevronRight size={14} />
            </Link>
          </div>

          <div className="calorie-summary-box">
            <div className="calorie-metric-col">
              <span className="cal-sub">Consumed</span>
              <span className="cal-val text-emerald-400">{todayCaloriesConsumed}</span>
              <span className="cal-unit">kcal</span>
            </div>
            <div className="calorie-divider">/</div>
            <div className="calorie-metric-col">
              <span className="cal-sub">Daily Goal</span>
              <span className="cal-val">{dailyCalorieTarget}</span>
              <span className="cal-unit">kcal</span>
            </div>
            <div className="calorie-divider">=</div>
            <div className="calorie-metric-col">
              <span className="cal-sub">Remaining</span>
              <span className={`cal-val ${dailyCalorieTarget - todayCaloriesConsumed < 0 ? 'text-amber-400' : 'text-slate-300'}`}>
                {dailyCalorieTarget - todayCaloriesConsumed}
              </span>
              <span className="cal-unit">kcal</span>
            </div>
          </div>

          <div className="progress-bar-wrap">
            <div className="progress-bar-header">
              <span>Goal Completion</span>
              <span className="font-semibold text-emerald-400">{caloriePercent}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill fill-emerald"
                style={{ width: `${caloriePercent}%` }}
              ></div>
            </div>
          </div>

          <div className="today-macros-row">
            <div className="macro-chip">
              <span className="macro-chip-label">Meals Logged</span>
              <span className="macro-chip-val">{todayMeals.length}</span>
            </div>
            <div className="macro-chip">
              <span className="macro-chip-label">Burned in Activity</span>
              <span className="macro-chip-val text-amber-400">{todayTotalCalsBurned} kcal</span>
            </div>
          </div>
        </div>

        {/* Card 2: Today's Physical Activity */}
        <div className="dash-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Today's Physical Activity</h3>
              <p className="dash-card-subtitle">GPS Runs & Gym Sessions</p>
            </div>
            <Link to="/running" className="dash-link">
              Track <ChevronRight size={14} />
            </Link>
          </div>

          <div className="daily-activity-summary-grid">
            <div className="activity-mini-stat">
              <div className="mini-stat-icon-wrap icon-emerald">
                <Flame size={20} />
              </div>
              <div className="mini-stat-info">
                <span className="mini-stat-val">{todayRunKm.toFixed(2)} km</span>
                <span className="mini-stat-label">Running Distance</span>
              </div>
            </div>

            <div className="activity-mini-stat">
              <div className="mini-stat-icon-wrap icon-purple">
                <Dumbbell size={20} />
              </div>
              <div className="mini-stat-info">
                <span className="mini-stat-val">{todayWorkouts.length}</span>
                <span className="mini-stat-label">Workout Sessions</span>
              </div>
            </div>
          </div>

          {/* Goal Milestones Snippet */}
          <div className="active-goals-preview">
            <div className="dash-card-header no-border pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Target size={14} className="text-emerald-400" /> Active Milestone
              </span>
              <Link to="/progress" className="text-xs text-emerald-400 hover:underline">
                All Goals
              </Link>
            </div>
            {goals.length > 0 ? (
              <div className="goal-preview-item">
                <div className="goal-preview-info">
                  <span className="goal-preview-title">{goals[0].title}</span>
                  <span className="goal-preview-val">
                    {goals[0].currentValue} / {goals[0].targetValue} {goals[0].unit}
                  </span>
                </div>
                <div className="progress-track sm">
                  <div
                    className="progress-fill fill-cyan"
                    style={{
                      width: `${Math.min(100, Math.round(((goals[0].currentValue || 0) / (goals[0].targetValue || 1)) * 100))}%`
                    }}
                  ></div>
                </div>
              </div>
            ) : (
              <p className="text-xs text-slate-400">No active goals yet. Create one in Progress Tracking!</p>
            )}
          </div>
        </div>
      </section>

      {/* Visual Progress Charts */}
      <section className="dashboard-charts-row">
        {/* Weekly Running Distance Chart */}
        <div className="dash-chart-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Weekly Running Distance</h3>
              <p className="dash-card-subtitle">Last 7 days mileage (km)</p>
            </div>
            <Link to="/running" className="dash-link">
              GPS History <ChevronRight size={14} />
            </Link>
          </div>

          <div className="chart-render-area">
            <ResponsiveContainer width="100%" height={230}>
              <BarChart data={last7DaysData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} unit=" km" />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${val} km`, 'Distance']}
                />
                <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 7-Day Calorie Intake Chart */}
        <div className="dash-chart-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Caloric Intake Trend</h3>
              <p className="dash-card-subtitle">Daily calories consumed vs daily target</p>
            </div>
            <Link to="/nutrition" className="dash-link">
              Nutrition Diary <ChevronRight size={14} />
            </Link>
          </div>

          <div className="chart-render-area">
            <ResponsiveContainer width="100%" height={230}>
              <AreaChart data={last7DaysData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                <defs>
                  <linearGradient id="calGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#06b6d4" stopOpacity={0.8}/>
                    <stop offset="95%" stopColor="#06b6d4" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#334155" opacity={0.5} />
                <XAxis dataKey="day" stroke="#94a3b8" fontSize={12} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} />
                <Tooltip
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                  formatter={(val) => [`${val} kcal`, 'Calories']}
                />
                <Area type="monotone" dataKey="calories" stroke="#06b6d4" fillOpacity={1} fill="url(#calGradient)" strokeWidth={2} />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </section>

      {/* Recent Activity Log & Empty State check */}
      <section className="recent-activity-section">
        <div className="dash-card-header mb-4">
          <div>
            <h3 className="dash-card-title">Recent Athlete Activities</h3>
            <p className="dash-card-subtitle">Your latest logged runs and gym workouts</p>
          </div>
        </div>

        {!hasAnyData ? (
          <EmptyState
            icon={Award}
            title="Your fitness journey begins right here!"
            description="You don't have any recorded fitness activities yet. Start a GPS run, log your first meal, or record a workout to see live stats and progress charts."
            actionLabel="Start First GPS Run"
            onAction={() => window.location.href = '/running'}
          />
        ) : (
          <div className="activity-cards-list">
            {runs.slice(0, 3).map((r) => (
              <div key={r.id} className="activity-log-item">
                <div className="activity-type-icon run-icon">
                  <Flame size={18} />
                </div>
                <div className="activity-log-details">
                  <div className="activity-log-title-row">
                    <span className="activity-name">{r.title || 'GPS Outdoor Run'}</span>
                    <span className="activity-date-badge">{formatFriendlyDate(r.date)}</span>
                  </div>
                  <div className="activity-metrics-row">
                    <span><strong>{r.distance} km</strong></span>
                    <span>•</span>
                    <span>Pace: {r.pace || '--:--'}</span>
                    <span>•</span>
                    <span>Time: {formatDuration(r.duration)}</span>
                    <span>•</span>
                    <span className="text-amber-400">{r.calories} kcal</span>
                  </div>
                </div>
              </div>
            ))}

            {workouts.slice(0, 3).map((w) => (
              <div key={w.id} className="activity-log-item">
                <div className="activity-type-icon workout-icon">
                  <Dumbbell size={18} />
                </div>
                <div className="activity-log-details">
                  <div className="activity-log-title-row">
                    <span className="activity-name">{w.name} ({w.category})</span>
                    <span className="activity-date-badge">{formatFriendlyDate(w.date)}</span>
                  </div>
                  <div className="activity-metrics-row">
                    <span><strong>{w.duration} mins</strong></span>
                    <span>•</span>
                    <span className="text-amber-400">{w.calories} kcal</span>
                    {w.exercises && w.exercises.length > 0 && (
                      <>
                        <span>•</span>
                        <span>{w.exercises.length} exercise{w.exercises.length === 1 ? '' : 's'}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
