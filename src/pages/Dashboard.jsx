import React, { useState, useEffect, useMemo } from 'react';
import { Link } from 'react-router-dom';
import {
  Flame, Dumbbell, Play, ScanBarcode, Plus, Target, Award,
  ChevronRight, Activity, Zap, TrendingUp, Calendar, Trophy, Star
} from 'lucide-react';
import {
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid, Cell
} from 'recharts';
import { useAuth } from '../context/AuthContext';
import { getRuns, getWorkouts, getMeals, getGoals } from '../services/storageService';
import { formatDuration, getLocalDateString, formatFriendlyDate } from '../utils/calculations';

/* ── helpers ── */
function getHourGreeting() {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 17) return 'Good afternoon';
  return 'Good evening';
}

function computeStreak(runs, workouts) {
  const activeDays = new Set();
  [...runs, ...workouts].forEach((e) => {
    const d = e.date || (e.createdAt ? e.createdAt.split('T')[0] : null);
    if (d) activeDays.add(d);
  });
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (activeDays.has(key)) streak++;
    else if (i > 0) break;
  }
  return streak;
}

/* ── SVG ring ── */
function GoalRing({ percent, label, value, color = '#B7F34A' }) {
  const r = 54;
  const circ = 2 * Math.PI * r;
  const dash = circ * Math.min(1, percent / 100);
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
      <svg width="130" height="130" viewBox="0 0 130 130">
        <circle cx="65" cy="65" r={r} fill="none" stroke="#233150" strokeWidth="10" />
        <circle
          cx="65" cy="65" r={r} fill="none"
          stroke={color} strokeWidth="10"
          strokeDasharray={`${dash} ${circ}`}
          strokeLinecap="round"
          transform="rotate(-90 65 65)"
          style={{ transition: 'stroke-dasharray 0.6s ease' }}
        />
        <text x="65" y="60" textAnchor="middle" fill="#F4F7F2" fontSize="22" fontWeight="700" fontFamily="Manrope">{value}</text>
        <text x="65" y="78" textAnchor="middle" fill="#AAB6C5" fontSize="11" fontFamily="Manrope">kcal</text>
      </svg>
      <span style={{ fontSize: '0.78rem', color: '#AAB6C5', fontWeight: 600 }}>{label}</span>
    </div>
  );
}

/* ── Custom Tooltip ── */
function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#1B2940', border: '1px solid #233150', borderRadius: 10, padding: '10px 14px' }}>
      <p style={{ color: '#AAB6C5', fontSize: '0.78rem', marginBottom: 4 }}>{label}</p>
      {payload.map((p, i) => (
        <p key={i} style={{ color: p.color || '#B7F34A', fontWeight: 700, fontSize: '0.9rem' }}>
          {p.name}: {typeof p.value === 'number' ? p.value.toFixed(p.name === 'km' ? 1 : 0) : p.value} {p.unit || ''}
        </p>
      ))}
    </div>
  );
}

export default function Dashboard() {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [meals, setMeals] = useState([]);
  const [goals, setGoals] = useState([]);
  const [showDetails, setShowDetails] = useState(false);

  useEffect(() => {
    if (!user) return;
    setRuns(getRuns(user.id));
    setWorkouts(getWorkouts(user.id));
    setMeals(getMeals(user.id));
    setGoals(getGoals(user.id));
  }, [user]);

  const todayStr = getLocalDateString(new Date());

  /* ── Today ── */
  const todayMeals = meals.filter((m) => m.date === todayStr);
  const todayCalIn = todayMeals.reduce((s, m) => s + (Number(m.calories) || 0), 0);
  const dailyTarget = user?.dailyCalorieTarget || 2200;
  const calPercent = Math.min(100, Math.round((todayCalIn / dailyTarget) * 100));

  const todayRuns = runs.filter((r) => r.date === todayStr);
  const todayWorkouts = workouts.filter((w) => w.date === todayStr);
  const todayCalBurned = [
    ...todayRuns.map((r) => Number(r.calories) || 0),
    ...todayWorkouts.map((w) => Number(w.calories) || 0),
  ].reduce((s, v) => s + v, 0);
  const todayRunKm = todayRuns.reduce((s, r) => s + (Number(r.distance) || 0), 0);
  const todayWorkoutMins = todayWorkouts.reduce((s, w) => s + (Number(w.duration) || 0), 0);

  /* ── Streak ── */
  const streak = useMemo(() => computeStreak(runs, workouts), [runs, workouts]);

  /* ── Weekly chart data (last 7 days) ── */
  const weeklyData = useMemo(() => {
    return Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      const key = d.toISOString().split('T')[0];
      const label = d.toLocaleDateString('en-US', { weekday: 'short' });
      const dayRuns = runs.filter((r) => r.date === key);
      const dayWo = workouts.filter((w) => w.date === key);
      const km = dayRuns.reduce((s, r) => s + (Number(r.distance) || 0), 0);
      const calsBurned = [...dayRuns, ...dayWo].reduce((s, e) => s + (Number(e.calories) || 0), 0);
      return { label, km: parseFloat(km.toFixed(1)), cals: calsBurned, active: km > 0 || calsBurned > 0 };
    });
  }, [runs, workouts]);

  /* ── Recent activity ── */
  const recentActivity = useMemo(() => {
    const all = [
      ...runs.slice(0, 5).map((r) => ({
        id: r.id, type: 'run', title: r.title || 'Outdoor Run',
        sub: `${r.distance} km · ${formatDuration(r.duration)}`,
        date: r.date, icon: 'run', cals: r.calories
      })),
      ...workouts.slice(0, 5).map((w) => ({
        id: w.id, type: 'workout', title: w.name,
        sub: `${w.duration} min · ${w.category}`,
        date: w.date, icon: 'workout', cals: w.calories
      }))
    ];
    all.sort((a, b) => new Date(b.date) - new Date(a.date));
    return all.slice(0, 6);
  }, [runs, workouts]);

  /* ── Goals progress ── */
  const activeGoals = goals.filter((g) => g.status !== 'Completed').slice(0, 3);

  /* ── Top KPI cards ── */
  const kpis = [
    {
      icon: <Flame size={22} />,
      label: 'Calories In',
      value: todayCalIn,
      unit: 'kcal',
      sub: `${calPercent}% of ${dailyTarget} target`,
      color: '#F3A64A',
      bg: 'rgba(243,166,74,0.1)'
    },
    {
      icon: <Zap size={22} />,
      label: 'Calories Burned',
      value: todayCalBurned,
      unit: 'kcal',
      sub: 'Runs + workouts today',
      color: '#B7F34A',
      bg: 'rgba(183,243,74,0.1)'
    },
    {
      icon: <Activity size={22} />,
      label: 'Distance Today',
      value: todayRunKm.toFixed(1),
      unit: 'km',
      sub: `${todayRuns.length} run${todayRuns.length !== 1 ? 's' : ''} logged`,
      color: '#36C99A',
      bg: 'rgba(54,201,154,0.1)'
    },
    {
      icon: <Trophy size={22} />,
      label: 'Activity Streak',
      value: streak,
      unit: streak === 1 ? 'day' : 'days',
      sub: streak > 0 ? '🔥 Keep it up!' : 'Start your streak today!',
      color: '#8b5cf6',
      bg: 'rgba(139,92,246,0.1)'
    }
  ];

  return (
    <div className="dashboard-v2">
      {/* ── Greeting ── */}
      <div className="dash-greeting-row">
        <div>
          <h1 className="dash-greeting-title">
            {getHourGreeting()}, <span style={{ color: '#B7F34A' }}>{user?.name?.split(' ')[0] || 'Athlete'}</span> 👋
          </h1>
          <p className="dash-greeting-sub">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div className="dash-quick-actions">
          <Link to="/running" className="btn btn-primary dash-quick-btn">
            <Play size={15} fill="currentColor" /> Start Run
          </Link>
          <Link to="/workouts" className="btn btn-secondary dash-quick-btn">
            <Dumbbell size={15} /> Log Workout
          </Link>
        </div>
      </div>

      {/* ── KPI Cards ── */}
      <div className="dash-kpi-grid">
        {kpis.map((k, i) => (
          <div key={i} className="dash-kpi-card" style={{ '--kpi-color': k.color, '--kpi-bg': k.bg }}>
            <div className="dash-kpi-icon" style={{ background: k.bg, color: k.color }}>
              {k.icon}
            </div>
            <div className="dash-kpi-body">
              <span className="dash-kpi-label">{k.label}</span>
              <div className="dash-kpi-value-row">
                <span className="dash-kpi-value" style={{ color: k.color }}>{k.value}</span>
                <span className="dash-kpi-unit">{k.unit}</span>
              </div>
              <span className="dash-kpi-sub">{k.sub}</span>
            </div>
          </div>
        ))}
      </div>

      {/* ── Main Two-Column Layout ── */}
      <div className="dash-main-grid">
        {/* LEFT: Calorie Ring + Today Summary */}
        <div className="dash-left-col">
          {/* Calorie Goal Ring */}
          <div className="dash-card">
            <h3 className="dash-section-title">Daily Nutrition Goal</h3>
            <div className="dash-ring-row">
              <GoalRing percent={calPercent} value={todayCalIn} label="Calories Consumed" />
              <div className="dash-ring-stats">
                <div className="dash-ring-stat">
                  <span style={{ color: '#B7F34A', fontWeight: 700 }}>{dailyTarget - todayCalIn > 0 ? dailyTarget - todayCalIn : 0}</span>
                  <span className="dash-ring-stat-label">kcal remaining</span>
                </div>
                <div className="dash-ring-stat">
                  <span style={{ color: '#36C99A', fontWeight: 700 }}>
                    {todayMeals.reduce((s, m) => s + (Number(m.protein) || 0), 0)}g
                  </span>
                  <span className="dash-ring-stat-label">Protein</span>
                </div>
                <div className="dash-ring-stat">
                  <span style={{ color: '#F3A64A', fontWeight: 700 }}>
                    {todayMeals.reduce((s, m) => s + (Number(m.carbs) || 0), 0)}g
                  </span>
                  <span className="dash-ring-stat-label">Carbs</span>
                </div>
                <div className="dash-ring-stat">
                  <span style={{ color: '#8b5cf6', fontWeight: 700 }}>
                    {todayMeals.reduce((s, m) => s + (Number(m.fat) || 0), 0)}g
                  </span>
                  <span className="dash-ring-stat-label">Fat</span>
                </div>
              </div>
            </div>
            <Link to="/nutrition" className="dash-link-row">
              <Plus size={14} /> Add Meal <ChevronRight size={14} style={{ marginLeft: 'auto' }} />
            </Link>
          </div>

          {/* Goals */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-section-title">Active Goals</h3>
              <Link to="/progress" className="dash-see-all">See all</Link>
            </div>
            {activeGoals.length === 0 ? (
              <p style={{ color: '#6B7F97', fontSize: '0.88rem', textAlign: 'center', padding: '20px 0' }}>No active goals yet</p>
            ) : (
              <div className="dash-goals-list">
                {activeGoals.map((g) => {
                  const pct = Math.min(100, g.targetValue > 0 ? Math.round((g.currentValue / g.targetValue) * 100) : 0);
                  return (
                    <div key={g.id} className="dash-goal-item">
                      <div className="dash-goal-header">
                        <span className="dash-goal-title">{g.title}</span>
                        <span style={{ color: '#B7F34A', fontWeight: 700, fontSize: '0.85rem' }}>{pct}%</span>
                      </div>
                      <div className="dash-goal-bar">
                        <div className="dash-goal-fill" style={{ width: `${pct}%` }} />
                      </div>
                      <span style={{ color: '#6B7F97', fontSize: '0.78rem' }}>
                        {g.currentValue} / {g.targetValue} {g.unit}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* RIGHT: Weekly Chart + Recent Activity */}
        <div className="dash-right-col">
          {/* Weekly Activity Chart */}
          <div className="dash-card">
            <h3 className="dash-section-title">Weekly Activity — Calories Burned</h3>
            <ResponsiveContainer width="100%" height={200}>
              <BarChart data={weeklyData} barSize={28} margin={{ top: 4, right: 4, bottom: 0, left: -10 }}>
                <CartesianGrid vertical={false} stroke="#233150" />
                <XAxis dataKey="label" tick={{ fill: '#6B7F97', fontSize: 12, fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fill: '#6B7F97', fontSize: 11, fontFamily: 'Manrope' }} axisLine={false} tickLine={false} />
                <Tooltip content={<ChartTooltip />} cursor={{ fill: 'rgba(183,243,74,0.05)' }} />
                <Bar dataKey="cals" name="cals" unit="kcal" radius={[6, 6, 0, 0]}>
                  {weeklyData.map((entry, index) => (
                    <Cell key={index} fill={entry.active ? '#B7F34A' : '#233150'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '12px' }}>
              <span style={{ color: '#6B7F97', fontSize: '0.78rem' }}>
                {weeklyData.filter((d) => d.active).length} active days this week
              </span>
              <Link to="/progress" style={{ color: '#B7F34A', fontSize: '0.78rem', fontWeight: 600 }}>
                Full analytics →
              </Link>
            </div>
          </div>

          {/* Recent Activity */}
          <div className="dash-card">
            <div className="dash-card-header">
              <h3 className="dash-section-title">Recent Activity</h3>
            </div>
            {recentActivity.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '24px 0' }}>
                <p style={{ color: '#6B7F97', marginBottom: 12 }}>No activity logged yet</p>
                <div style={{ display: 'flex', gap: 8, justifyContent: 'center' }}>
                  <Link to="/running" className="btn btn-primary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
                    <Play size={13} fill="currentColor" /> Start a Run
                  </Link>
                  <Link to="/workouts" className="btn btn-secondary" style={{ fontSize: '0.82rem', padding: '0.5rem 1rem' }}>
                    <Dumbbell size={13} /> Log Workout
                  </Link>
                </div>
              </div>
            ) : (
              <div className="dash-activity-list">
                {recentActivity.map((act) => (
                  <div key={act.id} className="dash-activity-item">
                    <div
                      className="dash-activity-icon"
                      style={{
                        background: act.type === 'run' ? 'rgba(183,243,74,0.12)' : 'rgba(54,201,154,0.12)',
                        color: act.type === 'run' ? '#B7F34A' : '#36C99A'
                      }}
                    >
                      {act.type === 'run' ? <Flame size={16} /> : <Dumbbell size={16} />}
                    </div>
                    <div className="dash-activity-body">
                      <span className="dash-activity-title">{act.title}</span>
                      <span className="dash-activity-sub">{act.sub}</span>
                    </div>
                    <div className="dash-activity-right">
                      {act.cals > 0 && (
                        <span style={{ color: '#F3A64A', fontSize: '0.82rem', fontWeight: 600 }}>
                          {act.cals} kcal
                        </span>
                      )}
                      <span style={{ color: '#6B7F97', fontSize: '0.75rem' }}>
                        {formatFriendlyDate(act.date)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Quick Nav Shortcuts ── */}
      <div className="dash-shortcut-grid">
        {[
          { to: '/scanner', icon: <ScanBarcode size={22} />, label: 'Food Scanner', color: '#B7F34A' },
          { to: '/nutrition', icon: <Plus size={22} />, label: 'Nutrition Diary', color: '#36C99A' },
          { to: '/workouts', icon: <Dumbbell size={22} />, label: 'Workouts', color: '#F3A64A' },
          { to: '/progress', icon: <TrendingUp size={22} />, label: 'Progress', color: '#8b5cf6' },
          { to: '/exercises', icon: <Award size={22} />, label: 'Exercise Library', color: '#36C99A' },
          { to: '/calendar', icon: <Calendar size={22} />, label: 'Activity Calendar', color: '#F3A64A' },
        ].map((s) => (
          <Link key={s.to} to={s.to} className="dash-shortcut-card" style={{ '--sc-color': s.color }}>
            <div className="dash-shortcut-icon" style={{ color: s.color, background: `${s.color}18` }}>
              {s.icon}
            </div>
            <span className="dash-shortcut-label">{s.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );
}
