import React, { useEffect, useState } from 'react';
import { Bell, X, CheckCheck, Flame, Award, Calendar, Sparkles, Trash2 } from 'lucide-react';
import { getRuns, getWorkouts, getMeals, getGoals } from '../../services/storageService';

function getNotificationKey(userId) {
  return `fittrack_notifications_${userId}`;
}

function buildSmartNotifications(user) {
  if (!user?.id) return [];
  const runs = getRuns(user.id);
  const workouts = getWorkouts(user.id);
  const meals = getMeals(user.id);
  const goals = getGoals(user.id);

  const todayStr = new Date().toISOString().split('T')[0];
  const todayActive =
    runs.some((r) => r.date === todayStr) || workouts.some((w) => w.date === todayStr);

  // Compute streak
  const activeDays = new Set();
  [...runs, ...workouts].forEach((e) => {
    const d = e.date || (e.createdAt ? e.createdAt.split('T')[0] : null);
    if (d) activeDays.add(d);
  });
  let streak = 0;
  const now = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(now);
    d.setDate(now.getDate() - i);
    const key = d.toISOString().split('T')[0];
    if (activeDays.has(key)) streak++;
    else if (i > 0) break;
  }

  const weekAgo = new Date();
  weekAgo.setDate(weekAgo.getDate() - 7);
  const weekStr = weekAgo.toISOString().split('T')[0];
  const weekRunsKm = runs
    .filter((r) => r.date >= weekStr)
    .reduce((s, r) => s + (Number(r.distance) || 0), 0);
  const weekWorkouts = workouts.filter((w) => w.date >= weekStr).length;

  const list = [];

  if (!todayActive) {
    list.push({
      id: `rem-${todayStr}`,
      type: 'reminder',
      title: 'Workout Reminder',
      message: "You haven't logged a run or workout today. Even a 20-minute session keeps momentum!",
      time: 'Today',
      read: false
    });
  }

  if (streak > 0) {
    list.push({
      id: `streak-${streak}`,
      type: 'streak',
      title: `${streak}-Day Activity Streak`,
      message: `Great consistency! You've stayed active for ${streak} consecutive day${streak > 1 ? 's' : ''}.`,
      time: 'Active',
      read: false
    });
  }

  const completedGoals = goals.filter((g) => {
    let cur = Number(g.currentValue) || 0;
    if (g.category === 'Running' && g.unit?.includes('km')) {
      cur = runs.reduce((s, r) => s + (Number(r.distance) || 0), 0);
    } else if (g.category === 'Workout') {
      cur = workouts.length;
    }
    return g.targetValue > 0 && cur >= g.targetValue;
  });

  if (completedGoals.length > 0) {
    list.push({
      id: `goal-${completedGoals[0].id}`,
      type: 'goal',
      title: 'Goal Achieved!',
      message: `You hit your target for "${completedGoals[0].title}". Set a new milestone to keep progressing.`,
      time: 'Milestone',
      read: false
    });
  }

  list.push({
    id: `weekly-${weekStr}`,
    type: 'summary',
    title: 'Weekly Progress Summary',
    message: `Last 7 days: ${weekRunsKm.toFixed(1)} km run, ${weekWorkouts} workout${weekWorkouts === 1 ? '' : 's'}, ${meals.length} total meals tracked.`,
    time: '7-day digest',
    read: false
  });

  return list;
}

export function useNotifications(user) {
  const [notifications, setNotifications] = useState([]);

  useEffect(() => {
    if (!user?.id) {
      setNotifications([]);
      return;
    }
    const key = getNotificationKey(user.id);
    let saved = [];
    try {
      saved = JSON.parse(localStorage.getItem(key) || '[]');
    } catch {
      saved = [];
    }

    const smart = buildSmartNotifications(user);
    const savedMap = new Map(saved.map((n) => [n.id, n]));
    const merged = smart.map((n) => (savedMap.has(n.id) ? { ...n, read: savedMap.get(n.id).read } : n));
    localStorage.setItem(key, JSON.stringify(merged));
    setNotifications(merged);
  }, [user]);

  const markRead = (id) => {
    if (!user?.id) return;
    const next = notifications.map((n) => (n.id === id ? { ...n, read: true } : n));
    setNotifications(next);
    localStorage.setItem(getNotificationKey(user.id), JSON.stringify(next));
  };

  const markAllRead = () => {
    if (!user?.id) return;
    const next = notifications.map((n) => ({ ...n, read: true }));
    setNotifications(next);
    localStorage.setItem(getNotificationKey(user.id), JSON.stringify(next));
  };

  const dismiss = (id) => {
    if (!user?.id) return;
    const next = notifications.filter((n) => n.id !== id);
    setNotifications(next);
    localStorage.setItem(getNotificationKey(user.id), JSON.stringify(next));
  };

  const unreadCount = notifications.filter((n) => !n.read).length;

  return { notifications, unreadCount, markRead, markAllRead, dismiss };
}

export default function NotificationPanel({
  isOpen,
  onClose,
  notifications,
  onMarkRead,
  onMarkAllRead,
  onDismiss
}) {
  if (!isOpen) return null;

  const iconForType = (type) => {
    if (type === 'streak') return <Flame size={16} style={{ color: '#F3A64A' }} />;
    if (type === 'goal') return <Award size={16} style={{ color: '#B7F34A' }} />;
    if (type === 'summary') return <Sparkles size={16} style={{ color: '#36C99A' }} />;
    return <Calendar size={16} style={{ color: '#36C99A' }} />;
  };

  return (
    <>
      <div className="notif-backdrop" onClick={onClose} aria-hidden="true" />
      <aside className="notif-drawer" role="dialog" aria-label="Notifications">
        <div className="notif-drawer-header">
          <div className="notif-title-wrap">
            <Bell size={18} style={{ color: '#B7F34A' }} />
            <h3>Notifications</h3>
          </div>
          <div className="notif-header-actions">
            {notifications.some((n) => !n.read) && (
              <button type="button" className="notif-mark-all" onClick={onMarkAllRead}>
                <CheckCheck size={14} />
                <span>Mark all read</span>
              </button>
            )}
            <button type="button" className="notif-close-btn" onClick={onClose} aria-label="Close notifications">
              <X size={18} />
            </button>
          </div>
        </div>

        <div className="notif-list">
          {notifications.length === 0 ? (
            <div className="notif-empty">
              <Bell size={34} style={{ color: '#6B7F97', marginBottom: 8 }} />
              <p>You&apos;re all caught up!</p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                className={`notif-item ${n.read ? 'read' : 'unread'}`}
                onClick={() => onMarkRead(n.id)}
              >
                <div className="notif-item-icon">{iconForType(n.type)}</div>
                <div className="notif-item-body">
                  <div className="notif-item-top">
                    <span className="notif-item-title">{n.title}</span>
                    <span className="notif-item-time">{n.time}</span>
                  </div>
                  <p className="notif-item-msg">{n.message}</p>
                </div>
                <button
                  type="button"
                  className="notif-dismiss-btn"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDismiss(n.id);
                  }}
                  aria-label="Dismiss notification"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))
          )}
        </div>
      </aside>
    </>
  );
}
