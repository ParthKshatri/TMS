import React, { useState, useEffect } from 'react';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import StatusBadge from '../components/StatusBadge';
import Modal from '../components/Modal';
import api from '../api/axios';
import { CalendarCheck, Check, X } from 'lucide-react';

const calculateDuration = (rec) => {
  if (!rec.loginTime || !rec.logoutTime) return 'In Progress';
  if (rec.clockInStatus !== 'approved' || rec.clockOutStatus !== 'approved') {
    return 'Pending Approval';
  }
  const start = new Date(rec.loginTime).getTime();
  const end = new Date(rec.logoutTime).getTime();
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

  // Pending approval workflow states
  const [pendingRequests, setPendingRequests] = useState([]);
  const [pendingLoading, setPendingLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState(null);

  // Rejection Modal state
  const [rejectTarget, setRejectTarget] = useState(null); // { record, requestType }
  const [rejectionReason, setRejectionReason] = useState('');

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

  const fetchPendingRequests = async () => {
    try {
      const res = await api.get('/attendance/pending');
      if (res.data.success) {
        setPendingRequests(res.data.pendingRequests || []);
      }
    } catch (err) {
      console.error('Failed to load pending attendance requests:', err);
    } finally {
      setPendingLoading(false);
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

  // Polling for pending requests every 30s, paused when tab is hidden
  useEffect(() => {
    let intervalId;

    const performPoll = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingRequests();
      }
    };

    performPoll();
    intervalId = setInterval(performPoll, 30000);

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchPendingRequests();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(intervalId);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, []);

  useEffect(() => {
    fetchAttendance(1);
  }, [employeeFilter, startDate, endDate]);

  const handleApprove = async (recordId, requestType) => {
    try {
      setActionLoadingId(`${recordId}-${requestType}`);
      const res = await api.patch(`/attendance/${recordId}/approve`, { requestType });
      if (res.data.success) {
        fetchPendingRequests();
        fetchAttendance(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to approve request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const handleOpenRejectModal = (record, requestType) => {
    setRejectTarget({ record, requestType });
    setRejectionReason('');
  };

  const handleConfirmReject = async () => {
    if (!rejectTarget) return;
    const { record, requestType } = rejectTarget;
    try {
      setActionLoadingId(`${record._id}-${requestType}`);
      const res = await api.patch(`/attendance/${record._id}/reject`, {
        requestType,
        rejectionReason
      });
      if (res.data.success) {
        setRejectTarget(null);
        setRejectionReason('');
        fetchPendingRequests();
        fetchAttendance(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to reject request.');
    } finally {
      setActionLoadingId(null);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Attendance Management</h1>
          <p className="page-subtitle">Approve pending shift requests and monitor employee attendance history</p>
        </div>
      </div>

      {/* Pending Approvals Card */}
      <div className="card" style={{ marginBottom: '2rem' }}>
        <div className="card-header">
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <h3 className="card-title">Pending Approvals</h3>
            <span className="status-badge pending" style={{ fontSize: '0.8rem' }}>
              {pendingRequests.length} pending
            </span>
          </div>
        </div>

        <div className="card-body" style={{ padding: 0 }}>
          {pendingLoading ? (
            <div style={{ padding: '1.5rem' }}>
              <LoadingSpinner text="Checking pending requests..." />
            </div>
          ) : pendingRequests.length === 0 ? (
            <div style={{ padding: '1.5rem', textAlign: 'center', color: '#64748b' }}>
              No pending attendance approval requests.
            </div>
          ) : (
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee</th>
                    <th>Date</th>
                    <th>Request Type</th>
                    <th>Logged Time</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingRequests.map((req) => {
                    const items = [];
                    if (req.clockInStatus === 'pending') {
                      items.push({
                        type: 'clockIn',
                        label: 'Clock In',
                        time: req.loginTime
                      });
                    }
                    if (req.clockOutStatus === 'pending') {
                      items.push({
                        type: 'clockOut',
                        label: 'Clock Out',
                        time: req.logoutTime
                      });
                    }

                    return items.map((item) => {
                      const loadingKey = `${req._id}-${item.type}`;
                      const isSubmitting = actionLoadingId === loadingKey;

                      return (
                        <tr key={`${req._id}-${item.type}`}>
                          <td data-label="Employee" style={{ fontWeight: '600' }}>
                            {req.employee?.name || 'Unknown'}
                            <div style={{ fontSize: '0.775rem', color: '#64748b' }}>{req.employee?.email}</div>
                          </td>
                          <td data-label="Date">{req.date}</td>
                          <td data-label="Request Type">
                            <span className="status-badge pending">{item.label} Request</span>
                          </td>
                          <td data-label="Logged Time">{new Date(item.time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</td>
                          <td data-label="Actions">
                            <div style={{ display: 'flex', gap: '0.5rem' }}>
                              <button
                                className="btn btn-primary btn-sm"
                                onClick={() => handleApprove(req._id, item.type)}
                                disabled={isSubmitting}
                              >
                                <Check size={14} />
                                Approve
                              </button>
                              <button
                                className="btn btn-secondary btn-sm"
                                onClick={() => handleOpenRejectModal(req, item.type)}
                                disabled={isSubmitting}
                              >
                                <X size={14} />
                                Reject
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    });
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>

      {/* Attendance History Section */}
      <div className="card">
        <div className="card-header">
          <h3 className="card-title">Attendance History</h3>
        </div>

        <div className="filters-bar" style={{ borderRadius: 0, borderLeft: 'none', borderRight: 'none' }}>
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
          <>
            <div className="table-container" style={{ border: 'none' }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>Employee Name</th>
                    <th>Date</th>
                    <th>Clock In</th>
                    <th>Clock Out</th>
                    <th>Status</th>
                    <th>Shift Duration</th>
                  </tr>
                </thead>
                <tbody>
                  {records.map((rec) => (
                    <tr key={rec._id}>
                      <td data-label="Employee Name" style={{ fontWeight: '600' }}>
                        {rec.employee?.name || 'Unknown'}
                        <div style={{ fontSize: '0.775rem', color: '#64748b' }}>{rec.employee?.email}</div>
                      </td>
                      <td data-label="Date">{rec.date}</td>
                      <td data-label="Clock In">
                        {new Date(rec.loginTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                          In: <StatusBadge status={rec.clockInStatus || 'approved'} />
                        </div>
                      </td>
                      <td data-label="Clock Out">
                        {rec.logoutTime ? (
                          <>
                            {new Date(rec.logoutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            <div style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              Out: <StatusBadge status={rec.clockOutStatus || 'approved'} />
                            </div>
                          </>
                        ) : (
                          'Active Shift'
                        )}
                      </td>
                      <td data-label="Status">
                        <StatusBadge
                          status={
                            rec.clockInStatus === 'pending' || rec.clockOutStatus === 'pending'
                              ? 'pending'
                              : rec.clockInStatus === 'rejected' || rec.clockOutStatus === 'rejected'
                              ? 'rejected'
                              : 'approved'
                          }
                        />
                      </td>
                      <td data-label="Shift Duration">{calculateDuration(rec)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <Pagination pagination={pagination} onPageChange={(page) => fetchAttendance(page)} />
          </>
        )}
      </div>

      {/* Reject Request Modal */}
      <Modal
        isOpen={Boolean(rejectTarget)}
        onClose={() => setRejectTarget(null)}
        title={`Reject ${rejectTarget?.requestType === 'clockIn' ? 'Clock In' : 'Clock Out'} Request`}
        footer={
          <div style={{ display: 'flex', gap: '0.75rem', justifyContent: 'flex-end', width: '100%' }}>
            <button className="btn btn-secondary" onClick={() => setRejectTarget(null)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleConfirmReject}>
              Confirm Rejection
            </button>
          </div>
        }
      >
        <div className="form-group">
          <label className="form-label">Optional Rejection Reason</label>
          <textarea
            className="form-input"
            rows="3"
            placeholder="Provide a reason for rejecting this request..."
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminAttendancePage;
