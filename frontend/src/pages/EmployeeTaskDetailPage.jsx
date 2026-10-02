import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import LoadingSpinner from '../components/LoadingSpinner';
import api from '../api/axios';
import { ArrowLeft, Play, FileText, CheckCircle } from 'lucide-react';

const EmployeeTaskDetailPage = () => {
  const { id } = useParams();
  const [task, setTask] = useState(null);
  const [history, setHistory] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);

  // Submit work form state
  const [workDescription, setWorkDescription] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submitSuccess, setSubmitSuccess] = useState('');

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

  const handleStatusUpdate = async (newStatus) => {
    try {
      const res = await api.patch(`/tasks/${id}/status`, { status: newStatus });
      if (res.data.success) {
        fetchTaskDetails();
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Status update failed.');
    }
  };

  const handleWorkSubmit = async (e) => {
    e.preventDefault();
    setSubmitError('');
    setSubmitSuccess('');
    setIsSubmittingWork(true);

    try {
      const res = await api.post('/work-submissions', {
        taskId: id,
        description: workDescription
      });

      if (res.data.success) {
        setSubmitSuccess('Work description submitted successfully for admin review.');
        setWorkDescription('');
        fetchTaskDetails();
      }
    } catch (err) {
      setSubmitError(err.response?.data?.message || 'Failed to submit work description.');
    } finally {
      setIsSubmittingWork(false);
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
        <p>Task not found or access denied.</p>
        <Link to="/employee/tasks" className="btn btn-secondary" style={{ marginTop: '1rem' }}>
          Back to my tasks
        </Link>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div style={{ marginBottom: '1.5rem' }}>
        <Link to="/employee/tasks" style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', color: '#64748b', fontSize: '0.9rem', fontWeight: '500' }}>
          <ArrowLeft size={16} />
          Back to assigned tasks
        </Link>
      </div>

      <div className="page-header">
        <div className="page-title-group">
          <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flexWrap: 'wrap' }}>
            <h1>{task.title}</h1>
            <StatusBadge status={task.status} />
          </div>
          <p className="page-subtitle">Assigned by {task.createdBy?.name || 'Administrator'}</p>
        </div>

        {task.status === 'pending' && (
          <button className="btn btn-primary" onClick={() => handleStatusUpdate('in_progress')}>
            <Play size={18} />
            Start working on task
          </button>
        )}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '1.5rem' }}>
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Task Description & Requirements</h3>
            </div>
            <div className="card-body">
              <p style={{ whiteSpace: 'pre-wrap', color: '#334155', lineHeight: '1.6' }}>
                {task.description}
              </p>
              <div style={{ marginTop: '1.5rem', paddingTop: '1.25rem', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '2rem', fontSize: '0.875rem', color: '#64748b' }}>
                <div>
                  <strong>Assigned Date:</strong> {new Date(task.createdAt).toLocaleDateString()}
                </div>
                <div>
                  <strong>Due Date:</strong> {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No deadline'}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Work Form Section */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Submit Description of Completed Work</h3>
            </div>
            <div className="card-body">
              {submitError && <div className="alert-banner alert-error">{submitError}</div>}
              {submitSuccess && <div className="alert-banner alert-success">{submitSuccess}</div>}

              <form onSubmit={handleWorkSubmit}>
                <div className="form-group">
                  <label className="form-label" htmlFor="desc">
                    Work Description
                  </label>
                  <textarea
                    id="desc"
                    className="form-textarea"
                    placeholder="Describe completed deliverables, findings, or work log details..."
                    value={workDescription}
                    onChange={(e) => setWorkDescription(e.target.value)}
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmittingWork}
                >
                  <FileText size={18} />
                  {isSubmittingWork ? 'Submitting...' : 'Submit work for admin review'}
                </button>
              </form>
            </div>
          </div>

          {/* Submissions Log */}
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">My Submitted Work Logs</h3>
            </div>
            <div className="card-body">
              {submissions.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>You have not submitted work descriptions for this task yet.</p>
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
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                      <span style={{ fontSize: '0.8rem', color: '#64748b' }}>
                        Submitted {new Date(sub.submittedAt).toLocaleString()}
                      </span>
                      <StatusBadge status={sub.reviewStatus} />
                    </div>
                    <p style={{ fontSize: '0.925rem', color: '#0f172a', whiteSpace: 'pre-wrap' }}>
                      {sub.description}
                    </p>
                    {sub.reviewRemark && (
                      <div style={{ marginTop: '0.75rem', backgroundColor: '#ffffff', border: '1px solid #e2e8f0', padding: '0.75rem', borderRadius: '8px', fontSize: '0.85rem' }}>
                        <strong>Admin Feedback:</strong> {sub.reviewRemark}
                      </div>
                    )}
                  </div>
                ))
              )}
            </div>
          </div>
        </div>

        {/* History timeline */}
        <div>
          <div className="card">
            <div className="card-header">
              <h3 className="card-title">Status Transition Timeline</h3>
            </div>
            <div className="card-body">
              {history.length === 0 ? (
                <p style={{ color: '#64748b', fontSize: '0.9rem' }}>No status changes recorded.</p>
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
                        Status updated to <span style={{ textTransform: 'capitalize' }}>{h.toStatus}</span>
                      </div>
                      <div style={{ fontSize: '0.775rem', color: '#64748b', marginTop: '0.2rem' }}>
                        {new Date(h.changedAt).toLocaleString()}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmployeeTaskDetailPage;
