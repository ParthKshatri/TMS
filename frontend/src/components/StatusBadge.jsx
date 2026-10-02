import React from 'react';

const formatStatusText = (status) => {
  if (!status) return 'Unknown';
  switch (status) {
    case 'in_progress':
      return 'In Progress';
    case 'pending':
      return 'Pending';
    case 'completed':
      return 'Completed';
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    default:
      return status.charAt(0).toUpperCase() + status.slice(1);
  }
};

const StatusBadge = ({ status }) => {
  return (
    <span className={`status-badge ${status || 'pending'}`}>
      {formatStatusText(status)}
    </span>
  );
};

export default StatusBadge;
