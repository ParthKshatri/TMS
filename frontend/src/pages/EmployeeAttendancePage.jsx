import React, { useState, useEffect } from 'react';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import api from '../api/axios';
import { Clock, CalendarCheck } from 'lucide-react';

const calculateDuration = (login, logout) => {
  if (!login || !logout) return 'In Progress';
  const start = new Date(login).getTime();
  const end = new Date(logout).getTime();
  const diffMinutes = Math.floor((end - start) / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}h ${mins}m`;
};

const EmployeeAttendancePage = () => {
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [todayLoading, setTodayLoading] = useState(true);
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });

  // Filters
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchTodayAttendance = async () => {
    try {
      setTodayLoading(true);
      const res = await api.get('/attendance/today');
      if (res.data.success) {
        setTodayAttendance(res.data.attendance);
      }
    } catch (err) {
      console.error('Failed to load today attendance:', err);
    } finally {
      setTodayLoading(false);
    }
  };

  const fetchHistory = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (startDate) params.append('startDate', startDate);
      if (endDate) params.append('endDate', endDate);

      const res = await api.get(`/attendance?${params.toString()}`);
      if (res.data.success) {
        setRecords(res.data.records);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load attendance history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTodayAttendance();
  }, []);

  useEffect(() => {
    fetchHistory(1);
  }, [startDate, endDate]);

  const handleClockIn = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-in');
      if (res.data.success) {
        setTodayAttendance(res.data.attendance);
        fetchHistory(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Clock in failed.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleClockOut = async () => {
    try {
      setActionLoading(true);
      const res = await api.post('/attendance/clock-out');
      if (res.data.success) {
        setTodayAttendance(res.data.attendance);
        fetchHistory(1);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Clock out failed.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Daily Attendance Log</h1>
          <p className="page-subtitle">Record login and logout times for your daily office work shift</p>
        </div>
      </div>

      {/* Clock In/Out Control Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <h3 className="card-title">Today Shift Action</h3>
          <span style={{ fontSize: '0.85rem', color: '#64748b' }}>
            Date: {new Date().toLocaleDateString()}
          </span>
        </div>
        <div className="card-body">
          {todayLoading ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.5rem 0', color: 'var(--color-text-muted)' }}>
              <LoadingSpinner text="Checking shift status..." />
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1.5rem' }}>
              <div>
                {!todayAttendance ? (
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#0f172a' }}>
                      Shift Not Started
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                      Click Clock in to start recording your login time for today.
                    </p>
                  </div>
                ) : !todayAttendance.logoutTime ? (
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#16a34a' }}>
                      Active Work Shift
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                      Clocked in at <strong>{new Date(todayAttendance.loginTime).toLocaleTimeString()}</strong>
                    </p>
                  </div>
                ) : (
                  <div>
                    <h4 style={{ fontSize: '1.1rem', fontWeight: '600', color: '#2563eb' }}>
                      Shift Complete
                    </h4>
                    <p style={{ color: '#64748b', fontSize: '0.875rem', marginTop: '0.2rem' }}>
                      Clocked in: {new Date(todayAttendance.loginTime).toLocaleTimeString()} | Clocked out: {new Date(todayAttendance.logoutTime).toLocaleTimeString()}
                    </p>
                  </div>
                )}
              </div>

              <div>
                {!todayAttendance ? (
                  <button className="btn btn-primary" onClick={handleClockIn} disabled={actionLoading}>
                    <Clock size={18} />
                    Clock in now
                  </button>
                ) : !todayAttendance.logoutTime ? (
                  <button className="btn btn-secondary" onClick={handleClockOut} disabled={actionLoading}>
                    <Clock size={18} />
                    Clock out now
                  </button>
                ) : (
                  <span className="status-badge approved" style={{ padding: '0.5rem 1rem', fontSize: '0.875rem' }}>
                    Recorded for Today
                  </span>
                )}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* History table */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">My Attendance History</h3>
        </div>

        <div className="filters-bar" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}>
          <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Date</label>
              <input
                type="date"
                className="form-input"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
              />
            </div>
            <div className="form-group" style={{ marginBottom: 0 }}>
              <label className="form-label" style={{ fontSize: '0.8rem' }}>End Date</label>
              <input
                type="date"
                className="form-input"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
              />
            </div>
          </div>
        </div>

        {loading ? (
          <LoadingSpinner text="Fetching attendance history..." />
        ) : records.length === 0 ? (
          <EmptyState
            icon={CalendarCheck}
            title="No attendance history found"
            description="You have no recorded clock in or logout entries for the selected date range."
          />
        ) : (
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Date</th>
                    <th>Clock In Time</th>
                    <th>Clock Out Time</th>
                    <th>Shift Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id}>
                      <td style={{ fontWeight: '600' }}>{rec.date}</td>
                      <td>{new Date(rec.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                      <td>
                        {rec.logoutTime
                          ? new Date(rec.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
                          : 'Active Shift'}
                      </td>
                      <td>{calculateDuration(rec.loginTime, rec.logoutTime)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={(page) => fetchHistory(page)} />
          </>
        )}
      </div>
    </div>
  );
};

export default EmployeeAttendancePage;
