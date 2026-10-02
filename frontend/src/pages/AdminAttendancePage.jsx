import React, { useState, useEffect } from 'react';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import api from '../api/axios';
import { CalendarCheck, Search } from 'lucide-react';

const calculateDuration = (login, logout) => {
  if (!login || !logout) return 'In Progress';
  const start = new Date(login).getTime();
  const end = new Date(logout).getTime();
  const diffMinutes = Math.floor((end - start) / (1000 * 60));
  const hours = Math.floor(diffMinutes / 60);
  const mins = diffMinutes % 60;
  return `${hours}h ${mins}m`;
};

const AdminAttendancePage = () => {
  const [records, setRecords] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });

  // Filters
  const [employeeFilter, setEmployeeFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const fetchEmployees = async () => {
    try {
      const res = await api.get('/users?limit=100');
      if (res.data.success) {
        setEmployees(res.data.employees || []);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    }
  };

  const fetchAttendance = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (employeeFilter) params.append('employee', employeeFilter);
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
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchAttendance(1);
  }, [employeeFilter, startDate, endDate]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Attendance History</h1>
          <p className="page-subtitle">Track daily clock in and clock out logs across all employees</p>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap', width: '100%' }}>
          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '180px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Filter Employee</label>
            <select
              className="form-select"
              value={employeeFilter}
              onChange={(e) => setEmployeeFilter(e.target.value)}
            >
              <option value="">All Employees</option>
              {employees.map((emp) => (
                <option key={emp._id} value={emp._id}>
                  {emp.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '150px' }}>
            <label className="form-label" style={{ fontSize: '0.8rem' }}>Start Date</label>
            <input
              type="date"
              className="form-input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div className="form-group" style={{ marginBottom: 0, flex: '1', minWidth: '150px' }}>
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
        <LoadingSpinner text="Fetching attendance records..." />
      ) : records.length === 0 ? (
        <EmptyState
          icon={CalendarCheck}
          title="No attendance records found"
          description="No clock in or logout entries match your selected date and employee filters."
        />
      ) : (
        <div className="card">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Date</th>
                  <th>Clock In Time</th>
                  <th>Clock Out Time</th>
                  <th>Shift Duration</th>
                </tr>
              </thead>
              <tbody>
                {records.map((rec) => (
                  <tr key={rec._id}>
                    <td style={{ fontWeight: '600' }}>
                      {rec.employee?.name || 'Unknown'}
                      <div style={{ fontSize: '0.775rem', color: '#64748b' }}>{rec.employee?.email}</div>
                    </td>
                    <td>{rec.date}</td>
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
          <Pagination pagination={pagination} onPageChange={(page) => fetchAttendance(page)} />
        </div>
      )}
    </div>
  );
};

export default AdminAttendancePage;
