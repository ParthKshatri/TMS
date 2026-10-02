import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import api from '../api/axios';
import { CheckSquare, Search, Play, FileText, Eye } from 'lucide-react';

const EmployeeTasksPage = () => {
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');

  // Submit Work Modal
  const [selectedTask, setSelectedTask] = useState(null);
  const [workDescription, setWorkDescription] = useState('');
  const [isSubmittingWork, setIsSubmittingWork] = useState(false);
  const [workError, setWorkError] = useState('');

  const fetchTasks = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (search) params.append('search', search);
      if (statusFilter) params.append('status', statusFilter);

      const res = await api.get(`/tasks?${params.toString()}`);
      if (res.data.success) {
        setTasks(res.data.tasks);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load employee tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks(1);
  }, [search, statusFilter]);

  const handleStartTask = async (taskId) => {
    try {
      const res = await api.patch(`/tasks/${taskId}/status`, { status: 'in_progress' });
      if (res.data.success) {
        fetchTasks(pagination.page);
      }
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to update task status.');
    }
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    if (!selectedTask) return;
    setWorkError('');
    setIsSubmittingWork(true);

    try {
      const res = await api.post('/work-submissions', {
        taskId: selectedTask._id,
        description: workDescription
      });

      if (res.data.success) {
        setSelectedTask(null);
        setWorkDescription('');
        fetchTasks(pagination.page);
      }
    } catch (err) {
      setWorkError(err.response?.data?.message || 'Failed to submit work description.');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>My Assigned Tasks</h1>
          <p className="page-subtitle">View and update task status as work progresses</p>
        </div>
      </div>

      <div className="filters-bar">
        <div className="search-input-wrapper">
          <Search size={18} className="search-icon" />
          <input
            type="text"
            className="form-input search-input"
            placeholder="Search tasks by title or requirements..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        <select
          className="form-select"
          style={{ width: '180px' }}
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
        >
          <option value="">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching assigned tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks assigned yet"
          description="You currently have no office tasks matching the selected filter."
        />
      ) : (
        <div className="card">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Current Status</th>
                  <th>Due Date</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {tasks.map((task) => (
                  <tr key={task._id}>
                    <td style={{ fontWeight: '600' }}>{task.title}</td>
                    <td>
                      <StatusBadge status={task.status} />
                    </td>
                    <td>{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No limit'}</td>
                    <td>
                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                        <Link to={`/employee/tasks/${task._id}`} className="btn btn-secondary btn-sm">
                          <Eye size={14} />
                          Details
                        </Link>
                        {task.status === 'pending' && (
                          <button
                            className="btn btn-primary btn-sm"
                            onClick={() => handleStartTask(task._id)}
                          >
                            <Play size={14} />
                            Start task
                          </button>
                        )}
                        {(task.status === 'pending' || task.status === 'in_progress' || task.status === 'rejected') && (
                          <button
                            className="btn btn-success btn-sm"
                            onClick={() => {
                              setSelectedTask(task);
                              setWorkDescription('');
                              setWorkError('');
                            }}
                          >
                            <FileText size={14} />
                            Submit work
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(page) => fetchTasks(page)} />
        </div>
      )}

      {/* Submit Work Modal */}
      <Modal
        isOpen={!!selectedTask}
        onClose={() => setSelectedTask(null)}
        title={`Submit Work Description: ${selectedTask?.title || ''}`}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setSelectedTask(null)}>
              Cancel
            </button>
            <button
              className="btn btn-success"
              onClick={handleSubmitWork}
              disabled={isSubmittingWork}
            >
              {isSubmittingWork ? 'Submitting...' : 'Submit work'}
            </button>
          </>
        }
      >
        {workError && <div className="alert-banner alert-error">{workError}</div>}
        <form onSubmit={handleSubmitWork}>
          <div className="form-group">
            <label className="form-label" htmlFor="workDesc">
              Description of Work Completed
            </label>
            <textarea
              id="workDesc"
              className="form-textarea"
              placeholder="Describe the completed work in detail for admin review..."
              value={workDescription}
              onChange={(e) => setWorkDescription(e.target.value)}
              required
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};

export default EmployeeTasksPage;
