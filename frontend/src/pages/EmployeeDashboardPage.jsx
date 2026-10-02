import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';
import { Clock, CheckSquare, FileText, CalendarCheck, ArrowRight, Play, CheckCircle } from 'lucide-react';

const EmployeeDashboardPage = () => {
  const [attendance, setAttendance] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [stats, setStats] = useState({ pending: 0, in_progress: 0, completed: 0, approved: 0 });
  const [loading, setLoading] = useState(true);
  const [attendanceActionLoading, setAttendanceActionLoading] = useState(false);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      const [attRes, tasksRes] = await Promise.all([
        api.get('/attendance/today'),
        api.get('/tasks?limit=10')
      ]);

      if (attRes.data.success) {
        setAttendance(attRes.data.attendance);
      }

      if (tasksRes.data.success) {
        const fetchedTasks = tasksRes.data.tasks || [];
        setTasks(fetchedTasks);

        const counts = { pending: 0, in_progress: 0, completed: 0, approved: 0 };
        fetchedTasks.forEach((t) => {
          if (counts[t.status] !== undefined) counts[t.status]++;
        });
        setStats(counts);
      }
    } catch (err) {
      console.error('Failed to load employee dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const handleClockIn = async () => {
    try {
      setAttendanceActionLoading(true);
      const res = await api.post('/attendance/clock-in');
      if (res.data.success) {
        setAttendance(res.data.attendance);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Clock in failed.');
    } finally {
      setAttendanceActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setAttendanceActionLoading(true);
      const res = await api.post('/attendance/clock-out');
      if (res.data.success) {
        setAttendance(res.data.attendance);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Clock out failed.');
    } finally {
      setAttendanceActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Employee Dashboard</h1>
          <p className="page-subtitle">Track your assigned office tasks, submit completed work, and log daily attendance</p>
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Loading dashboard data..." />
      ) : (
        <>
          {/* Daily Attendance Card */}
          <div className="card" style={{ backgroundColor: '#ffffff', borderLeft: '4px solid #ea580c' }}>
            <div className="card-body" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h3 style={{ fontSize: '1.1rem', fontWeight: '600' }}>Daily Attendance Log</h3>
                <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                  {attendance
                    ? attendance.logoutTime
                      ? `Clocked out at ${new Date(attendance.logoutTime).toLocaleTimeString()}`
                      : `Clocked in at ${new Date(attendance.loginTime).toLocaleTimeString()}`
                    : 'No attendance logged for today yet'}
                </p>
              </div>
              <div>
                {!attendance ? (
                  <button
                    className="btn btn-primary"
                    onClick={handleClockIn}
                    disabled={attendanceActionLoading}
                  >
                    <Clock size={18} />
                    Clock in
                  </button>
                ) : !attendance.logoutTime ? (
                  <button
                    className="btn btn-secondary"
                    onClick={handleClockOut}
                    disabled={attendanceActionLoading}
                  >
                    <Clock size={18} />
                    Clock out
                  </button>
                ) : (
                  <span className="status-badge approved">Shift Completed</span>
                )}
              </div>
            </div>
          </div>

          <div className="grid-stats">
            <div className="stat-card">
              <div className="stat-icon-wrapper orange">
                <Clock size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.pending}</div>
                <div className="stat-label">Pending Tasks</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper blue">
                <Play size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.in_progress}</div>
                <div className="stat-label">In Progress</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper purple">
                <FileText size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.completed}</div>
                <div className="stat-label">Submitted for Review</div>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon-wrapper green">
                <CheckCircle size={24} />
              </div>
              <div className="stat-info">
                <div className="stat-value">{stats.approved}</div>
                <div className="stat-label">Approved Tasks</div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Assigned Tasks</h3>
              <Link to="/employee/tasks" style={{ fontSize: '0.875rem', color: '#ea580c', display: 'flex', alignItems: 'center', gap: '0.25rem', fontWeight: '500' }}>
                View all tasks
                <ArrowRight size={16} />
              </Link>
            </div>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Task Title</th>
                    <th>Status</th>
                    <th>Due Date</th>
                    <th>Action</th>
                  </tr>
                </thead>
                <tbody>
                  {tasks.length === 0 ? (
                    <tr>
                      <td colSpan="4" style={{ textAlign: 'center', color: '#64748b' }}>
                        No tasks assigned yet
                      </td>
                    </tr>
                  ) : (
                    tasks.map((task) => (
                      <tr key={task._id}>
                        <td style={{ fontWeight: '600' }}>{task.title}</td>
                        <td>
                          <StatusBadge status={task.status} />
                        </td>
                        <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No limit'}</td>
                        <td>
                          <Link to={`/employee/tasks/${task._id}`} className="btn btn-secondary btn-sm">
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

export default EmployeeDashboardPage;
