import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import api from '../api/axios';
import { FileCheck, Check, X, Eye } from 'lucide-react';

const AdminWorkHistoryPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });

  // Filters
  const [reviewStatusFilter, setReviewStatusFilter] = useState('');
  const [employeeFilter, setEmployeeFilter] = useState('');

  // Review modal
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewRemark, setReviewRemark] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

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

  const fetchSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (reviewStatusFilter) params.append('reviewStatus', reviewStatusFilter);
      if (employeeFilter) params.append('employee', employeeFilter);

      const res = await api.get(`/work-submissions?${params.toString()}`);
      if (res.data.success) {
        setSubmissions(res.data.submissions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load work submissions:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEmployees();
  }, []);

  useEffect(() => {
    fetchSubmissions(1);
  }, [reviewStatusFilter, employeeFilter]);

  const handleReviewSubmit = async () => {
    if (!selectedSubmission) return;
    setReviewError('');
    setIsSubmittingReview(true);

    try {
      const res = await api.patch(`/work-submissions/${selectedSubmission._id}/review`, {
        reviewStatus: reviewAction,
        reviewRemark
      });

      if (res.data.success) {
        setSelectedSubmission(null);
        setReviewRemark('');
        fetchSubmissions(pagination.page);
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to review submission.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>Submitted Work Management</h1>
          <p className="page-subtitle">Review work completed and submitted by employees</p>
        </div>
      </div>

      <div className="filters-bar">
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <select
            className="form-select"
            style={{ width: '180px' }}
            value={reviewStatusFilter}
            onChange={(e) => setReviewStatusFilter(e.target.value)}
          >
            <option value="">All Review Statuses</option>
            <option value="pending">Pending Review</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>

          <select
            className="form-select"
            style={{ width: '200px' }}
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
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching work submissions..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={FileCheck}
          title="No work submissions found"
          description="There are no work descriptions matching your current review status filter."
        />
      ) : (
        <div className="card">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Employee</th>
                  <th>Submitted Description</th>
                  <th>Submitted Date</th>
                  <th>Review Status</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td style={{ fontWeight: '600' }}>{sub.task?.title || 'Untitled Task'}</td>
                    <td>{sub.employee?.name || 'Unknown'}</td>
                    <td style={{ maxWidth: '280px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {sub.description}
                    </td>
                    <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={sub.reviewStatus} />
                    </td>
                    <td>
                      {sub.reviewStatus === 'pending' ? (
                        <div style={{ display: 'flex', gap: '0.4rem' }}>
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setReviewAction('approved');
                              setReviewRemark('');
                            }}
                          >
                            <Check size={14} />
                            Approve
                          </button>
                          <button
                            className="btn btn-danger btn-sm"
                            onClick={() => {
                              setSelectedSubmission(sub);
                              setReviewAction('rejected');
                              setReviewRemark('');
                            }}
                          >
                            <X size={14} />
                            Reject
                          </button>
                        </div>
                      ) : (
                        <button
                          className="btn btn-secondary btn-sm"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setReviewAction(sub.reviewStatus);
                            setReviewRemark(sub.reviewRemark || '');
                          }}
                        >
                          <Eye size={14} />
                          View review
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(page) => fetchSubmissions(page)} />
        </div>
      )}

      {/* Review / View Modal */}
      <Modal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title={selectedSubmission?.reviewStatus === 'pending' ? 'Review Employee Work Submission' : 'Work Submission Review Details'}
        footer={
          selectedSubmission?.reviewStatus === 'pending' ? (
            <>
              <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>
                Cancel
              </button>
              <button
                className={`btn ${reviewAction === 'approved' ? 'btn-success' : 'btn-danger'}`}
                onClick={handleReviewSubmit}
                disabled={isSubmittingReview}
              >
                {isSubmittingReview ? 'Submitting...' : reviewAction === 'approved' ? 'Confirm approval' : 'Confirm rejection'}
              </button>
            </>
          ) : (
            <button className="btn btn-secondary" onClick={() => setSelectedSubmission(null)}>
              Close
            </button>
          )
        }
      >
        {reviewError && <div className="alert-banner alert-error">{reviewError}</div>}
        {selectedSubmission && (
          <div>
            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Task:</strong>
              <div style={{ fontSize: '1rem', fontWeight: '600' }}>{selectedSubmission.task?.title}</div>
            </div>

            <div style={{ marginBottom: '1rem' }}>
              <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Submitted Work Description:</strong>
              <p style={{ marginTop: '0.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>
                {selectedSubmission.description}
              </p>
            </div>

            {selectedSubmission.reviewStatus === 'pending' ? (
              <>
                <div className="form-group">
                  <label className="form-label">Review Decision</label>
                  <div style={{ display: 'flex', gap: '1rem' }}>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        value="approved"
                        checked={reviewAction === 'approved'}
                        onChange={() => setReviewAction('approved')}
                      />
                      Approve
                    </label>
                    <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', cursor: 'pointer' }}>
                      <input
                        type="radio"
                        name="reviewAction"
                        value="rejected"
                        checked={reviewAction === 'rejected'}
                        onChange={() => setReviewAction('rejected')}
                      />
                      Reject
                    </label>
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label" htmlFor="remark">
                    Review Remark (Optional)
                  </label>
                  <textarea
                    id="remark"
                    className="form-textarea"
                    placeholder="Enter review comments or guidance..."
                    value={reviewRemark}
                    onChange={(e) => setReviewRemark(e.target.value)}
                  />
                </div>
              </>
            ) : (
              <div>
                <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Review Status:</strong>
                <div style={{ marginTop: '0.25rem', marginBottom: '1rem' }}>
                  <StatusBadge status={selectedSubmission.reviewStatus} />
                </div>
                {selectedSubmission.reviewRemark && (
                  <div>
                    <strong style={{ fontSize: '0.85rem', color: '#64748b' }}>Admin Remark:</strong>
                    <p style={{ marginTop: '0.25rem', backgroundColor: '#f8fafc', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.9rem' }}>
                      {selectedSubmission.reviewRemark}
                    </p>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </Modal>
    </div>
  );
};

export default AdminWorkHistoryPage;
