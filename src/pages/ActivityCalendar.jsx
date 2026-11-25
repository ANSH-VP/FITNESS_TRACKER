import React, { useState, useEffect, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Flame, Dumbbell, Calendar } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { getRuns, getWorkouts } from '../services/storageService';
import { formatDuration } from '../utils/calculations';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January','February','March','April','May','June','July','August','September','October','November','December'];

function isoDate(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function ActivityCalendar() {
  const { user } = useAuth();
  const [runs, setRuns] = useState([]);
  const [workouts, setWorkouts] = useState([]);
  const [selected, setSelected] = useState(null);

  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());

  useEffect(() => {
    if (!user) return;
    setRuns(getRuns(user.id));
    setWorkouts(getWorkouts(user.id));
  }, [user]);

  // Build activity map: date string -> { runs, workouts }
  const activityMap = useMemo(() => {
    const map = {};
    runs.forEach((r) => {
      const d = r.date;
      if (!d) return;
      if (!map[d]) map[d] = { runs: [], workouts: [] };
      map[d].runs.push(r);
    });
    workouts.forEach((w) => {
      const d = w.date;
      if (!d) return;
      if (!map[d]) map[d] = { runs: [], workouts: [] };
      map[d].workouts.push(w);
    });
    return map;
  }, [runs, workouts]);

  // Intensity: 0=none, 1=light, 2=moderate, 3=high
  function getIntensity(dayStr) {
    const a = activityMap[dayStr];
    if (!a) return 0;
    const total = a.runs.length + a.workouts.length;
    if (total >= 3) return 3;
    if (total === 2) return 2;
    if (total === 1) return 1;
    return 0;
  }

  const intensityColors = ['#233150', '#36C99A44', '#B7F34A88', '#B7F34A'];

  // Calendar grid
  const firstDay = new Date(viewYear, viewMonth, 1).getDay();
  const daysInMonth = new Date(viewYear, viewMonth + 1, 0).getDate();
  const cells = [];
  for (let i = 0; i < firstDay; i++) cells.push(null);
  for (let d = 1; d <= daysInMonth; d++) cells.push(d);

  const prevMonth = () => {
    if (viewMonth === 0) { setViewYear(viewYear - 1); setViewMonth(11); }
    else setViewMonth(viewMonth - 1);
    setSelected(null);
  };
  const nextMonth = () => {
    if (viewMonth === 11) { setViewYear(viewYear + 1); setViewMonth(0); }
    else setViewMonth(viewMonth + 1);
    setSelected(null);
  };

  const todayStr = now.toISOString().split('T')[0];
  const selectedActivity = selected ? activityMap[selected] : null;

  // Stats for current month
  const monthStats = useMemo(() => {
    let activeDays = 0, totalKm = 0, totalWo = 0;
    for (let d = 1; d <= daysInMonth; d++) {
      const str = isoDate(viewYear, viewMonth, d);
      if (activityMap[str]) {
        activeDays++;
        totalKm += activityMap[str].runs.reduce((s, r) => s + (Number(r.distance) || 0), 0);
        totalWo += activityMap[str].workouts.length;
      }
    }
    return { activeDays, totalKm: totalKm.toFixed(1), totalWo };
  }, [activityMap, viewYear, viewMonth, daysInMonth]);

  return (
    <div className="cal-page">
      <div className="cal-header-row">
        <div>
          <h1 className="cal-title">Activity Calendar</h1>
          <p className="cal-sub">Your workout and run history at a glance</p>
        </div>
      </div>

      {/* Month Stats */}
      <div className="cal-stats-row">
        <div className="cal-stat-card">
          <span className="cal-stat-val" style={{ color: '#B7F34A' }}>{monthStats.activeDays}</span>
          <span className="cal-stat-lbl">Active Days</span>
        </div>
        <div className="cal-stat-card">
          <span className="cal-stat-val" style={{ color: '#36C99A' }}>{monthStats.totalKm} km</span>
          <span className="cal-stat-lbl">Total Distance</span>
        </div>
        <div className="cal-stat-card">
          <span className="cal-stat-val" style={{ color: '#F3A64A' }}>{monthStats.totalWo}</span>
          <span className="cal-stat-lbl">Workouts</span>
        </div>
      </div>

      <div className="cal-layout">
        {/* Calendar */}
        <div className="cal-card">
          {/* Nav */}
          <div className="cal-nav">
            <button className="cal-nav-btn" onClick={prevMonth}><ChevronLeft size={18} /></button>
            <h2 className="cal-month-title">{MONTHS[viewMonth]} {viewYear}</h2>
            <button className="cal-nav-btn" onClick={nextMonth}><ChevronRight size={18} /></button>
          </div>
          {/* Weekday Headers */}
          <div className="cal-weekdays">
            {WEEKDAYS.map((d) => (
              <div key={d} className="cal-weekday">{d}</div>
            ))}
          </div>

          {/* Days Grid */}
          <div className="cal-grid">
            {cells.map((day, idx) => {
              if (!day) return <div key={`blank-${idx}`} className="cal-cell-blank" />;
              const str = isoDate(viewYear, viewMonth, day);
              const intensity = getIntensity(str);
              const isToday = str === todayStr;
              const isSelected = str === selected;
              const hasActivity = intensity > 0;
              return (
                <button
                  key={str}
                  className={`cal-cell ${isToday ? 'cal-cell-today' : ''} ${isSelected ? 'cal-cell-selected' : ''} ${hasActivity ? 'cal-cell-active' : ''}`}
                  style={hasActivity ? { '--dot-color': intensityColors[intensity] } : {}}
                  onClick={() => setSelected(isSelected ? null : str)}
                >
                  <span className="cal-day-num">{day}</span>
                  {hasActivity && <span className="cal-dot" style={{ background: intensityColors[intensity] }} />}
                </button>
              );
            })}
          </div>

          {/* Legend */}
          <div className="cal-legend">
            <span style={{ color: '#6B7F97', fontSize: '0.78rem' }}>Activity Level:</span>
            {[1, 2, 3].map((lvl) => (
              <div key={lvl} className="cal-legend-item">
                <div style={{ width: 12, height: 12, borderRadius: 3, background: intensityColors[lvl] }} />
                <span style={{ color: '#6B7F97', fontSize: '0.75rem' }}>
                  {lvl === 1 ? 'Light' : lvl === 2 ? 'Moderate' : 'High'}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Detail Panel */}
        <div className="cal-detail">
          {!selected ? (
            <div className="cal-detail-empty">
              <Calendar size={40} style={{ color: '#233150', marginBottom: 12 }} />
              <p style={{ color: '#6B7F97', textAlign: 'center' }}>Click a day to see your activity details</p>
            </div>
          ) : (
            <div>
              <h3 className="cal-detail-date">
                {new Date(selected + 'T12:00:00').toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </h3>
              {!selectedActivity ? (
                <p style={{ color: '#6B7F97', marginTop: 12 }}>No activity recorded on this day.</p>
              ) : (
                <div>
                  {selectedActivity.runs.length > 0 && (
                    <div className="cal-detail-section">
                      <h4 className="cal-detail-section-title" style={{ color: '#B7F34A' }}>
                        <Flame size={15} /> Runs ({selectedActivity.runs.length})
                      </h4>
                      {selectedActivity.runs.map((r) => (
                        <div key={r.id} className="cal-detail-item">
                          <div className="cal-detail-item-title">{r.title || 'Outdoor Run'}</div>
                          <div className="cal-detail-item-stats">
                            <span style={{ color: '#B7F34A' }}>{r.distance} km</span>
                            <span style={{ color: '#AAB6C5' }}>{formatDuration(r.duration)}</span>
                            {r.pace && <span style={{ color: '#AAB6C5' }}>{r.pace}</span>}
                            {r.calories > 0 && <span style={{ color: '#F3A64A' }}>{r.calories} kcal</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                  {selectedActivity.workouts.length > 0 && (
                    <div className="cal-detail-section">
                      <h4 className="cal-detail-section-title" style={{ color: '#36C99A' }}>
                        <Dumbbell size={15} /> Workouts ({selectedActivity.workouts.length})
                      </h4>
                      {selectedActivity.workouts.map((w) => (
                        <div key={w.id} className="cal-detail-item">
                          <div className="cal-detail-item-title">{w.name}</div>
                          <div className="cal-detail-item-stats">
                            <span style={{ color: '#36C99A' }}>{w.category}</span>
                            <span style={{ color: '#AAB6C5' }}>{w.duration} min</span>
                            {w.calories > 0 && <span style={{ color: '#F3A64A' }}>{w.calories} kcal</span>}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
