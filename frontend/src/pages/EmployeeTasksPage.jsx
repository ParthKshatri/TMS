import React, { useState, useEffect } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import Modal from '../components/Modal';
import api from '../api/axios';
import { CheckSquare, Search, Play, FileText, Eye, PlusCircle } from 'lucide-react';

const EmployeeTasksPage = () => {
  const [searchParams] = useSearchParams();
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });

  // Filters
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState(searchParams.get('status') || '');

  useEffect(() => {
    const statusParam = searchParams.get('status');
    if (statusParam !== null) {
      setStatusFilter(statusParam);
    }
  }, [searchParams]);

  // Submit Work Modal state
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedTaskId, setSelectedTaskId] = useState('');
  const [customTitle, setCustomTitle] = useState('');
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

  const openSubmitModal = (task = null) => {
    setWorkError('');
    setWorkDescription('');
    setCustomTitle('');
    if (task) {
      setSelectedTaskId(task._id);
    } else {
      setSelectedTaskId('');
    }
    setIsModalOpen(true);
  };

  const handleSubmitWork = async (e) => {
    e.preventDefault();
    setWorkError('');

    if (!selectedTaskId && (!customTitle || !customTitle.trim())) {
      setWorkError('Please enter a work title/subject for unassigned work.');
      return;
    }

    if (!workDescription || !workDescription.trim()) {
      setWorkError('Please enter a description of the completed work.');
      return;
    }

    setIsSubmittingWork(true);

    try {
      const payload = selectedTaskId
        ? { taskId: selectedTaskId, description: workDescription.trim() }
        : { title: customTitle.trim(), description: workDescription.trim() };

      const res = await api.post('/work-submissions', payload);

      if (res.data.success) {
        setIsModalOpen(false);
        setSelectedTaskId('');
        setCustomTitle('');
        setWorkDescription('');
        fetchTasks(pagination.page);
      }
    } catch (err) {
      setWorkError(err.response?.data?.message || 'Failed to submit work description.');
    } finally {
      setIsSubmittingWork(false);
    }
  };

  const currentSelectedTaskObj = tasks.find((t) => t._id === selectedTaskId);

  return (
    <div className="page-container">
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div className="page-title-group">
          <h1>My Tasks & Work Submissions</h1>
          <p className="page-subtitle">Manage assigned tasks or submit completed work directly even without an assigned task</p>
        </div>
        <button
          className="btn btn-primary"
          onClick={() => openSubmitModal(null)}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem' }}
        >
          <PlusCircle size={18} />
          Submit Work (No Task)
        </button>
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
        <LoadingSpinner text="Fetching tasks..." />
      ) : tasks.length === 0 ? (
        <EmptyState
          icon={CheckSquare}
          title="No tasks found"
          description="You currently have no tasks matching the filter. You can submit any completed work directly without an assigned task."
          action={
            <button
              className="btn btn-primary"
              onClick={() => openSubmitModal(null)}
            >
              <PlusCircle size={16} />
              Submit Work Without Task
            </button>
          }
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
                    <td data-label="Task Title" style={{ fontWeight: '600' }}>{task.title}</td>
                    <td data-label="Current Status">
                      <StatusBadge status={task.status} />
                    </td>
                    <td data-label="Due Date">{task.dueDate ? new Date(task.dueDate).toLocaleDateString() : 'No limit'}</td>
                    <td data-label="Actions">
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
                            onClick={() => openSubmitModal(task)}
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
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedTaskId ? `Submit Work: ${currentSelectedTaskObj?.title || ''}` : 'Submit Work (Without Assigned Task)'}
        footer={
          <>
            <button className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>
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
            <label className="form-label" htmlFor="taskSelect">
              Associated Task
            </label>
            <select
              id="taskSelect"
              className="form-select"
              style={{ width: '100%' }}
              value={selectedTaskId}
              onChange={(e) => setSelectedTaskId(e.target.value)}
            >
              <option value="">-- No Assigned Task (Direct Work Submission) --</option>
              {tasks.map((t) => (
                <option key={t._id} value={t._id}>
                  {t.title} ({t.status.replace('_', ' ')})
                </option>
              ))}
            </select>
          </div>

          {!selectedTaskId && (
            <div className="form-group">
              <label className="form-label" htmlFor="customTitle">
                Work / Task Title <span style={{ color: '#ef4444' }}>*</span>
              </label>
              <input
                type="text"
                id="customTitle"
                className="form-input"
                placeholder="e.g. Daily Activity Report, System Bug Fix, Client Call..."
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label" htmlFor="workDesc">
              Description of Work Completed <span style={{ color: '#ef4444' }}>*</span>
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
