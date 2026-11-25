import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame,
  Dumbbell,
  Play,
  ScanBarcode,
  Plus,
  Target,
  Award,
  Calendar,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Activity
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
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
  const [showSecondary, setShowSecondary] = useState(false);

  useEffect(() => {
    if (!user) return;
    setRuns(getRuns(user.id));
    setWorkouts(getWorkouts(user.id));
    setMeals(getMeals(user.id));
    setGoals(getGoals(user.id));
  }, [user]);

  const todayStr = getLocalDateString(new Date());

  // Today's Nutrition & Calories
  const todayMeals = meals.filter((m) => m.date === todayStr);
  const todayCaloriesConsumed = todayMeals.reduce((acc, m) => acc + (Number(m.calories) || 0), 0);
  const todayProtein = todayMeals.reduce((acc, m) => acc + (Number(m.protein) || 0), 0);
  const todayCarbs = todayMeals.reduce((acc, m) => acc + (Number(m.carbs) || 0), 0);
  const todayFat = todayMeals.reduce((acc, m) => acc + (Number(m.fat) || 0), 0);
  const dailyCalorieTarget = user?.dailyCalorieTarget || 2200;
  const remainingCalories = dailyCalorieTarget - todayCaloriesConsumed;
  const caloriePercent = Math.min(100, Math.round((todayCaloriesConsumed / dailyCalorieTarget) * 100));

  // Today's Activity
  const todayRuns = runs.filter((r) => r.date === todayStr);
  const todayRunKm = todayRuns.reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
  const todayRunCals = todayRuns.reduce((acc, r) => acc + (Number(r.calories) || 0), 0);

  const todayWorkouts = workouts.filter((w) => w.date === todayStr);
  const todayWorkoutCals = todayWorkouts.reduce((acc, w) => acc + (Number(w.calories) || 0), 0);
  const todayTotalCalsBurned = todayRunCals + todayWorkoutCals;

  // 7-Day Running Total & Chart Data
  const last7DaysData = [];
  let weeklyRunKm = 0;
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateKey = getLocalDateString(d);
    const dayLabel = d.toLocaleDateString('en-US', { weekday: 'short' });

    const dayDistance = runs
      .filter((r) => r.date === dateKey)
      .reduce((acc, r) => acc + (Number(r.distance) || 0), 0);
    weeklyRunKm += dayDistance;

    last7DaysData.push({
      day: dayLabel,
      distance: parseFloat(dayDistance.toFixed(2))
    });
  }

  const hasAnyData = runs.length > 0 || workouts.length > 0 || meals.length > 0;

  return (
    <div className="clean-page">
      {/* Clean Header */}
      <div className="clean-header-bar">
        <div>
          <h2 className="clean-page-title">
            Welcome back, <span className="text-emerald-400">{user?.name || 'Athlete'}</span>
          </h2>
          <p className="clean-page-subtitle">
            Goal: <strong>{user?.fitnessGoal || 'Improve Fitness'}</strong>
          </p>
        </div>

        <div className="banner-date-badge">
          <Calendar size={15} />
          <span>{new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>
        </div>
      </div>

      {/* Essential Daily KPIs (3 balanced cards) */}
      <section className="dash-kpi-grid">
        <StatCard
          title="Calories Today"
          value={todayCaloriesConsumed}
          unit={`/ ${dailyCalorieTarget} kcal`}
          icon={Flame}
          accent="emerald"
          subtitle={
            remainingCalories >= 0
              ? `${remainingCalories} kcal remaining`
              : `${Math.abs(remainingCalories)} kcal over target`
          }
        />
        <StatCard
          title="Active Burn Today"
          value={todayTotalCalsBurned}
          unit="kcal"
          icon={Activity}
          accent="amber"
          subtitle={`${todayRunKm.toFixed(1)} km run • ${todayWorkouts.length} workout${todayWorkouts.length === 1 ? '' : 's'}`}
        />
        <StatCard
          title="Weekly Distance"
          value={weeklyRunKm.toFixed(1)}
          unit="km"
          icon={Dumbbell}
          accent="cyan"
          subtitle="Last 7 days total"
        />
      </section>

      {/* Organized Sections: Calories & Nutrition + Activity & Goals */}
      <section className="dash-sections-grid">
        {/* Section: Calories & Nutrition */}
        <div className="clean-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Calories &amp; Nutrition</h3>
              <p className="dash-card-subtitle">{todayMeals.length} meal{todayMeals.length === 1 ? '' : 's'} logged today</p>
            </div>
            <div className="flex items-center gap-2">
              <Link to="/scanner" className="btn btn-secondary btn-sm">
                <ScanBarcode size={14} />
                <span>Scan</span>
              </Link>
              <Link to="/nutrition" className="dash-link">
                Diary <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          <div className="progress-bar-wrap">
            <div className="progress-bar-header">
              <span>Daily Calorie Target</span>
              <span className="font-semibold text-emerald-400">{caloriePercent}%</span>
            </div>
            <div className="progress-track">
              <div
                className="progress-fill fill-emerald"
                style={{ width: `${caloriePercent}%` }}
              ></div>
            </div>
          </div>

          <div className="dash-macro-mini-grid">
            <div className="dash-macro-mini-box">
              <span className="dash-macro-mini-val text-cyan-400">{todayProtein.toFixed(0)}g</span>
              <span className="dash-macro-mini-label">Protein</span>
            </div>
            <div className="dash-macro-mini-box">
              <span className="dash-macro-mini-val text-amber-400">{todayCarbs.toFixed(0)}g</span>
              <span className="dash-macro-mini-label">Carbs</span>
            </div>
            <div className="dash-macro-mini-box">
              <span className="dash-macro-mini-val text-purple-400">{todayFat.toFixed(0)}g</span>
              <span className="dash-macro-mini-label">Fat</span>
            </div>
          </div>
        </div>

        {/* Section: Activity & Goals */}
        <div className="clean-card">
          <div className="dash-card-header">
            <div>
              <h3 className="dash-card-title">Activity &amp; Goals</h3>
              <p className="dash-card-subtitle">Start a session or check milestones</p>
            </div>
            <Link to="/progress" className="dash-link">
              Progress <ChevronRight size={14} />
            </Link>
          </div>

          <div className="flex items-center gap-2 mb-4" style={{ flexWrap: 'wrap' }}>
            <Link to="/running" className="btn btn-primary btn-sm">
              <Play size={14} fill="currentColor" />
              <span>Start Run</span>
            </Link>
            <Link to="/workouts" className="btn btn-secondary btn-sm">
              <Plus size={14} />
              <span>Log Workout</span>
            </Link>
          </div>

          <div className="active-goals-preview" style={{ marginTop: '0.5rem' }}>
            <div className="dash-card-header no-border pb-1">
              <span className="text-xs font-semibold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Target size={14} className="text-emerald-400" /> Top Goal
              </span>
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
              <p className="text-xs text-slate-400">
                No active goals yet. Set one in the Progress page.
              </p>
            )}
          </div>
        </div>
      </section>

      {/* Secondary Information Toggle (Trends & Recent Activity) */}
      <section className="clean-section">
        <div className="clean-section-head">
          <h3 className="clean-section-title">Trends &amp; Recent Activity</h3>
          <button
            type="button"
            className="dash-secondary-toggle"
            onClick={() => setShowSecondary((prev) => !prev)}
          >
            <span>{showSecondary ? 'Hide Details' : 'Show Weekly Chart & History'}</span>
            {showSecondary ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
          </button>
        </div>

        {showSecondary && (
          <div className="dash-sections-grid">
            <div className="clean-card">
              <div className="dash-card-header">
                <div>
                  <h4 className="dash-card-title">7-Day Running Distance</h4>
                  <p className="dash-card-subtitle">Kilometers per day</p>
                </div>
                <Link to="/running" className="dash-link">
                  Runs <ChevronRight size={14} />
                </Link>
              </div>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={last7DaysData} margin={{ top: 8, right: 8, left: -18, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                  <XAxis dataKey="day" stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis stroke="#64748b" fontSize={11} tickLine={false} axisLine={false} tickCount={4} unit=" km" />
                  <Tooltip
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#334155', borderRadius: '8px', color: '#f8fafc' }}
                    formatter={(val) => [`${val} km`, 'Distance']}
                  />
                  <Bar dataKey="distance" fill="#10b981" radius={[4, 4, 0, 0]} maxBarSize={32} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            <div className="clean-card">
              <div className="dash-card-header">
                <div>
                  <h4 className="dash-card-title">Recent Sessions</h4>
                  <p className="dash-card-subtitle">Latest runs &amp; workouts</p>
                </div>
              </div>

              {!hasAnyData ? (
                <EmptyState
                  icon={Award}
                  title="No activities yet"
                  description="Start a GPS run, log a meal, or record a workout to see your recent activity."
                  actionLabel="Start Run"
                  onAction={() => { window.location.href = '/running'; }}
                />
              ) : (
                <div className="activity-cards-list">
                  {runs.slice(0, 2).map((r) => (
                    <div key={r.id} className="activity-log-item">
                      <div className="activity-type-icon run-icon">
                        <Flame size={16} />
                      </div>
                      <div className="activity-log-details">
                        <div className="activity-log-title-row">
                          <span className="activity-name">{r.title || 'GPS Outdoor Run'}</span>
                          <span className="activity-date-badge">{formatFriendlyDate(r.date)}</span>
                        </div>
                        <div className="activity-metrics-row">
                          <span><strong>{r.distance} km</strong></span>
                          <span>•</span>
                          <span>{formatDuration(r.duration)}</span>
                          <span>•</span>
                          <span className="text-amber-400">{r.calories} kcal</span>
                        </div>
                      </div>
                    </div>
                  ))}

                  {workouts.slice(0, 2).map((w) => (
                    <div key={w.id} className="activity-log-item">
                      <div className="activity-type-icon workout-icon">
                        <Dumbbell size={16} />
                      </div>
                      <div className="activity-log-details">
                        <div className="activity-log-title-row">
                          <span className="activity-name">{w.name}</span>
                          <span className="activity-date-badge">{formatFriendlyDate(w.date)}</span>
                        </div>
                        <div className="activity-metrics-row">
                          <span><strong>{w.duration} mins</strong></span>
                          <span>•</span>
                          <span className="text-amber-400">{w.calories} kcal</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>
    </div>
  );
}
