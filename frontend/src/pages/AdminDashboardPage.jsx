import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Navbar from '../components/Navbar';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';
import { CheckSquare, FileCheck, Users, CalendarCheck, Plus, ArrowRight } from 'lucide-react';

const AdminDashboardPage = () => {
  const [stats, setStats] = useState({
    totalTasks: 0,
    pendingReviews: 0,
    totalEmployees: 0,
    todayAttendance: 0
  });
  const [recentTasks, setRecentTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [tasksRes, workRes, employeesRes, attendanceRes] = await Promise.all([
        api.get('/tasks?limit=5'),
        api.get('/work-submissions?reviewStatus=pending'),
        api.get('/users?limit=1'),
        api.get('/attendance')
      ]);

      setStats({
        totalTasks: tasksRes.data.pagination?.total || 0,
        pendingReviews: workRes.data.pagination?.total || 0,
        totalEmployees: employeesRes.data.pagination?.total || 0,
        todayAttendance: attendanceRes.data.pagination?.total || 0
      });

      setRecentTasks(tasksRes.data.tasks || []);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Admin Dashboard</h1>
          <p className="page-subtitle">Overview of team task status, submissions, and daily attendance</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <Link to="/admin/tasks" className="btn btn-primary">
            <Plus size={18} />
            Assign task
          </Link>
          <Link to="/admin/employees" className="btn btn-secondary">
            <Users size={18} />
            Manage employees
          </Link>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading dashboard metrics..." />
      ) : (
        <>
          <div className="grid-stats">
            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <CheckSquare size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalTasks}</div>
                <div className="stat-label">Total Assigned Tasks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper orange">
                <FileCheck size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.pendingReviews}</div>
                <div className="stat-label">Pending Work Reviews</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper purple">
                <Users size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.totalEmployees}</div>
                <div className="stat-label">Active Employees</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <CalendarCheck size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.todayAttendance}</div>
                <div className="stat-label">Total Attendance Logs</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Recent Task Assignments</h3>
              <Link to="/admin/tasks" style={{ fontSize: '0.875rem', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
                View all tasks
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Title</th>
                    <th>Assignee</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {recentTasks.length === 0 ? (
                    <tr>
                      <td colSpan="5" style={{ textAlign: 'center', color: '#64748b' }}>
                        No tasks assigned yet
                      </td>
                    </tr>
                  ) : (
                    recentTasks.map((t) => (
                      <tr key={t._id}>
                        <td data-label="Task Title" style={{ fontWeight: '500' }}>{t.title}</td>
                        <td data-label="Assignee">{t.assignee?.name || 'Unassigned'}</td>
                        <td data-label="Status">
                          <StatusBadge status={t.status} />
                        </td>
                        <td data-label="Due Date">{t.dueDate ? new Date(t.dueDate).toLocaleDateString() : 'No limit'}</td>
                        <td data-label="Action">
                          <Link to={`/admin/tasks/${t._id}`} className="btn btn-secondary btn-sm">
                            View detail
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AdminDashboardPage;
