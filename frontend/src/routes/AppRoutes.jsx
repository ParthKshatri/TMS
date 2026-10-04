import React, { useState, useEffect } from 'react';
import { Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import ProtectedRoute from './ProtectedRoute';
import AdminRoute from './AdminRoute';
import Sidebar from '../components/Sidebar';
import Navbar from '../components/Navbar';

// Pages
import LoginPage from '../pages/LoginPage';
import AdminDashboardPage from '../pages/AdminDashboardPage';
import AdminTasksPage from '../pages/AdminTasksPage';
import AdminTaskDetailPage from '../pages/AdminTaskDetailPage';
import AdminEmployeesPage from '../pages/AdminEmployeesPage';
import AdminAttendancePage from '../pages/AdminAttendancePage';
import AdminWorkHistoryPage from '../pages/AdminWorkHistoryPage';

import EmployeeDashboardPage from '../pages/EmployeeDashboardPage';
import EmployeeTasksPage from '../pages/EmployeeTasksPage';
import EmployeeTaskDetailPage from '../pages/EmployeeTaskDetailPage';
import EmployeeAttendancePage from '../pages/EmployeeAttendancePage';
import EmployeeHistoryPage from '../pages/EmployeeHistoryPage';
import CalendarPage from '../pages/CalendarPage';

const getNavbarTitle = (pathname) => {
  if (pathname.includes('/admin/dashboard')) return 'Admin Overview';
  if (pathname.includes('/admin/tasks/')) return 'Task Details & Review';
  if (pathname.includes('/admin/tasks')) return 'Task Management';
  if (pathname.includes('/admin/employees')) return 'Employee Accounts';
  if (pathname.includes('/admin/attendance')) return 'Attendance Logs';
  if (pathname.includes('/admin/work-history')) return 'Submitted Work';
  if (pathname.includes('/admin/calendar')) return 'Office Calendar';
  
  if (pathname.includes('/employee/dashboard')) return 'Employee Workspace';
  if (pathname.includes('/employee/tasks/')) return 'Task Detail & Work Submission';
  if (pathname.includes('/employee/tasks')) return 'My Assigned Tasks';
  if (pathname.includes('/employee/attendance')) return 'Daily Attendance';
  if (pathname.includes('/employee/history')) return 'My Activity History';
  if (pathname.includes('/employee/calendar')) return 'Office Calendar';
  return 'Dashboard';
};

const AppLayout = ({ children }) => {
  const { user } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    setSidebarOpen(false);
  }, [location.pathname]);

  if (!user) return <>{children}</>;

  return (
    <div className="app-container">
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      <div className="main-content">
        <Navbar
          title={getNavbarTitle(location.pathname)}
          onToggleSidebar={() => setSidebarOpen((prev) => !prev)}
          isSidebarOpen={sidebarOpen}
        />
        {children}
      </div>
    </div>
  );
};

const RootRedirect = () => {
  const { user } = useAuth();
  if (!user) return <Navigate to="/login" replace />;
  return <Navigate to={user.role === 'admin' ? '/admin/dashboard' : '/employee/dashboard'} replace />;
};

const AppRoutes = () => {
  return (
    <AppLayout>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route path="/" element={<RootRedirect />} />

        {/* Admin Routes */}
        <Route element={<AdminRoute />}>
          <Route path="/admin/dashboard" element={<AdminDashboardPage />} />
          <Route path="/admin/tasks" element={<AdminTasksPage />} />
          <Route path="/admin/tasks/:id" element={<AdminTaskDetailPage />} />
          <Route path="/admin/employees" element={<AdminEmployeesPage />} />
          <Route path="/admin/attendance" element={<AdminAttendancePage />} />
          <Route path="/admin/work-history" element={<AdminWorkHistoryPage />} />
          <Route path="/admin/calendar" element={<CalendarPage />} />
        </Route>

        {/* Employee Routes */}
        <Route element={<ProtectedRoute />}>
          <Route path="/employee/dashboard" element={<EmployeeDashboardPage />} />
          <Route path="/employee/tasks" element={<EmployeeTasksPage />} />
          <Route path="/employee/tasks/:id" element={<EmployeeTaskDetailPage />} />
          <Route path="/employee/attendance" element={<EmployeeAttendancePage />} />
          <Route path="/employee/history" element={<EmployeeHistoryPage />} />
          <Route path="/employee/calendar" element={<CalendarPage />} />
        </Route>

        {/* Catch-all fallback */}
        <Route path="*" element={<RootRedirect />} />
      </Routes>
    </AppLayout>
  );
};

export default AppRoutes;
