import React from 'react';
import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CheckSquare,
  FileCheck,
  Users,
  CalendarCheck,
  Calendar,
  History,
  LogOut
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';

const Sidebar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  if (!user) return null;

  const isAdmin = user.role === 'admin';

  return (
    <aside className="sidebar">
      <div className="sidebar-header">
        <div>
          <div className="brand-title">Task Manager</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b' }}>Office Work Portal</div>
        </div>
        <span className="brand-badge">{user.role}</span>
      </div>

      <nav className="sidebar-nav">
        {isAdmin ? (
          <>
            <NavLink
              to="/admin/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/admin/tasks"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CheckSquare size={18} />
              Task Management
            </NavLink>
            <NavLink
              to="/admin/work-history"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <FileCheck size={18} />
              Submitted Work
            </NavLink>
            <NavLink
              to="/admin/employees"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Users size={18} />
              Employees
            </NavLink>
            <NavLink
              to="/admin/attendance"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CalendarCheck size={18} />
              Attendance History
            </NavLink>
            <NavLink
              to="/admin/calendar"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Calendar size={18} />
              Calendar
            </NavLink>
          </>
        ) : (
          <>
            <NavLink
              to="/employee/dashboard"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <LayoutDashboard size={18} />
              Dashboard
            </NavLink>
            <NavLink
              to="/employee/tasks"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CheckSquare size={18} />
              My Tasks
            </NavLink>
            <NavLink
              to="/employee/attendance"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <CalendarCheck size={18} />
              Daily Attendance
            </NavLink>
            <NavLink
              to="/employee/history"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <History size={18} />
              My Activity Log
            </NavLink>
            <NavLink
              to="/employee/calendar"
              className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
            >
              <Calendar size={18} />
              Calendar
            </NavLink>
          </>
        )}
      </nav>

      <div className="sidebar-footer">
        <div className="user-info">
          <span className="user-name">{user.name}</span>
          <span className="user-role">{user.email}</span>
        </div>
        <button
          onClick={handleLogout}
          style={{ color: '#94a3b8', padding: '0.4rem' }}
          title="Log out"
        >
          <LogOut size={18} />
        </button>
      </div>
    </aside>
  );
};

export default Sidebar;
