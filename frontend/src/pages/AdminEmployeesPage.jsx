import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import api from '../api/axios';
import { Plus, Search, Users, Eye, UserX, UserCheck } from 'lucide-react';

const AdminEmployeesPage = () => {
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });
  const [search, setSearch] = useState('');
  const [togglingId, setTogglingId] = useState(null);

  // Create employee modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [form, setForm] = useState({ name: '', email: '', password: '' });
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Detail view modal
  const [selectedUserStats, setSelectedUserStats] = useState(null);

  const fetchEmployees = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (search) params.append('search', search);

      const res = await api.get(`/users?${params.toString()}`);
      if (res.data.success) {
        setEmployees(res.data.employees);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load employees:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees(1);
  }, [search]);

  const handleToggleStatus = async (empId) => {
    try {
      setTogglingId(empId);
      const res = await api.patch(`/users/${empId}/status`);
      if (res.data.success) {
        setEmployees((prev) =>
          prev.map((emp) =>
            emp._id === empId ? { ...emp, isActive: res.data.employee.isActive } : emp
          )
        );
        if (selectedUserStats && selectedUserStats.user._id === empId) {
          setSelectedUserStats((prev) => ({
            ...prev,
            user: { ...prev.user, isActive: res.data.employee.isActive }
          }));
        }
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update employee account status.');
    } finally {
      setTogglingId(null);
    }
  };

  const handleCreateEmployee = async (e) => {
    e.preventDefault();
    setFormError('');
    setIsSubmitting(true);

    try {
      const res = await api.post('/users', form);
      if (res.data.success) {
        setIsModalOpen(false);
        setForm({ name: '', email: '', password: '' });
        fetchEmployees(1);
      }
    } catch (err) {
      setFormError(err.response?.data?.message || 'Failed to create employee account.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleViewDetails = async (empId) => {
    try {
      const res = await api.get(`/users/${empId}`);
      if (res.data.success) {
        setSelectedUserStats(res.data);
      }
    } catch (err) {
      console.error('Failed to load user stats:', err);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Employee Management</h1>
          <p className="page-subtitle">Create and oversee team employee accounts</p>
        </div>
        <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
          <Plus size={18} />
          Add employee
        </button>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search employees by name or email address..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching employee accounts..." />
      ) : employees.length === 0 ? (
        <EmptyState
          icon={Users}
          title="No employee accounts created"
          description="Click Add employee above to create the first employee account."
          action={
            <button className="btn btn-primary" onClick={() => setIsModalOpen(true)}>
              <Plus size={18} />
              Add employee
            </button>
          }
        />
      ) : (
        <div className="card">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Employee Name</th>
                  <th>Email Address</th>
                  <th>Account Status</th>
                  <th>Created Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {employees.map((emp) => (
                  <tr key={emp._id}>
                    <td data-label="Employee Name" style={{ fontWeight: '600' }}>{emp.name}</td>
                    <td data-label="Email Address">{emp.email}</td>
                    <td data-label="Account Status">
                      <span className={`status-badge ${emp.isActive ? 'approved' : 'rejected'}`}>
                        {emp.isActive ? 'Active' : 'Inactive'}
                      </span>
                    </td>
                    <td data-label="Created Date">{new Date(emp.createdAt).toLocaleDateString()}</td>
                    <td data-label="Actions">
                      <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleViewDetails(emp._id)}
                        >
                          <Eye size={15} />
                          View summary
                        </button>

                        <button
                          className="btn btn-sm"
                          style={{
                            padding: '0.35rem 0.65rem',
                            fontSize: '0.8rem',
                            borderRadius: 'var(--radius-sm)',
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontWeight: '500',
                            border: emp.isActive ? '1px solid #fca5a5' : '1px solid #86efac',
                            color: emp.isActive ? '#dc2626' : '#16a34a',
                            backgroundColor: emp.isActive ? '#fef2f2' : '#f0fdf4',
                            cursor: togglingId === emp._id ? 'not-allowed' : 'pointer'
                          }}
                          onClick={() => handleToggleStatus(emp._id)}
                          disabled={togglingId === emp._id}
                        >
                          {emp.isActive ? <UserX size={15} /> : <UserCheck size={15} />}
                          {togglingId === emp._id ? 'Updating...' : emp.isActive ? 'Disable Account' : 'Enable Account'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(page) => fetchEmployees(page)} />
        </div>
      )}

      {/* Create Employee Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="Add Employee Account"
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
              Cancel
            </button>
            <button className="btn btn-primary" onClick={handleCreateEmployee} disabled={isSubmitting}>
              {isSubmitting ? 'Creating...' : 'Add employee'}
            </button>
          </>
        }
      >
        {formError && <div className="alert-banner alert-error">{formError}</div>}
        <form onSubmit={handleCreateEmployee}>
          <div className="form-group">
            <label className="form-label" htmlFor="name">
              Full Name
            </label>
            <input
              id="name"
              type="text"
              className="form-input"
              placeholder="e.g. Jane Doe"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="email">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              className="form-input"
              placeholder="jane.doe@company.com"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="password">
              Password
            </label>
            <input
              id="password"
              type="password"
              className="form-input"
              placeholder="Minimum 6 characters"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              required
            />
          </div>
        </form>
      </Modal>

      {/* User Stats Modal */}
      <Modal
        isOpen={!!selectedUserStats}
        onClose={() => setSelectedUserStats(null)}
        title="Employee Performance Summary"
        footer={
          <button className="btn btn-secondary" onClick={() => setSelectedUserStats(null)}>
            Close
          </button>
        }
      >
        {selectedUserStats && (
          <div>
            <div style={{ marginBottom: '1.25rem', paddingBottom: '1rem', borderBottom: '1px solid #e2e8f0' }}>
              <h4 style={{ fontSize: '1.1rem', fontWeight: '600' }}>{selectedUserStats.user.name}</h4>
              <p style={{ color: '#64748b', fontSize: '0.875rem' }}>{selectedUserStats.user.email}</p>
            </div>

            <div className="modal-stats-grid">
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700' }}>{selectedUserStats.stats.totalTasks}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Assigned Tasks</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#16a34a' }}>{selectedUserStats.stats.completedTasks}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Completed Tasks</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#ea580c' }}>{selectedUserStats.stats.totalWorkSubmissions}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Work Submissions</div>
              </div>
              <div style={{ padding: '1rem', border: '1px solid #e2e8f0', borderRadius: '10px', backgroundColor: '#f8fafc' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: '700', color: '#2563eb' }}>{selectedUserStats.stats.totalAttendanceDays}</div>
                <div style={{ fontSize: '0.8rem', color: '#64748b' }}>Attendance Log Days</div>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminEmployeesPage;
