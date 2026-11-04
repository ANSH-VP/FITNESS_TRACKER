import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import { ToastProvider } from './context/ToastContext';

// Protected Route Guards
import { ProtectedUserRoute, ProtectedAdminRoute } from './components/routing/ProtectedRoute';

// Layouts
import UserLayout from './components/layout/UserLayout';
import AdminLayout from './components/layout/AdminLayout';

// Public Pages
import Welcome from './pages/Welcome';
import Login from './pages/Login';
import Register from './pages/Register';

// User Module Pages
import Dashboard from './pages/Dashboard';
import RunningTracker from './pages/RunningTracker';
import FoodScanner from './pages/FoodScanner';
import NutritionDiary from './pages/NutritionDiary';
import WorkoutTracker from './pages/WorkoutTracker';
import Progress from './pages/Progress';
import Profile from './pages/Profile';

// Admin Module Pages
import AdminDashboard from './pages/admin/AdminDashboard';
import AdminUsers from './pages/admin/AdminUsers';
import AdminActivities from './pages/admin/AdminActivities';

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            {/* Public Entry Routes */}
            <Route path="/" element={<Welcome />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />

            {/* Authenticated User Module */}
            <Route
              element={
                <ProtectedUserRoute>
                  <UserLayout />
                </ProtectedUserRoute>
              }
            >
              <Route path="/dashboard" element={<Dashboard />} />
              <Route path="/running" element={<RunningTracker />} />
              <Route path="/scanner" element={<FoodScanner />} />
              <Route path="/nutrition" element={<NutritionDiary />} />
              <Route path="/workouts" element={<WorkoutTracker />} />
              <Route path="/progress" element={<Progress />} />
              <Route path="/profile" element={<Profile />} />
            </Route>

            {/* Authenticated Admin Module */}
            <Route
              element={
                <ProtectedAdminRoute>
                  <AdminLayout />
                </ProtectedAdminRoute>
              }
            >
              <Route path="/admin" element={<Navigate to="/admin/dashboard" replace />} />
              <Route path="/admin/dashboard" element={<AdminDashboard />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/activities" element={<AdminActivities />} />
            </Route>

            {/* Catch-all redirect */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
