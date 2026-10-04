import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import Modal from '../components/Modal';
import api from '../api/axios';
import { ArrowLeft, Check, X, Clock, FileText, UserCheck } from 'lucide-react';

const AdminTaskDetailPage = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Review modal state
  const [selectedSubmission, setSelectedSubmission] = useState(null);
  const [reviewAction, setReviewAction] = useState('approved');
  const [reviewRemark, setReviewRemark] = useState('');
  const [isSubmittingReview, setIsSubmittingReview] = useState(false);
  const [reviewError, setReviewError] = useState('');

  const fetchTaskDetails = async () => {
    try {
      setLoading(true);
      const [taskRes, submissionsRes] = await Promise.all([
        api.get(`/tasks/${id}`),
        api.get(`/work-submissions?task=${id}`)
      ]);

      if (taskRes.data.success) {
        setTask(taskRes.data.task);
        setHistory(taskRes.data.history || []);
      }
      if (submissionsRes.data.success) {
        setSubmissions(submissionsRes.data.submissions || []);
      }
    } catch (err) {
      console.error('Failed to load task details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTaskDetails();
  }, [id]);

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
        fetchTaskDetails();
      }
    } catch (err) {
      setReviewError(err.response?.data?.message || 'Failed to review submission.');
    } finally {
      setIsSubmittingReview(false);
    }
  };

  if (loading) {
    return (
      <div className="page-container">
        <LoadingSpinner text="Fetching task details..." />
      </div>
    );
  }

  if (!task) {
    return (
      <div className="page-container">
        <p>Task not found.</p>
        <Link to="/admin/tasks" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/admin/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
          <ArrowLeft size={16} />
          Back to task list
        </Link>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1>{task.title}</h1>
            <StatusBadge status={task.status} />
          </div>
          <p className="page-subtitle">Assigned to {task.assignee?.name || 'Unassigned'} ({task.assignee?.email})</p>
        </div>
      </div>

      <div className="task-detail-grid">
        {/* Main Details & Work Submissions */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Task Requirements</h3>
            </div>
            <div className="card-body">
              <p style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6' }}>
                {task.description}
              </p>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', flexWrap: 'wrap', gap: '1rem 2rem', fontSize: '0.875rem', color: '#64748b' }}>
                <div>
                  <strong>Created:</strong> {new Date(task.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline set'}
                </div>
              </div>
            </div>
          </div>

          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Submitted Employee Work</h3>
            </div>
            <div className="card-body">
              {submissions.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No work submissions logged for this task yet.</p>
              ) : (
                submissions.map((sub) => (
                  <div
                    key={sub._id}
                    style={{
                      border: '1px solid #e2e8f0',
                      borderRadius: '10px',
                      padding: '1.25rem',
                      marginBottom: '1rem',
                      backgroundColor: '#f8fafc'
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Submitted on {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                      <StatusBadge status={sub.reviewStatus} />
                    </div>

                    <p style={{ fontSize: '0.925rem', color: '#0f172a', whiteSpace: 'pre-wrap', marginBottom: '1rem' }}>
                      {sub.description}
                    </p>

                    {sub.reviewRemark && (
                      <div style={{ backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem 1rem', borderRadius: '8px', fontSize: '0.85rem', marginBottom: '1rem' }}>
                        <strong>Admin Remark:</strong> {sub.reviewRemark}
                      </div>
                    )}

                    {sub.reviewStatus === 'pending' && (
                      <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
                        <button
                          className="btn btn-success btn-sm"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setReviewAction('approved');
                            setReviewRemark('');
                          }}
                        >
                          <Check size={16} />
                          Approve work
                        </button>
                        <button
                          className="btn btn-danger btn-sm"
                          onClick={() => {
                            setSelectedSubmission(sub);
                            setReviewAction('rejected');
                            setReviewRemark('');
                          }}
                        >
                          <X size={16} />
                          Reject work
                        </button>
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* Timeline Sidebar */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Status Transition History</h3>
            </div>
            <div className="card-body">
              {history.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No status changes recorded yet.</p>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  {history.map((h) => (
                    <div
                      key={h._id}
                      style={{
                        position: 'relative',
                        paddingLeft: '1.25rem',
                        borderLeft: '2px solid #e2e8f0'
                      }}
                    >
                      <div style={{ fontSize: '0.85rem', fontWeight: '600', color: '#0f172a' }}>
                        Changed status to <span style={{ textTransform: 'capitalize' }}>{h.toStatus}</span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.2rem' }}>
                        By {h.changedBy?.name || 'System'} on {new Date(h.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Review Modal */}
      <Modal
        isOpen={!!selectedSubmission}
        onClose={() => setSelectedSubmission(null)}
        title={reviewAction === 'approved' ? 'Approve Submitted Work' : 'Reject Submitted Work'}
        footer={
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
        }
      >
        {reviewError && <div className="alert-banner alert-error">{reviewError}</div>}
        <p style={{ marginBottom: '1rem', fontSize: '0.9rem', color: '#334155' }}>
          Reviewing work submitted by <strong>{selectedSubmission?.employee?.name}</strong>.
        </p>

        <div className="form-group">
          <label className="form-label" htmlFor="remark">
            Review Remark (Optional)
          </label>
          <textarea
            id="remark"
            className="form-textarea"
            placeholder="Add comments, feedback, or instructions for the employee..."
            value={reviewRemark}
            onChange={(e) => setReviewRemark(e.target.value)}
          />
        </div>
      </Modal>
    </div>
  );
};

export default AdminTaskDetailPage;
