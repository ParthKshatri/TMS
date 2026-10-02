import React from 'react';
import { useAuth } from '../context/AuthContext';

const Navbar = ({ title = 'Dashboard' }) => {
  const { user } = useAuth();

  return (
    <header className="navbar">
      <h2 style={{ fontSize: '1.15rem', fontWeight: '600' }}>{title}</h2>
      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
        <div style={{ textAlign: 'right' }}>
          <div style={{ fontSize: '0.875rem', fontWeight: '600' }}>{user?.name}</div>
          <div style={{ fontSize: '0.75rem', color: '#64748b', textTransform: 'capitalize' }}>
            {user?.role} Account
          </div>
        </div>
        <div
          style={{
            width: '38px',
            height: '38px',
            borderRadius: '50%',
            backgroundColor: '#ea580c',
            color: '#ffffff',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontWeight: '600',
            fontSize: '0.9rem'
          }}
        >
          {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
        </div>
      </div>
    </header>
  );
};

export default Navbar;
