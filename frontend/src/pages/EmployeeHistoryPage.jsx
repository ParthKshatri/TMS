import React, { useState, useEffect } from 'react';
import StatusBadge from '../components/StatusBadge';
import Pagination from '../components/Pagination';
import LoadingSpinner from '../components/LoadingSpinner';
import EmptyState from '../components/EmptyState';
import api from '../api/axios';
import { History, FileText } from 'lucide-react';

const EmployeeHistoryPage = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, limit: 10, pages: 1, total: 0 });
  const [reviewStatusFilter, setReviewStatusFilter] = useState('');

  const fetchSubmissions = async (page = 1) => {
    try {
      setLoading(true);
      const params = new URLSearchParams();
      params.append('page', page);
      params.append('limit', 10);
      if (reviewStatusFilter) params.append('reviewStatus', reviewStatusFilter);

      const res = await api.get(`/work-submissions?${params.toString()}`);
      if (res.data.success) {
        setSubmissions(res.data.submissions);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.error('Failed to load work history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSubmissions(1);
  }, [reviewStatusFilter]);

  return (
    <div className="page-container">
      <div className="page-header">
        <div className="page-title-group">
          <h1>My Work & Review History</h1>
          <p className="page-subtitle">View all your submitted work descriptions, review statuses, and admin remarks</p>
        </div>
      </div>

      <div className="filters-bar">
        <select
          className="form-select"
          style={{ width: '200px' }}
          value={reviewStatusFilter}
          onChange={(e) => setReviewStatusFilter(e.target.value)}
        >
          <option value="">All Review Statuses</option>
          <option value="pending">Pending Review</option>
          <option value="approved">Approved</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <LoadingSpinner text="Fetching work history log..." />
      ) : submissions.length === 0 ? (
        <EmptyState
          icon={History}
          title="No submitted work logs found"
          description="Work descriptions submitted for admin review will appear here."
        />
      ) : (
        <div className="card">
          <div className="table-container" style={{ border: 'none' }}>
            <table className="custom-table">
              <thead>
                <tr>
                  <th>Task Title</th>
                  <th>Work Description</th>
                  <th>Submitted Date</th>
                  <th>Review Status</th>
                  <th>Admin Feedback</th>
                </tr>
              </thead>
              <tbody>
                {submissions.map((sub) => (
                  <tr key={sub._id}>
                    <td style={{ fontWeight: '600' }}>{sub.task?.title || 'Untitled Task'}</td>
                    <td style={{ maxWidth: '300px', whiteSpace: 'pre-wrap' }}>{sub.description}</td>
                    <td>{new Date(sub.submittedAt).toLocaleDateString()}</td>
                    <td>
                      <StatusBadge status={sub.reviewStatus} />
                    </td>
                    <td>{sub.reviewRemark || 'No feedback provided'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Pagination pagination={pagination} onPageChange={(page) => fetchSubmissions(page)} />
        </div>
      )}
    </div>
  );
};

export default EmployeeHistoryPage;
