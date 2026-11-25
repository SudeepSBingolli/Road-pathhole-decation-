import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { DashboardLayout } from '../components/layout/DashboardLayout';

// Public Pages
import { LandingPage } from '../pages/public/LandingPage';
import { Login } from '../pages/auth/Login';
import { Register } from '../pages/auth/Register';

// Citizen Pages
import { ReportPothole } from '../pages/citizen/ReportPothole';
import { MyComplaints } from '../pages/citizen/MyComplaints';
import { NearbyPotholes } from '../pages/citizen/NearbyPotholes';

// Admin Pages
import { AdminDashboard } from '../pages/admin/AdminDashboard';
import { AdminMapView } from '../pages/admin/AdminMapView';
import { ComplaintsTable } from '../pages/admin/ComplaintsTable';
import { RepairVerification } from '../pages/admin/RepairVerification';
import { TeamsPerformance } from '../pages/admin/TeamsPerformance';
import { ManageMaintenance } from '../pages/admin/ManageMaintenance';

// Maintenance Pages
import { MyTasks } from '../pages/maintenance/MyTasks';
import { TaskHistory } from '../pages/maintenance/TaskHistory';

export const AppRoutes = () => {
  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      {/* Citizen Protected Routes */}
      <Route
        path="/citizen"
        element={
          <ProtectedRoute allowedRoles={['citizen', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/citizen/complaints" replace />} />
        <Route path="report" element={<ReportPothole />} />
        <Route path="complaints" element={<MyComplaints />} />
        <Route path="nearby" element={<NearbyPotholes />} />
      </Route>

      {/* Admin Protected Routes */}
      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="dashboard" element={<AdminDashboard />} />
        <Route path="map" element={<AdminMapView />} />
        <Route path="complaints" element={<ComplaintsTable />} />
        <Route path="verifications" element={<RepairVerification />} />
        <Route path="teams" element={<TeamsPerformance />} />
        <Route path="maintenance" element={<ManageMaintenance />} />
      </Route>

      {/* Maintenance Crew Protected Routes */}
      <Route
        path="/maintenance"
        element={
          <ProtectedRoute allowedRoles={['maintenance', 'admin']}>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route index element={<Navigate to="/maintenance/tasks" replace />} />
        <Route path="tasks" element={<MyTasks />} />
        <Route path="history" element={<TaskHistory />} />
      </Route>

      {/* Catch-All Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

